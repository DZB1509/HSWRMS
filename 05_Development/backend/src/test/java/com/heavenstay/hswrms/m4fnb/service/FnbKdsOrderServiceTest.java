package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m4fnb.integration.BookingContextPort;
import com.heavenstay.hswrms.m4fnb.integration.DietaryProfilePort;
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
import com.heavenstay.hswrms.m4fnb.dto.*;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderItemRepository;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import com.heavenstay.hswrms.m6admin.entity.AuditLog;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.DefaultTransactionDefinition;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;

@SpringBootTest
@Transactional
public class FnbKdsOrderServiceTest {

    @Autowired
    private FnbKdsOrderService mealOrderService;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private MealOrderRepository mealOrderRepository;

    @Autowired
    private RetreatBookingRepository bookingRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private PhysicalVillaRepository physicalVillaRepository;

    @Autowired
    private RetreatPackageRepository retreatPackageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private HealthProfileRepository healthProfileRepository;

    @Autowired
    private FolioRepository folioRepository;

    @Autowired
    private FolioItemRepository folioItemRepository;

    @Autowired
    private com.heavenstay.hswrms.m6admin.repository.AuditLogRepository auditLogRepository;

    @Autowired
    private MealOrderItemRepository mealOrderItemRepository;

    @Autowired
    private FolioBillingService folioBillingService;

    @Autowired
    private BookingContextPort bookingContextPort;

    @Autowired
    private DietaryProfilePort dietaryProfilePort;

    @Autowired
    private PlatformTransactionManager transactionManager;

    private User testUser;
    private User staffUser;
    private CustomerProfile testCustomerProfile;
    private RetreatBooking testBooking;
    private MenuItem saladItem;
    private MenuItem soupItem;
    private MenuItem steakItem;
    private final LocalDate targetDate = LocalDate.now();

    @BeforeEach
    void setUp() {
        // Create test user
        testUser = new User();
        testUser.setEmail("fnb_guest_" + System.currentTimeMillis() + "@heavenstay.com");
        testUser.setPasswordHash("hashed_pw");
        testUser.setFullName("Eleanor Vance");
        testUser.setAccountStatus("ACTIVE");
        testUser = userRepository.save(testUser);

        // Create customer profile
        testCustomerProfile = new CustomerProfile();
        testCustomerProfile.setUser(testUser);
        testCustomerProfile = customerProfileRepository.save(testCustomerProfile);

        // Create staff user
        staffUser = new User();
        staffUser.setEmail("fnb_chef_" + System.currentTimeMillis() + "@heavenstay.com");
        staffUser.setPasswordHash("hashed_pw");
        staffUser.setFullName("Chef Gordon");
        staffUser.setAccountStatus("ACTIVE");
        staffUser = userRepository.save(staffUser);

        // Create villa category & physical villa
        VillaCategory cat = new VillaCategory();
        cat.setCategoryName("Wellness Sanctuary Villa");
        cat.setMaxOccupancy(2);
        cat.setPriceModifier(BigDecimal.ZERO);
        cat.setCategoryStatus("ACTIVE");
        cat.setInventoryCount(5);
        cat.setBedroomCount(1);
        cat = villaCategoryRepository.save(cat);

        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaNumber("Villa 102");
        villa.setVillaCategory(cat);
        villa.setVillaStatus("AVAILABLE");
        villa = physicalVillaRepository.save(villa);

        // Create package
        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageCode("PKG-FNB-TEST");
        pkg.setPackageName("Wellness Gourmet Retreat");
        pkg.setDurationNights(3);
        pkg.setBasePrice(BigDecimal.valueOf(1500));
        pkg.setPackageStatus("ACTIVE");
        pkg = retreatPackageRepository.save(pkg);

        // Create booking
        testBooking = new RetreatBooking();
        testBooking.setCustomerProfileId(testCustomerProfile.getCustomerProfileId());
        testBooking.setRetreatPackage(pkg);
        testBooking.setRequestedVillaCategory(cat);
        testBooking.setAssignedVilla(villa);
        testBooking.setCheckInDate(targetDate);
        testBooking.setCheckOutDate(targetDate.plusDays(3));
        testBooking.setBookingStatus("CONFIRMED");
        testBooking.setDepositAmount(BigDecimal.valueOf(500));
        testBooking.setTotalEstimatedAmount(BigDecimal.valueOf(1500));
        testBooking = bookingRepository.save(testBooking);

        // Create Folio for billing settlement
        FolioEntity folio = new FolioEntity();
        folio.setRetreatBooking(testBooking);
        folio.setFolioStatus("OPEN");
        folio.setTotalCharges(BigDecimal.ZERO);
        folio.setTotalPaid(BigDecimal.valueOf(500));
        folioRepository.save(folio);

        // Create Menu Items
        saladItem = new MenuItem("Organic Garden Salad", "STARTER", "ALL_DAY",
                BigDecimal.valueOf(120), "vegan,gluten_free", "peanuts", "AVAILABLE");
        saladItem = menuItemRepository.save(saladItem);

        soupItem = new MenuItem("Lemongrass Ginger Broth", "SOUP", "LUNCH,DINNER",
                BigDecimal.valueOf(90), "vegetarian", null, "AVAILABLE");
        soupItem = menuItemRepository.save(soupItem);

        steakItem = new MenuItem("Miso Glazed Tofu Steak", "MAIN", "DINNER",
                BigDecimal.valueOf(250), "vegan", "soy", "AVAILABLE");
        steakItem = menuItemRepository.save(steakItem);
    }

    @Test
    @DisplayName("Create Daily Meal Order successfully with status PENDING and DAILY_MEAL type")
    void testCreateDailyMealOrder_Success() {
        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(),
                targetDate,
                "LUNCH",
                List.of(saladItem.getMenuItemId(), soupItem.getMenuItemId()),
                "Low sodium please"
        );

        MealOrderDto order = mealOrderService.createDailyMealOrder(req, testUser.getUserId());

        assertNotNull(order.getMealOrderId());
        assertEquals("DAILY_MEAL", order.getOrderType());
        assertEquals("PENDING", order.getOrderStatus());
        assertEquals(2, order.getItems().size());
        assertEquals(testBooking.getRetreatBookingId(), order.getRetreatBookingId());
    }

    @Test
    @DisplayName("Update Daily Meal Order upserts when order is still PENDING")
    void testUpdateDailyMealOrder_UpsertSuccess() {
        CreateDailyMealRequest req1 = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(),
                targetDate,
                "DINNER",
                List.of(saladItem.getMenuItemId()),
                "Initial selection"
        );
        MealOrderDto initial = mealOrderService.createDailyMealOrder(req1, testUser.getUserId());

        CreateDailyMealRequest req2 = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(),
                targetDate,
                "DINNER",
                List.of(steakItem.getMenuItemId()),
                "Changed my mind to steak"
        );
        MealOrderDto updated = mealOrderService.createDailyMealOrder(req2, testUser.getUserId());

        assertEquals(initial.getMealOrderId(), updated.getMealOrderId());
        assertEquals(1, updated.getItems().size());
        assertEquals(steakItem.getMenuItemId(), updated.getItems().get(0).getMenuItemId());
    }

    @Test
    @DisplayName("Update Daily Meal Order rejected when order is already in PREPARING status")
    void testUpdateDailyMealOrder_RejectWhenPreparing() {
        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(),
                targetDate,
                "BREAKFAST",
                List.of(saladItem.getMenuItemId()),
                "Breakfast salad"
        );
        MealOrderDto order = mealOrderService.createDailyMealOrder(req, testUser.getUserId());

        // Kitchen transitions order to PREPARING
        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), 999, true);

        // Customer tries to update meal selection
        CreateDailyMealRequest updateReq = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(),
                targetDate,
                "BREAKFAST",
                List.of(soupItem.getMenuItemId()),
                "Try to change"
        );
        assertThrows(BusinessRuleException.class, () ->
                mealOrderService.createDailyMealOrder(updateReq, testUser.getUserId()));
    }

    @Test
    @DisplayName("Create A-la-carte Order calculates server-side price correctly")
    void testCreateAlaCarteOrder_Success() {
        AlaCarteItemRequest item1 = new AlaCarteItemRequest(saladItem.getMenuItemId(), 2, "Extra dressing");
        AlaCarteItemRequest item2 = new AlaCarteItemRequest(steakItem.getMenuItemId(), 1, "Well done");

        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(),
                targetDate,
                "19:30",
                "Villa 102",
                List.of(item1, item2)
        );

        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        assertNotNull(order.getMealOrderId());
        assertEquals("A_LA_CARTE", order.getOrderType());
        assertEquals("PENDING", order.getOrderStatus());
        // Price: 2 * 120 + 1 * 250 = 490
        assertEquals(0, new BigDecimal("490").compareTo(order.getTotalAmount()));
    }

    @Test
    @DisplayName("Create Order with UNAVAILABLE menu item is rejected")
    void testCreateOrder_UnavailableItem_Rejected() {
        MenuItem unavailableItem = new MenuItem("Rare Truffle Dish", "SPECIAL", "DINNER",
                BigDecimal.valueOf(500), null, null, "UNAVAILABLE");
        unavailableItem = menuItemRepository.save(unavailableItem);

        AlaCarteItemRequest item = new AlaCarteItemRequest(unavailableItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(),
                targetDate,
                "20:00",
                "Villa 102",
                List.of(item)
        );

        assertThrows(BusinessRuleException.class, () ->
                mealOrderService.createAlaCarteOrder(req, testUser.getUserId()));
    }

    @Test
    @DisplayName("Kitchen transitions order PENDING -> PREPARING -> READY -> DELIVERED")
    void testOrderLifecycle_FullProgression() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "12:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        // PENDING -> PREPARING
        MealOrderDto prep = mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), 999, true);
        assertEquals("PREPARING", prep.getOrderStatus());

        // PREPARING -> READY
        MealOrderDto ready = mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("READY", null), 999, true);
        assertEquals("READY", ready.getOrderStatus());

        // READY -> DELIVERED
        MealOrderDto delivered = mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("DELIVERED", null), 999, true);
        assertEquals("DELIVERED", delivered.getOrderStatus());

        // Verify M5 Folio charge was posted automatically for A_LA_CARTE
        assertTrue(folioItemRepository.existsBySourceMealOrderId(order.getMealOrderId()));
    }

    @Test
    @DisplayName("Delivered Daily Meal Order does NOT post extra Folio charge")
    void testDailyMeal_DeliveredDoesNotPostFolioCharge() {
        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(), targetDate, "LUNCH", List.of(saladItem.getMenuItemId()), null);
        MealOrderDto order = mealOrderService.createDailyMealOrder(req, testUser.getUserId());

        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), 999, true);
        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("READY", null), 999, true);
        MealOrderDto delivered = mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("DELIVERED", null), 999, true);

        assertEquals("DELIVERED", delivered.getOrderStatus());
        assertFalse(folioItemRepository.existsBySourceMealOrderId(order.getMealOrderId()));
    }

    @Test
    @DisplayName("Retrying transition to DELIVERED is idempotent and does not double charge")
    void testDelivered_IdempotentRetryDoesNotDoubleCharge() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(soupItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "13:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), 999, true);
        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("DELIVERED", null), 999, true);

        // Retry same transition
        MealOrderDto retried = mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("DELIVERED", null), 999, true);
        assertEquals("DELIVERED", retried.getOrderStatus());

        // Ensure exactly 1 folio charge was created
        assertTrue(folioItemRepository.existsBySourceMealOrderId(order.getMealOrderId()));
    }

    @Test
    @DisplayName("Modifying an already DELIVERED order is rejected")
    void testDelivered_CannotTransitionBack() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(soupItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "13:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), 999, true);
        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("READY", null), 999, true);
        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("DELIVERED", null), 999, true);

        assertThrows(BusinessRuleException.class, () ->
                mealOrderService.updateOrderStatus(order.getMealOrderId(),
                        new UpdateOrderStatusRequest("PREPARING", null), 999, true));
    }

    @Test
    @DisplayName("Customer can cancel PENDING order successfully")
    void testCancel_PendingByCustomer_Success() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "18:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        MealOrderDto cancelled = mealOrderService.cancelOrder(order.getMealOrderId(),
                "Changed mind", testUser.getUserId(), false);
        assertEquals("CANCELLED", cancelled.getOrderStatus());
    }

    @Test
    @DisplayName("Customer CANNOT cancel PREPARING order")
    void testCancel_PreparingByCustomer_Rejected() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "18:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), 999, true);

        assertThrows(BusinessRuleException.class, () ->
                mealOrderService.cancelOrder(order.getMealOrderId(), "Too late cancel", testUser.getUserId(), false));
    }

    @Test
    @DisplayName("Staff cancelling PREPARING order MUST provide a cancellation reason and persists audit log")
    void testCancel_PreparingByStaff_RequiresReason() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "18:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), staffUser.getUserId(), true);

        // Null reason
        BusinessRuleException exNull = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.cancelOrder(order.getMealOrderId(), null, staffUser.getUserId(), true));
        assertEquals("CANCELLATION_REASON_REQUIRED", exNull.getErrorCode());

        // Blank reason
        BusinessRuleException exBlank = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.cancelOrder(order.getMealOrderId(), "   ", staffUser.getUserId(), true));
        assertEquals("CANCELLATION_REASON_REQUIRED", exBlank.getErrorCode());

        // Verify no audit log recorded during failed attempts
        boolean hasFailedAudit = auditLogRepository.findAll().stream()
                .anyMatch(l -> "CANCEL_MEAL_ORDER".equals(l.getAction()) &&
                        String.valueOf(order.getMealOrderId()).equals(l.getTargetRefId()));
        assertFalse(hasFailedAudit, "Failed cancellations must not record audit log");

        // Valid reason succeeds and persists audit trail
        String cancellationReason = "Out of fresh lettuce";
        MealOrderDto cancelled = mealOrderService.cancelOrder(order.getMealOrderId(),
                cancellationReason, staffUser.getUserId(), true);
        assertEquals("CANCELLED", cancelled.getOrderStatus());

        AuditLog audit = auditLogRepository.findAll().stream()
                .filter(l -> "CANCEL_MEAL_ORDER".equals(l.getAction()) &&
                        String.valueOf(order.getMealOrderId()).equals(l.getTargetRefId()))
                .findFirst()
                .orElse(null);

        assertNotNull(audit, "Staff cancellation must persist durable audit record");
        assertEquals("MealOrder", audit.getTargetDataType());
        assertEquals(String.valueOf(order.getMealOrderId()), audit.getTargetRefId());
        assertEquals("SUCCESS", audit.getAccessStatus());
        assertEquals("PREPARING", audit.getOldValue());
        assertEquals("CANCELLED; Reason: " + cancellationReason, audit.getNewValue());
        assertEquals(staffUser.getUserId(), audit.getActorUserId());
        assertEquals("FNB_STAFF", audit.getActorRole());
    }

    @Test
    @DisplayName("Customer cancelling PENDING order persists audit log with CUSTOMER role and reason")
    void testCancel_PendingByCustomer_PersistsAuditTrail() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "18:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        MealOrderDto cancelled = mealOrderService.cancelOrder(order.getMealOrderId(),
                "Changed mind", testUser.getUserId(), false);
        assertEquals("CANCELLED", cancelled.getOrderStatus());

        AuditLog audit = auditLogRepository.findAll().stream()
                .filter(l -> "CANCEL_MEAL_ORDER".equals(l.getAction()) &&
                        String.valueOf(order.getMealOrderId()).equals(l.getTargetRefId()))
                .findFirst()
                .orElse(null);

        assertNotNull(audit, "Customer cancellation must persist durable audit record");
        assertEquals("MealOrder", audit.getTargetDataType());
        assertEquals(String.valueOf(order.getMealOrderId()), audit.getTargetRefId());
        assertEquals("SUCCESS", audit.getAccessStatus());
        assertEquals("PENDING", audit.getOldValue());
        assertEquals("CANCELLED; Reason: Changed mind", audit.getNewValue());
        assertEquals(testUser.getUserId(), audit.getActorUserId());
        assertEquals("CUSTOMER", audit.getActorRole());
    }

    @Test
    @DisplayName("Unauthorized cancellation attempts are rejected without audit persistence")
    void testCancel_Unauthorized_RejectedAndNoAudit() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "18:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        // Other customer tries to cancel someone else's booking/order
        assertThrows(AccessDeniedException.class, () ->
                mealOrderService.cancelOrder(order.getMealOrderId(), "Unauthorized cancel", 88888, false));

        // Advance to PREPARING
        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), staffUser.getUserId(), true);

        // Customer attempts to cancel PREPARING order
        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.cancelOrder(order.getMealOrderId(), "Too late cancel", testUser.getUserId(), false));
        assertEquals("CUSTOMER_CANNOT_CANCEL_PREPARING_ORDER", ex.getErrorCode());

        // Verify no audit log recorded for unauthorized attempts
        boolean hasAudit = auditLogRepository.findAll().stream()
                .anyMatch(l -> "CANCEL_MEAL_ORDER".equals(l.getAction()) &&
                        String.valueOf(order.getMealOrderId()).equals(l.getTargetRefId()));
        assertFalse(hasAudit, "Unauthorized cancellation must not record audit log");
    }

    @Test
    @DisplayName("DELIVERED is a terminal state and cannot transition to CANCELLED")
    void testCancel_DeliveredOrder_RejectedAndNoAudit() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "18:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), staffUser.getUserId(), true);
        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("READY", null), staffUser.getUserId(), true);
        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("DELIVERED", null), staffUser.getUserId(), true);

        // Staff attempt to cancel DELIVERED order
        BusinessRuleException exStaff = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.cancelOrder(order.getMealOrderId(), "Late staff cancellation", staffUser.getUserId(), true));
        assertEquals("ORDER_ALREADY_DELIVERED", exStaff.getErrorCode());

        // Customer attempt to cancel DELIVERED order
        BusinessRuleException exCustomer = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.cancelOrder(order.getMealOrderId(), "Late customer cancellation", testUser.getUserId(), false));
        assertEquals("ORDER_ALREADY_DELIVERED", exCustomer.getErrorCode());

        // Verify no cancellation audit entry exists
        boolean hasCancelAudit = auditLogRepository.findAll().stream()
                .anyMatch(l -> "CANCEL_MEAL_ORDER".equals(l.getAction()) &&
                        String.valueOf(order.getMealOrderId()).equals(l.getTargetRefId()));
        assertFalse(hasCancelAudit, "DELIVERED order cancellation rejection must not record CANCEL_MEAL_ORDER audit");
    }

    @Test
    @DisplayName("Cancellation does not trigger Folio charge; Folio billing remains restricted to DELIVERED")
    void testCancel_FolioBillingRemainsUnchanged() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "18:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        // Cancel order while in PENDING
        mealOrderService.cancelOrder(order.getMealOrderId(), "Cancelled by guest", testUser.getUserId(), false);

        // Verify NO folio charge was created
        assertFalse(folioItemRepository.existsBySourceMealOrderId(order.getMealOrderId()),
                "Cancelled order must never post a Folio charge");
    }

    @Test
    @DisplayName("Audit failures are not swallowed; exception propagates and aborts cancellation")
    void testCancel_AuditFailure_ConsistentWithTransactionContract() {
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), targetDate, "18:00", "Villa 102", List.of(item));
        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());

        mealOrderService.updateOrderStatus(order.getMealOrderId(),
                new UpdateOrderStatusRequest("PREPARING", null), staffUser.getUserId(), true);

        AuditLogService failingAuditService = mock(AuditLogService.class);
        doThrow(new RuntimeException("Simulated audit disk/storage failure"))
                .when(failingAuditService).record(any(), any(), any(), any(), any(), any(), any(), any());

        FnbKdsOrderServiceImpl serviceWithFailingAudit = new FnbKdsOrderServiceImpl(
                mealOrderRepository,
                menuItemRepository,
                mealOrderItemRepository,
                bookingRepository,
                bookingContextPort,
                dietaryProfilePort,
                folioBillingService,
                folioItemRepository,
                failingAuditService
        );

        // When audit persistence fails, cancelOrder MUST NOT swallow the failure
        RuntimeException ex = assertThrows(RuntimeException.class, () ->
                serviceWithFailingAudit.cancelOrder(order.getMealOrderId(), "Staff cancellation reason",
                        staffUser.getUserId(), true));
        assertEquals("Simulated audit disk/storage failure", ex.getMessage());

        // Verify the original order status was NOT changed to CANCELLED in database
        MealOrderEntity persisted = mealOrderRepository.findById(order.getMealOrderId()).orElseThrow();
        assertEquals("PREPARING", persisted.getOrderStatus(),
                "Order status must remain PREPARING when audit recording fails");
    }

    @Test
    @DisplayName("Data Minimization: KDS queue projects only culinary/allergy notes, excluding medical records")
    void testDataMinimization_ExcludesHealthAndBillingDetails() {
        // Add sensitive health profile
        HealthProfile hp = new HealthProfile();
        hp.setCustomerProfile(testCustomerProfile);
        hp.setAllergies("Peanut Allergy, Shellfish");
        hp.setDietaryRequirements("Strict Vegan");
        hp.setFoodIntoleranceNotes("Lactose intolerant");
        hp.setCurrentHealthCondition("Severe Asthma and Hypertension");
        hp.setCurrentMedications("Albuterol Inhaler, Lisinopril");
        hp.setInjurySurgeryHistory("Knee replacement in 2024");
        hp.setTreatmentSafetyNotes("Do not apply deep pressure to lower back");
        healthProfileRepository.save(hp);

        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(), targetDate, "LUNCH", List.of(saladItem.getMenuItemId()), null);
        mealOrderService.createDailyMealOrder(req, testUser.getUserId());

        List<MealPrepEntryDto> queue = mealOrderService.getKitchenPrepQueue(targetDate, "all", "active", false, null);

        assertFalse(queue.isEmpty());
        MealPrepEntryDto entry = queue.get(0);

        // Dietary notes should contain only food allergies and dietary requirements
        assertTrue(entry.getDietaryNotes().contains("Peanut Allergy"));
        assertTrue(entry.getDietaryNotes().contains("Strict Vegan"));
        assertTrue(entry.getDietaryNotes().contains("Lactose intolerant"));

        // Critical check: Ensure NO medical fields leaked
        assertFalse(entry.getDietaryNotes().stream().anyMatch(n -> n.contains("Asthma")));
        assertFalse(entry.getDietaryNotes().stream().anyMatch(n -> n.contains("Lisinopril")));
        assertFalse(entry.getDietaryNotes().stream().anyMatch(n -> n.contains("Knee replacement")));
    }

    @Test
    @DisplayName("Stay Date Validation: Daily meal order rejects date outside retreat stay")
    void testCreateDailyMealOrder_DateOutsideStay_ThrowsBusinessRuleException() {
        LocalDate dateOutside = targetDate.plusDays(10);
        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(), dateOutside, "LUNCH", List.of(saladItem.getMenuItemId()), null);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.createDailyMealOrder(req, testUser.getUserId()));
        assertEquals("DATE_OUTSIDE_STAY", ex.getErrorCode());
    }

    @Test
    @DisplayName("Stay Date Validation: Exact check-in and check-out boundary dates are accepted")
    void testCreateDailyMealOrder_ExactBoundaries_Accepted() {
        // Boundary 1: Check-in date
        CreateDailyMealRequest reqCheckIn = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(), testBooking.getCheckInDate(), "LUNCH", List.of(saladItem.getMenuItemId()), null);
        MealOrderDto orderCheckIn = mealOrderService.createDailyMealOrder(reqCheckIn, testUser.getUserId());
        assertNotNull(orderCheckIn);
        assertEquals(testBooking.getCheckInDate(), orderCheckIn.getOrderDate());

        // Boundary 2: Check-out date
        CreateDailyMealRequest reqCheckOut = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(), testBooking.getCheckOutDate(), "DINNER", List.of(soupItem.getMenuItemId()), null);
        MealOrderDto orderCheckOut = mealOrderService.createDailyMealOrder(reqCheckOut, testUser.getUserId());
        assertNotNull(orderCheckOut);
        assertEquals(testBooking.getCheckOutDate(), orderCheckOut.getOrderDate());
    }

    @Test
    @DisplayName("Stay Date Validation: Ala carte order enforces identical stay-date boundary validation")
    void testCreateAlaCarteOrder_StayDateValidation_EnforcedIdentically() {
        LocalDate dateOutside = targetDate.plusDays(10);
        AlaCarteItemRequest item = new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null);
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(), dateOutside, "18:00", "Villa 102", List.of(item));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.createAlaCarteOrder(req, testUser.getUserId()));
        assertEquals("DATE_OUTSIDE_STAY", ex.getErrorCode());
    }

    @Test
    @DisplayName("Booking Boundary: Non-existent booking is rejected with ResourceNotFoundException")
    void testCreateMealOrder_BookingNotFound_ThrowsResourceNotFoundException() {
        CreateDailyMealRequest req = new CreateDailyMealRequest(
                999999, targetDate, "LUNCH", List.of(saladItem.getMenuItemId()), null);

        assertThrows(ResourceNotFoundException.class, () ->
                mealOrderService.createDailyMealOrder(req, testUser.getUserId()));
    }

    @Test
    @DisplayName("Booking Boundary: Unauthorized customer cannot place orders on another customer's booking")
    void testCreateMealOrder_UnauthorizedCustomer_ThrowsAccessDeniedException() {
        User unauthorizedUser = new User();
        unauthorizedUser.setEmail("unauth_guest_" + System.currentTimeMillis() + "@heavenstay.com");
        unauthorizedUser.setPasswordHash("hashed_pw");
        unauthorizedUser.setFullName("Unauthorized Person");
        unauthorizedUser.setAccountStatus("ACTIVE");
        unauthorizedUser = userRepository.save(unauthorizedUser);

        final Integer unauthorizedUserId = unauthorizedUser.getUserId();
        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(), targetDate, "LUNCH", List.of(saladItem.getMenuItemId()), null);

        assertThrows(AccessDeniedException.class, () ->
                mealOrderService.createDailyMealOrder(req, unauthorizedUserId));
    }

    @Test
    @DisplayName("Booking Boundary: Cancelled booking rejects order placement with BOOKING_NOT_ACTIVE")
    void testCreateMealOrder_CancelledBooking_ThrowsBusinessRuleException() {
        testBooking.setBookingStatus("CANCELLED");
        bookingRepository.save(testBooking);

        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(), targetDate, "LUNCH", List.of(saladItem.getMenuItemId()), null);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.createDailyMealOrder(req, testUser.getUserId()));
        assertEquals("BOOKING_NOT_ACTIVE", ex.getErrorCode());
    }

    @Test
    @DisplayName("Booking Boundary: Inconsistent booking dates (checkIn > checkOut) throw INVALID_BOOKING_DATES")
    void testCreateMealOrder_InconsistentStayDates_ThrowsBusinessRuleException() {
        testBooking.setCheckInDate(targetDate.plusDays(5));
        testBooking.setCheckOutDate(targetDate.plusDays(2)); // checkIn > checkOut
        bookingRepository.save(testBooking);

        CreateDailyMealRequest req = new CreateDailyMealRequest(
                testBooking.getRetreatBookingId(), targetDate.plusDays(3), "LUNCH", List.of(saladItem.getMenuItemId()), null);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                mealOrderService.createDailyMealOrder(req, testUser.getUserId()));
        assertEquals("INVALID_BOOKING_DATES", ex.getErrorCode());

}
}
