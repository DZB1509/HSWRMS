package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomerProfileRepository extends JpaRepository<CustomerProfile, Integer> {

    @Query("SELECT cp FROM CustomerProfile cp WHERE cp.user.userId = :userId")
    Optional<CustomerProfile> findByUserId(@Param("userId") Integer userId);

    @Query("SELECT cp FROM CustomerProfile cp JOIN FETCH cp.user WHERE cp.customerProfileId = :customerProfileId")
    Optional<CustomerProfile> findByIdWithUser(@Param("customerProfileId") Integer customerProfileId);

    @Query("SELECT cp FROM CustomerProfile cp LEFT JOIN FETCH cp.healthProfile WHERE cp.user.userId = :userId")
    Optional<CustomerProfile> findByUserIdWithHealthProfile(@Param("userId") Integer userId);

    boolean existsByUserUserId(Integer userId);
}
