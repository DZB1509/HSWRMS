package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMealOrderLineRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMealOrderRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderLineResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderResponse;
import com.heavenstay.hswrms.m4fnb.entity.FnbOrderStatus;
import com.heavenstay.hswrms.m4fnb.entity.FnbOrderType;
import com.heavenstay.hswrms.m4fnb.entity.MealOrder;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderItem;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderItemPreparationStatus;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import com.heavenstay.hswrms.m4fnb.event.AlaCarteOrderPlacedEvent;
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
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class MealOrderService {
    private final MealOrderRepository orderRepository;
    private final MealOrderItemRepository orderItemRepository;
    private final MenuItemRepository menuItemRepository;
    private final MenuItemIngredientRepository recipeRepository;
    private final MealOrderMapper mealOrderMapper;
    private final MenuService menuService;
    private final InventoryService inventoryService;
    private final ObjectProvider<BookingContextPort> bookingContextPortProvider;
    private final ObjectProvider<DietaryProfilePort> dietaryProfilePortProvider;
    private final ApplicationEventPublisher eventPublisher;

    public MealOrderService(MealOrderRepository orderRepository, MealOrderItemRepository orderItemRepository,
            MenuItemRepository menuItemRepository, MenuItemIngredientRepository recipeRepository,
            MealOrderMapper mealOrderMapper, MenuService menuService, InventoryService inventoryService,
            ObjectProvider<BookingContextPort> bookingContextPortProvider,
            ObjectProvider<DietaryProfilePort> dietaryProfilePortProvider,
            ApplicationEventPublisher eventPublisher) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.menuItemRepository = menuItemRepository;
        this.recipeRepository = recipeRepository;
        this.mealOrderMapper = mealOrderMapper;
        this.menuService = menuService;
        this.inventoryService = inventoryService;
        this.bookingContextPortProvider = bookingContextPortProvider;
        this.dietaryProfilePortProvider = dietaryProfilePortProvider;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public MealOrderResponse placeDailyMealOrder(Integer userId, CreateMealOrderRequest request) {
        return placeOrder(userId, request, FnbOrderType.DAILY_MEAL);
    }

    @Transactional
    public MealOrderResponse placeAlaCarteOrder(Integer userId, CreateMealOrderRequest request) {
        return placeOrder(userId, request, FnbOrderType.A_LA_CARTE);
    }

    @Transactional
    public MealOrderResponse updateDailyMealSelection(Integer userId, Integer orderId,
            CreateMealOrderRequest request) {
        MealOrder order = orderRepository.findLockedById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MealOrder", "id", orderId));
        if (order.getOrderTypeValue() != FnbOrderType.DAILY_MEAL
                || order.getOrderStatusValue() != FnbOrderStatus.PENDING) {
            throw new ConflictException("MEAL_SELECTION_LOCKED",
                    "Only pending daily meal selections can be changed.");
        }
        if (!order.getRetreatBookingId().equals(request.bookingId())
                || !order.getOrderDate().equals(request.orderDate())
                || order.getMealType() == null
                || !order.getMealType().equalsIgnoreCase(request.mealType())) {
            throw new BusinessRuleException("MEAL_SELECTION_SCOPE_CHANGED",
                    "A selection update must keep the same booking, date, and meal period.");
        }
        requireBookingPort().requireEligibleCustomerBooking(userId, order.getRetreatBookingId(), order.getOrderDate());
        DietaryProfilePort.FoodProfileProjection profile = requireFoodProfile(userId);
        List<MenuItem> selectedItems = validateOrderItems(request, FnbOrderType.DAILY_MEAL, profile);

        order.setSpecialNotes(normalizeNotes(request.specialNotes()));
        orderRepository.save(order);
        orderItemRepository.deleteByMealOrderId(orderId);
        List<MealOrderItem> replacementLines = new ArrayList<>();
        for (int index = 0; index < request.items().size(); index++) {
            CreateMealOrderLineRequest requestedLine = request.items().get(index);
            MenuItem menuItem = selectedItems.get(index);
            replacementLines
                    .add(new MealOrderItem(orderId, menuItem.getId(), requestedLine.quantity(), BigDecimal.ZERO));
        }
        List<MealOrderItem> savedLines = orderItemRepository.saveAll(replacementLines);
        Map<Integer, MenuItem> itemMap = indexMenuItems(selectedItems);
        return mealOrderMapper.toResponse(order, savedLines, itemMap);
    }

    private MealOrderResponse placeOrder(Integer userId, CreateMealOrderRequest request, FnbOrderType orderType) {
        requireBookingPort().requireEligibleCustomerBooking(userId, request.bookingId(), request.orderDate());
        DietaryProfilePort.FoodProfileProjection profile = requireFoodProfile(userId);
        if (orderType == FnbOrderType.DAILY_MEAL && orderRepository
                .existsByRetreatBookingIdAndOrderDateAndMealTypeAndOrderTypeAndOrderStatusNot(
                        request.bookingId(), request.orderDate(), request.mealType().toUpperCase(),
                        orderType.name(), FnbOrderStatus.CANCELLED.name())) {
            throw new ConflictException("DAILY_MEAL_ALREADY_SELECTED",
                    "A daily meal selection already exists for this booking, date, and meal period.");
        }
        List<MenuItem> selectedItems = validateOrderItems(request, orderType, profile);

        LocalDateTime createdAt = LocalDateTime.now();
        MealOrder unsavedOrder = new MealOrder(request.bookingId(), request.orderDate(),
                request.mealType().toUpperCase(), orderType, FnbOrderStatus.PENDING, createdAt,
                normalizeNotes(request.specialNotes()));
        MealOrder order;
        try {
            order = orderType == FnbOrderType.DAILY_MEAL
                    ? orderRepository.saveAndFlush(unsavedOrder)
                    : orderRepository.save(unsavedOrder);
        } catch (DataIntegrityViolationException exception) {
            if (orderType != FnbOrderType.DAILY_MEAL)
                throw exception;
            throw new ConflictException("DAILY_MEAL_ALREADY_SELECTED",
                    "A daily meal selection already exists for this booking, date, and meal period.");
        }
        List<MealOrderItem> orderLines = new ArrayList<>();
        for (int index = 0; index < request.items().size(); index++) {
            CreateMealOrderLineRequest requestedLine = request.items().get(index);
            MenuItem menuItem = selectedItems.get(index);
            BigDecimal capturedPrice = orderType == FnbOrderType.A_LA_CARTE ? menuItem.getPrice() : BigDecimal.ZERO;
            orderLines.add(new MealOrderItem(order.getId(), menuItem.getId(), requestedLine.quantity(), capturedPrice));
        }
        List<MealOrderItem> savedLines = orderItemRepository.saveAll(orderLines);
        Map<Integer, MenuItem> itemMap = indexMenuItems(selectedItems);
        MealOrderResponse response = mealOrderMapper.toResponse(order, savedLines, itemMap);
        if (orderType == FnbOrderType.A_LA_CARTE) {
            eventPublisher.publishEvent(new AlaCarteOrderPlacedEvent(order.getId(), order.getRetreatBookingId(),
                    response.subtotal(), createdAt));
        }
        return response;
    }

    private List<MenuItem> validateOrderItems(CreateMealOrderRequest request, FnbOrderType orderType,
            DietaryProfilePort.FoodProfileProjection profile) {
        Set<Integer> uniqueMenuIds = new HashSet<>();
        List<MenuItem> selectedItems = new ArrayList<>();
        for (CreateMealOrderLineRequest requestedLine : request.items()) {
            Integer menuItemId = requestedLine.menuItemId();
            if (menuItemId == null) {
                throw new BusinessRuleException("INVALID_ORDER_ITEM", "Each order line must reference a menu item.");
            }
            if (!uniqueMenuIds.add(menuItemId)) {
                throw new BusinessRuleException("DUPLICATE_ORDER_ITEM", "An order may include a menu item only once.");
            }
            MenuItem menuItem = menuItemRepository.findById(menuItemId)
                    .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", menuItemId));
            if (menuService.conflictsWithFoodProfile(menuItem, profile)) {
                throw new BusinessRuleException("PERSONALIZED_MENU_CONFLICT",
                        "The order contains a menu item excluded by the customer's allergy or dietary profile.");
            }
            var recipe = recipeRepository.findByMenuItemIdOrderByIngredientIdAsc(menuItem.getId());
            var availability = menuService.availability(menuItem, recipe, request.orderDate());
            if (!availability.available() || availability.servingsAvailable() < requestedLine.quantity()) {
                throw new BusinessRuleException("MENU_ITEM_UNAVAILABLE",
                        "The requested menu item does not have enough usable stock for the requested servings.");
            }
            if (orderType == FnbOrderType.A_LA_CARTE && menuItem.getPrice().signum() <= 0) {
                throw new BusinessRuleException("ALA_CARTE_PRICE_REQUIRED",
                        "A-la-carte orders require a menu item with a positive price.");
            }
            selectedItems.add(menuItem);
        }
        return selectedItems;
    }

    public List<MealOrderResponse> listCustomerOrders(Integer userId, Integer bookingId) {
        requireBookingPort().requireOwnedCustomerBooking(userId, bookingId);
        List<MealOrder> orders = orderRepository.findByRetreatBookingIdOrderByOrderDateDescCreatedAtDesc(bookingId);
        return mapOrders(orders);
    }

    public MealOrderResponse getCustomerOrder(Integer userId, Integer orderId) {
        MealOrder order = findOrder(orderId);
        requireBookingPort().requireOwnedCustomerBooking(userId, order.getRetreatBookingId());
        return mapOrders(List.of(order)).get(0);
    }

    public List<KitchenOrderResponse> listKitchenOrders(LocalDate orderDate) {
        List<MealOrder> orders = orderRepository.findByOrderDateAndOrderStatusNotOrderByCreatedAtAsc(orderDate,
                "CANCELLED");
        return mapKitchenOrders(orders);
    }

    public KitchenOrderResponse getKitchenOrder(Integer orderId) {
        return mapKitchenOrders(List.of(findOrder(orderId))).get(0);
    }

    @Transactional
    public KitchenOrderResponse updateStatus(Integer orderId, String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            throw new BusinessRuleException("INVALID_ORDER_STATUS", "Order status is required.");
        }
        FnbOrderStatus requestedStatus;
        try {
            requestedStatus = FnbOrderStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessRuleException("INVALID_ORDER_STATUS", "Order status is not supported.");
        }
        MealOrder order = orderRepository.findLockedById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MealOrder", "id", orderId));
        FnbOrderStatus currentStatus = order.getOrderStatusValue();
        if (currentStatus == requestedStatus)
            return mapKitchenOrders(List.of(order)).get(0);
        if (!isAllowedTransition(currentStatus, requestedStatus)) {
            throw new ConflictException("INVALID_ORDER_TRANSITION",
                    "Order status cannot transition from " + currentStatus + " to " + requestedStatus + ".");
        }

        // Operational workflow: Automatically deduct inventory when updating order to PREPARING
        if (currentStatus == FnbOrderStatus.PENDING && requestedStatus == FnbOrderStatus.PREPARING) {
            List<MealOrderItem> orderLines = orderItemRepository.findByMealOrderIdOrderByIdAsc(orderId);
            for (MealOrderItem line : orderLines) {
                if (line.getPreparationStatusValue() == MealOrderItemPreparationStatus.PENDING) {
                    inventoryService.consumeForOrderItem(line.getId(), LocalDate.now());
                    line.setPreparationStatus(MealOrderItemPreparationStatus.PREPARING);
                    orderItemRepository.save(line);
                }
            }
        }

        order.setOrderStatus(requestedStatus);
        orderRepository.save(order);
        return mapKitchenOrders(List.of(order)).get(0);
    }

    @Transactional
    public KitchenOrderResponse updateItemPreparationStatus(Integer orderId, Integer orderLineId, String rawStatus) {
        if (rawStatus == null || rawStatus.isBlank()) {
            throw new BusinessRuleException("INVALID_PREPARATION_STATUS", "Preparation status is required.");
        }
        MealOrderItemPreparationStatus requestedStatus;
        try {
            requestedStatus = MealOrderItemPreparationStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessRuleException("INVALID_PREPARATION_STATUS", "Preparation status is not supported.");
        }

        MealOrder order = orderRepository.findLockedById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MealOrder", "id", orderId));
        if (order.getOrderStatusValue() == FnbOrderStatus.CANCELLED
                || order.getOrderStatusValue() == FnbOrderStatus.DELIVERED) {
            throw new ConflictException("ORDER_NOT_PREPARABLE", "Cancelled or delivered orders cannot be prepared.");
        }
        if (orderLineId == null) {
            throw new ResourceNotFoundException("MealOrderItem", "id", null);
        }
        MealOrderItem orderLine = orderItemRepository.findById(orderLineId)
                .filter(line -> orderId.equals(line.getMealOrderId()))
                .orElseThrow(() -> new ResourceNotFoundException("MealOrderItem", "id", orderLineId));

        MealOrderItemPreparationStatus current = orderLine.getPreparationStatusValue();
        if (current == requestedStatus)
            return mapKitchenOrders(List.of(order)).get(0);
        boolean startPreparation = current == MealOrderItemPreparationStatus.PENDING
                && requestedStatus == MealOrderItemPreparationStatus.PREPARING;
        boolean markReady = current == MealOrderItemPreparationStatus.PREPARING
                && requestedStatus == MealOrderItemPreparationStatus.READY;
        if (!startPreparation && !markReady) {
            throw new ConflictException("INVALID_PREPARATION_TRANSITION",
                    "Meal item status can only move PENDING → PREPARING → READY.");
        }

        ensureKitchenDietaryProjection(order.getRetreatBookingId());
        if (startPreparation) {
            // Automatically deduct inventory when F&B staff update an item's status to "in preparation" (PREPARING)
            inventoryService.consumeForOrderItem(orderLine.getId(), LocalDate.now());
        }
        orderLine.setPreparationStatus(requestedStatus);
        orderItemRepository.save(orderLine);

        List<MealOrderItem> orderLines = orderItemRepository.findByMealOrderIdOrderByIdAsc(orderId);
        boolean allReady = !orderLines.isEmpty();
        for (MealOrderItem line : orderLines) {
            if (line.getPreparationStatusValue() != MealOrderItemPreparationStatus.READY) {
                allReady = false;
                break;
            }
        }
        if (allReady) {
            order.setOrderStatus(FnbOrderStatus.READY);
        } else {
            order.setOrderStatus(FnbOrderStatus.PREPARING);
        }
        orderRepository.save(order);
        return mapKitchenOrders(List.of(order)).get(0);
    }

    private boolean isAllowedTransition(FnbOrderStatus current, FnbOrderStatus requested) {
        return switch (current) {
            case PENDING -> requested == FnbOrderStatus.PREPARING || requested == FnbOrderStatus.CANCELLED;
            case PREPARING -> requested == FnbOrderStatus.READY || requested == FnbOrderStatus.CANCELLED;
            case READY -> requested == FnbOrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
    }

    private MealOrder findOrder(Integer orderId) {
        if (orderId == null) {
            throw new BusinessRuleException("INVALID_MEAL_ORDER_ID", "Meal order ID is required.");
        }
        Integer safeOrderId = orderId;
        return orderRepository.findById(safeOrderId)
                .orElseThrow(() -> new ResourceNotFoundException("MealOrder", "id", safeOrderId));
    }

    private List<MealOrderResponse> mapOrders(List<MealOrder> orders) {
        if (orders.isEmpty())
            return List.of();
        List<Integer> orderIds = new ArrayList<>(orders.size());
        for (MealOrder order : orders) {
            Integer persistedOrderId = order.getId();
            if (persistedOrderId == null) {
                throw new BusinessRuleException("INVALID_MEAL_ORDER_ID", "Meal order must have a persisted ID.");
            }
            orderIds.add(persistedOrderId);
        }
        List<MealOrderItem> lines = orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(orderIds);
        Map<Integer, List<MealOrderItem>> linesByOrder = new LinkedHashMap<>();
        for (MealOrderItem line : lines) {
            Integer mealOrderId = line.getMealOrderId();
            if (mealOrderId == null) {
                throw new BusinessRuleException("INVALID_MEAL_ORDER_LINE", "Meal order line has no order ID.");
            }
            List<MealOrderItem> orderLines = linesByOrder.get(mealOrderId);
            if (orderLines == null) {
                orderLines = new ArrayList<>();
                linesByOrder.put(mealOrderId, orderLines);
            }
            orderLines.add(line);
        }
        Map<Integer, MenuItem> menuItems = loadMenuItems(lines);
        List<MealOrderResponse> responses = new ArrayList<>(orders.size());
        for (MealOrder order : orders) {
            Integer persistedOrderId = order.getId();
            if (persistedOrderId == null) {
                throw new BusinessRuleException("INVALID_MEAL_ORDER_ID", "Meal order must have a persisted ID.");
            }
            responses.add(mealOrderMapper.toResponse(order,
                    linesByOrder.getOrDefault(persistedOrderId, List.of()), menuItems));
        }
        return responses;
    }

    private List<KitchenOrderResponse> mapKitchenOrders(List<MealOrder> orders) {
        if (orders.isEmpty())
            return List.of();
        List<MealOrderResponse> baseOrders = mapOrders(orders);
        BookingContextPort bookingPort = requireBookingPort();
        List<KitchenOrderResponse> result = new ArrayList<>();
        for (MealOrderResponse order : baseOrders) {
            BookingContextPort.FnbBookingContext booking = bookingPort.getKitchenBookingContext(order.bookingId());
            if (booking == null || booking.customerUserId() == null) {
                throw new BusinessRuleException("M2_KITCHEN_CONTEXT_UNAVAILABLE",
                        "Kitchen order details require the minimal M2 booking context.");
            }
            DietaryProfilePort.FoodProfileProjection profile = requireFoodProfile(booking.customerUserId());
            List<KitchenOrderLineResponse> kitchenLines = new ArrayList<>(order.items().size());
            for (var line : order.items()) {
                kitchenLines.add(new KitchenOrderLineResponse(line.id(), line.menuItemId(), line.itemName(),
                        line.quantity(), line.preparationStatus()));
            }
            result.add(new KitchenOrderResponse(order.id(), order.bookingId(),
                    booking.guestFirstName(), booking.villaNumber(), order.orderDate(), order.mealType(),
                    order.orderType(), order.status(), order.specialNotes(), true,
                    profile.foodAllergies(), profile.dietaryPreferences(), kitchenLines));
        }
        return result;
    }

    private Map<Integer, MenuItem> loadMenuItems(List<MealOrderItem> lines) {
        Map<Integer, MenuItem> result = new HashMap<>();
        Set<Integer> menuItemIds = new HashSet<>();
        for (MealOrderItem line : lines) {
            Integer menuItemId = line.getMenuItemId();
            if (menuItemId == null) {
                throw new BusinessRuleException("INVALID_MEAL_ORDER_LINE", "Meal order line has no menu item ID.");
            }
            menuItemIds.add(menuItemId);
        }
        for (MenuItem item : menuItemRepository.findAllById(new ArrayList<>(menuItemIds))) {
            Integer menuItemId = item.getId();
            if (menuItemId == null) {
                throw new BusinessRuleException("INVALID_MENU_ITEM_ID", "Menu item must have a persisted ID.");
            }
            result.put(menuItemId, item);
        }
        return result;
    }

    private Map<Integer, MenuItem> indexMenuItems(List<MenuItem> items) {
        Map<Integer, MenuItem> indexedItems = new HashMap<>();
        for (MenuItem item : items) {
            Integer menuItemId = item.getId();
            if (menuItemId == null) {
                throw new BusinessRuleException("INVALID_MENU_ITEM_ID", "Menu item must have a persisted ID.");
            }
            indexedItems.put(menuItemId, item);
        }
        return indexedItems;
    }

    private String normalizeNotes(String notes) {
        return notes == null || notes.isBlank() ? null : notes.trim();
    }

    private BookingContextPort requireBookingPort() {
        BookingContextPort port = bookingContextPortProvider.getIfAvailable();
        if (port == null) {
            throw new BusinessRuleException("M2_BOOKING_INTEGRATION_UNAVAILABLE",
                    "Customer meal ordering requires the M2 public booking integration to be configured.");
        }
        return port;
    }

    private void ensureKitchenDietaryProjection(Integer bookingId) {
        BookingContextPort.FnbBookingContext booking = requireBookingPort().getKitchenBookingContext(bookingId);
        if (booking == null || booking.customerUserId() == null) {
            throw new BusinessRuleException("M2_KITCHEN_CONTEXT_UNAVAILABLE",
                    "The order cannot be prepared until the minimal M2 kitchen booking context is available.");
        }
        requireFoodProfile(booking.customerUserId());
    }

    private DietaryProfilePort.FoodProfileProjection requireFoodProfile(Integer userId) {
        DietaryProfilePort.FoodProfileProjection profile = requireDietaryPort().getFoodProfileForUser(userId);
        if (profile == null) {
            throw new BusinessRuleException("M1_DIETARY_PROFILE_UNAVAILABLE",
                    "The operation cannot continue until M1 confirms the customer's food allergy and dietary projection.");
        }
        return profile;
    }

    private DietaryProfilePort requireDietaryPort() {
        DietaryProfilePort port = dietaryProfilePortProvider.getIfAvailable();
        if (port == null) {
            throw new BusinessRuleException("M1_DIETARY_INTEGRATION_UNAVAILABLE",
                    "Customer meal ordering requires the M1 food allergy and dietary projection to be configured.");
        }
        return port;
    }
}
