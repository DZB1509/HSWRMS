package com.heavenstay.hswrms.security;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import io.jsonwebtoken.Claims;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Pure unit tests for JWT issuance/verification round-trip and configuration validation.
 * The signing key below is a test-only fixture, never a real application secret.
 * These tests prove token semantics and configuration boundaries only; they are not evidence of SQL Server E2E behavior.
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

    @Test
    @DisplayName("Missing secret (null) throws IllegalStateException with clear message")
    void nullSecret_throwsIllegalStateException() {
        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> new JwtTokenProvider(null, ONE_HOUR_MS)
        );
        assertEquals("JWT_SECRET must be configured with at least 32 UTF-8 bytes.", ex.getMessage());
    }

    @Test
    @DisplayName("Empty or whitespace secret throws IllegalStateException")
    void emptyOrWhitespaceSecret_throwsIllegalStateException() {
        IllegalStateException exEmpty = assertThrows(
                IllegalStateException.class,
                () -> new JwtTokenProvider("", ONE_HOUR_MS)
        );
        assertEquals("JWT_SECRET must be configured with at least 32 UTF-8 bytes.", exEmpty.getMessage());

        IllegalStateException exBlank = assertThrows(
                IllegalStateException.class,
                () -> new JwtTokenProvider("   \t\n  ", ONE_HOUR_MS)
        );
        assertEquals("JWT_SECRET must be configured with at least 32 UTF-8 bytes.", exBlank.getMessage());
    }

    @Test
    @DisplayName("Secret shorter than 32 UTF-8 bytes throws IllegalStateException")
    void shortSecret_throwsIllegalStateException() {
        // Exactly 31 ASCII characters = 31 UTF-8 bytes
        String shortSecret = "1234567890123456789012345678901";
        assertEquals(31, shortSecret.getBytes(StandardCharsets.UTF_8).length);

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> new JwtTokenProvider(shortSecret, ONE_HOUR_MS)
        );
        assertEquals("JWT_SECRET must be configured with at least 32 UTF-8 bytes.", ex.getMessage());
    }

    @Test
    @DisplayName("Secret with at least 32 UTF-8 bytes initializes successfully")
    void validSecret_initializesSuccessfully() {
        // Exactly 32 ASCII characters = 32 UTF-8 bytes
        String exact32Bytes = "12345678901234567890123456789012";
        assertEquals(32, exact32Bytes.getBytes(StandardCharsets.UTF_8).length);

        JwtTokenProvider provider = new JwtTokenProvider(exact32Bytes, ONE_HOUR_MS);
        assertNotNull(provider);
        assertEquals(ONE_HOUR_MS, provider.getExpirationMs());
    }

    @Test
    @DisplayName("Unicode secret is measured by actual UTF-8 byte count, not character count")
    void unicodeSecret_measuredByUtf8Bytes() {
        // String with 28 characters (< 32 chars) but >= 32 UTF-8 bytes due to multibyte characters:
        // 'à' (2 bytes), 'ừ' (2 bytes), 'ế' (3 bytes) -> 28 + 1 + 1 + 2 = 32 UTF-8 bytes
        String unicodeKey = "ChàoMừngĐếnHeavenStayResort!";
        assertTrue(unicodeKey.length() < 32, "Character count must be less than 32");
        assertTrue(unicodeKey.getBytes(StandardCharsets.UTF_8).length >= 32, "UTF-8 byte count must be >= 32");

        JwtTokenProvider provider = new JwtTokenProvider(unicodeKey, ONE_HOUR_MS);
        assertNotNull(provider);

        // Test generation and validation with unicode-derived signing key
        String token = provider.generateToken(1, "customer@heavenstay.resort", "Test User", List.of("Customer"));
        assertTrue(provider.validateToken(token));
        assertEquals("customer@heavenstay.resort", provider.getUsernameFromToken(token));
    }

    @Test
    @DisplayName("Verify no weak fallback: empty property refuses initialization without defaulting")
    void noWeakFallback_refusesInitialization() {
        assertThrows(IllegalStateException.class, () -> new JwtTokenProvider("", ONE_HOUR_MS));
        assertThrows(IllegalStateException.class, () -> new JwtTokenProvider("weak-default", ONE_HOUR_MS));
    }
}
