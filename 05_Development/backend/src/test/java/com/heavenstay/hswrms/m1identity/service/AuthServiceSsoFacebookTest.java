package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.dto.SsoRegisterRequest;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailRequest;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailResponse;
import com.heavenstay.hswrms.m1identity.entity.*;
import com.heavenstay.hswrms.m1identity.repository.*;
import com.heavenstay.hswrms.m1identity.sso.SsoRejectedException;
import com.heavenstay.hswrms.m1identity.sso.SsoTicket;
import com.heavenstay.hswrms.m1identity.sso.SsoTicketPurpose;
import com.heavenstay.hswrms.m1identity.sso.SsoTicketService;
import com.heavenstay.hswrms.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Limit;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Facebook SSO registration tests: Facebook exposes no {@code email_verified}
 * claim, so registration must create a PENDING + unverified account, dispatch
 * the standard email OTP, and answer with the controlled SSO_OTP_REQUIRED code
 * (no JWT). The Facebook identity is bound only AFTER OTP verification proves
 * mailbox control â€” never at form submission.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceSsoFacebookTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRoleRepository userRoleRepository;
    @Mock private CustomerProfileRepository customerProfileRepository;
    @Mock private ConsentRecordRepository consentRecordRepository;
    @Mock private EmailOtpRepository emailOtpRepository;
    @Mock private AuthIdentityRepository authIdentityRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailDeliveryAdapter emailDeliveryAdapter;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private SsoTicketService ssoTicketService;

    @InjectMocks
    private AuthService authService;

    private SsoRegisterRequest request;
    private SsoTicket facebookTicket;

    @BeforeEach
    void setUp() {
        request = new SsoRegisterRequest();
        request.setSsoTicket("ticket-fb-1");
        request.setFullName("Jane Doe");
        request.setConsent(true);

        facebookTicket = new SsoTicket(SsoTicketPurpose.REGISTRATION, "FACEBOOK", "fb-sub-1",
                null, "jane@example.com", false, "Jane Doe", Instant.now().plusSeconds(600));
    }

    /** Runs the Facebook path up to (and including) the SSO_OTP_REQUIRED signal. */
    private SsoRejectedException completeFacebookRegistration() {
        when(ssoTicketService.consume("ticket-fb-1", SsoTicketPurpose.REGISTRATION)).thenReturn(facebookTicket);
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "enc_" + inv.getArgument(0));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(410);
            return u;
        });
        Role role = new Role("Customer", "Customer role");
        role.setRoleId(1);
        when(roleRepository.findByRoleNameIgnoreCase("Customer")).thenReturn(Optional.of(role));

        return assertThrows(SsoRejectedException.class, () -> authService.registerWithSso(request));
    }

    private VerifyEmailRequest verifyRequest(String email, String otp) {
        VerifyEmailRequest r = new VerifyEmailRequest();
        r.setEmail(email);
        r.setOtp(otp);
        return r;
    }

    @Test
    @DisplayName("Criterion B2/B7: Facebook registration creates PENDING+unverified user with role, profile and ToS consent, dispatches the OTP, and answers SSO_OTP_REQUIRED without a JWT")
    void facebookRegistration_createsPendingAccountAndOtp_thenRequiresOtp() {
        request.setPassword("supersecret");

        SsoRejectedException ex = completeFacebookRegistration();

        assertEquals("SSO_OTP_REQUIRED", ex.getCode());

        // PENDING + unverified + hashed password â€” NOT ACTIVE, NOT verified.
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User savedUser = userCaptor.getValue();
        assertEquals("PENDING", savedUser.getAccountStatus());
        assertFalse(savedUser.isEmailVerified());
        assertEquals("enc_supersecret", savedUser.getPasswordHash());
        assertEquals("jane@example.com", savedUser.getEmail());

        // Role, profile and ToS consent are recorded up front, exactly like the
        // email/password registration path.
        verify(userRoleRepository).save(any(UserRole.class));
        verify(customerProfileRepository).save(any(CustomerProfile.class));
        verify(consentRecordRepository).save(any(ConsentRecord.class));

        // Standard EMAIL_VERIFICATION OTP is hashed (never stored raw) and the
        // raw code is delivered to the ticket-bound address.
        ArgumentCaptor<String> rawOtpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailDeliveryAdapter).sendVerificationOtp(eq("jane@example.com"), rawOtpCaptor.capture());
        ArgumentCaptor<EmailOtp> otpCaptor = ArgumentCaptor.forClass(EmailOtp.class);
        verify(emailOtpRepository).save(otpCaptor.capture());
        EmailOtp savedOtp = otpCaptor.getValue();
        assertEquals("EMAIL_VERIFICATION", savedOtp.getPurpose());
        assertEquals("enc_" + rawOtpCaptor.getValue(), savedOtp.getOtpHash());

        // No JWT and no identity binding before mailbox proof.
        verifyNoInteractions(jwtTokenProvider);
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
    }

    @Test
    @DisplayName("Criterion B2: a Facebook ticket without an email is rejected before anything is created")
    void facebookRegistration_withoutEmail_rejectedBeforeAnyWrite() {
        SsoTicket noEmail = new SsoTicket(SsoTicketPurpose.REGISTRATION, "FACEBOOK", "fb-sub-1",
                null, null, false, "Jane Doe", Instant.now().plusSeconds(600));
        when(ssoTicketService.consume("ticket-fb-1", SsoTicketPurpose.REGISTRATION)).thenReturn(noEmail);

        SsoRejectedException ex = assertThrows(SsoRejectedException.class,
                () -> authService.registerWithSso(request));

        assertEquals("SSO_EMAIL_NOT_VERIFIED", ex.getCode());
        verifyNoInteractions(userRepository, roleRepository, userRoleRepository,
                customerProfileRepository, consentRecordRepository, emailOtpRepository,
                authIdentityRepository, emailDeliveryAdapter, jwtTokenProvider);
    }

    @Test
    @DisplayName("Criterion B2: a Facebook registration without a password is rejected â€” mailbox proof alone is not enough to recover the account")
    void facebookRegistration_withoutPassword_rejected() {
        when(ssoTicketService.consume("ticket-fb-1", SsoTicketPurpose.REGISTRATION)).thenReturn(facebookTicket);
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> authService.registerWithSso(request));

        assertEquals("PASSWORD_REQUIRED", ex.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
        verify(emailOtpRepository, never()).save(any(EmailOtp.class));
        verify(emailDeliveryAdapter, never()).sendVerificationOtp(anyString(), anyString());
        verifyNoInteractions(jwtTokenProvider, authIdentityRepository);
    }

    @Test
    @DisplayName("Criterion B7: a duplicate email at Facebook registration submission is a controlled conflict, not a second account")
    void facebookRegistration_duplicateEmail_isControlledConflict() {
        request.setPassword("supersecret");
        when(ssoTicketService.consume("ticket-fb-1", SsoTicketPurpose.REGISTRATION)).thenReturn(facebookTicket);
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.registerWithSso(request));

        verify(userRepository, never()).save(any(User.class));
        verify(emailOtpRepository, never()).save(any(EmailOtp.class));
        verify(emailDeliveryAdapter, never()).sendVerificationOtp(anyString(), anyString());
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("Criterion B2/B7: verifying the OTP activates the PENDING account AND binds the Facebook identity to it")
    void verifyEmail_afterFacebookRegistration_activatesAccountAndBindsIdentity() {
        request.setPassword("supersecret");
        completeFacebookRegistration();

        // Recover the raw OTP from the delivery adapter (as the mailbox owner would).
        ArgumentCaptor<String> rawOtpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailDeliveryAdapter).sendVerificationOtp(eq("jane@example.com"), rawOtpCaptor.capture());
        ArgumentCaptor<EmailOtp> otpCaptor = ArgumentCaptor.forClass(EmailOtp.class);
        verify(emailOtpRepository).save(otpCaptor.capture());
        EmailOtp savedOtp = otpCaptor.getValue();
        User pending = savedOtp.getUser();

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(pending));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(410), eq("EMAIL_VERIFICATION"), eq(Limit.of(1))))
                .thenReturn(Optional.of(savedOtp));
        when(passwordEncoder.matches(rawOtpCaptor.getValue(), savedOtp.getOtpHash())).thenReturn(true);
        when(authIdentityRepository.findByProviderAndProviderSubject("FACEBOOK", "fb-sub-1"))
                .thenReturn(Optional.empty());

        VerifyEmailResponse response = authService.verifyEmail(
                verifyRequest("jane@example.com", rawOtpCaptor.getValue()));

        assertTrue(response.isEmailVerified());
        assertEquals("ACTIVE", response.getAccountStatus());
        assertTrue(pending.isEmailVerified());
        assertEquals("ACTIVE", pending.getAccountStatus());

        ArgumentCaptor<AuthIdentity> identityCaptor = ArgumentCaptor.forClass(AuthIdentity.class);
        verify(authIdentityRepository).save(identityCaptor.capture());
        assertEquals("FACEBOOK", identityCaptor.getValue().getProvider());
        assertEquals("fb-sub-1", identityCaptor.getValue().getProviderSubject());
        assertEquals(410, identityCaptor.getValue().getUser().getUserId());
    }

    @Test
    @DisplayName("Criterion B6: a duplicate-provider binding is skipped â€” the identity must never be saved twice")
    void verifyEmail_identityAlreadyBound_skipsSecondBinding() {
        request.setPassword("supersecret");
        completeFacebookRegistration();

        ArgumentCaptor<String> rawOtpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailDeliveryAdapter).sendVerificationOtp(eq("jane@example.com"), rawOtpCaptor.capture());
        ArgumentCaptor<EmailOtp> otpCaptor = ArgumentCaptor.forClass(EmailOtp.class);
        verify(emailOtpRepository).save(otpCaptor.capture());
        EmailOtp savedOtp = otpCaptor.getValue();
        User pending = savedOtp.getUser();

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(pending));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(410), eq("EMAIL_VERIFICATION"), eq(Limit.of(1))))
                .thenReturn(Optional.of(savedOtp));
        when(passwordEncoder.matches(rawOtpCaptor.getValue(), savedOtp.getOtpHash())).thenReturn(true);
        AuthIdentity existing = new AuthIdentity(pending, "FACEBOOK", "fb-sub-1");
        when(authIdentityRepository.findByProviderAndProviderSubject("FACEBOOK", "fb-sub-1"))
                .thenReturn(Optional.of(existing));

        VerifyEmailResponse response = authService.verifyEmail(
                verifyRequest("jane@example.com", rawOtpCaptor.getValue()));

        assertTrue(response.isEmailVerified());
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
    }

    @Test
    @DisplayName("Criterion B2: a normal (non-SSO) OTP verification activates the account without binding any identity")
    void verifyEmail_withoutPendingFacebookBinding_bindsNothing() {
        User user = new User("Jane Doe", "jane@example.com", "enc_securepass");
        user.setUserId(205);
        user.setAccountStatus("PENDING");
        user.setEmailVerified(false);
        EmailOtp otp = new EmailOtp(user, "enc_123456", "EMAIL_VERIFICATION",
                Instant.now().plus(10, ChronoUnit.MINUTES));
        otp.setAttemptCount(0);
        otp.setConsumed(false);

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(205), eq("EMAIL_VERIFICATION"), eq(Limit.of(1))))
                .thenReturn(Optional.of(otp));
        when(passwordEncoder.matches("123456", "enc_123456")).thenReturn(true);

        VerifyEmailResponse response = authService.verifyEmail(verifyRequest("jane@example.com", "123456"));

        assertTrue(response.isEmailVerified());
        assertTrue(user.isEmailVerified());
        assertEquals("ACTIVE", user.getAccountStatus());
        verifyNoInteractions(authIdentityRepository);
    }

    @Test
    @DisplayName("sendFacebookLinkOtp dispatches a 6-digit code and stores a hashed OTP for the account")
    void sendFacebookLinkOtp_sendsCodeAndStoresOtp() {
        User user = new User();
        user.setUserId(410);
        user.setEmail("jane@example.com");
        when(userRepository.findById(410)).thenReturn(Optional.of(user));
        when(passwordEncoder.encode(anyString())).thenReturn("enc_otp");

        authService.sendFacebookLinkOtp(410);

        ArgumentCaptor<String> emailCaptor = ArgumentCaptor.forClass(String.class);
        ArgumentCaptor<String> codeCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailDeliveryAdapter).sendVerificationOtp(emailCaptor.capture(), codeCaptor.capture());
        assertEquals("jane@example.com", emailCaptor.getValue());
        assertTrue(codeCaptor.getValue().matches("\\d{6}"), "OTP must be six digits: " + codeCaptor.getValue());

        ArgumentCaptor<EmailOtp> otpCaptor = ArgumentCaptor.forClass(EmailOtp.class);
        verify(emailOtpRepository).save(otpCaptor.capture());
        EmailOtp saved = otpCaptor.getValue();
        assertEquals("EMAIL_VERIFICATION", saved.getPurpose());
        assertEquals(410, saved.getUser().getUserId());
        assertFalse(saved.isConsumed());
    }

    @Test
    @DisplayName("completeFacebookLink verifies the OTP, binds the Facebook identity, and issues the standard JWT")
    void completeFacebookLink_bindsIdentityAndIssuesJwt() {
        User user = new User("Jane Doe", "jane@example.com", "enc_pass");
        user.setUserId(410);
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        Set<UserRole> roles = Collections.newSetFromMap(new IdentityHashMap<>());
        roles.add(new UserRole(user, new Role("Customer", "Customer role")));
        user.setUserRoles(roles);
        when(userRepository.findByIdWithRoles(410)).thenReturn(Optional.of(user));

        EmailOtp otp = new EmailOtp(user, "enc_hash", "EMAIL_VERIFICATION",
                Instant.now().plus(10, ChronoUnit.MINUTES));
        otp.setAttemptCount(0);
        otp.setConsumed(false);
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(410), eq("EMAIL_VERIFICATION"), eq(Limit.of(1))))
                .thenReturn(Optional.of(otp));
        when(passwordEncoder.matches("123456", "enc_hash")).thenReturn(true);
        when(authIdentityRepository.findByProviderAndProviderSubject("FACEBOOK", "fb-sub-1"))
                .thenReturn(Optional.empty());
        when(jwtTokenProvider.generateToken(410, "jane@example.com", "Jane Doe", List.of("Customer")))
                .thenReturn("fb-linked-token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(864_000_000L);

        LoginResponse response = authService.completeFacebookLink(410, "fb-sub-1", "123456");

        assertEquals("fb-linked-token", response.getToken());
        assertEquals(410, response.getUserId());
        assertEquals("jane@example.com", response.getEmail());
        assertEquals(List.of("Customer"), response.getRoles());
        assertEquals("ACTIVE", response.getAccountStatus());
        assertTrue(user.isEmailVerified());
        assertEquals("ACTIVE", user.getAccountStatus());

        ArgumentCaptor<AuthIdentity> captor = ArgumentCaptor.forClass(AuthIdentity.class);
        verify(authIdentityRepository).save(captor.capture());
        assertEquals("FACEBOOK", captor.getValue().getProvider());
        assertEquals("fb-sub-1", captor.getValue().getProviderSubject());
        assertEquals(410, captor.getValue().getUser().getUserId());
        assertTrue(otp.isConsumed(), "the OTP must be consumed once");
    }
}

