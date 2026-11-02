package com.heavenstay.hswrms.m6admin.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DashboardView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.WidgetView;
import com.heavenstay.hswrms.m6admin.entity.RightDelegation;
import com.heavenstay.hswrms.m6admin.entity.SystemConfiguration;
import com.heavenstay.hswrms.m6admin.repository.RightDelegationRepository;
import com.heavenstay.hswrms.m6admin.repository.SystemConfigurationRepository;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.security.PermissionEvaluator;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import com.heavenstay.hswrms.m6admin.service.StaffAccountService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    private final StaffAccountService staffAccountService;
    private final SystemConfigurationRepository configRepository;
    private final RightDelegationRepository delegationRepository;
    private final AuditLogService auditLogService;
    private final PermissionEvaluator permissionEvaluator;
    private final com.heavenstay.hswrms.m6admin.service.PermissionService permissionService;

    public AdminDashboardController(StaffAccountService staffAccountService,
                                    SystemConfigurationRepository configRepository,
                                    RightDelegationRepository delegationRepository,
                                    AuditLogService auditLogService,
                                    PermissionEvaluator permissionEvaluator,
                                    com.heavenstay.hswrms.m6admin.service.PermissionService permissionService) {
        this.staffAccountService = staffAccountService;
        this.configRepository = configRepository;
        this.delegationRepository = delegationRepository;
        this.auditLogService = auditLogService;
        this.permissionEvaluator = permissionEvaluator;
        this.permissionService = permissionService;
    }

    @GetMapping
    @PreAuthorize("@perm.has('S49','V')")
    public ResponseEntity<ApiResponse<DashboardView>> getDashboard() {
        CurrentActor actor = CurrentActor.require();
        auditLogService.record(actor, "View Admin Dashboard", "Dashboard:S49", "S49", AuditLogService.SUCCESS);

        long totalStaff = staffAccountService.search(null, null, null, 0, 1).totalElements();
        long activeStaff = staffAccountService.search(null, null, "ACTIVE", 0, 1).totalElements();

        long activeParams = configRepository.findByConfigurationTypeOrderByConfigurationKeyAsc(
                SystemConfiguration.TYPE_BUSINESS_PARAMETER).size();

        long activeDelegations = delegationRepository.countByDelegationStatus(RightDelegation.ACTIVE);
        long totalDelegations = delegationRepository.count();

        long totalAudit = auditLogService.countSince(LocalDateTime.of(1970, 1, 1, 0, 0));
        long past24hAudit = auditLogService.countSince(LocalDateTime.now(ZoneOffset.UTC).minusHours(24));

        List<WidgetView> widgets = List.of(
                new WidgetView("staffAccounts", "Staff Accounts", true,
                        Map.of("activeCount", activeStaff, "totalCount", totalStaff),
                        "Canonical M1 identity staff accounts"),
                new WidgetView("businessParameters", "Business Parameters", true,
                        Map.of("count", activeParams),
                        "Approved operational thresholds"),
                new WidgetView("managerDelegations", "Manager Delegations", true,
                        Map.of("activeCount", activeDelegations, "totalCount", totalDelegations),
                        "Time-bound delegated administrative rights"),
                new WidgetView("auditActivity", "Audit Log Activity", true,
                        Map.of("totalRecords", totalAudit, "past24HoursCount", past24hAudit),
                        "Tamper-evident audit logging")
        );

        List<String> nav = List.of(
                "/admin/staff",
                "/admin/parameters",
                "/admin/permissions",
                "/admin/delegations",
                "/admin/audit-logs",
                "/admin/system-overview"
        );

        DashboardView dashboard = new DashboardView("Administrator Governance Cockpit", nav, widgets);
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }

    @GetMapping("/system-overview")
    @PreAuthorize("@perm.has('S55','V')")
    public ResponseEntity<ApiResponse<DashboardView>> getSystemOverview() {
        CurrentActor actor = CurrentActor.require();
        auditLogService.record(actor, "View System Overview", "Dashboard:S55", "S55", AuditLogService.SUCCESS);

        List<WidgetView> widgets = new ArrayList<>();
        long totalAudit = auditLogService.countSince(LocalDateTime.of(1970, 1, 1, 0, 0));
        long past24hAudit = auditLogService.countSince(LocalDateTime.now(ZoneOffset.UTC).minusHours(24));

        widgets.add(new WidgetView("auditActivity", "Audit Log Activity", true,
                Map.of("totalRecords", totalAudit, "past24HoursCount", past24hAudit),
                "Tamper-evident audit logging"));

        boolean canViewAdminWidgets = actor.admin() || (permissionService != null && permissionService.userHas(actor.userId(), "S55_ADMIN_WIDGETS", "V"));
        if (canViewAdminWidgets) {
            long activeParams = configRepository.findByConfigurationTypeOrderByConfigurationKeyAsc(
                    SystemConfiguration.TYPE_BUSINESS_PARAMETER).size();
            long activeDelegations = delegationRepository.countByDelegationStatus(RightDelegation.ACTIVE);

            widgets.add(new WidgetView("businessParameters", "Business Parameters", true,
                    Map.of("count", activeParams), "Approved operational thresholds"));
            widgets.add(new WidgetView("managerDelegations", "Manager Delegations", true,
                    Map.of("activeCount", activeDelegations), "Time-bound administrative delegations"));
        } else {
            widgets.add(new WidgetView("businessParameters", "Business Parameters", false,
                    null, "Requires administrative widgets permission"));
            widgets.add(new WidgetView("managerDelegations", "Manager Delegations", false,
                    null, "Requires administrative widgets permission"));
        }

        List<String> nav = List.of("/admin/system-overview", "/admin/audit-logs");
        DashboardView view = new DashboardView("System Operational Overview", nav, widgets);
        return ResponseEntity.ok(ApiResponse.ok(view));
    }
}
