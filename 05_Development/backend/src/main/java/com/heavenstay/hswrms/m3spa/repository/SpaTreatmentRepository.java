package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.SpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SpaTreatmentRepository extends JpaRepository<SpaTreatment, Integer> {
    List<SpaTreatment> findByTreatmentStatus(TreatmentStatus status);
}
