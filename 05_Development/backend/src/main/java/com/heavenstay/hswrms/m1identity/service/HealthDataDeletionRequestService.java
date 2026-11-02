package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.DeletionRequestResponse;
import com.heavenstay.hswrms.m1identity.entity.HealthDataDeletionRequest;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthDataDeletionRequestRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

/**
 * Service for health data deletion request lifecycle (API_CONTRACT.md §5.4).
 *
 * <p>All operations are scoped to the authenticated customer's own
 * {@link CustomerProfile}. Identity is resolved from the JWT principal via the
 * userId; no caller-supplied customer ID is ever trusted for authorization.
 *
 * <p>Actual deletion/anonymization execution is OUT OF M1 scope. The record
 * lifecycle is: create PENDING → read status → cancel while PENDING/DEFERRED.
 * The request is never marked COMPLETED and processedAt is never set by M1.
 */
@Service
public class HealthDataDeletionRequestService {

    public static final String REQUEST_TYPE_HEALTH_DATA = "HEALTH_DATA";
    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_DEFERRED = "DEFERRED";
    public static final String STATUS_COMPLETED = "COMPLETED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    private final UserRepository userRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final HealthDataDeletionRequestRepository deletionRequestRepository;

    public HealthDataDeletionRequestService(UserRepository userRepository,
                                            CustomerProfileRepository customerProfileRepository,
                                            HealthDataDeletionRequestRepository deletionRequestRepository) {
        this.userRepository = userRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.deletionRequestRepository = deletionRequestRepository;
    }

    @Transactional
    public DeletionRequestResponse createDeletionRequest(Integer userId, String requestType) {
        User user = loadUser(userId);
        Integer customerProfileId = resolveCustomerProfileId(userId);

        String normalizedType = normalizeRequestType(requestType);

        // Duplicate-open protection: an open (PENDING or DEFERRED) request
        // already exists for this customer → 409 DELETION_REQUEST_ALREADY_OPEN.
        if (deletionRequestRepository.existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(
                customerProfileId, java.util.Collections.singletonList(STATUS_PENDING))) {
            throw new ConflictException("DELETION_REQUEST_ALREADY_OPEN",
                    "An open deletion request already exists for this customer.");
        }
        if (deletionRequestRepository.existsByCustomerProfileCustomerProfileIdAndRequestStatusIn(
                customerProfileId, java.util.Collections.singletonList(STATUS_DEFERRED))) {
            throw new ConflictException("DELETION_REQUEST_ALREADY_OPEN",
                    "An open deletion request already exists for this customer.");
        }

        HealthDataDeletionRequest request = new HealthDataDeletionRequest(
                loadCustomerProfile(customerProfileId), user, normalizedType);
        HealthDataDeletionRequest saved = deletionRequestRepository.save(request);

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<DeletionRequestResponse> listDeletionRequests(Integer userId) {
        Integer customerProfileId = resolveCustomerProfileId(userId);
        List<HealthDataDeletionRequest> requests =
                deletionRequestRepository.findActiveRequestsByCustomerProfileId(customerProfileId);
        return requests.stream().map(this::toResponse).toList();
    }

    @Transactional
    public DeletionRequestResponse cancelDeletionRequest(Integer userId, Integer deletionRequestId) {
        Integer customerProfileId = resolveCustomerProfileId(userId);

        // Ownership enforced in the query: not found by ID + customerProfileId
        // → 404 (no existence disclosure to other users).
        HealthDataDeletionRequest request = deletionRequestRepository
                .findByDeletionRequestIdAndCustomerProfileCustomerProfileId(deletionRequestId, customerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "HealthDataDeletionRequest", "deletionRequestId", String.valueOf(deletionRequestId)));

        String status = request.getRequestStatus();

        if (STATUS_CANCELLED.equals(status)) {
            // Idempotent: cancelling an already-cancelled request → 200.
            return toResponse(request);
        }

        if (STATUS_COMPLETED.equals(status)) {
            throw new ConflictException("DELETION_REQUEST_NOT_CANCELLABLE",
                    "A completed deletion request cannot be cancelled.");
        }

        if (STATUS_PENDING.equals(status) || STATUS_DEFERRED.equals(status)) {
            request.setRequestStatus(STATUS_CANCELLED);
            HealthDataDeletionRequest saved = deletionRequestRepository.save(request);
            return toResponse(saved);
        }

        // Any other status is not cancellable.
        throw new ConflictException("DELETION_REQUEST_NOT_CANCELLABLE",
                "Deletion request in status '" + status + "' cannot be cancelled.");
    }

    private User loadUser(Integer userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "userId", String.valueOf(userId)));
    }

    private Integer resolveCustomerProfileId(Integer userId) {
        return customerProfileRepository.findByUserId(userId)
                .map(com.heavenstay.hswrms.m1identity.entity.CustomerProfile::getCustomerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "CustomerProfile", "userId", String.valueOf(userId)));
    }

    private com.heavenstay.hswrms.m1identity.entity.CustomerProfile loadCustomerProfile(Integer customerProfileId) {
        return customerProfileRepository.findById(customerProfileId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "CustomerProfile", "customerProfileId", String.valueOf(customerProfileId)));
    }

    private String normalizeRequestType(String raw) {
        String n = raw != null ? raw.trim() : "";
        if (!REQUEST_TYPE_HEALTH_DATA.equals(n)) {
            throw new BusinessRuleException("REQUEST_TYPE_UNSUPPORTED",
                    "Unsupported request type. Allowed: HEALTH_DATA.");
        }
        return n;
    }

    private DeletionRequestResponse toResponse(HealthDataDeletionRequest r) {
        return new DeletionRequestResponse(
                r.getDeletionRequestId(),
                r.getRequestType(),
                r.getRequestStatus(),
                r.getRequestedByUser().getUserId(),
                r.getRequestedAt(),
                r.getUpdatedAt()
        );
    }
}