package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m3spa.dto.response.RecoveryResultDto;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import com.heavenstay.hswrms.m3spa.port.CustomerStayPort;
import com.heavenstay.hswrms.m3spa.port.StayContextDto;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomRepository;
import com.heavenstay.hswrms.m3spa.service.event.SpaScheduleAcceptedEvent;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import jakarta.persistence.PersistenceContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

/**
 * M3 System-Initiated Recovery Engine.
 *
 * Implements the approved recovery rules:
 * 1. Priority: Preserve the SAME session time if possible by replacing an unavailable
 *    Therapist or Room with a qualified/compatible alternative.
 * 2. If session time must change: explicit Customer consent is required.
 *    The system MUST NOT silently commit a new time.
 * 3. Cross-customer slot-swap requires mutual consent (marked PARTIAL).
 */
@Service
@Transactional
public class SessionRecoveryService {

    private static final Logger log = LoggerFactory.getLogger(SessionRecoveryService.class);

    private final SpaSessionRepository sessionRepository;
    private final TherapistRepository therapistRepository;
    private final TreatmentRoomRepository roomRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final CustomerStayPort customerStayPort;

    @PersistenceContext
    private EntityManager entityManager;

    public SessionRecoveryService(SpaSessionRepository sessionRepository,
                                  TherapistRepository therapistRepository,
                                  TreatmentRoomRepository roomRepository) {
        this(sessionRepository, therapistRepository, roomRepository, null, null);
    }

    @Autowired
    public SessionRecoveryService(SpaSessionRepository sessionRepository,
                                  TherapistRepository therapistRepository,
                                  TreatmentRoomRepository roomRepository,
                                  @Autowired(required = false) ApplicationEventPublisher eventPublisher,
                                  @Autowired(required = false) CustomerStayPort customerStayPort) {
        this.sessionRepository = sessionRepository;
        this.therapistRepository = therapistRepository;
        this.roomRepository = roomRepository;
        this.eventPublisher = eventPublisher;
        this.customerStayPort = customerStayPort;
    }

    /**
     * Attempts same-time recovery for an interrupted or unconfirmed session.
     * Preserves the exact same interval if replacement resources exist.
     * If no same-time candidate exists, marks session as RESCHEDULING requiring customer consent.
     */
    public RecoveryResultDto attemptSameTimeRecovery(Long sessionId) {
        return attemptSameTimeRecovery(sessionId, false);
    }

    @Transactional
    public void markRecoveryNotApplicableAfterStart(Long sessionId, int expectedScheduleVersion, LocalDateTime now) {
        sessionRepository.findByIdWithLock(sessionId).ifPresent(session -> {
            if (session.getScheduleVersion() == expectedScheduleVersion
                    && session.getScheduledStartAt() != null
                    && !session.getScheduledStartAt().isAfter(now)
                    && session.getSessionStatus() == SpaSessionStatus.RESCHEDULING
                    && (session.getConfirmationStatus() == SpaConfirmationStatus.EXPIRED
                        || session.getConfirmationStatus() == SpaConfirmationStatus.DECLINED)) {
                session.setRecoveryAttemptedVersion(session.getScheduleVersion());
                sessionRepository.save(session);
            }
        });
    }

    /** Explicit therapist-unavailability triggers may retry a prior consent-required recovery after conditions change. */
    public RecoveryResultDto attemptSameTimeRecovery(Long sessionId, boolean allowRepeatForExternalTrigger) {
        // Candidate discovery reads the session WITHOUT a lock. Pessimistic locks are acquired later in the
        // same global order used by SpaSessionService.confirmReservation (Therapist -> Room -> Session)
        // to avoid lock-order inversion deadlocks between concurrent reschedule and recovery.
        SpaSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Spa Session", "sessionId", sessionId));

        if (alreadyAttemptedForCurrentVersion(session, allowRepeatForExternalTrigger)) {
            return concurrentChangeResult(sessionId);
        }

        if (session.getSessionStatus() == SpaSessionStatus.RESCHEDULING
                && session.getConfirmationStatus() == SpaConfirmationStatus.DECLINED) {
            session.setRecoveryAttemptedVersion(session.getScheduleVersion());
            sessionRepository.save(session);
            return new RecoveryResultDto(sessionId, false, false, true, null, null,
                    "Customer declined this appointment; a time change requires explicit Customer consent.");
        }

        LocalDateTime startAt = session.getScheduledStartAt();
        LocalDateTime endAt = session.getScheduledEndAt();
        Integer treatmentId = session.getTreatment().getTreatmentId();
        int expectedScheduleVersion = session.getScheduleVersion();

        // 1. Evaluate current therapist availability
        Therapist currentTherapist = session.getTherapist();
        boolean currentTherapistOk = currentTherapist.getTherapistStatus() == TherapistStatus.ACTIVE
                && !sessionRepository.hasOverlappingSession(
                        currentTherapist.getTherapistId(), null, startAt, endAt, session.getSpaSessionId());

        // 2. Evaluate current room availability
        TreatmentRoom currentRoom = session.getTreatmentRoom();
        boolean currentRoomOk = currentRoom.getRoomStatus() == TreatmentRoomStatus.AVAILABLE
                && !sessionRepository.hasOverlappingSession(
                        null, currentRoom.getRoomId(), startAt, endAt, session.getSpaSessionId());

        if (session.getSessionStatus() == SpaSessionStatus.SCHEDULED && currentTherapistOk && currentRoomOk) {
            return new RecoveryResultDto(sessionId, true, true, false,
                    currentTherapist.getTherapistId(), currentRoom.getRoomId(),
                    "Recovery skipped because the session already has available resources at the requested time.");
        }

        Therapist targetTherapist = currentTherapistOk ? currentTherapist : null;
        TreatmentRoom targetRoom = currentRoomOk ? currentRoom : null;

        // If therapist is conflicted/unavailable, search for another qualified therapist
        if (targetTherapist == null) {
            List<Therapist> qualifiedTherapists = therapistRepository.findQualifiedTherapists(
                    treatmentId, TherapistStatus.ACTIVE);
            for (Therapist candidate : qualifiedTherapists) {
                if (!candidate.getTherapistId().equals(currentTherapist.getTherapistId())) {
                    boolean busy = sessionRepository.hasOverlappingSession(
                            candidate.getTherapistId(), null, startAt, endAt, session.getSpaSessionId());
                    if (!busy) {
                        targetTherapist = candidate;
                        break;
                    }
                }
            }
        }

        // If room is conflicted/unavailable, search for another compatible room
        if (targetRoom == null) {
            List<TreatmentRoom> compatibleRooms = roomRepository.findCompatibleRooms(
                    treatmentId, TreatmentRoomStatus.AVAILABLE);
            for (TreatmentRoom candidate : compatibleRooms) {
                if (!candidate.getRoomId().equals(currentRoom.getRoomId())) {
                    boolean busy = sessionRepository.hasOverlappingSession(
                            null, candidate.getRoomId(), startAt, endAt, session.getSpaSessionId());
                    if (!busy) {
                        targetRoom = candidate;
                        break;
                    }
                }
            }
        }

        // 3. Same-time recovery success (lock replacement resources and re-verify conflict-free under lock)
        if (targetTherapist != null && targetRoom != null) {
            Therapist lockedTherapist = therapistRepository.findByIdWithLock(targetTherapist.getTherapistId())
                    .orElse(null);
            TreatmentRoom lockedRoom = roomRepository.findByIdWithLock(targetRoom.getRoomId())
                    .orElse(null);
            lockAndRefreshSession(session);
            if (!isStillRecoverable(session, startAt, endAt, expectedScheduleVersion,
                    currentTherapist.getTherapistId(), currentRoom.getRoomId())
                    || alreadyAttemptedForCurrentVersion(session, allowRepeatForExternalTrigger)) {
                return concurrentChangeResult(sessionId);
            }
            boolean lockedTherapistReady = lockedTherapist != null
                    && lockedTherapist.getTherapistStatus() == TherapistStatus.ACTIVE
                    && !sessionRepository.hasOverlappingSession(
                            lockedTherapist.getTherapistId(), null, startAt, endAt, session.getSpaSessionId());
            boolean lockedRoomReady = lockedRoom != null
                    && lockedRoom.getRoomStatus() == TreatmentRoomStatus.AVAILABLE
                    && !sessionRepository.hasOverlappingSession(
                            null, lockedRoom.getRoomId(), startAt, endAt, session.getSpaSessionId());

            if (lockedTherapistReady && lockedRoomReady) {
                log.info("Same-time recovery successful for session #{}. Preserved interval {}-{}. Assigned therapist #{}, room #{}.",
                        sessionId, startAt, endAt, lockedTherapist.getTherapistId(), lockedRoom.getRoomId());

                String prevStatus = session.getSessionStatus() != null ? session.getSessionStatus().name() : "SCHEDULED";
                session.setTherapist(lockedTherapist);
                session.setTreatmentRoom(lockedRoom);
                session.incrementScheduleVersion();
                session.setRecoveryAttemptedVersion(session.getScheduleVersion());
                session.setSessionStatus(SpaSessionStatus.SCHEDULED);
                session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
                session.resetReminderState();
                SpaSession saved = sessionRepository.save(session);

                publishScheduleEvent(new SpaScheduleAcceptedEvent(
                        saved, "RECOVERED", prevStatus, "SCHEDULED",
                        startAt, startAt,
                        currentTherapist.getTherapistId(), lockedTherapist.getTherapistId(),
                        currentRoom.getRoomId(), lockedRoom.getRoomId(),
                        null, "SYSTEM", "Automated same-time rematching",
                        resolveCustomerEmail(saved.getRetreatBookingId()),
                        resolveCustomerName(saved.getRetreatBookingId())
                ));

                RecoveryResultDto recResult = new RecoveryResultDto(sessionId, true, true, false, lockedTherapist.getTherapistId(), lockedRoom.getRoomId(), "Same-time recovery succeeded. Preserved original schedule.");
                recResult.setScheduleVersion(saved.getScheduleVersion());
                return recResult;
            }
        }

        // 4. Same-time recovery impossible: Time-change required
        // System MUST NOT silently commit a new time without customer consent!
        lockAndRefreshSession(session);
        if (!isStillRecoverable(session, startAt, endAt, expectedScheduleVersion,
                currentTherapist.getTherapistId(), currentRoom.getRoomId())
                || alreadyAttemptedForCurrentVersion(session, allowRepeatForExternalTrigger)) {
            return concurrentChangeResult(sessionId);
        }
        log.info("Same-time recovery unavailable for session #{}. Retaining in RESCHEDULING status awaiting Customer consent.", sessionId);
        String prevStatus = session.getSessionStatus() != null ? session.getSessionStatus().name() : "SCHEDULED";
        session.setSessionStatus(SpaSessionStatus.RESCHEDULING);
        session.setRecoveryAttemptedVersion(session.getScheduleVersion());
        SpaSession saved = sessionRepository.save(session);

        publishScheduleEvent(new SpaScheduleAcceptedEvent(
                saved, "RESCHEDULING", prevStatus, "RESCHEDULING",
                startAt, startAt,
                currentTherapist.getTherapistId(), null,
                currentRoom.getRoomId(), null,
                null, "SYSTEM", "Same-time replacement unavailable; awaiting customer consent",
                resolveCustomerEmail(saved.getRetreatBookingId()),
                resolveCustomerName(saved.getRetreatBookingId())
        ));

        return new RecoveryResultDto(
                sessionId,
                false,
                false,
                true,
                null,
                null,
                "Same-time recovery unavailable. Customer consent required for any schedule modification."
        );
    }

    /**
     * Acquires a PESSIMISTIC_WRITE lock on the session and refreshes its state from the database so decisions
     * are made on committed data. Falls back to the repository lock query when no EntityManager is available
     * (plain unit-test construction).
     */
    private void lockAndRefreshSession(SpaSession session) {
        if (entityManager != null && entityManager.contains(session)) {
            entityManager.refresh(session, LockModeType.PESSIMISTIC_WRITE);
        } else {
            sessionRepository.findByIdWithLock(session.getSpaSessionId());
        }
    }

    private boolean isStillRecoverable(SpaSession session, LocalDateTime expectedStart, LocalDateTime expectedEnd,
                                      int expectedScheduleVersion, Integer expectedTherapistId,
                                      Integer expectedRoomId) {
        SpaSessionStatus status = session.getSessionStatus();
        boolean activeStatus = status == null
                || status == SpaSessionStatus.SCHEDULED
                || status == SpaSessionStatus.RESCHEDULING;
        return activeStatus
                && session.getScheduleVersion() == expectedScheduleVersion
                && Objects.equals(expectedTherapistId,
                        session.getTherapist() == null ? null : session.getTherapist().getTherapistId())
                && Objects.equals(expectedRoomId,
                        session.getTreatmentRoom() == null ? null : session.getTreatmentRoom().getRoomId())
                && Objects.equals(expectedStart, session.getScheduledStartAt())
                && Objects.equals(expectedEnd, session.getScheduledEndAt());
    }

    private boolean alreadyAttemptedForCurrentVersion(SpaSession session, boolean allowRepeat) {
        return !allowRepeat && session.getRecoveryAttemptedVersion() != null
                && session.getRecoveryAttemptedVersion() == session.getScheduleVersion();
    }

    private RecoveryResultDto concurrentChangeResult(Long sessionId) {
        log.warn("Recovery skipped for session #{}: session was modified concurrently (status or interval changed).", sessionId);
        return new RecoveryResultDto(
                sessionId,
                false,
                false,
                false,
                null,
                null,
                "Recovery skipped: session was modified concurrently. No changes applied."
        );
    }

    private void publishScheduleEvent(SpaScheduleAcceptedEvent event) {
        if (eventPublisher != null && event != null) {
            try {
                eventPublisher.publishEvent(event);
            } catch (Exception ex) {
                log.error("Failed to publish SpaScheduleAcceptedEvent from SessionRecoveryService: {}", ex.getMessage());
            }
        }
    }

    private String resolveCustomerEmail(Integer bookingId) {
        if (bookingId == null || customerStayPort == null) return null;
        try {
            Optional<StayContextDto> opt = customerStayPort.getStayById(bookingId);
            return opt.map(StayContextDto::getCustomerEmail).orElse(null);
        } catch (Exception ignored) {
            return null;
        }
    }

    private String resolveCustomerName(Integer bookingId) {
        if (bookingId == null || customerStayPort == null) return "Valued Guest";
        try {
            Optional<StayContextDto> opt = customerStayPort.getStayById(bookingId);
            return opt.map(StayContextDto::getCustomerName).orElse("Valued Guest");
        } catch (Exception ignored) {
            return "Valued Guest";
        }
    }
}
