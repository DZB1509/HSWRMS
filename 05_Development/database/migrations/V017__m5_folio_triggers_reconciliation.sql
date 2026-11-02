/* ============================================================================
   Migration : V017__m5_folio_triggers_reconciliation.sql
   Module    : M5 - Consolidated Folio Billing, Checkout & Post-Stay Operations
   Target    : SQL Server 2019+ (database-context-neutral: HSWRMS / HSWRMS_TEST)
   Depends On: V010__m5_billing_adjustments_and_credit_notes.sql
               V013__m5_credit_note_refund_settlement.sql
               V014__m5_payment_transaction_vietqr_and_types.sql
   Purpose   :
     1. Reconcile dbo.TR_FolioItem_RecalculateTotal with V010 void/adjustment
        semantics (FolioItemEntity.getPayableAmount / FolioEntity.recalculateTotals):
          - Exclude voided items (is_voided = 1).
          - Subtract partial adjustments (amount - ISNULL(adjusted_amount, 0.00)),
            clamped at >= 0.00.
     2. Reconcile dbo.TR_PaymentTransaction_RecalculateFolioPaid with
        FolioBillingService.syncFolioPaidState and CheckoutService:
          - Resolve affected folios from BOTH invoice-linked transactions
            (invoice_id -> dbo.Invoice.folio_id) AND booking-linked deposit
            transactions (retreat_booking_id -> dbo.Folio.retreat_booking_id).
          - Sum ONLY transactions with payment_status = 'SUCCESSFUL' across
            DEPOSIT (retreat_booking_id) and FINAL / FINAL_PAYMENT (invoice_id).
          - Ensure PENDING (e.g., VietQR / VNPay awaiting callback), FAILED,
            CANCELLED, and REFUNDED transactions never contribute to total_paid.
          - Ensure idempotent calculation with zero double-counting between
            application-layer saves and database triggers.
   ============================================================================ */

-- Database-context-neutral guard: never switch databases implicitly; validate active target context.
DECLARE @CurrentDb sysname = DB_NAME();
IF @CurrentDb IN (N'master', N'model', N'msdb', N'tempdb') OR @CurrentDb NOT LIKE N'HSWRMS%'
BEGIN
    DECLARE @ErrMsg NVARCHAR(400) = N'Refusing to execute migration in unexpected database context ['
        + ISNULL(@CurrentDb, N'NULL')
        + N']. Connect explicitly to the target HSWRMS database (e.g., HSWRMS or HSWRMS_TEST).';
    THROW 50000, @ErrMsg, 1;
END;
GO

-- Prerequisite schema check: V010 must be applied before V017 so FolioItem has is_voided and adjusted_amount.
IF COL_LENGTH('dbo.FolioItem', 'is_voided') IS NULL
   OR COL_LENGTH('dbo.FolioItem', 'adjusted_amount') IS NULL
BEGIN
    THROW 50001, N'Prerequisite migration V010__m5_billing_adjustments_and_credit_notes.sql must be applied before V017 (missing dbo.FolioItem.is_voided or adjusted_amount).', 1;
END;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- 1. Reconcile TR_FolioItem_RecalculateTotal to honor is_voided and adjusted_amount
CREATE OR ALTER TRIGGER [dbo].[TR_FolioItem_RecalculateTotal]
ON [dbo].[FolioItem]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH AffectedFolio AS (
        SELECT folio_id FROM inserted WHERE folio_id IS NOT NULL
        UNION
        SELECT folio_id FROM deleted WHERE folio_id IS NOT NULL
    ),
    Totals AS (
        SELECT
            af.folio_id,
            CAST(
                ISNULL(
                    SUM(
                        CASE
                            WHEN fi.folio_item_id IS NULL THEN 0.00
                            WHEN ISNULL(fi.is_voided, 0) = 1 THEN 0.00
                            WHEN fi.amount - ISNULL(fi.adjusted_amount, 0.00) > 0.00
                                THEN fi.amount - ISNULL(fi.adjusted_amount, 0.00)
                            ELSE 0.00
                        END
                    ),
                    0.00
                ) AS DECIMAL(18, 2)
            ) AS calculated_charges
        FROM AffectedFolio af
        LEFT JOIN dbo.FolioItem fi ON fi.folio_id = af.folio_id
        GROUP BY af.folio_id
    )
    UPDATE f
    SET
        f.total_charges = t.calculated_charges,
        f.folio_status = CASE
            WHEN f.folio_status = 'CLOSED' THEN 'CLOSED'
            WHEN EXISTS (
                SELECT 1
                FROM dbo.Invoice inv
                WHERE inv.folio_id = f.folio_id
                  AND inv.invoice_status = 'PAID'
            ) THEN 'PAID'
            WHEN t.calculated_charges > 0.00 AND f.total_paid >= t.calculated_charges THEN 'PAID'
            WHEN f.total_paid > 0.00 THEN 'PARTIALLY_PAID'
            ELSE 'OPEN'
        END
    FROM dbo.Folio f
    INNER JOIN Totals t ON t.folio_id = f.folio_id;
END;
GO

-- 2. Reconcile TR_PaymentTransaction_RecalculateFolioPaid to include both DEPOSIT and FINAL/FINAL_PAYMENT
--    SUCCESSFUL payments idempotently and exclude PENDING/FAILED/CANCELLED/REFUNDED transactions.
CREATE OR ALTER TRIGGER [dbo].[TR_PaymentTransaction_RecalculateFolioPaid]
ON [dbo].[PaymentTransaction]
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH AffectedFolio AS (
        SELECT inv.folio_id
        FROM inserted i
        INNER JOIN dbo.Invoice inv ON inv.invoice_id = i.invoice_id
        WHERE i.invoice_id IS NOT NULL
        UNION
        SELECT inv.folio_id
        FROM deleted d
        INNER JOIN dbo.Invoice inv ON inv.invoice_id = d.invoice_id
        WHERE d.invoice_id IS NOT NULL
        UNION
        SELECT f.folio_id
        FROM inserted i
        INNER JOIN dbo.Folio f ON f.retreat_booking_id = i.retreat_booking_id
        WHERE i.retreat_booking_id IS NOT NULL
        UNION
        SELECT f.folio_id
        FROM deleted d
        INNER JOIN dbo.Folio f ON f.retreat_booking_id = d.retreat_booking_id
        WHERE d.retreat_booking_id IS NOT NULL
    ),
    DepositPaid AS (
        SELECT
            af.folio_id,
            ISNULL(SUM(pt.amount_paid), 0.00) AS deposit_paid
        FROM AffectedFolio af
        INNER JOIN dbo.Folio f ON f.folio_id = af.folio_id
        LEFT JOIN dbo.PaymentTransaction pt
            ON pt.retreat_booking_id = f.retreat_booking_id
           AND pt.payment_type = 'DEPOSIT'
           AND pt.payment_status = 'SUCCESSFUL'
        GROUP BY af.folio_id
    ),
    InvoicePaid AS (
        SELECT
            af.folio_id,
            ISNULL(SUM(pt.amount_paid), 0.00) AS invoice_paid
        FROM AffectedFolio af
        LEFT JOIN dbo.Invoice inv
            ON inv.folio_id = af.folio_id
        LEFT JOIN dbo.PaymentTransaction pt
            ON pt.invoice_id = inv.invoice_id
           AND pt.payment_type IN ('FINAL', 'FINAL_PAYMENT')
           AND pt.payment_status = 'SUCCESSFUL'
        GROUP BY af.folio_id
    ),
    PaidTotals AS (
        SELECT
            af.folio_id,
            CAST(ISNULL(dp.deposit_paid, 0.00) + ISNULL(ip.invoice_paid, 0.00) AS DECIMAL(18, 2)) AS calculated_paid
        FROM AffectedFolio af
        LEFT JOIN DepositPaid dp ON dp.folio_id = af.folio_id
        LEFT JOIN InvoicePaid ip ON ip.folio_id = af.folio_id
    )
    UPDATE f
    SET
        f.total_paid = p.calculated_paid,
        f.folio_status = CASE
            WHEN f.folio_status = 'CLOSED' THEN 'CLOSED'
            WHEN EXISTS (
                SELECT 1
                FROM dbo.Invoice inv
                WHERE inv.folio_id = f.folio_id
                  AND inv.invoice_status = 'PAID'
            ) THEN 'PAID'
            WHEN f.total_charges > 0.00 AND p.calculated_paid >= f.total_charges THEN 'PAID'
            WHEN p.calculated_paid > 0.00 THEN 'PARTIALLY_PAID'
            ELSE 'OPEN'
        END
    FROM dbo.Folio f
    INNER JOIN PaidTotals p ON p.folio_id = f.folio_id;
END;
GO
