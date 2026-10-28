package com.heavenstay.hswrms.m4fnb.integration;

import java.time.LocalDate;

/**
 * Public M2-facing booking context interface for M4 F&B.
 * Strictly adheres to PII data minimization (Decree 13/2023/ND-CP):
 * Exposes only the guest full name, villa number, stay dates, and package details
 * required for meal preparation and delivery.
 */
public interface BookingContextPort {

    enum LocationVerificationStatus {
        VERIFIED_VILLA,
        UNVERIFIED_LOCATION
    }

    FnbBookingContext requireOwnedCustomerBooking(Integer userId, Integer bookingId);
    FnbBookingContext requireEligibleCustomerBooking(Integer userId, Integer bookingId, LocalDate orderDate);
    FnbBookingContext getKitchenBookingContext(Integer bookingId);

    record FnbBookingContext(
            Integer bookingId,
            Integer customerUserId,
            String bookingStatus,
            LocalDate checkInDate,
            LocalDate checkOutDate,
            String guestFullName,
            String villaNumber,
            String packageCode,
            String packageName,
            LocationVerificationStatus locationStatus
    ) {
        public FnbBookingContext {
            locationStatus = locationStatus == null ? LocationVerificationStatus.UNVERIFIED_LOCATION : locationStatus;
        }

        public FnbBookingContext(
                Integer bookingId,
                Integer customerUserId,
                String bookingStatus,
                LocalDate checkInDate,
                LocalDate checkOutDate,
                String guestFullName,
                String villaNumber,
                String packageCode,
                String packageName
        ) {
            this(bookingId, customerUserId, bookingStatus, checkInDate, checkOutDate,
                    guestFullName, villaNumber, packageCode, packageName,
                    villaNumber != null && !villaNumber.isBlank() && !villaNumber.contains("UNVERIFIED")
                            ? LocationVerificationStatus.VERIFIED_VILLA : LocationVerificationStatus.UNVERIFIED_LOCATION);
        }
    }
}
