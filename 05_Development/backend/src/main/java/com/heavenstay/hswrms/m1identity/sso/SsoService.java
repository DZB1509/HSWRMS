package com.heavenstay.hswrms.m1identity.sso;

import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.dto.SsoRegistrationPrefillResponse;
import com.heavenstay.hswrms.m1identity.entity.AuthIdentity;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.AuthIdentityRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.service.AuthService;
import com.heavenstay.hswrms.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Optional;

/**
 * Core Google/Facebook SSO resolution logic (FR-M1-05, GB-M1-04, GB-M1-05).
 *
 * <p>Identity is resolved by the trusted provider pair (provider name + subject:
 * Google OIDC {@code sub}, Facebook app-scoped {@code id}) via
 * {@code dbo.AuthIdentity}. Email is only consulted when no identity link
 * exists yet. Google asserts verification via the OIDC {@code email_verified}
 * claim; Facebook's Graph {@code /me} endpoint exposes NO verification flag,
 * so a Facebook address is provider-seen but never provider-verified:
 * Facebook may register a brand-new Customer (ticket-bound, ToS at form
 * submit) but may NEVER auto-link to an existing account by email — otherwise
 * anyone controlling a Facebook account whose email matches someone else's
 * HSWRMS login could take that account over. Employee accounts are rejected
 * for SSO even when they also hold a Customer role, and are never linked.
 * A new identity is never persisted here — registration is only completed when
 * the user submits the HSWRMS registration form.</p>
 */
@Service
public class SsoService {

    private static final Logger log = LoggerFactory.getLogger(SsoService.class);
    private static final String CUSTOMER_ROLE = "customer";
    private static final String FACEBOOK_PROVIDER = "FACEBOOK";

    private final UserRepository userRepository;
    private final AuthIdentityRepository authIdentityRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final SsoTicketService ssoTicketService;
    private final AuthService authService;

    public SsoService(UserRepository userRepository, AuthIdentityRepository authIdentityRepository,
                      JwtTokenProvider jwtTokenProvider, SsoTicketService ssoTicketService,
                      AuthService authService) {
        this.userRepository = userRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.ssoTicketService = ssoTicketService;
        this.authService = authService;
    }

    /**
     * Resolves a server-validated provider identity against HSWRMS accounts.
     *
     * <ul>
     *   <li>Linked identity + eligible Customer → LOGIN target.</li>
     *   <li>Google: unlinked, {@code email_verified=true} matching eligible
     *       Customer → link AuthIdentity (SRS GB-M1-04), then LOGIN.</li>
     *   <li>Facebook: unlinked address matching an eligible Customer account -> issue a
     *       single-use LINK ticket plus an OTP to the account's email. The Facebook
     *       identity is bound only after the holder proves mailbox ownership --
     *       never auto-linked, never impersonated. Staff/ineligible accounts are
     *       rejected, nothing is issued.</li>
     *   <li>Unlinked, verified email matches a staff/ineligible account →
     *       rejected, nothing is linked or issued.</li>
     *   <li>Unlinked and no matching account → REGISTRATION prefill ticket; no
     *       account, role, profile, or consent is created here. Facebook tickets
     *       carry {@code emailVerified=false}; registration completion enforces
     *       the per-provider rule below.</li>
     * </ul>
     */
    @Transactional
    public SsoResolution resolveIdentity(String provider, String providerSubject,
                                         String email, boolean emailVerified, String fullName) {
        if (!StringUtils.hasText(providerSubject)) {
            throw new SsoRejectedException("SSO_IDENTITY_INVALID",
                    "The identity returned by the provider is missing its subject identifier.");
        }

        Optional<AuthIdentity> linked =
                authIdentityRepository.findByProviderAndProviderSubject(provider, providerSubject);

        User user;
        if (linked.isPresent()) {
            Integer userId = linked.get().getUser() != null ? linked.get().getUser().getUserId() : null;
            user = userRepository.findByIdWithRoles(userId)
                    .orElseThrow(() -> new SsoRejectedException("SSO_ACCOUNT_NOT_FOUND",
                            "The account linked to this sign-in provider no longer exists."));
        } else {
            // Missing email is always rejected: no link and no prefill possible.
            if (!StringUtils.hasText(email)) {
                throw new SsoRejectedException("SSO_EMAIL_NOT_VERIFIED",
                        "The provider did not supply an email address for this account. "
                                + "Please grant email permission and try again.");
            }
            String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
            Optional<User> existing = userRepository.findByEmailWithRoles(normalizedEmail);
            if (existing.isEmpty()) {
                // C: no account is created at the OAuth callback — only a short-lived
                // prefill ticket bound to this provider subject is issued. The
                // ticket preserves the provider's verification flag (Google=true,
                // Facebook=false); registration completion re-checks it.
                String registrationTicketToken = ssoTicketService.createRegistrationTicket(
                        provider, providerSubject, normalizedEmail, emailVerified, fullName);
                return SsoResolution.registration(registrationTicketToken);
            }
            if (isFacebook(provider)) {
                // Facebook email-matching must NEVER auto-link: Graph /me has no
                // verification flag, so matching by email could hand an HSWRMS
                // account to whoever controls a same-address Facebook login.
                // Instead, issue a single-use LINK ticket and send an OTP to the
                // account's email; the identity is bound only after the holder
                // proves mailbox ownership (no impersonation, no silent link).
                User existingUser = existing.get();
                assertEligibleCustomer(existingUser);
                String linkTicketToken = ssoTicketService.createLinkTicket(
                        existingUser.getUserId(), provider, providerSubject, normalizedEmail);
                authService.sendFacebookLinkOtp(existingUser.getUserId());
                log.info("SSO link handshake issued: Facebook identity {} -> user {}",
                        providerSubject, existingUser.getUserId());
                return SsoResolution.link(existingUser.getUserId(), linkTicketToken);
            }
            // Google path: only a provider-VERIFIED email may auto-link (B4).
            if (!emailVerified) {
                throw new SsoRejectedException("SSO_EMAIL_NOT_VERIFIED",
                        "The provider did not verify the email address for this account.");
            }
            user = existing.get();
            // Employee / ineligible accounts are rejected BEFORE any link is persisted.
            assertEligibleCustomer(user);
            try {
                authIdentityRepository.saveAndFlush(new AuthIdentity(user, provider, providerSubject));
            } catch (DataIntegrityViolationException ex) {
                // B6: concurrent duplicate link attempts become a controlled error.
                throw new SsoRejectedException("SSO_LINK_CONFLICT",
                        "This sign-in identity was linked concurrently. Please try signing in again.");
            }
        }

        assertEligibleCustomer(user);
        return SsoResolution.login(user.getUserId());
    }

    /**
     * Exchanges a consumed LOGIN ticket for the standard login response (same JWT
     * issuance and payload conventions as email/password login).
     */
    @Transactional(readOnly = true)
    public LoginResponse exchangeLoginTicket(String ticket) {
        SsoTicket ssoTicket = ssoTicketService.consume(ticket, SsoTicketPurpose.LOGIN);
        User user = userRepository.findByIdWithRoles(ssoTicket.userId())
                .orElseThrow(() -> new BadCredentialsException("Invalid SSO login ticket."));
        // Re-validate at exchange time in case the account state changed mid-handshake.
        assertEligibleCustomer(user);
        return buildLoginResponse(user);
    }

    /**
     * Returns the prefill data for a REGISTRATION ticket without consuming it.
     * The account itself is only created when the registration form is submitted.
     */
    public SsoRegistrationPrefillResponse resolveRegistrationTicket(String ticket) {
        SsoTicket ssoTicket = ssoTicketService.peek(ticket, SsoTicketPurpose.REGISTRATION);
        return new SsoRegistrationPrefillResponse(ssoTicket.provider(), ssoTicket.email(), ssoTicket.fullName());
    }

    private boolean isFacebook(String provider) {
        return FACEBOOK_PROVIDER.equalsIgnoreCase(provider != null ? provider.trim() : "");
    }

    /**
     * Employee roles authenticate with email/password only (A3–A6): any non-Customer
     * role blocks SSO outright, even alongside a Customer role. Non-ACTIVE or
     * unverified accounts are not auto-activated or auto-verified by SSO (B5).
     */
    private void assertEligibleCustomer(User user) {
        List<String> roleNames = user.getUserRoles().stream()
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .map(Role::getRoleName)
                .filter(Objects::nonNull)
                .toList();

        boolean hasCustomerRole = roleNames.stream()
                .anyMatch(roleName -> CUSTOMER_ROLE.equalsIgnoreCase(roleName.trim()));
        boolean hasEmployeeRole = roleNames.stream()
                .anyMatch(roleName -> !CUSTOMER_ROLE.equalsIgnoreCase(roleName.trim()));

        if (hasEmployeeRole) {
            log.warn("SSO rejected: user {} holds employee roles {}; employees must use email/password.",
                    user.getUserId(), roleNames);
            throw new SsoRejectedException("SSO_EMPLOYEE_ACCOUNT",
                    "Staff accounts must sign in with their email and password.");
        }
        if (!hasCustomerRole) {
            throw new SsoRejectedException("SSO_NOT_CUSTOMER",
                    "This account is not eligible for sign-in with an external provider.");
        }
        if (!user.isEmailVerified()) {
            throw new SsoRejectedException("SSO_ACCOUNT_NOT_ELIGIBLE",
                    "This account still requires email verification before provider sign-in is allowed.");
        }
        if (!"ACTIVE".equals(user.getAccountStatus())) {
            throw new SsoRejectedException("SSO_ACCOUNT_NOT_ACTIVE",
                    "This account is not active. Please contact resort support or sign in with your password.");
        }
    }

    private LoginResponse buildLoginResponse(User user) {
        List<String> roles = user.getUserRoles().stream()
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .map(Role::getRoleName)
                .filter(Objects::nonNull)
                .toList();

        String token = jwtTokenProvider.generateToken(
                user.getUserId(), user.getEmail(), user.getFullName(), roles);

        return new LoginResponse(token, "Bearer", jwtTokenProvider.getExpirationMs(),
                user.getUserId(), user.getEmail(), user.getFullName(), roles, user.getAccountStatus());
    }
}

