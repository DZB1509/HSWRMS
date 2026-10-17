package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.RetreatPackageSpaTreatment;
import com.heavenstay.hswrms.m3spa.entity.RetreatPackageSpaTreatmentId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface RetreatPackageSpaTreatmentRepository extends JpaRepository<RetreatPackageSpaTreatment, RetreatPackageSpaTreatmentId> {

    @Query("SELECT r FROM RetreatPackageSpaTreatment r WHERE r.retreatPackage.retreatPackageId = :packageId")
    List<RetreatPackageSpaTreatment> findByRetreatPackageId(@Param("packageId") Integer packageId);

    @Query("SELECT r FROM RetreatPackageSpaTreatment r WHERE r.retreatPackage.packageCode = :packageCode")
    List<RetreatPackageSpaTreatment> findByPackageCode(@Param("packageCode") String packageCode);
}
