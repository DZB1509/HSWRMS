package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.ResortZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ResortZoneRepository extends JpaRepository<ResortZone, Integer> {
    Optional<ResortZone> findByZoneName(String zoneName);
}
