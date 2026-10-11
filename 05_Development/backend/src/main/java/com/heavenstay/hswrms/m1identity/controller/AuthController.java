package com.heavenstay.hswrms.m1identity.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.dto.AuthDtos.LoginRequest;
import com.heavenstay.hswrms.m1identity.dto.AuthDtos.LoginResponse;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MeView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import com.heavenstay.hswrms.m6admin.service.BusinessParameterService;
import com.heavenstay.hswrms.m6admin.service.PermissionService;
import com.heavenstay.hswrms.security.JwtTokenProvider;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

/**
 * Phase 0: Minimal authentication controller supporting login, failed login tracking / lockout,
 * and current user / permissions query (/me).
 */
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final IdentityAccountService identity;
    private final BusinessParameterService parameters;
    private final PermissionService permissions;
    private final JwtTokenProvider tokenProvider;
    private final AuditLogService audit;

    public AuthController(IdentityAccountService identity, BusinessParameterService parameters,
                          PermissionService permissions, JwtTokenProvider tokenProvider,
                          AuditLogService audit) {
        this.identity = identity;
        this.parameters = parameters;
        this.permissions = permissions;
        this.tokenProvider = tokenProvider;
        this.audit = audit;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        UserAccount user = identity.findByEmail(request.email().trim())
                .orElse(null);

        if (user == null) {
            // Constant-time defense against user enumeration
            audit.record(null, "UNKNOWN", "Sign In Attempt", "User", request.email(),
                    AuditLogService.DENIED, null, "MSG09");
            throw new BadCredentialsException("Invalid credentials or account inactive.");
        }

        if (UserAccount.LOCKED.equals(user.getAccountStatus())) {
            audit.record(user.getUserId(), primaryRole(user), "Sign In While Locked", "User",
                    String.valueOf(user.getUserId()), AuditLogService.DENIED, null, "MSG09");
            throw new BusinessRuleException("MSG09", "Account is locked due to multiple failed sign-in attempts. Please try again later.");
        }

        if (UserAccount.INACTIVE.equals(user.getAccountStatus())) {
            audit.record(user.getUserId(), primaryRole(user), "Sign In While Inactive", "User",
                    String.valueOf(user.getUserId()), AuditLogService.DENIED, null, "MSG09");
            throw new BusinessRuleException("MSG09", "Invalid credentials or account inactive.");
        }

        boolean match = identity.passwordMatches(request.password(), user.getPasswordHash());
        if (!match) {
            int currentFailed = user.getFailedLoginCount() + 1;
            user.setFailedLoginCount(currentFailed);

            int maxAttempts = parameters.getInt(BusinessParameterService.MAX_FAILED_LOGIN_ATTEMPTS, 5);
            if (currentFailed >= maxAttempts) {
                user.setAccountStatus(UserAccount.LOCKED);
                user.setLockedAt(LocalDateTime.now(ZoneOffset.UTC));
                audit.record(user.getUserId(), primaryRole(user), "Account Locked Out", "User",
                        String.valueOf(user.getUserId()), AuditLogService.FAILED,
                        "Attempts: " + currentFailed, UserAccount.LOCKED);
            } else {
                audit.record(user.getUserId(), primaryRole(user), "Sign In Failed Password", "User",
                        String.valueOf(user.getUserId()), AuditLogService.FAILED,
                        null, "Attempt " + currentFailed + "/" + maxAttempts);
            }
            identity.save(user);

            throw new BadCredentialsException("Invalid credentials or account inactive.");
        }

        // Login successful
        user.setFailedLoginCount(0);
        user.setLockedAt(null);
        user.setLastLoginAt(LocalDateTime.now(ZoneOffset.UTC));
        identity.save(user);

        List<String> roleNames = user.getRoles().stream().map(Role::getRoleName).sorted().toList();
        String token = tokenProvider.generateToken(user.getUserId(), user.getEmail(), user.getFullName(), roleNames);

        Set<String> effectivePerms = permissions.effectiveCodes(user.getUserId());
        audit.record(user.getUserId(), primaryRole(user), "Sign In Success", "User",
                String.valueOf(user.getUserId()), AuditLogService.SUCCESS, null, null);

        LoginResponse resp = new LoginResponse(
                token,
                user.getUserId(),
                user.getEmail(),
                user.getFullName(),
                roleNames,
                new ArrayList<>(effectivePerms)
        );

        return ResponseEntity.ok(ApiResponse.ok(resp));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeView>> me() {
        CurrentActor actor = CurrentActor.require();
        UserAccount user = identity.get(actor.userId());

        List<String> roleNames = user.getRoles().stream().map(Role::getRoleName).sorted().toList();
        Set<String> effectivePerms = permissions.effectiveCodes(user.getUserId());

        MeView view = new MeView(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                roleNames,
                new ArrayList<>(effectivePerms)
        );

        return ResponseEntity.ok(ApiResponse.ok(view));
    }

    private static String primaryRole(UserAccount user) {
        return user.getRoles().stream().map(Role::getRoleName).sorted().findFirst().orElse("USER");
    }
}
