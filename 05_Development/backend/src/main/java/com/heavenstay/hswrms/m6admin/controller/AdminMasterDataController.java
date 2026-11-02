package com.heavenstay.hswrms.m6admin.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.MasterDataService;
import com.heavenstay.hswrms.m6admin.service.MasterDataService.MasterDataItem;
import com.heavenstay.hswrms.m6admin.service.MasterDataService.MasterDataSaveRequest;
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
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/master-data")
public class AdminMasterDataController {

    private final MasterDataService service;

    public AdminMasterDataController(MasterDataService service) {
        this.service = service;
    }

    @GetMapping("/{group}")
    @PreAuthorize("@perm.has('S12','V')")
    public ResponseEntity<ApiResponse<List<MasterDataItem>>> list(@PathVariable String group) {
        return ResponseEntity.ok(ApiResponse.ok(service.list(group)));
    }

    @PostMapping("/{group}")
    @PreAuthorize("@perm.has('S12','C')")
    public ResponseEntity<ApiResponse<MasterDataItem>> create(
            @PathVariable String group,
            @RequestBody MasterDataSaveRequest req) {
        CurrentActor actor = CurrentActor.require();
        MasterDataItem item = service.create(group, req, actor);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Master data created successfully.", item));
    }

    @PutMapping("/{group}/{id}")
    @PreAuthorize("@perm.has('S12','U')")
    public ResponseEntity<ApiResponse<MasterDataItem>> update(
            @PathVariable String group,
            @PathVariable Integer id,
            @RequestBody MasterDataSaveRequest req) {
        CurrentActor actor = CurrentActor.require();
        MasterDataItem item = service.update(group, id, req, actor);
        return ResponseEntity.ok(ApiResponse.ok("Master data updated successfully.", item));
    }

    @PatchMapping("/{group}/{id}/deactivate")
    @PreAuthorize("@perm.has('S12','D')")
    public ResponseEntity<ApiResponse<Void>> deactivate(
            @PathVariable String group,
            @PathVariable Integer id) {
        CurrentActor actor = CurrentActor.require();
        service.deactivate(group, id, actor);
        return ResponseEntity.ok(ApiResponse.ok("Master data deactivated successfully.", null));
    }
}
