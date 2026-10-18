package com.heavenstay.hswrms.m3spa.scheduler;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * M3 Spa Session Timeline & Confirmation Deadline Scheduler.
 *
 * Implements the approved T-60m attendance confirmation deadline:
 * If a session remains in PENDING confirmation status at T-60m before scheduledStartAt:
 * - confirmation_status -> EXPIRED
 * - session_status -> RESCHEDULING
 *
 * Preserves OI-02: Exponential backoff, retry counts, and dead-letter escalations
 * remain unresolved and are not hard-coded.
 * Preserves OI-03: Email is the mandatory channel; in-app Bell/Push remain unresolved.
 */
@Component
public class SessionTimelineScheduler {

    private static final Logger log = LoggerFactory.getLogger(SessionTimelineScheduler.class);

    private final SpaSessionRepository sessionRepository;

    public SessionTimelineScheduler(SpaSessionRepository sessionRepository) {
        this.sessionRepository = sessionRepository;
    }

    /**
     * Periodic check for expired confirmations (T-60m deadline).
     * Runs every 60 seconds.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processConfirmationDeadlines() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime deadlineThreshold = now.plusMinutes(60);

        List<SpaSession> expiredCandidates = sessionRepository.findPendingSessionsPastDeadline(
                SpaSessionStatus.SCHEDULED,
                SpaConfirmationStatus.PENDING,
                deadlineThreshold
        );

        for (SpaSession session : expiredCandidates) {
            log.info("Session #{} reached T-60m confirmation deadline with PENDING status. Transitioning to EXPIRED / RESCHEDULING.",
                    session.getSpaSessionId());

            session.setConfirmationStatus(SpaConfirmationStatus.EXPIRED);
            session.setSessionStatus(SpaSessionStatus.RESCHEDULING);
            sessionRepository.save(session);
        }
    }
}
