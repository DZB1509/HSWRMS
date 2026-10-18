package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.dto.SsoRegisterRequest;
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
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * Tests for the Google SSO registration completion path: the account (User +
 * Customer role + profile + ToS consent + AuthIdentity) is created only at form
 * submission, without a password and without the OTP flow; the user is then
 * signed in with the standard JWT login response.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceSsoRegisterTest {

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
    private SsoTicket registrationTicket;

    @BeforeEach
    void setUp() {
        request = new SsoRegisterRequest();
        request.setSsoTicket("ticket-1");
        request.setFullName("Jane Doe");
        request.setConsent(true);

        registrationTicket = new SsoTicket(SsoTicketPurpose.REGISTRATION, "GOOGLE", "sub-9",
                null, "jane@example.com", true, "Jane Doe", Instant.now().plusSeconds(600));
    }

    private void stubHappyPathRoleAndUser() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(410);
            return u;
        });
        Role role = new Role("Customer", "Customer role");
        role.setRoleId(1);
        when(roleRepository.findByRoleNameIgnoreCase("Customer")).thenReturn(Optional.of(role));
    }

    @Test
    @DisplayName("Criterion 3+9+10: valid SSO registration creates User (verified/ACTIVE, no password), Customer role, profile, ToS consent and AuthIdentity, then issues the standard JWT")
    void ssoRegistration_createsVerifiedActiveAccountWithIdentityAndTosConsent_withoutPasswordOrOtp() {
        when(ssoTicketService.consume("ticket-1", SsoTicketPurpose.REGISTRATION)).thenReturn(registrationTicket);
        stubHappyPathRoleAndUser();
        when(jwtTokenProvider.generateToken(410, "jane@example.com", "Jane Doe", List.of("Customer")))
                .thenReturn("signed.jwt.token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86_400_000L);

        LoginResponse response = authService.registerWithSso(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertEquals("jane@example.com", saved.getEmail());
        assertEquals("Jane Doe", saved.getFullName());
        assertNull(saved.getPasswordHash(), "SSO-only account must keep password_hash NULL");
        assertTrue(saved.isEmailVerified(), "provider-verified email replaces the OTP step");
        assertEquals("ACTIVE", saved.getAccountStatus());

        verify(userRoleRepository).save(any(UserRole.class));
        verify(customerProfileRepository).save(any(CustomerProfile.class));

        ArgumentCaptor<ConsentRecord> consentCaptor = ArgumentCaptor.forClass(ConsentRecord.class);
        verify(consentRecordRepository).save(consentCaptor.capture());
        assertEquals("TO_SERVICE", consentCaptor.getValue().getConsentType());
        assertEquals("GRANTED", consentCaptor.getValue().getConsentStatus());

        ArgumentCaptor<AuthIdentity> identityCaptor = ArgumentCaptor.forClass(AuthIdentity.class);
        verify(authIdentityRepository).save(identityCaptor.capture());
        assertEquals("GOOGLE", identityCaptor.getValue().getProvider());
        assertEquals("sub-9", identityCaptor.getValue().getProviderSubject());

        // SSO registration must not run the email/password OTP machinery.
        verify(emailOtpRepository, never()).save(any(EmailOtp.class));
        verify(emailDeliveryAdapter, never()).sendVerificationOtp(anyString(), anyString());

        assertEquals("signed.jwt.token", response.getToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(410, response.getUserId());
        assertEquals(List.of("Customer"), response.getRoles());
        assertEquals("ACTIVE", response.getAccountStatus());
    }

    @Test
    @DisplayName("Criterion 9: an optional password is accepted and stored hashed")
    void ssoRegistration_withOptionalPassword_hashesIt() {
        request.setPassword("supersecret");
        when(ssoTicketService.consume("ticket-1", SsoTicketPurpose.REGISTRATION)).thenReturn(registrationTicket);
        stubHappyPathRoleAndUser();
        when(passwordEncoder.encode("supersecret")).thenReturn("enc_supersecret");
        when(jwtTokenProvider.generateToken(any(), anyString(), anyString(), any())).thenReturn("signed.jwt.token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86_400_000L);

        authService.registerWithSso(request);

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        assertEquals("enc_supersecret", userCaptor.getValue().getPasswordHash());
    }

    @Test
    @DisplayName("A provided password shorter than 8 characters is a controlled error")
    void ssoRegistration_shortPassword_rejected() {
        request.setPassword("short");
        when(ssoTicketService.consume("ticket-1", SsoTicketPurpose.REGISTRATION)).thenReturn(registrationTicket);
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> authService.registerWithSso(request));

        assertEquals("PASSWORD_TOO_SHORT", ex.getErrorCode());
        verify(userRepository, never()).save(any(User.class));
        verify(consentRecordRepository, never()).save(any(ConsentRecord.class));
    }

    @Test
    @DisplayName("Criterion B7: a duplicate email at submission is a controlled 409 conflict, not a server error")
    void ssoRegistration_duplicateEmail_isControlledConflict() {
        when(ssoTicketService.consume("ticket-1", SsoTicketPurpose.REGISTRATION)).thenReturn(registrationTicket);
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.registerWithSso(request));

        verify(userRepository, never()).save(any(User.class));
        verify(consentRecordRepository, never()).save(any(ConsentRecord.class));
        verify(authIdentityRepository, never()).save(any(AuthIdentity.class));
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    @DisplayName("A defensively-unverified registration ticket is rejected before anything is created")
    void ssoRegistration_unverifiedTicket_rejected() {
        SsoTicket unverified = new SsoTicket(SsoTicketPurpose.REGISTRATION, "GOOGLE", "sub-9",
                null, "jane@example.com", false, "Jane Doe", Instant.now().plusSeconds(600));
        when(ssoTicketService.consume("ticket-1", SsoTicketPurpose.REGISTRATION)).thenReturn(unverified);

        SsoRejectedException ex = assertThrows(SsoRejectedException.class,
                () -> authService.registerWithSso(request));

        assertEquals("SSO_EMAIL_NOT_VERIFIED", ex.getCode());
        verifyNoInteractions(userRepository, jwtTokenProvider, consentRecordRepository, authIdentityRepository);
    }
}
