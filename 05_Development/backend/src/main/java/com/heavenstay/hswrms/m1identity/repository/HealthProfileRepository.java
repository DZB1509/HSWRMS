package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.HealthProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HealthProfileRepository extends JpaRepository<HealthProfile, Integer> {

    @Query("SELECT hp FROM HealthProfile hp WHERE hp.customerProfile.customerProfileId = :customerProfileId")
    Optional<HealthProfile> findByCustomerProfileId(@Param("customerProfileId") Integer customerProfileId);

    @Query("SELECT hp FROM HealthProfile hp WHERE hp.customerProfile.user.userId = :userId")
    Optional<HealthProfile> findByUserId(@Param("userId") Integer userId);

    boolean existsByCustomerProfileCustomerProfileId(Integer customerProfileId);
}
