package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.config.SpaOutboxProperties;
import com.heavenstay.hswrms.m3spa.port.SpaCalendarOutcomeAware;
import com.heavenstay.hswrms.m3spa.port.SpaCalendarPort;
import com.heavenstay.hswrms.m3spa.port.SpaNotificationOutcomeAware;
import com.heavenstay.hswrms.m3spa.port.SpaNotificationPort;
import com.heavenstay.hswrms.m3spa.port.SpaProviderResult;
import com.heavenstay.hswrms.m3spa.repository.SpaDispatchOutboxRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaScheduleHistoryRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.Duration;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Worker responsible for durable asynchronous dispatch of outbox messages
 * (BR-M3-14).
 *
 * Concurrency & Delivery Semantics:
 * - Uses atomic conditional UPDATE claiming (PENDING/FAILED/stale-PROCESSING ->
 * PROCESSING)
 * to prevent dual-instance concurrent claiming in multi-node deployments.
 * - Recovers stale PROCESSING claims older than STALE_CLAIM_MINUTES (default 5
 * minutes)
 * after worker interruption or crash.
 * - Enforces bounded retries (MAX_RETRIES = 5).
 * - Delivery guarantee: At-Least-Once. If the external provider succeeds and
 * the worker
 * process crashes before committing status = 'SENT', stale-claim recovery will
 * retry
 * the dispatch.
 */
@Service
public class SpaDispatchOutboxWorker {

    private static final Logger log = LoggerFactory.getLogger(SpaDispatchOutboxWorker.class);
    public static final int MAX_RETRIES = 5;
    public static final int STALE_CLAIM_MINUTES = 5;

    private final SpaOutboxProperties outboxProperties;
    private final SpaDispatchOutboxRepository outboxRepository;
    private final SpaSessionRepository sessionRepository;
    private final SpaScheduleHistoryRepository historyRepository;
    private final SpaNotificationPort notificationPort;
    private final SpaCalendarPort calendarPort;
    private final String instanceWorkerId = "worker-" + UUID.randomUUID().toString().substring(0, 8);

    @Autowired
    public SpaDispatchOutboxWorker(SpaOutboxProperties outboxProperties,
            SpaDispatchOutboxRepository outboxRepository,
            SpaSessionRepository sessionRepository,
            SpaScheduleHistoryRepository historyRepository,
            @Autowired(required = false) SpaNotificationPort notificationPort,
            @Autowired(required = false) SpaCalendarPort calendarPort) {
        this.outboxProperties = outboxProperties;
        this.outboxRepository = outboxRepository;
        this.sessionRepository = sessionRepository;
        this.historyRepository = historyRepository;
        this.notificationPort = notificationPort;
        this.calendarPort = calendarPort;
    }

    /**
     * Periodic outbox dispatch sweep running every 30 seconds.
     * Processes any PENDING, FAILED, or stale PROCESSING dispatches whose
     * retryCount < MAX_RETRIES.
     *
     * @return count of successfully dispatched outbox entries
     */
    @Scheduled(fixedRate = 30000)
    @Transactional
    public int processPendingOutboxDispatches() {
        return processPendingOutboxDispatches(this.instanceWorkerId);
    }

    /**
     * Executes an outbox dispatch sweep using a specific worker identifier.
     *
     * @param workerId unique identifier of the claiming worker instance
     * @return count of successfully dispatched outbox entries
     */
    @Transactional
    public int processPendingOutboxDispatches(String workerId) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime staleThreshold = now.minus(outboxProperties.getClaimExpiry());

        List<SpaDispatchOutboxEntity> claimableEntries = outboxRepository.findClaimableEntries(
                outboxProperties.getMaxAttempts(), staleThreshold, now);

        if (claimableEntries.isEmpty()) {
            return 0;
        }

        log.info("[OUTBOX SWEEP] Worker '{}' discovered {} claimable outbox dispatch(es) to process.",
                workerId, claimableEntries.size());
        int successCount = 0;

        for (SpaDispatchOutboxEntity entry : claimableEntries) {
            try {
                boolean success = claimAndProcessEntry(entry, workerId);
                if (success) {
                    successCount++;
                }
            } catch (Exception ex) {
                log.error("[OUTBOX SWEEP] Unexpected error processing outbox entry #{}: {}",
                        entry.getOutboxId(), ex.getMessage(), ex);
            }
        }

        log.info("[OUTBOX SWEEP] Worker '{}' completed sweep. Dispatched: {}/{}",
                workerId, successCount, claimableEntries.size());
        return successCount;
    }

    /**
     * Atomically claims an outbox record for processing.
     *
     * @param outboxId ID of the outbox record
     * @param workerId claiming worker identifier
     * @return true if this worker won the atomic claim, false if already
     *         claimed/completed/exhausted
     */
    @Transactional
    public boolean tryClaimRecord(Long outboxId, String workerId) {
        if (outboxId == null) {
            return false;
        }
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime staleThreshold = now.minus(outboxProperties.getClaimExpiry());
        int updated = outboxRepository.claimRecordForProcessing(
                outboxId, workerId, now, staleThreshold, outboxProperties.getMaxAttempts());
        if (updated > 0) {
            outboxRepository.findById(outboxId).ifPresent(e -> {
                e.setStatus("PROCESSING");
                e.setClaimedAt(now);
                e.setClaimedBy(workerId);
            });
            return true;
        }
        return false;
    }

    /**
     * Atomically claims and executes dispatch for a single outbox record.
     *
     * @param outbox   the outbox entity
     * @param workerId claiming worker identifier
     * @return true if claimed and successfully dispatched, false otherwise
     */
    @Transactional
    public boolean claimAndProcessEntry(SpaDispatchOutboxEntity outbox, String workerId) {
        if (outbox == null || outbox.getOutboxId() == null) {
            return false;
        }

        if ("SENT".equalsIgnoreCase(outbox.getStatus())) {
            return true;
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime staleThreshold = now.minus(outboxProperties.getClaimExpiry());

        int claimed = outboxRepository.claimRecordForProcessing(
                outbox.getOutboxId(), workerId, now, staleThreshold,
                Math.min(outboxProperties.getMaxAttempts(), outbox.getMaxRetries()));
        if (claimed == 0) {
            log.debug("[OUTBOX CLAIM] Worker '{}' skipped outbox #{}: already claimed, sent, or retry-exhausted.",
                    workerId, outbox.getOutboxId());
            return false;
        }

        outbox.setStatus("PROCESSING");
        outbox.setClaimedAt(now);
        outbox.setClaimedBy(workerId);

        return executeClaimedDispatch(outbox);
    }

    /**
     * Executes dispatch for a single outbox record using this instance's worker ID.
     *
     * @param outbox the outbox entity
     * @return true if successfully dispatched or acknowledged, false otherwise
     */
    @Transactional
    public boolean processEntry(SpaDispatchOutboxEntity outbox) {
        if (outbox == null) {
            return false;
        }
        if ("SENT".equalsIgnoreCase(outbox.getStatus())) {
            return true;
        }
        if (outbox.getOutboxId() != null) {
            return claimAndProcessEntry(outbox, this.instanceWorkerId);
        }
        return executeClaimedDispatch(outbox);
    }

    private boolean executeClaimedDispatch(SpaDispatchOutboxEntity outbox) {
        Optional<SpaSession> sessionOpt = sessionRepository.findById(outbox.getSessionId());
        if (sessionOpt.isEmpty()) {
            log.warn("[OUTBOX DISPATCH] Cannot dispatch outbox #{}: SpaSession #{} not found.",
                    outbox.getOutboxId(), outbox.getSessionId());
            markFinalFailure(outbox, "Session not found with ID: " + outbox.getSessionId());
            return false;
        }

        SpaSession session = sessionOpt.get();

        if (outbox.getChangeType() != null && outbox.getChangeType().startsWith("REMINDER_")
                && !isReminderStillCurrent(outbox, session)) {
            markSuperseded(outbox, "Reminder checkpoint no longer matches the current session schedule or lifecycle");
            return false;
        }

        if ("CALENDAR".equalsIgnoreCase(outbox.getChannel())) {
            return dispatchCalendar(outbox, session);
        } else if ("EMAIL".equalsIgnoreCase(outbox.getChannel())) {
            return dispatchEmail(outbox, session);
        } else {
            log.error("[OUTBOX DISPATCH] Unknown outbox channel '{}' on outbox #{}", outbox.getChannel(),
                    outbox.getOutboxId());
            markFinalFailure(outbox, "Unknown channel: " + outbox.getChannel());
            return false;
        }
    }

    private boolean isReminderStillCurrent(SpaDispatchOutboxEntity outbox, SpaSession session) {
        if (outbox.getScheduleVersion() != session.getScheduleVersion()
                || session.getSessionStatus() != com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.SCHEDULED) {
            return false;
        }
        String checkpoint = outbox.getChangeType();
        return switch (checkpoint) {
            case "REMINDER_T24H" -> session.getConfirmationStatus() == com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus.PENDING
                    || session.getConfirmationStatus() == com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus.CONFIRMED;
            case "REMINDER_T2H", "REMINDER_T75M" -> session.getConfirmationStatus() == com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus.PENDING;
            case "REMINDER_T15M" -> session.getConfirmationStatus() == com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus.CONFIRMED;
            default -> false;
        };
    }

    private void markSent(SpaDispatchOutboxEntity outbox) {
        outbox.setStatus("SENT");
        outbox.setProcessedAt(LocalDateTime.now());
        outbox.setNextAttemptAt(null);
        outbox.setClaimedAt(null);
        outbox.setClaimedBy(null);
        outboxRepository.save(outbox);
    }

    private void markFailed(SpaDispatchOutboxEntity outbox, String errorMessage) {
        applyProviderResult(outbox, SpaProviderResult.retryable(errorMessage));
    }

    private void markFinalFailure(SpaDispatchOutboxEntity outbox, String errorMessage) {
        outbox.setRetryCount(outbox.getRetryCount() + 1);
        outbox.setStatus("FINAL_FAILURE");
        outbox.setLastError(errorMessage);
        outbox.setProcessedAt(LocalDateTime.now());
        outbox.setNextAttemptAt(null);
        outbox.setClaimedAt(null);
        outbox.setClaimedBy(null);
        outboxRepository.save(outbox);
    }

    private void markSuperseded(SpaDispatchOutboxEntity outbox, String detail) {
        outbox.setStatus("SUPERSEDED");
        outbox.setLastError(detail);
        outbox.setProcessedAt(LocalDateTime.now());
        outbox.setNextAttemptAt(null);
        outbox.setClaimedAt(null);
        outbox.setClaimedBy(null);
        outboxRepository.save(outbox);
    }

    private void applyProviderResult(SpaDispatchOutboxEntity outbox, SpaProviderResult result) {
        String detail = result.detail() == null ? result.disposition().name() : result.detail();
        outbox.setLastError(detail);
        outbox.setClaimedAt(null);
        outbox.setClaimedBy(null);
        switch (result.disposition()) {
            case ACCEPTED -> {
                if (result.externalReference() != null) outbox.setExternalCalendarId(result.externalReference());
                markSent(outbox);
            }
            case SUPPRESSED -> {
                outbox.setStatus("SKIPPED");
                outbox.setProcessedAt(LocalDateTime.now());
                outbox.setNextAttemptAt(null);
                outboxRepository.save(outbox);
            }
            case PERMANENT_FAILURE -> markFinalFailure(outbox, detail);
            case AMBIGUOUS -> {
                outbox.setRetryCount(outbox.getRetryCount() + 1);
                outbox.setStatus("AMBIGUOUS");
                outbox.setProcessedAt(LocalDateTime.now());
                outbox.setNextAttemptAt(null);
                outboxRepository.save(outbox);
            }
            case RETRYABLE_FAILURE -> {
                int attempt = outbox.getRetryCount() + 1;
                outbox.setRetryCount(attempt);
                outbox.setNextAttemptAt(null);
                if (attempt >= Math.min(outboxProperties.getMaxAttempts(), outbox.getMaxRetries())) {
                    outbox.setStatus("FINAL_FAILURE");
                    outbox.setProcessedAt(LocalDateTime.now());
                } else {
                    try {
                        Duration delay = outboxProperties.delayAfterAttempt(attempt);
                        outbox.setStatus("FAILED");
                        outbox.setNextAttemptAt(LocalDateTime.now().plus(delay));
                    } catch (RuntimeException configurationError) {
                        outbox.setStatus("FINAL_FAILURE");
                        outbox.setLastError("Invalid retry delay configuration");
                        outbox.setProcessedAt(LocalDateTime.now());
                    }
                }
                outboxRepository.save(outbox);
            }
        }
    }

    private boolean dispatchCalendar(SpaDispatchOutboxEntity outbox, SpaSession session) {
        if (calendarPort == null) {
            log.error("[OUTBOX CALENDAR] No calendar provider configured for outbox #{}.",
                    outbox.getOutboxId());
            markFinalFailure(outbox, "Calendar provider unavailable; configuration correction required");
            return false;
        }

        try {
            if ("CANCELLED".equalsIgnoreCase(outbox.getChangeType())) {
                String calId = outbox.getExternalCalendarId() != null ? outbox.getExternalCalendarId()
                        : session.getExternalCalendarEventId();
                SpaProviderResult result;
                if (calendarPort instanceof SpaCalendarOutcomeAware outcomeAware) {
                    result = outcomeAware.cancelCalendarEventResult(session, calId);
                } else {
                    boolean cancelled = calId != null && calendarPort.cancelCalendarEvent(session, calId);
                    result = cancelled ? SpaProviderResult.accepted(calId)
                            : SpaProviderResult.retryable("Calendar cancellation returned false");
                }
                applyProviderResult(outbox, result);
                return result.disposition() == SpaProviderResult.Disposition.ACCEPTED;
            } else {
                String stableIdentity = "hswrms-spa-" + session.getSpaSessionId();
                SpaProviderResult result;
                if (calendarPort instanceof SpaCalendarOutcomeAware outcomeAware) {
                    result = outcomeAware.upsertCalendarEvent(session, stableIdentity);
                } else {
                    String updatedCalId = calendarPort.createOrUpdateCalendarEvent(session);
                    result = updatedCalId != null && !updatedCalId.isBlank()
                            ? SpaProviderResult.accepted(updatedCalId)
                            : SpaProviderResult.retryable("Calendar provider did not confirm an event identifier");
                }
                if (result.disposition() == SpaProviderResult.Disposition.ACCEPTED
                        && (result.externalReference() == null || result.externalReference().isBlank())) {
                    result = SpaProviderResult.permanent("Calendar provider accepted without returning the stable event reference");
                }
                if (result.disposition() == SpaProviderResult.Disposition.ACCEPTED
                        && result.externalReference() != null && !result.externalReference().isBlank()) {
                    String updatedCalId = result.externalReference();
                    session.setExternalCalendarEventId(updatedCalId);
                    sessionRepository.save(session);

                    if (outbox.getHistoryId() != null) {
                        historyRepository.findById(outbox.getHistoryId()).ifPresent(h -> {
                            h.setExternalCalendarId(updatedCalId);
                            historyRepository.save(h);
                        });
                    }

                    outbox.setExternalCalendarId(updatedCalId);
                    applyProviderResult(outbox, result);
                    return true;
                }
                applyProviderResult(outbox, result);
                return false;
            }
        } catch (Exception ex) {
            log.error("[OUTBOX CALENDAR] Calendar dispatch failed for session #{}: {}", session.getSpaSessionId(),
                    ex.getMessage());
            markFailed(outbox, ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
            return false;
        }
    }

    private boolean dispatchEmail(SpaDispatchOutboxEntity outbox, SpaSession session) {
        if (notificationPort == null) {
            log.error("[OUTBOX EMAIL] No notification provider configured for outbox #{}.",
                    outbox.getOutboxId());
            markFinalFailure(outbox, "Email provider unavailable; configuration correction required");
            return false;
        }

        try {
            SpaProviderResult result;
            if (outbox.getChangeType() != null && outbox.getChangeType().startsWith("REMINDER_")) {
                if (notificationPort instanceof SpaNotificationOutcomeAware outcomeAware) {
                    result = outcomeAware.sendTimelineReminder(session, outbox.getCustomerEmail(),
                            outbox.getCustomerName(), outbox.getChangeType());
                } else {
                    boolean accepted = notificationPort.sendAppointmentReminder(session,
                            outbox.getCustomerEmail(), outbox.getCustomerName());
                    result = accepted ? SpaProviderResult.accepted(null)
                            : SpaProviderResult.retryable("Notification provider returned a definite failure");
                }
            } else if (notificationPort instanceof SpaNotificationOutcomeAware outcomeAware) {
                result = outcomeAware.sendScheduleChangeNotificationResult(session, outbox.getCustomerEmail(),
                        outbox.getCustomerName(), outbox.getChangeDetails());
            } else {
                boolean accepted = notificationPort.sendScheduleChangeNotification(session,
                        outbox.getCustomerEmail(), outbox.getCustomerName(), outbox.getChangeDetails());
                result = accepted ? SpaProviderResult.accepted(null)
                        : SpaProviderResult.retryable("Notification provider returned a definite failure");
            }
            applyProviderResult(outbox, result);
            return result.disposition() == SpaProviderResult.Disposition.ACCEPTED;
        } catch (Exception ex) {
            log.error("[OUTBOX EMAIL] Notification dispatch exception for session #{}: {}", session.getSpaSessionId(),
                    ex.getMessage());
            markFailed(outbox, ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
            return false;
        }
    }
}
