package com.heavenstay.hswrms.m2booking;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationResponse;
import com.heavenstay.hswrms.m2booking.dto.BookingSummaryResponse;
import com.heavenstay.hswrms.m2booking.dto.WalkInBookingRequest;
import com.heavenstay.hswrms.m2booking.entity.PaymentTransaction;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.service.CustomerIdentityPort;
import com.heavenstay.hswrms.m2booking.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.ResidenceRecordRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m2booking.service.BookingAuditService;
import com.heavenstay.hswrms.m2booking.service.BookingClock;
import com.heavenstay.hswrms.m2booking.service.ReceptionistOperationService;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ReceptionistOperationServiceTest {

    @Mock
    private RetreatBookingRepository bookingRepository;

    @Mock
    private PhysicalVillaRepository physicalVillaRepository;

    @Mock
    private ResidenceRecordRepository residenceRecordRepository;

    @Mock
    private RetreatPackageRepository packageRepository;

    @Mock
    private VillaCategoryRepository villaCategoryRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private VillaAvailabilityService availabilityService;

    @Mock
    private CustomerIdentityPort customerIdentityPort;

    @Mock
    private BookingClock bookingClock;

    @Mock
    private BookingAuditService bookingAuditService;

    private ReceptionistOperationService receptionistService;

    private RetreatPackage mockPackage;
    private VillaCategory mockCategory;
    private PhysicalVilla mockVilla;
    private RetreatBooking mockBooking;

    @BeforeEach
    void setUp() {
        receptionistService = new ReceptionistOperationService(
                bookingRepository,
                physicalVillaRepository,
                residenceRecordRepository,
                packageRepository,
                villaCategoryRepository,
                paymentTransactionRepository,
                availabilityService,
                customerIdentityPort,
                bookingClock,
                bookingAuditService
        );

        mockCategory = new VillaCategory();
        mockCategory.setVillaCategoryId(1);
        mockCategory.setCategoryName("Forest Sanctuary Villa");

        mockPackage = new RetreatPackage();
        mockPackage.setRetreatPackageId(10);
        mockPackage.setPackageName("3-Day Mindfulness Detox");

        mockVilla = new PhysicalVilla();
        mockVilla.setVillaId(201);
        mockVilla.setVillaNumber("V-101");
        mockVilla.setVillaStatus("AVAILABLE");
        mockVilla.setVillaCategory(mockCategory);

        mockBooking = new RetreatBooking();
        mockBooking.setRetreatBookingId(100);
        mockBooking.setCustomerProfileId(5);
        mockBooking.setRetreatPackage(mockPackage);
        mockBooking.setRequestedVillaCategory(mockCategory);
        mockBooking.setBookingStatus("CONFIRMED");
        mockBooking.setCheckInDate(LocalDate.now());
        mockBooking.setCheckOutDate(LocalDate.now().plusDays(2));
        mockBooking.setDepositAmount(new BigDecimal("3000000"));
        mockBooking.setTotalEstimatedAmount(new BigDecimal("10000000"));
    }

    @Test
    @DisplayName("Fix B11: Create Walk-in booking with real CustomerProfile and confirmed deposit")
    void testCreateWalkInBookingSuccess() {
        WalkInBookingRequest request = new WalkInBookingRequest();
        request.setGuestFullName("Walkin Guest");
        request.setGuestEmail("walkin@heavenstay.com");
        request.setGuestPhone("+84912345678");
        request.setRetreatPackageId(10);
        request.setVillaCategoryId(1);
        request.setPhysicalVillaId(201);
        request.setCheckInDate(LocalDate.now());
        request.setCheckOutDate(LocalDate.now().plusDays(2));
        request.setInitialPaymentMethod("CASH");
        request.setIdentificationNumber("001200001234");
        request.setIdentificationType("CCCD");

        when(packageRepository.findById(10)).thenReturn(Optional.of(mockPackage));
        when(villaCategoryRepository.findByIdForUpdate(1)).thenReturn(Optional.of(mockCategory));
        when(physicalVillaRepository.findByIdForUpdate(201)).thenReturn(Optional.of(mockVilla));
        when(customerIdentityPort.getOrCreateCustomerProfile("Walkin Guest", "walkin@heavenstay.com", "+84912345678"))
                .thenReturn(15); // Profile #15

        BookingCalculationResponse calcRes = new BookingCalculationResponse();
        calcRes.setAvailable(true);
        calcRes.setAvailableCount(2L);
        calcRes.setTotalEstimatedAmount(new BigDecimal("10000000"));
        calcRes.setRequiredDepositAmount(new BigDecimal("3000000"));
        when(availabilityService.calculateBooking(any())).thenReturn(calcRes);

        when(bookingClock.utcNow()).thenReturn(LocalDateTime.now());
        when(bookingRepository.save(any(RetreatBooking.class))).thenAnswer(invocation -> {
            RetreatBooking b = invocation.getArgument(0);
            b.setRetreatBookingId(555);
            return b;
        });

        BookingSummaryResponse response = receptionistService.createWalkInBooking(request, 2);

        assertNotNull(response);
        assertEquals(555, response.getRetreatBookingId());
        assertEquals("CHECKED_IN", response.getBookingStatus());
        assertEquals(15, response.getCustomerProfileId());
        verify(paymentTransactionRepository).save(any(PaymentTransaction.class));
        verify(bookingAuditService).record(eq(2), eq("WALK_IN_CHECK_IN"), anyString(), eq("SUCCESS"));
    }

    @Test
    @DisplayName("Fix B12: Check-in fails if mandatory residence declaration is missing")
    void testCheckInFailsWhenResidenceRecordMissing() {
        when(bookingRepository.findByIdForUpdate(100)).thenReturn(Optional.of(mockBooking));
        when(residenceRecordRepository.existsByRetreatBooking_RetreatBookingId(100)).thenReturn(false);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                receptionistService.assignVillaAndCheckIn(100, 201, true, 2)
        );

        assertTrue(ex.getMessage().contains("residence declaration"));
    }

    @Test
    @DisplayName("Fix B12: Check-in fails if health profile is missing and not confirmed")
    void testCheckInFailsWhenHealthProfileMissingWithoutConfirmation() {
        when(bookingRepository.findByIdForUpdate(100)).thenReturn(Optional.of(mockBooking));
        when(residenceRecordRepository.existsByRetreatBooking_RetreatBookingId(100)).thenReturn(true);
        when(customerIdentityPort.hasHealthProfile(5)).thenReturn(false);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                receptionistService.assignVillaAndCheckIn(100, 201, false, 2)
        );

        assertTrue(ex.getMessage().contains("Health declaration profile is missing"));
    }

    @Test
    @DisplayName("Fix B12 & B14: Check-in assigns villa, marks booking CHECKED_IN and villa OCCUPIED")
    void testCheckInSuccess() {
        when(bookingRepository.findByIdForUpdate(100)).thenReturn(Optional.of(mockBooking));
        when(residenceRecordRepository.existsByRetreatBooking_RetreatBookingId(100)).thenReturn(true);
        when(customerIdentityPort.hasHealthProfile(5)).thenReturn(true);
        when(physicalVillaRepository.findByIdForUpdate(201)).thenReturn(Optional.of(mockVilla));
        when(bookingRepository.existsByAssignedVilla_VillaIdAndBookingStatus(201, "CHECKED_IN")).thenReturn(false);
        when(bookingRepository.save(any(RetreatBooking.class))).thenAnswer(i -> i.getArgument(0));

        BookingSummaryResponse response = receptionistService.assignVillaAndCheckIn(100, 201, true, 2);

        assertNotNull(response);
        assertEquals("CHECKED_IN", response.getBookingStatus());
        assertEquals("OCCUPIED", mockVilla.getVillaStatus());
        assertEquals("V-101", response.getAssignedVillaNumber());
        verify(physicalVillaRepository).save(mockVilla);
        verify(bookingAuditService).record(eq(2), eq("CHECK_IN_ASSIGN_VILLA"), anyString(), eq("SUCCESS"));
    }

    @Test
    @DisplayName("Fix B14: Prevent changing status of OCCUPIED villa to AVAILABLE while active booking exists")
    void testPreventStatusChangeOnOccupiedVilla() {
        mockVilla.setVillaStatus("OCCUPIED");
        when(physicalVillaRepository.findByIdForUpdate(201)).thenReturn(Optional.of(mockVilla));
        when(bookingRepository.existsByAssignedVilla_VillaIdAndBookingStatus(201, "CHECKED_IN")).thenReturn(true);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                receptionistService.updateVillaStatus(201, "AVAILABLE", "Attempted reset", 2)
        );

        assertTrue(ex.getMessage().contains("Cannot change status of Villa"));
        verify(physicalVillaRepository, never()).save(any());
    }
}
