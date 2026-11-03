package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;

/** Provider contract that accepts a stable event identity and reports delivery safety. */
public interface SpaCalendarOutcomeAware extends SpaCalendarPort {
    SpaProviderResult upsertCalendarEvent(SpaSession session, String stableEventIdentity);
    SpaProviderResult cancelCalendarEventResult(SpaSession session, String externalEventIdentity);
}
