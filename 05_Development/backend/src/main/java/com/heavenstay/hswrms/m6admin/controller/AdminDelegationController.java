package com.heavenstay.hswrms.m6admin.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegablePermissionView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegationCreateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.DelegationView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.DelegationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/delegations")
public class AdminDelegationController {

    private final DelegationService service;

    public AdminDelegationController(DelegationService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@perm.has('S52','V')")
    public ResponseEntity<ApiResponse<List<DelegationView>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.list()));
    }

    @GetMapping("/delegable-permissions")
    @PreAuthorize("@perm.has('S52','V')")
    public ResponseEntity<ApiResponse<List<DelegablePermissionView>>> delegablePermissions() {
        return ResponseEntity.ok(ApiResponse.ok(service.delegablePermissions()));
    }

    @PostMapping
    @PreAuthorize("@perm.has('S52','C')")
    public ResponseEntity<ApiResponse<DelegationView>> create(@Valid @RequestBody DelegationCreateRequest req) {
        CurrentActor actor = CurrentActor.require();
        DelegationView created = service.create(req, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Administrative rights delegated successfully.", created));
    }

    @PostMapping("/{id}/revoke")
    @PreAuthorize("@perm.has('S52','D')")
    public ResponseEntity<ApiResponse<DelegationView>> revoke(@PathVariable Integer id) {
        CurrentActor actor = CurrentActor.require();
        DelegationView revoked = service.revoke(id, actor);
        return ResponseEntity.ok(ApiResponse.ok("Delegation revoked successfully.", revoked));
    }
}
