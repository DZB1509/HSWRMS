package com.heavenstay.hswrms.m3spa.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SpaOutboxPropertiesTest {

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
            .withConfiguration(AutoConfigurations.of(ConfigurationPropertiesAutoConfiguration.class))
            .withUserConfiguration(SpaOutboxProperties.class);

    @Nested
    @DisplayName("Unit / Lifecycle Validation Tests")
    class LifecycleValidationTests {

        @Test
        @DisplayName("Default configuration is valid and accepted")
        void defaultConfigurationIsAccepted() {
            SpaOutboxProperties props = new SpaOutboxProperties();

            assertThatCode(props::afterPropertiesSet).doesNotThrowAnyException();
            assertThat(props.getMaxAttempts()).isEqualTo(5);
            assertThat(props.getRetryDelays()).containsExactly(
                    Duration.ofSeconds(30),
                    Duration.ofSeconds(60),
                    Duration.ofSeconds(120),
                    Duration.ofSeconds(240)
            );
            assertThat(props.getClaimExpiry()).isEqualTo(Duration.ofMinutes(5));
            assertThat(props.delayAfterAttempt(1)).isEqualTo(Duration.ofSeconds(30));
            assertThat(props.delayAfterAttempt(4)).isEqualTo(Duration.ofSeconds(240));
        }

        @Test
        @DisplayName("maxAttempts = 5 is accepted")
        void maxAttemptsFiveIsAccepted() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setMaxAttempts(5);

            assertThatCode(props::afterPropertiesSet).doesNotThrowAnyException();
        }

        @ParameterizedTest(name = "maxAttempts = {0} is rejected")
        @ValueSource(ints = {0, 4, 6, -1, -5})
        void invalidMaxAttemptsAreRejected(int invalidMaxAttempts) {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setMaxAttempts(invalidMaxAttempts);

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.max-attempts")
                    .hasMessageContaining("must equal 5");
        }

        @Test
        @DisplayName("Four correct delays are accepted")
        void fourCorrectDelaysAreAccepted() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setRetryDelays(List.of(
                    Duration.ofSeconds(30),
                    Duration.ofMinutes(1),
                    Duration.ofMinutes(2),
                    Duration.ofMinutes(4)
            ));

            assertThatCode(props::afterPropertiesSet).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Three delays are rejected")
        void threeDelaysAreRejected() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setRetryDelays(List.of(
                    Duration.ofSeconds(30),
                    Duration.ofSeconds(60),
                    Duration.ofSeconds(120)
            ));

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.retry-delays")
                    .hasMessageContaining("expected exactly 4 delays but got 3");
        }

        @Test
        @DisplayName("Five delays are rejected")
        void fiveDelaysAreRejected() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setRetryDelays(List.of(
                    Duration.ofSeconds(30),
                    Duration.ofSeconds(60),
                    Duration.ofSeconds(120),
                    Duration.ofSeconds(240),
                    Duration.ofSeconds(480)
            ));

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.retry-delays")
                    .hasMessageContaining("expected exactly 4 delays but got 5");
        }

        @Test
        @DisplayName("Missing delay list (null) is rejected")
        void missingDelayListIsRejected() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setRetryDelays(null);

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.retry-delays")
                    .hasMessageContaining("must not be null");
        }

        @Test
        @DisplayName("Null delay element is rejected")
        void nullDelayElementIsRejected() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            List<Duration> delaysWithNull = new ArrayList<>(Arrays.asList(
                    Duration.ofSeconds(30),
                    null,
                    Duration.ofSeconds(120),
                    Duration.ofSeconds(240)
            ));
            props.setRetryDelays(delaysWithNull);

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.retry-delays[1]")
                    .hasMessageContaining("element must not be null");
        }

        @Test
        @DisplayName("Zero delay is rejected")
        void zeroDelayIsRejected() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setRetryDelays(List.of(
                    Duration.ZERO,
                    Duration.ofSeconds(60),
                    Duration.ofSeconds(120),
                    Duration.ofSeconds(240)
            ));

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.retry-delays[0]")
                    .hasMessageContaining("delay must be positive");
        }

        @Test
        @DisplayName("Negative delay is rejected")
        void negativeDelayIsRejected() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setRetryDelays(List.of(
                    Duration.ofSeconds(30),
                    Duration.ofSeconds(-60),
                    Duration.ofSeconds(120),
                    Duration.ofSeconds(240)
            ));

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.retry-delays[1]")
                    .hasMessageContaining("delay must be positive");
        }

        @Test
        @DisplayName("Incorrect delay order is rejected")
        void incorrectDelayOrderIsRejected() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setRetryDelays(List.of(
                    Duration.ofSeconds(60),
                    Duration.ofSeconds(30),
                    Duration.ofSeconds(120),
                    Duration.ofSeconds(240)
            ));

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.retry-delays[0]")
                    .hasMessageContaining("expected PT30S but got PT1M");
        }

        @Test
        @DisplayName("Incorrect delay value is rejected")
        void incorrectDelayValueIsRejected() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setRetryDelays(List.of(
                    Duration.ofSeconds(15),
                    Duration.ofSeconds(60),
                    Duration.ofSeconds(120),
                    Duration.ofSeconds(240)
            ));

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.retry-delays[0]")
                    .hasMessageContaining("expected PT30S but got PT15S");
        }

        @Test
        @DisplayName("Invalid claimExpiry is rejected")
        void invalidClaimExpiryIsRejected() {
            SpaOutboxProperties props = new SpaOutboxProperties();
            props.setClaimExpiry(Duration.ofSeconds(-10));

            assertThatThrownBy(props::afterPropertiesSet)
                    .isInstanceOf(IllegalStateException.class)
                    .hasMessageContaining("app.spa.outbox.claim-expiry");
        }
    }

    @Nested
    @DisplayName("Spring ApplicationContext Runner / Startup Failure Tests")
    class SpringStartupValidationTests {

        @Test
        @DisplayName("Context loads successfully with default properties")
        void contextStartsSuccessfullyWithDefaultConfiguration() {
            runner.run(context -> {
                assertThat(context).hasNotFailed();
                SpaOutboxProperties bean = context.getBean(SpaOutboxProperties.class);
                assertThat(bean.getMaxAttempts()).isEqualTo(5);
                assertThat(bean.getRetryDelays()).hasSize(4);
            });
        }

        @Test
        @DisplayName("Context loads successfully with explicit valid properties")
        void contextStartsSuccessfullyWithExplicitValidProperties() {
            runner.withPropertyValues(
                    "app.spa.outbox.max-attempts=5",
                    "app.spa.outbox.claim-expiry=5m",
                    "app.spa.outbox.retry-delays=30s,60s,120s,240s"
            ).run(context -> {
                assertThat(context).hasNotFailed();
                SpaOutboxProperties bean = context.getBean(SpaOutboxProperties.class);
                assertThat(bean.getMaxAttempts()).isEqualTo(5);
                assertThat(bean.getRetryDelays()).containsExactly(
                        Duration.ofSeconds(30),
                        Duration.ofSeconds(60),
                        Duration.ofSeconds(120),
                        Duration.ofSeconds(240)
                );
            });
        }

        @Test
        @DisplayName("Context startup fails fast when max-attempts = 4")
        void contextStartupFailsWhenMaxAttemptsIsFour() {
            runner.withPropertyValues("app.spa.outbox.max-attempts=4")
                    .run(context -> {
                        assertThat(context).hasFailed();
                        assertThat(context.getStartupFailure())
                                .hasStackTraceContaining("app.spa.outbox.max-attempts")
                                .hasStackTraceContaining("must equal 5");
                    });
        }

        @Test
        @DisplayName("Context startup fails fast when max-attempts = 0")
        void contextStartupFailsWhenMaxAttemptsIsZero() {
            runner.withPropertyValues("app.spa.outbox.max-attempts=0")
                    .run(context -> {
                        assertThat(context).hasFailed();
                        assertThat(context.getStartupFailure())
                                .hasStackTraceContaining("app.spa.outbox.max-attempts")
                                .hasStackTraceContaining("must equal 5");
                    });
        }

        @Test
        @DisplayName("Context startup fails fast when max-attempts = 6")
        void contextStartupFailsWhenMaxAttemptsIsSix() {
            runner.withPropertyValues("app.spa.outbox.max-attempts=6")
                    .run(context -> {
                        assertThat(context).hasFailed();
                        assertThat(context.getStartupFailure())
                                .hasStackTraceContaining("app.spa.outbox.max-attempts")
                                .hasStackTraceContaining("must equal 5");
                    });
        }

        @Test
        @DisplayName("Context startup fails fast when max-attempts is negative")
        void contextStartupFailsWhenMaxAttemptsIsNegative() {
            runner.withPropertyValues("app.spa.outbox.max-attempts=-1")
                    .run(context -> {
                        assertThat(context).hasFailed();
                        assertThat(context.getStartupFailure())
                                .hasStackTraceContaining("app.spa.outbox.max-attempts")
                                .hasStackTraceContaining("must equal 5");
                    });
        }

        @Test
        @DisplayName("Context startup fails fast when retry-delays has only 3 values")
        void contextStartupFailsWhenRetryDelaysHasThreeValues() {
            runner.withPropertyValues("app.spa.outbox.retry-delays=30s,60s,120s")
                    .run(context -> {
                        assertThat(context).hasFailed();
                        assertThat(context.getStartupFailure())
                                .hasStackTraceContaining("app.spa.outbox.retry-delays")
                                .hasStackTraceContaining("expected exactly 4 delays but got 3");
                    });
        }

        @Test
        @DisplayName("Context startup fails fast when retry-delays has 5 values")
        void contextStartupFailsWhenRetryDelaysHasFiveValues() {
            runner.withPropertyValues("app.spa.outbox.retry-delays=30s,60s,120s,240s,480s")
                    .run(context -> {
                        assertThat(context).hasFailed();
                        assertThat(context.getStartupFailure())
                                .hasStackTraceContaining("app.spa.outbox.retry-delays")
                                .hasStackTraceContaining("expected exactly 4 delays but got 5");
                    });
        }

        @Test
        @DisplayName("Context startup fails fast when retry-delays order is incorrect")
        void contextStartupFailsWhenRetryDelaysOrderIsIncorrect() {
            runner.withPropertyValues("app.spa.outbox.retry-delays=60s,30s,120s,240s")
                    .run(context -> {
                        assertThat(context).hasFailed();
                        assertThat(context.getStartupFailure())
                                .hasStackTraceContaining("app.spa.outbox.retry-delays")
                                .hasStackTraceContaining("expected PT30S but got PT1M");
                    });
        }

        @Test
        @DisplayName("Context startup fails fast when retry-delays value is incorrect")
        void contextStartupFailsWhenRetryDelaysValueIsIncorrect() {
            runner.withPropertyValues("app.spa.outbox.retry-delays=15s,60s,120s,240s")
                    .run(context -> {
                        assertThat(context).hasFailed();
                        assertThat(context.getStartupFailure())
                                .hasStackTraceContaining("app.spa.outbox.retry-delays")
                                .hasStackTraceContaining("expected PT30S but got PT15S");
                    });
        }
    }
}
