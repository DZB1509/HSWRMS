package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface UserAccountRepository extends JpaRepository<UserAccount, Integer>, JpaSpecificationExecutor<UserAccount> {

    Optional<UserAccount> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    long countByAccountStatus(String accountStatus);

    @Query("select count(distinct u) from UserAccount u join u.roles r "
            + "where r.roleName = :roleName and u.accountStatus = 'ACTIVE'")
    long countActiveByRole(@Param("roleName") String roleName);

    @Modifying
    @Query("update UserAccount u set u.accountStatus = 'ACTIVE', u.failedLoginCount = 0, u.lockedAt = null "
            + "where u.accountStatus = 'LOCKED' and u.lockedAt is not null and u.lockedAt < :threshold")
    int unlockLockedBefore(@Param("threshold") LocalDateTime threshold);
}
