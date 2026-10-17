package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * External SSO Identity mapping (Google, Facebook, etc.).
 * Mapped to dbo.AuthIdentity.
 */
@Entity
@Table(
    name = "\"AuthIdentity\"",
    schema = "dbo",
    uniqueConstraints = {
        @UniqueConstraint(name = "UQ_AuthIdentity_ProviderSubject", columnNames = {"provider", "provider_subject"})
    }
)
public class AuthIdentity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "auth_identity_id", nullable = false)
    private Integer authIdentityId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "provider", nullable = false, length = 30)
    private String provider; // GOOGLE, FACEBOOK

    @Column(name = "provider_subject", nullable = false, length = 255)
    private String providerSubject;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    public AuthIdentity() {
    }

    public AuthIdentity(User user, String provider, String providerSubject) {
        this.user = user;
        this.provider = provider;
        this.providerSubject = providerSubject;
    }

    @PrePersist
    public void onPrePersist() {
        if (this.createdAt == null) {
            this.createdAt = Instant.now();
        }
    }

    public Integer getAuthIdentityId() {
        return authIdentityId;
    }

    public void setAuthIdentityId(Integer authIdentityId) {
        this.authIdentityId = authIdentityId;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getProviderSubject() {
        return providerSubject;
    }

    public void setProviderSubject(String providerSubject) {
        this.providerSubject = providerSubject;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AuthIdentity that = (AuthIdentity) o;
        return Objects.equals(authIdentityId, that.authIdentityId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(authIdentityId);
    }
}
