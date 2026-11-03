package com.heavenstay.hswrms.m3spa.config;

import org.springframework.beans.factory.InitializingBean;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.stereotype.Component;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.Errors;
import org.springframework.validation.Validator;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Configuration properties for M3 Spa Notification Dispatch Outbox.
 * Enforces the OI-02 Option B retry policy:
 * - Exactly 5 total attempts (1 initial attempt + 4 retries)
 * - Exactly 4 backoff delays: [30s, 60s, 120s, 240s]
 */
@Component
@ConfigurationProperties(prefix = "app.spa.outbox")
@Validated
public class SpaOutboxProperties implements InitializingBean, Validator {

    public static final int REQUIRED_MAX_ATTEMPTS = 5;
    public static final List<Duration> REQUIRED_RETRY_DELAYS = List.of(
            Duration.ofSeconds(30),
            Duration.ofSeconds(60),
            Duration.ofSeconds(120),
            Duration.ofSeconds(240)
    );

    private int maxAttempts = REQUIRED_MAX_ATTEMPTS;
    private Duration claimExpiry = Duration.ofMinutes(5);
    private List<Duration> retryDelays = new ArrayList<>(REQUIRED_RETRY_DELAYS);

    public int getMaxAttempts() {
        return maxAttempts;
    }

    public void setMaxAttempts(int maxAttempts) {
        this.maxAttempts = maxAttempts;
    }

    public Duration getClaimExpiry() {
        return claimExpiry;
    }

    public void setClaimExpiry(Duration claimExpiry) {
        this.claimExpiry = claimExpiry;
    }

    public List<Duration> getRetryDelays() {
        return retryDelays;
    }

    public void setRetryDelays(List<Duration> retryDelays) {
        this.retryDelays = retryDelays;
    }

    public Duration delayAfterAttempt(int attemptNumber) {
        if (retryDelays == null || attemptNumber <= 0 || attemptNumber > retryDelays.size()) {
            throw new IllegalArgumentException("No configured outbox delay for attempt " + attemptNumber);
        }
        return retryDelays.get(attemptNumber - 1);
    }

    @Override
    public boolean supports(Class<?> clazz) {
        return SpaOutboxProperties.class.isAssignableFrom(clazz);
    }

    @Override
    public void validate(Object target, Errors errors) {
        SpaOutboxProperties props = (SpaOutboxProperties) target;

        if (props.maxAttempts != REQUIRED_MAX_ATTEMPTS) {
            errors.rejectValue("maxAttempts", "outbox.maxAttempts.invalid",
                    "Invalid configuration 'app.spa.outbox.max-attempts': value must equal "
                            + REQUIRED_MAX_ATTEMPTS + " (OI-02 Option B policy), but was " + props.maxAttempts);
        }

        if (props.retryDelays == null) {
            errors.rejectValue("retryDelays", "outbox.retryDelays.null",
                    "Invalid configuration 'app.spa.outbox.retry-delays': list must not be null (OI-02 Option B policy requires [30s, 60s, 120s, 240s])");
        } else if (props.retryDelays.size() != REQUIRED_RETRY_DELAYS.size()) {
            errors.rejectValue("retryDelays", "outbox.retryDelays.size",
                    "Invalid configuration 'app.spa.outbox.retry-delays': expected exactly "
                            + REQUIRED_RETRY_DELAYS.size() + " delays but got " + props.retryDelays.size()
                            + " (OI-02 Option B policy requires [30s, 60s, 120s, 240s])");
        } else {
            for (int i = 0; i < props.retryDelays.size(); i++) {
                Duration delay = props.retryDelays.get(i);
                Duration expected = REQUIRED_RETRY_DELAYS.get(i);
                if (delay == null) {
                    errors.rejectValue("retryDelays", "outbox.retryDelays.elementNull",
                            "Invalid configuration 'app.spa.outbox.retry-delays[" + i + "]': delay element must not be null");
                } else if (delay.isNegative() || delay.isZero()) {
                    errors.rejectValue("retryDelays", "outbox.retryDelays.notPositive",
                            "Invalid configuration 'app.spa.outbox.retry-delays[" + i + "]': delay must be positive, but was " + delay);
                } else if (!delay.equals(expected)) {
                    errors.rejectValue("retryDelays", "outbox.retryDelays.mismatch",
                            "Invalid configuration 'app.spa.outbox.retry-delays[" + i + "]': expected "
                                    + expected + " but got " + delay + " (OI-02 Option B policy requires [30s, 60s, 120s, 240s])");
                }
            }
        }

        if (props.claimExpiry == null || props.claimExpiry.isNegative() || props.claimExpiry.isZero()) {
            errors.rejectValue("claimExpiry", "outbox.claimExpiry.invalid",
                    "Invalid configuration 'app.spa.outbox.claim-expiry': claim expiry must be a positive duration");
        }
    }

    @Override
    public void afterPropertiesSet() {
        validatePolicy();
    }

    public void validatePolicy() {
        BeanPropertyBindingResult errors = new BeanPropertyBindingResult(this, "spaOutboxProperties");
        validate(this, errors);
        if (errors.hasErrors()) {
            String messages = errors.getAllErrors().stream()
                    .map(DefaultMessageSourceResolvable::getDefaultMessage)
                    .collect(Collectors.joining("; "));
            throw new IllegalStateException(messages);
        }
    }
}
