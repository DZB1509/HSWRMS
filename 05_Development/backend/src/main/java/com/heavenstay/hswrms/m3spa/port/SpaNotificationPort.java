package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;

/**
 * M3 Spa Notification Port (BR-M3-10).
 *
 * Dispatches appointment reminders requesting customer attendance confirmation
 * approximately 1 hour before the scheduled session.
 */
public interface SpaNotificationPort {

    /**
     * Sends an appointment reminder requesting attendance confirmation.
     *
     * @param session the upcoming spa session
     * @param customerEmail customer contact email (if available)
     * @param customerName customer full name
     * @return true if notification was accepted/dispatched, false if dispatch failed
     */
    boolean sendAppointmentReminder(SpaSession session, String customerEmail, String customerName);

    /**
     * Sends a notification informing the customer of an accepted schedule change (BR-M3-14).
     *
     * @param session the modified spa session
     * @param customerEmail customer contact email (if available)
     * @param customerName customer full name
     * @param changeDetails human-readable details of the change (e.g. reschedule, cancellation, rematch)
     * @return true if notification was accepted/dispatched, false if dispatch failed
     */
    boolean sendScheduleChangeNotification(SpaSession session, String customerEmail, String customerName, String changeDetails);
}

