package com.heavenstay.hswrms.m3spa.scheduler;

import com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.service.SessionRecoveryService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Background recovery sweep scheduler for BR-M3-13.
 *
 * Ensures durable crash resilience: If the application restarts, crashes, or an in-memory
 * event listener is interrupted while an assigned therapist transitions to INACTIVE or SUSPENDED,
 * this periodic sweep automatically detects any active upcoming sessions remaining assigned to
 * unavailable therapists and executes the automated same-time recovery workflow.
 */
@Component
public class TherapistRecoveryScheduler {

    private static final Logger log = LoggerFactory.getLogger(TherapistRecoveryScheduler.class);

    private final SpaSessionRepository sessionRepository;
    private final SessionRecoveryService sessionRecoveryService;

    public TherapistRecoveryScheduler(SpaSessionRepository sessionRepository,
                                      SessionRecoveryService sessionRecoveryService) {
        this.sessionRepository = sessionRepository;
        this.sessionRecoveryService = sessionRecoveryService;
    }

    /**
     * Periodic sweep running every 60 seconds.
     * Recovers any orphaned upcoming sessions assigned to inactive or suspended therapists.
     *
     * @return the number of orphaned sessions recovered or transitioned to rescheduling
     */
    @Scheduled(fixedRate = 60000)
    public int runTherapistRecoverySweep() {
        LocalDateTime now = LocalDateTime.now();
        List<SpaSession> orphanedSessions = sessionRepository.findActiveUpcomingSessionsWithUnavailableTherapist(now);

        if (orphanedSessions.isEmpty()) {
            return 0;
        }

        log.info("[THERAPIST RECOVERY SWEEP] Discovered {} orphaned active session(s) assigned to unavailable therapists. Initiating recovery...",
                orphanedSessions.size());

        int processed = 0;
        for (SpaSession session : orphanedSessions) {
            try {
                log.info("[THERAPIST RECOVERY SWEEP] Executing recovery for SpaSession #{} (Therapist #{})",
                        session.getSpaSessionId(), session.getTherapist() != null ? session.getTherapist().getTherapistId() : "N/A");

                RecoveryResultDto result = sessionRecoveryService.attemptSameTimeRecovery(session.getSpaSessionId(), true);
                processed++;

                log.info("[THERAPIST RECOVERY SWEEP] Session #{} recovery complete: recovered={}, preservedTime={}, consentRequired={}, message='{}'",
                        session.getSpaSessionId(), result.isRecovered(), result.isPreservedSameTime(),
                        result.isRequiresCustomerConsent(), result.getMessage());
            } catch (Exception ex) {
                log.error("[THERAPIST RECOVERY SWEEP] Failed recovery sweep on SpaSession #{}: {}",
                        session.getSpaSessionId(), ex.getMessage(), ex);
            }
        }

        log.info("[THERAPIST RECOVERY SWEEP] Processed {}/{} orphaned session(s).", processed, orphanedSessions.size());
        return processed;
    }
}

