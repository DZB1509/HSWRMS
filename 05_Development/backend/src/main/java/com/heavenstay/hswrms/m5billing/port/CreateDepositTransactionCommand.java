package com.heavenstay.hswrms.m5billing.port;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Command DTO for creating a DEPOSIT payment transaction via {@link PaymentTransactionPort}.
 */
public record CreateDepositTransactionCommand(
        Integer retreatBookingId,
        String paymentMethod,
        String transactionReference,
        BigDecimal amountPaid,
        String paymentStatus,
        LocalDateTime transactionDate
) {
    public static CreateDepositTransactionCommand of(
            Integer retreatBookingId,
            String paymentMethod,
            String transactionReference,
            BigDecimal amountPaid,
            String paymentStatus,
            LocalDateTime transactionDate) {
        return new CreateDepositTransactionCommand(
                retreatBookingId,
                paymentMethod,
                transactionReference,
                amountPaid,
                paymentStatus,
                transactionDate
        );
    }

    public static CreateDepositTransactionCommand pending(
            Integer retreatBookingId,
            String paymentMethod,
            String transactionReference,
            BigDecimal amountPaid,
            LocalDateTime transactionDate) {
        return new CreateDepositTransactionCommand(
                retreatBookingId,
                paymentMethod,
                transactionReference,
                amountPaid,
                "PENDING",
                transactionDate
        );
    }

    public static CreateDepositTransactionCommand successful(
            Integer retreatBookingId,
            String paymentMethod,
            String transactionReference,
            BigDecimal amountPaid,
            LocalDateTime transactionDate) {
        return new CreateDepositTransactionCommand(
                retreatBookingId,
                paymentMethod,
                transactionReference,
                amountPaid,
                "SUCCESSFUL",
                transactionDate
        );
    }
}

