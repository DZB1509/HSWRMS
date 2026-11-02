package com.heavenstay.hswrms.m1identity.sso;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;

/**
 * Contract tests for the temporary SSO userinfo diagnostics wrapper:
 * <ul>
 *   <li>delegation pass-through (behavior identical to Spring's default user
 *       services — a missing {@code email} field must never fail the load);</li>
 *   <li>routing by request type (OIDC → OidcUserService, plain OAuth2 →
 *       DefaultOAuth2UserService);</li>
 *   <li>the safety invariant: only scope names and attribute KEY NAMES are
 *       logged — never attribute values (email address, name, id) or the
 *       access token.</li>
 * </ul>
 */
class SsoUserInfoDiagnosticsServiceTest {

    private static final String SECRET_EMAIL = "secret-address@example.com";
    private static final String SECRET_NAME = "Secret Person Name";
    private static final String SECRET_SUBJECT_ID = "999999888777666";
    private static final String SECRET_ACCESS_TOKEN = "FB-SECRET-ACCESS-TOKEN-VALUE";

    private ListAppender<ILoggingEvent> logAppender;
    private Logger diagnosticsLogger;

    @SuppressWarnings("unchecked")
    private static OAuth2UserService<OidcUserRequest, OidcUser> unusedOidcDelegate() {
        return mock(OAuth2UserService.class);
    }

    @BeforeEach
    void captureLogs() {
        diagnosticsLogger = (Logger) LoggerFactory.getLogger(SsoUserInfoDiagnosticsService.class);
        logAppender = new ListAppender<>();
        logAppender.start();
        diagnosticsLogger.addAppender(logAppender);
        diagnosticsLogger.setLevel(Level.INFO);
    }

    @AfterEach
    void stopCapture() {
        diagnosticsLogger.detachAppender(logAppender);
        logAppender.stop();
    }

    private static ClientRegistration.Builder facebookRegistration() {
        return ClientRegistration.withRegistrationId("facebook")
                .clientId("app-id")
                .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_POST)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("http://localhost:8080/api/v1/auth/sso/callback/facebook")
                .scope("email", "public_profile")
                .authorizationUri("https://www.facebook.com/v26.0/dialog/oauth")
                .tokenUri("https://graph.facebook.com/v26.0/oauth/access_token")
                .userInfoUri("https://graph.facebook.com/v26.0/me?fields=id,name,email")
                .userNameAttributeName("id")
                .clientName("Facebook");
    }

    @Test
    @DisplayName("Routing: OIDC requests use the OIDC delegate, plain OAuth2 requests use the OAuth2 delegate")
    void routing_byRequestType() {
        OidcUser oidcUser = mock(OidcUser.class);
        OAuth2User plainUser = facebookUser(Map.of("id", SECRET_SUBJECT_ID));
        OAuth2UserService<OidcUserRequest, OidcUser> oidcDelegate = request -> oidcUser;
        OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2Delegate = request -> plainUser;
        SsoUserInfoDiagnosticsService service =
                new SsoUserInfoDiagnosticsService(oidcDelegate, oauth2Delegate);

        Instant now = Instant.now();
        OidcUserRequest oidcRequest = new OidcUserRequest(
                ClientRegistration.withRegistrationId("google")
                        .clientId("gid")
                        .clientAuthenticationMethod(ClientAuthenticationMethod.CLIENT_SECRET_BASIC)
                        .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                        .redirectUri("http://localhost:8080/api/v1/auth/sso/callback/google")
                        .scope("openid", "email", "profile")
                        .authorizationUri("https://accounts.google.com/o/oauth2/v2/auth")
                        .tokenUri("https://oauth2.googleapis.com/token")
                        .userInfoUri("https://openidconnect.googleapis.com/v1/userinfo")
                        .userNameAttributeName("sub")
                        .clientName("Google")
                        .build(),
                accessToken(Set.of("openid", "email", "profile")),
                new OidcIdToken("oidc-id-token", now, now.plusSeconds(300), Map.of("sub", "gid-sub")));

        assertSame(oidcUser, service.loadUser(oidcRequest), "OIDC request must route to the OIDC delegate");

        OAuth2UserRequest facebookRequest = new OAuth2UserRequest(facebookRegistration().build(),
                accessToken(Set.of("email", "public_profile")));
        assertSame(plainUser, service.loadUser(facebookRequest),
                "plain OAuth2 request must route to the OAuth2 delegate");
    }

    @Test
    @DisplayName("Diagnostics log scope names and field names, but NEVER attribute values or the access token")
    @SuppressWarnings("unchecked")
    void diagnostics_logKeyNamesOnly_neverValuesOrToken() {
        OAuth2User user = facebookUser(Map.of(
                "id", SECRET_SUBJECT_ID, "name", SECRET_NAME, "email", SECRET_EMAIL));
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = request -> user;
        SsoUserInfoDiagnosticsService service =
                new SsoUserInfoDiagnosticsService(unusedOidcDelegate(), delegate);
        OAuth2UserRequest request = new OAuth2UserRequest(facebookRegistration().build(),
                accessToken(Set.of("email", "public_profile")));

        service.loadUser(request);

        List<String> messages = logAppender.list.stream()
                .map(ILoggingEvent::getFormattedMessage)
                .toList();
        assertTrue(messages.stream().anyMatch(m -> m.contains("emailAttributePresent=true")),
                "log must report email presence");
        assertTrue(messages.stream().anyMatch(m -> m.contains("userInfoFieldNames=[email, id, name]")),
                "log must contain returned field names");
        assertTrue(messages.stream().anyMatch(m -> m.contains("grantedScopes=[email, public_profile]")),
                "log must contain granted scope names");
        assertFalse(messages.stream().anyMatch(m -> m.contains(SECRET_EMAIL)),
                "email address value must never be logged");
        assertFalse(messages.stream().anyMatch(m -> m.contains(SECRET_NAME)),
                "profile name value must never be logged");
        assertFalse(messages.stream().anyMatch(m -> m.contains(SECRET_SUBJECT_ID)),
                "provider subject id must never be logged");
        assertFalse(messages.stream().anyMatch(m -> m.contains(SECRET_ACCESS_TOKEN)),
                "access token must never be logged");
    }

    @Test
    @DisplayName("A delegate that throws is propagated unchanged (diagnostics never swallow provider errors)")
    @SuppressWarnings("unchecked")
    void delegateFailure_isPropagated() {
        OAuth2UserService<OAuth2UserRequest, OAuth2User> failing = request -> {
            throw new OAuth2AuthenticationException(new OAuth2Error("invalid_token"));
        };
        SsoUserInfoDiagnosticsService service =
                new SsoUserInfoDiagnosticsService(unusedOidcDelegate(), failing);
        OAuth2UserRequest request = new OAuth2UserRequest(facebookRegistration().build(),
                accessToken(Set.of("email")));

        assertThrows(OAuth2AuthenticationException.class, () -> service.loadUser(request));
    }

    private static OAuth2AccessToken accessToken(Set<String> scopes) {
        Instant now = Instant.now();
        return new OAuth2AccessToken(OAuth2AccessToken.TokenType.BEARER, SECRET_ACCESS_TOKEN,
                now, now.plusSeconds(3600), scopes);
    }

    private static OAuth2User facebookUser(Map<String, Object> attributes) {
        return new DefaultOAuth2User(
                AuthorityUtils.createAuthorityList("ROLE_USER"), attributes, "id");
    }

    @Test
    @DisplayName("A Facebook /me response without the email field passes through unchanged and never fails")
    @SuppressWarnings("unchecked")
    void facebookWithoutEmail_passesThrough_andDoesNotThrow() {
        OAuth2User user = facebookUser(Map.of("id", SECRET_SUBJECT_ID, "name", SECRET_NAME));
        OAuth2UserService<OAuth2UserRequest, OAuth2User> delegate = request -> user;
        SsoUserInfoDiagnosticsService service =
                new SsoUserInfoDiagnosticsService(unusedOidcDelegate(), delegate);
        OAuth2UserRequest request = new OAuth2UserRequest(facebookRegistration().build(),
                accessToken(Set.of("public_profile")));

        OAuth2User result = service.loadUser(request);

        assertSame(user, result, "delegate user must be returned unchanged");
    }
}
