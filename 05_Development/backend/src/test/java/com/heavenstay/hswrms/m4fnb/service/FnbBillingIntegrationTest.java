package com.heavenstay.hswrms.m4fnb.service;

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
import com.heavenstay.hswrms.m4fnb.dto.AlaCarteItemRequest;
import com.heavenstay.hswrms.m4fnb.dto.CreateAlaCarteRequest;
import com.heavenstay.hswrms.m4fnb.dto.MealOrderDto;
import com.heavenstay.hswrms.m4fnb.dto.UpdateOrderStatusRequest;
import com.heavenstay.hswrms.m4fnb.entity.MenuItemEntity;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import com.heavenstay.hswrms.m5billing.service.InvoiceCalculation;
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
public class FnbBillingIntegrationTest {

    @Autowired
    private MealOrderService mealOrderService;

    @Autowired
    private FolioBillingService folioBillingService;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private MealOrderRepository mealOrderRepository;

    @Autowired
    private FolioRepository folioRepository;

    @Autowired
    private FolioItemRepository folioItemRepository;

    @Autowired
    private RetreatBookingRepository retreatBookingRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerProfileRepository customerProfileRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private PhysicalVillaRepository physicalVillaRepository;

    @Autowired
    private RetreatPackageRepository retreatPackageRepository;

    private User testUser;
    private RetreatBooking testBooking;
    private FolioEntity testFolio;
    private MenuItemEntity saladItem;
    private MenuItemEntity smoothieItem;
    private final LocalDate targetDate = LocalDate.now().plusDays(1);

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setEmail("fnb.billing.test." + System.currentTimeMillis() + "@heavenstay.com");
        testUser.setPasswordHash("hashed_pw");
        testUser.setFullName("Billing Test Customer");
        testUser.setAccountStatus("ACTIVE");
        testUser = userRepository.save(testUser);

        CustomerProfile profile = new CustomerProfile();
        profile.setUser(testUser);
        profile = customerProfileRepository.save(profile);

        VillaCategory cat = new VillaCategory();
        cat.setCategoryName("Billing Sanctuary Villa");
        cat.setMaxOccupancy(2);
        cat.setPriceModifier(BigDecimal.ZERO);
        cat.setCategoryStatus("ACTIVE");
        cat.setInventoryCount(5);
        cat.setBedroomCount(1);
        cat = villaCategoryRepository.save(cat);

        PhysicalVilla villa = new PhysicalVilla();
        villa.setVillaNumber("Villa B-01");
        villa.setVillaCategory(cat);
        villa.setVillaStatus("AVAILABLE");
        villa = physicalVillaRepository.save(villa);

        RetreatPackage pkg = new RetreatPackage();
        pkg.setPackageCode("PKG-BILLING-TEST");
        pkg.setPackageName("Billing Wellness Retreat");
        pkg.setDurationNights(3);
        pkg.setBasePrice(BigDecimal.valueOf(1500));
        pkg.setPackageStatus("ACTIVE");
        pkg = retreatPackageRepository.save(pkg);

        RetreatBooking booking = new RetreatBooking();
        booking.setCustomerProfileId(profile.getCustomerProfileId());
        booking.setRetreatPackage(pkg);
        booking.setRequestedVillaCategory(cat);
        booking.setAssignedVilla(villa);
        booking.setCheckInDate(targetDate);
        booking.setCheckOutDate(targetDate.plusDays(3));
        booking.setBookingStatus("CONFIRMED");
        booking.setDepositAmount(BigDecimal.valueOf(500));
        booking.setTotalEstimatedAmount(BigDecimal.valueOf(1500));
        testBooking = retreatBookingRepository.save(booking);

        testFolio = new FolioEntity();
        testFolio.setRetreatBooking(testBooking);
        testFolio.setFolioStatus("OPEN");
        testFolio.setTotalCharges(BigDecimal.ZERO);
        testFolio.setTotalPaid(BigDecimal.valueOf(500));
        testFolio = folioRepository.save(testFolio);

        saladItem = new MenuItemEntity("Billing Organic Salad", "STARTER", "ALL_DAY",
                new BigDecimal("150"), "vegan", "peanuts", "AVAILABLE");
        saladItem = menuItemRepository.save(saladItem);

        smoothieItem = new MenuItemEntity("Billing Detox Smoothie", "BEVERAGE", "ALL_DAY",
                new BigDecimal("90"), "vegan", null, "AVAILABLE");
        smoothieItem = menuItemRepository.save(smoothieItem);
    }

    @Test
    @DisplayName("End-to-end M4 -> M5: Unsettled meal blocks checkout guard, DELIVERED posts Folio charge and unblocks guard")
    void testEndToEndM4toM5BillingLifecycle() {
        // 1. Create A-la-carte meal order (2 salads @ 150 + 1 smoothie @ 90 = 390.00)
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(),
                targetDate,
                "19:00",
                "Villa B-01",
                List.of(
                        new AlaCarteItemRequest(saladItem.getMenuItemId(), 2, "Extra dressing"),
                        new AlaCarteItemRequest(smoothieItem.getMenuItemId(), 1, "No sugar")
                )
        );

        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());
        assertNotNull(order.getMealOrderId());
        assertEquals("PENDING", order.getOrderStatus());
        assertEquals(0, new BigDecimal("390").compareTo(order.getTotalAmount()));

        // 2. Verify billing guard blocks while order is PENDING
        BusinessRuleException guardEx = assertThrows(BusinessRuleException.class, () ->
                folioBillingService.validateBillingGuard(testBooking.getRetreatBookingId())
        );
        assertEquals("UNSETTLED_SERVICE_ORDERS", guardEx.getErrorCode());
        assertTrue(guardEx.getMessage().contains("dining order(s) remain PENDING, PREPARING, or READY"));

        // Verify no folio item posted yet
        List<FolioItemEntity> initialItems = folioItemRepository.findByFolioId(testFolio.getFolioId());
        assertTrue(initialItems.isEmpty(), "No charges should exist while PENDING");

        // 3. Move to PREPARING -> still blocks
        UpdateOrderStatusRequest prepReq = new UpdateOrderStatusRequest("PREPARING", null);
        mealOrderService.updateOrderStatus(order.getMealOrderId(), prepReq, 999, true);
        assertThrows(BusinessRuleException.class, () ->
                folioBillingService.validateBillingGuard(testBooking.getRetreatBookingId())
        );

        // 4. Move to READY -> still blocks
        UpdateOrderStatusRequest readyReq = new UpdateOrderStatusRequest("READY", null);
        mealOrderService.updateOrderStatus(order.getMealOrderId(), readyReq, 999, true);
        assertThrows(BusinessRuleException.class, () ->
                folioBillingService.validateBillingGuard(testBooking.getRetreatBookingId())
        );

        // 5. Move to DELIVERED -> triggers folio charge posting and clears unsettled guard
        UpdateOrderStatusRequest delReq = new UpdateOrderStatusRequest("DELIVERED", null);
        MealOrderDto deliveredOrder = mealOrderService.updateOrderStatus(order.getMealOrderId(), delReq, 999, true);
        assertEquals("DELIVERED", deliveredOrder.getOrderStatus());

        // Billing guard should now PASS with no exceptions
        assertDoesNotThrow(() -> folioBillingService.validateBillingGuard(testBooking.getRetreatBookingId()));

        // 6. Verify FolioItem was created with correct FNB charge category and amount
        List<FolioItemEntity> folioItems = folioItemRepository.findByFolioId(testFolio.getFolioId());
        assertEquals(1, folioItems.size());
        FolioItemEntity item = folioItems.get(0);
        assertEquals("FNB", item.getChargeCategory());
        assertEquals(0, new BigDecimal("390").compareTo(item.getAmount()));
        assertEquals(order.getMealOrderId(), item.getSourceMealOrderId());

        // 7. Verify Idempotency: retry/re-call update to DELIVERED does not post duplicate FolioItem
        MealOrderDto idempotentOrder = mealOrderService.updateOrderStatus(order.getMealOrderId(), delReq, 999, true);
        assertEquals("DELIVERED", idempotentOrder.getOrderStatus());

        List<FolioItemEntity> folioItemsAfterRetry = folioItemRepository.findByFolioId(testFolio.getFolioId());
        assertEquals(1, folioItemsAfterRetry.size(), "Duplicate DELIVERED must not create second folio item");

        // 8. Verify Folio invoice calculation includes FNB charges
        InvoiceCalculation calc = folioBillingService.calculateInvoiceAmounts(testBooking, folioItemsAfterRetry);
        assertEquals(0, new BigDecimal("390").compareTo(calc.fnbCharges()));
    }

    @Test
    @DisplayName("Cancelled order is not unsettled and does not post to Folio")
    void testCancelledOrderDoesNotBlockAndDoesNotCharge() {
        CreateAlaCarteRequest req = new CreateAlaCarteRequest(
                testBooking.getRetreatBookingId(),
                targetDate,
                "12:30",
                "Villa B-01",
                List.of(new AlaCarteItemRequest(saladItem.getMenuItemId(), 1, null))
        );

        MealOrderDto order = mealOrderService.createAlaCarteOrder(req, testUser.getUserId());
        assertEquals("PENDING", order.getOrderStatus());

        // Customer cancels order
        mealOrderService.cancelOrder(order.getMealOrderId(), null, testUser.getUserId(), false);

        // Guard must pass
        assertDoesNotThrow(() -> folioBillingService.validateBillingGuard(testBooking.getRetreatBookingId()));

        // No folio items should exist
        List<FolioItemEntity> folioItems = folioItemRepository.findByFolioId(testFolio.getFolioId());
        assertTrue(folioItems.isEmpty());
    }
}
