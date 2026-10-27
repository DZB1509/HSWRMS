package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RetreatPackageRepository extends JpaRepository<RetreatPackage, Integer> {

    List<RetreatPackage> findByPackageStatus(String packageStatus);

    List<RetreatPackage> findByPackageStatusAndWellnessGoalContainingIgnoreCase(String packageStatus, String wellnessGoal);
}
