package com.heavenstay.hswrms.m5billing.port;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=true",
        "app.vnpay.mock-auto-confirm=true"
})
@Transactional
public class PaymentTransactionPortTest {

    @Autowired
    private PaymentTransactionPort paymentTransactionPort;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private RetreatBookingRepository bookingRepository;

    private RetreatBooking testBooking;

    @BeforeEach
    void setUp() {
        List<RetreatBooking> bookings = bookingRepository.findAll();
        assertFalse(bookings.isEmpty(), "At least one demo booking must be present");
        testBooking = bookings.get(0);
    }

    @Test
    @DisplayName("APP-03: Successfully creates a PENDING deposit transaction")
    void testCreateDepositTransaction_PendingSuccess() {
        String ref = "TEST_DEP_PENDING_" + System.currentTimeMillis();
        BigDecimal amount = new BigDecimal("250.00");
        LocalDateTime txDate = LocalDateTime.now(ZoneOffset.UTC);

        CreateDepositTransactionCommand cmd = CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(),
                "VNPAY",
                ref,
                amount,
                txDate
        );

        PaymentResponseDTO res = paymentTransactionPort.createDepositTransaction(cmd);

        assertNotNull(res.getTransactionId());
        assertEquals("DEPOSIT", res.getPaymentType());
        assertEquals("VNPAY", res.getPaymentMethod());
        assertEquals(ref, res.getTransactionReference());
        assertEquals(0, amount.compareTo(res.getAmountPaid()));
        assertEquals("PENDING", res.getPaymentStatus());
        assertEquals(testBooking.getRetreatBookingId().longValue(), res.getRetreatBookingId());
        assertNull(res.getInvoiceId(), "DEPOSIT payment must have null invoiceId");
    }

    @Test
    @DisplayName("APP-03: Successfully creates a SUCCESSFUL deposit transaction for walk-in cash")
    void testCreateDepositTransaction_SuccessfulWalkIn() {
        String ref = "TEST_WALK_IN_" + System.currentTimeMillis();
        BigDecimal amount = new BigDecimal("500.00");
        LocalDateTime txDate = LocalDateTime.now(ZoneOffset.UTC);

        CreateDepositTransactionCommand cmd = CreateDepositTransactionCommand.successful(
                testBooking.getRetreatBookingId(),
                "CASH",
                ref,
                amount,
                txDate
        );

        PaymentResponseDTO res = paymentTransactionPort.createDepositTransaction(cmd);

        assertNotNull(res.getTransactionId());
        assertEquals("DEPOSIT", res.getPaymentType());
        assertEquals("CASH", res.getPaymentMethod());
        assertEquals(ref, res.getTransactionReference());
        assertEquals("SUCCESSFUL", res.getPaymentStatus());
        assertEquals(0, amount.compareTo(res.getAmountPaid()));
    }

    @Test
    @DisplayName("APP-03: Repeated creation with identical reference returns existing transaction idempotently")
    void testCreateDepositTransaction_Idempotency() {
        String ref = "TEST_IDEMPOTENT_" + System.currentTimeMillis();
        BigDecimal amount = new BigDecimal("300.00");

        CreateDepositTransactionCommand cmd1 = CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(), "VNPAY", ref, amount, LocalDateTime.now(ZoneOffset.UTC)
        );
        PaymentResponseDTO res1 = paymentTransactionPort.createDepositTransaction(cmd1);

        CreateDepositTransactionCommand cmd2 = CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(), "VNPAY", ref, amount, LocalDateTime.now(ZoneOffset.UTC)
        );
        PaymentResponseDTO res2 = paymentTransactionPort.createDepositTransaction(cmd2);

        assertEquals(res1.getTransactionId(), res2.getTransactionId(), "Should return identical transaction ID");
        assertEquals(res1.getTransactionReference(), res2.getTransactionReference());
        assertEquals(res1.getAmountPaid(), res2.getAmountPaid());
    }

    @Test
    @DisplayName("APP-03: Validation error when command is null")
    void testCreateDepositTransaction_NullCommand() {
        assertThrows(IllegalArgumentException.class, () -> paymentTransactionPort.createDepositTransaction(null));
    }

    @Test
    @DisplayName("APP-03: Validation error when retreatBookingId is missing")
    void testCreateDepositTransaction_MissingBookingId() {
        CreateDepositTransactionCommand cmd = new CreateDepositTransactionCommand(
                null, "CASH", "REF_NO_BOOKING", BigDecimal.TEN, "PENDING", LocalDateTime.now()
        );
        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> paymentTransactionPort.createDepositTransaction(cmd));
        assertEquals("MISSING_BOOKING_ID", ex.getErrorCode());
    }

    @Test
    @DisplayName("APP-03: Validation error when amount is negative")
    void testCreateDepositTransaction_NegativeAmount() {
        CreateDepositTransactionCommand cmd = new CreateDepositTransactionCommand(
                testBooking.getRetreatBookingId(), "CASH", "REF_NEG", new BigDecimal("-1.00"), "PENDING", LocalDateTime.now()
        );
        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> paymentTransactionPort.createDepositTransaction(cmd));
        assertEquals("INVALID_AMOUNT", ex.getErrorCode());
    }

    @Test
    @DisplayName("APP-03: Throws ResourceNotFoundException when retreat booking does not exist")
    void testCreateDepositTransaction_NonExistentBooking() {
        CreateDepositTransactionCommand cmd = new CreateDepositTransactionCommand(
                99999999, "CASH", "REF_NON_EXISTENT", BigDecimal.TEN, "PENDING", LocalDateTime.now()
        );
        assertThrows(ResourceNotFoundException.class,
                () -> paymentTransactionPort.createDepositTransaction(cmd));
    }

    @Test
    @DisplayName("APP-03: findByTransactionReference returns existing transaction or empty")
    void testFindByTransactionReference() {
        String ref = "TEST_FIND_REF_" + System.currentTimeMillis();
        CreateDepositTransactionCommand cmd = CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(), "VNPAY", ref, new BigDecimal("100.00"), LocalDateTime.now(ZoneOffset.UTC)
        );
        paymentTransactionPort.createDepositTransaction(cmd);

        Optional<PaymentResponseDTO> found = paymentTransactionPort.findByTransactionReference(ref);
        assertTrue(found.isPresent());
        assertEquals(ref, found.get().getTransactionReference());

        Optional<PaymentResponseDTO> notFound = paymentTransactionPort.findByTransactionReference("NON_EXISTENT_REF");
        assertTrue(notFound.isEmpty());

        Optional<PaymentResponseDTO> blank = paymentTransactionPort.findByTransactionReference("   ");
        assertTrue(blank.isEmpty());
    }

    @Test
    @DisplayName("APP-03: findByTransactionReferenceForUpdate locks and returns existing transaction")
    void testFindByTransactionReferenceForUpdate() {
        String ref = "TEST_FIND_LOCK_" + System.currentTimeMillis();
        CreateDepositTransactionCommand cmd = CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(), "VNPAY", ref, new BigDecimal("150.00"), LocalDateTime.now(ZoneOffset.UTC)
        );
        paymentTransactionPort.createDepositTransaction(cmd);

        Optional<PaymentResponseDTO> found = paymentTransactionPort.findByTransactionReferenceForUpdate(ref);
        assertTrue(found.isPresent());
        assertEquals(ref, found.get().getTransactionReference());
    }

    @Test
    @DisplayName("APP-03: findByTransactionId returns transaction or empty")
    void testFindByTransactionId() {
        String ref = "TEST_FIND_ID_" + System.currentTimeMillis();
        CreateDepositTransactionCommand cmd = CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(), "VNPAY", ref, new BigDecimal("75.00"), LocalDateTime.now(ZoneOffset.UTC)
        );
        PaymentResponseDTO created = paymentTransactionPort.createDepositTransaction(cmd);

        Optional<PaymentResponseDTO> found = paymentTransactionPort.findByTransactionId(created.getTransactionId());
        assertTrue(found.isPresent());
        assertEquals(created.getTransactionId(), found.get().getTransactionId());

        Optional<PaymentResponseDTO> notFound = paymentTransactionPort.findByTransactionId(999999999L);
        assertTrue(notFound.isEmpty());

        Optional<PaymentResponseDTO> nullId = paymentTransactionPort.findByTransactionId(null);
        assertTrue(nullId.isEmpty());
    }

    @Test
    @DisplayName("APP-03: updatePaymentStatus by reference transitions status and updates timestamp")
    void testUpdatePaymentStatus_ByReference() {
        String ref = "TEST_STATUS_REF_" + System.currentTimeMillis();
        CreateDepositTransactionCommand cmd = CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(), "VNPAY", ref, new BigDecimal("200.00"), LocalDateTime.now(ZoneOffset.UTC)
        );
        paymentTransactionPort.createDepositTransaction(cmd);

        LocalDateTime updateTime = LocalDateTime.now(ZoneOffset.UTC).plusMinutes(5);
        PaymentResponseDTO updated = paymentTransactionPort.updatePaymentStatus(ref, "SUCCESSFUL", updateTime);

        assertEquals("SUCCESSFUL", updated.getPaymentStatus());
        assertEquals(updateTime, updated.getTransactionDate());

        // Idempotent retry with same status succeeds
        PaymentResponseDTO idempotent = paymentTransactionPort.updatePaymentStatus(ref, "SUCCESSFUL", updateTime);
        assertEquals("SUCCESSFUL", idempotent.getPaymentStatus());
    }

    @Test
    @DisplayName("APP-03: updatePaymentStatus by ID transitions status")
    void testUpdatePaymentStatus_ById() {
        String ref = "TEST_STATUS_ID_" + System.currentTimeMillis();
        CreateDepositTransactionCommand cmd = CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(), "VNPAY", ref, new BigDecimal("120.00"), LocalDateTime.now(ZoneOffset.UTC)
        );
        PaymentResponseDTO created = paymentTransactionPort.createDepositTransaction(cmd);

        PaymentResponseDTO updated = paymentTransactionPort.updatePaymentStatusById(created.getTransactionId(), "FAILED", null);
        assertEquals("FAILED", updated.getPaymentStatus());
    }

    @Test
    @DisplayName("APP-03: Settlement guard prevents transitioning SUCCESSFUL transaction to FAILED or CANCELLED")
    void testUpdatePaymentStatus_SettlementGuard() {
        String ref = "TEST_SETTLED_GUARD_" + System.currentTimeMillis();
        CreateDepositTransactionCommand cmd = CreateDepositTransactionCommand.successful(
                testBooking.getRetreatBookingId(), "CASH", ref, new BigDecimal("400.00"), LocalDateTime.now(ZoneOffset.UTC)
        );
        paymentTransactionPort.createDepositTransaction(cmd);

        BusinessRuleException ex1 = assertThrows(BusinessRuleException.class,
                () -> paymentTransactionPort.updatePaymentStatus(ref, "FAILED", null));
        assertEquals("TRANSACTION_ALREADY_SETTLED", ex1.getErrorCode());

        BusinessRuleException ex2 = assertThrows(BusinessRuleException.class,
                () -> paymentTransactionPort.updatePaymentStatus(ref, "CANCELLED", null));
        assertEquals("TRANSACTION_ALREADY_SETTLED", ex2.getErrorCode());
    }

    @Test
    @DisplayName("APP-03: findDepositTransactionsByBookingId returns deposit transactions ordered by ID desc")
    void testFindDepositTransactionsByBookingId() {
        String ref1 = "TEST_ORDER_1_" + System.currentTimeMillis();
        String ref2 = "TEST_ORDER_2_" + (System.currentTimeMillis() + 10);

        paymentTransactionPort.createDepositTransaction(CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(), "VNPAY", ref1, new BigDecimal("50.00"), LocalDateTime.now(ZoneOffset.UTC)));
        paymentTransactionPort.createDepositTransaction(CreateDepositTransactionCommand.successful(
                testBooking.getRetreatBookingId(), "CASH", ref2, new BigDecimal("60.00"), LocalDateTime.now(ZoneOffset.UTC)));

        List<PaymentResponseDTO> list = paymentTransactionPort.findDepositTransactionsByBookingId(testBooking.getRetreatBookingId());

        assertFalse(list.isEmpty());
        assertTrue(list.size() >= 2);
        assertTrue(list.get(0).getTransactionId() > list.get(1).getTransactionId(), "Must be ordered DESC by transactionId");
        for (PaymentResponseDTO dto : list) {
            assertEquals("DEPOSIT", dto.getPaymentType());
            assertEquals(testBooking.getRetreatBookingId().longValue(), dto.getRetreatBookingId());
        }
    }

    @Test
    @DisplayName("APP-03: findDepositTransactionsByBookingIds batch returns deposit transactions for multiple bookings")
    void testFindDepositTransactionsByBookingIds_Batch() {
        String ref = "TEST_BATCH_" + System.currentTimeMillis();
        paymentTransactionPort.createDepositTransaction(CreateDepositTransactionCommand.successful(
                testBooking.getRetreatBookingId(), "CASH", ref, new BigDecimal("80.00"), LocalDateTime.now(ZoneOffset.UTC)));

        List<PaymentResponseDTO> batch = paymentTransactionPort.findDepositTransactionsByBookingIds(
                List.of(testBooking.getRetreatBookingId())
        );

        assertFalse(batch.isEmpty());
        assertTrue(batch.stream().anyMatch(t -> ref.equals(t.getTransactionReference())));
    }

    @Test
    @DisplayName("APP-03: cancelPendingDepositTransactions cancels PENDING and preserves SUCCESSFUL")
    void testCancelPendingDepositTransactions() {
        String refPending = "TEST_CANCEL_PENDING_" + System.currentTimeMillis();
        String refSuccess = "TEST_CANCEL_SUCCESS_" + (System.currentTimeMillis() + 10);

        paymentTransactionPort.createDepositTransaction(CreateDepositTransactionCommand.pending(
                testBooking.getRetreatBookingId(), "VNPAY", refPending, new BigDecimal("100.00"), LocalDateTime.now(ZoneOffset.UTC)));
        paymentTransactionPort.createDepositTransaction(CreateDepositTransactionCommand.successful(
                testBooking.getRetreatBookingId(), "CASH", refSuccess, new BigDecimal("200.00"), LocalDateTime.now(ZoneOffset.UTC)));

        int cancelledCount = paymentTransactionPort.cancelPendingDepositTransactions(testBooking.getRetreatBookingId());
        assertTrue(cancelledCount >= 1);

        Optional<PaymentResponseDTO> pendingAfter = paymentTransactionPort.findByTransactionReference(refPending);
        assertTrue(pendingAfter.isPresent());
        assertEquals("CANCELLED", pendingAfter.get().getPaymentStatus());

        Optional<PaymentResponseDTO> successAfter = paymentTransactionPort.findByTransactionReference(refSuccess);
        assertTrue(successAfter.isPresent());
        assertEquals("SUCCESSFUL", successAfter.get().getPaymentStatus());
    }

    @Test
    @DisplayName("APP-03: sumSuccessfulDepositsForBooking correctly sums successful deposits")
    void testSumSuccessfulDepositsForBooking() {
        String ref1 = "TEST_SUM_1_" + System.currentTimeMillis();
        String ref2 = "TEST_SUM_2_" + (System.currentTimeMillis() + 10);

        BigDecimal beforeSum = paymentTransactionPort.sumSuccessfulDepositsForBooking(testBooking.getRetreatBookingId());

        paymentTransactionPort.createDepositTransaction(CreateDepositTransactionCommand.successful(
                testBooking.getRetreatBookingId(), "CASH", ref1, new BigDecimal("150.00"), LocalDateTime.now(ZoneOffset.UTC)));
        paymentTransactionPort.createDepositTransaction(CreateDepositTransactionCommand.successful(
                testBooking.getRetreatBookingId(), "CASH", ref2, new BigDecimal("250.00"), LocalDateTime.now(ZoneOffset.UTC)));

        BigDecimal afterSum = paymentTransactionPort.sumSuccessfulDepositsForBooking(testBooking.getRetreatBookingId());

        assertEquals(0, beforeSum.add(new BigDecimal("400.00")).compareTo(afterSum));
    }
}

