package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.ResidenceRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResidenceRecordRepository extends JpaRepository<ResidenceRecord, Integer> {

    Optional<ResidenceRecord> findByRetreatBooking_RetreatBookingId(Integer retreatBookingId);

    java.util.List<ResidenceRecord> findByRetreatBooking_RetreatBookingIdIn(java.util.Collection<Integer> retreatBookingIds);

    boolean existsByRetreatBooking_RetreatBookingId(Integer retreatBookingId);
}
