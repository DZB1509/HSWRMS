package com.heavenstay.hswrms.m5billing.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m5billing.dto.OccupancyAnalyticsDTO;
import com.heavenstay.hswrms.m5billing.dto.RevenueAnalyticsDTO;
import com.heavenstay.hswrms.m5billing.dto.TherapistUtilizationDTO;
import com.heavenstay.hswrms.m5billing.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/analytics")
@PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<RevenueAnalyticsDTO>> getRevenueAnalytics(
            @RequestParam(name = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        RevenueAnalyticsDTO response = analyticsService.getRevenueAnalytics(fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.ok("Revenue analytics retrieved successfully", response));
    }

    @GetMapping("/occupancy")
    public ResponseEntity<ApiResponse<OccupancyAnalyticsDTO>> getOccupancyAnalytics(
            @RequestParam(name = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        OccupancyAnalyticsDTO response = analyticsService.getOccupancyAnalytics(fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.ok("Occupancy analytics retrieved successfully", response));
    }

    @GetMapping("/therapist-utilization")
    public ResponseEntity<ApiResponse<TherapistUtilizationDTO>> getTherapistUtilization(
            @RequestParam(name = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        TherapistUtilizationDTO response = analyticsService.getTherapistUtilization(fromDate, toDate);
        return ResponseEntity.ok(ApiResponse.ok("Therapist utilization analytics retrieved successfully", response));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> exportReportToExcel(
            @RequestParam(name = "type", defaultValue = "revenue") String type,
            @RequestParam(name = "fromDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate,
            @RequestParam(name = "toDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate) {
        byte[] excelBytes = analyticsService.exportReportToExcel(type, fromDate, toDate);
        String filename = "hswrms-" + type.toLowerCase() + "-report-" + LocalDate.now() + ".xlsx";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(excelBytes);
    }
}
