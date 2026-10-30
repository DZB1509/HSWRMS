package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.port.SpaCalendarPort;
import com.heavenstay.hswrms.m3spa.port.SpaNotificationPort;
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
import java.util.List;
import java.util.Optional;

/**
 * Worker responsible for durable asynchronous dispatch of outbox messages (BR-M3-14).
 *
 * Scans for pending or failed dispatch records and retries them with exponential or linear retry.
 * Keeps external provider failures strictly decoupled from the core booking state.
 */
@Service
public class SpaDispatchOutboxWorker {

    private static final Logger log = LoggerFactory.getLogger(SpaDispatchOutboxWorker.class);

    private final SpaDispatchOutboxRepository outboxRepository;
    private final SpaSessionRepository sessionRepository;
    private final SpaScheduleHistoryRepository historyRepository;
    private final SpaNotificationPort notificationPort;
    private final SpaCalendarPort calendarPort;

    @Autowired
    public SpaDispatchOutboxWorker(SpaDispatchOutboxRepository outboxRepository,
                                  SpaSessionRepository sessionRepository,
                                  SpaScheduleHistoryRepository historyRepository,
                                  @Autowired(required = false) SpaNotificationPort notificationPort,
                                  @Autowired(required = false) SpaCalendarPort calendarPort) {
        this.outboxRepository = outboxRepository;
        this.sessionRepository = sessionRepository;
        this.historyRepository = historyRepository;
        this.notificationPort = notificationPort;
        this.calendarPort = calendarPort;
    }

    /**
     * Periodic outbox dispatch sweep running every 30 seconds.
     * Processes any PENDING or FAILED dispatches whose retryCount < maxRetries.
     *
     * @return count of successfully dispatched outbox entries
     */
    @Scheduled(fixedRate = 30000)
    public int processPendingOutboxDispatches() {
        List<SpaDispatchOutboxEntity> pendingEntries =
                outboxRepository.findByStatusInAndRetryCountLessThanOrderByCreatedAtAsc(
                        List.of("PENDING", "FAILED"), 5
                );

        if (pendingEntries.isEmpty()) {
            return 0;
        }

        log.info("[OUTBOX SWEEP] Discovered {} pending/failed outbox dispatch(es) to process.", pendingEntries.size());
        int successCount = 0;

        for (SpaDispatchOutboxEntity entry : pendingEntries) {
            try {
                boolean success = processEntry(entry);
                if (success) {
                    successCount++;
                }
            } catch (Exception ex) {
                log.error("[OUTBOX SWEEP] Unexpected error processing outbox entry #{}: {}",
                        entry.getOutboxId(), ex.getMessage(), ex);
            }
        }

        log.info("[OUTBOX SWEEP] Completed sweep. Dispatched: {}/{}", successCount, pendingEntries.size());
        return successCount;
    }

    /**
     * Executes dispatch for a single outbox record.
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

        Optional<SpaSession> sessionOpt = sessionRepository.findById(outbox.getSessionId());
        if (sessionOpt.isEmpty()) {
            log.warn("[OUTBOX DISPATCH] Cannot dispatch outbox #{}: SpaSession #{} not found.",
                    outbox.getOutboxId(), outbox.getSessionId());
            outbox.setRetryCount(outbox.getRetryCount() + 1);
            outbox.setLastError("Session not found with ID: " + outbox.getSessionId());
            outbox.setStatus("FAILED");
            outboxRepository.save(outbox);
            return false;
        }

        SpaSession session = sessionOpt.get();

        if ("CALENDAR".equalsIgnoreCase(outbox.getChannel())) {
            return dispatchCalendar(outbox, session);
        } else if ("EMAIL".equalsIgnoreCase(outbox.getChannel())) {
            return dispatchEmail(outbox, session);
        } else {
            log.error("[OUTBOX DISPATCH] Unknown outbox channel '{}' on outbox #{}", outbox.getChannel(), outbox.getOutboxId());
            outbox.setStatus("FAILED");
            outbox.setLastError("Unknown channel: " + outbox.getChannel());
            outboxRepository.save(outbox);
            return false;
        }
    }

    private boolean dispatchCalendar(SpaDispatchOutboxEntity outbox, SpaSession session) {
        if (calendarPort == null) {
            log.info("[OUTBOX CALENDAR] No calendar port configured; safely marking outbox #{} as SENT.", outbox.getOutboxId());
            outbox.setStatus("SENT");
            outbox.setProcessedAt(LocalDateTime.now());
            outboxRepository.save(outbox);
            return true;
        }

        try {
            if ("CANCELLED".equalsIgnoreCase(outbox.getChangeType())) {
                String calId = outbox.getExternalCalendarId() != null ? outbox.getExternalCalendarId() : session.getExternalCalendarEventId();
                if (calId != null) {
                    calendarPort.cancelCalendarEvent(session, calId);
                }
                outbox.setStatus("SENT");
                outbox.setProcessedAt(LocalDateTime.now());
                outboxRepository.save(outbox);
                return true;
            } else {
                String updatedCalId = calendarPort.createOrUpdateCalendarEvent(session);
                if (updatedCalId != null && !updatedCalId.isBlank()) {
                    session.setExternalCalendarEventId(updatedCalId);
                    sessionRepository.save(session);

                    if (outbox.getHistoryId() != null) {
                        historyRepository.findById(outbox.getHistoryId()).ifPresent(h -> {
                            h.setExternalCalendarId(updatedCalId);
                            historyRepository.save(h);
                        });
                    }

                    outbox.setStatus("SENT");
                    outbox.setExternalCalendarId(updatedCalId);
                    outbox.setProcessedAt(LocalDateTime.now());
                    outboxRepository.save(outbox);
                    log.info("[OUTBOX CALENDAR] Successfully synced calendar event '{}' for session #{}",
                            updatedCalId, session.getSpaSessionId());
                    return true;
                } else {
                    outbox.setRetryCount(outbox.getRetryCount() + 1);
                    outbox.setStatus("FAILED");
                    outbox.setLastError("Calendar port returned empty event ID");
                    outboxRepository.save(outbox);
                    return false;
                }
            }
        } catch (Exception ex) {
            log.error("[OUTBOX CALENDAR] Calendar dispatch failed for session #{}: {}", session.getSpaSessionId(), ex.getMessage());
            outbox.setRetryCount(outbox.getRetryCount() + 1);
            outbox.setStatus("FAILED");
            outbox.setLastError(ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
            outboxRepository.save(outbox);
            return false;
        }
    }

    private boolean dispatchEmail(SpaDispatchOutboxEntity outbox, SpaSession session) {
        if (notificationPort == null) {
            log.info("[OUTBOX EMAIL] No notification port configured; safely marking outbox #{} as SENT.", outbox.getOutboxId());
            outbox.setStatus("SENT");
            outbox.setProcessedAt(LocalDateTime.now());
            outboxRepository.save(outbox);
            return true;
        }

        try {
            boolean sent = notificationPort.sendScheduleChangeNotification(
                    session,
                    outbox.getCustomerEmail(),
                    outbox.getCustomerName(),
                    outbox.getChangeDetails()
            );

            if (sent) {
                outbox.setStatus("SENT");
                outbox.setProcessedAt(LocalDateTime.now());
                outboxRepository.save(outbox);
                log.info("[OUTBOX EMAIL] Notification email successfully dispatched for session #{}", session.getSpaSessionId());
                return true;
            } else {
                outbox.setRetryCount(outbox.getRetryCount() + 1);
                outbox.setStatus("FAILED");
                outbox.setLastError("Notification port returned false (delivery failed or queued)");
                outboxRepository.save(outbox);
                log.warn("[OUTBOX EMAIL] Notification delivery returned false for session #{}. Marked for retry.", session.getSpaSessionId());
                return false;
            }
        } catch (Exception ex) {
            log.error("[OUTBOX EMAIL] Notification dispatch exception for session #{}: {}", session.getSpaSessionId(), ex.getMessage());
            outbox.setRetryCount(outbox.getRetryCount() + 1);
            outbox.setStatus("FAILED");
            outbox.setLastError(ex.getMessage() != null ? ex.getMessage() : ex.getClass().getSimpleName());
            outboxRepository.save(outbox);
            return false;
        }
    }
}

