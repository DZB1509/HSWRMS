package com.heavenstay.hswrms.m6admin.security;

import com.heavenstay.hswrms.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.Optional;
import java.util.stream.Collectors;

/** The authenticated caller, resolved from the JWT-backed security context. */
public record CurrentActor(Integer userId, String email, String role, boolean admin) {

    public static Optional<CurrentActor> current() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof CustomUserDetails details)) {
            return Optional.empty();
        }
        String roles = auth.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .map(a -> a.startsWith("ROLE_") ? a.substring(5) : a)
                .sorted()
                .collect(Collectors.joining(","));
        boolean admin = auth.getAuthorities().stream().anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return Optional.of(new CurrentActor(details.getUserId(), details.getUsername(), roles, admin));
    }

    public static CurrentActor require() {
        return current().orElseThrow(() ->
                new org.springframework.security.authentication.AuthenticationCredentialsNotFoundException("No authenticated user"));
    }
}
