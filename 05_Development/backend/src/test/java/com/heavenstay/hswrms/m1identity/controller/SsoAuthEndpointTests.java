package com.heavenstay.hswrms.m1identity.controller;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.dto.SsoRegistrationPrefillResponse;
import com.heavenstay.hswrms.m1identity.service.AuthService;
import com.heavenstay.hswrms.m1identity.sso.SsoService;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * HTTP/security/error-mapping contract for the Google SSO endpoints through the
 * real MVC dispatch, real SecurityConfig (SSO chain is permitAll; the ticket is
 * the credential) and real GlobalExceptionHandler. Services are mocked, so this
 * proves the wire contract only — ticket semantics are covered by
 * SsoTicketServiceTest/SsoServiceTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
class SsoAuthEndpointTests {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private SsoService ssoService;

    @MockBean
    private AuthService authService;

    @Test
    @DisplayName("POST /api/v1/auth/sso/exchange is public and returns the standard login envelope")
    void exchange_isPublic_andReturnsLoginEnvelope() throws Exception {
        when(ssoService.exchangeLoginTicket("valid-ticket")).thenReturn(new LoginResponse(
                "signed.jwt.token", "Bearer", 86400000L,
                205, "jane@example.com", "Jane Doe", List.of("Customer"), "ACTIVE"));

        mockMvc.perform(post("/api/v1/auth/sso/tickets/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ticket\":\"valid-ticket\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("signed.jwt.token"))
                .andExpect(jsonPath("$.data.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.data.userId").value(205))
                .andExpect(jsonPath("$.data.roles[0]").value("Customer"))
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"))
                // No sensitive material in the payload
                .andExpect(jsonPath("$.data.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.data.otp").doesNotExist());
    }

    @Test
    @DisplayName("An invalid, reused, or expired ticket maps to a controlled 400 with a stable SSO code")
    void exchange_invalidTicket_returnsControlled400() throws Exception {
        when(ssoService.exchangeLoginTicket("bad-ticket"))
                .thenThrow(new BusinessRuleException("SSO_TICKET_INVALID", "Ticket is invalid or already used."));

        mockMvc.perform(post("/api/v1/auth/sso/tickets/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ticket\":\"bad-ticket\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.code").value("SSO_TICKET_INVALID"))
                .andExpect(jsonPath("$.path").value("/api/v1/auth/sso/tickets/exchange"));
    }

    @Test
    @DisplayName("POST /api/v1/auth/sso/resolve returns registration prefill without any token or account payload")
    void resolve_returnsRegistrationPrefill() throws Exception {
        when(ssoService.resolveRegistrationTicket("reg-ticket"))
                .thenReturn(new SsoRegistrationPrefillResponse("GOOGLE", "jane@example.com", "Jane Doe"));

        mockMvc.perform(post("/api/v1/auth/sso/tickets/resolve")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ticket\":\"reg-ticket\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.provider").value("GOOGLE"))
                .andExpect(jsonPath("$.data.email").value("jane@example.com"))
                .andExpect(jsonPath("$.data.fullName").value("Jane Doe"))
                .andExpect(jsonPath("$.data.token").doesNotExist())
                .andExpect(jsonPath("$.data.subject").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/v1/auth/register/sso is public and returns the standard login envelope on success")
    void registerSso_isPublic_andReturnsLoginEnvelope() throws Exception {
        when(authService.registerWithSso(any())).thenReturn(new LoginResponse(
                "signed.jwt.token", "Bearer", 86400000L,
                410, "jane@example.com", "Jane Doe", List.of("Customer"), "ACTIVE"));

        mockMvc.perform(post("/api/v1/auth/register/sso")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ssoTicket\":\"reg-ticket\",\"fullName\":\"Jane Doe\",\"consent\":true}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").value("signed.jwt.token"))
                .andExpect(jsonPath("$.data.userId").value(410))
                .andExpect(jsonPath("$.data.roles[0]").value("Customer"))
                .andExpect(jsonPath("$.data.accountStatus").value("ACTIVE"));
    }

    @Test
    @DisplayName("SSO registration still requires explicit ToS consent (validation error, service never invoked)")
    void registerSso_missingConsent_returnsValidation400() throws Exception {
        mockMvc.perform(post("/api/v1/auth/register/sso")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ssoTicket\":\"reg-ticket\",\"fullName\":\"Jane Doe\",\"consent\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));

        verify(authService, never()).registerWithSso(any());
    }

    @Test
    @DisplayName("GET /api/v1/auth/sso/google without configured credentials degrades to a controlled redirect (no broken Google URL)")
    void authorizeStart_withoutCredentials_redirectsToControlledState() throws Exception {
        // Test environment has no GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET, so the
        // registration lookup misses and the availability guard redirects the SPA.
        mockMvc.perform(get("/api/v1/auth/sso/google"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost:5173/auth/sso/callback?error=SSO_NOT_CONFIGURED"));
    }

    @Test
    @DisplayName("GET /api/v1/auth/sso/callback/google is handled by the OAuth2 login filter (never falls through to a 500 static-resource error)")
    void callback_isHandledByOAuth2Filter_never500() throws Exception {
        // Without a valid OAuth2 state/session the filter must reject the
        // handshake via the failure handler — the regression this guards is the
        // misconfigured redirection baseUri that let the callback fall through
        // to the DispatcherServlet as an unmapped static resource (HTTP 500
        // NoResourceFoundException: No static resource api/v1/auth/sso/callback/google).
        mockMvc.perform(get("/api/v1/auth/sso/callback/google").param("code", "test-code").param("state", "test-state"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("http://localhost:5173/auth/sso/callback?error=SSO_AUTH_FAILED"));
    }
}
