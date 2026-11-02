package com.heavenstay.hswrms.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.GrantedAuthority;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;

class CustomUserDetailsTest {

    @Test
    @DisplayName("ROLE-MAP-01: Canonical DB role 'F&B Staff' maps to exactly ROLE_FNB_STAFF without redundant ROLE_F&B STAFF")
    void canonicalFnbStaffRoleMapping() {
        List<String> authorities = CustomUserDetails.normalizeRoleAuthorities("F&B Staff");
        assertEquals(List.of("ROLE_FNB_STAFF"), authorities, "Must strictly equal [ROLE_FNB_STAFF]");
        assertFalse(authorities.contains("ROLE_F&B STAFF"), "Must not emit redundant ROLE_F&B STAFF");
    }

    @Test
    @DisplayName("ROLE-MAP-02: Aliases of F&B Staff (FB_STAFF, fnb_staff, ROLE_FNB_STAFF) map correctly to ROLE_FNB_STAFF")
    void fnbStaffAliasesMapping() {
        assertAll(
                () -> assertEquals(List.of("ROLE_FNB_STAFF"), CustomUserDetails.normalizeRoleAuthorities("FB_STAFF")),
                () -> assertEquals(List.of("ROLE_FNB_STAFF"), CustomUserDetails.normalizeRoleAuthorities("fnb_staff")),
                () -> assertEquals(List.of("ROLE_FNB_STAFF"), CustomUserDetails.normalizeRoleAuthorities("ROLE_FNB_STAFF")),
                () -> assertEquals(List.of("ROLE_FNB_STAFF"), CustomUserDetails.normalizeRoleAuthorities("f&b staff")),
                () -> assertEquals(List.of("ROLE_FNB_STAFF"), CustomUserDetails.normalizeRoleAuthorities("FNBSTAFF"))
        );
    }

    @Test
    @DisplayName("ROLE-MAP-03: Standard non-F&B roles map cleanly without side effects")
    void standardRolesMapping() {
        assertEquals(List.of("ROLE_CUSTOMER"), CustomUserDetails.normalizeRoleAuthorities("Customer"));
        assertEquals(List.of("ROLE_RECEPTIONIST"), CustomUserDetails.normalizeRoleAuthorities("Receptionist"));
        assertEquals(List.of("ROLE_THERAPIST"), CustomUserDetails.normalizeRoleAuthorities("Therapist"));
        assertEquals(List.of("ROLE_MANAGER"), CustomUserDetails.normalizeRoleAuthorities("Manager"));
        assertEquals(List.of("ROLE_ADMIN"), CustomUserDetails.normalizeRoleAuthorities("Admin"));
    }

    @Test
    @DisplayName("ROLE-MAP-04: Null, empty and whitespace-only roles return empty list safely")
    void nullAndBlankHandling() {
        assertTrue(CustomUserDetails.normalizeRoleAuthorities(null).isEmpty());
        assertTrue(CustomUserDetails.normalizeRoleAuthorities("").isEmpty());
        assertTrue(CustomUserDetails.normalizeRoleAuthorities("   ").isEmpty());
    }

    @Test
    @DisplayName("ROLE-MAP-05: CustomUserDetails grants ROLE_FNB_STAFF when initialized with DB role 'F&B Staff'")
    void customUserDetailsAuthorities() {
        CustomUserDetails user = new CustomUserDetails(
                4, "fbstaff@heavenstay.dev", "hash", "Demo F&B Staff", true, List.of("F&B Staff")
        );

        Set<String> authNames = user.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .collect(Collectors.toSet());

        assertTrue(authNames.contains("ROLE_FNB_STAFF"), "Authorities must include ROLE_FNB_STAFF");
        assertFalse(authNames.contains("ROLE_F&B STAFF"), "Authorities must not include redundant ROLE_F&B STAFF");
        assertFalse(authNames.contains("ROLE_CUSTOMER"), "Authorities must not include ROLE_CUSTOMER");
        assertFalse(authNames.contains("ROLE_ADMIN"), "Authorities must not include ROLE_ADMIN");
        assertEquals(1, authNames.size(), "Should have exactly one granted authority");
    }

    @Test
    @DisplayName("ROLE-MAP-06: CustomUserDetails handles null roles list without NullPointerException")
    void nullRolesListHandledSafely() {
        CustomUserDetails user = new CustomUserDetails(
                1, "guest@heavenstay.dev", "hash", "Guest", true, null
        );
        assertNotNull(user.getAuthorities());
        assertTrue(user.getAuthorities().isEmpty());
    }
}
