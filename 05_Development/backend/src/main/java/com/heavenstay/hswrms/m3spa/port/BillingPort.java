package com.heavenstay.hswrms.m3spa.port;

import java.math.BigDecimal;

public interface BillingPort {
    void recordExtraSpaCharge(Long spaSessionId, Integer retreatBookingId, BigDecimal amount, String description);
}
