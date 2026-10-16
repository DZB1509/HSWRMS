package com.heavenstay.hswrms.m4fnb.integration;

import java.time.LocalDate;

/**
 * ============================================================================
 * [TRACEABILITY HEADER]
 * Module: M4 - Food & Beverage Management (F&B)
 * Requirements: SR-FNB-001, US-FNB-003, BR-FNB-001, BR-FNB-002
 * Design Pattern: Clean Architecture / Port Specification (M2 Booking Integration)
 * Compliance: Decree 13/2023 & 356/2025/ND-CP PII Data Minimization
 * Description: Public M2-facing contract. M4 must not read booking repositories directly.
 *              The kitchen projection returns only the necessary guest first name, villa,
 *              and retreat package details needed for F&B preparation.
 * ============================================================================
 */
public interface BookingContextPort {
    FnbBookingContext requireOwnedCustomerBooking(Integer userId, Integer bookingId);
    FnbBookingContext requireEligibleCustomerBooking(Integer userId, Integer bookingId, LocalDate orderDate);
    FnbBookingContext getKitchenBookingContext(Integer bookingId);

    record FnbBookingContext(
            Integer bookingId,
            Integer customerUserId,
            String bookingStatus,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            String guestFirstName,
            String villaNumber,
            String packageCode,
            String packageName
    ) {
        /**
         * Backward-compatible constructor for existing test suites and legacy callers.
         */
        public FnbBookingContext(Integer bookingId, Integer customerUserId, String bookingStatus,
                LocalDate checkInDate, LocalDate checkOutDate, String guestFirstName, String villaNumber) {
            this(bookingId, customerUserId, bookingStatus, checkInDate, checkOutDate,
                    guestFirstName, villaNumber, "RET-DETOX-03", "3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)");
        }
    }
}
