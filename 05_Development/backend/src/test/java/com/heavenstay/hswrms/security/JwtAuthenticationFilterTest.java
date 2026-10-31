package com.heavenstay.hswrms.security;

import com.heavenstay.hswrms.m1identity.repository.UserAccountRepository;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.*;

class JwtAuthenticationFilterTest {
    @Test
    void validTokenForMissingAccountDoesNotAuthenticate() throws Exception {
        JwtTokenProvider tokenProvider = mock(JwtTokenProvider.class);
        UserAccountRepository accounts = mock(UserAccountRepository.class);
        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(tokenProvider, accounts);
        Claims claims = mock(Claims.class);
        when(tokenProvider.validateToken("signed-token")).thenReturn(true);
        when(tokenProvider.getClaimsFromToken("signed-token")).thenReturn(claims);
        when(claims.getSubject()).thenReturn("deleted@example.test");
        when(claims.get("userId", Integer.class)).thenReturn(404);
        when(accounts.findById(404)).thenReturn(java.util.Optional.empty());
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer signed-token");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        SecurityContextHolder.clearContext();
        try {
            filter.doFilter(request, response, chain);
            assertNull(SecurityContextHolder.getContext().getAuthentication());
            verify(accounts).findById(404);
            verify(chain).doFilter(request, response);
        } finally {
            SecurityContextHolder.clearContext();
        }
    }
}
