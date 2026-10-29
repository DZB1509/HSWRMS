package com.heavenstay.hswrms.m2booking.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;

/**
 * Single source of "now" for M2. Timestamps are persisted in UTC (schema default is
 * SYSUTCDATETIME()); business dates (check-in day, "today") use the resort time zone.
 */
@Component
public class BookingClock {

    private final Clock clock;
    private final ZoneId resortZone;

    public BookingClock() {
        this("Asia/Ho_Chi_Minh");
    }

    @Autowired
    public BookingClock(@Value("${app.resort.timezone:Asia/Ho_Chi_Minh}") String resortTimezone) {
        this(Clock.systemUTC(), ZoneId.of(resortTimezone));
    }

    public BookingClock(Clock clock, ZoneId resortZone) {
        this.clock = clock;
        this.resortZone = resortZone;
    }

    public LocalDateTime utcNow() {
        return LocalDateTime.now(clock.withZone(ZoneOffset.UTC));
    }

    public LocalDate resortToday() {
        return LocalDate.now(clock.withZone(resortZone));
    }

    public ZoneId resortZone() {
        return resortZone;
    }
}
