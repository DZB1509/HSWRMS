package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.TreatmentRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TreatmentRoomRepository extends JpaRepository<TreatmentRoom, Integer> {
    Optional<TreatmentRoom> findByRoomName(String roomName);
}
