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

    @Override
    public Optional<CustomerFullDetails> findFullDetails(int customerProfileId) {
        String sql = "SELECT cp.customer_profile_id, u.user_id, u.full_name, u.email, u.phone_number, " +
                     "cp.emergency_contact, cp.emergency_contact_name, cp.emergency_contact_phone, " +
                     "cp.emergency_contact_relationship, cp.date_of_birth, cp.residential_address " +
                     "FROM dbo.CustomerProfile cp JOIN dbo.[User] u ON u.user_id = cp.user_id " +
                     "WHERE cp.customer_profile_id = ?";
        List<CustomerFullDetails> list = jdbc.query(sql, (rs, i) -> new CustomerFullDetails(
                rs.getInt("customer_profile_id"),
                rs.getInt("user_id"),
                rs.getString("full_name"),
                rs.getString("email"),
                rs.getString("phone_number"),
                rs.getString("emergency_contact"),
                rs.getString("emergency_contact_name"),
                rs.getString("emergency_contact_phone"),
                rs.getString("emergency_contact_relationship"),
                rs.getDate("date_of_birth") != null ? rs.getDate("date_of_birth").toLocalDate() : null,
                rs.getString("residential_address")
        ), customerProfileId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public Optional<CustomerHealthSummary> findHealthProfile(int customerProfileId) {
        String sql = "SELECT health_profile_id, customer_profile_id, allergies, dietary_requirements, " +
                     "treatment_safety_notes, current_health_condition, injury_surgery_history, " +
                     "mobility_joint_notes, current_medications, stress_fatigue_level, " +
                     "food_intolerance_notes, disliked_ingredients, kitchen_notes, anonymization_status " +
                     "FROM dbo.HealthProfile WHERE customer_profile_id = ?";
        List<CustomerHealthSummary> list = jdbc.query(sql, (rs, i) -> new CustomerHealthSummary(
                rs.getInt("health_profile_id"),
                rs.getInt("customer_profile_id"),
                rs.getString("allergies"),
                rs.getString("dietary_requirements"),
                rs.getString("treatment_safety_notes"),
                rs.getString("current_health_condition"),
                rs.getString("injury_surgery_history"),
                rs.getString("mobility_joint_notes"),
                rs.getString("current_medications"),
                rs.getString("stress_fatigue_level"),
                rs.getString("food_intolerance_notes"),
                rs.getString("disliked_ingredients"),
                rs.getString("kitchen_notes"),
                rs.getString("anonymization_status")
        ), customerProfileId);
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public void updateCustomerContactAndProfile(int customerProfileId, String fullName, String phone, String emergencyContact) {
        List<Integer> userIds = jdbc.queryForList(
                "SELECT user_id FROM dbo.CustomerProfile WHERE customer_profile_id = ?", Integer.class, customerProfileId);
        if (!userIds.isEmpty()) {
            int userId = userIds.get(0);
            if (fullName != null && !fullName.trim().isEmpty()) {
                jdbc.update("UPDATE dbo.[User] SET full_name = ? WHERE user_id = ?", fullName.trim(), userId);
            }
            if (phone != null && !phone.trim().isEmpty()) {
                jdbc.update("UPDATE dbo.[User] SET phone_number = ? WHERE user_id = ?", phone.trim(), userId);
            }
        }
        if (emergencyContact != null && !emergencyContact.trim().isEmpty()) {
            jdbc.update("UPDATE dbo.CustomerProfile SET emergency_contact = ?, updated_at = SYSUTCDATETIME() WHERE customer_profile_id = ?",
                    emergencyContact.trim(), customerProfileId);
        }
    }

    private static CustomerContact map(java.sql.ResultSet rs) throws java.sql.SQLException {
        return new CustomerContact(rs.getInt("customer_profile_id"), rs.getInt("user_id"),
                rs.getString("full_name"), rs.getString("email"), rs.getString("phone_number"));
    }
}
