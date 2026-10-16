package com.heavenstay.hswrms.m4fnb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderResponse;
import com.heavenstay.hswrms.m4fnb.entity.FnbOrderStatus;
import com.heavenstay.hswrms.m4fnb.entity.FnbOrderType;
import com.heavenstay.hswrms.m4fnb.entity.MealOrder;
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

        MealOrder order1 = mock(MealOrder.class);
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

        MealOrder order2 = mock(MealOrder.class);
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

        MealOrder order = mock(MealOrder.class);
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
}
