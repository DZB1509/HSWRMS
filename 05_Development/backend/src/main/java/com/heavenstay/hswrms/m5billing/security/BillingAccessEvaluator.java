package com.heavenstay.hswrms.m5billing.security;

import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.security.CustomUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.stereotype.Component;

/**
 * SpEL helper bean ("billingAccess") used by @PreAuthorize on the M5 controllers.
 * Staff roles (Receptionist/Admin) may act on any stay; a Customer only on stays they own.
 */
@Component("billingAccess")
public class BillingAccessEvaluator {

    private final RetreatBookingRepository bookingRepository;
    private final InvoiceRepository invoiceRepository;

    public BillingAccessEvaluator(RetreatBookingRepository bookingRepository, InvoiceRepository invoiceRepository) {
        this.bookingRepository = bookingRepository;
        this.invoiceRepository = invoiceRepository;
    }

    public boolean isStaff(Authentication authentication) {
        return hasAnyAuthority(authentication, "ROLE_RECEPTIONIST", "ROLE_ADMIN");
    }

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

    public boolean canAccessInvoice(Long invoiceId, Authentication authentication) {
        if (invoiceId == null || authentication == null) {
            return false;
        }
        if (isStaff(authentication)) {
            return true;
        }
        Long userId = customerUserId(authentication);
        return userId != null && hasAnyAuthority(authentication, "ROLE_CUSTOMER")
                && invoiceRepository.existsByIdAndCustomerUserId(invoiceId, userId);
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
