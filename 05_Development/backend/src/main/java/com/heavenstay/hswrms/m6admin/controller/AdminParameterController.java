package com.heavenstay.hswrms.m6admin.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.ParameterUpdateRequest;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.ParameterView;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.BusinessParameterService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/parameters")
public class AdminParameterController {

    private final BusinessParameterService service;

    public AdminParameterController(BusinessParameterService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@perm.has('S50','V')")
    public ResponseEntity<ApiResponse<List<ParameterView>>> list() {
        return ResponseEntity.ok(ApiResponse.ok(service.list()));
    }

    @PutMapping("/{key}")
    @PreAuthorize("@perm.has('S50','U')")
    public ResponseEntity<ApiResponse<ParameterView>> update(
            @PathVariable String key,
            @Valid @RequestBody ParameterUpdateRequest req) {
        CurrentActor actor = CurrentActor.require();
        ParameterView updated = service.update(key, req.value(), actor);
        return ResponseEntity.ok(ApiResponse.ok("Business parameter updated successfully.", updated));
    }
}
