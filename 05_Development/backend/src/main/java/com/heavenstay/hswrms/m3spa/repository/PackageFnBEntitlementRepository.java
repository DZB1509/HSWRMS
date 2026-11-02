package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.PackageFnBEntitlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PackageFnBEntitlementRepository extends JpaRepository<PackageFnBEntitlement, Integer> {

    @Query("SELECT f FROM PackageFnBEntitlement f WHERE f.retreatPackage.retreatPackageId = :packageId")
    Optional<PackageFnBEntitlement> findByRetreatPackageId(@Param("packageId") Integer packageId);

    @Query("SELECT f FROM PackageFnBEntitlement f WHERE f.retreatPackage.packageCode = :packageCode")
    Optional<PackageFnBEntitlement> findByPackageCode(@Param("packageCode") String packageCode);
}
