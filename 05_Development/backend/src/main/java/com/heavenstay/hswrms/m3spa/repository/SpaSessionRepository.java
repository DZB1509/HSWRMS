package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Repository
public interface SpaSessionRepository extends JpaRepository<SpaSession, Long> {

    @Query("SELECT COUNT(s) > 0 FROM SpaSession s " +
           "WHERE s.sessionStatus IN ('SCHEDULED', 'RESCHEDULING') " +
           "AND ((:therapistId IS NOT NULL AND s.therapist.therapistId = :therapistId) " +
           "     OR (:roomId IS NOT NULL AND s.treatmentRoom.roomId = :roomId)) " +
           "AND s.scheduledStartAt < :endAt AND s.scheduledEndAt > :startAt " +
           "AND (:excludeSessionId IS NULL OR s.spaSessionId <> :excludeSessionId)")
    boolean hasOverlappingSession(
            @Param("therapistId") Integer therapistId,
            @Param("roomId") Integer roomId,
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt,
            @Param("excludeSessionId") Long excludeSessionId
    );

    List<SpaSession> findByRetreatBookingIdOrderByScheduledStartAtAsc(Integer retreatBookingId);

    List<SpaSession> findByRetreatBookingIdInOrderByScheduledStartAtAsc(Collection<Integer> retreatBookingIds);

    List<SpaSession> findByTherapist_TherapistIdAndScheduledStartAtBetweenOrderByScheduledStartAtAsc(
            Integer therapistId, LocalDateTime start, LocalDateTime end
    );

    List<SpaSession> findByTherapist_TherapistIdOrderByScheduledStartAtAsc(Integer therapistId);

    @Query("SELECT s FROM SpaSession s " +
           "WHERE s.sessionStatus = :sessionStatus " +
           "AND s.confirmationStatus = :confirmationStatus " +
           "AND s.scheduledStartAt <= :deadline")
    List<SpaSession> findPendingSessionsPastDeadline(
            @Param("sessionStatus") SpaSessionStatus sessionStatus,
            @Param("confirmationStatus") SpaConfirmationStatus confirmationStatus,
            @Param("deadline") LocalDateTime deadline
    );
}
