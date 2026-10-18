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
import java.time.temporal.ChronoUnit;

@Service
@Transactional(readOnly = true)
public class VillaAvailabilityService {

    private final RetreatPackageRepository packageRepository;
    private final VillaCategoryRepository villaCategoryRepository;
    private final PhysicalVillaRepository physicalVillaRepository;
    private final RetreatBookingRepository bookingRepository;

    private static final BigDecimal TAX_RATE = new BigDecimal("0.10"); // 10% VAT
    private static final BigDecimal DEPOSIT_RATE = new BigDecimal("0.30"); // 30% deposit

    public VillaAvailabilityService(RetreatPackageRepository packageRepository,
                                    VillaCategoryRepository villaCategoryRepository,
                                    PhysicalVillaRepository physicalVillaRepository,
                                    RetreatBookingRepository bookingRepository) {
        this.packageRepository = packageRepository;
        this.villaCategoryRepository = villaCategoryRepository;
        this.physicalVillaRepository = physicalVillaRepository;
        this.bookingRepository = bookingRepository;
    }

    public long getAvailableVillaCount(Integer categoryId, LocalDate checkInDate, LocalDate checkOutDate) {
        long totalVillas = physicalVillaRepository.countByVillaCategory_VillaCategoryIdAndVillaStatusNot(categoryId, "INACTIVE");
        long bookedVillas = bookingRepository.countBookedVillasInCategoryBetweenDates(categoryId, checkInDate, checkOutDate);
        return Math.max(0, totalVillas - bookedVillas);
    }

    public BookingCalculationResponse calculateBooking(BookingCalculationRequest request) {
        if (!request.getCheckOutDate().isAfter(request.getCheckInDate())) {
            throw new BusinessRuleException("Check-out date must be strictly after check-in date");
        }

        RetreatPackage pkg = packageRepository.findById(request.getRetreatPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat package not found: " + request.getRetreatPackageId()));

        VillaCategory category = villaCategoryRepository.findById(request.getVillaCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Villa category not found: " + request.getVillaCategoryId()));

        int nights = (int) ChronoUnit.DAYS.between(request.getCheckInDate(), request.getCheckOutDate());
        if (nights < pkg.getDurationNights()) {
            throw new BusinessRuleException("Stay duration (" + nights + " nights) is less than package minimum (" + pkg.getDurationNights() + " nights)");
        }

        long availableCount = getAvailableVillaCount(category.getVillaCategoryId(), request.getCheckInDate(), request.getCheckOutDate());

        BigDecimal basePrice = pkg.getBasePrice();
        BigDecimal villaModifier = category.getPriceModifier() != null ? category.getPriceModifier() : BigDecimal.ZERO;
        BigDecimal subtotal = basePrice.add(villaModifier);
        BigDecimal tax = subtotal.multiply(TAX_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal total = subtotal.add(tax).setScale(2, RoundingMode.HALF_UP);
        BigDecimal deposit = total.multiply(DEPOSIT_RATE).setScale(2, RoundingMode.HALF_UP);

        BookingCalculationResponse res = new BookingCalculationResponse();
        res.setAvailable(availableCount > 0);
        res.setAvailableCount(availableCount);
        res.setDurationNights(nights);
        res.setPackageBaseAmount(basePrice);
        res.setVillaModifierAmount(villaModifier);
        res.setTaxAmount(tax);
        res.setTotalEstimatedAmount(total);
        res.setRequiredDepositAmount(deposit);
        res.setDepositPercentage(30);

        return res;
    }
}
