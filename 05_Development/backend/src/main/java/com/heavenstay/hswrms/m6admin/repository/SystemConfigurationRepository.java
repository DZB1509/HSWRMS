package com.heavenstay.hswrms.m6admin.repository;

import com.heavenstay.hswrms.m6admin.entity.SystemConfiguration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SystemConfigurationRepository extends JpaRepository<SystemConfiguration, Integer> {

    Optional<SystemConfiguration> findByConfigurationKey(String configurationKey);

    List<SystemConfiguration> findByConfigurationTypeOrderByConfigurationKeyAsc(String configurationType);
}
