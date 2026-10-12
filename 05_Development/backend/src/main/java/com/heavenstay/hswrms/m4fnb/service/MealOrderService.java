package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMealOrderLineRequest;
import com.heavenstay.hswrms.m4fnb.dto.request.CreateMealOrderRequest;
import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.KitchenOrderLineResponse;
import com.heavenstay.hswrms.m4fnb.dto.response.MealOrderLineResponse;
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
import java.util.stream.Collectors;
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
        if (order.getOrderTypeValue() != FnbOrderType.DAILY_MEAL || order.getOrderStatusValue() != FnbOrderStatus.PENDING) {
            throw new ConflictException("MEAL_SELECTION_LOCKED",
                    "Only pending daily meal selections can be changed.");
        }
        if (!order.getRetreatBookingId().equals(request.bookingId())
                || !order.getOrderDate().equals(request.orderDate())
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
            replacementLines.add(new MealOrderItem(orderId, menuItem.getId(), requestedLine.quantity(), BigDecimal.ZERO));
        }
        List<MealOrderItem> savedLines = orderItemRepository.saveAll(replacementLines);
        Map<Integer, MenuItem> itemMap = selectedItems.stream().collect(Collectors.toMap(MenuItem::getId, item -> item));
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
            if (orderType != FnbOrderType.DAILY_MEAL) throw exception;
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
        Map<Integer, MenuItem> itemMap = selectedItems.stream().collect(Collectors.toMap(MenuItem::getId, item -> item));
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
            if (!uniqueMenuIds.add(requestedLine.menuItemId())) {
                throw new BusinessRuleException("DUPLICATE_ORDER_ITEM", "An order may include a menu item only once.");
            }
            MenuItem menuItem = menuItemRepository.findById(requestedLine.menuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("MenuItem", "id", requestedLine.menuItemId()));
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
        List<MealOrder> orders = orderRepository.findByOrderDateAndOrderStatusNotOrderByCreatedAtAsc(orderDate, "CANCELLED");
        return mapKitchenOrders(orders);
    }

    public KitchenOrderResponse getKitchenOrder(Integer orderId) {
        return mapKitchenOrders(List.of(findOrder(orderId))).get(0);
    }

    @Transactional
    public KitchenOrderResponse updateStatus(Integer orderId, String rawStatus) {
        FnbOrderStatus requestedStatus;
        try {
            requestedStatus = FnbOrderStatus.valueOf(rawStatus.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessRuleException("INVALID_ORDER_STATUS", "Order status is not supported.");
        }
        MealOrder order = orderRepository.findLockedById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MealOrder", "id", orderId));
        FnbOrderStatus currentStatus = order.getOrderStatusValue();
        if (currentStatus == requestedStatus) return mapKitchenOrders(List.of(order)).get(0);
        if (!isAllowedTransition(currentStatus, requestedStatus)) {
            throw new ConflictException("INVALID_ORDER_TRANSITION",
                    "Order status cannot transition from " + currentStatus + " to " + requestedStatus + ".");
        }
        order.setOrderStatus(requestedStatus);
        orderRepository.save(order);
        return mapKitchenOrders(List.of(order)).get(0);
    }

    @Transactional
    public KitchenOrderResponse updateItemPreparationStatus(Integer orderId, Integer orderLineId, String rawStatus) {
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
        MealOrderItem orderLine = orderItemRepository.findById(orderLineId)
                .filter(line -> line.getMealOrderId().equals(orderId))
                .orElseThrow(() -> new ResourceNotFoundException("MealOrderItem", "id", orderLineId));

        MealOrderItemPreparationStatus current = orderLine.getPreparationStatusValue();
        if (current == requestedStatus) return mapKitchenOrders(List.of(order)).get(0);
        boolean startPreparation = current == MealOrderItemPreparationStatus.PENDING
                && requestedStatus == MealOrderItemPreparationStatus.PREPARING;
        boolean markReady = current == MealOrderItemPreparationStatus.PREPARING
                && requestedStatus == MealOrderItemPreparationStatus.READY;
        if (!startPreparation && !markReady) {
            throw new ConflictException("INVALID_PREPARATION_TRANSITION",
                    "Meal item status can only move PENDING → PREPARING → READY.");
        }

        ensureKitchenDietaryProjection(order.getRetreatBookingId());
        if (markReady) {
            // Deduction and line status update share this service transaction; retrying READY is idempotent.
            inventoryService.consumeForOrderItem(orderLine.getId(), LocalDate.now());
        }
        orderLine.setPreparationStatus(requestedStatus);
        orderItemRepository.save(orderLine);

        List<MealOrderItem> orderLines = orderItemRepository.findByMealOrderIdOrderByIdAsc(orderId);
        if (orderLines.stream().allMatch(line -> line.getPreparationStatusValue() == MealOrderItemPreparationStatus.READY)) {
            order.setOrderStatus(FnbOrderStatus.READY);
        } else {
            order.setOrderStatus(FnbOrderStatus.PREPARING);
        }
        orderRepository.save(order);
        return mapKitchenOrders(List.of(order)).get(0);
    }

    private boolean isAllowedTransition(FnbOrderStatus current, FnbOrderStatus requested) {
        return switch (current) {
            case PENDING -> requested == FnbOrderStatus.CANCELLED;
            case PREPARING -> false;
            case READY -> requested == FnbOrderStatus.DELIVERED;
            case DELIVERED, CANCELLED -> false;
        };
    }

    private MealOrder findOrder(Integer orderId) {
        return orderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("MealOrder", "id", orderId));
    }

    private List<MealOrderResponse> mapOrders(List<MealOrder> orders) {
        if (orders.isEmpty()) return List.of();
        List<Integer> orderIds = orders.stream().map(MealOrder::getId).toList();
        List<MealOrderItem> lines = orderItemRepository.findByMealOrderIdInOrderByMealOrderIdAscIdAsc(orderIds);
        Map<Integer, List<MealOrderItem>> linesByOrder = lines.stream()
                .collect(Collectors.groupingBy(MealOrderItem::getMealOrderId, LinkedHashMap::new, Collectors.toList()));
        Map<Integer, MenuItem> menuItems = loadMenuItems(lines);
        return orders.stream().map(order -> mealOrderMapper.toResponse(order,
                linesByOrder.getOrDefault(order.getId(), List.of()), menuItems)).toList();
    }

    private List<KitchenOrderResponse> mapKitchenOrders(List<MealOrder> orders) {
        if (orders.isEmpty()) return List.of();
        List<MealOrderResponse> baseOrders = mapOrders(orders);
        BookingContextPort bookingPort = bookingContextPortProvider.getIfAvailable();
        DietaryProfilePort dietaryPort = dietaryProfilePortProvider.getIfAvailable();
        List<KitchenOrderResponse> result = new ArrayList<>();
        for (MealOrderResponse order : baseOrders) {
            BookingContextPort.FnbBookingContext booking = bookingPort == null ? null
                    : bookingPort.getKitchenBookingContext(order.bookingId());
            DietaryProfilePort.FoodProfileProjection profile = booking == null || dietaryPort == null ? null
                    : dietaryPort.getFoodProfileForUser(booking.customerUserId());
            List<KitchenOrderLineResponse> kitchenLines = order.items().stream()
                    .map(line -> new KitchenOrderLineResponse(line.id(), line.menuItemId(), line.itemName(),
                            line.quantity(), line.preparationStatus()))
                    .toList();
            result.add(new KitchenOrderResponse(order.id(), order.bookingId(),
                    booking == null ? null : booking.guestFirstName(),
                    booking == null ? null : booking.villaNumber(), order.orderDate(), order.mealType(),
                    order.orderType(), order.status(), order.specialNotes(), profile != null,
                    profile == null ? List.of() : profile.foodAllergies(),
                    profile == null ? List.of() : profile.dietaryPreferences(), kitchenLines));
        }
        return result;
    }

    private Map<Integer, MenuItem> loadMenuItems(List<MealOrderItem> lines) {
        Map<Integer, MenuItem> result = new HashMap<>();
        menuItemRepository.findAllById(lines.stream().map(MealOrderItem::getMenuItemId).distinct().toList())
                .forEach(item -> result.put(item.getId(), item));
        return result;
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
