package com.heavenstay.hswrms.m1identity.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class AuthPasswordResetControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Test
    @DisplayName("Forgot password endpoint is public and returns generic success")
    void forgotPassword_isPublic_returns200() throws Exception {
        doNothing().when(authService).requestPasswordReset(anyString());

        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Forgot password invalid email returns 400 VALIDATION_ERROR")
    void forgotPassword_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"not-an-email\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @DisplayName("Reset password with valid OTP returns 200")
    void resetPassword_valid_returns200() throws Exception {
        doNothing().when(authService).resetPassword(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\",\"otp\":\"123456\",\"newPassword\":\"newpassword1\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Reset password with invalid OTP returns 400 OTP_INVALID")
    void resetPassword_invalidOtp_returns400() throws Exception {
        doThrow(new BusinessRuleException("OTP_INVALID", "Invalid reset code."))
                .when(authService).resetPassword(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\",\"otp\":\"000000\",\"newPassword\":\"newpassword1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OTP_INVALID"));
    }

    @Test
    @DisplayName("Reset password with expired OTP returns 400 OTP_EXPIRED")
    void resetPassword_expiredOtp_returns400() throws Exception {
        doThrow(new BusinessRuleException("OTP_EXPIRED", "This reset code has expired."))
                .when(authService).resetPassword(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\",\"otp\":\"123456\",\"newPassword\":\"newpassword1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OTP_EXPIRED"));
    }

    @Test
    @DisplayName("Reset password with used OTP returns 400 OTP_CONSUMED")
    void resetPassword_usedOtp_returns400() throws Exception {
        doThrow(new BusinessRuleException("OTP_CONSUMED", "This reset code has already been used."))
                .when(authService).resetPassword(anyString(), anyString(), anyString());

        mockMvc.perform(post("/api/v1/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\",\"otp\":\"123456\",\"newPassword\":\"newpassword1\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("OTP_CONSUMED"));
    }
}
