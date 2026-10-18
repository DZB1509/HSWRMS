package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.SpaSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SpaSessionRepository extends JpaRepository<SpaSessionEntity, Long> {

    @Query("SELECT s FROM SpaSessionEntity s WHERE s.retreatBooking.retreatBookingId = :bookingId")
    List<SpaSessionEntity> findByRetreatBookingId(@Param("bookingId") Long bookingId);

    @Query("SELECT s FROM SpaSessionEntity s WHERE s.retreatBooking.retreatBookingId = :bookingId AND s.sessionStatus IN ('SCHEDULED', 'RESCHEDULING')")
    List<SpaSessionEntity> findUnsettledSessionsForBooking(@Param("bookingId") Long bookingId);

    @Query("SELECT s FROM SpaSessionEntity s LEFT JOIN FETCH s.therapist t LEFT JOIN FETCH t.user WHERE s.scheduledStartAt >= :start AND s.scheduledStartAt <= :end")
    List<SpaSessionEntity> findSessionsInDateRange(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
