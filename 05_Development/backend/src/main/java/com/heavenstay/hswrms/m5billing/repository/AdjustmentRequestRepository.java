package com.heavenstay.hswrms.m5billing.repository;

import com.heavenstay.hswrms.m5billing.entity.AdjustmentRequestEntity;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface AdjustmentRequestRepository extends JpaRepository<AdjustmentRequestEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT ar FROM AdjustmentRequestEntity ar WHERE ar.adjustmentRequestId = :id")
    Optional<AdjustmentRequestEntity> findByIdForUpdate(@Param("id") Long id);

    List<AdjustmentRequestEntity> findByFolioFolioIdOrderByRequestedAtDesc(Long folioId);

    List<AdjustmentRequestEntity> findByRetreatBookingIdOrderByRequestedAtDesc(Long retreatBookingId);

    List<AdjustmentRequestEntity> findByStatusOrderByRequestedAtDesc(String status);

    List<AdjustmentRequestEntity> findByFolioItemFolioItemIdOrderByRequestedAtDesc(Long folioItemId);

    List<AdjustmentRequestEntity> findByFolioItemFolioItemIdAndStatusIn(Long folioItemId, Collection<String> statuses);

    boolean existsByFolioItemFolioItemIdAndStatus(Long folioItemId, String status);

    @Query("SELECT COALESCE(SUM(ar.requestedAmount), 0) FROM AdjustmentRequestEntity ar WHERE ar.folioItem.folioItemId = :folioItemId AND ar.status = 'APPROVED'")
    BigDecimal sumApprovedAmountByFolioItemId(@Param("folioItemId") Long folioItemId);
}

