package com.heavenstay.hswrms.m3spa.port;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
public class DefaultCustomerStayAdapter implements CustomerStayPort {

    private final JdbcTemplate jdbcTemplate;

    public DefaultCustomerStayAdapter(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<StayContextDto> getActiveStayForUser(Integer userId) {
        try {
            String sql = "SELECT b.retreat_booking_id, b.retreat_package_id, b.check_in_date, b.check_out_date, " +
                         "       b.booking_status, cp.customer_profile_id, u.full_name, p.package_name " +
                         "FROM dbo.RetreatBooking b " +
                         "INNER JOIN dbo.CustomerProfile cp ON b.customer_profile_id = cp.customer_profile_id " +
                         "INNER JOIN dbo.[User] u ON cp.user_id = u.user_id " +
                         "LEFT JOIN dbo.RetreatPackage p ON b.retreat_package_id = p.retreat_package_id " +
                         "WHERE u.user_id = ? AND b.booking_status IN ('CONFIRMED', 'CHECKED_IN')";
            List<StayContextDto> stays = jdbcTemplate.query(sql, (rs, rowNum) -> new StayContextDto(
                    rs.getInt("retreat_booking_id"),
                    "HSW-" + rs.getInt("retreat_booking_id"),
                    rs.getInt("customer_profile_id"),
                    userId,
                    rs.getString("full_name"),
                    rs.getInt("retreat_package_id"),
                    rs.getString("package_name"),
                    rs.getDate("check_in_date") != null ? rs.getDate("check_in_date").toLocalDate() : LocalDate.now().minusDays(1),
                    rs.getDate("check_out_date") != null ? rs.getDate("check_out_date").toLocalDate() : LocalDate.now().plusDays(6),
                    true
            ), userId);

            if (!stays.isEmpty()) {
                return Optional.of(stays.get(0));
            }
        } catch (Exception ignored) {
            // Relational tables might not be populated yet before M2 completion
        }

        // Fail-closed: M2 retreat booking context is not yet active in production
        return Optional.empty();
    }

    @Override
    public Optional<StayContextDto> getStayById(Integer bookingId) {
        if (bookingId == null) {
            return Optional.empty();
        }
        try {
            String sql = "SELECT b.retreat_booking_id, b.retreat_package_id, b.check_in_date, b.check_out_date, " +
                         "       b.booking_status, cp.customer_profile_id, cp.user_id, u.full_name, p.package_name " +
                         "FROM dbo.RetreatBooking b " +
                         "INNER JOIN dbo.CustomerProfile cp ON b.customer_profile_id = cp.customer_profile_id " +
                         "INNER JOIN dbo.[User] u ON cp.user_id = u.user_id " +
                         "LEFT JOIN dbo.RetreatPackage p ON b.retreat_package_id = p.retreat_package_id " +
                         "WHERE b.retreat_booking_id = ?";
            List<StayContextDto> stays = jdbcTemplate.query(sql, (rs, rowNum) -> new StayContextDto(
                    rs.getInt("retreat_booking_id"),
                    "HSW-" + rs.getInt("retreat_booking_id"),
                    rs.getInt("customer_profile_id"),
                    rs.getInt("user_id"),
                    rs.getString("full_name"),
                    rs.getInt("retreat_package_id"),
                    rs.getString("package_name"),
                    rs.getDate("check_in_date") != null ? rs.getDate("check_in_date").toLocalDate() : LocalDate.now().minusDays(1),
                    rs.getDate("check_out_date") != null ? rs.getDate("check_out_date").toLocalDate() : LocalDate.now().plusDays(6),
                    true
            ), bookingId);

            if (!stays.isEmpty()) {
                return Optional.of(stays.get(0));
            }
        } catch (Exception ignored) {
        }

        // Fail-closed: no hardcoded fake booking in production
        return Optional.empty();
    }

    @Override
    public boolean isTreatmentIncludedInPackage(Integer packageId, Integer treatmentId) {
        if (packageId == null || treatmentId == null) {
            return false;
        }
        try {
            String sql = "SELECT COUNT(*) FROM dbo.RetreatPackageSpaTreatment " +
                         "WHERE retreat_package_id = ? AND treatment_id = ?";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class, packageId, treatmentId);
            return count != null && count > 0;
        } catch (Exception e) {
            // Fail-closed: package relationship not confirmed
            return false;
        }
    }
}
