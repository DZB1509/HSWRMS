package com.heavenstay.hswrms.m6admin.repository;

import com.heavenstay.hswrms.m6admin.entity.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RolePermissionRepository extends JpaRepository<RolePermission, RolePermission.Id> {

    List<RolePermission> findByIdRoleId(Integer roleId);
}
