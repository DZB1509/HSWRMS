package com.heavenstay.hswrms.security;

import com.heavenstay.hswrms.m1identity.entity.Role;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
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
        this.authorities = roles.stream()
                .flatMap(role -> {
                    String canonical = Role.canonical(role);
                    String upper = role.toUpperCase(java.util.Locale.ROOT);
                    return java.util.stream.Stream.of(
                            canonical.startsWith("ROLE_") ? canonical : "ROLE_" + canonical,
                            upper.startsWith("ROLE_") ? upper : "ROLE_" + upper
                    );
                })
                .distinct()
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());
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
