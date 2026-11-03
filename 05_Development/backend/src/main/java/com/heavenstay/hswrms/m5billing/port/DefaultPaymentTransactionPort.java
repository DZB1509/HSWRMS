package com.heavenstay.hswrms.m5billing.port;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Production implementation of {@link PaymentTransactionPort} residing in Module 5 (Billing).
 * Manages PaymentTransaction persistence, status transitions, and queries on behalf of
 * cross-module callers while encapsulating M5 internal persistence models.
 */
@Service
@Transactional
public class DefaultPaymentTransactionPort implements PaymentTransactionPort {

    private static final Logger log = LoggerFactory.getLogger(DefaultPaymentTransactionPort.class);

    private final PaymentTransactionRepository paymentTransactionRepository;
    private final RetreatBookingRepository bookingRepository;

    public DefaultPaymentTransactionPort(PaymentTransactionRepository paymentTransactionRepository,
                                         RetreatBookingRepository bookingRepository) {
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.bookingRepository = bookingRepository;
    }

    @Override
    public PaymentResponseDTO createDepositTransaction(CreateDepositTransactionCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("CreateDepositTransactionCommand must not be null");
        }
        if (command.retreatBookingId() == null) {
            throw new BusinessRuleException("MISSING_BOOKING_ID", "retreatBookingId is mandatory for deposit transaction");
        }
        if (command.amountPaid() == null || command.amountPaid().compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("INVALID_AMOUNT", "amountPaid must be non-negative");
        }

        // Idempotency check: if reference provided and already exists, return existing record
        String ref = command.transactionReference() != null ? command.transactionReference().trim() : null;
        if (ref != null && !ref.isBlank()) {
            Optional<PaymentTransactionEntity> existing = paymentTransactionRepository.findByTransactionReference(ref);
            if (existing.isPresent()) {
                log.info("Deposit transaction with reference '{}' already exists. Returning existing record idempotently.", ref);
                return mapToResponse(existing.get());
            }
        }

        RetreatBooking booking = bookingRepository.findById(command.retreatBookingId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking not found with ID: " + command.retreatBookingId()));

        PaymentTransactionEntity entity = new PaymentTransactionEntity();
        entity.setRetreatBooking(booking);
        entity.setInvoice(null); // Strictly null for DEPOSIT, satisfying CK_PaymentTransaction_Target
        entity.setPaymentType("DEPOSIT");
        entity.setPaymentMethod(command.paymentMethod() != null ? command.paymentMethod().trim().toUpperCase() : "CASH");
        entity.setTransactionReference(ref);
        entity.setAmountPaid(command.amountPaid());
        entity.setPaymentStatus(command.paymentStatus() != null ? command.paymentStatus().trim().toUpperCase() : "PENDING");
        entity.setTransactionDate(command.transactionDate() != null ? command.transactionDate() : LocalDateTime.now(ZoneOffset.UTC));

        PaymentTransactionEntity saved = paymentTransactionRepository.save(entity);
        log.info("Recorded deposit transaction #{} (ref='{}', amount={}, status={}) for booking #{}",
                saved.getTransactionId(), saved.getTransactionReference(), saved.getAmountPaid(),
                saved.getPaymentStatus(), command.retreatBookingId());
        return mapToResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PaymentResponseDTO> findByTransactionReference(String transactionReference) {
        if (transactionReference == null || transactionReference.isBlank()) {
            return Optional.empty();
        }
        return paymentTransactionRepository.findByTransactionReference(transactionReference.trim())
                .map(this::mapToResponse);
    }

    @Override
    public Optional<PaymentResponseDTO> findByTransactionReferenceForUpdate(String transactionReference) {
        if (transactionReference == null || transactionReference.isBlank()) {
            return Optional.empty();
        }
        return paymentTransactionRepository.findByTransactionReferenceWithLock(transactionReference.trim())
                .map(this::mapToResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<PaymentResponseDTO> findByTransactionId(Long transactionId) {
        if (transactionId == null) {
            return Optional.empty();
        }
        return paymentTransactionRepository.findById(transactionId)
                .map(this::mapToResponse);
    }

    @Override
    public PaymentResponseDTO updatePaymentStatus(String transactionReference, String newStatus, LocalDateTime transactionDate) {
        if (transactionReference == null || transactionReference.isBlank()) {
            throw new IllegalArgumentException("transactionReference must not be null or blank");
        }
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("newStatus must not be null or blank");
        }

        String normalizedStatus = newStatus.trim().toUpperCase();
        PaymentTransactionEntity entity = paymentTransactionRepository.findByTransactionReferenceWithLock(transactionReference.trim())
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found for reference: " + transactionReference));

        return applyStatusUpdate(entity, normalizedStatus, transactionDate);
    }

    @Override
    public PaymentResponseDTO updatePaymentStatusById(Long transactionId, String newStatus, LocalDateTime transactionDate) {
        if (transactionId == null) {
            throw new IllegalArgumentException("transactionId must not be null");
        }
        if (newStatus == null || newStatus.isBlank()) {
            throw new IllegalArgumentException("newStatus must not be null or blank");
        }

        String normalizedStatus = newStatus.trim().toUpperCase();
        PaymentTransactionEntity entity = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Payment transaction not found for ID: " + transactionId));

        return applyStatusUpdate(entity, normalizedStatus, transactionDate);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> findDepositTransactionsByBookingId(Integer bookingId) {
        if (bookingId == null) {
            return Collections.emptyList();
        }
        List<PaymentTransactionEntity> list = paymentTransactionRepository
                .findByRetreatBookingIdAndPaymentTypeOrderByTransactionIdDesc(bookingId, "DEPOSIT");
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponseDTO> findDepositTransactionsByBookingIds(Collection<Integer> bookingIds) {
        if (bookingIds == null || bookingIds.isEmpty()) {
            return Collections.emptyList();
        }
        List<PaymentTransactionEntity> list = paymentTransactionRepository
                .findByRetreatBookingIdInAndPaymentType(bookingIds, "DEPOSIT");
        return list.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Override
    public int cancelPendingDepositTransactions(Integer bookingId) {
        if (bookingId == null) {
            return 0;
        }
        List<PaymentTransactionEntity> pendingList = paymentTransactionRepository
                .findByRetreatBookingIdAndPaymentTypeAndPaymentStatus(bookingId, "DEPOSIT", "PENDING");
        for (PaymentTransactionEntity txn : pendingList) {
            txn.setPaymentStatus("CANCELLED");
            paymentTransactionRepository.save(txn);
        }
        log.info("Cancelled {} pending deposit transactions for booking #{}", pendingList.size(), bookingId);
        return pendingList.size();
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal sumSuccessfulDepositsForBooking(Integer bookingId) {
        if (bookingId == null) {
            return BigDecimal.ZERO;
        }
        BigDecimal sum = paymentTransactionRepository.sumSuccessfulDepositsForBooking(bookingId);
        return sum != null ? sum : BigDecimal.ZERO;
    }

    private PaymentResponseDTO applyStatusUpdate(PaymentTransactionEntity entity, String targetStatus, LocalDateTime transactionDate) {
        String currentStatus = entity.getPaymentStatus() != null ? entity.getPaymentStatus().toUpperCase() : "PENDING";

        // Idempotent: if already in target status, return existing entity
        if (currentStatus.equals(targetStatus)) {
            log.info("Transaction #{} (ref='{}') is already in status {}. Idempotent return.",
                    entity.getTransactionId(), entity.getTransactionReference(), targetStatus);
            return mapToResponse(entity);
        }

        // Settlement Guard: once SUCCESSFUL, cannot transition back to FAILED or CANCELLED
        if ("SUCCESSFUL".equals(currentStatus) && !"SUCCESSFUL".equals(targetStatus)) {
            throw new BusinessRuleException("TRANSACTION_ALREADY_SETTLED",
                    "Cannot update payment status of an already SUCCESSFUL transaction to " + targetStatus);
        }

        entity.setPaymentStatus(targetStatus);
        entity.setTransactionDate(transactionDate != null ? transactionDate : LocalDateTime.now(ZoneOffset.UTC));

        PaymentTransactionEntity saved = paymentTransactionRepository.save(entity);
        log.info("Updated transaction #{} (ref='{}') status from {} to {}",
                saved.getTransactionId(), saved.getTransactionReference(), currentStatus, targetStatus);
        return mapToResponse(saved);
    }

    private PaymentResponseDTO mapToResponse(PaymentTransactionEntity tx) {
        if (tx == null) {
            return null;
        }
        PaymentResponseDTO dto = new PaymentResponseDTO();
        dto.setTransactionId(tx.getTransactionId());
        if (tx.getInvoice() != null) {
            dto.setInvoiceId(tx.getInvoice().getInvoiceId());
        }
        if (tx.getRetreatBooking() != null) {
            dto.setRetreatBookingId(tx.getRetreatBooking().getRetreatBookingId());
        }
        dto.setPaymentType(tx.getPaymentType());
        dto.setPaymentMethod(tx.getPaymentMethod());
        dto.setTransactionReference(tx.getTransactionReference());
        dto.setAmountPaid(tx.getAmountPaid());
        dto.setPaymentStatus(tx.getPaymentStatus());
        dto.setTransactionDate(tx.getTransactionDate());
        return dto;
    }
}

