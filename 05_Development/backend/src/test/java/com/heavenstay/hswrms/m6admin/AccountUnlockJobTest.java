package com.heavenstay.hswrms.m6admin;

import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m6admin.job.AccountUnlockJob;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
@Transactional
public class AccountUnlockJobTest {

    @Autowired
    private AccountUnlockJob accountUnlockJob;

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("JOB-01: Automatically unlocks accounts locked longer than lockout duration")
    void unlocksExpiredLockedAccounts() {
        User user = new User();
        user.setFullName("Locked User");
        user.setEmail("locked.test@heavenstay.com");
        user.setAccountStatus("LOCKED");
        user.setFailedLoginCount(5);
        user.setLockedAt(Instant.now().minus(20, ChronoUnit.MINUTES)); // locked 20 mins ago (default window: 10 mins)
        user.setEmailVerified(true);
        User saved = userRepository.save(user);

        accountUnlockJob.run();

        User refreshed = userRepository.findById(saved.getUserId()).orElseThrow();
        assertEquals("ACTIVE", refreshed.getAccountStatus());
        assertEquals(0, refreshed.getFailedLoginCount());
        assertNull(refreshed.getLockedAt());
    }
}
