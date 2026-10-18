package com.heavenstay.hswrms.m1identity.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m1identity.dto.LoginRequest;
import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.dto.RegisterRequest;
import com.heavenstay.hswrms.m1identity.dto.RegisterResponse;
import com.heavenstay.hswrms.m1identity.dto.SsoRegisterRequest;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailRequest;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailResponse;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import com.heavenstay.hswrms.m1identity.service.AuthService;
import com.heavenstay.hswrms.m1identity.service.IdentityAccountService;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MeView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.PermissionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final IdentityAccountService identity;
    private final PermissionService permissions;

    public AuthController(AuthService authService,
                          @Autowired(required = false) IdentityAccountService identity,
                          @Autowired(required = false) PermissionService permissions) {
        this.authService = authService;
        this.identity = identity;
        this.permissions = permissions;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<RegisterResponse>> registerGuest(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.registerGuest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Guest registered successfully.", response));
    }

    @PostMapping("/register/sso")
    public ResponseEntity<ApiResponse<LoginResponse>> registerWithSso(
            @Valid @RequestBody SsoRegisterRequest request) {
        LoginResponse response = authService.registerWithSso(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Registration successful.", response));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<VerifyEmailResponse>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        VerifyEmailResponse response = authService.verifyEmail(request);
        return ResponseEntity.ok(ApiResponse.ok("Email verified successfully.", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.ok("Login successful.", response));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<MeView>> me() {
        if (identity == null || permissions == null) {
            return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED).build();
        }
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
}
