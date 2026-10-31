package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.EmailOtpRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.service.EmailDeliveryAdapter;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

@SpringBootTest
class OtpIssuanceConcurrencyTest {

    @Autowired
    private AuthService authService;

    @MockBean
    private EmailDeliveryAdapter emailDeliveryAdapter;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailOtpRepository emailOtpRepository;

    private Integer userId;

    @BeforeEach
    void setUp() {
        emailOtpRepository.deleteAll();
        userRepository.deleteAll();

        User user = new User();
        user.setFullName("Concurrent User");
        user.setEmail("concurrent@example.com");
        user.setPasswordHash("enc_pass");
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        userId = userRepository.save(user).getUserId();
    }

    @Test
    @DisplayName("Concurrent OTP issuance leaves exactly one unconsumed OTP")
    void concurrentIssuance_leavesOneUnconsumedOtp() throws Exception {
        int threads = 2;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch start = new CountDownLatch(1);

        Runnable task = () -> {
            ready.countDown();
            try {
                start.await(5, TimeUnit.SECONDS);
                authService.sendFacebookLinkOtp(userId);
            } catch (Exception e) {
                throw new RuntimeException(e);
            }
        };

        var f1 = executor.submit(task);
        var f2 = executor.submit(task);
        ready.await(5, TimeUnit.SECONDS);
        start.countDown();
        f1.get(10, TimeUnit.SECONDS);
        f2.get(10, TimeUnit.SECONDS);
        executor.shutdown();

        long unconsumed = emailOtpRepository.findAll().stream()
                .filter(otp -> otp.getUser().getUserId().equals(userId))
                .filter(otp -> !otp.isConsumed())
                .count();

        Assertions.assertEquals(1, unconsumed,
                "Concurrent issuance must leave exactly one unconsumed OTP");
    }
}
