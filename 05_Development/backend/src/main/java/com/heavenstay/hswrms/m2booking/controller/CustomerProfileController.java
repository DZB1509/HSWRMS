package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m2booking.service.CustomerIdentityPort;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/customer/profile")
public class CustomerProfileController {

    private final CustomerIdentityPort customerIdentityPort;
    private final JdbcTemplate jdbcTemplate;

    public CustomerProfileController(CustomerIdentityPort customerIdentityPort, JdbcTemplate jdbcTemplate) {
        this.customerIdentityPort = customerIdentityPort;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<CustomerIdentityPort.CustomerFullDetails>> getProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId) {
        int profileId = resolveProfileId(userDetails, customerId);
        CustomerIdentityPort.CustomerFullDetails details = customerIdentityPort.findFullDetails(profileId)
                .orElse(null);
        return ResponseEntity.ok(ApiResponse.ok("Customer profile retrieved successfully", details));
    }

    @PutMapping
    public ResponseEntity<ApiResponse<CustomerIdentityPort.CustomerFullDetails>> updateProfile(
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) Integer customerId) {
        int profileId = resolveProfileId(userDetails, customerId);

        String fullName = (String) body.get("fullName");
        String phone = (String) body.get("phone");
        String address = (String) body.get("address");
        String dateOfBirthStr = (String) body.get("dateOfBirth");
        String emergencyName = (String) body.get("emergencyName");
        String emergencyPhone = (String) body.get("emergencyPhone");
        String emergencyRelationship = (String) body.get("emergencyRelationship");
        String preferredLanguage = (String) body.get("preferredLanguage");

        // Update User
        Integer userId = jdbcTemplate.queryForObject(
                "SELECT user_id FROM dbo.CustomerProfile WHERE customer_profile_id = ?", Integer.class, profileId);
        if (userId != null) {
            if (fullName != null && !fullName.trim().isEmpty()) {
                jdbcTemplate.update("UPDATE dbo.[User] SET full_name = ? WHERE user_id = ?", fullName.trim(), userId);
            }
            if (phone != null && !phone.trim().isEmpty()) {
                jdbcTemplate.update("UPDATE dbo.[User] SET phone_number = ? WHERE user_id = ?", phone.trim(), userId);
            }
        }

        // Update CustomerProfile
        LocalDate dob = null;
        if (dateOfBirthStr != null && !dateOfBirthStr.trim().isEmpty()) {
            try {
                dob = LocalDate.parse(dateOfBirthStr.trim());
            } catch (Exception ignored) {}
        }

        jdbcTemplate.update(
                "UPDATE dbo.CustomerProfile SET " +
                        "residential_address = COALESCE(?, residential_address), " +
                        "date_of_birth = COALESCE(?, date_of_birth), " +
                        "emergency_contact_name = COALESCE(?, emergency_contact_name), " +
                        "emergency_contact_phone = COALESCE(?, emergency_contact_phone), " +
                        "emergency_contact_relationship = COALESCE(?, emergency_contact_relationship), " +
                        "preferred_language = COALESCE(?, preferred_language), " +
                        "updated_at = SYSUTCDATETIME() " +
                        "WHERE customer_profile_id = ?",
                address, dob, emergencyName, emergencyPhone, emergencyRelationship, preferredLanguage, profileId
        );

        CustomerIdentityPort.CustomerFullDetails updated = customerIdentityPort.findFullDetails(profileId).orElse(null);
        return ResponseEntity.ok(ApiResponse.ok("Customer profile updated successfully in SQL Server", updated));
    }

    private int resolveProfileId(CustomUserDetails userDetails, Integer customerId) {
        if (customerId != null && customerId > 0) return customerId;
        if (userDetails != null && userDetails.getUserId() != null) {
            return customerIdentityPort.findProfileIdByUserId(userDetails.getUserId()).orElse(1);
        }
        return 1;
    }
}
