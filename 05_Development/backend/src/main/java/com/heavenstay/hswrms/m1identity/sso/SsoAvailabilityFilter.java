package com.heavenstay.hswrms.m1identity.sso;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

/**
 * Guard for the OAuth authorization start endpoint: when Google credentials have
 * not been configured (no client registration available), redirect the SPA to a
 * controlled "not configured" state instead of sending the user to Google with a
 * broken authorization URL. Registered only inside the dedicated SSO chain.
 */
public class SsoAvailabilityFilter extends OncePerRequestFilter {

    private static final String AUTHORIZE_PREFIX = "/api/v1/auth/sso/";
    private static final String CALLBACK_PREFIX = "/api/v1/auth/sso/callback/";
    private static final String GOOGLE_REGISTRATION_ID = "google";

    private final ClientRegistrationRepository clientRegistrationRepository;
    private final String frontendBaseUrl;

    public SsoAvailabilityFilter(ClientRegistrationRepository clientRegistrationRepository,
                                 String frontendBaseUrl) {
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.frontendBaseUrl = frontendBaseUrl;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        boolean isAuthorizeStart = "GET".equalsIgnoreCase(request.getMethod())
                && path.startsWith(AUTHORIZE_PREFIX) && !path.startsWith(CALLBACK_PREFIX);
        if (isAuthorizeStart && clientRegistrationRepository.findByRegistrationId(GOOGLE_REGISTRATION_ID) == null) {
            response.sendRedirect(UriComponentsBuilder
                    .fromUriString(frontendBaseUrl)
                    .path("/auth/sso/callback")
                    .queryParam("error", "SSO_NOT_CONFIGURED")
                    .build().encode().toUriString());
            return;
        }
        filterChain.doFilter(request, response);
    }
}
