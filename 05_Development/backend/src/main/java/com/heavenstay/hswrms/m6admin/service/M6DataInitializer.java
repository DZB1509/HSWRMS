package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserAccountRepository;
import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.m6admin.entity.Permission;
import com.heavenstay.hswrms.m6admin.entity.RolePermission;
import com.heavenstay.hswrms.m6admin.entity.SystemConfiguration;
import com.heavenstay.hswrms.m6admin.repository.PermissionRepository;
import com.heavenstay.hswrms.m6admin.repository.RolePermissionRepository;
import com.heavenstay.hswrms.m6admin.repository.SystemConfigurationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
public class M6DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(M6DataInitializer.class);

    private final IdentityAccountService identity;
    private final RoleRepository roleRepo;
    private final UserAccountRepository userRepo;
    private final PermissionRepository permissionRepo;
    private final RolePermissionRepository rolePermissionRepo;
    private final SystemConfigurationRepository configRepo;
    private final JdbcTemplate jdbc;

    public M6DataInitializer(IdentityAccountService identity, RoleRepository roleRepo,
                             UserAccountRepository userRepo, PermissionRepository permissionRepo,
                             RolePermissionRepository rolePermissionRepo,
                             SystemConfigurationRepository configRepo, JdbcTemplate jdbc) {
        this.identity = identity;
        this.roleRepo = roleRepo;
        this.userRepo = userRepo;
        this.permissionRepo = permissionRepo;
        this.rolePermissionRepo = rolePermissionRepo;
        this.configRepo = configRepo;
        this.jdbc = jdbc;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("Initializing HSWRMS M6 Security & Master Data Baseline...");

        // 1. Roles
        Map<String, Role> roles = new HashMap<>();
        for (Map.Entry<String, String> entry : PermissionCatalog.ROLE_DESCRIPTIONS.entrySet()) {
            roles.put(entry.getKey(), identity.ensureRole(entry.getKey(), entry.getValue()));
        }

        // 2. Permissions
        Map<String, Permission> permByCode = new HashMap<>();
        for (PermissionCatalog.Def def : PermissionCatalog.defaults()) {
            Permission p = permissionRepo.findByModuleOrScreenAndActionType(def.module(), def.action())
                    .orElseGet(() -> permissionRepo.save(new Permission(def.module(), def.action(), def.delegable(), def.adminOnly())));
            permByCode.put(p.code(), p);

            // Seed default role permissions if not existing
            for (String rName : def.roles()) {
                Role r = roles.get(rName);
                if (r != null) {
                    RolePermission.Id id = new RolePermission.Id(r.getRoleId(), p.getPermissionId());
                    if (!rolePermissionRepo.existsById(id)) {
                        rolePermissionRepo.save(new RolePermission(id.getRoleId(), id.getPermissionId()));
                    }
                }
            }
        }

        // 3. Business Parameters
        ensureParam(BusinessParameterService.CANCELLATION_WINDOW_HOURS, "48", "INT",
                new BigDecimal("0"), new BigDecimal("720"), "Hours", "Booking cancellation deadline window", true);
        ensureParam(BusinessParameterService.REFUND_PERCENTAGE, "80", "INT",
                new BigDecimal("0"), new BigDecimal("100"), "Percent", "Default refund percentage on timely cancellation", true);
        ensureParam(BusinessParameterService.DEPOSIT_PERCENTAGE, "30", "INT",
                new BigDecimal("10"), new BigDecimal("100"), "Percent", "Required deposit percentage for retreat packages", true);
        ensureParam(BusinessParameterService.MAX_FAILED_LOGIN_ATTEMPTS, "5", "INT",
                new BigDecimal("3"), new BigDecimal("10"), "Attempts", "Consecutive failed sign-ins before locking account", false);
        ensureParam(BusinessParameterService.LOCKOUT_DURATION_MINUTES, "10", "INT",
                new BigDecimal("5"), new BigDecimal("60"), "Minutes", "Account lockout duration before JOB-01 unlock", false);
        ensureParam(BusinessParameterService.AUDIT_LOG_RETENTION_DAYS, "90", "INT",
                new BigDecimal("30"), new BigDecimal("365"), "Days", "Audit log retention duration before JOB-02 purge", false);

        // 4. Default Accounts
        ensureAccount("admin@heavenstay.com", "System Admin", "0900000001", roles.get(Role.ADMIN), "Admin@123456");
        ensureAccount("manager@heavenstay.com", "Resort Manager", "0900000002", roles.get(Role.MANAGER), "Manager@123456");
        ensureAccount("receptionist@heavenstay.com", "Front Desk Receptionist", "0900000003", roles.get(Role.RECEPTIONIST), "Staff@123456");
        ensureAccount("therapist@heavenstay.com", "Lead Therapist", "0900000004", roles.get(Role.THERAPIST), "Staff@123456");
        ensureAccount("fnb@heavenstay.com", "Executive Chef", "0900000005", roles.get(Role.FNB_STAFF), "Staff@123456");

        // 5. Sample Master Data (for S12)
        try {
            Integer villaCount = jdbc.queryForObject("select count(*) from VillaCategory", Integer.class);
            if (villaCount == null || villaCount == 0) {
                jdbc.update("insert into VillaCategory (category_name, max_occupancy, price_modifier, category_status) values (?, ?, ?, ?)",
                        "Ocean Pool Villa", 2, new BigDecimal("0.00"), "ACTIVE");
                jdbc.update("insert into VillaCategory (category_name, max_occupancy, price_modifier, category_status) values (?, ?, ?, ?)",
                        "Mountain Sanctuary Villa", 4, new BigDecimal("150.00"), "ACTIVE");
            }

            Integer spaCount = jdbc.queryForObject("select count(*) from SpaTreatment", Integer.class);
            if (spaCount == null || spaCount == 0) {
                jdbc.update("insert into SpaTreatment (treatment_name, duration_minutes, base_price, treatment_status) values (?, ?, ?, ?)",
                        "Aromatherapy Deep Relaxation", 60, new BigDecimal("85.00"), "ACTIVE");
                jdbc.update("insert into SpaTreatment (treatment_name, duration_minutes, base_price, treatment_status) values (?, ?, ?, ?)",
                        "Himalayan Salt Stone Therapy", 90, new BigDecimal("120.00"), "ACTIVE");
            }

            Integer packageCount = jdbc.queryForObject("select count(*) from RetreatPackage", Integer.class);
            if (packageCount == null || packageCount == 0) {
                jdbc.update("insert into RetreatPackage (package_name, wellness_goal, duration_nights, base_price, package_status) values (?, ?, ?, ?, ?)",
                        "Holistic Detox & Rebalance", "Detoxification & Stress Relief", 3, new BigDecimal("650.00"), "ACTIVE");
                jdbc.update("insert into RetreatPackage (package_name, wellness_goal, duration_nights, base_price, package_status) values (?, ?, ?, ?, ?)",
                        "Mindfulness & Yoga Immersion", "Mental Clarity & Flexibility", 5, new BigDecimal("1100.00"), "ACTIVE");
            }
        } catch (Exception ex) {
            log.debug("Master data seeding skipped or tables not yet ready: {}", ex.getMessage());
        }

        log.info("HSWRMS M6 Security & Master Data Baseline Initialized successfully.");
    }

    private void ensureParam(String key, String value, String type, BigDecimal min, BigDecimal max,
                             String unit, String desc, boolean managerEditable) {
        if (configRepo.findByConfigurationKey(key).isEmpty()) {
            configRepo.save(new SystemConfiguration(key, value, type, min, max, unit, desc, managerEditable));
        }
    }

    private void ensureAccount(String email, String name, String phone, Role role, String rawPassword) {
        if (userRepo.findByEmailIgnoreCase(email).isEmpty()) {
            identity.createStaff(name, email, phone, role, rawPassword);
            log.info("Seeded default account: {} ({})", email, role.getRoleName());
        }
    }
}
