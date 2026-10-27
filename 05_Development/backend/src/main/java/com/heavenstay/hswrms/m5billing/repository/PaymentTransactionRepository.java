package com.heavenstay.hswrms.m5billing.repository;

import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransactionEntity, Long> {

    Optional<PaymentTransactionEntity> findByTransactionReference(String transactionReference);

    @Query("SELECT pt FROM PaymentTransactionEntity pt WHERE pt.invoice.invoiceId = :invoiceId")
    List<PaymentTransactionEntity> findByInvoiceId(@Param("invoiceId") Long invoiceId);

    @Query("SELECT pt FROM PaymentTransactionEntity pt WHERE pt.retreatBooking.retreatBookingId = :bookingId")
    List<PaymentTransactionEntity> findByRetreatBookingId(@Param("bookingId") Integer bookingId);

    default List<PaymentTransactionEntity> findByRetreatBookingId(Long bookingId) {
        if (bookingId == null || bookingId > Integer.MAX_VALUE) return Collections.emptyList();
        return findByRetreatBookingId(bookingId.intValue());
    }

    @Query("SELECT SUM(pt.amountPaid) FROM PaymentTransactionEntity pt WHERE pt.invoice.invoiceId = :invoiceId AND pt.paymentStatus = 'SUCCESSFUL'")
    BigDecimal sumSuccessfulPaymentsForInvoice(@Param("invoiceId") Long invoiceId);

    @Query("SELECT SUM(pt.amountPaid) FROM PaymentTransactionEntity pt WHERE pt.retreatBooking.retreatBookingId = :bookingId AND pt.paymentType = 'DEPOSIT' AND pt.paymentStatus = 'SUCCESSFUL'")
    BigDecimal sumSuccessfulDepositsForBooking(@Param("bookingId") Integer bookingId);

    default BigDecimal sumSuccessfulDepositsForBooking(Long bookingId) {
        if (bookingId == null || bookingId > Integer.MAX_VALUE) return BigDecimal.ZERO;
        return sumSuccessfulDepositsForBooking(bookingId.intValue());
    }

    @Query("SELECT pt FROM PaymentTransactionEntity pt WHERE pt.transactionDate >= :start AND pt.transactionDate <= :end AND pt.paymentStatus = 'SUCCESSFUL'")
    List<PaymentTransactionEntity> findSuccessfulTransactionsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
