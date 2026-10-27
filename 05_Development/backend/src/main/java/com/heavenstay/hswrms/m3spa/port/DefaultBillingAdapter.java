package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.dto.PostChargeRequestDTO;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

/**
 * Production adapter boundary for M5 Folio charge posting.
 * Integrates M3 Extra Spa Session charges into M5 Folio Billing.
 */
@Component
public class DefaultBillingAdapter implements BillingPort {

    private static final Logger log = LoggerFactory.getLogger(DefaultBillingAdapter.class);

    private final ObjectProvider<FolioBillingService> folioBillingServiceProvider;
    private final RetreatBookingRepository bookingRepository;

    public DefaultBillingAdapter(ObjectProvider<FolioBillingService> folioBillingServiceProvider,
                                 RetreatBookingRepository bookingRepository) {
        this.folioBillingServiceProvider = folioBillingServiceProvider;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public void recordExtraSpaCharge(Long spaSessionId, Integer retreatBookingId, BigDecimal amount, String description) {
        FolioBillingService folioBillingService = folioBillingServiceProvider.getIfAvailable();
        if (folioBillingService != null && retreatBookingId != null && bookingRepository.existsById(retreatBookingId)) {
            try {
                PostChargeRequestDTO charge = new PostChargeRequestDTO();
                charge.setRetreatBookingId(retreatBookingId);
                charge.setChargeCategory("SPA");
                charge.setDescription(description != null ? description : "Extra Spa Treatment");
                charge.setAmount(amount != null ? amount : BigDecimal.ZERO);
                charge.setSourceSpaSessionId(spaSessionId);
                folioBillingService.postFolioCharge(charge);
                log.info("Posted extra spa session #{} charge (amount={}) to folio for bookingId={}",
                        spaSessionId, amount, retreatBookingId);
            } catch (Exception ex) {
                log.error("Failed to post extra spa session #{} charge to folio: {}", spaSessionId, ex.getMessage(), ex);
            }
        } else {
            log.info("[OI-01 Preserved Boundary] Extra spa session #{} marked billable (bookingId={}, amount={}, desc='{}'). Posting skipped because booking was not found in persistence or FolioBillingService unavailable.",
                    spaSessionId, retreatBookingId, amount, description);
        }
    }
}

