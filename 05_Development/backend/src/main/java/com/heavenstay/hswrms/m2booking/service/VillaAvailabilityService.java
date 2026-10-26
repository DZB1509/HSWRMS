package com.heavenstay.hswrms.m2booking.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationRequest;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationResponse;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class VillaAvailabilityService {

    private final RetreatPackageRepository packageRepository;
    private final VillaCategoryRepository villaCategoryRepository;
    private final PhysicalVillaRepository physicalVillaRepository;
    private final RetreatBookingRepository bookingRepository;
    private final BookingClock bookingClock;
    private final BookingPolicyService bookingPolicyService;

    public VillaAvailabilityService(RetreatPackageRepository packageRepository,
                                    VillaCategoryRepository villaCategoryRepository,
                                    PhysicalVillaRepository physicalVillaRepository,
                                    RetreatBookingRepository bookingRepository,
                                    BookingClock bookingClock,
                                    BookingPolicyService bookingPolicyService) {
        this.packageRepository = packageRepository;
        this.villaCategoryRepository = villaCategoryRepository;
        this.physicalVillaRepository = physicalVillaRepository;
        this.bookingRepository = bookingRepository;
        this.bookingClock = bookingClock;
        this.bookingPolicyService = bookingPolicyService;
    }

    public long getAvailableVillaCount(Integer categoryId, LocalDate checkInDate, LocalDate checkOutDate) {
        return getAvailableVillaCountExcluding(categoryId, checkInDate, checkOutDate, 0);
    }

    public long getAvailableVillaCountExcluding(Integer categoryId, LocalDate checkInDate, LocalDate checkOutDate, Integer excludeBookingId) {
        int holdMinutes = bookingPolicyService.holdMinutes().orElse(15);
        LocalDateTime holdCutoff = bookingClock.utcNow().minusMinutes(holdMinutes);

        // Count operational physical villas (excluding INACTIVE and MAINTENANCE per SRS FR-M2-04)
        long totalOperational = physicalVillaRepository
                .countByVillaCategory_VillaCategoryIdAndVillaStatusNotIn(categoryId, List.of("INACTIVE", "MAINTENANCE"));

        // If physical villas aren't populated for this category, fall back to configured inventory count
        if (totalOperational == 0) {
            totalOperational = villaCategoryRepository.findById(categoryId)
                    .map(vc -> vc.getInventoryCount() != null ? (long) vc.getInventoryCount() : 0L)
                    .orElse(0L);
        }

        long holds = bookingRepository.countInventoryHolds(
                categoryId,
                checkInDate,
                checkOutDate,
                holdCutoff,
                excludeBookingId != null ? excludeBookingId : 0
        );

        return Math.max(0, totalOperational - holds);
    }

    public BookingCalculationResponse calculateBooking(BookingCalculationRequest request) {
        if (request.getCheckInDate() == null || request.getCheckOutDate() == null) {
            throw new BusinessRuleException("Check-in and check-out dates are required");
        }

        if (!request.getCheckOutDate().isAfter(request.getCheckInDate())) {
            throw new BusinessRuleException("Check-out date must be strictly after check-in date");
        }

        int guestCount = (request.getGuestCount() != null && request.getGuestCount() > 0)
                ? request.getGuestCount()
                : 1;

        RetreatPackage pkg = packageRepository.findById(request.getRetreatPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat package not found: " + request.getRetreatPackageId()));

        VillaCategory category = villaCategoryRepository.findById(request.getVillaCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Villa category not found: " + request.getVillaCategoryId()));

        // Sửa lỗi B6: Package–Villa Eligibility (SRS Data Rule 7)
        boolean isEligible = pkg.getEligibleVillaCategories() == null || pkg.getEligibleVillaCategories().isEmpty()
                || pkg.getEligibleVillaCategories().stream()
                        .anyMatch(vc -> vc.getVillaCategoryId().equals(category.getVillaCategoryId()));

        if (!isEligible) {
            throw new BusinessRuleException("Villa category '" + category.getCategoryName() +
                    "' is not eligible for retreat package '" + pkg.getPackageName() + "'");
        }

        // Sửa lỗi B6: Max Occupancy Check
        if (category.getMaxOccupancy() != null && guestCount > category.getMaxOccupancy()) {
            throw new BusinessRuleException("Guest count (" + guestCount + ") exceeds maximum occupancy (" +
                    category.getMaxOccupancy() + ") for villa category '" + category.getCategoryName() + "'");
        }

        int nights = (int) ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        if (nights < pkg.getDurationNights()) {
            throw new BusinessRuleException("Stay duration (" + nights + " nights) is less than package minimum (" +
                    pkg.getDurationNights() + " nights)");
        }

        // Sửa lỗi B4 & B13: Availability & Hold Cutoff
        long availableCount = getAvailableVillaCount(category.getVillaCategoryId(), request.getCheckInDate(), request.getCheckOutDate());

        // Sửa lỗi B5: Pricing & Deposit
        // Base price calculation: check if base_price_unit scales by guest
        BigDecimal basePrice = pkg.getBasePrice();
        String unit = pkg.getBasePriceUnit() != null ? pkg.getBasePriceUnit().toLowerCase() : "";
        BigDecimal packageBaseAmount = (unit.contains("khách") || unit.contains("guest") || unit.contains("person"))
                ? basePrice.multiply(BigDecimal.valueOf(guestCount))
                : basePrice;

        BigDecimal villaModifier = category.getPriceModifier() != null ? category.getPriceModifier() : BigDecimal.ZERO;
        BigDecimal totalEstimated = packageBaseAmount.add(villaModifier).setScale(2, RoundingMode.HALF_UP);

        // Deposit percentage from policy (default 30%)
        int depositPct = bookingPolicyService.depositPercentage()
                .map(BigDecimal::intValue)
                .orElse(30);

        BigDecimal requiredDeposit = totalEstimated
                .multiply(BigDecimal.valueOf(depositPct))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BookingCalculationResponse res = new BookingCalculationResponse();
        res.setAvailable(availableCount > 0);
        res.setAvailableCount(availableCount);
        res.setDurationNights(nights);
        res.setPackageBaseAmount(packageBaseAmount);
        res.setVillaModifierAmount(villaModifier);
        res.setTaxAmount(BigDecimal.ZERO); // VAT belongs to Invoice (M5), not added artificially to RetreatBooking
        res.setTotalEstimatedAmount(totalEstimated);
        res.setRequiredDepositAmount(requiredDeposit);
        res.setDepositPercentage(depositPct);

        return res;
    }
}
