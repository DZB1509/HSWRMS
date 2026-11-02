package com.heavenstay.hswrms.m5billing.integration;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m4fnb.event.AlaCarteOrderDeliveredEvent;
import com.heavenstay.hswrms.m4fnb.event.AlaCarteOrderPlacedEvent;
import com.heavenstay.hswrms.m5billing.dto.PostChargeRequestDTO;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.service.FolioBillingService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Event listener that consumes F&B integration events and posts charges to Module 5 (Folio Billing).
 *
 * Governed by policy HSWRMS-FNB-FIN-POLICY-01:
 * - À la carte orders in PENDING, PREPARING, or READY states carry NO folio liability.
 * - Charges are recognized on the folio strictly upon successful fulfillment (DELIVERED / SERVED).
 *
 * Runs synchronously within the active order transaction (Propagation.REQUIRED) so that
 * any billing failure (e.g. folio closed, invoice settled, booking mismatch) causes the
 * delivery transaction to roll back, eliminating silent charge loss or orphaned unpaid orders.
 *
 * Implements idempotent processing: if a charge has already been posted for the meal order ID,
 * subsequent event deliveries are safely ignored without duplicate charges.
 */
@Component
public class FnbFolioEventListener {

    private static final Logger log = LoggerFactory.getLogger(FnbFolioEventListener.class);

    private final FolioBillingService folioBillingService;
    private final FolioItemRepository folioItemRepository;

    public FnbFolioEventListener(FolioBillingService folioBillingService,
                                 FolioItemRepository folioItemRepository) {
        this.folioBillingService = folioBillingService;
        this.folioItemRepository = folioItemRepository;
    }

    /**
     * Consumes {@link AlaCarteOrderDeliveredEvent}.
     * Under HSWRMS-FNB-FIN-POLICY-01, this is the authoritative financial charge recognition trigger.
     */
    @EventListener
    @Transactional(propagation = Propagation.REQUIRED)
    public void onAlaCarteOrderDelivered(AlaCarteOrderDeliveredEvent event) {
        if (event == null || event.mealOrderId() == null) {
            log.warn("Received null or invalid AlaCarteOrderDeliveredEvent, skipping.");
            return;
        }

        Long orderId = event.mealOrderId().longValue();

        // Application-level idempotency guard: do not re-post if already recorded
        if (folioItemRepository.existsBySourceMealOrderId(orderId)) {
            log.info("Folio charge already exists for MealOrder ID {}, skipping duplicate delivery event.", orderId);
            return;
        }

        BigDecimal amount = event.totalAmount() != null ? event.totalAmount() : BigDecimal.ZERO;

        PostChargeRequestDTO chargeRequest = new PostChargeRequestDTO();
        chargeRequest.setRetreatBookingId(event.bookingId() != null ? event.bookingId().longValue() : null);
        chargeRequest.setChargeCategory("FNB");
        chargeRequest.setSourceMealOrderId(orderId);
        chargeRequest.setAmount(amount);
        chargeRequest.setDescription("A-la-carte dining order #" + orderId);

        try {
            folioBillingService.postFolioChargeIdempotent(chargeRequest);
            log.info("Successfully posted or verified Folio charge of {} for delivered MealOrder ID {} (booking ID {})",
                    amount, orderId, event.bookingId());
        } catch (BusinessRuleException ex) {
            log.error("Failed to post folio charge for delivered MealOrder ID {}: {}", orderId, ex.getMessage());
            throw ex;
        }
    }

    /**
     * Consumes {@link AlaCarteOrderPlacedEvent}.
     * Under HSWRMS-FNB-FIN-POLICY-01, placing an order does NOT recognize revenue or folio charges.
     * Folio charge recognition is deferred until the DELIVERED state.
     */
    @EventListener
    public void onAlaCarteOrderPlaced(AlaCarteOrderPlacedEvent event) {
        if (event != null && event.mealOrderId() != null) {
            log.info("AlaCarteOrderPlacedEvent received for MealOrder ID {}. Folio charge deferred until DELIVERED state per policy HSWRMS-FNB-FIN-POLICY-01.",
                    event.mealOrderId());
        }
    }
}
