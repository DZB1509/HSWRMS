package com.heavenstay.hswrms.m5billing.security;

import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.dto.VnpayCreatePaymentRequest;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * SpEL helper bean ("billingAccess") used by @PreAuthorize on the M5 controllers.
 * Staff roles (Receptionist/Admin) may act on any stay; a Customer only on stays they own.
 */
@Component("billingAccess")
public class BillingAccessEvaluator {

    private final RetreatBookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;

    public BillingAccessEvaluator(RetreatBookingRepository bookingRepository,
                                  InvoiceRepository invoiceRepository,
                                  PaymentTransactionRepository paymentTransactionRepository) {
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
    }

    public boolean isStaff(Authentication authentication) {
        return authentication != null && hasAnyAuthority(authentication, "ROLE_RECEPTIONIST", "ROLE_ADMIN");
    }

    @Transactional(readOnly = true)
    public boolean canAccessBooking(Integer bookingId, Authentication authentication) {
        return bookingId != null && canAccessBooking(bookingId.longValue(), authentication);
    }

    @Transactional(readOnly = true)
    public boolean canAccessBooking(Long bookingId, Authentication authentication) {
        if (bookingId == null || authentication == null) {
            return false;
        }
        if (isStaff(authentication)) {
            return true;
        }
        Long userId = customerUserId(authentication);
        return userId != null && hasAnyAuthority(authentication, "ROLE_CUSTOMER")
                && bookingRepository.existsByIdAndCustomerUserId(bookingId, userId);
    }

    @Transactional(readOnly = true)
    public boolean canAccessInvoice(Long invoiceId, Authentication authentication) {
        if (invoiceId == null || authentication == null) {
            return false;
        }
        if (isStaff(authentication)) {
            return true;
        }
        Long userId = customerUserId(authentication);
        if (userId == null || !hasAnyAuthority(authentication, "ROLE_CUSTOMER")) {
            return false;
        }
        if (invoiceRepository.existsById(invoiceId)) {
            return invoiceRepository.existsByIdAndCustomerUserId(invoiceId, userId);
        }
        return bookingRepository.existsByIdAndCustomerUserId(invoiceId, userId);
    }

    @Transactional(readOnly = true)
    public boolean canCreateVnpayPayment(VnpayCreatePaymentRequest request, Authentication authentication) {
        if (authentication == null) {
            return false;
        }
        if (isStaff(authentication)) {
            return true;
        }
        Long userId = customerUserId(authentication);
        if (userId == null || !hasAnyAuthority(authentication, "ROLE_CUSTOMER") || request == null) {
            return false;
        }
        boolean hasInvoiceId = request.invoiceId() != null && request.invoiceId() > 0;
        boolean hasBookingId = request.bookingId() != null && request.bookingId() > 0;
        if (!hasInvoiceId && !hasBookingId) {
            return false;
        }
        if (hasBookingId && !bookingRepository.existsByIdAndCustomerUserId(request.bookingId(), userId)) {
            return false;
        }
        if (hasInvoiceId) {
            if (invoiceRepository.existsById(request.invoiceId())) {
                if (!invoiceRepository.existsByIdAndCustomerUserId(request.invoiceId(), userId)) {
                    return false;
                }
                if (hasBookingId) {
                    boolean matchesBooking = invoiceRepository.findByRetreatBookingId(request.bookingId())
                            .map(inv -> request.invoiceId().equals(inv.getInvoiceId()))
                            .orElse(false);
                    if (!matchesBooking) {
                        return false;
                    }
                }
            } else {
                if (!bookingRepository.existsByIdAndCustomerUserId(request.invoiceId(), userId)) {
                    return false;
                }
                if (hasBookingId && !request.invoiceId().equals(request.bookingId())) {
                    return false;
                }
            }
        }
        return true;
    }

    @Transactional(readOnly = true)
    public boolean canAccessTransaction(String transactionReference, Authentication authentication) {
        if (transactionReference == null || transactionReference.isBlank() || authentication == null) {
            return false;
        }
        if (isStaff(authentication)) {
            return true;
        }
        Long userId = customerUserId(authentication);
        if (userId == null || !hasAnyAuthority(authentication, "ROLE_CUSTOMER")) {
            return false;
        }
        return paymentTransactionRepository.findByTransactionReference(transactionReference.trim())
                .map(tx -> {
                    if (tx.getInvoice() != null && tx.getInvoice().getInvoiceId() != null) {
                        return invoiceRepository.existsByIdAndCustomerUserId(tx.getInvoice().getInvoiceId(), userId);
                    }
                    if (tx.getRetreatBooking() != null && tx.getRetreatBooking().getRetreatBookingId() != null) {
                        return bookingRepository.existsByIdAndCustomerUserId(
                                tx.getRetreatBooking().getRetreatBookingId().longValue(), userId);
                    }
                    return false;
                })
                .orElse(false);
    }

    public static Long customerUserId(Authentication authentication) {
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails details
                && details.getUserId() != null) {
            return details.getUserId().longValue();
        }
        return null;
    }

    private static boolean hasAnyAuthority(Authentication authentication, String... authorities) {
        for (GrantedAuthority granted : authentication.getAuthorities()) {
            for (String wanted : authorities) {
                if (wanted.equals(granted.getAuthority())) {
                    return true;
                }
            }
        }
        return false;
    }
}
