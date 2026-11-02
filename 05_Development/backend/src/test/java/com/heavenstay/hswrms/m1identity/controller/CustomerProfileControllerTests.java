package com.heavenstay.hswrms.m1identity.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.CustomerProfileResponse;
import com.heavenstay.hswrms.m1identity.dto.UpdateCustomerProfileRequest;
import com.heavenstay.hswrms.m1identity.service.CustomerProfileService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Contract tests for GET/PUT /api/v1/customers/me/profile through the real MVC
 * dispatch, real SecurityConfig and real GlobalExceptionHandler.
 *
 * Limitation: CustomerProfileService is mocked, so these tests prove the
 * HTTP/security/error-mapping contract only — not persistence on SQL Server.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CustomerProfileControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomerProfileService customerProfileService;

    private void authenticateAs(Integer userId) {
        CustomUserDetails principal = new CustomUserDetails(
                userId, "jane@example.com", "", "Jane Doe", true, List.of("Customer"));
        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

    private CustomerProfileResponse sampleResponse() {
        return new CustomerProfileResponse(
                205, "Jane Doe", "jane@example.com", "+1 555 0100",
                LocalDate.of(1990, 5, 20), "28 Serene Avenue", "en",
                "John Doe", "+1 555 0101", "Spouse");
    }

    @Test
    @DisplayName("Unauthenticated GET returns 401 UNAUTHORIZED")
    void getProfileWithoutToken_returns401() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(get("/api/v1/customers/me/profile"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Unauthenticated PUT returns 401 UNAUTHORIZED")
    void updateProfileWithoutToken_returns401() throws Exception {
        SecurityContextHolder.clearContext();

        mockMvc.perform(put("/api/v1/customers/me/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Jane Doe\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"));
    }

    @Test
    @DisplayName("Authenticated GET returns caller profile without sensitive fields")
    void getMyProfile_returnsProfileEnvelope() throws Exception {
        authenticateAs(205);
        when(customerProfileService.getMyProfile(eq(205))).thenReturn(sampleResponse());

        mockMvc.perform(get("/api/v1/customers/me/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(205))
                .andExpect(jsonPath("$.data.fullName").value("Jane Doe"))
                .andExpect(jsonPath("$.data.email").value("jane@example.com"))
                .andExpect(jsonPath("$.data.phoneNumber").value("+1 555 0100"))
                .andExpect(jsonPath("$.data.dateOfBirth").value("1990-05-20"))
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.otp").doesNotExist());
    }

    @Test
    @DisplayName("Authenticated PUT updates fields and returns saved profile")
    void updateMyProfile_returnsUpdatedProfile() throws Exception {
        authenticateAs(205);
        when(customerProfileService.updateMyProfile(eq(205), any(UpdateCustomerProfileRequest.class)))
                .thenReturn(sampleResponse());

        mockMvc.perform(put("/api/v1/customers/me/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Jane Doe\",\"preferredLanguage\":\"en\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.userId").value(205))
                .andExpect(jsonPath("$.data.fullName").value("Jane Doe"));
    }

    @Test
    @DisplayName("Invalid payload returns 400 VALIDATION_ERROR")
    void updateMyProfileWithInvalidLanguage_returns400() throws Exception {
        authenticateAs(205);

        mockMvc.perform(put("/api/v1/customers/me/profile")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"preferredLanguage\":\"xx\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Missing user surfaces as 404 RESOURCE_NOT_FOUND")
    void getMyProfileWhenMissing_returns404() throws Exception {
        authenticateAs(205);
        when(customerProfileService.getMyProfile(eq(205)))
                .thenThrow(new ResourceNotFoundException("User", "userId", "205"));

        mockMvc.perform(get("/api/v1/customers/me/profile"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESOURCE_NOT_FOUND"));
    }
}
