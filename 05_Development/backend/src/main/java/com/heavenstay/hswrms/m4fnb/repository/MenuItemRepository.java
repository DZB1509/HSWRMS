package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MenuItemEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItemEntity, Integer> {

    List<MenuItemEntity> findByAvailabilityStatus(String availabilityStatus);

    Optional<MenuItemEntity> findByItemName(String itemName);

    @Query("SELECT m FROM MenuItemEntity m WHERE (:category IS NULL OR m.category = :category) AND (:availabilityStatus IS NULL OR m.availabilityStatus = :availabilityStatus)")
    List<MenuItemEntity> findByCategoryAndAvailabilityStatus(@Param("category") String category, @Param("availabilityStatus") String availabilityStatus);

    @Query("SELECT m FROM MenuItemEntity m WHERE m.availabilityStatus = 'AVAILABLE'")
    List<MenuItemEntity> findAllAvailable();
}
