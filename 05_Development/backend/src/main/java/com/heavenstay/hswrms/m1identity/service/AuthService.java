package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.LoginRequest;
import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.dto.RegisterRequest;
import com.heavenstay.hswrms.m1identity.dto.RegisterResponse;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Limit;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final ConsentRecordRepository consentRecordRepository;
    private final EmailOtpRepository emailOtpRepository;
    private final AuthIdentityRepository authIdentityRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailDeliveryAdapter emailDeliveryAdapter;
    private final JwtTokenProvider jwtTokenProvider;
    private final SsoTicketService ssoTicketService;
    private final AccountLockoutService accountLockoutService;

    private static final String EMAIL_VERIFICATION_PURPOSE = "EMAIL_VERIFICATION";
    private static final int MAX_OTP_ATTEMPTS = 5;

    /** Provisional ToS policy version persisted at registration (R9-B). */
    static final String TOS_CONSENT_TYPE = "TO_SERVICE";
    static final String TOS_POLICY_VERSION = "v1.0";

    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       UserRoleRepository userRoleRepository, CustomerProfileRepository customerProfileRepository,
                       ConsentRecordRepository consentRecordRepository,
                       EmailOtpRepository emailOtpRepository, AuthIdentityRepository authIdentityRepository,
                       PasswordEncoder passwordEncoder,
                       EmailDeliveryAdapter emailDeliveryAdapter, JwtTokenProvider jwtTokenProvider,
                       SsoTicketService ssoTicketService) {
        this(userRepository, roleRepository, userRoleRepository, customerProfileRepository,
                consentRecordRepository, emailOtpRepository, authIdentityRepository,
                passwordEncoder, emailDeliveryAdapter, jwtTokenProvider, ssoTicketService, null);
    }

    @org.springframework.beans.factory.annotation.Autowired
    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       UserRoleRepository userRoleRepository, CustomerProfileRepository customerProfileRepository,
                       ConsentRecordRepository consentRecordRepository,
                       EmailOtpRepository emailOtpRepository, AuthIdentityRepository authIdentityRepository,
                       PasswordEncoder passwordEncoder,
                       EmailDeliveryAdapter emailDeliveryAdapter, JwtTokenProvider jwtTokenProvider,
                       SsoTicketService ssoTicketService,
                       @org.springframework.beans.factory.annotation.Autowired(required = false) AccountLockoutService accountLockoutService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.consentRecordRepository = consentRecordRepository;
        this.emailOtpRepository = emailOtpRepository;
        this.authIdentityRepository = authIdentityRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailDeliveryAdapter = emailDeliveryAdapter;
        this.jwtTokenProvider = jwtTokenProvider;
        this.ssoTicketService = ssoTicketService;
        this.accountLockoutService = accountLockoutService;
    }

    @Transactional
    public RegisterResponse registerGuest(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("EMAIL_EXISTS", "The email address is already registered.");
        }

        // 1. Create Base User Account
        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPhoneNumber(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setAccountStatus("PENDING");
        user.setEmailVerified(false);
        user = userRepository.save(user); // Force persistence to obtain generated User ID for composite key

        // 2. Assign Canonical CUSTOMER Role
        Role role = roleRepository.findByRoleNameIgnoreCase("Customer")
                .orElseThrow(() -> new BusinessRuleException("ROLE_NOT_FOUND", "System configuration error: Customer role is missing."));

        UserRole userRole = new UserRole(user, role);
        userRoleRepository.save(userRole);

        // 3. Initialize Customer Profile
        CustomerProfile profile = new CustomerProfile(user);
        customerProfileRepository.save(profile);

        // 4. Persist Terms-of-Service consent (R9-B: registration persists TO_SERVICE consent)
        ConsentRecord tosConsent = new ConsentRecord(user, TOS_CONSENT_TYPE, TOS_POLICY_VERSION);
        consentRecordRepository.save(tosConsent);

        // 5. Generate & Store OTP Securely
        String rawOtp = String.format("%06d", secureRandom.nextInt(1000000));
        String otpHash = passwordEncoder.encode(rawOtp);
        Instant expiresAt = Instant.now().plus(10, ChronoUnit.MINUTES);

        EmailOtp emailOtp = new EmailOtp(user, otpHash, "EMAIL_VERIFICATION", expiresAt);
        emailOtpRepository.save(emailOtp);

        // 5. Dispatch Verification Email (Will abort transaction if not in Dev profile)
        emailDeliveryAdapter.sendVerificationOtp(email, rawOtp);

        return new RegisterResponse(user.getUserId(), user.getEmail(), "Registration successful. OTP dispatched.");
    }

    /**
     * Google SSO registration completion (FR-M1-05 case 3).
     *
     * <p>Runs only when the user submits the existing registration form with a valid
     * REGISTRATION ticket that was created at the OAuth callback from server-validated
     * provider claims. The email is taken from the ticket — never from the request —
     * so the client cannot claim a different email or provider subject. Google's
     * verified email replaces the OTP step: the account is created ACTIVE and
     * email-verified. A password is optional; SSO-only accounts keep
     * {@code password_hash = NULL}. ToS consent is recorded here (and only here),
     * and sensitive health-data consent remains a separate, later step.</p>
     */
    @Transactional
    public LoginResponse registerWithSso(SsoRegisterRequest request) {
        // Single-use consumption: a ticket can never complete two registrations,
        // and every failure below requires restarting the (cheap) Google flow.
        SsoTicket ticket = ssoTicketService.consume(request.getSsoTicket(), SsoTicketPurpose.REGISTRATION);
        if (!ticket.emailVerified()) {
            throw new SsoRejectedException("SSO_EMAIL_NOT_VERIFIED",
                    "The provider did not verify the email address for this account.");
        }

        String email = ticket.email().trim().toLowerCase();

        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("EMAIL_EXISTS", "The email address is already registered.");
        }

        String passwordHash = null;
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            if (request.getPassword().length() < 8) {
                throw new BusinessRuleException("PASSWORD_TOO_SHORT",
                        "Password must be at least 8 characters long.");
            }
            passwordHash = passwordEncoder.encode(request.getPassword());
        }

        // 1. Create the base user account — verified/active because the provider
        //    already verified the email (owner-approved policy for Google SSO).
        User user = new User();
        user.setFullName(request.getFullName().trim());
        user.setEmail(email);
        user.setPhoneNumber(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null);
        user.setPasswordHash(passwordHash);
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        try {
            user = userRepository.save(user);
        } catch (DataIntegrityViolationException ex) {
            // B6: concurrent registration with the same email is a controlled conflict.
            throw new ConflictException("EMAIL_EXISTS", "The email address is already registered.");
        }

        // 2. Assign canonical CUSTOMER role
        Role role = roleRepository.findByRoleNameIgnoreCase("Customer")
                .orElseThrow(() -> new BusinessRuleException("ROLE_NOT_FOUND", "System configuration error: Customer role is missing."));
        userRoleRepository.save(new UserRole(user, role));

        // 3. Initialize Customer profile
        customerProfileRepository.save(new CustomerProfile(user));

        // 4. Persist ToS consent — recorded only because the user affirmatively
        //    submitted the registration form (explicit consent checkbox required).
        consentRecordRepository.save(new ConsentRecord(user, TOS_CONSENT_TYPE, TOS_POLICY_VERSION));

        // 5. Bind the Google identity to the new account.
        authIdentityRepository.save(new AuthIdentity(user, ticket.provider(), ticket.providerSubject()));

        // 6. Sign the user in with the standard JWT/login response.
        List<String> roles = List.of(role.getRoleName());
        String token = jwtTokenProvider.generateToken(user.getUserId(), user.getEmail(), user.getFullName(), roles);
        return new LoginResponse(token, "Bearer", jwtTokenProvider.getExpirationMs(),
                user.getUserId(), user.getEmail(), user.getFullName(), roles, user.getAccountStatus());
    }
    /**
     * Email/password login issuing a JWT on success.
     * Contract: unknown email and wrong password both yield the same generic
     * BadCredentialsException (mapped by GlobalExceptionHandler to 401 UNAUTHORIZED).
     * Correct password but unverified email -> 400 EMAIL_NOT_VERIFIED.
     * Correct password but non-ACTIVE account -> 400 ACCOUNT_NOT_ACTIVE.
     */
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        User user = userRepository.findByEmailWithRoles(email)
                .orElseThrow(() -> new BadCredentialsException("Invalid email or password."));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            if (accountLockoutService != null && !"LOCKED".equalsIgnoreCase(user.getAccountStatus())) {
                accountLockoutService.recordFailedAttempt(user.getUserId());
            }
            throw new BadCredentialsException("Invalid email or password.");
        }

        if ("LOCKED".equalsIgnoreCase(user.getAccountStatus())) {
            int lockoutMinutes = accountLockoutService != null ? accountLockoutService.getLockoutDurationMinutes() : 10;
            Instant now = Instant.now();
            if (user.getLockedAt() != null && user.getLockedAt().plus(java.time.Duration.ofMinutes(lockoutMinutes)).isBefore(now)) {
                if (accountLockoutService != null) {
                    accountLockoutService.unlockAccount(user.getUserId());
                }
                user.setAccountStatus("ACTIVE");
                user.setFailedLoginCount(0);
                user.setLockedAt(null);
            } else {
                throw new BusinessRuleException("ACCOUNT_NOT_ACTIVE",
                        "Account is locked due to too many failed sign-in attempts. Please try again later or contact resort support.");
            }
        }

        if (!user.isEmailVerified()) {
            throw new BusinessRuleException("EMAIL_NOT_VERIFIED",
                    "Email address has not been verified. Please verify your email before logging in.");
        }

        if (!"ACTIVE".equals(user.getAccountStatus())) {
            throw new BusinessRuleException("ACCOUNT_NOT_ACTIVE",
                    "Account is not active. Please contact resort support.");
        }

        if (accountLockoutService != null) {
            accountLockoutService.recordSuccessfulLogin(user.getUserId());
        }

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

    @Transactional(noRollbackFor = BusinessRuleException.class)
    public VerifyEmailResponse verifyEmail(VerifyEmailRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String rawOtp = request.getOtp().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResourceNotFoundException("User", "email", email));

        if (user.isEmailVerified()) {
            return new VerifyEmailResponse(user.getUserId(), user.getEmail(), true, user.getAccountStatus());
        }

        EmailOtp otp = emailOtpRepository.findLatestUnconsumedOtpForUpdate(user.getUserId(), EMAIL_VERIFICATION_PURPOSE, Limit.of(1))
                .orElseThrow(() -> new BusinessRuleException("OTP_NOT_FOUND", "No pending verification code found for this account."));

        if (otp.isConsumed()) {
            throw new BusinessRuleException("OTP_CONSUMED", "This verification code has already been used.");
        }

        if (otp.isExpired()) {
            throw new BusinessRuleException("OTP_EXPIRED", "This verification code has expired.");
        }

        if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
            throw new BusinessRuleException("OTP_ATTEMPTS_EXCEEDED", "Too many incorrect attempts. Please request a new verification code.");
        }

        if (!passwordEncoder.matches(rawOtp, otp.getOtpHash())) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            emailOtpRepository.saveAndFlush(otp);
            throw new BusinessRuleException("OTP_INVALID", "Invalid verification code.");
        }

        otp.setConsumed(true);
        otp.setConsumedAt(Instant.now());
        emailOtpRepository.save(otp);

        user.setEmailVerified(true);
        if ("PENDING".equals(user.getAccountStatus())) {
            user.setAccountStatus("ACTIVE");
        }
        userRepository.save(user);

        return new VerifyEmailResponse(user.getUserId(), user.getEmail(), true, user.getAccountStatus());
    }}