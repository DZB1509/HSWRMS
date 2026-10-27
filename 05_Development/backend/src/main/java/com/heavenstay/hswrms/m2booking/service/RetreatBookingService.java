package com.heavenstay.hswrms.m2booking.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationRequest;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationResponse;
import com.heavenstay.hswrms.m2booking.dto.BookingSummaryResponse;
import com.heavenstay.hswrms.m2booking.dto.CreateBookingRequest;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.ResidenceRecordRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class RetreatBookingService {

    private final RetreatBookingRepository bookingRepository;
    private final RetreatPackageRepository packageRepository;
    private final VillaCategoryRepository villaCategoryRepository;
    private final VillaAvailabilityService availabilityService;
    private final ResidenceRecordRepository residenceRecordRepository;
    private final CustomerProfileRepository customerProfileRepository;

    public RetreatBookingService(RetreatBookingRepository bookingRepository,
                                 RetreatPackageRepository packageRepository,
                                 VillaCategoryRepository villaCategoryRepository,
                                 VillaAvailabilityService availabilityService,
                                 ResidenceRecordRepository residenceRecordRepository,
                                 CustomerProfileRepository customerProfileRepository) {
        this.bookingRepository = bookingRepository;
        this.packageRepository = packageRepository;
        this.villaCategoryRepository = villaCategoryRepository;
        this.availabilityService = availabilityService;
        this.residenceRecordRepository = residenceRecordRepository;
        this.customerProfileRepository = customerProfileRepository;
    }

    public Integer resolveCustomerProfileId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        Integer userId = userDetails.getUserId();
        if (customerProfileRepository == null) {
            throw new IllegalStateException("CustomerProfileRepository is not initialized.");
        }
        return customerProfileRepository.findByUserId(userId)
                .map(CustomerProfile::getCustomerProfileId)
                .orElseThrow(() -> new AccessDeniedException(
                        "Customer profile not found for user ID: " + userId + ". Customer booking operations require an active customer profile."));
    }

    public void validateBookingAccess(RetreatBooking booking, CustomUserDetails userDetails, String action) {
        if (userDetails == null) {
            throw new AccessDeniedException("Authentication required to " + action + " booking.");
        }
        boolean isStaffOrAdmin = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_RECEPTIONIST") || role.equals("ROLE_MANAGER") || role.equals("ROLE_ADMIN"));
        if (isStaffOrAdmin) {
            return;
        }

        boolean isCustomer = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_CUSTOMER"));
        if (isCustomer) {
            Integer myProfileId = resolveCustomerProfileId(userDetails);
            if (!booking.getCustomerProfileId().equals(myProfileId)) {
                throw new AccessDeniedException("Access denied: You do not have permission to " + action + " booking #" + booking.getRetreatBookingId());
            }
            return;
        }

        throw new AccessDeniedException("Access denied: Unauthorized role to " + action + " booking.");
    }

    public BookingSummaryResponse createBooking(CreateBookingRequest request, CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Authentication required to create a booking.");
        }
        Integer customerProfileId = resolveCustomerProfileId(userDetails);
        return createBooking(request, customerProfileId);
    }

    public BookingSummaryResponse createBooking(CreateBookingRequest request, Integer customerProfileId) {
        if (customerProfileId == null) {
            throw new AccessDeniedException("Customer profile ID is required to create a booking.");
        }

        RetreatPackage pkg = packageRepository.findById(request.getRetreatPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat package not found: " + request.getRetreatPackageId()));

        VillaCategory category = villaCategoryRepository.findById(request.getRequestedVillaCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Villa category not found: " + request.getRequestedVillaCategoryId()));

        BookingCalculationRequest calcReq = new BookingCalculationRequest();
        calcReq.setRetreatPackageId(pkg.getRetreatPackageId());
        calcReq.setVillaCategoryId(category.getVillaCategoryId());
        calcReq.setCheckInDate(request.getCheckInDate());
        calcReq.setCheckOutDate(request.getCheckOutDate());
        calcReq.setGuestCount(1);

        BookingCalculationResponse calcRes = availabilityService.calculateBooking(calcReq);
        if (!calcRes.isAvailable()) {
            throw new BusinessRuleException("No villas available in category '" + category.getCategoryName() + "' for the selected dates");
        }

        RetreatBooking booking = new RetreatBooking();
        booking.setCustomerProfileId(customerProfileId);
        booking.setRetreatPackage(pkg);
        booking.setRequestedVillaCategory(category);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setBookingStatus("PENDING");
        booking.setTotalEstimatedAmount(calcRes.getTotalEstimatedAmount());
        booking.setDepositAmount(calcRes.getRequiredDepositAmount());
        booking.setSpecialRequest(request.getSpecialRequest());
        booking.setCreatedAt(LocalDateTime.now());

        RetreatBooking saved = bookingRepository.save(booking);
        return toSummaryResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<BookingSummaryResponse> getCustomerBookings(CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Authentication required to view customer bookings.");
        }
        Integer customerProfileId = resolveCustomerProfileId(userDetails);
        return getCustomerBookings(customerProfileId);
    }

    @Transactional(readOnly = true)
    public List<BookingSummaryResponse> getCustomerBookings(Integer customerProfileId) {
        return bookingRepository.findByCustomerProfileIdOrderByCreatedAtDesc(customerProfileId)
                .stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingSummaryResponse getBookingDetail(Integer bookingId, CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Authentication required to view booking.");
        }
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));
        validateBookingAccess(booking, userDetails, "view");
        return toSummaryResponse(booking);
    }

    @Transactional(readOnly = true)
    public BookingSummaryResponse getBookingDetail(Integer bookingId) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));
        return toSummaryResponse(booking);
    }

    public BookingSummaryResponse cancelBooking(Integer bookingId, CustomUserDetails userDetails) {
        if (userDetails == null) {
            throw new AccessDeniedException("Authentication required to cancel booking.");
        }

        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));

        boolean isManagerOrAdmin = userDetails.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_MANAGER") || role.equals("ROLE_ADMIN"));

        if (!isManagerOrAdmin) {
            boolean isCustomer = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .anyMatch(role -> role.equals("ROLE_CUSTOMER"));
            if (isCustomer) {
                Integer myProfileId = resolveCustomerProfileId(userDetails);
                if (!booking.getCustomerProfileId().equals(myProfileId)) {
                    throw new AccessDeniedException("Access denied: You do not have permission to cancel booking #" + bookingId);
                }
            } else {
                throw new AccessDeniedException("Access denied: Unauthorized role to cancel booking.");
            }
        }

        if (!"PENDING".equals(booking.getBookingStatus()) && !"CONFIRMED".equals(booking.getBookingStatus())) {
            throw new BusinessRuleException("Cannot cancel booking with status: " + booking.getBookingStatus());
        }

        booking.setBookingStatus("CANCELLED");
        RetreatBooking updated = bookingRepository.save(booking);
        return toSummaryResponse(updated);
    }

    public BookingSummaryResponse cancelBooking(Integer bookingId, Integer customerProfileId) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));

        if (customerProfileId == null || !booking.getCustomerProfileId().equals(customerProfileId)) {
            throw new AccessDeniedException("Access denied: You do not have permission to cancel booking #" + bookingId);
        }

        if (!"PENDING".equals(booking.getBookingStatus()) && !"CONFIRMED".equals(booking.getBookingStatus())) {
            throw new BusinessRuleException("Cannot cancel booking with status: " + booking.getBookingStatus());
        }

        booking.setBookingStatus("CANCELLED");
        RetreatBooking updated = bookingRepository.save(booking);
        return toSummaryResponse(updated);
    }

    public BookingSummaryResponse confirmBookingDeposit(Integer bookingId, BigDecimal amountPaid, String txnRef) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));

        if ("CONFIRMED".equals(booking.getBookingStatus()) || "CHECKED_IN".equals(booking.getBookingStatus())) {
            return toSummaryResponse(booking); // Idempotent
        }

        booking.setBookingStatus("CONFIRMED");
        if (amountPaid != null && amountPaid.compareTo(BigDecimal.ZERO) > 0) {
            booking.setDepositAmount(amountPaid);
        }

        RetreatBooking saved = bookingRepository.save(booking);
        return toSummaryResponse(saved);
    }

    public BookingSummaryResponse toSummaryResponse(RetreatBooking entity) {
        BookingSummaryResponse res = new BookingSummaryResponse();
        res.setRetreatBookingId(entity.getRetreatBookingId());
        res.setCustomerProfileId(entity.getCustomerProfileId());
        res.setRetreatPackageId(entity.getRetreatPackage().getRetreatPackageId());
        res.setPackageName(entity.getRetreatPackage().getPackageName());
        res.setRequestedVillaCategoryId(entity.getRequestedVillaCategory().getVillaCategoryId());
        res.setRequestedCategoryName(entity.getRequestedVillaCategory().getCategoryName());
        if (entity.getAssignedVilla() != null) {
            res.setAssignedVillaId(entity.getAssignedVilla().getVillaId());
            res.setAssignedVillaNumber(entity.getAssignedVilla().getVillaNumber());
        }
        res.setCheckInDate(entity.getCheckInDate());
        res.setCheckOutDate(entity.getCheckOutDate());
        res.setBookingStatus(entity.getBookingStatus());
        res.setDepositAmount(entity.getDepositAmount());
        res.setTotalEstimatedAmount(entity.getTotalEstimatedAmount());
        res.setSpecialRequest(entity.getSpecialRequest());
        res.setCreatedAt(entity.getCreatedAt());

        boolean hasResidence = residenceRecordRepository.existsByRetreatBooking_RetreatBookingId(entity.getRetreatBookingId());
        res.setHasResidenceRecord(hasResidence);

        return res;
    }
}
