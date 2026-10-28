package com.heavenstay.hswrms.m6admin.service;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static com.heavenstay.hswrms.m1identity.entity.Role.ADMIN;
import static com.heavenstay.hswrms.m1identity.entity.Role.CUSTOMER;
import static com.heavenstay.hswrms.m1identity.entity.Role.FNB_STAFF;
import static com.heavenstay.hswrms.m1identity.entity.Role.MANAGER;
import static com.heavenstay.hswrms.m1identity.entity.Role.RECEPTIONIST;
import static com.heavenstay.hswrms.m1identity.entity.Role.THERAPIST;

/**
 * Baseline permission catalogue (SRS 4.4). Action codes: V=View, C=Create, U=Update, D=Deactivate,
 * X=Execute, E=Export, G=Configure. Seeded idempotently on startup; Admin edits are never overwritten.
 */
public final class PermissionCatalog {

    private PermissionCatalog() {
    }

    public record Def(String module, String action, boolean delegable, boolean adminOnly, List<String> roles) {
    }

    /** Admin always retains these cells (FR-M6-04 Alt 2) – they are locked in the matrix. */
    public static final Set<String> ADMIN_LOCKED_SCREENS =
            Set.of("S10", "S11", "S12", "S49", "S50", "S51", "S52", "S53");

    /** Sensitive-data categories and the only roles that may ever hold them (GB-M6-04, AC-04, AC-06). */
    public static final Map<String, Set<String>> SENSITIVE_DATA_ALLOWED_ROLES = Map.of(
            "DATA_HEALTH_FULL", Set.of(CUSTOMER),
            "DATA_HEALTH_TREATMENT", Set.of(CUSTOMER, THERAPIST),
            "DATA_FOOD_ALLERGY", Set.of(CUSTOMER, FNB_STAFF),
            "DATA_RESIDENCE", Set.of(RECEPTIONIST));

    public static final Map<String, String> ROLE_DESCRIPTIONS = Map.of(
            ADMIN, "System administrator",
            MANAGER, "Manager (read-only monitoring; extra rights only via delegation)",
            RECEPTIONIST, "Front-desk Receptionist",
            THERAPIST, "Spa Therapist / Yoga Instructor",
            FNB_STAFF, "F&B Staff / Chef",
            CUSTOMER, "Resort Customer");

    private static Def d(String module, String action, boolean delegable, boolean adminOnly, String... roles) {
        return new Def(module, action, delegable, adminOnly, List.of(roles));
    }

    public static List<Def> defaults() {
        return List.of(
                // M6 – staff accounts / master data (Admin only, never delegable except master-data view)
                d("S10", "V", false, true, ADMIN), d("S10", "C", false, true, ADMIN),
                d("S10", "U", false, true, ADMIN), d("S10", "D", false, true, ADMIN),
                d("S11", "V", false, true, ADMIN), d("S11", "C", false, true, ADMIN),
                d("S11", "U", false, true, ADMIN), d("S11", "D", false, true, ADMIN),
                d("S12", "V", true, true, ADMIN), d("S12", "C", false, true, ADMIN),
                d("S12", "U", false, true, ADMIN), d("S12", "D", false, true, ADMIN),
                // M6 – dashboards, parameters, matrix, delegation, audit
                d("S49", "V", false, true, ADMIN),
                d("S50", "V", true, true, ADMIN), d("S50", "U", true, true, ADMIN),
                d("S51", "V", false, true, ADMIN), d("S51", "G", false, true, ADMIN),
                d("S52", "V", false, true, ADMIN), d("S52", "C", false, true, ADMIN),
                d("S52", "D", false, true, ADMIN),
                d("S53", "V", true, true, ADMIN), d("S53", "E", false, true, ADMIN),
                d("S54", "V", false, false, MANAGER),
                d("S55", "V", false, false, ADMIN, MANAGER),
                d("S55_ADMIN_WIDGETS", "V", true, true, ADMIN),
                d("RESIDENCE_REPORT", "E", true, false, RECEPTIONIST, ADMIN),
                // Other roles' landing screens and analytics (baseline)
                d("S02", "V", false, false, CUSTOMER),
                d("S20", "V", false, false, RECEPTIONIST),
                d("S31", "V", false, false, THERAPIST),
                d("S38", "V", false, false, FNB_STAFF),
                d("S39", "V", false, false, FNB_STAFF), d("S39", "U", false, false, FNB_STAFF),
                d("S46", "V", false, false, MANAGER, ADMIN),
                d("S47", "V", false, false, MANAGER, ADMIN), d("S47", "E", false, false, MANAGER),
                d("S48", "V", false, false, MANAGER, ADMIN), d("S48", "E", false, false, MANAGER),
                // Sensitive-data categories (data-minimised projections, never delegable)
                d("DATA_HEALTH_FULL", "V", false, false, CUSTOMER),
                d("DATA_HEALTH_TREATMENT", "V", false, false, CUSTOMER, THERAPIST),
                d("DATA_FOOD_ALLERGY", "V", false, false, CUSTOMER, FNB_STAFF),
                d("DATA_RESIDENCE", "V", false, false, RECEPTIONIST));
    }
}
