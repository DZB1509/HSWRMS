package com.heavenstay.hswrms.m1identity.sso;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Contract tests for the one-time SSO ticket store: single-use consumption,
 * purpose separation (login vs registration), expiry, and rejection of
 * forged/unknown tokens as controlled errors.
 */
class SsoTicketServiceTest {

    private final SsoTicketService service = new SsoTicketService(60_000, 60_000);

    @Test
    @DisplayName("Login ticket round-trips and can only be consumed once")
    void loginTicket_roundTrip_andSingleUse() {
        String token = service.createLoginTicket(205, "GOOGLE", "sub-1");
        assertNotNull(token);
        assertTrue(token.length() >= 40, "token must be long enough to be unguessable");

        SsoTicket peeked = service.peek(token, SsoTicketPurpose.LOGIN);
        assertEquals(205, peeked.userId());
        assertEquals("GOOGLE", peeked.provider());
        assertEquals(SsoTicketPurpose.LOGIN, peeked.purpose());

        SsoTicket consumed = service.consume(token, SsoTicketPurpose.LOGIN);
        assertEquals(205, consumed.userId());

        BusinessRuleException reuse = assertThrows(BusinessRuleException.class,
                () -> service.consume(token, SsoTicketPurpose.LOGIN));
        assertEquals("SSO_TICKET_INVALID", reuse.getErrorCode());

        BusinessRuleException peekAfterUse = assertThrows(BusinessRuleException.class,
                () -> service.peek(token, SsoTicketPurpose.LOGIN));
        assertEquals("SSO_TICKET_INVALID", peekAfterUse.getErrorCode());
    }

    @Test
    @DisplayName("A registration ticket cannot be used for the login exchange")
    void registrationTicket_cannotBeUsedForLoginExchange() {
        String token = service.createRegistrationTicket("GOOGLE", "sub-2", "jane@example.com", true, "Jane Doe");

        BusinessRuleException wrongPurpose = assertThrows(BusinessRuleException.class,
                () -> service.consume(token, SsoTicketPurpose.LOGIN));
        assertEquals("SSO_TICKET_WRONG_PURPOSE", wrongPurpose.getErrorCode());

        // The wrong-purpose attempt must not burn the ticket: registration still works.
        SsoTicket ticket = service.consume(token, SsoTicketPurpose.REGISTRATION);
        assertEquals("jane@example.com", ticket.email());
        assertTrue(ticket.emailVerified());
    }

    @Test
    @DisplayName("A login ticket cannot complete a registration")
    void loginTicket_cannotCompleteRegistration() {
        String token = service.createLoginTicket(205, "GOOGLE", "sub-3");

        BusinessRuleException ex = assertThrows(BusinessRuleException.class,
                () -> service.consume(token, SsoTicketPurpose.REGISTRATION));
        assertEquals("SSO_TICKET_WRONG_PURPOSE", ex.getErrorCode());
    }

    @Test
    @DisplayName("Expired tickets are rejected with a controlled error and purged")
    void expiredTicket_isRejectedAndPurged() throws InterruptedException {
        SsoTicketService shortLived = new SsoTicketService(20, 20);
        String token = shortLived.createLoginTicket(205, "GOOGLE", "sub-4");
        Thread.sleep(80);

        BusinessRuleException expired = assertThrows(BusinessRuleException.class,
                () -> shortLived.consume(token, SsoTicketPurpose.LOGIN));
        assertEquals("SSO_TICKET_EXPIRED", expired.getErrorCode());

        // After the purge the token is simply unknown — still a controlled error.
        BusinessRuleException afterPurge = assertThrows(BusinessRuleException.class,
                () -> shortLived.consume(token, SsoTicketPurpose.LOGIN));
        assertEquals("SSO_TICKET_INVALID", afterPurge.getErrorCode());
    }

    @Test
    @DisplayName("Forged, empty, and unknown tokens fail as controlled errors")
    void forgedOrMissingTokens_areInvalid() {
        assertThrows(BusinessRuleException.class, () -> service.consume("forged-token", SsoTicketPurpose.LOGIN));
        assertThrows(BusinessRuleException.class, () -> service.consume(null, SsoTicketPurpose.LOGIN));
        assertThrows(BusinessRuleException.class, () -> service.consume("", SsoTicketPurpose.REGISTRATION));
        assertThrows(BusinessRuleException.class, () -> service.peek("forged-token", SsoTicketPurpose.REGISTRATION));
    }

    @Test
    @DisplayName("Each handshake receives a distinct, unpredictable token")
    void distinctTickets_getDistinctTokens() {
        String a = service.createLoginTicket(205, "GOOGLE", "sub-5");
        String b = service.createLoginTicket(205, "GOOGLE", "sub-5");
        assertNotEquals(a, b);
    }
}
