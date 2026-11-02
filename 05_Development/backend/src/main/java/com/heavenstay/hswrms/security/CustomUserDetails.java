package com.heavenstay.hswrms.security;

import com.heavenstay.hswrms.m1identity.entity.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

public class CustomUserDetails implements UserDetails {

    private final Integer userId;
    private final String email;
    private final String password;
    private final String fullName;
    private final boolean active;
    private final Collection<? extends GrantedAuthority> authorities;

    public CustomUserDetails(Integer userId, String email, String password, String fullName, boolean active, List<String> roles) {
        this.userId = userId;
        this.email = email;
        this.password = password;
        this.fullName = fullName;
        this.active = active;
        this.authorities = (roles == null ? Collections.<String>emptyList() : roles).stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .flatMap(role -> normalizeRoleAuthorities(role).stream())
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
    }

    /**
     * Normalizes raw role names into Spring Security authority representations.
     * Maps database canonical name "F&B Staff" (and aliases like "FB_STAFF", "FNB_STAFF", etc.)
     * to canonical authority "ROLE_FNB_STAFF" to ensure seamless compatibility with
     * Spring Security's {@code hasRole("FNB_STAFF")} and {@code hasAnyRole("FNB_STAFF", ...)}.
     * All standard roles ("Customer", "Receptionist", "Therapist", "Manager", "Admin")
     * cleanly map to their respective "ROLE_<UPPERCASE>" authorities.
     */
    public static List<String> normalizeRoleAuthorities(String role) {
        if (role == null || role.isBlank()) {
            return Collections.emptyList();
        }
        String clean = role.trim();
        if (clean.toUpperCase(Locale.ROOT).startsWith("ROLE_")) {
            clean = clean.substring(5).trim();
        }
        String upper = clean.toUpperCase(Locale.ROOT);
        String compacted = upper.replace(" ", "").replace("_", "");
        if ("F&BSTAFF".equals(compacted) || "FBSTAFF".equals(compacted) || "FNBSTAFF".equals(compacted)) {
            return List.of("ROLE_FNB_STAFF");
        }
        return List.of("ROLE_" + upper.replace(' ', '_'));
    }

    public Integer getUserId() {
        return userId;
    }

    public String getFullName() {
        return fullName;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return active;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return active;
    }
}
