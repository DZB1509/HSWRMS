package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface PhysicalVillaRepository extends JpaRepository<PhysicalVilla, Integer> {

    List<PhysicalVilla> findByVillaCategory_VillaCategoryId(Integer categoryId);

    List<PhysicalVilla> findByVillaCategory_VillaCategoryIdAndVillaStatus(Integer categoryId, String villaStatus);

    List<PhysicalVilla> findByVillaStatus(String villaStatus);

    Optional<PhysicalVilla> findByVillaNumber(String villaNumber);

    long countByVillaCategory_VillaCategoryIdAndVillaStatusNot(Integer categoryId, String status);

    /** Villas that can host guests (excludes INACTIVE and MAINTENANCE — SRS FR-M2-04). */
    long countByVillaCategory_VillaCategoryIdAndVillaStatusNotIn(Integer categoryId, Collection<String> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT pv FROM PhysicalVilla pv WHERE pv.villaId = :villaId")
    Optional<PhysicalVilla> findByIdForUpdate(@Param("villaId") Integer villaId);
}
