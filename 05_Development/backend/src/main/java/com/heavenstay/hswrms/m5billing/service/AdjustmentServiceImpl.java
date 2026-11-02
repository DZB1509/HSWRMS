package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.dto.*;
import com.heavenstay.hswrms.m5billing.entity.*;
import com.heavenstay.hswrms.m5billing.repository.*;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class AdjustmentServiceImpl implements AdjustmentService {

    private static final Logger log = LoggerFactory.getLogger(AdjustmentServiceImpl.class);

    private final AdjustmentRequestRepository adjustmentRequestRepository;
    private final CreditNoteRepository creditNoteRepository;
    private final FolioRepository folioRepository;
    private final FolioItemRepository folioItemRepository;
    private final InvoiceRepository invoiceRepository;
    private final RetreatBookingRepository bookingRepository;
    private final FolioBillingService folioBillingService;
    private final AuditLogService auditLogService;
    private final BigDecimal vatRate;

    public AdjustmentServiceImpl(AdjustmentRequestRepository adjustmentRequestRepository,
                                 CreditNoteRepository creditNoteRepository,
                                 FolioRepository folioRepository,
                                 FolioItemRepository folioItemRepository,
                                 InvoiceRepository invoiceRepository,
                                 RetreatBookingRepository bookingRepository,
                                 FolioBillingService folioBillingService,
                                 AuditLogService auditLogService,
                                 @Value("${app.billing.vat-rate:0.08}") BigDecimal vatRate) {
        this.adjustmentRequestRepository = adjustmentRequestRepository;
        this.creditNoteRepository = creditNoteRepository;
        this.folioRepository = folioRepository;
        this.folioItemRepository = folioItemRepository;
        this.invoiceRepository = invoiceRepository;
        this.bookingRepository = bookingRepository;
        this.folioBillingService = folioBillingService;
        this.auditLogService = auditLogService;
        this.vatRate = vatRate != null ? vatRate : new BigDecimal("0.08");
    }

    @Override
    @Transactional
    public AdjustmentResponseDTO submitAdjustmentRequest(CreateAdjustmentRequestDTO request, Long requestedByUserId) {
        if (request == null || request.getFolioItemId() == null) {
            throw new BusinessRuleException("INVALID_CHARGE_REFERENCE", "Folio item ID is required.");
        }
        if (request.getReason() == null || request.getReason().trim().isEmpty()) {
            throw new BusinessRuleException("REASON_REQUIRED", "Adjustment reason is required.");
        }
        if (requestedByUserId == null) {
            throw new BusinessRuleException("REQUESTER_REQUIRED", "Requester user ID is required.");
        }

        FolioItemEntity item = folioItemRepository.findById(request.getFolioItemId())
                .orElseThrow(() -> new ResourceNotFoundException("Folio item not found with ID: " + request.getFolioItemId()));

        FolioEntity folio = folioRepository.findByIdForUpdate(item.getFolio().getFolioId())
                .orElseThrow(() -> new ResourceNotFoundException("Folio not found with ID: " + item.getFolio().getFolioId()));

        if (Boolean.TRUE.equals(item.getIsVoided())) {
            throw new BusinessRuleException("ALREADY_ADJUSTED", "Folio item is already voided.");
        }

        // Idempotency: Reject duplicate pending adjustment request for the same charge
        boolean pendingExists = adjustmentRequestRepository.existsByFolioItemFolioItemIdAndStatus(item.getFolioItemId(), "PENDING_APPROVAL");
        if (pendingExists) {
            throw new BusinessRuleException("DUPLICATE_ADJUSTMENT_REQUEST", "An adjustment request is already pending for this item.");
        }

        BigDecimal approvedSum = adjustmentRequestRepository.sumApprovedAmountByFolioItemId(item.getFolioItemId());
        if (approvedSum == null) {
            approvedSum = BigDecimal.ZERO;
        }

        BigDecimal remainingAdjustable = item.getAmount().subtract(approvedSum);
        if (remainingAdjustable.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("ALREADY_ADJUSTED", "Folio charge has already been fully adjusted.");
        }

        BigDecimal requestedAmount = request.getRequestedAmount();
        if (requestedAmount == null) {
            requestedAmount = remainingAdjustable;
        } else {
            if (requestedAmount.compareTo(BigDecimal.ZERO) <= 0) {
                throw new BusinessRuleException("INVALID_ADJUSTMENT_AMOUNT", "Requested amount must be greater than zero.");
            }
            if (requestedAmount.compareTo(remainingAdjustable) > 0) {
                throw new BusinessRuleException("EXCEEDS_ADJUSTABLE_AMOUNT",
                        "Requested amount (" + requestedAmount + ") exceeds remaining adjustable amount (" + remainingAdjustable + ").");
            }
        }

        Optional<InvoiceEntity> invoiceOpt = invoiceRepository.findByFolioId(folio.getFolioId());
        String adjustmentType = "VOID";
        if (invoiceOpt.isPresent()) {
            String invStatus = invoiceOpt.get().getInvoiceStatus();
            if ("ISSUED".equalsIgnoreCase(invStatus) || "PAID".equalsIgnoreCase(invStatus)) {
                adjustmentType = "CREDIT_NOTE";
            }
        }

        Long bookingId = folio.getRetreatBooking() != null ?
                folio.getRetreatBooking().getRetreatBookingId().longValue() : item.getSourceBookingId();

        AdjustmentRequestEntity entity = new AdjustmentRequestEntity(
                item,
                folio,
                bookingId,
                item.getSourceMealOrderId(),
                adjustmentType,
                requestedAmount,
                request.getReason().trim(),
                requestedByUserId
        );

        AdjustmentRequestEntity saved = adjustmentRequestRepository.save(entity);
        auditLogService.record(requestedByUserId, "REQUEST_ADJUSTMENT", "FolioItem#" + item.getFolioItemId(), "SUCCESS");

        log.info("Adjustment request created [id={}, folioItemId={}, type={}, amount={}, requester={}]",
                saved.getAdjustmentRequestId(), item.getFolioItemId(), adjustmentType, requestedAmount, requestedByUserId);

        return mapToAdjustmentResponse(saved);
    }

    @Override
    @Transactional
    public AdjustmentResponseDTO processAdjustmentDecision(Long requestId, AdjustmentDecisionDTO decision,
                                                           Long approverUserId, Collection<String> approverRoles) {
        if (requestId == null) {
            throw new BusinessRuleException("INVALID_REQUEST_ID", "Adjustment request ID is required.");
        }
        if (decision == null || decision.getDecision() == null) {
            throw new BusinessRuleException("DECISION_REQUIRED", "Decision (APPROVE or REJECT) is required.");
        }
        if (approverUserId == null) {
            throw new BusinessRuleException("APPROVER_REQUIRED", "Approver user ID is required.");
        }

        boolean isManagerOrAdmin = approverRoles != null && approverRoles.stream().anyMatch(role -> {
            String r = role.toUpperCase();
            return r.contains("MANAGER") || r.contains("ADMIN");
        });

        if (!isManagerOrAdmin) {
            throw new BusinessRuleException("UNAUTHORIZED_APPROVER", "Only Managers or Admins can approve or reject financial adjustments.");
        }

        AdjustmentRequestEntity adj = adjustmentRequestRepository.findByIdForUpdate(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Adjustment request not found with ID: " + requestId));

        // Separation of duties: Requester cannot approve their own request
        if (adj.getRequestedByUserId() != null && adj.getRequestedByUserId().equals(approverUserId)) {
            throw new BusinessRuleException("SEPARATION_OF_DUTIES_VIOLATION", "Requester cannot approve their own adjustment request.");
        }

        String decisionType = decision.getDecision().trim().toUpperCase();

        // Idempotency: Duplicate approval / retry returns existing decision safely
        if ("APPROVED".equalsIgnoreCase(adj.getStatus())) {
            if ("APPROVE".equals(decisionType)) {
                return mapToAdjustmentResponse(adj);
            } else {
                throw new BusinessRuleException("INVALID_ADJUSTMENT_STATE", "Adjustment request has already been approved.");
            }
        }
        if ("REJECTED".equalsIgnoreCase(adj.getStatus())) {
            if ("REJECT".equals(decisionType)) {
                return mapToAdjustmentResponse(adj);
            } else {
                throw new BusinessRuleException("INVALID_ADJUSTMENT_STATE", "Adjustment request has already been rejected.");
            }
        }

        if ("REJECT".equals(decisionType)) {
            String rejectionReason = decision.getRejectionReason();
            if (rejectionReason == null || rejectionReason.trim().isEmpty()) {
                throw new BusinessRuleException("REJECTION_REASON_REQUIRED", "Rejection reason is mandatory when rejecting an adjustment.");
            }
            adj.setStatus("REJECTED");
            adj.setRejectionReason(rejectionReason.trim());
            adj.setApprovedByUserId(approverUserId);
            adj.setApprovedAt(LocalDateTime.now());
            AdjustmentRequestEntity saved = adjustmentRequestRepository.save(adj);

            auditLogService.record(approverUserId, "REJECT_ADJUSTMENT", "AdjustmentRequest#" + requestId, "SUCCESS");
            log.info("Adjustment request rejected [id={}, approver={}, reason={}]", requestId, approverUserId, rejectionReason);
            return mapToAdjustmentResponse(saved);
        } else if ("APPROVE".equals(decisionType)) {
            FolioEntity folio = folioRepository.findByIdForUpdate(adj.getFolio().getFolioId())
                    .orElseThrow(() -> new ResourceNotFoundException("Folio not found"));
            FolioItemEntity item = folioItemRepository.findById(adj.getFolioItem().getFolioItemId())
                    .orElseThrow(() -> new ResourceNotFoundException("Folio item not found"));

            // Concurrency guard: Ensure total approved adjustments do not exceed original amount
            BigDecimal currentApproved = adjustmentRequestRepository.sumApprovedAmountByFolioItemId(item.getFolioItemId());
            if (currentApproved == null) currentApproved = BigDecimal.ZERO;

            BigDecimal newTotal = currentApproved.add(adj.getRequestedAmount());
            if (newTotal.compareTo(item.getAmount()) > 0) {
                throw new BusinessRuleException("EXCEEDS_ADJUSTABLE_AMOUNT",
                        "Approved amount (" + adj.getRequestedAmount() + ") would exceed original charge amount (" + item.getAmount() + ").");
            }

            Optional<InvoiceEntity> invoiceOpt = invoiceRepository.findByFolioId(folio.getFolioId());
            boolean invoiceIssuedOrPaid = invoiceOpt.isPresent() &&
                    ("ISSUED".equalsIgnoreCase(invoiceOpt.get().getInvoiceStatus()) ||
                     "PAID".equalsIgnoreCase(invoiceOpt.get().getInvoiceStatus()));

            if (!invoiceIssuedOrPaid) {
                // PRE-INVOICE ADJUSTMENT: update adjustedAmount and void only if 100% adjusted
                item.setAdjustedAmount(newTotal);
                if (newTotal.compareTo(item.getAmount()) >= 0) {
                    item.setIsVoided(true);
                    item.setVoidedAdjustmentRequestId(adj.getAdjustmentRequestId());
                } else {
                    item.setIsVoided(false);
                }
                folioItemRepository.save(item);

                // Recalculate totals on Folio
                folio.recalculateTotals();
                folioRepository.save(folio);

                // If draft invoice exists, refresh its calculations
                if (invoiceOpt.isPresent() && "DRAFT".equalsIgnoreCase(invoiceOpt.get().getInvoiceStatus())) {
                    InvoiceEntity draftInvoice = invoiceOpt.get();
                    RetreatBooking booking = bookingRepository.findByIdWithDetails(folio.getRetreatBooking().getRetreatBookingId())
                            .orElse(folio.getRetreatBooking());
                    List<FolioItemEntity> allItems = folioItemRepository.findByFolioId(folio.getFolioId());
                    InvoiceCalculation calc = folioBillingService.calculateInvoiceAmounts(booking, allItems);
                    draftInvoice.setSubtotalAmount(calc.subtotal());
                    draftInvoice.setTaxAmount(calc.tax());
                    draftInvoice.setFinalAmount(calc.finalAmount());
                    invoiceRepository.save(draftInvoice);
                }

                adj.setAdjustmentType("VOID");
                adj.setStatus("APPROVED");
                adj.setApprovedByUserId(approverUserId);
                adj.setApprovedAt(LocalDateTime.now());
                AdjustmentRequestEntity saved = adjustmentRequestRepository.save(adj);

                auditLogService.record(approverUserId, "APPROVE_VOID", "AdjustmentRequest#" + requestId, "SUCCESS");
                log.info("Adjustment void/reduction approved [id={}, folioItemId={}, amount={}, adjustedTotal={}, remainingPayable={}]",
                        requestId, item.getFolioItemId(), adj.getRequestedAmount(), newTotal, item.getPayableAmount());
                return mapToAdjustmentResponse(saved);
            } else {
                // CREDIT NOTE AFTER INVOICE ISSUANCE
                InvoiceEntity invoice = invoiceOpt.get();
                boolean isPaid = "PAID".equalsIgnoreCase(invoice.getInvoiceStatus());

                adj.setAdjustmentType("CREDIT_NOTE");
                adj.setStatus("APPROVED");
                adj.setApprovedByUserId(approverUserId);
                adj.setApprovedAt(LocalDateTime.now());
                AdjustmentRequestEntity saved = adjustmentRequestRepository.save(adj);

                String cnNumber = generateCreditNoteNumber(invoice, saved);
                BigDecimal baseAmount = adj.getRequestedAmount();
                BigDecimal taxAmount = baseAmount.multiply(vatRate).setScale(2, RoundingMode.HALF_UP);
                BigDecimal finalCredit = baseAmount.add(taxAmount);

                // If invoice is already PAID, record refund liability (PENDING_REFUND); if ISSUED, apply against balance
                String cnStatus = isPaid ? "PENDING_REFUND" : "CREDIT_APPLIED";
                BigDecimal refundAmount = isPaid ? finalCredit : BigDecimal.ZERO;

                CreditNoteEntity creditNote = new CreditNoteEntity(
                        cnNumber,
                        invoice,
                        item,
                        saved,
                        baseAmount,
                        taxAmount,
                        finalCredit,
                        approverUserId,
                        cnStatus,
                        refundAmount
                );
                creditNoteRepository.save(creditNote);

                auditLogService.record(approverUserId, "ISSUE_CREDIT_NOTE", "CreditNote#" + cnNumber, "SUCCESS");
                log.info("Credit note issued [cnNumber={}, invoiceId={}, status={}, amount={}, finalCredit={}, refundAmount={}]",
                        cnNumber, invoice.getInvoiceId(), cnStatus, baseAmount, finalCredit, refundAmount);
                return mapToAdjustmentResponse(saved, creditNote);
            }
        } else {
            throw new BusinessRuleException("INVALID_DECISION", "Decision must be APPROVE or REJECT.");
        }
    }

    @Override
    @Transactional
    public CreditNoteResponseDTO confirmRefundSettlement(Long creditNoteId, SettleRefundDTO settleDTO,
                                                         Long settledByUserId, Collection<String> userRoles) {
        if (creditNoteId == null) {
            throw new BusinessRuleException("INVALID_CREDIT_NOTE_ID", "Credit note ID is required.");
        }
        if (settleDTO == null) {
            throw new BusinessRuleException("SETTLEMENT_PAYLOAD_REQUIRED", "Settlement details are required.");
        }
        if (settleDTO.getSettlementAmount() == null || settleDTO.getSettlementAmount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("INVALID_SETTLEMENT_AMOUNT", "Settlement amount must be greater than zero.");
        }
        if (settleDTO.getTransactionReference() == null || settleDTO.getTransactionReference().trim().isEmpty()) {
            throw new BusinessRuleException("TRANSACTION_REF_REQUIRED", "Transaction reference is required.");
        }
        if (settledByUserId == null) {
            throw new BusinessRuleException("SETTLER_REQUIRED", "Settler user ID is required.");
        }

        boolean isManagerOrAdmin = userRoles != null && userRoles.stream().anyMatch(role -> {
            String r = role.toUpperCase();
            return r.contains("MANAGER") || r.contains("ADMIN");
        });

        if (!isManagerOrAdmin) {
            throw new BusinessRuleException("UNAUTHORIZED_SETTLER", "Only Managers or Admins can confirm refund settlements.");
        }

        CreditNoteEntity creditNote = creditNoteRepository.findByIdForUpdate(creditNoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit note not found with ID: " + creditNoteId));

        // Idempotency: If already refunded, verify matching reference or reject conflict
        if ("REFUNDED".equalsIgnoreCase(creditNote.getStatus())) {
            if (creditNote.getRefundTransactionRef() != null &&
                    !creditNote.getRefundTransactionRef().equalsIgnoreCase(settleDTO.getTransactionReference().trim())) {
                throw new BusinessRuleException("SETTLEMENT_ALREADY_COMPLETED",
                        "Credit note #" + creditNoteId + " is already settled under transaction ref: " + creditNote.getRefundTransactionRef());
            }
            log.info("Credit note #{} is already REFUNDED (idempotent settlement acknowledgement)", creditNoteId);
            return mapToCreditNoteResponse(creditNote);
        }

        if (!"PENDING_REFUND".equalsIgnoreCase(creditNote.getStatus())) {
            throw new BusinessRuleException("INVALID_SETTLEMENT_STATE",
                    "Credit note is not eligible for refund settlement. Current status: " + creditNote.getStatus());
        }

        if (settleDTO.getSettlementAmount().compareTo(creditNote.getFinalCreditAmount()) > 0) {
            throw new BusinessRuleException("EXCEEDS_CREDIT_AMOUNT",
                    "Settlement amount (" + settleDTO.getSettlementAmount() + ") cannot exceed credit note final credit amount (" + creditNote.getFinalCreditAmount() + ").");
        }

        if (settleDTO.getSettlementAmount().compareTo(creditNote.getFinalCreditAmount()) < 0) {
            throw new BusinessRuleException("UNDERPAYMENT_REJECTED",
                    "Full refund settlement required. Settlement amount (" + settleDTO.getSettlementAmount() + ") cannot be less than final credit amount (" + creditNote.getFinalCreditAmount() + ").");
        }

        creditNote.setStatus("REFUNDED");
        creditNote.setRefundAmount(settleDTO.getSettlementAmount());
        creditNote.setSettledAt(LocalDateTime.now());
        creditNote.setSettledByUserId(settledByUserId);
        creditNote.setRefundTransactionRef(settleDTO.getTransactionReference().trim());
        creditNote.setSettlementNotes(settleDTO.getNotes() != null ? settleDTO.getNotes().trim() : null);

        CreditNoteEntity saved = creditNoteRepository.save(creditNote);
        auditLogService.record(settledByUserId, "SETTLE_REFUND", "CreditNote#" + creditNote.getCreditNoteNumber(), "SUCCESS");
        log.info("Credit note refund settled [id={}, cnNumber={}, amount={}, txRef={}, settler={}]",
                saved.getCreditNoteId(), saved.getCreditNoteNumber(), saved.getRefundAmount(),
                saved.getRefundTransactionRef(), settledByUserId);

        return mapToCreditNoteResponse(saved);
    }

    private String generateCreditNoteNumber(InvoiceEntity invoice, AdjustmentRequestEntity adj) {
        String datePart = DateTimeFormatter.ofPattern("yyyyMMdd").format(LocalDateTime.now());
        String base = "CN-" + datePart + "-" + invoice.getInvoiceId() + "-" + adj.getAdjustmentRequestId();
        if (!creditNoteRepository.existsByCreditNoteNumber(base)) {
            return base;
        }
        int suffix = 1;
        while (creditNoteRepository.existsByCreditNoteNumber(base + "-" + suffix)) {
            suffix++;
        }
        return base + "-" + suffix;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdjustmentResponseDTO> getAdjustmentRequestsForFolio(Long folioId) {
        return adjustmentRequestRepository.findByFolioFolioIdOrderByRequestedAtDesc(folioId)
                .stream().map(this::mapToAdjustmentResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdjustmentResponseDTO> getAdjustmentRequestsForBooking(Long retreatBookingId) {
        return adjustmentRequestRepository.findByRetreatBookingIdOrderByRequestedAtDesc(retreatBookingId)
                .stream().map(this::mapToAdjustmentResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdjustmentResponseDTO> getAdjustmentRequestsByStatus(String status) {
        return adjustmentRequestRepository.findByStatusOrderByRequestedAtDesc(status)
                .stream().map(this::mapToAdjustmentResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public AdjustmentResponseDTO getAdjustmentRequestDetails(Long requestId) {
        AdjustmentRequestEntity entity = adjustmentRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Adjustment request not found with ID: " + requestId));
        return mapToAdjustmentResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public CreditNoteResponseDTO getCreditNoteDetails(Long creditNoteId) {
        CreditNoteEntity entity = creditNoteRepository.findById(creditNoteId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit note not found with ID: " + creditNoteId));
        return mapToCreditNoteResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public CreditNoteResponseDTO getCreditNoteByNumber(String creditNoteNumber) {
        CreditNoteEntity entity = creditNoteRepository.findByCreditNoteNumber(creditNoteNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Credit note not found with number: " + creditNoteNumber));
        return mapToCreditNoteResponse(entity);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CreditNoteResponseDTO> getCreditNotesForInvoice(Long invoiceId) {
        return creditNoteRepository.findByInvoiceInvoiceId(invoiceId)
                .stream().map(this::mapToCreditNoteResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<CreditNoteResponseDTO> getCreditNotesByStatus(String status) {
        if (status == null || status.isBlank()) {
            return creditNoteRepository.findAll().stream().map(this::mapToCreditNoteResponse).collect(Collectors.toList());
        }
        return creditNoteRepository.findByStatusOrderByIssuedAtDesc(status.trim().toUpperCase())
                .stream().map(this::mapToCreditNoteResponse).collect(Collectors.toList());
    }

    private AdjustmentResponseDTO mapToAdjustmentResponse(AdjustmentRequestEntity adj) {
        Optional<CreditNoteEntity> cnOpt = creditNoteRepository.findByAdjustmentRequestAdjustmentRequestId(adj.getAdjustmentRequestId());
        return mapToAdjustmentResponse(adj, cnOpt.orElse(null));
    }

    private AdjustmentResponseDTO mapToAdjustmentResponse(AdjustmentRequestEntity adj, CreditNoteEntity cn) {
        AdjustmentResponseDTO dto = new AdjustmentResponseDTO(
                adj.getAdjustmentRequestId(),
                adj.getFolioItem().getFolioItemId(),
                adj.getFolio().getFolioId(),
                adj.getRetreatBookingId(),
                adj.getSourceMealOrderId(),
                adj.getAdjustmentType(),
                adj.getRequestedAmount(),
                adj.getReason(),
                adj.getStatus(),
                adj.getRequestedByUserId(),
                adj.getRequestedAt(),
                adj.getApprovedByUserId(),
                adj.getApprovedAt(),
                adj.getRejectionReason(),
                cn != null ? cn.getCreditNoteId() : null,
                cn != null ? cn.getCreditNoteNumber() : null
        );
        if (cn != null) {
            dto.setCreditNoteStatus(cn.getStatus());
            dto.setRefundAmount(cn.getRefundAmount());
        }
        return dto;
    }

    private CreditNoteResponseDTO mapToCreditNoteResponse(CreditNoteEntity cn) {
        return new CreditNoteResponseDTO(
                cn.getCreditNoteId(),
                cn.getCreditNoteNumber(),
                cn.getInvoice().getInvoiceId(),
                cn.getFolioItem().getFolioItemId(),
                cn.getAdjustmentRequest().getAdjustmentRequestId(),
                cn.getAmount(),
                cn.getTaxAmount(),
                cn.getFinalCreditAmount(),
                cn.getIssuedAt(),
                cn.getIssuedByUserId(),
                cn.getStatus(),
                cn.getRefundAmount(),
                cn.getSettledAt(),
                cn.getSettledByUserId(),
                cn.getRefundTransactionRef(),
                cn.getSettlementNotes()
        );
    }
}
