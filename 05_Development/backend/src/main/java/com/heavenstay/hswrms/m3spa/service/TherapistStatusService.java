package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m3spa.service.event.TherapistStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Service managing therapist lifecycle and operational statuses (BR-M3-13).
 *
 * When a therapist's status transitions to INACTIVE or SUSPENDED, publishes
 * a TherapistStatusChangedEvent to trigger automated same-time recovery of affected sessions.
 */
@Service
@Transactional
public class TherapistStatusService {

    private static final Logger log = LoggerFactory.getLogger(TherapistStatusService.class);

    private final TherapistRepository therapistRepository;
    private final ApplicationEventPublisher eventPublisher;

    public TherapistStatusService(TherapistRepository therapistRepository,
                                  ApplicationEventPublisher eventPublisher) {
        this.therapistRepository = therapistRepository;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Updates a therapist's status and publishes an event if the status has changed.
     *
     * @param therapistId the therapist ID
     * @param newStatus the target TherapistStatus
     * @param reason operational explanation
     * @return the updated Therapist entity
     */
    public Therapist updateTherapistStatus(Integer therapistId, TherapistStatus newStatus, String reason) {
        if (therapistId == null) {
            throw new IllegalArgumentException("Therapist ID cannot be null");
        }
        if (newStatus == null) {
            throw new IllegalArgumentException("Target TherapistStatus cannot be null");
        }

        Therapist therapist = therapistRepository.findByIdWithLock(therapistId)
                .orElseThrow(() -> new ResourceNotFoundException("Therapist", "therapistId", therapistId));

        TherapistStatus previousStatus = therapist.getTherapistStatus();
        if (previousStatus == newStatus) {
            log.info("Therapist #{} status is already {}; no-op update.", therapistId, newStatus);
            return therapist;
        }

        therapist.setTherapistStatus(newStatus);
        Therapist saved = therapistRepository.save(therapist);

        log.info("Therapist #{} status changed from {} to {}. Reason: '{}'",
                therapistId, previousStatus, newStatus, reason);

        eventPublisher.publishEvent(new TherapistStatusChangedEvent(
                therapistId, previousStatus, newStatus, reason, LocalDateTime.now()
        ));

        return saved;
    }
}

