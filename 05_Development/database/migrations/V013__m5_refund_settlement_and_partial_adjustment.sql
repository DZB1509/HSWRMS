-- ============================================================================
-- HSWRMS Migration V013: M5 Refund Settlement & Partial Adjustment Schema
-- Supports WP-1B refund settlement workflow (PENDING_REFUND -> REFUNDED)
-- and partial FolioItem adjustment tracking.
-- ============================================================================

-- 1. Extend CreditNote with status, refund amount, and settlement tracking
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CreditNote') AND name = 'status'
)
BEGIN
    ALTER TABLE dbo.CreditNote
        ADD status VARCHAR(30) NOT NULL CONSTRAINT DF_CreditNote_Status DEFAULT ('CREDIT_APPLIED');
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CreditNote') AND name = 'refund_amount'
)
BEGIN
    ALTER TABLE dbo.CreditNote
        ADD refund_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_CreditNote_RefundAmount DEFAULT (0);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CreditNote') AND name = 'settled_at'
)
BEGIN
    ALTER TABLE dbo.CreditNote
        ADD settled_at DATETIME2(0) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CreditNote') AND name = 'settled_by_user_id'
)
BEGIN
    ALTER TABLE dbo.CreditNote
        ADD settled_by_user_id INT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CreditNote') AND name = 'refund_transaction_ref'
)
BEGIN
    ALTER TABLE dbo.CreditNote
        ADD refund_transaction_ref NVARCHAR(100) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CreditNote') AND name = 'settlement_notes'
)
BEGIN
    ALTER TABLE dbo.CreditNote
        ADD settlement_notes NVARCHAR(500) NULL;
END
GO

-- Foreign key for settled_by_user_id
IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE object_id = OBJECT_ID(N'dbo.FK_CreditNote_SettledByUser')
)
BEGIN
    ALTER TABLE dbo.CreditNote
        ADD CONSTRAINT FK_CreditNote_SettledByUser
        FOREIGN KEY (settled_by_user_id) REFERENCES dbo.[User](user_id);
END
GO

-- Check constraint for status
IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints 
    WHERE object_id = OBJECT_ID(N'dbo.CK_CreditNote_Status')
)
BEGIN
    ALTER TABLE dbo.CreditNote
        ADD CONSTRAINT CK_CreditNote_Status
        CHECK (status IN ('CREDIT_APPLIED', 'PENDING_REFUND', 'REFUNDED'));
END
GO

-- 2. Extend FolioItem with adjusted_amount
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.FolioItem') AND name = 'adjusted_amount'
)
BEGIN
    ALTER TABLE dbo.FolioItem
        ADD adjusted_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_FolioItem_AdjustedAmount DEFAULT (0);
END
GO

-- 3. Optimization index on status
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CreditNote_Status' AND object_id = OBJECT_ID('dbo.CreditNote'))
BEGIN
    CREATE INDEX IX_CreditNote_Status ON dbo.CreditNote(status);
END
GO

