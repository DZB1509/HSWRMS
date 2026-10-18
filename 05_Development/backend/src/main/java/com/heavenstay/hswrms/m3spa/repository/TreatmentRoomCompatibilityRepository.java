package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.TreatmentRoomCompatibility;
import com.heavenstay.hswrms.m3spa.entity.TreatmentRoomCompatibilityId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TreatmentRoomCompatibilityRepository extends JpaRepository<TreatmentRoomCompatibility, TreatmentRoomCompatibilityId> {
    boolean existsByTreatmentRoom_RoomIdAndTreatment_TreatmentId(Integer roomId, Integer treatmentId);
}
