package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m3spa.dto.request.GenerateCandidatesRequest;
import com.heavenstay.hswrms.m3spa.dto.response.CandidateGenerationResultDto;
import com.heavenstay.hswrms.m3spa.dto.response.SchedulingCandidateDto;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Transactional(readOnly = true)
public class SchedulingEngineService {

    private final SpaTreatmentRepository treatmentRepository;
    private final TherapistRepository therapistRepository;
    private final TreatmentRoomRepository roomRepository;
    private final SpaSessionRepository sessionRepository;

    @org.springframework.beans.factory.annotation.Value("${app.spa.scheduling.operating-open:08:00}")
    private String operatingOpenStr = "08:00";

    @org.springframework.beans.factory.annotation.Value("${app.spa.scheduling.operating-close:20:00}")
    private String operatingCloseStr = "20:00";

    @org.springframework.beans.factory.annotation.Value("${app.spa.scheduling.alternative-search-days:3}")
    private int defaultAlternativeSearchDays = 3;

    public SchedulingEngineService(SpaTreatmentRepository treatmentRepository,
                                   TherapistRepository therapistRepository,
                                   TreatmentRoomRepository roomRepository,
                                   SpaSessionRepository sessionRepository) {
        this.treatmentRepository = treatmentRepository;
        this.therapistRepository = therapistRepository;
        this.roomRepository = roomRepository;
        this.sessionRepository = sessionRepository;
    }

    /**
     * Pure READ-ONLY candidate generation.
     * Generates indivisible bundles: Time Slot + Qualified Therapist + Compatible Room.
     * Does NOT reserve resources or persist any session.
     */
    public CandidateGenerationResultDto generateCandidates(GenerateCandidatesRequest req) {
        SpaTreatment treatment = treatmentRepository.findById(req.getTreatmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Spa Treatment", "treatmentId", req.getTreatmentId()));

        LocalDate requestedDate = req.getPreferredDate();
        Long excludeSessionId = req.getRescheduleSessionId();

        // 1. Find qualified therapists
        List<Therapist> qualifiedTherapists = therapistRepository.findQualifiedTherapists(
                treatment.getTreatmentId(), TherapistStatus.ACTIVE
        );

        // 2. Find compatible treatment rooms
        List<TreatmentRoom> compatibleRooms = roomRepository.findCompatibleRooms(
                treatment.getTreatmentId(), TreatmentRoomStatus.AVAILABLE
        );

        if (qualifiedTherapists.isEmpty() || compatibleRooms.isEmpty()) {
            return new CandidateGenerationResultDto(
                    treatment.getTreatmentId(), requestedDate, false, Collections.emptyList(), Collections.emptyList()
            );
        }

        // 3. Search slots for requested date
        List<SchedulingCandidateDto> primaryCandidates = searchCandidatesForDate(
                treatment, requestedDate, req.getTimeRangeConstraint(),
                qualifiedTherapists, compatibleRooms, excludeSessionId, false
        );

        if (!primaryCandidates.isEmpty()) {
            return new CandidateGenerationResultDto(
                    treatment.getTreatmentId(), requestedDate, true, primaryCandidates, Collections.emptyList()
            );
        }

        // 4. No availability on requested date -> attempt nearest alternative date within configured horizon
        int searchHorizon = req.getAlternativeSearchDays() != null && req.getAlternativeSearchDays() > 0
                ? req.getAlternativeSearchDays()
                : defaultAlternativeSearchDays;

        List<SchedulingCandidateDto> alternativeCandidates = new ArrayList<>();
        for (int i = 1; i <= searchHorizon; i++) {
            LocalDate altDate = requestedDate.plusDays(i);
            List<SchedulingCandidateDto> altSlots = searchCandidatesForDate(
                    treatment, altDate, null, qualifiedTherapists, compatibleRooms, excludeSessionId, true
            );
            if (!altSlots.isEmpty()) {
                alternativeCandidates.addAll(altSlots);
                break; // Return nearest available cluster
            }
        }

        return new CandidateGenerationResultDto(
                treatment.getTreatmentId(), requestedDate, false, Collections.emptyList(), alternativeCandidates
        );
    }

    private List<SchedulingCandidateDto> searchCandidatesForDate(
            SpaTreatment treatment,
            LocalDate date,
            String timeConstraint,
            List<Therapist> qualifiedTherapists,
            List<TreatmentRoom> compatibleRooms,
            Long excludeSessionId,
            boolean isAlternative
    ) {
        List<SchedulingCandidateDto> candidates = new ArrayList<>();
        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        LocalTime openTime = parseTimeSafe(operatingOpenStr, LocalTime.of(8, 0));
        LocalTime closeTime = parseTimeSafe(operatingCloseStr, LocalTime.of(20, 0));
        List<LocalTime> slotStarts = generateSlotStarts(openTime, closeTime);

        for (LocalTime slotStart : slotStarts) {
            if (!matchesTimeConstraint(slotStart, timeConstraint)) {
                continue;
            }

            LocalTime slotEnd = slotStart.plusMinutes(treatment.getDurationMinutes());
            if (slotEnd.isAfter(closeTime)) {
                continue;
            }

            LocalDateTime startAt = LocalDateTime.of(date, slotStart);
            LocalDateTime endAt = LocalDateTime.of(date, slotEnd);

            // Find at least one qualified therapist and one compatible room free for this interval
            for (Therapist therapist : qualifiedTherapists) {
                boolean therapistBusy = sessionRepository.hasOverlappingSession(
                        therapist.getTherapistId(), null, startAt, endAt, excludeSessionId
                );
                if (therapistBusy) {
                    continue;
                }

                for (TreatmentRoom room : compatibleRooms) {
                    boolean roomBusy = sessionRepository.hasOverlappingSession(
                            null, room.getRoomId(), startAt, endAt, excludeSessionId
                    );
                    if (roomBusy) {
                        continue;
                    }

                    // Complete indivisible candidate found!
                    String candidateId = UUID.nameUUIDFromBytes(
                            (treatment.getTreatmentId() + "_" + therapist.getTherapistId() + "_" + room.getRoomId() + "_" + startAt).getBytes()
                    ).toString();

                    candidates.add(new SchedulingCandidateDto(
                            candidateId,
                            treatment.getTreatmentId(),
                            treatment.getTreatmentName(),
                            treatment.getDurationMinutes(),
                            therapist.getTherapistId(),
                            therapist.getDisplayName(),
                            room.getRoomId(),
                            room.getRoomName(),
                            startAt,
                            endAt,
                            date,
                            slotStart.format(timeFmt),
                            slotEnd.format(timeFmt),
                            isAlternative
                    ));

                    // One viable bundle per slot is sufficient for selection variety, or collect up to 2
                    break;
                }
            }
        }

        return candidates;
    }

    private boolean matchesTimeConstraint(LocalTime time, String constraint) {
        if (constraint == null || constraint.equalsIgnoreCase("ALL") || constraint.isBlank()) {
            return true;
        }
        int hour = time.getHour();
        switch (constraint.toUpperCase()) {
            case "MORNING":
                return hour < 12;
            case "AFTERNOON":
                return hour >= 12 && hour < 17;
            case "EVENING":
                return hour >= 17;
            default:
                return true;
        }
    }

    private List<LocalTime> generateSlotStarts(LocalTime openTime, LocalTime closeTime) {
        List<LocalTime> slots = new ArrayList<>();
        LocalTime current = openTime;
        while (!current.isAfter(closeTime.minusMinutes(30))) {
            slots.add(current);
            current = current.plusMinutes(30);
        }
        return slots;
    }

    private LocalTime parseTimeSafe(String val, LocalTime fallback) {
        if (val == null || val.isBlank()) {
            return fallback;
        }
        String clean = val.trim();
        try {
            if (clean.matches("^\\d{1,4}$")) {
                int num = Integer.parseInt(clean);
                int hours = num / 60;
                int mins = num % 60;
                if (hours >= 0 && hours < 24 && mins >= 0 && mins < 60) {
                    return LocalTime.of(hours, mins);
                }
            }
            return LocalTime.parse(clean);
        } catch (Exception e) {
            return fallback;
        }
    }
}
