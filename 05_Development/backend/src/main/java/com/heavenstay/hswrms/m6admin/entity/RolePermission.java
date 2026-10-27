package com.heavenstay.hswrms.m6admin.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;

import java.io.Serializable;
import java.util.Objects;

@Entity
@Table(name = "\"RolePermission\"", schema = "dbo")
public class RolePermission {

    @Embeddable
    public static class Id implements Serializable {
        @Column(name = "role_id")
        private Integer roleId;
        @Column(name = "permission_id")
        private Integer permissionId;

        protected Id() {
        }

        public Id(Integer roleId, Integer permissionId) {
            this.roleId = roleId;
            this.permissionId = permissionId;
        }

        public Integer getRoleId() { return roleId; }
        public Integer getPermissionId() { return permissionId; }

        @Override
        public boolean equals(Object o) {
            return o instanceof Id other
                    && Objects.equals(roleId, other.roleId)
                    && Objects.equals(permissionId, other.permissionId);
        }

        @Override
        public int hashCode() {
            return Objects.hash(roleId, permissionId);
        }
    }

    @EmbeddedId
    private Id id;

    protected RolePermission() {
    }

    public RolePermission(Integer roleId, Integer permissionId) {
        this.id = new Id(roleId, permissionId);
    }

    public Id getId() { return id; }
}
