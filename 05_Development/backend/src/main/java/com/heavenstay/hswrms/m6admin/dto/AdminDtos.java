package com.heavenstay.hswrms.m6admin.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Map;

/** Request/response DTOs for Module 6 (never expose entities or password hashes). */
public final class AdminDtos {

    private AdminDtos() {
    }

    public record PageView<T>(List<T> items, int page, int size, long totalElements, int totalPages) {
    }

    // ---- Staff (FR-M6-01) ----
    public record StaffView(Integer userId, String fullName, String email, String phoneNumber, String role,
                            String status, Instant lastLoginAt, Instant createdAt) {
    }

    public record StaffCreateRequest(
            @NotBlank(message = "The full name field is required.") @Size(max = 150, message = "Exceed max length.") String fullName,
            @NotBlank(message = "The email field is required.") @Email(message = "Invalid email format.") @Size(max = 255, message = "Exceed max length.") String email,
            @Size(max = 30, message = "Exceed max length.") String phoneNumber,
            @NotBlank(message = "The role field is required.") String role) {
    }

    public record StaffUpdateRequest(
            @NotBlank(message = "The full name field is required.") @Size(max = 150, message = "Exceed max length.") String fullName,
            @NotBlank(message = "The email field is required.") @Email(message = "Invalid email format.") @Size(max = 255, message = "Exceed max length.") String email,
            @Size(max = 30, message = "Exceed max length.") String phoneNumber,
            @NotBlank(message = "The role field is required.") String role) {
    }

    public record StaffStatusRequest(@NotBlank(message = "The status field is required.") String status) {
    }

    public record StaffCreatedView(StaffView staff, String temporaryPassword) {
    }

    public record RoleView(Integer roleId, String roleName, String description) {
    }

    // ---- Business parameters (FR-M6-03) ----
    public record ParameterView(String key, String value, String valueType, BigDecimal minValue, BigDecimal maxValue,
                                String unit, String description, boolean managerEditable, String status,
                                Instant updatedAt) {
    }

    public record ParameterUpdateRequest(@NotBlank(message = "The value field is required.") String value) {
    }

    // ---- Permission matrix (FR-M6-04) ----
    public record MatrixRow(Integer permissionId, String module, String action, boolean delegable, boolean adminOnly,
                            Map<String, Boolean> grants, List<String> lockedRoles) {
    }

    public record MatrixView(List<RoleView> roles, List<MatrixRow> rows) {
    }

    public record MatrixChange(@NotBlank String role, @NotBlank String module, @NotBlank String action,
                               boolean granted) {
    }

    public record MatrixChangeRequest(@NotEmpty @Valid List<@Valid MatrixChange> changes) {
    }

    public record MatrixDiffEntry(String role, String module, String action, boolean from, boolean to) {
    }

    // ---- Delegation (FR-M6-05) ----
    public record DelegationCreateRequest(@NotNull Integer managerUserId,
                                          @NotEmpty List<Integer> permissionIds,
                                          @NotNull Instant validFrom,
                                          @NotNull Instant validUntil) {
    }

    public record DelegationView(Integer delegationId, Integer managerUserId, String managerName,
                                 Integer grantedByAdminUserId, Instant validFrom, Instant validUntil, String status,
                                 List<String> permissions, Instant revokedAt) {
    }

    public record DelegablePermissionView(Integer permissionId, String module, String action) {
    }

    // ---- Audit (FR-M6-06) ----
    public record AuditView(Long auditLogId, Instant createdAt, Integer actorUserId, String actorRole, String action,
                            String targetDataType, String targetRefId, String accessStatus, String oldValue,
                            String newValue, Integer delegationId) {
    }

    // ---- Auth / dashboards (FR-M6-07) ----
    public record MeView(Integer userId, String fullName, String email, List<String> roles, List<String> permissions) {
    }

    public record WidgetView(String key, String title, boolean available, Object value, String note) {
    }

    public record DashboardView(String title, List<String> navigation, List<WidgetView> widgets) {
    }
}
