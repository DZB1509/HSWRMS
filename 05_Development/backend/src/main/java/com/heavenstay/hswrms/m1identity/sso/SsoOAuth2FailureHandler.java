package com.heavenstay.hswrms.m1identity.sso;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Handles OAuth handshake failures (user cancelled, state/nonce mismatch, token
 * exchange error, …) by redirecting the SPA back to a controlled error state.
 * The provider error details are logged server-side only.
 */
@Component
public class SsoOAuth2FailureHandler implements AuthenticationFailureHandler {

    private static final Logger log = LoggerFactory.getLogger(SsoOAuth2FailureHandler.class);

    @Value("${app.sso.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        log.warn("SSO authentication failed: {}", exception.getMessage());
        response.sendRedirect(UriComponentsBuilder
                .fromUriString(frontendBaseUrl)
                .path("/auth/sso/callback")
                .queryParam("error", "SSO_AUTH_FAILED")
                .build().encode().toUriString());
    }
}
