package com.heavenstay.hswrms.m6admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "RightDelegationPermission")
public class RightDelegationPermission {

    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "delegation_id")
        private Integer delegationId;
        @Column(name = "permission_id")
        private Integer permissionId;

        protected Id() {
        }

        public Id(Integer delegationId, Integer permissionId) {
            this.delegationId = delegationId;
            this.permissionId = permissionId;
        }

        public Integer getDelegationId() { return delegationId; }
        public Integer getPermissionId() { return permissionId; }

        @Override
        public boolean equals(Object o) {
            return o instanceof Id other
                    && Objects.equals(delegationId, other.delegationId)
                    && Objects.equals(permissionId, other.permissionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(delegationId, permissionId);
        }
    }

    @EmbeddedId
    private Id id;

    protected RightDelegationPermission() {
    }

    public RightDelegationPermission(Integer delegationId, Integer permissionId) {
        this.id = new Id(delegationId, permissionId);
    }

    public Id getId() { return id; }
}
