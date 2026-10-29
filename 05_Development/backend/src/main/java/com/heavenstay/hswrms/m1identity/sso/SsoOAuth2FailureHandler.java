package com.heavenstay.hswrms.m1identity.sso;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
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
    private static final int MAX_LOGGED_DESCRIPTION_LENGTH = 500;

    @Value("${app.sso.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationFailure(HttpServletRequest request, HttpServletResponse response,
                                        AuthenticationException exception) throws IOException {
        // For OAuth2 failures (token exchange, userinfo fetch) the exception carries
        // the provider's error code + description — for Facebook these include the
        // Graph API error code/message (e.g. an expired/invalid token on /me).
        // Neither contains the client secret, access token, or user profile data.
        if (exception instanceof OAuth2AuthenticationException oauth2Exception) {
            OAuth2Error error = oauth2Exception.getError();
            log.warn("SSO authentication failed: providerError={}, description={}",
                    error != null ? error.getErrorCode() : "n/a",
                    truncate(error != null ? error.getDescription() : exception.getMessage()));
        } else {
            log.warn("SSO authentication failed: {}", exception.getMessage());
        }
        response.sendRedirect(UriComponentsBuilder
                .fromUriString(frontendBaseUrl)
                .path("/auth/sso/callback")
                .queryParam("error", "SSO_AUTH_FAILED")
                .build().encode().toUriString());
    }

    /** Caps provider-supplied descriptions so a verbose error body cannot flood the log. */
    private static String truncate(String value) {
        if (value == null || value.length() <= MAX_LOGGED_DESCRIPTION_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_LOGGED_DESCRIPTION_LENGTH) + "...(truncated)";
    }
}
