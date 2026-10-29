package com.heavenstay.hswrms.m2booking.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

/**
 * Reads the business parameters M2 needs that the SRS delegates to M6 (Admin-configured).
 *
 * <p>Resolution order: {@code dbo.SystemConfiguration.param_value} (M6 owned, read-only here),
 * then the {@code app.booking.*} properties / environment variables. There are
 * <b>no hard-coded defaults</b>: when a value is missing the dependent operation is rejected
 * with an explicit "policy not configured" error instead of inventing a number.
 *
 * <p>Parameter keys: {@code deposit_percentage}, {@code booking_hold_minutes},
 * {@code cancellation_window_hours}, {@code refund_percentage}.
 */
@Service
public class BookingPolicyService {

    public static final String KEY_DEPOSIT_PERCENTAGE = "deposit_percentage";
    public static final String KEY_HOLD_MINUTES = "booking_hold_minutes";
    public static final String KEY_CANCELLATION_WINDOW_HOURS = "cancellation_window_hours";
    public static final String KEY_REFUND_PERCENTAGE = "refund_percentage";

    private static final Logger log = LoggerFactory.getLogger(BookingPolicyService.class);

    private final JdbcTemplate jdbcTemplate;
    private final String depositPercentageFallback;
    private final String holdMinutesFallback;
    private final String cancellationWindowFallback;
    private final String refundPercentageFallback;

    public BookingPolicyService() {
        this(null, "30", "15", "48", "100");
    }

    @org.springframework.beans.factory.annotation.Autowired
    public BookingPolicyService(@org.springframework.beans.factory.annotation.Autowired(required = false) JdbcTemplate jdbcTemplate,
                                @Value("${app.booking.deposit-percentage:}") String depositPercentageFallback,
                                @Value("${app.booking.hold-minutes:}") String holdMinutesFallback,
                                @Value("${app.booking.cancellation-window-hours:}") String cancellationWindowFallback,
                                @Value("${app.booking.refund-percentage:}") String refundPercentageFallback) {
        this.jdbcTemplate = jdbcTemplate;
        this.depositPercentageFallback = depositPercentageFallback;
        this.holdMinutesFallback = holdMinutesFallback;
        this.cancellationWindowFallback = cancellationWindowFallback;
        this.refundPercentageFallback = refundPercentageFallback;
    }

    /** Deposit percentage in (0, 100]. */
    public Optional<BigDecimal> depositPercentage() {
        return decimal(KEY_DEPOSIT_PERCENTAGE, depositPercentageFallback)
                .filter(v -> v.signum() > 0 && v.compareTo(BigDecimal.valueOf(100)) <= 0);
    }

    /** Minutes an unpaid PENDING booking holds inventory; &gt; 0. */
    public Optional<Integer> holdMinutes() {
        return decimal(KEY_HOLD_MINUTES, holdMinutesFallback)
                .filter(v -> v.signum() > 0 && v.stripTrailingZeros().scale() <= 0)
                .map(BigDecimal::intValueExact);
    }

    /** Cancellation window in hours before check-in; &gt;= 0. */
    public Optional<Integer> cancellationWindowHours() {
        return decimal(KEY_CANCELLATION_WINDOW_HOURS, cancellationWindowFallback)
                .filter(v -> v.signum() >= 0 && v.stripTrailingZeros().scale() <= 0)
                .map(BigDecimal::intValueExact);
    }

    /** Refund percentage in [0, 100] applied when cancelling inside the window. */
    public Optional<BigDecimal> refundPercentage() {
        return decimal(KEY_REFUND_PERCENTAGE, refundPercentageFallback)
                .filter(v -> v.signum() >= 0 && v.compareTo(BigDecimal.valueOf(100)) <= 0);
    }

    private Optional<BigDecimal> decimal(String key, String fallback) {
        String raw = readFromSystemConfiguration(key);
        if (raw == null || raw.isBlank()) {
            raw = fallback;
        }
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(new BigDecimal(raw.trim()));
        } catch (NumberFormatException ex) {
            log.warn("Business parameter '{}' has a non-numeric value and is ignored", key);
            return Optional.empty();
        }
    }

    private String readFromSystemConfiguration(String key) {
        if (jdbcTemplate == null) {
            return null;
        }
        try {
            List<String> rows = jdbcTemplate.queryForList(
                    "SELECT param_value FROM dbo.SystemConfiguration WHERE param_key = ?", String.class, key);
            return rows.isEmpty() ? null : rows.get(0);
        } catch (DataAccessException ex) {
            log.debug("SystemConfiguration lookup for '{}' failed ({}); using property fallback", key, ex.getClass().getSimpleName());
            return null;
        }
    }
}
