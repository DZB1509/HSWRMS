package com.heavenstay.hswrms.m6admin.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m6admin.dto.HealthReadinessDto;
import com.heavenstay.hswrms.m6admin.service.HealthReadinessService;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1/manager")
public class HealthReadinessController {

    private final HealthReadinessService service;

    public HealthReadinessController(HealthReadinessService service) {
        this.service = service;
    }

    @GetMapping("/health-readiness")
    @PreAuthorize("@perm.has('S54','V')")
    public ResponseEntity<ApiResponse<HealthReadinessDto>> healthReadiness() {
        // Resolved inside the handler (same convention as DashboardController). Declaring
        // CurrentActor as a method parameter makes Spring MVC bind it as a model attribute,
        // which fails with HTTP 400 before the service is ever invoked.
        CurrentActor actor = CurrentActor.require();
        return ResponseEntity.status(HttpStatus.OK)
                .body(ApiResponse.ok(service.getHealthReadiness(actor)));
    }
}