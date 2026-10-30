package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus;
import com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface SpaSessionRepository extends JpaRepository<SpaSession, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SpaSession s WHERE s.spaSessionId = :spaSessionId")
    Optional<SpaSession> findByIdWithLock(@Param("spaSessionId") Long spaSessionId);

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
           "LEFT JOIN FETCH s.treatment " +
           "LEFT JOIN FETCH s.therapist " +
           "LEFT JOIN FETCH s.treatmentRoom " +
           "WHERE s.sessionStatus = :sessionStatus " +
           "AND s.confirmationStatus = :confirmationStatus " +
           "AND s.scheduledStartAt <= :deadline")
    List<SpaSession> findPendingSessionsPastDeadline(
            @Param("sessionStatus") SpaSessionStatus sessionStatus,
            @Param("confirmationStatus") SpaConfirmationStatus confirmationStatus,
            @Param("deadline") LocalDateTime deadline
    );

    @Query("SELECT s FROM SpaSession s " +
           "LEFT JOIN FETCH s.treatment " +
           "LEFT JOIN FETCH s.therapist " +
           "LEFT JOIN FETCH s.treatmentRoom " +
           "WHERE s.sessionStatus = :sessionStatus " +
           "AND s.confirmationStatus = :confirmationStatus " +
           "AND s.reminderSentAt IS NULL " +
           "AND (s.reminderStatus IS NULL OR s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.PENDING " +
           "     OR s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.RETRYABLE_FAILURE " +
           "     OR (s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED AND s.reminderClaimExpiresAt <= :now)) " +
           "AND s.scheduledStartAt > :windowStart AND s.scheduledStartAt <= :windowEnd " +
           "ORDER BY s.scheduledStartAt ASC")
    List<SpaSession> findSessionsDueForReminder(
            @Param("sessionStatus") SpaSessionStatus sessionStatus,
            @Param("confirmationStatus") SpaConfirmationStatus confirmationStatus,
            @Param("now") LocalDateTime now,
            @Param("windowStart") LocalDateTime windowStart,
            @Param("windowEnd") LocalDateTime windowEnd
    );

    default List<SpaSession> findSessionsDueForReminder(
            SpaSessionStatus sessionStatus,
            SpaConfirmationStatus confirmationStatus,
            LocalDateTime windowStart,
            LocalDateTime windowEnd
    ) {
        return findSessionsDueForReminder(sessionStatus, confirmationStatus, LocalDateTime.now(), windowStart, windowEnd);
    }

    @Modifying
    @Transactional
    @Query("UPDATE SpaSession s SET s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED, " +
           "s.reminderClaimedAt = :claimedAt, " +
           "s.reminderClaimExpiresAt = :expiresAt, " +
           "s.reminderClaimToken = :claimToken " +
           "WHERE s.spaSessionId = :sessionId " +
           "AND s.sessionStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.SCHEDULED " +
           "AND s.confirmationStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus.PENDING " +
           "AND s.reminderSentAt IS NULL " +
           "AND (s.reminderStatus IS NULL OR s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.PENDING " +
           "     OR s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.RETRYABLE_FAILURE " +
           "     OR (s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED AND s.reminderClaimExpiresAt <= :claimedAt))")
    int claimSessionForReminder(
            @Param("sessionId") Long sessionId,
            @Param("claimedAt") LocalDateTime claimedAt,
            @Param("expiresAt") LocalDateTime expiresAt,
            @Param("claimToken") String claimToken
    );

    default int claimSessionForReminder(Long sessionId, LocalDateTime claimedAt, LocalDateTime expiresAt) {
        return claimSessionForReminder(sessionId, claimedAt, expiresAt, java.util.UUID.randomUUID().toString());
    }

    default int claimSessionForReminder(Long sessionId, LocalDateTime claimedAt) {
        return claimSessionForReminder(sessionId, claimedAt, claimedAt.plusMinutes(2), java.util.UUID.randomUUID().toString());
    }

    @Modifying
    @Transactional
    @Query("UPDATE SpaSession s SET s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.SENT, " +
           "s.reminderSentAt = :sentAt, " +
           "s.reminderClaimExpiresAt = NULL, " +
           "s.reminderClaimToken = NULL " +
           "WHERE s.spaSessionId = :sessionId " +
           "AND s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED " +
           "AND s.reminderClaimToken = :claimToken")
    int recordReminderSent(
            @Param("sessionId") Long sessionId,
            @Param("sentAt") LocalDateTime sentAt,
            @Param("claimToken") String claimToken
    );

    @Modifying
    @Transactional
    @Query("UPDATE SpaSession s SET s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.RETRYABLE_FAILURE, " +
           "s.reminderClaimExpiresAt = NULL, " +
           "s.reminderClaimToken = NULL " +
           "WHERE s.spaSessionId = :sessionId " +
           "AND s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED " +
           "AND s.reminderClaimToken = :claimToken")
    int releaseReminderClaim(
            @Param("sessionId") Long sessionId,
            @Param("claimToken") String claimToken
    );

    default Optional<SpaSession> findByIdForUpdate(Long spaSessionId) {
        return findByIdWithLock(spaSessionId);
    }

    @Query("SELECT s FROM SpaSession s " +
           "WHERE s.retreatBookingId = :retreatBookingId " +
           "AND s.sessionStatus NOT IN (com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.CANCELLED, " +
           "                            com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.COMPLETED, " +
           "                            com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.NO_SHOW) " +
           "ORDER BY s.scheduledStartAt ASC")
    List<SpaSession> findUnsettledSessionsForBooking(@Param("retreatBookingId") Integer retreatBookingId);

    default List<SpaSession> findUnsettledSessionsForBooking(Long retreatBookingId) {
        if (retreatBookingId == null || retreatBookingId > Integer.MAX_VALUE) return java.util.Collections.emptyList();
        return findUnsettledSessionsForBooking(retreatBookingId.intValue());
    }

    @Query("SELECT s FROM SpaSession s " +
           "LEFT JOIN FETCH s.therapist " +
           "WHERE s.scheduledStartAt >= :startAt AND s.scheduledStartAt <= :endAt " +
           "ORDER BY s.scheduledStartAt ASC")
    List<SpaSession> findSessionsInDateRange(
            @Param("startAt") LocalDateTime startAt,
            @Param("endAt") LocalDateTime endAt
    );
}
