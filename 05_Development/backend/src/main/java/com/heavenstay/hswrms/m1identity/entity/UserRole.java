package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.Objects;

/**
 * Junction entity mapping users to roles with assignment timestamp.
 * Mapped to dbo.UserRole.
 */
@Entity
@Table(name = "\"UserRole\"", schema = "dbo")
public class UserRole {

    @EmbeddedId
    private UserRoleId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId")
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("roleId")
    @JoinColumn(name = "role_id", nullable = false)
    private Role role;

    @org.hibernate.annotations.ColumnDefault("CURRENT_TIMESTAMP")
    @Column(name = "assigned_at", nullable = false)
    private Instant assignedAt;

    public UserRole() {
    }

    public UserRole(User user, Role role) {
        this.user = user;
        this.role = role;
        this.id = new UserRoleId(user.getUserId(), role.getRoleId());
        this.assignedAt = Instant.now();
    }

    @PrePersist
    public void onPrePersist() {
        if (this.assignedAt == null) {
            this.assignedAt = Instant.now();
        }
    }

    public UserRoleId getId() {
        return id;
    }

    public void setId(UserRoleId id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public Instant getAssignedAt() {
        return assignedAt;
    }

    public void setAssignedAt(Instant assignedAt) {
        this.assignedAt = assignedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserRole userRole = (UserRole) o;
        return Objects.equals(id, userRole.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
