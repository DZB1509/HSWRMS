package com.heavenstay.hswrms.m5billing;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.HealthProfileRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMealOrderLineRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMealOrderRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderResponse;
import com.heavenstay.hswrms.m4fnb.entity.*;
import com.heavenstay.hswrms.m4fnb.event.AlaCarteOrderPlacedEvent;
import com.heavenstay.hswrms.m4fnb.event.AlaCarteOrderDeliveredEvent;
import com.heavenstay.hswrms.m4fnb.integration.FolioStatusPort;
import com.heavenstay.hswrms.m4fnb.repository.*;
import com.heavenstay.hswrms.m4fnb.service.MealOrderService;
import com.heavenstay.hswrms.m5billing.dto.PostChargeRequestDTO;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m5billing.integration.FnbFolioEventListener;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import com.heavenstay.hswrms.m5billing.service.InvoiceCalculation;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import com.heavenstay.hswrms.m4fnb.dto.UpdateOrderStatusRequest;
import com.heavenstay.hswrms.m4fnb.service.FnbKdsOrderService;
import com.heavenstay.hswrms.m5billing.dto.FinalizeCheckoutResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.InvoiceResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.PaymentRequestDTO;
import com.heavenstay.hswrms.m5billing.service.CheckoutService;


import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

/**
 * ============================================================================
 * [TRACEABILITY MATRIX]
 * Work Package: WP-1A - F&B to Folio Integrity Implementation
 * Defect Resolution: ISSUE-FIN-01 (AlaCarteOrderPlacedEvent Consumer Verification)
 * Scenarios Tested: FOLIO-M4-01 through FOLIO-M4-10
 * Compliance: Transactional Consistency, Application-Level & DB Idempotency,
 *             Non-Destructive Financial Auditing, PII Data Minimization.
 * ============================================================================
 */
@SpringBootTest
public class FnbFolioIntegrationTest {
    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private FnbKdsOrderService kdsOrderService;



    @Autowired
    private MealOrderService mealOrderService;

    @Autowired
    private FolioBillingService folioBillingService;

    @Autowired
    private FnbFolioEventListener fnbFolioEventListener;

    @Autowired
    private FolioStatusPort folioStatusPort;

    @Autowired
    private ApplicationEventPublisher eventPublisher;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private HealthProfileRepository healthProfileRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private PhysicalVillaRepository physicalVillaRepository;

    @Autowired
    private RetreatPackageRepository retreatPackageRepository;

    @Autowired
    private RetreatBookingRepository retreatBookingRepository;

    @Autowired
    private FolioRepository folioRepository;

    @Autowired
    private FolioItemRepository folioItemRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private MealOrderRepository mealOrderRepository;

    @Autowired
    private MealOrderItemRepository mealOrderItemRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private IngredientBatchRepository batchRepository;

    @Autowired
    private MenuItemIngredientRepository recipeRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private void advancePastGracePeriod(Integer orderId) {
        MealOrderEntity entity = mealOrderRepository.findById(orderId).orElseThrow();
        entity.setCreatedAt(LocalDateTime.now().minusSeconds(35));
        mealOrderRepository.saveAndFlush(entity);
    }

    private User guestUserA;
    private User guestUserB;
    private RetreatBooking bookingA;
    private RetreatBooking bookingB;
    private FolioEntity folioA;
    private MenuItem herbalTeaItem;
    private MenuItem fruitSaladItem;
    private final LocalDate targetOrderDate = LocalDate.now().plusDays(1);

    @BeforeEach
    void setUp() {
        long timestamp = System.currentTimeMillis();

        // 1. Create Guest Users
        guestUserA = new User();
        guestUserA.setEmail("guest.a." + timestamp + "@heavenstay.com");
        guestUserA.setPasswordHash("hashed_pw");
        guestUserA.setFullName("Guest Eleanor Vance");
        guestUserA.setAccountStatus("ACTIVE");
        guestUserA = userRepository.save(guestUserA);

        CustomerProfile profileA = new CustomerProfile();
        profileA.setUser(guestUserA);
        profileA = customerProfileRepository.save(profileA);

        HealthProfile healthA = new HealthProfile();
        healthA.setCustomerProfile(profileA);
        healthA.setAllergies("peanuts");
        healthA.setDietaryRequirements("organic, vegan");
        healthProfileRepository.save(healthA);

        guestUserB = new User();
        guestUserB.setEmail("guest.b." + timestamp + "@heavenstay.com");
        guestUserB.setPasswordHash("hashed_pw");
        guestUserB.setFullName("Guest Theodora Crain");
        guestUserB.setAccountStatus("ACTIVE");
        guestUserB = userRepository.save(guestUserB);

        CustomerProfile profileB = new CustomerProfile();
        profileB.setUser(guestUserB);
        profileB = customerProfileRepository.save(profileB);

        // 2. Villa and Package Setup
        VillaCategory category = new VillaCategory();
        category.setCategoryName("Sanctuary Garden Suite " + timestamp);
        category.setMaxOccupancy(2);
        category.setPriceModifier(BigDecimal.ZERO);
        category.setCategoryStatus("ACTIVE");
        category.setInventoryCount(5);
        category.setBedroomCount(1);
        category = villaCategoryRepository.save(category);

        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaNumber("Villa #102");
        villa.setVillaCategory(category);
        villa.setVillaStatus("AVAILABLE");
        villa = physicalVillaRepository.save(villa);

        RetreatPackage retreatPackage = new RetreatPackage();
        retreatPackage.setPackageCode("PKG-FNB-TEST-" + timestamp);
        retreatPackage.setPackageName("Pure Detox Wellness");
        retreatPackage.setDurationNights(3);
        retreatPackage.setBasePrice(new BigDecimal("24500000"));
        retreatPackage.setPackageStatus("ACTIVE");
        retreatPackage = retreatPackageRepository.save(retreatPackage);

        // 3. Retreat Bookings
        RetreatBooking bA = new RetreatBooking();
        bA.setCustomerProfileId(profileA.getCustomerProfileId());
        bA.setRetreatPackage(retreatPackage);
        bA.setRequestedVillaCategory(category);
        bA.setAssignedVilla(villa);
        bA.setCheckInDate(targetOrderDate.minusDays(1));
        bA.setCheckOutDate(targetOrderDate.plusDays(3));
        bA.setBookingStatus("CONFIRMED");
        bA.setDepositAmount(new BigDecimal("5000000"));
        bA.setTotalEstimatedAmount(new BigDecimal("24500000"));
        bookingA = retreatBookingRepository.save(bA);

        RetreatBooking bB = new RetreatBooking();
        bB.setCustomerProfileId(profileB.getCustomerProfileId());
        bB.setRetreatPackage(retreatPackage);
        bB.setRequestedVillaCategory(category);
        bB.setAssignedVilla(villa);
        bB.setCheckInDate(targetOrderDate.minusDays(1));
        bB.setCheckOutDate(targetOrderDate.plusDays(3));
        bB.setBookingStatus("CONFIRMED");
        bB.setDepositAmount(new BigDecimal("5000000"));
        bB.setTotalEstimatedAmount(new BigDecimal("24500000"));
        bookingB = retreatBookingRepository.save(bB);

        // 4. Folios
        folioA = new FolioEntity(bookingA);
        folioA.setTotalPaid(new BigDecimal("5000000"));
        folioA = folioRepository.save(folioA);

        FolioItemEntity pkgCharge = new FolioItemEntity(
                folioA, "PACKAGE", "Retreat Accommodation", new BigDecimal("24500000"),
                bookingA.getRetreatBookingId().longValue(), null, null
        );
        folioItemRepository.save(pkgCharge);
        folioA.addItem(pkgCharge);
        folioA = folioRepository.save(folioA);

        PaymentTransactionEntity depA = new PaymentTransactionEntity(
                bookingA, null, "DEPOSIT", "VNPAY", "TXN-DEP-A-" + timestamp, new BigDecimal("5000000.00"), "SUCCESSFUL"
        );
        paymentTransactionRepository.save(depA);

        // 5. Menu Items with Usable Ingredient Stock
        Ingredient mint = ingredientRepository.save(new Ingredient("Fresh Organic Mint " + timestamp));
        batchRepository.save(new IngredientBatch(mint.getId(), LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(30), new BigDecimal("5000.000"), "FRESH"));

        herbalTeaItem = menuItemRepository.save(new MenuItem(
                "Therapeutic Herbal Tea " + timestamp, "BEVERAGE", "ALL_DAY",
                new BigDecimal("120000.00"), "vegan", null, "AVAILABLE", true
        ));
        recipeRepository.save(new MenuItemIngredient(herbalTeaItem.getId(), mint.getId(), new BigDecimal("10.000")));

        fruitSaladItem = menuItemRepository.save(new MenuItem(
                "Organic Fruit Bowl " + timestamp, "DISH", "ALL_DAY",
                new BigDecimal("180000.00"), "vegan", null, "AVAILABLE", true
        ));
        recipeRepository.save(new MenuItemIngredient(fruitSaladItem.getId(), mint.getId(), new BigDecimal("5.000")));
    }

    // ========================================================================
    // FOLIO-M4-01: Valid A-la-carte dining order charges strictly upon DELIVERED status
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-01: Valid A-la-carte dining order charges strictly upon DELIVERED status")
    void testFolioM401_ValidAlaCarteOrderPostsFolioCharge() {
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Please deliver hot to villa",
                List.of(
                        new CreateMealOrderLineRequest(herbalTeaItem.getId(), 2),   // 2 * 120,000 = 240,000
                        new CreateMealOrderLineRequest(fruitSaladItem.getId(), 1)   // 1 * 180,000 = 180,000
                )
        );

        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);

        assertNotNull(response);
        assertNotNull(response.id());
        assertEquals(0, new BigDecimal("420000.00").compareTo(response.subtotal()));
        assertEquals("PENDING_DELIVERY", response.folioPostingStatus());

        // Under policy HSWRMS-FNB-FIN-POLICY-01: zero charges posted while order is PENDING
        List<FolioItemEntity> fnbItemsBeforeDelivery = folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream()
                .filter(i -> "FNB".equals(i.getChargeCategory()))
                .toList();
        assertEquals(0, fnbItemsBeforeDelivery.size(), "No FNB FolioItem must be created while order is in PENDING state");
        assertFalse(folioStatusPort.isMealOrderPostedToFolio(response.id()));

        // Fulfill / deliver the order -> recognizes folio charge
        fnbFolioEventListener.onAlaCarteOrderDelivered(new AlaCarteOrderDeliveredEvent(
                response.id(), bookingA.getRetreatBookingId(), response.subtotal(), LocalDateTime.now()
        ));

        // Verify FolioItem was created in M5
        List<FolioItemEntity> fnbItems = folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream()
                .filter(i -> "FNB".equals(i.getChargeCategory()))
                .toList();

        assertEquals(1, fnbItems.size(), "Exactly one FNB FolioItem must be created upon delivery");
        FolioItemEntity fnbItem = fnbItems.get(0);
        assertEquals(0, new BigDecimal("420000.00").compareTo(fnbItem.getAmount()));
        assertEquals(response.id().longValue(), fnbItem.getSourceMealOrderId());
        assertNull(fnbItem.getSourceBookingId());
        assertNull(fnbItem.getSourceSpaSessionId());

        // Verify Folio total charges updated
        FolioEntity updatedFolio = folioRepository.findById(folioA.getFolioId()).orElseThrow();
        assertEquals(0, new BigDecimal("24920000.00").compareTo(updatedFolio.getTotalCharges()));

        // Verify FolioStatusPort accurately reflects posted status
        assertTrue(folioStatusPort.isMealOrderPostedToFolio(response.id()));
    }

    // ========================================================================
    // FOLIO-M4-02: Duplicate delivery event dispatch does not create duplicate FolioItem
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-02: Duplicate delivery event dispatch does not create duplicate FolioItem")
    void testFolioM402_DuplicateEventDispatchIsIdempotent() {
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Light evening tea",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1)) // 120,000
        );

        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        Integer orderId = response.id();

        // Zero charges at placement
        assertEquals(0, folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream().filter(i -> "FNB".equals(i.getChargeCategory())).count());

        // Deliver order -> posts charge
        AlaCarteOrderDeliveredEvent deliveryEvent = new AlaCarteOrderDeliveredEvent(
                orderId, bookingA.getRetreatBookingId(), new BigDecimal("120000.00"), LocalDateTime.now()
        );
        fnbFolioEventListener.onAlaCarteOrderDelivered(deliveryEvent);

        // Count initial charges
        long initialCount = folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream().filter(i -> "FNB".equals(i.getChargeCategory())).count();
        assertEquals(1, initialCount);

        // Simulate duplicate delivery event delivery
        assertDoesNotThrow(() -> fnbFolioEventListener.onAlaCarteOrderDelivered(deliveryEvent));

        // Count must still be 1
        long afterDuplicateCount = folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream().filter(i -> "FNB".equals(i.getChargeCategory())).count();
        assertEquals(1, afterDuplicateCount, "Duplicate delivery event must not insert second FolioItem");
    }

    // ========================================================================
    // FOLIO-M4-03: Retry after initial processing does not duplicate charge
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-03: Retry after initial delivery processing is safely deduplicated")
    void testFolioM403_RetryAfterInitialProcessingIsDeduplicated() {
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Extra fruit bowl",
                List.of(new CreateMealOrderLineRequest(fruitSaladItem.getId(), 2)) // 360,000
        );

        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        Integer orderId = response.id();

        // Deliver order -> posts charge
        fnbFolioEventListener.onAlaCarteOrderDelivered(new AlaCarteOrderDeliveredEvent(
                orderId, bookingA.getRetreatBookingId(), new BigDecimal("360000.00"), LocalDateTime.now()
        ));

        // Verify initial charge exists
        assertTrue(folioItemRepository.existsBySourceMealOrderId(orderId.longValue()));

        // Retry direct posting
        PostChargeRequestDTO retryDto = new PostChargeRequestDTO();
        retryDto.setRetreatBookingId(bookingA.getRetreatBookingId().longValue());
        retryDto.setChargeCategory("FNB");
        retryDto.setSourceMealOrderId(orderId.longValue());
        retryDto.setAmount(new BigDecimal("360000.00"));
        retryDto.setDescription("Retry charge");

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.postFolioCharge(retryDto)
        );
        assertEquals("DUPLICATE_CHARGE", ex.getErrorCode());

        // Count remains 1
        long fnbCount = folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream().filter(i -> "FNB".equals(i.getChargeCategory())).count();
        assertEquals(1, fnbCount);
    }

    // ========================================================================
    // FOLIO-M4-04: Closed folio rejects posting and rolls back meal order
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-04: Closed Folio rejects charge and rolls back meal order atomically")
    void testFolioM404_ClosedFolioRollsBackOrderPlacement() {
        // Close folio
        folioA.setFolioStatus("CLOSED");
        folioA.setClosedAt(LocalDateTime.now());
        folioRepository.save(folioA);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Order on closed folio",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        long orderCountBefore = mealOrderRepository.count();

        // Attempting to place order on closed folio must fail
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request)
        );
        assertEquals("FOLIO_CLOSED", ex.getErrorCode());

        // Verify transaction rolled back: no orphan meal order was persisted
        long orderCountAfter = mealOrderRepository.count();
        assertEquals(orderCountBefore, orderCountAfter, "Order transaction must roll back when folio charge fails");
    }

    // ========================================================================
    // FOLIO-M4-05: Settled/issued invoice blocks charge and rolls back order
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-05: Settled invoice blocks folio posting and rolls back order without charge loss")
    void testFolioM405_IssuedInvoiceBlocksChargeAndRollsBackOrder() {
        // Create an ISSUED invoice for folioA
        InvoiceEntity invoice = new InvoiceEntity(
                folioA,
                "INV-TEST-" + System.currentTimeMillis(),
                new BigDecimal("24500000.00"),
                BigDecimal.ZERO,
                new BigDecimal("24500000.00"),
                "ISSUED"
        );
        invoiceRepository.save(invoice);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Order after invoice issued",
                List.of(new CreateMealOrderLineRequest(fruitSaladItem.getId(), 1))
        );

        long orderCountBefore = mealOrderRepository.count();

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request)
        );
        assertEquals("INVOICE_ALREADY_ISSUED", ex.getErrorCode());

        long orderCountAfter = mealOrderRepository.count();
        assertEquals(orderCountBefore, orderCountAfter, "Order transaction must roll back if invoice is already issued");
    }

    // ========================================================================
    // FOLIO-M4-06: Cancelled meal order cannot be charged to Folio
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-06: Pre-cancelled meal order is rejected from folio posting")
    void testFolioM406_CancelledOrderCannotBeCharged() {
        // Directly persist a CANCELLED meal order
        MealOrderEntity cancelledOrder = new MealOrderEntity(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                FnbOrderType.A_LA_CARTE,
                FnbOrderStatus.CANCELLED,
                LocalDateTime.now(),
                "Pre-cancelled order"
        );
        cancelledOrder = mealOrderRepository.save(cancelledOrder);

        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(bookingA.getRetreatBookingId().longValue());
        req.setChargeCategory("FNB");
        req.setSourceMealOrderId(cancelledOrder.getId().longValue());
        req.setAmount(new BigDecimal("150000.00"));
        req.setDescription("Charge for cancelled order");

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.postFolioCharge(req)
        );
        assertEquals("INVALID_ORDER_STATE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("CANCELLED"));

        assertFalse(folioItemRepository.existsBySourceMealOrderId(cancelledOrder.getId().longValue()));
    }

    // ========================================================================
    // FOLIO-M4-07: Cancellation after posting documents known boundary
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-07: Order cancellation before delivery leaves Folio clean with zero charges")
    void testFolioM407_OrderCancellationBeforeDeliveryLeavesFolioClean() {
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Evening snack",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        Integer orderId = response.id();

        // Under policy HSWRMS-FNB-FIN-POLICY-01: No charge posted while order is PENDING
        assertFalse(folioItemRepository.existsBySourceMealOrderId(orderId.longValue()));

        // Kitchen/staff cancels the order before delivery
        mealOrderService.updateStatus(orderId, "CANCELLED");

        MealOrderEntity cancelledOrder = mealOrderRepository.findById(orderId).orElseThrow();
        assertEquals("CANCELLED", cancelledOrder.getOrderStatus());

        // Billing guard passes because cancelled order is terminal
        assertDoesNotThrow(() -> folioBillingService.validateBillingGuard(bookingA.getRetreatBookingId()));

        // Verify folio charge was NEVER posted (no orphan charge, zero overbilling risk)
        assertFalse(folioItemRepository.existsBySourceMealOrderId(orderId.longValue()),
                "Cancelled order must not be charged to Folio");
    }

    // ========================================================================
    // FOLIO-M4-08: Booking ownership mismatch is rejected
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-08: Guest attempting to order for another guest's booking is rejected")
    void testFolioM408_BookingOwnershipMismatchRejected() {
        // Guest B attempts to order for Booking A
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Unauthorized order attempt",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        assertThrows(AccessDeniedException.class, () ->
                mealOrderService.placeAlaCarteOrder(guestUserB.getUserId(), request)
        );

        // Verify no charge posted to folioA
        long fnbCount = folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream().filter(i -> "FNB".equals(i.getChargeCategory())).count();
        assertEquals(0, fnbCount);
    }

    // ========================================================================
    // FOLIO-M4-09: Amount calculation correctness and invoice VAT computation
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-09: F&B charges correctly accumulate and subject to 8% VAT in invoice calculation")
    void testFolioM409_AmountCalculationAndVatApplication() {
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Multi-item order",
                List.of(
                        new CreateMealOrderLineRequest(herbalTeaItem.getId(), 3),   // 3 * 120,000 = 360,000
                        new CreateMealOrderLineRequest(fruitSaladItem.getId(), 2)   // 2 * 180,000 = 360,000
                )
        );

        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        assertEquals(0, new BigDecimal("720000.00").compareTo(response.subtotal()));

        // Deliver order to recognize charge
        fnbFolioEventListener.onAlaCarteOrderDelivered(new AlaCarteOrderDeliveredEvent(
                response.id(), bookingA.getRetreatBookingId(), response.subtotal(), LocalDateTime.now()
        ));

        List<FolioItemEntity> items = folioItemRepository.findByFolioId(folioA.getFolioId());
        InvoiceCalculation calc = folioBillingService.calculateInvoiceAmounts(bookingA, items);

        // Package: 24,500,000 - Deposit: 5,000,000 = Outstanding: 19,500,000
        assertEquals(0, new BigDecimal("19500000.00").compareTo(calc.packageOutstanding()));
        // F&B charges: 720,000
        assertEquals(0, new BigDecimal("720000.00").compareTo(calc.fnbCharges()));
        // Spa: 0
        assertEquals(0, BigDecimal.ZERO.compareTo(calc.spaCharges()));
        // Chargeable extras = 720,000 -> VAT 8% = 57,600.00
        assertEquals(0, new BigDecimal("57600.00").compareTo(calc.tax()));
        // Subtotal = 19,500,000 + 720,000 = 20,220,000.00
        assertEquals(0, new BigDecimal("20220000.00").compareTo(calc.subtotal()));
        // Final Amount = 20,220,000 + 57,600 = 20,277,600.00
        assertEquals(0, new BigDecimal("20277600.00").compareTo(calc.finalAmount()));
    }

    // ========================================================================
    // FOLIO-M4-10: Concurrent charge posting serialized by pessimistic lock
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-10: Concurrent posting attempts for the same MealOrder serialize with exactly one FolioItem")
    void testFolioM410_ConcurrentChargePostingSerialized() throws Exception {
        // Create an uncharged meal order
        MealOrderEntity order = new MealOrderEntity(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                FnbOrderType.A_LA_CARTE,
                FnbOrderStatus.PENDING,
                LocalDateTime.now(),
                "Concurrency stress test order"
        );
        order = mealOrderRepository.save(order);
        final Long mealOrderId = order.getId().longValue();

        int threadCount = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger duplicateBlockedCount = new AtomicInteger(0);

        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    txTemplate.execute(status -> {
                        PostChargeRequestDTO chargeDto = new PostChargeRequestDTO();
                        chargeDto.setRetreatBookingId(bookingA.getRetreatBookingId().longValue());
                        chargeDto.setChargeCategory("FNB");
                        chargeDto.setSourceMealOrderId(mealOrderId);
                        chargeDto.setAmount(new BigDecimal("120000.00"));
                        chargeDto.setDescription("Concurrent test charge");
                        folioBillingService.postFolioCharge(chargeDto);
                        return null;
                    });
                    successCount.incrementAndGet();
                } catch (BusinessRuleException ex) {
                    if ("DUPLICATE_CHARGE".equals(ex.getErrorCode())) {
                        duplicateBlockedCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(10, TimeUnit.SECONDS));
        executor.shutdown();

        assertEquals(1, successCount.get(), "Exactly one concurrent thread must succeed in creating FolioItem");
        assertEquals(1, duplicateBlockedCount.get(), "The other concurrent thread must be rejected by duplicate check");

        // Exactly one FolioItem recorded for this meal order
        long itemsForOrder = folioItemRepository.findAll()
                .stream()
                .filter(i -> mealOrderId.equals(i.getSourceMealOrderId()))
                .count();
        assertEquals(1, itemsForOrder, "Database must contain exactly 1 FolioItem for the meal order");
    }

    // ========================================================================
    // FOLIO-M4-11: Included Daily Meal order cannot be charged to Folio
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-11: Included DAILY_MEAL orders are rejected from extra folio billing")
    void testFolioM411_IncludedDailyMealCannotBeBilledAsExtra() {
        MealOrderEntity dailyOrder = new MealOrderEntity(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "BREAKFAST",
                FnbOrderType.DAILY_MEAL,
                FnbOrderStatus.PENDING,
                LocalDateTime.now(),
                "Included Package Breakfast"
        );
        dailyOrder = mealOrderRepository.save(dailyOrder);

        PostChargeRequestDTO req = new PostChargeRequestDTO();
        req.setRetreatBookingId(bookingA.getRetreatBookingId().longValue());
        req.setChargeCategory("FNB");
        req.setSourceMealOrderId(dailyOrder.getId().longValue());
        req.setAmount(new BigDecimal("100000.00"));
        req.setDescription("Illegal charge for included meal");

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.postFolioCharge(req)
        );
        assertEquals("CANNOT_CHARGE_INCLUDED_SERVICE", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("included in the retreat package"));
    }

    // ========================================================================
    // FOLIO-M4-12: Unposted orders query returns only unposted orders
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-12: listUnpostedAlaCarteOrders excludes orders that are already posted to Folio")
    void testFolioM412_UnpostedOrdersQueryExcludesPostedOrders() {
        // Place an à la carte order (initially unposted in PENDING state)
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Posted order",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        assertFalse(folioStatusPort.isMealOrderPostedToFolio(response.id()));

        // Before delivery: order appears in unposted list
        List<MealOrderResponse> unpostedBefore = mealOrderService.listUnpostedAlaCarteOrders(bookingA.getRetreatBookingId());
        assertTrue(unpostedBefore.stream().anyMatch(o -> o.id().equals(response.id())),
                "Order in PENDING state must be present in unposted list");

        // Deliver the order -> posts charge
        fnbFolioEventListener.onAlaCarteOrderDelivered(new AlaCarteOrderDeliveredEvent(
                response.id(), bookingA.getRetreatBookingId(), response.subtotal(), LocalDateTime.now()
        ));
        assertTrue(folioStatusPort.isMealOrderPostedToFolio(response.id()));

        // After delivery: order is excluded from unposted list
        List<MealOrderResponse> unpostedAfter = mealOrderService.listUnpostedAlaCarteOrders(bookingA.getRetreatBookingId());
        assertFalse(unpostedAfter.stream().anyMatch(o -> o.id().equals(response.id())),
                "Delivered order posted to Folio must not appear in unposted orders list");
    }

    // ========================================================================
    // FOLIO-M4-13: Transactional duplicate event replay does not poison transaction
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-13: Replaying duplicate event inside active transaction commits cleanly without UnexpectedRollbackException")
    void testFolioM413_TransactionalDuplicateEventReplayCommitsSuccessfully() {
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Transactional replay test",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        Integer orderId = response.id();

        AlaCarteOrderDeliveredEvent deliveryEvent = new AlaCarteOrderDeliveredEvent(
                orderId, bookingA.getRetreatBookingId(), new BigDecimal("120000.00"), LocalDateTime.now()
        );

        // Initial delivery
        fnbFolioEventListener.onAlaCarteOrderDelivered(deliveryEvent);

        // Execute replay of delivery event inside an active transaction and ensure it commits cleanly
        Boolean commitSuccess = txTemplate.execute(status -> {
            fnbFolioEventListener.onAlaCarteOrderDelivered(deliveryEvent);
            assertFalse(status.isRollbackOnly(), "Transaction must NOT be marked rollback-only after idempotent duplicate processing");
            return true;
        });

        assertTrue(Boolean.TRUE.equals(commitSuccess), "Transaction must commit successfully");

        // Verify exactly one FolioItem exists
        long count = folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream().filter(i -> Long.valueOf(orderId).equals(i.getSourceMealOrderId())).count();
        assertEquals(1, count, "Exactly one FolioItem must exist for the meal order");

        // Verify meal order remains persisted in valid state
        MealOrderEntity persistedOrder = mealOrderRepository.findById(orderId).orElseThrow();
        assertNotNull(persistedOrder);
        assertEquals(bookingA.getRetreatBookingId(), persistedOrder.getRetreatBookingId());
    }

    // ========================================================================
    // FOLIO-M4-14: Checkout calculation after order cancellation documents ledger behavior
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-14: Checkout invoice calculation does not charge guest for cancelled orders")
    void testFolioM414_CheckoutCalculationDoesNotChargeForCancelledOrder() {
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Order to be cancelled before delivery",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1)) // 120,000
        );

        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        Integer orderId = response.id();

        // Under policy HSWRMS-FNB-FIN-POLICY-01: zero charges on order placement
        assertFalse(folioItemRepository.existsBySourceMealOrderId(orderId.longValue()));

        // Cancel the order
        mealOrderService.updateStatus(orderId, "CANCELLED");

        // Billing guard passes because order is CANCELLED (not PENDING, PREPARING, or READY)
        assertDoesNotThrow(() -> folioBillingService.validateBillingGuard(bookingA.getRetreatBookingId()));

        // Calculate checkout invoice
        List<FolioItemEntity> items = folioItemRepository.findByFolioId(folioA.getFolioId());
        InvoiceCalculation calc = folioBillingService.calculateInvoiceAmounts(bookingA, items);

        // Verify fnbCharges is 0 for this booking (no cancelled charges on bill)
        assertEquals(0, BigDecimal.ZERO.compareTo(calc.fnbCharges()),
                "Cancelled order must not add any F&B charges to guest invoice");
    }

    // ========================================================================
    // FOLIO-M4-15: Attempting to place order on completed booking is rejected
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-15: Attempting to place order on completed booking is rejected")
    void testFolioM415_CompletedBookingRejectsNewOrder() {
        bookingA.setBookingStatus("COMPLETED");
        retreatBookingRepository.save(bookingA);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Order on completed booking",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request)
        );
        assertEquals("BOOKING_COMPLETED", ex.getErrorCode());
    }

    // ========================================================================
    // FOLIO-M4-16: Checkout guard blocks active F&B orders and provides details
    // ========================================================================
    @Test
    @DisplayName("FOLIO-M4-16: Checkout guard blocks active F&B orders and provides outstanding order details")
    void testFolioM416_CheckoutGuardBlocksActiveOrdersWithDetails() {
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Active in-flight order",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);

        // Billing guard must block checkout because order is PENDING
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.validateBillingGuard(bookingA.getRetreatBookingId())
        );
        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Order #" + response.id()));
        assertTrue(ex.getMessage().contains("PENDING"));
        assertTrue(ex.getMessage().contains("Settle or cancel before checkout"));
    }


    // ========================================================================
    // WP13-01: Checkout with PENDING order is blocked
    // ========================================================================
    @Test
    @DisplayName("WP13-01: Finalize checkout is blocked when a PENDING meal order exists")
    void testWP13_01_CheckoutWithPendingOrderBlocked() {
        bookingA.setBookingStatus("CHECKED_IN");
        retreatBookingRepository.save(bookingA);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Pending order",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );
        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);

        InvoiceEntity invoice = invoiceRepository.findByFolioId(folioA.getFolioId())
                .orElseGet(() -> invoiceRepository.save(new InvoiceEntity(folioA, "INV-WP13-01-" + folioA.getFolioId(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "DRAFT")));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                checkoutService.finalizeCheckout(invoice.getInvoiceId())
        );
        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Order #" + response.id()));
        assertTrue(ex.getMessage().contains("PENDING"));
    }

    // ========================================================================
    // WP13-02: Checkout with PREPARING order is blocked
    // ========================================================================
    @Test
    @DisplayName("WP13-02: Finalize checkout is blocked when a PREPARING meal order exists")
    void testWP13_02_CheckoutWithPreparingOrderBlocked() {
        bookingA.setBookingStatus("CHECKED_IN");
        retreatBookingRepository.save(bookingA);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Preparing order",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );
        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        advancePastGracePeriod(response.id());
        mealOrderService.updateStatus(response.id(), "PREPARING");

        InvoiceEntity invoice = invoiceRepository.findByFolioId(folioA.getFolioId())
                .orElseGet(() -> invoiceRepository.save(new InvoiceEntity(folioA, "INV-WP13-02-" + folioA.getFolioId(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "DRAFT")));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                checkoutService.finalizeCheckout(invoice.getInvoiceId())
        );
        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Order #" + response.id()));
        assertTrue(ex.getMessage().contains("PREPARING"));
    }

    // ========================================================================
    // WP13-03: Checkout with READY order is blocked
    // ========================================================================
    @Test
    @DisplayName("WP13-03: Finalize checkout is blocked when a READY meal order exists")
    void testWP13_03_CheckoutWithReadyOrderBlocked() {
        bookingA.setBookingStatus("CHECKED_IN");
        retreatBookingRepository.save(bookingA);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Ready order",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );
        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        advancePastGracePeriod(response.id());
        mealOrderService.updateStatus(response.id(), "PREPARING");
        mealOrderService.updateStatus(response.id(), "READY");

        InvoiceEntity invoice = invoiceRepository.findByFolioId(folioA.getFolioId())
                .orElseGet(() -> invoiceRepository.save(new InvoiceEntity(folioA, "INV-WP13-03-" + folioA.getFolioId(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "DRAFT")));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                checkoutService.finalizeCheckout(invoice.getInvoiceId())
        );
        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Order #" + response.id()));
        assertTrue(ex.getMessage().contains("READY"));
    }

    // ========================================================================
    // WP13-04: Checkout with DELIVERED order is allowed once charges are settled
    // ========================================================================
    @Test
    @DisplayName("WP13-04: Finalize checkout is allowed when meal order is DELIVERED and settled")
    void testWP13_04_CheckoutWithDeliveredOrderAllowed() {
        bookingA.setBookingStatus("CHECKED_IN");
        retreatBookingRepository.save(bookingA);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Delivered order",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );
        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        Integer orderId = response.id();

        // Deliver order via KDS service
        advancePastGracePeriod(orderId);
        kdsOrderService.updateOrderStatus(orderId.longValue(), new UpdateOrderStatusRequest("PREPARING", null), guestUserA.getUserId(), true);
        kdsOrderService.updateOrderStatus(orderId.longValue(), new UpdateOrderStatusRequest("READY", null), guestUserA.getUserId(), true);
        kdsOrderService.updateOrderStatus(orderId.longValue(), new UpdateOrderStatusRequest("DELIVERED", null), guestUserA.getUserId(), true);

        // Verify FolioItem was created
        assertTrue(folioItemRepository.existsBySourceMealOrderId(orderId.longValue()));

        // Generate invoice and settle all charges (package outstanding + extra F&B + tax)
        InvoiceResponseDTO invoiceDto = folioBillingService.generateConsolidatedInvoice(bookingA.getRetreatBookingId());
        Long invoiceId = invoiceDto.invoiceId();

        // Settle the invoice in full
        PaymentRequestDTO paymentReq = new PaymentRequestDTO();
        paymentReq.setAmount(invoiceDto.finalAmount());
        paymentReq.setPaymentMethod("CASH");
        paymentReq.setTransactionReference("SETTLE-DELIVERED-" + orderId);
        checkoutService.processPayment(invoiceId, paymentReq, true);

        // Finalize checkout must succeed
        FinalizeCheckoutResponseDTO checkoutRes = checkoutService.finalizeCheckout(invoiceId);
        assertNotNull(checkoutRes);
        assertEquals("COMPLETED", checkoutRes.getBookingStatus());
        assertEquals("CLOSED", checkoutRes.getFolioStatus());
        assertEquals("PAID", checkoutRes.getInvoiceStatus());
    }

    // ========================================================================
    // WP13-05: Checkout with CANCELLED order is allowed (zero extra charges)
    // ========================================================================
    @Test
    @DisplayName("WP13-05: Finalize checkout is allowed when meal order is CANCELLED")
    void testWP13_05_CheckoutWithCancelledOrderAllowed() {
        bookingA.setBookingStatus("CHECKED_IN");
        retreatBookingRepository.save(bookingA);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Cancelled order",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );
        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        mealOrderService.updateStatus(response.id(), "CANCELLED");

        // Generate invoice (0 extra charges) and settle balance
        InvoiceResponseDTO invoiceDto = folioBillingService.generateConsolidatedInvoice(bookingA.getRetreatBookingId());
        Long invoiceId = invoiceDto.invoiceId();

        PaymentRequestDTO paymentReq = new PaymentRequestDTO();
        paymentReq.setAmount(invoiceDto.finalAmount());
        paymentReq.setPaymentMethod("CASH");
        paymentReq.setTransactionReference("SETTLE-CANCELLED-" + response.id());
        checkoutService.processPayment(invoiceId, paymentReq, true);

        // Finalize checkout succeeds
        FinalizeCheckoutResponseDTO checkoutRes = checkoutService.finalizeCheckout(invoiceId);
        assertNotNull(checkoutRes);
        assertEquals("COMPLETED", checkoutRes.getBookingStatus());
        assertEquals("CLOSED", checkoutRes.getFolioStatus());
    }

    // ========================================================================
    // WP13-06: Create order after Folio CLOSED is rejected
    // ========================================================================
    @Test
    @DisplayName("WP13-06: Attempting to create order after Folio is CLOSED is rejected with FOLIO_CLOSED")
    void testWP13_06_CreateOrderAfterFolioClosedRejected() {
        folioA.setFolioStatus("CLOSED");
        folioRepository.save(folioA);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Order on closed folio",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request)
        );
        assertEquals("FOLIO_CLOSED", ex.getErrorCode());
    }

    // ========================================================================
    // WP13-07: Create order after booking COMPLETED is rejected
    // ========================================================================
    @Test
    @DisplayName("WP13-07: Attempting to create order after booking is COMPLETED is rejected with BOOKING_COMPLETED")
    void testWP13_07_CreateOrderAfterBookingCompletedRejected() {
        bookingA.setBookingStatus("COMPLETED");
        retreatBookingRepository.save(bookingA);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Order on completed stay",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request)
        );
        assertEquals("BOOKING_COMPLETED", ex.getErrorCode());
    }

    // ========================================================================
    // WP13-08: Create order after invoice PAID is rejected
    // ========================================================================
    @Test
    @DisplayName("WP13-08: Attempting to create order after invoice is PAID is rejected")
    void testWP13_08_CreateOrderAfterInvoicePaidRejected() {
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folioA.getFolioId())
                .orElseGet(() -> invoiceRepository.save(new InvoiceEntity(folioA, "INV-WP13-08-" + folioA.getFolioId(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "PAID")));
        invoice.setInvoiceStatus("PAID");
        invoiceRepository.save(invoice);

        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Order on paid invoice",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request)
        );
        assertTrue("INVOICE_ALREADY_ISSUED".equals(ex.getErrorCode()) || "FOLIO_CLOSED".equals(ex.getErrorCode()));
    }

    // ========================================================================
    // WP13-09: Concurrent order placement vs checkout: No accepted unbilled order
    // ========================================================================
    @Test
    @DisplayName("WP13-09: Concurrency: Simultaneous order placement and checkout prevents unbilled order")
    void testWP13_09_ConcurrentOrderPlacementAndCheckout_NoAcceptedUnbilledOrder() throws Exception {
        bookingA.setBookingStatus("CHECKED_IN");
        retreatBookingRepository.save(bookingA);

        InvoiceResponseDTO invoiceDto = folioBillingService.generateConsolidatedInvoice(bookingA.getRetreatBookingId());
        Long invoiceId = invoiceDto.invoiceId();

        // Settle base invoice so checkout is eligible unless blocked by new order
        PaymentRequestDTO paymentReq = new PaymentRequestDTO();
        paymentReq.setAmount(invoiceDto.finalAmount());
        paymentReq.setPaymentMethod("CASH");
        paymentReq.setTransactionReference("SETTLE-CONCURRENCY-09");
        checkoutService.processPayment(invoiceId, paymentReq, true);

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        Future<String> checkoutFuture = executor.submit(() -> {
            try {
                startLatch.await();
                return txTemplate.execute(status -> {
                    checkoutService.finalizeCheckout(invoiceId);
                    return "CHECKOUT_SUCCESS";
                });
            } catch (Exception e) {
                Throwable cause = e;
                while (cause.getCause() != null && cause.getCause() != cause) {
                    cause = cause.getCause();
                }
                String errCode = cause instanceof BusinessRuleException ? ((BusinessRuleException) cause).getErrorCode() : "";
                return "CHECKOUT_FAILED: " + errCode + " - " + cause.getMessage();
            }
        });

        CreateMealOrderRequest orderReq = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Concurrent race order",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );

        Future<String> orderFuture = executor.submit(() -> {
            try {
                startLatch.await();
                return txTemplate.execute(status -> {
                    mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), orderReq);
                    return "ORDER_SUCCESS";
                });
            } catch (Exception e) {
                Throwable cause = e;
                while (cause.getCause() != null && cause.getCause() != cause) {
                    cause = cause.getCause();
                }
                String errCode = cause instanceof BusinessRuleException ? ((BusinessRuleException) cause).getErrorCode() : "";
                return "ORDER_FAILED: " + errCode + " - " + cause.getMessage();
            }
        });

        // Trigger simultaneous execution
        startLatch.countDown();

        String checkoutResult = checkoutFuture.get(10, TimeUnit.SECONDS);
        String orderResult = orderFuture.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // INVARIANT: At no point can BOTH checkout succeed AND order succeed without billing
        boolean checkoutSuccess = "CHECKOUT_SUCCESS".equals(checkoutResult);
        boolean orderSuccess = "ORDER_SUCCESS".equals(orderResult);

        assertFalse(checkoutSuccess && orderSuccess,
                "Checkout and order placement must not both succeed concurrently. Result: checkout=" + checkoutResult + ", order=" + orderResult);

        if (checkoutSuccess) {
            // Checkout won: folio is closed, booking is completed. Order must have been rejected.
            assertTrue(orderResult.contains("FOLIO_CLOSED") || orderResult.contains("BOOKING_COMPLETED"),
                    "Rejected order must report closed folio or completed booking. Got: " + orderResult);
            List<MealOrderEntity> unsettled = mealOrderRepository.findUnsettledOrdersForBooking(bookingA.getRetreatBookingId());
            assertTrue(unsettled.isEmpty(), "Zero unsettled orders must exist if checkout succeeded");
        } else {
            // Order won: order is pending. Checkout must have been blocked by billing guard.
            assertTrue(checkoutResult.contains("UNSETTLED_SERVICE_ORDERS"),
                    "Blocked checkout must report unsettled dining order. Got: " + checkoutResult);
        }
    }

    // ========================================================================
    // WP13-10: Concurrent delivery and checkout: No omitted delivered charge
    // ========================================================================
    @Test
    @DisplayName("WP13-10: Concurrency: Simultaneous delivery and checkout guarantees consistent billing")
    void testWP13_10_ConcurrentDeliveryAndCheckout_NoOmittedDeliveredCharge() throws Exception {
        bookingA.setBookingStatus("CHECKED_IN");
        retreatBookingRepository.save(bookingA);

        CreateMealOrderRequest orderReq = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Order to be delivered concurrently",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1)) // 120,000 VND
        );
        MealOrderResponse placedOrder = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), orderReq);
        Integer orderId = placedOrder.id();

        // Advance to READY state
        advancePastGracePeriod(orderId);
        mealOrderService.updateStatus(orderId, "PREPARING");
        mealOrderService.updateStatus(orderId, "READY");

        InvoiceEntity invoice = invoiceRepository.findByFolioId(folioA.getFolioId())
                .orElseGet(() -> invoiceRepository.save(new InvoiceEntity(folioA, "INV-WP13-10-" + folioA.getFolioId(), BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, "DRAFT")));
        Long invoiceId = invoice.getInvoiceId();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch startLatch = new CountDownLatch(1);
        TransactionTemplate txTemplate = new TransactionTemplate(transactionManager);
        txTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);

        Future<String> deliveryFuture = executor.submit(() -> {
            try {
                startLatch.await();
                return txTemplate.execute(status -> {
                    kdsOrderService.updateOrderStatus(orderId.longValue(), new UpdateOrderStatusRequest("DELIVERED", null), guestUserA.getUserId(), true);
                    return "DELIVERY_SUCCESS";
                });
            } catch (Exception e) {
                Throwable cause = e;
                while (cause.getCause() != null && cause.getCause() != cause) {
                    cause = cause.getCause();
                }
                String errCode = cause instanceof BusinessRuleException ? ((BusinessRuleException) cause).getErrorCode() : "";
                return "DELIVERY_FAILED: " + errCode + " - " + cause.getMessage();
            }
        });

        Future<String> checkoutFuture = executor.submit(() -> {
            try {
                startLatch.await();
                return txTemplate.execute(status -> {
                    checkoutService.finalizeCheckout(invoiceId);
                    return "CHECKOUT_SUCCESS";
                });
            } catch (Exception e) {
                Throwable cause = e;
                while (cause.getCause() != null && cause.getCause() != cause) {
                    cause = cause.getCause();
                }
                String errCode = cause instanceof BusinessRuleException ? ((BusinessRuleException) cause).getErrorCode() : "";
                return "CHECKOUT_FAILED: " + errCode + " - " + cause.getMessage();
            }
        });

        startLatch.countDown();

        String deliveryResult = deliveryFuture.get(10, TimeUnit.SECONDS);
        String checkoutResult = checkoutFuture.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        // INVARIANT: An order delivered concurrently must NEVER be omitted from billing
        boolean deliverySuccess = "DELIVERY_SUCCESS".equals(deliveryResult);
        boolean checkoutSuccess = "CHECKOUT_SUCCESS".equals(checkoutResult);

        // If delivery succeeded, checkout must NOT have succeeded with unpaid balance
        if (deliverySuccess) {
            assertFalse(checkoutSuccess,
                    "Checkout must NOT complete while newly delivered charge remains unpaid! Checkout result: " + checkoutResult);
            assertTrue(checkoutResult.contains("UNPAID_CHARGES_REMAIN") || checkoutResult.contains("UNSETTLED_SERVICE_ORDERS"),
                    "Checkout must be blocked by unpaid charges or billing guard. Got: " + checkoutResult);
        } else {
            // If delivery failed, checkout completed first, so folio was closed
            assertTrue(checkoutSuccess);
            assertTrue(deliveryResult.contains("FOLIO_CLOSED") || deliveryResult.contains("INVOICE_ALREADY_ISSUED"),
                    "Failed delivery must report closed folio or issued invoice. Got: " + deliveryResult);
        }
    }

    // ========================================================================
    // WP13-11: Duplicate delivery event yields exactly one Folio charge
    // ========================================================================
    @Test
    @DisplayName("WP13-11: Duplicate delivery event yields exactly one Folio charge (idempotency)")
    void testWP13_11_DuplicateDeliveryEvent_ExactlyOneFolioCharge() {
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "DINNER",
                "Duplicate delivery test",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );
        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        Integer orderId = response.id();

        AlaCarteOrderDeliveredEvent deliveryEvent = new AlaCarteOrderDeliveredEvent(
                orderId, bookingA.getRetreatBookingId(), new BigDecimal("120000.00"), LocalDateTime.now()
        );

        // First delivery
        fnbFolioEventListener.onAlaCarteOrderDelivered(deliveryEvent);
        assertEquals(1, folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream().filter(i -> Long.valueOf(orderId).equals(i.getSourceMealOrderId())).count());

        // Second delivery (duplicate event)
        fnbFolioEventListener.onAlaCarteOrderDelivered(deliveryEvent);
        assertEquals(1, folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream().filter(i -> Long.valueOf(orderId).equals(i.getSourceMealOrderId())).count());

        // Third delivery via idempotent direct API
        PostChargeRequestDTO chargeReq = new PostChargeRequestDTO();
        chargeReq.setRetreatBookingId(bookingA.getRetreatBookingId().longValue());
        chargeReq.setChargeCategory("FNB");
        chargeReq.setSourceMealOrderId(orderId.longValue());
        chargeReq.setAmount(new BigDecimal("120000.00"));
        chargeReq.setDescription("A-la-carte dining order #" + orderId);
        assertNotNull(folioBillingService.postFolioChargeIdempotent(chargeReq));

        // Still exactly one charge
        assertEquals(1, folioItemRepository.findByFolioId(folioA.getFolioId())
                .stream().filter(i -> Long.valueOf(orderId).equals(i.getSourceMealOrderId())).count());
    }

    // ========================================================================
    // WP13-12: Failed Folio posting does not silently lose financial charge
    // ========================================================================
    @Test
    @DisplayName("WP13-12: Failed Folio posting rolls back delivery; order remains READY and recoverable")
    void testWP13_12_FailedFolioPosting_VisibleAndRecoverable() {
        CreateMealOrderRequest request = new CreateMealOrderRequest(
                bookingA.getRetreatBookingId(),
                targetOrderDate,
                "LUNCH",
                "Order to fail delivery",
                List.of(new CreateMealOrderLineRequest(herbalTeaItem.getId(), 1))
        );
        MealOrderResponse response = mealOrderService.placeAlaCarteOrder(guestUserA.getUserId(), request);
        Integer orderId = response.id();

        advancePastGracePeriod(orderId);
        mealOrderService.updateStatus(orderId, "PREPARING");
        mealOrderService.updateStatus(orderId, "READY");

        // Close the folio in advance so posting charge will fail
        folioA.setFolioStatus("CLOSED");
        folioRepository.save(folioA);

        // Attempting to deliver must fail with FOLIO_CLOSED
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                kdsOrderService.updateOrderStatus(orderId.longValue(), new UpdateOrderStatusRequest("DELIVERED", null), guestUserA.getUserId(), true)
        );
        assertEquals("FOLIO_CLOSED", ex.getErrorCode());

        // Because updateOrderStatus is @Transactional, the rollback must keep order in READY status
        MealOrderEntity orderInDb = mealOrderRepository.findById(orderId).orElseThrow();
        assertEquals("READY", orderInDb.getOrderStatus(),
                "Order must remain in READY status upon failed folio charge posting (transaction rollback)");

        // Assert no corrupted folio items exist
        assertFalse(folioItemRepository.existsBySourceMealOrderId(orderId.longValue()));
    }

}
