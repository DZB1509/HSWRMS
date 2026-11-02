package com.heavenstay.hswrms.m3spa.entity.enums;

/**
 * Lifecycle state model for M3 Spa appointment confirmation reminder dispatch.
 * Strictly separates active worker lease claiming from confirmed successful delivery.
 */
public enum SpaReminderStatus {
    /**
     * Initial state: appointment has not yet been claimed or dispatched.
     */
    PENDING,

    /**
     * Active worker lease: a scheduler instance has claimed the row for dispatch.
     * Protected against concurrent worker claims until lease expiration.
     */
    CLAIMED,

    /**
     * Terminal success: reminder was successfully delivered/dispatched to guest.
     */
    SENT,

    /**
     * Transient failure: dispatch failed or timed out; released for retry on subsequent cycle.
     */
    RETRYABLE_FAILURE
}

