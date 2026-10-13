package com.heavenstay.hswrms.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.jsonwebtoken.Claims;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Pure unit tests for JWT issuance/verification round-trip.
 * The signing key below is a test-only fixture, never a real application secret.
 * These tests prove token semantics only; they are not evidence of SQL Server E2E behavior.
 */
class JwtTokenProviderTest {

    private static final String TEST_ONLY_SIGNING_KEY = "unit-test-only-signing-key-min-32-bytes!!";
    private static final long ONE_HOUR_MS = 3_600_000L;

    @Test
    @DisplayName("generate -> validate round-trip preserves subject, userId, fullName and roles claims")
    void generateAndValidate_roundTrip_preservesClaims() {
        JwtTokenProvider provider = new JwtTokenProvider(TEST_ONLY_SIGNING_KEY, ONE_HOUR_MS);

        String token = provider.generateToken(42, "jane@example.com", "Jane Doe", List.of("Customer"));

        assertNotNull(token);
        assertTrue(provider.validateToken(token));

        Claims claims = provider.getClaimsFromToken(token);
        assertEquals("jane@example.com", claims.getSubject());
        assertEquals(42, claims.get("userId", Integer.class));
        assertEquals("Jane Doe", claims.get("fullName", String.class));
        assertEquals(List.of("Customer"), claims.get("roles"));
        assertEquals("jane@example.com", provider.getUsernameFromToken(token));
    }

    @Test
    @DisplayName("Token issued with an elapsed expiration is rejected by validateToken")
    void expiredToken_isRejected() {
        JwtTokenProvider expiredProvider = new JwtTokenProvider(TEST_ONLY_SIGNING_KEY, -1_000L);

        String token = expiredProvider.generateToken(42, "jane@example.com", "Jane Doe", List.of("Customer"));

        assertFalse(expiredProvider.validateToken(token));
    }

    @Test
    @DisplayName("Malformed/garbage token is rejected by validateToken")
    void malformedToken_isRejected() {
        JwtTokenProvider provider = new JwtTokenProvider(TEST_ONLY_SIGNING_KEY, ONE_HOUR_MS);

        assertFalse(provider.validateToken("not-a-jwt"));
        assertFalse(provider.validateToken(""));
    }
}