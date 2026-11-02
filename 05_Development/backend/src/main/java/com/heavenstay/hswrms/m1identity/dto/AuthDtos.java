package com.heavenstay.hswrms.m1identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public final class AuthDtos {

    private AuthDtos() {}

    public record LoginRequest(
            @NotBlank(message = "The email field is required.")
            @Email(message = "Invalid email format.")
            String email,

            @NotBlank(message = "The password field is required.")
            String password
    ) {}

    public record LoginResponse(
            String token,
            Integer userId,
            String email,
            String fullName,
            List<String> roles,
            List<String> permissions
    ) {}
}
