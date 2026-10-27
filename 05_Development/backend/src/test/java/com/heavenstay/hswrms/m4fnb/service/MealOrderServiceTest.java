package com.heavenstay.hswrms.m4fnb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.never;
import static org.mockito.ArgumentMatchers.anyInt;

import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderResponse;
import com.heavenstay.hswrms.m4fnb.entity.FnbOrderStatus;
import com.heavenstay.hswrms.m4fnb.entity.FnbOrderType;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderItem;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderItemPreparationStatus;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import com.heavenstay.hswrms.m4fnb.integration.BookingContextPort;
import com.heavenstay.hswrms.m4fnb.integration.DietaryProfilePort;
import com.heavenstay.hswrms.m4fnb.mapper.MealOrderMapper;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderItemRepository;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemIngredientRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;

class MealOrderServiceTest {

    private MealOrderRepository orderRepository;
    private MealOrderItemRepository orderItemRepository;
    private MenuItemRepository menuItemRepository;
    private MenuItemIngredientRepository recipeRepository;
    private MenuService menuService;
    private InventoryService inventoryService;
    private MealOrderMapper mealOrderMapper;
    private ApplicationEventPublisher eventPublisher;
    private BookingContextPort bookingPort;
    private DietaryProfilePort dietaryProfilePort;
    private MealOrderService mealOrderService;

    @BeforeEach
    @SuppressWarnings("null")
    void setUp() {
        orderRepository = mock(MealOrderRepository.class);
        orderItemRepository = mock(MealOrderItemRepository.class);
        menuItemRepository = mock(MenuItemRepository.class);
        recipeRepository = mock(MenuItemIngredientRepository.class);
        menuService = mock(MenuService.class);
        inventoryService = mock(InventoryService.class);
        mealOrderMapper = new MealOrderMapper();
        eventPublisher = mock(ApplicationEventPublisher.class);
        bookingPort = mock(BookingContextPort.class);
        dietaryProfilePort = mock(DietaryProfilePort.class);

        @SuppressWarnings("unchecked")
        org.springframework.beans.factory.ObjectProvider<BookingContextPort> bookingProvider = mock(org.springframework.beans.factory.ObjectProvider.class);
        when(bookingProvider.getIfAvailable()).thenReturn(bookingPort);

        @SuppressWarnings("unchecked")
        org.springframework.beans.factory.ObjectProvider<DietaryProfilePort> dietaryProvider = mock(org.springframework.beans.factory.ObjectProvider.class);
        when(dietaryProvider.getIfAvailable()).thenReturn(dietaryProfilePort);

        mealOrderService = new MealOrderService(
                orderRepository,
                orderItemRepository,
                menuItemRepository,
                recipeRepository,
                mealOrderMapper,
                menuService,
                inventoryService,
                bookingProvider,
                dietaryProvider,
                eventPublisher,
                null
        );
    }

    @Test
    @DisplayName("listKitchenOrders orders results by createdAt DESC")
    @SuppressWarnings("null")
    void listKitchenOrdersReturnsOrdersOrderedByCreatedAtDesc() {
        LocalDate targetDate = LocalDate.of(2026, 9, 24);

        MealOrderEntity order1 = mock(MealOrderEntity.class);
        when(order1.getId()).thenReturn(1001);
        when(order1.getRetreatBookingId()).thenReturn(1);
        when(order1.getOrderDate()).thenReturn(targetDate);
        when(order1.getMealType()).thenReturn("BREAKFAST");
        when(order1.getOrderType()).thenReturn(FnbOrderType.DAILY_MEAL.name());
        when(order1.getOrderTypeValue()).thenReturn(FnbOrderType.DAILY_MEAL);
        when(order1.getOrderStatus()).thenReturn(FnbOrderStatus.READY.name());
        when(order1.getOrderStatusValue()).thenReturn(FnbOrderStatus.READY);
        when(order1.getSpecialNotes()).thenReturn("Warm water and light honey on the side, please");
        when(order1.getCreatedAt()).thenReturn(LocalDateTime.of(2026, 9, 24, 7, 0));

        MealOrderEntity order2 = mock(MealOrderEntity.class);
        when(order2.getId()).thenReturn(1002);
        when(order2.getRetreatBookingId()).thenReturn(1);
        when(order2.getOrderDate()).thenReturn(targetDate);
        when(order2.getMealType()).thenReturn("BREAKFAST");
        when(order2.getOrderType()).thenReturn(FnbOrderType.DAILY_MEAL.name());
        when(order2.getOrderTypeValue()).thenReturn(FnbOrderType.DAILY_MEAL);
        when(order2.getOrderStatus()).thenReturn(FnbOrderStatus.PENDING.name());
        when(order2.getOrderStatusValue()).thenReturn(FnbOrderStatus.PENDING);
        when(order2.getCreatedAt()).thenReturn(LocalDateTime.of(2026, 9, 24, 7, 30));

        // Latest order (order2) at the top of the returned list
        when(orderRepository.findByOrderDateAndOrderStatusNotOrderByCreatedAtDesc(targetDate, "CANCELLED"))
                .thenReturn(List.of(order2, order1));

        MealOrderItem item1 = mock(MealOrderItem.class);
        when(item1.getId()).thenReturn(1);
        when(item1.getMealOrderId()).thenReturn(1001);
        when(item1.getMenuItemId()).thenReturn(1);
        when(item1.getQuantity()).thenReturn(1);
        when(item1.getUnitPrice()).thenReturn(BigDecimal.ZERO);
        when(item1.getPreparationStatus()).thenReturn(MealOrderItemPreparationStatus.READY.name());
        when(item1.getPreparationStatusValue()).thenReturn(MealOrderItemPreparationStatus.READY);

        MealOrderItem item2 = mock(MealOrderItem.class);
        when(item2.getId()).thenReturn(2);
        when(item2.getMealOrderId()).thenReturn(1002);
        when(item2.getMenuItemId()).thenReturn(1);
        when(item2.getQuantity()).thenReturn(2);
        when(item2.getUnitPrice()).thenReturn(BigDecimal.ZERO);
        when(item2.getPreparationStatus()).thenReturn(MealOrderItemPreparationStatus.PENDING.name());
        when(item2.getPreparationStatusValue()).thenReturn(MealOrderItemPreparationStatus.PENDING);

        when(orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(anyList()))
                .thenReturn(List.of(item1, item2));

        MenuItem menuItem = mock(MenuItem.class);
        when(menuItem.getId()).thenReturn(1);
        when(menuItem.getItemName()).thenReturn("Cháo Yến Mạch Quả Mọng Hữu Cơ");
        when(menuItem.getPrice()).thenReturn(BigDecimal.ZERO);
        when(menuItemRepository.findAllById(anyList())).thenReturn(List.of(menuItem));

        when(bookingPort.getKitchenBookingContext(1)).thenReturn(new BookingContextPort.FnbBookingContext(
                1,
                1,
                "CHECKED_IN",
                targetDate.minusDays(1),
                targetDate.plusDays(3),
                "Eleanor Vance",
                "Villa #102 (Tranquil Garden)",
                "RET-DETOX-03",
                "3D2N Thải Độc & Thanh Lọc Tinh Khiết"
        ));

        when(dietaryProfilePort.getFoodProfileForUser(1)).thenReturn(new DietaryProfilePort.FoodProfileProjection(
                List.of("Crustaceans & Shellfish", "Peanuts"),
                List.of("Pescatarian", "Gluten-Conscious")
        ));

        List<KitchenOrderResponse> result = mealOrderService.listKitchenOrders(targetDate);

        assertNotNull(result);
        assertEquals(2, result.size());
        assertEquals(1002, result.get(0).id(), "Latest order must appear at the top");
        assertEquals(1001, result.get(1).id());
        assertEquals("Eleanor Vance", result.get(0).guestFirstName());
        assertEquals("Villa #102 (Tranquil Garden)", result.get(0).villaNumber());
        assertEquals(List.of("Crustaceans & Shellfish", "Peanuts"), result.get(0).allergies());
        assertEquals(List.of("Pescatarian", "Gluten-Conscious"), result.get(0).dietaryPreferences());
    }

    @Test
    @DisplayName("getKitchenOrder returns complete order details matching specification")
    @SuppressWarnings("null")
    void getKitchenOrderReturnsCompleteOrderDetails() {
        LocalDate orderDate = LocalDate.of(2026, 9, 24);

        MealOrderEntity order = mock(MealOrderEntity.class);
        when(order.getId()).thenReturn(1001);
        when(order.getRetreatBookingId()).thenReturn(1);
        when(order.getOrderDate()).thenReturn(orderDate);
        when(order.getMealType()).thenReturn("BREAKFAST");
        when(order.getOrderType()).thenReturn(FnbOrderType.DAILY_MEAL.name());
        when(order.getOrderTypeValue()).thenReturn(FnbOrderType.DAILY_MEAL);
        when(order.getOrderStatus()).thenReturn(FnbOrderStatus.READY.name());
        when(order.getOrderStatusValue()).thenReturn(FnbOrderStatus.READY);
        when(order.getSpecialNotes()).thenReturn("Warm water and light honey on the side, please");
        when(order.getCreatedAt()).thenReturn(LocalDateTime.of(2026, 9, 24, 7, 0));

        when(orderRepository.findById(1001)).thenReturn(Optional.of(order));

        MealOrderItem item = mock(MealOrderItem.class);
        when(item.getId()).thenReturn(1);
        when(item.getMealOrderId()).thenReturn(1001);
        when(item.getMenuItemId()).thenReturn(1);
        when(item.getQuantity()).thenReturn(1);
        when(item.getUnitPrice()).thenReturn(BigDecimal.ZERO);
        when(item.getPreparationStatus()).thenReturn(MealOrderItemPreparationStatus.READY.name());
        when(item.getPreparationStatusValue()).thenReturn(MealOrderItemPreparationStatus.READY);

        when(orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(List.of(1001)))
                .thenReturn(List.of(item));

        MenuItem menuItem = mock(MenuItem.class);
        when(menuItem.getId()).thenReturn(1);
        when(menuItem.getItemName()).thenReturn("Cháo Yến Mạch Quả Mọng Hữu Cơ");
        when(menuItem.getPrice()).thenReturn(BigDecimal.ZERO);
        when(menuItemRepository.findAllById(anyList())).thenReturn(List.of(menuItem));

        when(bookingPort.getKitchenBookingContext(1)).thenReturn(new BookingContextPort.FnbBookingContext(
                1,
                1,
                "CHECKED_IN",
                orderDate.minusDays(1),
                orderDate.plusDays(3),
                "Eleanor Vance",
                "Villa #102 (Tranquil Garden)",
                "RET-DETOX-03",
                "3D2N Thải Độc & Thanh Lọc Tinh Khiết"
        ));

        when(dietaryProfilePort.getFoodProfileForUser(1)).thenReturn(new DietaryProfilePort.FoodProfileProjection(
                List.of("Crustaceans & Shellfish", "Peanuts"),
                List.of("Pescatarian", "Gluten-Conscious")
        ));

        KitchenOrderResponse response = mealOrderService.getKitchenOrder(1001);

        assertNotNull(response);
        assertEquals(1001, response.id());
        assertEquals("Eleanor Vance", response.guestFirstName());
        assertEquals("Villa #102 (Tranquil Garden)", response.villaNumber());
        assertEquals("READY", response.status());
        assertEquals("Warm water and light honey on the side, please", response.specialNotes());
        assertEquals(1, response.items().size());
        assertEquals("Cháo Yến Mạch Quả Mọng Hữu Cơ", response.items().get(0).itemName());
        assertEquals(1, response.items().get(0).quantity());
    }

    @Test
    @DisplayName("updateStatus from PENDING to PREPARING automatically consumes inventory and updates item status")
    void updateStatusToPreparingTriggersInventoryDeduction() {
        Integer orderId = 2001;
        MealOrderEntity order = mock(MealOrderEntity.class);
        when(order.getId()).thenReturn(orderId);
        when(order.getOrderStatusValue()).thenReturn(FnbOrderStatus.PENDING);
        when(order.getRetreatBookingId()).thenReturn(1);
        when(order.getOrderDate()).thenReturn(LocalDate.now());
        when(order.getMealType()).thenReturn("LUNCH");
        when(order.getOrderType()).thenReturn(FnbOrderType.DAILY_MEAL.name());
        when(order.getOrderTypeValue()).thenReturn(FnbOrderType.DAILY_MEAL);
        when(order.getCreatedAt()).thenReturn(LocalDateTime.now());
        when(orderRepository.findLockedById(orderId)).thenReturn(Optional.of(order));

        MealOrderItem item = mock(MealOrderItem.class);
        when(item.getId()).thenReturn(99);
        when(item.getMealOrderId()).thenReturn(orderId);
        when(item.getMenuItemId()).thenReturn(1);
        when(item.getQuantity()).thenReturn(2);
        when(item.getUnitPrice()).thenReturn(BigDecimal.ZERO);
        when(item.getPreparationStatusValue()).thenReturn(MealOrderItemPreparationStatus.PENDING);

        when(orderItemRepository.findByMealOrderIdOrderByIdAsc(orderId)).thenReturn(List.of(item));
        when(orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(List.of(orderId))).thenReturn(List.of(item));

        MenuItem menuItem = mock(MenuItem.class);
        when(menuItem.getId()).thenReturn(1);
        when(menuItem.getItemName()).thenReturn("Cháo Yến Mạch");
        when(menuItem.getPrice()).thenReturn(BigDecimal.ZERO);
        when(menuItemRepository.findAllById(anyList())).thenReturn(List.of(menuItem));

        when(bookingPort.getKitchenBookingContext(1)).thenReturn(new BookingContextPort.FnbBookingContext(
                1, 1, "CHECKED_IN", LocalDate.now(), LocalDate.now().plusDays(2), "Sarah", "Villa #101"
        ));
        when(dietaryProfilePort.getFoodProfileForUser(1)).thenReturn(new DietaryProfilePort.FoodProfileProjection(
                List.of(), List.of()
        ));

        mealOrderService.updateStatus(orderId, "PREPARING");

        // Verify inventory service was called to process stock consumption for order line 99
        verify(inventoryService).processConsumptionForOrderItem(eq(99), any(LocalDate.class));
        // Verify line preparation status set to PREPARING and saved
        verify(item).setPreparationStatus(MealOrderItemPreparationStatus.PREPARING);
        verify(orderItemRepository).save(item);
        // Verify order status set to PREPARING and saved
        verify(order).setOrderStatus(FnbOrderStatus.PREPARING);
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("updateStatus rejects invalid transition from DELIVERED to PENDING")
    void updateStatusRejectsDisallowedTransitions() {
        Integer orderId = 2002;
        MealOrderEntity order = mock(MealOrderEntity.class);
        when(order.getId()).thenReturn(orderId);
        when(order.getOrderStatusValue()).thenReturn(FnbOrderStatus.DELIVERED);
        when(orderRepository.findLockedById(orderId)).thenReturn(Optional.of(order));

        ConflictException exception = assertThrows(ConflictException.class, () ->
                mealOrderService.updateStatus(orderId, "PENDING"));

        assertEquals("INVALID_ORDER_TRANSITION", exception.getConflictCode());
    }

    @Test
    @DisplayName("updateStatus from PREPARING to READY advances lines to READY and does not consume inventory")
    void updateStatusToReadyAdvancesLinesWithoutDeduction() {
        Integer orderId = 2003;
        MealOrderEntity order = mock(MealOrderEntity.class);
        when(order.getId()).thenReturn(orderId);
        when(order.getOrderStatusValue()).thenReturn(FnbOrderStatus.PREPARING);
        when(order.getRetreatBookingId()).thenReturn(1);
        when(order.getOrderDate()).thenReturn(LocalDate.now());
        when(order.getMealType()).thenReturn("LUNCH");
        when(order.getOrderType()).thenReturn(FnbOrderType.DAILY_MEAL.name());
        when(order.getOrderTypeValue()).thenReturn(FnbOrderType.DAILY_MEAL);
        when(order.getCreatedAt()).thenReturn(LocalDateTime.now());
        when(orderRepository.findLockedById(orderId)).thenReturn(Optional.of(order));

        MealOrderItem item = mock(MealOrderItem.class);
        when(item.getId()).thenReturn(99);
        when(item.getMealOrderId()).thenReturn(orderId);
        when(item.getMenuItemId()).thenReturn(1);
        when(item.getQuantity()).thenReturn(2);
        when(item.getUnitPrice()).thenReturn(BigDecimal.ZERO);
        when(item.getPreparationStatusValue()).thenReturn(MealOrderItemPreparationStatus.PREPARING);

        when(orderItemRepository.findByMealOrderIdOrderByIdAsc(orderId)).thenReturn(List.of(item));
        when(orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(List.of(orderId))).thenReturn(List.of(item));

        MenuItem menuItem = mock(MenuItem.class);
        when(menuItem.getId()).thenReturn(1);
        when(menuItem.getItemName()).thenReturn("Cháo Yến Mạch");
        when(menuItem.getPrice()).thenReturn(BigDecimal.ZERO);
        when(menuItemRepository.findAllById(anyList())).thenReturn(List.of(menuItem));

        when(bookingPort.getKitchenBookingContext(1)).thenReturn(new BookingContextPort.FnbBookingContext(
                1, 1, "CHECKED_IN", LocalDate.now(), LocalDate.now().plusDays(2), "Sarah", "Villa #101"
        ));
        when(dietaryProfilePort.getFoodProfileForUser(1)).thenReturn(new DietaryProfilePort.FoodProfileProjection(
                List.of(), List.of()
        ));

        mealOrderService.updateStatus(orderId, "READY");

        // Verify inventory service was NEVER called on transitioning to READY
        verify(inventoryService, never()).processConsumptionForOrderItem(anyInt(), any(LocalDate.class));
        // Verify line preparation status set to READY and saved
        verify(item).setPreparationStatus(MealOrderItemPreparationStatus.READY);
        verify(orderItemRepository).save(item);
        // Verify order status set to READY and saved
        verify(order).setOrderStatus(FnbOrderStatus.READY);
        verify(orderRepository).save(order);
    }

    @Test
    @DisplayName("updateStatus rejects jumping directly from PENDING to READY or DELIVERED")
    void updateStatusRejectsSkippingOrderStages() {
        Integer orderId = 2004;
        MealOrderEntity order = mock(MealOrderEntity.class);
        when(order.getId()).thenReturn(orderId);
        when(order.getOrderStatusValue()).thenReturn(FnbOrderStatus.PENDING);
        when(orderRepository.findLockedById(orderId)).thenReturn(Optional.of(order));

        ConflictException exReady = assertThrows(ConflictException.class, () ->
                mealOrderService.updateStatus(orderId, "READY"));
        assertEquals("INVALID_ORDER_TRANSITION", exReady.getConflictCode());

        ConflictException exDelivered = assertThrows(ConflictException.class, () ->
                mealOrderService.updateStatus(orderId, "DELIVERED"));
        assertEquals("INVALID_ORDER_TRANSITION", exDelivered.getConflictCode());
    }

    @Test
    @DisplayName("Kitchen projection reflects UNVERIFIED dietary status and UNVERIFIED location when applicable")
    void kitchenOrderReflectsUnverifiedDietaryAndLocationStatus() {
        Integer orderId = 3001;
        MealOrderEntity order = mock(MealOrderEntity.class);
        when(order.getId()).thenReturn(orderId);
        when(order.getRetreatBookingId()).thenReturn(10);
        when(order.getOrderDate()).thenReturn(LocalDate.now());
        when(order.getMealType()).thenReturn("DINNER");
        when(order.getOrderType()).thenReturn("DAILY_MEAL");
        when(order.getOrderStatus()).thenReturn("PREPARING");
        when(order.getSpecialNotes()).thenReturn("[VENUE:IN_VILLA] Note");
        when(order.getCreatedAt()).thenReturn(LocalDateTime.now());

        when(orderRepository.findByOrderDateAndOrderStatusNotOrderByCreatedAtDesc(eq(LocalDate.now()), any()))
                .thenReturn(List.of(order));

        when(orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(List.of(orderId))).thenReturn(List.of());

        // Location is unverified (guest entered fallback)
        when(bookingPort.getKitchenBookingContext(10)).thenReturn(new BookingContextPort.FnbBookingContext(
                10, 5, "CHECKED_IN", LocalDate.now(), LocalDate.now().plusDays(2), "Guest", "Room 404 (Unverified)",
                "RET-DETOX-03", "Pure Detox", BookingContextPort.LocationVerificationStatus.UNVERIFIED_LOCATION
        ));

        // Dietary profile is UNVERIFIED
        when(dietaryProfilePort.getFoodProfileForUser(5)).thenReturn(new DietaryProfilePort.FoodProfileProjection(
                DietaryProfilePort.DietaryVerificationStatus.UNVERIFIED, List.of(), List.of()
        ));

        List<KitchenOrderResponse> kitchenOrders = mealOrderService.listKitchenOrders(LocalDate.now());
        assertEquals(1, kitchenOrders.size());
        KitchenOrderResponse ko = kitchenOrders.get(0);

        assertEquals("UNVERIFIED", ko.dietaryVerificationStatus());
        assertFalse(ko.dietaryProfileAvailable());
        assertEquals("UNVERIFIED_LOCATION", ko.locationVerificationStatus());
        assertEquals("NOT_APPLICABLE", ko.folioPostingStatus());
        assertTrue(ko.isVillaDelivery());
    }

    @Test
    @DisplayName("listUnpostedAlaCarteOrders correctly filters unposted A-la-carte orders for folio reconciliation")
    void listUnpostedAlaCarteOrdersFiltersCorrectly() {
        Integer orderId = 4001;
        MealOrderEntity order = mock(MealOrderEntity.class);
        when(order.getId()).thenReturn(orderId);
        when(order.getRetreatBookingId()).thenReturn(1);
        when(order.getOrderDate()).thenReturn(LocalDate.now());
        when(order.getMealType()).thenReturn("DINNER");
        when(order.getOrderType()).thenReturn("A_LA_CARTE");
        when(order.getOrderStatus()).thenReturn("DELIVERED");
        when(order.getSpecialNotes()).thenReturn("Extra order");
        when(order.getCreatedAt()).thenReturn(LocalDateTime.now());

        when(orderRepository.findByRetreatBookingIdOrderByOrderDateDescCreatedAtDesc(1))
                .thenReturn(List.of(order));

        MealOrderItem item = mock(MealOrderItem.class);
        when(item.getId()).thenReturn(50);
        when(item.getMealOrderId()).thenReturn(orderId);
        when(item.getMenuItemId()).thenReturn(1);
        when(item.getQuantity()).thenReturn(2);
        when(item.getUnitPrice()).thenReturn(new BigDecimal("150000.00"));
        when(item.getPreparationStatus()).thenReturn("READY");
        when(orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(List.of(orderId))).thenReturn(List.of(item));

        MenuItem menuItem = mock(MenuItem.class);
        when(menuItem.getId()).thenReturn(1);
        when(menuItem.getItemName()).thenReturn("Bào Ngư");
        when(menuItemRepository.findAllById(anyList())).thenReturn(List.of(menuItem));

        List<MealOrderResponse> unposted = mealOrderService.listUnpostedAlaCarteOrders(1);
        assertEquals(1, unposted.size());
        assertEquals("PENDING_RECONCILIATION", unposted.get(0).folioPostingStatus());
        assertEquals(new BigDecimal("300000.00"), unposted.get(0).subtotal());
    }

    @Test
    @DisplayName("Meal preparation status PREPARING is preserved when inventory returns NOT_CONFIGURED")
    void updateStatusToPreparingPersistsWhenRecipeNotConfigured() {
        Integer orderId = 5001;
        MealOrderEntity order = mock(MealOrderEntity.class);
        when(order.getId()).thenReturn(orderId);
        when(order.getRetreatBookingId()).thenReturn(1);
        when(order.getOrderDate()).thenReturn(LocalDate.now());
        when(order.getOrderStatusValue()).thenReturn(FnbOrderStatus.PENDING);
        when(orderRepository.findLockedById(orderId)).thenReturn(Optional.of(order));

        MealOrderItem item = mock(MealOrderItem.class);
        when(item.getId()).thenReturn(150);
        when(item.getMealOrderId()).thenReturn(orderId);
        when(item.getMenuItemId()).thenReturn(20);
        when(item.getQuantity()).thenReturn(1);
        when(item.getUnitPrice()).thenReturn(BigDecimal.ZERO);
        when(item.getPreparationStatusValue()).thenReturn(MealOrderItemPreparationStatus.PENDING);
        when(orderItemRepository.findByMealOrderIdOrderByIdAsc(orderId)).thenReturn(List.of(item));
        when(orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(List.of(orderId))).thenReturn(List.of(item));

        MenuItem menuItem = mock(MenuItem.class);
        when(menuItem.getId()).thenReturn(20);
        when(menuItem.getItemName()).thenReturn("Món Mới Chưa Công Thức");
        when(menuItemRepository.findAllById(anyList())).thenReturn(List.of(menuItem));

        when(bookingPort.getKitchenBookingContext(1)).thenReturn(new BookingContextPort.FnbBookingContext(
                1, 1, "CHECKED_IN", LocalDate.now(), LocalDate.now().plusDays(2), "Sarah", "Villa #101"
        ));
        when(dietaryProfilePort.getFoodProfileForUser(1)).thenReturn(new DietaryProfilePort.FoodProfileProjection(
                List.of(), List.of()
        ));

        when(inventoryService.processConsumptionForOrderItem(eq(150), any(LocalDate.class)))
                .thenReturn(new com.heavenstay.hswrms.m4fnb.dto.response.InventoryConsumptionRecord(
                        com.heavenstay.hswrms.m4fnb.entity.InventoryConsumptionStatus.NOT_CONFIGURED,
                        "Recipe not configured", LocalDateTime.now()));
        when(inventoryService.getConsumptionRecord(150))
                .thenReturn(new com.heavenstay.hswrms.m4fnb.dto.response.InventoryConsumptionRecord(
                        com.heavenstay.hswrms.m4fnb.entity.InventoryConsumptionStatus.NOT_CONFIGURED,
                        "Recipe not configured", LocalDateTime.now()));

        KitchenOrderResponse response = mealOrderService.updateStatus(orderId, "PREPARING");

        // Verify line and order preparation status were persisted as PREPARING
        verify(item).setPreparationStatus(MealOrderItemPreparationStatus.PREPARING);
        verify(orderItemRepository).save(item);
        verify(order).setOrderStatus(FnbOrderStatus.PREPARING);
        verify(orderRepository).save(order);

        // Verify inventory status reflects NOT_CONFIGURED
        assertEquals("NOT_CONFIGURED", response.inventoryStatus());
        assertEquals("NOT_CONFIGURED", response.items().get(0).inventoryStatus());
    }

    @Test
    @DisplayName("Meal preparation status PREPARING is preserved when inventory returns INSUFFICIENT_STOCK")
    void updateStatusToPreparingPersistsWhenInventoryInsufficient() {
        Integer orderId = 5002;
        MealOrderEntity order = mock(MealOrderEntity.class);
        when(order.getId()).thenReturn(orderId);
        when(order.getRetreatBookingId()).thenReturn(1);
        when(order.getOrderDate()).thenReturn(LocalDate.now());
        when(order.getOrderStatusValue()).thenReturn(FnbOrderStatus.PENDING);
        when(orderRepository.findLockedById(orderId)).thenReturn(Optional.of(order));

        MealOrderItem item = mock(MealOrderItem.class);
        when(item.getId()).thenReturn(151);
        when(item.getMealOrderId()).thenReturn(orderId);
        when(item.getMenuItemId()).thenReturn(21);
        when(item.getQuantity()).thenReturn(2);
        when(item.getUnitPrice()).thenReturn(BigDecimal.ZERO);
        when(item.getPreparationStatusValue()).thenReturn(MealOrderItemPreparationStatus.PENDING);
        when(orderItemRepository.findByMealOrderIdOrderByIdAsc(orderId)).thenReturn(List.of(item));
        when(orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(List.of(orderId))).thenReturn(List.of(item));

        MenuItem menuItem = mock(MenuItem.class);
        when(menuItem.getId()).thenReturn(21);
        when(menuItem.getItemName()).thenReturn("Cá Hồi Hấp");
        when(menuItemRepository.findAllById(anyList())).thenReturn(List.of(menuItem));

        when(bookingPort.getKitchenBookingContext(1)).thenReturn(new BookingContextPort.FnbBookingContext(
                1, 1, "CHECKED_IN", LocalDate.now(), LocalDate.now().plusDays(2), "Sarah", "Villa #101"
        ));
        when(dietaryProfilePort.getFoodProfileForUser(1)).thenReturn(new DietaryProfilePort.FoodProfileProjection(
                List.of(), List.of()
        ));

        when(inventoryService.processConsumptionForOrderItem(eq(151), any(LocalDate.class)))
                .thenReturn(new com.heavenstay.hswrms.m4fnb.dto.response.InventoryConsumptionRecord(
                        com.heavenstay.hswrms.m4fnb.entity.InventoryConsumptionStatus.INSUFFICIENT_STOCK,
                        "Insufficient stock", LocalDateTime.now()));
        when(inventoryService.getConsumptionRecord(151))
                .thenReturn(new com.heavenstay.hswrms.m4fnb.dto.response.InventoryConsumptionRecord(
                        com.heavenstay.hswrms.m4fnb.entity.InventoryConsumptionStatus.INSUFFICIENT_STOCK,
                        "Insufficient stock", LocalDateTime.now()));

        KitchenOrderResponse response = mealOrderService.updateStatus(orderId, "PREPARING");

        // Verify line and order preparation status were persisted as PREPARING
        verify(item).setPreparationStatus(MealOrderItemPreparationStatus.PREPARING);
        verify(orderItemRepository).save(item);
        verify(order).setOrderStatus(FnbOrderStatus.PREPARING);
        verify(orderRepository).save(order);

        // Verify inventory status reflects INSUFFICIENT_STOCK
        assertEquals("INSUFFICIENT_STOCK", response.inventoryStatus());
        assertEquals("INSUFFICIENT_STOCK", response.items().get(0).inventoryStatus());
    }
}
