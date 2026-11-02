package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DashboardView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.WidgetView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

/**
 * FR-M6-07 / UC84 – System Overview Dashboard, Admin Dashboard (S49), and Manager Dashboard (S54).
 * Role-scoped visibility (GB-M6-07): Admin sees governance and security widgets; Manager sees operational metrics.
 */
@Service
public class SystemOverviewService {

    private final IdentityAccountService identity;
    private final DelegationService delegations;
    private final AuditLogService audit;
    private final PermissionService permissions;
    private final JdbcTemplate jdbc;

    public SystemOverviewService(IdentityAccountService identity, DelegationService delegations,
                                 AuditLogService audit, PermissionService permissions, JdbcTemplate jdbc) {
        this.identity = identity;
        this.delegations = delegations;
        this.audit = audit;
        this.permissions = permissions;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public DashboardView getAdminDashboard(CurrentActor actor) {
        List<String> navigation = List.of(
                "S10: Staff Accounts",
                "S12: Master Data Management",
                "S50: Business Parameters",
                "S51: Permission Matrix",
                "S52: Limited Admin Rights Delegation",
                "S53: Sensitive Data Audit Log",
                "S55: System Overview Dashboard"
        );

        List<WidgetView> widgets = new ArrayList<>();
        widgets.add(new WidgetView("active_staff", "Active Staff Accounts", true,
                identity.countByStatus("ACTIVE"), "Total operational staff members"));
        widgets.add(new WidgetView("active_delegations", "Active Manager Delegations", true,
                delegations.countActive(), "Time-bound managerial delegations active"));
        LocalDateTime last24h = LocalDateTime.now(ZoneOffset.UTC).minusHours(24);
        widgets.add(new WidgetView("audit_events_24h", "Audit Events (Last 24h)", true,
                audit.countSince(last24h), "Total governance and access events"));
        widgets.add(new WidgetView("denied_access_24h", "Denied Access Attempts (24h)", true,
                audit.countDeniedSince(last24h), "Potential authorization violations logged"));

        return new DashboardView("Admin Operational & Governance Dashboard", navigation, widgets);
    }

    @Transactional(readOnly = true)
    public DashboardView getManagerDashboard(CurrentActor actor) {
        List<String> navigation = new ArrayList<>();
        navigation.add("S46: Revenue Dashboard");
        navigation.add("S47: Occupancy Report");
        navigation.add("S48: Therapist Utilization Report");
        navigation.add("S54: Manager Dashboard");
        navigation.add("S55: System Overview Dashboard");

        if (permissions.userHas(actor.userId(), "S50", "V")) {
            navigation.add("S50: Business Parameters (Delegated)");
        }
        if (permissions.userHas(actor.userId(), "S53", "V")) {
            navigation.add("S53: Sensitive Data Audit Log (Delegated)");
        }

        List<WidgetView> widgets = new ArrayList<>();
        widgets.add(new WidgetView("resort_occupancy", "Estimated Resort Occupancy", false,
                null, "Unavailable: no verified occupancy aggregation is connected to this dashboard."));
        widgets.add(new WidgetView("daily_arrivals", "Today's Arrivals", false,
                null, "Unavailable: no verified arrivals source is connected to this dashboard."));
        widgets.add(new WidgetView("spa_utilization", "Spa Therapist Workload", false,
                null, "Unavailable: no verified therapist utilization aggregation is connected to this dashboard."));
        widgets.add(new WidgetView("average_rating", "Customer Review KPI", false,
                null, "Unavailable: no verified review aggregation is connected to this dashboard."));

        return new DashboardView("Manager Operational & Analytics Dashboard", navigation, widgets);
    }

    @Transactional(readOnly = true)
    public DashboardView getSystemOverview(CurrentActor actor) {
        List<WidgetView> widgets = new ArrayList<>();

        // Operational widgets (available to both Admin and Manager)
        widgets.add(new WidgetView("villa_status", "Villa Operational Status", false,
                null, "Unavailable: no verified physical villa aggregation is connected to this dashboard."));
        widgets.add(new WidgetView("arrivals_departures", "Today's Movements", false,
                null, "Unavailable: no verified arrivals and departures source is connected to this dashboard."));
        widgets.add(new WidgetView("spa_daily_sessions", "Today's Spa Schedule", false,
                null, "Unavailable: no verified Spa schedule aggregation is connected to this dashboard."));

        // Admin-only widgets
        boolean hasAdminWidgets = actor.admin() || permissions.userHas(actor.userId(), "S55_ADMIN_WIDGETS", "V");
        if (hasAdminWidgets) {
            widgets.add(new WidgetView("active_delegations", "Active Delegations", true,
                    delegations.countActive(), "Active manager delegation tokens"));
            LocalDateTime last24h = LocalDateTime.now(ZoneOffset.UTC).minusHours(24);
            widgets.add(new WidgetView("recent_audit_count", "Audit Log Volume (24h)", true,
                    audit.countSince(last24h), "System-wide action audit trail entries"));
            widgets.add(new WidgetView("failed_security_events", "Access Denied Count (24h)", true,
                    audit.countDeniedSince(last24h), "RBAC & sensitive data security denials"));
        }

        return new DashboardView("System-Wide Operational Overview",
                List.of("S55: System Overview Dashboard"), widgets);
    }

    @Transactional(readOnly = true)
    public String generatePoliceResidencyReportCsv(CurrentActor actor) {
        throw new UnsupportedOperationException("Police residency export is unavailable: no verified residence-record source is connected.");
    }
}
