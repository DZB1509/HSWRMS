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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
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
        SpaSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Spa Session", "sessionId", sessionId));

        LocalDateTime startAt = session.getScheduledStartAt();
        LocalDateTime endAt = session.getScheduledEndAt();
        Integer treatmentId = session.getTreatment().getTreatmentId();

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

        // 3. Same-time recovery success
        if (targetTherapist != null && targetRoom != null) {
            log.info("Same-time recovery successful for session #{}. Preserved interval {}-{}. Assigned therapist #{}, room #{}.",
                    sessionId, startAt, endAt, targetTherapist.getTherapistId(), targetRoom.getRoomId());

            String prevStatus = session.getSessionStatus() != null ? session.getSessionStatus().name() : "SCHEDULED";
            session.setTherapist(targetTherapist);
            session.setTreatmentRoom(targetRoom);
            session.setSessionStatus(SpaSessionStatus.SCHEDULED);
            session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
            SpaSession saved = sessionRepository.save(session);

            publishScheduleEvent(new SpaScheduleAcceptedEvent(
                    saved, "RECOVERED", prevStatus, "SCHEDULED",
                    startAt, startAt,
                    currentTherapist.getTherapistId(), targetTherapist.getTherapistId(),
                    currentRoom.getRoomId(), targetRoom.getRoomId(),
                    null, "SYSTEM", "Automated same-time rematching",
                    resolveCustomerEmail(saved.getRetreatBookingId()),
                    resolveCustomerName(saved.getRetreatBookingId())
            ));

            return new RecoveryResultDto(
                    sessionId,
                    true,
                    true,
                    false,
                    targetTherapist.getTherapistId(),
                    targetRoom.getRoomId(),
                    "Same-time recovery succeeded. Preserved original schedule."
            );
        }

        // 4. Same-time recovery impossible: Time-change required
        // System MUST NOT silently commit a new time without customer consent!
        log.info("Same-time recovery unavailable for session #{}. Retaining in RESCHEDULING status awaiting Customer consent.", sessionId);
        String prevStatus = session.getSessionStatus() != null ? session.getSessionStatus().name() : "SCHEDULED";
        session.setSessionStatus(SpaSessionStatus.RESCHEDULING);
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
