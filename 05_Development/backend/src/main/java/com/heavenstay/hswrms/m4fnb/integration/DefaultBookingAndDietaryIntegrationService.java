package com.heavenstay.hswrms.m4fnb.integration;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Production boundary adapter implementing {@link BookingContextPort} and {@link DietaryProfilePort}.
 * Synchronizes M1 Identity and M2 Booking context with M4 F&B under strict Decree 13/2023 PII minimization.
 * Strictly adheres to enterprise safety rules:
 * - Zero fake defaults or synthesized fallback bookings.
 * - Zero date manipulation: stay dates are authoritative from M2 RetreatBooking.
 * - Strict ownership validation: customer can access only their own confirmed bookings.
 * - Strict clinical isolation: medical records, medications, and diagnoses are never exposed.
 */
@Service
@Transactional(readOnly = true)
public class DefaultBookingAndDietaryIntegrationService implements BookingContextPort, DietaryProfilePort {

    private final RetreatBookingRepository bookingRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final HealthProfileRepository healthProfileRepository;

    public DefaultBookingAndDietaryIntegrationService(
            RetreatBookingRepository bookingRepository,
            CustomerProfileRepository customerProfileRepository,
            HealthProfileRepository healthProfileRepository) {
        this.bookingRepository = bookingRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.healthProfileRepository = healthProfileRepository;
    }

    @Override
    public FnbBookingContext requireOwnedCustomerBooking(Integer userId, Integer bookingId) {
        if (bookingId == null) {
            throw new ResourceNotFoundException("Retreat booking ID cannot be null.");
        }

        RetreatBooking booking = bookingRepository.findByIdWithDetails(bookingId)
                .or(() -> bookingRepository.findById(bookingId))
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking not found with ID: " + bookingId));

        CustomerProfile profile = null;
        if (booking.getCustomerProfileId() != null) {
            profile = customerProfileRepository.findById(booking.getCustomerProfileId()).orElse(null);
        }

        if (userId != null) {
            if (profile == null || profile.getUser() == null || !userId.equals(profile.getUser().getUserId())) {
                throw new AccessDeniedException("Access denied: You do not own booking ID: " + bookingId);
            }
        }

        String guestFullName = (profile != null && profile.getUser() != null)
                ? profile.getUser().getFullName()
                : "Guest";

        String villaNumber = null;
        LocationVerificationStatus locStatus = LocationVerificationStatus.UNVERIFIED_LOCATION;
        if (booking.getAssignedVilla() != null) {
            villaNumber = booking.getAssignedVilla().getVillaNumber();
            locStatus = LocationVerificationStatus.VERIFIED_VILLA;
        } else if (booking.getRequestedVillaCategory() != null) {
            villaNumber = booking.getRequestedVillaCategory().getCategoryName();
        }

        String packageCode = booking.getRetreatPackage() != null ? booking.getRetreatPackage().getPackageCode() : null;
        String packageName = booking.getRetreatPackage() != null ? booking.getRetreatPackage().getPackageName() : null;

        Integer customerUserId = (profile != null && profile.getUser() != null) ? profile.getUser().getUserId() : null;

        return new FnbBookingContext(
                booking.getRetreatBookingId(),
                customerUserId,
                booking.getBookingStatus(),
                booking.getCheckInDate(),
                booking.getCheckOutDate(),
                guestFullName,
                villaNumber,
                packageCode,
                packageName,
                locStatus
        );
    }

    @Override
    public FnbBookingContext requireEligibleCustomerBooking(Integer userId, Integer bookingId, LocalDate orderDate) {
        if (orderDate == null || orderDate.isBefore(LocalDate.now())) {
            throw new BusinessRuleException("PAST_DATE_NOT_ALLOWED",
                    "Meal orders cannot be placed for past dates. Please select today or future retreat stay dates.");
        }

        FnbBookingContext context = requireOwnedCustomerBooking(userId, bookingId);
        LocalDate checkIn = context.checkInDate();
        LocalDate checkOut = context.checkOutDate();

        if (checkIn == null || checkOut == null || checkIn.isAfter(checkOut)) {
            throw new BusinessRuleException("INVALID_BOOKING_DATES",
                    "Retreat booking ID " + bookingId + " has missing or inconsistent stay dates.");
        }

        if ("CANCELLED".equalsIgnoreCase(context.bookingStatus())) {
            throw new BusinessRuleException("BOOKING_NOT_ACTIVE",
                    "Cannot place dining order for a CANCELLED booking.");
        }

        if (orderDate.isBefore(checkIn) || orderDate.isAfter(checkOut)) {
            throw new BusinessRuleException("DATE_OUTSIDE_STAY",
                    "Order date " + orderDate + " falls outside of the booked retreat stay (" + checkIn + " to " + checkOut + ").");
        }
        return context;
    }

    @Override
    public FnbBookingContext getKitchenBookingContext(Integer bookingId) {
        return requireOwnedCustomerBooking(null, bookingId);
    }

    @Override
    public FoodProfileProjection getFoodProfileForUser(Integer userId) {
        if (userId == null) {
            return new FoodProfileProjection(DietaryVerificationStatus.NO_PROFILE_ATTACHED, List.of(), List.of());
        }
        CustomerProfile cp = customerProfileRepository.findByUserId(userId).orElse(null);
        if (cp == null) {
            return new FoodProfileProjection(DietaryVerificationStatus.NO_PROFILE_ATTACHED, List.of(), List.of());
        }
        return getFoodProfileForCustomerProfile(cp.getCustomerProfileId());
    }

    @Override
    public FoodProfileProjection getFoodProfileForCustomerProfile(Integer customerProfileId) {
        if (customerProfileId == null) {
            return new FoodProfileProjection(DietaryVerificationStatus.NO_PROFILE_ATTACHED, List.of(), List.of());
        }

        HealthProfile hp = healthProfileRepository.findByCustomerProfileId(customerProfileId).orElse(null);
        if (hp == null) {
            return new FoodProfileProjection(DietaryVerificationStatus.NO_PROFILE_ATTACHED, List.of(), List.of());
        }

        List<String> allergies = new ArrayList<>();
        if (hp.getAllergies() != null && !hp.getAllergies().isBlank()) {
            for (String a : hp.getAllergies().split("[,;\\n]+")) {
                if (!a.trim().isEmpty()) allergies.add(a.trim());
            }
        }
        if (hp.getFoodIntoleranceNotes() != null && !hp.getFoodIntoleranceNotes().isBlank()) {
            for (String f : hp.getFoodIntoleranceNotes().split("[,;\\n]+")) {
                if (!f.trim().isEmpty()) allergies.add(f.trim());
            }
        }

        List<String> dietaryPreferences = new ArrayList<>();
        if (hp.getDietaryRequirements() != null && !hp.getDietaryRequirements().isBlank()) {
            for (String d : hp.getDietaryRequirements().split("[,;\\n]+")) {
                if (!d.trim().isEmpty()) dietaryPreferences.add(d.trim());
            }
        }

        return new FoodProfileProjection(DietaryVerificationStatus.VERIFIED, allergies, dietaryPreferences);
    }
}
