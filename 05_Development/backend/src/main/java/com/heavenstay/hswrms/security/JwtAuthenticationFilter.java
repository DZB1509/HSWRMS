package com.heavenstay.hswrms.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import com.heavenstay.hswrms.m1identity.entity.UserAccount;
import com.heavenstay.hswrms.m1identity.repository.UserAccountRepository;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider tokenProvider;
    private final UserAccountRepository userAccountRepository;

    public JwtAuthenticationFilter(JwtTokenProvider tokenProvider, UserAccountRepository userAccountRepository) {
        this.tokenProvider = tokenProvider;
        this.userAccountRepository = userAccountRepository;
    }

    /**
     * A valid signature is not enough: the account must still exist and be ACTIVE.
     * This makes an Admin lock/deactivation take effect on already-issued tokens.
     */
    private boolean isAccountActive(Integer userId) {
        if (userId == null) {
            return false;
        }
        return userAccountRepository.findById(userId)
                .map(a -> UserAccount.ACTIVE.equals(a.getAccountStatus()))
                .orElse(false);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = resolveToken(request);

        if (StringUtils.hasText(token) && tokenProvider.validateToken(token)) {
            Claims claims = tokenProvider.getClaimsFromToken(token);
            String email = claims.getSubject();
            Integer userId = claims.get("userId", Integer.class);
            if (!isAccountActive(userId)) {
                filterChain.doFilter(request, response);
                return;
            }
            String fullName = claims.get("fullName", String.class);

            @SuppressWarnings("unchecked")
            List<String> roles = claims.get("roles", List.class);
            if (roles == null) {
                roles = new ArrayList<>();
            }

            CustomUserDetails userDetails = new CustomUserDetails(
                    userId,
                    email,
                    "",
                    fullName != null ? fullName : email,
                    true,
                    roles
            );

            UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
            );
            authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    private String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
