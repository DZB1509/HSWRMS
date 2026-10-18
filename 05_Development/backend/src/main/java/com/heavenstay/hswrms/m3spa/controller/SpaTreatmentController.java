package com.heavenstay.hswrms.m3spa.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m3spa.dto.response.SpaTreatmentDto;
import com.heavenstay.hswrms.m3spa.service.SpaTreatmentService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/spa/treatments")
public class SpaTreatmentController {

    private final SpaTreatmentService treatmentService;

    public SpaTreatmentController(SpaTreatmentService treatmentService) {
        this.treatmentService = treatmentService;
    }

    /**
     * Screen 25: List active Spa Treatments.
     * Evaluates retreat stay package inclusion when authenticated.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<SpaTreatmentDto>>> listTreatments(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        List<SpaTreatmentDto> treatments = treatmentService.listActiveTreatments(userId);
        return ResponseEntity.ok(ApiResponse.ok(treatments));
    }

    /**
     * Get single Spa Treatment detail.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SpaTreatmentDto>> getTreatment(
            @PathVariable Integer id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        SpaTreatmentDto dto = treatmentService.getTreatmentById(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(dto));
    }
}
