package com.heavenstay.hswrms.m1identity.sso;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

import java.util.Set;
import java.util.TreeSet;

/**
 * TEMPORARY diagnostics wrapper around the standard SSO user-info loading
 * (OIDC registrations such as Google keep using {@link OidcUserService}; plain
 * OAuth2 registrations such as Facebook keep using
 * {@link DefaultOAuth2UserService} — behavior is identical to Spring Security's
 * default routing, which selects the service by request type).
 *
 * <p>Purpose: when a provider callback succeeds but the {@code email} field is
 * missing (Facebook {@code /me} silently omits it), the single decisive
 * diagnostic is the pair (granted token scopes, returned field names):</p>
 * <ul>
 *   <li>{@code email} absent from <em>grantedScopes</em> → the permission never
 *       took effect for this login (previously declined without
 *       {@code auth_type=rerequest}, or the app-role/dev-mode restriction);</li>
 *   <li>{@code email} present in <em>grantedScopes</em> but absent from
 *       <em>userInfoFieldNames</em> → Meta is withholding the address for this
 *       account (unconfirmed or phone-only Facebook account).</li>
 * </ul>
 *
 * <p>SAFETY: only scope names and attribute KEY NAMES are ever logged — never
 * attribute values, the access token, the authorization code, or the client
 * secret. Diagnostics failures are swallowed so they can never break a login.
 * Remove this wrapper (and its wiring in {@code SecurityConfig}) once the
 * missing-email incident is resolved.</p>
 */
@Component
public class SsoUserInfoDiagnosticsService implements OAuth2UserService<OAuth2UserRequest, OAuth2User> {

    private static final Logger log = LoggerFactory.getLogger(SsoUserInfoDiagnosticsService.class);

    private final OAuth2UserService<OidcUserRequest, OidcUser> oidcDelegate;
    private final OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2Delegate;

    public SsoUserInfoDiagnosticsService() {
        this(new OidcUserService(), new DefaultOAuth2UserService());
    }

    SsoUserInfoDiagnosticsService(OAuth2UserService<OidcUserRequest, OidcUser> oidcDelegate,
                                  OAuth2UserService<OAuth2UserRequest, OAuth2User> oauth2Delegate) {
        this.oidcDelegate = oidcDelegate;
        this.oauth2Delegate = oauth2Delegate;
    }

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User user;
        if (userRequest instanceof OidcUserRequest oidcUserRequest) {
            // Google OIDC: same service Spring Security uses by default here.
            user = oidcDelegate.loadUser(oidcUserRequest);
        } else {
            // Facebook OAuth2 (no id_token): same service Spring uses by default.
            user = oauth2Delegate.loadUser(userRequest);
        }
        logDiagnosticsSafely(userRequest, user);
        return user;
    }

    private void logDiagnosticsSafely(OAuth2UserRequest userRequest, OAuth2User user) {
        try {
            String registrationId = userRequest.getClientRegistration().getRegistrationId();
            Set<String> grantedScopes = userRequest.getAccessToken() != null
                    ? userRequest.getAccessToken().getScopes()
                    : Set.of();
            // KEY NAMES ONLY — attribute values (email address, name, id, …) are
            // never read or logged here.
            Set<String> fieldNames = user.getAttributes() != null
                    ? new TreeSet<>(user.getAttributes().keySet())
                    : new TreeSet<>();
            boolean emailAttributePresent = fieldNames.contains("email");
            log.info("SSO userinfo diagnostics [{}]: grantedScopes={}, userInfoFieldNames={}, emailAttributePresent={}",
                    registrationId, new TreeSet<>(grantedScopes), fieldNames, emailAttributePresent);
        } catch (RuntimeException ex) {
            log.debug("SSO userinfo diagnostics skipped: {}", ex.toString());
        }
    }
}
