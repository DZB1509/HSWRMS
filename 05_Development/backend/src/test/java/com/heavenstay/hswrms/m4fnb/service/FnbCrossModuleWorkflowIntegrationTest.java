package com.heavenstay.hswrms.m4fnb.service;

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
import com.heavenstay.hswrms.m4fnb.dto.*;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
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

/**
 * End-to-end cross-module business workflow test:
 * Customer Dietary Requirements (M1) -> F&B Order (M4) -> Kitchen Order Ticket (KDS) -> Billing & Folio (M5).
 */
@SpringBootTest
@Transactional
public class FnbCrossModuleWorkflowIntegrationTest {

    @Autowired
    private FnbKdsOrderService mealOrderService;

    @Autowired
    private FolioBillingService folioBillingService;

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
    private MenuItemRepository menuItemRepository;

    @Autowired
    private MealOrderRepository mealOrderRepository;

    private User testUser;
    private CustomerProfile customerProfile;
    private HealthProfile healthProfile;
    private RetreatBooking retreatBooking;
    private FolioEntity folio;
    private MenuItem organicSalad;
    private MenuItem detoxJuice;
    private final LocalDate orderDate = LocalDate.now().plusDays(1);

    @BeforeEach
    void setUp() {
        // 1. Authoritative Customer in M1 Identity
        testUser = new User();
        testUser.setEmail("eleanor.vance." + System.currentTimeMillis() + "@heavenstay.dev");
        testUser.setPasswordHash("TestHash123!");
        testUser.setFullName("Eleanor Vance");
        testUser.setAccountStatus("ACTIVE");
        testUser = userRepository.save(testUser);

        customerProfile = new CustomerProfile();
        customerProfile.setUser(testUser);
        customerProfile = customerProfileRepository.save(customerProfile);

        // 2. Health & Dietary Requirements in M1 HealthProfile
        healthProfile = new HealthProfile();
        healthProfile.setCustomerProfile(customerProfile);
        healthProfile.setAllergies("Peanuts, Shellfish");
        healthProfile.setFoodIntoleranceNotes("Lactose");
        healthProfile.setDietaryRequirements("Gluten-Free, Low-Sodium");
        healthProfile = healthProfileRepository.save(healthProfile);

        // 3. Villa & Package in M2 Booking
        VillaCategory category = new VillaCategory();
        category.setCategoryName("Oceanfront Sanctuary");
        category.setMaxOccupancy(2);
        category.setPriceModifier(BigDecimal.ZERO);
        category.setCategoryStatus("ACTIVE");
        category.setInventoryCount(3);
        category.setBedroomCount(1);
        category = villaCategoryRepository.save(category);

        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaNumber("Villa #102");
        villa.setVillaCategory(category);
        villa.setVillaStatus("AVAILABLE");
        villa = physicalVillaRepository.save(villa);

        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageCode("RET-DETOX-03");
        pkg.setPackageName("3D2N Pure Detox Retreat");
        pkg.setDurationNights(3);
        pkg.setBasePrice(BigDecimal.valueOf(2000));
        pkg.setPackageStatus("ACTIVE");
        pkg = retreatPackageRepository.save(pkg);

        RetreatBooking booking = new RetreatBooking();
        booking.setCustomerProfileId(customerProfile.getCustomerProfileId());
        booking.setRetreatPackage(pkg);
        booking.setRequestedVillaCategory(category);
        booking.setAssignedVilla(villa);
        booking.setCheckInDate(orderDate);
        booking.setCheckOutDate(orderDate.plusDays(3));
        booking.setBookingStatus("CONFIRMED");
        booking.setDepositAmount(BigDecimal.valueOf(500));
        booking.setTotalEstimatedAmount(BigDecimal.valueOf(2000));
        retreatBooking = retreatBookingRepository.save(booking);

        // 4. Folio in M5 Billing
        folio = new FolioEntity();
        folio.setRetreatBooking(retreatBooking);
        folio.setFolioStatus("OPEN");
        folio.setTotalCharges(BigDecimal.ZERO);
        folio.setTotalPaid(BigDecimal.valueOf(500));
        folio = folioRepository.save(folio);

        // 5. Menu Items in M4 F&B
        organicSalad = new MenuItem("Organic Quinoa Salad", "STARTER", "ALL_DAY",
                new BigDecimal("150"), "vegan, gluten-free", null, "AVAILABLE");
        organicSalad = menuItemRepository.save(organicSalad);

        detoxJuice = new MenuItem("Cold Pressed Green Detox", "BEVERAGE", "ALL_DAY",
                new BigDecimal("80"), "vegan", null, "AVAILABLE");
        detoxJuice = menuItemRepository.save(detoxJuice);
    }

    @Test
    @DisplayName("Cross-Module E2E: Customer Dietary Requirements -> F&B Order -> KOT -> Status Lifecycle -> Folio Billing")
    void testCrossModuleDietaryOrderKotAndBillingLifecycle() {
        // --- STEP 1: Customer Places A-la-carte F&B Order with Custom Notes ---
        CreateAlaCarteRequest orderRequest = new CreateAlaCarteRequest(
                retreatBooking.getRetreatBookingId(),
                orderDate,
                "12:30",
                "Villa #102",
                List.of(
                        new AlaCarteItemRequest(organicSalad.getMenuItemId(), 1, "Dressing on the side"),
                        new AlaCarteItemRequest(detoxJuice.getMenuItemId(), 1, "No ice")
                )
        );

        MealOrderDto createdOrder = mealOrderService.createAlaCarteOrder(orderRequest, testUser.getUserId());
        assertNotNull(createdOrder.getMealOrderId());
        assertEquals("PENDING", createdOrder.getOrderStatus());
        assertEquals(0, new BigDecimal("230").compareTo(createdOrder.getTotalAmount()));

        // --- STEP 2: Kitchen Display System (KOT) Receives Ticket with Dietary & Special Notes ---
        MealPrepEntryDto kot = mealOrderService.getOrderDetails(createdOrder.getMealOrderId());
        assertNotNull(kot);
        assertEquals(createdOrder.getMealOrderId(), kot.getId());
        assertEquals("pending", kot.getStatus());
        assertEquals("Eleanor Vance", kot.getCustomerName(), "KOT must present customer full name from M1 Profile");
        assertEquals("Villa #102", kot.getVillaNumber(), "KOT must present delivery location/villa from M2 Booking");

        // Verify Authoritative Dietary Requirements are Projected
        assertNotNull(kot.getDietaryNotes());
        assertTrue(kot.getDietaryNotes().contains("Peanuts"), "Allergy 'Peanuts' must be clearly displayed on KOT");
        assertTrue(kot.getDietaryNotes().contains("Shellfish"), "Allergy 'Shellfish' must be clearly displayed on KOT");
        assertTrue(kot.getDietaryNotes().contains("Lactose"), "Intolerance 'Lactose' must be displayed on KOT");
        assertTrue(kot.getDietaryNotes().contains("Gluten-Free"), "Dietary preference 'Gluten-Free' must be displayed on KOT");

        // Verify Customer Special Notes are Present on Ticket
        assertNotNull(kot.getCustomerNotes());
        assertTrue(kot.getCustomerNotes().contains("Villa #102"));
        assertTrue(kot.getCustomerNotes().contains("Dressing on the side"));
        assertTrue(kot.getCustomerNotes().contains("No ice"));

        // Verify Dashboard KPI registers the dietary alert
        KdsDashboardKpiDto kpis = mealOrderService.getDashboardKpis(orderDate);
        assertTrue(kpis.getDietaryAlertsCount() >= 1, "KDS Dashboard KPI must increment dietary alerts count");

        // --- STEP 3: M5 Billing Guard Blocks Checkout While Order is Active ---
        BusinessRuleException guardEx = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.validateBillingGuard(retreatBooking.getRetreatBookingId()));
        assertEquals("UNSETTLED_SERVICE_ORDERS", guardEx.getErrorCode(),
                "Checkout must be blocked while F&B order is PENDING");

        // --- STEP 4: Kitchen Transitions Status: PENDING -> PREPARING ---
        UpdateOrderStatusRequest prepReq = new UpdateOrderStatusRequest("PREPARING", null);
        MealOrderDto preparingOrder = mealOrderService.updateOrderStatus(createdOrder.getMealOrderId(), prepReq, 999, true);
        assertEquals("PREPARING", preparingOrder.getOrderStatus());
        assertThrows(BusinessRuleException.class, () ->
                folioBillingService.validateBillingGuard(retreatBooking.getRetreatBookingId()),
                "Checkout must remain blocked while F&B order is PREPARING");

        // --- STEP 5: Kitchen Transitions Status: PREPARING -> READY ---
        UpdateOrderStatusRequest readyReq = new UpdateOrderStatusRequest("READY", null);
        MealOrderDto readyOrder = mealOrderService.updateOrderStatus(createdOrder.getMealOrderId(), readyReq, 999, true);
        assertEquals("READY", readyOrder.getOrderStatus());
        assertThrows(BusinessRuleException.class, () ->
                folioBillingService.validateBillingGuard(retreatBooking.getRetreatBookingId()),
                "Checkout must remain blocked while F&B order is READY");

        // --- STEP 6: Kitchen Transitions Status: READY -> DELIVERED (Billing Integration) ---
        UpdateOrderStatusRequest delReq = new UpdateOrderStatusRequest("DELIVERED", null);
        MealOrderDto deliveredOrder = mealOrderService.updateOrderStatus(createdOrder.getMealOrderId(), delReq, 999, true);
        assertEquals("DELIVERED", deliveredOrder.getOrderStatus());

        // Billing Guard Now Unblocked
        assertDoesNotThrow(() -> folioBillingService.validateBillingGuard(retreatBooking.getRetreatBookingId()),
                "Checkout guard must pass once order is DELIVERED");

        // --- STEP 7: Verify Folio Charge Posted Correctly ---
        List<FolioItemEntity> folioItems = folioItemRepository.findByFolioId(folio.getFolioId());
        assertEquals(1, folioItems.size(), "Exactly 1 Folio charge must be posted for delivered A-la-carte order");
        FolioItemEntity charge = folioItems.get(0);
        assertEquals("FNB", charge.getChargeCategory());
        assertEquals(0, new BigDecimal("230").compareTo(charge.getAmount()));
        assertEquals(createdOrder.getMealOrderId(), charge.getSourceMealOrderId());

        // --- STEP 8: Idempotency Check (No Double Charge on Re-Delivery) ---
        MealOrderDto idempotentOrder = mealOrderService.updateOrderStatus(createdOrder.getMealOrderId(), delReq, 999, true);
        assertEquals("DELIVERED", idempotentOrder.getOrderStatus());
        List<FolioItemEntity> folioItemsAfterRetry = folioItemRepository.findByFolioId(folio.getFolioId());
        assertEquals(1, folioItemsAfterRetry.size(), "Retrying DELIVERED status must NOT post duplicate Folio charges");
    }

    @Test
    @DisplayName("Cross-Module Daily Meal: Included in retreat package, KOT shows dietary notes, 0 VND extra charge")
    void testCrossModuleDailyMealSelectionWorkflow() {
        CreateDailyMealRequest dailyRequest = new CreateDailyMealRequest(
                retreatBooking.getRetreatBookingId(),
                orderDate,
                "LUNCH",
                List.of(organicSalad.getMenuItemId()),
                "Extra fresh cilantro please"
        );

        MealOrderDto mealOrder = mealOrderService.createDailyMealOrder(dailyRequest, testUser.getUserId());
        assertNotNull(mealOrder.getMealOrderId());
        assertEquals("PENDING", mealOrder.getOrderStatus());
        assertEquals("DAILY_MEAL", mealOrder.getOrderType());
        assertEquals(0, new BigDecimal("150").compareTo(mealOrder.getTotalAmount()), "Nominal menu item value is present on order DTO");

        // Verify KOT ticket
        MealPrepEntryDto kot = mealOrderService.getOrderDetails(mealOrder.getMealOrderId());
        assertEquals("retreat_meal", kot.getType());
        assertTrue(kot.getDietaryNotes().contains("Peanuts"));
        assertTrue(kot.getDietaryNotes().contains("Gluten-Free"));
        assertEquals("Extra fresh cilantro please", kot.getCustomerNotes());

        // Transition to DELIVERED
        mealOrderService.updateOrderStatus(mealOrder.getMealOrderId(), new UpdateOrderStatusRequest("PREPARING", null), 999, true);
        mealOrderService.updateOrderStatus(mealOrder.getMealOrderId(), new UpdateOrderStatusRequest("READY", null), 999, true);
        MealOrderDto delivered = mealOrderService.updateOrderStatus(mealOrder.getMealOrderId(), new UpdateOrderStatusRequest("DELIVERED", null), 999, true);
        assertEquals("DELIVERED", delivered.getOrderStatus());

        // Verify NO extra Folio charges posted for daily retreat meals
        List<FolioItemEntity> folioItems = folioItemRepository.findByFolioId(folio.getFolioId());
        assertTrue(folioItems.isEmpty(), "Daily retreat meals must never post extra charges to Folio");
    }
}
