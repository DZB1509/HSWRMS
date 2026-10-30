package com.heavenstay.hswrms.m5billing;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
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
import com.heavenstay.hswrms.m4fnb.dto.UpdateOrderStatusRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMealOrderLineRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMealOrderRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderResponse;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import com.heavenstay.hswrms.m4fnb.entity.Ingredient;
import com.heavenstay.hswrms.m4fnb.entity.IngredientBatch;
import com.heavenstay.hswrms.m4fnb.entity.MenuItemIngredient;
import com.heavenstay.hswrms.m4fnb.repository.IngredientBatchRepository;
import com.heavenstay.hswrms.m4fnb.repository.IngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemIngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m4fnb.service.FnbKdsOrderService;
import com.heavenstay.hswrms.m4fnb.service.MealOrderService;
import com.heavenstay.hswrms.m5billing.dto.*;
import com.heavenstay.hswrms.m5billing.entity.CreditNoteEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.repository.*;
import com.heavenstay.hswrms.m5billing.service.AdjustmentService;
import com.heavenstay.hswrms.m5billing.service.CheckoutService;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
public class AdjustmentServiceTest {

    @Autowired
    private AdjustmentService adjustmentService;

    @Autowired
    private AdjustmentRequestRepository adjustmentRequestRepository;

    @Autowired
    private CreditNoteRepository creditNoteRepository;

    @Autowired
    private FolioBillingService folioBillingService;

    @Autowired
    private CheckoutService checkoutService;

    @Autowired
    private MealOrderService mealOrderService;

    @Autowired
    private FnbKdsOrderService kdsOrderService;

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
    private MenuItemRepository menuItemRepository;

    @Autowired
    private IngredientRepository ingredientRepository;

    @Autowired
    private IngredientBatchRepository batchRepository;

    @Autowired
    private MenuItemIngredientRepository recipeRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    private User guestUser;
    private User staffRequester;
    private User managerApprover;
    private User adminApprover;
    private RetreatBooking booking;
    private FolioEntity folio;
    private MenuItem herbalTea;

    @BeforeEach
    void setUp() {
        long timestamp = System.currentTimeMillis();

        guestUser = new User();
        guestUser.setEmail("guest.adj." + timestamp + "@heavenstay.com");
        guestUser.setPasswordHash("hashed_pw");
        guestUser.setFullName("Guest Adjuster " + timestamp);
        guestUser.setAccountStatus("ACTIVE");
        guestUser = userRepository.save(guestUser);

        CustomerProfile profile = new CustomerProfile();
        profile.setUser(guestUser);
        profile = customerProfileRepository.save(profile);

        HealthProfile health = new HealthProfile();
        health.setCustomerProfile(profile);
        health.setAllergies("none");
        health.setDietaryRequirements("standard");
        healthProfileRepository.save(health);

        staffRequester = new User();
        staffRequester.setEmail("staff." + timestamp + "@heavenstay.com");
        staffRequester.setPasswordHash("hashed_pw");
        staffRequester.setFullName("Staff Member " + timestamp);
        staffRequester.setAccountStatus("ACTIVE");
        staffRequester = userRepository.save(staffRequester);

        managerApprover = new User();
        managerApprover.setEmail("manager." + timestamp + "@heavenstay.com");
        managerApprover.setPasswordHash("hashed_pw");
        managerApprover.setFullName("Manager " + timestamp);
        managerApprover.setAccountStatus("ACTIVE");
        managerApprover = userRepository.save(managerApprover);

        adminApprover = new User();
        adminApprover.setEmail("admin." + timestamp + "@heavenstay.com");
        adminApprover.setPasswordHash("hashed_pw");
        adminApprover.setFullName("Admin " + timestamp);
        adminApprover.setAccountStatus("ACTIVE");
        adminApprover = userRepository.save(adminApprover);

        VillaCategory category = new VillaCategory();
        category.setCategoryName("Adjustment Suite " + timestamp);
        category.setMaxOccupancy(2);
        category.setPriceModifier(BigDecimal.ZERO);
        category.setCategoryStatus("ACTIVE");
        category.setInventoryCount(5);
        category.setBedroomCount(1);
        category = villaCategoryRepository.save(category);

        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaNumber("Villa #ADJ-" + (timestamp % 1000));
        villa.setVillaCategory(category);
        villa.setVillaStatus("AVAILABLE");
        villa = physicalVillaRepository.save(villa);

        RetreatPackage retreatPackage = new RetreatPackage();
        retreatPackage.setPackageCode("PKG-ADJ-" + timestamp);
        retreatPackage.setPackageName("Wellness Relaxation");
        retreatPackage.setDurationNights(3);
        retreatPackage.setBasePrice(new BigDecimal("20000000"));
        retreatPackage.setPackageStatus("ACTIVE");
        retreatPackage = retreatPackageRepository.save(retreatPackage);

        RetreatBooking b = new RetreatBooking();
        b.setCustomerProfileId(profile.getCustomerProfileId());
        b.setRetreatPackage(retreatPackage);
        b.setRequestedVillaCategory(category);
        b.setAssignedVilla(villa);
        b.setCheckInDate(LocalDate.now());
        b.setCheckOutDate(LocalDate.now().plusDays(3));
        b.setBookingStatus("CONFIRMED");
        b.setDepositAmount(new BigDecimal("5000000"));
        b.setTotalEstimatedAmount(new BigDecimal("20000000"));
        booking = retreatBookingRepository.save(b);

        folio = new FolioEntity(booking);
        folio.setTotalPaid(new BigDecimal("5000000"));
        folio = folioRepository.save(folio);

        FolioItemEntity pkgCharge = new FolioItemEntity(
                folio, "PACKAGE", "Retreat Accommodation", new BigDecimal("20000000"),
                booking.getRetreatBookingId().longValue(), null, null
        );
        folioItemRepository.save(pkgCharge);
        folio.addItem(pkgCharge);
        folio = folioRepository.save(folio);

        PaymentTransactionEntity dep = new PaymentTransactionEntity(
                booking, null, "DEPOSIT", "VNPAY", "TXN-DEP-ADJ-" + timestamp, new BigDecimal("5000000.00"), "SUCCESSFUL"
        );
        paymentTransactionRepository.save(dep);

        // Usable Ingredient Stock for Menu Item
        Ingredient mint = ingredientRepository.save(new Ingredient("Fresh Organic Mint " + timestamp));
        batchRepository.save(new IngredientBatch(mint.getId(), LocalDate.now().minusDays(1),
                LocalDate.now().plusDays(30), new BigDecimal("5000.000"), "FRESH"));

        herbalTea = menuItemRepository.save(new MenuItem(
                "Artisan Ginger Tea " + timestamp, "BEVERAGE", "ALL_DAY",
                new BigDecimal("120000.00"), "vegan", null, "AVAILABLE"
        ));
        recipeRepository.save(new MenuItemIngredient(herbalTea.getId(), mint.getId(), new BigDecimal("10.000")));
    }

    private MealOrderResponse createAndDeliverOrder() {
        CreateMealOrderRequest req = new CreateMealOrderRequest(
                booking.getRetreatBookingId(),
                LocalDate.now(),
                "LUNCH",
                "Please deliver hot to villa",
                List.of(new CreateMealOrderLineRequest(herbalTea.getId(), 1))
        );

        MealOrderResponse placed = mealOrderService.placeAlaCarteOrder(guestUser.getUserId(), req);
        kdsOrderService.updateOrderStatus(placed.id().longValue(), new UpdateOrderStatusRequest("PREPARING", null), guestUser.getUserId(), true);
        kdsOrderService.updateOrderStatus(placed.id().longValue(), new UpdateOrderStatusRequest("READY", null), guestUser.getUserId(), true);
        kdsOrderService.updateOrderStatus(placed.id().longValue(), new UpdateOrderStatusRequest("DELIVERED", null), guestUser.getUserId(), true);
        return placed;
    }

    // 1. Cancelled order before delivery produces no Folio charge
    @Test
    @DisplayName("WP1B-01: Cancelled order before delivery produces no Folio charge")
    void test01_cancelledOrderBeforeDeliveryProducesNoFolioCharge() {
        CreateMealOrderRequest req = new CreateMealOrderRequest(
                booking.getRetreatBookingId(),
                LocalDate.now(),
                "DINNER",
                "Please deliver hot",
                List.of(new CreateMealOrderLineRequest(herbalTea.getId(), 1))
        );

        MealOrderResponse placed = mealOrderService.placeAlaCarteOrder(guestUser.getUserId(), req);
        kdsOrderService.updateOrderStatus(placed.id().longValue(), new UpdateOrderStatusRequest("PREPARING", null), guestUser.getUserId(), true);
        kdsOrderService.updateOrderStatus(placed.id().longValue(), new UpdateOrderStatusRequest("CANCELLED", "Customer cancelled before ready"), guestUser.getUserId(), true);

        assertFalse(folioItemRepository.existsBySourceMealOrderId(placed.id().longValue()),
                "Cancelled order before delivery must not produce a Folio charge.");
    }

    // 2. Delivered order creates exactly one Folio charge
    @Test
    @DisplayName("WP1B-02: Delivered order creates exactly one Folio charge")
    void test02_deliveredOrderCreatesExactlyOneFolioCharge() {
        MealOrderResponse order = createAndDeliverOrder();
        List<FolioItemEntity> items = folioItemRepository.findByFolioId(folio.getFolioId());
        long fnbCount = items.stream().filter(i -> "FNB".equalsIgnoreCase(i.getChargeCategory()) && order.id().longValue() == i.getSourceMealOrderId()).count();
        assertEquals(1, fnbCount, "Delivered order must create exactly one Folio charge.");
    }

    // 3. Adjustment request references the correct original charge
    @Test
    @DisplayName("WP1B-03: Adjustment request references the correct original charge")
    void test03_adjustmentRequestReferencesCorrectOriginalCharge() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Guest reported insect in tea", new BigDecimal("120000"));
        AdjustmentResponseDTO res = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        assertNotNull(res.getAdjustmentRequestId());
        assertEquals(item.getFolioItemId(), res.getFolioItemId());
        assertEquals("PENDING_APPROVAL", res.getStatus());
        assertEquals(new BigDecimal("120000"), res.getRequestedAmount());
        assertEquals("VOID", res.getAdjustmentType());
    }

    // 4. Invalid charge reference is rejected
    @Test
    @DisplayName("WP1B-04: Invalid charge reference is rejected")
    void test04_invalidChargeReferenceIsRejected() {
        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(999999L, "Invalid charge test", new BigDecimal("100000"));
        assertThrows(ResourceNotFoundException.class, () ->
                adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue()));
    }

    // 5. Adjustment amount exceeding remaining balance is rejected
    @Test
    @DisplayName("WP1B-05: Adjustment amount exceeding remaining balance is rejected")
    void test05_adjustmentAmountExceedingRemainingBalanceIsRejected() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Overcharge request", new BigDecimal("500000"));
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue()));
        assertEquals("EXCEEDS_ADJUSTABLE_AMOUNT", ex.getErrorCode());
    }

    // 6. Requester cannot approve their own request
    @Test
    @DisplayName("WP1B-06: Requester cannot approve their own request (Separation of Duties)")
    void test06_requesterCannotApproveTheirOwnRequest() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Staff self-approval attempt", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, managerApprover.getUserId().longValue());

        AdjustmentDecisionDTO decision = new AdjustmentDecisionDTO("APPROVE", null);
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(), decision,
                        managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER")));
        assertEquals("SEPARATION_OF_DUTIES_VIOLATION", ex.getErrorCode());
    }

    // 7. Unauthorized user cannot approve or reject
    @Test
    @DisplayName("WP1B-07: Unauthorized user cannot approve or reject")
    void test07_unauthorizedUserCannotApproveOrReject() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Guest dissatisfaction", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        AdjustmentDecisionDTO decision = new AdjustmentDecisionDTO("APPROVE", null);
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(), decision,
                        guestUser.getUserId().longValue(), List.of("ROLE_CUSTOMER", "ROLE_RECEPTIONIST")));
        assertEquals("UNAUTHORIZED_APPROVER", ex.getErrorCode());
    }

    // 8. Manager can approve a valid request
    @Test
    @DisplayName("WP1B-08: Manager can approve a valid request")
    void test08_managerCanApproveValidRequest() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Valid tea issue", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        AdjustmentDecisionDTO decision = new AdjustmentDecisionDTO("APPROVE", null);
        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(), decision,
                managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));

        assertEquals("APPROVED", approved.getStatus());
        assertEquals(managerApprover.getUserId().longValue(), approved.getApprovedByUserId());
        assertNotNull(approved.getApprovedAt());
    }

    // 9. Manager can reject a request with a mandatory reason
    @Test
    @DisplayName("WP1B-09: Manager can reject a request with a mandatory reason")
    void test09_managerCanRejectRequestWithMandatoryReason() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Unverified complaint", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        // Rejection without reason fails
        AdjustmentDecisionDTO noReason = new AdjustmentDecisionDTO("REJECT", "");
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(), noReason,
                        managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER")));
        assertEquals("REJECTION_REASON_REQUIRED", ex.getErrorCode());

        // Rejection with reason succeeds
        AdjustmentDecisionDTO withReason = new AdjustmentDecisionDTO("REJECT", "Customer finished the whole pot without complaint");
        AdjustmentResponseDTO rejected = adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(), withReason,
                managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));

        assertEquals("REJECTED", rejected.getStatus());
        assertEquals("Customer finished the whole pot without complaint", rejected.getRejectionReason());
    }

    // 10. Pending request does not change financial balances
    @Test
    @DisplayName("WP1B-10: Pending request does not change financial balances")
    void test10_pendingRequestDoesNotChangeFinancialBalances() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        FolioEntity folioBefore = folioRepository.findById(folio.getFolioId()).orElseThrow();
        BigDecimal totalBefore = folioBefore.getTotalCharges();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Complaint pending investigation", new BigDecimal("120000"));
        adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        FolioEntity folioAfter = folioRepository.findById(folio.getFolioId()).orElseThrow();
        assertEquals(totalBefore, folioAfter.getTotalCharges(), "Pending request must not change Folio total charges.");
    }

    // 11. Rejected request does not change financial balances
    @Test
    @DisplayName("WP1B-11: Rejected request does not change financial balances")
    void test11_rejectedRequestDoesNotChangeFinancialBalances() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        FolioEntity folioBefore = folioRepository.findById(folio.getFolioId()).orElseThrow();
        BigDecimal totalBefore = folioBefore.getTotalCharges();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Complaint rejected", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("REJECT", "Invalid complaint"), managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));

        FolioEntity folioAfter = folioRepository.findById(folio.getFolioId()).orElseThrow();
        assertEquals(totalBefore, folioAfter.getTotalCharges(), "Rejected request must leave Folio total charges unchanged.");
    }

    // 12. Approved void preserves the original charge
    @Test
    @DisplayName("WP1B-12: Approved void preserves the original charge")
    void test12_approvedVoidPreservesOriginalCharge() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Spilled tea by server", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null), managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));

        FolioItemEntity persistedItem = folioItemRepository.findById(item.getFolioItemId()).orElseThrow();
        assertNotNull(persistedItem, "Original charge record must never be deleted.");
        assertTrue(persistedItem.isVoided(), "Charge must be marked as voided.");
        assertEquals(created.getAdjustmentRequestId(), persistedItem.getVoidedAdjustmentRequestId());
        assertEquals(new BigDecimal("120000.00"), persistedItem.getAmount());
    }

    // 13. Approved void updates outstanding balance exactly once
    @Test
    @DisplayName("WP1B-13: Approved void updates outstanding balance exactly once")
    void test13_approvedVoidUpdatesOutstandingBalanceExactlyOnce() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        FolioEntity fBefore = folioRepository.findById(folio.getFolioId()).orElseThrow();
        BigDecimal chargesBefore = fBefore.getTotalCharges();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Item returned", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null), managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));

        FolioEntity fAfter = folioRepository.findById(folio.getFolioId()).orElseThrow();
        BigDecimal expectedCharges = chargesBefore.subtract(new BigDecimal("120000.00"));
        assertEquals(expectedCharges, fAfter.getTotalCharges(), "Outstanding charges must decrease by exactly the voided amount.");
    }

    // 14. Issued invoice remains unchanged after Credit Note issuance
    @Test
    @DisplayName("WP1B-14: Issued invoice remains unchanged after Credit Note issuance")
    void test14_issuedInvoiceRemainsUnchangedAfterCreditNoteIssuance() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        // Generate and issue invoice
        InvoiceResponseDTO generated = folioBillingService.generateConsolidatedInvoice(booking.getRetreatBookingId());
        InvoiceEntity invoice = invoiceRepository.findById(generated.invoiceId()).orElseThrow();
        invoice.setInvoiceStatus("ISSUED");
        invoice = invoiceRepository.save(invoice);

        BigDecimal originalSubtotal = invoice.getSubtotalAmount();
        BigDecimal originalTax = invoice.getTaxAmount();
        BigDecimal originalFinal = invoice.getFinalAmount();

        // Submit adjustment request after invoice issuance (will be CREDIT_NOTE)
        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Customer returned cold soup", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());
        assertEquals("CREDIT_NOTE", created.getAdjustmentType());

        adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null), managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));

        // Verify original invoice is unchanged
        InvoiceEntity invoiceAfter = invoiceRepository.findById(invoice.getInvoiceId()).orElseThrow();
        assertEquals(originalSubtotal, invoiceAfter.getSubtotalAmount(), "Subtotal on issued invoice must not mutate.");
        assertEquals(originalTax, invoiceAfter.getTaxAmount(), "Tax on issued invoice must not mutate.");
        assertEquals(originalFinal, invoiceAfter.getFinalAmount(), "Final amount on issued invoice must not mutate.");
    }

    // 15. Credit Note references the correct original invoice and charge
    @Test
    @DisplayName("WP1B-15: Credit Note references the correct original invoice and charge")
    void test15_creditNoteReferencesCorrectOriginalInvoiceAndCharge() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        InvoiceResponseDTO generated = folioBillingService.generateConsolidatedInvoice(booking.getRetreatBookingId());
        InvoiceEntity invoice = invoiceRepository.findById(generated.invoiceId()).orElseThrow();
        invoice.setInvoiceStatus("ISSUED");
        invoice = invoiceRepository.save(invoice);

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Faulty dish credit", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        AdjustmentResponseDTO approved = adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null), managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));

        assertNotNull(approved.getCreditNoteId());
        assertNotNull(approved.getCreditNoteNumber());
        assertTrue(approved.getCreditNoteNumber().startsWith("CN-"));

        CreditNoteEntity cn = creditNoteRepository.findById(approved.getCreditNoteId()).orElseThrow();
        assertEquals(invoice.getInvoiceId(), cn.getInvoice().getInvoiceId());
        assertEquals(item.getFolioItemId(), cn.getFolioItem().getFolioItemId());
        assertEquals(created.getAdjustmentRequestId(), cn.getAdjustmentRequest().getAdjustmentRequestId());
        assertEquals(new BigDecimal("120000.00"), cn.getAmount());
    }

    // 16. Credit amount cannot exceed remaining adjustable amount
    @Test
    @DisplayName("WP1B-16: Credit amount cannot exceed remaining adjustable amount")
    void test16_creditAmountCannotExceedRemainingAdjustableAmount() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        // Issue invoice first so adjustments are handled as Credit Notes
        InvoiceResponseDTO generated = folioBillingService.generateConsolidatedInvoice(booking.getRetreatBookingId());
        InvoiceEntity invoice = invoiceRepository.findById(generated.invoiceId()).orElseThrow();
        invoice.setInvoiceStatus("ISSUED");
        invoiceRepository.save(invoice);

        // 1st partial request: 80,000
        CreateAdjustmentRequestDTO req1 = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Partial adjustment 1", new BigDecimal("80000"));
        AdjustmentResponseDTO created1 = adjustmentService.submitAdjustmentRequest(req1, staffRequester.getUserId().longValue());
        adjustmentService.processAdjustmentDecision(created1.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null), managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));

        // 2nd partial request: 50,000 (80,000 + 50,000 = 130,000 > 120,000)
        CreateAdjustmentRequestDTO req2 = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Partial adjustment 2", new BigDecimal("50000"));
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                adjustmentService.submitAdjustmentRequest(req2, staffRequester.getUserId().longValue()));
        assertEquals("EXCEEDS_ADJUSTABLE_AMOUNT", ex.getErrorCode());
    }

    // 17. Duplicate approval/retry does not duplicate adjustments (Idempotent)
    @Test
    @DisplayName("WP1B-17: Duplicate approval/retry does not duplicate adjustments")
    void test17_duplicateApprovalRetryDoesNotDuplicateAdjustments() {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Retry test", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        AdjustmentResponseDTO firstApproval = adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null), managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));
        assertEquals("APPROVED", firstApproval.getStatus());

        // Second approval call returns idempotently
        AdjustmentResponseDTO secondApproval = adjustmentService.processAdjustmentDecision(created.getAdjustmentRequestId(),
                new AdjustmentDecisionDTO("APPROVE", null), managerApprover.getUserId().longValue(), List.of("ROLE_MANAGER"));
        assertEquals("APPROVED", secondApproval.getStatus());
        assertEquals(firstApproval.getAdjustmentRequestId(), secondApproval.getAdjustmentRequestId());
    }

    // 18. Concurrent approvals cannot over-adjust original charge
    @Test
    @DisplayName("WP1B-18: Concurrent approvals cannot over-adjust original charge")
    void test18_concurrentApprovalsCannotOverAdjustOriginalCharge() throws Exception {
        MealOrderResponse order = createAndDeliverOrder();
        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(order.id().longValue()).orElseThrow();

        CreateAdjustmentRequestDTO req = new CreateAdjustmentRequestDTO(item.getFolioItemId(), "Concurrent approval test", new BigDecimal("120000"));
        AdjustmentResponseDTO created = adjustmentService.submitAdjustmentRequest(req, staffRequester.getUserId().longValue());

        int threadCount = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);
        AtomicInteger successCount = new AtomicInteger(0);

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    AdjustmentResponseDTO res = adjustmentService.processAdjustmentDecision(
                            created.getAdjustmentRequestId(),
                            new AdjustmentDecisionDTO("APPROVE", null),
                            managerApprover.getUserId().longValue(),
                            List.of("ROLE_MANAGER")
                    );
                    if ("APPROVED".equals(res.getStatus())) {
                        successCount.incrementAndGet();
                    }
                } catch (Exception ignored) {
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(5, TimeUnit.SECONDS));
        executor.shutdown();

        // Exactly one approval executed, total approved adjustments == 120,000
        BigDecimal approvedTotal = adjustmentRequestRepository.sumApprovedAmountByFolioItemId(item.getFolioItemId());
        assertEquals(new BigDecimal("120000.00"), approvedTotal, "Approved total cannot exceed original item amount.");
    }

    // 19. Existing checkout guard remains functional
    @Test
    @DisplayName("WP1B-19: Existing checkout guard remains functional")
    void test19_existingCheckoutGuardRemainsFunctional() {
        CreateMealOrderRequest req = new CreateMealOrderRequest(
                booking.getRetreatBookingId(),
                LocalDate.now(),
                "DINNER",
                "Please deliver hot",
                List.of(new CreateMealOrderLineRequest(herbalTea.getId(), 1))
        );

        MealOrderResponse placed = mealOrderService.placeAlaCarteOrder(guestUser.getUserId(), req);
        kdsOrderService.updateOrderStatus(placed.id().longValue(), new UpdateOrderStatusRequest("PREPARING", null), guestUser.getUserId(), true);

        // When invoice generation or checkout is attempted, unsettled order blocks the flow per checkout guard
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.generateConsolidatedInvoice(booking.getRetreatBookingId()));
        assertEquals("UNSETTLED_SERVICE_ORDERS", ex.getErrorCode());
        assertTrue(ex.getMessage().contains("Unsettled service orders exist"),
                "Invoice generation/checkout must remain blocked by active meal orders.");
    }

    // 20. Existing F&B -> Folio integration remains functional
    @Test
    @DisplayName("WP1B-20: Existing F&B to Folio integration remains functional")
    void test20_existingFnbFolioIntegrationRemainsFunctional() {
        MealOrderResponse delivered = createAndDeliverOrder();
        assertTrue(folioItemRepository.existsBySourceMealOrderId(delivered.id().longValue()));

        FolioItemEntity item = folioItemRepository.findBySourceMealOrderId(delivered.id().longValue()).orElseThrow();
        assertEquals("FNB", item.getChargeCategory());
        assertEquals(new BigDecimal("120000.00"), item.getAmount());
    }
}
