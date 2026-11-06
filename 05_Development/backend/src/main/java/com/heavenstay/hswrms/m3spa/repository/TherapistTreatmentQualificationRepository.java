package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.TherapistTreatmentQualification;
import com.heavenstay.hswrms.m3spa.entity.TherapistTreatmentQualificationId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TherapistTreatmentQualificationRepository extends JpaRepository<TherapistTreatmentQualification, TherapistTreatmentQualificationId> {
    boolean existsByTherapist_TherapistIdAndTreatment_TreatmentId(Integer therapistId, Integer treatmentId);
    List<TherapistTreatmentQualification> findByTherapist_TherapistId(Integer therapistId);
}
