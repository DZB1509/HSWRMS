package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;

/** Optional richer result contract for providers that classify retry safety. */
public interface SpaNotificationOutcomeAware extends SpaNotificationPort {
    SpaProviderResult sendScheduleChangeNotificationResult(SpaSession session, String customerEmail,
                                                            String customerName, String changeDetails);

    SpaProviderResult sendTimelineReminder(SpaSession session, String customerEmail,
                                           String customerName, String checkpoint);
}
