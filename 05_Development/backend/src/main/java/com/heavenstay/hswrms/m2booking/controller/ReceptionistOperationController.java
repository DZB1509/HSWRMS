package com.heavenstay.hswrms.m2booking.controller;

import com.heavenstay.hswrms.common.api.ApiResponse;
import com.heavenstay.hswrms.m2booking.dto.*;
import com.heavenstay.hswrms.m2booking.service.CustomerIdentityPort;
import com.heavenstay.hswrms.m2booking.service.ReceptionistOperationService;
import com.heavenstay.hswrms.security.CustomUserDetails;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
    public ResponseEntity<ApiResponse<ResidenceRecordResponse>> recordResidenceInfo(
            @PathVariable Integer bookingId,
            @Valid @RequestBody CheckInResidenceRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : 2;
        ResidenceRecordResponse record = receptionistService.recordResidenceInfo(bookingId, request, actorUserId);
        return ResponseEntity.ok(ApiResponse.ok("Residence declaration recorded successfully per Law on Residence 2020", record));
    }

    @PostMapping("/check-in/{bookingId}/assign-villa")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> assignVillaAndCheckIn(
            @PathVariable Integer bookingId,
            @Valid @RequestBody AssignVillaRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : 2;
        BookingSummaryResponse response = receptionistService.assignVillaAndCheckIn(
                bookingId,
                request.getPhysicalVillaId(),
                request.getHealthProfileConfirmed(),
                actorUserId
        );
        return ResponseEntity.ok(ApiResponse.ok("Physical villa assigned and check-in completed successfully", response));
    }

    @PostMapping("/walk-in")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> createWalkInBooking(
            @Valid @RequestBody WalkInBookingRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : 2;
        BookingSummaryResponse response = receptionistService.createWalkInBooking(request, actorUserId);
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
            @Valid @RequestBody UpdateVillaStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : 2;
        PhysicalVillaResponse response = receptionistService.updateVillaStatus(
                villaId,
                request.getNewStatus(),
                request.getNotes(),
                actorUserId
        );
        return ResponseEntity.ok(ApiResponse.ok("Villa status updated successfully", response));
    }

    @GetMapping("/customers/search")
    public ResponseEntity<ApiResponse<List<CustomerIdentityPort.CustomerContact>>> searchCustomers(
            @RequestParam String query,
            @RequestParam(defaultValue = "10") int limit) {
        List<CustomerIdentityPort.CustomerContact> results = receptionistService.searchCustomers(query, limit);
        return ResponseEntity.ok(ApiResponse.ok("Customer lookup completed", results));
    }

    @GetMapping("/bookings")
    public ResponseEntity<ApiResponse<List<ReceptionistBookingResponse>>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate checkInTo,
            @RequestParam(required = false) String query) {
        List<ReceptionistBookingResponse> list = receptionistService.getBookings(status, checkInFrom, checkInTo, query);
        return ResponseEntity.ok(ApiResponse.ok("Receptionist booking history retrieved successfully", list));
    }

    @GetMapping("/bookings/{bookingId}")
    public ResponseEntity<ApiResponse<ReceptionistBookingDetailResponse>> getBookingDetail(
            @PathVariable Integer bookingId) {
        ReceptionistBookingDetailResponse detail = receptionistService.getBookingDetail(bookingId);
        return ResponseEntity.ok(ApiResponse.ok("Booking details retrieved successfully", detail));
    }

    @PostMapping("/bookings/{bookingId}/cancel")
    public ResponseEntity<ApiResponse<BookingSummaryResponse>> cancelBooking(
            @PathVariable Integer bookingId,
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : 2;
        BookingSummaryResponse response = receptionistService.cancelBooking(bookingId, actorUserId);
        return ResponseEntity.ok(ApiResponse.ok("Booking cancelled successfully by front desk", response));
    }
}
