package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m1identity.dto.LoginRequest;
import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.RoleRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRoleRepository;
import com.heavenstay.hswrms.m6admin.job.AccountUnlockJob;
import com.heavenstay.hswrms.m6admin.service.BusinessParameterService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
public class AccountLockoutIntegrationTest {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private UserRoleRepository userRoleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AccountLockoutService accountLockoutService;

    @Autowired
    private AccountUnlockJob accountUnlockJob;

    private User testUser;
    private static final String TEST_PASSWORD = "CorrectPassword123!";
    private static final String WRONG_PASSWORD = "WrongPassword!";

    @BeforeEach
    void setUp() {
        String email = "lockout.test." + System.currentTimeMillis() + "@heavenstay.com";
        User u = new User("Lockout Test Subject", email, passwordEncoder.encode(TEST_PASSWORD));
        u.setAccountStatus("ACTIVE");
        u.setEmailVerified(true);
        u.setFailedLoginCount(0);
        u.setLockedAt(null);
        u.setLastLoginAt(null);
        testUser = userRepository.saveAndFlush(u);

        Role role = roleRepository.findByRoleNameIgnoreCase("Customer")
                .orElseGet(() -> roleRepository.saveAndFlush(new Role("Customer", "Resort customer")));
        userRoleRepository.saveAndFlush(new UserRole(testUser, role));
    }

    private LoginRequest req(String email, String password) {
        LoginRequest r = new LoginRequest();
        r.setEmail(email);
        r.setPassword(password);
        return r;
    }

    @Test
    @DisplayName("LOCKOUT-01: Wrong password increments failedLoginCount by 1 and keeps status ACTIVE")
    void wrongPasswordIncrementsFailedCount() {
        assertThrows(BadCredentialsException.class, () ->
                authService.login(req(testUser.getEmail(), WRONG_PASSWORD)));

        User refreshed = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(1, refreshed.getFailedLoginCount());
        assertEquals("ACTIVE", refreshed.getAccountStatus());
        assertNull(refreshed.getLockedAt());
    }

    @Test
    @DisplayName("LOCKOUT-02: Reaching max failed login threshold transitions account to LOCKED with lockedAt timestamp")
    void reachingMaxThresholdLocksAccount() {
        int maxAttempts = accountLockoutService.getMaxFailedLoginAttempts();

        for (int i = 1; i <= maxAttempts; i++) {
            assertThrows(BadCredentialsException.class, () ->
                    authService.login(req(testUser.getEmail(), WRONG_PASSWORD)));
        }

        User refreshed = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(maxAttempts, refreshed.getFailedLoginCount());
        assertEquals("LOCKED", refreshed.getAccountStatus());
        assertNotNull(refreshed.getLockedAt());
    }

    @Test
    @DisplayName("LOCKOUT-03: Locked account cannot sign in even with correct password (throws ACCOUNT_NOT_ACTIVE)")
    void lockedAccountCannotLogin() {
        testUser.setAccountStatus("LOCKED");
        testUser.setFailedLoginCount(5);
        testUser.setLockedAt(Instant.now()); // locked just now (duration not expired)
        userRepository.saveAndFlush(testUser);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                authService.login(req(testUser.getEmail(), TEST_PASSWORD)));

        assertEquals("ACCOUNT_NOT_ACTIVE", ex.getErrorCode());
    }

    @Test
    @DisplayName("LOCKOUT-04: Non-existent user does not record failed attempt or alter any data")
    void nonExistentUserDoesNotAffectAnyUser() {
        long countBefore = userRepository.count();

        assertThrows(BadCredentialsException.class, () ->
                authService.login(req("ghost.user." + System.currentTimeMillis() + "@nowhere.com", WRONG_PASSWORD)));

        long countAfter = userRepository.count();
        assertEquals(countBefore, countAfter);

        User refreshed = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(0, refreshed.getFailedLoginCount());
    }

    @Test
    @DisplayName("LOCKOUT-05: Successful login updates lastLoginAt and resets failedLoginCount to 0")
    void successfulLoginResetsCounterAndUpdatesLastLoginAt() {
        testUser.setFailedLoginCount(3);
        userRepository.saveAndFlush(testUser);

        LoginResponse response = authService.login(req(testUser.getEmail(), TEST_PASSWORD));
        assertNotNull(response);
        assertNotNull(response.getToken());

        User refreshed = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals(0, refreshed.getFailedLoginCount());
        assertNotNull(refreshed.getLastLoginAt());
    }

    @Test
    @DisplayName("LOCKOUT-06: Expired locked account is auto-unlocked when lockout window has elapsed")
    void expiredLockoutAllowsLoginOrUnlocks() {
        testUser.setAccountStatus("LOCKED");
        testUser.setFailedLoginCount(5);
        // Locked 20 minutes ago (default lockout window is 10 minutes)
        testUser.setLockedAt(Instant.now().minus(20, ChronoUnit.MINUTES));
        userRepository.saveAndFlush(testUser);

        // Attempting login after lockout duration has elapsed should auto-unlock and log in successfully
        LoginResponse response = authService.login(req(testUser.getEmail(), TEST_PASSWORD));
        assertNotNull(response);

        User refreshed = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals("ACTIVE", refreshed.getAccountStatus());
        assertEquals(0, refreshed.getFailedLoginCount());
        assertNull(refreshed.getLockedAt());
    }

    @Test
    @DisplayName("LOCKOUT-07: AccountUnlockJob scheduled task unlocks expired accounts in batch")
    void scheduledJobUnlocksExpiredAccounts() {
        testUser.setAccountStatus("LOCKED");
        testUser.setFailedLoginCount(5);
        testUser.setLockedAt(Instant.now().minus(25, ChronoUnit.MINUTES));
        userRepository.saveAndFlush(testUser);

        accountUnlockJob.run();

        User refreshed = userRepository.findById(testUser.getUserId()).orElseThrow();
        assertEquals("ACTIVE", refreshed.getAccountStatus());
        assertEquals(0, refreshed.getFailedLoginCount());
        assertNull(refreshed.getLockedAt());
    }

    @Test
    @DisplayName("LOCKOUT-08: Concurrent failed logins execute atomically without lost updates")
    void concurrentFailedLoginsPreventLostUpdates() throws Exception {
        int threads = 4;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        List<Callable<Void>> tasks = new ArrayList<>();

        for (int i = 0; i < threads; i++) {
            tasks.add(() -> {
                try {
                    authService.login(req(testUser.getEmail(), WRONG_PASSWORD));
                } catch (BadCredentialsException ignored) {
                }
                return null;
            });
        }

        List<Future<Void>> futures = executor.invokeAll(tasks);
        for (Future<Void> f : futures) {
            f.get();
        }
        executor.shutdown();

        User refreshed = userRepository.findById(testUser.getUserId()).orElseThrow();
        // Since all 4 concurrent threads attempted wrong password, failed count must equal exactly 4
        assertEquals(threads, refreshed.getFailedLoginCount(),
                "Atomic row update must prevent lost updates under concurrency");
    }
}
