package com.heavenstay.hswrms.m3spa.port;

import java.util.Optional;

public interface CustomerStayPort {
    Optional<StayContextDto> getActiveStayForUser(Integer userId);
    Optional<StayContextDto> getStayById(Integer bookingId);
    boolean isTreatmentIncludedInPackage(Integer packageId, Integer treatmentId);
}
