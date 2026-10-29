package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import com.heavenstay.hswrms.m3spa.entity.enums.TreatmentRoomStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TreatmentRoomRepository extends JpaRepository<TreatmentRoom, Integer> {

    List<TreatmentRoom> findByRoomStatus(TreatmentRoomStatus status);

    Optional<TreatmentRoom> findByRoomName(String roomName);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM TreatmentRoom r WHERE r.roomId = :id")
    Optional<TreatmentRoom> findByIdWithLock(@Param("id") Integer id);

    @Query("SELECT c.treatmentRoom FROM TreatmentRoomCompatibility c " +
           "WHERE c.treatment.treatmentId = :treatmentId " +
           "AND c.treatmentRoom.roomStatus = :status")
    List<TreatmentRoom> findCompatibleRooms(
            @Param("treatmentId") Integer treatmentId,
            @Param("status") TreatmentRoomStatus status
    );
}
