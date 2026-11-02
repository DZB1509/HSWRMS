package com.heavenstay.hswrms.m6admin;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixChange;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixDiffEntry;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.PermissionMatrixService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(properties = {
        "app.seed.demo-data=false"
})
@Transactional
public class PermissionMatrixServiceTest {

    @Autowired
    private PermissionMatrixService matrixService;

    private final CurrentActor adminActor = new CurrentActor(1, "admin@heavenstay.com", "ADMIN", true);

    @Test
    @DisplayName("UC81: Get permission matrix returns roles and rows")
    void getMatrixReturnsRows() {
        MatrixView matrix = matrixService.getMatrix();
        assertNotNull(matrix);
        assertNotNull(matrix.roles());
        assertNotNull(matrix.rows());
        assertFalse(matrix.rows().isEmpty());
    }

    @Test
    @DisplayName("UC81: Sensitive data minimization rejects granting DATA_HEALTH_FULL to ADMIN (M6-MSG-05)")
    void sensitiveDataMinimizationEnforced() {
        MatrixChange change = new MatrixChange("ADMIN", "DATA_HEALTH_FULL", "V", true);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                matrixService.apply(List.of(change), adminActor));
        assertEquals("M6-MSG-05", ex.getErrorCode());
    }

    @Test
    @DisplayName("UC81: Admin locked screens cannot be removed from Admin (ADMIN_LOCKED)")
    void adminLockedScreensCannotBeRevoked() {
        MatrixChange change = new MatrixChange("ADMIN", "S10", "V", false);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                matrixService.apply(List.of(change), adminActor));
        assertEquals("ADMIN_LOCKED", ex.getErrorCode());
    }

    @Test
    @DisplayName("UC81: Admin-only permissions cannot be assigned to non-admin roles (ADMIN_ONLY_PERMISSION)")
    void adminOnlyPermissionCannotBeGrantedToNonAdmin() {
        // S10:V is adminOnly=true
        MatrixChange change = new MatrixChange("MANAGER", "S10", "V", true);

        BusinessRuleException ex = assertThrows(BusinessRuleException.class, () ->
                matrixService.apply(List.of(change), adminActor));
        assertEquals("ADMIN_ONLY_PERMISSION", ex.getErrorCode());
    }

    @Test
    @DisplayName("UC81: Valid permission change preview and apply")
    void previewAndApplyValidChange() {
        // S46:V for RECEPTIONIST (starts false)
        MatrixChange change = new MatrixChange("RECEPTIONIST", "S46", "V", true);

        List<MatrixDiffEntry> preview = matrixService.preview(List.of(change));
        assertNotNull(preview);
        assertEquals(1, preview.size());
        assertTrue(preview.get(0).to());

        List<MatrixDiffEntry> applied = matrixService.apply(List.of(change), adminActor);
        assertNotNull(applied);
        assertEquals(1, applied.size());
    }

    @Test
    @DisplayName("UC81: Non-admin caller is rejected with AccessDeniedException when applying matrix changes")
    void nonAdminCannotApplyMatrixChanges() {
        CurrentActor nonAdminActor = new CurrentActor(2, "manager@heavenstay.com", "MANAGER", false);
        MatrixChange change = new MatrixChange("RECEPTIONIST", "S46", "V", true);

        assertThrows(org.springframework.security.access.AccessDeniedException.class, () ->
                matrixService.apply(List.of(change), nonAdminActor));
    }
}
