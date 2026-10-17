package com.heavenstay.hswrms.m3spa.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m3spa.entity.PackageFnBEntitlement;
import com.heavenstay.hswrms.m3spa.entity.RetreatPackageSpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.RetreatPackageSpaTreatmentId;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.repository.PackageFnBEntitlementRepository;
import com.heavenstay.hswrms.m3spa.repository.RetreatPackageSpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
public class SpaMasterController {

    private final SpaTreatmentRepository spaTreatmentRepo;
    private final RetreatPackageRepository retreatPackageRepo;
    private final TreatmentRoomRepository treatmentRoomRepo;
    private final RetreatPackageSpaTreatmentRepository packageTreatmentRepo;
    private final PackageFnBEntitlementRepository fnbEntitlementRepo;
    private final JdbcTemplate jdbc;

    public SpaMasterController(SpaTreatmentRepository spaTreatmentRepo,
                               RetreatPackageRepository retreatPackageRepo,
                               TreatmentRoomRepository treatmentRoomRepo,
                               RetreatPackageSpaTreatmentRepository packageTreatmentRepo,
                               PackageFnBEntitlementRepository fnbEntitlementRepo,
                               JdbcTemplate jdbc) {
        this.spaTreatmentRepo = spaTreatmentRepo;
        this.retreatPackageRepo = retreatPackageRepo;
        this.treatmentRoomRepo = treatmentRoomRepo;
        this.packageTreatmentRepo = packageTreatmentRepo;
        this.fnbEntitlementRepo = fnbEntitlementRepo;
        this.jdbc = jdbc;
    }

    // ========================================================================
    // HELPER RESOLVERS
    // ========================================================================

    private SpaTreatment resolveTreatment(String idOrCode) {
        try {
            int id = Integer.parseInt(idOrCode);
            Optional<SpaTreatment> opt = spaTreatmentRepo.findById(id);
            if (opt.isPresent()) return opt.get();
        } catch (NumberFormatException ignored) {}

        String cleanCode = idOrCode.startsWith("TRT-") ? idOrCode.substring(4) : idOrCode;
        return spaTreatmentRepo.findByTreatmentCode(cleanCode)
                .or(() -> spaTreatmentRepo.findByTreatmentCode(idOrCode))
                .orElseThrow(() -> new ResourceNotFoundException("SpaTreatment", "identifier", idOrCode));
    }

    private RetreatPackage resolvePackage(String idOrCode) {
        try {
            int id = Integer.parseInt(idOrCode);
            Optional<RetreatPackage> opt = retreatPackageRepo.findById(id);
            if (opt.isPresent()) return opt.get();
        } catch (NumberFormatException ignored) {}

        String cleanCode = idOrCode.startsWith("PKG-") ? idOrCode.substring(4) : idOrCode;
        return retreatPackageRepo.findByPackageCode(cleanCode)
                .or(() -> retreatPackageRepo.findByPackageCode(idOrCode))
                .orElseThrow(() -> new ResourceNotFoundException("RetreatPackage", "identifier", idOrCode));
    }

    // ========================================================================
    // 1. SPA TREATMENTS
    // ========================================================================

    @GetMapping("/spa-treatments")
    public ResponseEntity<ApiResponse<List<SpaTreatment>>> getAllTreatments(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {
        List<SpaTreatment> list = spaTreatmentRepo.findAll();
        if (status != null && !status.isBlank()) {
            list = list.stream().filter(t -> t.getTreatmentStatus().equalsIgnoreCase(status)).toList();
        }
        if (category != null && !category.isBlank()) {
            list = list.stream().filter(t -> t.getCategory() != null && t.getCategory().equalsIgnoreCase(category)).toList();
        }
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/spa-treatments/{idOrCode}")
    public ResponseEntity<ApiResponse<SpaTreatment>> getTreatmentById(@PathVariable String idOrCode) {
        SpaTreatment treatment = resolveTreatment(idOrCode);
        return ResponseEntity.ok(ApiResponse.ok(treatment));
    }

    @PostMapping("/spa-treatments")
    public ResponseEntity<ApiResponse<SpaTreatment>> createTreatment(@RequestBody Map<String, Object> payload) {
        String treatmentName = (String) payload.get("treatmentName");
        if (treatmentName == null || treatmentName.isBlank()) {
            throw new IllegalArgumentException("treatmentName is required");
        }
        if (spaTreatmentRepo.findByTreatmentName(treatmentName).isPresent()) {
            throw new IllegalArgumentException("Treatment with name '" + treatmentName + "' already exists");
        }

        SpaTreatment treatment = new SpaTreatment();
        treatment.setTreatmentCode((String) payload.get("treatmentCode"));
        treatment.setTreatmentName(treatmentName);
        treatment.setCategory((String) payload.getOrDefault("category", "Body Massage"));
        treatment.setDurationMinutes(payload.get("durationMinutes") != null
                ? Integer.parseInt(payload.get("durationMinutes").toString())
                : 60);
        treatment.setDurationUnit((String) payload.getOrDefault("durationUnit", "Phút (Minutes)"));
        treatment.setBasePrice(payload.get("basePrice") != null
                ? new BigDecimal(payload.get("basePrice").toString())
                : BigDecimal.ZERO);
        treatment.setPricingRule((String) payload.get("pricingRule"));
        treatment.setRoomCompatibility((String) payload.get("roomCompatibility"));
        treatment.setRequiredQualificationCode((String) payload.get("requiredQualificationCode"));
        treatment.setTherapistQualification((String) payload.get("therapistQualification"));
        treatment.setContraindications((String) payload.get("contraindications"));
        treatment.setPrecautions((String) payload.get("precautions"));
        treatment.setDescription((String) payload.get("description"));
        treatment.setTreatmentStatus((String) payload.getOrDefault("treatmentStatus", SpaTreatment.ACTIVE));

        SpaTreatment saved = spaTreatmentRepo.save(treatment);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Spa treatment created successfully", saved));
    }

    @PutMapping("/spa-treatments/{idOrCode}")
    public ResponseEntity<ApiResponse<SpaTreatment>> updateTreatment(
            @PathVariable String idOrCode,
            @RequestBody Map<String, Object> payload) {
        SpaTreatment treatment = resolveTreatment(idOrCode);

        if (payload.containsKey("treatmentName")) {
            treatment.setTreatmentName((String) payload.get("treatmentName"));
        }
        if (payload.containsKey("treatmentCode")) {
            treatment.setTreatmentCode((String) payload.get("treatmentCode"));
        }
        if (payload.containsKey("category")) {
            treatment.setCategory((String) payload.get("category"));
        }
        if (payload.containsKey("durationMinutes") && payload.get("durationMinutes") != null) {
            treatment.setDurationMinutes(Integer.parseInt(payload.get("durationMinutes").toString()));
        }
        if (payload.containsKey("durationUnit")) {
            treatment.setDurationUnit((String) payload.get("durationUnit"));
        }
        if (payload.containsKey("basePrice") && payload.get("basePrice") != null) {
            treatment.setBasePrice(new BigDecimal(payload.get("basePrice").toString()));
        }
        if (payload.containsKey("pricingRule")) {
            treatment.setPricingRule((String) payload.get("pricingRule"));
        }
        if (payload.containsKey("roomCompatibility")) {
            treatment.setRoomCompatibility((String) payload.get("roomCompatibility"));
        }
        if (payload.containsKey("requiredQualificationCode")) {
            treatment.setRequiredQualificationCode((String) payload.get("requiredQualificationCode"));
        }
        if (payload.containsKey("therapistQualification")) {
            treatment.setTherapistQualification((String) payload.get("therapistQualification"));
        }
        if (payload.containsKey("contraindications")) {
            treatment.setContraindications((String) payload.get("contraindications"));
        }
        if (payload.containsKey("precautions")) {
            treatment.setPrecautions((String) payload.get("precautions"));
        }
        if (payload.containsKey("description")) {
            treatment.setDescription((String) payload.get("description"));
        }
        if (payload.containsKey("treatmentStatus")) {
            treatment.setTreatmentStatus((String) payload.get("treatmentStatus"));
        }

        SpaTreatment updated = spaTreatmentRepo.save(treatment);
        return ResponseEntity.ok(ApiResponse.ok("Spa treatment updated successfully", updated));
    }

    @PatchMapping("/spa-treatments/{idOrCode}/status")
    public ResponseEntity<ApiResponse<SpaTreatment>> toggleTreatmentStatus(
            @PathVariable String idOrCode,
            @RequestBody(required = false) Map<String, Object> payload) {
        SpaTreatment treatment = resolveTreatment(idOrCode);
        String newStatus = (payload != null && payload.containsKey("treatmentStatus"))
                ? (String) payload.get("treatmentStatus")
                : (SpaTreatment.ACTIVE.equals(treatment.getTreatmentStatus()) ? SpaTreatment.INACTIVE : SpaTreatment.ACTIVE);
        treatment.setTreatmentStatus(newStatus);
        return ResponseEntity.ok(ApiResponse.ok("Treatment status updated", spaTreatmentRepo.save(treatment)));
    }

    @DeleteMapping("/spa-treatments/{idOrCode}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteTreatment(
            @PathVariable String idOrCode,
            @RequestParam(required = false, defaultValue = "false") boolean hard) {
        if (hard) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quy định nghiệp vụ HSWRMS: Không được phép xóa gói/liệu trình khỏi hệ thống. Chỉ được phép ngừng gói (INACTIVE) để bảo toàn dữ liệu lịch sử đặt chỗ và đối soát.");
        }
        SpaTreatment treatment = resolveTreatment(idOrCode);
        treatment.setTreatmentStatus(SpaTreatment.INACTIVE);
        spaTreatmentRepo.save(treatment);
        return ResponseEntity.ok(ApiResponse.ok("Treatment deactivated successfully (Đã ngừng gói)", null));
    }

    // ========================================================================
    // 2. RETREAT PACKAGES
    // ========================================================================

    @GetMapping("/retreat-packages")
    public ResponseEntity<ApiResponse<List<RetreatPackage>>> getAllPackages(
            @RequestParam(required = false) String status) {
        List<RetreatPackage> list = retreatPackageRepo.findAll();
        if (status != null && !status.isBlank()) {
            list = list.stream().filter(p -> p.getPackageStatus().equalsIgnoreCase(status)).toList();
        }
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @GetMapping("/retreat-packages/{idOrCode}")
    public ResponseEntity<ApiResponse<RetreatPackage>> getPackageById(@PathVariable String idOrCode) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        return ResponseEntity.ok(ApiResponse.ok(pkg));
    }

    @PostMapping("/retreat-packages")
    public ResponseEntity<ApiResponse<RetreatPackage>> createPackage(@RequestBody Map<String, Object> payload) {
        String packageName = (String) payload.get("packageName");
        if (packageName == null || packageName.isBlank()) {
            throw new IllegalArgumentException("packageName is required");
        }
        if (retreatPackageRepo.findByPackageName(packageName).isPresent()) {
            throw new IllegalArgumentException("Retreat package with name '" + packageName + "' already exists");
        }

        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageCode((String) payload.get("packageCode"));
        pkg.setPackageName(packageName);
        pkg.setWellnessGoal((String) payload.getOrDefault("wellnessGoal", "Holistic Wellness"));
        pkg.setDurationNights(payload.get("durationNights") != null
                ? Integer.parseInt(payload.get("durationNights").toString())
                : 3);
        pkg.setDurationUnit((String) payload.getOrDefault("durationUnit", "Đêm (Nights)"));
        pkg.setBasePrice(payload.get("basePrice") != null
                ? new BigDecimal(payload.get("basePrice").toString())
                : BigDecimal.ZERO);
        pkg.setBasePriceUnit((String) payload.getOrDefault("basePriceUnit", "VND/khách/gói"));
        pkg.setIncludedTreatments((String) payload.get("includedTreatments"));
        pkg.setDietaryPlan((String) payload.get("dietaryPlan"));
        pkg.setExtraChargePolicy((String) payload.get("extraChargePolicy"));
        pkg.setTargetGuest((String) payload.get("targetGuest"));
        pkg.setPackageStatus((String) payload.getOrDefault("packageStatus", RetreatPackage.ACTIVE));

        RetreatPackage saved = retreatPackageRepo.save(pkg);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Retreat package created successfully", saved));
    }

    @PutMapping("/retreat-packages/{idOrCode}")
    public ResponseEntity<ApiResponse<RetreatPackage>> updatePackage(
            @PathVariable String idOrCode,
            @RequestBody Map<String, Object> payload) {
        RetreatPackage pkg = resolvePackage(idOrCode);

        if (payload.containsKey("packageCode")) {
            pkg.setPackageCode((String) payload.get("packageCode"));
        }
        if (payload.containsKey("packageName")) {
            pkg.setPackageName((String) payload.get("packageName"));
        }
        if (payload.containsKey("wellnessGoal")) {
            pkg.setWellnessGoal((String) payload.get("wellnessGoal"));
        }
        if (payload.containsKey("durationNights") && payload.get("durationNights") != null) {
            pkg.setDurationNights(Integer.parseInt(payload.get("durationNights").toString()));
        }
        if (payload.containsKey("durationUnit")) {
            pkg.setDurationUnit((String) payload.get("durationUnit"));
        }
        if (payload.containsKey("basePrice") && payload.get("basePrice") != null) {
            pkg.setBasePrice(new BigDecimal(payload.get("basePrice").toString()));
        }
        if (payload.containsKey("basePriceUnit")) {
            pkg.setBasePriceUnit((String) payload.get("basePriceUnit"));
        }
        if (payload.containsKey("includedTreatments")) {
            pkg.setIncludedTreatments((String) payload.get("includedTreatments"));
        }
        if (payload.containsKey("dietaryPlan")) {
            pkg.setDietaryPlan((String) payload.get("dietaryPlan"));
        }
        if (payload.containsKey("extraChargePolicy")) {
            pkg.setExtraChargePolicy((String) payload.get("extraChargePolicy"));
        }
        if (payload.containsKey("targetGuest")) {
            pkg.setTargetGuest((String) payload.get("targetGuest"));
        }
        if (payload.containsKey("packageStatus")) {
            pkg.setPackageStatus((String) payload.get("packageStatus"));
        }

        RetreatPackage updated = retreatPackageRepo.save(pkg);
        return ResponseEntity.ok(ApiResponse.ok("Retreat package updated successfully", updated));
    }

    @PatchMapping("/retreat-packages/{idOrCode}/price")
    public ResponseEntity<ApiResponse<RetreatPackage>> updatePackagePrice(
            @PathVariable String idOrCode,
            @RequestBody Map<String, Object> payload) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        if (payload.get("basePrice") != null) {
            pkg.setBasePrice(new BigDecimal(payload.get("basePrice").toString()));
        }
        return ResponseEntity.ok(ApiResponse.ok("Package price updated successfully", retreatPackageRepo.save(pkg)));
    }

    @PatchMapping("/retreat-packages/{idOrCode}/status")
    public ResponseEntity<ApiResponse<RetreatPackage>> togglePackageStatus(
            @PathVariable String idOrCode,
            @RequestBody(required = false) Map<String, Object> payload) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        String newStatus = (payload != null && payload.containsKey("packageStatus"))
                ? (String) payload.get("packageStatus")
                : (RetreatPackage.ACTIVE.equals(pkg.getPackageStatus()) ? RetreatPackage.INACTIVE : RetreatPackage.ACTIVE);
        pkg.setPackageStatus(newStatus);
        return ResponseEntity.ok(ApiResponse.ok("Package status updated", retreatPackageRepo.save(pkg)));
    }

    @DeleteMapping("/retreat-packages/{idOrCode}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deletePackage(
            @PathVariable String idOrCode,
            @RequestParam(required = false, defaultValue = "false") boolean hard) {
        if (hard) {
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quy định nghiệp vụ HSWRMS: Không được phép xóa gói retreat khỏi hệ thống. Chỉ được phép ngừng gói (INACTIVE) để bảo toàn dữ liệu lịch sử đặt chỗ và đối soát.");
        }
        RetreatPackage pkg = resolvePackage(idOrCode);
        pkg.setPackageStatus(RetreatPackage.INACTIVE);
        retreatPackageRepo.save(pkg);
        return ResponseEntity.ok(ApiResponse.ok("Retreat package deactivated successfully (Đã ngừng gói)", null));
    }

    // ========================================================================
    // 3. PACKAGE - TREATMENT MAPPINGS (Sheet 4)
    // ========================================================================

    @GetMapping("/retreat-packages/{idOrCode}/treatments")
    public ResponseEntity<ApiResponse<List<RetreatPackageSpaTreatment>>> getPackageTreatments(@PathVariable String idOrCode) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        List<RetreatPackageSpaTreatment> list = packageTreatmentRepo.findByRetreatPackageId(pkg.getRetreatPackageId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/retreat-packages/{idOrCode}/treatments")
    @Transactional
    public ResponseEntity<ApiResponse<RetreatPackageSpaTreatment>> addTreatmentToPackage(
            @PathVariable String idOrCode,
            @RequestBody Map<String, Object> payload) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        String treatmentIdOrCode = payload.get("treatmentId") != null ? payload.get("treatmentId").toString() : (String) payload.get("treatmentCode");
        if (treatmentIdOrCode == null) {
            throw new IllegalArgumentException("treatmentId or treatmentCode is required");
        }
        SpaTreatment treatment = resolveTreatment(treatmentIdOrCode);

        Integer sessions = payload.get("includedSessions") != null ? Integer.parseInt(payload.get("includedSessions").toString()) : 1;
        String status = (String) payload.getOrDefault("entitlementStatus", "INCLUDED");
        String notes = (String) payload.get("notes");

        RetreatPackageSpaTreatment mapping = new RetreatPackageSpaTreatment(pkg, treatment, sessions, status, notes);
        RetreatPackageSpaTreatment saved = packageTreatmentRepo.save(mapping);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.created("Treatment added to package", saved));
    }

    @PutMapping("/retreat-packages/{idOrCode}/treatments/{treatmentIdOrCode}")
    @Transactional
    public ResponseEntity<ApiResponse<RetreatPackageSpaTreatment>> updatePackageTreatment(
            @PathVariable String idOrCode,
            @PathVariable String treatmentIdOrCode,
            @RequestBody Map<String, Object> payload) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        SpaTreatment treatment = resolveTreatment(treatmentIdOrCode);

        RetreatPackageSpaTreatmentId key = new RetreatPackageSpaTreatmentId(pkg.getRetreatPackageId(), treatment.getTreatmentId());
        RetreatPackageSpaTreatment mapping = packageTreatmentRepo.findById(key)
                .orElse(new RetreatPackageSpaTreatment(pkg, treatment, 1, "INCLUDED", null));

        if (payload.containsKey("includedSessions") && payload.get("includedSessions") != null) {
            mapping.setIncludedSessions(Integer.parseInt(payload.get("includedSessions").toString()));
        }
        if (payload.containsKey("entitlementStatus")) {
            mapping.setEntitlementStatus((String) payload.get("entitlementStatus"));
        }
        if (payload.containsKey("notes")) {
            mapping.setNotes((String) payload.get("notes"));
        }

        RetreatPackageSpaTreatment saved = packageTreatmentRepo.save(mapping);
        return ResponseEntity.ok(ApiResponse.ok("Package treatment mapping updated", saved));
    }

    @DeleteMapping("/retreat-packages/{idOrCode}/treatments/{treatmentIdOrCode}")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> removeTreatmentFromPackage(
            @PathVariable String idOrCode,
            @PathVariable String treatmentIdOrCode) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        SpaTreatment treatment = resolveTreatment(treatmentIdOrCode);

        RetreatPackageSpaTreatmentId key = new RetreatPackageSpaTreatmentId(pkg.getRetreatPackageId(), treatment.getTreatmentId());
        packageTreatmentRepo.deleteById(key);
        return ResponseEntity.ok(ApiResponse.ok("Treatment removed from package", null));
    }

    // ========================================================================
    // 4. PACKAGE F&B ENTITLEMENTS (Sheet 5)
    // ========================================================================

    @GetMapping("/retreat-packages/{idOrCode}/fnb")
    public ResponseEntity<ApiResponse<PackageFnBEntitlement>> getPackageFnB(@PathVariable String idOrCode) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        Optional<PackageFnBEntitlement> opt = fnbEntitlementRepo.findByRetreatPackageId(pkg.getRetreatPackageId());
        return ResponseEntity.ok(ApiResponse.ok(opt.orElse(null)));
    }

    @PutMapping("/retreat-packages/{idOrCode}/fnb")
    @Transactional
    public ResponseEntity<ApiResponse<PackageFnBEntitlement>> updatePackageFnB(
            @PathVariable String idOrCode,
            @RequestBody Map<String, Object> payload) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        PackageFnBEntitlement fnb = fnbEntitlementRepo.findByRetreatPackageId(pkg.getRetreatPackageId())
                .orElse(new PackageFnBEntitlement(pkg, 0, 0, 0, null, null));

        if (payload.containsKey("breakfastCount") && payload.get("breakfastCount") != null) {
            fnb.setBreakfastCount(Integer.parseInt(payload.get("breakfastCount").toString()));
        }
        if (payload.containsKey("lunchCount") && payload.get("lunchCount") != null) {
            fnb.setLunchCount(Integer.parseInt(payload.get("lunchCount").toString()));
        }
        if (payload.containsKey("dinnerCount") && payload.get("dinnerCount") != null) {
            fnb.setDinnerCount(Integer.parseInt(payload.get("dinnerCount").toString()));
        }
        fnb.setTotalMeals(fnb.getBreakfastCount() + fnb.getLunchCount() + fnb.getDinnerCount());

        if (payload.containsKey("menuPlan")) fnb.setMenuPlan((String) payload.get("menuPlan"));
        if (payload.containsKey("dietaryNotes")) fnb.setDietaryNotes((String) payload.get("dietaryNotes"));
        if (payload.containsKey("entitlementStatus")) fnb.setEntitlementStatus((String) payload.get("entitlementStatus"));

        PackageFnBEntitlement saved = fnbEntitlementRepo.save(fnb);
        return ResponseEntity.ok(ApiResponse.ok("Package F&B entitlement updated", saved));
    }

    // ========================================================================
    // 5. TREATMENT ROOMS
    // ========================================================================

    @GetMapping("/treatment-rooms")
    public ResponseEntity<ApiResponse<List<TreatmentRoom>>> getAllTreatmentRooms(
            @RequestParam(required = false) String status) {
        List<TreatmentRoom> list = treatmentRoomRepo.findAll();
        if (status != null && !status.isBlank()) {
            list = list.stream().filter(r -> r.getRoomStatus().equalsIgnoreCase(status)).toList();
        }
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    @PostMapping("/treatment-rooms")
    public ResponseEntity<ApiResponse<TreatmentRoom>> createTreatmentRoom(@RequestBody Map<String, Object> payload) {
        String roomName = (String) payload.get("roomName");
        if (roomName == null || roomName.isBlank()) {
            throw new IllegalArgumentException("roomName is required");
        }
        String roomType = (String) payload.getOrDefault("roomType", "MASSAGE_STANDARD");
        String status = (String) payload.getOrDefault("roomStatus", TreatmentRoom.AVAILABLE);

        TreatmentRoom room = new TreatmentRoom(roomName, roomType, status);
        TreatmentRoom saved = treatmentRoomRepo.save(room);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Treatment room created successfully", saved));
    }

    @PutMapping("/treatment-rooms/{roomId}")
    public ResponseEntity<ApiResponse<TreatmentRoom>> updateTreatmentRoom(
            @PathVariable Integer roomId,
            @RequestBody Map<String, Object> payload) {
        TreatmentRoom room = treatmentRoomRepo.findById(roomId)
                .orElseThrow(() -> new ResourceNotFoundException("TreatmentRoom", "roomId", roomId));

        if (payload.containsKey("roomName")) room.setRoomName((String) payload.get("roomName"));
        if (payload.containsKey("roomType")) room.setRoomType((String) payload.get("roomType"));
        if (payload.containsKey("roomStatus")) room.setRoomStatus((String) payload.get("roomStatus"));

        return ResponseEntity.ok(ApiResponse.ok("Treatment room updated successfully", treatmentRoomRepo.save(room)));
    }

    // ========================================================================
    // 6. METADATA: ROOM TYPES & QUALIFICATIONS (Sheet 6 & Sheet 7)
    // ========================================================================

    @GetMapping("/room-types")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getRoomTypes() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT room_type, type_name, technical_specs, design_status FROM dbo.RoomTypeMaster ORDER BY room_type_id ASC"
        );
        return ResponseEntity.ok(ApiResponse.ok(rows));
    }

    @GetMapping("/qualifications")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getQualifications() {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT qualification_code, qualification_name, baseline_status FROM dbo.QualificationMaster ORDER BY qualification_id ASC"
        );
        return ResponseEntity.ok(ApiResponse.ok(rows));
    }
}
