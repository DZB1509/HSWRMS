package com.heavenstay.hswrms.m1identity.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.dto.ConsentRecordResponse;
import com.heavenstay.hswrms.m1identity.dto.GrantConsentRequest;
import com.heavenstay.hswrms.m1identity.entity.ConsentRecord;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.ConsentRecordRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ConsentServiceTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private ConsentRecordRepository consentRecordRepository;
    @InjectMocks
    private ConsentService consentService;
    private User user(Integer userId) {
        User user = new User("Jane Doe", "jane@example.com", "hash");
        user.setUserId(userId);
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        return user;
    }
    private GrantConsentRequest grantRequest(String type) {
        GrantConsentRequest request = new GrantConsentRequest();
        request.setConsentType(type);
        return request;
    }
    @Test
    @DisplayName("Grant creates a new record with the server policy version")
    void grant_createsWithServerPolicyVersion() {
        User user = user(205);
        when(userRepository.findById(205)).thenReturn(Optional.of(user));
        when(consentRecordRepository.findFirstByUserUserIdAndConsentTypeOrderByGrantedAtDesc(205, "HEALTH_DATA_PROCESSING")).thenReturn(Optional.empty());
        when(consentRecordRepository.save(any(ConsentRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ConsentService.GrantResult result = consentService.grantConsent(205, grantRequest("health_data_processing"));
        assertTrue(result.isCreated());
        assertEquals("HEALTH_DATA_PROCESSING", result.getResponse().getConsentType());
        assertEquals("v1.2", result.getResponse().getPolicyVersion());
        assertTrue(result.getResponse().isActive());
    }
    @Test
    @DisplayName("Grant is idempotent when an active record already exists")
    void grant_returnsExistingWhenActive() {
        User user = user(205);
        ConsentRecord active = new ConsentRecord(user, "TO_SERVICE", "v1.0");
        when(userRepository.findById(205)).thenReturn(Optional.of(user));
        when(consentRecordRepository.findFirstByUserUserIdAndConsentTypeOrderByGrantedAtDesc(205, "TO_SERVICE")).thenReturn(Optional.of(active));
        ConsentService.GrantResult result = consentService.grantConsent(205, grantRequest("TO_SERVICE"));
        assertFalse(result.isCreated());
        assertEquals("v1.0", result.getResponse().getPolicyVersion());
    }
    @Test
    @DisplayName("Unknown consent type is rejected")
    void grant_rejectsUnknownType() {
        when(userRepository.findById(205)).thenReturn(Optional.of(user(205)));
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> consentService.grantConsent(205, grantRequest("MARKETING")));
        assertEquals("CONSENT_TYPE_UNSUPPORTED", ex.getErrorCode());
    }
    @Test
    @DisplayName("Revoke closes the active record")
    void revoke_closesActive() {
        User user = user(205);
        ConsentRecord active = new ConsentRecord(user, "HEALTH_DATA_PROCESSING", "v1.2");
        when(userRepository.findById(205)).thenReturn(Optional.of(user));
        when(consentRecordRepository.findFirstByUserUserIdAndConsentTypeOrderByGrantedAtDesc(205, "HEALTH_DATA_PROCESSING")).thenReturn(Optional.of(active));
        when(consentRecordRepository.save(any(ConsentRecord.class))).thenAnswer(invocation -> invocation.getArgument(0));
        ConsentRecordResponse revoked = consentService.revokeConsent(205, "HEALTH_DATA_PROCESSING");
        assertFalse(revoked.isGranted());
        assertFalse(revoked.isActive());
        verify(consentRecordRepository).save(active);
    }
    @Test
    @DisplayName("Health guard reflects active-consent state")
    void guard_reflectsActiveState() {
        when(consentRecordRepository.hasActiveConsent(205, "HEALTH_DATA_PROCESSING")).thenReturn(true);
        assertTrue(consentService.hasActiveConsent(205, "HEALTH_DATA_PROCESSING"));
        when(consentRecordRepository.hasActiveConsent(205, "HEALTH_DATA_PROCESSING")).thenReturn(false);
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> consentService.requireActiveConsent(205, "HEALTH_DATA_PROCESSING"));
        assertEquals("HEALTH_CONSENT_REQUIRED", ex.getErrorCode());
    }
    @Test
    @DisplayName("List returns the caller history")
    void list_returnsHistory() {
        User user = user(205);
        ConsentRecord record = new ConsentRecord(user, "TO_SERVICE", "v1.0");
        when(userRepository.findById(205)).thenReturn(Optional.of(user));
        when(consentRecordRepository.findByUserUserIdOrderByGrantedAtDesc(205)).thenReturn(List.of(record));
        List<ConsentRecordResponse> history = consentService.listMyConsents(205);
        assertEquals(1, history.size());
        assertEquals("TO_SERVICE", history.get(0).getConsentType());
    }
}
