package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.FoodAllergy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FoodAllergyRepository extends JpaRepository<FoodAllergy, Integer> {

    List<FoodAllergy> findByHealthProfileHealthProfileIdOrderByDisplayOrderAsc(Integer healthProfileId);

    void deleteByHealthProfileHealthProfileId(Integer healthProfileId);
}
