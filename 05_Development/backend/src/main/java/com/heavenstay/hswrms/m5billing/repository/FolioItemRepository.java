package com.heavenstay.hswrms.m5billing.repository;

import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface FolioItemRepository extends JpaRepository<FolioItemEntity, Long> {

    @Query("SELECT fi FROM FolioItemEntity fi WHERE fi.folio.folioId = :folioId ORDER BY fi.chargedAt ASC")
    List<FolioItemEntity> findByFolioId(@Param("folioId") Long folioId);

    boolean existsBySourceSpaSessionId(Long sourceSpaSessionId);

    boolean existsBySourceMealOrderId(Long sourceMealOrderId);

    @Query("SELECT fi FROM FolioItemEntity fi WHERE fi.chargedAt >= :start AND fi.chargedAt <= :end")
    List<FolioItemEntity> findItemsInDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    @Query("SELECT fi.chargeCategory, SUM(fi.amount) FROM FolioItemEntity fi WHERE fi.chargedAt >= :start AND fi.chargedAt <= :end GROUP BY fi.chargeCategory")
    List<Object[]> sumAmountByCategoryBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
