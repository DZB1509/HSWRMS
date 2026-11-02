package com.heavenstay.hswrms.m1identity.sso;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.util.Locale;

/**
 * Handles successful provider callbacks ({@code /api/v1/auth/sso/callback/google}
 * for Google OIDC and {@code /api/v1/auth/sso/callback/facebook} for Facebook OAuth2).
 *
 * <p>Resolves the identity against HSWRMS, then redirects back to the SPA with a
 * single-use opaque ticket: {@code purpose=login} for an existing Customer or
 * {@code purpose=register} for registration prefill. Rejections (staff account,
 * unverified email, ineligible account, …) redirect back with a stable
 * {@code error} code and no ticket. The HSWRMS JWT and any provider tokens are
 * never placed in a URL, and the ticket itself is never logged.</p>
 */
@Component
public class SsoOAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private static final Logger log = LoggerFactory.getLogger(SsoOAuth2SuccessHandler.class);

    private final SsoService ssoService;
    private final SsoTicketService ssoTicketService;

    @Value("${app.sso.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public SsoOAuth2SuccessHandler(SsoService ssoService, SsoTicketService ssoTicketService) {
        this.ssoService = ssoService;
        this.ssoTicketService = ssoTicketService;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        try {
            if (!(authentication instanceof OAuth2AuthenticationToken oauthToken)) {
                throw new SsoRejectedException("SSO_AUTH_FAILED", "Unexpected authentication type for SSO callback.");
            }
            String provider = oauthToken.getAuthorizedClientRegistrationId().toUpperCase(Locale.ROOT);

            final String subject;
            final String email;
            final boolean emailVerified;
            final String fullName;
            if (authentication.getPrincipal() instanceof OidcUser oidcUser) {
                // Google OIDC path: verified email comes from the ID token.
                subject = oidcUser.getSubject();
                email = claimAsString(oidcUser.getClaims(), "email");
                emailVerified = Boolean.TRUE.equals(oidcUser.getClaims().get("email_verified"));
                fullName = resolveFullName(claimAsString(oidcUser.getClaims(), "name"),
                        claimAsString(oidcUser.getClaims(), "given_name"),
                        claimAsString(oidcUser.getClaims(), "family_name"), email);
            } else if (authentication.getPrincipal() instanceof OAuth2User oauth2User) {
                // Facebook OAuth2 path: identity comes from the Graph API user-info
                // response. Per Meta's User docs, `email` is returned only when a
                // valid email is available AND the `email` permission was granted
                // (phone-registered or permission-declined accounts omit it), and
                // /me exposes NO `email_verified` flag — so absence of the field
                // must never be confused with a verified address.
                subject = oauth2User.getName();
                email = claimAsString(oauth2User.getAttributes(), "email");
                String name = claimAsString(oauth2User.getAttributes(), "name");
                fullName = (name != null && !name.isBlank()) ? name.trim() : (email != null ? email : "");
                // Deliberately NOT verified: a returned address is provider-seen
                // but not provider-verified. SsoService applies the Facebook rule
                // (registration allowed; auto-linking forbidden) from this flag
                // plus the provider name.
                emailVerified = false;
            } else {
                throw new SsoRejectedException("SSO_EMAIL_NOT_VERIFIED",
                        "The provider did not return a usable identity.");
            }

            SsoResolution resolution = ssoService.resolveIdentity(provider, subject, email, emailVerified, fullName);

            if (resolution.isRegistration()) {
                // Redirect the SPA to the existing registration form; no account exists yet.
                redirectToFrontend(response, UriComponentsBuilder
                        .fromUriString(frontendBaseUrl)
                        .path("/auth/sso/callback")
                        .queryParam("purpose", "register")
                        .queryParam("ticket", resolution.registrationTicketToken())
                        .build().encode().toUriString());
            } else if (resolution.isLink()) {
                // Facebook link handshake: the SPA collects an OTP sent to the
                // existing account's email, then binds the Facebook identity.
                redirectToFrontend(response, UriComponentsBuilder
                        .fromUriString(frontendBaseUrl)
                        .path("/auth/sso/callback")
                        .queryParam("purpose", "link")
                        .queryParam("ticket", resolution.linkTicketToken())
                        .queryParam("provider", "facebook")
                        .build().encode().toUriString());
            } else {
                String ticket = ssoTicketService.createLoginTicket(resolution.userId(), provider, subject);
                redirectToFrontend(response, UriComponentsBuilder
                        .fromUriString(frontendBaseUrl)
                        .path("/auth/sso/callback")
                        .queryParam("purpose", "login")
                        .queryParam("ticket", ticket)
                        .build().encode().toUriString());
            }
        } catch (SsoRejectedException ex) {
            log.warn("SSO login rejected ({}): {}", ex.getCode(), ex.getMessage());
            redirectToFrontend(response, UriComponentsBuilder
                    .fromUriString(frontendBaseUrl)
                    .path("/auth/sso/callback")
                    .queryParam("error", ex.getCode())
                    .build().encode().toUriString());
        } catch (Exception ex) {
            // Never leak internals (or ticket/token material) to the redirect URL.
            log.error("SSO callback processing failed: {}", ex.getMessage(), ex);
            redirectToFrontend(response, UriComponentsBuilder
                    .fromUriString(frontendBaseUrl)
                    .path("/auth/sso/callback")
                    .queryParam("error", "SSO_FAILED")
                    .build().encode().toUriString());
        }
    }

    private void redirectToFrontend(HttpServletResponse response, String targetUrl) throws IOException {
        response.sendRedirect(targetUrl);
    }

    private String claimAsString(java.util.Map<String, Object> claims, String claimName) {
        Object value = claims != null ? claims.get(claimName) : null;
        return value != null ? value.toString() : null;
    }

    private String resolveFullName(String name, String given, String family, String email) {
        if (name != null && !name.isBlank()) {
            return name.trim();
        }
        StringBuilder combined = new StringBuilder();
        if (given != null && !given.isBlank()) combined.append(given.trim());
        if (family != null && !family.isBlank()) {
            if (combined.length() > 0) combined.append(' ');
            combined.append(family.trim());
        }
        return combined.length() > 0 ? combined.toString() : (email != null ? email : "");
    }
}

