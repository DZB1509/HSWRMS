package com.heavenstay.hswrms.m3spa.port;

import com.heavenstay.hswrms.m1identity.entity.CustomerProfile;
import com.heavenstay.hswrms.m1identity.entity.User;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m3spa.entity.RetreatPackageSpaTreatment;
import com.heavenstay.hswrms.m3spa.repository.RetreatPackageSpaTreatmentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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

    private static final Logger log = LoggerFactory.getLogger(DefaultCustomerStayAdapter.class);

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
                    RetreatBooking targetBooking = null;
                    for (RetreatBooking b : bookings) {
                        if ("CHECKED_IN".equalsIgnoreCase(b.getBookingStatus())) {
                            targetBooking = b;
                            break;
                        }
                    }
                    if (targetBooking == null) {
                        for (RetreatBooking b : bookings) {
                            if ("CONFIRMED".equalsIgnoreCase(b.getBookingStatus())) {
                                targetBooking = b;
                                break;
                            }
                        }
                    }
                    if (targetBooking == null) {
                        for (RetreatBooking b : bookings) {
                            if ("PENDING".equalsIgnoreCase(b.getBookingStatus())) {
                                targetBooking = b;
                                break;
                            }
                        }
                    }
                    if (targetBooking != null) {
                        return Optional.of(mapToStayContext(targetBooking, cp, userId));
                    }
                }
            } catch (Exception ignored) {
            }
        }

        // 2. Fallback to JDBC if repositories not present
        if (jdbcTemplate != null) {
            try {
                String sql = "SELECT b.retreat_booking_id, b.retreat_package_id, b.check_in_date, b.check_out_date, " +
                             "       b.booking_status, b.customer_profile_id, u.full_name, u.email, p.package_name " +
                             "FROM dbo.RetreatBooking b " +
                             "LEFT JOIN dbo.CustomerProfile cp ON b.customer_profile_id = cp.customer_profile_id " +
                             "LEFT JOIN dbo.[User] u ON cp.user_id = u.user_id " +
                             "LEFT JOIN dbo.RetreatPackage p ON b.retreat_package_id = p.retreat_package_id " +
                             "WHERE (cp.user_id = ? OR u.user_id = ?) AND b.booking_status IN ('CHECKED_IN', 'CONFIRMED', 'PENDING') " +
                             "ORDER BY CASE WHEN b.booking_status = 'CHECKED_IN' THEN 1 WHEN b.booking_status = 'CONFIRMED' THEN 2 WHEN b.booking_status = 'PENDING' THEN 3 ELSE 4 END, b.created_at DESC";
                List<StayContextDto> stays = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    String fn = rs.getString("full_name");
                    StayContextDto dto = new StayContextDto(
                            rs.getInt("retreat_booking_id"),
                            "HSW-" + rs.getInt("retreat_booking_id"),
                            rs.getInt("customer_profile_id"),
                            userId,
                            fn != null ? fn : "Customer",
                            rs.getInt("retreat_package_id"),
                            rs.getString("package_name"),
                            rs.getDate("check_in_date") != null ? rs.getDate("check_in_date").toLocalDate() : LocalDate.now().minusDays(1),
                            rs.getDate("check_out_date") != null ? rs.getDate("check_out_date").toLocalDate() : LocalDate.now().plusDays(6),
                            true
                    );
                    dto.setCustomerEmail(rs.getString("email"));
                    return dto;
                }, userId, userId);

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
        if (bookingRepository != null) {
            try {
                Optional<RetreatBooking> bookingOpt = bookingRepository.findById(bookingId);
                if (bookingOpt.isPresent()) {
                    RetreatBooking b = bookingOpt.get();
                    CustomerProfile cp = null;
                    if (customerProfileRepository != null && b.getCustomerProfileId() != null) {
                        cp = customerProfileRepository.findByIdWithUser(b.getCustomerProfileId())
                                .orElseGet(() -> customerProfileRepository.findById(b.getCustomerProfileId()).orElse(null));
                    }
                    Integer resolvedUserId = (cp != null && cp.getUser() != null) ? cp.getUser().getUserId() : null;
                    if (resolvedUserId == null && b.getCustomerProfileId() != null && jdbcTemplate != null) {
                        try {
                            resolvedUserId = jdbcTemplate.queryForObject(
                                    "SELECT user_id FROM dbo.CustomerProfile WHERE customer_profile_id = ?",
                                    Integer.class, b.getCustomerProfileId()
                            );
                        } catch (Exception ignoredJdbc) {
                        }
                    }
                    return Optional.of(mapToStayContext(b, cp, resolvedUserId));
                }
            } catch (Exception ignored) {
            }
        }

        // 2. Fallback to JDBC if repositories not present
        if (jdbcTemplate != null) {
            try {
                String sql = "SELECT b.retreat_booking_id, b.retreat_package_id, b.check_in_date, b.check_out_date, " +
                             "       b.booking_status, b.customer_profile_id, cp.user_id, u.full_name, u.email, p.package_name " +
                             "FROM dbo.RetreatBooking b " +
                             "LEFT JOIN dbo.CustomerProfile cp ON b.customer_profile_id = cp.customer_profile_id " +
                             "LEFT JOIN dbo.[User] u ON cp.user_id = u.user_id " +
                             "LEFT JOIN dbo.RetreatPackage p ON b.retreat_package_id = p.retreat_package_id " +
                             "WHERE b.retreat_booking_id = ?";
                List<StayContextDto> stays = jdbcTemplate.query(sql, (rs, rowNum) -> {
                    String status = rs.getString("booking_status");
                    boolean isActive = status == null || List.of("CHECKED_IN", "CONFIRMED", "PENDING").contains(status.toUpperCase());
                    int cpId = rs.getObject("customer_profile_id") != null ? rs.getInt("customer_profile_id") : 0;
                    Integer uId = rs.getObject("user_id") != null ? rs.getInt("user_id") : null;
                    String fullName = rs.getString("full_name");
                    StayContextDto dto = new StayContextDto(
                            rs.getInt("retreat_booking_id"),
                            "HSW-" + rs.getInt("retreat_booking_id"),
                            cpId,
                            uId,
                            fullName != null ? fullName : "Customer",
                            rs.getInt("retreat_package_id"),
                            rs.getString("package_name"),
                            rs.getDate("check_in_date") != null ? rs.getDate("check_in_date").toLocalDate() : LocalDate.now().minusDays(1),
                            rs.getDate("check_out_date") != null ? rs.getDate("check_out_date").toLocalDate() : LocalDate.now().plusDays(6),
                            isActive
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
        boolean isActive = b.getBookingStatus() == null || List.of("CHECKED_IN", "CONFIRMED", "PENDING").contains(b.getBookingStatus().toUpperCase());

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
                isActive
        );
        dto.setCustomerEmail(email);
        return dto;
    }
}
