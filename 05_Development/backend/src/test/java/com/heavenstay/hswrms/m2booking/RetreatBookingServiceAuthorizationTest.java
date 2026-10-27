package com.heavenstay.hswrms.m2booking;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationResponse;
import com.heavenstay.hswrms.m2booking.dto.BookingSummaryResponse;
import com.heavenstay.hswrms.m2booking.dto.CreateBookingRequest;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.ResidenceRecordRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m2booking.service.RetreatBookingService;
import com.heavenstay.hswrms.m2booking.service.VNPayDepositService;
import com.heavenstay.hswrms.m2booking.service.VillaAvailabilityService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

public class RetreatBookingServiceAuthorizationTest {

    private RetreatBookingRepository bookingRepository;
    private RetreatPackageRepository packageRepository;
    private VillaCategoryRepository villaCategoryRepository;
    private VillaAvailabilityService availabilityService;
    private ResidenceRecordRepository residenceRecordRepository;
    private CustomerProfileRepository customerProfileRepository;

    private RetreatBookingService bookingService;

    @BeforeEach
    public void setup() {
        bookingRepository = mock(RetreatBookingRepository.class);
        packageRepository = mock(RetreatPackageRepository.class);
        villaCategoryRepository = mock(VillaCategoryRepository.class);
        availabilityService = mock(VillaAvailabilityService.class);
        residenceRecordRepository = mock(ResidenceRecordRepository.class);
        customerProfileRepository = mock(CustomerProfileRepository.class);

        bookingService = new RetreatBookingService(
                bookingRepository,
                packageRepository,
                villaCategoryRepository,
                availabilityService,
                residenceRecordRepository,
                customerProfileRepository
        );
    }

    private CustomUserDetails createUser(Integer userId, String role) {
        return new CustomUserDetails(userId, "user" + userId + "@heavenstay.com", "", "User " + userId, true, List.of(role));
    }

    private RetreatBooking sampleBooking(Integer bookingId, Integer customerProfileId) {
        RetreatBooking booking = new RetreatBooking();
        booking.setRetreatBookingId(bookingId);
        booking.setCustomerProfileId(customerProfileId);
        booking.setBookingStatus("PENDING");
        booking.setCheckInDate(LocalDate.now().plusDays(2));
        booking.setCheckOutDate(LocalDate.now().plusDays(5));
        booking.setDepositAmount(new BigDecimal("3000000.00"));
        booking.setTotalEstimatedAmount(new BigDecimal("10000000.00"));
        booking.setCreatedAt(LocalDateTime.now());

        RetreatPackage pkg = new RetreatPackage();
        pkg.setRetreatPackageId(1);
        pkg.setPackageName("Wellness Detox");
        booking.setRetreatPackage(pkg);

        VillaCategory cat = new VillaCategory();
        cat.setVillaCategoryId(1);
        cat.setCategoryName("Ocean Pool Sanctuary");
        booking.setRequestedVillaCategory(cat);

        return booking;
    }

    @Test
    @DisplayName("1. User without CustomerProfile cannot create booking")
    public void testUserWithoutCustomerProfileCannotCreateBooking() {
        CustomUserDetails userWithoutProfile = createUser(15, "CUSTOMER");
        when(customerProfileRepository.findByUserId(15)).thenReturn(Optional.empty());

        CreateBookingRequest request = new CreateBookingRequest();
        request.setRetreatPackageId(1);
        request.setRequestedVillaCategoryId(1);
        request.setCheckInDate(LocalDate.now().plusDays(2));
        request.setCheckOutDate(LocalDate.now().plusDays(5));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                bookingService.createBooking(request, userWithoutProfile)
        );
        assertTrue(ex.getMessage().contains("Customer profile not found"));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("2. User without CustomerProfile cannot read booking even if booking's customerProfileId matches userId")
    public void testUserWithoutCustomerProfileCannotReadBookingEvenIfIdMatchesUserId() {
        // Booking has customerProfileId = 10. User has userId = 10.
        // Without a CustomerProfile, access MUST be denied and cannot fall back to userId.
        CustomUserDetails user = createUser(10, "CUSTOMER");
        RetreatBooking booking = sampleBooking(1, 10);

        when(bookingRepository.findById(1)).thenReturn(Optional.of(booking));
        when(customerProfileRepository.findByUserId(10)).thenReturn(Optional.empty());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                bookingService.getBookingDetail(1, user)
        );
        assertTrue(ex.getMessage().contains("Customer profile not found"));
    }

    @Test
    @DisplayName("3. User without CustomerProfile cannot generate VNPay payment URL")
    public void testUserWithoutCustomerProfileCannotGeneratePaymentUrl() {
        VNPayDepositService vnPayService = new VNPayDepositService(bookingRepository, bookingService);
        vnPayService.setHashSecret("TEST_SECRET_KEY_12345");

        CustomUserDetails user = createUser(10, "CUSTOMER");
        RetreatBooking booking = sampleBooking(1, 10);

        when(bookingRepository.findById(1)).thenReturn(Optional.of(booking));
        when(customerProfileRepository.findByUserId(10)).thenReturn(Optional.empty());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                vnPayService.generateDepositUrl(1, "http://localhost/return", null, user)
        );
        assertTrue(ex.getMessage().contains("Customer profile not found"));
    }

    @Test
    @DisplayName("4. User without CustomerProfile cannot cancel booking")
    public void testUserWithoutCustomerProfileCannotCancelBooking() {
        CustomUserDetails user = createUser(10, "CUSTOMER");
        RetreatBooking booking = sampleBooking(1, 10);

        when(bookingRepository.findById(1)).thenReturn(Optional.of(booking));
        when(customerProfileRepository.findByUserId(10)).thenReturn(Optional.empty());

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () ->
                bookingService.cancelBooking(1, user)
        );
        assertTrue(ex.getMessage().contains("Customer profile not found"));
        verify(bookingRepository, never()).save(any());
    }

    @Test
    @DisplayName("5. User with valid CustomerProfile can access and manage their own booking")
    public void testUserWithValidCustomerProfileCanAccessOwnBooking() {
        // User ID is 10, CustomerProfile ID is 555 (distinct identifiers)
        CustomUserDetails user = createUser(10, "CUSTOMER");
        CustomerProfile profile = new CustomerProfile();
        profile.setCustomerProfileId(555);
        when(customerProfileRepository.findByUserId(10)).thenReturn(Optional.of(profile));

        RetreatBooking booking = sampleBooking(1, 555);
        when(bookingRepository.findById(1)).thenReturn(Optional.of(booking));

        // 5a. Read own booking
        BookingSummaryResponse response = bookingService.getBookingDetail(1, user);
        assertNotNull(response);
        assertEquals(1, response.getRetreatBookingId());
        assertEquals(555, response.getCustomerProfileId());

        // 5b. Cancel own booking
        when(bookingRepository.save(any(RetreatBooking.class))).thenAnswer(i -> i.getArgument(0));
        BookingSummaryResponse cancelResponse = bookingService.cancelBooking(1, user);
        assertNotNull(cancelResponse);
        assertEquals("CANCELLED", cancelResponse.getBookingStatus());

        // 5c. List own customer bookings
        when(bookingRepository.findByCustomerProfileIdOrderByCreatedAtDesc(555))
                .thenReturn(List.of(booking));
        List<BookingSummaryResponse> list = bookingService.getCustomerBookings(user);
        assertEquals(1, list.size());
        assertEquals(555, list.get(0).getCustomerProfileId());
    }

    @Test
    @DisplayName("6. Existing IDOR checks block accessing another customer's booking")
    public void testIdorPreventionBlocksAccessingOtherCustomerBooking() {
        // Authenticated user has userId = 10, CustomerProfile ID = 555
        CustomUserDetails user = createUser(10, "CUSTOMER");
        CustomerProfile profile = new CustomerProfile();
        profile.setCustomerProfileId(555);
        when(customerProfileRepository.findByUserId(10)).thenReturn(Optional.of(profile));

        // Booking belongs to CustomerProfile ID = 999
        RetreatBooking otherBooking = sampleBooking(2, 999);
        when(bookingRepository.findById(2)).thenReturn(Optional.of(otherBooking));

        // 6a. Viewing detail of another customer's booking is blocked
        AccessDeniedException exView = assertThrows(AccessDeniedException.class, () ->
                bookingService.getBookingDetail(2, user)
        );
        assertTrue(exView.getMessage().contains("Access denied: You do not have permission to view booking #2"));

        // 6b. Canceling another customer's booking is blocked
        AccessDeniedException exCancel = assertThrows(AccessDeniedException.class, () ->
                bookingService.cancelBooking(2, user)
        );
        assertTrue(exCancel.getMessage().contains("Access denied: You do not have permission to cancel booking #2"));

        // 6c. Generating payment URL for another customer's booking is blocked
        VNPayDepositService vnPayService = new VNPayDepositService(bookingRepository, bookingService);
        vnPayService.setHashSecret("TEST_SECRET_KEY_12345");
        AccessDeniedException exPay = assertThrows(AccessDeniedException.class, () ->
                vnPayService.generateDepositUrl(2, "http://localhost/return", null, user)
        );
        assertTrue(exPay.getMessage().contains("Access denied: You do not have permission to generate payment URL for booking #2"));
    }

    @Test
    @DisplayName("7. RECEPTIONIST can view any customer's booking without requiring a CustomerProfile")
    public void testReceptionistViewAnyBookingAllowed() {
        CustomUserDetails receptionist = createUser(50, "RECEPTIONIST");
        RetreatBooking booking = sampleBooking(2, 20);

        when(bookingRepository.findById(2)).thenReturn(Optional.of(booking));

        BookingSummaryResponse response = bookingService.getBookingDetail(2, receptionist);
        assertNotNull(response);
        assertEquals(2, response.getRetreatBookingId());
        // Verify customerProfileRepository was never even queried for staff
        verify(customerProfileRepository, never()).findByUserId(any());
    }

    @Test
    @DisplayName("8. User with valid CustomerProfile can create booking successfully")
    public void testUserWithValidCustomerProfileCanCreateBooking() {
        CustomUserDetails user = createUser(10, "CUSTOMER");
        CustomerProfile profile = new CustomerProfile();
        profile.setCustomerProfileId(777);
        when(customerProfileRepository.findByUserId(10)).thenReturn(Optional.of(profile));

        RetreatPackage pkg = new RetreatPackage();
        pkg.setRetreatPackageId(1);
        pkg.setPackageName("Rejuvenation");
        when(packageRepository.findById(1)).thenReturn(Optional.of(pkg));

        VillaCategory cat = new VillaCategory();
        cat.setVillaCategoryId(1);
        cat.setCategoryName("Ocean Villa");
        when(villaCategoryRepository.findById(1)).thenReturn(Optional.of(cat));

        BookingCalculationResponse calcRes = new BookingCalculationResponse();
        calcRes.setAvailable(true);
        calcRes.setTotalEstimatedAmount(new BigDecimal("12000000.00"));
        calcRes.setRequiredDepositAmount(new BigDecimal("3600000.00"));
        when(availabilityService.calculateBooking(any())).thenReturn(calcRes);

        when(bookingRepository.save(any(RetreatBooking.class))).thenAnswer(i -> {
            RetreatBooking b = i.getArgument(0);
            b.setRetreatBookingId(101);
            return b;
        });

        CreateBookingRequest request = new CreateBookingRequest();
        request.setRetreatPackageId(1);
        request.setRequestedVillaCategoryId(1);
        request.setCheckInDate(LocalDate.now().plusDays(2));
        request.setCheckOutDate(LocalDate.now().plusDays(5));

        BookingSummaryResponse response = bookingService.createBooking(request, user);
        assertNotNull(response);
        assertEquals(101, response.getRetreatBookingId());
        assertEquals(777, response.getCustomerProfileId());
    }

    @Test
    @DisplayName("9. Unauthenticated user calling service methods throws AccessDeniedException")
    public void testUnauthenticatedUserThrowsAccessDenied() {
        assertThrows(AccessDeniedException.class, () ->
                bookingService.getBookingDetail(1, null)
        );
        assertThrows(AccessDeniedException.class, () ->
                bookingService.getCustomerBookings((CustomUserDetails) null)
        );
        assertThrows(AccessDeniedException.class, () ->
                bookingService.cancelBooking(1, (CustomUserDetails) null)
        );
        assertThrows(AccessDeniedException.class, () ->
                bookingService.createBooking(new CreateBookingRequest(), (CustomUserDetails) null)
        );
    }
}
