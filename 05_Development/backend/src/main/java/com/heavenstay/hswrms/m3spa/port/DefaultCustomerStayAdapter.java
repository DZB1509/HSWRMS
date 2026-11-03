package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m3spa.entity.RetreatPackageSpaTreatment;
import com.heavenstay.hswrms.m3spa.repository.RetreatPackageSpaTreatmentRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
@Transactional(readOnly = true)
public class DefaultCustomerStayAdapter implements CustomerStayPort {

    private final RetreatBookingRepository bookingRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final RetreatPackageSpaTreatmentRepository packageTreatmentRepository;
    private final JdbcTemplate jdbcTemplate;

    @Autowired
    public DefaultCustomerStayAdapter(@Autowired(required = false) RetreatBookingRepository bookingRepository,
                                      @Autowired(required = false) CustomerProfileRepository customerProfileRepository,
                                      @Autowired(required = false) RetreatPackageSpaTreatmentRepository packageTreatmentRepository,
                                      @Autowired(required = false) JdbcTemplate jdbcTemplate) {
        this.bookingRepository = bookingRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.packageTreatmentRepository = packageTreatmentRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    public DefaultCustomerStayAdapter(JdbcTemplate jdbcTemplate) {
        this(null, null, null, jdbcTemplate);
    }

    @Override
    public Optional<StayContextDto> getActiveStayForUser(Integer userId) {
        if (userId == null) {
            return Optional.empty();
        }

        // 1. Prefer type-safe, dialect-neutral Spring Data JPA repositories when available
        if (customerProfileRepository != null && bookingRepository != null) {
            try {
                Optional<CustomerProfile> cpOpt = customerProfileRepository.findByUserId(userId);
                if (cpOpt.isPresent()) {
                    CustomerProfile cp = cpOpt.get();
                    List<RetreatBooking> bookings = bookingRepository.findByCustomerProfileIdOrderByCreatedAtDesc(cp.getCustomerProfileId());
                    for (RetreatBooking b : bookings) {
                        String status = b.getBookingStatus();
                        if ("CONFIRMED".equalsIgnoreCase(status) || "CHECKED_IN".equalsIgnoreCase(status)) {
                            return Optional.of(mapToStayContext(b, cp, userId));
                        }
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // 2. Fallback to JDBC if repositories not present
        if (jdbcTemplate != null) {
            try {
                String sql = "SELECT b.retreat_booking_id, b.retreat_package_id, b.check_in_date, b.check_out_date, " +
                             "       b.booking_status, cp.customer_profile_id, u.full_name, u.email, p.package_name " +
                             "FROM dbo.RetreatBooking b " +
                             "INNER JOIN dbo.CustomerProfile cp ON b.customer_profile_id = cp.customer_profile_id " +
                             "INNER JOIN dbo.\"User\" u ON cp.user_id = u.user_id " +
                             "LEFT JOIN dbo.RetreatPackage p ON b.retreat_package_id = p.retreat_package_id " +
                             "WHERE u.user_id = ? AND b.booking_status IN ('CONFIRMED', 'CHECKED_IN')";
                List<StayContextDto> stays = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    StayContextDto dto = new StayContextDto(
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
                    );
                    dto.setCustomerEmail(rs.getString("email"));
                    return dto;
                }, userId);

                if (!stays.isEmpty()) {
                    return Optional.of(stays.get(0));
                }
            } catch (Exception ignored) {
            }
        }

        // Fail-closed: M2 retreat booking context is not yet active in production
        return Optional.empty();
    }

    @Override
    public Optional<StayContextDto> getStayById(Integer bookingId) {
        if (bookingId == null) {
            return Optional.empty();
        }

        // 1. Prefer type-safe, dialect-neutral Spring Data JPA repositories when available
        if (bookingRepository != null && customerProfileRepository != null) {
            try {
                Optional<RetreatBooking> bookingOpt = bookingRepository.findById(bookingId);
                if (bookingOpt.isPresent()) {
                    RetreatBooking b = bookingOpt.get();
                    CustomerProfile cp = customerProfileRepository.findByIdWithUser(b.getCustomerProfileId()).orElse(null);
                    return Optional.of(mapToStayContext(b, cp, null));
                }
            } catch (Exception ignored) {
            }
        }

        // 2. Fallback to JDBC if repositories not present
        if (jdbcTemplate != null) {
            try {
                String sql = "SELECT b.retreat_booking_id, b.retreat_package_id, b.check_in_date, b.check_out_date, " +
                             "       b.booking_status, cp.customer_profile_id, cp.user_id, u.full_name, u.email, p.package_name " +
                             "FROM dbo.RetreatBooking b " +
                             "INNER JOIN dbo.CustomerProfile cp ON b.customer_profile_id = cp.customer_profile_id " +
                             "INNER JOIN dbo.\"User\" u ON cp.user_id = u.user_id " +
                             "LEFT JOIN dbo.RetreatPackage p ON b.retreat_package_id = p.retreat_package_id " +
                             "WHERE b.retreat_booking_id = ?";
                List<StayContextDto> stays = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    StayContextDto dto = new StayContextDto(
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
                    );
                    dto.setCustomerEmail(rs.getString("email"));
                    return dto;
                }, bookingId);

                if (!stays.isEmpty()) {
                    return Optional.of(stays.get(0));
                }
            } catch (Exception ignored) {
            }
        }

        // Fail-closed: no hardcoded fake booking in production
        return Optional.empty();
    }

    @Override
    public boolean isTreatmentIncludedInPackage(Integer packageId, Integer treatmentId) {
        if (packageId == null || treatmentId == null) {
            return false;
        }

        if (packageTreatmentRepository != null) {
            try {
                List<RetreatPackageSpaTreatment> list = packageTreatmentRepository.findByRetreatPackageId(packageId);
                boolean included = list.stream().anyMatch(t ->
                        t.getSpaTreatment() != null && treatmentId.equals(t.getSpaTreatment().getTreatmentId())
                );
                if (included) return true;
            } catch (Exception ignored) {
            }
        }

        if (jdbcTemplate != null) {
            try {
                String sql = "SELECT COUNT(*) FROM dbo.RetreatPackageSpaTreatment " +
                             "WHERE retreat_package_id = ? AND treatment_id = ?";
                Integer count = jdbcTemplate.queryForObject(sql, Integer.class, packageId, treatmentId);
                return count != null && count > 0;
            } catch (Exception ignored) {
            }
        }

        return false;
    }

    private StayContextDto mapToStayContext(RetreatBooking b, CustomerProfile cp, Integer userIdOverride) {
        User u = cp != null ? cp.getUser() : null;
        Integer userId = userIdOverride != null ? userIdOverride : (u != null ? u.getUserId() : null);
        String fullName = u != null ? u.getFullName() : "Customer";
        String email = u != null ? u.getEmail() : null;
        Integer packageId = b.getRetreatPackage() != null ? b.getRetreatPackage().getRetreatPackageId() : null;
        String packageName = b.getRetreatPackage() != null ? b.getRetreatPackage().getPackageName() : null;
        LocalDate checkIn = b.getCheckInDate() != null ? b.getCheckInDate() : LocalDate.now().minusDays(1);
        LocalDate checkOut = b.getCheckOutDate() != null ? b.getCheckOutDate() : LocalDate.now().plusDays(6);

        StayContextDto dto = new StayContextDto(
                b.getRetreatBookingId(),
                "HSW-" + b.getRetreatBookingId(),
                b.getCustomerProfileId(),
                userId,
                fullName,
                packageId,
                packageName,
                checkIn,
                checkOut,
                true
        );
        dto.setCustomerEmail(email);
        return dto;
    }
}
