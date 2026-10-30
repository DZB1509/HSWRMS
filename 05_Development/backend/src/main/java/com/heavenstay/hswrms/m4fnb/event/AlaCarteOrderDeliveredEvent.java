package com.heavenstay.hswrms.m4fnb.event;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Public M5 integration event published when an à la carte meal order reaches DELIVERED / SERVED status.
 * Governed by financial policy HSWRMS-FNB-FIN-POLICY-01: F&B charges are recognized on the folio
 * strictly upon successful meal delivery.
 */
public record AlaCarteOrderDeliveredEvent(
        Integer mealOrderId,
        Integer bookingId,
        BigDecimal totalAmount,
        LocalDateTime deliveredAt
) { }

