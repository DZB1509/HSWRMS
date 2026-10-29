package com.heavenstay.hswrms.m1identity.service.impl;

import com.heavenstay.hswrms.m1identity.service.EmailDeliveryAdapter;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;

import java.util.List;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

/**
 * Dev-console email delivery: in the default {@code dev} profile the OTP is
 * written to the backend log instead of a real mailbox. This test asserts the
 * adapter delivers (logs) the code without throwing, so registration can
 * proceed locally without SMTP configured.
 */
class DevEmailDeliveryAdapterTest {

    private DevEmailDeliveryAdapter adapter;
    private ListAppender<ch.qos.logback.classic.spi.ILoggingEvent> listAppender;

    @BeforeEach
    void setUp() {
        adapter = new DevEmailDeliveryAdapter();
        Logger logbackLogger = (Logger) LoggerFactory.getLogger(DevEmailDeliveryAdapter.class);
        listAppender = new ListAppender<>();
        listAppender.start();
        logbackLogger.addAppender(listAppender);
    }

    @AfterEach
    void tearDown() {
        Logger logbackLogger = (Logger) LoggerFactory.getLogger(DevEmailDeliveryAdapter.class);
        logbackLogger.detachAppender(listAppender);
        listAppender.stop();
    }

    @Test
    void sendVerificationOtp_logsOtpToConsole_andDoesNotAbort() {
        assertThatCode(() -> adapter.sendVerificationOtp("jane@example.com", "123456"))
                .doesNotThrowAnyException();

        List<String> messages = listAppender.list.stream()
                .map(event -> event.getFormattedMessage())
                .collect(Collectors.toList());
        String logs = String.join("\n", messages);

        assertThat(logs).contains("DEV MODE E-MAIL DISPATCH");
        assertThat(logs).contains("OTP Code: 123456");
        assertThat(logs).contains("To: jane@example.com");
    }

    @Test
    void sendVerificationOtp_implementsEmailDeliveryAdapter() {
        assertThat(adapter).isInstanceOf(EmailDeliveryAdapter.class);
    }
}
