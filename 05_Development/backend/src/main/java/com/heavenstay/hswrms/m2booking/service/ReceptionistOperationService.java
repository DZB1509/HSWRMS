package com.heavenstay.hswrms.m2booking.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.dto.*;
import com.heavenstay.hswrms.m2booking.entity.PaymentTransaction;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVilla;
import com.heavenstay.hswrms.m2booking.entity.ResidenceRecord;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@Transactional
public class ReceptionistOperationService {

    private final RetreatBookingRepository bookingRepository;
    private final PhysicalVillaRepository physicalVillaRepository;
    private final ResidenceRecordRepository residenceRecordRepository;
    private final RetreatPackageRepository packageRepository;
    private final VillaCategoryRepository villaCategoryRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final VillaAvailabilityService availabilityService;
    private final CustomerIdentityPort customerIdentityPort;
    private final BookingClock bookingClock;
    private final BookingAuditService bookingAuditService;

    public ReceptionistOperationService(RetreatBookingRepository bookingRepository,
                                        PhysicalVillaRepository physicalVillaRepository,
                                        ResidenceRecordRepository residenceRecordRepository,
                                        RetreatPackageRepository packageRepository,
                                        VillaCategoryRepository villaCategoryRepository,
                                        PaymentTransactionRepository paymentTransactionRepository,
                                        VillaAvailabilityService availabilityService,
                                        CustomerIdentityPort customerIdentityPort,
                                        BookingClock bookingClock,
                                        BookingAuditService bookingAuditService) {
        this.bookingRepository = bookingRepository;
        this.physicalVillaRepository = physicalVillaRepository;
        this.residenceRecordRepository = residenceRecordRepository;
        this.packageRepository = packageRepository;
        this.villaCategoryRepository = villaCategoryRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.availabilityService = availabilityService;
        this.customerIdentityPort = customerIdentityPort;
        this.bookingClock = bookingClock;
        this.bookingAuditService = bookingAuditService;
    }

    /**
     * Sửa lỗi B10: Get daily arrivals with real customer identity and health profile status from SQL Server.
     */
    @Transactional(readOnly = true)
    public List<DailyArrivalResponse> getDailyArrivals(LocalDate date) {
        LocalDate queryDate = date != null ? date : bookingClock.resortToday();
        List<RetreatBooking> arrivals = bookingRepository.findArrivalsByDate(queryDate);

        Set<Integer> profileIds = arrivals.stream()
                .map(RetreatBooking::getCustomerProfileId)
                .collect(Collectors.toSet());

        Map<Integer, CustomerIdentityPort.CustomerContact> contacts = customerIdentityPort.findContacts(profileIds);

        return arrivals.stream()
                .map(rb -> toArrivalResponse(rb, contacts.get(rb.getCustomerProfileId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PhysicalVillaResponse> getAvailableVillasForAssignment(Integer bookingId) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));

        Integer categoryId = booking.getRequestedVillaCategory().getVillaCategoryId();
        List<PhysicalVilla> villas = physicalVillaRepository
                .findByVillaCategory_VillaCategoryIdAndVillaStatus(categoryId, "AVAILABLE");

        // Filter out any villa that might already have an active checked-in booking
        return villas.stream()
                .filter(v -> !bookingRepository.existsByAssignedVilla_VillaIdAndBookingStatus(v.getVillaId(), "CHECKED_IN"))
                .map(this::toVillaResponse)
                .collect(Collectors.toList());
    }

    /**
     * Sửa lỗi B12: Returns ResidenceRecordResponse DTO instead of raw entity.
     */
    public ResidenceRecordResponse recordResidenceInfo(Integer bookingId, CheckInResidenceRequest request, Integer actorUserId) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));

        ResidenceRecord record = residenceRecordRepository.findByRetreatBooking_RetreatBookingId(bookingId)
                .orElse(new ResidenceRecord());

        record.setRetreatBooking(booking);
        record.setIdentificationNumber(request.getIdentificationNumber().trim());
        record.setIdentificationType(request.getIdentificationType().trim());
        record.setNationality(request.getNationality() != null ? request.getNationality().trim() : "Việt Nam");
        record.setPermanentAddress(request.getPermanentAddress() != null ? request.getPermanentAddress().trim() : "");
        record.setCollectedAt(bookingClock.utcNow());

        ResidenceRecord saved = residenceRecordRepository.save(record);

        bookingAuditService.record(
                actorUserId != null ? actorUserId : 2,
                "RECORD_RESIDENCE",
                "ResidenceRecord for Booking #" + bookingId,
                "SUCCESS"
        );

        ResidenceRecordResponse res = new ResidenceRecordResponse();
        res.setRecordId(saved.getResidenceRecordId());
        res.setRetreatBookingId(bookingId);
        res.setIdentificationNumber(saved.getIdentificationNumber());
        res.setIdentificationType(saved.getIdentificationType());
        res.setNationality(saved.getNationality());
        res.setPermanentAddress(saved.getPermanentAddress());
        res.setCollectedAt(saved.getCollectedAt());
        return res;
    }

    /**
     * Sửa lỗi B12 & B14: Check-in with health profile verification and physical villa assignment.
     */
    public BookingSummaryResponse assignVillaAndCheckIn(Integer bookingId, Integer physicalVillaId, Boolean healthProfileConfirmed, Integer actorUserId) {
        RetreatBooking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));

        if (!"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new BusinessRuleException("Cannot check in booking #" + bookingId + " with status '" +
                    booking.getBookingStatus() + "'. Booking must be CONFIRMED (deposit paid).");
        }

        // Check Law on Residence 2020 requirement
        boolean hasResidence = residenceRecordRepository.existsByRetreatBooking_RetreatBookingId(bookingId);
        if (!hasResidence) {
            throw new BusinessRuleException("Cannot complete check-in: Mandatory residence declaration (Luật Cư trú 2020) is missing");
        }

        // Check HealthProfile readiness (FR-M2-03 Alt 1)
        boolean hasHealth = customerIdentityPort.hasHealthProfile(booking.getCustomerProfileId());
        if (!hasHealth && !Boolean.TRUE.equals(healthProfileConfirmed)) {
            throw new BusinessRuleException("Health declaration profile is missing for customer. " +
                    "Receptionist must ensure health profile is recorded or obtain explicit confirmation prior to check-in.");
        }

        PhysicalVilla villa = physicalVillaRepository.findByIdForUpdate(physicalVillaId)
                .orElseThrow(() -> new ResourceNotFoundException("Physical Villa #" + physicalVillaId + " not found"));

        if (!"AVAILABLE".equalsIgnoreCase(villa.getVillaStatus())) {
            throw new BusinessRuleException("Physical Villa " + villa.getVillaNumber() + " is currently " +
                    villa.getVillaStatus() + " and cannot be assigned");
        }

        if (bookingRepository.existsByAssignedVilla_VillaIdAndBookingStatus(physicalVillaId, "CHECKED_IN")) {
            throw new BusinessRuleException("Physical Villa " + villa.getVillaNumber() + " is already occupied by another checked-in booking");
        }

        Integer bookedCatId = booking.getRequestedVillaCategory().getVillaCategoryId();
        Integer villaCatId = villa.getVillaCategory().getVillaCategoryId();
        if (!bookedCatId.equals(villaCatId)) {
            throw new BusinessRuleException("Villa category mismatch: Booked category is '" +
                    booking.getRequestedVillaCategory().getCategoryName() + "' but selected villa belongs to '" +
                    villa.getVillaCategory().getCategoryName() + "'");
        }

        villa.setVillaStatus("OCCUPIED");
        physicalVillaRepository.save(villa);

        booking.setAssignedVilla(villa);
        booking.setBookingStatus("CHECKED_IN");
        RetreatBooking saved = bookingRepository.save(booking);

        bookingAuditService.record(
                actorUserId != null ? actorUserId : 2,
                "CHECK_IN_ASSIGN_VILLA",
                "Booking #" + bookingId + " -> Villa " + villa.getVillaNumber(),
                "SUCCESS"
        );

        BookingSummaryResponse res = new BookingSummaryResponse();
        res.setRetreatBookingId(saved.getRetreatBookingId());
        res.setCustomerProfileId(saved.getCustomerProfileId());
        res.setRetreatPackageId(saved.getRetreatPackage().getRetreatPackageId());
        res.setPackageName(saved.getRetreatPackage().getPackageName());
        res.setRequestedVillaCategoryId(saved.getRequestedVillaCategory().getVillaCategoryId());
        res.setRequestedCategoryName(saved.getRequestedVillaCategory().getCategoryName());
        res.setAssignedVillaId(villa.getVillaId());
        res.setAssignedVillaNumber(villa.getVillaNumber());
        res.setCheckInDate(saved.getCheckInDate());
        res.setCheckOutDate(saved.getCheckOutDate());
        res.setBookingStatus(saved.getBookingStatus());
        res.setDepositAmount(saved.getDepositAmount());
        res.setTotalEstimatedAmount(saved.getTotalEstimatedAmount());
        res.setSpecialRequest(saved.getSpecialRequest());
        res.setGuestCount(saved.getGuestCount() != null ? saved.getGuestCount() : 1);
        res.setCreatedAt(saved.getCreatedAt());
        res.setHasResidenceRecord(true);
        res.setPaymentStatus("SUCCESSFUL");

        return res;
    }

    /**
     * Sửa lỗi B11: Create walk-in booking adhering to FR-M2-06.
     */
    public BookingSummaryResponse createWalkInBooking(WalkInBookingRequest request, Integer actorUserId) {
        RetreatPackage pkg = packageRepository.findById(request.getRetreatPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat package not found: " + request.getRetreatPackageId()));

        VillaCategory category = villaCategoryRepository.findByIdForUpdate(request.getVillaCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Villa category not found: " + request.getVillaCategoryId()));

        // Sửa lỗi B6: Eligibility check
        boolean isEligible = pkg.getEligibleVillaCategories() == null || pkg.getEligibleVillaCategories().isEmpty()
                || pkg.getEligibleVillaCategories().stream()
                        .anyMatch(vc -> vc.getVillaCategoryId().equals(category.getVillaCategoryId()));

        if (!isEligible) {
            throw new BusinessRuleException("Villa category '" + category.getCategoryName() +
                    "' is not eligible for retreat package '" + pkg.getPackageName() + "'");
        }

        int guestCount = (request.getGuestCount() != null && request.getGuestCount() > 0)
                ? request.getGuestCount()
                : 1;

        if (category.getMaxOccupancy() != null && guestCount > category.getMaxOccupancy()) {
            throw new BusinessRuleException("Guest count (" + guestCount + ") exceeds maximum occupancy (" +
                    category.getMaxOccupancy() + ") for villa category '" + category.getCategoryName() + "'");
        }

        PhysicalVilla villa = physicalVillaRepository.findByIdForUpdate(request.getPhysicalVillaId())
                .orElseThrow(() -> new ResourceNotFoundException("Physical Villa #" + request.getPhysicalVillaId() + " not found"));

        if (!"AVAILABLE".equalsIgnoreCase(villa.getVillaStatus())) {
            throw new BusinessRuleException("Physical Villa " + villa.getVillaNumber() + " is currently " + villa.getVillaStatus());
        }

        if (!villa.getVillaCategory().getVillaCategoryId().equals(category.getVillaCategoryId())) {
            throw new BusinessRuleException("Selected physical villa does not belong to category: " + category.getCategoryName());
        }

        // Resolve or create customer profile
        int resolvedProfileId;
        if (request.getCustomerProfileId() != null && request.getCustomerProfileId() > 0) {
            resolvedProfileId = request.getCustomerProfileId();
        } else {
            resolvedProfileId = customerIdentityPort.getOrCreateCustomerProfile(
                    request.getGuestFullName(),
                    request.getGuestEmail(),
                    request.getGuestPhone()
            );
        }

        BookingCalculationRequest calcReq = new BookingCalculationRequest();
        calcReq.setRetreatPackageId(pkg.getRetreatPackageId());
        calcReq.setVillaCategoryId(category.getVillaCategoryId());
        calcReq.setCheckInDate(request.getCheckInDate());
        calcReq.setCheckOutDate(request.getCheckOutDate());
        calcReq.setGuestCount(guestCount);
        BookingCalculationResponse calcRes = availabilityService.calculateBooking(calcReq);

        RetreatBooking booking = new RetreatBooking();
        booking.setCustomerProfileId(resolvedProfileId);
        booking.setRetreatPackage(pkg);
        booking.setRequestedVillaCategory(category);
        booking.setAssignedVilla(villa);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setBookingStatus("CHECKED_IN");
        booking.setTotalEstimatedAmount(calcRes.getTotalEstimatedAmount());
        booking.setDepositAmount(calcRes.getRequiredDepositAmount());
        booking.setGuestCount(guestCount);
        booking.setSpecialRequest(request.getSpecialRequest() != null ? request.getSpecialRequest() : "Walk-in Booking (Paid by " + request.getInitialPaymentMethod() + ")");
        booking.setCreatedAt(bookingClock.utcNow());

        RetreatBooking savedBooking = bookingRepository.save(booking);

        // Record immediate deposit payment transaction for walk-in
        PaymentTransaction txn = new PaymentTransaction();
        txn.setRetreatBookingId(savedBooking.getRetreatBookingId());
        txn.setPaymentType(PaymentTransaction.TYPE_DEPOSIT);
        txn.setPaymentMethod(request.getInitialPaymentMethod() != null ? request.getInitialPaymentMethod().toUpperCase() : PaymentTransaction.METHOD_CASH);
        txn.setTransactionReference("WALK_IN_" + savedBooking.getRetreatBookingId() + "_" + System.currentTimeMillis());
        txn.setAmountPaid(calcRes.getRequiredDepositAmount());
        txn.setPaymentStatus(PaymentTransaction.STATUS_SUCCESSFUL);
        txn.setTransactionDate(bookingClock.utcNow());
        paymentTransactionRepository.save(txn);

        // Record residence record
        ResidenceRecord record = new ResidenceRecord();
        record.setRetreatBooking(savedBooking);
        record.setIdentificationNumber(request.getIdentificationNumber().trim());
        record.setIdentificationType(request.getIdentificationType().trim());
        record.setNationality(request.getNationality() != null ? request.getNationality().trim() : "Việt Nam");
        record.setPermanentAddress(request.getPermanentAddress() != null ? request.getPermanentAddress().trim() : "");
        record.setCollectedAt(bookingClock.utcNow());
        residenceRecordRepository.save(record);

        villa.setVillaStatus("OCCUPIED");
        physicalVillaRepository.save(villa);

        bookingAuditService.record(
                actorUserId != null ? actorUserId : 2,
                "WALK_IN_CHECK_IN",
                "Walk-in Booking #" + savedBooking.getRetreatBookingId() + " -> Villa " + villa.getVillaNumber(),
                "SUCCESS"
        );

        BookingSummaryResponse res = new BookingSummaryResponse();
        res.setRetreatBookingId(savedBooking.getRetreatBookingId());
        res.setCustomerProfileId(savedBooking.getCustomerProfileId());
        res.setPackageName(pkg.getPackageName());
        res.setRequestedCategoryName(category.getCategoryName());
        res.setAssignedVillaId(villa.getVillaId());
        res.setAssignedVillaNumber(villa.getVillaNumber());
        res.setCheckInDate(savedBooking.getCheckInDate());
        res.setCheckOutDate(savedBooking.getCheckOutDate());
        res.setBookingStatus(savedBooking.getBookingStatus());
        res.setDepositAmount(savedBooking.getDepositAmount());
        res.setTotalEstimatedAmount(savedBooking.getTotalEstimatedAmount());
        res.setGuestCount(guestCount);
        res.setCreatedAt(savedBooking.getCreatedAt());
        res.setHasResidenceRecord(true);
        res.setPaymentStatus("SUCCESSFUL");
        res.setTransactionReference(txn.getTransactionReference());

        return res;
    }

    @Transactional(readOnly = true)
    public List<PhysicalVillaResponse> getAllVillas(String status, Integer categoryId) {
        List<PhysicalVilla> villas;
        if (categoryId != null && status != null && !status.trim().isEmpty()) {
            villas = physicalVillaRepository.findByVillaCategory_VillaCategoryIdAndVillaStatus(categoryId, status.trim().toUpperCase());
        } else if (categoryId != null) {
            villas = physicalVillaRepository.findByVillaCategory_VillaCategoryId(categoryId);
        } else if (status != null && !status.trim().isEmpty()) {
            villas = physicalVillaRepository.findByVillaStatus(status.trim().toUpperCase());
        } else {
            villas = physicalVillaRepository.findAll();
        }
        return villas.stream().map(this::toVillaResponse).collect(Collectors.toList());
    }

    /**
     * Sửa lỗi B14: Prevent changing status of a villa while an active checked-in booking occupies it.
     */
    public PhysicalVillaResponse updateVillaStatus(Integer villaId, String newStatus, String notes, Integer actorUserId) {
        PhysicalVilla villa = physicalVillaRepository.findByIdForUpdate(villaId)
                .orElseThrow(() -> new ResourceNotFoundException("Physical villa #" + villaId + " not found"));

        String targetStatus = newStatus.trim().toUpperCase();

        if (bookingRepository.existsByAssignedVilla_VillaIdAndBookingStatus(villaId, "CHECKED_IN")
                && !"OCCUPIED".equalsIgnoreCase(targetStatus)) {
            throw new BusinessRuleException("Cannot change status of Villa " + villa.getVillaNumber() +
                    " to '" + targetStatus + "' while an active checked-in booking occupies it. Complete check-out first.");
        }

        villa.setVillaStatus(targetStatus);
        if (notes != null && !notes.trim().isEmpty()) {
            villa.setViewAndOperationalNotes(notes.trim());
        }

        PhysicalVilla updated = physicalVillaRepository.save(villa);

        bookingAuditService.record(
                actorUserId != null ? actorUserId : 2,
                "UPDATE_VILLA_STATUS",
                "Villa " + villa.getVillaNumber() + " -> " + targetStatus,
                "SUCCESS"
        );

        return toVillaResponse(updated);
    }

    @Transactional(readOnly = true)
    public List<CustomerIdentityPort.CustomerContact> searchCustomers(String query, int limit) {
        return customerIdentityPort.searchCustomers(query, limit);
    }

    private DailyArrivalResponse toArrivalResponse(RetreatBooking rb, CustomerIdentityPort.CustomerContact contact) {
        DailyArrivalResponse res = new DailyArrivalResponse();
        res.setRetreatBookingId(rb.getRetreatBookingId());
        res.setCustomerProfileId(rb.getCustomerProfileId());

        if (contact != null) {
            res.setCustomerFullName(contact.fullName());
            res.setCustomerEmail(contact.email());
            res.setCustomerPhone(contact.phone());
        } else {
            res.setCustomerFullName(null);
            res.setCustomerEmail(null);
            res.setCustomerPhone(null);
        }

        res.setPackageName(rb.getRetreatPackage().getPackageName());
        res.setRequestedCategoryName(rb.getRequestedVillaCategory().getCategoryName());
        if (rb.getAssignedVilla() != null) {
            res.setAssignedVillaId(rb.getAssignedVilla().getVillaId());
            res.setAssignedVillaNumber(rb.getAssignedVilla().getVillaNumber());
        }
        res.setCheckInDate(rb.getCheckInDate());
        res.setCheckOutDate(rb.getCheckOutDate());
        res.setBookingStatus(rb.getBookingStatus());
        res.setDepositPaid(rb.getDepositAmount());
        res.setTotalEstimatedAmount(rb.getTotalEstimatedAmount());
        res.setGuestCount(rb.getGuestCount() != null ? rb.getGuestCount() : 1);
        res.setBookingReference("HSW-BK-" + rb.getRetreatBookingId());
        res.setHasResidenceRecord(residenceRecordRepository.existsByRetreatBooking_RetreatBookingId(rb.getRetreatBookingId()));
        res.setHasHealthProfile(customerIdentityPort.hasHealthProfile(rb.getCustomerProfileId()));

        return res;
    }

    private PhysicalVillaResponse toVillaResponse(PhysicalVilla pv) {
        PhysicalVillaResponse res = new PhysicalVillaResponse();
        res.setVillaId(pv.getVillaId());
        res.setVillaCategoryId(pv.getVillaCategory().getVillaCategoryId());
        res.setCategoryName(pv.getVillaCategory().getCategoryName());
        res.setVillaNumber(pv.getVillaNumber());
        res.setFloor(pv.getFloor());
        res.setVillaStatus(pv.getVillaStatus());
        res.setZoneName(pv.getZoneName());
        res.setBedroomInfo(pv.getBedroomInfo());
        res.setMaxOccupancy(pv.getMaxOccupancy());
        res.setAreaSqm(pv.getAreaSqm());
        res.setHasPrivatePool(pv.getHasPrivatePool());
        res.setPoolInfo(pv.getPoolInfo());
        res.setViewAndOperationalNotes(pv.getViewAndOperationalNotes());
        return res;
    }
}
