package com.heavenstay.hswrms.m2booking;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationResponse;
import com.heavenstay.hswrms.m2booking.dto.BookingSummaryResponse;
import com.heavenstay.hswrms.m2booking.dto.CreateBookingRequest;
import com.heavenstay.hswrms.m2booking.dto.UpdateBookingRequest;
import com.heavenstay.hswrms.m2booking.entity.PaymentTransaction;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.service.CustomerIdentityPort;
import com.heavenstay.hswrms.m2booking.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m2booking.repository.ResidenceRecordRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m2booking.service.BookingAuditService;
import com.heavenstay.hswrms.m2booking.service.BookingClock;
import com.heavenstay.hswrms.m2booking.service.BookingPolicyService;
import com.heavenstay.hswrms.m2booking.service.RetreatBookingService;
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
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class RetreatBookingServiceTest {

    @Mock
    private RetreatBookingRepository bookingRepository;

    @Mock
    private RetreatPackageRepository packageRepository;

    @Mock
    private VillaCategoryRepository villaCategoryRepository;

    @Mock
    private VillaAvailabilityService availabilityService;

    @Mock
    private ResidenceRecordRepository residenceRecordRepository;

    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;

    @Mock
    private CustomerIdentityPort customerIdentityPort;

    @Mock
    private BookingPolicyService bookingPolicyService;

    @Mock
    private BookingClock bookingClock;

    @Mock
    private BookingAuditService bookingAuditService;

    private RetreatBookingService bookingService;

    private RetreatPackage mockPackage;
    private VillaCategory mockCategory;
    private RetreatBooking mockBooking;

    @BeforeEach
    void setUp() {
        bookingService = new RetreatBookingService(
                bookingRepository,
                packageRepository,
                villaCategoryRepository,
                availabilityService,
                residenceRecordRepository,
                paymentTransactionRepository,
                customerIdentityPort,
                bookingPolicyService,
                bookingClock,
                bookingAuditService
        );

        mockCategory = new VillaCategory();
        mockCategory.setVillaCategoryId(1);
        mockCategory.setCategoryName("Forest Sanctuary Villa");
        mockCategory.setMaxOccupancy(2);

        mockPackage = new RetreatPackage();
        mockPackage.setRetreatPackageId(10);
        mockPackage.setPackageName("3-Day Mindfulness Detox");
        mockPackage.setDurationNights(2);

        mockBooking = new RetreatBooking();
        mockBooking.setRetreatBookingId(100);
        mockBooking.setCustomerProfileId(5); // Customer Profile #5
        mockBooking.setRetreatPackage(mockPackage);
        mockBooking.setRequestedVillaCategory(mockCategory);
        mockBooking.setBookingStatus("PENDING");
        mockBooking.setCheckInDate(LocalDate.now().plusDays(5));
        mockBooking.setCheckOutDate(LocalDate.now().plusDays(7));
        mockBooking.setGuestCount(2);
        mockBooking.setTotalEstimatedAmount(new BigDecimal("12000000"));
        mockBooking.setDepositAmount(new BigDecimal("3600000"));
        mockBooking.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Fix B1, B2, B3: Create booking uses resolved CustomerProfileId and acquires lock")
    void testCreateBookingSuccess() {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setRetreatPackageId(10);
        request.setRequestedVillaCategoryId(1);
        request.setGuestCount(2);
        request.setCheckInDate(LocalDate.now().plusDays(5));
        request.setCheckOutDate(LocalDate.now().plusDays(7));

        when(packageRepository.findById(10)).thenReturn(Optional.of(mockPackage));
        when(villaCategoryRepository.findByIdForUpdate(1)).thenReturn(Optional.of(mockCategory));

        BookingCalculationResponse calcRes = new BookingCalculationResponse();
        calcRes.setAvailable(true);
        calcRes.setAvailableCount(3L);
        calcRes.setTotalEstimatedAmount(new BigDecimal("12000000"));
        calcRes.setRequiredDepositAmount(new BigDecimal("3600000"));
        when(availabilityService.calculateBooking(any())).thenReturn(calcRes);

        when(bookingClock.utcNow()).thenReturn(LocalDateTime.now());
        when(bookingRepository.save(any(RetreatBooking.class))).thenAnswer(invocation -> {
            RetreatBooking b = invocation.getArgument(0);
            b.setRetreatBookingId(101);
            return b;
        });

        BookingSummaryResponse response = bookingService.createBooking(request, 5, 2);

        assertNotNull(response);
        assertEquals(101, response.getRetreatBookingId());
        assertEquals("PENDING", response.getBookingStatus());
        assertEquals(5, response.getCustomerProfileId());
        assertEquals(2, response.getGuestCount());
        verify(bookingAuditService).record(eq(2), eq("CREATE_BOOKING"), anyString(), eq("SUCCESS"));
    }

    @Test
    @DisplayName("Fix B2: Customer Ownership check prevents unauthorized access")
    void testCustomerOwnershipCheckRejectsUnauthorizedCustomer() {
        when(bookingRepository.findById(100)).thenReturn(Optional.of(mockBooking));

        // Customer Profile #9 attempts to view booking owned by Customer Profile #5
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                bookingService.getBookingDetail(100, 9)
        );

        assertTrue(ex.getMessage().contains("permission to view"));
    }

    @Test
    @DisplayName("Fix B4: Concurrency control blocks booking if no villas available")
    void testCreateBookingBlocksWhenNoInventory() {
        CreateBookingRequest request = new CreateBookingRequest();
        request.setRetreatPackageId(10);
        request.setRequestedVillaCategoryId(1);
        request.setGuestCount(2);
        request.setCheckInDate(LocalDate.now().plusDays(5));
        request.setCheckOutDate(LocalDate.now().plusDays(7));

        when(packageRepository.findById(10)).thenReturn(Optional.of(mockPackage));
        when(villaCategoryRepository.findByIdForUpdate(1)).thenReturn(Optional.of(mockCategory));

        BookingCalculationResponse calcRes = new BookingCalculationResponse();
        calcRes.setAvailable(false);
        calcRes.setAvailableCount(0L);
        when(availabilityService.calculateBooking(any())).thenReturn(calcRes);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                bookingService.createBooking(request, 5, 2)
        );

        assertTrue(ex.getMessage().contains("No villas available"));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("FR-M2-08: Modify stay dates, guest count and recalculates amounts")
    void testModifyBookingSuccess() {
        when(bookingRepository.findByIdForUpdate(100)).thenReturn(Optional.of(mockBooking));
        when(villaCategoryRepository.findByIdForUpdate(1)).thenReturn(Optional.of(mockCategory));

        BookingCalculationResponse calcRes = new BookingCalculationResponse();
        calcRes.setAvailable(true);
        calcRes.setAvailableCount(2L);
        calcRes.setTotalEstimatedAmount(new BigDecimal("14000000"));
        calcRes.setRequiredDepositAmount(new BigDecimal("4200000"));
        when(availabilityService.calculateBooking(any())).thenReturn(calcRes);
        when(availabilityService.getAvailableVillaCountExcluding(any(), any(), any(), any())).thenReturn(2L);

        when(bookingRepository.save(any(RetreatBooking.class))).thenAnswer(i -> i.getArgument(0));

        UpdateBookingRequest updateReq = new UpdateBookingRequest();
        updateReq.setCheckInDate(LocalDate.now().plusDays(6));
        updateReq.setCheckOutDate(LocalDate.now().plusDays(8));
        updateReq.setGuestCount(2);

        BookingSummaryResponse response = bookingService.updateBooking(100, updateReq, 5, 2);

        assertNotNull(response);
        assertEquals(new BigDecimal("14000000"), response.getTotalEstimatedAmount());
        assertEquals(new BigDecimal("4200000"), response.getDepositAmount());
        verify(bookingAuditService).record(eq(2), eq("UPDATE_BOOKING"), eq("RetreatBooking #100"), eq("SUCCESS"));
    }

    @Test
    @DisplayName("FR-M2-07: Cancel booking checks policy and marks status CANCELLED")
    void testCancelBookingSuccess() {
        when(bookingRepository.findByIdForUpdate(100)).thenReturn(Optional.of(mockBooking));
        when(bookingPolicyService.cancellationWindowHours()).thenReturn(Optional.of(48));
        when(bookingPolicyService.refundPercentage()).thenReturn(Optional.of(new BigDecimal("100")));
        when(bookingClock.utcNow()).thenReturn(LocalDateTime.now());
        when(paymentTransactionRepository.findByRetreatBookingIdAndPaymentTypeOrderByTransactionIdDesc(100, PaymentTransaction.TYPE_DEPOSIT))
                .thenReturn(Collections.emptyList());
        when(bookingRepository.save(any(RetreatBooking.class))).thenAnswer(i -> i.getArgument(0));

        BookingSummaryResponse response = bookingService.cancelBooking(100, 5, 2);

        assertNotNull(response);
        assertEquals("CANCELLED", response.getBookingStatus());
        verify(bookingAuditService).record(eq(2), eq("CANCEL_BOOKING"), contains("RetreatBooking #100"), eq("SUCCESS"));
    }
}
