package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.SpaScheduleHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Spring Data JPA repository for SpaScheduleHistory (BR-M3-14).
 */
@Repository
public interface SpaScheduleHistoryRepository extends JpaRepository<SpaScheduleHistory, Long> {

    List<SpaScheduleHistory> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    List<SpaScheduleHistory> findBySessionIdOrderByHistoryIdAsc(Long sessionId);

    boolean existsBySessionIdAndChangeTypeAndNewStatusAndNewStartAt(
            Long sessionId, String changeType, String newStatus, LocalDateTime newStartAt
    );
}
