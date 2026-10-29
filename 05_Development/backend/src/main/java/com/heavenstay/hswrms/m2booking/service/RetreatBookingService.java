package com.heavenstay.hswrms.m2booking.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationRequest;
import com.heavenstay.hswrms.m2booking.dto.BookingCalculationResponse;
import com.heavenstay.hswrms.m2booking.dto.BookingSummaryResponse;
import com.heavenstay.hswrms.m2booking.dto.CreateBookingRequest;
import com.heavenstay.hswrms.m2booking.dto.UpdateBookingRequest;
import com.heavenstay.hswrms.m2booking.entity.PaymentTransaction;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.entity.RetreatPackage;
import com.heavenstay.hswrms.m2booking.entity.VillaCategory;
import com.heavenstay.hswrms.m2booking.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.m2booking.repository.ResidenceRecordRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatPackageRepository;
import com.heavenstay.hswrms.m2booking.repository.VillaCategoryRepository;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
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
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final CustomerIdentityPort customerIdentityPort;
    private final BookingPolicyService bookingPolicyService;
    private final BookingClock bookingClock;
    private final BookingAuditService bookingAuditService;

    public RetreatBookingService(RetreatBookingRepository bookingRepository,
                                 RetreatPackageRepository packageRepository,
                                 VillaCategoryRepository villaCategoryRepository,
                                 VillaAvailabilityService availabilityService,
                                 ResidenceRecordRepository residenceRecordRepository,
                                 com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository customerProfileRepository) {
        this(bookingRepository, packageRepository, villaCategoryRepository, availabilityService, residenceRecordRepository,
             null,
             new CustomerIdentityPort() {
                 @Override
                 public java.util.Optional<Integer> findProfileIdByUserId(int userId) {
                     return customerProfileRepository.findByUserId(userId).map(com.heavenstay.hswrms.m1identity.entity.CustomerProfile::getCustomerProfileId);
                 }
                 @Override
                 public java.util.Optional<CustomerContact> findContact(int customerProfileId) {
                     return customerProfileRepository.findById(customerProfileId).map(cp -> new CustomerContact(
                         cp.getCustomerProfileId(), cp.getUser() != null ? cp.getUser().getUserId() : 0,
                         cp.getUser() != null ? cp.getUser().getFullName() : null,
                         cp.getUser() != null ? cp.getUser().getEmail() : null,
                         cp.getUser() != null ? cp.getUser().getPhoneNumber() : null
                     ));
                 }
                 @Override
                 public java.util.Map<Integer, CustomerContact> findContacts(java.util.Collection<Integer> ids) {
                     java.util.Map<Integer, CustomerContact> map = new java.util.HashMap<>();
                     if (ids != null) {
                         for (Integer id : ids) {
                             findContact(id).ifPresent(c -> map.put(id, c));
                         }
                     }
                     return map;
                 }
                 @Override
                 public java.util.List<CustomerContact> searchCustomers(String query, int limit) {
                     return java.util.Collections.emptyList();
                 }
                 @Override
                 public boolean hasHealthProfile(int customerProfileId) {
                     return false;
                 }
                 @Override
                 public int getOrCreateCustomerProfile(String fullName, String email, String phone) {
                     return 1;
                 }
                 @Override
                 public java.util.Optional<CustomerFullDetails> findFullDetails(int customerProfileId) {
                     return java.util.Optional.empty();
                 }
                 @Override
                 public java.util.Optional<CustomerHealthSummary> findHealthProfile(int customerProfileId) {
                     return java.util.Optional.empty();
                 }
                 @Override
                 public void updateCustomerContactAndProfile(int customerProfileId, String fullName, String phone, String emergencyContact) {}
             },
             new BookingPolicyService(),
             new BookingClock(),
             new BookingAuditService(null)
        );
    }

    public RetreatBookingService(RetreatBookingRepository bookingRepository,
                                 RetreatPackageRepository packageRepository,
                                 VillaCategoryRepository villaCategoryRepository,
                                 VillaAvailabilityService availabilityService,
                                 ResidenceRecordRepository residenceRecordRepository,
                                 @org.springframework.beans.factory.annotation.Qualifier("bookingPaymentTransactionRepository") PaymentTransactionRepository paymentTransactionRepository,
                                 CustomerIdentityPort customerIdentityPort,
                                 BookingPolicyService bookingPolicyService,
                                 BookingClock bookingClock,
                                 BookingAuditService bookingAuditService) {
        this.bookingRepository = bookingRepository;
        this.packageRepository = packageRepository;
        this.villaCategoryRepository = villaCategoryRepository;
        this.availabilityService = availabilityService;
        this.residenceRecordRepository = residenceRecordRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.customerIdentityPort = customerIdentityPort;
        this.bookingPolicyService = bookingPolicyService;
        this.bookingClock = bookingClock;
        this.bookingAuditService = bookingAuditService;
    }

    /**
     * Resolves customer profile ID from the authenticated user's ID.
     */
    public Integer resolveCustomerProfileId(Integer userId) {
        if (userId == null) {
            throw new BusinessRuleException("Authentication required: no active user context");
        }
        return customerIdentityPort.findProfileIdByUserId(userId)
                .orElseThrow(() -> new BusinessRuleException("Customer profile not found for user #" + userId));
    }

    /**
     * Creates a new booking in PENDING status with concurrency lock (Sửa lỗi B1, B2, B3, B4, B5, B6).
     */
    public BookingSummaryResponse createBooking(CreateBookingRequest request, Integer resolvedCustomerProfileId, Integer actorUserId) {
        if (resolvedCustomerProfileId == null) {
            throw new BusinessRuleException("A valid customer profile is required to create a booking");
        }

        RetreatPackage pkg = packageRepository.findById(request.getRetreatPackageId())
                .orElseThrow(() -> new ResourceNotFoundException("Retreat package not found: " + request.getRetreatPackageId()));

        // Row lock on VillaCategory to serialize concurrent bookings and prevent overbooking
        VillaCategory category = villaCategoryRepository.findByIdForUpdate(request.getRequestedVillaCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Villa category not found: " + request.getRequestedVillaCategoryId()));

        int guestCount = (request.getGuestCount() != null && request.getGuestCount() > 0)
                ? request.getGuestCount()
                : 1;

        BookingCalculationRequest calcReq = new BookingCalculationRequest();
        calcReq.setRetreatPackageId(pkg.getRetreatPackageId());
        calcReq.setVillaCategoryId(category.getVillaCategoryId());
        calcReq.setCheckInDate(request.getCheckInDate());
        calcReq.setCheckOutDate(request.getCheckOutDate());
        calcReq.setGuestCount(guestCount);

        BookingCalculationResponse calcRes = availabilityService.calculateBooking(calcReq);
        if (!calcRes.isAvailable() || calcRes.getAvailableCount() <= 0) {
            throw new BusinessRuleException("No villas available in category '" + category.getCategoryName() +
                    "' for the selected dates (" + request.getCheckInDate() + " to " + request.getCheckOutDate() + ")");
        }

        RetreatBooking booking = new RetreatBooking();
        booking.setCustomerProfileId(resolvedCustomerProfileId);
        booking.setRetreatPackage(pkg);
        booking.setRequestedVillaCategory(category);
        booking.setCheckInDate(request.getCheckInDate());
        booking.setCheckOutDate(request.getCheckOutDate());
        booking.setBookingStatus("PENDING");
        booking.setTotalEstimatedAmount(calcRes.getTotalEstimatedAmount());
        booking.setDepositAmount(calcRes.getRequiredDepositAmount());
        booking.setGuestCount(guestCount);
        booking.setSpecialRequest(request.getSpecialRequest());
        booking.setCreatedAt(bookingClock.utcNow());

        if (request.getFullName() != null || request.getPhoneNumber() != null || request.getEmergencyContact() != null) {
            customerIdentityPort.updateCustomerContactAndProfile(
                    resolvedCustomerProfileId,
                    request.getFullName(),
                    request.getPhoneNumber(),
                    request.getEmergencyContact()
            );
        }

        RetreatBooking saved = bookingRepository.save(booking);

        if (bookingAuditService != null) bookingAuditService.record(
                actorUserId != null ? actorUserId : 1,
                "CREATE_BOOKING",
                "RetreatBooking #" + saved.getRetreatBookingId(),
                "SUCCESS"
        );

        return toSummaryResponse(saved);
    }

    public int getOrCreateCustomerProfile(String fullName, String email, String phone) {
        return customerIdentityPort.getOrCreateCustomerProfile(fullName, email, phone);
    }

    @Transactional(readOnly = true)
    public List<BookingSummaryResponse> getCustomerBookings(Integer customerProfileId) {
        if (customerProfileId == null) {
            return List.of();
        }
        return bookingRepository.findByCustomerProfileIdOrderByCreatedAtDesc(customerProfileId)
                .stream()
                .map(this::toSummaryResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BookingSummaryResponse getBookingDetail(Integer bookingId, Integer customerProfileId) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));

        if (customerProfileId != null && !booking.getCustomerProfileId().equals(customerProfileId)) {
            throw new BusinessRuleException("You do not have permission to view booking #" + bookingId);
        }

        return toSummaryResponse(booking);
    }

    /**
     * Sửa đổi Booking (FR-M2-08 / UC18).
     */
    public BookingSummaryResponse updateBooking(Integer bookingId, UpdateBookingRequest request, Integer customerProfileId, Integer actorUserId) {
        RetreatBooking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));

        if (customerProfileId != null && !booking.getCustomerProfileId().equals(customerProfileId)) {
            throw new BusinessRuleException("You do not have permission to modify booking #" + bookingId);
        }

        if (!"PENDING".equalsIgnoreCase(booking.getBookingStatus()) && !"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new BusinessRuleException("Cannot modify booking with status: " + booking.getBookingStatus() +
                    ". Only PENDING or CONFIRMED bookings may be modified.");
        }

        LocalDate newCheckIn = request.getCheckInDate() != null ? request.getCheckInDate() : booking.getCheckInDate();
        LocalDate newCheckOut = request.getCheckOutDate() != null ? request.getCheckOutDate() : booking.getCheckOutDate();

        if (!newCheckOut.isAfter(newCheckIn)) {
            throw new BusinessRuleException("Check-out date must be strictly after check-in date");
        }

        Integer targetCategoryId = request.getRequestedVillaCategoryId() != null
                ? request.getRequestedVillaCategoryId()
                : booking.getRequestedVillaCategory().getVillaCategoryId();

        VillaCategory targetCategory = villaCategoryRepository.findByIdForUpdate(targetCategoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Villa category #" + targetCategoryId + " not found"));

        int newGuestCount = request.getGuestCount() != null && request.getGuestCount() > 0
                ? request.getGuestCount()
                : booking.getGuestCount();

        // Calculate and validate with exclusion of current booking
        BookingCalculationRequest calcReq = new BookingCalculationRequest();
        calcReq.setRetreatPackageId(booking.getRetreatPackage().getRetreatPackageId());
        calcReq.setVillaCategoryId(targetCategoryId);
        calcReq.setCheckInDate(newCheckIn);
        calcReq.setCheckOutDate(newCheckOut);
        calcReq.setGuestCount(newGuestCount);

        BookingCalculationResponse calcRes = availabilityService.calculateBooking(calcReq);

        long available = availabilityService.getAvailableVillaCountExcluding(targetCategoryId, newCheckIn, newCheckOut, bookingId);
        if (available <= 0) {
            throw new BusinessRuleException("No villas available in category '" + targetCategory.getCategoryName() +
                    "' for the modified dates (" + newCheckIn + " to " + newCheckOut + ")");
        }

        booking.setCheckInDate(newCheckIn);
        booking.setCheckOutDate(newCheckOut);
        booking.setRequestedVillaCategory(targetCategory);
        booking.setGuestCount(newGuestCount);
        booking.setTotalEstimatedAmount(calcRes.getTotalEstimatedAmount());
        booking.setDepositAmount(calcRes.getRequiredDepositAmount());

        if (request.getSpecialRequest() != null) {
            booking.setSpecialRequest(request.getSpecialRequest());
        }

        RetreatBooking updated = bookingRepository.save(booking);

        if (bookingAuditService != null) bookingAuditService.record(
                actorUserId != null ? actorUserId : 1,
                "UPDATE_BOOKING",
                "RetreatBooking #" + bookingId,
                "SUCCESS"
        );

        return toSummaryResponse(updated);
    }

    /**
     * Hủy Booking (FR-M2-07 / UC17) với kiểm tra chính sách hoàn tiền / thời hạn hủy.
     */
    public BookingSummaryResponse cancelBooking(Integer bookingId, Integer customerProfileId, Integer actorUserId) {
        RetreatBooking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));

        if (customerProfileId != null && !booking.getCustomerProfileId().equals(customerProfileId)) {
            throw new BusinessRuleException("You do not have permission to cancel booking #" + bookingId);
        }

        if (!"PENDING".equalsIgnoreCase(booking.getBookingStatus()) && !"CONFIRMED".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new BusinessRuleException("Cannot cancel booking with status: " + booking.getBookingStatus());
        }

        // Check cancellation window policy
        int cancellationWindowHours = bookingPolicyService.cancellationWindowHours().orElse(48);
        LocalDateTime checkInThreshold = booking.getCheckInDate().atTime(14, 0);
        long hoursUntilCheckIn = ChronoUnit.HOURS.between(bookingClock.utcNow(), checkInThreshold);

        BigDecimal refundPct = BigDecimal.ZERO;
        if (hoursUntilCheckIn >= cancellationWindowHours) {
            refundPct = bookingPolicyService.refundPercentage().orElse(new BigDecimal("100"));
        }

        booking.setBookingStatus("CANCELLED");
        RetreatBooking updated = bookingRepository.save(booking);

        // Cancel pending payment transactions
        List<PaymentTransaction> txns = paymentTransactionRepository != null ? paymentTransactionRepository.findByRetreatBookingIdAndPaymentTypeOrderByTransactionIdDesc(bookingId, PaymentTransaction.TYPE_DEPOSIT) : java.util.Collections.emptyList();

        for (PaymentTransaction txn : txns) {
            if (PaymentTransaction.STATUS_PENDING.equalsIgnoreCase(txn.getPaymentStatus())) {
                txn.setPaymentStatus(PaymentTransaction.STATUS_CANCELLED);
                paymentTransactionRepository.save(txn);
            }
        }

        if (bookingAuditService != null) bookingAuditService.record(
                actorUserId != null ? actorUserId : 1,
                "CANCEL_BOOKING",
                "RetreatBooking #" + bookingId + " (RefundPct: " + refundPct + "%)",
                "SUCCESS"
        );

        return toSummaryResponse(updated);
    }

    /**
     * Idempotent confirmation when deposit payment is verified.
     */
    public BookingSummaryResponse confirmBookingDeposit(Integer bookingId, BigDecimal amountPaid, String txnRef) {
        RetreatBooking booking = bookingRepository.findByIdForUpdate(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));

        if ("CONFIRMED".equalsIgnoreCase(booking.getBookingStatus()) || "CHECKED_IN".equalsIgnoreCase(booking.getBookingStatus())) {
            return toSummaryResponse(booking); // Idempotent
        }

        booking.setBookingStatus("CONFIRMED");
        if (amountPaid != null && amountPaid.compareTo(BigDecimal.ZERO) > 0) {
            booking.setDepositAmount(amountPaid);
        }

        RetreatBooking saved = bookingRepository.save(booking);

        if (bookingAuditService != null) bookingAuditService.record(
                1,
                "CONFIRM_DEPOSIT",
                "RetreatBooking #" + bookingId + " Txn: " + txnRef,
                "SUCCESS"
        );

        return toSummaryResponse(saved);
    }

    public BookingSummaryResponse toSummaryResponse(RetreatBooking entity) {
        BookingSummaryResponse res = new BookingSummaryResponse();
        res.setRetreatBookingId(entity.getRetreatBookingId());
        res.setBookingReference("HSW-BK-" + entity.getRetreatBookingId());
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
        res.setGuestCount(entity.getGuestCount() != null ? entity.getGuestCount() : 1);
        res.setCreatedAt(entity.getCreatedAt());

        boolean hasResidence = residenceRecordRepository.existsByRetreatBooking_RetreatBookingId(entity.getRetreatBookingId());
        res.setHasResidenceRecord(hasResidence);

        // Enrich with deposit transaction details
        List<PaymentTransaction> txns = paymentTransactionRepository != null ? paymentTransactionRepository.findByRetreatBookingIdAndPaymentTypeOrderByTransactionIdDesc(entity.getRetreatBookingId(), PaymentTransaction.TYPE_DEPOSIT) : java.util.Collections.emptyList();

        if (!txns.isEmpty()) {
            PaymentTransaction preferred = txns.stream()
                    .filter(t -> PaymentTransaction.STATUS_SUCCESSFUL.equalsIgnoreCase(t.getPaymentStatus()))
                    .findFirst()
                    .orElse(txns.get(0));
            res.setPaymentStatus(preferred.getPaymentStatus());
            res.setTransactionReference(preferred.getTransactionReference());
        } else {
            res.setPaymentStatus("UNPAID");
        }

        return res;
    }

    public BookingSummaryResponse createBooking(CreateBookingRequest request, CustomUserDetails userDetails) {
        Integer profileId = resolveCustomerProfileId(userDetails);
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : null;
        return createBooking(request, profileId, actorUserId);
    }

    public List<BookingSummaryResponse> getCustomerBookings(CustomUserDetails userDetails) {
        Integer profileId = resolveCustomerProfileId(userDetails);
        return getCustomerBookings(profileId);
    }

    public BookingSummaryResponse getBookingDetail(Integer bookingId, CustomUserDetails userDetails) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));
        validateBookingAccess(booking, userDetails, "view");
        return toSummaryResponse(booking);
    }

    public BookingSummaryResponse cancelBooking(Integer bookingId, CustomUserDetails userDetails) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Retreat booking #" + bookingId + " not found"));
        validateBookingAccess(booking, userDetails, "cancel");
        Integer profileId = isStaffOrAdmin(userDetails) ? null : resolveCustomerProfileId(userDetails);
        Integer actorUserId = userDetails != null ? userDetails.getUserId() : null;
        return cancelBooking(bookingId, profileId, actorUserId);
    }

    public Integer resolveCustomerProfileId(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getUserId() == null) {
            throw new AccessDeniedException("Authentication required.");
        }
        return resolveCustomerProfileId(userDetails.getUserId());
    }

    private boolean isStaffOrAdmin(CustomUserDetails userDetails) {
        if (userDetails == null || userDetails.getAuthorities() == null) return false;
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_RECEPTIONIST")
                            || a.getAuthority().equalsIgnoreCase("ROLE_ADMIN"));
    }


    public void validateBookingAccess(RetreatBooking booking, CustomUserDetails userDetails, String action) {
        if (userDetails == null) {
            throw new AccessDeniedException("Authentication required to " + action + " booking.");
        }
        boolean isStaffOrAdmin = userDetails.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_RECEPTIONIST") || role.equals("ROLE_MANAGER") || role.equals("ROLE_ADMIN"));
        if (isStaffOrAdmin) {
            return;
        }

        boolean isCustomer = userDetails.getAuthorities().stream()
                .map(org.springframework.security.core.GrantedAuthority::getAuthority)
                .anyMatch(role -> role.equals("ROLE_CUSTOMER"));
        if (isCustomer) {
            Integer myProfileId = resolveCustomerProfileId(userDetails);
            if (!booking.getCustomerProfileId().equals(myProfileId)) {
                throw new AccessDeniedException("Access denied: You do not have permission to " + action + " booking #" + booking.getRetreatBookingId());
            }
            return;
        }

        throw new AccessDeniedException("Access denied: Insufficient permissions to " + action + " booking.");
    }

}
