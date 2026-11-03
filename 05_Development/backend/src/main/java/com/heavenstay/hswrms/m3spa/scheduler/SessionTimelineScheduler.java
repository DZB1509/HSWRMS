package com.heavenstay.hswrms.m3spa.scheduler;

import com.heavenstay.hswrms.m3spa.config.SpaOutboxProperties;
import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.port.CustomerStayPort;
import com.heavenstay.hswrms.m3spa.port.StayContextDto;
import com.heavenstay.hswrms.m3spa.repository.SpaDispatchOutboxRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.service.SessionRecoveryService;
import com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto;
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

/** Durable M3 reminder checkpoint, confirmation deadline, and recovery orchestration. */
@Component
public class SessionTimelineScheduler {
    private static final Logger log = LoggerFactory.getLogger(SessionTimelineScheduler.class);

    private final SpaSessionRepository sessionRepository;
    private final SpaDispatchOutboxRepository outboxRepository;
    private final SpaOutboxProperties outboxProperties;
    private final CustomerStayPort customerStayPort;
    private final SessionRecoveryService recoveryService;
    private Clock clock = Clock.systemDefaultZone();

    @Autowired
    public SessionTimelineScheduler(SpaSessionRepository sessionRepository,
                                   SpaDispatchOutboxRepository outboxRepository,
                                   SpaOutboxProperties outboxProperties,
                                   @Autowired(required = false) CustomerStayPort customerStayPort,
                                   SessionRecoveryService recoveryService) {
        this.sessionRepository = sessionRepository;
        this.outboxRepository = outboxRepository;
        this.outboxProperties = outboxProperties;
        this.customerStayPort = customerStayPort;
        this.recoveryService = recoveryService;
    }

    public void setClock(Clock clock) {
        this.clock = clock;
    }

    /** Enqueues the due timeline notice into the transactional outbox; no provider is called here. */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void dispatchUpcomingSessionReminders() {
        LocalDateTime now = LocalDateTime.now(clock);
        List<SpaSession> candidates = sessionRepository.findScheduledSessionsStartingBetween(now, now.plusHours(24));
        for (SpaSession session : candidates) {
            String checkpoint = dueCheckpoint(session, now);
            if (checkpoint == null) continue;

            String idempotencyKey = "spa:" + session.getSpaSessionId() + ":schedule:" + session.getScheduleVersion()
                    + ":" + checkpoint;
            if (outboxRepository.existsByIdempotencyKey(idempotencyKey)) continue;

            StayContextDto stay = resolveStay(session.getRetreatBookingId());
            String email = stay == null ? null : stay.getCustomerEmail();
            String name = stay == null ? null : stay.getCustomerName();
            SpaDispatchOutboxEntity reminder = new SpaDispatchOutboxEntity(
                    null, session.getSpaSessionId(), "EMAIL", email, name,
                    checkpoint, checkpointDescription(checkpoint), null, idempotencyKey);
            reminder.setScheduleVersion(session.getScheduleVersion());
            reminder.setMaxRetries(outboxProperties.getMaxAttempts());
            outboxRepository.save(reminder);
            log.info("Enqueued {} for SpaSession #{} at schedule version {}.",
                    checkpoint, session.getSpaSessionId(), session.getScheduleVersion());
        }
    }

    private String dueCheckpoint(SpaSession session, LocalDateTime now) {
        LocalDateTime start = session.getScheduledStartAt();
        if (start == null || !start.isAfter(now)) return null;
        SpaConfirmationStatus confirmation = session.getConfirmationStatus();

        if (!now.isBefore(start.minusHours(24)) && now.isBefore(start.minusHours(2))) {
            return "REMINDER_T24H";
        }
        if (confirmation == SpaConfirmationStatus.PENDING
                && !now.isBefore(start.minusHours(2)) && now.isBefore(start.minusMinutes(75))) {
            return "REMINDER_T2H";
        }
        if (confirmation == SpaConfirmationStatus.PENDING
                && !now.isBefore(start.minusMinutes(75)) && now.isBefore(start.minusMinutes(60))) {
            return "REMINDER_T75M";
        }
        if (confirmation == SpaConfirmationStatus.CONFIRMED
                && !now.isBefore(start.minusMinutes(15)) && now.isBefore(start)) {
            return "REMINDER_T15M";
        }
        return null;
    }

    private String checkpointDescription(String checkpoint) {
        return switch (checkpoint) {
            case "REMINDER_T24H" -> "Information reminder 24 hours before the session";
            case "REMINDER_T2H" -> "Primary attendance confirmation request 2 hours before the session";
            case "REMINDER_T75M" -> "Final confirmation reminder before the T-60m deadline";
            case "REMINDER_T15M" -> "Upcoming-session reminder for a confirmed session";
            default -> checkpoint;
        };
    }

    private StayContextDto resolveStay(Integer bookingId) {
        if (bookingId == null || customerStayPort == null) return null;
        try {
            Optional<StayContextDto> result = customerStayPort.getStayById(bookingId);
            return result.orElse(null);
        } catch (RuntimeException ex) {
            log.warn("Customer contact lookup unavailable for Spa booking #{}; reminder remains queued without a recipient.", bookingId);
            return null;
        }
    }

    /** T-60m deadline transition. Recovery runs in a separate transaction after this update commits. */
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void processConfirmationDeadlines() {
        LocalDateTime now = LocalDateTime.now(clock);
        LocalDateTime deadlineThreshold = now.plusMinutes(60);
        List<SpaSession> candidates = sessionRepository.findPendingSessionsPastDeadline(
                SpaSessionStatus.SCHEDULED, SpaConfirmationStatus.PENDING, deadlineThreshold);

        for (SpaSession session : candidates) {
            if (session.getScheduledStartAt() == null) continue;
            session.setConfirmationStatus(SpaConfirmationStatus.EXPIRED);
            session.setSessionStatus(SpaSessionStatus.RESCHEDULING);
            session.setRecoveryAttemptedVersion(null);
            sessionRepository.save(session);
            log.info("SpaSession #{} reached T-60m; persisted EXPIRED/RESCHEDULING for recovery.",
                    session.getSpaSessionId());
        }
    }

    /** Durable catch-up for declined/expired triggers, including a restart between commit and recovery. */
    @Scheduled(fixedRate = 30000)
    public int processPendingRecoveryRequests() {
        List<SpaSession> candidates = sessionRepository.findSessionsAwaitingRecovery();
        int attempted = 0;
        for (SpaSession candidate : candidates) {
            try {
                if (candidate.getScheduledStartAt() == null || !candidate.getScheduledStartAt().isAfter(LocalDateTime.now(clock))) {
                    recoveryService.markRecoveryNotApplicableAfterStart(candidate.getSpaSessionId(),
                            candidate.getScheduleVersion(), LocalDateTime.now(clock));
                    continue;
                }
                RecoveryResultDto result = recoveryService.attemptSameTimeRecovery(candidate.getSpaSessionId());
                attempted++;
                log.info("Recovery request processed for SpaSession #{}: recovered={}, preservedTime={}, consentRequired={}",
                        candidate.getSpaSessionId(), result.isRecovered(), result.isPreservedSameTime(),
                        result.isRequiresCustomerConsent());
            } catch (RuntimeException ex) {
                log.error("Recovery request failed for SpaSession #{}; it remains eligible for a later retry.",
                        candidate.getSpaSessionId(), ex);
            }
        }
        return attempted;
    }
}
