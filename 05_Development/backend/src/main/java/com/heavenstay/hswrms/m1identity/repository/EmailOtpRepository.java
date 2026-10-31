package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.EmailOtp;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
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

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM EmailOtp o WHERE o.user.userId = :userId AND o.purpose = :purpose AND o.consumed = false ORDER BY o.createdAt DESC")
    Optional<EmailOtp> findLatestUnconsumedOtpForUpdate(
        @Param("userId") Integer userId,
        @Param("purpose") String purpose,
        Limit limit
    );

    @Query("SELECT o FROM EmailOtp o WHERE o.user.userId = :userId AND o.purpose = :purpose AND o.consumed = false ORDER BY o.createdAt DESC")
    Optional<EmailOtp> findLatestUnconsumedOtp(
        @Param("userId") Integer userId,
        @Param("purpose") String purpose
    );

    /**
     * Marks every unconsumed OTP for the given user and purpose as consumed
     * (with consumed_at = now).  Called before issuing a replacement OTP so
     * that old codes cannot be replayed once a fresh one has been sent.
     * No schema change: uses the existing consumed/consumed_at columns.
     */
    @Modifying
    @Query("UPDATE EmailOtp o SET o.consumed = true, o.consumedAt = :now " +
           "WHERE o.user.userId = :userId AND o.purpose = :purpose AND o.consumed = false")
    int invalidatePreviousOtps(
        @Param("userId") Integer userId,
        @Param("purpose") String purpose,
        @Param("now") Instant now
    );
}
