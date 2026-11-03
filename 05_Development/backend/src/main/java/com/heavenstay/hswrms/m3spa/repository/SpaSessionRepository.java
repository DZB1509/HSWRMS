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

    int BUFFER_MINUTES = 15;

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM SpaSession s WHERE s.spaSessionId = :spaSessionId")
    Optional<SpaSession> findByIdWithLock(@Param("spaSessionId") Long spaSessionId);

    /**
     * Checks if therapist or room has an overlapping session adhering to the mandatory 15-minute buffer (BR-SPA-02).
     * Evaluates sessions in SCHEDULED, RESCHEDULING, and COMPLETED statuses.
     * Excludes CANCELLED and NO_SHOW sessions.
     */
    default boolean hasOverlappingSession(
            Integer therapistId,
            Integer roomId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            Long excludeSessionId
    ) {
        return hasOverlappingSession(therapistId, roomId, startAt, endAt, BUFFER_MINUTES, excludeSessionId);
    }

    /**
     * Checks if therapist or room has an overlapping session with a customizable buffer in minutes.
     */
    default boolean hasOverlappingSession(
            Integer therapistId,
            Integer roomId,
            LocalDateTime startAt,
            LocalDateTime endAt,
            int bufferMinutes,
            Long excludeSessionId
    ) {
        LocalDateTime startAtMinusBuffer = startAt != null ? startAt.minusMinutes(bufferMinutes) : null;
        LocalDateTime endAtPlusBuffer = endAt != null ? endAt.plusMinutes(bufferMinutes) : null;
        return hasOverlappingSessionWithBuffer(therapistId, roomId, startAtMinusBuffer, endAtPlusBuffer, excludeSessionId);
    }

    @Query("SELECT COUNT(s) > 0 FROM SpaSession s " +
           "WHERE s.sessionStatus IN ('SCHEDULED', 'RESCHEDULING', 'COMPLETED') " +
           "AND ((:therapistId IS NOT NULL AND s.therapist.therapistId = :therapistId) " +
           "     OR (:roomId IS NOT NULL AND s.treatmentRoom.roomId = :roomId)) " +
           "AND s.scheduledStartAt < :endAtPlusBuffer AND s.scheduledEndAt > :startAtMinusBuffer " +
           "AND (:excludeSessionId IS NULL OR s.spaSessionId <> :excludeSessionId)")
    boolean hasOverlappingSessionWithBuffer(
            @Param("therapistId") Integer therapistId,
            @Param("roomId") Integer roomId,
            @Param("startAtMinusBuffer") LocalDateTime startAtMinusBuffer,
            @Param("endAtPlusBuffer") LocalDateTime endAtPlusBuffer,
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

    @Query("SELECT s FROM SpaSession s " +
           "LEFT JOIN FETCH s.treatment " +
           "LEFT JOIN FETCH s.therapist " +
           "LEFT JOIN FETCH s.treatmentRoom " +
           "WHERE s.sessionStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.SCHEDULED " +
           "AND s.scheduledStartAt >= :startAt AND s.scheduledStartAt <= :endAt " +
           "ORDER BY s.scheduledStartAt ASC")
    List<SpaSession> findScheduledSessionsStartingBetween(@Param("startAt") LocalDateTime startAt,
                                                          @Param("endAt") LocalDateTime endAt);

    @Query("SELECT s FROM SpaSession s " +
           "WHERE s.sessionStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.RESCHEDULING " +
           "AND s.confirmationStatus IN (com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus.DECLINED, " +
           "                               com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus.EXPIRED) " +
           "AND (s.recoveryAttemptedVersion IS NULL OR s.recoveryAttemptedVersion <> s.scheduleVersion) " +
           "ORDER BY s.spaSessionId ASC")
    List<SpaSession> findSessionsAwaitingRecovery();

    @Query("SELECT s FROM SpaSession s " +
           "WHERE s.therapist.therapistId = :therapistId " +
           "AND s.sessionStatus IN (com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.SCHEDULED, com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.RESCHEDULING) " +
           "AND s.scheduledEndAt > :now " +
           "ORDER BY s.scheduledStartAt ASC")
    List<SpaSession> findActiveUpcomingSessionsByTherapist(
            @Param("therapistId") Integer therapistId,
            @Param("now") LocalDateTime now
    );

    @Query("SELECT s FROM SpaSession s " +
           "WHERE s.therapist.therapistStatus IN (com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus.INACTIVE, com.heavenstay.hswrms.m3spa.entity.enums.TherapistStatus.SUSPENDED) " +
           "AND s.sessionStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.SCHEDULED " +
           "AND s.scheduledEndAt > :now " +
           "ORDER BY s.scheduledStartAt ASC")
    List<SpaSession> findActiveUpcomingSessionsWithUnavailableTherapist(@Param("now") LocalDateTime now);
}
