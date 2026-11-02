package com.heavenstay.hswrms.m1identity.repository;

import com.heavenstay.hswrms.m1identity.entity.AuthIdentity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AuthIdentityRepository extends JpaRepository<AuthIdentity, Integer> {

    Optional<AuthIdentity> findByProviderAndProviderSubject(String provider, String providerSubject);

    List<AuthIdentity> findByUserUserId(Integer userId);

    boolean existsByProviderAndProviderSubject(String provider, String providerSubject);
}
