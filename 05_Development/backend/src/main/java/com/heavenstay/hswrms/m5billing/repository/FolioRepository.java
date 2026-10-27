package com.heavenstay.hswrms.m5billing.repository;

import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import java.util.Optional;

@Repository
public interface FolioRepository extends JpaRepository<FolioEntity, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT f FROM FolioEntity f WHERE f.folioId = :folioId")
    Optional<FolioEntity> findByIdForUpdate(@Param("folioId") Long folioId);

    @Query("SELECT f FROM FolioEntity f LEFT JOIN FETCH f.retreatBooking b LEFT JOIN FETCH b.assignedVilla WHERE b.retreatBookingId = :bookingId")
    Optional<FolioEntity> findByRetreatBookingId(@Param("bookingId") Integer bookingId);

    default Optional<FolioEntity> findByRetreatBookingId(Long bookingId) {
        if (bookingId == null || bookingId > Integer.MAX_VALUE) return Optional.empty();
        return findByRetreatBookingId(bookingId.intValue());
    }

    @Query("SELECT f FROM FolioEntity f LEFT JOIN FETCH f.items WHERE f.folioId = :folioId")
    Optional<FolioEntity> findByIdWithItems(@Param("folioId") Long folioId);
}
