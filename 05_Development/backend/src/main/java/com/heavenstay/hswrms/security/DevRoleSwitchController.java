package com.heavenstay.hswrms.security;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.service.CustomerIdentityPort;
import com.heavenstay.hswrms.security.dto.AuthResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController("devRoleSwitchController")
@RequestMapping("/api/v1/auth")
public class DevRoleSwitchController {

    private record UserRecord(int userId, String fullName, String email, String passwordHash, String accountStatus) {}

    private final JdbcTemplate jdbcTemplate;
    private final JwtTokenProvider jwtTokenProvider;
    private final CustomerIdentityPort customerIdentityPort;

    public DevRoleSwitchController(JdbcTemplate jdbcTemplate,
                                   JwtTokenProvider jwtTokenProvider,
                                   CustomerIdentityPort customerIdentityPort) {
        this.jdbcTemplate = jdbcTemplate;
        this.jwtTokenProvider = jwtTokenProvider;
        this.customerIdentityPort = customerIdentityPort;
    }

    @PostMapping("/switch-role")
    public ResponseEntity<ApiResponse<AuthResponse>> switchRole(@RequestBody Map<String, String> body) {
        String role = body.getOrDefault("role", "customer").trim().toLowerCase();
        String targetEmail;

        switch (role) {
            case "receptionist":
                targetEmail = "receptionist@heavenstay.com";
                break;
            case "manager":
            case "admin":
                targetEmail = "receptionist@heavenstay.com"; // Front-desk authority in M2
                break;
            case "customer":
            default:
                targetEmail = "customer@heavenstay.com";
                break;
        }

        List<UserRecord> users = jdbcTemplate.query(
                "SELECT user_id, full_name, email, password_hash, account_status FROM dbo.[User] WHERE LOWER(email) = ?",
                (rs, i) -> new UserRecord(
                        rs.getInt("user_id"),
                        rs.getString("full_name"),
                        rs.getString("email"),
                        rs.getString("password_hash"),
                        rs.getString("account_status")
                ),
                targetEmail
        );

        if (users.isEmpty()) {
            throw new ResourceNotFoundException("Demo user account for role '" + role + "' (" + targetEmail + ") not found in database");
        }

        UserRecord u = users.get(0);

        return ResponseEntity.ok(ApiResponse.ok("Role switched to " + role + " successfully",
                buildAuthResponse(u.userId(), targetEmail, u.fullName())));
    }

    private AuthResponse buildAuthResponse(Integer userId, String email, String fullName) {
        List<String> roles = jdbcTemplate.queryForList(
                "SELECT r.role_name FROM dbo.UserRole ur JOIN dbo.[Role] r ON ur.role_id = r.role_id WHERE ur.user_id = ?",
                String.class, userId);

        if (roles.isEmpty()) {
            roles = List.of("CUSTOMER");
        }

        String token = jwtTokenProvider.generateToken(userId, email, fullName, roles);
        Integer customerProfileId = customerIdentityPort.findProfileIdByUserId(userId).orElse(null);

        return new AuthResponse(token, userId, customerProfileId, email, fullName, roles);
    }
}

