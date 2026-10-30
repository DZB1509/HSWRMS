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
public class DefaultSpaNotificationAdapter implements SpaNotificationPort {

    private static final Logger log = LoggerFactory.getLogger(DefaultSpaNotificationAdapter.class);

    @Override
    public boolean sendAppointmentReminder(SpaSession session, String customerEmail, String customerName) {
        if (session == null) {
            log.warn("Cannot send spa appointment reminder: session is null");
            return false;
        }

        try {
            String treatmentName = "Spa Treatment";
            try {
                if (session.getTreatment() != null && session.getTreatment().getTreatmentName() != null) {
                    treatmentName = session.getTreatment().getTreatmentName();
                }
            } catch (Exception ignored) {
            }

            String practitionerName = "Assigned Specialist";
            try {
                if (session.getTherapist() != null && session.getTherapist().getDisplayName() != null) {
                    practitionerName = session.getTherapist().getDisplayName();
                }
            } catch (Exception ignored) {
            }

            String roomName = "Treatment Suite";
            try {
                if (session.getTreatmentRoom() != null && session.getTreatmentRoom().getRoomName() != null) {
                    roomName = session.getTreatmentRoom().getRoomName();
                }
            } catch (Exception ignored) {
            }
            String resolvedEmail = customerEmail != null && !customerEmail.isBlank() ? customerEmail : "guest@heavenstay.com";
            String resolvedName = customerName != null && !customerName.isBlank() ? customerName : "Valued Guest";

            log.info("[SPA T-1h REMINDER DISPATCH] -> Guest: {} <{}> | Session #{}: {} at {} | Specialist: {} | Suite: {} | Action: Customer confirmation requested via /api/v1/spa/sessions/{}/confirm-attendance",
                    resolvedName,
                    resolvedEmail,
                    session.getSpaSessionId(),
                    treatmentName,
                    session.getScheduledStartAt(),
                    practitionerName,
                    roomName,
                    session.getSpaSessionId());

            return true;
        } catch (Exception e) {
            log.error("Failed to dispatch spa appointment reminder for session #{}: {}", session.getSpaSessionId(), e.getMessage());
            return false;
        }
    }
}
