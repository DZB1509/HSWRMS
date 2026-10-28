package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.DeletionRequestResponse;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthDataDeletionRequest;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthDataDeletionRequestRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class HealthDataDeletionRequestServiceTest {
    @Mock private UserRepository userRepository;
    @Mock private CustomerProfileRepository customerProfileRepository;
    @Mock private HealthDataDeletionRequestRepository deletionRequestRepository;
    @InjectMocks private HealthDataDeletionRequestService service;
    private User user;
    private CustomerProfile profile;
    private Instant now;
    @BeforeEach
    void setUp() {
        now = Instant.now();
        user = new User("Jane Doe", "jane@example.com", "enc_pass");
        user.setUserId(410);
        profile = new CustomerProfile(user);
        profile.setCustomerProfileId(901);
        when(userRepository.findById(410)).thenReturn(Optional.of(user));
        when(customerProfileRepository.findByUserId(410)).thenReturn(Optional.of(profile));
        when(customerProfileRepository.findById(901)).thenReturn(Optional.of(profile));
    }

    /* ── Create ── */
    @Test
    @DisplayName("Valid HEALTH_DATA request saved with correct data; processedAt stays null")
    void create_validRequest_savesCorrectly() {
        when(deletionRequestRepository.existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(eq(901), eq(List.of("PENDING")))).thenReturn(false);
        when(deletionRequestRepository.existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(eq(901), eq(List.of("DEFERRED")))).thenReturn(false);
        HealthDataDeletionRequest saved = saved("PENDING");
        when(deletionRequestRepository.save(any(HealthDataDeletionRequest.class))).thenReturn(saved);
        DeletionRequestResponse resp = service.createDeletionRequest(410, "HEALTH_DATA");
        assertEquals(Integer.valueOf(1001), resp.getDeletionRequestId());
        assertEquals("HEALTH_DATA", resp.getRequestType());
        assertEquals("PENDING", resp.getStatus());
        assertEquals(Integer.valueOf(410), resp.getRequestedByUserId());
        assertNotNull(resp.getCreatedAt());
        assertNotNull(resp.getUpdatedAt());
        verify(deletionRequestRepository).save(org.mockito.Mockito.argThat((HealthDataDeletionRequest req) ->
                req.getCustomerProfile() == profile && req.getRequestedByUser() == user
                && "HEALTH_DATA".equals(req.getRequestType()) && "PENDING".equals(req.getRequestStatus())
                && req.getProcessedAt() == null));
    }
    @Test
    @DisplayName("Unknown request_type rejected with REQUEST_TYPE_UNSUPPORTED")
    void create_unknownType_rejected() {
        assertEquals("REQUEST_TYPE_UNSUPPORTED", assertThrows(BusinessRuleException.class,
                () -> service.createDeletionRequest(410, "HARD_DELETE")).getErrorCode());
        assertEquals("REQUEST_TYPE_UNSUPPORTED", assertThrows(BusinessRuleException.class,
                () -> service.createDeletionRequest(410, "")).getErrorCode());
        verify(deletionRequestRepository, never()).save(any());
    }
    @Test
    @DisplayName("Duplicate open PENDING request rejected with DELETION_REQUEST_ALREADY_OPEN")
    void create_duplicatePending_rejected() {
        when(deletionRequestRepository.existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(eq(901), eq(List.of("PENDING")))).thenReturn(true);
        assertEquals("DELETION_REQUEST_ALREADY_OPEN", assertThrows(ConflictException.class,
                () -> service.createDeletionRequest(410, "HEALTH_DATA")).getConflictCode());
        verify(deletionRequestRepository, never()).save(any());
    }
    @Test
    @DisplayName("Duplicate open DEFERRED request rejected with DELETION_REQUEST_ALREADY_OPEN")
    void create_duplicateDeferred_rejected() {
        when(deletionRequestRepository.existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(eq(901), eq(List.of("PENDING")))).thenReturn(false);
        when(deletionRequestRepository.existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(eq(901), eq(List.of("DEFERRED")))).thenReturn(true);
        assertEquals("DELETION_REQUEST_ALREADY_OPEN", assertThrows(ConflictException.class,
                () -> service.createDeletionRequest(410, "HEALTH_DATA")).getConflictCode());
    }
    @Test
    @DisplayName("customer_profile_id resolves from authenticated User, not caller input")
    void create_resolvesCustomerProfileFromUser() {
        when(deletionRequestRepository.existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(eq(901), anyList())).thenReturn(false);
        HealthDataDeletionRequest saved = saved("PENDING");
        when(deletionRequestRepository.save(any(HealthDataDeletionRequest.class))).thenReturn(saved);
        service.createDeletionRequest(410, "HEALTH_DATA");
        verify(customerProfileRepository).findByUserId(410);
    }
    /* ── List ── */
    @Test
    @DisplayName("Customer retrieves only their own deletion requests")
    void list_ownRequestsOnly() {
        when(customerProfileRepository.findByUserId(410)).thenReturn(Optional.of(profile));
        when(deletionRequestRepository.findActiveRequestsByCustomerProfileId(901)).thenReturn(List.of());
        List<DeletionRequestResponse> responses = service.listDeletionRequests(410);
        assertTrue(responses.isEmpty());
        verify(deletionRequestRepository).findActiveRequestsByCustomerProfileId(901);
    }
    private HealthDataDeletionRequest saved(String status) {
        HealthDataDeletionRequest r = new HealthDataDeletionRequest(profile, user, "HEALTH_DATA");
        r.setDeletionRequestId(1001);
        r.setRequestStatus(status);
        r.setRequestedAt(now);
        r.setUpdatedAt(now);
        return r;
    }

    /* ── Cancel ── */
    @Test
    @DisplayName("PENDING request can be cancelled")
    void cancel_pending_cancelled() {
        HealthDataDeletionRequest req = saved("PENDING");
        when(customerProfileRepository.findByUserId(410)).thenReturn(Optional.of(profile));
        when(deletionRequestRepository.findByDeletionRequestIdAndCustomerProfileCustomerProfileId(1001, 901)).thenReturn(Optional.of(req));
        HealthDataDeletionRequest updated = saved("CANCELLED");
        updated.setUpdatedAt(now.plusSeconds(1));
        when(deletionRequestRepository.save(any(HealthDataDeletionRequest.class))).thenReturn(updated);
        DeletionRequestResponse resp = service.cancelDeletionRequest(410, 1001);
        assertEquals("CANCELLED", resp.getStatus());
    }
    @Test
    @DisplayName("DEFERRED request can be cancelled")
    void cancel_deferred_cancelled() {
        HealthDataDeletionRequest req = saved("DEFERRED");
        when(customerProfileRepository.findByUserId(410)).thenReturn(Optional.of(profile));
        when(deletionRequestRepository.findByDeletionRequestIdAndCustomerProfileCustomerProfileId(1001, 901)).thenReturn(Optional.of(req));
        HealthDataDeletionRequest updated = saved("CANCELLED");
        updated.setUpdatedAt(now.plusSeconds(1));
        when(deletionRequestRepository.save(any(HealthDataDeletionRequest.class))).thenReturn(updated);
        assertEquals("CANCELLED", service.cancelDeletionRequest(410, 1001).getStatus());
    }
    @Test
    @DisplayName("Already-cancelled request is idempotent (no re-save)")
    void cancel_alreadyCancelled_idempotent() {
        HealthDataDeletionRequest req = saved("CANCELLED");
        when(customerProfileRepository.findByUserId(410)).thenReturn(Optional.of(profile));
        when(deletionRequestRepository.findByDeletionRequestIdAndCustomerProfileCustomerProfileId(1001, 901)).thenReturn(Optional.of(req));
        assertEquals("CANCELLED", service.cancelDeletionRequest(410, 1001).getStatus());
        verify(deletionRequestRepository, never()).save(any());
    }
    @Test
    @DisplayName("COMPLETED request rejected with DELETION_REQUEST_NOT_CANCELLABLE")
    void cancel_completed_rejected() {
        HealthDataDeletionRequest req = saved("COMPLETED");
        when(customerProfileRepository.findByUserId(410)).thenReturn(Optional.of(profile));
        when(deletionRequestRepository.findByDeletionRequestIdAndCustomerProfileCustomerProfileId(1001, 901)).thenReturn(Optional.of(req));
        assertEquals("DELETION_REQUEST_NOT_CANCELLABLE", assertThrows(ConflictException.class,
                () -> service.cancelDeletionRequest(410, 1001)).getConflictCode());
        verify(deletionRequestRepository, never()).save(any());
    }
    @Test
    @DisplayName("Cancelling another Customer's request returns 404 (no existence disclosure)")
    void cancel_notOwned_notFound() {
        when(customerProfileRepository.findByUserId(410)).thenReturn(Optional.of(profile));
        when(deletionRequestRepository.findByDeletionRequestIdAndCustomerProfileCustomerProfileId(1001, 901)).thenReturn(Optional.empty());
        ResourceNotFoundException ex = assertThrows(ResourceNotFoundException.class,
                () -> service.cancelDeletionRequest(410, 1001));
        assertEquals("HealthDataDeletionRequest", ex.getResourceName());
        assertEquals("deletionRequestId", ex.getFieldName());
    }
    @Test
    @DisplayName("Request never marked COMPLETED; processedAt stays null")
    void requestNeverCompleted_processedAtNull() {
        when(deletionRequestRepository.existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(eq(901), anyList())).thenReturn(false);
        HealthDataDeletionRequest saved = saved("PENDING");
        when(deletionRequestRepository.save(any(HealthDataDeletionRequest.class))).thenReturn(saved);
        DeletionRequestResponse createResp = service.createDeletionRequest(410, "HEALTH_DATA");
        assertEquals("PENDING", createResp.getStatus());
        assertNotNull(createResp.getCreatedAt());
        assertNotNull(createResp.getUpdatedAt());
        HealthDataDeletionRequest cancelled = saved("CANCELLED");
        when(deletionRequestRepository.findByDeletionRequestIdAndCustomerProfileCustomerProfileId(1001, 901)).thenReturn(Optional.of(cancelled));
        when(deletionRequestRepository.save(any(HealthDataDeletionRequest.class))).thenReturn(cancelled);
        DeletionRequestResponse cancelResp = service.cancelDeletionRequest(410, 1001);
        assertEquals("CANCELLED", cancelResp.getStatus());
        assertNotEquals("COMPLETED", cancelResp.getStatus());
        assertNull(cancelled.getProcessedAt(), "processedAt must remain null — no execution performed");
    }
}