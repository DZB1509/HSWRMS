package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Default implementation of SpaNotificationPort.
 *
 * In local/dev/test environments, formats and logs the T-1h appointment reminder dispatch.
 * Decouples core business scheduling and duplicate prevention logic from external SMTP/Push providers
 * without fabricating live cloud or calendar credentials.
 */
@Component
public class DefaultSpaNotificationAdapter implements SpaNotificationOutcomeAware {

    private static final Logger log = LoggerFactory.getLogger(DefaultSpaNotificationAdapter.class);

    @Override
    public SpaProviderResult sendScheduleChangeNotificationResult(SpaSession session, String customerEmail,
                                                                  String customerName, String changeDetails) {
        log.info("[SPA NOTIFICATION SUPPRESSED] No email transport is configured; schedule notice for session #{} was not delivered.",
                session != null ? session.getSpaSessionId() : null);
        return SpaProviderResult.suppressed("No email transport configured; logging is not delivery");
    }

    @Override
    public SpaProviderResult sendTimelineReminder(SpaSession session, String customerEmail,
                                                   String customerName, String checkpoint) {
        log.info("[SPA REMINDER SUPPRESSED] No email transport is configured; checkpoint {} for session #{} was not delivered.",
                checkpoint, session != null ? session.getSpaSessionId() : null);
        return SpaProviderResult.suppressed("No email transport configured; logging is not delivery");
    }

    @Override
    public boolean sendAppointmentReminder(SpaSession session, String customerEmail, String customerName) {
        log.info("[SPA REMINDER SUPPRESSED] No email transport is configured; session #{} was not delivered.",
                session != null ? session.getSpaSessionId() : null);
        return false;
    }

    @Override
    public boolean sendScheduleChangeNotification(SpaSession session, String customerEmail, String customerName, String changeDetails) {
        log.info("[SPA NOTICE SUPPRESSED] No email transport is configured; session #{} was not delivered.",
                session != null ? session.getSpaSessionId() : null);
        return false;
    }
}
