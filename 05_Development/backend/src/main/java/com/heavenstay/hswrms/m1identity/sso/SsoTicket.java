package com.heavenstay.hswrms.m1identity.sso;

import java.time.Instant;

/**
 * Immutable server-side record of one SSO handshake outcome.
 *
 * <p>Tickets are stored in-memory (see {@link SsoTicketService}) and never contain
 * the provider access/ID tokens — only the minimal HSWRMS-facing data needed to
 * finish a login or a registration that was already validated by the OAuth callback.</p>
 *
 * @param purpose     LOGIN or REGISTRATION, fixed at creation time.
 * @param provider    Canonical provider name (e.g. GOOGLE).
 * @param providerSubject Trusted provider identity (OIDC {@code sub}).
 * @param userId      Target user id for LOGIN tickets; {@code null} for REGISTRATION tickets.
 * @param email       Validated, provider-verified email for REGISTRATION tickets.
 * @param emailVerified Whether the provider asserted the email as verified.
 * @param fullName    Provider-supplied full name (prefill only, user may edit).
 * @param expiresAt   Hard expiry instant.
 */
public record SsoTicket(
        SsoTicketPurpose purpose,
        String provider,
        String providerSubject,
        Integer userId,
        String email,
        boolean emailVerified,
        String fullName,
        Instant expiresAt) {
}
