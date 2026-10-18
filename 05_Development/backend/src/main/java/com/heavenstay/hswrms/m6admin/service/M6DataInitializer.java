package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserAccountRepository;
import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.m3spa.entity.TreatmentStatus;
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

        // 0. Consolidate redundant role_id 10 (FNB_STAFF) to canonical role_id 4 (F&B Staff)
        try {
            jdbc.execute("""
                IF EXISTS (SELECT 1 FROM dbo.[Role] WHERE role_id = 10 OR (role_name = 'FNB_STAFF' AND role_id <> 4))
                BEGIN
                    DECLARE @redundantRoleId INT;
                    SELECT TOP 1 @redundantRoleId = role_id FROM dbo.[Role] WHERE role_id = 10 OR (role_name = 'FNB_STAFF' AND role_id <> 4);

                    -- 1. Migrate UserRole: remove duplicates then update to role 4
                    DELETE FROM dbo.UserRole 
                    WHERE role_id = @redundantRoleId 
                      AND user_id IN (SELECT user_id FROM dbo.UserRole WHERE role_id = 4);

                    UPDATE dbo.UserRole 
                    SET role_id = 4 
                    WHERE role_id = @redundantRoleId;

                    -- 2. Migrate RolePermission: remove duplicates then update to role 4
                    IF OBJECT_ID(N'dbo.RolePermission', N'U') IS NOT NULL
                    BEGIN
                        DELETE FROM dbo.RolePermission 
                        WHERE role_id = @redundantRoleId 
                          AND permission_id IN (SELECT permission_id FROM dbo.RolePermission WHERE role_id = 4);

                        UPDATE dbo.RolePermission 
                        SET role_id = 4 
                        WHERE role_id = @redundantRoleId;
                    END

                    -- 3. Delete redundant role
                    DELETE FROM dbo.[Role] WHERE role_id = @redundantRoleId;
                END
            """);
        } catch (Exception ex) {
            log.debug("Consolidation of FNB_STAFF role skipped or not applicable: {}", ex.getMessage());
        }

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

        // 4. Default Accounts (HSWRMS Baseline: exactly 1 Admin, 1 Manager, 1 Receptionist, 1 Therapist, 1 F&B Staff)
        try {
            // Ensure AuditLog columns exist in SQL Server if running on existing database
            jdbc.execute("""
                IF OBJECT_ID(N'dbo.AuditLog', N'U') IS NOT NULL
                BEGIN
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'actor_role')
                        ALTER TABLE dbo.AuditLog ADD actor_role VARCHAR(50) NULL;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'target_ref_id')
                        ALTER TABLE dbo.AuditLog ADD target_ref_id VARCHAR(100) NULL;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'old_value')
                        ALTER TABLE dbo.AuditLog ADD old_value NVARCHAR(500) NULL;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'new_value')
                        ALTER TABLE dbo.AuditLog ADD new_value NVARCHAR(500) NULL;
                    IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID(N'dbo.AuditLog') AND name = 'delegation_id')
                        ALTER TABLE dbo.AuditLog ADD delegation_id INT NULL;
                END
            """);
        } catch (Exception ex) {
            log.debug("AuditLog column migration skipped or already applied: {}", ex.getMessage());
        }

        try {
            // Purge duplicate .dev staff accounts if they exist in the DB, keeping only official @heavenstay.com staff
            jdbc.update("DELETE FROM dbo.UserRole WHERE user_id IN (SELECT user_id FROM dbo.[User] WHERE email IN ('admin@heavenstay.dev', 'manager@heavenstay.dev', 'receptionist@heavenstay.dev', 'therapist@heavenstay.dev', 'fbstaff@heavenstay.dev'))");
            jdbc.update("DELETE FROM dbo.[User] WHERE email IN ('admin@heavenstay.dev', 'manager@heavenstay.dev', 'receptionist@heavenstay.dev', 'therapist@heavenstay.dev', 'fbstaff@heavenstay.dev')");
        } catch (Exception ex) {
            log.debug("Purge of redundant dev staff accounts skipped: {}", ex.getMessage());
        }

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
                        "Aromatherapy Deep Relaxation", 60, new BigDecimal("85.00"), TreatmentStatus.ACTIVE.name());
                jdbc.update("insert into SpaTreatment (treatment_name, duration_minutes, base_price, treatment_status) values (?, ?, ?, ?)",
                        "Himalayan Salt Stone Therapy", 90, new BigDecimal("120.00"), TreatmentStatus.ACTIVE.name());
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
