package com.heavenstay.hswrms.m6admin.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m3spa.entity.TreatmentStatus;
import com.heavenstay.hswrms.m6admin.security.CurrentActor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * FR-M6-02 / UC76 – Manage Master Data (Villa Categories, Spa Services, Retreat Packages).
 * Enforces non-negative price (GB-M6-02 / M6-MSG-03) and soft deactivation.
 */
@Service
public class MasterDataService {

    private final JdbcTemplate jdbc;
    private final AuditLogService audit;

    public MasterDataService(JdbcTemplate jdbc, AuditLogService audit) {
        this.jdbc = jdbc;
        this.audit = audit;
    }

    public record MasterDataItem(
            Integer id,
            String name,
            String descriptionOrGoal,
            BigDecimal price,
            Integer durationOrOccupancy,
            String status
    ) {}

    public record MasterDataSaveRequest(
            String name,
            String descriptionOrGoal,
            BigDecimal price,
            Integer durationOrOccupancy,
            String status
    ) {}

    @Transactional(readOnly = true)
    public List<MasterDataItem> list(String group) {
        String clean = normalizeGroup(group);
        if ("villa-categories".equals(clean)) {
            return jdbc.query("select villa_category_id, category_name, max_occupancy, price_modifier, category_status from VillaCategory order by villa_category_id asc",
                    (rs, rowNum) -> new MasterDataItem(
                            rs.getInt("villa_category_id"),
                            rs.getString("category_name"),
                            "Max Occupancy: " + rs.getInt("max_occupancy"),
                            rs.getBigDecimal("price_modifier"),
                            rs.getInt("max_occupancy"),
                            rs.getString("category_status")
                    ));
        } else if ("spa-services".equals(clean)) {
            return jdbc.query("select treatment_id, treatment_name, duration_minutes, base_price, treatment_status from SpaTreatment order by treatment_id asc",
                    (rs, rowNum) -> {
                        String rawStatus = rs.getString("treatment_status");
                        TreatmentStatus statusEnum = TreatmentStatus.ACTIVE;
                        if (rawStatus != null) {
                            try {
                                statusEnum = TreatmentStatus.valueOf(rawStatus.trim().toUpperCase());
                            } catch (IllegalArgumentException ignored) {
                            }
                        }
                        return new MasterDataItem(
                                rs.getInt("treatment_id"),
                                rs.getString("treatment_name"),
                                rs.getInt("duration_minutes") + " mins",
                                rs.getBigDecimal("base_price"),
                                rs.getInt("duration_minutes"),
                                statusEnum.name()
                        );
                    });
        } else if ("retreat-packages".equals(clean)) {
            return jdbc.query("select retreat_package_id, package_name, wellness_goal, duration_nights, base_price, package_status from RetreatPackage order by retreat_package_id asc",
                    (rs, rowNum) -> new MasterDataItem(
                            rs.getInt("retreat_package_id"),
                            rs.getString("package_name"),
                            rs.getString("wellness_goal"),
                            rs.getBigDecimal("base_price"),
                            rs.getInt("duration_nights"),
                            rs.getString("package_status")
                    ));
        }
        throw new ResourceNotFoundException("Master data group", "name", group);
    }

    @Transactional
    public MasterDataItem create(String group, MasterDataSaveRequest req, CurrentActor actor) {
        String clean = normalizeGroup(group);
        assertPriceNonNegative(req.price());
        String status = (req.status() != null && !req.status().isBlank()) ? req.status().toUpperCase() : "ACTIVE";

        if ("villa-categories".equals(clean)) {
            int occupancy = req.durationOrOccupancy() != null && req.durationOrOccupancy() > 0 ? req.durationOrOccupancy() : 2;
            jdbc.update("insert into VillaCategory (category_name, max_occupancy, price_modifier, category_status) values (?, ?, ?, ?)",
                    req.name(), occupancy, req.price(), status);
            audit.record(actor, "Create Master Data", "VillaCategory", req.name(), AuditLogService.SUCCESS);
        } else if ("spa-services".equals(clean)) {
            int duration = req.durationOrOccupancy() != null && req.durationOrOccupancy() > 0 ? req.durationOrOccupancy() : 60;
            TreatmentStatus treatmentStatus = TreatmentStatus.ACTIVE;
            if (req.status() != null && !req.status().isBlank()) {
                try {
                    treatmentStatus = TreatmentStatus.valueOf(req.status().trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw new BusinessRuleException("M6-MSG-04", "Invalid treatment status: " + req.status());
                }
            }
            jdbc.update("insert into SpaTreatment (treatment_name, duration_minutes, base_price, treatment_status) values (?, ?, ?, ?)",
                    req.name(), duration, req.price(), treatmentStatus.name());
            audit.record(actor, "Create Master Data", "SpaTreatment", req.name(), AuditLogService.SUCCESS);
        } else if ("retreat-packages".equals(clean)) {
            int nights = req.durationOrOccupancy() != null && req.durationOrOccupancy() > 0 ? req.durationOrOccupancy() : 3;
            jdbc.update("insert into RetreatPackage (package_name, wellness_goal, duration_nights, base_price, package_status) values (?, ?, ?, ?, ?)",
                    req.name(), req.descriptionOrGoal(), nights, req.price(), status);
            audit.record(actor, "Create Master Data", "RetreatPackage", req.name(), AuditLogService.SUCCESS);
        } else {
            throw new ResourceNotFoundException("Master data group", "name", group);
        }

        List<MasterDataItem> list = list(clean);
        return list.get(list.size() - 1);
    }

    @Transactional
    public MasterDataItem update(String group, Integer id, MasterDataSaveRequest req, CurrentActor actor) {
        String clean = normalizeGroup(group);
        assertPriceNonNegative(req.price());
        String status = (req.status() != null && !req.status().isBlank()) ? req.status().toUpperCase() : "ACTIVE";

        if ("villa-categories".equals(clean)) {
            int occupancy = req.durationOrOccupancy() != null && req.durationOrOccupancy() > 0 ? req.durationOrOccupancy() : 2;
            int rows = jdbc.update("update VillaCategory set category_name = ?, max_occupancy = ?, price_modifier = ?, category_status = ? where villa_category_id = ?",
                    req.name(), occupancy, req.price(), status, id);
            if (rows == 0) throw new ResourceNotFoundException("Villa Category", "id", id);
            audit.record(actor, "Update Master Data", "VillaCategory", String.valueOf(id), AuditLogService.SUCCESS);
        } else if ("spa-services".equals(clean)) {
            int duration = req.durationOrOccupancy() != null && req.durationOrOccupancy() > 0 ? req.durationOrOccupancy() : 60;
            TreatmentStatus treatmentStatus = TreatmentStatus.ACTIVE;
            if (req.status() != null && !req.status().isBlank()) {
                try {
                    treatmentStatus = TreatmentStatus.valueOf(req.status().trim().toUpperCase());
                } catch (IllegalArgumentException e) {
                    throw new BusinessRuleException("M6-MSG-04", "Invalid treatment status: " + req.status());
                }
            }
            int rows = jdbc.update("update SpaTreatment set treatment_name = ?, duration_minutes = ?, base_price = ?, treatment_status = ? where treatment_id = ?",
                    req.name(), duration, req.price(), treatmentStatus.name(), id);
            if (rows == 0) throw new ResourceNotFoundException("Spa Treatment", "id", id);
            audit.record(actor, "Update Master Data", "SpaTreatment", String.valueOf(id), AuditLogService.SUCCESS);
        } else if ("retreat-packages".equals(clean)) {
            int nights = req.durationOrOccupancy() != null && req.durationOrOccupancy() > 0 ? req.durationOrOccupancy() : 3;
            int rows = jdbc.update("update RetreatPackage set package_name = ?, wellness_goal = ?, duration_nights = ?, base_price = ?, package_status = ? where retreat_package_id = ?",
                    req.name(), req.descriptionOrGoal(), nights, req.price(), status, id);
            if (rows == 0) throw new ResourceNotFoundException("Retreat Package", "id", id);
            audit.record(actor, "Update Master Data", "RetreatPackage", String.valueOf(id), AuditLogService.SUCCESS);
        } else {
            throw new ResourceNotFoundException("Master data group", "name", group);
        }

        return list(clean).stream().filter(i -> i.id().equals(id)).findFirst()
                .orElseThrow(() -> new ResourceNotFoundException("Master data item", "id", id));
    }

    @Transactional
    public void deactivate(String group, Integer id, CurrentActor actor) {
        String clean = normalizeGroup(group);
        if ("villa-categories".equals(clean)) {
            jdbc.update("update VillaCategory set category_status = 'INACTIVE' where villa_category_id = ?", id);
            audit.record(actor, "Deactivate Master Data", "VillaCategory", String.valueOf(id), AuditLogService.SUCCESS);
        } else if ("spa-services".equals(clean)) {
            jdbc.update("update SpaTreatment set treatment_status = ? where treatment_id = ?", TreatmentStatus.INACTIVE.name(), id);
            audit.record(actor, "Deactivate Master Data", "SpaTreatment", String.valueOf(id), AuditLogService.SUCCESS);
        } else if ("retreat-packages".equals(clean)) {
            jdbc.update("update RetreatPackage set package_status = 'INACTIVE' where retreat_package_id = ?", id);
            audit.record(actor, "Deactivate Master Data", "RetreatPackage", String.valueOf(id), AuditLogService.SUCCESS);
        } else {
            throw new ResourceNotFoundException("Master data group", "name", group);
        }
    }

    private void assertPriceNonNegative(BigDecimal price) {
        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("M6-MSG-03", "Price must be a non-negative value.");
        }
    }

    private String normalizeGroup(String raw) {
        if (raw == null) return "";
        return raw.trim().toLowerCase().replace("_", "-");
    }
}
