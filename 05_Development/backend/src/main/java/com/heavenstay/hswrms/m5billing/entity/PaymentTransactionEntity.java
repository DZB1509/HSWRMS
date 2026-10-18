package com.heavenstay.hswrms.m5billing.entity;

import com.heavenstay.hswrms.common.exception.BusinessRuleException;
import com.heavenstay.hswrms.m2booking.entity.RetreatBookingEntity;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "PaymentTransaction")
public class PaymentTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "retreat_booking_id")
    private RetreatBookingEntity retreatBooking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id")
    private InvoiceEntity invoice;

    @Column(name = "payment_type", nullable = false, length = 20)
    private String paymentType; // DEPOSIT, FINAL

    @Column(name = "payment_method", nullable = false, length = 30)
    private String paymentMethod; // CASH, VNPAY, CARD

    @Column(name = "transaction_reference", length = 150, unique = true)
    private String transactionReference;

    @Column(name = "amount_paid", nullable = false, precision = 18, scale = 2)
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @Column(name = "payment_status", nullable = false, length = 20)
    private String paymentStatus = "PENDING"; // PENDING, SUCCESSFUL, FAILED, REFUNDED, CANCELLED

    @Column(name = "transaction_date", nullable = false)
    private LocalDateTime transactionDate = LocalDateTime.now();

    public PaymentTransactionEntity() {}

    public PaymentTransactionEntity(RetreatBookingEntity retreatBooking, InvoiceEntity invoice,
                                    String paymentType, String paymentMethod, String transactionReference,
                                    BigDecimal amountPaid, String paymentStatus) {
        this.retreatBooking = retreatBooking;
        this.invoice = invoice;
        this.paymentType = paymentType;
        this.paymentMethod = paymentMethod;
        this.transactionReference = transactionReference;
        this.amountPaid = amountPaid != null ? amountPaid : BigDecimal.ZERO;
        this.paymentStatus = paymentStatus != null ? paymentStatus : "PENDING";
        this.transactionDate = LocalDateTime.now();
        validateTargetConstraint();
    }

    @PrePersist
    @PreUpdate
    public void validateTargetConstraint() {
        if ("DEPOSIT".equalsIgnoreCase(paymentType)) {
            if (retreatBooking == null || invoice != null) {
                throw new BusinessRuleException("INVALID_PAYMENT_TARGET",
                        "DEPOSIT payment must target retreat_booking_id and not invoice_id.");
            }
        } else if ("FINAL".equalsIgnoreCase(paymentType)) {
            if (invoice == null || retreatBooking != null) {
                throw new BusinessRuleException("INVALID_PAYMENT_TARGET",
                        "FINAL payment must target invoice_id and not retreat_booking_id.");
            }
        } else {
            throw new BusinessRuleException("INVALID_PAYMENT_TYPE",
                    "Payment type must be DEPOSIT or FINAL.");
        }
    }

    public Long getTransactionId() {
        return transactionId;
    }

    public void setTransactionId(Long transactionId) {
        this.transactionId = transactionId;
    }

    public RetreatBookingEntity getRetreatBooking() {
        return retreatBooking;
    }

    public void setRetreatBooking(RetreatBookingEntity retreatBooking) {
        this.retreatBooking = retreatBooking;
    }

    public InvoiceEntity getInvoice() {
        return invoice;
    }

    public void setInvoice(InvoiceEntity invoice) {
        this.invoice = invoice;
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
