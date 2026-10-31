-- ============================================================================
-- Migration: V008__m5_payment_transaction_vietqr_and_types.sql
-- Description: Expand PaymentTransaction payment_type check constraint to support
--              'FINAL_PAYMENT' alongside 'FINAL' & 'DEPOSIT', update CK_Payment_Target
--              and update trigger TR_PaymentTransaction_RecalculateFolioPaid.
-- ============================================================================

USE [HSWRMS];
GO

SET ANSI_NULLS ON;
GO
SET QUOTED_IDENTIFIER ON;
GO

PRINT 'Starting V008: Reconciling PaymentTransaction constraints and trigger for Module 5...';

-- 1. Drop existing CK_Payment_Type constraint if exists
IF EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE name = 'CK_Payment_Type' 
      AND parent_object_id = OBJECT_ID('dbo.PaymentTransaction')
)
BEGIN
    ALTER TABLE dbo.PaymentTransaction DROP CONSTRAINT CK_Payment_Type;
    PRINT 'Dropped existing CK_Payment_Type constraint.';
END;
GO

-- Re-add CK_Payment_Type supporting DEPOSIT, FINAL, and FINAL_PAYMENT
ALTER TABLE dbo.PaymentTransaction WITH CHECK
ADD CONSTRAINT CK_Payment_Type 
    CHECK (payment_type IN ('DEPOSIT', 'FINAL', 'FINAL_PAYMENT'));
PRINT 'Created updated CK_Payment_Type constraint.';
GO

-- 2. Drop existing CK_Payment_Target constraint if exists
IF EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE name = 'CK_Payment_Target' 
      AND parent_object_id = OBJECT_ID('dbo.PaymentTransaction')
)
BEGIN
    ALTER TABLE dbo.PaymentTransaction DROP CONSTRAINT CK_Payment_Target;
    PRINT 'Dropped existing CK_Payment_Target constraint.';
END;
GO

-- Re-add CK_Payment_Target supporting DEPOSIT (booking) and FINAL/FINAL_PAYMENT (invoice)
ALTER TABLE dbo.PaymentTransaction WITH CHECK
ADD CONSTRAINT CK_Payment_Target CHECK (
    (payment_type = 'DEPOSIT' AND retreat_booking_id IS NOT NULL AND invoice_id IS NULL)
    OR
    (payment_type IN ('FINAL', 'FINAL_PAYMENT') AND retreat_booking_id IS NULL AND invoice_id IS NOT NULL)
);
PRINT 'Created updated CK_Payment_Target constraint.';
GO

-- 3. Update trigger TR_PaymentTransaction_RecalculateFolioPaid to recognize both FINAL and FINAL_PAYMENT
CREATE OR ALTER TRIGGER dbo.TR_PaymentTransaction_RecalculateFolioPaid
ON dbo.PaymentTransaction
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    ;WITH AffectedInvoice AS (
        SELECT invoice_id FROM inserted WHERE invoice_id IS NOT NULL
        UNION
        SELECT invoice_id FROM deleted WHERE invoice_id IS NOT NULL
    ),
    AffectedFolio AS (
        SELECT DISTINCT i.folio_id
        FROM dbo.Invoice i
        INNER JOIN AffectedInvoice a ON a.invoice_id = i.invoice_id
    )
    UPDATE f
    SET total_paid = ISNULL(x.total_paid, 0),
        folio_status =
            CASE
                WHEN ISNULL(x.total_paid, 0) = 0 THEN 'OPEN'
                WHEN ISNULL(x.total_paid, 0) < f.total_charges THEN 'PARTIALLY_PAID'
                ELSE 'PAID'
            END
    FROM dbo.Folio f
    INNER JOIN AffectedFolio af ON af.folio_id = f.folio_id
    OUTER APPLY (
        SELECT SUM(pt.amount_paid) AS total_paid
        FROM dbo.PaymentTransaction pt
        INNER JOIN dbo.Invoice inv ON inv.invoice_id = pt.invoice_id
        WHERE inv.folio_id = f.folio_id
          AND pt.payment_status = 'SUCCESSFUL'
          AND pt.payment_type IN ('FINAL', 'FINAL_PAYMENT')
    ) x;
END;
GO

PRINT 'V008: PaymentTransaction constraints and trigger updated successfully!';
GO

