package com.heavenstay.hswrms.m1identity.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.dto.SsoLinkRequest;
import com.heavenstay.hswrms.m1identity.dto.SsoRegistrationPrefillResponse;
import com.heavenstay.hswrms.m1identity.dto.SsoTicketRequest;
import com.heavenstay.hswrms.m1identity.sso.SsoService;
import com.heavenstay.hswrms.m1identity.sso.SsoTicket;
import com.heavenstay.hswrms.m1identity.sso.SsoTicketPurpose;
import com.heavenstay.hswrms.m1identity.sso.SsoTicketService;
import com.heavenstay.hswrms.m1identity.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Ticket-based endpoints completing the Google SSO handshake with the SPA.
 *
 * <p>Mounted under {@code /api/v1/auth/sso/tickets/...} (deeper than the OAuth
 * authorization endpoint's {@code /api/v1/auth/sso/{registrationId}} pattern) so
 * they never collide with Spring Security's authorization-request filter.</p>
 *
 * <p>{@code POST /api/v1/auth/sso/tickets/exchange} redeems a LOGIN ticket for the
 * exact same login response as email/password login.
 * {@code POST /api/v1/auth/sso/tickets/resolve} returns registration prefill data
 * for a REGISTRATION ticket without consuming it (the ticket is consumed only when
 * the registration form is actually submitted).
 * {@code POST /api/v1/auth/sso/tickets/link} consumes a LINK ticket, verifies the
 * OTP proving mailbox ownership, binds the Facebook identity to the existing
 * account, and issues the standard JWT login response.</p>
 */
@RestController
@RequestMapping("/api/v1/auth/sso/tickets")
public class SsoController {

    private final SsoService ssoService;
    private final AuthService authService;
    private final SsoTicketService ssoTicketService;

    public SsoController(SsoService ssoService, AuthService authService, SsoTicketService ssoTicketService) {
        this.ssoService = ssoService;
        this.authService = authService;
        this.ssoTicketService = ssoTicketService;
    }

    @PostMapping("/exchange")
    public ResponseEntity<ApiResponse<LoginResponse>> exchange(@Valid @RequestBody SsoTicketRequest request) {
        LoginResponse response = ssoService.exchangeLoginTicket(request.getTicket());
        return ResponseEntity.ok(ApiResponse.ok("SSO login successful.", response));
    }

    @PostMapping("/resolve")
    public ResponseEntity<ApiResponse<SsoRegistrationPrefillResponse>> resolve(
            @Valid @RequestBody SsoTicketRequest request) {
        SsoRegistrationPrefillResponse response = ssoService.resolveRegistrationTicket(request.getTicket());
        return ResponseEntity.ok(ApiResponse.ok("SSO registration prefill resolved.", response));
    }

    /**
     * Completes a Facebook account link. The LINK ticket was issued by the OAuth
     * callback when a Facebook identity matched a registered email; the SPA now
     * presents the OTP sent to that email to prove ownership. On success the
     * Facebook identity is bound and the standard JWT login response is returned.
     */
    @PostMapping("/link")
    public ResponseEntity<ApiResponse<LoginResponse>> link(@Valid @RequestBody SsoLinkRequest request) {
        SsoTicket ticket = ssoTicketService.consume(request.getTicket(), SsoTicketPurpose.LINK);
        LoginResponse response = authService.completeFacebookLink(ticket.userId(), ticket.providerSubject(), request.getOtp());
        return ResponseEntity.ok(ApiResponse.ok("Facebook account linked and signed in.", response));
    }
}
