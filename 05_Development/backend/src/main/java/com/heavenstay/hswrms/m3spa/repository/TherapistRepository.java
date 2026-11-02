package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.Therapist;
import com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TherapistRepository extends JpaRepository<Therapist, Integer> {

    List<Therapist> findByTherapistStatus(TherapistStatus status);

    Optional<Therapist> findByUserId(Integer userId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT t FROM Therapist t WHERE t.therapistId = :id")
    Optional<Therapist> findByIdWithLock(@Param("id") Integer id);

    @Query("SELECT q.therapist FROM TherapistTreatmentQualification q " +
           "WHERE q.treatment.treatmentId = :treatmentId " +
           "AND q.therapist.therapistStatus = :status")
    List<Therapist> findQualifiedTherapists(
            @Param("treatmentId") Integer treatmentId,
            @Param("status") TherapistStatus status
    );
}
