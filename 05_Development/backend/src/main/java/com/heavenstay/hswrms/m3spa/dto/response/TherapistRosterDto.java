package com.heavenstay.hswrms.m3spa.dto.response;

import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import java.util.List;

/**
 * Data transfer object representing a therapist in the operational management roster (BR-M3-13).
 * Sensitive user data (passwords, health notes, personal contact details) are strictly omitted.
 */
public record TherapistRosterDto(
        Integer therapistId,
        Integer userId,
        String name,
        String specialty,
        List<String> qualifications,
        TherapistStatus status
) {
}

