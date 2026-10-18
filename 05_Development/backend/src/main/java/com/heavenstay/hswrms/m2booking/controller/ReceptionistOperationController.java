package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m2booking.dto.*;
import com.heavenstay.hswrms.m2booking.entity.ResidenceRecord;
import com.heavenstay.hswrms.m2booking.service.ReceptionistOperationService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/v1/receptionist")
public class ReceptionistOperationController {

    private final ReceptionistOperationService receptionistService;

    public ReceptionistOperationController(ReceptionistOperationService receptionistService) {
        this.receptionistService = receptionistService;
    }

    @GetMapping("/arrivals")
    public ResponseEntity<ApiResponse<List<DailyArrivalResponse>>> getDailyArrivals(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<DailyArrivalResponse> arrivals = receptionistService.getDailyArrivals(date);
        return ResponseEntity.ok(ApiResponse.ok("Daily arrivals retrieved successfully", arrivals));
    }

    @GetMapping({"/bookings/{bookingId}/available-villas", "/check-in/{bookingId}/available-villas"})
    public ResponseEntity<ApiResponse<List<PhysicalVillaResponse>>> getAvailableVillasForAssignment(
            @PathVariable Integer bookingId) {
        List<PhysicalVillaResponse> villas = receptionistService.getAvailableVillasForAssignment(bookingId);
        return ResponseEntity.ok(ApiResponse.ok("Available physical villas retrieved successfully", villas));
    }

    @PostMapping({"/check-in/{bookingId}/residence", "/check-in/{bookingId}/residence-record"})
    public ResponseEntity<ApiResponse<ResidenceRecord>> recordResidenceInfo(
            @PathVariable Integer bookingId,
            @Valid @RequestBody CheckInResidenceRequest request) {
        ResidenceRecord record = receptionistService.recordResidenceInfo(bookingId, request);
        return ResponseEntity.ok(ApiResponse.ok("Residence declaration recorded successfully per Law on Residence 2020", record));
    }

    @PostMapping("/check-in/{bookingId}/assign-villa")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> assignVillaAndCheckIn(
            @PathVariable Integer bookingId,
            @Valid @RequestBody AssignVillaRequest request) {
        BookingSummaryResponse response = receptionistService.assignVillaAndCheckIn(bookingId, request.getPhysicalVillaId());
        return ResponseEntity.ok(ApiResponse.ok("Physical villa assigned and check-in completed successfully", response));
    }

    @PostMapping("/walk-in")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> createWalkInBooking(
            @Valid @RequestBody WalkInBookingRequest request) {
        BookingSummaryResponse response = receptionistService.createWalkInBooking(request);
        return ResponseEntity.ok(ApiResponse.ok("Walk-in booking created and checked in successfully", response));
    }

    @GetMapping("/villas")
    public ResponseEntity<ApiResponse<List<PhysicalVillaResponse>>> getAllVillas(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) Integer categoryId) {
        List<PhysicalVillaResponse> villas = receptionistService.getAllVillas(status, categoryId);
        return ResponseEntity.ok(ApiResponse.ok("Physical villas retrieved successfully", villas));
    }

    @PatchMapping("/villas/{villaId}/status")
    public ResponseEntity<ApiResponse<PhysicalVillaResponse>> updateVillaStatus(
            @PathVariable Integer villaId,
            @Valid @RequestBody UpdateVillaStatusRequest request) {
        PhysicalVillaResponse response = receptionistService.updateVillaStatus(villaId, request.getNewStatus(), request.getNotes());
        return ResponseEntity.ok(ApiResponse.ok("Villa status updated successfully", response));
    }
}
