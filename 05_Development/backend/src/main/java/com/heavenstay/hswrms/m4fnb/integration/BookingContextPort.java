package com.heavenstay.hswrms.m4fnb.integration;

import java.time.LocalDate;

/**
 * Public M2-facing contract. M4 must not read booking repositories directly.
 * The eligible-booking method must verify ownership, CHECKED_IN status, and that
 * the requested meal date falls within the active stay. The kitchen projection
 * must return only the guest first name and assigned villa needed by F&B.
 */
public interface BookingContextPort {
    FnbBookingContext requireOwnedCustomerBooking(Integer userId, Integer bookingId);
    FnbBookingContext requireEligibleCustomerBooking(Integer userId, Integer bookingId, LocalDate orderDate);
    FnbBookingContext getKitchenBookingContext(Integer bookingId);

    record FnbBookingContext(Integer bookingId, Integer customerUserId, String bookingStatus,
            LocalDate checkInDate, LocalDate checkOutDate, String guestFirstName, String villaNumber) { }
}
