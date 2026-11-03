package com.heavenstay.hswrms.m5billing.port;

import com.heavenstay.hswrms.m5billing.dto.PaymentResponseDTO;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

/**
 * Public application port contract for PaymentTransaction operations owned by Module 5 (Billing).
 * Cross-module callers (such as M2 Booking) interact with PaymentTransactions
 * exclusively through this port rather than accessing M5 internal repositories directly.
 */
public interface PaymentTransactionPort {

    /**
     * Records a new DEPOSIT payment transaction for a retreat booking.
     * Idempotent: if a transaction with the same non-blank transactionReference already exists,
     * the existing transaction is returned without creating a duplicate.
     *
     * @param command details of the deposit transaction to record
     * @return PaymentResponseDTO representing the persisted or existing transaction
     */
    PaymentResponseDTO createDepositTransaction(CreateDepositTransactionCommand command);

    /**
     * Finds a payment transaction by its unique reference string.
     *
     * @param transactionReference the transaction reference
     * @return Optional containing PaymentResponseDTO if found, empty otherwise
     */
    Optional<PaymentResponseDTO> findByTransactionReference(String transactionReference);

    /**
     * Finds and pessimistically locks a payment transaction by reference for update.
     * Used by IPN/webhook processing to serialize concurrent callbacks.
     *
     * @param transactionReference the transaction reference
     * @return Optional containing PaymentResponseDTO if found, empty otherwise
     */
    Optional<PaymentResponseDTO> findByTransactionReferenceForUpdate(String transactionReference);

    /**
     * Finds a payment transaction by its primary key ID.
     *
     * @param transactionId the transaction ID
     * @return Optional containing PaymentResponseDTO if found, empty otherwise
     */
    Optional<PaymentResponseDTO> findByTransactionId(Long transactionId);

    /**
     * Updates the payment status of a transaction by reference.
     *
     * @param transactionReference the transaction reference
     * @param newStatus the new status (e.g. SUCCESSFUL, FAILED, CANCELLED)
     * @param transactionDate the timestamp of the status update (or null to retain/use UTC now)
     * @return updated PaymentResponseDTO
     */
    PaymentResponseDTO updatePaymentStatus(String transactionReference, String newStatus, LocalDateTime transactionDate);

    /**
     * Updates the payment status of a transaction by primary key ID.
     *
     * @param transactionId the transaction ID
     * @param newStatus the new status (e.g. SUCCESSFUL, FAILED, CANCELLED)
     * @param transactionDate the timestamp of the status update (or null to retain/use UTC now)
     * @return updated PaymentResponseDTO
     */
    PaymentResponseDTO updatePaymentStatusById(Long transactionId, String newStatus, LocalDateTime transactionDate);

    /**
     * Retrieves all DEPOSIT transactions for a given retreat booking, ordered by transaction ID descending.
     *
     * @param bookingId the retreat booking ID
     * @return list of PaymentResponseDTO
     */
    List<PaymentResponseDTO> findDepositTransactionsByBookingId(Integer bookingId);

    /**
     * Batch retrieval of DEPOSIT transactions for a collection of retreat booking IDs.
     *
     * @param bookingIds collection of retreat booking IDs
     * @return list of PaymentResponseDTO
     */
    List<PaymentResponseDTO> findDepositTransactionsByBookingIds(Collection<Integer> bookingIds);

    /**
     * Cancels all PENDING DEPOSIT transactions for a given retreat booking.
     *
     * @param bookingId the retreat booking ID
     * @return number of transactions cancelled
     */
    int cancelPendingDepositTransactions(Integer bookingId);

    /**
     * Calculates the sum of all successful deposit payments for a retreat booking.
     *
     * @param bookingId the retreat booking ID
     * @return total deposit amount paid
     */
    BigDecimal sumSuccessfulDepositsForBooking(Integer bookingId);
}

