package com.heavenstay.hswrms.m6admin.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.AuditView;
import com.heavenstay.hswrms.m6admin.dto.AdminDtos.PageView;
import com.heavenstay.hswrms.m6admin.entity.AuditLog;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import com.heavenstay.hswrms.m6admin.service.AuditLogService;
import com.heavenstay.hswrms.m6admin.service.AuditLogService.AuditFilter;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
public class AdminAuditLogController {

    private final AuditLogService service;

    public AdminAuditLogController(AuditLogService service) {
        this.service = service;
    }

    @GetMapping
    @PreAuthorize("@perm.has('S53','V')")
    public ResponseEntity<ApiResponse<PageView<AuditView>>> list(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Integer actorUserId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String dataType,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        CurrentActor actor = CurrentActor.require();
        try {
            validateDateRange(from, to);
        } catch (BusinessRuleException ex) {
            service.record(actor, "View Audit Log List", "AuditLog", "PAGE_" + page, AuditLogService.FAILED, null, ex.getErrorCode());
            throw ex;
        }

        service.record(actor, "View Audit Log List", "AuditLog", "PAGE_" + page, AuditLogService.SUCCESS);

        int safeSize = Math.min(Math.max(size, 1), 100);
        AuditFilter filter = new AuditFilter(from, to, actorUserId, role, action, dataType, status);
        Page<AuditLog> result = service.search(filter,
                PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "createdAt", "auditLogId")));

        List<AuditView> views = result.getContent().stream().map(AdminAuditLogController::toView).toList();
        PageView<AuditView> pageView = new PageView<>(views, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());

        return ResponseEntity.ok(ApiResponse.ok(pageView));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@perm.has('S53','V')")
    public ResponseEntity<ApiResponse<AuditView>> get(@PathVariable Long id) {
        AuditLog log = service.find(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit record", "id", id));
        CurrentActor actor = CurrentActor.require();
        service.record(actor, "View Audit Log Detail", "AuditLog", String.valueOf(id), AuditLogService.SUCCESS);
        return ResponseEntity.ok(ApiResponse.ok(toView(log)));
    }

    @GetMapping("/export")
    @PreAuthorize("@perm.has('S53','E')")
    public ResponseEntity<String> exportCsv(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(required = false) Integer actorUserId,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String dataType,
            @RequestParam(required = false) String status) {
        CurrentActor actor = CurrentActor.require();
        try {
            validateDateRange(from, to);
        } catch (BusinessRuleException ex) {
            service.record(actor, "Export Sensitive Audit Log", "AuditLog", "CSV", AuditLogService.FAILED, null, ex.getErrorCode());
            throw ex;
        }

        service.record(actor, "Export Sensitive Audit Log", "AuditLog", "CSV", AuditLogService.SUCCESS);

        AuditFilter filter = new AuditFilter(from, to, actorUserId, role, action, dataType, status);
        List<AuditLog> list = service.searchAll(filter, 5000);

        StringBuilder sb = new StringBuilder("AuditLogID,CreatedAt,ActorUserID,ActorRole,Action,TargetDataType,TargetRefID,AccessStatus,DelegationID\n");
        for (AuditLog l : list) {
            sb.append(l.getAuditLogId()).append(",")
                    .append(l.getCreatedAt()).append(",")
                    .append(l.getActorUserId() != null ? l.getActorUserId() : "").append(",")
                    .append(escape(l.getActorRole())).append(",")
                    .append(escape(l.getAction())).append(",")
                    .append(escape(l.getTargetDataType())).append(",")
                    .append(escape(l.getTargetRefId())).append(",")
                    .append(escape(l.getAccessStatus())).append(",")
                    .append(l.getDelegationId() != null ? l.getDelegationId() : "")
                    .append("\n");
        }

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"audit-log-" + System.currentTimeMillis() + ".csv\"")
                .contentType(MediaType.parseMediaType("text/csv; charset=UTF-8"))
                .body(sb.toString());
    }

    private static void validateDateRange(LocalDateTime from, LocalDateTime to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new BusinessRuleException("M6-MSG-08", "Invalid date range. Start date must be prior to end date.");
        }
    }

    private static String escape(String s) {
        if (s == null) return "";
        return "\"" + s.replace("\"", "\"\"") + "\"";
    }

    private static AuditView toView(AuditLog l) {
        return new AuditView(
                l.getAuditLogId(),
                l.getCreatedAt().toInstant(ZoneOffset.UTC),
                l.getActorUserId(),
                l.getActorRole(),
                l.getAction(),
                l.getTargetDataType(),
                l.getTargetRefId(),
                l.getAccessStatus(),
                l.getOldValue(),
                l.getNewValue(),
                l.getDelegationId()
        );
    }
}
