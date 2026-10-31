package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.port.SpaCalendarPort;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Inert test-profile provider; it never contacts a calendar service. */
@Component
@Primary
@Profile("test")
public class TestProfileSpaCalendarAdapter implements SpaCalendarPort {
    @Override
    public String createOrUpdateCalendarEvent(SpaSession session) {
        return null;
    }

    @Override
    public boolean cancelCalendarEvent(SpaSession session, String externalCalendarEventId) {
        return false;
    }
}
