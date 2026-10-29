package com.heavenstay.hswrms.m4fnb.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m4fnb.dto.*;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderItem;
import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import com.heavenstay.hswrms.m4fnb.integration.BookingContextPort;
import com.heavenstay.hswrms.m4fnb.integration.DietaryProfilePort;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderItemRepository;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m4fnb.repository.MenuItemRepository;
import com.heavenstay.hswrms.m5billing.dto.PostChargeRequestDTO;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Transactional
public class FnbKdsOrderServiceImpl implements FnbKdsOrderService {

    private static final Logger log = LoggerFactory.getLogger(FnbKdsOrderServiceImpl.class);

    private final MealOrderRepository mealOrderRepository;
    private final MenuItemRepository menuItemRepository;
    private final MealOrderItemRepository mealOrderItemRepository;
    private final RetreatBookingRepository bookingRepository;
    private final BookingContextPort bookingContextPort;
    private final DietaryProfilePort dietaryProfilePort;
    private final FolioBillingService folioBillingService;
    private final FolioItemRepository folioItemRepository;
    private final AuditLogService auditLogService;

    public FnbKdsOrderServiceImpl(MealOrderRepository mealOrderRepository,
                                MenuItemRepository menuItemRepository,
                                MealOrderItemRepository mealOrderItemRepository,
                                RetreatBookingRepository bookingRepository,
                                BookingContextPort bookingContextPort,
                                DietaryProfilePort dietaryProfilePort,
                                FolioBillingService folioBillingService,
                                FolioItemRepository folioItemRepository,
                                AuditLogService auditLogService) {
        this.mealOrderRepository = mealOrderRepository;
        this.menuItemRepository = menuItemRepository;
        this.mealOrderItemRepository = mealOrderItemRepository;
        this.bookingRepository = bookingRepository;
        this.bookingContextPort = bookingContextPort;
        this.dietaryProfilePort = dietaryProfilePort;
        this.folioBillingService = folioBillingService;
        this.folioItemRepository = folioItemRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MenuItemDto> getAvailableMenuItems(String category, String mealPeriod) {
        List<MenuItem> items = menuItemRepository.findAllAvailable();
        return items.stream()
                .filter(i -> category == null || category.equalsIgnoreCase(i.getCategory()))
                .filter(i -> mealPeriod == null || i.getMealType() == null || i.getMealType().toLowerCase().contains(mealPeriod.toLowerCase()) || i.getMealType().equalsIgnoreCase("ALL_DAY"))
                .map(this::mapToMenuItemDto)
                .collect(Collectors.toList());
    }

    @Override
    public MealOrderDto createDailyMealOrder(CreateDailyMealRequest request, Integer currentUserId) {
        LocalDate orderDate = request.getOrderDate();
        if (orderDate == null) {
            throw new BusinessRuleException("ORDER_DATE_REQUIRED", "Order date is required for daily meal selection.");
        }

        // Validate booking existence, ownership, and stay dates through BookingContextPort
        bookingContextPort.requireEligibleCustomerBooking(currentUserId, request.getRetreatBookingId(), orderDate);

        RetreatBooking booking = bookingRepository.findById(request.getRetreatBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking not found with ID: " + request.getRetreatBookingId()));

        String mealPeriod = request.getMealPeriod().toUpperCase();

        Optional<MealOrderEntity> existingOpt = mealOrderRepository.findDailyMealSelection(
                booking.getRetreatBookingId(), orderDate, mealPeriod);

        MealOrderEntity order;
        if (existingOpt.isPresent()) {
            order = existingOpt.get();
            String status = order.getOrderStatus();
            if ("PREPARING".equalsIgnoreCase(status) || "READY".equalsIgnoreCase(status) || "DELIVERED".equalsIgnoreCase(status)) {
                throw new BusinessRuleException("CANNOT_MODIFY_ACTIVE_MEAL",
                        "Cannot modify daily meal selection in " + status + " state.");
            }
            order.getItems().clear();
            order.setOrderStatus("PENDING");
        } else {
            order = new MealOrderEntity();
            order.setRetreatBooking(booking);
            order.setOrderDate(orderDate);
            order.setMealType(mealPeriod);
            order.setOrderType("DAILY_MEAL");
            order.setOrderStatus("PENDING");
            order.setCreatedAt(LocalDateTime.now());
        }

        MealOrderEntity saved = mealOrderRepository.save(order);

        if (request.getMenuItemIds() != null) {
            for (Integer menuItemId : request.getMenuItemIds()) {
                MenuItem item = menuItemRepository.findById(menuItemId)
                        .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with ID: " + menuItemId));
                if (!"AVAILABLE".equalsIgnoreCase(item.getAvailabilityStatus())) {
                    throw new BusinessRuleException("MENU_ITEM_UNAVAILABLE",
                            "Menu item '" + item.getItemName() + "' is currently unavailable.");
                }
                MealOrderItem oi = new MealOrderItem(saved.getId(), item.getId(), 1, BigDecimal.ZERO);
                mealOrderItemRepository.save(oi);
                saved.addItem(oi);
            }
        }

        return mapToDto(saved);
    }

    @Override
    public MealOrderDto createAlaCarteOrder(CreateAlaCarteRequest request, Integer currentUserId) {
        LocalDate orderDate = request.getOrderDate() != null ? request.getOrderDate() : LocalDate.now();

        // Validate booking existence, ownership, and stay dates through BookingContextPort
        bookingContextPort.requireEligibleCustomerBooking(currentUserId, request.getRetreatBookingId(), orderDate);

        RetreatBooking booking = bookingRepository.findById(request.getRetreatBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking not found with ID: " + request.getRetreatBookingId()));

        MealOrderEntity order = new MealOrderEntity();
        order.setRetreatBooking(booking);
        order.setOrderDate(orderDate);
        order.setMealType(request.getTargetTime() != null ? request.getTargetTime() : "A_LA_CARTE");
        order.setOrderType("A_LA_CARTE");
        order.setOrderStatus("PENDING");
        order.setCreatedAt(LocalDateTime.now());

        MealOrderEntity saved = mealOrderRepository.save(order);

        for (AlaCarteItemRequest itemReq : request.getItems()) {
            MenuItem item = menuItemRepository.findById(itemReq.getMenuItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Menu item not found with ID: " + itemReq.getMenuItemId()));
            if (!"AVAILABLE".equalsIgnoreCase(item.getAvailabilityStatus())) {
                throw new BusinessRuleException("MENU_ITEM_UNAVAILABLE",
                        "Menu item '" + item.getItemName() + "' is currently unavailable.");
            }
            if (itemReq.getQuantity() == null || itemReq.getQuantity() <= 0) {
                throw new BusinessRuleException("INVALID_QUANTITY", "Item quantity must be greater than 0.");
            }
            MealOrderItem oi = new MealOrderItem(saved.getId(), item.getId(), itemReq.getQuantity(), item.getPrice());
            mealOrderItemRepository.save(oi);
            saved.addItem(oi);
        }

        return mapToDto(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MealOrderDto> getOrdersForBooking(Integer bookingId, Integer currentUserId, boolean isStaff) {
        if (!isStaff && currentUserId != null) {
            bookingContextPort.requireOwnedCustomerBooking(currentUserId, bookingId);
        } else {
            bookingContextPort.getKitchenBookingContext(bookingId);
        }

        List<MealOrderEntity> orders = mealOrderRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
        return orders.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public KdsDashboardKpiDto getDashboardKpis(LocalDate date) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        List<MealOrderEntity> orders = mealOrderRepository.findOrdersByDate(targetDate);

        int retreatMeals = 0;
        int extraOrders = 0;
        int dietaryAlerts = 0;
        int pending = 0;
        int preparing = 0;

        for (MealOrderEntity o : orders) {
            String status = o.getOrderStatus().toUpperCase();
            if ("DAILY_MEAL".equalsIgnoreCase(o.getOrderType())) {
                retreatMeals++;
            } else {
                extraOrders++;
            }

            if ("PENDING".equals(status)) {
                pending++;
            } else if ("PREPARING".equals(status)) {
                preparing++;
            }

            // Check if guest has allergy notes
            if (hasDietaryAlerts(o.getRetreatBooking())) {
                dietaryAlerts++;
            }
        }

        return new KdsDashboardKpiDto(retreatMeals, extraOrders, dietaryAlerts, pending, preparing);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MealPrepEntryDto> getKitchenPrepQueue(LocalDate date, String type, String status,
                                                      Boolean dietaryOnly, String search) {
        LocalDate targetDate = date != null ? date : LocalDate.now();
        List<MealOrderEntity> orders;

        if ("active".equalsIgnoreCase(status) || status == null || status.isBlank()) {
            orders = mealOrderRepository.findActiveKitchenQueueByDate(targetDate);
        } else if ("all".equalsIgnoreCase(status)) {
            orders = mealOrderRepository.findOrdersByDate(targetDate);
        } else {
            String filterStatus = status.toUpperCase();
            orders = mealOrderRepository.findOrdersByDate(targetDate).stream()
                    .filter(o -> o.getOrderStatus().equalsIgnoreCase(filterStatus))
                    .collect(Collectors.toList());
        }

        List<MealPrepEntryDto> results = new ArrayList<>();
        for (MealOrderEntity o : orders) {
            if (type != null && !"all".equalsIgnoreCase(type)) {
                if ("retreat_meal".equalsIgnoreCase(type) && !"DAILY_MEAL".equalsIgnoreCase(o.getOrderType())) {
                    continue;
                }
                if ("a_la_carte".equalsIgnoreCase(type) && !"A_LA_CARTE".equalsIgnoreCase(o.getOrderType())) {
                    continue;
                }
            }

            MealPrepEntryDto entry = mapToPrepEntryDto(o);

            if (Boolean.TRUE.equals(dietaryOnly) && entry.getDietaryNotes().isEmpty()) {
                continue;
            }

            if (search != null && !search.isBlank()) {
                String q = search.trim().toLowerCase();
                boolean matchesName = entry.getCustomerName() != null && entry.getCustomerName().toLowerCase().contains(q);
                boolean matchesVilla = entry.getVillaNumber() != null && entry.getVillaNumber().toLowerCase().contains(q);
                if (!matchesName && !matchesVilla) {
                    continue;
                }
            }

            results.add(entry);
        }

        return results;
    }

    @Override
    @Transactional(readOnly = true)
    public MealPrepEntryDto getOrderDetails(Long orderId) {
        MealOrderEntity order = mealOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Meal order not found with ID: " + orderId));
        return mapToPrepEntryDto(order);
    }

    @Override
    public MealOrderDto updateOrderStatus(Long orderId, UpdateOrderStatusRequest request,
                                          Integer currentUserId, boolean isStaff) {
        MealOrderEntity order = mealOrderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Meal order not found with ID: " + orderId));

        String currentStatus = order.getOrderStatus().toUpperCase();
        String targetStatus = request.getStatus().toUpperCase();

        if (currentStatus.equals(targetStatus)) {
            log.info("Order ID {} already in status {}. Idempotent return.", orderId, targetStatus);
            return mapToDto(order);
        }

        if ("DELIVERED".equals(currentStatus)) {
            throw new BusinessRuleException("ORDER_ALREADY_DELIVERED",
                    "Cannot modify order ID " + orderId + " because it has already been delivered.");
        }
        if ("CANCELLED".equals(currentStatus)) {
            throw new BusinessRuleException("ORDER_CANCELLED",
                    "Cannot modify order ID " + orderId + " because it has been cancelled.");
        }

        if ("CANCELLED".equals(targetStatus)) {
            return cancelOrderInternal(order, request.getCancellationReason(), currentUserId, isStaff);
        }

        if ("PREPARING".equals(targetStatus)) {
            if (!"PENDING".equals(currentStatus)) {
                throw new BusinessRuleException("INVALID_STATUS_TRANSITION",
                        "Cannot transition order from " + currentStatus + " to PREPARING.");
            }
            if (!isStaff) {
                throw new AccessDeniedException("Only staff can transition order to PREPARING.");
            }
            order.setOrderStatus("PREPARING");
        } else if ("READY".equals(targetStatus)) {
            if (!"PREPARING".equals(currentStatus)) {
                throw new BusinessRuleException("INVALID_STATUS_TRANSITION",
                        "Cannot transition order from " + currentStatus + " to READY.");
            }
            if (!isStaff) {
                throw new AccessDeniedException("Only staff can transition order to READY.");
            }
            order.setOrderStatus("READY");
        } else if ("DELIVERED".equals(targetStatus)) {
            if (!"READY".equals(currentStatus) && !"PREPARING".equals(currentStatus)) {
                throw new BusinessRuleException("INVALID_STATUS_TRANSITION",
                        "Cannot transition order from " + currentStatus + " to DELIVERED.");
            }
            if (!isStaff) {
                throw new AccessDeniedException("Only staff can transition order to DELIVERED.");
            }
            order.setOrderStatus("DELIVERED");

            // M5 Billing Settlement: post charge to folio if A_LA_CARTE
            postFolioChargeIfEligible(order);
        } else {
            throw new BusinessRuleException("UNSUPPORTED_STATUS", "Status " + targetStatus + " is not recognized.");
        }

        MealOrderEntity saved = mealOrderRepository.save(order);
        return mapToDto(saved);
    }

    @Override
    public MealOrderDto cancelOrder(Long orderId, String cancellationReason, Integer currentUserId, boolean isStaff) {
        MealOrderEntity order = mealOrderRepository.findByIdWithLock(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Meal order not found with ID: " + orderId));
        return cancelOrderInternal(order, cancellationReason, currentUserId, isStaff);
    }

    private MealOrderDto cancelOrderInternal(MealOrderEntity order, String cancellationReason,
                                             Integer currentUserId, boolean isStaff) {
        String currentStatus = order.getOrderStatus().toUpperCase();
        if ("CANCELLED".equals(currentStatus)) {
            return mapToDto(order);
        }
        if ("DELIVERED".equals(currentStatus)) {
            throw new BusinessRuleException("ORDER_ALREADY_DELIVERED",
                    "Cannot cancel order ID " + order.getMealOrderId() + " because it has already been delivered.");
        }

        Integer effectiveUserId = currentUserId != null
                ? currentUserId
                : CurrentActor.current().map(CurrentActor::userId).orElse(null);

        String trimmedReason = cancellationReason != null ? cancellationReason.trim() : null;

        if ("PENDING".equals(currentStatus)) {
            if (!isStaff && effectiveUserId != null) {
                bookingContextPort.requireOwnedCustomerBooking(effectiveUserId, order.getRetreatBooking().getRetreatBookingId());
            }

            String actorRole = resolveActorRole(isStaff);
            String auditDetail = (trimmedReason != null && !trimmedReason.isEmpty())
                    ? "CANCELLED; Reason: " + trimmedReason
                    : "CANCELLED";
            auditLogService.record(
                    effectiveUserId,
                    actorRole,
                    "CANCEL_MEAL_ORDER",
                    "MealOrder",
                    String.valueOf(order.getMealOrderId()),
                    AuditLogService.SUCCESS,
                    currentStatus,
                    auditDetail
            );

            order.setOrderStatus("CANCELLED");
            MealOrderEntity saved = mealOrderRepository.save(order);

            log.info("Order ID {} cancelled from PENDING state by user {}. Reason: {}",
                    order.getMealOrderId(), effectiveUserId, trimmedReason);
            return mapToDto(saved);
        } else {
            // PREPARING or READY
            if (!isStaff) {
                throw new BusinessRuleException("CUSTOMER_CANNOT_CANCEL_PREPARING_ORDER",
                        "Order ID " + order.getMealOrderId() + " has already started preparation and cannot be cancelled by guest.");
            }
            if (trimmedReason == null || trimmedReason.isEmpty()) {
                throw new BusinessRuleException("CANCELLATION_REASON_REQUIRED",
                        "A cancellation reason is required to cancel an order currently in " + currentStatus + " state.");
            }

            String actorRole = resolveActorRole(isStaff);
            String auditDetail = "CANCELLED; Reason: " + trimmedReason;
            auditLogService.record(
                    effectiveUserId,
                    actorRole,
                    "CANCEL_MEAL_ORDER",
                    "MealOrder",
                    String.valueOf(order.getMealOrderId()),
                    AuditLogService.SUCCESS,
                    currentStatus,
                    auditDetail
            );

            order.setOrderStatus("CANCELLED");
            MealOrderEntity saved = mealOrderRepository.save(order);

            log.warn("Order ID {} in {} state cancelled by staff {}. Reason: {}",
                    order.getMealOrderId(), currentStatus, effectiveUserId, trimmedReason);
            return mapToDto(saved);
        }
    }

    private String resolveActorRole(boolean isStaff) {
        if (!isStaff) {
            return "CUSTOMER";
        }
        return CurrentActor.current()
                .map(CurrentActor::role)
                .filter(r -> !r.isBlank())
                .orElse("FNB_STAFF");
    }

    private void postFolioChargeIfEligible(MealOrderEntity order) {
        if (!"A_LA_CARTE".equalsIgnoreCase(order.getOrderType())) {
            return; // DAILY_MEAL is included in package
        }
        Long orderId = order.getMealOrderId();
        if (folioItemRepository.existsBySourceMealOrderId(orderId)) {
            log.info("Folio item already exists for meal order ID {}, skipping duplicate charge.", orderId);
            return;
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        List<MealOrderItem> totalItems = order.getItems();
        if ((totalItems == null || totalItems.isEmpty()) && order.getId() != null) {
            totalItems = mealOrderItemRepository.findByMealOrderId(order.getId());
            order.setItems(totalItems);
        }
        if (totalItems != null) {
            for (MealOrderItem item : totalItems) {
                if (item.getMenuItem() == null && item.getMenuItemId() != null) {
                    item.setMenuItem(menuItemRepository.findById(item.getMenuItemId()).orElse(null));
                }
                BigDecimal price = item.getMenuItem() != null && item.getMenuItem().getPrice() != null
                        ? item.getMenuItem().getPrice() : BigDecimal.ZERO;
                BigDecimal lineTotal = price.multiply(BigDecimal.valueOf(item.getQuantity()));
                totalAmount = totalAmount.add(lineTotal);
            }
        }

        if (totalAmount.compareTo(BigDecimal.ZERO) > 0) {
            PostChargeRequestDTO chargeReq = new PostChargeRequestDTO();
            chargeReq.setRetreatBookingId(order.getRetreatBooking().getRetreatBookingId().longValue());
            chargeReq.setChargeCategory("FNB");
            chargeReq.setSourceMealOrderId(orderId);
            chargeReq.setAmount(totalAmount);
            chargeReq.setDescription("A-la-carte dining order #" + orderId);
            folioBillingService.postFolioCharge(chargeReq);
            log.info("Successfully posted Folio charge of {} for MealOrder ID {}", totalAmount, orderId);
        }
    }

    private boolean hasDietaryAlerts(RetreatBooking booking) {
        if (booking == null || booking.getCustomerProfileId() == null) {
            return false;
        }
        DietaryProfilePort.FoodProfileProjection profile =
                dietaryProfilePort.getFoodProfileForCustomerProfile(booking.getCustomerProfileId());
        return !profile.foodAllergies().isEmpty() || !profile.dietaryPreferences().isEmpty();
    }

    private MealPrepEntryDto mapToPrepEntryDto(MealOrderEntity order) {
        MealPrepEntryDto dto = new MealPrepEntryDto();
        dto.setId(order.getMealOrderId());
        dto.setType("DAILY_MEAL".equalsIgnoreCase(order.getOrderType()) ? "retreat_meal" : "a_la_carte");
        dto.setDate(order.getOrderDate());
        dto.setMealPeriod(order.getMealType());
        dto.setTargetTime(order.getMealType());
        dto.setStatus(order.getOrderStatus().toLowerCase());

        RetreatBooking booking = order.getRetreatBooking();
        if (booking != null) {
            BookingContextPort.FnbBookingContext bookingCtx =
                    bookingContextPort.getKitchenBookingContext(booking.getRetreatBookingId());
            dto.setCustomerName(bookingCtx.guestFullName());
            dto.setVillaNumber(bookingCtx.villaNumber());

            // Sensitive data minimization projection: Only dietary & allergies via DietaryProfilePort
            DietaryProfilePort.FoodProfileProjection profile =
                    dietaryProfilePort.getFoodProfileForCustomerProfile(booking.getCustomerProfileId());
            List<String> dietaryNotes = new ArrayList<>();
            dietaryNotes.addAll(profile.foodAllergies());
            dietaryNotes.addAll(profile.dietaryPreferences());
            dto.setDietaryNotes(dietaryNotes);
        }

        List<MealOrderItemDto> itemDtos = new ArrayList<>();
        List<MealOrderItem> prepItems = order.getItems();
        if ((prepItems == null || prepItems.isEmpty()) && order.getId() != null) {
            prepItems = mealOrderItemRepository.findByMealOrderId(order.getId());
            order.setItems(prepItems);
        }
        if (prepItems != null) {
            for (MealOrderItem item : prepItems) {
                if (item.getMenuItem() == null && item.getMenuItemId() != null) {
                    item.setMenuItem(menuItemRepository.findById(item.getMenuItemId()).orElse(null));
                }
                MealOrderItemDto itemDto = new MealOrderItemDto();
                itemDto.setMealOrderItemId(item.getMealOrderItemId());
                if (item.getMenuItem() != null) {
                    itemDto.setMenuItemId(item.getMenuItem().getMenuItemId());
                    itemDto.setItemName(item.getMenuItem().getItemName());
                    itemDto.setUnitPrice(item.getMenuItem().getPrice());
                    BigDecimal price = item.getMenuItem().getPrice() != null ? item.getMenuItem().getPrice() : BigDecimal.ZERO;
                    itemDto.setLineTotal(price.multiply(BigDecimal.valueOf(item.getQuantity())));
                }
                itemDto.setQuantity(item.getQuantity());
                itemDtos.add(itemDto);
            }
        }
        dto.setItems(itemDtos);

        return dto;
    }

    private MealOrderDto mapToDto(MealOrderEntity entity) {
        MealOrderDto dto = new MealOrderDto();
        dto.setMealOrderId(entity.getMealOrderId());
        if (entity.getRetreatBooking() != null) {
            dto.setRetreatBookingId(entity.getRetreatBooking().getRetreatBookingId());
        }
        dto.setOrderDate(entity.getOrderDate());
        dto.setMealType(entity.getMealType());
        dto.setOrderType(entity.getOrderType());
        dto.setOrderStatus(entity.getOrderStatus());
        dto.setCreatedAt(entity.getCreatedAt());

        BigDecimal total = BigDecimal.ZERO;
        List<MealOrderItemDto> itemDtos = new ArrayList<>();
        List<MealOrderItem> orderItems = entity.getItems();
        if ((orderItems == null || orderItems.isEmpty()) && entity.getId() != null) {
            orderItems = mealOrderItemRepository.findByMealOrderId(entity.getId());
            entity.setItems(orderItems);
        }
        if (orderItems != null) {
            for (MealOrderItem item : orderItems) {
                if (item.getMenuItem() == null && item.getMenuItemId() != null) {
                    item.setMenuItem(menuItemRepository.findById(item.getMenuItemId()).orElse(null));
                }
                MealOrderItemDto itemDto = new MealOrderItemDto();
                itemDto.setMealOrderItemId(item.getMealOrderItemId());
                if (item.getMenuItem() != null) {
                    itemDto.setMenuItemId(item.getMenuItem().getMenuItemId());
                    itemDto.setItemName(item.getMenuItem().getItemName());
                    itemDto.setUnitPrice(item.getMenuItem().getPrice());
                    BigDecimal price = item.getMenuItem().getPrice() != null ? item.getMenuItem().getPrice() : BigDecimal.ZERO;
                    BigDecimal line = price.multiply(BigDecimal.valueOf(item.getQuantity()));
                    itemDto.setLineTotal(line);
                    total = total.add(line);
                }
                itemDto.setQuantity(item.getQuantity());
                itemDtos.add(itemDto);
            }
        }
        dto.setItems(itemDtos);
        dto.setTotalAmount(total);
        return dto;
    }

    private MenuItemDto mapToMenuItemDto(MenuItem entity) {
        MenuItemDto dto = new MenuItemDto();
        dto.setMenuItemId(entity.getMenuItemId());
        dto.setItemName(entity.getItemName());
        dto.setCategory(entity.getCategory());
        dto.setMealType(entity.getMealType());
        dto.setPrice(entity.getPrice());
        dto.setAvailabilityStatus(entity.getAvailabilityStatus());

        if (entity.getDietaryTags() != null) {
            dto.setDietaryTags(Arrays.stream(entity.getDietaryTags().split("[,;\\s]+"))
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList()));
        }
        if (entity.getAllergenInformation() != null) {
            dto.setAllergenTags(Arrays.stream(entity.getAllergenInformation().split("[,;\\s]+"))
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.toList()));
        }
        return dto;
    }
}
