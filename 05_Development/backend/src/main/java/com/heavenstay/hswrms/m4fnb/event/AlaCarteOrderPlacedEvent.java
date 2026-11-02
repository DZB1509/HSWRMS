package com.heavenstay.hswrms.m4fnb.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/** Public M5 integration event. Folio ownership/write path remains governed by OI-01. */
public record AlaCarteOrderPlacedEvent(Integer mealOrderId, Integer bookingId,
        BigDecimal subtotal, LocalDateTime createdAt) { }
