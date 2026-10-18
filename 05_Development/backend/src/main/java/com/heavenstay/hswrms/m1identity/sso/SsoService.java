package com.heavenstay.hswrms.m1identity.sso;

import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.dto.SsoRegistrationPrefillResponse;
import com.heavenstay.hswrms.m1identity.entity.AuthIdentity;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.AuthIdentityRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
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
 * Core Google SSO resolution logic (FR-M1-05, GB-M1-04, GB-M1-05).
 *
 * <p>Identity is resolved by the trusted provider pair (provider name + OIDC
 * {@code sub}) via {@code dbo.AuthIdentity}. Email is only consulted when no
 * identity link exists yet, and only when the provider asserts it as verified.
 * Employee accounts are rejected for SSO even when they also hold a Customer
 * role, and are never linked. A verified email that matches an existing eligible
 * Customer is linked per the SRS rule instead of creating a duplicate account.
 * A new identity is never persisted here — registration is only completed when
 * the user submits the HSWRMS registration form.</p>
 */
@Service
public class SsoService {

    private static final Logger log = LoggerFactory.getLogger(SsoService.class);
    private static final String CUSTOMER_ROLE = "customer";

    private final UserRepository userRepository;
    private final AuthIdentityRepository authIdentityRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final SsoTicketService ssoTicketService;

    public SsoService(UserRepository userRepository, AuthIdentityRepository authIdentityRepository,
                      JwtTokenProvider jwtTokenProvider, SsoTicketService ssoTicketService) {
        this.userRepository = userRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.ssoTicketService = ssoTicketService;
    }

    /**
     * Resolves a server-validated provider identity against HSWRMS accounts.
     *
     * <ul>
     *   <li>Linked identity + eligible Customer → LOGIN target.</li>
     *   <li>Unlinked, verified email matches eligible Customer → link AuthIdentity (SRS
     *       GB-M1-04), then LOGIN.</li>
     *   <li>Unlinked, verified email matches a staff/ineligible account → rejected,
     *       nothing is linked or issued.</li>
     *   <li>Unlinked and no matching account → REGISTRATION prefill ticket; no account,
     *       role, profile, or consent is created here.</li>
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
            // Never link or register against an email the provider did not verify (B4).
            if (!emailVerified || !StringUtils.hasText(email)) {
                throw new SsoRejectedException("SSO_EMAIL_NOT_VERIFIED",
                        "The provider did not verify the email address for this account.");
            }
            String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
            Optional<User> existing = userRepository.findByEmailWithRoles(normalizedEmail);
            if (existing.isEmpty()) {
                // C: no account is created at the OAuth callback — only a short-lived
                // prefill ticket bound to this provider subject is issued.
                String registrationTicketToken = ssoTicketService.createRegistrationTicket(
                        provider, providerSubject, normalizedEmail, true, fullName);
                return SsoResolution.registration(registrationTicketToken);
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

