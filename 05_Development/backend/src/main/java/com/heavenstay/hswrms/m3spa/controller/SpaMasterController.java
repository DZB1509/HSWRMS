package com.heavenstay.hswrms.m3spa.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class SpaMasterController {

    private final SpaTreatmentRepository spaTreatmentRepo;
    private final RetreatPackageRepository retreatPackageRepo;

    public SpaMasterController(SpaTreatmentRepository spaTreatmentRepo,
                               RetreatPackageRepository retreatPackageRepo) {
        this.spaTreatmentRepo = spaTreatmentRepo;
        this.retreatPackageRepo = retreatPackageRepo;
    }

    @GetMapping("/spa-treatments")
    public ResponseEntity<ApiResponse<List<SpaTreatment>>> getAllTreatments(
            @RequestParam(required = false) String status) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(
                    spaTreatmentRepo.findAll().stream()
                            .filter(t -> t.getTreatmentStatus().equalsIgnoreCase(status))
                            .toList()
            ));
        }
        return ResponseEntity.ok(ApiResponse.ok(spaTreatmentRepo.findAll()));
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

        int duration = payload.get("durationMinutes") != null
                ? Integer.parseInt(payload.get("durationMinutes").toString())
                : 60;
        BigDecimal price = payload.get("basePrice") != null
                ? new BigDecimal(payload.get("basePrice").toString())
                : BigDecimal.ZERO;
        String status = (String) payload.getOrDefault("treatmentStatus", SpaTreatment.ACTIVE);

        SpaTreatment treatment = new SpaTreatment(treatmentName, duration, price, status);
        SpaTreatment saved = spaTreatmentRepo.save(treatment);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Spa treatment created successfully", saved));
    }

    @GetMapping("/retreat-packages")
    public ResponseEntity<ApiResponse<List<RetreatPackage>>> getAllPackages() {
        return ResponseEntity.ok(ApiResponse.ok(retreatPackageRepo.findAll()));
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

        String goal = (String) payload.getOrDefault("wellnessGoal", "Holistic Wellness");
        int nights = payload.get("durationNights") != null
                ? Integer.parseInt(payload.get("durationNights").toString())
                : 3;
        BigDecimal price = payload.get("basePrice") != null
                ? new BigDecimal(payload.get("basePrice").toString())
                : BigDecimal.ZERO;
        String status = (String) payload.getOrDefault("packageStatus", RetreatPackage.ACTIVE);

        RetreatPackage pkg = new RetreatPackage(packageName, goal, nights, price, status);
        RetreatPackage saved = retreatPackageRepo.save(pkg);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.created("Retreat package created successfully", saved));
    }

    @PatchMapping("/retreat-packages/{packageId}/price")
    public ResponseEntity<ApiResponse<RetreatPackage>> updatePackagePrice(
            @PathVariable Integer packageId,
            @RequestBody Map<String, Object> payload) {
        RetreatPackage pkg = retreatPackageRepo.findById(packageId)
                .orElseThrow(() -> new ResourceNotFoundException("RetreatPackage", "retreatPackageId", packageId));
        if (payload.get("basePrice") != null) {
            pkg.setBasePrice(new BigDecimal(payload.get("basePrice").toString()));
        }
        return ResponseEntity.ok(ApiResponse.ok("Package price updated successfully", retreatPackageRepo.save(pkg)));
    }
}
