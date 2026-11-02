package com.heavenstay.hswrms.m6admin.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixChangeRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixDiffEntry;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.MatrixView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.PermissionMatrixService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/permissions")
public class AdminPermissionController {

    private final PermissionMatrixService service;

    public AdminPermissionController(PermissionMatrixService service) {
        this.service = service;
    }

    @GetMapping("/matrix")
    @PreAuthorize("@perm.has('S51','V')")
    public ResponseEntity<ApiResponse<MatrixView>> getMatrix() {
        return ResponseEntity.ok(ApiResponse.ok(service.getMatrix()));
    }

    @PostMapping("/matrix/preview")
    @PreAuthorize("@perm.has('S51','G')")
    public ResponseEntity<ApiResponse<List<MatrixDiffEntry>>> preview(@Valid @RequestBody MatrixChangeRequest req) {
        return ResponseEntity.ok(ApiResponse.ok(service.preview(req.changes())));
    }

    @PutMapping("/matrix")
    @PreAuthorize("@perm.has('S51','G')")
    public ResponseEntity<ApiResponse<List<MatrixDiffEntry>>> apply(@Valid @RequestBody MatrixChangeRequest req) {
        CurrentActor actor = CurrentActor.require();
        List<MatrixDiffEntry> diff = service.apply(req.changes(), actor);
        return ResponseEntity.ok(ApiResponse.ok("Permission matrix updated successfully.", diff));
    }
}
