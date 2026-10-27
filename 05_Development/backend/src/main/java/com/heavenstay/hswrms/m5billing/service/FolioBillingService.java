package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m4fnb.entity.MealOrderEntity;
import com.heavenstay.hswrms.m4fnb.repository.MealOrderRepository;
import com.heavenstay.hswrms.m5billing.dto.FolioItemResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.FolioResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.InvoiceResponseDTO;
import com.heavenstay.hswrms.m5billing.dto.PostChargeRequestDTO;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class FolioBillingService {

    private final FolioRepository folioRepository;
    private final FolioItemRepository folioItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RetreatBookingRepository bookingRepository;
    private final SpaSessionRepository spaSessionRepository;
    private final MealOrderRepository mealOrderRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final AuditLogService auditLogService;
    private final BigDecimal vatRate;

    public FolioBillingService(FolioRepository folioRepository,
                               FolioItemRepository folioItemRepository,
                               InvoiceRepository invoiceRepository,
                               PaymentTransactionRepository paymentTransactionRepository,
                               RetreatBookingRepository bookingRepository,
                               SpaSessionRepository spaSessionRepository,
                               MealOrderRepository mealOrderRepository,
                               CustomerProfileRepository customerProfileRepository,
                               AuditLogService auditLogService,
                               @Value("${app.billing.vat-rate:0.08}") BigDecimal vatRate) {
        this.folioRepository = folioRepository;
        this.folioItemRepository = folioItemRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.bookingRepository = bookingRepository;
        this.spaSessionRepository = spaSessionRepository;
        this.mealOrderRepository = mealOrderRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.auditLogService = auditLogService;
        this.vatRate = vatRate != null ? vatRate : new BigDecimal("0.08");
    }

    @Transactional
    public FolioResponseDTO getFolioByBookingId(Long retreatBookingId) {
        if (retreatBookingId == null) {
            throw new ResourceNotFoundException("Retreat booking ID cannot be null");
        }
        return getFolioByBookingId(retreatBookingId.intValue());
    }

    @Transactional
    public FolioResponseDTO getFolioByBookingId(Integer retreatBookingId) {
        RetreatBooking booking = bookingRepository.findByIdWithDetails(retreatBookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking not found with ID: " + retreatBookingId));

        FolioEntity folio = folioRepository.findByRetreatBookingId(retreatBookingId)
                .orElseGet(() -> createDefaultFolioForBooking(booking));

        // Sync folio totalPaid from deposit and invoice payments
        syncFolioPaidState(folio, booking.getRetreatBookingId());

        List<FolioItemEntity> items = folioItemRepository.findByFolioId(folio.getFolioId());
        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElse(null);

        return mapToFolioResponse(folio, booking, items, invoice);
    }

    @Transactional
    public FolioItemResponseDTO postFolioCharge(PostChargeRequestDTO request) {
        RetreatBooking booking = bookingRepository.findById(request.getRetreatBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking not found with ID: " + request.getRetreatBookingId()));

        FolioEntity folio = folioRepository.findByRetreatBookingId(booking.getRetreatBookingId())
                .orElseGet(() -> createDefaultFolioForBooking(booking));

        // Acquire pessimistic lock on the folio row to serialize concurrent modifications to this folio
        folio = folioRepository.findByIdForUpdate(folio.getFolioId()).orElse(folio);

        if ("CLOSED".equalsIgnoreCase(folio.getFolioStatus())) {
            throw new BusinessRuleException("FOLIO_CLOSED", "Cannot post charges to a closed folio.");
        }

        InvoiceEntity existingInvoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElse(null);
        if (existingInvoice != null && ("ISSUED".equalsIgnoreCase(existingInvoice.getInvoiceStatus())
                || "PAID".equalsIgnoreCase(existingInvoice.getInvoiceStatus()))) {
            throw new BusinessRuleException("INVOICE_ALREADY_ISSUED",
                    "Cannot post charges after consolidated invoice has been issued or paid. Status: " + existingInvoice.getInvoiceStatus());
        }

        // Category and source reference validation
        String category = request.getChargeCategory() != null ? request.getChargeCategory().trim().toUpperCase() : "";
        if (!"PACKAGE".equals(category) && !"SPA".equals(category) && !"FNB".equals(category)) {
            throw new BusinessRuleException("INVALID_CHARGE_CATEGORY",
                    "Charge category must be PACKAGE, SPA, or FNB. Provided: " + request.getChargeCategory());
        }

        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("INVALID_AMOUNT", "Charge amount must be greater than or equal to 0.");
        }

        if ("FNB".equals(category)) {
            if (request.getSourceMealOrderId() == null) {
                throw new BusinessRuleException("INVALID_FOLIO_SOURCE",
                        "FNB charge must have source_meal_order_id and no other source reference.");
            }
            if (request.getSourceBookingId() != null || request.getSourceSpaSessionId() != null) {
                throw new BusinessRuleException("INVALID_FOLIO_SOURCE",
                        "FNB charge must not specify source_booking_id or source_spa_session_id.");
            }

            // Acquire pessimistic write lock on target MealOrder row to serialize concurrent postings across any transaction
            MealOrderEntity mealOrder = mealOrderRepository.findByIdWithLock(request.getSourceMealOrderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Meal order not found with ID: " + request.getSourceMealOrderId()));

            if (folioItemRepository.existsBySourceMealOrderId(request.getSourceMealOrderId())) {
                throw new BusinessRuleException("DUPLICATE_CHARGE",
                        "Meal order ID " + request.getSourceMealOrderId() + " has already been posted to a folio.");
            }
            if (!booking.getRetreatBookingId().equals(mealOrder.getRetreatBooking().getRetreatBookingId())) {
                throw new BusinessRuleException("BOOKING_MISMATCH",
                        "Meal order ID " + request.getSourceMealOrderId() + " belongs to booking "
                                + mealOrder.getRetreatBooking().getRetreatBookingId() + ", not booking " + booking.getRetreatBookingId());
            }
            if ("DAILY_MEAL".equalsIgnoreCase(mealOrder.getOrderType())) {
                throw new BusinessRuleException("CANNOT_CHARGE_INCLUDED_SERVICE",
                        "Daily meal selections are included in the retreat package and cannot be billed as extra folio charges.");
            }
            if ("CANCELLED".equalsIgnoreCase(mealOrder.getOrderStatus())) {
                throw new BusinessRuleException("INVALID_ORDER_STATE",
                        "Cannot post folio charge for a CANCELLED meal order.");
            }
        } else if ("SPA".equals(category)) {
            if (request.getSourceSpaSessionId() == null) {
                throw new BusinessRuleException("INVALID_FOLIO_SOURCE",
                        "SPA charge must have source_spa_session_id and no other source reference.");
            }
            if (request.getSourceBookingId() != null || request.getSourceMealOrderId() != null) {
                throw new BusinessRuleException("INVALID_FOLIO_SOURCE",
                        "SPA charge must not specify source_booking_id or source_meal_order_id.");
            }

            // Acquire pessimistic write lock on target SpaSession row to serialize concurrent postings across any transaction
            SpaSession spaSession = spaSessionRepository.findByIdWithLock(request.getSourceSpaSessionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Spa session not found with ID: " + request.getSourceSpaSessionId()));

            if (folioItemRepository.existsBySourceSpaSessionId(request.getSourceSpaSessionId())) {
                throw new BusinessRuleException("DUPLICATE_CHARGE",
                        "Spa session ID " + request.getSourceSpaSessionId() + " has already been posted to a folio.");
            }
            if (!booking.getRetreatBookingId().equals(spaSession.getRetreatBookingId())) {
                throw new BusinessRuleException("BOOKING_MISMATCH",
                        "Spa session ID " + request.getSourceSpaSessionId() + " belongs to booking "
                                + spaSession.getRetreatBookingId() + ", not booking " + booking.getRetreatBookingId());
            }
            if (spaSession.getSessionStatus() == SpaSessionStatus.CANCELLED) {
                throw new BusinessRuleException("INVALID_SERVICE_STATE",
                        "Cannot post folio charge for a CANCELLED spa session.");
            }
        } else if ("PACKAGE".equals(category)) {
            if (request.getSourceBookingId() == null) {
                throw new BusinessRuleException("INVALID_FOLIO_SOURCE",
                        "PACKAGE charge must have source_booking_id and no other source reference.");
            }
            if (request.getSourceSpaSessionId() != null || request.getSourceMealOrderId() != null) {
                throw new BusinessRuleException("INVALID_FOLIO_SOURCE",
                        "PACKAGE charge must not specify source_spa_session_id or source_meal_order_id.");
            }
            if (!booking.getRetreatBookingId().equals(request.getSourceBookingId().intValue())) {
                throw new BusinessRuleException("BOOKING_MISMATCH",
                        "Source booking ID " + request.getSourceBookingId() + " must match retreat booking " + booking.getRetreatBookingId());
            }
        }

        FolioItemEntity item = new FolioItemEntity(
                folio,
                category,
                request.getDescription(),
                request.getAmount(),
                request.getSourceBookingId(),
                request.getSourceSpaSessionId(),
                request.getSourceMealOrderId()
        );

        FolioItemEntity savedItem = folioItemRepository.save(item);
        folio.addItem(savedItem);
        folioRepository.save(folio);

        // If a DRAFT invoice exists, refresh its calculations
        if (existingInvoice != null && "DRAFT".equalsIgnoreCase(existingInvoice.getInvoiceStatus())) {
            List<FolioItemEntity> allItems = folioItemRepository.findByFolioId(folio.getFolioId());
            InvoiceCalculation calc = calculateInvoiceAmounts(booking, allItems);
            existingInvoice.setSubtotalAmount(calc.subtotal());
            existingInvoice.setTaxAmount(calc.tax());
            existingInvoice.setFinalAmount(calc.finalAmount());
            invoiceRepository.save(existingInvoice);
        }

        auditLogService.record("POST_CHARGE", "Folio#" + folio.getFolioId() + " (" + request.getChargeCategory() + ")", "SUCCESS");
        return mapToFolioItemResponse(savedItem);
    }

    @Transactional
    public InvoiceResponseDTO generateConsolidatedInvoice(Long retreatBookingId) {
        if (retreatBookingId == null) {
            throw new ResourceNotFoundException("Retreat booking ID cannot be null");
        }
        return generateConsolidatedInvoice(retreatBookingId.intValue());
    }

    @Transactional
    public InvoiceResponseDTO generateConsolidatedInvoice(Integer retreatBookingId) {
        RetreatBooking booking = bookingRepository.findByIdWithDetails(retreatBookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking not found with ID: " + retreatBookingId));

        FolioEntity folio = folioRepository.findByRetreatBookingId(retreatBookingId)
                .orElseGet(() -> createDefaultFolioForBooking(booking));

        // BILLING GUARD INVARIANT: Validate zero pending/preparing/ready orders
        validateBillingGuard(retreatBookingId);

        List<FolioItemEntity> items = folioItemRepository.findByFolioId(folio.getFolioId());
        InvoiceCalculation calc = calculateInvoiceAmounts(booking, items);

        // Check if invoice already exists
        InvoiceEntity existingInvoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElse(null);
        if (existingInvoice != null) {
            if ("DRAFT".equalsIgnoreCase(existingInvoice.getInvoiceStatus())) {
                // Refresh draft invoice with current items
                existingInvoice.setSubtotalAmount(calc.subtotal());
                existingInvoice.setTaxAmount(calc.tax());
                existingInvoice.setFinalAmount(calc.finalAmount());
                InvoiceEntity saved = invoiceRepository.save(existingInvoice);
                return mapToInvoiceResponse(saved, booking, items, calc);
            } else {
                return mapToInvoiceResponse(existingInvoice, booking, items, calc);
            }
        }

        String invoiceNumber = "INV-" + DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now()) + "-" + folio.getFolioId();

        InvoiceEntity invoice = new InvoiceEntity(
                folio,
                invoiceNumber,
                calc.subtotal(),
                calc.tax(),
                calc.finalAmount(),
                "DRAFT"
        );

        InvoiceEntity savedInvoice = invoiceRepository.save(invoice);
        auditLogService.record("GENERATE_INVOICE", "Invoice#" + savedInvoice.getInvoiceId(), "SUCCESS");

        return mapToInvoiceResponse(savedInvoice, booking, items, calc);
    }

    @Transactional(readOnly = true)
    public InvoiceResponseDTO getInvoiceById(Long invoiceId) {
        InvoiceEntity invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        FolioEntity folio = invoice.getFolio();
        RetreatBooking booking = folio.getRetreatBooking();
        List<FolioItemEntity> items = folioItemRepository.findByFolioId(folio.getFolioId());
        InvoiceCalculation calc = calculateInvoiceAmounts(booking, items);

        return mapToInvoiceResponse(invoice, booking, items, calc);
    }

    public void validateBillingGuard(Long retreatBookingId) {
        if (retreatBookingId == null) return;
        validateBillingGuard(retreatBookingId.intValue());
    }

    public void validateBillingGuard(Integer retreatBookingId) {
        List<SpaSession> unsettledSpa = spaSessionRepository.findUnsettledSessionsForBooking(retreatBookingId);
        if (!unsettledSpa.isEmpty()) {
            throw new BusinessRuleException("UNSETTLED_SERVICE_ORDERS",
                    "Warning: Unsettled service orders exist. Cannot proceed to invoice generation or checkout while "
                            + unsettledSpa.size() + " spa session(s) remain SCHEDULED or RESCHEDULING.");
        }

        List<MealOrderEntity> unsettledMeals = mealOrderRepository.findUnsettledOrdersForBooking(retreatBookingId);
        if (!unsettledMeals.isEmpty()) {
            throw new BusinessRuleException("UNSETTLED_SERVICE_ORDERS",
                    "Warning: Unsettled service orders exist. Cannot proceed to invoice generation or checkout while "
                            + unsettledMeals.size() + " dining order(s) remain PENDING, PREPARING, or READY.");
        }
    }


    public InvoiceCalculation calculateInvoiceAmounts(RetreatBooking booking, List<FolioItemEntity> items) {
        BigDecimal depositPaid = paymentTransactionRepository.sumSuccessfulDepositsForBooking(booking.getRetreatBookingId());
        if (depositPaid == null) {
            depositPaid = BigDecimal.ZERO;
        }

        BigDecimal packageCharges = BigDecimal.ZERO;
        BigDecimal spaCharges = BigDecimal.ZERO;
        BigDecimal fnbCharges = BigDecimal.ZERO;

        for (FolioItemEntity item : items) {
            BigDecimal amt = item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO;
            if ("PACKAGE".equalsIgnoreCase(item.getChargeCategory())) {
                packageCharges = packageCharges.add(amt);
            } else if ("SPA".equalsIgnoreCase(item.getChargeCategory())) {
                spaCharges = spaCharges.add(amt);
            } else if ("FNB".equalsIgnoreCase(item.getChargeCategory())) {
                fnbCharges = fnbCharges.add(amt);
            }
        }

        if (packageCharges.compareTo(BigDecimal.ZERO) == 0 && booking.getTotalEstimatedAmount() != null) {
            packageCharges = booking.getTotalEstimatedAmount();
        }

        BigDecimal packageOutstanding = packageCharges.subtract(depositPaid);
        if (packageOutstanding.compareTo(BigDecimal.ZERO) < 0) {
            packageOutstanding = BigDecimal.ZERO;
        }

        BigDecimal subtotal = packageOutstanding.add(spaCharges).add(fnbCharges);
        BigDecimal chargeableExtras = spaCharges.add(fnbCharges);
        BigDecimal tax = chargeableExtras.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);
        BigDecimal finalAmount = subtotal.add(tax);

        return new InvoiceCalculation(
                packageCharges,
                depositPaid,
                packageOutstanding,
                spaCharges,
                fnbCharges,
                vatRate,
                subtotal,
                tax,
                finalAmount
        );
    }

    private void syncFolioPaidState(FolioEntity folio, Integer bookingId) {
        BigDecimal deposits = paymentTransactionRepository.sumSuccessfulDepositsForBooking(bookingId);
        if (deposits == null) deposits = BigDecimal.ZERO;

        InvoiceEntity invoice = invoiceRepository.findByFolioId(folio.getFolioId()).orElse(null);
        BigDecimal finalPayments = BigDecimal.ZERO;
        if (invoice != null) {
            BigDecimal invoicePayments = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoice.getInvoiceId());
            if (invoicePayments != null) {
                finalPayments = invoicePayments;
            }
        }

        BigDecimal totalPaid = deposits.add(finalPayments);
        folio.setTotalPaid(totalPaid);

        if (!"CLOSED".equalsIgnoreCase(folio.getFolioStatus())) {
            if (invoice != null && "PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
                folio.setFolioStatus("PAID");
            } else if (totalPaid.compareTo(BigDecimal.ZERO) > 0) {
                folio.setFolioStatus("PARTIALLY_PAID");
            } else {
                folio.setFolioStatus("OPEN");
            }
        }
        folioRepository.save(folio);
    }

    private FolioEntity createDefaultFolioForBooking(RetreatBooking booking) {
        FolioEntity folio = new FolioEntity(booking);
        FolioEntity savedFolio = folioRepository.save(folio);

        BigDecimal packageTotal = booking.getTotalEstimatedAmount() != null && booking.getTotalEstimatedAmount().compareTo(BigDecimal.ZERO) > 0
                ? booking.getTotalEstimatedAmount()
                : new BigDecimal("24500000");

        FolioItemEntity pkgItem = new FolioItemEntity(
                savedFolio,
                "PACKAGE",
                "Sanctuary Retreat Package Accommodation & Full-Board",
                packageTotal,
                booking.getRetreatBookingId() != null ? booking.getRetreatBookingId().longValue() : null,
                null,
                null
        );
        folioItemRepository.save(pkgItem);
        savedFolio.addItem(pkgItem);

        BigDecimal deposits = paymentTransactionRepository.sumSuccessfulDepositsForBooking(booking.getRetreatBookingId());
        if (deposits != null && deposits.compareTo(BigDecimal.ZERO) > 0) {
            savedFolio.setTotalPaid(deposits);
            savedFolio.setFolioStatus("PARTIALLY_PAID");
        }

        return folioRepository.save(savedFolio);
    }

    private FolioResponseDTO mapToFolioResponse(FolioEntity folio, RetreatBooking booking,
                                                List<FolioItemEntity> items, InvoiceEntity invoice) {
        FolioResponseDTO dto = new FolioResponseDTO();
        dto.setFolioId(folio.getFolioId());
        dto.setRetreatBookingId(booking.getRetreatBookingId());
        dto.setBookingReference("HSW-" + (88000 + booking.getRetreatBookingId()));

        String customerName = "Resort Guest";
        if (booking.getCustomerProfileId() != null) {
            customerName = customerProfileRepository.findByIdWithUser(booking.getCustomerProfileId())
                    .map(cp -> cp.getUser() != null ? cp.getUser().getFullName() : "Resort Guest")
                    .orElse("Resort Guest");
        }
        dto.setCustomerName(customerName);

        String villaNum = booking.getAssignedVilla() != null ? booking.getAssignedVilla().getVillaNumber() : "Villa #102";
        dto.setVillaNumber(villaNum);

        dto.setTotalCharges(folio.getTotalCharges());
        dto.setTotalPaid(folio.getTotalPaid());
        dto.setBalanceDue(folio.getBalanceDue());
        dto.setFolioStatus(folio.getFolioStatus());
        dto.setClosedAt(folio.getClosedAt());

        InvoiceCalculation calc = calculateInvoiceAmounts(booking, items);
        dto.setDepositPaid(calc.depositPaid());
        dto.setPackageOutstanding(calc.packageOutstanding());
        dto.setVatRate(calc.vatRate());
        dto.setEstimatedTax(calc.tax());
        dto.setEstimatedAmountDue(calc.finalAmount());

        if (invoice != null) {
            dto.setInvoiceId(invoice.getInvoiceId());
            dto.setInvoiceStatus(invoice.getInvoiceStatus());
        }

        // Check for unsettled orders
        List<SpaSession> unsettledSpa = spaSessionRepository.findUnsettledSessionsForBooking(booking.getRetreatBookingId());
        List<MealOrderEntity> unsettledMeals = mealOrderRepository.findUnsettledOrdersForBooking(booking.getRetreatBookingId());

        boolean hasUnsettled = !unsettledSpa.isEmpty() || !unsettledMeals.isEmpty();
        dto.setHasUnsettledOrders(hasUnsettled);
        dto.setCanGenerateInvoice(!hasUnsettled);

        if (hasUnsettled) {
            List<String> reasons = new ArrayList<>();
            if (!unsettledSpa.isEmpty()) reasons.add(unsettledSpa.size() + " active spa session(s)");
            if (!unsettledMeals.isEmpty()) reasons.add(unsettledMeals.size() + " active meal order(s)");
            dto.setUnsettledOrdersWarning("Warning: Unsettled service orders exist (" + String.join(", ", reasons) + "). Must be completed or cancelled before settlement.");
        }

        dto.setItems(items.stream().map(this::mapToFolioItemResponse).collect(Collectors.toList()));
        return dto;
    }

    public FolioItemResponseDTO mapToFolioItemResponse(FolioItemEntity item) {
        return new FolioItemResponseDTO(
                item.getFolioItemId(),
                item.getFolio().getFolioId(),
                item.getChargeCategory(),
                item.getDescription(),
                item.getAmount(),
                item.getChargedAt(),
                item.getSourceBookingId(),
                item.getSourceSpaSessionId(),
                item.getSourceMealOrderId()
        );
    }

    private InvoiceResponseDTO mapToInvoiceResponse(InvoiceEntity invoice, RetreatBooking booking,
                                                    List<FolioItemEntity> items, InvoiceCalculation calc) {
        String bookingRef = "HSW-" + (88000 + booking.getRetreatBookingId());
        String customerName = "Resort Guest";
        if (booking.getCustomerProfileId() != null) {
            customerName = customerProfileRepository.findByIdWithUser(booking.getCustomerProfileId())
                    .map(cp -> cp.getUser() != null ? cp.getUser().getFullName() : "Resort Guest")
                    .orElse("Resort Guest");
        }
        String villaNum = booking.getAssignedVilla() != null ? booking.getAssignedVilla().getVillaNumber() : "Villa #102";

        LocalDate checkIn = booking.getCheckInDate();
        LocalDate checkOut = booking.getCheckOutDate();

        BigDecimal amountPaid = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoice.getInvoiceId());
        if (amountPaid == null) {
            amountPaid = BigDecimal.ZERO;
        }

        BigDecimal amountDue = invoice.getFinalAmount().subtract(amountPaid);
        if (amountDue.compareTo(BigDecimal.ZERO) < 0) {
            amountDue = BigDecimal.ZERO;
        }

        boolean zeroBalance = amountDue.compareTo(BigDecimal.ZERO) == 0;
        List<FolioItemResponseDTO> itemDtos = items.stream().map(this::mapToFolioItemResponse).collect(Collectors.toList());

        return new InvoiceResponseDTO(
                invoice.getInvoiceId(),
                invoice.getFolio().getFolioId(),
                booking.getRetreatBookingId(),
                invoice.getInvoiceNumber(),
                bookingRef,
                customerName,
                villaNum,
                checkIn,
                checkOut,
                calc.packageCharges(),
                calc.depositPaid(),
                calc.packageOutstanding(),
                calc.spaCharges(),
                calc.fnbCharges(),
                calc.vatRate(),
                invoice.getSubtotalAmount(),
                invoice.getTaxAmount(),
                invoice.getFinalAmount(),
                amountPaid,
                amountDue,
                zeroBalance,
                invoice.getInvoiceStatus(),
                invoice.getIssuedDate(),
                itemDtos
        );
    }
}
