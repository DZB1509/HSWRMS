package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.DietaryRequirement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DietaryRequirementRepository extends JpaRepository<DietaryRequirement, Integer> {

    List<DietaryRequirement> findByHealthProfileHealthProfileIdOrderByDisplayOrderAsc(Integer healthProfileId);

    void deleteByHealthProfileHealthProfileId(Integer healthProfileId);
}
