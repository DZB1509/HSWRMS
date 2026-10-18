package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.PhysicalVillaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PhysicalVillaRepository extends JpaRepository<PhysicalVillaEntity, Long> {
    Optional<PhysicalVillaEntity> findByVillaNumber(String villaNumber);
}
