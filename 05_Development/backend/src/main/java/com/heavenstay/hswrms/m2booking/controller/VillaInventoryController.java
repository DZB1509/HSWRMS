package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.ResortZone;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.entity.VillaFunctionalArea;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.ResortZoneRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaFunctionalAreaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class VillaInventoryController {

    private final PhysicalVillaRepository villaRepo;
    private final VillaCategoryRepository categoryRepo;
    private final ResortZoneRepository zoneRepo;
    private final VillaFunctionalAreaRepository areaRepo;

    public VillaInventoryController(PhysicalVillaRepository villaRepo,
                                    VillaCategoryRepository categoryRepo,
                                    ResortZoneRepository zoneRepo,
                                    VillaFunctionalAreaRepository areaRepo) {
        this.villaRepo = villaRepo;
        this.categoryRepo = categoryRepo;
        this.zoneRepo = zoneRepo;
        this.areaRepo = areaRepo;
    }

    @GetMapping("/villas")
    public ResponseEntity<ApiResponse<List<PhysicalVilla>>> getAllVillas(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String zone) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(villaRepo.findByVillaStatus(status.toUpperCase())));
        }
        if (zone != null && !zone.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(villaRepo.findByZoneName(zone)));
        }
        return ResponseEntity.ok(ApiResponse.ok(villaRepo.findAll()));
    }

    @GetMapping("/villas/{villaNumber}")
    public ResponseEntity<ApiResponse<PhysicalVilla>> getVillaByNumber(@PathVariable String villaNumber) {
        PhysicalVilla villa = villaRepo.findByVillaNumber(villaNumber)
                .orElseThrow(() -> new ResourceNotFoundException("PhysicalVilla", "villaNumber", villaNumber));
        return ResponseEntity.ok(ApiResponse.ok(villa));
    }

    @PatchMapping("/villas/{villaNumber}/status")
    public ResponseEntity<ApiResponse<PhysicalVilla>> updateVillaStatus(
            @PathVariable String villaNumber,
            @RequestBody Map<String, String> payload) {
        String newStatus = payload.get("status");
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("Status field is required");
        }
        PhysicalVilla villa = villaRepo.findByVillaNumber(villaNumber)
                .orElseThrow(() -> new ResourceNotFoundException("PhysicalVilla", "villaNumber", villaNumber));
        villa.setVillaStatus(newStatus.toUpperCase());
        return ResponseEntity.ok(ApiResponse.ok("Villa status updated successfully", villaRepo.save(villa)));
    }

    @GetMapping("/villa-categories")
    public ResponseEntity<ApiResponse<List<VillaCategory>>> getAllCategories() {
        return ResponseEntity.ok(ApiResponse.ok(categoryRepo.findAll()));
    }

    @GetMapping("/resort-zones")
    public ResponseEntity<ApiResponse<List<ResortZone>>> getAllZones() {
        return ResponseEntity.ok(ApiResponse.ok(zoneRepo.findAll()));
    }

    @GetMapping("/villa-functional-areas")
    public ResponseEntity<ApiResponse<List<VillaFunctionalArea>>> getAllFunctionalAreas(
            @RequestParam(required = false) String spaceGroup) {
        if (spaceGroup != null && !spaceGroup.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(areaRepo.findBySpaceGroup(spaceGroup)));
        }
        return ResponseEntity.ok(ApiResponse.ok(areaRepo.findAll()));
    }
}
