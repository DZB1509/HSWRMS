package com.heavenstay.hswrms.m2booking.service;

import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Read-only contract M2 needs from M1 (identity / customer profile).
 *
 * <p>The M1 services are not present on this branch and the integration baseline
 * (audit-all-modules) is unavailable, so the only implementation today is
 * {@link JdbcCustomerIdentityAdapter}, which reads the M1-owned tables
 * {@code dbo.[User]}, {@code dbo.CustomerProfile} and (existence only) {@code dbo.HealthProfile}.
 * When M1 publishes a service, replace the adapter — callers do not change.
 *
 * <p>{@code User.user_id} and {@code CustomerProfile.customer_profile_id} are different
 * identifiers; always map through {@link #findProfileIdByUserId(int)}.
 */
public interface CustomerIdentityPort {

    record CustomerContact(int customerProfileId, int userId, String fullName, String email, String phone) {
    }

    Optional<Integer> findProfileIdByUserId(int userId);

    Optional<CustomerContact> findContact(int customerProfileId);

    Map<Integer, CustomerContact> findContacts(Collection<Integer> customerProfileIds);

    /** Name / email / phone search for active customer accounts (front-desk lookup). */
    List<CustomerContact> searchCustomers(String query, int limit);

    /**
     * Data-minimised readiness flag: whether an identifiable Health &amp; Dietary profile exists.
     * No health content is read or returned (SRS: Receptionist must not see health data).
     */
    boolean hasHealthProfile(int customerProfileId);

    /**
     * Finds or creates a customer profile for walk-in bookings without hardcoded fallbacks.
     */
    int getOrCreateCustomerProfile(String fullName, String email, String phone);
}
