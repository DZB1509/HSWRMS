package com.heavenstay.hswrms.m1identity.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.LoginRequest;
import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.dto.RegisterRequest;
import com.heavenstay.hswrms.m1identity.dto.RegisterResponse;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailRequest;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailResponse;
import com.heavenstay.hswrms.m1identity.entity.*;
import com.heavenstay.hswrms.m1identity.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.PessimisticLockingFailureException;
import org.springframework.data.domain.Limit;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.authentication.BadCredentialsException;
import com.heavenstay.hswrms.security.JwtTokenProvider;
import java.util.List;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private RoleRepository roleRepository;
    @Mock private UserRoleRepository userRoleRepository;
    @Mock private CustomerProfileRepository customerProfileRepository;
    @Mock private ConsentRecordRepository consentRecordRepository;
    @Mock private EmailOtpRepository emailOtpRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private EmailDeliveryAdapter emailDeliveryAdapter;
    @Mock private JwtTokenProvider jwtTokenProvider;
    @Mock private AccountLockoutService accountLockoutService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new RegisterRequest();
        validRequest.setFullName("Jane Doe");
        validRequest.setEmail("jane@example.com");
        validRequest.setPassword("securepass");
        validRequest.setConfirmPassword("securepass");
        validRequest.setConsent(true);
    }

    @Test
    void testRegister_Success_SavesAllEntitiesWithHashedCredentialsAndOtp() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);

        // Deterministic test encoder stub: prefix inputs with "enc_"
        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "enc_" + invocation.getArgument(0));

        Role role = new Role("Customer", "Desc");
        role.setRoleId(1);
        when(roleRepository.findByRoleNameIgnoreCase("Customer")).thenReturn(Optional.of(role));

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(205);
            return u;
        });

        RegisterResponse response = authService.registerGuest(validRequest);

        assertNotNull(response);
        assertEquals(205, response.getUserId());
        assertEquals("jane@example.com", response.getEmail());

        // 1. Verify saved User password is hashed with encoder output
        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();
        assertEquals("enc_securepass", capturedUser.getPasswordHash());
        assertNotEquals("securepass", capturedUser.getPasswordHash());

        // 2. Capture raw OTP from email adapter and verify EmailOtp storage
        ArgumentCaptor<String> rawOtpCaptor = ArgumentCaptor.forClass(String.class);
        verify(emailDeliveryAdapter).sendVerificationOtp(eq("jane@example.com"), rawOtpCaptor.capture());
        String capturedRawOtp = rawOtpCaptor.getValue();
        assertNotNull(capturedRawOtp);
        assertEquals(6, capturedRawOtp.length());

        ArgumentCaptor<EmailOtp> emailOtpCaptor = ArgumentCaptor.forClass(EmailOtp.class);
        verify(emailOtpRepository).save(emailOtpCaptor.capture());
        EmailOtp capturedEmailOtp = emailOtpCaptor.getValue();

        // Verify raw OTP is NOT stored and otpHash matches encoder output for that exact raw OTP
        assertNotEquals(capturedRawOtp, capturedEmailOtp.getOtpHash());
        assertEquals("enc_" + capturedRawOtp, capturedEmailOtp.getOtpHash());

        // 3. Verify association saves
        verify(userRoleRepository).save(any(UserRole.class));
        verify(customerProfileRepository).save(any(CustomerProfile.class));
    }

    @Test
    void testRegister_Success_PersistsToServiceConsentRecord() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenAnswer(invocation -> "enc_" + invocation.getArgument(0));

        Role role = new Role("Customer", "Desc");
        role.setRoleId(1);
        when(roleRepository.findByRoleNameIgnoreCase("Customer")).thenReturn(Optional.of(role));

        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setUserId(205);
            return u;
        });

        authService.registerGuest(validRequest);

        // Registration must persist a Terms-of-Service consent record (R9-B).
        ArgumentCaptor<ConsentRecord> consentCaptor = ArgumentCaptor.forClass(ConsentRecord.class);
        verify(consentRecordRepository).save(consentCaptor.capture());
        ConsentRecord savedConsent = consentCaptor.getValue();

        assertEquals("TO_SERVICE", savedConsent.getConsentType());
        assertEquals("v1.0", savedConsent.getPolicyVersion());
        assertEquals("GRANTED", savedConsent.getConsentStatus());

        // The consent must reference the exact user created by this registration.
        assertNotNull(savedConsent.getUser());
        assertEquals(205, savedConsent.getUser().getUserId());
        assertEquals("jane@example.com", savedConsent.getUser().getEmail());
    }

    @Test
    void testRegister_DuplicateEmail_ThrowsConflictException() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

        assertThrows(ConflictException.class, () -> authService.registerGuest(validRequest));
        verify(userRepository, never()).save(any(User.class));
        verify(emailDeliveryAdapter, never()).sendVerificationOtp(anyString(), anyString());
    }
    private VerifyEmailRequest verifyRequest(String email, String otp) {
        VerifyEmailRequest r = new VerifyEmailRequest();
        r.setEmail(email);
        r.setOtp(otp);
        return r;
    }

    private User pendingUser() {
        User u = new User("Jane Doe", "jane@example.com", "enc_securepass");
        u.setUserId(205);
        u.setAccountStatus("PENDING");
        u.setEmailVerified(false);
        return u;
    }

    private EmailOtp liveOtp(User user) {
        EmailOtp o = new EmailOtp(user, "enc_123456", "EMAIL_VERIFICATION", Instant.now().plus(10, ChronoUnit.MINUTES));
        o.setOtpId(7);
        o.setAttemptCount(0);
        o.setConsumed(false);
        return o;
    }

    @Test
    void testVerifyEmail_Success_ConsumesOtpAndActivatesPendingAccount() {
        User user = pendingUser();
        EmailOtp otp = liveOtp(user);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(205), eq("EMAIL_VERIFICATION"), eq(Limit.of(1)))).thenReturn(Optional.of(otp));
        when(passwordEncoder.matches("123456", "enc_123456")).thenReturn(true);

        VerifyEmailResponse response = authService.verifyEmail(verifyRequest("Jane@Example.com", "123456"));

        assertNotNull(response);
        assertEquals(205, response.getUserId());
        assertTrue(response.isEmailVerified());
        assertEquals("ACTIVE", response.getAccountStatus());
        assertTrue(otp.isConsumed());
        assertNotNull(otp.getConsumedAt());
        assertTrue(user.isEmailVerified());
        assertEquals("ACTIVE", user.getAccountStatus());
        verify(emailOtpRepository).save(otp);
        verify(userRepository).save(user);
    }

    @Test
    void testVerifyEmail_WrongOtp_IncrementsAttemptAndThrowsInvalid() {
        User user = pendingUser();
        EmailOtp otp = liveOtp(user);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(205), eq("EMAIL_VERIFICATION"), eq(Limit.of(1)))).thenReturn(Optional.of(otp));
        when(passwordEncoder.matches("000000", "enc_123456")).thenReturn(false);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> authService.verifyEmail(verifyRequest("jane@example.com", "000000")));
        assertEquals("OTP_INVALID", ex.getErrorCode());
        assertEquals(1, otp.getAttemptCount());
        verify(emailOtpRepository).saveAndFlush(otp);
        assertFalse(user.isEmailVerified());
        assertEquals("PENDING", user.getAccountStatus());
    }

    @Test
    void testVerifyEmail_ExpiredOtp_ThrowsExpired() {
        User user = pendingUser();
        EmailOtp otp = liveOtp(user);
        otp.setExpiresAt(Instant.now().minus(1, ChronoUnit.MINUTES));
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(205), eq("EMAIL_VERIFICATION"), eq(Limit.of(1)))).thenReturn(Optional.of(otp));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> authService.verifyEmail(verifyRequest("jane@example.com", "123456")));
        assertEquals("OTP_EXPIRED", ex.getErrorCode());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void testVerifyEmail_NoPendingOtp_ThrowsNotFound() {
        User user = pendingUser();
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(205), eq("EMAIL_VERIFICATION"), eq(Limit.of(1)))).thenReturn(Optional.empty());

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> authService.verifyEmail(verifyRequest("jane@example.com", "123456")));
        assertEquals("OTP_NOT_FOUND", ex.getErrorCode());
    }

    @Test
    void testVerifyEmail_UnknownEmail_ThrowsNotFound() {
        when(userRepository.findByEmail("ghost@example.com")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> authService.verifyEmail(verifyRequest("ghost@example.com", "123456")));
        verify(emailOtpRepository, never()).findLatestUnconsumedOtpForUpdate(any(), anyString(), any());
    }

    @Test
    void testVerifyEmail_AttemptsExhausted_ThrowsWithoutMatching() {
        User user = pendingUser();
        EmailOtp otp = liveOtp(user);
        otp.setAttemptCount(5);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(205), eq("EMAIL_VERIFICATION"), eq(Limit.of(1)))).thenReturn(Optional.of(otp));

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> authService.verifyEmail(verifyRequest("jane@example.com", "123456")));
        assertEquals("OTP_ATTEMPTS_EXCEEDED", ex.getErrorCode());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    void testVerifyEmail_AlreadyVerified_ReturnsIdempotentSuccess() {
        User user = pendingUser();
        user.setEmailVerified(true);
        user.setAccountStatus("ACTIVE");
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));

        VerifyEmailResponse response = authService.verifyEmail(verifyRequest("jane@example.com", "123456"));

        assertTrue(response.isEmailVerified());
        assertEquals("ACTIVE", response.getAccountStatus());
        verify(emailOtpRepository, never()).findLatestUnconsumedOtpForUpdate(any(), anyString(), any());
    }

    @Test
    void testVerifyEmail_LockedAccount_KeepsLockedStatus() {
        User user = pendingUser();
        user.setAccountStatus("LOCKED");
        EmailOtp otp = liveOtp(user);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(205), eq("EMAIL_VERIFICATION"), eq(Limit.of(1)))).thenReturn(Optional.of(otp));
        when(passwordEncoder.matches("123456", "enc_123456")).thenReturn(true);

        VerifyEmailResponse response = authService.verifyEmail(verifyRequest("jane@example.com", "123456"));

        assertTrue(response.isEmailVerified());
        assertEquals("LOCKED", response.getAccountStatus());
        assertTrue(otp.isConsumed());
    }

    @Test
    void testVerifyEmail_LockedOtpLookup_RequestsAtMostOneRow() {
        User user = pendingUser();
        EmailOtp otp = liveOtp(user);
        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(eq(205), eq("EMAIL_VERIFICATION"), any())).thenReturn(Optional.of(otp));
        when(passwordEncoder.matches("123456", "enc_123456")).thenReturn(true);

        authService.verifyEmail(verifyRequest("jane@example.com", "123456"));

        // Query-limit contract: the production call site must request at most one row.
        ArgumentCaptor<Limit> limitCaptor = ArgumentCaptor.forClass(Limit.class);
        verify(emailOtpRepository).findLatestUnconsumedOtpForUpdate(eq(205), eq("EMAIL_VERIFICATION"), limitCaptor.capture());
        assertEquals(1, limitCaptor.getValue().max(), "Locked OTP lookup must request a maximum of one row (Limit.of(1))");
    }

    private LoginRequest loginRequest(String email, String password) {
        LoginRequest r = new LoginRequest();
        r.setEmail(email);
        r.setPassword(password);
        return r;
    }

    private User activeVerifiedUserWithCustomerRole() {
        User u = new User("Jane Doe", "jane@example.com", "enc_securepass");
        u.setUserId(205);
        u.setAccountStatus("ACTIVE");
        u.setEmailVerified(true);
        Role role = new Role("Customer", "Canonical resort customer role");
        role.setRoleId(1);
        u.getUserRoles().add(new UserRole(u, role));
        return u;
    }

    @Test
    void testLogin_Success_IssuesTokenWithNormalizedEmailAndRoles() {
        User user = activeVerifiedUserWithCustomerRole();
        when(userRepository.findByEmailWithRoles("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("securepass", "enc_securepass")).thenReturn(true);
        when(jwtTokenProvider.generateToken(eq(205), eq("jane@example.com"), eq("Jane Doe"), eq(List.of("Customer")))).thenReturn("signed.jwt.token");
        when(jwtTokenProvider.getExpirationMs()).thenReturn(86400000L);

        // Input deliberately messy: whitespace + mixed case must be normalized like register does.
        LoginResponse response = authService.login(loginRequest("  Jane@Example.COM  ", "securepass"));

        assertNotNull(response);
        assertEquals("signed.jwt.token", response.getToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(86400000L, response.getExpiresInMs());
        assertEquals(205, response.getUserId());
        assertEquals("jane@example.com", response.getEmail());
        assertEquals("Jane Doe", response.getFullName());
        assertEquals(List.of("Customer"), response.getRoles());
        assertEquals("ACTIVE", response.getAccountStatus());
        verify(jwtTokenProvider).generateToken(eq(205), eq("jane@example.com"), eq("Jane Doe"), eq(List.of("Customer")));
        verify(accountLockoutService).recordSuccessfulLogin(205);
    }

    @Test
    void testLogin_UnknownEmail_ThrowsSameGenericBadCredentials() {
        when(userRepository.findByEmailWithRoles("ghost@example.com")).thenReturn(Optional.empty());

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.login(loginRequest("Ghost@Example.com", "whatever")));

        assertEquals("Invalid email or password.", ex.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
        verifyNoInteractions(jwtTokenProvider);
        verifyNoInteractions(accountLockoutService);
    }

    @Test
    void testLogin_WrongPassword_ThrowsSameGenericBadCredentials() {
        User user = activeVerifiedUserWithCustomerRole();
        when(userRepository.findByEmailWithRoles("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("wrong-password", "enc_securepass")).thenReturn(false);

        BadCredentialsException ex = assertThrows(BadCredentialsException.class,
                () -> authService.login(loginRequest("jane@example.com", "wrong-password")));

        assertEquals("Invalid email or password.", ex.getMessage());
        verifyNoInteractions(jwtTokenProvider);
        verify(accountLockoutService).recordFailedAttempt(205);
    }

    @Test
    void testLogin_CorrectPasswordUnverifiedEmail_ThrowsEmailNotVerified() {
        User user = activeVerifiedUserWithCustomerRole();
        user.setEmailVerified(false);
        user.setAccountStatus("PENDING");
        when(userRepository.findByEmailWithRoles("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("securepass", "enc_securepass")).thenReturn(true);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> authService.login(loginRequest("jane@example.com", "securepass")));

        assertEquals("EMAIL_NOT_VERIFIED", ex.getErrorCode());
        verifyNoInteractions(jwtTokenProvider);
    }

    @Test
    void testLogin_CorrectPasswordNonActiveAccount_ThrowsAccountNotActive() {
        User user = activeVerifiedUserWithCustomerRole();
        user.setAccountStatus("LOCKED");
        when(userRepository.findByEmailWithRoles("jane@example.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("securepass", "enc_securepass")).thenReturn(true);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> authService.login(loginRequest("jane@example.com", "securepass")));

        assertEquals("ACCOUNT_NOT_ACTIVE", ex.getErrorCode());
        verifyNoInteractions(jwtTokenProvider);
    }
}