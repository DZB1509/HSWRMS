package com.heavenstay.hswrms.m2booking;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationRequest;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationResponse;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m2booking.service.BookingClock;
import com.heavenstay.hswrms.m2booking.service.BookingPolicyService;
import com.heavenstay.hswrms.m2booking.service.VillaAvailabilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class VillaAvailabilityServiceTest {

    @Mock
    private RetreatPackageRepository packageRepository;

    @Mock
    private VillaCategoryRepository villaCategoryRepository;

    @Mock
    private PhysicalVillaRepository physicalVillaRepository;

    @Mock
    private RetreatBookingRepository bookingRepository;

    @Mock
    private BookingClock bookingClock;

    @Mock
    private BookingPolicyService bookingPolicyService;

    private VillaAvailabilityService availabilityService;

    private RetreatPackage mockPackage;
    private VillaCategory mockCategory;

    @BeforeEach
    void setUp() {
        availabilityService = new VillaAvailabilityService(
                packageRepository,
                villaCategoryRepository,
                physicalVillaRepository,
                bookingRepository,
                bookingClock,
                bookingPolicyService
        );

        mockCategory = new VillaCategory();
        mockCategory.setVillaCategoryId(1);
        mockCategory.setCategoryName("Forest Sanctuary Villa");
        mockCategory.setPriceModifier(new BigDecimal("1000000"));
        mockCategory.setMaxOccupancy(2);
        mockCategory.setInventoryCount(5);

        mockPackage = new RetreatPackage();
        mockPackage.setRetreatPackageId(10);
        mockPackage.setPackageName("3-Day Mindfulness Detox");
        mockPackage.setBasePrice(new BigDecimal("10000000"));
        mockPackage.setBasePriceUnit("Package");
        mockPackage.setDurationNights(2);
        mockPackage.setEligibleVillaCategories(java.util.Set.of(mockCategory));
    }

    @Test
    @DisplayName("Fix B5: Accurate Pricing & Deposit calculation without fake 10% VAT")
    void testAccuratePricingWithoutFakeVat() {
        BookingCalculationRequest request = new BookingCalculationRequest();
        request.setRetreatPackageId(10);
        request.setVillaCategoryId(1);
        request.setGuestCount(1);
        request.setCheckInDate(LocalDate.now().plusDays(5));
        request.setCheckOutDate(LocalDate.now().plusDays(7)); // 2 nights

        when(packageRepository.findById(10)).thenReturn(Optional.of(mockPackage));
        when(villaCategoryRepository.findById(1)).thenReturn(Optional.of(mockCategory));
        when(bookingPolicyService.holdMinutes()).thenReturn(Optional.of(15));
        when(bookingPolicyService.depositPercentage()).thenReturn(Optional.of(new BigDecimal("30")));
        when(bookingClock.utcNow()).thenReturn(LocalDateTime.now());
        when(physicalVillaRepository.countByVillaCategory_VillaCategoryIdAndVillaStatusNotIn(eq(1), anyList()))
                .thenReturn(4L);
        when(bookingRepository.countInventoryHolds(eq(1), any(), any(), any(), eq(0)))
                .thenReturn(1L);

        BookingCalculationResponse response = availabilityService.calculateBooking(request);

        assertNotNull(response);
        // Base 10,000,000 + Modifier 1,000,000 = 11,000,000 (NO fake 10% VAT added)
        assertEquals(0, new BigDecimal("11000000").compareTo(response.getTotalEstimatedAmount()));
        // Deposit 30% = 3,300,000
        assertEquals(0, new BigDecimal("3300000").compareTo(response.getRequiredDepositAmount()));
        // Available count = 4 operational - 1 hold = 3
        assertEquals(3L, response.getAvailableCount());
        assertTrue(response.isAvailable());
    }

    @Test
    @DisplayName("Fix B6: Package-Villa eligibility check throws exception if category not in package")
    void testIneligibleVillaCategoryThrowsException() {
        VillaCategory ineligibleCategory = new VillaCategory();
        ineligibleCategory.setVillaCategoryId(99);
        ineligibleCategory.setCategoryName("Presidential Cliff Villa");
        ineligibleCategory.setMaxOccupancy(4);

        BookingCalculationRequest request = new BookingCalculationRequest();
        request.setRetreatPackageId(10);
        request.setVillaCategoryId(99);
        request.setGuestCount(1);
        request.setCheckInDate(LocalDate.now().plusDays(5));
        request.setCheckOutDate(LocalDate.now().plusDays(7));

        when(packageRepository.findById(10)).thenReturn(Optional.of(mockPackage));
        when(villaCategoryRepository.findById(99)).thenReturn(Optional.of(ineligibleCategory));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                availabilityService.calculateBooking(request)
        );
        assertTrue(ex.getMessage().contains("not eligible"));
    }

    @Test
    @DisplayName("Fix B6: Max occupancy check throws exception when guest count exceeds villa capacity")
    void testMaxOccupancyExceededThrowsException() {
        BookingCalculationRequest request = new BookingCalculationRequest();
        request.setRetreatPackageId(10);
        request.setVillaCategoryId(1);
        request.setGuestCount(3); // Capacity is 2
        request.setCheckInDate(LocalDate.now().plusDays(5));
        request.setCheckOutDate(LocalDate.now().plusDays(7));

        when(packageRepository.findById(10)).thenReturn(Optional.of(mockPackage));
        when(villaCategoryRepository.findById(1)).thenReturn(Optional.of(mockCategory));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                availabilityService.calculateBooking(request)
        );
        assertTrue(ex.getMessage().contains("exceeds maximum occupancy"));
    }

    @Test
    @DisplayName("Fix B4 & B13: Inventory hold accounts for operational villas and active holds")
    void testAvailableVillaCountCalculation() {
        when(bookingPolicyService.holdMinutes()).thenReturn(Optional.of(15));
        when(bookingClock.utcNow()).thenReturn(LocalDateTime.of(2026, 10, 22, 12, 0));
        when(physicalVillaRepository.countByVillaCategory_VillaCategoryIdAndVillaStatusNotIn(eq(1), anyList()))
                .thenReturn(5L);
        when(bookingRepository.countInventoryHolds(eq(1), any(), any(), any(), eq(0)))
                .thenReturn(5L); // All 5 villas are booked/held

        long available = availabilityService.getAvailableVillaCount(
                1,
                LocalDate.of(2026, 11, 1),
                LocalDate.of(2026, 11, 3)
        );

        assertEquals(0L, available, "When all villas are held, availability must be 0");
    }
}
