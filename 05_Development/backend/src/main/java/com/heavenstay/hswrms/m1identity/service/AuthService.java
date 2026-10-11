package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ConflictException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.dto.RegisterRequest;
import com.heavenstay.hswrms.m1identity.dto.RegisterResponse;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailRequest;
import com.heavenstay.hswrms.m1identity.dto.VerifyEmailResponse;
import com.heavenstay.hswrms.m1identity.entity.*;
import com.heavenstay.hswrms.m1identity.repository.*;
import org.springframework.data.domain.Limit;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserRoleRepository userRoleRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final EmailOtpRepository emailOtpRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailDeliveryAdapter emailDeliveryAdapter;

    private static final String EMAIL_VERIFICATION_PURPOSE = "EMAIL_VERIFICATION";
    private static final int MAX_OTP_ATTEMPTS = 5;

    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                       UserRoleRepository userRoleRepository, CustomerProfileRepository customerProfileRepository,
                       EmailOtpRepository emailOtpRepository, PasswordEncoder passwordEncoder,
                       EmailDeliveryAdapter emailDeliveryAdapter) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.userRoleRepository = userRoleRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.emailOtpRepository = emailOtpRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailDeliveryAdapter = emailDeliveryAdapter;
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

        // 4. Generate & Store OTP Securely
        String rawOtp = String.format("%06d", secureRandom.nextInt(1000000));
        String otpHash = passwordEncoder.encode(rawOtp);
        Instant expiresAt = Instant.now().plus(10, ChronoUnit.MINUTES);

        EmailOtp emailOtp = new EmailOtp(user, otpHash, "EMAIL_VERIFICATION", expiresAt);
        emailOtpRepository.save(emailOtp);

        // 5. Dispatch Verification Email (Will abort transaction if not in Dev profile)
        emailDeliveryAdapter.sendVerificationOtp(email, rawOtp);

        return new RegisterResponse(user.getUserId(), user.getEmail(), "Registration successful. OTP dispatched.");
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