package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
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
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

/**
 * Idempotently initializes Module 6 baseline metadata on application startup:
 * 1. Roles catalogue (if missing)
 * 2. Granular permissions catalogue and baseline role-permission grants
 * 3. Default business parameters in SystemConfiguration
 */
@Component
@Order(50)
public class M6DataInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(M6DataInitializer.class);

    private final RoleRepository roleRepo;
    private final PermissionRepository permissionRepo;
    private final RolePermissionRepository rolePermissionRepo;
    private final SystemConfigurationRepository configRepo;

    public M6DataInitializer(RoleRepository roleRepo,
                             PermissionRepository permissionRepo,
                             RolePermissionRepository rolePermissionRepo,
                             SystemConfigurationRepository configRepo) {
        this.roleRepo = roleRepo;
        this.permissionRepo = permissionRepo;
        this.rolePermissionRepo = rolePermissionRepo;
        this.configRepo = configRepo;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // 1. Roles
        Map<String, Role> roles = new HashMap<>();
        for (Map.Entry<String, String> entry : PermissionCatalog.ROLE_DESCRIPTIONS.entrySet()) {
            String rName = entry.getKey();
            Role r = roleRepo.findByRoleNameIgnoreCase(rName)
                    .or(() -> roleRepo.findByRoleNameIgnoreCase("ROLE_" + rName))
                    .orElseGet(() -> roleRepo.save(new Role(rName, entry.getValue())));
            roles.put(rName, r);
            roles.put(r.canonicalName(), r);
        }

        // 2. Permission Catalogue & Default Grants
        for (PermissionCatalog.Def def : PermissionCatalog.defaults()) {
            Permission p = permissionRepo.findByModuleOrScreenAndActionType(def.module(), def.action())
                    .orElseGet(() -> permissionRepo.save(new Permission(def.module(), def.action(), def.delegable(), def.adminOnly())));

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

        // 3. Business Parameters (SystemConfiguration)
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

        log.info("HSWRMS M6 Security & Baseline Governance Initialized successfully.");
    }

    private void ensureParam(String key, String value, String type, BigDecimal min, BigDecimal max,
                             String unit, String desc, boolean managerEditable) {
        if (configRepo.findByConfigurationKey(key).isEmpty()) {
            configRepo.save(new SystemConfiguration(key, value, type, min, max, unit, desc, managerEditable));
        }
    }
}
