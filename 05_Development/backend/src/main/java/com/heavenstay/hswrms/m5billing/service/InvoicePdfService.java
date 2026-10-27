package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m1identity.repository.CustomerProfileRepository;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m3spa.entity.SpaSession;
import com.heavenstay.hswrms.m3spa.repository.SpaSessionRepository;
import com.heavenstay.hswrms.m5billing.entity.FolioEntity;
import com.heavenstay.hswrms.m5billing.entity.FolioItemEntity;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.repository.FolioItemRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.text.Normalizer;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Optional;

@Service
public class InvoicePdfService {

    private static final Color BRAND_FOREST_GREEN = new Color(0x4F, 0x5A, 0x50);
    private static final Color BRAND_LIGHT_BG = new Color(0xF4, 0xF5, 0xF4);
    private static final Color TEXT_DARK = new Color(0x2C, 0x33, 0x2D);
    private static final Color TEXT_MUTED = new Color(0x73, 0x7A, 0x74);
    private static final Color BORDER_COLOR = new Color(0xDC, 0xDF, 0xDC);

    private final InvoiceRepository invoiceRepository;
    private final FolioItemRepository folioItemRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final FolioBillingService folioBillingService;
    private final SpaSessionRepository spaSessionRepository;
    private final CustomerProfileRepository customerProfileRepository;

    public InvoicePdfService(InvoiceRepository invoiceRepository,
                             FolioItemRepository folioItemRepository,
                             PaymentTransactionRepository paymentTransactionRepository,
                             FolioBillingService folioBillingService,
                             SpaSessionRepository spaSessionRepository,
                             CustomerProfileRepository customerProfileRepository) {
        this.invoiceRepository = invoiceRepository;
        this.folioItemRepository = folioItemRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.folioBillingService = folioBillingService;
        this.spaSessionRepository = spaSessionRepository;
        this.customerProfileRepository = customerProfileRepository;
    }

    @Transactional(readOnly = true)
    public byte[] generateInvoicePdf(Long invoiceId) {
        InvoiceEntity invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        FolioEntity folio = invoice.getFolio();
        RetreatBooking booking = folio.getRetreatBooking();
        List<FolioItemEntity> items = folioItemRepository.findByFolioId(folio.getFolioId());
        InvoiceCalculation calc = folioBillingService.calculateInvoiceAmounts(booking, items);

        BigDecimal amountPaid = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoice.getInvoiceId());
        if (amountPaid == null) amountPaid = BigDecimal.ZERO;
        BigDecimal amountDue = invoice.getFinalAmount().subtract(amountPaid);
        if (amountDue.compareTo(BigDecimal.ZERO) < 0) amountDue = BigDecimal.ZERO;

        DecimalFormat currencyFmt = new DecimalFormat("#,##0 VND");

        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, baos);
            document.open();

            // 1. BRAND HEADER
            Font brandFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 18, BRAND_FOREST_GREEN);
            Paragraph brandTitle = new Paragraph("HEAVENSTAY WELLNESS RESORT", brandFont);
            brandTitle.setAlignment(Element.ALIGN_CENTER);
            document.add(brandTitle);

            Font subFont = FontFactory.getFont(FontFactory.HELVETICA, 10, TEXT_MUTED);
            Paragraph subtitle = new Paragraph("Quiet Luxury & Holistic Sanctuary | Vinh Hy Bay, Ninh Thuan, Vietnam", subFont);
            subtitle.setAlignment(Element.ALIGN_CENTER);
            document.add(subtitle);

            Paragraph docTitle = new Paragraph("OFFICIAL FOLIO & TAX INVOICE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 13, TEXT_DARK));
            docTitle.setAlignment(Element.ALIGN_CENTER);
            docTitle.setSpacingBefore(8);
            docTitle.setSpacingAfter(14);
            document.add(docTitle);

            // 2. STAY & INVOICE DETAILS METADATA TABLE
            PdfPTable metaTable = new PdfPTable(2);
            metaTable.setWidthPercentage(100);
            metaTable.setWidths(new float[]{1.1f, 0.9f});
            metaTable.setSpacingAfter(14);

            String customerName = "Resort Guest";
            if (booking.getCustomerProfileId() != null) {
                customerName = customerProfileRepository.findByIdWithUser(booking.getCustomerProfileId())
                        .map(cp -> cp.getUser() != null ? cp.getUser().getFullName() : "Resort Guest")
                        .orElse("Resort Guest");
            }
            String villaNum = booking.getAssignedVilla() != null ? booking.getAssignedVilla().getVillaNumber() : "Villa #102";
            DateTimeFormatter dateFmt = DateTimeFormatter.ofPattern("dd/MM/yyyy");
            String checkIn = booking.getCheckInDate() != null ? booking.getCheckInDate().format(dateFmt) : "N/A";
            String checkOut = booking.getCheckOutDate() != null ? booking.getCheckOutDate().format(dateFmt) : "N/A";

            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorderColor(BORDER_COLOR);
            leftCell.setPadding(8);
            leftCell.addElement(new Paragraph("CUSTOMER & STAY PARTICULARS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BRAND_FOREST_GREEN)));
            leftCell.addElement(new Paragraph("Customer: " + cleanAscii(customerName), FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_DARK)));
            leftCell.addElement(new Paragraph("Assigned Villa: " + villaNum, FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_DARK)));
            leftCell.addElement(new Paragraph("Stay Duration: " + checkIn + " - " + checkOut, FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_DARK)));
            metaTable.addCell(leftCell);

            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorderColor(BORDER_COLOR);
            rightCell.setPadding(8);
            rightCell.addElement(new Paragraph("INVOICE PARTICULARS", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BRAND_FOREST_GREEN)));
            rightCell.addElement(new Paragraph("Invoice No: " + invoice.getInvoiceNumber(), FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_DARK)));
            rightCell.addElement(new Paragraph("Booking Ref: HSW-" + (88000 + booking.getRetreatBookingId()), FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_DARK)));
            rightCell.addElement(new Paragraph("Issue Date: " + (invoice.getIssuedDate() != null ? invoice.getIssuedDate().format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) : "N/A"), FontFactory.getFont(FontFactory.HELVETICA, 9, TEXT_DARK)));
            rightCell.addElement(new Paragraph("Status: " + invoice.getInvoiceStatus(), FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BRAND_FOREST_GREEN)));
            metaTable.addCell(rightCell);

            document.add(metaTable);

            // 3. ITEMIZED CHARGES TABLE
            PdfPTable itemsTable = new PdfPTable(4);
            itemsTable.setWidthPercentage(100);
            itemsTable.setWidths(new float[]{1.0f, 2.5f, 1.2f, 1.3f});
            itemsTable.setSpacingAfter(14);

            addTableHeader(itemsTable, "Category");
            addTableHeader(itemsTable, "Item Description");
            addTableHeader(itemsTable, "Timing / Reference");
            addTableHeader(itemsTable, "Amount");

            DateTimeFormatter chargeTimeFmt = DateTimeFormatter.ofPattern("dd/MM HH:mm");
            for (FolioItemEntity item : items) {
                String timing = item.getChargedAt() != null ? item.getChargedAt().format(chargeTimeFmt) : "";
                if (item.getSourceSpaSessionId() != null) {
                    Optional<SpaSession> sessionOpt = spaSessionRepository.findById(item.getSourceSpaSessionId());
                    if (sessionOpt.isPresent() && sessionOpt.get().getScheduledStartAt() != null) {
                        timing = sessionOpt.get().getScheduledStartAt().format(chargeTimeFmt);
                    }
                }

                addItemRow(itemsTable, item.getChargeCategory(), cleanAscii(item.getDescription()), timing, currencyFmt.format(item.getAmount()));
            }

            document.add(itemsTable);

            // 4. FINANCIAL SUMMARY BREAKDOWN TABLE (SRS BF-05 / Data Rule 21 compliant)
            PdfPTable summaryTable = new PdfPTable(2);
            summaryTable.setWidthPercentage(60);
            summaryTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            summaryTable.setWidths(new float[]{2.0f, 1.5f});
            summaryTable.setSpacingAfter(16);

            addSummaryRow(summaryTable, "Package Inclusions Gross", currencyFmt.format(calc.packageCharges()), false);
            addSummaryRow(summaryTable, "Less: Deposit Settled", "- " + currencyFmt.format(calc.depositPaid()), false);
            addSummaryRow(summaryTable, "Package Outstanding Due", currencyFmt.format(calc.packageOutstanding()), false);
            addSummaryRow(summaryTable, "Spa Therapies Extra", currencyFmt.format(calc.spaCharges()), false);
            addSummaryRow(summaryTable, "Dining & Culinary Extra", currencyFmt.format(calc.fnbCharges()), false);
            addSummaryRow(summaryTable, "Subtotal (Chargeable Total)", currencyFmt.format(invoice.getSubtotalAmount()), true);
            addSummaryRow(summaryTable, "VAT (" + (calc.vatRate().multiply(new BigDecimal(100)).intValue()) + "% on chargeable extras)", currencyFmt.format(invoice.getTaxAmount()), false);
            addSummaryRow(summaryTable, "Final Total Due", currencyFmt.format(invoice.getFinalAmount()), true);
            addSummaryRow(summaryTable, "Total Amount Paid", currencyFmt.format(amountPaid), false);
            addSummaryRow(summaryTable, "Balance Outstanding", currencyFmt.format(amountDue), true);

            document.add(summaryTable);

            // 5. FOOTER NOTICE
            Paragraph footer = new Paragraph(
                    "Thank you for entrusting your restorative retreat to HeavenStay Wellness Resort.\n" +
                    "For tax verification or corporate inquiries, please email billing@heavenstay.com.\n" +
                    "HSWRMS Automated Financial System - Valid Without Seal.",
                    FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8, TEXT_MUTED)
            );
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return baos.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate PDF invoice", e);
        }
    }

    private void addTableHeader(PdfPTable table, String text) {
        PdfPCell cell = new PdfPCell(new Phrase(text, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Color.WHITE)));
        cell.setBackgroundColor(BRAND_FOREST_GREEN);
        cell.setPadding(6);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        table.addCell(cell);
    }

    private void addItemRow(PdfPTable table, String cat, String desc, String timing, String amt) {
        Font f = FontFactory.getFont(FontFactory.HELVETICA, 8, TEXT_DARK);
        PdfPCell c1 = new PdfPCell(new Phrase(cat, f));
        PdfPCell c2 = new PdfPCell(new Phrase(desc, f));
        PdfPCell c3 = new PdfPCell(new Phrase(timing, f));
        PdfPCell c4 = new PdfPCell(new Phrase(amt, f));

        c1.setPadding(5);
        c2.setPadding(5);
        c3.setPadding(5);
        c4.setPadding(5);
        c4.setHorizontalAlignment(Element.ALIGN_RIGHT);

        table.addCell(c1);
        table.addCell(c2);
        table.addCell(c3);
        table.addCell(c4);
    }

    private void addSummaryRow(PdfPTable table, String label, String value, boolean isBold) {
        Font font = isBold
                ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, BRAND_FOREST_GREEN)
                : FontFactory.getFont(FontFactory.HELVETICA, 8, TEXT_DARK);

        PdfPCell c1 = new PdfPCell(new Phrase(label, font));
        PdfPCell c2 = new PdfPCell(new Phrase(value, font));

        if (isBold) {
            c1.setBackgroundColor(BRAND_LIGHT_BG);
            c2.setBackgroundColor(BRAND_LIGHT_BG);
        }

        c1.setBorderColor(BORDER_COLOR);
        c2.setBorderColor(BORDER_COLOR);
        c1.setPadding(4);
        c2.setPadding(4);
        c2.setHorizontalAlignment(Element.ALIGN_RIGHT);

        table.addCell(c1);
        table.addCell(c2);
    }

    private String cleanAscii(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        return normalized.replaceAll("\\p{M}", "");
    }
}
