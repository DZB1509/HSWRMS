package com.heavenstay.hswrms.m6admin.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.PageView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.RoleView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffCreateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffCreatedView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffStatusRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffUpdateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.StaffView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.StaffAccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/staff")
public class AdminStaffController {

    private final StaffAccountService service;

    public AdminStaffController(StaffAccountService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@perm.has('S10','V')")
    public ResponseEntity<ApiResponse<PageView<StaffView>>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.ok(service.search(q, role, status, page, size)));
    }

    @GetMapping("/roles")
    @PreAuthorize("@perm.has('S10','V')")
    public ResponseEntity<ApiResponse<List<RoleView>>> staffRoles() {
        return ResponseEntity.ok(ApiResponse.ok(service.staffRoles()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('S11','V')")
    public ResponseEntity<ApiResponse<StaffView>> get(@PathVariable Integer id) {
        return ResponseEntity.ok(ApiResponse.ok(service.get(id)));
    }

    @PostMapping
    @PreAuthorize("@perm.has('S11','C')")
    public ResponseEntity<ApiResponse<StaffCreatedView>> create(@Valid @RequestBody StaffCreateRequest req) {
        CurrentActor actor = CurrentActor.require();
        StaffCreatedView created = service.create(req, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Staff account created successfully.", created));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@perm.has('S11','U')")
    public ResponseEntity<ApiResponse<StaffView>> update(@PathVariable Integer id,
                                                         @Valid @RequestBody StaffUpdateRequest req) {
        CurrentActor actor = CurrentActor.require();
        StaffView updated = service.update(id, req, actor);
        return ResponseEntity.ok(ApiResponse.ok("Staff account updated successfully.", updated));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("@perm.has('S11','D')")
    public ResponseEntity<ApiResponse<StaffView>> changeStatus(@PathVariable Integer id,
                                                               @Valid @RequestBody StaffStatusRequest req) {
        CurrentActor actor = CurrentActor.require();
        StaffView updated = service.changeStatus(id, req.status(), actor);
        return ResponseEntity.ok(ApiResponse.ok("Staff account status updated successfully.", updated));
    }
}
