package com.heavenstay.hswrms.m2booking;

import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.service.BookingClock;
import com.heavenstay.hswrms.m2booking.service.RetreatBookingService;
import com.heavenstay.hswrms.m2booking.service.VNPayDepositService;
import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;
import com.heavenstay.hswrms.m5billing.port.CreateDepositTransactionCommand;
import com.heavenstay.hswrms.m5billing.port.PaymentTransactionPort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VNPayDepositServiceTest {

    @Mock
    private RetreatBookingRepository bookingRepository;

    @Mock
    private RetreatBookingService bookingService;

    @Mock
    private PaymentTransactionPort paymentTransactionPort;

    @Mock
    private BookingClock bookingClock;

    private VNPayDepositService vnPayDepositService;

    private final String SECRET = "SECRET_VNPAY_KEY_FOR_DEVELOPMENT_ONLY_HSWRMS";

    @BeforeEach
    void setUp() {
        vnPayDepositService = new VNPayDepositService(
                bookingRepository,
                bookingService,
                paymentTransactionPort,
                bookingClock
        );
        ReflectionTestUtils.setField(vnPayDepositService, "hashSecret", SECRET);
        ReflectionTestUtils.setField(vnPayDepositService, "tmnCode", "HEAVENSTAY");
    }

    @Test
    @DisplayName("Fix B7, B8: Reject VNPay callback with invalid HMAC-SHA512 checksum")
    void testInvalidChecksumRejected() {
        Map<String, String> params = new HashMap<>();
        params.put("vnp_TxnRef", "HSW_DEP_100_1729000000");
        params.put("vnp_Amount", "300000000");
        params.put("vnp_ResponseCode", "00");
        params.put("vnp_SecureHash", "INVALID_TAMPERED_HASH");

        Map<String, String> result = vnPayDepositService.processIpn(params);

        assertEquals("97", result.get("RspCode"));
        assertEquals("Invalid Checksum", result.get("Message"));
        verify(bookingService, never()).confirmBookingDeposit(any(), any(), any());
    }

    @Test
    @DisplayName("Fix B8: Amount mismatch detection returns RspCode 04 (Invalid Amount)")
    void testAmountMismatchRejected() {
        String txnRef = "HSW_DEP_100_1729000000";
        Map<String, String> params = vnPayDepositService.createSignedCallbackParams(txnRef, new BigDecimal("1000000"), "00");

        PaymentResponseDTO txn = new PaymentResponseDTO();
        txn.setRetreatBookingId(100);
        txn.setAmountPaid(new BigDecimal("3000000")); // Expected 3,000,000 VND
        txn.setPaymentStatus("PENDING");

        when(paymentTransactionPort.findByTransactionReferenceForUpdate(txnRef)).thenReturn(Optional.of(txn));

        Map<String, String> result = vnPayDepositService.processIpn(params);

        assertEquals("04", result.get("RspCode"));
        assertEquals("Invalid Amount", result.get("Message"));
        verify(bookingService, never()).confirmBookingDeposit(any(), any(), any());
    }

    @Test
    @DisplayName("Fix B8, B9: Valid checksum confirms deposit and updates status to SUCCESSFUL via M5 port")
    void testValidPaymentCallbackConfirmsBooking() {
        String txnRef = "HSW_DEP_100_1729000000";
        Map<String, String> params = vnPayDepositService.createSignedCallbackParams(txnRef, new BigDecimal("3000000"), "00");

        PaymentResponseDTO txn = new PaymentResponseDTO();
        txn.setRetreatBookingId(100);
        txn.setTransactionReference(txnRef);
        txn.setAmountPaid(new BigDecimal("3000000"));
        txn.setPaymentStatus("PENDING");

        when(paymentTransactionPort.findByTransactionReferenceForUpdate(txnRef)).thenReturn(Optional.of(txn));
        LocalDateTime now = LocalDateTime.now();
        when(bookingClock.utcNow()).thenReturn(now);

        Map<String, String> result = vnPayDepositService.processIpn(params);

        assertEquals("00", result.get("RspCode"));
        assertEquals("Confirm Success", result.get("Message"));
        verify(paymentTransactionPort).updatePaymentStatus(txnRef, "SUCCESSFUL", now);
        verify(bookingService).confirmBookingDeposit(eq(100), eq(new BigDecimal("3000000")), eq(txnRef));
    }

    @Test
    @DisplayName("Fix B9: Idempotent callback processing prevents duplicate confirmation")
    void testIdempotentCallbackDoesNotDuplicate() {
        String txnRef = "HSW_DEP_100_1729000000";
        Map<String, String> params = vnPayDepositService.createSignedCallbackParams(txnRef, new BigDecimal("3000000"), "00");

        PaymentResponseDTO txn = new PaymentResponseDTO();
        txn.setRetreatBookingId(100);
        txn.setAmountPaid(new BigDecimal("3000000"));
        txn.setPaymentStatus("SUCCESSFUL"); // Already processed!

        when(paymentTransactionPort.findByTransactionReferenceForUpdate(txnRef)).thenReturn(Optional.of(txn));

        Map<String, String> result = vnPayDepositService.processIpn(params);

        assertEquals("00", result.get("RspCode"));
        assertEquals("Order already confirmed", result.get("Message"));
        verify(bookingService, never()).confirmBookingDeposit(any(), any(), any());
        verify(paymentTransactionPort, never()).updatePaymentStatus(anyString(), anyString(), any());
    }

    @Test
    @DisplayName("APP-04: Failed callback records FAILED status via M5 port")
    void testFailedPaymentCallbackRecordsFailure() {
        String txnRef = "HSW_DEP_100_1729000000";
        Map<String, String> params = vnPayDepositService.createSignedCallbackParams(txnRef, new BigDecimal("3000000"), "24"); // 24 = user cancelled

        PaymentResponseDTO txn = new PaymentResponseDTO();
        txn.setRetreatBookingId(100);
        txn.setTransactionReference(txnRef);
        txn.setAmountPaid(new BigDecimal("3000000"));
        txn.setPaymentStatus("PENDING");

        when(paymentTransactionPort.findByTransactionReferenceForUpdate(txnRef)).thenReturn(Optional.of(txn));
        LocalDateTime now = LocalDateTime.now();
        when(bookingClock.utcNow()).thenReturn(now);

        Map<String, String> result = vnPayDepositService.processIpn(params);

        assertEquals("00", result.get("RspCode"));
        assertEquals("Payment Failure Recorded", result.get("Message"));
        verify(paymentTransactionPort).updatePaymentStatus(txnRef, "FAILED", now);
        verify(bookingService, never()).confirmBookingDeposit(any(), any(), any());
    }

    @Test
    @DisplayName("APP-04: Generating deposit payment URL creates PENDING transaction via M5 port")
    void testGenerateDepositUrlCreatesPendingTransaction() {
        RetreatBooking booking = new RetreatBooking();
        booking.setRetreatBookingId(200);
        booking.setBookingStatus("PENDING");
        booking.setDepositAmount(new BigDecimal("1500000"));

        when(bookingRepository.findById(200)).thenReturn(Optional.of(booking));
        when(bookingClock.utcNow()).thenReturn(LocalDateTime.now());

        VNPayDepositService.VNPayDepositInitResult res = vnPayDepositService.generateDepositUrlWithResult(200, null, null);

        assertNotNull(res.paymentUrl());
        assertNotNull(res.transactionReference());
        assertTrue(res.transactionReference().startsWith("HSW_DEP_200_"));

        ArgumentCaptor<CreateDepositTransactionCommand> captor = ArgumentCaptor.forClass(CreateDepositTransactionCommand.class);
        verify(paymentTransactionPort).createDepositTransaction(captor.capture());

        CreateDepositTransactionCommand captured = captor.getValue();
        assertEquals(200, captured.retreatBookingId());
        assertEquals("VNPAY", captured.paymentMethod());
        assertEquals("PENDING", captured.paymentStatus());
        assertEquals(new BigDecimal("1500000"), captured.amountPaid());
        assertEquals(res.transactionReference(), captured.transactionReference());
    }
}
