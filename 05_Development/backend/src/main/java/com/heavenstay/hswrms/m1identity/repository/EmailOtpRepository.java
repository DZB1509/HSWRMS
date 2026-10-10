package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.EmailOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailOtpRepository extends JpaRepository<EmailOtp, Integer> {

    @Query("SELECT o FROM EmailOtp o WHERE o.user.userId = :userId AND o.purpose = :purpose AND o.consumed = false AND o.expiresAt > :now ORDER BY o.createdAt DESC")
    Optional<EmailOtp> findLatestValidOtp(
        @Param("userId") Integer userId,
        @Param("purpose") String purpose,
        @Param("now") Instant now
    );

    List<EmailOtp> findByUserUserIdAndPurpose(Integer userId, String purpose);

    @Query("SELECT o FROM EmailOtp o WHERE o.user.userId = :userId AND o.purpose = :purpose AND o.consumed = false ORDER BY o.createdAt DESC")
    Optional<EmailOtp> findLatestUnconsumedOtp(
        @Param("userId") Integer userId,
        @Param("purpose") String purpose
    );
}
