package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SpaTreatmentRepository extends JpaRepository<SpaTreatment, Integer> {
    Optional<SpaTreatment> findByTreatmentName(String treatmentName);
}
