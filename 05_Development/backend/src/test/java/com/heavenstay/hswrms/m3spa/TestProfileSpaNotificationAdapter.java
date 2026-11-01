package com.heavenstay.hswrms.m3spa;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.port.SpaNotificationPort;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/** Inert test-profile provider; it never performs notification delivery. */
@Component
@Primary
@Profile("test")
public class TestProfileSpaNotificationAdapter implements SpaNotificationPort {
    @Override
    public boolean sendAppointmentReminder(SpaSession session, String customerEmail, String customerName) {
        return false;
    }

    @Override
    public boolean sendScheduleChangeNotification(SpaSession session, String customerEmail, String customerName,
                                                  String changeDetails) {
        return false;
    }
}
