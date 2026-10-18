package com.heavenstay.hswrms.m6admin.repository;

import com.heavenstay.hswrms.m6admin.entity.AuditLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLogEntity, Long> {
}
