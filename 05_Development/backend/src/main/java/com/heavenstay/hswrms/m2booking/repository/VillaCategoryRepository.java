package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VillaCategoryRepository extends JpaRepository<VillaCategory, Integer> {

    List<VillaCategory> findByCategoryStatus(String categoryStatus);

    /**
     * Row lock used to serialize "check availability then insert/confirm" per villa category,
     * which is what prevents overbooking under concurrent requests (SQL Server UPDLOCK).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT vc FROM VillaCategory vc WHERE vc.villaCategoryId = :id")
    Optional<VillaCategory> findByIdForUpdate(@Param("id") Integer id);
}
