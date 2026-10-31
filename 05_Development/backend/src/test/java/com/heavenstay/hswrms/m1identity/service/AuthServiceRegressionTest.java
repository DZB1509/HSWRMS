package com.heavenstay.hswrms.m1identity.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.m1identity.dto.RegisterRequest;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailRequest;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailResponse;
import com.heavenstay.hswrms.m1identity.entity.*;
import com.heavenstay.hswrms.m1identity.repository.*;
import com.heavenstay.hswrms.m1identity.sso.SsoTicketService;
import com.heavenstay.hswrms.security.JwtTokenProvider;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Limit;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Optional;

/**
 * Focused regression tests for Tasks 2 and 3 of the M1 backend-fixes batch.
 *
 * <h2>Task 2 — Duplicate-registration race (Finding B)</h2>
 * <p>Verifies that {@code AuthService.registerGuest} translates a
 * {@link DataIntegrityViolationException} whose message contains the constraint name
 * {@code UQ_User_Email} into a {@link ConflictException} with code {@code EMAIL_EXISTS},
 * and that unrelated constraint violations are re-thrown unmodified.</p>
 *
 * <h2>Task 3 — OTP A/B sequential behavior (Finding C)</h2>
 * <p>Documents the selection behavior of {@code findLatestUnconsumedOtpForUpdate}:
 * when OTP B is issued after OTP A, submitting the OTP A value is rejected (the
 * query returns OTP B whose hash does not match). Verifies that when a new OTP is
 * issued, {@code invalidatePreviousOtps} is called before the new record is saved,
 * so any lingering unconsumed OTP from a prior session is invalidated immediately.</p>
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceRegressionTest {

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

    // ─────────────────────────────────────────────────────────────────────────
    // Task 2: Duplicate registration concurrent race
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Task 2: UQ_User_Email constraint violation on save → EMAIL_EXISTS ConflictException (409)")
    void registerGuest_constraintViolationWithEmailConstraint_throwsEmailExistsConflict() {
        // Simulate: existsByEmail returns false (fast check passes), but the DB
        // rejects the INSERT with a UQ_User_Email constraint violation.
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");

        DataIntegrityViolationException constraintEx = new DataIntegrityViolationException(
                "could not execute statement; SQL [n/a]; constraint [UQ_User_Email]");
        when(userRepository.save(any(User.class))).thenThrow(constraintEx);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> authService.registerGuest(validRequest));

        assertEquals("EMAIL_EXISTS", ex.getConflictCode(),
                "UQ_User_Email constraint violation must produce EMAIL_EXISTS conflict code");
        // No OTP or email should have been sent for the losing request
        verifyNoInteractions(emailDeliveryAdapter);
    }

    @Test
    @DisplayName("Task 2: Unrelated DB constraint violation on save → re-thrown unchanged (not EMAIL_EXISTS)")
    void registerGuest_unrelatedConstraintViolation_rethrowsOriginalException() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed");

        DataIntegrityViolationException unrelatedEx = new DataIntegrityViolationException(
                "constraint [FK_SomeOtherTable]");
        when(userRepository.save(any(User.class))).thenThrow(unrelatedEx);

        // Should NOT be converted to EMAIL_EXISTS; must propagate as-is
        DataIntegrityViolationException actual = assertThrows(DataIntegrityViolationException.class,
                () -> authService.registerGuest(validRequest));

        assertSame(unrelatedEx, actual,
                "Non-email constraint violations must not be misclassified as EMAIL_EXISTS");
    }

    @Test
    @DisplayName("Task 2: Normal duplicate (existsByEmail fast path) → EMAIL_EXISTS without touching save")
    void registerGuest_normalDuplicateEmail_throwsConflictBeforeSave() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(true);

        ConflictException ex = assertThrows(ConflictException.class,
                () -> authService.registerGuest(validRequest));

        assertEquals("EMAIL_EXISTS", ex.getConflictCode());
        verify(userRepository, never()).save(any(User.class));
        verifyNoInteractions(emailDeliveryAdapter);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Task 3: OTP A/B sequential behavior
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Proves the selection contract: when OTP B is the latest unconsumed code,
     * submitting the OTP A value (whose hash is different from OTP B's hash)
     * yields OTP_INVALID — old OTP A cannot accidentally verify the account.
     *
     * <p>This is the behavior produced by the existing {@code findLatestUnconsumedOtpForUpdate}
     * query which always returns the most recently created unconsumed record.
     */
    @Test
    @DisplayName("Task 3: Submitting old OTP-A value when OTP-B is latest yields OTP_INVALID")
    void verifyEmail_oldOtpAValueWhileOtpBIsLatest_returnsOtpInvalid() {
        User user = new User("Jane Doe", "jane@example.com", "enc_pass");
        user.setUserId(205);
        user.setAccountStatus("PENDING");
        user.setEmailVerified(false);

        // OTP B is the latest unconsumed — the repository returns this one.
        EmailOtp otpB = new EmailOtp(user, "enc_OTP_B", "EMAIL_VERIFICATION",
                Instant.now().plus(10, ChronoUnit.MINUTES));
        otpB.setOtpId(20);
        otpB.setAttemptCount(0);
        otpB.setConsumed(false);

        when(userRepository.findByEmail("jane@example.com")).thenReturn(Optional.of(user));
        when(emailOtpRepository.findLatestUnconsumedOtpForUpdate(
                eq(205), eq("EMAIL_VERIFICATION"), eq(Limit.of(1))))
                .thenReturn(Optional.of(otpB));
        // Submitting OTP-A's raw value against OTP-B's hash does not match
        when(passwordEncoder.matches("111111", "enc_OTP_B")).thenReturn(false);

        VerifyEmailRequest req = new VerifyEmailRequest();
        req.setEmail("jane@example.com");
        req.setOtp("111111"); // OTP-A's value

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> authService.verifyEmail(req));

        assertEquals("OTP_INVALID", ex.getErrorCode(),
                "Submitting old OTP-A value when OTP-B is selected must yield OTP_INVALID");
        assertEquals(1, otpB.getAttemptCount(),
                "Failed attempt must increment the active OTP's attempt counter");
    }

    /**
     * Proves that when a new OTP is issued via {@code registerGuest},
     * {@code invalidatePreviousOtps} is called for that user before the new
     * OTP record is saved — so any lingering unconsumed OTP from a prior
     * incomplete registration is consumed immediately.
     */
    @Test
    @DisplayName("Task 3: Issuing a new OTP via registerGuest calls invalidatePreviousOtps before saving new record")
    void registerGuest_issuingNewOtp_callsInvalidatePreviousOtpsFirst() {
        when(userRepository.existsByEmail("jane@example.com")).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenAnswer(inv -> "enc_" + inv.getArgument(0));

        Role role = new Role("Customer", "Desc");
        role.setRoleId(1);
        when(roleRepository.findByRoleNameIgnoreCase("Customer")).thenReturn(Optional.of(role));

        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setUserId(205);
            return u;
        });
        // Allow invalidatePreviousOtps to execute without error
        when(emailOtpRepository.invalidatePreviousOtps(eq(205), eq("EMAIL_VERIFICATION"), any(Instant.class)))
                .thenReturn(1);

        authService.registerGuest(validRequest);

        // Verify call order: invalidate must happen before the new OTP save
        var inOrder = inOrder(emailOtpRepository);
        inOrder.verify(emailOtpRepository).invalidatePreviousOtps(
                eq(205), eq("EMAIL_VERIFICATION"), any(Instant.class));
        inOrder.verify(emailOtpRepository).save(any(EmailOtp.class));
    }
}
