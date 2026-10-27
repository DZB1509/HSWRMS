package com.heavenstay.hswrms.m2booking;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m2booking.dto.BookingSummaryResponse;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.service.ReceptionistOperationService;
import com.heavenstay.hswrms.m2booking.service.RetreatBookingService;
import com.heavenstay.hswrms.m2booking.service.VNPayDepositService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class RetreatBookingSecurityTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private RetreatBookingService bookingService;

    @MockBean
    private VNPayDepositService vnPayDepositService;

    @MockBean
    private ReceptionistOperationService receptionistService;

    private CustomUserDetails createCustomer(Integer userId) {
        return new CustomUserDetails(userId, "customer" + userId + "@heavenstay.com", "", "Customer " + userId, true, List.of("CUSTOMER"));
    }

    private CustomUserDetails createReceptionist(Integer userId) {
        return new CustomUserDetails(userId, "receptionist" + userId + "@heavenstay.com", "", "Receptionist " + userId, true, List.of("RECEPTIONIST"));
    }

    private CustomUserDetails createManager(Integer userId) {
        return new CustomUserDetails(userId, "manager" + userId + "@heavenstay.com", "", "Manager " + userId, true, List.of("MANAGER"));
    }

    private BookingSummaryResponse sampleBookingResponse(Integer bookingId, Integer customerProfileId) {
        BookingSummaryResponse res = new BookingSummaryResponse();
        res.setRetreatBookingId(bookingId);
        res.setCustomerProfileId(customerProfileId);
        res.setPackageName("7-Day Detox");
        res.setRequestedCategoryName("Ocean Pool Villa");
        res.setBookingStatus("PENDING");
        res.setTotalEstimatedAmount(new BigDecimal("25000000.00"));
        res.setDepositAmount(new BigDecimal("7500000.00"));
        res.setCreatedAt(LocalDateTime.now());
        return res;
    }

    @Test
    @DisplayName("Security 1. Unauthenticated request to protected customer booking endpoints returns HTTP 401")
    public void testUnauthenticatedCustomerBookingEndpointReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/customer/bookings"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/customer/bookings/101"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/customer/bookings"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security 2. Unauthenticated request to receptionist operations returns HTTP 401")
    public void testUnauthenticatedReceptionistEndpointReturns401() throws Exception {
        mockMvc.perform(get("/api/v1/receptionist/arrivals"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Security 3. CUSTOMER can access their own booking detail (HTTP 200)")
    public void testCustomerCanAccessOwnBooking() throws Exception {
        CustomUserDetails customer1 = createCustomer(101);
        BookingSummaryResponse booking = sampleBookingResponse(1, 101);

        when(bookingService.getBookingDetail(eq(1), any(CustomUserDetails.class)))
                .thenReturn(booking);

        mockMvc.perform(get("/api/v1/customer/bookings/1")
                        .with(user(customer1)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.retreatBookingId").value(1))
                .andExpect(jsonPath("$.data.customerProfileId").value(101));
    }

    @Test
    @DisplayName("Security 4. CUSTOMER accessing another customer's booking returns HTTP 403 Forbidden (IDOR prevention)")
    public void testCustomerAccessingOtherCustomerBookingReturns403() throws Exception {
        CustomUserDetails customer1 = createCustomer(101);

        when(bookingService.getBookingDetail(eq(2), any(CustomUserDetails.class)))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to view booking #2"));

        mockMvc.perform(get("/api/v1/customer/bookings/2")
                        .with(user(customer1)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Security 5. CUSTOMER generating VNPay URL for another customer's booking returns HTTP 403 Forbidden")
    public void testCustomerGeneratePaymentUrlForOtherCustomerBookingReturns403() throws Exception {
        CustomUserDetails customer1 = createCustomer(101);

        when(vnPayDepositService.generateDepositUrl(eq(2), any(), any(), any(CustomUserDetails.class)))
                .thenThrow(new AccessDeniedException("Access denied: You do not have permission to generate payment for booking #2"));

        mockMvc.perform(post("/api/v1/customer/bookings/2/vnpay-url")
                        .with(user(customer1)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Security 6. RECEPTIONIST can view any customer's booking for arrival operations (HTTP 200)")
    public void testReceptionistCanAccessAnyBooking() throws Exception {
        CustomUserDetails receptionist = createReceptionist(201);
        BookingSummaryResponse booking = sampleBookingResponse(2, 102);

        when(bookingService.getBookingDetail(eq(2), any(CustomUserDetails.class)))
                .thenReturn(booking);

        mockMvc.perform(get("/api/v1/customer/bookings/2")
                        .with(user(receptionist)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.retreatBookingId").value(2));
    }

    @Test
    @DisplayName("Security 7. RECEPTIONIST can access daily arrivals (HTTP 200)")
    public void testReceptionistCanAccessDailyArrivals() throws Exception {
        CustomUserDetails receptionist = createReceptionist(201);
        when(receptionistService.getDailyArrivals(any())).thenReturn(Collections.emptyList());

        mockMvc.perform(get("/api/v1/receptionist/arrivals")
                        .with(user(receptionist)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Security 8. CUSTOMER calling receptionist operations returns HTTP 403 Forbidden")
    public void testCustomerCallingReceptionistEndpointReturns403() throws Exception {
        CustomUserDetails customer1 = createCustomer(101);

        mockMvc.perform(get("/api/v1/receptionist/arrivals")
                        .with(user(customer1)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Security 9. Public catalog and VNPay callback remain public (HTTP 200)")
    public void testPublicEndpointsRemainAccessible() throws Exception {
        mockMvc.perform(get("/api/v1/retreat-packages"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/retreat-packages/villa-categories"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Security 10. Missing VNPay secret causes fail-safe refusal without generating URL or confirming payment")
    public void testMissingVNPaySecretFailsSafely() {
        RetreatBookingRepository mockRepo = mock(RetreatBookingRepository.class);
        RetreatBookingService mockBookingService = mock(RetreatBookingService.class);
        VNPayDepositService service = new VNPayDepositService(mockRepo, mockBookingService);

        // Explicitly set secret to empty/null
        service.setHashSecret("");

        RetreatBooking booking = new RetreatBooking();
        booking.setRetreatBookingId(1);
        booking.setCustomerProfileId(101);
        booking.setBookingStatus("PENDING");
        booking.setDepositAmount(new BigDecimal("5000000.00"));

        when(mockRepo.findById(1)).thenReturn(Optional.of(booking));

        // 1. generateDepositUrl must fail safely by throwing BusinessRuleException
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                service.generateDepositUrl(1, null, null)
        );
        assertTrue(ex.getMessage().contains("hash secret is not configured"),
                "Expected fail-safe exception message when hash secret is missing");

        // 2. processIpn must fail safely by returning error RspCode 99
        Map<String, String> ipnParams = new HashMap<>();
        ipnParams.put("vnp_TxnRef", "HSW_DEP_1_12345");
        ipnParams.put("vnp_ResponseCode", "00");
        ipnParams.put("vnp_SecureHash", "fakehash");

        Map<String, String> ipnResult = service.processIpn(ipnParams);
        assertEquals("99", ipnResult.get("RspCode"), "Expected RspCode 99 when secret is missing");
        assertTrue(ipnResult.get("Message").contains("hash secret is missing"));
    }

    @Test
    @DisplayName("Security 11. User without CustomerProfile cannot create booking (HTTP 403 Forbidden)")
    public void testUserWithoutCustomerProfileCannotCreateBooking() throws Exception {
        CustomUserDetails customerWithoutProfile = createCustomer(999);
        when(bookingService.createBooking(any(), any(CustomUserDetails.class)))
                .thenThrow(new AccessDeniedException("Customer profile not found for user ID: 999. Customer booking operations require an active customer profile."));

        mockMvc.perform(post("/api/v1/customer/bookings")
                        .with(user(customerWithoutProfile))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"retreatPackageId\":1,\"requestedVillaCategoryId\":1,\"checkInDate\":\"2026-11-01\",\"checkOutDate\":\"2026-11-05\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Security 12. User without CustomerProfile cannot view booking (HTTP 403 Forbidden)")
    public void testUserWithoutCustomerProfileCannotViewBooking() throws Exception {
        CustomUserDetails customerWithoutProfile = createCustomer(999);
        when(bookingService.getBookingDetail(eq(1), any(CustomUserDetails.class)))
                .thenThrow(new AccessDeniedException("Customer profile not found for user ID: 999. Customer booking operations require an active customer profile."));

        mockMvc.perform(get("/api/v1/customer/bookings/1")
                        .with(user(customerWithoutProfile)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Security 13. User without CustomerProfile cannot generate payment URL (HTTP 403 Forbidden)")
    public void testUserWithoutCustomerProfileCannotGeneratePaymentUrl() throws Exception {
        CustomUserDetails customerWithoutProfile = createCustomer(999);
        when(vnPayDepositService.generateDepositUrl(eq(1), any(), any(), any(CustomUserDetails.class)))
                .thenThrow(new AccessDeniedException("Customer profile not found for user ID: 999. Customer booking operations require an active customer profile."));

        mockMvc.perform(post("/api/v1/customer/bookings/1/vnpay-url")
                        .with(user(customerWithoutProfile)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }

    @Test
    @DisplayName("Security 14. User without CustomerProfile cannot cancel booking (HTTP 403 Forbidden)")
    public void testUserWithoutCustomerProfileCannotCancelBooking() throws Exception {
        CustomUserDetails customerWithoutProfile = createCustomer(999);
        when(bookingService.cancelBooking(eq(1), any(CustomUserDetails.class)))
                .thenThrow(new AccessDeniedException("Customer profile not found for user ID: 999. Customer booking operations require an active customer profile."));

        mockMvc.perform(post("/api/v1/customer/bookings/1/cancel")
                        .with(user(customerWithoutProfile)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.code").value("ACCESS_DENIED"));
    }
}
