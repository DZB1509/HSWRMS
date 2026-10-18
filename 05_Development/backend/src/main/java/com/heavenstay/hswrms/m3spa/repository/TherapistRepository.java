package com.heavenstay.hswrms.m3spa.repository;

import com.heavenstay.hswrms.m3spa.entity.TherapistEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TherapistRepository extends JpaRepository<TherapistEntity, Long> {

    @Query("SELECT t FROM TherapistEntity t LEFT JOIN FETCH t.user")
    List<TherapistEntity> findAllWithUser();
}
