package com.heavenstay.hswrms.security;

import com.heavenstay.hswrms.m1identity.dto.LoginResponse;
import com.heavenstay.hswrms.m1identity.entity.Role;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.entity.UserRole;
import com.heavenstay.hswrms.m1identity.repository.AuthIdentityRepository;
import com.heavenstay.hswrms.m1identity.repository.UserRepository;
import com.heavenstay.hswrms.m1identity.service.AuthService;
import com.heavenstay.hswrms.m1identity.sso.SsoService;
import com.heavenstay.hswrms.m1identity.sso.SsoTicketService;
import java.util.Collections;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Criterion 11 (JWT compatibility): a JWT issued through the SSO exchange is the
 * exact same token format as email/password login, and the existing
 * {@link JwtAuthenticationFilter} accepts it — no parallel auth mechanism.
 */
class SsoJwtRoundTripTest {

    @AfterEach
    void clearContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("A JWT issued by the SSO ticket exchange is accepted by the existing JwtAuthenticationFilter")
    void ssoIssuedJwt_isAcceptedByExistingJwtFilter() throws Exception {
        JwtTokenProvider tokenProvider = new JwtTokenProvider(
                "defaultHeavenStayResortSuperSecretKeyForDevelopmentOnlyMustBeAtLeast256BitsLong", 86_400_000L);

        User user = new User();
        user.setUserId(205);
        user.setEmail("jane@example.com");
        user.setFullName("Jane Doe");
        user.setAccountStatus("ACTIVE");
        user.setEmailVerified(true);
        Set<UserRole> roles = Collections.newSetFromMap(new IdentityHashMap<>());
        roles.add(new UserRole(user, new Role("Customer", "Customer role")));
        user.setUserRoles(roles);

        UserRepository userRepository = mock(UserRepository.class);
        when(userRepository.findByIdWithRoles(205)).thenReturn(Optional.of(user));

        SsoTicketService ticketService = new SsoTicketService(60_000, 60_000, 300_000);
        SsoService ssoService = new SsoService(
                userRepository, mock(AuthIdentityRepository.class), tokenProvider, ticketService,
                mock(AuthService.class));

        String ticket = ticketService.createLoginTicket(205, "GOOGLE", "sub-jwt");
        LoginResponse response = ssoService.exchangeLoginTicket(ticket);
        assertNotNull(response.getToken());

        JwtAuthenticationFilter filter = new JwtAuthenticationFilter(tokenProvider);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("Authorization", "Bearer " + response.getToken());
        MockHttpServletResponse httpResponse = new MockHttpServletResponse();

        filter.doFilter(request, httpResponse, new MockFilterChain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertNotNull(authentication, "the existing JWT filter must authenticate the SSO-issued token");
        assertTrue(authentication.isAuthenticated());
        CustomUserDetails principal = (CustomUserDetails) authentication.getPrincipal();
        assertEquals(205, principal.getUserId());
        assertEquals("jane@example.com", principal.getUsername());
        assertTrue(principal.getAuthorities().stream()
                        .anyMatch(authority -> authority.getAuthority().equals("ROLE_CUSTOMER")),
                "JWT roles must be carried through the existing authority mapping");
    }
}
