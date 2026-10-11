package com.heavenstay.hswrms.m6admin.repository;

import com.heavenstay.hswrms.m6admin.entity.RightDelegationPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RightDelegationPermissionRepository
        extends JpaRepository<RightDelegationPermission, RightDelegationPermission.Id> {

    List<RightDelegationPermission> findByIdDelegationId(Integer delegationId);
}
