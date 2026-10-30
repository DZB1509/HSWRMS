package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.m3spa.entity.SpaDispatchOutboxEntity;
import com.heavenstay.hswrms.m3spa.entity.SpaScheduleHistory;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.repository.SpaDispatchOutboxRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaScheduleHistoryRepository;
import com.heavenstay.hswrms.m3spa.service.event.SpaScheduleAcceptedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Event listener that records audit history, enqueues transactional outbox dispatches,
 * and triggers immediate non-blocking external synchronization (BR-M3-14).
 *
 * Fault Tolerance & Outbox Pattern:
 * 1. Schedule history is saved atomically with deduplication checks.
 * 2. External Calendar and Notification actions are enqueued as durable outbox records.
 * 3. Failures in external integrations are recorded in the outbox table for automated retry
 *    and NEVER roll back or invalidate the committed database state transition.
 */
@Component
public class SpaScheduleAuditEventListener {

    private static final Logger log = LoggerFactory.getLogger(SpaScheduleAuditEventListener.class);

    private final SpaScheduleHistoryRepository historyRepository;
    private final SpaDispatchOutboxRepository outboxRepository;
    private final SpaDispatchOutboxWorker outboxWorker;

    @Autowired
    public SpaScheduleAuditEventListener(SpaScheduleHistoryRepository historyRepository,
                                         SpaDispatchOutboxRepository outboxRepository,
                                         SpaDispatchOutboxWorker outboxWorker) {
        this.historyRepository = historyRepository;
        this.outboxRepository = outboxRepository;
        this.outboxWorker = outboxWorker;
    }

    @EventListener
    @Transactional
    public void onScheduleAccepted(SpaScheduleAcceptedEvent event) {
        if (event == null || event.getSession() == null) {
            log.warn("Cannot process schedule accepted event: event or session is null");
            return;
        }

        SpaSession session = event.getSession();
        Long sessionId = session.getSpaSessionId();

        // 1. Duplicate Event Delivery Protection (BR-M3-14)
        boolean duplicate = historyRepository.existsBySessionIdAndChangeTypeAndNewStatusAndNewStartAt(
                sessionId, event.getChangeType(), event.getNewStatus(), event.getNewStartAt()
        );
        if (duplicate) {
            log.warn("[SPA SCHEDULE AUDIT] Duplicate accepted schedule event received for session #{}, type={}, status={}, start={}. Ignoring to prevent duplicate history.",
                    sessionId, event.getChangeType(), event.getNewStatus(), event.getNewStartAt());
            return;
        }

        // 2. Immutable Audit History Persistence (BR-M3-14)
        SpaScheduleHistory history = new SpaScheduleHistory(
                sessionId,
                event.getActorUserId(),
                event.getActorRole(),
                event.getChangeType(),
                event.getPreviousStatus(),
                event.getNewStatus(),
                event.getPreviousStartAt(),
                event.getNewStartAt(),
                event.getPreviousTherapistId(),
                event.getNewTherapistId(),
                event.getPreviousRoomId(),
                event.getNewRoomId(),
                event.getReason(),
                session.getExternalCalendarEventId()
        );

        history = historyRepository.save(history);
        log.info("[SPA SCHEDULE AUDIT] Recorded history entry #{} for session #{}: changeType={}, status={}->{}, start={}->{}",
                history.getHistoryId(), sessionId, event.getChangeType(),
                event.getPreviousStatus(), event.getNewStatus(),
                event.getPreviousStartAt(), event.getNewStartAt());

        // 3. Enqueue Durable Outbox Dispatches (BR-M3-14)
        String calKey = "outbox-session-" + sessionId + "-hist-" + history.getHistoryId() + "-CALENDAR";
        String emailKey = "outbox-session-" + sessionId + "-hist-" + history.getHistoryId() + "-EMAIL";

        String changeSummary = event.getChangeType() + ": " + (event.getReason() != null ? event.getReason() : "Schedule transition committed");

        SpaDispatchOutboxEntity calOutbox = new SpaDispatchOutboxEntity(
                history.getHistoryId(),
                sessionId,
                "CALENDAR",
                event.getCustomerEmail(),
                event.getCustomerName(),
                event.getChangeType(),
                changeSummary,
                session.getExternalCalendarEventId(),
                calKey
        );

        SpaDispatchOutboxEntity emailOutbox = new SpaDispatchOutboxEntity(
                history.getHistoryId(),
                sessionId,
                "EMAIL",
                event.getCustomerEmail(),
                event.getCustomerName(),
                event.getChangeType(),
                changeSummary,
                session.getExternalCalendarEventId(),
                emailKey
        );

        if (!outboxRepository.existsByIdempotencyKey(calKey)) {
            calOutbox = outboxRepository.save(calOutbox);
            try {
                outboxWorker.processEntry(calOutbox);
            } catch (Exception ex) {
                log.error("[SPA OUTBOX] Immediate calendar dispatch failed; retained in outbox for retry: {}", ex.getMessage());
            }
        }

        if (!outboxRepository.existsByIdempotencyKey(emailKey)) {
            emailOutbox = outboxRepository.save(emailOutbox);
            try {
                outboxWorker.processEntry(emailOutbox);
            } catch (Exception ex) {
                log.error("[SPA OUTBOX] Immediate email dispatch failed; retained in outbox for retry: {}", ex.getMessage());
            }
        }
    }
}
