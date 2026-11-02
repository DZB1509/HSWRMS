package com.heavenstay.hswrms.m1identity.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "Role", schema = "dbo")
public class Role {

    public static final String ADMIN = "ADMIN";
    public static final String MANAGER = "MANAGER";
    public static final String RECEPTIONIST = "RECEPTIONIST";
    public static final String THERAPIST = "THERAPIST";
    public static final String FNB_STAFF = "FNB_STAFF";
    public static final String CUSTOMER = "CUSTOMER";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "role_id")
    private Integer roleId;

    @Column(name = "role_name", nullable = false, unique = true, length = 50)
    private String roleName;

    @Column(name = "description", length = 250)
    private String description;

    public Role() {
    }

    public Role(String roleName, String description) {
        this.roleName = roleName;
        this.description = description;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }

    public String getRoleName() {
        return roleName;
    }

    public void setRoleName(String roleName) {
        this.roleName = roleName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isAdminRole() {
        return ADMIN.equalsIgnoreCase(canonicalName()) || "ROLE_ADMIN".equalsIgnoreCase(roleName);
    }

    public boolean isStaffRole() {
        return !isCustomerRole();
    }

    public boolean isCustomerRole() {
        return CUSTOMER.equalsIgnoreCase(canonicalName()) || "CUSTOMER".equalsIgnoreCase(roleName) || "ROLE_CUSTOMER".equalsIgnoreCase(roleName);
    }

    public String canonicalName() {
        return canonical(roleName);
    }

    public static String canonical(String name) {
        if (name == null) return "";
        String n = name.trim().toUpperCase(java.util.Locale.ROOT);
        if (n.startsWith("ROLE_")) {
            n = n.substring(5);
        }
        if (n.replaceAll("[^A-Z]", "").equals("FBSTAFF") || n.replaceAll("[^A-Z]", "").equals("FNBSTAFF")) {
            return FNB_STAFF;
        }
        return n.replace(' ', '_');
    }

    @Override
    public String toString() {
        return "Role{" +
                "roleId=" + roleId +
                ", roleName='" + roleName + '\'' +
                '}';
    }
}
