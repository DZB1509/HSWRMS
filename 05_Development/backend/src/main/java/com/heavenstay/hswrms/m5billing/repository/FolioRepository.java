package com.heavenstay.hswrms.m5billing.repository;

import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FolioRepository extends JpaRepository<FolioEntity, Long> {

    @Query("SELECT f FROM FolioEntity f LEFT JOIN FETCH f.retreatBooking b LEFT JOIN FETCH b.customerProfile cp LEFT JOIN FETCH cp.user LEFT JOIN FETCH b.assignedVilla WHERE b.retreatBookingId = :bookingId")
    Optional<FolioEntity> findByRetreatBookingId(@Param("bookingId") Long bookingId);

    @Query("SELECT f FROM FolioEntity f LEFT JOIN FETCH f.items WHERE f.folioId = :folioId")
    Optional<FolioEntity> findByIdWithItems(@Param("folioId") Long folioId);
}
