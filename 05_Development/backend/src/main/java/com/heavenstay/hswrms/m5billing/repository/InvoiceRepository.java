package com.heavenstay.hswrms.m5billing.repository;

import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InvoiceRepository extends JpaRepository<InvoiceEntity, Long> {

    @Query("SELECT i FROM InvoiceEntity i LEFT JOIN FETCH i.folio f LEFT JOIN FETCH f.retreatBooking b WHERE i.invoiceId = :invoiceId")
    Optional<InvoiceEntity> findByIdWithDetails(@Param("invoiceId") Long invoiceId);

    @Query("SELECT i FROM InvoiceEntity i WHERE i.folio.folioId = :folioId")
    Optional<InvoiceEntity> findByFolioId(@Param("folioId") Long folioId);

    @Query("SELECT i FROM InvoiceEntity i WHERE i.folio.retreatBooking.retreatBookingId = :bookingId")
    Optional<InvoiceEntity> findByRetreatBookingId(@Param("bookingId") Long bookingId);

    Optional<InvoiceEntity> findByInvoiceNumber(String invoiceNumber);

    /** True when the invoice's stay belongs to the given user (customer ownership check). */
    @Query("SELECT COUNT(i) > 0 FROM InvoiceEntity i WHERE i.invoiceId = :invoiceId AND i.folio.retreatBooking.customerProfile.user.userId = :userId")
    boolean existsByIdAndCustomerUserId(@Param("invoiceId") Long invoiceId, @Param("userId") Long userId);
}
