-- ============================================================================
-- HSWRMS Migration V010: M5 Manager-Approved F&B Void & Credit Note Workflow
-- Supports immutable FolioItem voiding before invoice issuance and
-- formal Credit Notes after invoice issuance.
-- ============================================================================

-- 1. Create AdjustmentRequest Table
IF OBJECT_ID('dbo.AdjustmentRequest', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.AdjustmentRequest (
        adjustment_request_id   INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_AdjustmentRequest PRIMARY KEY,
        folio_item_id           INT NOT NULL,
        folio_id                INT NOT NULL,
        retreat_booking_id      INT NOT NULL,
        source_meal_order_id    INT NULL,
        adjustment_type         VARCHAR(30) NOT NULL,
        requested_amount        DECIMAL(18,2) NOT NULL,
        reason                  NVARCHAR(500) NOT NULL,
        status                  VARCHAR(30) NOT NULL
            CONSTRAINT DF_AdjustmentRequest_Status DEFAULT ('PENDING_APPROVAL'),
        requested_by_user_id    INT NOT NULL,
        requested_at            DATETIME2(0) NOT NULL
            CONSTRAINT DF_AdjustmentRequest_RequestedAt DEFAULT (SYSUTCDATETIME()),
        approved_by_user_id     INT NULL,
        approved_at             DATETIME2(0) NULL,
        rejection_reason        NVARCHAR(500) NULL,

        CONSTRAINT FK_AdjustmentRequest_FolioItem
            FOREIGN KEY (folio_item_id) REFERENCES dbo.FolioItem(folio_item_id),
        CONSTRAINT FK_AdjustmentRequest_Folio
            FOREIGN KEY (folio_id) REFERENCES dbo.Folio(folio_id),
        CONSTRAINT FK_AdjustmentRequest_Booking
            FOREIGN KEY (retreat_booking_id) REFERENCES dbo.RetreatBooking(retreat_booking_id),
        CONSTRAINT FK_AdjustmentRequest_MealOrder
            FOREIGN KEY (source_meal_order_id) REFERENCES dbo.MealOrder(meal_order_id),
        CONSTRAINT FK_AdjustmentRequest_RequestedByUser
            FOREIGN KEY (requested_by_user_id) REFERENCES dbo.[User](user_id),
        CONSTRAINT FK_AdjustmentRequest_ApprovedByUser
            FOREIGN KEY (approved_by_user_id) REFERENCES dbo.[User](user_id),
        CONSTRAINT CK_AdjustmentRequest_Type
            CHECK (adjustment_type IN ('VOID', 'CREDIT_NOTE')),
        CONSTRAINT CK_AdjustmentRequest_Amount
            CHECK (requested_amount > 0),
        CONSTRAINT CK_AdjustmentRequest_Status
            CHECK (status IN ('PENDING_APPROVAL', 'APPROVED', 'REJECTED'))
    );
END
GO

-- 2. Create CreditNote Table
IF OBJECT_ID('dbo.CreditNote', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.CreditNote (
        credit_note_id          INT IDENTITY(1,1) NOT NULL
            CONSTRAINT PK_CreditNote PRIMARY KEY,
        credit_note_number      NVARCHAR(50) NOT NULL,
        invoice_id              INT NOT NULL,
        folio_item_id           INT NOT NULL,
        adjustment_request_id   INT NOT NULL,
        amount                  DECIMAL(18,2) NOT NULL,
        tax_amount              DECIMAL(18,2) NOT NULL
            CONSTRAINT DF_CreditNote_TaxAmount DEFAULT (0),
        final_credit_amount     DECIMAL(18,2) NOT NULL,
        issued_at               DATETIME2(0) NOT NULL
            CONSTRAINT DF_CreditNote_IssuedAt DEFAULT (SYSUTCDATETIME()),
        issued_by_user_id       INT NOT NULL,

        CONSTRAINT UQ_CreditNote_Number UNIQUE (credit_note_number),
        CONSTRAINT UQ_CreditNote_AdjustmentRequest UNIQUE (adjustment_request_id),
        CONSTRAINT FK_CreditNote_Invoice
            FOREIGN KEY (invoice_id) REFERENCES dbo.Invoice(invoice_id),
        CONSTRAINT FK_CreditNote_FolioItem
            FOREIGN KEY (folio_item_id) REFERENCES dbo.FolioItem(folio_item_id),
        CONSTRAINT FK_CreditNote_AdjustmentRequest
            FOREIGN KEY (adjustment_request_id) REFERENCES dbo.AdjustmentRequest(adjustment_request_id),
        CONSTRAINT FK_CreditNote_IssuedByUser
            FOREIGN KEY (issued_by_user_id) REFERENCES dbo.[User](user_id),
        CONSTRAINT CK_CreditNote_Amounts
            CHECK (amount > 0 AND tax_amount >= 0 AND final_credit_amount > 0)
    );
END
GO

-- 3. Extend FolioItem with void tracking flags
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.FolioItem') AND name = 'is_voided'
)
BEGIN
    ALTER TABLE dbo.FolioItem
        ADD is_voided BIT NOT NULL CONSTRAINT DF_FolioItem_IsVoided DEFAULT (0);
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.FolioItem') AND name = 'voided_adjustment_request_id'
)
BEGIN
    ALTER TABLE dbo.FolioItem
        ADD voided_adjustment_request_id INT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.foreign_keys 
    WHERE object_id = OBJECT_ID(N'dbo.FK_FolioItem_AdjustmentRequest')
)
BEGIN
    ALTER TABLE dbo.FolioItem
        ADD CONSTRAINT FK_FolioItem_AdjustmentRequest
        FOREIGN KEY (voided_adjustment_request_id)
        REFERENCES dbo.AdjustmentRequest(adjustment_request_id);
END
GO

-- 4. Query Optimization Indexes
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AdjustmentRequest_FolioItem' AND object_id = OBJECT_ID('dbo.AdjustmentRequest'))
BEGIN
    CREATE INDEX IX_AdjustmentRequest_FolioItem ON dbo.AdjustmentRequest(folio_item_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AdjustmentRequest_Folio' AND object_id = OBJECT_ID('dbo.AdjustmentRequest'))
BEGIN
    CREATE INDEX IX_AdjustmentRequest_Folio ON dbo.AdjustmentRequest(folio_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AdjustmentRequest_Booking' AND object_id = OBJECT_ID('dbo.AdjustmentRequest'))
BEGIN
    CREATE INDEX IX_AdjustmentRequest_Booking ON dbo.AdjustmentRequest(retreat_booking_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_AdjustmentRequest_Status' AND object_id = OBJECT_ID('dbo.AdjustmentRequest'))
BEGIN
    CREATE INDEX IX_AdjustmentRequest_Status ON dbo.AdjustmentRequest(status);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CreditNote_Invoice' AND object_id = OBJECT_ID('dbo.CreditNote'))
BEGIN
    CREATE INDEX IX_CreditNote_Invoice ON dbo.CreditNote(invoice_id);
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CreditNote_FolioItem' AND object_id = OBJECT_ID('dbo.CreditNote'))
BEGIN
    CREATE INDEX IX_CreditNote_FolioItem ON dbo.CreditNote(folio_item_id);
END
GO

