package com.heavenstay.hswrms.m3spa.port;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Replaceable adapter boundary for M5 Folio charge posting.
 * Preserves OI-01 (M3/M4 -> M5 Folio charge write path unresolved).
 * Emits audit logging without injecting M5 repositories or deciding the write path.
 */
@Component
public class DefaultBillingAdapter implements BillingPort {

    private static final Logger log = LoggerFactory.getLogger(DefaultBillingAdapter.class);

    @Override
    public void recordExtraSpaCharge(Long spaSessionId, Integer retreatBookingId, BigDecimal amount, String description) {
        log.info("[OI-01 Preserved - Unresolved Folio Posting Boundary] Extra spa session #{} marked billable (bookingId={}, amount={}, desc='{}'). Posting write-path pending M5 integration.",
                spaSessionId, retreatBookingId, amount, description);
    }
}
