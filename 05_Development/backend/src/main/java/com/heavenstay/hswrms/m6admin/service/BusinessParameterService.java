package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.ParameterView;
import com.heavenstay.hswrms.m6admin.entity.SystemConfiguration;
import com.heavenstay.hswrms.m6admin.repository.SystemConfigurationRepository;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.ZoneOffset;
import java.util.List;

/**
 * FR-M6-03 / UC77 – approved business parameters. Values only apply to future transactions (GB-M6-03);
 * nothing is recalculated here.
 */
@Service
public class BusinessParameterService {

    public static final String CANCELLATION_WINDOW_HOURS = "cancellation_window_hours";
    public static final String REFUND_PERCENTAGE = "refund_percentage";
    public static final String DEPOSIT_PERCENTAGE = "deposit_percentage";
    public static final String MAX_FAILED_LOGIN_ATTEMPTS = "max_failed_login_attempts";
    public static final String LOCKOUT_DURATION_MINUTES = "lockout_duration_minutes";
    public static final String AUDIT_LOG_RETENTION_DAYS = "audit_log_retention_days";

    private final SystemConfigurationRepository repository;
    private final AuditLogService audit;
    private final PermissionService permissionService;

    public BusinessParameterService(SystemConfigurationRepository repository,
                                    AuditLogService audit,
                                    PermissionService permissionService) {
        this.repository = repository;
        this.audit = audit;
        this.permissionService = permissionService;
    }

    @Transactional(readOnly = true)
    public List<ParameterView> list() {
        return repository.findByConfigurationTypeOrderByConfigurationKeyAsc(SystemConfiguration.TYPE_BUSINESS_PARAMETER)
                .stream().map(BusinessParameterService::toView).toList();
    }

    /** Safe numeric read used by other modules; falls back to the supplied default if missing/invalid. */
    @Transactional(readOnly = true)
    public int getInt(String key, int defaultValue) {
        return repository.findByConfigurationKey(key)
                .map(SystemConfiguration::getConfigurationValue)
                .map(v -> {
                    try {
                        return new BigDecimal(v.trim()).intValueExact();
                    } catch (RuntimeException ex) {
                        return defaultValue;
                    }
                })
                .orElse(defaultValue);
    }

    @Transactional
    public ParameterView update(String key, String rawValue, CurrentActor actor) {
        SystemConfiguration config = repository.findByConfigurationKey(key)
                .filter(c -> SystemConfiguration.TYPE_BUSINESS_PARAMETER.equals(c.getConfigurationType()))
                .orElseThrow(() -> new ResourceNotFoundException("Business parameter", "key", key));

        if (!actor.admin()) {
            if (permissionService == null || !permissionService.userHas(actor.userId(), "S50", "U")) {
                audit.record(actor, "Update Business Parameter", "SystemConfiguration", key, AuditLogService.DENIED);
                throw new org.springframework.security.access.AccessDeniedException(
                        "Updating business parameters requires delegated S50:U permission.");
            }
            if (!config.isManagerEditable()) {
                audit.record(actor, "Update Business Parameter", "SystemConfiguration", key, AuditLogService.DENIED);
                throw new org.springframework.security.access.AccessDeniedException(
                        "This parameter is not covered by the delegated rights.");
            }
        }

        String normalized;
        try {
            normalized = validate(config, rawValue);
        } catch (BusinessRuleException ex) {
            audit.record(actor, "Update Business Parameter", "SystemConfiguration", key,
                    AuditLogService.FAILED, config.getConfigurationValue(), rawValue);
            throw ex;
        }
        String oldValue = config.getConfigurationValue();
        if (!normalized.equals(oldValue)) {
            config.update(normalized, actor.userId());
            repository.save(config);
            audit.record(actor, "Update Business Parameter", "SystemConfiguration", key,
                    AuditLogService.SUCCESS, oldValue, normalized);
        }
        return toView(config);
    }

    private String validate(SystemConfiguration config, String raw) {
        BigDecimal number;
        try {
            number = new BigDecimal(raw == null ? "" : raw.trim());
        } catch (NumberFormatException ex) {
            throw new BusinessRuleException("M6-MSG-04", "Value is outside the allowed range.");
        }
        if ("INT".equals(config.getValueType()) && number.stripTrailingZeros().scale() > 0) {
            throw new BusinessRuleException("M6-MSG-04", "Value is outside the allowed range.");
        }
        if ((config.getMinValue() != null && number.compareTo(config.getMinValue()) < 0)
                || (config.getMaxValue() != null && number.compareTo(config.getMaxValue()) > 0)) {
            throw new BusinessRuleException("M6-MSG-04", "Value is outside the allowed range.");
        }
        return "INT".equals(config.getValueType())
                ? number.toBigInteger().toString()
                : number.stripTrailingZeros().toPlainString();
    }

    private static ParameterView toView(SystemConfiguration c) {
        return new ParameterView(c.getConfigurationKey(), c.getConfigurationValue(), c.getValueType(),
                c.getMinValue(), c.getMaxValue(), c.getUnit(), c.getDescription(), c.isManagerEditable(),
                c.getConfigurationStatus(), c.getUpdatedAt().toInstant(ZoneOffset.UTC));
    }
}
