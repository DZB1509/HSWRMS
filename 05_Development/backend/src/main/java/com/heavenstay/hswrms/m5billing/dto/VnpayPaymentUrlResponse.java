package com.heavenstay.hswrms.m5billing.dto;

import java.math.BigDecimal;

public record VnpayPaymentUrlResponse(
        String paymentUrl,
        String transactionReference,
        Long invoiceId,
        BigDecimal amount,
        String orderInfo,
        String paymentStatus) {
}

