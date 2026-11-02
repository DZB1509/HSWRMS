package com.heavenstay.hswrms.m1identity.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.heavenstay.hswrms.m1identity.dto.VerifyEmailRequest;
import com.heavenstay.hswrms.m1identity.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

/**
 * Contract test for the production exception-mapping path:
 * real MVC dispatch -> real SecurityConfig (POST /api/v1/auth/verify-email is permitAll)
 * -> real GlobalExceptionHandler mapping of ConcurrencyFailureException to HTTP 503 SERVICE_BUSY.
 *
 * Limitation: the service is mocked, so this proves the HTTP mapping contract only.
 * It does not prove that SQL Server lock errors are translated into
 * ConcurrencyFailureException by the persistence layer, nor any real locking behavior.
 */
@SpringBootTest
@AutoConfigureMockMvc
class AuthConcurrencyMappingTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @Test
    @DisplayName("Concurrency failure on verify-email returns 503 SERVICE_BUSY without retryability metadata")
    void verifyEmailConcurrencyFailureMapsTo503ServiceBusy() throws Exception {
        when(authService.verifyEmail(any(VerifyEmailRequest.class)))
                .thenThrow(new PessimisticLockingFailureException("Lock acquisition failed while reading verification code."));

        mockMvc.perform(post("/api/v1/auth/verify-email")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"jane@example.com\",\"otp\":\"123456\"}"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value(503))
                .andExpect(jsonPath("$.code").value("SERVICE_BUSY"))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/verify-email"))
                // Retryability is a client-side interpretation of HTTP 503 only;
                // pin the absence of any wire-level retry hint in the current contract.
                .andExpect(header().doesNotExist("Retry-After"))
                .andExpect(jsonPath("$.retryable").doesNotExist());
    }
}