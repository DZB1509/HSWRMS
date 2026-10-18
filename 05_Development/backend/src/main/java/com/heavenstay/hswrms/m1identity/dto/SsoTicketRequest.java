package com.heavenstay.hswrms.m1identity.dto;

import jakarta.validation.constraints.NotBlank;

/** Request body carrying the opaque one-time SSO handshake ticket. */
public class SsoTicketRequest {

    @NotBlank(message = "SSO ticket is required")
    private String ticket;

    public SsoTicketRequest() {
    }

    public SsoTicketRequest(String ticket) {
        this.ticket = ticket;
    }

    public String getTicket() { return ticket; }
    public void setTicket(String ticket) { this.ticket = ticket; }
}
