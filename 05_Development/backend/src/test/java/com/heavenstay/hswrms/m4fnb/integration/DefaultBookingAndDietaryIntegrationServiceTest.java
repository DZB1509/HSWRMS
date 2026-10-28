package com.heavenstay.hswrms.m4fnb.integration;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class DefaultBookingAndDietaryIntegrationServiceTest {

    @Autowired
    private DefaultBookingAndDietaryIntegrationService integrationService;

    @Autowired
    private RetreatBookingRepository bookingRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private HealthProfileRepository healthProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private PhysicalVillaRepository physicalVillaRepository;

    @Autowired
    private RetreatPackageRepository retreatPackageRepository;

    private User guestUser;
    private User otherUser;
    private CustomerProfile customerProfile;
    private RetreatBooking activeBooking;
    private final LocalDate today = LocalDate.now();

    @BeforeEach
    void setUp() {
        guestUser = new User();
        guestUser.setEmail("port_guest_" + System.currentTimeMillis() + "@heavenstay.com");
        guestUser.setPasswordHash("hashed_pw");
        guestUser.setFullName("Eleanor Vance");
        guestUser.setAccountStatus("ACTIVE");
        guestUser = userRepository.save(guestUser);

        otherUser = new User();
        otherUser.setEmail("port_other_" + System.currentTimeMillis() + "@heavenstay.com");
        otherUser.setPasswordHash("hashed_pw");
        otherUser.setFullName("Unauthorized Guest");
        otherUser.setAccountStatus("ACTIVE");
        otherUser = userRepository.save(otherUser);

        customerProfile = new CustomerProfile();
        customerProfile.setUser(guestUser);
        customerProfile = customerProfileRepository.save(customerProfile);

        VillaCategory cat = new VillaCategory();
        cat.setCategoryName("Oceanfront Wellness Villa");
        cat.setMaxOccupancy(2);
        cat.setPriceModifier(BigDecimal.ZERO);
        cat.setCategoryStatus("ACTIVE");
        cat.setInventoryCount(5);
        cat.setBedroomCount(1);
        cat = villaCategoryRepository.save(cat);

        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaNumber("Villa 108");
        villa.setVillaCategory(cat);
        villa.setVillaStatus("AVAILABLE");
        villa = physicalVillaRepository.save(villa);

        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageCode("PKG-PURE-DETOX");
        pkg.setPackageName("Pure Detox Rejuvenation");
        pkg.setDurationNights(3);
        pkg.setBasePrice(BigDecimal.valueOf(1800));
        pkg.setPackageStatus("ACTIVE");
        pkg = retreatPackageRepository.save(pkg);

        activeBooking = new RetreatBooking();
        activeBooking.setCustomerProfileId(customerProfile.getCustomerProfileId());
        activeBooking.setRetreatPackage(pkg);
        activeBooking.setRequestedVillaCategory(cat);
        activeBooking.setAssignedVilla(villa);
        activeBooking.setCheckInDate(today);
        activeBooking.setCheckOutDate(today.plusDays(4));
        activeBooking.setBookingStatus("CONFIRMED");
        activeBooking.setDepositAmount(BigDecimal.valueOf(500));
        activeBooking.setTotalEstimatedAmount(BigDecimal.valueOf(1800));
        activeBooking = bookingRepository.save(activeBooking);
    }

    @Test
    @DisplayName("requireOwnedCustomerBooking: returns minimal booking context for authorized customer")
    void testRequireOwnedCustomerBooking_Success() {
        BookingContextPort.FnbBookingContext context = integrationService.requireOwnedCustomerBooking(
                guestUser.getUserId(), activeBooking.getRetreatBookingId());

        assertNotNull(context);
        assertEquals(activeBooking.getRetreatBookingId(), context.bookingId());
        assertEquals(guestUser.getUserId(), context.customerUserId());
        assertEquals("Eleanor Vance", context.guestFullName());
        assertEquals("Villa 108", context.villaNumber());
        assertEquals("PKG-PURE-DETOX", context.packageCode());
        assertEquals("Pure Detox Rejuvenation", context.packageName());
        assertEquals(BookingContextPort.LocationVerificationStatus.VERIFIED_VILLA, context.locationStatus());
    }

    @Test
    @DisplayName("requireOwnedCustomerBooking: rejects unauthorized user with AccessDeniedException")
    void testRequireOwnedCustomerBooking_UnauthorizedUser_Rejected() {
        assertThrows(AccessDeniedException.class, () ->
                integrationService.requireOwnedCustomerBooking(otherUser.getUserId(), activeBooking.getRetreatBookingId()));
    }

    @Test
    @DisplayName("requireOwnedCustomerBooking: rejects non-existent booking with ResourceNotFoundException")
    void testRequireOwnedCustomerBooking_MissingBooking_ThrowsResourceNotFound() {
        assertThrows(ResourceNotFoundException.class, () ->
                integrationService.requireOwnedCustomerBooking(guestUser.getUserId(), 99999));
    }

    @Test
    @DisplayName("requireEligibleCustomerBooking: rejects past order date with PAST_DATE_NOT_ALLOWED")
    void testRequireEligibleCustomerBooking_PastDate_Rejected() {
        LocalDate pastDate = today.minusDays(1);
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                integrationService.requireEligibleCustomerBooking(guestUser.getUserId(), activeBooking.getRetreatBookingId(), pastDate));
        assertEquals("PAST_DATE_NOT_ALLOWED", ex.getErrorCode());
    }

    @Test
    @DisplayName("requireEligibleCustomerBooking: rejects order date outside retreat stay with DATE_OUTSIDE_STAY")
    void testRequireEligibleCustomerBooking_DateOutsideStay_Rejected() {
        LocalDate dateAfterStay = today.plusDays(10);
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                integrationService.requireEligibleCustomerBooking(guestUser.getUserId(), activeBooking.getRetreatBookingId(), dateAfterStay));
        assertEquals("DATE_OUTSIDE_STAY", ex.getErrorCode());
    }

    @Test
    @DisplayName("requireEligibleCustomerBooking: allows valid order date within stay")
    void testRequireEligibleCustomerBooking_ValidDate_Success() {
        LocalDate validDate = today.plusDays(1);
        BookingContextPort.FnbBookingContext context = integrationService.requireEligibleCustomerBooking(
                guestUser.getUserId(), activeBooking.getRetreatBookingId(), validDate);
        assertNotNull(context);
        assertEquals(activeBooking.getRetreatBookingId(), context.bookingId());
    }

    @Test
    @DisplayName("getKitchenBookingContext: staff can query booking without customer ownership check")
    void testGetKitchenBookingContext_StaffAccess_Success() {
        BookingContextPort.FnbBookingContext context = integrationService.getKitchenBookingContext(
                activeBooking.getRetreatBookingId());
        assertNotNull(context);
        assertEquals("Eleanor Vance", context.guestFullName());
        assertEquals("Villa 108", context.villaNumber());
    }

    @Test
    @DisplayName("DietaryProfilePort: projects food allergies & dietary restrictions while strictly excluding medical diagnoses")
    void testDietaryProfilePort_ClinicalDataMinimization() {
        HealthProfile hp = new HealthProfile();
        hp.setCustomerProfile(customerProfile);
        hp.setAllergies("Peanut Allergy, Shellfish");
        hp.setDietaryRequirements("Vegan, Low Sodium");
        hp.setFoodIntoleranceNotes("Lactose intolerant");
        hp.setCurrentHealthCondition("Severe Asthma & Arrhythmia");
        hp.setCurrentMedications("Albuterol Inhaler, Metoprolol");
        hp.setInjurySurgeryHistory("Spinal Fusion surgery in 2023");
        hp.setTreatmentSafetyNotes("Do not perform vigorous lumbar rotation");
        healthProfileRepository.save(hp);

        DietaryProfilePort.FoodProfileProjection profile = integrationService.getFoodProfileForUser(guestUser.getUserId());

        assertNotNull(profile);
        assertEquals(DietaryProfilePort.DietaryVerificationStatus.VERIFIED, profile.verificationStatus());
        assertTrue(profile.foodAllergies().contains("Peanut Allergy"));
        assertTrue(profile.foodAllergies().contains("Shellfish"));
        assertTrue(profile.foodAllergies().contains("Lactose intolerant"));
        assertTrue(profile.dietaryPreferences().contains("Vegan"));
        assertTrue(profile.dietaryPreferences().contains("Low Sodium"));

        // Critical safety check: Ensure NO medical fields leaked
        assertFalse(profile.foodAllergies().stream().anyMatch(a -> a.contains("Asthma")));
        assertFalse(profile.foodAllergies().stream().anyMatch(a -> a.contains("Albuterol")));
        assertFalse(profile.dietaryPreferences().stream().anyMatch(d -> d.contains("Arrhythmia")));
        assertFalse(profile.dietaryPreferences().stream().anyMatch(d -> d.contains("Spinal Fusion")));
    }

    @Test
    @DisplayName("DietaryProfilePort: user without profile returns NO_PROFILE_ATTACHED")
    void testDietaryProfilePort_NoProfileAttached() {
        DietaryProfilePort.FoodProfileProjection profile = integrationService.getFoodProfileForUser(otherUser.getUserId());
        assertNotNull(profile);
        assertEquals(DietaryProfilePort.DietaryVerificationStatus.NO_PROFILE_ATTACHED, profile.verificationStatus());
        assertTrue(profile.foodAllergies().isEmpty());
        assertTrue(profile.dietaryPreferences().isEmpty());
    }

    @Test
    @DisplayName("requireEligibleCustomerBooking: allows exact check-in date boundary")
    void testRequireEligibleCustomerBooking_ExactCheckIn_Success() {
        BookingContextPort.FnbBookingContext context = integrationService.requireEligibleCustomerBooking(
                guestUser.getUserId(), activeBooking.getRetreatBookingId(), activeBooking.getCheckInDate());
        assertNotNull(context);
        assertEquals(activeBooking.getRetreatBookingId(), context.bookingId());
    }

    @Test
    @DisplayName("requireEligibleCustomerBooking: allows exact check-out date boundary")
    void testRequireEligibleCustomerBooking_ExactCheckOut_Success() {
        BookingContextPort.FnbBookingContext context = integrationService.requireEligibleCustomerBooking(
                guestUser.getUserId(), activeBooking.getRetreatBookingId(), activeBooking.getCheckOutDate());
        assertNotNull(context);
        assertEquals(activeBooking.getRetreatBookingId(), context.bookingId());
    }

    @Test
    @DisplayName("requireEligibleCustomerBooking: rejects cancelled booking with BOOKING_NOT_ACTIVE")
    void testRequireEligibleCustomerBooking_CancelledBooking_Rejected() {
        activeBooking.setBookingStatus("CANCELLED");
        bookingRepository.save(activeBooking);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                integrationService.requireEligibleCustomerBooking(
                        guestUser.getUserId(), activeBooking.getRetreatBookingId(), today.plusDays(1)));
        assertEquals("BOOKING_NOT_ACTIVE", ex.getErrorCode());
    }

    @Test
    @DisplayName("requireEligibleCustomerBooking: rejects inconsistent dates (checkIn > checkOut) with INVALID_BOOKING_DATES")
    void testRequireEligibleCustomerBooking_InconsistentDates_Rejected() {
        activeBooking.setCheckInDate(today.plusDays(5));
        activeBooking.setCheckOutDate(today.plusDays(2));
        bookingRepository.save(activeBooking);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                integrationService.requireEligibleCustomerBooking(
                        guestUser.getUserId(), activeBooking.getRetreatBookingId(), today.plusDays(3)));
        assertEquals("INVALID_BOOKING_DATES", ex.getErrorCode());
    }

    @Test
    @DisplayName("requireEligibleCustomerBooking: rejects null order date with PAST_DATE_NOT_ALLOWED")
    void testRequireEligibleCustomerBooking_NullOrderDate_Rejected() {
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                integrationService.requireEligibleCustomerBooking(
                        guestUser.getUserId(), activeBooking.getRetreatBookingId(), null));
        assertEquals("PAST_DATE_NOT_ALLOWED", ex.getErrorCode());
    }
}
