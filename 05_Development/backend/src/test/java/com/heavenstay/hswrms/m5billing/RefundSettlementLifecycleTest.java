package com.heavenstay.hswrms.m5billing;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m5billing.dto.*;
import com.heavenstay.hswrms.m5billing.entity.*;
import com.heavenstay.hswrms.m5billing.repository.*;
import com.heavenstay.hswrms.m5billing.service.AdjustmentService;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class RefundSettlementLifecycleTest {

    @Autowired
    private AdjustmentService adjustmentService;

    @Autowired
    private FolioBillingService folioBillingService;

    @Autowired
    private FolioRepository folioRepository;

    @Autowired
    private FolioItemRepository folioItemRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private CreditNoteRepository creditNoteRepository;

    @Autowired
    private RetreatBookingRepository bookingRepository;

    @Autowired
    private RetreatPackageRepository packageRepository;

    @Autowired
    private PhysicalVillaRepository villaRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    private User managerUser;
    private User receptionistUser;
    private RetreatBooking booking;
    private FolioEntity folio;
    private FolioItemEntity fnbItem;
    private InvoiceEntity paidInvoice;
    private InvoiceEntity issuedInvoice;

    @BeforeEach
    public void setUp() {
        long ts = System.currentTimeMillis();

        managerUser = new User();
        managerUser.setEmail("alice.manager." + ts + "@heavenstay.com");
        managerUser.setPasswordHash("hashed_pw");
        managerUser.setFullName("Manager Alice");
        managerUser.setAccountStatus("ACTIVE");
        managerUser = userRepository.save(managerUser);

        receptionistUser = new User();
        receptionistUser.setEmail("bob.staff." + ts + "@heavenstay.com");
        receptionistUser.setPasswordHash("hashed_pw");
        receptionistUser.setFullName("Staff Bob");
        receptionistUser.setAccountStatus("ACTIVE");
        receptionistUser = userRepository.save(receptionistUser);

        User guestUser = new User();
        guestUser.setEmail("guest.charlie." + ts + "@heavenstay.com");
        guestUser.setPasswordHash("hashed_pw");
        guestUser.setFullName("Guest Charlie");
        guestUser.setAccountStatus("ACTIVE");
        guestUser = userRepository.save(guestUser);

        CustomerProfile profile = new CustomerProfile();
        profile.setUser(guestUser);
        profile = customerProfileRepository.save(profile);

        VillaCategory cat = new VillaCategory();
        cat.setCategoryName("Wellness Suite " + ts);
        cat.setMaxOccupancy(2);
        cat.setPriceModifier(BigDecimal.ZERO);
        cat.setCategoryStatus("ACTIVE");
        cat.setInventoryCount(5);
        cat.setBedroomCount(1);
        cat = villaCategoryRepository.save(cat);

        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaNumber("Villa #SETTLE-" + (ts % 1000));
        villa.setVillaCategory(cat);
        villa.setVillaStatus("AVAILABLE");
        villa = villaRepository.save(villa);

        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageCode("PKG-SETTLE-" + ts);
        pkg.setPackageName("Detox & Rejuvenate");
        pkg.setDurationNights(3);
        pkg.setBasePrice(BigDecimal.valueOf(1000));
        pkg.setPackageStatus("ACTIVE");
        pkg = packageRepository.save(pkg);

        booking = new RetreatBooking();
        booking.setCustomerProfileId(profile.getCustomerProfileId());
        booking.setRetreatPackage(pkg);
        booking.setRequestedVillaCategory(cat);
        booking.setAssignedVilla(villa);
        booking.setCheckInDate(LocalDate.now());
        booking.setCheckOutDate(LocalDate.now().plusDays(3));
        booking.setTotalEstimatedAmount(BigDecimal.valueOf(1000));
        booking.setDepositAmount(BigDecimal.valueOf(200));
        booking.setBookingStatus("CONFIRMED");
        booking = bookingRepository.save(booking);

        folio = new FolioEntity(booking);
        folio.setFolioStatus("OPEN");
        folio = folioRepository.save(folio);

        fnbItem = new FolioItemEntity();
        fnbItem.setFolio(folio);
        fnbItem.setChargeCategory("FNB");
        fnbItem.setDescription("Organic Smoothie Bowl");
        fnbItem.setAmount(new BigDecimal("100.00"));
        fnbItem.setSourceMealOrderId(555L);
        fnbItem = folioItemRepository.save(fnbItem);
    }

    private InvoiceEntity createInvoice(String status, BigDecimal totalAmount) {
        InvoiceEntity inv = new InvoiceEntity(
                folio,
                "INV-" + System.currentTimeMillis() + "-" + status,
                totalAmount,
                new BigDecimal("8.00"),
                totalAmount.add(new BigDecimal("8.00")),
                status
        );
        return invoiceRepository.save(inv);
    }

    @Test
    @DisplayName("WP-1B: Paid invoice credit note records PENDING_REFUND and refundAmount = finalCreditAmount")
    public void testPaidInvoiceCreatesCreditNoteWithPendingRefund() {
        paidInvoice = createInvoice("PAID", new BigDecimal("100.00"));
        PaymentTransactionEntity payment = new PaymentTransactionEntity(
                null, paidInvoice, "FINAL", "VNPAY", "TXN-PAID-" + System.currentTimeMillis(),
                paidInvoice.getFinalAmount(), "SUCCESSFUL"
        );
        paymentTransactionRepository.save(payment);

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(fnbItem.getFolioItemId(), "Guest allergy complaint", new BigDecimal("100.00"));
        AdjustmentResponseDTO submitted = adjustmentService.submitAdjustmentRequest(req, receptionistUser.getUserId().longValue());

        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(
                submitted.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null),
                managerUser.getUserId().longValue(),
                List.of("ROLE_MANAGER")
        );

        assertNotNull(approved.getCreditNoteId());
        assertEquals("PENDING_REFUND", approved.getCreditNoteStatus());
        assertEquals(new BigDecimal("108.00"), approved.getRefundAmount());

        CreditNoteEntity cn = creditNoteRepository.findById(approved.getCreditNoteId()).orElseThrow();
        assertEquals("PENDING_REFUND", cn.getStatus());
        assertEquals(new BigDecimal("108.00"), cn.getRefundAmount());
        assertNull(cn.getSettledAt());

        // Verify pending refund total is exposed on invoice
        InvoiceResponseDTO invDto = folioBillingService.getInvoiceById(paidInvoice.getInvoiceId());
        assertEquals(new BigDecimal("108.00"), invDto.pendingRefundTotal());
    }

    @Test
    @DisplayName("WP-1B: Manager can confirm refund settlement, transitioning status to REFUNDED and clearing pendingRefundTotal")
    public void testAuthorizedSettlementTransitionsToRefunded() {
        paidInvoice = createInvoice("PAID", new BigDecimal("100.00"));
        PaymentTransactionEntity payment = new PaymentTransactionEntity(
                null, paidInvoice, "FINAL", "VNPAY", "TXN-PAID-" + System.currentTimeMillis(),
                paidInvoice.getFinalAmount(), "SUCCESSFUL"
        );
        paymentTransactionRepository.save(payment);

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(fnbItem.getFolioItemId(), "Kitchen quality defect", new BigDecimal("100.00"));
        AdjustmentResponseDTO submitted = adjustmentService.submitAdjustmentRequest(req, receptionistUser.getUserId().longValue());
        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(
                submitted.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null),
                managerUser.getUserId().longValue(),
                List.of("ROLE_MANAGER")
        );

        SettleRefundDTO settleDTO = new SettleRefundDTO(new BigDecimal("108.00"), "VNPAY-REFUND-998811", "Customer cash refund issued at front desk");
        CreditNoteResponseDTO settled = adjustmentService.confirmRefundSettlement(
                approved.getCreditNoteId(),
                settleDTO,
                managerUser.getUserId().longValue(),
                List.of("ROLE_MANAGER")
        );

        assertEquals("REFUNDED", settled.getStatus());
        assertEquals(new BigDecimal("108.00"), settled.getRefundAmount());
        assertNotNull(settled.getSettledAt());
        assertEquals(managerUser.getUserId().longValue(), settled.getSettledByUserId());
        assertEquals("VNPAY-REFUND-998811", settled.getRefundTransactionRef());
        assertEquals("Customer cash refund issued at front desk", settled.getSettlementNotes());

        // Check DB persistence
        CreditNoteEntity cn = creditNoteRepository.findById(approved.getCreditNoteId()).orElseThrow();
        assertEquals("REFUNDED", cn.getStatus());
        assertNotNull(cn.getSettledAt());
        assertEquals("VNPAY-REFUND-998811", cn.getRefundTransactionRef());

        // Check invoice pendingRefundTotal is cleared to 0
        InvoiceResponseDTO invDto = folioBillingService.getInvoiceById(paidInvoice.getInvoiceId());
        assertEquals(BigDecimal.ZERO, invDto.pendingRefundTotal());
    }

    @Test
    @DisplayName("WP-1B: Non-manager / unauthorized roles cannot settle refunds")
    public void testUnauthorizedSettlementRejected() {
        paidInvoice = createInvoice("PAID", new BigDecimal("100.00"));
        PaymentTransactionEntity payment = new PaymentTransactionEntity(
                null, paidInvoice, "FINAL", "VNPAY", "TXN-PAID-" + System.currentTimeMillis(),
                paidInvoice.getFinalAmount(), "SUCCESSFUL"
        );
        paymentTransactionRepository.save(payment);

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(fnbItem.getFolioItemId(), "Disputed charge", new BigDecimal("100.00"));
        AdjustmentResponseDTO submitted = adjustmentService.submitAdjustmentRequest(req, receptionistUser.getUserId().longValue());
        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(
                submitted.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null),
                managerUser.getUserId().longValue(),
                List.of("ROLE_MANAGER")
        );

        SettleRefundDTO settleDTO = new SettleRefundDTO(new BigDecimal("108.00"), "REF-12345", "Settlement attempt by staff");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.confirmRefundSettlement(
                        approved.getCreditNoteId(),
                        settleDTO,
                        receptionistUser.getUserId().longValue(),
                        List.of("ROLE_RECEPTIONIST", "ROLE_STAFF")
                )
        );

        assertEquals("UNAUTHORIZED_SETTLER", ex.getErrorCode());
    }

    @Test
    @DisplayName("WP-1B: Repeated refund settlement is idempotent and returns existing settled entity")
    public void testIdempotentSettlementConfirmation() {
        paidInvoice = createInvoice("PAID", new BigDecimal("100.00"));
        PaymentTransactionEntity payment = new PaymentTransactionEntity(
                null, paidInvoice, "FINAL", "VNPAY", "TXN-PAID-" + System.currentTimeMillis(),
                paidInvoice.getFinalAmount(), "SUCCESSFUL"
        );
        paymentTransactionRepository.save(payment);

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(fnbItem.getFolioItemId(), "Spill incident", new BigDecimal("100.00"));
        AdjustmentResponseDTO submitted = adjustmentService.submitAdjustmentRequest(req, receptionistUser.getUserId().longValue());
        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(
                submitted.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null),
                managerUser.getUserId().longValue(),
                List.of("ROLE_MANAGER")
        );

        SettleRefundDTO settleDTO = new SettleRefundDTO(new BigDecimal("108.00"), "TX-REPEAT-001", "Initial cash payout");
        CreditNoteResponseDTO firstSettled = adjustmentService.confirmRefundSettlement(
                approved.getCreditNoteId(), settleDTO, managerUser.getUserId().longValue(), List.of("ROLE_MANAGER")
        );
        assertEquals("REFUNDED", firstSettled.getStatus());

        // Repeated settlement attempt
        CreditNoteResponseDTO secondSettled = adjustmentService.confirmRefundSettlement(
                approved.getCreditNoteId(), settleDTO, managerUser.getUserId().longValue(), List.of("ROLE_MANAGER")
        );
        assertEquals("REFUNDED", secondSettled.getStatus());
        assertEquals(firstSettled.getCreditNoteNumber(), secondSettled.getCreditNoteNumber());
        assertEquals("TX-REPEAT-001", secondSettled.getRefundTransactionRef());
    }

    @Test
    @DisplayName("WP-1B: Settlement amount cannot exceed credit note final credit amount")
    public void testSettlementAmountCannotExceedCreditAmount() {
        paidInvoice = createInvoice("PAID", new BigDecimal("100.00"));
        PaymentTransactionEntity payment = new PaymentTransactionEntity(
                null, paidInvoice, "FINAL", "VNPAY", "TXN-PAID-" + System.currentTimeMillis(),
                paidInvoice.getFinalAmount(), "SUCCESSFUL"
        );
        paymentTransactionRepository.save(payment);

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(fnbItem.getFolioItemId(), "Refund claim", new BigDecimal("100.00"));
        AdjustmentResponseDTO submitted = adjustmentService.submitAdjustmentRequest(req, receptionistUser.getUserId().longValue());
        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(
                submitted.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null),
                managerUser.getUserId().longValue(),
                List.of("ROLE_MANAGER")
        );

        // Final credit amount is 108.00; attempt to settle 150.00
        SettleRefundDTO excessiveDTO = new SettleRefundDTO(new BigDecimal("150.00"), "TX-OVERPAY", "Attempt to overpay");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.confirmRefundSettlement(
                        approved.getCreditNoteId(), excessiveDTO, managerUser.getUserId().longValue(), List.of("ROLE_MANAGER")
                )
        );

        assertEquals("EXCEEDS_CREDIT_AMOUNT", ex.getErrorCode());
    }

    @Test
    @DisplayName("WP-1B: Settlement amount cannot be less than credit note final credit amount (underpayment rejected)")
    public void testUnderpaymentSettlementRejected() {
        paidInvoice = createInvoice("PAID", new BigDecimal("100.00"));
        PaymentTransactionEntity payment = new PaymentTransactionEntity(
                null, paidInvoice, "FINAL", "VNPAY", "TXN-PAID-" + System.currentTimeMillis(),
                paidInvoice.getFinalAmount(), "SUCCESSFUL"
        );
        paymentTransactionRepository.save(payment);

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(fnbItem.getFolioItemId(), "Refund claim", new BigDecimal("100.00"));
        AdjustmentResponseDTO submitted = adjustmentService.submitAdjustmentRequest(req, receptionistUser.getUserId().longValue());
        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(
                submitted.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null),
                managerUser.getUserId().longValue(),
                List.of("ROLE_MANAGER")
        );

        // Final credit amount is 108.00; attempt to underpay with 50.00
        SettleRefundDTO underpayDTO = new SettleRefundDTO(new BigDecimal("50.00"), "TX-UNDERPAY", "Attempt to underpay");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.confirmRefundSettlement(
                        approved.getCreditNoteId(), underpayDTO, managerUser.getUserId().longValue(), List.of("ROLE_MANAGER")
                )
        );

        assertEquals("UNDERPAYMENT_REJECTED", ex.getErrorCode());
    }

    @Test
    @DisplayName("WP-1B: Repeated settlement with conflicting transaction reference is rejected")
    public void testConflictingTransactionReferenceOnRepeatedSettlementRejected() {
        paidInvoice = createInvoice("PAID", new BigDecimal("100.00"));
        PaymentTransactionEntity payment = new PaymentTransactionEntity(
                null, paidInvoice, "FINAL", "VNPAY", "TXN-PAID-" + System.currentTimeMillis(),
                paidInvoice.getFinalAmount(), "SUCCESSFUL"
        );
        paymentTransactionRepository.save(payment);

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(fnbItem.getFolioItemId(), "Duplicate claim", new BigDecimal("100.00"));
        AdjustmentResponseDTO submitted = adjustmentService.submitAdjustmentRequest(req, receptionistUser.getUserId().longValue());
        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(
                submitted.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null),
                managerUser.getUserId().longValue(),
                List.of("ROLE_MANAGER")
        );

        SettleRefundDTO originalDTO = new SettleRefundDTO(new BigDecimal("108.00"), "TX-ORIGINAL-001", "Initial settlement");
        CreditNoteResponseDTO originalSettled = adjustmentService.confirmRefundSettlement(
                approved.getCreditNoteId(), originalDTO, managerUser.getUserId().longValue(), List.of("ROLE_MANAGER")
        );
        assertEquals("REFUNDED", originalSettled.getStatus());

        // Attempt second settlement with different reference
        SettleRefundDTO conflictingDTO = new SettleRefundDTO(new BigDecimal("108.00"), "TX-CONFLICTING-999", "Conflicting reference");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.confirmRefundSettlement(
                        approved.getCreditNoteId(), conflictingDTO, managerUser.getUserId().longValue(), List.of("ROLE_MANAGER")
                )
        );

        assertEquals("SETTLEMENT_ALREADY_COMPLETED", ex.getErrorCode());
    }

    @Test
    @DisplayName("WP-1B: Credit Note for unpaid invoice (CREDIT_APPLIED) cannot be refund-settled")
    public void testUnpaidInvoiceCreditNoteCannotBeRefundSettled() {
        issuedInvoice = createInvoice("ISSUED", new BigDecimal("100.00"));

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(fnbItem.getFolioItemId(), "Courtesy discount", new BigDecimal("50.00"));
        AdjustmentResponseDTO submitted = adjustmentService.submitAdjustmentRequest(req, receptionistUser.getUserId().longValue());
        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(
                submitted.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null),
                managerUser.getUserId().longValue(),
                List.of("ROLE_MANAGER")
        );

        assertEquals("CREDIT_APPLIED", approved.getCreditNoteStatus());

        SettleRefundDTO settleDTO = new SettleRefundDTO(new BigDecimal("54.00"), "TX-INVALID", "Illegal refund attempt on unpaid invoice");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.confirmRefundSettlement(
                        approved.getCreditNoteId(), settleDTO, managerUser.getUserId().longValue(), List.of("ROLE_MANAGER")
                )
        );

        assertEquals("INVALID_SETTLEMENT_STATE", ex.getErrorCode());
    }
}
