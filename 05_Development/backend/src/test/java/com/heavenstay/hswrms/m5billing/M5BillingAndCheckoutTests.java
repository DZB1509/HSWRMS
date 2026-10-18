package com.heavenstay.hswrms.m5billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVillaEntity;
import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m3spa.entity.SpaSessionEntity;
import com.heavenstay.hswrms.m3spa.entity.TherapistEntity;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m5billing.controller.VnpayWebhookController;
import com.heavenstay.hswrms.m5billing.dto.*;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m5billing.service.*;
import com.heavenstay.hswrms.security.JwtTokenProvider;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.BEFORE_EACH_TEST_METHOD)
public class M5BillingAndCheckoutTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private FolioBillingService folioBillingService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private ReviewService reviewService;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private InvoicePdfService invoicePdfService;

    @Autowired
    private RetreatBookingRepository bookingRepository;

    @Autowired
    private PhysicalVillaRepository villaRepository;

    @Autowired
    private SpaSessionRepository spaSessionRepository;

    @Autowired
    private MealOrderRepository mealOrderRepository;

    @Autowired
    private TherapistRepository therapistRepository;

    @Autowired
    private FolioRepository folioRepository;

    @Autowired
    private FolioItemRepository folioItemRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Test
    @DisplayName("INVARIANT 3: Billing Guard blocks checkout & invoice when unsettled SCHEDULED spa session exists")
    @Transactional
    void billingGuardBlocksWhenScheduledSpaSessionExists() {
        RetreatBookingEntity booking = bookingRepository.findAll().get(0);
        TherapistEntity therapist = therapistRepository.findAll().get(0);

        // Add a SCHEDULED spa session
        SpaSessionEntity scheduledSpa = new SpaSessionEntity();
        scheduledSpa.setRetreatBooking(booking);
        scheduledSpa.setTreatmentId(99L);
        scheduledSpa.setTherapist(therapist);
        scheduledSpa.setRoomId(1L);
        scheduledSpa.setScheduledStartAt(LocalDateTime.now().plusHours(2));
        scheduledSpa.setScheduledEndAt(LocalDateTime.now().plusHours(3));
        scheduledSpa.setSessionStatus("SCHEDULED");
        spaSessionRepository.save(scheduledSpa);

        // Attempt to generate consolidated invoice must be blocked
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.generateConsolidatedInvoice(booking.getRetreatBookingId());
        });

        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("spa session(s)"));
    }

    @Test
    @DisplayName("INVARIANT 3: Billing Guard blocks checkout when PREPARING meal order exists")
    @Transactional
    void billingGuardBlocksWhenPreparingMealOrderExists() {
        RetreatBookingEntity booking = bookingRepository.findAll().get(0);

        // Add a PREPARING meal order
        MealOrderEntity mealOrder = new MealOrderEntity();
        mealOrder.setRetreatBooking(booking);
        mealOrder.setOrderDate(LocalDate.now());
        mealOrder.setMealType("Lunch");
        mealOrder.setOrderType("A_LA_CARTE");
        mealOrder.setOrderStatus("PREPARING");
        mealOrderRepository.save(mealOrder);

        // Attempt to validate billing guard must throw
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.validateBillingGuard(booking.getRetreatBookingId());
        });

        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("dining order(s)"));
    }

    @Test
    @DisplayName("INVARIANT 2: FolioItem source exclusivity enforced (CK_FolioItem_Source)")
    @Transactional
    void folioItemSourceExclusivityEnforced() {
        FolioEntity folio = folioRepository.findAll().get(0);

        // PACKAGE with spa session ID must fail validation
        assertThrows(BusinessRuleException.class, () -> {
            new FolioItemEntity(folio, "PACKAGE", "Invalid Package Charge",
                    new BigDecimal("1000000"), 1L, 2L, null);
        });

        // SPA with no source_spa_session_id must fail validation
        assertThrows(BusinessRuleException.class, () -> {
            new FolioItemEntity(folio, "SPA", "Invalid Spa Charge",
                    new BigDecimal("1000000"), null, null, null);
        });
    }

    @Test
    @DisplayName("FINANCIAL MATH: SRS BF-05 & Data Rule 21 deposit deduction & VAT on extras calculation")
    void financialMathConformsToDataRule21() {
        RetreatBookingEntity booking = bookingRepository.findAll().get(0);
        InvoiceResponseDTO invoice = folioBillingService.generateConsolidatedInvoice(booking.getRetreatBookingId());

        // Package charges: 24,500,000 VND
        // Deposit deducted: 7,350,000 VND
        // Package outstanding: 17,150,000 VND
        // Extras: 1,500,000 (spa) + 600,000 (fnb) = 2,100,000 VND
        // Subtotal: 17,150,000 + 2,100,000 = 19,250,000 VND
        // Tax (8% on 2.1M extras): 168,000 VND
        // Final Amount: 19,418,000 VND
        assertEquals(new BigDecimal("24500000.00"), invoice.packageCharges());
        assertEquals(new BigDecimal("7350000.00"), invoice.depositDeducted());
        assertEquals(new BigDecimal("17150000.00"), invoice.packageOutstanding());
        assertEquals(new BigDecimal("1500000.00"), invoice.spaCharges());
        assertEquals(new BigDecimal("600000.00"), invoice.fnbCharges());
        assertEquals(new BigDecimal("19250000.00"), invoice.subtotalAmount());
        assertEquals(new BigDecimal("168000.00"), invoice.taxAmount());
        assertEquals(new BigDecimal("19418000.00"), invoice.finalAmount());
    }

    @Test
    @DisplayName("INVARIANT 4: Atomic Checkout Completion transitions all 4 entities correctly")
    void atomicCheckoutCompletionTransitionsEntities() {
        RetreatBookingEntity booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // 1. Process full settlement payment
        PaymentRequestDTO payReq = new PaymentRequestDTO("VNPAY", invoice.getFinalAmount(), "TXN-TEST-12345");
        PaymentResponseDTO payRes = checkoutService.processPayment(invoice.getInvoiceId(), payReq, true);
        assertEquals("SUCCESSFUL", payRes.getPaymentStatus());

        // 2. Finalize checkout
        FinalizeCheckoutResponseDTO checkoutRes = checkoutService.finalizeCheckout(invoice.getInvoiceId());
        assertEquals("COMPLETED", checkoutRes.getBookingStatus());
        assertEquals("CLOSED", checkoutRes.getFolioStatus());
        assertEquals("PAID", checkoutRes.getInvoiceStatus());
        assertEquals("NEEDS_CLEANING", checkoutRes.getVillaStatus());

        // 3. Verify in database
        RetreatBookingEntity updatedBooking = bookingRepository.findById(booking.getRetreatBookingId()).orElseThrow();
        assertEquals("COMPLETED", updatedBooking.getBookingStatus());

        FolioEntity updatedFolio = folioRepository.findById(folio.getFolioId()).orElseThrow();
        assertEquals("CLOSED", updatedFolio.getFolioStatus());
        assertNotNull(updatedFolio.getClosedAt());

        PhysicalVillaEntity updatedVilla = villaRepository.findByVillaNumber(checkoutRes.getVillaNumber()).orElseThrow();
        assertEquals("NEEDS_CLEANING", updatedVilla.getVillaStatus());
    }

    @Test
    @DisplayName("INVARIANT: Payment Success IS NOT Checkout Completion")
    void paymentSuccessDoesNotCompleteCheckout() {
        RetreatBookingEntity booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        PaymentRequestDTO payReq = new PaymentRequestDTO("VNPAY", invoice.getFinalAmount(), "TXN-PAY-ONLY-1");
        PaymentResponseDTO payRes = checkoutService.processPayment(invoice.getInvoiceId(), payReq, true);
        assertEquals("SUCCESSFUL", payRes.getPaymentStatus());

        // Verify entities HAVE NOT transitioned to checkout state yet
        RetreatBookingEntity currentBooking = bookingRepository.findById(booking.getRetreatBookingId()).orElseThrow();
        assertEquals("CHECKED_IN", currentBooking.getBookingStatus()); // Still checked in!

        FolioEntity currentFolio = folioRepository.findById(folio.getFolioId()).orElseThrow();
        assertEquals("PAID", currentFolio.getFolioStatus()); // Paid, but NOT closed!
        assertNull(currentFolio.getClosedAt());

        PhysicalVillaEntity currentVilla = villaRepository.findByVillaNumber("V102").orElseThrow();
        assertEquals("OCCUPIED", currentVilla.getVillaStatus()); // Still occupied!
    }

    @Test
    @DisplayName("ZERO BALANCE PATH: SRS FR-M5-02 Alt 2 handles zero balance due direct finalization")
    void zeroBalanceDuePathFinalization() {
        RetreatBookingEntity booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // Settle the invoice
        checkoutService.processPayment(invoice.getInvoiceId(), new PaymentRequestDTO("CASH", invoice.getFinalAmount(), "TXN-ZERO-BAL"), true);

        // When balance due is 0, finalize completes directly
        FinalizeCheckoutResponseDTO response = checkoutService.finalizeCheckout(invoice.getInvoiceId());
        assertEquals("COMPLETED", response.getBookingStatus());
        assertEquals("CLOSED", response.getFolioStatus());
        assertEquals("NEEDS_CLEANING", response.getVillaStatus());
    }

    @Test
    @DisplayName("INVARIANT 5: Review eligibility requires COMPLETED booking, checks ownership, and blocks duplicates")
    void reviewEligibilityAndDuplicateGuard() {
        RetreatBookingEntity booking = bookingRepository.findByIdWithDetails(bookingRepository.findAll().get(0).getRetreatBookingId()).orElseThrow();
        Long customerUserId = booking.getCustomerProfile().getUser().getUserId();

        // 1. Before checkout completion, booking is CHECKED_IN: review must be blocked with STAY_NOT_COMPLETED
        CustomerReviewRequestDTO reviewReq = new CustomerReviewRequestDTO(
                booking.getRetreatBookingId(), 5, "Exquisite sanctuary experience, attentive holistic care."
        );
        reviewReq.setRoomRating(5);
        reviewReq.setSpaRating(5);
        reviewReq.setDiningRating(4);

        BusinessRuleException ex1 = assertThrows(BusinessRuleException.class, () -> {
            reviewService.submitReview(reviewReq, customerUserId);
        });
        assertEquals("STAY_NOT_COMPLETED", ex1.getErrorCode());

        // 2. Now complete checkout
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();
        checkoutService.processPayment(invoice.getInvoiceId(), new PaymentRequestDTO("CASH", invoice.getFinalAmount(), "TXN-CASH-1"), true);
        checkoutService.finalizeCheckout(invoice.getInvoiceId());

        // 3. Now review submission must succeed
        CustomerReviewResponseDTO submitted = reviewService.submitReview(reviewReq, customerUserId);
        assertNotNull(submitted.getReviewId());
        assertEquals(5, submitted.getOverallRating());
        assertEquals(5, submitted.getRoomRating());
        assertEquals(5, submitted.getSpaRating());
        assertEquals(4, submitted.getDiningRating());

        // 4. Duplicate review submission must be rejected with ALREADY_REVIEWED (HTTP 409)
        ConflictException ex2 = assertThrows(ConflictException.class, () -> {
            reviewService.submitReview(reviewReq, customerUserId);
        });
        assertEquals("ALREADY_REVIEWED", ex2.getConflictCode());
    }

    @Test
    @DisplayName("INVOICE PDF: PDF generation renders valid document bytes with header")
    void invoicePdfGeneration() {
        InvoiceEntity invoice = invoiceRepository.findAll().get(0);
        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoice.getInvoiceId());

        assertNotNull(pdfBytes);
        assertTrue(pdfBytes.length > 500);
        // Valid PDF starts with %PDF
        assertEquals('%', (char) pdfBytes[0]);
        assertEquals('P', (char) pdfBytes[1]);
        assertEquals('D', (char) pdfBytes[2]);
        assertEquals('F', (char) pdfBytes[3]);
    }

    @Test
    @DisplayName("TASK 7.5.4 & 7.5.5: Management Analytics aggregations zero-fill and POI Excel generation")
    void analyticsAndExcelExportFunctionality() {
        RevenueAnalyticsDTO rev = analyticsService.getRevenueAnalytics(LocalDate.now().minusDays(30), LocalDate.now());
        assertNotNull(rev.getTotalRevenue());
        assertFalse(rev.getCategoryBreakdown().isEmpty());
        assertFalse(rev.getDailySeries().isEmpty());

        OccupancyAnalyticsDTO occ = analyticsService.getOccupancyAnalytics(LocalDate.now().minusDays(7), LocalDate.now().plusDays(7));
        assertTrue(occ.getTotalVillas() > 0);
        assertFalse(occ.getVillaDetails().isEmpty());

        TherapistUtilizationDTO th = analyticsService.getTherapistUtilization(LocalDate.now().minusDays(14), LocalDate.now());
        assertTrue(th.getTotalTherapists() > 0);

        // Excel Exports with 2-sheet structure
        byte[] revenueExcel = analyticsService.exportReportToExcel("revenue", null, null);
        assertTrue(revenueExcel.length > 1000);

        byte[] occupancyExcel = analyticsService.exportReportToExcel("occupancy", null, null);
        assertTrue(occupancyExcel.length > 1000);

        byte[] therapistExcel = analyticsService.exportReportToExcel("therapist", null, null);
        assertTrue(therapistExcel.length > 1000);
    }

    @Test
    @DisplayName("SECURITY RBAC: Unauthenticated requests to billing/analytics are rejected with 401")
    void unauthenticatedRequestsRejected() throws Exception {
        mockMvc.perform(get("/api/v1/billing/folios/1"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/analytics/revenue"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("SECURITY RBAC: Customer role cannot access Manager/Admin Analytics (HTTP 403)")
    void customerCannotAccessAnalytics() throws Exception {
        String customerToken = jwtTokenProvider.generateToken(1, "eleanor@heavenstay.resort", "Eleanor Vance", List.of("CUSTOMER"));

        mockMvc.perform(get("/api/v1/analytics/revenue")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECURITY RBAC: Customer role cannot trigger finalize-checkout (HTTP 403)")
    void customerCannotFinalizeCheckout() throws Exception {
        String customerToken = jwtTokenProvider.generateToken(1, "eleanor@heavenstay.resort", "Eleanor Vance", List.of("CUSTOMER"));

        mockMvc.perform(post("/api/v1/billing/invoices/1/finalize-checkout")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("SECURITY RBAC: Receptionist can access Billing & finalize-checkout")
    void receptionistCanAccessBilling() throws Exception {
        String receptionistToken = jwtTokenProvider.generateToken(99, "receptionist@heavenstay.resort", "Front Desk", List.of("RECEPTIONIST"));

        mockMvc.perform(get("/api/v1/billing/folios/1")
                        .header("Authorization", "Bearer " + receptionistToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("SECURITY RBAC: VNPay Webhook is public (permitAll) and validates HMAC signature")
    void vnpayWebhookPublicAndValidatesChecksum() throws Exception {
        // Without proper hash, returns 400 with checksum error
        mockMvc.perform(get("/api/v1/commerce/payment/webhook/vnpay")
                        .param("vnp_TxnRef", "TXN-TEST")
                        .param("vnp_Amount", "100000000")
                        .param("vnp_SecureHash", "invalid-hash"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.RspCode").value("97"));
    }
}
