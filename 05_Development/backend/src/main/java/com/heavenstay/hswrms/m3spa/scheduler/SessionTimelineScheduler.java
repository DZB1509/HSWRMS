package com.heavenstay.hswrms.m3spa.scheduler;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.port.CustomerStayPort;
import com.heavenstay.hswrms.m3spa.port.SpaNotificationPort;
import com.heavenstay.hswrms.m3spa.port.StayContextDto;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * M3 Spa Session Timeline, Reminder & Confirmation Deadline Scheduler.
 *
 * Implements:
 * 1. BR-M3-10: T-1h reminder dispatch:
 *    Approximately 1 hour before scheduledStartAt (window: [now, now + 75m]),
 *    dispatches reminder requesting Customer attendance confirmation via SpaNotificationPort.
 *    Persists reminderSentAt to prevent duplicate sends across runs, restarts, and concurrency.
 *
 * 2. T-60m attendance confirmation deadline enforcement:
 *    If a session remains in PENDING confirmation status at T-60m before scheduledStartAt:
 *    - confirmation_status -> EXPIRED
 *    - session_status -> RESCHEDULING
 *
 * Preserves OI-02: Exponential backoff, retry counts, and dead-letter escalations
 * remain unresolved and are not hard-coded.
 * Preserves OI-03: Email is the primary channel; external calendar sync remains decoupled.
 */
@Component
public class SessionTimelineScheduler {

    private static final Logger log = LoggerFactory.getLogger(SessionTimelineScheduler.class);

    private final SpaSessionRepository sessionRepository;
    private final SpaNotificationPort notificationPort;
    private final CustomerStayPort customerStayPort;
    private Clock clock = Clock.systemDefaultZone();

    public SessionTimelineScheduler(SpaSessionRepository sessionRepository) {
        this(sessionRepository, null, null);
    }

    @Autowired
    public SessionTimelineScheduler(SpaSessionRepository sessionRepository,
                                    @Autowired(required = false) SpaNotificationPort notificationPort,
                                    @Autowired(required = false) CustomerStayPort customerStayPort) {
        this.sessionRepository = sessionRepository;
        this.notificationPort = notificationPort;
        this.customerStayPort = customerStayPort;
    }

    /**
     * Set a custom clock for deterministic testing of time-sensitive workflows.
     */
    public void setClock(Clock clock) {
        this.clock = clock;
    }

    /**
     * Periodic check for upcoming sessions due for T-1h confirmation reminder.
     * Runs every 60 seconds.
     *
     * Advance reminder window: [now, now + 75 minutes] (~1 hour before appointment with 15-minute tolerance).
     * Filters strictly by:
     * - session_status = SCHEDULED
     * - confirmation_status = PENDING
     * - reminder_sent_at IS NULL
     */
    @Scheduled(fixedRate = 60000)
    public void dispatchUpcomingSessionReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        // BR-M3-10: T-1h confirmation reminder window [T-75m, T-60m].
        // Strictly precedes T-60m expiration deadline (scheduledStartAt <= now.plusMinutes(60)).
        // windowStart = now.plusMinutes(60) (exclusive), windowEnd = now.plusMinutes(75) (inclusive).
        LocalDateTime windowStart = now.plusMinutes(60);
        LocalDateTime windowEnd = now.plusMinutes(75);

        List<SpaSession> reminderCandidates = sessionRepository.findSessionsDueForReminder(
                SpaSessionStatus.SCHEDULED,
                SpaConfirmationStatus.PENDING,
                now,
                windowStart,
                windowEnd
        );

        for (SpaSession session : reminderCandidates) {
            // Concern A: Multi-instance atomic claim with 2-minute lease expiration for crash recovery and UUID claim-token fencing.
            LocalDateTime leaseExpiresAt = now.plusMinutes(2);
            String claimToken = UUID.randomUUID().toString();
            int claimed = sessionRepository.claimSessionForReminder(session.getSpaSessionId(), now, leaseExpiresAt, claimToken);
            if (claimed == 0) {
                log.info("SpaSession #{} already claimed by another scheduler instance; skipping.", session.getSpaSessionId());
                continue;
            }

            String customerEmail = null;
            String customerName = "Valued Guest";

            if (session.getRetreatBookingId() != null && customerStayPort != null) {
                try {
                    Optional<StayContextDto> stayOpt = customerStayPort.getStayById(session.getRetreatBookingId());
                    if (stayOpt.isPresent()) {
                        StayContextDto stay = stayOpt.get();
                        if (stay.getCustomerName() != null && !stay.getCustomerName().isBlank()) {
                            customerName = stay.getCustomerName();
                        }
                        if (stay.getCustomerEmail() != null && !stay.getCustomerEmail().isBlank()) {
                            customerEmail = stay.getCustomerEmail();
                        }
                    }
                } catch (Exception ex) {
                    log.warn("Could not retrieve customer details for booking #{}: {}", session.getRetreatBookingId(), ex.getMessage());
                }
            }

            log.info("Dispatching T-1h confirmation reminder for SpaSession #{} (scheduled: {})",
                    session.getSpaSessionId(), session.getScheduledStartAt());

            boolean sent = false;
            try {
                if (notificationPort != null) {
                    sent = notificationPort.sendAppointmentReminder(session, customerEmail, customerName);
                } else {
                    log.info("No SpaNotificationPort configured; defaulting reminder dispatch to logged success.");
                    sent = true;
                }
            } catch (Exception ex) {
                log.error("Exception dispatching reminder for SpaSession #{}: {}", session.getSpaSessionId(), ex.getMessage());
                sent = false;
            }

            if (sent) {
                int sentCount = sessionRepository.recordReminderSent(session.getSpaSessionId(), now, claimToken);
                if (sentCount > 0) {
                    log.info("T-1h reminder recorded successfully for SpaSession #{}", session.getSpaSessionId());
                } else {
                    log.warn("T-1h reminder sent for SpaSession #{} with token {}, but claim lease was superseded/fenced.",
                            session.getSpaSessionId(), claimToken);
                }
            } else {
                int releaseCount = sessionRepository.releaseReminderClaim(session.getSpaSessionId(), claimToken);
                if (releaseCount > 0) {
                    log.warn("Failed to dispatch reminder for SpaSession #{}. Releasing claim for retry.",
                            session.getSpaSessionId());
                } else {
                    log.warn("Failed to dispatch reminder for SpaSession #{}, but claim lease was already superseded/fenced.",
                            session.getSpaSessionId());
                }
            }
        }
    }

    /**
     * Periodic check for expired confirmations (T-60m deadline).
     * Runs every 60 seconds.
     */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processConfirmationDeadlines() {
        LocalDateTime now = LocalDateTime.now(clock);
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
