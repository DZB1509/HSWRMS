package com.heavenstay.hswrms.m2booking.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * Deposit payment attempt for a {@link RetreatBooking}. Maps the shared table
 * {@code dbo.PaymentTransaction}; M2 only ever writes {@code payment_type = 'DEPOSIT'}
 * rows (retreat_booking_id set, invoice_id NULL — SRS data rule 23).
 *
 * <p>Ownership of this table between M2 (deposit) and M5 (final payment) is the unresolved
 * Open Item OI-04. When M5 publishes a payment service this entity should be replaced by it.
 */
@Entity
@Table(name = "PaymentTransaction", schema = "dbo")
public class PaymentTransaction {

    public static final String TYPE_DEPOSIT = "DEPOSIT";

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_SUCCESSFUL = "SUCCESSFUL";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_CANCELLED = "CANCELLED";

    public static final String METHOD_VNPAY = "VNPAY";
    public static final String METHOD_CASH = "CASH";
    public static final String METHOD_POS = "POS";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Integer transactionId;

    @Column(name = "retreat_booking_id")
    private Integer retreatBookingId;

    @Column(name = "payment_type", nullable = false, length = 20)
    private String paymentType = TYPE_DEPOSIT;

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod;

    @Column(name = "transaction_reference", length = 150)
    private String transactionReference;

    @Column(name = "amount_paid", nullable = false, precision = 18, scale = 2)
    private BigDecimal amountPaid;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = STATUS_PENDING;

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate = LocalDateTime.now(ZoneOffset.UTC);

    public PaymentTransaction() {
    }

    public Integer getTransactionId() {
        return transactionId;
    }

    public Integer getRetreatBookingId() {
        return retreatBookingId;
    }

    public void setRetreatBookingId(Integer retreatBookingId) {
        this.retreatBookingId = retreatBookingId;
    }

    public String getPaymentType() {
        return paymentType;
    }

    public void setPaymentType(String paymentType) {
        this.paymentType = paymentType;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getTransactionReference() {
        return transactionReference;
    }

    public void setTransactionReference(String transactionReference) {
        this.transactionReference = transactionReference;
    }

    public BigDecimal getAmountPaid() {
        return amountPaid;
    }

    public void setAmountPaid(BigDecimal amountPaid) {
        this.amountPaid = amountPaid;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public LocalDateTime getTransactionDate() {
        return transactionDate;
    }

    public void setTransactionDate(LocalDateTime transactionDate) {
        this.transactionDate = transactionDate;
    }
}
