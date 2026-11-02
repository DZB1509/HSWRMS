package com.heavenstay.hswrms.m5billing.repository;

import com.heavenstay.hswrms.m5billing.entity.CreditNoteEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface CreditNoteRepository extends JpaRepository<CreditNoteEntity, Long> {

    Optional<CreditNoteEntity> findByCreditNoteNumber(String creditNoteNumber);

    List<CreditNoteEntity> findByInvoiceInvoiceId(Long invoiceId);

    List<CreditNoteEntity> findByFolioItemFolioItemId(Long folioItemId);

    Optional<CreditNoteEntity> findByAdjustmentRequestAdjustmentRequestId(Long adjustmentRequestId);

    boolean existsByCreditNoteNumber(String creditNoteNumber);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT cn FROM CreditNoteEntity cn WHERE cn.creditNoteId = :creditNoteId")
    Optional<CreditNoteEntity> findByIdForUpdate(@Param("creditNoteId") Long creditNoteId);

    List<CreditNoteEntity> findByStatusOrderByIssuedAtDesc(String status);

    @Query("SELECT COALESCE(SUM(cn.finalCreditAmount), 0) FROM CreditNoteEntity cn WHERE cn.invoice.invoiceId = :invoiceId")
    BigDecimal sumFinalCreditAmountByInvoiceId(@Param("invoiceId") Long invoiceId);

    @Query("SELECT COALESCE(SUM(cn.refundAmount), 0) FROM CreditNoteEntity cn WHERE cn.invoice.invoiceId = :invoiceId AND cn.status = 'PENDING_REFUND'")
    BigDecimal sumPendingRefundAmountByInvoiceId(@Param("invoiceId") Long invoiceId);
}
