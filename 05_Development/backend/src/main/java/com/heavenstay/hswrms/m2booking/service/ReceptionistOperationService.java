package com.heavenstay.hswrms.m2booking.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.dto.*;
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
import java.util.stream.Collectors;

@Service
@Transactional
public class ReceptionistOperationService {

    private final RetreatBookingRepository bookingRepository;
    private final PhysicalVillaRepository physicalVillaRepository;
    private final ResidenceRecordRepository residenceRecordRepository;
    private final RetreatPackageRepository packageRepository;
    private final VillaCategoryRepository villaCategoryRepository;
    private final VillaAvailabilityService availabilityService;

    public ReceptionistOperationService(RetreatBookingRepository bookingRepository,
                                        PhysicalVillaRepository physicalVillaRepository,
                                        ResidenceRecordRepository residenceRecordRepository,
                                        RetreatPackageRepository packageRepository,
                                        VillaCategoryRepository villaCategoryRepository,
                                        VillaAvailabilityService availabilityService) {
        this.bookingRepository = bookingRepository;
        this.physicalVillaRepository = physicalVillaRepository;
        this.residenceRecordRepository = residenceRecordRepository;
        this.packageRepository = packageRepository;
        this.villaCategoryRepository = villaCategoryRepository;
        this.availabilityService = availabilityService;
    }

    @Transactional(readOnly = true)
    public List<DailyArrivalResponse> getDailyArrivals(LocalDate date) {
        LocalDate queryDate = date != null ? date : LocalDate.now();
        List<RetreatBooking> arrivals = bookingRepository.findArrivalsByDate(queryDate);
        return arrivals.stream().map(this::toArrivalResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PhysicalVillaResponse> getAvailableVillasForAssignment(Integer bookingId) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));

        Integer categoryId = booking.getRequestedVillaCategory().getVillaCategoryId();
        List<PhysicalVilla> villas = physicalVillaRepository
                .findByVillaCategory_VillaCategoryIdAndVillaStatus(categoryId, "AVAILABLE");

        return villas.stream().map(this::toVillaResponse).collect(Collectors.toList());
    }

    public ResidenceRecord recordResidenceInfo(Integer bookingId, CheckInResidenceRequest request) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));

        ResidenceRecord record = residenceRecordRepository.findByRetreatBooking_RetreatBookingId(bookingId)
                .orElse(new ResidenceRecord());

        record.setRetreatBooking(booking);
        record.setIdentificationNumber(request.getIdentificationNumber().trim());
        record.setIdentificationType(request.getIdentificationType().trim());
        record.setNationality(request.getNationality() != null ? request.getNationality().trim() : "Việt Nam");
        record.setPermanentAddress(request.getPermanentAddress() != null ? request.getPermanentAddress().trim() : "");
        record.setCollectedAt(LocalDateTime.now());

        return residenceRecordRepository.save(record);
    }

    public BookingSummaryResponse assignVillaAndCheckIn(Integer bookingId, Integer physicalVillaId) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking #" + bookingId + " not found"));

        boolean hasResidence = residenceRecordRepository.existsByRetreatBooking_RetreatBookingId(bookingId);
        if (!hasResidence) {
            throw new BusinessRuleException("Cannot complete check-in: Mandatory residence declaration (Luật Cư trú 2020) is missing");
        }

        PhysicalVilla villa = physicalVillaRepository.findByIdForUpdate(physicalVillaId)
                .orElseThrow(() -> new ResourceNotFoundException("Physical Villa #" + physicalVillaId + " not found"));

        if (!"AVAILABLE".equalsIgnoreCase(villa.getVillaStatus())) {
            throw new BusinessRuleException("Physical Villa " + villa.getVillaNumber() + " is currently " + villa.getVillaStatus() + " and cannot be assigned");
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
        res.setCreatedAt(saved.getCreatedAt());
        res.setHasResidenceRecord(true);

        return res;
    }

    public BookingSummaryResponse createWalkInBooking(WalkInBookingRequest request) {
        RetreatPackage pkg = packageRepository.findById(request.getRetreatPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat package not found: " + request.getRetreatPackageId()));

        VillaCategory category = villaCategoryRepository.findById(request.getVillaCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Villa category not found: " + request.getVillaCategoryId()));

        PhysicalVilla villa = physicalVillaRepository.findByIdForUpdate(request.getPhysicalVillaId())
                .orElseThrow(() -> new ResourceNotFoundException("Physical Villa #" + request.getPhysicalVillaId() + " not found"));

        if (!"AVAILABLE".equalsIgnoreCase(villa.getVillaStatus())) {
            throw new BusinessRuleException("Physical Villa " + villa.getVillaNumber() + " is currently " + villa.getVillaStatus());
        }

        BookingCalculationRequest calcReq = new BookingCalculationRequest();
        calcReq.setRetreatPackageId(pkg.getRetreatPackageId());
        calcReq.setVillaCategoryId(category.getVillaCategoryId());
        calcReq.setCheckInDate(request.getCheckInDate());
        calcReq.setCheckOutDate(request.getCheckOutDate());
        BookingCalculationResponse calcRes = availabilityService.calculateBooking(calcReq);

        RetreatBooking booking = new RetreatBooking();
        booking.setCustomerProfileId(request.getCustomerProfileId() != null ? request.getCustomerProfileId() : 999);
        booking.setRetreatPackage(pkg);
        booking.setRequestedVillaCategory(category);
        booking.setAssignedVilla(villa);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setBookingStatus("CHECKED_IN");
        booking.setTotalEstimatedAmount(calcRes.getTotalEstimatedAmount());
        booking.setDepositAmount(calcRes.getRequiredDepositAmount());
        booking.setSpecialRequest(request.getSpecialRequest() != null ? request.getSpecialRequest() : "Walk-in Booking (Paid by " + request.getInitialPaymentMethod() + ")");
        booking.setCreatedAt(LocalDateTime.now());

        RetreatBooking savedBooking = bookingRepository.save(booking);

        ResidenceRecord record = new ResidenceRecord();
        record.setRetreatBooking(savedBooking);
        record.setIdentificationNumber(request.getIdentificationNumber().trim());
        record.setIdentificationType(request.getIdentificationType().trim());
        record.setNationality(request.getNationality() != null ? request.getNationality().trim() : "Việt Nam");
        record.setPermanentAddress(request.getPermanentAddress() != null ? request.getPermanentAddress().trim() : "");
        record.setCollectedAt(LocalDateTime.now());
        residenceRecordRepository.save(record);

        villa.setVillaStatus("OCCUPIED");
        physicalVillaRepository.save(villa);

        BookingSummaryResponse res = new BookingSummaryResponse();
        res.setRetreatBookingId(savedBooking.getRetreatBookingId());
        res.setCustomerProfileId(savedBooking.getCustomerProfileId());
        res.setPackageName(pkg.getPackageName());
        res.setRequestedCategoryName(category.getCategoryName());
        res.setAssignedVillaNumber(villa.getVillaNumber());
        res.setCheckInDate(savedBooking.getCheckInDate());
        res.setCheckOutDate(savedBooking.getCheckOutDate());
        res.setBookingStatus(savedBooking.getBookingStatus());
        res.setDepositAmount(savedBooking.getDepositAmount());
        res.setTotalEstimatedAmount(savedBooking.getTotalEstimatedAmount());
        res.setCreatedAt(savedBooking.getCreatedAt());
        res.setHasResidenceRecord(true);

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

    public PhysicalVillaResponse updateVillaStatus(Integer villaId, String newStatus, String notes) {
        PhysicalVilla villa = physicalVillaRepository.findById(villaId)
                .orElseThrow(() -> new ResourceNotFoundException("Physical villa #" + villaId + " not found"));

        villa.setVillaStatus(newStatus.toUpperCase());
        if (notes != null && !notes.trim().isEmpty()) {
            villa.setViewAndOperationalNotes(notes.trim());
        }

        PhysicalVilla updated = physicalVillaRepository.save(villa);
        return toVillaResponse(updated);
    }

    private DailyArrivalResponse toArrivalResponse(RetreatBooking rb) {
        DailyArrivalResponse res = new DailyArrivalResponse();
        res.setRetreatBookingId(rb.getRetreatBookingId());
        res.setCustomerProfileId(rb.getCustomerProfileId());
        res.setCustomerFullName("Customer #" + rb.getCustomerProfileId());
        res.setCustomerEmail("customer" + rb.getCustomerProfileId() + "@heavenstay.com");
        res.setCustomerPhone("+8490" + (1000000 + rb.getCustomerProfileId()));
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
        res.setHasResidenceRecord(residenceRecordRepository.existsByRetreatBooking_RetreatBookingId(rb.getRetreatBookingId()));
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
