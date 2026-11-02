package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m3spa.dto.request.ConfirmReservationRequest;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.dto.response.TherapistSessionDetailDto;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.entity.enums.*;
import com.heavenstay.hswrms.m3spa.port.BillingPort;
import com.heavenstay.hswrms.m3spa.port.CustomerStayPort;
import com.heavenstay.hswrms.m3spa.port.StayContextDto;
import com.heavenstay.hswrms.m3spa.port.TherapistHealthProjectionPort;
import com.heavenstay.hswrms.m3spa.port.TreatmentSafetyNotesDto;
import com.heavenstay.hswrms.m3spa.repository.*;
import com.heavenstay.hswrms.m3spa.service.event.SpaScheduleAcceptedEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class SpaSessionService {

    private static final Logger log = LoggerFactory.getLogger(SpaSessionService.class);

    private final SpaSessionRepository sessionRepository;
    private final SpaTreatmentRepository treatmentRepository;
    private final TherapistRepository therapistRepository;
    private final TreatmentRoomRepository roomRepository;
    private final TherapistTreatmentQualificationRepository qualificationRepository;
    private final TreatmentRoomCompatibilityRepository compatibilityRepository;
    private final CustomerStayPort customerStayPort;
    private final TherapistHealthProjectionPort healthProjectionPort;
    private final BillingPort billingPort;
    private final ApplicationEventPublisher eventPublisher;

    public SpaSessionService(
            SpaSessionRepository sessionRepository,
            SpaTreatmentRepository treatmentRepository,
            TherapistRepository therapistRepository,
            TreatmentRoomRepository roomRepository,
            TherapistTreatmentQualificationRepository qualificationRepository,
            TreatmentRoomCompatibilityRepository compatibilityRepository,
            CustomerStayPort customerStayPort,
            TherapistHealthProjectionPort healthProjectionPort,
            BillingPort billingPort
    ) {
        this(sessionRepository, treatmentRepository, therapistRepository, roomRepository,
                qualificationRepository, compatibilityRepository, customerStayPort, healthProjectionPort, billingPort, null);
    }

    @Autowired
    public SpaSessionService(
            SpaSessionRepository sessionRepository,
            SpaTreatmentRepository treatmentRepository,
            TherapistRepository therapistRepository,
            TreatmentRoomRepository roomRepository,
            TherapistTreatmentQualificationRepository qualificationRepository,
            TreatmentRoomCompatibilityRepository compatibilityRepository,
            CustomerStayPort customerStayPort,
            TherapistHealthProjectionPort healthProjectionPort,
            BillingPort billingPort,
            @Autowired(required = false) ApplicationEventPublisher eventPublisher
    ) {
        this.sessionRepository = sessionRepository;
        this.treatmentRepository = treatmentRepository;
        this.therapistRepository = therapistRepository;
        this.roomRepository = roomRepository;
        this.qualificationRepository = qualificationRepository;
        this.compatibilityRepository = compatibilityRepository;
        this.customerStayPort = customerStayPort;
        this.healthProjectionPort = healthProjectionPort;
        this.billingPort = billingPort;
        this.eventPublisher = eventPublisher;
    }

    /**
     * Critical Concurrency Boundary: Atomic Reservation.
     * Uses @Transactional with pessimistic resource locking to serialize concurrent confirmations.
     */
    @Transactional
    public SpaSessionDto confirmReservation(ConfirmReservationRequest req, Integer authenticatedUserId) {
        Integer resolvedBookingId;
        StayContextDto stay = null;
        if (req.getRetreatBookingId() != null) {
            Integer bId = req.getRetreatBookingId();
            stay = customerStayPort.getStayById(bId)
                    .orElseThrow(() -> new ResourceNotFoundException("Retreat Booking", "bookingId", bId));
            resolvedBookingId = bId;
        } else if (authenticatedUserId != null) {
            stay = customerStayPort.getActiveStayForUser(authenticatedUserId)
                    .orElseThrow(() -> new BusinessRuleException("No active retreat stay found for current user."));
            resolvedBookingId = stay.getBookingId();
        } else {
            throw new BusinessRuleException("Authenticated customer context or retreat booking ID is required.");
        }

        // 2. Validate Treatment
        SpaTreatment treatment = treatmentRepository.findById(req.getTreatmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Spa Treatment", "treatmentId", req.getTreatmentId()));
        if (treatment.getTreatmentStatus() != TreatmentStatus.ACTIVE) {
            throw new BusinessRuleException("Selected Spa Treatment is currently inactive.");
        }

        // 3. Acquire Pessimistic Locks on Therapist & Treatment Room to serialize concurrent bookings
        Therapist therapist = therapistRepository.findByIdWithLock(req.getTherapistId())
                .orElseThrow(() -> new ResourceNotFoundException("Therapist", "therapistId", req.getTherapistId()));
        if (therapist.getTherapistStatus() != TherapistStatus.ACTIVE) {
            throw new ConflictException("Selected Therapist is no longer available.");
        }

        TreatmentRoom room = roomRepository.findByIdWithLock(req.getRoomId())
                .orElseThrow(() -> new ResourceNotFoundException("Treatment Room", "roomId", req.getRoomId()));
        if (room.getRoomStatus() != TreatmentRoomStatus.AVAILABLE) {
            throw new ConflictException("Selected Treatment Room is no longer available.");
        }

        // 4. Validate Qualification & Compatibility
        boolean qualified = qualificationRepository.existsByTherapist_TherapistIdAndTreatment_TreatmentId(
                therapist.getTherapistId(), treatment.getTreatmentId()
        );
        if (!qualified) {
            throw new BusinessRuleException("Therapist is not qualified for the selected Spa Treatment.");
        }

        boolean compatible = compatibilityRepository.existsByTreatmentRoom_RoomIdAndTreatment_TreatmentId(
                room.getRoomId(), treatment.getTreatmentId()
        );
        if (!compatible) {
            throw new BusinessRuleException("Treatment Room is not compatible with the selected Spa Treatment.");
        }

        // 5. Concurrency Check: Verify Interval Non-Overlap
        Long excludeSessionId = req.getRescheduleSessionId();
        boolean hasConflict = sessionRepository.hasOverlappingSession(
                therapist.getTherapistId(),
                room.getRoomId(),
                req.getScheduledStartAt(),
                req.getScheduledEndAt(),
                excludeSessionId
        );
        if (hasConflict) {
            throw new ConflictException("Scheduling conflict: Therapist or Treatment Room is already reserved for this time interval.");
        }

        boolean isIncluded = stay != null && customerStayPort.isTreatmentIncludedInPackage(stay.getPackageId(), treatment.getTreatmentId());

        // 6. Handle Customer Reschedule vs. New Booking
        if (excludeSessionId != null) {
            SpaSession existingSession = sessionRepository.findByIdWithLock(excludeSessionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Spa Session", "sessionId", excludeSessionId));

            // Verify ownership
            if (!existingSession.getRetreatBookingId().equals(resolvedBookingId)) {
                throw new BusinessRuleException("Unauthorized: Cannot reschedule a session belonging to another retreat booking.");
            }

            // Verify eligible status
            if (existingSession.getSessionStatus() == SpaSessionStatus.CANCELLED ||
                existingSession.getSessionStatus() == SpaSessionStatus.COMPLETED ||
                existingSession.getSessionStatus() == SpaSessionStatus.NO_SHOW) {
                throw new BusinessRuleException("Cannot reschedule a session in status " + existingSession.getSessionStatus());
            }

            // Capture previous state for audit history (BR-M3-14)
            String prevStatus = existingSession.getSessionStatus() != null ? existingSession.getSessionStatus().name() : null;
            LocalDateTime prevStart = existingSession.getScheduledStartAt();
            Integer prevTherapist = existingSession.getTherapist() != null ? existingSession.getTherapist().getTherapistId() : null;
            Integer prevRoom = existingSession.getTreatmentRoom() != null ? existingSession.getTreatmentRoom().getRoomId() : null;

            // Atomically update session assignments
            existingSession.setTreatment(treatment);
            existingSession.setTherapist(therapist);
            existingSession.setTreatmentRoom(room);
            existingSession.setScheduledStartAt(req.getScheduledStartAt());
            existingSession.setScheduledEndAt(req.getScheduledEndAt());
            existingSession.setSessionStatus(SpaSessionStatus.SCHEDULED);
            existingSession.setConfirmationStatus(SpaConfirmationStatus.PENDING);
            existingSession.resetReminderState();
            if (req.getCustomerNote() != null) {
                existingSession.setCustomerNote(req.getCustomerNote());
            }

            SpaSession updated = sessionRepository.save(existingSession);

            StayDetails stayInfo = resolveStayDetails(resolvedBookingId);
            publishScheduleEvent(new SpaScheduleAcceptedEvent(
                    updated, "RESCHEDULED", prevStatus, updated.getSessionStatus().name(),
                    prevStart, updated.getScheduledStartAt(),
                    prevTherapist, updated.getTherapist().getTherapistId(),
                    prevRoom, updated.getTreatmentRoom().getRoomId(),
                    authenticatedUserId, "Customer", req.getCustomerNote(),
                    stayInfo.email, stayInfo.name
            ));

            return toDto(updated, stay != null ? stay.getCustomerName() : "Customer", isIncluded);
        } else {
            // New Session
            SpaSession newSession = new SpaSession(
                    resolvedBookingId,
                    treatment,
                    therapist,
                    room,
                    req.getScheduledStartAt(),
                    req.getScheduledStartAt(),
                    req.getScheduledEndAt(),
                    req.getBookingSource() != null ? req.getBookingSource() : BookingSource.CUSTOMER,
                    req.getCustomerNote()
            );

            SpaSession saved = sessionRepository.save(newSession);

            // Record extra charge if not included in retreat package (OI-01)
            if (!isIncluded) {
                billingPort.recordExtraSpaCharge(
                        saved.getSpaSessionId(),
                        resolvedBookingId,
                        treatment.getBasePrice(),
                        "Extra Spa: " + treatment.getTreatmentName()
                );
            }

            StayDetails stayInfo = resolveStayDetails(resolvedBookingId);
            publishScheduleEvent(new SpaScheduleAcceptedEvent(
                    saved, "CREATED", null, saved.getSessionStatus().name(),
                    null, saved.getScheduledStartAt(),
                    null, saved.getTherapist().getTherapistId(),
                    null, saved.getTreatmentRoom().getRoomId(),
                    authenticatedUserId, "Customer", req.getCustomerNote(),
                    stayInfo.email, stayInfo.name
            ));

            return toDto(saved, stay != null ? stay.getCustomerName() : "Customer", isIncluded);
        }
    }

    /**
     * Customer attendance confirmation: transitions PENDING -> CONFIRMED.
     */
    @Transactional
    public SpaSessionDto confirmAttendance(Long sessionId, Integer authenticatedUserId) {
        // Concern C: Serialized attendance confirmation using pessimistic write lock
        SpaSession session = sessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Spa Session", "sessionId", sessionId));

        if (authenticatedUserId != null) {
            Optional<StayContextDto> stayOpt = customerStayPort.getActiveStayForUser(authenticatedUserId);
            if (stayOpt.isPresent() && !session.getRetreatBookingId().equals(stayOpt.get().getBookingId())) {
                throw new BusinessRuleException("Unauthorized: Cannot modify a session belonging to another customer.");
            }
        }

        if (session.getSessionStatus() != SpaSessionStatus.SCHEDULED) {
            throw new BusinessRuleException("Cannot confirm attendance: session is in " + session.getSessionStatus() + " state.");
        }

        if (session.getConfirmationStatus() == SpaConfirmationStatus.EXPIRED) {
            throw new BusinessRuleException("Cannot confirm attendance: confirmation window has expired. Please reschedule.");
        }

        if (session.getConfirmationStatus() != SpaConfirmationStatus.PENDING) {
            throw new BusinessRuleException("Session attendance is already " + session.getConfirmationStatus());
        }

        String prevConfirmation = session.getConfirmationStatus() != null ? session.getConfirmationStatus().name() : "PENDING";
        session.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);
        SpaSession updated = sessionRepository.save(session);

        StayDetails stayInfo = resolveStayDetails(updated.getRetreatBookingId());
        publishScheduleEvent(new SpaScheduleAcceptedEvent(
                updated, "ATTENDANCE_CONFIRMED", prevConfirmation, updated.getConfirmationStatus().name(),
                updated.getScheduledStartAt(), updated.getScheduledStartAt(),
                updated.getTherapist() != null ? updated.getTherapist().getTherapistId() : null,
                updated.getTherapist() != null ? updated.getTherapist().getTherapistId() : null,
                updated.getTreatmentRoom() != null ? updated.getTreatmentRoom().getRoomId() : null,
                updated.getTreatmentRoom() != null ? updated.getTreatmentRoom().getRoomId() : null,
                authenticatedUserId, "Customer", "Customer attendance confirmed",
                stayInfo.email, stayInfo.name
        ));

        return toDto(updated, "Customer", true);
    }

    /**
     * Session Cancellation.
     */
    @Transactional
    public SpaSessionDto cancelSession(Long sessionId, Integer authenticatedUserId) {
        // Concern C: Serialized attendance confirmation using pessimistic write lock
        SpaSession session = sessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Spa Session", "sessionId", sessionId));

        if (authenticatedUserId != null) {
            Optional<StayContextDto> stayOpt = customerStayPort.getActiveStayForUser(authenticatedUserId);
            if (stayOpt.isPresent() && !session.getRetreatBookingId().equals(stayOpt.get().getBookingId())) {
                throw new BusinessRuleException("Unauthorized: Cannot cancel a session belonging to another customer.");
            }
        }

        if (session.getSessionStatus() == SpaSessionStatus.CANCELLED) {
            // Idempotent cancellation: safe handling of duplicate or repeated cancellation requests
            return toDto(session, "Customer", true);
        }

        if (session.getSessionStatus() == SpaSessionStatus.COMPLETED) {
            throw new BusinessRuleException("Cannot cancel session already " + session.getSessionStatus());
        }

        String prevSessionStatus = session.getSessionStatus() != null ? session.getSessionStatus().name() : "SCHEDULED";
        session.setSessionStatus(SpaSessionStatus.CANCELLED);
        session.setConfirmationStatus(SpaConfirmationStatus.DECLINED);
        SpaSession updated = sessionRepository.save(session);

        StayDetails stayInfo = resolveStayDetails(updated.getRetreatBookingId());
        publishScheduleEvent(new SpaScheduleAcceptedEvent(
                updated, "CANCELLED", prevSessionStatus, "CANCELLED",
                updated.getScheduledStartAt(), updated.getScheduledStartAt(),
                updated.getTherapist() != null ? updated.getTherapist().getTherapistId() : null,
                updated.getTherapist() != null ? updated.getTherapist().getTherapistId() : null,
                updated.getTreatmentRoom() != null ? updated.getTreatmentRoom().getRoomId() : null,
                updated.getTreatmentRoom() != null ? updated.getTreatmentRoom().getRoomId() : null,
                authenticatedUserId, "Customer", "Customer requested cancellation",
                stayInfo.email, stayInfo.name
        ));

        return toDto(updated, "Customer", true);
    }

    /**
     * List sessions for the authenticated customer.
     */
    @Transactional(readOnly = true)
    public List<SpaSessionDto> listCustomerSessions(Integer authenticatedUserId) {
        if (authenticatedUserId == null) {
            return Collections.emptyList();
        }
        Optional<StayContextDto> stayOpt = customerStayPort.getActiveStayForUser(authenticatedUserId);
        if (stayOpt.isEmpty()) {
            return Collections.emptyList();
        }
        StayContextDto stay = stayOpt.get();
        List<SpaSession> sessions = sessionRepository.findByRetreatBookingIdOrderByScheduledStartAtAsc(stay.getBookingId());
        return sessions.stream().map(s -> {
            boolean isIncluded = stay.getPackageId() != null && customerStayPort.isTreatmentIncludedInPackage(stay.getPackageId(), s.getTreatment().getTreatmentId());
            return toDto(s, stay.getCustomerName(), isIncluded);
        }).collect(Collectors.toList());
    }

    /**
     * Therapist daily schedule: restricted to authenticated therapist.
     */
    @Transactional(readOnly = true)
    public List<SpaSessionDto> listTherapistSchedule(Integer therapistUserId, LocalDate date) {
        Therapist therapist = resolveTherapistForUser(therapistUserId);

        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.atTime(23, 59, 59);

        List<SpaSession> sessions = sessionRepository.findByTherapist_TherapistIdAndScheduledStartAtBetweenOrderByScheduledStartAtAsc(
                therapist.getTherapistId(), startOfDay, endOfDay
        );

        return sessions.stream()
                .map(s -> toDto(s, "Customer", false))
                .collect(Collectors.toList());
    }

    /**
     * Therapist Dashboard: upcoming and today's assigned sessions.
     */
    @Transactional(readOnly = true)
    public List<SpaSessionDto> listTherapistUpcomingSessions(Integer therapistUserId) {
        Therapist therapist = resolveTherapistForUser(therapistUserId);

        List<SpaSession> sessions = sessionRepository.findByTherapist_TherapistIdOrderByScheduledStartAtAsc(
                therapist.getTherapistId()
        );

        return sessions.stream()
                .map(s -> toDto(s, "Customer", false))
                .collect(Collectors.toList());
    }

    /**
     * Therapist session detail with privacy-first wellness projection.
     */
    @Transactional(readOnly = true)
    public TherapistSessionDetailDto getTherapistSessionDetail(Long sessionId, Integer therapistUserId) {
        // Concern C: Serialized attendance confirmation using pessimistic write lock
        SpaSession session = sessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Spa Session", "sessionId", sessionId));

        Therapist therapist = resolveTherapistForUser(therapistUserId);
        if (!session.getTherapist().getTherapistId().equals(therapist.getTherapistId())) {
            throw new BusinessRuleException("Therapist is not authorized to access sessions assigned to another therapist.");
        }

        TreatmentSafetyNotesDto safetyNotes = healthProjectionPort.getTreatmentSafetyNotes(session.getRetreatBookingId());

        TherapistSessionDetailDto dto = new TherapistSessionDetailDto();
        dto.setSpaSessionId(session.getSpaSessionId());
        dto.setTreatmentName(session.getTreatment().getTreatmentName());
        dto.setDurationMinutes(session.getTreatment().getDurationMinutes());
        dto.setScheduledStartAt(session.getScheduledStartAt());
        dto.setScheduledEndAt(session.getScheduledEndAt());
        dto.setRoomName(session.getTreatmentRoom().getRoomName());
        dto.setCustomerFirstName(safetyNotes.getCustomerFirstName());
        dto.setTreatmentSafetyNotes(safetyNotes.getTreatmentSafetyNotes());
        dto.setRelevantPrecautions(safetyNotes.getRelevantPrecautions());
        dto.setSessionStatus(session.getSessionStatus());
        dto.setConfirmationStatus(session.getConfirmationStatus());
        dto.setCustomerNote(session.getCustomerNote());
        return dto;
    }

    /**
     * Record session outcome: COMPLETED or NO_SHOW.
     * Rejects IN_PROGRESS per OI-08.
     */
    @Transactional
    public SpaSessionDto recordSessionOutcome(Long sessionId, Integer therapistUserId, String outcome, String notes) {
        if ("IN_PROGRESS".equalsIgnoreCase(outcome)) {
            throw new BusinessRuleException("IN_PROGRESS is not an approved persisted session status (OI-08).");
        }

        if (!"COMPLETED".equalsIgnoreCase(outcome) && !"NO_SHOW".equalsIgnoreCase(outcome)) {
            throw new BusinessRuleException("Invalid session outcome. Permitted outcomes: COMPLETED, NO_SHOW.");
        }

        // Concern C: Serialized attendance confirmation using pessimistic write lock
        SpaSession session = sessionRepository.findByIdWithLock(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Spa Session", "sessionId", sessionId));

        Therapist therapist = resolveTherapistForUser(therapistUserId);
        if (!session.getTherapist().getTherapistId().equals(therapist.getTherapistId())) {
            throw new BusinessRuleException("Therapist is not authorized to update outcomes for another therapist's session.");
        }

        String prevOutcomeStatus = session.getSessionStatus() != null ? session.getSessionStatus().name() : "SCHEDULED";
        session.setSessionStatus(SpaSessionStatus.valueOf(outcome.toUpperCase()));
        SpaSession updated = sessionRepository.save(session);

        StayDetails stayInfo = resolveStayDetails(updated.getRetreatBookingId());
        publishScheduleEvent(new SpaScheduleAcceptedEvent(
                updated, outcome.toUpperCase(), prevOutcomeStatus, outcome.toUpperCase(),
                updated.getScheduledStartAt(), updated.getScheduledStartAt(),
                updated.getTherapist() != null ? updated.getTherapist().getTherapistId() : null,
                updated.getTherapist() != null ? updated.getTherapist().getTherapistId() : null,
                updated.getTreatmentRoom() != null ? updated.getTreatmentRoom().getRoomId() : null,
                updated.getTreatmentRoom() != null ? updated.getTreatmentRoom().getRoomId() : null,
                therapistUserId, "Therapist", notes,
                stayInfo.email, stayInfo.name
        ));

        return toDto(updated, "Customer", true);
    }

    private Therapist resolveTherapistForUser(Integer userId) {
        if (userId == null) {
            throw new BusinessRuleException("Authenticated therapist context is required.");
        }
        return therapistRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Therapist record not found for user ID: " + userId));
    }

    private void publishScheduleEvent(SpaScheduleAcceptedEvent event) {
        if (eventPublisher != null && event != null) {
            try {
                eventPublisher.publishEvent(event);
            } catch (Exception ex) {
                log.error("Failed to publish SpaScheduleAcceptedEvent: {}", ex.getMessage());
            }
        }
    }

    private StayDetails resolveStayDetails(Integer bookingId) {
        if (bookingId == null || customerStayPort == null) {
            return new StayDetails(null, "Valued Guest");
        }
        try {
            Optional<StayContextDto> opt = customerStayPort.getStayById(bookingId);
            if (opt.isPresent()) {
                StayContextDto s = opt.get();
                return new StayDetails(s.getCustomerEmail(), s.getCustomerName() != null ? s.getCustomerName() : "Valued Guest");
            }
        } catch (Exception ignored) {
        }
        return new StayDetails(null, "Valued Guest");
    }

    private static class StayDetails {
        final String email;
        final String name;

        StayDetails(String email, String name) {
            this.email = email;
            this.name = name;
        }
    }

    public SpaSessionDto toDto(SpaSession s) {
        return toDto(s, "Valued Guest", false);
    }

    private SpaSessionDto toDto(SpaSession s, String customerName, boolean isIncluded) {
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        SpaSessionDto dto = new SpaSessionDto();
        dto.setSpaSessionId(s.getSpaSessionId());
        dto.setRetreatBookingId(s.getRetreatBookingId());
        dto.setBookingReference("HSW-" + s.getRetreatBookingId());
        dto.setCustomerName(customerName);
        dto.setTreatmentId(s.getTreatment().getTreatmentId());
        dto.setTreatmentName(s.getTreatment().getTreatmentName());
        dto.setDurationMinutes(s.getTreatment().getDurationMinutes());
        dto.setBasePrice(s.getTreatment().getBasePrice());
        dto.setIncluded(isIncluded);
        dto.setTherapistId(s.getTherapist().getTherapistId());
        dto.setTherapistName(s.getTherapist().getDisplayName());
        dto.setRoomId(s.getTreatmentRoom().getRoomId());
        dto.setRoomName(s.getTreatmentRoom().getRoomName());
        dto.setScheduledStartAt(s.getScheduledStartAt());
        dto.setScheduledEndAt(s.getScheduledEndAt());
        dto.setDate(s.getScheduledStartAt().toLocalDate());
        dto.setStartTime(s.getScheduledStartAt().toLocalTime().format(timeFmt));
        dto.setEndTime(s.getScheduledEndAt().toLocalTime().format(timeFmt));
        dto.setBookingSource(s.getBookingSource());
        dto.setSessionStatus(s.getSessionStatus());
        dto.setConfirmationStatus(s.getConfirmationStatus());
        dto.setCustomerNote(s.getCustomerNote());
        dto.setReminderStatus(s.getReminderStatus());
        dto.setReminderClaimedAt(s.getReminderClaimedAt());
        dto.setReminderClaimExpiresAt(s.getReminderClaimExpiresAt());
        dto.setReminderSentAt(s.getReminderSentAt());
        return dto;
    }
}
