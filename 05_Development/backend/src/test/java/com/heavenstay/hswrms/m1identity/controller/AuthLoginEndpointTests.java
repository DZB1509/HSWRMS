package com.heavenstay.hswrms.m1identity.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.dto.LoginRequest;
import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.service.AuthService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Endpoint contract tests for POST /api/v1/auth/login through the real MVC dispatch,
 * real SecurityConfig (login must be explicitly permitAll) and real GlobalExceptionHandler.
 *
 * Limitation: AuthService is mocked, so these tests prove the HTTP/security/error-mapping
 * contract only — not real credential verification against SQL Server.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthLoginEndpointTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    private static final String VALID_LOGIN_JSON =
            "{\"email\":\"jane@example.com\",\"password\":\"secret123\"}";

    @Test
    @DisplayName("POST /api/v1/auth/login is public and returns the token envelope without any Authorization header")
    void loginIsPublic_andReturnsTokenEnvelope() throws Exception {
        when(authService.login(any(LoginRequest.class))).thenReturn(new LoginResponse(
                "signed.jwt.token", "Bearer", 86400000L,
                205, "jane@example.com", "Jane Doe", List.of("Customer"), "ACTIVE"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_LOGIN_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("signed.jwt.token"))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.expiresInMs").value(86400000))
                .andExpect(jsonPath("$.data.userId").value(205))
                .andExpect(jsonPath("$.data.email").value("jane@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Jane Doe"))
                .andExpect(jsonPath("$.data.roles[0]").value("Customer"))
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"))
                // Contract #5: no sensitive fields in the payload
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.password").doesNotExist())
                .andExpect(jsonPath("$.data.otp").doesNotExist());
    }

    @Test
    @DisplayName("Bad credentials on the public login endpoint still return 401 UNAUTHORIZED")
    void invalidCredentials_return401Unauthorized() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BadCredentialsException("Invalid email or password."));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_LOGIN_JSON))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.code").value("UNAUTHORIZED"))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/login"));
    }

    @Test
    @DisplayName("Correct password but unverified email returns 400 EMAIL_NOT_VERIFIED")
    void unverifiedEmail_returns400WithEmailNotVerifiedCode() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BusinessRuleException("EMAIL_NOT_VERIFIED", "Email address has not been verified."));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_LOGIN_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("EMAIL_NOT_VERIFIED"));
    }

    @Test
    @DisplayName("Correct password but non-ACTIVE account returns 400 ACCOUNT_NOT_ACTIVE")
    void nonActiveAccount_returns400WithAccountNotActiveCode() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new BusinessRuleException("ACCOUNT_NOT_ACTIVE", "Account is not active."));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_LOGIN_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_ACTIVE"));
    }
}