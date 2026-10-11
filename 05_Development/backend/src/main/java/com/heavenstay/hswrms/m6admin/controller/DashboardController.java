package com.heavenstay.hswrms.m6admin.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DashboardView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.SystemOverviewService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {

    private final SystemOverviewService service;

    public DashboardController(SystemOverviewService service) {
        this.service = service;
    }

    @GetMapping("/admin/dashboard")
    @PreAuthorize("@perm.has('S49','V')")
    public ResponseEntity<ApiResponse<DashboardView>> adminDashboard() {
        CurrentActor actor = CurrentActor.require();
        return ResponseEntity.ok(ApiResponse.ok(service.getAdminDashboard(actor)));
    }

    @GetMapping("/manager/dashboard")
    @PreAuthorize("@perm.has('S54','V')")
    public ResponseEntity<ApiResponse<DashboardView>> managerDashboard() {
        CurrentActor actor = CurrentActor.require();
        return ResponseEntity.ok(ApiResponse.ok(service.getManagerDashboard(actor)));
    }

    @GetMapping("/system-overview")
    @PreAuthorize("@perm.has('S55','V')")
    public ResponseEntity<ApiResponse<DashboardView>> systemOverview() {
        CurrentActor actor = CurrentActor.require();
        return ResponseEntity.ok(ApiResponse.ok(service.getSystemOverview(actor)));
    }

    @GetMapping("/system-overview/police-residency-report/export")
    @PreAuthorize("@perm.has('RESIDENCE_REPORT','E')")
    public ResponseEntity<String> exportPoliceResidencyReport() {
        CurrentActor actor = CurrentActor.require();
        String csv = service.generatePoliceResidencyReportCsv(actor);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"police-residency-report-" + System.currentTimeMillis() + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(csv);
    }
}
