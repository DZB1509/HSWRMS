package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m2booking.entity.PhysicalVillaEntity;
import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import com.heavenstay.hswrms.m2booking.repository.PhysicalVillaRepository;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m3spa.entity.SpaSessionEntity;
import com.heavenstay.hswrms.m3spa.entity.TherapistEntity;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m3spa.repository.TherapistRepository;
import com.heavenstay.hswrms.m5billing.dto.OccupancyAnalyticsDTO;
import com.heavenstay.hswrms.m5billing.dto.RevenueAnalyticsDTO;
import com.heavenstay.hswrms.m5billing.dto.TherapistUtilizationDTO;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.FolioRepository;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFCellStyle;
import org.apache.poi.xssf.usermodel.XSSFColor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AnalyticsService {

    private static final byte[] FOREST_GREEN_RGB = new byte[]{(byte) 0x4F, (byte) 0x5A, (byte) 0x50};

    private final FolioRepository folioRepository;
    private final FolioItemRepository folioItemRepository;
    private final RetreatBookingRepository bookingRepository;
    private final PhysicalVillaRepository villaRepository;
    private final SpaSessionRepository spaSessionRepository;
    private final TherapistRepository therapistRepository;

    public AnalyticsService(FolioRepository folioRepository,
                            FolioItemRepository folioItemRepository,
                            RetreatBookingRepository bookingRepository,
                            PhysicalVillaRepository villaRepository,
                            SpaSessionRepository spaSessionRepository,
                            TherapistRepository therapistRepository) {
        this.folioRepository = folioRepository;
        this.folioItemRepository = folioItemRepository;
        this.bookingRepository = bookingRepository;
        this.villaRepository = villaRepository;
        this.spaSessionRepository = spaSessionRepository;
        this.therapistRepository = therapistRepository;
    }

    private void validateDateRange(LocalDate fromDate, LocalDate toDate) {
        if (fromDate != null && toDate != null) {
            if (fromDate.isAfter(toDate)) {
                throw new BusinessRuleException("INVALID_DATE_RANGE", "fromDate must be on or before toDate.");
            }
            if (ChronoUnit.DAYS.between(fromDate, toDate) > 730) {
                throw new BusinessRuleException("INVALID_DATE_RANGE", "Requested date range must not exceed 730 days.");
            }
        }
    }

    @Transactional(readOnly = true)
    public RevenueAnalyticsDTO getRevenueAnalytics(LocalDate fromDate, LocalDate toDate) {
        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusDays(29);
        LocalDate end = toDate != null ? toDate : LocalDate.now();
        validateDateRange(start, end);

        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt = end.atTime(LocalTime.MAX);

        List<FolioItemEntity> items = folioItemRepository.findItemsInDateRange(startDt, endDt);

        Map<LocalDate, BigDecimal> dailyPackage = new HashMap<>();
        Map<LocalDate, BigDecimal> dailySpa = new HashMap<>();
        Map<LocalDate, BigDecimal> dailyFnb = new HashMap<>();

        BigDecimal totalPackage = BigDecimal.ZERO;
        BigDecimal totalSpa = BigDecimal.ZERO;
        BigDecimal totalFnb = BigDecimal.ZERO;

        for (FolioItemEntity item : items) {
            LocalDate chargedDate = item.getChargedAt() != null ? item.getChargedAt().toLocalDate() : start;
            BigDecimal amt = item.getAmount() != null ? item.getAmount() : BigDecimal.ZERO;

            if ("PACKAGE".equalsIgnoreCase(item.getChargeCategory())) {
                dailyPackage.merge(chargedDate, amt, BigDecimal::add);
                totalPackage = totalPackage.add(amt);
            } else if ("SPA".equalsIgnoreCase(item.getChargeCategory())) {
                dailySpa.merge(chargedDate, amt, BigDecimal::add);
                totalSpa = totalSpa.add(amt);
            } else if ("FNB".equalsIgnoreCase(item.getChargeCategory())) {
                dailyFnb.merge(chargedDate, amt, BigDecimal::add);
                totalFnb = totalFnb.add(amt);
            }
        }

        // Zero-fill daily series for every date in range
        List<RevenueAnalyticsDTO.DailyRevenuePoint> dailySeries = new ArrayList<>();
        LocalDate cur = start;
        while (!cur.isAfter(end)) {
            BigDecimal p = dailyPackage.getOrDefault(cur, BigDecimal.ZERO);
            BigDecimal s = dailySpa.getOrDefault(cur, BigDecimal.ZERO);
            BigDecimal f = dailyFnb.getOrDefault(cur, BigDecimal.ZERO);
            dailySeries.add(new RevenueAnalyticsDTO.DailyRevenuePoint(cur, p, s, f));
            cur = cur.plusDays(1);
        }

        BigDecimal totalRev = totalPackage.add(totalSpa).add(totalFnb);

        // Sum outstanding balance from active folios
        List<FolioEntity> folios = folioRepository.findAll();
        BigDecimal outstanding = BigDecimal.ZERO;
        for (FolioEntity f : folios) {
            if (!"CLOSED".equalsIgnoreCase(f.getFolioStatus()) && !"PAID".equalsIgnoreCase(f.getFolioStatus())) {
                outstanding = outstanding.add(f.getBalanceDue());
            }
        }

        RevenueAnalyticsDTO dto = new RevenueAnalyticsDTO();
        dto.setFromDate(start);
        dto.setToDate(end);
        dto.setPackageRevenue(totalPackage);
        dto.setSpaRevenue(totalSpa);
        dto.setFnbRevenue(totalFnb);
        dto.setTotalRevenue(totalRev);
        dto.setOutstandingBalance(outstanding);
        dto.setDailySeries(dailySeries);

        List<RevenueAnalyticsDTO.CategoryBreakdownItem> breakdown = new ArrayList<>();
        breakdown.add(new RevenueAnalyticsDTO.CategoryBreakdownItem("Retreat Packages", totalPackage, "#4F5A50"));
        breakdown.add(new RevenueAnalyticsDTO.CategoryBreakdownItem("Spa & Therapies", totalSpa, "#6D7466"));
        breakdown.add(new RevenueAnalyticsDTO.CategoryBreakdownItem("Nourishing Dining", totalFnb, "#D8C7AE"));
        dto.setCategoryBreakdown(breakdown);

        return dto;
    }

    @Transactional(readOnly = true)
    public OccupancyAnalyticsDTO getOccupancyAnalytics(LocalDate fromDate, LocalDate toDate) {
        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusDays(7);
        LocalDate end = toDate != null ? toDate : LocalDate.now().plusDays(7);
        validateDateRange(start, end);

        List<PhysicalVillaEntity> villas = villaRepository.findAll();
        int totalVillas = villas.size();

        int occupiedCount = 0;
        int readyCount = 0;
        int cleaningCount = 0;
        int maintenanceCount = 0;

        List<OccupancyAnalyticsDTO.VillaOccupancyDetailDTO> details = new ArrayList<>();

        for (PhysicalVillaEntity v : villas) {
            String status = v.getVillaStatus() != null ? v.getVillaStatus().toUpperCase() : "AVAILABLE";
            String guestName = null;
            String bookingRef = null;

            if ("OCCUPIED".equals(status)) {
                occupiedCount++;
                List<RetreatBookingEntity> activeBookings = bookingRepository.findCheckedInByVillaId(v.getVillaId());
                if (!activeBookings.isEmpty()) {
                    RetreatBookingEntity b = activeBookings.get(0);
                    bookingRef = "HSW-" + (88000 + b.getRetreatBookingId());
                    if (b.getCustomerProfile() != null && b.getCustomerProfile().getUser() != null) {
                        guestName = maskCustomerName(b.getCustomerProfile().getUser().getFullName());
                    } else {
                        guestName = "Resident Guest";
                    }
                } else {
                    guestName = "Resident Guest";
                    bookingRef = "HSW-88000";
                }
            } else if ("NEEDS_CLEANING".equals(status)) {
                cleaningCount++;
            } else if ("MAINTENANCE".equals(status)) {
                maintenanceCount++;
            } else if ("AVAILABLE".equals(status)) {
                readyCount++;
            }

            details.add(new OccupancyAnalyticsDTO.VillaOccupancyDetailDTO(
                    v.getVillaId(),
                    v.getVillaNumber(),
                    "Sanctuary Villa (Category " + v.getVillaCategoryId() + ")",
                    status,
                    guestName,
                    bookingRef
            ));
        }

        // Count reserved: villas that have CONFIRMED future bookings in the interval
        List<RetreatBookingEntity> intervalBookings = bookingRepository.findBookingsInInterval(start, end);
        long reserved = intervalBookings.stream()
                .filter(b -> "CONFIRMED".equalsIgnoreCase(b.getBookingStatus()))
                .map(RetreatBookingEntity::getAssignedVilla)
                .filter(Objects::nonNull)
                .map(PhysicalVillaEntity::getVillaId)
                .distinct()
                .count();

        double occupancyRate = totalVillas > 0 ? ((double) occupiedCount / totalVillas) * 100.0 : 0.0;

        OccupancyAnalyticsDTO dto = new OccupancyAnalyticsDTO();
        dto.setFromDate(start);
        dto.setToDate(end);
        dto.setTotalVillas(totalVillas);
        dto.setOccupiedCount(occupiedCount);
        dto.setReservedCount((int) reserved);
        dto.setReadyCount(readyCount);
        dto.setCleaningCount(cleaningCount);
        dto.setMaintenanceCount(maintenanceCount);
        dto.setOccupancyRate(Math.round(occupancyRate * 100.0) / 100.0);
        dto.setVillaDetails(details);

        return dto;
    }

    @Transactional(readOnly = true)
    public TherapistUtilizationDTO getTherapistUtilization(LocalDate fromDate, LocalDate toDate) {
        LocalDate start = fromDate != null ? fromDate : LocalDate.now().minusDays(14);
        LocalDate end = toDate != null ? toDate : LocalDate.now();
        validateDateRange(start, end);

        LocalDateTime startDt = start.atStartOfDay();
        LocalDateTime endDt = end.atTime(LocalTime.MAX);

        List<TherapistEntity> therapists = therapistRepository.findAllWithUser();
        List<SpaSessionEntity> sessions = spaSessionRepository.findSessionsInDateRange(startDt, endDt);

        int totalScheduled = sessions.size();
        int completed = 0;
        int noShow = 0;
        int cancelled = 0;
        int totalMinutes = 0;

        Map<Long, List<SpaSessionEntity>> sessionsByTherapist = new HashMap<>();
        for (SpaSessionEntity s : sessions) {
            String status = s.getSessionStatus() != null ? s.getSessionStatus().toUpperCase() : "";
            if ("COMPLETED".equals(status)) completed++;
            else if ("NO_SHOW".equals(status)) noShow++;
            else if ("CANCELLED".equals(status)) cancelled++;

            if (!"CANCELLED".equals(status) && s.getScheduledStartAt() != null && s.getScheduledEndAt() != null) {
                long mins = Duration.between(s.getScheduledStartAt(), s.getScheduledEndAt()).toMinutes();
                totalMinutes += (int) mins;
            }

            if (s.getTherapist() != null) {
                sessionsByTherapist.computeIfAbsent(s.getTherapist().getTherapistId(), k -> new ArrayList<>()).add(s);
            }
        }

        List<TherapistUtilizationDTO.TherapistDetailItem> detailItems = new ArrayList<>();
        for (TherapistEntity t : therapists) {
            List<SpaSessionEntity> tSessions = sessionsByTherapist.getOrDefault(t.getTherapistId(), Collections.emptyList());
            int tScheduled = tSessions.size();
            int tCompleted = 0;
            int tNoShow = 0;
            int tCancelled = 0;
            int tMins = 0;

            for (SpaSessionEntity s : tSessions) {
                String status = s.getSessionStatus() != null ? s.getSessionStatus().toUpperCase() : "";
                if ("COMPLETED".equals(status)) tCompleted++;
                else if ("NO_SHOW".equals(status)) tNoShow++;
                else if ("CANCELLED".equals(status)) tCancelled++;

                if (!"CANCELLED".equals(status) && s.getScheduledStartAt() != null && s.getScheduledEndAt() != null) {
                    tMins += (int) Duration.between(s.getScheduledStartAt(), s.getScheduledEndAt()).toMinutes();
                }
            }

            String name = t.getUser() != null ? t.getUser().getFullName() : "Therapist #" + t.getTherapistId();
            double tHours = Math.round((tMins / 60.0) * 10.0) / 10.0;

            detailItems.add(new TherapistUtilizationDTO.TherapistDetailItem(
                    t.getTherapistId(),
                    name,
                    tScheduled,
                    tCompleted,
                    tNoShow,
                    tCancelled,
                    tMins,
                    tHours
            ));
        }

        TherapistUtilizationDTO dto = new TherapistUtilizationDTO();
        dto.setFromDate(start);
        dto.setToDate(end);
        dto.setTotalTherapists(therapists.size());
        dto.setTotalScheduledSessions(totalScheduled);
        dto.setCompletedSessions(completed);
        dto.setNoShowSessions(noShow);
        dto.setCancelledSessions(cancelled);
        dto.setTotalBookedHours(Math.round((totalMinutes / 60.0) * 10.0) / 10.0);
        dto.setTherapistDetails(detailItems);

        return dto;
    }

    @Transactional(readOnly = true)
    public byte[] exportReportToExcel(String reportType, LocalDate fromDate, LocalDate toDate) {
        String type = reportType != null ? reportType.toLowerCase().trim() : "revenue";
        if (!Set.of("revenue", "occupancy", "therapist").contains(type)) {
            throw new BusinessRuleException("INVALID_REPORT_TYPE",
                    "Invalid report type: '" + reportType + "'. Supported types: revenue, occupancy, therapist.");
        }

        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            // Forest Green header style
            XSSFCellStyle headerStyle = workbook.createCellStyle();
            Font font = workbook.createFont();
            font.setBold(true);
            font.setColor(IndexedColors.WHITE.getIndex());
            headerStyle.setFont(font);
            headerStyle.setFillForegroundColor(new XSSFColor(FOREST_GREEN_RGB, null));
            headerStyle.setFillPattern(FillPatternType.SOLID_FOREGROUND);
            headerStyle.setAlignment(HorizontalAlignment.CENTER);
            headerStyle.setVerticalAlignment(VerticalAlignment.CENTER);

            // Title style
            CellStyle titleStyle = workbook.createCellStyle();
            Font titleFont = workbook.createFont();
            titleFont.setBold(true);
            titleFont.setFontHeightInPoints((short) 13);
            titleStyle.setFont(titleFont);

            // Number currency format
            DataFormat dataFormat = workbook.createDataFormat();
            CellStyle currencyStyle = workbook.createCellStyle();
            currencyStyle.setDataFormat(dataFormat.getFormat("#,##0"));

            if ("occupancy".equalsIgnoreCase(type)) {
                OccupancyAnalyticsDTO occupancy = getOccupancyAnalytics(fromDate, toDate);

                // Sheet 1: Executive KPI Summary
                Sheet sheet1 = workbook.createSheet("Executive KPI Summary");
                Row r0 = sheet1.createRow(0);
                Cell c0 = r0.createCell(0);
                c0.setCellValue("HEAVENSTAY WELLNESS RESORT - OCCUPANCY EXECUTIVE SUMMARY");
                c0.setCellStyle(titleStyle);

                Row r1 = sheet1.createRow(1);
                r1.createCell(0).setCellValue("Reporting Interval: " + occupancy.getFromDate() + " to " + occupancy.getToDate());

                Row hRow = sheet1.createRow(3);
                String[] kpiHeaders = {"KPI Metric", "Value", "Unit / Context"};
                for (int i = 0; i < kpiHeaders.length; i++) {
                    Cell c = hRow.createCell(i);
                    c.setCellValue(kpiHeaders[i]);
                    c.setCellStyle(headerStyle);
                }

                Object[][] kpis = {
                        {"Overall Occupancy Rate", occupancy.getOccupancyRate(), "% of capacity"},
                        {"Total Resort Villas", occupancy.getTotalVillas(), "keys"},
                        {"Occupied Villas", occupancy.getOccupiedCount(), "in-house stays"},
                        {"Reserved Forward Villas", occupancy.getReservedCount(), "confirmed arrivals"},
                        {"Ready / Available", occupancy.getReadyCount(), "sanctuary inventory"},
                        {"Housekeeping In Progress", occupancy.getCleaningCount(), "needs cleaning"},
                        {"Maintenance Offline", occupancy.getMaintenanceCount(), "offline"}
                };

                int rowIdx = 4;
                for (Object[] kpi : kpis) {
                    Row r = sheet1.createRow(rowIdx++);
                    r.createCell(0).setCellValue(kpi[0].toString());
                    r.createCell(1).setCellValue(Double.parseDouble(kpi[1].toString()));
                    r.createCell(2).setCellValue(kpi[2].toString());
                }
                for (int i = 0; i < kpiHeaders.length; i++) sheet1.autoSizeColumn(i);

                // Sheet 2: Daily Categorized Data
                Sheet sheet2 = workbook.createSheet("Daily Categorized Data");
                Row s2H = sheet2.createRow(0);
                String[] s2Cols = {"Villa ID", "Villa Number", "Category", "Status", "Resident Guest (Masked)", "Booking Reference"};
                for (int i = 0; i < s2Cols.length; i++) {
                    Cell c = s2H.createCell(i);
                    c.setCellValue(s2Cols[i]);
                    c.setCellStyle(headerStyle);
                }

                int s2Idx = 1;
                for (OccupancyAnalyticsDTO.VillaOccupancyDetailDTO v : occupancy.getVillaDetails()) {
                    Row r = sheet2.createRow(s2Idx++);
                    r.createCell(0).setCellValue(v.getVillaId());
                    r.createCell(1).setCellValue(v.getVillaNumber());
                    r.createCell(2).setCellValue(v.getCategory());
                    r.createCell(3).setCellValue(v.getStatus());
                    r.createCell(4).setCellValue(v.getCustomerName() != null ? v.getCustomerName() : "—");
                    r.createCell(5).setCellValue(v.getBookingReference() != null ? v.getBookingReference() : "—");
                }
                for (int i = 0; i < s2Cols.length; i++) sheet2.autoSizeColumn(i);

            } else if ("therapist".equalsIgnoreCase(type)) {
                TherapistUtilizationDTO therapist = getTherapistUtilization(fromDate, toDate);

                // Sheet 1: Executive KPI Summary
                Sheet sheet1 = workbook.createSheet("Executive KPI Summary");
                Row r0 = sheet1.createRow(0);
                Cell c0 = r0.createCell(0);
                c0.setCellValue("HEAVENSTAY WELLNESS RESORT - THERAPIST WORKLOAD EXECUTIVE SUMMARY");
                c0.setCellStyle(titleStyle);

                Row r1 = sheet1.createRow(1);
                r1.createCell(0).setCellValue("Reporting Interval: " + therapist.getFromDate() + " to " + therapist.getToDate());

                Row hRow = sheet1.createRow(3);
                String[] kpiHeaders = {"KPI Metric", "Value", "Context"};
                for (int i = 0; i < kpiHeaders.length; i++) {
                    Cell c = hRow.createCell(i);
                    c.setCellValue(kpiHeaders[i]);
                    c.setCellStyle(headerStyle);
                }

                Object[][] kpis = {
                        {"Total Wellness Therapists", therapist.getTotalTherapists(), "practitioners"},
                        {"Total Scheduled Sessions", therapist.getTotalScheduledSessions(), "sessions"},
                        {"Completed Sessions", therapist.getCompletedSessions(), "delivered therapies"},
                        {"No-Show Sessions", therapist.getNoShowSessions(), "unattended"},
                        {"Cancelled Sessions", therapist.getCancelledSessions(), "released slots"},
                        {"Total Booked Hours", therapist.getTotalBookedHours(), "hours"}
                };

                int rowIdx = 4;
                for (Object[] kpi : kpis) {
                    Row r = sheet1.createRow(rowIdx++);
                    r.createCell(0).setCellValue(kpi[0].toString());
                    r.createCell(1).setCellValue(Double.parseDouble(kpi[1].toString()));
                    r.createCell(2).setCellValue(kpi[2].toString());
                }
                for (int i = 0; i < kpiHeaders.length; i++) sheet1.autoSizeColumn(i);

                // Sheet 2: Daily Categorized Data
                Sheet sheet2 = workbook.createSheet("Daily Categorized Data");
                Row s2H = sheet2.createRow(0);
                String[] s2Cols = {"Therapist ID", "Practitioner Name", "Scheduled Sessions", "Completed", "No-Show", "Cancelled", "Booked Minutes", "Booked Hours"};
                for (int i = 0; i < s2Cols.length; i++) {
                    Cell c = s2H.createCell(i);
                    c.setCellValue(s2Cols[i]);
                    c.setCellStyle(headerStyle);
                }

                int s2Idx = 1;
                for (TherapistUtilizationDTO.TherapistDetailItem t : therapist.getTherapistDetails()) {
                    Row r = sheet2.createRow(s2Idx++);
                    r.createCell(0).setCellValue(t.getTherapistId());
                    r.createCell(1).setCellValue(t.getName());
                    r.createCell(2).setCellValue(t.getSessionsCount());
                    r.createCell(3).setCellValue(t.getCompletedCount());
                    r.createCell(4).setCellValue(t.getNoShowCount());
                    r.createCell(5).setCellValue(t.getCancelledCount());
                    r.createCell(6).setCellValue(t.getBookedMinutes());
                    r.createCell(7).setCellValue(t.getBookedHours());
                }
                for (int i = 0; i < s2Cols.length; i++) sheet2.autoSizeColumn(i);

            } else {
                // Revenue Report
                RevenueAnalyticsDTO revenue = getRevenueAnalytics(fromDate, toDate);

                // Sheet 1: Executive KPI Summary
                Sheet sheet1 = workbook.createSheet("Executive KPI Summary");
                Row r0 = sheet1.createRow(0);
                Cell c0 = r0.createCell(0);
                c0.setCellValue("HEAVENSTAY WELLNESS RESORT - REVENUE EXECUTIVE SUMMARY");
                c0.setCellStyle(titleStyle);

                Row r1 = sheet1.createRow(1);
                r1.createCell(0).setCellValue("Reporting Interval: " + revenue.getFromDate() + " to " + revenue.getToDate());

                Row hRow = sheet1.createRow(3);
                String[] kpiHeaders = {"Revenue Stream", "Amount (VND)", "Share of Total"};
                for (int i = 0; i < kpiHeaders.length; i++) {
                    Cell c = hRow.createCell(i);
                    c.setCellValue(kpiHeaders[i]);
                    c.setCellStyle(headerStyle);
                }

                int rowIdx = 4;
                double tot = revenue.getTotalRevenue().doubleValue();
                for (RevenueAnalyticsDTO.CategoryBreakdownItem item : revenue.getCategoryBreakdown()) {
                    Row r = sheet1.createRow(rowIdx++);
                    r.createCell(0).setCellValue(item.getName());
                    Cell amtCell = r.createCell(1);
                    amtCell.setCellValue(item.getValue().doubleValue());
                    amtCell.setCellStyle(currencyStyle);
                    double pct = tot > 0 ? (item.getValue().doubleValue() / tot) * 100.0 : 0.0;
                    r.createCell(2).setCellValue(Math.round(pct * 10.0) / 10.0 + "%");
                }

                Row totRow = sheet1.createRow(rowIdx++);
                totRow.createCell(0).setCellValue("Gross Total Revenue");
                Cell totCell = totRow.createCell(1);
                totCell.setCellValue(revenue.getTotalRevenue().doubleValue());
                totCell.setCellStyle(currencyStyle);
                totRow.createCell(2).setCellValue("100.0%");

                Row outRow = sheet1.createRow(rowIdx);
                outRow.createCell(0).setCellValue("Unsettled Folio Balance");
                Cell outCell = outRow.createCell(1);
                outCell.setCellValue(revenue.getOutstandingBalance().doubleValue());
                outCell.setCellStyle(currencyStyle);
                outRow.createCell(2).setCellValue("Pending Checkout");

                for (int i = 0; i < kpiHeaders.length; i++) sheet1.autoSizeColumn(i);

                // Sheet 2: Daily Categorized Data
                Sheet sheet2 = workbook.createSheet("Daily Categorized Data");
                Row s2H = sheet2.createRow(0);
                String[] s2Cols = {"Date", "Retreat Packages (VND)", "Spa Therapies (VND)", "Dining (VND)", "Daily Total (VND)"};
                for (int i = 0; i < s2Cols.length; i++) {
                    Cell c = s2H.createCell(i);
                    c.setCellValue(s2Cols[i]);
                    c.setCellStyle(headerStyle);
                }

                int s2Idx = 1;
                for (RevenueAnalyticsDTO.DailyRevenuePoint p : revenue.getDailySeries()) {
                    Row r = sheet2.createRow(s2Idx++);
                    r.createCell(0).setCellValue(p.getDate().toString());

                    Cell c1 = r.createCell(1);
                    c1.setCellValue(p.getPackageRevenue().doubleValue());
                    c1.setCellStyle(currencyStyle);

                    Cell c2 = r.createCell(2);
                    c2.setCellValue(p.getSpaRevenue().doubleValue());
                    c2.setCellStyle(currencyStyle);

                    Cell c3 = r.createCell(3);
                    c3.setCellValue(p.getFnbRevenue().doubleValue());
                    c3.setCellStyle(currencyStyle);

                    Cell c4 = r.createCell(4);
                    c4.setCellValue(p.getTotalRevenue().doubleValue());
                    c4.setCellStyle(currencyStyle);
                }
                for (int i = 0; i < s2Cols.length; i++) sheet2.autoSizeColumn(i);
            }

            workbook.write(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new BusinessRuleException("EXCEL_EXPORT_ERROR", "Failed to generate Excel report: " + e.getMessage());
        }
    }

    private String maskCustomerName(String fullName) {
        if (fullName == null || fullName.isBlank()) return "Resident Guest";
        String[] parts = fullName.trim().split("\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < parts.length; i++) {
            String p = parts[i];
            if (p.length() <= 2) {
                sb.append(p.charAt(0)).append("*");
            } else {
                sb.append(p.charAt(0))
                  .append("*".repeat(p.length() - 2))
                  .append(p.charAt(p.length() - 1));
            }
            if (i < parts.length - 1) sb.append(" ");
        }
        return sb.toString();
    }
}
