/* ============================================================================
   DRAFT (NOT NUMBERED) — M2: persist number of guests on dbo.RetreatBooking
   ----------------------------------------------------------------------------
   Owner      : M2 (Retreat Booking)
   Status     : DRAFT. Final migration number to be assigned by the team lead
                after the cross-module migration order is agreed.
   Reason     : SRS FR-M2-02 / FR-M2-06 require the Customer to specify the
                number of guests. Price = base_price (VND/khách/gói) x guests
                + villa price_modifier, and guests must fit the villa category
                max_occupancy. Without this column the guest count cannot be
                re-used for modification (FR-M2-08), meal planning (M4) or
                front-desk party size.
   Target DBMS: Microsoft SQL Server (T-SQL).
   Safety     : Additive only. Existing rows get guest_count = 1 (DEFAULT).
                Pre-checks stop execution if the target table is missing.
   Re-runnable: Yes (guarded by COL_LENGTH / sys.check_constraints checks).
   Rollback   : See ROLLBACK section at the bottom (manual, not auto-run).
   ============================================================================ */

SET XACT_ABORT ON;
GO

IF OBJECT_ID(N'dbo.RetreatBooking', N'U') IS NULL
BEGIN
    RAISERROR(N'PRE-CHECK FAILED: dbo.RetreatBooking does not exist. Run schema.sql first.', 16, 1);
    SET NOEXEC ON;
END
GO

BEGIN TRANSACTION;

IF COL_LENGTH(N'dbo.RetreatBooking', N'guest_count') IS NULL
BEGIN
    ALTER TABLE dbo.RetreatBooking
        ADD guest_count INT NOT NULL
            CONSTRAINT DF_RetreatBooking_GuestCount DEFAULT (1);
END

IF NOT EXISTS (
    SELECT 1 FROM sys.check_constraints
    WHERE name = N'CK_RetreatBooking_GuestCount'
      AND parent_object_id = OBJECT_ID(N'dbo.RetreatBooking')
)
BEGIN
    EXEC(N'ALTER TABLE dbo.RetreatBooking
           ADD CONSTRAINT CK_RetreatBooking_GuestCount CHECK (guest_count > 0);');
END

COMMIT TRANSACTION;
GO

SET NOEXEC OFF;
GO

/* ----------------------------------------------------------------------------
   ROLLBACK (manual; only if no code depends on guest_count any more)
   ----------------------------------------------------------------------------
   ALTER TABLE dbo.RetreatBooking DROP CONSTRAINT CK_RetreatBooking_GuestCount;
   ALTER TABLE dbo.RetreatBooking DROP CONSTRAINT DF_RetreatBooking_GuestCount;
   ALTER TABLE dbo.RetreatBooking DROP COLUMN guest_count;
   ---------------------------------------------------------------------------- */
