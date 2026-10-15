package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PhysicalVillaRepository extends JpaRepository<PhysicalVilla, Integer> {
    Optional<PhysicalVilla> findByVillaNumber(String villaNumber);
    List<PhysicalVilla> findByVillaStatus(String villaStatus);
    List<PhysicalVilla> findByZoneName(String zoneName);
}
