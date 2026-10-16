package com.heavenstay.hswrms.m3spa.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1")
public class SpaMasterController {

    private final SpaTreatmentRepository spaTreatmentRepo;
    private final RetreatPackageRepository retreatPackageRepo;
    private final TreatmentRoomRepository treatmentRoomRepo;

    public SpaMasterController(SpaTreatmentRepository spaTreatmentRepo,
                               RetreatPackageRepository retreatPackageRepo,
                               TreatmentRoomRepository treatmentRoomRepo) {
        this.spaTreatmentRepo = spaTreatmentRepo;
        this.retreatPackageRepo = retreatPackageRepo;
        this.treatmentRoomRepo = treatmentRoomRepo;
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
        treatment.setBasePrice(payload.get("basePrice") != null
                ? new BigDecimal(payload.get("basePrice").toString())
                : BigDecimal.ZERO);
        treatment.setRoomCompatibility((String) payload.get("roomCompatibility"));
        treatment.setTherapistQualification((String) payload.get("therapistQualification"));
        treatment.setContraindications((String) payload.get("contraindications"));
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
        if (payload.containsKey("basePrice") && payload.get("basePrice") != null) {
            treatment.setBasePrice(new BigDecimal(payload.get("basePrice").toString()));
        }
        if (payload.containsKey("roomCompatibility")) {
            treatment.setRoomCompatibility((String) payload.get("roomCompatibility"));
        }
        if (payload.containsKey("therapistQualification")) {
            treatment.setTherapistQualification((String) payload.get("therapistQualification"));
        }
        if (payload.containsKey("contraindications")) {
            treatment.setContraindications((String) payload.get("contraindications"));
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
    public ResponseEntity<ApiResponse<Void>> deleteTreatment(@PathVariable String idOrCode) {
        SpaTreatment treatment = resolveTreatment(idOrCode);
        treatment.setTreatmentStatus(SpaTreatment.INACTIVE);
        spaTreatmentRepo.save(treatment);
        return ResponseEntity.ok(ApiResponse.ok("Treatment deactivated successfully", null));
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
        pkg.setBasePrice(payload.get("basePrice") != null
                ? new BigDecimal(payload.get("basePrice").toString())
                : BigDecimal.ZERO);
        pkg.setIncludedTreatments((String) payload.get("includedTreatments"));
        pkg.setDietaryPlan((String) payload.get("dietaryPlan"));
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
        if (payload.containsKey("basePrice") && payload.get("basePrice") != null) {
            pkg.setBasePrice(new BigDecimal(payload.get("basePrice").toString()));
        }
        if (payload.containsKey("includedTreatments")) {
            pkg.setIncludedTreatments((String) payload.get("includedTreatments"));
        }
        if (payload.containsKey("dietaryPlan")) {
            pkg.setDietaryPlan((String) payload.get("dietaryPlan"));
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
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable String idOrCode) {
        RetreatPackage pkg = resolvePackage(idOrCode);
        pkg.setPackageStatus(RetreatPackage.INACTIVE);
        retreatPackageRepo.save(pkg);
        return ResponseEntity.ok(ApiResponse.ok("Package deactivated successfully", null));
    }

    // ========================================================================
    // 3. TREATMENT ROOMS
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
}
