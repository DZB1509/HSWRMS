package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;

/**
 * M3 Spa Calendar Port (BR-M3-10, BR-M3-14).
 *
 * Defines the contract for external calendar synchronization (e.g. Google Calendar).
 * Allows creating, updating, and cancelling calendar events for confirmed spa sessions.
 */
public interface SpaCalendarPort {

    /**
     * Creates or updates a calendar event for a spa session.
     *
     * @param session the spa session
     * @return the external calendar event ID, or a decoupled reference identifier
     */
    String createOrUpdateCalendarEvent(SpaSession session);

    /**
     * Cancels / deletes a calendar event for a spa session.
     *
     * @param session the spa session
     * @param externalCalendarEventId the external event ID to cancel
     * @return true if successfully cancelled or safely ignored in decoupled mode, false if failure
     */
    boolean cancelCalendarEvent(SpaSession session, String externalCalendarEventId);
}

