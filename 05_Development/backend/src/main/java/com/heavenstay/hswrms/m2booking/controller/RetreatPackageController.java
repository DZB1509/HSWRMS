package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationRequest;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationResponse;
import com.heavenstay.hswrms.m2booking.dto.RetreatPackageResponse;
import com.heavenstay.hswrms.m2booking.dto.VillaCategoryResponse;
import com.heavenstay.hswrms.m2booking.service.RetreatPackageService;
import com.heavenstay.hswrms.m2booking.service.VillaAvailabilityService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/retreat-packages")
public class RetreatPackageController {

    private final RetreatPackageService packageService;
    private final VillaAvailabilityService availabilityService;

    public RetreatPackageController(RetreatPackageService packageService,
                                    VillaAvailabilityService availabilityService) {
        this.packageService = packageService;
        this.availabilityService = availabilityService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<RetreatPackageResponse>>> getAllPackages(
            @RequestParam(required = false) String wellnessGoal) {
        List<RetreatPackageResponse> packages = packageService.getAllActivePackages(wellnessGoal);
        return ResponseEntity.ok(ApiResponse.ok("Retreat packages retrieved successfully", packages));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<RetreatPackageResponse>> getPackageById(@PathVariable Integer id) {
        RetreatPackageResponse pkg = packageService.getPackageById(id);
        return ResponseEntity.ok(ApiResponse.ok("Retreat package retrieved successfully", pkg));
    }

    @GetMapping("/villa-categories")
    public ResponseEntity<ApiResponse<List<VillaCategoryResponse>>> getAllVillaCategories() {
        List<VillaCategoryResponse> categories = packageService.getAllActiveVillaCategories();
        return ResponseEntity.ok(ApiResponse.ok("Villa categories retrieved successfully", categories));
    }

    @PostMapping("/calculate")
    public ResponseEntity<ApiResponse<BookingCalculationResponse>> calculateBooking(
            @Valid @RequestBody BookingCalculationRequest request) {
        BookingCalculationResponse calculation = availabilityService.calculateBooking(request);
        return ResponseEntity.ok(ApiResponse.ok("Booking calculation completed", calculation));
    }
}
