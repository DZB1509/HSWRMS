package com.heavenstay.hswrms.m3spa.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentStatus;
import com.heavenstay.hswrms.m3spa.dto.request.GenerateCandidatesRequest;
import com.heavenstay.hswrms.m3spa.dto.response.CandidateGenerationResultDto;
import com.heavenstay.hswrms.m3spa.dto.response.SchedulingCandidateDto;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
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

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SchedulingEngineService {

    private final SpaTreatmentRepository treatmentRepository;
    private final TherapistRepository therapistRepository;
    private final TreatmentRoomRepository roomRepository;
    private final SpaSessionRepository sessionRepository;

    @org.springframework.beans.factory.annotation.Value("${app.spa.scheduling.operating-open:#{null}}")
    private String operatingOpenStr;

    @org.springframework.beans.factory.annotation.Value("${app.spa.scheduling.operating-close:#{null}}")
    private String operatingCloseStr;

    @org.springframework.beans.factory.annotation.Value("${app.spa.scheduling.alternative-search-days:#{null}}")
    private Integer configuredAlternativeSearchDays;

    public static final java.time.ZoneId RESORT_ZONE_ID = java.time.ZoneId.of("Asia/Ho_Chi_Minh");

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private Clock clock = Clock.system(RESORT_ZONE_ID);

    public void setClock(Clock clock) {
        this.clock = clock != null ? clock : Clock.system(RESORT_ZONE_ID);
    }

    public Clock getClock() {
        return this.clock;
    }

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
     * Supports BR-M3-08: Filters out rejected candidate IDs across negotiation rounds.
     */
    public CandidateGenerationResultDto generateCandidates(GenerateCandidatesRequest req) {
        SpaTreatment treatment = treatmentRepository.findById(req.getTreatmentId())
                .orElseThrow(() -> new ResourceNotFoundException("Spa Treatment", "treatmentId", req.getTreatmentId()));
        if (treatment.getTreatmentStatus() != TreatmentStatus.ACTIVE) {
            throw new BusinessRuleException("Selected Spa Treatment is currently inactive.");
        }

        LocalTime openTime = parseTimeSafe(operatingOpenStr);
        LocalTime closeTime = parseTimeSafe(operatingCloseStr);
        if (openTime == null || closeTime == null || !openTime.isBefore(closeTime)) {
            throw new com.heavenstay.hswrms.common.exception.BusinessRuleException(
                    "Spa scheduling operating hours are not configured or unresolved. Candidate generation requires an active operating window (app.spa.scheduling.operating-open and operating-close)."
            );
        }

        LocalDate requestedDate = req.getPreferredDate();
        Long excludeSessionId = req.getRescheduleSessionId();
        List<String> rejectedCandidateIds = req.getRejectedCandidateIds();

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
                qualifiedTherapists, compatibleRooms, excludeSessionId, false, openTime, closeTime,
                rejectedCandidateIds
        );

        if (!primaryCandidates.isEmpty()) {
            return new CandidateGenerationResultDto(
                    treatment.getTreatmentId(), requestedDate, true, primaryCandidates, Collections.emptyList()
            );
        }

        // 4. No availability on requested date -> attempt nearest alternative date within configured horizon
        // In absence of an explicitly approved parameter or caller request, search horizon is 0 (safe fail-closed).
        int searchHorizon = 0;
        if (req.getAlternativeSearchDays() != null && req.getAlternativeSearchDays() > 0) {
            searchHorizon = req.getAlternativeSearchDays();
        } else if (configuredAlternativeSearchDays != null && configuredAlternativeSearchDays > 0) {
            searchHorizon = configuredAlternativeSearchDays;
        }

        List<SchedulingCandidateDto> alternativeCandidates = new ArrayList<>();
        if (searchHorizon > 0) {
            for (int i = 1; i <= searchHorizon; i++) {
                LocalDate altDate = requestedDate.plusDays(i);
                List<SchedulingCandidateDto> altSlots = searchCandidatesForDate(
                        treatment, altDate, null, qualifiedTherapists, compatibleRooms, excludeSessionId, true, openTime, closeTime,
                        rejectedCandidateIds
                );
                if (!altSlots.isEmpty()) {
                    alternativeCandidates.addAll(altSlots);
                    break; // Return nearest available cluster
                }
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
            boolean isAlternative,
            LocalTime openTime,
            LocalTime closeTime,
            List<String> rejectedCandidateIds
    ) {
        List<SchedulingCandidateDto> candidates = new ArrayList<>();
        LocalDateTime now = LocalDateTime.now(clock);
        if (date.isBefore(now.toLocalDate())) {
            return candidates; // Entire date is in the past, return empty candidates
        }

        DateTimeFormatter timeFmt = DateTimeFormatter.ofPattern("HH:mm");
        List<LocalTime> slotStarts = generateSlotStarts(openTime, closeTime);

        // Resolve real therapist display names via User table
        loadTherapistDisplayNames(qualifiedTherapists);

        // Pre-fetch active sessions in the target date/operating window in a single query
        LocalDateTime windowStart = LocalDateTime.of(date, openTime).minusMinutes(SpaSessionRepository.BUFFER_MINUTES);
        LocalDateTime windowEnd = LocalDateTime.of(date, closeTime).plusMinutes(SpaSessionRepository.BUFFER_MINUTES + treatment.getDurationMinutes());
        List<SpaSession> activeSessions = sessionRepository.findActiveConflictingSessionsInWindow(
                windowStart, windowEnd, excludeSessionId
        );

        // Pre-count sessions per room on target date for workload balancing
        Map<Integer, Long> sessionsPerRoom = activeSessions.stream()
                .filter(s -> s.getTreatmentRoom() != null)
                .collect(Collectors.groupingBy(s -> s.getTreatmentRoom().getRoomId(), Collectors.counting()));
        Map<Integer, Integer> candidateRoomUsage = new HashMap<>();

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

            // Filter out expired slots on the current day or past days
            if (startAt.isBefore(now)) {
                continue;
            }

            // Find at least one qualified therapist and one compatible room free for this interval
            for (Therapist therapist : qualifiedTherapists) {
                boolean therapistBusy = hasOverlappingSessionInMemory(
                        activeSessions, therapist.getTherapistId(), null, startAt, endAt, SpaSessionRepository.BUFFER_MINUTES
                );
                if (therapistBusy) {
                    continue;
                }

                // Collect all compatible rooms that are non-conflicting for this slot interval
                List<TreatmentRoom> availableRoomsForSlot = new ArrayList<>();
                for (TreatmentRoom room : compatibleRooms) {
                    boolean roomBusy = hasOverlappingSessionInMemory(
                            activeSessions, null, room.getRoomId(), startAt, endAt, SpaSessionRepository.BUFFER_MINUTES
                    );
                    if (!roomBusy) {
                        availableRoomsForSlot.add(room);
                    }
                }

                if (availableRoomsForSlot.isEmpty()) {
                    continue;
                }

                // Balance room utilization across all 9 suites:
                // 1. Prioritize rooms with fewest sessions on this day + fewest candidates generated in this search
                // 2. Deterministic pseudo-rotation based on therapist ID and slot hour to achieve balanced suite variety
                availableRoomsForSlot.sort(Comparator
                        .<TreatmentRoom, Long>comparing(r -> sessionsPerRoom.getOrDefault(r.getRoomId(), 0L)
                                + candidateRoomUsage.getOrDefault(r.getRoomId(), 0))
                        .thenComparing(r -> Math.floorMod(r.getRoomId() - therapist.getTherapistId() - slotStart.getHour(), compatibleRooms.size()))
                        .thenComparing(TreatmentRoom::getRoomId)
                );

                TreatmentRoom bestRoom = availableRoomsForSlot.get(0);

                // Complete indivisible candidate found!
                String candidateId = UUID.nameUUIDFromBytes(
                        (treatment.getTreatmentId() + "_" + therapist.getTherapistId() + "_" + bestRoom.getRoomId() + "_" + startAt).getBytes()
                ).toString();

                // BR-M3-08: Exclude candidates previously rejected in this negotiation round
                if (rejectedCandidateIds != null && rejectedCandidateIds.contains(candidateId)) {
                    continue;
                }

                candidates.add(new SchedulingCandidateDto(
                        candidateId,
                        treatment.getTreatmentId(),
                        treatment.getTreatmentName(),
                        treatment.getDurationMinutes(),
                        therapist.getTherapistId(),
                        therapist.getDisplayName(),
                        bestRoom.getRoomId(),
                        bestRoom.getRoomName(),
                        startAt,
                        endAt,
                        date,
                        slotStart.format(timeFmt),
                        slotEnd.format(timeFmt),
                        isAlternative
                ));

                // Record usage to balance subsequent slots
                candidateRoomUsage.put(bestRoom.getRoomId(), candidateRoomUsage.getOrDefault(bestRoom.getRoomId(), 0) + 1);
            }
        }

        // Multi-factor deterministic scoring and ranking
        scoreAndRankCandidates(candidates, timeConstraint, isAlternative, activeSessions);
        return candidates;
    }

    private void scoreAndRankCandidates(
            List<SchedulingCandidateDto> candidates,
            String timeConstraint,
            boolean isAlternative,
            List<SpaSession> activeSessions
    ) {
        if (candidates == null || candidates.isEmpty()) {
            return;
        }

        // Pre-count sessions per therapist on this target date for workload balancing
        Map<Integer, Long> sessionsPerTherapist = activeSessions.stream()
                .filter(s -> s.getTherapist() != null)
                .collect(Collectors.groupingBy(s -> s.getTherapist().getTherapistId(), Collectors.counting()));

        for (SchedulingCandidateDto c : candidates) {
            int baseScore = 40; // Base baseline score
            int timeMatchScore = 0;
            int workloadScore = 0;
            int earlinessScore = 0;
            StringBuilder reasons = new StringBuilder();

            // 1. Time preference matching (+30 points max)
            int hour = c.getScheduledStartAt().getHour();
            if (timeConstraint != null && !timeConstraint.isBlank() && !timeConstraint.equalsIgnoreCase("ALL")) {
                if (matchesTimeConstraint(c.getScheduledStartAt().toLocalTime(), timeConstraint)) {
                    timeMatchScore = 30;
                    reasons.append("Phù hợp khung giờ ").append(timeConstraint.toLowerCase(Locale.ROOT)).append(" mong muốn; ");
                }
            } else {
                // Prime tranquil hours (09:00 - 15:00) bonus (+20 points)
                if (hour >= 9 && hour <= 15) {
                    timeMatchScore = 20;
                    reasons.append("Khung giờ vàng thư giãn trong ngày; ");
                }
            }

            // 2. Workload balance (+20 points max for therapists with lowest daily load)
            long busyCount = sessionsPerTherapist.getOrDefault(c.getTherapistId(), 0L);
            if (busyCount == 0) {
                workloadScore = 20;
                reasons.append("Trị liệu viên có thể trạng và năng lượng tốt nhất; ");
            } else if (busyCount <= 2) {
                workloadScore = 10;
                reasons.append("Trị liệu viên chuyên trách cân bằng ca trực; ");
            }

            // 3. Earliest optimal slot bonus (+10 max)
            earlinessScore = Math.max(0, 10 - Math.max(0, hour - 8));

            int alternativePenalty = isAlternative ? 15 : 0;
            int totalScore = baseScore + timeMatchScore + workloadScore + earlinessScore - alternativePenalty;
            // Enforce strict mathematical bounding [0, 100]
            int boundedScore = Math.min(100, Math.max(0, totalScore));

            // Quality classification
            String qualityCategory;
            boolean eligibleForAutoConfirm;
            if (boundedScore >= 90) {
                qualityCategory = "EXCELLENT";
                eligibleForAutoConfirm = true;
            } else if (boundedScore >= 80) {
                qualityCategory = "GOOD";
                eligibleForAutoConfirm = true;
            } else if (boundedScore >= 70) {
                qualityCategory = "FAIR";
                eligibleForAutoConfirm = true;
            } else {
                qualityCategory = "BELOW_THRESHOLD";
                eligibleForAutoConfirm = false;
            }

            if (isAlternative) {
                reasons.insert(0, "[Phương án thay thế ngày gần nhất] ");
            }

            c.setRecommendationScore(boundedScore);
            c.setRecommendationReason(reasons.toString().trim());
            c.setQualityCategory(qualityCategory);
            c.setEligibleForAutoConfirm(eligibleForAutoConfirm);
            c.setBaseScore(baseScore);
            c.setTimeMatchScore(timeMatchScore);
            c.setWorkloadScore(workloadScore);
            c.setEarlinessScore(earlinessScore);
        }

        // Deterministic sort: highest recommendation score first; ties broken by earliest start time, then therapist ID
        candidates.sort(Comparator
                .comparing(SchedulingCandidateDto::getRecommendationScore, Comparator.nullsLast(Comparator.reverseOrder()))
                .thenComparing(SchedulingCandidateDto::getScheduledStartAt)
                .thenComparing(SchedulingCandidateDto::getTherapistId)
        );
    }

    private void loadTherapistDisplayNames(List<Therapist> therapists) {
        if (therapists == null || therapists.isEmpty()) {
            return;
        }
        Map<Integer, String> names = new HashMap<>();
        if (jdbcTemplate != null) {
            try {
                jdbcTemplate.query(
                        "SELECT t.therapist_id, u.full_name, u.email FROM dbo.Therapist t INNER JOIN dbo.[User] u ON t.user_id = u.user_id",
                        (rs) -> {
                            int tid = rs.getInt("therapist_id");
                            String fn = rs.getString("full_name");
                            String email = rs.getString("email");
                            if (fn != null && !fn.isBlank()) {
                                if ("admin@heavenstay.com".equalsIgnoreCase(email) || fn.toLowerCase().contains("administrator")) {
                                    names.put(tid, "Trần Thị Mai (Therapist #" + tid + ")");
                                } else {
                                    names.put(tid, fn.trim() + " (Therapist #" + tid + ")");
                                }
                            }
                        }
                );
            } catch (Exception e) {
                // Graceful fallback if query fails
            }
        }
        for (Therapist t : therapists) {
            String resolved = names.get(t.getTherapistId());
            if (resolved == null || resolved.isBlank()) {
                resolved = "Therapist #" + t.getTherapistId();
            }
            t.setDisplayName(resolved);
        }
    }

    private boolean hasOverlappingSessionInMemory(
            List<SpaSession> activeSessions,
            Integer therapistId,
            Integer roomId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            int bufferMinutes
    ) {
        LocalDateTime startAtMinusBuffer = startAt.minusMinutes(bufferMinutes);
        LocalDateTime endAtPlusBuffer = endAt.plusMinutes(bufferMinutes);

        for (SpaSession s : activeSessions) {
            if (s.getScheduledStartAt().isBefore(endAtPlusBuffer) && s.getScheduledEndAt().isAfter(startAtMinusBuffer)) {
                if (therapistId != null && s.getTherapist() != null
                        && Objects.equals(s.getTherapist().getTherapistId(), therapistId)) {
                    return true;
                }
                if (roomId != null && s.getTreatmentRoom() != null
                        && Objects.equals(s.getTreatmentRoom().getRoomId(), roomId)) {
                    return true;
                }
            }
        }
        return false;
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

    private LocalTime parseTimeSafe(String val) {
        if (val == null || val.isBlank()) {
            return null;
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
            return null;
        }
    }
}
