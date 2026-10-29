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
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Google + Facebook OAuth client registrations (M1 FR-M1-05).
 *
 * <p>Credentials come exclusively from the environment ({@code GOOGLE_CLIENT_ID} /
 * {@code GOOGLE_CLIENT_SECRET}, {@code FACEBOOK_CLIENT_ID} /
 * {@code FACEBOOK_CLIENT_SECRET}) — they are never committed. Providers without
 * credentials are simply omitted from the repository; the application still
 * starts and the SSO entry point degrades to a controlled "not configured"
 * redirect instead of a broken provider redirect. Endpoint URLs are the stable,
 * documented first-party URLs; hardcoding them avoids any network call at
 * startup (no discovery round-trip), which keeps offline/dev/test startups
 * deterministic.</p>
 *
 * <p>Registered callback URIs (must match exactly in each provider console):
 * {@code http://localhost:8080/api/v1/auth/sso/callback/google} and
 * {@code http://localhost:8080/api/v1/auth/sso/callback/facebook}</p>
 */
@Configuration
public class SsoClientConfig {

    private static final Logger log = LoggerFactory.getLogger(SsoClientConfig.class);
    private static final String GOOGLE_REGISTRATION_ID = "google";
    private static final String FACEBOOK_REGISTRATION_ID = "facebook";

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(
            @Value("${GOOGLE_CLIENT_ID:}") String googleClientId,
            @Value("${GOOGLE_CLIENT_SECRET:}") String googleClientSecret,
            @Value("${FACEBOOK_CLIENT_ID:}") String facebookClientId,
            @Value("${FACEBOOK_CLIENT_SECRET:}") String facebookClientSecret) {

        List<ClientRegistration> registrations = new java.util.ArrayList<>();

        if (!StringUtils.hasText(googleClientId) || !StringUtils.hasText(googleClientSecret)) {
            log.info("Google SSO is not configured (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set). "
                    + "The Google sign-in button will show a controlled 'not configured' message.");
            // InMemoryClientRegistrationRepository forbids an empty list, and Spring
            // Security requires the repository bean to exist for oauth2Login(); a
            // null-returning repository keeps the app bootable and makes every SSO
            // lookup miss, which SsoAvailabilityFilter turns into a friendly redirect.
        } else {
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
            registrations.add(google);
            log.info("Google SSO client registration configured (scopes: openid, email, profile).");
        }

        if (!StringUtils.hasText(facebookClientId) || !StringUtils.hasText(facebookClientSecret)) {
            log.info("Facebook SSO is not configured (FACEBOOK_CLIENT_ID / FACEBOOK_CLIENT_SECRET not set). "
                    + "The Facebook sign-in button will show a controlled 'not configured' message.");
        } else {
            // Facebook Login is plain OAuth2 (no OIDC id_token): identity comes
            // from the Graph API /me endpoint. Requesting `email` scope plus the
            // `fields=id,name,email` user-info mapping keeps the downstream SSO
            // flow provider-agnostic (provider + subject + email + name).
            ClientRegistration facebook = ClientRegistration.withRegistrationId(FACEBOOK_REGISTRATION_ID)
                    .clientId(facebookClientId)
                    .clientSecret(facebookClientSecret)
                    .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                    .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                    .redirectUri("{baseUrl}/api/v1/auth/sso/callback/facebook")
                    .scope("email", "public_profile")
                    .authorizationUri("https://www.facebook.com/v26.0/dialog/oauth")
                    .tokenUri("https://graph.facebook.com/v26.0/oauth/access_token")
                    .userInfoUri("https://graph.facebook.com/v26.0/me?fields=id,name,email")
                    .userNameAttributeName("id")
                    .clientName("Facebook")
                    .build();
            registrations.add(facebook);
            log.info("Facebook SSO client registration configured (scopes: email, public_profile).");
        }

        if (registrations.isEmpty()) {
            return registrationId -> null;
        }
        return new InMemoryClientRegistrationRepository(registrations);
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
