package com.heavenstay.hswrms.m2booking.service;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Temporary read-only adapter over M1-owned tables. See {@link CustomerIdentityPort}.
 */
@Component
public class JdbcCustomerIdentityAdapter implements CustomerIdentityPort {

    private static final String CONTACT_SELECT =
            "SELECT cp.customer_profile_id, u.user_id, u.full_name, u.email, u.phone_number " +
            "FROM dbo.CustomerProfile cp JOIN dbo.[User] u ON u.user_id = cp.user_id ";

    private final JdbcTemplate jdbc;

    public JdbcCustomerIdentityAdapter(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Optional<Integer> findProfileIdByUserId(int userId) {
        List<Integer> ids = jdbc.queryForList(
                "SELECT customer_profile_id FROM dbo.CustomerProfile WHERE user_id = ?", Integer.class, userId);
        return ids.isEmpty() ? Optional.empty() : Optional.of(ids.get(0));
    }

    @Override
    public Optional<CustomerContact> findContact(int customerProfileId) {
        List<CustomerContact> rows = jdbc.query(CONTACT_SELECT + "WHERE cp.customer_profile_id = ?",
                (rs, i) -> map(rs), customerProfileId);
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    @Override
    public Map<Integer, CustomerContact> findContacts(Collection<Integer> customerProfileIds) {
        Map<Integer, CustomerContact> result = new HashMap<>();
        if (customerProfileIds == null || customerProfileIds.isEmpty()) {
            return result;
        }
        List<Integer> ids = new ArrayList<>(new LinkedHashSet<>(customerProfileIds));
        String placeholders = String.join(",", java.util.Collections.nCopies(ids.size(), "?"));
        jdbc.query(CONTACT_SELECT + "WHERE cp.customer_profile_id IN (" + placeholders + ")",
                rs -> {
                    CustomerContact c = map(rs);
                    result.put(c.customerProfileId(), c);
                }, ids.toArray());
        return result;
    }

    @Override
    public List<CustomerContact> searchCustomers(String query, int limit) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        String like = "%" + query.trim().replace("[", "[[]").replace("%", "[%]").replace("_", "[_]") + "%";
        return jdbc.query(
                CONTACT_SELECT + "WHERE u.account_status = 'ACTIVE' AND " +
                "(u.full_name LIKE ? OR u.email LIKE ? OR u.phone_number LIKE ?) " +
                "ORDER BY u.full_name OFFSET 0 ROWS FETCH NEXT ? ROWS ONLY",
                (rs, i) -> map(rs), like, like, like, Math.max(1, limit));
    }

    @Override
    public boolean hasHealthProfile(int customerProfileId) {
        Integer count = jdbc.queryForObject(
                "SELECT COUNT(1) FROM dbo.HealthProfile WHERE customer_profile_id = ? AND anonymization_status = 'IDENTIFIABLE'",
                Integer.class, customerProfileId);
        return count != null && count > 0;
    }

    @Override
    public int getOrCreateCustomerProfile(String fullName, String email, String phone) {
        String cleanEmail = (email != null && !email.trim().isEmpty())
                ? email.trim().toLowerCase()
                : null;
        String cleanName = (fullName != null && !fullName.trim().isEmpty())
                ? fullName.trim()
                : "Walk-in Guest";
        String cleanPhone = (phone != null && !phone.trim().isEmpty())
                ? phone.trim()
                : null;

        if (cleanEmail != null) {
            List<Integer> userIds = jdbc.queryForList(
                    "SELECT user_id FROM dbo.[User] WHERE email = ?", Integer.class, cleanEmail);
            if (!userIds.isEmpty()) {
                int userId = userIds.get(0);
                List<Integer> profileIds = jdbc.queryForList(
                        "SELECT customer_profile_id FROM dbo.CustomerProfile WHERE user_id = ?", Integer.class, userId);
                if (!profileIds.isEmpty()) {
                    return profileIds.get(0);
                }
                jdbc.update("INSERT INTO dbo.CustomerProfile (user_id) VALUES (?)", userId);
                return jdbc.queryForObject(
                        "SELECT customer_profile_id FROM dbo.CustomerProfile WHERE user_id = ?", Integer.class, userId);
            }
        }

        String walkInEmail = cleanEmail != null
                ? cleanEmail
                : "walkin." + System.currentTimeMillis() + "@heavenstay.internal";

        jdbc.update(
                "INSERT INTO dbo.[User] (full_name, email, phone_number, password_hash, account_status, email_verified) " +
                "VALUES (?, ?, ?, '$2a$10$w1qE/9s7E7tQzR.557vYCeZ7aO4J9jY3Xp07wYh11h8Z9vU.4jXyO', 'ACTIVE', 1)",
                cleanName, walkInEmail, cleanPhone);

        Integer newUserId = jdbc.queryForObject(
                "SELECT user_id FROM dbo.[User] WHERE email = ?", Integer.class, walkInEmail);

        List<Integer> roleIds = jdbc.queryForList(
                "SELECT role_id FROM dbo.[Role] WHERE role_name = 'Customer' OR role_name = 'CUSTOMER'", Integer.class);
        if (!roleIds.isEmpty()) {
            jdbc.update("INSERT INTO dbo.UserRole (user_id, role_id) VALUES (?, ?)", newUserId, roleIds.get(0));
        }

        jdbc.update("INSERT INTO dbo.CustomerProfile (user_id) VALUES (?)", newUserId);

        return jdbc.queryForObject(
                "SELECT customer_profile_id FROM dbo.CustomerProfile WHERE user_id = ?", Integer.class, newUserId);
    }

    private static CustomerContact map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new CustomerContact(rs.getInt("customer_profile_id"), rs.getInt("user_id"),
                rs.getString("full_name"), rs.getString("email"), rs.getString("phone_number"));
    }
}
