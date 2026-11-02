package com.heavenstay.hswrms.m4fnb.repository;

import com.heavenstay.hswrms.m4fnb.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Integer> {

    List<MenuItem> findByAvailabilityStatus(String availabilityStatus);

    List<MenuItem> findByAvailabilityStatusOrderByItemNameAsc(String availabilityStatus);

    List<MenuItem> findAllByOrderByItemNameAsc();

    Optional<MenuItem> findByItemName(String itemName);

    boolean existsByItemNameIgnoreCase(String itemName);

    @Query("SELECT m FROM MenuItem m WHERE (:category IS NULL OR m.category = :category) AND (:availabilityStatus IS NULL OR m.availabilityStatus = :availabilityStatus)")
    List<MenuItem> findByCategoryAndAvailabilityStatus(@Param("category") String category,
            @Param("availabilityStatus") String availabilityStatus);

    @Query("SELECT m FROM MenuItem m WHERE m.availabilityStatus = 'AVAILABLE'")
    List<MenuItem> findAllAvailable();
}
