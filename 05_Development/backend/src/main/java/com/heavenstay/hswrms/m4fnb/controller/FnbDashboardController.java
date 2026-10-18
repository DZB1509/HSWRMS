package com.heavenstay.hswrms.m4fnb.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.FnbDashboardResponse;
import com.heavenstay.hswrms.m4fnb.service.FnbDashboardService;
import java.time.LocalDate;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/fnb/dashboard")
@PreAuthorize("hasAuthority('ROLE_F&B STAFF')")
public class FnbDashboardController {
    private final FnbDashboardService dashboardService;

    public FnbDashboardController(FnbDashboardService dashboardService) { this.dashboardService = dashboardService; }

    @GetMapping
    public ResponseEntity<ApiResponse<FnbDashboardResponse>> getDashboard(
            @RequestParam(required = false) LocalDate date) {
        return ResponseEntity.ok(ApiResponse.ok(dashboardService.getDashboard(date == null ? LocalDate.now() : date)));
    }
}
