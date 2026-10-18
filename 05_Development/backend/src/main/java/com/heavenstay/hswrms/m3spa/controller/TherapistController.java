package com.heavenstay.hswrms.m3spa.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m3spa.dto.request.CompleteSessionRequest;
import com.heavenstay.hswrms.m3spa.dto.response.SpaSessionDto;
import com.heavenstay.hswrms.m3spa.dto.response.TherapistSessionDetailDto;
import com.heavenstay.hswrms.m3spa.service.SpaSessionService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/therapist")
public class TherapistController {

    private final SpaSessionService spaSessionService;

    public TherapistController(SpaSessionService spaSessionService) {
        this.spaSessionService = spaSessionService;
    }

    /**
     * Screen 31: Therapist Dashboard.
     * Displays today's and upcoming sessions assigned to the authenticated therapist.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<ApiResponse<List<SpaSessionDto>>> getDashboard(
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        List<SpaSessionDto> sessions = spaSessionService.listTherapistUpcomingSessions(userId);
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    /**
     * Screen 32: Therapist Daily Schedule.
     * Chronologically ordered sessions assigned to the authenticated therapist for a given date.
     */
    @GetMapping("/schedule")
    public ResponseEntity<ApiResponse<List<SpaSessionDto>>> getDailySchedule(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        List<SpaSessionDto> sessions = spaSessionService.listTherapistSchedule(userId, queryDate);
        return ResponseEntity.ok(ApiResponse.ok(sessions));
    }

    /**
     * Screen 33: Therapist Session Detail.
     * Sensitive Data Minimization: returns ONLY treatment-relevant wellness/safety notes.
     * Unrelated HealthProfile fields, medical history, dietary info are strictly excluded.
     */
    @GetMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<TherapistSessionDetailDto>> getSessionDetail(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        TherapistSessionDetailDto detail = spaSessionService.getTherapistSessionDetail(id, userId);
        return ResponseEntity.ok(ApiResponse.ok(detail));
    }

    /**
     * Screen 33: Record Final Session Outcome.
     * Permitted: COMPLETED, NO_SHOW.
     * IN_PROGRESS is strictly prohibited and rejected per OI-08.
     */
    @PostMapping("/sessions/{id}/outcome")
    public ResponseEntity<ApiResponse<SpaSessionDto>> recordOutcome(
            @PathVariable Long id,
            @Valid @RequestBody CompleteSessionRequest req,
            @AuthenticationPrincipal CustomUserDetails userDetails
    ) {
        Integer userId = userDetails != null ? userDetails.getUserId() : null;
        SpaSessionDto updated = spaSessionService.recordSessionOutcome(
                id, userId, req.getOutcome(), req.getTherapistNotes()
        );
        return ResponseEntity.ok(ApiResponse.ok("Session outcome recorded as " + req.getOutcome(), updated));
    }
}
