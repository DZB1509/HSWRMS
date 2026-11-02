package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.VillaFunctionalArea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VillaFunctionalAreaRepository extends JpaRepository<VillaFunctionalArea, Integer> {
    Optional<VillaFunctionalArea> findByRoomName(String roomName);
    List<VillaFunctionalArea> findBySpaceGroup(String spaceGroup);
}
