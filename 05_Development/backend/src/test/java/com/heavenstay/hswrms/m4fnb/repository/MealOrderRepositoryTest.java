package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Transactional
public class MealOrderRepositoryTest {

    @Autowired
    private MealOrderRepository mealOrderRepository;

    @Autowired
    private RetreatBookingRepository bookingRepository;

    @Autowired
    private VillaCategoryRepository villaCategoryRepository;

    @Autowired
    private RetreatPackageRepository retreatPackageRepository;

    private RetreatBooking testBooking;
    private final LocalDate targetDate = LocalDate.of(2026, 9, 24);

    @BeforeEach
    void setUp() {
        if (bookingRepository.count() == 0) {
            VillaCategory cat = new VillaCategory();
            cat.setCategoryName("Test Category");
            cat.setMaxOccupancy(2);
            cat.setPriceModifier(BigDecimal.ZERO);
            cat.setCategoryStatus("ACTIVE");
            cat.setInventoryCount(5);
            cat.setBedroomCount(1);
            cat = villaCategoryRepository.save(cat);

            RetreatPackage pkg = new RetreatPackage();
            pkg.setPackageCode("PKG-TEST");
            pkg.setPackageName("Test Package");
            pkg.setDurationNights(3);
            pkg.setBasePrice(BigDecimal.valueOf(1000));
            pkg.setPackageStatus("ACTIVE");
            pkg = retreatPackageRepository.save(pkg);

            RetreatBooking booking = new RetreatBooking();
            booking.setCustomerProfileId(1);
            booking.setRetreatPackage(pkg);
            booking.setRequestedVillaCategory(cat);
            booking.setCheckInDate(LocalDate.now());
            booking.setCheckOutDate(LocalDate.now().plusDays(3));
            booking.setBookingStatus("CONFIRMED");
            booking.setDepositAmount(BigDecimal.valueOf(500));
            booking.setTotalEstimatedAmount(BigDecimal.valueOf(1000));
            testBooking = bookingRepository.save(booking);
        } else {
            testBooking = bookingRepository.findAll().get(0);
        }
    }

    private MealOrderEntity createOrder(String status, LocalDate date, String mealType, int minuteOffset) {
        MealOrderEntity order = new MealOrderEntity();
        order.setRetreatBooking(testBooking);
        order.setOrderDate(date);
        order.setMealType(mealType);
        order.setOrderType("DAILY_MEAL");
        order.setOrderStatus(status);
        order.setCreatedAt(LocalDateTime.of(2026, 9, 24, 8, 0).plusMinutes(minuteOffset));
        return mealOrderRepository.save(order);
    }

    @Test
    @DisplayName("Active queue EXCLUDES orders with DELIVERED status (defect resolution)")
    void activeQueueExcludesDeliveredOrders() {
        MealOrderEntity pending = createOrder("PENDING", targetDate, "Breakfast", 0);
        MealOrderEntity preparing = createOrder("PREPARING", targetDate, "Lunch", 10);
        MealOrderEntity ready = createOrder("READY", targetDate, "Dinner", 20);
        MealOrderEntity delivered = createOrder("DELIVERED", targetDate, "Breakfast", 30);

        List<MealOrderEntity> activeQueue = mealOrderRepository.findActiveKitchenQueue();

        assertTrue(activeQueue.stream().anyMatch(o -> o.getMealOrderId().equals(pending.getMealOrderId())));
        assertTrue(activeQueue.stream().anyMatch(o -> o.getMealOrderId().equals(preparing.getMealOrderId())));
        assertTrue(activeQueue.stream().anyMatch(o -> o.getMealOrderId().equals(ready.getMealOrderId())));
        assertFalse(activeQueue.stream().anyMatch(o -> o.getMealOrderId().equals(delivered.getMealOrderId())),
                "DELIVERED orders must NOT be included in the kitchen active queue");
    }

    @Test
    @DisplayName("Active queue EXCLUDES orders with CANCELLED status")
    void activeQueueExcludesCancelledOrders() {
        MealOrderEntity preparing = createOrder("PREPARING", targetDate, "Lunch", 0);
        MealOrderEntity cancelled = createOrder("CANCELLED", targetDate, "Dinner", 10);

        List<MealOrderEntity> activeQueue = mealOrderRepository.findActiveKitchenQueue();

        assertTrue(activeQueue.stream().anyMatch(o -> o.getMealOrderId().equals(preparing.getMealOrderId())));
        assertFalse(activeQueue.stream().anyMatch(o -> o.getMealOrderId().equals(cancelled.getMealOrderId())),
                "CANCELLED orders must remain excluded from the kitchen active queue");
    }

    @Test
    @DisplayName("Active queue preserves all valid active kitchen states (PENDING, PREPARING, READY)")
    void activeQueuePreservesAllActiveStates() {
        MealOrderEntity pending = createOrder("PENDING", targetDate, "Breakfast", 0);
        MealOrderEntity preparing = createOrder("PREPARING", targetDate, "Lunch", 10);
        MealOrderEntity ready = createOrder("READY", targetDate, "Dinner", 20);
        createOrder("DELIVERED", targetDate, "Breakfast", 30);
        createOrder("CANCELLED", targetDate, "Lunch", 40);

        List<MealOrderEntity> activeQueue = mealOrderRepository.findActiveKitchenQueue();

        List<String> statuses = activeQueue.stream()
                .filter(o -> o.getRetreatBooking().getRetreatBookingId().equals(testBooking.getRetreatBookingId()))
                .map(MealOrderEntity::getOrderStatus)
                .toList();

        assertTrue(statuses.contains("PENDING"));
        assertTrue(statuses.contains("PREPARING"));
        assertTrue(statuses.contains("READY"));
        assertFalse(statuses.contains("DELIVERED"));
        assertFalse(statuses.contains("CANCELLED"));
    }

    @Test
    @DisplayName("findActiveKitchenQueueByDate correctly filters by target orderDate and excludes terminal states")
    void activeQueueByDateFiltersCorrectly() {
        LocalDate otherDate = targetDate.plusDays(1);
        MealOrderEntity activeToday = createOrder("PENDING", targetDate, "Breakfast", 0);
        MealOrderEntity deliveredToday = createOrder("DELIVERED", targetDate, "Lunch", 10);
        MealOrderEntity activeTomorrow = createOrder("PREPARING", otherDate, "Breakfast", 20);

        List<MealOrderEntity> todayQueue = mealOrderRepository.findActiveKitchenQueueByDate(targetDate);

        assertTrue(todayQueue.stream().anyMatch(o -> o.getMealOrderId().equals(activeToday.getMealOrderId())));
        assertFalse(todayQueue.stream().anyMatch(o -> o.getMealOrderId().equals(deliveredToday.getMealOrderId())),
                "DELIVERED order today must not be in active queue");
        assertFalse(todayQueue.stream().anyMatch(o -> o.getMealOrderId().equals(activeTomorrow.getMealOrderId())),
                "Tomorrow order must not be in today's active queue");
    }

    @Test
    @DisplayName("findNonTerminalOrders excludes both DELIVERED and CANCELLED terminal states")
    void nonTerminalOrdersExcludeBothDeliveredAndCancelled() {
        MealOrderEntity active = createOrder("READY", targetDate, "Dinner", 0);
        MealOrderEntity delivered = createOrder("DELIVERED", targetDate, "Dinner", 5);
        MealOrderEntity cancelled = createOrder("CANCELLED", targetDate, "Dinner", 10);

        List<MealOrderEntity> nonTerminal = mealOrderRepository.findNonTerminalOrders();

        assertTrue(nonTerminal.stream().anyMatch(o -> o.getMealOrderId().equals(active.getMealOrderId())));
        assertFalse(nonTerminal.stream().anyMatch(o -> o.getMealOrderId().equals(delivered.getMealOrderId())));
        assertFalse(nonTerminal.stream().anyMatch(o -> o.getMealOrderId().equals(cancelled.getMealOrderId())));
    }

    @Test
    @DisplayName("findUnsettledOrdersForBooking INCLUDES READY orders (Phase 5.8.3.25 consistency fix)")
    void findUnsettledOrdersIncludesReadyOrders() {
        MealOrderEntity pending = createOrder("PENDING", targetDate, "Breakfast", 0);
        MealOrderEntity preparing = createOrder("PREPARING", targetDate, "Lunch", 10);
        MealOrderEntity ready = createOrder("READY", targetDate, "Dinner", 20);
        MealOrderEntity delivered = createOrder("DELIVERED", targetDate, "Breakfast", 30);
        MealOrderEntity cancelled = createOrder("CANCELLED", targetDate, "Lunch", 40);

        List<MealOrderEntity> unsettled = mealOrderRepository.findUnsettledOrdersForBooking(testBooking.getRetreatBookingId());

        assertTrue(unsettled.stream().anyMatch(o -> o.getMealOrderId().equals(ready.getMealOrderId())),
                "READY orders must be detected by findUnsettledOrdersForBooking");
        assertTrue(unsettled.stream().anyMatch(o -> o.getMealOrderId().equals(pending.getMealOrderId())),
                "PENDING orders must be detected by findUnsettledOrdersForBooking");
        assertTrue(unsettled.stream().anyMatch(o -> o.getMealOrderId().equals(preparing.getMealOrderId())),
                "PREPARING orders must be detected by findUnsettledOrdersForBooking");
        assertFalse(unsettled.stream().anyMatch(o -> o.getMealOrderId().equals(delivered.getMealOrderId())),
                "DELIVERED orders must NOT be returned as unsettled");
        assertFalse(unsettled.stream().anyMatch(o -> o.getMealOrderId().equals(cancelled.getMealOrderId())),
                "CANCELLED orders must NOT be returned as unsettled");
    }

    @Test
    @DisplayName("findUnsettledOrdersForBooking returns empty list when all orders are DELIVERED or CANCELLED")
    void findUnsettledOrdersReturnsEmptyWhenNoUnsettledOrdersExist() {
        createOrder("DELIVERED", targetDate, "Breakfast", 0);
        createOrder("CANCELLED", targetDate, "Lunch", 10);

        List<MealOrderEntity> unsettled = mealOrderRepository.findUnsettledOrdersForBooking(testBooking.getRetreatBookingId());

        assertTrue(unsettled.isEmpty(), "When only DELIVERED and CANCELLED orders exist, unsettled list must be empty");
    }

    @Test
    @DisplayName("findUnsettledOrdersForBooking filters strictly by bookingId")
    void findUnsettledOrdersFiltersStrictlyByBookingId() {
        RetreatBooking otherBooking = new RetreatBooking();
        otherBooking.setCustomerProfileId(2);
        otherBooking.setRetreatPackage(testBooking.getRetreatPackage());
        otherBooking.setRequestedVillaCategory(testBooking.getRequestedVillaCategory());
        otherBooking.setCheckInDate(LocalDate.now());
        otherBooking.setCheckOutDate(LocalDate.now().plusDays(3));
        otherBooking.setBookingStatus("CONFIRMED");
        otherBooking.setDepositAmount(BigDecimal.valueOf(500));
        otherBooking.setTotalEstimatedAmount(BigDecimal.valueOf(1000));
        otherBooking = bookingRepository.save(otherBooking);

        MealOrderEntity otherReadyOrder = new MealOrderEntity();
        otherReadyOrder.setRetreatBooking(otherBooking);
        otherReadyOrder.setOrderDate(targetDate);
        otherReadyOrder.setMealType("Dinner");
        otherReadyOrder.setOrderType("DAILY_MEAL");
        otherReadyOrder.setOrderStatus("READY");
        otherReadyOrder.setCreatedAt(LocalDateTime.now());
        mealOrderRepository.save(otherReadyOrder);

        List<MealOrderEntity> unsettledForTestBooking = mealOrderRepository.findUnsettledOrdersForBooking(testBooking.getRetreatBookingId());
        assertFalse(unsettledForTestBooking.stream().anyMatch(o -> o.getMealOrderId().equals(otherReadyOrder.getMealOrderId())),
                "Orders for other bookings must not be returned");

        List<MealOrderEntity> unsettledForOtherBooking = mealOrderRepository.findUnsettledOrdersForBooking(otherBooking.getRetreatBookingId());
        assertTrue(unsettledForOtherBooking.stream().anyMatch(o -> o.getMealOrderId().equals(otherReadyOrder.getMealOrderId())),
                "READY order for other booking must be returned for that booking");
    }
}
