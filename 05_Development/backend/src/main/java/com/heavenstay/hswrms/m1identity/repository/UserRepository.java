
package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByPhoneNumber(String phoneNumber);

    @Query("""
        SELECT DISTINCT u
        FROM User u
        LEFT JOIN FETCH u.userRoles ur
        LEFT JOIN FETCH ur.role
        WHERE u.email = :email
        """)
    Optional<User> findByEmailWithRoles(@Param("email") String email);

    @Query("""
        SELECT DISTINCT u
        FROM User u
        LEFT JOIN FETCH u.userRoles ur
        LEFT JOIN FETCH ur.role
        WHERE u.userId = :userId
        """)
    Optional<User> findByIdWithRoles(@Param("userId") Integer userId);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.accountStatus = 'ACTIVE', u.failedLoginCount = 0, u.lockedAt = null WHERE u.accountStatus = 'LOCKED' AND u.lockedAt <= :cutoff")
    int unlockAccountsBefore(@Param("cutoff") java.time.Instant cutoff);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("""
        UPDATE User u
        SET u.failedLoginCount = u.failedLoginCount + 1,
            u.accountStatus = CASE WHEN (u.failedLoginCount + 1 >= :maxAttempts) THEN 'LOCKED' ELSE u.accountStatus END,
            u.lockedAt = CASE WHEN (u.failedLoginCount + 1 >= :maxAttempts) THEN :now ELSE u.lockedAt END
        WHERE u.userId = :userId AND u.accountStatus = 'ACTIVE'
    """)
    int incrementFailedAttemptAndLockIfThresholdReached(@Param("userId") Integer userId,
                                                        @Param("maxAttempts") int maxAttempts,
                                                        @Param("now") java.time.Instant now);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.failedLoginCount = 0, u.lastLoginAt = :now WHERE u.userId = :userId")
    int recordSuccessfulLogin(@Param("userId") Integer userId, @Param("now") java.time.Instant now);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE User u SET u.accountStatus = 'ACTIVE', u.failedLoginCount = 0, u.lockedAt = null WHERE u.userId = :userId AND u.accountStatus = 'LOCKED'")
    int unlockAccountById(@Param("userId") Integer userId);

    @Query(value = """
        SELECT DISTINCT u FROM User u
        JOIN u.userRoles ur
        JOIN ur.role r
        WHERE (:role IS NULL OR UPPER(r.roleName) = UPPER(:role) OR UPPER(r.roleName) = UPPER(CONCAT('ROLE_', :role)))
          AND (:status IS NULL OR UPPER(u.accountStatus) = UPPER(:status))
          AND (:query IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
                             OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
                             OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :query, '%')))
          AND UPPER(r.roleName) NOT IN ('CUSTOMER', 'ROLE_CUSTOMER')
    """,
    countQuery = """
        SELECT COUNT(DISTINCT u) FROM User u
        JOIN u.userRoles ur
        JOIN ur.role r
        WHERE (:role IS NULL OR UPPER(r.roleName) = UPPER(:role) OR UPPER(r.roleName) = UPPER(CONCAT('ROLE_', :role)))
          AND (:status IS NULL OR UPPER(u.accountStatus) = UPPER(:status))
          AND (:query IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :query, '%'))
                             OR LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))
                             OR LOWER(u.phoneNumber) LIKE LOWER(CONCAT('%', :query, '%')))
          AND UPPER(r.roleName) NOT IN ('CUSTOMER', 'ROLE_CUSTOMER')
    """)
    org.springframework.data.domain.Page<User> searchStaff(@Param("query") String query,
                                                          @Param("role") String role,
                                                          @Param("status") String status,
                                                          org.springframework.data.domain.Pageable pageable);
}
