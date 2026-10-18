package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.HealthProfileTherapyPreference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HealthProfileTherapyPreferenceRepository extends JpaRepository<HealthProfileTherapyPreference, Integer> {

    List<HealthProfileTherapyPreference> findByHealthProfileHealthProfileIdOrderByDisplayOrderAsc(Integer healthProfileId);

    void deleteByHealthProfileHealthProfileId(Integer healthProfileId);
}
