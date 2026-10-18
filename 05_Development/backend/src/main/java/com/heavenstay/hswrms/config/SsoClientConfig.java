package com.heavenstay.hswrms.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.IdTokenClaimNames;
import org.springframework.security.oauth2.core.oidc.OidcScopes;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Google OAuth2/OIDC client registration (FR-M1-05).
 *
 * <p>Credentials come exclusively from the environment ({@code GOOGLE_CLIENT_ID} /
 * {@code GOOGLE_CLIENT_SECRET}) — they are never committed. When they are absent,
 * an empty repository is exposed so the application still starts (and the SSO
 * entry point degrades to a controlled "not configured" redirect instead of a
 * broken redirect to Google). The Google endpoints are the stable, documented
 * first-party URLs; hardcoding them avoids any network call at startup (no
 * discovery round-trip), which keeps offline/dev/test startups deterministic.</p>
 *
 * <p>Registered callback URI (must match exactly in the Google Cloud Console):
 * {@code http://localhost:8080/api/v1/auth/sso/callback/google}</p>
 */
@Configuration
public class SsoClientConfig {

    private static final Logger log = LoggerFactory.getLogger(SsoClientConfig.class);
    private static final String GOOGLE_REGISTRATION_ID = "google";

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${GOOGLE_CLIENT_ID:}") String googleClientId,
            @Value("${GOOGLE_CLIENT_SECRET:}") String googleClientSecret) {

        if (!StringUtils.hasText(googleClientId) || !StringUtils.hasText(googleClientSecret)) {
            log.info("Google SSO is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set). "
                    + "The Google sign-in buttons will show a controlled 'not configured' message.");
            // InMemoryClientRegistrationRepository forbids an empty list, and Spring
            // Security requires the repository bean to exist for oauth2Login(); a
            // null-returning repository keeps the app bootable and makes every SSO
            // lookup miss, which SsoAvailabilityFilter turns into a friendly redirect.
            return registrationId -> null;
        }

        ClientRegistration google = ClientRegistration.withRegistrationId(GOOGLE_REGISTRATION_ID)
                .clientId(googleClientId)
                .clientSecret(googleClientSecret)
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/api/v1/auth/sso/callback/google")
                .scope(OidcScopes.OPENID, OidcScopes.EMAIL, OidcScopes.PROFILE)
                .issuerUri("https://accounts.google.com")
                .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                .tokenUri("https://oauth2.googleapis.com/token")
                .jwkSetUri("https://www.googleapis.com/oauth2/v3/certs")
                .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                .userNameAttributeName(IdTokenClaimNames.SUB)
                .clientName("Google")
                .build();

        log.info("Google SSO client registration configured (scopes: openid, email, profile).");
        return new InMemoryClientRegistrationRepository(List.of(google));
    }
}
