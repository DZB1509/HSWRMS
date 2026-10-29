package com.heavenstay.hswrms.common.api;

import com.heavenstay.hswrms.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class DevAuthController {

    private final JwtTokenProvider tokenProvider;

    public DevAuthController(JwtTokenProvider tokenProvider) {
        this.tokenProvider = tokenProvider;
    }

    @GetMapping("/dev-token")
    public ResponseEntity<ApiResponse<Map<String, String>>> getDevToken(
            @RequestParam(name = "role", defaultValue = "CUSTOMER") String role) {
        String roleUpper = role.toUpperCase();
        if (!roleUpper.startsWith("ROLE_")) {
            roleUpper = "ROLE_" + roleUpper;
        }
        java.util.Set<String> roles = new java.util.LinkedHashSet<>();
        roles.add(roleUpper);
        if ("ALL".equalsIgnoreCase(role) || "SUPER".equalsIgnoreCase(role)) {
            roles.addAll(List.of("ROLE_CUSTOMER", "ROLE_RECEPTIONIST", "ROLE_MANAGER", "ROLE_ADMIN"));
        }
        String token = tokenProvider.generateToken(
                1,
                "eleanor.vance@heavenstay.resort",
                "Eleanor Vance",
                new java.util.ArrayList<>(roles)
        );
        return ResponseEntity.ok(ApiResponse.ok("Dev token generated", Map.of("token", token)));
    }
}
