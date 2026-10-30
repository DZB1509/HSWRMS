package com.heavenstay.hswrms.m4fnb.integration;

/**
 * Port interface allowing Module 4 (F&B) to query folio posting status
 * without creating a circular dependency on Module 5 (Billing).
 */
public interface FolioStatusPort {

    /**
     * Checks if a meal order has been posted to a guest folio in M5.
     *
     * @param mealOrderId the meal order ID
     * @return true if an active folio charge exists for this meal order, false otherwise
     */
    boolean isMealOrderPostedToFolio(Integer mealOrderId);

    /**
     * Checks if a folio exists and remains open (not CLOSED) for a retreat booking.
     *
     * @param retreatBookingId the retreat booking ID
     * @return true if the folio is open and can accept new charges, false if closed
     */
    boolean isFolioOpenForBooking(Integer retreatBookingId);
}


