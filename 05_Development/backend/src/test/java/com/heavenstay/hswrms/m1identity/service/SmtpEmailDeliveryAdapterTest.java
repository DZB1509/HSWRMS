package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.EmailDeliveryException;
import com.heavenstay.hswrms.m1identity.service.impl.SmtpEmailDeliveryAdapter;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mail.MailException;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.env.MockEnvironment;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SmtpEmailDeliveryAdapterTest {

    @Mock
    private JavaMailSender mailSender;

    private MockEnvironment environment;
    private SmtpEmailDeliveryAdapter adapter;

    @BeforeEach
    void setUp() {
        environment = new MockEnvironment();
        environment.setProperty("spring.mail.username", "test@heavenstay.com");
        adapter = new SmtpEmailDeliveryAdapter(mailSender, environment);
    }

    @Test
    void sendVerificationOtp_sendsMessageWithExpectedFields() {
        adapter.sendVerificationOtp("guest@example.com", "123456");

        ArgumentCaptor<SimpleMailMessage> messageCaptor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(messageCaptor.capture());

        SimpleMailMessage sent = messageCaptor.getValue();
        assertThat(sent.getTo()).containsExactly("guest@example.com");
        assertThat(sent.getFrom()).isEqualTo("test@heavenstay.com");
        assertThat(sent.getSubject()).contains("Verification");
        assertThat(sent.getText()).contains("123456");
    }

    @Test
    void sendVerificationOtp_whenMailExceptionOccurs_throwsIllegalStateException() {
        doThrow(new MailSendException("SMTP connection refused"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        assertThatThrownBy(() -> adapter.sendVerificationOtp("guest@example.com", "123456"))
                .isInstanceOf(EmailDeliveryException.class)
                .hasMessageContaining("Email delivery failed");
    }
}
