package com.heavenstay.hswrms.m6admin.repository;

import com.heavenstay.hswrms.m6admin.entity.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Integer> {

    @Query("SELECT p FROM Permission p WHERE p.moduleOrScreen = :moduleOrScreen AND p.actionType = :actionType")
    Optional<Permission> findByModuleOrScreenAndActionType(
            @Param("moduleOrScreen") String moduleOrScreen,
            @Param("actionType") String actionType
    );

    @Query("SELECT p FROM Permission p ORDER BY p.moduleOrScreen ASC, p.actionType ASC")
    List<Permission> findAllByOrderByModuleOrScreenAscActionTypeAsc();
}

