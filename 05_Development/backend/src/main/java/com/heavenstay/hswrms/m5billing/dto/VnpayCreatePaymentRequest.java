package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;

/** Request body for POST /api/v1/payments/vnpay/create-payment-url. Either invoiceId or bookingId is required. */
public record VnpayCreatePaymentRequest(
        Long invoiceId,
        Long bookingId,
        BigDecimal amount,
        String orderInfo,
        String ipAddress) {
}

