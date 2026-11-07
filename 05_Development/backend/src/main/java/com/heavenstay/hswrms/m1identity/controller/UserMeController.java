package com.heavenstay.hswrms.m1identity.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.dto.ChangePasswordRequest;
import com.heavenstay.hswrms.m1identity.dto.UpdateUserProfileRequest;
import com.heavenstay.hswrms.m1identity.dto.UserProfileResponse;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Universal account settings and profile endpoints for ALL authenticated roles
 * (Customer, Receptionist, Therapist, F&B Staff, Manager, Admin).
 *
 * Current identity is always determined strictly from the trusted
 * SecurityContext.
 */
@RestController
@RequestMapping("/api/v1/users/me")
@PreAuthorize("isAuthenticated()")
public class UserMeController {

    private final IdentityAccountService accountService;
    private final PasswordEncoder passwordEncoder;

    public UserMeController(IdentityAccountService accountService, PasswordEncoder passwordEncoder) {
        this.accountService = accountService;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<UserProfileResponse>> getMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal) {
        if (principal == null || principal.getUserId() == null) {
            throw new BusinessRuleException("UNAUTHORIZED", "Authentication context is required.");
        }
        UserAccount account = accountService.get(principal.getUserId());
        return ResponseEntity.ok(ApiResponse.ok("User profile retrieved successfully.", toResponse(account)));
    }

    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        if (principal == null || principal.getUserId() == null) {
            throw new BusinessRuleException("UNAUTHORIZED", "Authentication context is required.");
        }
        UserAccount account = accountService.get(principal.getUserId());
        account.setFullName(request.getFullName().trim());
        String phone = request.getPhoneNumber();
        account.setPhoneNumber(phone == null || phone.isBlank() ? null : phone.trim());

        UserAccount updated = accountService.save(account);
        return ResponseEntity.ok(ApiResponse.ok("Profile updated successfully.", toResponse(updated)));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails principal,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (principal == null || principal.getUserId() == null) {
            throw new BusinessRuleException("UNAUTHORIZED", "Authentication context is required.");
        }
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BusinessRuleException("PASSWORD_MISMATCH",
                    "New password and confirmation password do not match.");
        }
        if (request.getNewPassword().equals(request.getCurrentPassword())) {
            throw new BusinessRuleException("PASSWORD_UNCHANGED",
                    "New password cannot be the same as the current password.");
        }

        UserAccount account = accountService.get(principal.getUserId());
        if (!passwordEncoder.matches(request.getCurrentPassword(), account.getPasswordHash())) {
            throw new BusinessRuleException("INVALID_PASSWORD", "The current password provided is incorrect.");
        }

        account.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        accountService.save(account);

        return ResponseEntity.ok(ApiResponse.ok("Password updated successfully.", null));
    }

    private UserProfileResponse toResponse(UserAccount account) {
        List<String> roleNames = account.getRoles().stream()
                .map(Role::getRoleName)
                .collect(Collectors.toList());

        return new UserProfileResponse(
                account.getUserId(),
                account.getFullName(),
                account.getEmail(),
                account.getPhoneNumber(),
                account.getAccountStatus(),
                roleNames,
                account.isEmailVerified(),
                account.getCreatedAt());
    }
}
