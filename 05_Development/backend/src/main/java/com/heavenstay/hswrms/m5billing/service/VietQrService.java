package com.heavenstay.hswrms.m5billing.service;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.common.exception.ResourceNotFoundException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBooking;
import com.heavenstay.hswrms.m2booking.repository.RetreatBookingRepository;
import com.heavenstay.hswrms.m5billing.dto.VietQrResponseDTO;
import com.heavenstay.hswrms.m5billing.entity.InvoiceEntity;
import com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity;
import com.heavenstay.hswrms.m5billing.repository.CreditNoteRepository;
import com.heavenstay.hswrms.m5billing.repository.InvoiceRepository;
import com.heavenstay.hswrms.m5billing.repository.PaymentTransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.Normalizer;
import java.time.LocalDateTime;

@Service
public class VietQrService {

    private static final Logger log = LoggerFactory.getLogger(VietQrService.class);

    private final InvoiceRepository invoiceRepository;
    private final PaymentTransactionRepository paymentTransactionRepository;
    private final CreditNoteRepository creditNoteRepository;
    private final RetreatBookingRepository bookingRepository;

    @Value("${app.vietqr.bank-bin:970422}")
    private String bankBin;

    @Value("${app.vietqr.bank-name:MBBank}")
    private String bankName;

    @Value("${app.vietqr.account-number:0987654321}")
    private String accountNumber;

    @Value("${app.vietqr.account-name:HEAVENSTAY RESORT}")
    private String accountName;

    @Value("${app.vietqr.template:compact2}")
    private String template;

    @Value("${app.vietqr.api-url:https://img.vietqr.io/image}")
    private String apiUrl;

    public VietQrService(InvoiceRepository invoiceRepository,
                          PaymentTransactionRepository paymentTransactionRepository,
                          RetreatBookingRepository bookingRepository,
                          CreditNoteRepository creditNoteRepository) {
        this.invoiceRepository = invoiceRepository;
        this.paymentTransactionRepository = paymentTransactionRepository;
        this.bookingRepository = bookingRepository;
        this.creditNoteRepository = creditNoteRepository;
    }

    /**
     * Generates a dynamic VietQR for an Invoice balance settlement (Module 5).
     */
    @Transactional
    public VietQrResponseDTO generateInvoiceVietQr(Long invoiceId) {
        InvoiceEntity invoice = invoiceRepository.findByIdWithDetails(invoiceId)
                .or(() -> (invoiceId != null && invoiceId <= Integer.MAX_VALUE) ? invoiceRepository.findByRetreatBookingId(invoiceId.intValue()) : java.util.Optional.empty())
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with ID: " + invoiceId));

        if ("CANCELLED".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            throw new BusinessRuleException("INVOICE_CANCELLED", "Cannot generate QR for a cancelled invoice.");
        }

        BigDecimal successfulPayments = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoiceId);
        if (successfulPayments == null) successfulPayments = BigDecimal.ZERO;

        BigDecimal creditNotes = creditNoteRepository.sumFinalCreditAmountByInvoiceId(invoice.getInvoiceId());
        if (creditNotes == null) creditNotes = BigDecimal.ZERO;
        BigDecimal balanceDue = invoice.getFinalAmount().subtract(successfulPayments).subtract(creditNotes);
        if (balanceDue.compareTo(BigDecimal.ZERO) <= 0 || "PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            if (!"PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
                invoice.setInvoiceStatus("PAID");
                invoiceRepository.save(invoice);
            }
            throw new BusinessRuleException("INVOICE_ALREADY_PAID", "Invoice is already paid in full.");
        }

        if (!"ISSUED".equalsIgnoreCase(invoice.getInvoiceStatus())) {
            invoice.setInvoiceStatus("ISSUED");
            invoiceRepository.save(invoice);
        }

        String invoiceNum = invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : String.valueOf(invoiceId);
        String transferContent = sanitizeContent("HSW INV " + invoiceNum);
        String txnRef = "HSW_INV_" + invoiceId + "_" + System.currentTimeMillis();

        // Build EMVCo Payload
        String emvCoPayload = buildEmvCoPayload(bankBin, accountNumber, balanceDue, transferContent);

        // Build Dynamic VietQR Image URL
        String qrImageUrl = buildQrImageUrl(bankBin, accountNumber, template, balanceDue, transferContent, accountName);

        // Persist PENDING Payment Transaction record in database
        PaymentTransactionEntity transaction = new PaymentTransactionEntity(
                null,
                invoice,
                "FINAL",
                "VIETQR_BANK_TRANSFER",
                txnRef,
                balanceDue,
                "PENDING"
        );
        transaction.setTransactionDate(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        VietQrResponseDTO response = new VietQrResponseDTO();
        response.setQrImageUrl(qrImageUrl);
        response.setQrPayload(emvCoPayload);
        response.setBankBin(bankBin);
        response.setBankName(bankName);
        response.setAccountNumber(accountNumber);
        response.setAccountNo(accountNumber);
        response.setAccountName(accountName);
        response.setAmount(balanceDue);
        response.setTransferContent(transferContent);
        response.setContent(transferContent);
        response.setTransactionReference(txnRef);
        response.setInvoiceId(invoiceId);
        response.setBookingId(invoice.getFolio() != null && invoice.getFolio().getRetreatBooking() != null
                ? invoice.getFolio().getRetreatBooking().getRetreatBookingId() : null);
        response.setInvoiceNumber(invoice.getInvoiceNumber());
        response.setPaymentType("FINAL");
        response.setPaymentStatus("PENDING");
        response.setMessage("Dynamic VietQR generated successfully for invoice settlement.");

        return response;
    }

    /**
     * Generates a dynamic VietQR for Retreat Booking deposit payment (Module 2).
     */
    @Transactional
    public VietQrResponseDTO generateDepositVietQr(Integer bookingId) {
        RetreatBooking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with ID: " + bookingId));

        if (!"PENDING".equalsIgnoreCase(booking.getBookingStatus())) {
            throw new BusinessRuleException("INVALID_BOOKING_STATUS",
                    "Booking #" + bookingId + " status is " + booking.getBookingStatus() + ". Only PENDING bookings can initiate deposit.");
        }

        BigDecimal depositAmount = booking.getDepositAmount();
        if (depositAmount == null || depositAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BusinessRuleException("INVALID_DEPOSIT_AMOUNT", "Booking deposit amount must be greater than zero.");
        }

        String transferContent = sanitizeContent("HSW DEP " + bookingId);
        String txnRef = "HSW_DEP_" + bookingId + "_" + System.currentTimeMillis();

        String emvCoPayload = buildEmvCoPayload(bankBin, accountNumber, depositAmount, transferContent);
        String qrImageUrl = buildQrImageUrl(bankBin, accountNumber, template, depositAmount, transferContent, accountName);

        PaymentTransactionEntity transaction = new PaymentTransactionEntity(
                booking,
                null,
                "DEPOSIT",
                "VIETQR_BANK_TRANSFER",
                txnRef,
                depositAmount,
                "PENDING"
        );
        transaction.setTransactionDate(LocalDateTime.now());
        paymentTransactionRepository.save(transaction);

        VietQrResponseDTO response = new VietQrResponseDTO();
        response.setQrImageUrl(qrImageUrl);
        response.setQrPayload(emvCoPayload);
        response.setBankBin(bankBin);
        response.setBankName(bankName);
        response.setAccountNumber(accountNumber);
        response.setAccountNo(accountNumber);
        response.setAccountName(accountName);
        response.setAmount(depositAmount);
        response.setTransferContent(transferContent);
        response.setContent(transferContent);
        response.setTransactionReference(txnRef);
        response.setBookingId(bookingId);
        response.setPaymentType("DEPOSIT");
        response.setPaymentStatus("PENDING");
        response.setMessage("Dynamic VietQR generated successfully for retreat booking deposit.");

        return response;
    }

    /**
     * Builds standard VietQR Quick Response image URL from VietQR Gateway.
     */
    public String buildQrImageUrl(String bin, String account, String templateName,
                                   BigDecimal amount, String addInfo, String accName) {
        long amountLong = amount != null ? amount.longValue() : 0L;
        String encodedInfo = URLEncoder.encode(addInfo, StandardCharsets.UTF_8);
        String encodedName = URLEncoder.encode(accName, StandardCharsets.UTF_8);
        return String.format("%s/%s-%s-%s.png?amount=%d&addInfo=%s&accountName=%s",
                apiUrl, bin, account, templateName, amountLong, encodedInfo, encodedName);
    }

    /**
     * Constructs standard EMVCo VietQR Tag-Length-Value (TLV) payload string.
     */
    public static String buildEmvCoPayload(String bin, String account, BigDecimal amount, String content) {
        // Tag 00: Payload Format Indicator ("01")
        String tlv00 = formatTlv("00", "01");

        // Tag 01: Point of Initiation Method ("12" = Dynamic QR with amount)
        String tlv01 = formatTlv("01", "12");

        // Tag 38: Merchant Account Information (Napas VietQR)
        // Sub-tag 00: Napas GUID ("A000000727")
        String sub00 = formatTlv("00", "A000000727");
        // Sub-tag 01: Beneficiary Bank Info (sub 00 = BIN, sub 01 = account number)
        String subSub00 = formatTlv("00", bin);
        String subSub01 = formatTlv("01", account);
        String sub01 = formatTlv("01", subSub00 + subSub01);
        // Sub-tag 02: Service Code ("QRIBFTTA" - Transfer to Account)
        String sub02 = formatTlv("02", "QRIBFTTA");
        String tlv38 = formatTlv("38", sub00 + sub01 + sub02);

        // Tag 53: Transaction Currency ("704" for VND)
        String tlv53 = formatTlv("53", "704");

        // Tag 54: Transaction Amount
        long amountLong = amount != null ? amount.longValue() : 0L;
        String tlv54 = formatTlv("54", String.valueOf(amountLong));

        // Tag 58: Country Code ("VN")
        String tlv58 = formatTlv("58", "VN");

        // Tag 62: Additional Data Field Template (sub-tag 08 = Reference Label / Purpose)
        String sub62_08 = formatTlv("08", content != null ? content : "");
        String tlv62 = formatTlv("62", sub62_08);

        // Tag 63: CRC16 Checksum
        String rawData = tlv00 + tlv01 + tlv38 + tlv53 + tlv54 + tlv58 + tlv62 + "6304";
        String crc = calculateCrc16(rawData);

        return rawData + crc;
    }

    private static String formatTlv(String tag, String value) {
        if (value == null || value.isEmpty()) return "";
        return String.format("%s%02d%s", tag, value.length(), value);
    }

    /**
     * Calculates CRC-16/CCITT-FALSE (polynomial 0x1021, init 0xFFFF).
     */
    public static String calculateCrc16(String data) {
        int crc = 0xFFFF;
        int polynomial = 0x1021;
        for (byte b : data.getBytes(StandardCharsets.US_ASCII)) {
            crc ^= (b & 0xFF) << 8;
            for (int i = 0; i < 8; i++) {
                if ((crc & 0x8000) != 0) {
                    crc = ((crc << 1) ^ polynomial) & 0xFFFF;
                } else {
                    crc = (crc << 1) & 0xFFFF;
                }
            }
        }
        return String.format("%04X", crc);
    }

    /**
     * Normalizes and strips non-ASCII accents for strict banking transmission.
     */
    public static String sanitizeContent(String text) {
        if (text == null) return "";
        String step1 = text.replace('Đ', 'D').replace('đ', 'd');
        String normalized = Normalizer.normalize(step1, Normalizer.Form.NFD);
        String ascii = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return ascii.replaceAll("[^a-zA-Z0-9 _-]", "").trim();
    }
}
