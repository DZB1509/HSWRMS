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
import org.springframework.util.StringUtils;
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

    private static final String EMAIL_VERIFICATION_PURPOSE = "EMAIL_VERIFICATION";
    private static final int MAX_OTP_ATTEMPTS = 5;

    /** Provisional ToS policy version persisted at registration (R9-B). */
    static final String TOS_CONSENT_TYPE = "TO_SERVICE";
    static final String TOS_POLICY_VERSION = "v1.0";

    /** Role name that marks an account as eligible for SSO / Facebook linking. */
    private static final String CUSTOMER_ROLE = "customer";

    private final SecureRandom secureRandom = new SecureRandom();
    /**
     * Pending Facebook subjects awaiting OTP mailbox proof, keyed by user id.
     * Same tradeoff as the SSO ticket store: in-memory, single-instance, lost
     * on restart (user re-runs the cheap Facebook flow). No schema change.
     */
    private final java.util.concurrent.ConcurrentHashMap<Integer, String> pendingFacebookBindings =
            new java.util.concurrent.ConcurrentHashMap<>();

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       UserRoleRepository userRoleRepository, CustomerProfileRepository customerProfileRepository,
                       ConsentRecordRepository consentRecordRepository,
                       EmailOtpRepository emailOtpRepository, AuthIdentityRepository authIdentityRepository,
                       PasswordEncoder passwordEncoder,
                       EmailDeliveryAdapter emailDeliveryAdapter, JwtTokenProvider jwtTokenProvider,
                       SsoTicketService ssoTicketService) {
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
     * SSO registration completion (FR-M1-05 case 3: Google verified, Facebook
     * provider-seen).
     *
     * <p>Runs only when the user submits the existing registration form with a valid
     * REGISTRATION ticket that was created at the OAuth callback from server-validated
     * provider claims. The email is taken from the ticket — never from the request —
     * so the client cannot claim a different email or provider subject.</p>
     *
     * <ul>
     *   <li>Google ({@code emailVerified=true}): the verified email replaces the
     *       OTP step — ACTIVE + email-verified account, standard JWT sign-in.</li>
     *   <li>Facebook ({@code emailVerified=false}): Graph /me exposes no
     *       verification flag, so the account follows the email/password path —
     *       PENDING + unverified with an OTP to the ticket-bound address. The
     *       Facebook identity binds ONLY after OTP verification proves mailbox
     *       control. A password is mandatory for this path.</li>
     * </ul>
     */
    // noRollbackFor: the Facebook branch persists the PENDING user + OTP and then
    // signals SSO_OTP_REQUIRED to the client via SsoRejectedException — that signal
    // must commit the account/OTP rows, not roll them back. The earlier rejections
    // (missing/unverified email) happen before any write, so they are unaffected.
    @Transactional(noRollbackFor = SsoRejectedException.class)
    public LoginResponse registerWithSso(SsoRegisterRequest request) {
        // Single-use consumption: a ticket can never complete two registrations,
        // and every failure below requires restarting the (cheap) provider flow.
        SsoTicket ticket = ssoTicketService.consume(request.getSsoTicket(), SsoTicketPurpose.REGISTRATION);
        if (!StringUtils.hasText(ticket.email())) {
            throw new SsoRejectedException("SSO_EMAIL_NOT_VERIFIED",
                    "The provider did not supply an email address for this account.");
        }
        if (!ticket.emailVerified() && !"FACEBOOK".equalsIgnoreCase(ticket.provider())) {
            // Google (and any future verified provider) must assert verification.
            // Facebook is the only provider allowed through unverified, and it
            // takes the OTP path below.
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

        // Facebook path: provider-seen but unverified address → PENDING account +
        // OTP to the ticket-bound address. The Facebook identity binds ONLY after
        // OTP verification (see verifyEmail) proves mailbox control. No JWT here:
        // the SPA continues through the normal OTP screen.
        if (!ticket.emailVerified()) {
            if (passwordHash == null) {
                throw new BusinessRuleException("PASSWORD_REQUIRED",
                        "Please set a password so we can verify your email address.");
            }
            User pendingUser = new User();
            pendingUser.setFullName(request.getFullName().trim());
            pendingUser.setEmail(email);
            pendingUser.setPhoneNumber(request.getPhone() != null && !request.getPhone().isBlank() ? request.getPhone().trim() : null);
            pendingUser.setPasswordHash(passwordHash);
            pendingUser.setAccountStatus("PENDING");
            pendingUser.setEmailVerified(false);
            try {
                pendingUser = userRepository.save(pendingUser);
            } catch (DataIntegrityViolationException ex) {
                throw new ConflictException("EMAIL_EXISTS", "The email address is already registered.");
            }
            Role pendingRole = roleRepository.findByRoleNameIgnoreCase("Customer")
                    .orElseThrow(() -> new BusinessRuleException("ROLE_NOT_FOUND", "System configuration error: Customer role is missing."));
            userRoleRepository.save(new UserRole(pendingUser, pendingRole));
            customerProfileRepository.save(new CustomerProfile(pendingUser));
            consentRecordRepository.save(new ConsentRecord(pendingUser, TOS_CONSENT_TYPE, TOS_POLICY_VERSION));
            // Keep the standard EMAIL_VERIFICATION purpose (column is 30 chars)
            // and remember the pending Facebook subject in a short-lived
            // server-side map; verifyEmail binds the identity after OTP proof.
            String rawOtp = String.format("%06d", secureRandom.nextInt(1000000));
            EmailOtp emailOtp = new EmailOtp(pendingUser, passwordEncoder.encode(rawOtp),
                    EMAIL_VERIFICATION_PURPOSE,
                    Instant.now().plus(10, ChronoUnit.MINUTES));
            emailOtpRepository.save(emailOtp);
            pendingFacebookBindings.put(pendingUser.getUserId(), ticket.providerSubject());
            emailDeliveryAdapter.sendVerificationOtp(email, rawOtp);
            throw new SsoRejectedException("SSO_OTP_REQUIRED",
                    "Please verify the code sent to your email to finish creating your account.");
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
     * Facebook account-linking: dispatches a one-time OTP to the existing account's
     * email address so the holder can prove mailbox ownership before a Facebook
     * identity is bound to it. Called when a Facebook sign-in matches a registered
     * email that has no Facebook link yet.
     */
    @Transactional(noRollbackFor = BusinessRuleException.class)
    public void sendFacebookLinkOtp(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User", "id", String.valueOf(userId)));
        String email = user.getEmail();
        String rawOtp = String.format("%06d", secureRandom.nextInt(1_000_000));
        EmailOtp emailOtp = new EmailOtp(user, passwordEncoder.encode(rawOtp),
                EMAIL_VERIFICATION_PURPOSE, Instant.now().plus(10, ChronoUnit.MINUTES));
        emailOtpRepository.save(emailOtp);
        emailDeliveryAdapter.sendVerificationOtp(email, rawOtp);
    }

    /**
     * Completes a Facebook account link: verifies the OTP that proves mailbox
     * ownership, binds the Facebook identity to the existing Customer account,
     * marks the account verified/active, and issues the standard JWT login response.
     * The Facebook subject is bound idempotently.
     */
    @Transactional
    public LoginResponse completeFacebookLink(Integer userId, String providerSubject, String otp) {
        User user = userRepository.findByIdWithRoles(userId)
                .orElseThrow(() -> new BadCredentialsException("Invalid SSO link ticket."));
        assertEligibleCustomerForSso(user);
        verifyOtp(user, otp);

        if (authIdentityRepository.findByProviderAndProviderSubject("FACEBOOK", providerSubject).isEmpty()) {
            authIdentityRepository.save(new AuthIdentity(user, "FACEBOOK", providerSubject));
        }

        user.setEmailVerified(true);
        if ("PENDING".equals(user.getAccountStatus())) {
            user.setAccountStatus("ACTIVE");
        }
        userRepository.save(user);

        return buildLoginResponse(user);
    }

    /** Full OTP validation: consume-once, expiry, attempt cap, bcrypt match. */
    private void verifyOtp(User user, String rawOtp) {
        EmailOtp otp = emailOtpRepository.findLatestUnconsumedOtpForUpdate(
                user.getUserId(), EMAIL_VERIFICATION_PURPOSE, Limit.of(1))
                .orElseThrow(() -> new BusinessRuleException("OTP_NOT_FOUND",
                        "No pending verification code found for this account."));
        if (otp.isConsumed()) {
            throw new BusinessRuleException("OTP_CONSUMED", "This verification code has already been used.");
        }
        if (otp.isExpired()) {
            throw new BusinessRuleException("OTP_EXPIRED", "This verification code has expired. Please restart the Facebook sign-in.");
        }
        if (otp.getAttemptCount() >= MAX_OTP_ATTEMPTS) {
            throw new BusinessRuleException("OTP_ATTEMPTS_EXCEEDED",
                    "Too many incorrect attempts. Please restart the Facebook sign-in.");
        }
        if (!passwordEncoder.matches(rawOtp, otp.getOtpHash())) {
            otp.setAttemptCount(otp.getAttemptCount() + 1);
            emailOtpRepository.save(otp);
            throw new BusinessRuleException("OTP_INVALID", "Invalid verification code. Please check and try again.");
        }
        otp.setConsumed(true);
        otp.setConsumedAt(Instant.now());
        emailOtpRepository.save(otp);
    }

    /** Employee accounts cannot sign in or link via SSO (A3-A6). */
    private void assertEligibleCustomerForSso(User user) {
        boolean hasCustomerRole = user.getUserRoles().stream()
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .map(Role::getRoleName)
                .filter(Objects::nonNull)
                .anyMatch(roleName -> CUSTOMER_ROLE.equalsIgnoreCase(roleName.trim()));
        boolean hasEmployeeRole = user.getUserRoles().stream()
                .map(UserRole::getRole)
                .filter(Objects::nonNull)
                .map(Role::getRoleName)
                .filter(Objects::nonNull)
                .anyMatch(roleName -> !CUSTOMER_ROLE.equalsIgnoreCase(roleName.trim()));
        if (hasEmployeeRole || !hasCustomerRole) {
            throw new BusinessRuleException("SSO_EMPLOYEE_ACCOUNT",
                    "Staff accounts must sign in with their email and password.");
        }
        if (!"ACTIVE".equals(user.getAccountStatus())) {
            throw new BusinessRuleException("SSO_ACCOUNT_NOT_ACTIVE",
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
            throw new BadCredentialsException("Invalid email or password.");
        }

        if (!user.isEmailVerified()) {
            throw new BusinessRuleException("EMAIL_NOT_VERIFIED",
                    "Email address has not been verified. Please verify your email before logging in.");
        }

        if (!"ACTIVE".equals(user.getAccountStatus())) {
            throw new BusinessRuleException("ACCOUNT_NOT_ACTIVE",
                    "Account is not active. Please contact resort support.");
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

        // Facebook SSO binding: the identity is persisted ONLY now that OTP
        // verification proved mailbox control. Guarded by the pending map so a
        // stray/foreign OTP cannot bind an arbitrary Facebook subject.
        String pendingFbSubject = pendingFacebookBindings.remove(user.getUserId());
        if (pendingFbSubject != null && StringUtils.hasText(pendingFbSubject)
                && authIdentityRepository.findByProviderAndProviderSubject("FACEBOOK", pendingFbSubject).isEmpty()) {
            authIdentityRepository.save(new AuthIdentity(user, "FACEBOOK", pendingFbSubject));
        }

        return new VerifyEmailResponse(user.getUserId(), user.getEmail(), true, user.getAccountStatus());
    }}