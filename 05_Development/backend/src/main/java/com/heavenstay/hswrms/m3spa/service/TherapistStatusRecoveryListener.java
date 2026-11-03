package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.service.event.TherapistStatusChangedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Event listener that orchestrates automatic recovery when a therapist becomes unavailable (BR-M3-13).
 *
 * When a therapist transitions to INACTIVE or SUSPENDED, this listener scans for all active upcoming
 * sessions assigned to that therapist and automatically executes the same-time recovery workflow:
 * 1. Rematches to an alternative qualified therapist and compatible room at the exact same interval if available.
 * 2. If no same-time replacement exists, transitions the session to RESCHEDULING awaiting Customer consent.
 */
@Component
public class TherapistStatusRecoveryListener {

    private static final Logger log = LoggerFactory.getLogger(TherapistStatusRecoveryListener.class);

    private final SpaSessionRepository sessionRepository;
    private final SessionRecoveryService sessionRecoveryService;

    public TherapistStatusRecoveryListener(SpaSessionRepository sessionRepository,
                                           SessionRecoveryService sessionRecoveryService) {
        this.sessionRepository = sessionRepository;
        this.sessionRecoveryService = sessionRecoveryService;
    }

    @EventListener
    public void onTherapistStatusChanged(TherapistStatusChangedEvent event) {
        if (event == null) {
            return;
        }

        TherapistStatus newStatus = event.getNewStatus();
        if (newStatus != TherapistStatus.INACTIVE && newStatus != TherapistStatus.SUSPENDED) {
            log.debug("Therapist #{} status is {}; automatic recovery not triggered.",
                    event.getTherapistId(), newStatus);
            return;
        }

        LocalDateTime scanTime = event.getTimestamp() != null ? event.getTimestamp() : LocalDateTime.now();
        List<SpaSession> affectedSessions = sessionRepository.findActiveUpcomingSessionsByTherapist(
                event.getTherapistId(), scanTime);

        log.info("[AUTOMATED RECOVERY ORCHESTRATION] Therapist #{} status transitioned to {} (reason: '{}'). Found {} active upcoming session(s) requiring recovery.",
                event.getTherapistId(), newStatus, event.getReason(), affectedSessions.size());

        for (SpaSession session : affectedSessions) {
            try {
                log.info("[AUTOMATED RECOVERY ORCHESTRATION] Invoking attemptSameTimeRecovery for SpaSession #{}", session.getSpaSessionId());
                RecoveryResultDto result = sessionRecoveryService.attemptSameTimeRecovery(session.getSpaSessionId(), true);
                log.info("[AUTOMATED RECOVERY ORCHESTRATION] Recovery completed for SpaSession #{}: recovered={}, preservedTime={}, consentRequired={}, message='{}'",
                        session.getSpaSessionId(), result.isRecovered(), result.isPreservedSameTime(), result.isRequiresCustomerConsent(), result.getMessage());
            } catch (Exception ex) {
                log.error("[AUTOMATED RECOVERY ORCHESTRATION] Error attempting recovery for SpaSession #{}: {}",
                        session.getSpaSessionId(), ex.getMessage(), ex);
            }
        }
    }
}
