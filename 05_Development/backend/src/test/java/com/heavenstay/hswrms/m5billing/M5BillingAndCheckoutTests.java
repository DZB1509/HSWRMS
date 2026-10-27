package com.heavenstay.hswrms.m5billing;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.entity.enums.BookingSource;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.repository.SpaTreatmentRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m3spa.repository.TreatmentRoomRepository;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m5billing.controller.VnpayWebhookController;
import com.heavenstay.hswrms.m5billing.dto.*;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=true",
        "app.vnpay.mock-auto-confirm=true",
        "app.vnpay.hash-secret=test-vnpay-secret"
})
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
    private SpaTreatmentRepository spaTreatmentRepository;

    @Autowired
    private TreatmentRoomRepository treatmentRoomRepository;

    @Autowired
    private MealOrderRepository mealOrderRepository;

    @Autowired
    private TherapistRepository therapistRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FolioRepository folioRepository;

    @Autowired
    private FolioItemRepository folioItemRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private com.heavenstay.hswrms.m3spa.port.BillingPort billingPort;

    @Test
    @DisplayName("INVARIANT 3: Billing Guard blocks checkout & invoice when unsettled SCHEDULED spa session exists")
    @Transactional
    void billingGuardBlocksWhenScheduledSpaSessionExists() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        Therapist therapist = therapistRepository.findAll().get(0);
        SpaTreatment treatment = spaTreatmentRepository.findAll().get(0);
        TreatmentRoom room = treatmentRoomRepository.findAll().get(0);

        // Add a SCHEDULED spa session
        SpaSession scheduledSpa = new SpaSession();
        scheduledSpa.setRetreatBookingId(booking.getRetreatBookingId());
        scheduledSpa.setTreatment(treatment);
        scheduledSpa.setTherapist(therapist);
        scheduledSpa.setTreatmentRoom(room);
        scheduledSpa.setScheduledStartAt(LocalDateTime.now().plusHours(2));
        scheduledSpa.setScheduledEndAt(LocalDateTime.now().plusHours(3));
        scheduledSpa.setSessionStatus(SpaSessionStatus.SCHEDULED);
        scheduledSpa.setBookingSource(BookingSource.CUSTOMER);
        scheduledSpa.setConfirmationStatus(SpaConfirmationStatus.CONFIRMED);
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
        RetreatBooking booking = bookingRepository.findAll().get(0);

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
    @DisplayName("INVARIANT 3: Billing Guard blocks checkout & invoice when READY meal order exists (Phase 5.8.3.25)")
    @Transactional
    void billingGuardBlocksWhenReadyMealOrderExists() {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        // Add a READY meal order
        MealOrderEntity mealOrder = new MealOrderEntity();
        mealOrder.setRetreatBooking(booking);
        mealOrder.setOrderDate(LocalDate.now());
        mealOrder.setMealType("Dinner");
        mealOrder.setOrderType("A_LA_CARTE");
        mealOrder.setOrderStatus("READY");
        mealOrderRepository.save(mealOrder);

        // 1. validateBillingGuard directly throws UNSETTLED_SERVICE_ORDERS
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.validateBillingGuard(booking.getRetreatBookingId());
        });
        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("dining order(s) remain PENDING, PREPARING, or READY"));

        // 2. generateConsolidatedInvoice is blocked by the guard
        BusinessRuleException invEx = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.generateConsolidatedInvoice(booking.getRetreatBookingId());
        });
        assertEquals("UNSETTLED_SERVICE_ORDERS", invEx.getErrorCode());

        // 3. getFolioByBookingId flags hasUnsettledOrders and canGenerateInvoice=false
        FolioResponseDTO folioDto = folioBillingService.getFolioByBookingId(booking.getRetreatBookingId());
        assertTrue(folioDto.isHasUnsettledOrders());
        assertFalse(folioDto.isCanGenerateInvoice());
        assertNotNull(folioDto.getUnsettledOrdersWarning());
        assertTrue(folioDto.getUnsettledOrdersWarning().contains("active meal order(s)"));
    }

    @Test
    @DisplayName("INVARIANT 3: Billing Guard blocks checkout when PENDING meal order exists")
    @Transactional
    void billingGuardBlocksWhenPendingMealOrderExists() {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        MealOrderEntity mealOrder = new MealOrderEntity();
        mealOrder.setRetreatBooking(booking);
        mealOrder.setOrderDate(LocalDate.now());
        mealOrder.setMealType("Breakfast");
        mealOrder.setOrderType("DAILY_MEAL");
        mealOrder.setOrderStatus("PENDING");
        mealOrderRepository.save(mealOrder);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.validateBillingGuard(booking.getRetreatBookingId());
        });
        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("dining order(s)"));
    }

    @Test
    @DisplayName("INVARIANT 3: Billing Guard allows checkout when meal orders are DELIVERED or CANCELLED")
    @Transactional
    void billingGuardAllowsWhenMealOrdersDeliveredOrCancelled() {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        MealOrderEntity deliveredOrder = new MealOrderEntity();
        deliveredOrder.setRetreatBooking(booking);
        deliveredOrder.setOrderDate(LocalDate.now());
        deliveredOrder.setMealType("Lunch");
        deliveredOrder.setOrderType("DAILY_MEAL");
        deliveredOrder.setOrderStatus("DELIVERED");
        mealOrderRepository.save(deliveredOrder);

        MealOrderEntity cancelledOrder = new MealOrderEntity();
        cancelledOrder.setRetreatBooking(booking);
        cancelledOrder.setOrderDate(LocalDate.now());
        cancelledOrder.setMealType("Dinner");
        cancelledOrder.setOrderType("A_LA_CARTE");
        cancelledOrder.setOrderStatus("CANCELLED");
        mealOrderRepository.save(cancelledOrder);

        // Guard must not throw for DELIVERED / CANCELLED orders
        assertDoesNotThrow(() -> {
            folioBillingService.validateBillingGuard(booking.getRetreatBookingId());
        });
    }

    @Test
    @DisplayName("CHECKOUT GUARD: processPayment is blocked when a READY meal order exists (Phase 5.8.3.25)")
    @Transactional
    void checkoutServiceBlocksPaymentWhenReadyMealOrderExists() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // Add a READY meal order
        MealOrderEntity mealOrder = new MealOrderEntity();
        mealOrder.setRetreatBooking(booking);
        mealOrder.setOrderDate(LocalDate.now());
        mealOrder.setMealType("Dinner");
        mealOrder.setOrderType("A_LA_CARTE");
        mealOrder.setOrderStatus("READY");
        mealOrderRepository.save(mealOrder);

        PaymentRequestDTO payReq = new PaymentRequestDTO("VNPAY", invoice.getFinalAmount(), "TXN-READY-MEAL-BLOCK");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            checkoutService.processPayment(invoice.getInvoiceId(), payReq, true);
        });
        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("READY"));
    }

    @Test
    @DisplayName("CHECKOUT GUARD: finalizeCheckout is blocked when a READY meal order exists (Phase 5.8.3.25)")
    @Transactional
    void checkoutServiceBlocksFinalizeCheckoutWhenReadyMealOrderExists() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // First process payment to make balance due 0
        PaymentRequestDTO payReq = new PaymentRequestDTO("CASH", invoice.getFinalAmount(), "TXN-PAID-FIRST");
        checkoutService.processPayment(invoice.getInvoiceId(), payReq, true);

        // Now introduce a READY meal order
        MealOrderEntity mealOrder = new MealOrderEntity();
        mealOrder.setRetreatBooking(booking);
        mealOrder.setOrderDate(LocalDate.now());
        mealOrder.setMealType("Dinner");
        mealOrder.setOrderType("A_LA_CARTE");
        mealOrder.setOrderStatus("READY");
        mealOrderRepository.save(mealOrder);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            checkoutService.finalizeCheckout(invoice.getInvoiceId());
        });
        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("READY"));
    }

    // =========================================================================
    // DIRECT INVOICE GENERATION GUARD ENFORCEMENT (Phase 5.8.3.26)
    // =========================================================================

    private RetreatBooking createFreshBookingWithoutInvoice() {
        RetreatBooking existing = bookingRepository.findAll().get(0);
        RetreatBooking fresh = new RetreatBooking();
        fresh.setCustomerProfileId(existing.getCustomerProfileId());
        fresh.setRetreatPackage(existing.getRetreatPackage());
        fresh.setRequestedVillaCategory(existing.getRequestedVillaCategory());
        fresh.setAssignedVilla(existing.getAssignedVilla());
        fresh.setCheckInDate(LocalDate.now().minusDays(2));
        fresh.setCheckOutDate(LocalDate.now().plusDays(1));
        fresh.setBookingStatus("CHECKED_IN");
        fresh.setDepositAmount(BigDecimal.ZERO);
        fresh.setTotalEstimatedAmount(existing.getTotalEstimatedAmount());
        return bookingRepository.save(fresh);
    }

    @Test
    @DisplayName("INVOICE GUARD: Service direct invoice generation is BLOCKED by READY meal order and DOES NOT persist invoice")
    @Transactional
    void directInvoiceGenerationServiceRejectsReadyMealOrderWithoutPersisting() {
        RetreatBooking freshBooking = createFreshBookingWithoutInvoice();

        // Add a READY meal order
        MealOrderEntity readyOrder = new MealOrderEntity();
        readyOrder.setRetreatBooking(freshBooking);
        readyOrder.setOrderDate(LocalDate.now());
        readyOrder.setMealType("Dinner");
        readyOrder.setOrderType("A_LA_CARTE");
        readyOrder.setOrderStatus("READY");
        mealOrderRepository.save(readyOrder);

        long invoiceCountBefore = invoiceRepository.count();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.generateConsolidatedInvoice(freshBooking.getRetreatBookingId());
        });

        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("dining order(s) remain PENDING, PREPARING, or READY"));

        // Verify NO invoice was persisted as a side effect
        assertEquals(invoiceCountBefore, invoiceRepository.count(),
                "Direct invoice generation rejection must NOT persist an invoice");
        folioRepository.findByRetreatBookingId(freshBooking.getRetreatBookingId()).ifPresent(folio -> {
            assertTrue(invoiceRepository.findByFolioId(folio.getFolioId()).isEmpty(),
                    "Folio must NOT have an associated invoice persisted when guard fails");
        });
    }

    @Test
    @DisplayName("INVOICE GUARD: Service direct invoice generation is BLOCKED by PENDING and PREPARING meal orders without persisting")
    @Transactional
    void directInvoiceGenerationServiceRejectsPendingAndPreparingMealOrdersWithoutPersisting() {
        RetreatBooking freshBooking = createFreshBookingWithoutInvoice();

        // 1. PENDING meal order
        MealOrderEntity pendingOrder = new MealOrderEntity();
        pendingOrder.setRetreatBooking(freshBooking);
        pendingOrder.setOrderDate(LocalDate.now());
        pendingOrder.setMealType("Breakfast");
        pendingOrder.setOrderType("DAILY_MEAL");
        pendingOrder.setOrderStatus("PENDING");
        mealOrderRepository.save(pendingOrder);

        long invoiceCountBefore = invoiceRepository.count();

        BusinessRuleException exPending = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.generateConsolidatedInvoice(freshBooking.getRetreatBookingId());
        });
        assertEquals("UNSETTLED_SERVICE_ORDERS", exPending.getErrorCode());
        assertEquals(invoiceCountBefore, invoiceRepository.count(),
                "PENDING order rejection must NOT persist an invoice");

        // 2. Transition to PREPARING
        pendingOrder.setOrderStatus("PREPARING");
        mealOrderRepository.save(pendingOrder);

        BusinessRuleException exPreparing = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.generateConsolidatedInvoice(freshBooking.getRetreatBookingId());
        });
        assertEquals("UNSETTLED_SERVICE_ORDERS", exPreparing.getErrorCode());
        assertEquals(invoiceCountBefore, invoiceRepository.count(),
                "PREPARING order rejection must NOT persist an invoice");
    }

    @Test
    @DisplayName("INVOICE GUARD: Service direct invoice generation SUCCEEDS and persists invoice when orders are DELIVERED or CANCELLED")
    @Transactional
    void directInvoiceGenerationServiceSucceedsWhenNoUnsettledOrdersAndPersistsInvoice() {
        RetreatBooking freshBooking = createFreshBookingWithoutInvoice();

        MealOrderEntity deliveredOrder = new MealOrderEntity();
        deliveredOrder.setRetreatBooking(freshBooking);
        deliveredOrder.setOrderDate(LocalDate.now());
        deliveredOrder.setMealType("Lunch");
        deliveredOrder.setOrderType("DAILY_MEAL");
        deliveredOrder.setOrderStatus("DELIVERED");
        mealOrderRepository.save(deliveredOrder);

        MealOrderEntity cancelledOrder = new MealOrderEntity();
        cancelledOrder.setRetreatBooking(freshBooking);
        cancelledOrder.setOrderDate(LocalDate.now());
        cancelledOrder.setMealType("Dinner");
        cancelledOrder.setOrderType("A_LA_CARTE");
        cancelledOrder.setOrderStatus("CANCELLED");
        mealOrderRepository.save(cancelledOrder);

        long invoiceCountBefore = invoiceRepository.count();

        InvoiceResponseDTO generatedInvoice = folioBillingService.generateConsolidatedInvoice(freshBooking.getRetreatBookingId());

        assertNotNull(generatedInvoice);
        assertNotNull(generatedInvoice.invoiceId());
        assertEquals("DRAFT", generatedInvoice.invoiceStatus());
        assertEquals(invoiceCountBefore + 1, invoiceRepository.count(),
                "Invoice must be persisted when all dining orders are terminal");
    }

    @Test
    @DisplayName("INVOICE GUARD API: Controller endpoint POST /api/v1/billing/folios/{bookingId}/invoice is rejected (HTTP 400) for READY order without persisting")
    @Transactional
    void directInvoiceGenerationEndpointRejectedForReadyOrderWithoutPersisting() throws Exception {
        RetreatBooking freshBooking = createFreshBookingWithoutInvoice();

        MealOrderEntity readyOrder = new MealOrderEntity();
        readyOrder.setRetreatBooking(freshBooking);
        readyOrder.setOrderDate(LocalDate.now());
        readyOrder.setMealType("Dinner");
        readyOrder.setOrderType("A_LA_CARTE");
        readyOrder.setOrderStatus("READY");
        mealOrderRepository.save(readyOrder);

        long invoiceCountBefore = invoiceRepository.count();
        String receptionistToken = jwtTokenProvider.generateToken(99, "receptionist@heavenstay.resort", "Front Desk", List.of("RECEPTIONIST"));

        mockMvc.perform(post("/api/v1/billing/folios/" + freshBooking.getRetreatBookingId() + "/invoice")
                        .header("Authorization", "Bearer " + receptionistToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("UNSETTLED_SERVICE_ORDERS"))
                .andExpect(jsonPath("$.message").value(containsString("READY")));

        assertEquals(invoiceCountBefore, invoiceRepository.count(),
                "Failed HTTP invoice generation request must NOT persist an invoice in database");
    }

    @Test
    @DisplayName("INVOICE GUARD API: Controller endpoint POST /api/v1/billing/folios/{bookingId}/invoice succeeds (HTTP 201) when orders are DELIVERED")
    @Transactional
    void directInvoiceGenerationEndpointSucceedsWhenOrdersDelivered() throws Exception {
        RetreatBooking freshBooking = createFreshBookingWithoutInvoice();

        MealOrderEntity deliveredOrder = new MealOrderEntity();
        deliveredOrder.setRetreatBooking(freshBooking);
        deliveredOrder.setOrderDate(LocalDate.now());
        deliveredOrder.setMealType("Lunch");
        deliveredOrder.setOrderType("DAILY_MEAL");
        deliveredOrder.setOrderStatus("DELIVERED");
        mealOrderRepository.save(deliveredOrder);

        long invoiceCountBefore = invoiceRepository.count();
        String receptionistToken = jwtTokenProvider.generateToken(99, "receptionist@heavenstay.resort", "Front Desk", List.of("RECEPTIONIST"));

        mockMvc.perform(post("/api/v1/billing/folios/" + freshBooking.getRetreatBookingId() + "/invoice")
                        .header("Authorization", "Bearer " + receptionistToken))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.invoiceNumber").isNotEmpty())
                .andExpect(jsonPath("$.data.invoiceStatus").value("DRAFT"));

        assertEquals(invoiceCountBefore + 1, invoiceRepository.count(),
                "Successful HTTP invoice generation request must persist exactly one new invoice");
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
        RetreatBooking booking = bookingRepository.findAll().get(0);
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
        RetreatBooking booking = bookingRepository.findAll().get(0);
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
        RetreatBooking updatedBooking = bookingRepository.findById(booking.getRetreatBookingId()).orElseThrow();
        assertEquals("COMPLETED", updatedBooking.getBookingStatus());

        FolioEntity updatedFolio = folioRepository.findById(folio.getFolioId()).orElseThrow();
        assertEquals("CLOSED", updatedFolio.getFolioStatus());
        assertNotNull(updatedFolio.getClosedAt());

        PhysicalVilla updatedVilla = villaRepository.findByVillaNumber(checkoutRes.getVillaNumber()).orElseThrow();
        assertEquals("NEEDS_CLEANING", updatedVilla.getVillaStatus());
    }

    @Test
    @DisplayName("INVARIANT: Payment Success IS NOT Checkout Completion")
    void paymentSuccessDoesNotCompleteCheckout() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        PaymentRequestDTO payReq = new PaymentRequestDTO("VNPAY", invoice.getFinalAmount(), "TXN-PAY-ONLY-1");
        PaymentResponseDTO payRes = checkoutService.processPayment(invoice.getInvoiceId(), payReq, true);
        assertEquals("SUCCESSFUL", payRes.getPaymentStatus());

        // Verify entities HAVE NOT transitioned to checkout state yet
        RetreatBooking currentBooking = bookingRepository.findById(booking.getRetreatBookingId()).orElseThrow();
        assertEquals("CHECKED_IN", currentBooking.getBookingStatus()); // Still checked in!

        FolioEntity currentFolio = folioRepository.findById(folio.getFolioId()).orElseThrow();
        assertEquals("PAID", currentFolio.getFolioStatus()); // Paid, but NOT closed!
        assertNull(currentFolio.getClosedAt());

        PhysicalVilla currentVilla = villaRepository.findByVillaNumber("Villa #102").orElseThrow();
        assertEquals("OCCUPIED", currentVilla.getVillaStatus()); // Still occupied!
    }

    @Test
    @DisplayName("ZERO BALANCE PATH: SRS FR-M5-02 Alt 2 handles zero balance due direct finalization")
    void zeroBalanceDuePathFinalization() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
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
        RetreatBooking booking = bookingRepository.findByIdWithDetails(bookingRepository.findAll().get(0).getRetreatBookingId()).orElseThrow();
        Long customerUserId = customerProfileRepository.findByIdWithUser(booking.getCustomerProfileId())
                .map(cp -> cp.getUser().getUserId().longValue()).orElseThrow();

        // 1. Before checkout completion, booking is CHECKED_IN: review must be blocked with STAY_NOT_COMPLETED
        CustomerReviewRequestDTO reviewReq = new CustomerReviewRequestDTO(
                booking.getRetreatBookingId().longValue(), 5, "Exquisite sanctuary experience, attentive holistic care."
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

        // 3. Review from another customer must be rejected with AccessDeniedException
        assertThrows(AccessDeniedException.class, () -> {
            reviewService.submitReview(reviewReq, 9999L);
        });

        // 4. Now review submission from real customer must succeed
        CustomerReviewResponseDTO submitted = reviewService.submitReview(reviewReq, customerUserId);
        assertNotNull(submitted.getReviewId());
        assertEquals(5, submitted.getOverallRating());
        assertEquals(5, submitted.getRoomRating());
        assertEquals(5, submitted.getSpaRating());
        assertEquals(4, submitted.getDiningRating());

        // 5. Duplicate review submission must be rejected with ALREADY_REVIEWED (HTTP 409)
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
    @DisplayName("SECURITY RBAC: Customer cannot view another customer's folio (HTTP 403)")
    void customerCannotViewAnotherCustomerFolio() throws Exception {
        // User ID 888 has no bookings
        String customerToken = jwtTokenProvider.generateToken(888, "stranger@heavenstay.resort", "Stranger Guest", List.of("CUSTOMER"));

        mockMvc.perform(get("/api/v1/billing/folios/1")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
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

    @Test
    @DisplayName("VNPAY WEBHOOK: Valid HMAC checksum confirms payment and repeated callback is idempotent")
    void vnpayWebhookIdempotentCallback() throws Exception {
        String secret = "test-vnpay-secret";
        String txnRef = "DEP-HSW-88192-2026"; // Existing transaction in seed data
        String amount = "735000000"; // 7,350,000 * 100
        String responseCode = "00";

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_Amount", amount);
        params.put("vnp_ResponseCode", responseCode);

        // Generate HMAC-SHA512
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, String> entry : params.entrySet()) {
            if (sb.length() > 0) sb.append("&");
            sb.append(URLEncoder.encode(entry.getKey(), StandardCharsets.US_ASCII))
              .append("=")
              .append(URLEncoder.encode(entry.getValue(), StandardCharsets.US_ASCII));
        }

        Mac mac = Mac.getInstance("HmacSHA512");
        SecretKeySpec secretKey = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA512");
        mac.init(secretKey);
        byte[] hash = mac.doFinal(sb.toString().getBytes(StandardCharsets.UTF_8));
        StringBuilder hex = new StringBuilder();
        for (byte b : hash) {
            hex.append(String.format("%02x", b));
        }
        String validHash = hex.toString();

        // First callback
        mockMvc.perform(get("/api/v1/commerce/payment/webhook/vnpay")
                        .param("vnp_TxnRef", txnRef)
                        .param("vnp_Amount", amount)
                        .param("vnp_ResponseCode", responseCode)
                        .param("vnp_SecureHash", validHash))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("00"))
                .andExpect(jsonPath("$.Message").value("Confirm Success"));

        // Second callback (idempotent - already successful)
        mockMvc.perform(get("/api/v1/commerce/payment/webhook/vnpay")
                        .param("vnp_TxnRef", txnRef)
                        .param("vnp_Amount", amount)
                        .param("vnp_ResponseCode", responseCode)
                        .param("vnp_SecureHash", validHash))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("00"))
                .andExpect(jsonPath("$.Message").value("Confirm Success"));
    }

    // =========================================================================
    // M4 F&B <-> M5 FOLIO BILLING CONTRACT TESTS
    // =========================================================================

    @Test
    @DisplayName("M4-M5 CONTRACT: Successfully post extra A_LA_CARTE meal order charge to Folio")
    @Transactional
    void postFolioChargeSucceedsForValidALaCarteMealOrder() {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        MealOrderEntity aLaCarteOrder = new MealOrderEntity();
        aLaCarteOrder.setRetreatBooking(booking);
        aLaCarteOrder.setOrderDate(LocalDate.now());
        aLaCarteOrder.setMealType("Dinner");
        aLaCarteOrder.setOrderType("A_LA_CARTE");
        aLaCarteOrder.setOrderStatus("DELIVERED");
        MealOrderEntity savedOrder = mealOrderRepository.save(aLaCarteOrder);

        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(booking.getRetreatBookingId().longValue());
        req.setChargeCategory("FNB");
        req.setDescription("Wellness Herbal Tea & Organic Fruit Platter");
        req.setAmount(new BigDecimal("250000.00"));
        req.setSourceMealOrderId(savedOrder.getMealOrderId());

        FolioItemResponseDTO res = folioBillingService.postFolioCharge(req);

        assertNotNull(res);
        assertNotNull(res.getFolioItemId());
        assertEquals("FNB", res.getChargeCategory());
        assertEquals(savedOrder.getMealOrderId(), res.getSourceMealOrderId());
        assertEquals(new BigDecimal("250000.00"), res.getAmount());
    }

    @Test
    @DisplayName("M4-M5 CONTRACT: Cannot post DAILY_MEAL order as folio charge (included in package)")
    @Transactional
    void postFolioChargeBlocksDailyMealOrderAsIncludedInPackage() {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        MealOrderEntity dailyOrder = new MealOrderEntity();
        dailyOrder.setRetreatBooking(booking);
        dailyOrder.setOrderDate(LocalDate.now());
        dailyOrder.setMealType("Breakfast");
        dailyOrder.setOrderType("DAILY_MEAL");
        dailyOrder.setOrderStatus("DELIVERED");
        MealOrderEntity savedOrder = mealOrderRepository.save(dailyOrder);

        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(booking.getRetreatBookingId().longValue());
        req.setChargeCategory("FNB");
        req.setDescription("Included Sanctuary Breakfast");
        req.setAmount(new BigDecimal("150000.00"));
        req.setSourceMealOrderId(savedOrder.getMealOrderId());

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.postFolioCharge(req);
        });
        assertEquals("CANNOT_CHARGE_INCLUDED_SERVICE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("included in the retreat package"));
    }

    @Test
    @DisplayName("M4-M5 CONTRACT: Cannot post CANCELLED meal order as folio charge")
    @Transactional
    void postFolioChargeBlocksCancelledMealOrder() {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        MealOrderEntity cancelledOrder = new MealOrderEntity();
        cancelledOrder.setRetreatBooking(booking);
        cancelledOrder.setOrderDate(LocalDate.now());
        cancelledOrder.setMealType("Lunch");
        cancelledOrder.setOrderType("A_LA_CARTE");
        cancelledOrder.setOrderStatus("CANCELLED");
        MealOrderEntity savedOrder = mealOrderRepository.save(cancelledOrder);

        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(booking.getRetreatBookingId().longValue());
        req.setChargeCategory("FNB");
        req.setDescription("Cancelled Bento Set");
        req.setAmount(new BigDecimal("300000.00"));
        req.setSourceMealOrderId(savedOrder.getMealOrderId());

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.postFolioCharge(req);
        });
        assertEquals("INVALID_ORDER_STATE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("CANCELLED meal order"));
    }

    @Test
    @DisplayName("M4-M5 CONTRACT: Blocks meal order cross-booking charge attempt (BOOKING_MISMATCH)")
    @Transactional
    void postFolioChargeBlocksMealOrderCrossBookingMismatch() {
        RetreatBooking booking1 = bookingRepository.findAll().get(0);
        RetreatBooking booking2 = createFreshBookingWithoutInvoice();

        // Order belongs to booking2
        MealOrderEntity orderBooking2 = new MealOrderEntity();
        orderBooking2.setRetreatBooking(booking2);
        orderBooking2.setOrderDate(LocalDate.now());
        orderBooking2.setMealType("Dinner");
        orderBooking2.setOrderType("A_LA_CARTE");
        orderBooking2.setOrderStatus("DELIVERED");
        MealOrderEntity savedOrder = mealOrderRepository.save(orderBooking2);

        // Attempt to charge to booking1's folio
        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(booking1.getRetreatBookingId().longValue());
        req.setChargeCategory("FNB");
        req.setDescription("Order belonging to another guest");
        req.setAmount(new BigDecimal("500000.00"));
        req.setSourceMealOrderId(savedOrder.getMealOrderId());

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.postFolioCharge(req);
        });
        assertEquals("BOOKING_MISMATCH", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("belongs to booking"));
    }

    @Test
    @DisplayName("M4-M5 CONTRACT: Throws ResourceNotFoundException for non-existent meal order ID")
    @Transactional
    void postFolioChargeThrowsNotFoundForNonexistentMealOrder() {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(booking.getRetreatBookingId().longValue());
        req.setChargeCategory("FNB");
        req.setDescription("Phantom Meal Order");
        req.setAmount(new BigDecimal("100000.00"));
        req.setSourceMealOrderId(999999L);

        assertThrows(ResourceNotFoundException.class, () -> {
            folioBillingService.postFolioCharge(req);
        });
    }

    @Test
    @DisplayName("M4-M5 CONTRACT: FNB charge without sourceMealOrderId is rejected with INVALID_FOLIO_SOURCE")
    @Transactional
    void postFolioChargeBlocksFnbWithoutSourceMealOrderId() {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(booking.getRetreatBookingId().longValue());
        req.setChargeCategory("FNB");
        req.setDescription("Missing source meal order");
        req.setAmount(new BigDecimal("100000.00"));
        req.setSourceMealOrderId(null);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.postFolioCharge(req);
        });
        assertEquals("INVALID_FOLIO_SOURCE", ex.getErrorCode());
    }

    @Test
    @DisplayName("M4-M5 CONTRACT: Duplicate charge for same meal order ID is blocked (DUPLICATE_CHARGE)")
    @Transactional
    void postFolioChargeBlocksDuplicateMealOrderCharge() {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        MealOrderEntity aLaCarteOrder = new MealOrderEntity();
        aLaCarteOrder.setRetreatBooking(booking);
        aLaCarteOrder.setOrderDate(LocalDate.now());
        aLaCarteOrder.setMealType("Dinner");
        aLaCarteOrder.setOrderType("A_LA_CARTE");
        aLaCarteOrder.setOrderStatus("DELIVERED");
        MealOrderEntity savedOrder = mealOrderRepository.save(aLaCarteOrder);

        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(booking.getRetreatBookingId().longValue());
        req.setChargeCategory("FNB");
        req.setDescription("First Post");
        req.setAmount(new BigDecimal("200000.00"));
        req.setSourceMealOrderId(savedOrder.getMealOrderId());

        folioBillingService.postFolioCharge(req);

        // Second post for same meal order must fail
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            folioBillingService.postFolioCharge(req);
        });
        assertEquals("DUPLICATE_CHARGE", ex.getErrorCode());
    }

    // =========================================================================
    // CHECKOUT FLOW HARDENING & REGRESSION TESTS
    // =========================================================================

    @Test
    @DisplayName("CHECKOUT HARDENING: finalizeCheckout rejects CANCELLED invoice")
    @Transactional
    void finalizeCheckoutBlocksCancelledInvoice() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        invoice.setInvoiceStatus("CANCELLED");
        invoiceRepository.save(invoice);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            checkoutService.finalizeCheckout(invoice.getInvoiceId());
        });
        assertEquals("INVOICE_CANCELLED", ex.getErrorCode());
    }

    @Test
    @DisplayName("CHECKOUT HARDENING: finalizeCheckout is idempotent when stay is already COMPLETED or Folio is CLOSED")
    @Transactional
    void finalizeCheckoutIdempotencyWhenStayAlreadyCompletedOrFolioClosed() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // First successful settlement & checkout
        PaymentRequestDTO payReq = new PaymentRequestDTO("CASH", invoice.getFinalAmount(), "TXN-IDEMP-TEST");
        checkoutService.processPayment(invoice.getInvoiceId(), payReq, true);
        FinalizeCheckoutResponseDTO firstRes = checkoutService.finalizeCheckout(invoice.getInvoiceId());
        assertEquals("COMPLETED", firstRes.getBookingStatus());

        // Repeated checkout call must be idempotent without throwing exception or mutating state
        FinalizeCheckoutResponseDTO secondRes = checkoutService.finalizeCheckout(invoice.getInvoiceId());
        assertNotNull(secondRes);
        assertEquals("COMPLETED", secondRes.getBookingStatus());
        assertEquals("CLOSED", secondRes.getFolioStatus());
        assertTrue(secondRes.getMessage().contains("already completed"));
    }

    @Test
    @DisplayName("CHECKOUT HARDENING: processPayment blocks payment when Folio is CLOSED or Stay is COMPLETED")
    @Transactional
    void processPaymentBlocksPaymentWhenFolioIsClosedOrStayCompleted() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // Settle & complete checkout
        PaymentRequestDTO payReq = new PaymentRequestDTO("CASH", invoice.getFinalAmount(), "TXN-CLOSE-TEST");
        checkoutService.processPayment(invoice.getInvoiceId(), payReq, true);
        checkoutService.finalizeCheckout(invoice.getInvoiceId());

        // Late payment attempt against closed folio must be rejected
        PaymentRequestDTO latePayReq = new PaymentRequestDTO("CASH", new BigDecimal("100000.00"), "TXN-LATE-FAIL");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            checkoutService.processPayment(invoice.getInvoiceId(), latePayReq, true);
        });
        assertEquals("FOLIO_CLOSED", ex.getErrorCode());
    }

    @Test
    @DisplayName("CHECKOUT HARDENING: finalizeCheckout blocks when remaining balance > 0 regardless of invoice status manipulation")
    @Transactional
    void finalizeCheckoutBlocksWhenUnpaidBalanceExistsEvenIfStatusWasManipulated() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // Invoice has positive finalAmount (19.4M VND) and ZERO successful payments
        // Even if an attacker/bug set invoice status to 'PAID', the strict balance check must block it
        invoice.setInvoiceStatus("PAID");
        invoiceRepository.save(invoice);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            checkoutService.finalizeCheckout(invoice.getInvoiceId());
        });
        assertEquals("UNPAID_CHARGES_REMAIN", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("unpaid Spa/F&B charges remain"));
    }

    @Test
    @DisplayName("CHECKOUT HARDENING: finalizeCheckout blocks contradictory state: Booking COMPLETED but Folio OPEN")
    @Transactional
    void finalizeCheckoutBlocksContradictoryStateBookingCompletedButFolioOpen() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // Mutate to contradictory state
        booking.setBookingStatus("COMPLETED");
        bookingRepository.save(booking);
        folio.setFolioStatus("OPEN");
        folioRepository.save(folio);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            checkoutService.finalizeCheckout(invoice.getInvoiceId());
        });
        assertEquals("INCONSISTENT_CHECKOUT_STATE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Booking #") && ex.getMessage().contains("COMPLETED but Folio"));
    }

    @Test
    @DisplayName("CHECKOUT HARDENING: finalizeCheckout blocks contradictory state: Folio CLOSED but Booking CHECKED_IN")
    @Transactional
    void finalizeCheckoutBlocksContradictoryStateFolioClosedButBookingCheckedIn() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // Mutate to contradictory state
        booking.setBookingStatus("CHECKED_IN");
        bookingRepository.save(booking);
        folio.setFolioStatus("CLOSED");
        folioRepository.save(folio);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            checkoutService.finalizeCheckout(invoice.getInvoiceId());
        });
        assertEquals("INCONSISTENT_CHECKOUT_STATE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Folio #") && ex.getMessage().contains("CLOSED but Booking"));
    }

    @Test
    @DisplayName("CHECKOUT HARDENING: finalizeCheckout blocks contradictory state: Completed & Closed but Invoice not PAID")
    @Transactional
    void finalizeCheckoutBlocksContradictoryStateCompletedAndClosedButInvoiceNotPaid() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // Mutate to contradictory state: stay marked COMPLETED and Folio CLOSED, but invoice is DRAFT/ISSUED
        booking.setBookingStatus("COMPLETED");
        bookingRepository.save(booking);
        folio.setFolioStatus("CLOSED");
        folioRepository.save(folio);
        invoice.setInvoiceStatus("ISSUED");
        invoiceRepository.save(invoice);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            checkoutService.finalizeCheckout(invoice.getInvoiceId());
        });
        assertEquals("INCONSISTENT_CHECKOUT_STATE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Invoice #") && ex.getMessage().contains("instead of PAID"));
    }

    @Test
    @DisplayName("CHECKOUT HARDENING: finalizeCheckout blocks contradictory state: Completed & Closed but unpaid balance remains")
    @Transactional
    void finalizeCheckoutBlocksContradictoryStateCompletedAndClosedButUnpaidBalanceRemains() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId()).orElseThrow();
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElseThrow();

        // Stay marked COMPLETED, Folio CLOSED, Invoice status set to PAID, but NO successful payments recorded
        booking.setBookingStatus("COMPLETED");
        bookingRepository.save(booking);
        folio.setFolioStatus("CLOSED");
        folioRepository.save(folio);
        invoice.setInvoiceStatus("PAID");
        invoiceRepository.save(invoice);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () -> {
            checkoutService.finalizeCheckout(invoice.getInvoiceId());
        });
        assertEquals("INCONSISTENT_CHECKOUT_STATE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("unpaid remaining balance"));
    }

    @Test
    @DisplayName("CONCURRENCY PROTECTION: Concurrent duplicate meal order charge requests serialize and prevent duplicate charges")
    void postFolioChargeConcurrentDuplicateProtection() throws Exception {
        RetreatBooking booking = bookingRepository.findAll().get(0);

        MealOrderEntity aLaCarteOrder = new MealOrderEntity();
        aLaCarteOrder.setRetreatBooking(booking);
        aLaCarteOrder.setOrderDate(LocalDate.now());
        aLaCarteOrder.setMealType("Dinner");
        aLaCarteOrder.setOrderType("A_LA_CARTE");
        aLaCarteOrder.setOrderStatus("DELIVERED");
        MealOrderEntity savedOrder = mealOrderRepository.save(aLaCarteOrder);

        int threadCount = 2;
        java.util.concurrent.ExecutorService executor = java.util.concurrent.Executors.newFixedThreadPool(threadCount);
        java.util.concurrent.CountDownLatch readyLatch = new java.util.concurrent.CountDownLatch(threadCount);
        java.util.concurrent.CountDownLatch startLatch = new java.util.concurrent.CountDownLatch(1);
        java.util.concurrent.atomic.AtomicInteger successCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.concurrent.atomic.AtomicInteger duplicateErrorCount = new java.util.concurrent.atomic.AtomicInteger(0);
        java.util.List<Throwable> unexpectedErrors = new java.util.concurrent.CopyOnWriteArrayList<>();

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                readyLatch.countDown();
                try {
                    startLatch.await();
                    PostChargeRequestDTO req = new PostChargeRequestDTO();
                    req.setRetreatBookingId(booking.getRetreatBookingId().longValue());
                    req.setChargeCategory("FNB");
                    req.setDescription("Concurrent Wellness Herbal Tea");
                    req.setAmount(new BigDecimal("120000.00"));
                    req.setSourceMealOrderId(savedOrder.getMealOrderId());

                    folioBillingService.postFolioCharge(req);
                    successCount.incrementAndGet();
                } catch (BusinessRuleException bre) {
                    if ("DUPLICATE_CHARGE".equals(bre.getErrorCode())) {
                        duplicateErrorCount.incrementAndGet();
                    } else {
                        unexpectedErrors.add(bre);
                    }
                } catch (Throwable t) {
                    unexpectedErrors.add(t);
                }
            });
        }

        readyLatch.await(5, java.util.concurrent.TimeUnit.SECONDS);
        startLatch.countDown(); // Release both threads simultaneously
        executor.shutdown();
        boolean finished = executor.awaitTermination(15, java.util.concurrent.TimeUnit.SECONDS);
        assertTrue(finished, "Concurrent execution timed out");

        assertTrue(unexpectedErrors.isEmpty(), "Unexpected errors during concurrent posting: " + unexpectedErrors);
        assertEquals(1, successCount.get(), "Exactly one charge request must succeed");
        assertEquals(1, duplicateErrorCount.get(), "Exactly one charge request must be rejected with DUPLICATE_CHARGE");

        // Verify in DB that exactly one FolioItemEntity was persisted for this meal order
        long countInDb = folioItemRepository.findAll().stream()
                .filter(item -> savedOrder.getMealOrderId().equals(item.getSourceMealOrderId()))
                .count();
        assertEquals(1L, countInDb, "Database must contain exactly 1 FolioItem for the meal order");
    }

    @Test
    @DisplayName("E2E INTEGRATION: M3 BillingAdapter posts extra spa charge directly to M5 Folio and updates Invoice")
    @Transactional
    void m3BillingAdapterPostsExtraSpaChargeDirectlyToFolio() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        SpaTreatment treatment = spaTreatmentRepository.findAll().get(0);
        Therapist therapist = therapistRepository.findAll().get(0);
        TreatmentRoom room = treatmentRoomRepository.findAll().get(0);

        BigDecimal initialSpaCharges = folioBillingService.getFolioByBookingId(booking.getRetreatBookingId())
                .getItems().stream()
                .filter(i -> "SPA".equals(i.getChargeCategory()))
                .map(FolioItemResponseDTO::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        LocalDateTime now = LocalDateTime.now();
        SpaSession session = new SpaSession(
                booking.getRetreatBookingId(),
                treatment,
                therapist,
                room,
                now.plusHours(2),
                now.plusHours(2),
                now.plusHours(3),
                BookingSource.CUSTOMER,
                "Need extra back relief"
        );
        session.setSessionStatus(SpaSessionStatus.COMPLETED); // Completed so billing guard allows invoice generation
        session = spaSessionRepository.save(session);

        BigDecimal extraPrice = new BigDecimal("850000.00");
        billingPort.recordExtraSpaCharge(
                session.getSpaSessionId(),
                booking.getRetreatBookingId(),
                extraPrice,
                "Extra Spa: " + treatment.getTreatmentName()
        );

        // Verify Folio has the new SPA charge
        assertTrue(folioItemRepository.existsBySourceSpaSessionId(session.getSpaSessionId()),
                "FolioItem for extra spa session must exist");

        FolioResponseDTO folio = folioBillingService.getFolioByBookingId(booking.getRetreatBookingId());
        assertTrue(folio.getItems().stream().anyMatch(i ->
                "SPA".equals(i.getChargeCategory()) && extraPrice.compareTo(i.getAmount()) == 0),
                "Folio items must contain the extra spa charge");

        // Verify consolidated invoice reflects the updated total spa charges (initial + extra)
        InvoiceResponseDTO invoice = folioBillingService.generateConsolidatedInvoice(booking.getRetreatBookingId());
        BigDecimal expectedTotalSpa = initialSpaCharges.add(extraPrice);
        assertEquals(0, expectedTotalSpa.compareTo(invoice.spaCharges()),
                "Invoice spa charges must match initial spa charges plus extra spa charge amount");
    }

    @Test
    @DisplayName("M3-M5 CONTRACT: Extra spa session charge is idempotent; duplicate calls do not create duplicate folio items")
    @Transactional
    void m3BillingAdapterDuplicateChargeIgnoredIdempotently() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        SpaTreatment treatment = spaTreatmentRepository.findAll().get(0);
        Therapist therapist = therapistRepository.findAll().get(0);
        TreatmentRoom room = treatmentRoomRepository.findAll().get(0);

        LocalDateTime now = LocalDateTime.now();
        SpaSession session = new SpaSession(
                booking.getRetreatBookingId(),
                treatment,
                therapist,
                room,
                now.plusHours(2),
                now.plusHours(2),
                now.plusHours(3),
                BookingSource.CUSTOMER,
                "Extra session for idempotency check"
        );
        session.setSessionStatus(SpaSessionStatus.COMPLETED);
        SpaSession savedSession = spaSessionRepository.save(session);
        final Long sessionId = savedSession.getSpaSessionId();

        BigDecimal extraPrice = new BigDecimal("750000.00");

        // First charge posting
        billingPort.recordExtraSpaCharge(
                sessionId,
                booking.getRetreatBookingId(),
                extraPrice,
                "Extra Spa: " + treatment.getTreatmentName()
        );

        long countAfterFirst = folioItemRepository.findByFolioId(
                folioBillingService.getFolioByBookingId(booking.getRetreatBookingId()).getFolioId()
        ).stream().filter(i -> sessionId.equals(i.getSourceSpaSessionId())).count();
        assertEquals(1, countAfterFirst, "Exactly one FolioItem must exist after first call");

        // Second duplicate charge posting (e.g. retry / repeated call)
        billingPort.recordExtraSpaCharge(
                sessionId,
                booking.getRetreatBookingId(),
                extraPrice,
                "Extra Spa: " + treatment.getTreatmentName()
        );

        long countAfterSecond = folioItemRepository.findByFolioId(
                folioBillingService.getFolioByBookingId(booking.getRetreatBookingId()).getFolioId()
        ).stream().filter(i -> sessionId.equals(i.getSourceSpaSessionId())).count();
        assertEquals(1, countAfterSecond, "Still exactly one FolioItem must exist after duplicate retry call");
    }

    @Test
    @DisplayName("M3-M5 CONTRACT: Direct postFolioCharge throws DUPLICATE_CHARGE for duplicate spa session")
    @Transactional
    void postFolioChargeDirectlyBlocksDuplicateSpaSessionCharge() {
        RetreatBooking booking = bookingRepository.findAll().get(0);
        SpaTreatment treatment = spaTreatmentRepository.findAll().get(0);
        Therapist therapist = therapistRepository.findAll().get(0);
        TreatmentRoom room = treatmentRoomRepository.findAll().get(0);

        LocalDateTime now = LocalDateTime.now();
        SpaSession session = new SpaSession(
                booking.getRetreatBookingId(),
                treatment,
                therapist,
                room,
                now.plusHours(1),
                now.plusHours(1),
                now.plusHours(2),
                BookingSource.CUSTOMER,
                "Direct duplicate test"
        );
        session.setSessionStatus(SpaSessionStatus.COMPLETED);
        session = spaSessionRepository.save(session);

        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(booking.getRetreatBookingId().longValue());
        req.setChargeCategory("SPA");
        req.setDescription("Direct Spa Post");
        req.setAmount(new BigDecimal("500000.00"));
        req.setSourceSpaSessionId(session.getSpaSessionId());

        folioBillingService.postFolioCharge(req);

        // Second direct post for same spa session must throw DUPLICATE_CHARGE
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.postFolioCharge(req));
        assertEquals("DUPLICATE_CHARGE", ex.getErrorCode());
    }

    @Test
    @DisplayName("M3-M5 CONTRACT: postFolioCharge rejects booking mismatch and cancelled spa sessions")
    @Transactional
    void postFolioChargeRejectsBookingMismatchAndCancelledSpaSession() {
        RetreatBooking booking1 = bookingRepository.findAll().get(0);
        RetreatBooking booking2 = createFreshBookingWithoutInvoice();

        SpaTreatment treatment = spaTreatmentRepository.findAll().get(0);
        Therapist therapist = therapistRepository.findAll().get(0);
        TreatmentRoom room = treatmentRoomRepository.findAll().get(0);

        LocalDateTime now = LocalDateTime.now();
        // Session belongs to booking 1
        SpaSession session = new SpaSession(
                booking1.getRetreatBookingId(),
                treatment,
                therapist,
                room,
                now.plusHours(1),
                now.plusHours(1),
                now.plusHours(2),
                BookingSource.CUSTOMER,
                "Mismatch session"
        );
        session.setSessionStatus(SpaSessionStatus.COMPLETED);
        session = spaSessionRepository.save(session);

        // Request posts session of booking 1 to booking 2 -> BOOKING_MISMATCH
        PostChargeRequestDTO reqMismatch = new PostChargeRequestDTO();
        reqMismatch.setRetreatBookingId(booking2.getRetreatBookingId().longValue());
        reqMismatch.setChargeCategory("SPA");
        reqMismatch.setDescription("Mismatch test");
        reqMismatch.setAmount(new BigDecimal("500000.00"));
        reqMismatch.setSourceSpaSessionId(session.getSpaSessionId());

        BusinessRuleException exMismatch = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.postFolioCharge(reqMismatch));
        assertEquals("BOOKING_MISMATCH", exMismatch.getErrorCode());

        // Cancelled session -> INVALID_SERVICE_STATE
        SpaSession cancelledSession = new SpaSession(
                booking1.getRetreatBookingId(),
                treatment,
                therapist,
                room,
                now.plusHours(3),
                now.plusHours(3),
                now.plusHours(4),
                BookingSource.CUSTOMER,
                "Cancelled session"
        );
        cancelledSession.setSessionStatus(SpaSessionStatus.CANCELLED);
        cancelledSession = spaSessionRepository.save(cancelledSession);

        PostChargeRequestDTO reqCancelled = new PostChargeRequestDTO();
        reqCancelled.setRetreatBookingId(booking1.getRetreatBookingId().longValue());
        reqCancelled.setChargeCategory("SPA");
        reqCancelled.setDescription("Cancelled test");
        reqCancelled.setAmount(new BigDecimal("500000.00"));
        reqCancelled.setSourceSpaSessionId(cancelledSession.getSpaSessionId());

        BusinessRuleException exCancelled = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.postFolioCharge(reqCancelled));
        assertEquals("INVALID_SERVICE_STATE", exCancelled.getErrorCode());
    }

    @Test
    @DisplayName("M3-M5 CONTRACT: BillingPort gracefully handles invalid booking or non-existent spa session")
    @Transactional
    void m3BillingAdapterInvalidBookingAndSessionGracefullyHandled() {
        // Non-existent booking ID -> gracefully skipped
        assertDoesNotThrow(() ->
                billingPort.recordExtraSpaCharge(12345L, 999999, new BigDecimal("300000.00"), "Invalid Booking"));
        assertFalse(folioItemRepository.existsBySourceSpaSessionId(12345L));

        // Non-existent spa session ID on existing booking -> caught and logged
        RetreatBooking booking = bookingRepository.findAll().get(0);
        assertDoesNotThrow(() ->
                billingPort.recordExtraSpaCharge(99999999L, booking.getRetreatBookingId(), new BigDecimal("300000.00"), "Invalid Session"));
        assertFalse(folioItemRepository.existsBySourceSpaSessionId(99999999L));
    }
}


