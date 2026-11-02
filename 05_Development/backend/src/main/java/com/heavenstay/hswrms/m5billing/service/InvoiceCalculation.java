package com.heavenstay.hswrms.m5billing.service;

import java.math.BigDecimal;

/**
 * Immutable result of the SRS BF-05 / Data Rule 21 invoice maths.
 *
 * <pre>
 * package_outstanding = package_charges - deposit_paid          (never below 0)
 * subtotal            = package_outstanding + spa + fnb
 * tax                 = (spa + fnb) * vat_rate                  (VAT on chargeable extras only)
 * final_amount        = subtotal + tax
 * </pre>
 *
 * {@code package_charges} is the PACKAGE folio line, i.e. package base price plus villa price modifier.
 */
public record InvoiceCalculation(
        BigDecimal packageCharges,
        BigDecimal depositPaid,
        BigDecimal packageOutstanding,
        BigDecimal spaCharges,
        BigDecimal fnbCharges,
        BigDecimal vatRate,
        BigDecimal subtotal,
        BigDecimal tax,
        BigDecimal finalAmount) {

    public boolean sameMonetaryResultAs(BigDecimal otherSubtotal, BigDecimal otherTax, BigDecimal otherFinal) {
        return subtotal.compareTo(otherSubtotal) == 0
                && tax.compareTo(otherTax) == 0
                && finalAmount.compareTo(otherFinal) == 0;
    }
}
