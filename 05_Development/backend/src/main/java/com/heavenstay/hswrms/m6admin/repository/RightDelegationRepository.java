package com.heavenstay.hswrms.m6admin.repository;

import com.heavenstay.hswrms.m6admin.entity.RightDelegation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface RightDelegationRepository extends JpaRepository<RightDelegation, Integer> {

    List<RightDelegation> findAllByOrderByDelegationIdDesc();

    List<RightDelegation> findByDelegationStatusIn(List<String> statuses);

    List<RightDelegation> findByReceivedByManagerUserIdAndDelegationStatusAndValidFromLessThanEqualAndValidUntilGreaterThanEqualOrderByDelegationIdAsc(
            Integer managerUserId, String status, LocalDateTime from, LocalDateTime until);

    long countByDelegationStatus(String status);
}
