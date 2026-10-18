package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.ConsentRecordResponse;
import com.heavenstay.hswrms.m1identity.dto.GrantConsentRequest;
import com.heavenstay.hswrms.m1identity.entity.ConsentRecord;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class ConsentService {
    public static final String TO_SERVICE = "TO_SERVICE";
    public static final String HEALTH_DATA_PROCESSING = "HEALTH_DATA_PROCESSING";
    public static final String TO_SERVICE_POLICY_VERSION = "v1.0";
    public static final String HEALTH_DATA_POLICY_VERSION = "v1.2";
    private final UserRepository userRepository;
    private final ConsentRecordRepository consentRecordRepository;
    public ConsentService(UserRepository userRepository, ConsentRecordRepository consentRecordRepository) {
        this.userRepository = userRepository;
        this.consentRecordRepository = consentRecordRepository;
    }
    public static final class GrantResult {
        private final ConsentRecordResponse response;
        private final boolean created;
        public GrantResult(ConsentRecordResponse response, boolean created) {
            this.response = response;
            this.created = created;
        }
        public ConsentRecordResponse getResponse() { return response; }
        public boolean isCreated() { return created; }
    }
    @Transactional(readOnly = true)
    public List<ConsentRecordResponse> listMyConsents(Integer userId) {
        loadUser(userId);
        return consentRecordRepository.findByUserUserIdOrderByGrantedAtDesc(userId).stream().map(this::toResponse).toList();
    }
    @Transactional
    public GrantResult grantConsent(Integer userId, GrantConsentRequest request) {
        User user = loadUser(userId);
        String consentType = normalizeConsentType(request != null ? request.getConsentType() : null);
        Optional<ConsentRecord> active = findActive(userId, consentType);
        if (active.isPresent()) { return new GrantResult(toResponse(active.get()), false); }
        ConsentRecord saved = consentRecordRepository.save(new ConsentRecord(user, consentType, policyVersionFor(consentType)));
        return new GrantResult(toResponse(saved), true);
    }
    @Transactional
    public ConsentRecordResponse revokeConsent(Integer userId, String consentTypePath) {
        loadUser(userId);
        String consentType = normalizeConsentType(consentTypePath);
        ConsentRecord active = findActive(userId, consentType).orElseThrow(() -> new BusinessRuleException("CONSENT_NOT_ACTIVE", "No active consent for type " + consentType + "."));
        active.setConsentStatus("REVOKED");
        active.setRevokedAt(Instant.now());
        return toResponse(consentRecordRepository.save(active));
    }
    @Transactional(readOnly = true)
    public boolean hasActiveConsent(Integer userId, String consentType) {
        String n = consentType != null ? consentType.trim().toUpperCase(Locale.ROOT) : "";
        if (!TO_SERVICE.equals(n) && !HEALTH_DATA_PROCESSING.equals(n)) { return false; }
        return consentRecordRepository.hasActiveConsent(userId, n);
    }
    @Transactional(readOnly = true)
    public void requireActiveConsent(Integer userId, String consentType) {
        if (!hasActiveConsent(userId, consentType)) { throw new BusinessRuleException("HEALTH_CONSENT_REQUIRED", "Active health-data consent is required before updating the health profile."); }
    }
    private Optional<ConsentRecord> findActive(Integer userId, String consentType) {
        return consentRecordRepository.findFirstByUserUserIdAndConsentTypeOrderByGrantedAtDesc(userId, consentType).filter(r -> "GRANTED".equals(r.getConsentStatus()) && r.getRevokedAt() == null);
    }
    private String normalizeConsentType(String raw) {
        String n = raw != null ? raw.trim().toUpperCase(Locale.ROOT) : "";
        if (!TO_SERVICE.equals(n) && !HEALTH_DATA_PROCESSING.equals(n)) { throw new BusinessRuleException("CONSENT_TYPE_UNSUPPORTED", "Unsupported consent type. Allowed: TO_SERVICE, HEALTH_DATA_PROCESSING."); }
        return n;
    }
    private String policyVersionFor(String consentType) {
        return HEALTH_DATA_PROCESSING.equals(consentType) ? HEALTH_DATA_POLICY_VERSION : TO_SERVICE_POLICY_VERSION;
    }
    private User loadUser(Integer userId) {
        return userRepository.findById(userId).orElseThrow(() -> new ResourceNotFoundException("User", "userId", String.valueOf(userId)));
    }
    private ConsentRecordResponse toResponse(ConsentRecord record) {
        boolean granted = "GRANTED".equals(record.getConsentStatus());
        boolean active = granted && record.getRevokedAt() == null;
        return new ConsentRecordResponse(record.getConsentId(), record.getConsentType(), granted, record.getGrantedAt(), record.getRevokedAt(), record.getPolicyVersion(), active);
    }
}
