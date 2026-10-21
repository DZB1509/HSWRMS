package com.heavenstay.hswrms.m1identity.sso;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.concurrent.ConcurrentHashMap;

/**
 * In-memory, single-use handshake ticket store for the Google SSO flow.
 *
 * <p><b>Why in-memory (tradeoff):</b> tickets are short-lived handshake artifacts,
 * not business records, so the existing architecture does not need a new database
 * table. In-memory storage keeps the change surface minimal and avoids any schema
 * migration. The accepted tradeoffs: tickets do not survive a backend restart
 * (the user simply repeats the Google flow) and are not shared across multiple
 * backend instances (the current deployment is a single instance). If the system
 * is ever scaled horizontally, this store should move to a shared cache.</p>
 *
 * <p>Security properties: token = 256 bits of {@link SecureRandom} data, exposed
 * only to the browser that owns the handshake; purpose is fixed at creation and
 * enforced on read (login tickets cannot complete registration and vice versa);
 * consumption is an atomic {@code map.remove} so a ticket can never be redeemed
 * twice; expired tickets are purged and rejected.</p>
 */
@Service
public class SsoTicketService {

    private static final Logger log = LoggerFactory.getLogger(SsoTicketService.class);
    private static final int TOKEN_BYTES = 32;

    private final ConcurrentHashMap<String, SsoTicket> tickets = new ConcurrentHashMap<>();
    private final SecureRandom secureRandom = new SecureRandom();
    private final long loginTicketTtlMs;
    private final long registrationTicketTtlMs;
    private final long linkTicketTtlMs;

    public SsoTicketService(
            @Value("${app.sso.login-ticket-ttl-ms:300000}") long loginTicketTtlMs,
            @Value("${app.sso.registration-ticket-ttl-ms:600000}") long registrationTicketTtlMs,
            @Value("${app.sso.link-ticket-ttl-ms:600000}") long linkTicketTtlMs) {
        this.loginTicketTtlMs = loginTicketTtlMs;
        this.registrationTicketTtlMs = registrationTicketTtlMs;
        this.linkTicketTtlMs = linkTicketTtlMs;
    }

    /**
     * Creates a LOGIN ticket bound to an already-eligible Customer user id.
     *
     * @return the opaque ticket token handed to the SPA for immediate exchange.
     */
    public String createLoginTicket(Integer userId, String provider, String providerSubject) {
        SsoTicket ticket = new SsoTicket(SsoTicketPurpose.LOGIN, provider, providerSubject,
                userId, null, false, null, Instant.now().plusMillis(loginTicketTtlMs));
        return store(ticket);
    }

    /** Creates a REGISTRATION ticket carrying provider-validated claims for the registration form prefill. No HSWRMS account exists at this point. */
    public String createRegistrationTicket(String provider, String providerSubject,
                                           String email, boolean emailVerified, String fullName) {
        SsoTicket ticket = new SsoTicket(SsoTicketPurpose.REGISTRATION, provider, providerSubject,
                null, email, emailVerified, fullName, Instant.now().plusMillis(registrationTicketTtlMs));
        return store(ticket);
    }

    /**
     * Creates a LINK ticket binding a Facebook subject to an existing Customer account
     * (identified by {@code userId}). The account holder must later prove mailbox
     * ownership via OTP before the Facebook identity is actually attached.
     *
     * @return the opaque ticket token handed to the SPA for the link step.
     */
    public String createLinkTicket(Integer userId, String provider, String providerSubject, String email) {
        SsoTicket ticket = new SsoTicket(SsoTicketPurpose.LINK, provider, providerSubject,
                userId, email, false, null, Instant.now().plusMillis(linkTicketTtlMs));
        return store(ticket);
    }


    /**
     * Validates and returns a ticket without consuming it. Used by the registration
     * prefill endpoint (the ticket must survive until the user actually submits the
     * registration form).
     */
    public SsoTicket peek(String token, SsoTicketPurpose expectedPurpose) {
        if (!StringUtils.hasText(token)) {
            throw invalidTicket();
        }
        SsoTicket ticket = tickets.get(token);
        if (ticket == null) {
            throw invalidTicket();
        }
        validateFreshnessAndPurpose(token, ticket, expectedPurpose);
        return ticket;
    }

    /**
     * Validates and atomically consumes a ticket. A second successful consumption
     * with the same token is impossible; a second call always fails with
     * {@code SSO_TICKET_INVALID}, which also covers forged tokens. Wrong-purpose
     * and expired attempts are rejected WITHOUT burning a still-valid ticket.
     */
    public SsoTicket consume(String token, SsoTicketPurpose expectedPurpose) {
        if (!StringUtils.hasText(token)) {
            logTicketRejection("MISSING_TOKEN", null, expectedPurpose);
            throw invalidTicket();
        }
        SsoTicket ticket = tickets.get(token);
        if (ticket == null) {
            logTicketRejection("NOT_FOUND_OR_ALREADY_USED", null, expectedPurpose);
            throw invalidTicket();
        }
        validateFreshnessAndPurpose(token, ticket, expectedPurpose);
        if (!tickets.remove(token, ticket)) {
            // Lost a race with a concurrent consume — controlled single-use error.
            logTicketRejection("CONCURRENT_CONSUME", ticket.purpose(), expectedPurpose);
            throw invalidTicket();
        }
        return ticket;
    }

    private void validateFreshnessAndPurpose(String token, SsoTicket ticket, SsoTicketPurpose expectedPurpose) {
        if (ticket.expiresAt().isBefore(Instant.now())) {
            logTicketRejection("EXPIRED", ticket.purpose(), expectedPurpose);
            tickets.remove(token, ticket);
            throw new BusinessRuleException("SSO_TICKET_EXPIRED",
                    "This sign-in request has expired. Please restart the sign-in.");
        }
        if (expectedPurpose != null && ticket.purpose() != expectedPurpose) {
            logTicketRejection("WRONG_PURPOSE", ticket.purpose(), expectedPurpose);
            throw new BusinessRuleException("SSO_TICKET_WRONG_PURPOSE",
                    "This sign-in request cannot be used for the requested operation.");
        }
    }

    /**
     * Emits the rejection category plus purpose context so operators can diagnose a
     * failed handshake without ever logging the ticket token itself (or any OTP,
     * secret, or personal data).
     */
    private void logTicketRejection(String category, SsoTicketPurpose actualPurpose,
                                    SsoTicketPurpose expectedPurpose) {
        log.warn("SSO ticket rejected: category={} ticketPurpose={} expectedPurpose={}",
                category, actualPurpose, expectedPurpose);
    }

    private String store(SsoTicket ticket) {
        purgeExpired();
        byte[] random = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(random);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(random);
        tickets.put(token, ticket);
        return token;
    }

    private void purgeExpired() {
        Instant now = Instant.now();
        tickets.entrySet().removeIf(entry -> entry.getValue().expiresAt().isBefore(now));
    }

    private BusinessRuleException invalidTicket() {
        return new BusinessRuleException("SSO_TICKET_INVALID",
                "This sign-in request is invalid, already used, or no longer available. Please restart the sign-in.");
    }
}
