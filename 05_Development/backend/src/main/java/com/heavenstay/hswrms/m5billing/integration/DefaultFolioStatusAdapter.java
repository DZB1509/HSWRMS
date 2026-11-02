package com.heavenstay.hswrms.m5billing.integration;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m4fnb.integration.FolioStatusPort;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Default implementation of {@link FolioStatusPort} residing in Module 5.
 * Adapts {@link FolioItemRepository}, {@link FolioRepository}, and {@link InvoiceRepository}
 * checks to satisfy M4 status resolution without circular dependencies.
 *
 * Hardened under WP-1A.3 to enforce atomic concurrency control and serialize
 * dining order validation against checkout/invoice finalization.
 */
@Component
public class DefaultFolioStatusAdapter implements FolioStatusPort {

    private final FolioItemRepository folioItemRepository;
    private final FolioRepository folioRepository;
    private final InvoiceRepository invoiceRepository;
    private final RetreatBookingRepository bookingRepository;

    @Autowired
    public DefaultFolioStatusAdapter(FolioItemRepository folioItemRepository,
                                     FolioRepository folioRepository,
                                     InvoiceRepository invoiceRepository,
                                     @Autowired(required = false) RetreatBookingRepository bookingRepository) {
        this.folioItemRepository = folioItemRepository;
        this.folioRepository = folioRepository;
        this.invoiceRepository = invoiceRepository;
        this.bookingRepository = bookingRepository;
    }

    public DefaultFolioStatusAdapter(FolioItemRepository folioItemRepository,
                                     FolioRepository folioRepository,
                                     InvoiceRepository invoiceRepository) {
        this(folioItemRepository, folioRepository, invoiceRepository, null);
    }

    @Override
    public boolean isMealOrderPostedToFolio(Integer mealOrderId) {
        if (mealOrderId == null) {
            return false;
        }
        return folioItemRepository.existsBySourceMealOrderId(mealOrderId.longValue());
    }

    @Override
    @Transactional
    public boolean isFolioOpenForBooking(Integer retreatBookingId) {
        if (retreatBookingId == null) {
            return false;
        }

        // 1. Validate stay lifecycle at the aggregate root level
        if (bookingRepository != null) {
            RetreatBooking booking = bookingRepository.findById(retreatBookingId).orElse(null);
            if (booking != null) {
                String bookingStatus = booking.getBookingStatus();
                if ("COMPLETED".equalsIgnoreCase(bookingStatus) || "CHECKED_OUT".equalsIgnoreCase(bookingStatus)) {
                    throw new BusinessRuleException("BOOKING_COMPLETED",
                            "Cannot place dining orders for booking ID " + retreatBookingId + " because the booking is completed or checked out.");
                }
                if ("CANCELLED".equalsIgnoreCase(bookingStatus)) {
                    throw new BusinessRuleException("BOOKING_NOT_ACTIVE",
                            "Cannot place dining orders for booking ID " + retreatBookingId + " because the booking is cancelled.");
                }
            }
        }

        // 2. Acquire pessimistic write lock on Folio to serialize against concurrent checkout
        Optional<FolioEntity> folioOpt = folioRepository.findByRetreatBookingIdForUpdate(retreatBookingId);
        if (folioOpt.isEmpty()) {
            folioOpt = folioRepository.findByRetreatBookingId(retreatBookingId);
        }

        return folioOpt
                .map(f -> {
                    if ("CLOSED".equalsIgnoreCase(f.getFolioStatus())) {
                        throw new BusinessRuleException("FOLIO_CLOSED",
                                "Cannot place dining orders for booking ID " + retreatBookingId + " because its folio is closed.");
                    }
                    InvoiceEntity invoice = invoiceRepository.findByFolioId(f.getFolioId()).orElse(null);
                    if (invoice != null && ("ISSUED".equalsIgnoreCase(invoice.getInvoiceStatus()) || "PAID".equalsIgnoreCase(invoice.getInvoiceStatus()))) {
                        throw new BusinessRuleException("INVOICE_ALREADY_ISSUED",
                                "Cannot place dining orders after consolidated invoice has been issued or paid. Status: " + invoice.getInvoiceStatus());
                    }
                    return true;
                })
                .orElse(true);
    }
}
