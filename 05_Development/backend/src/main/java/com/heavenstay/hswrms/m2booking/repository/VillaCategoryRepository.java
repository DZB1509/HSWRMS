package com.heavenstay.hswrms.m2booking.repository;

import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VillaCategoryRepository extends JpaRepository<VillaCategory, Integer> {
    Optional<VillaCategory> findByCategoryName(String categoryName);
}
