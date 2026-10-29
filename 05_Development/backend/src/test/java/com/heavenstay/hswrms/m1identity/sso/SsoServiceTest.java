package com.heavenstay.hswrms.m1identity.sso;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Behavior tests for the Google SSO resolution logic against the REAL
 * {@link SsoTicketService} (so ticket semantics are exercised end-to-end),
 * with persistence and JWT signing mocked.
 *
 * <p>Covers: linked-identity login (FR-M1-05 case 2), registration prefill
 * without account creation (case 3), verified-email linking per GB-M1-04,
 * staff-account rejection (never linked, no JWT), and the never-link-
 * unverified-email rule.</p>
 */
@ExtendWith(MockitoExtension.class)
class SsoServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private AuthIdentityRepository authIdentityRepository;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private AuthService authService;

    private SsoTicketService ssoTicketService;
    private SsoService ssoService;

    @BeforeEach
    void setUp() {
        ssoTicketService = new SsoTicketService(60_000, 60_000, 300_000);
        ssoService = new SsoService(userRepository, authIdentityRepository, jwtTokenProvider, ssoTicketService,
                authService);
    }

    private User customerWithRoles(Integer userId, String email, String... extraRoleNames) {
        User user = new User();
        user.setUserId(userId);
        user.setEmail(email);
        user.setFullName("Jane Doe");
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        // NOTE: UserRole.equals/hashCode are null-id based, so a regular HashSet would
        // collapse all unsaved UserRoles into one — use identity semantics instead.
        Set<UserRole> roles = Collections.newSetFromMap(new IdentityHashMap<>());
        roles.add(new UserRole(user, new Role("Customer", "Customer role")));
        for (String roleName : extraRoleNames) {
            roles.add(new UserRole(user, new Role(roleName, "Staff role")));
        }
        user.setUserRoles(roles);
        return user;
    }

    @Test
    @DisplayName("Criterion 1: a linked, active Customer identity authenticates and receives the standard JWT login response")
    void linkedIdentity_activeCustomer_receivesStandardLoginResponse() {
        User user = customerWithRoles(205, "jane@example.com");
        AuthIdentity identity = new AuthIdentity(user, "GOOGLE", "sub-1");
        when(authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", "sub-1"))
                .thenReturn(Optional.of(identity));
        when(userRepository.findByIdWithRoles(205)).thenReturn(Optional.of(user));

        SsoResolution resolution = ssoService.resolveIdentity("GOOGLE", "sub-1", "jane@example.com", true, "Jane Doe");
        assertFalse(resolution.isRegistration());
        assertEquals(205, resolution.userId());

        // The success handler creates the login ticket; the SPA then exchanges it.
        String ticket = ssoTicketService.createLoginTicket(resolution.userId(), "GOOGLE", "sub-1");
        when(jwtTokenProvider.generateToken(205, "jane@example.com", "Jane Doe", List.of("Customer")))
                .thenReturn("signed.jwt.token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86_400_000L);

        LoginResponse response = ssoService.exchangeLoginTicket(ticket);

        assertEquals("signed.jwt.token", response.getToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(86_400_000L, response.getExpiresInMs());
        assertEquals(205, response.getUserId());
        assertEquals("jane@example.com", response.getEmail());
        assertEquals("Jane Doe", response.getFullName());
        assertEquals(List.of("Customer"), response.getRoles());
        assertEquals("ACTIVE", response.getAccountStatus());

        // Single-use: the same ticket can never be exchanged twice.
        assertThrows(BusinessRuleException.class, () -> ssoService.exchangeLoginTicket(ticket));
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
    }

    @Test
    @DisplayName("Criterion 2: a new verified identity is sent to registration prefill without creating any HSWRMS account or consent")
    void newIdentity_verifiedEmail_redirectsToRegistrationPrefill_withoutCreatingAnything() {
        when(authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", "sub-new"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailWithRoles("jane@example.com")).thenReturn(Optional.empty());

        SsoResolution resolution = ssoService.resolveIdentity("GOOGLE", "sub-new", "jane@example.com", true, "Jane Doe");

        assertTrue(resolution.isRegistration());
        assertNotNull(resolution.registrationTicketToken());

        // Nothing was persisted at the callback — account, role, profile, consent, identity.
        verify(userRepository, never()).save(any(User.class));
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
        verify(authIdentityRepository, never()).saveAndFlush(any(AuthIdentity.class));

        // The ticket prefills the form without being consumed…
        SsoRegistrationPrefillResponse prefill =
                ssoService.resolveRegistrationTicket(resolution.registrationTicketToken());
        assertEquals("GOOGLE", prefill.getProvider());
        assertEquals("jane@example.com", prefill.getEmail());
        assertEquals("Jane Doe", prefill.getFullName());

        // …and it can never be exchanged for a login JWT.
        assertThrows(BusinessRuleException.class,
                () -> ssoService.exchangeLoginTicket(resolution.registrationTicketToken()));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Criterion 5: a verified Google email matching an eligible Customer links the identity without creating a duplicate User")
    void verifiedEmail_matchingEligibleCustomer_linksIdentity_withoutDuplicateUser() {
        User user = customerWithRoles(205, "jane@example.com");
        when(authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", "sub-5"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailWithRoles("jane@example.com")).thenReturn(Optional.of(user));

        SsoResolution resolution = ssoService.resolveIdentity("GOOGLE", "sub-5", "Jane@Example.com", true, "Jane Doe");

        assertFalse(resolution.isRegistration());
        assertEquals(205, resolution.userId());

        ArgumentCaptor<AuthIdentity> captor = ArgumentCaptor.forClass(AuthIdentity.class);
        verify(authIdentityRepository).saveAndFlush(captor.capture());
        assertEquals("GOOGLE", captor.getValue().getProvider());
        assertEquals("sub-5", captor.getValue().getProviderSubject());
        assertEquals(205, captor.getValue().getUser().getUserId());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Criterion 6: an email matching an account with any employee role is rejected — no link, no ticket, no JWT")
    void emailMatchingEmployeeAccount_isRejected_withoutLinkOrJwt() {
        User staff = customerWithRoles(301, "staff@heavenstay.dev", "Receptionist");
        when(authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", "sub-staff"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailWithRoles("staff@heavenstay.dev")).thenReturn(Optional.of(staff));

        SsoRejectedException ex = assertThrows(SsoRejectedException.class,
                () -> ssoService.resolveIdentity("GOOGLE", "sub-staff", "staff@heavenstay.dev", true, "Staff"));

        assertEquals("SSO_EMPLOYEE_ACCOUNT", ex.getCode());
        verify(authIdentityRepository, never()).saveAndFlush(any(AuthIdentity.class));
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Criterion 6: a Google identity already linked to an employee account is still rejected")
    void linkedIdentity_pointingAtEmployeeAccount_isRejected() {
        User staff = customerWithRoles(301, "staff@heavenstay.dev", "Manager");
        AuthIdentity identity = new AuthIdentity(staff, "GOOGLE", "sub-staff-linked");
        when(authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", "sub-staff-linked"))
                .thenReturn(Optional.of(identity));
        when(userRepository.findByIdWithRoles(301)).thenReturn(Optional.of(staff));

        SsoRejectedException ex = assertThrows(SsoRejectedException.class,
                () -> ssoService.resolveIdentity("GOOGLE", "sub-staff-linked", "staff@heavenstay.dev", true, "Staff"));

        assertEquals("SSO_EMPLOYEE_ACCOUNT", ex.getCode());
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Criterion 7: an unverified external email is never used for automatic account linking")
    void unverifiedEmail_isNeverUsedForLinkingOrRegistration() {
        // The email matches an existing HSWRMS account, but the provider did not
        // verify it — auto-linking is forbidden (B4).
        User existing = customerWithRoles(207, "jane@example.com");
        when(authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", "sub-u"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailWithRoles("jane@example.com")).thenReturn(Optional.of(existing));

        SsoRejectedException ex = assertThrows(SsoRejectedException.class,
                () -> ssoService.resolveIdentity("GOOGLE", "sub-u", "jane@example.com", false, "Jane Doe"));

        assertEquals("SSO_EMAIL_NOT_VERIFIED", ex.getCode());
        verify(authIdentityRepository, never()).saveAndFlush(any(AuthIdentity.class));
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Criterion 7: an unverified email with NO existing account only yields a registration ticket (emailVerified=false preserved for completion)")
    void unverifiedEmail_withoutExistingAccount_issuesRegistrationTicket() {
        when(authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", "sub-u2"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailWithRoles("new@example.com")).thenReturn(Optional.empty());

        SsoResolution resolution = ssoService.resolveIdentity("GOOGLE", "sub-u2", "new@example.com", false, "Jane Doe");

        assertTrue(resolution.isRegistration());
        // The real ticket store issued a REGISTRATION ticket bound to this
        // subject, carrying the provider's verification flag for the
        // completion step to re-check. No account, link, or JWT here.
        SsoTicket ticket = ssoTicketService.peek(resolution.registrationTicketToken(), SsoTicketPurpose.REGISTRATION);
        assertFalse(ticket.emailVerified());
        assertEquals("new@example.com", ticket.email());
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Criterion 7: a missing provider email is rejected the same way")
    void missingProviderEmail_isRejected() {
        when(authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", "sub-noemail"))
                .thenReturn(Optional.empty());

        SsoRejectedException ex = assertThrows(SsoRejectedException.class,
                () -> ssoService.resolveIdentity("GOOGLE", "sub-noemail", null, false, null));

        assertEquals("SSO_EMAIL_NOT_VERIFIED", ex.getCode());
        verify(userRepository, never()).findByEmailWithRoles(anyString());
    }

    @Test
    @DisplayName("Criterion B5: a verified email matching an unverified PENDING account is not auto-activated or linked")
    void verifiedEmail_matchingPendingUnverifiedAccount_isRejected_withoutLink() {
        User pending = customerWithRoles(206, "pending@example.com");
        pending.setEmailVerified(false);
        pending.setAccountStatus("PENDING");
        when(authIdentityRepository.findByProviderAndProviderSubject("GOOGLE", "sub-p"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailWithRoles("pending@example.com")).thenReturn(Optional.of(pending));

        SsoRejectedException ex = assertThrows(SsoRejectedException.class,
                () -> ssoService.resolveIdentity("GOOGLE", "sub-p", "pending@example.com", true, "Jane Doe"));

        assertEquals("SSO_ACCOUNT_NOT_ELIGIBLE", ex.getCode());
        verify(authIdentityRepository, never()).saveAndFlush(any(AuthIdentity.class));
        assertFalse(pending.isEmailVerified(), "account state must not be modified by SSO");
    }

    @Test
    @DisplayName("The ticket exchange re-validates account state (a now-staff account cannot redeem a login ticket)")
    void exchangeLoginTicket_revalidatesAccountState() {
        String ticket = ssoTicketService.createLoginTicket(205, "GOOGLE", "sub-7");
        User staff = customerWithRoles(205, "jane@example.com", "Therapist");
        when(userRepository.findByIdWithRoles(205)).thenReturn(Optional.of(staff));

        SsoRejectedException ex = assertThrows(SsoRejectedException.class,
                () -> ssoService.exchangeLoginTicket(ticket));

        assertEquals("SSO_EMPLOYEE_ACCOUNT", ex.getCode());
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Facebook: existing email with no link issues a LINK ticket + OTP instead of auto-linking or rejecting")
    void facebookExistingEmail_unlinked_issuesLinkTicket_andSendsOtp() {
        User existing = customerWithRoles(205, "jane@example.com");
        when(authIdentityRepository.findByProviderAndProviderSubject("FACEBOOK", "fb-sub-1"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailWithRoles("jane@example.com")).thenReturn(Optional.of(existing));
        // OTP dispatch is delegated to AuthService and stubbed here: the callback
        // handshake itself performs no binding and issues no JWT.
        doNothing().when(authService).sendFacebookLinkOtp(205);

        SsoResolution resolution = ssoService.resolveIdentity("FACEBOOK", "fb-sub-1", "jane@example.com", false, "Jane Doe");

        assertFalse(resolution.isRegistration());
        assertTrue(resolution.isLink());
        assertEquals(205, resolution.userId());
        assertNotNull(resolution.linkTicketToken());

        // The ticket is real and bound to this user / provider subject.
        SsoTicket ticket = ssoTicketService.peek(resolution.linkTicketToken(), SsoTicketPurpose.LINK);
        assertEquals(205, ticket.userId());
        assertEquals("FACEBOOK", ticket.provider());
        assertEquals("fb-sub-1", ticket.providerSubject());
        assertEquals("jane@example.com", ticket.email());
        assertFalse(ticket.emailVerified());

        // No identity bound, no JWT issued at callback time.
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
        verify(authIdentityRepository, never()).saveAndFlush(any(AuthIdentity.class));
        verify(authService).sendFacebookLinkOtp(205);
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Facebook: brand-new email issues a REGISTRATION ticket (emailVerified=false) with no account, OTP, or link")
    void facebookNewEmail_unregistered_issuesRegistrationTicket_withoutOtp() {
        when(authIdentityRepository.findByProviderAndProviderSubject("FACEBOOK", "fb-sub-new"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailWithRoles("newbie@example.com")).thenReturn(Optional.empty());

        SsoResolution resolution = ssoService.resolveIdentity("FACEBOOK", "fb-sub-new", "newbie@example.com", false, "Newbie");

        assertTrue(resolution.isRegistration());
        assertFalse(resolution.isLink());
        assertNotNull(resolution.registrationTicketToken());

        // The ticket carries the unverified flag so registration completion
        // takes the PENDING + OTP path (never an auto sign-in).
        SsoTicket ticket = ssoTicketService.peek(resolution.registrationTicketToken(), SsoTicketPurpose.REGISTRATION);
        assertEquals("FACEBOOK", ticket.provider());
        assertEquals("fb-sub-new", ticket.providerSubject());
        assertEquals("newbie@example.com", ticket.email());
        assertFalse(ticket.emailVerified());

        // Nothing created or dispatched at callback time: no account, no OTP,
        // no identity binding, no JWT.
        verify(userRepository, never()).save(any(User.class));
        verify(authService, never()).sendFacebookLinkOtp(anyInt());
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
        verify(authIdentityRepository, never()).saveAndFlush(any(AuthIdentity.class));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Facebook: already-linked identity of an active Customer receives the standard login target")
    void facebookLinkedIdentity_activeCustomer_receivesLoginTarget() {
        User user = customerWithRoles(205, "jane@example.com");
        AuthIdentity identity = new AuthIdentity(user, "FACEBOOK", "fb-sub-linked");
        when(authIdentityRepository.findByProviderAndProviderSubject("FACEBOOK", "fb-sub-linked"))
                .thenReturn(Optional.of(identity));
        when(userRepository.findByIdWithRoles(205)).thenReturn(Optional.of(user));

        SsoResolution resolution = ssoService.resolveIdentity("FACEBOOK", "fb-sub-linked", "jane@example.com", false, "Jane Doe");

        assertFalse(resolution.isRegistration());
        assertFalse(resolution.isLink());
        assertEquals(205, resolution.userId());
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
        // Linked identity logs in directly — no linking OTP is ever dispatched.
        verify(authService, never()).sendFacebookLinkOtp(anyInt());
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Facebook: existing email on a staff account is rejected before any link ticket is issued")
    void facebookMatchingStaffAccount_isRejected_beforeLinkTicket() {
        User staff = customerWithRoles(301, "staff@heavenstay.dev", "Receptionist");
        when(authIdentityRepository.findByProviderAndProviderSubject("FACEBOOK", "fb-staff"))
                .thenReturn(Optional.empty());
        when(userRepository.findByEmailWithRoles("staff@heavenstay.dev")).thenReturn(Optional.of(staff));

        SsoRejectedException ex = assertThrows(SsoRejectedException.class,
                () -> ssoService.resolveIdentity("FACEBOOK", "fb-staff", "staff@heavenstay.dev", false, "Staff"));

        assertEquals("SSO_EMPLOYEE_ACCOUNT", ex.getCode());
        verify(authService, never()).sendFacebookLinkOtp(anyInt());
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
        verifyNoInteractions(jwtTokenProvider);
    }
}
