package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.PaymentTransaction;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("bookingPaymentTransactionRepository")
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Integer> {

    Optional<PaymentTransaction> findByTransactionReference(String transactionReference);

    /** Serializes concurrent IPN deliveries for the same transaction (idempotency). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM PaymentTransaction p WHERE p.transactionReference = :ref")
    Optional<PaymentTransaction> findByReferenceForUpdate(@Param("ref") String ref);

    List<PaymentTransaction> findByRetreatBookingIdAndPaymentTypeOrderByTransactionIdDesc(Integer bookingId, String paymentType);

    List<PaymentTransaction> findByRetreatBookingIdInAndPaymentType(java.util.Collection<Integer> bookingIds, String paymentType);
}
