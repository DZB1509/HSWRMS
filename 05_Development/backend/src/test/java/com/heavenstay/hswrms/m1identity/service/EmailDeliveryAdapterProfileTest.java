package com.heavenstay.hswrms.m1identity.service;

import com.heavenstay.hswrms.common.exception.EmailDeliveryException;
import com.heavenstay.hswrms.m1identity.service.EmailDeliveryAdapter;
import com.heavenstay.hswrms.m1identity.service.impl.DevEmailDeliveryAdapter;
import com.heavenstay.hswrms.m1identity.service.impl.NoOpEmailDeliveryAdapter;
import com.heavenstay.hswrms.m1identity.service.impl.SmtpEmailDeliveryAdapter;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EmailDeliveryAdapterProfileTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(MailSenderAutoConfiguration.class))
            .withUserConfiguration(
                    DevEmailDeliveryAdapter.class,
                    NoOpEmailDeliveryAdapter.class,
                    SmtpEmailDeliveryAdapter.class
            );

    @Test
    void defaultProfile_loadsNoOpAdapter() {
        runner.run(context -> {
            assertThat(context).hasSingleBean(EmailDeliveryAdapter.class);
            assertThat(context).hasSingleBean(NoOpEmailDeliveryAdapter.class);
            assertThat(context).doesNotHaveBean(DevEmailDeliveryAdapter.class);
            assertThat(context).doesNotHaveBean(SmtpEmailDeliveryAdapter.class);
        });
    }

    @Test
    void noOpAdapter_throwsEmailDeliveryException_whenUnconfigured() {
        runner.run(context -> {
            EmailDeliveryAdapter adapter = context.getBean(NoOpEmailDeliveryAdapter.class);
            assertThatThrownBy(() -> adapter.sendVerificationOtp("any@example.com", "123456"))
                    .isInstanceOf(EmailDeliveryException.class)
                    .hasMessageContaining("not configured");
        });
    }

    @Test
    void devProfile_loadsDevAdapter() {
        runner.withPropertyValues("spring.profiles.active=dev").run(context -> {
            assertThat(context).hasSingleBean(EmailDeliveryAdapter.class);
            assertThat(context).hasSingleBean(DevEmailDeliveryAdapter.class);
            assertThat(context).doesNotHaveBean(NoOpEmailDeliveryAdapter.class);
            assertThat(context).doesNotHaveBean(SmtpEmailDeliveryAdapter.class);
        });
    }

    @Test
    void smtpProfile_loadsSmtpAdapter() {
        runner.withPropertyValues(
                "spring.profiles.active=smtp",
                "spring.mail.host=localhost"
        ).run(context -> {
            assertThat(context).hasSingleBean(EmailDeliveryAdapter.class);
            assertThat(context).hasSingleBean(SmtpEmailDeliveryAdapter.class);
            assertThat(context).doesNotHaveBean(DevEmailDeliveryAdapter.class);
            assertThat(context).doesNotHaveBean(NoOpEmailDeliveryAdapter.class);
        });
    }

    @Test
    void devAndSmtpProfiles_prefersSmtpAdapterWithoutConflict() {
        runner.withPropertyValues(
                "spring.profiles.active=dev,smtp",
                "spring.mail.host=localhost"
        ).run(context -> {
            assertThat(context).hasSingleBean(EmailDeliveryAdapter.class);
            assertThat(context).hasSingleBean(SmtpEmailDeliveryAdapter.class);
            assertThat(context).doesNotHaveBean(DevEmailDeliveryAdapter.class);
            assertThat(context).doesNotHaveBean(NoOpEmailDeliveryAdapter.class);
        });
    }
}
