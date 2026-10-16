package com.heavenstay.hswrms.m4fnb.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m4fnb.dto.response.RetreatPackageFnbPlanResponse;
import com.heavenstay.hswrms.m4fnb.integration.BookingContextPort;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;

/**
 * ============================================================================
 * [TRACEABILITY HEADER]
 * Module: M4 - Food & Beverage Management (F&B)
 * Requirements: SR-FNB-001, US-FNB-003, BR-FNB-002, BR-FNB-004
 * Test Focus: Retreat Package F&B Plan Registry & Clinical/Culinary Safety Controls
 * ============================================================================
 */
class RetreatPackageFnbServiceTest {

    private ObjectProvider<BookingContextPort> bookingContextProvider;
    private BookingContextPort bookingPort;
    private RetreatPackageFnbService packageFnbService;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        bookingContextProvider = mock(ObjectProvider.class);
        bookingPort = mock(BookingContextPort.class);
        when(bookingContextProvider.getIfAvailable()).thenReturn(bookingPort);
        packageFnbService = new RetreatPackageFnbService(bookingContextProvider);
    }

    @Test
    void getAllPackagePlans_returnsAllEightCanonicalPackages() {
        List<RetreatPackageFnbPlanResponse> plans = packageFnbService.getAllPackagePlans();
        assertNotNull(plans);
        assertEquals(8, plans.size());

        List<String> codes = plans.stream().map(RetreatPackageFnbPlanResponse::packageCode).toList();
        assertTrue(codes.contains("RET-DETOX-03"));
        assertTrue(codes.contains("RET-DETOX-05"));
        assertTrue(codes.contains("RET-SLEEP-03"));
        assertTrue(codes.contains("RET-STRESS-04"));
        assertTrue(codes.contains("RET-AGING-04"));
        assertTrue(codes.contains("RET-ALIGN-03"));
        assertTrue(codes.contains("RET-VITAL-05"));
        assertTrue(codes.contains("RET-MOM-03"));
    }

    @Test
    void getPackagePlan_pureDetox3D2N_matchesSpecifications() {
        RetreatPackageFnbPlanResponse plan = packageFnbService.getPackagePlan("RET-DETOX-03");
        assertNotNull(plan);
        assertEquals("3D2N Thải Độc & Thanh Lọc Tinh Khiết (Pure Detox)", plan.packageName());
        assertEquals(2, plan.durationNights());
        assertEquals(2, plan.breakfastCount());
        assertEquals(2, plan.lunchCount());
        assertEquals(2, plan.dinnerCount());
        assertTrue(plan.dietaryRegimen().contains("Detox thanh lọc chuyên sâu"));
        assertTrue(plan.contraindications().contains("Đường tinh luyện"));
    }

    @Test
    void getPackagePlan_vitalitySlimming5D4N_caloricDeficitConfigured() {
        RetreatPackageFnbPlanResponse plan = packageFnbService.getPackagePlan("RET-VITAL-05");
        assertNotNull(plan);
        assertEquals("5D4N Quản Lý Vóc Dáng & Đốt Mỡ Tự Nhiên (Vitality Slimming)", plan.packageName());
        assertEquals(4, plan.durationNights());
        assertEquals(4, plan.breakfastCount());
        assertEquals(4, plan.lunchCount());
        assertEquals(4, plan.dinnerCount());
        assertTrue(plan.caloricTarget().contains("1.400 - 1.600 kcal/ngày"));
    }

    @Test
    void getPackagePlan_gentlePrenatal_strictSafetyEnforced() {
        RetreatPackageFnbPlanResponse plan = packageFnbService.getPackagePlan("RET-MOM-03");
        assertNotNull(plan);
        assertEquals("3D2N Nghỉ Dưỡng Chữa Lành Mẹ Bầu (Gentle Prenatal Care)", plan.packageName());
        assertEquals(2, plan.durationNights());
        assertTrue(plan.safetyGuidelines().stream().anyMatch(g -> g.contains("100% nguyên liệu nuôi trồng hữu cơ")));
        assertTrue(plan.safetyGuidelines().stream().anyMatch(g -> g.contains("chín kỹ tuyệt đối")));
    }

    @Test
    void validatePackageSafetyViolations_prenatalViolationsDetected() {
        // Caffeine test
        List<String> caffeineViolations = packageFnbService.validatePackageSafetyViolations(
                "RET-MOM-03", "Cà phê sữa đá hạt phỉ", null, List.of());
        assertFalse(caffeineViolations.isEmpty());
        assertTrue(caffeineViolations.get(0).contains("caffeine"));

        // Uterine stimulant herb test
        List<String> herbViolations = packageFnbService.validatePackageSafetyViolations(
                "RET-MOM-03", "Canh gà tiềm ngải cứu", null, List.of());
        assertFalse(herbViolations.isEmpty());
        assertTrue(herbViolations.get(0).contains("ngải cứu"));

        // Raw food test
        List<String> rawViolations = packageFnbService.validatePackageSafetyViolations(
                "RET-MOM-03", "Sashimi cá hồi Nauy", null, List.of());
        assertFalse(rawViolations.isEmpty());
        assertTrue(rawViolations.get(0).contains("chín kỹ"));

        // Safe dish
        List<String> safeDishViolations = packageFnbService.validatePackageSafetyViolations(
                "RET-MOM-03", "Cháo cá hồi chín kỹ hạt sen", null, List.of());
        assertTrue(safeDishViolations.isEmpty());
    }

    @Test
    void getPlanForBooking_resolvesFromBookingContext() {
        LocalDate today = LocalDate.now();
        BookingContextPort.FnbBookingContext context = new BookingContextPort.FnbBookingContext(
                101, 5, "CHECKED_IN", today, today.plusDays(3), "Sophia", "Villa #204",
                "RET-SLEEP-03", "3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)");
        when(bookingPort.getKitchenBookingContext(101)).thenReturn(context);

        RetreatPackageFnbPlanResponse plan = packageFnbService.getPlanForBooking(101);
        assertNotNull(plan);
        assertEquals("RET-SLEEP-03", plan.packageCode());
        assertEquals("3D2N Khôi Phục Giấc Ngủ Sâu (Holistic Deep Sleep)", plan.packageName());
    }

    @Test
    void getPackagePlan_notFound_throwsException() {
        assertThrows(ResourceNotFoundException.class, () -> packageFnbService.getPackagePlan("RET-UNKNOWN-99"));
    }
}
