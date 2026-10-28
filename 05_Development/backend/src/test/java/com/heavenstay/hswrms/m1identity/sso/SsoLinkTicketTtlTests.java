package com.heavenstay.hswrms.m1identity.sso;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Regression test for the Facebook SSO link flow reporting "This sign-in request
 * has expired" when the user entered a still-valid OTP.
 *
 * <p>Root cause: the LINK ticket and its OTP are issued together in
 * {@link SsoService#resolveIdentity}. The OTP is valid for 10 minutes
 * ({@code AuthService.sendFacebookLinkOtp} uses {@code plus(10, MINUTES)}), but the
 * LINK ticket TTL ({@code app.sso.link-ticket-ttl-ms}) was only 5 minutes. The
 * ticket therefore expired 5 minutes <em>before</em> the OTP it was paired with, so
 * a user who took longer than 5 minutes to read/enter the (still-valid) OTP got
 * {@code SSO_TICKET_EXPIRED}. The ticket must live at least as long as the OTP.</p>
 *
 * <p>This test autowires the REAL, config-loaded {@link SsoTicketService} so it
 * validates the actual {@code link-ticket-ttl-ms} value, not a test-constructed one.</p>
 */
@SpringBootTest
class SsoLinkTicketTtlTests {

    /** Mirrors the 10-minute OTP window set in AuthService.sendFacebookLinkOtp. */
    private static final Duration OTP_WINDOW = Duration.ofMinutes(10);

    @Autowired
    private SsoTicketService ssoTicketService;

    @Test
    @DisplayName("Facebook LINK ticket TTL covers the 10-minute OTP validity window (fixes 'sign-in request has expired')")
    void linkTicketTtl_coversOtpValidityWindow() {
        String token = ssoTicketService.createLinkTicket(205, "FACEBOOK", "fb-sub-1", "jane@example.com");

        SsoTicket peeked = ssoTicketService.peek(token, SsoTicketPurpose.LINK);
        Duration remaining = Duration.between(Instant.now(), peeked.expiresAt());

        // The ticket must not expire before the OTP it was issued with (allow 1 min slack).
        assertTrue(remaining.compareTo(OTP_WINDOW.minusMinutes(1)) >= 0,
                "LINK ticket TTL (" + remaining + ") must cover the " + OTP_WINDOW
                        + " OTP validity window; a shorter TTL rejects a valid OTP as expired");

        // Within that window the ticket is still consumable and carries the right identity.
        SsoTicket consumed = ssoTicketService.consume(token, SsoTicketPurpose.LINK);
        assertEquals(205, consumed.userId());
        assertEquals("FACEBOOK", consumed.provider());
        assertEquals("fb-sub-1", consumed.providerSubject());
    }
}
