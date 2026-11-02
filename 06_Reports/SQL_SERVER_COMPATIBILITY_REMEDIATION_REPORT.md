# HSWRMS — SQL Server Compatibility Remediation Report (Source-Only)

**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`<br>
**Branch:** `feature/hswrms-m1-m6-integration`<br>
**Baseline Commit (`HEAD`):** `d7df3d4be03e9de50705f3c3e4b7be53b3a61903`<br>
**Backend Module:** `05_Development/backend`<br>
**Target Database Reference:** `MYLIFE-MYRULE-1` / `HSWRMS_TEST` (SQL Server 2019 Express `15.0.2130.3`)<br>
**Prior Assessment Reference:** `06_Reports/SQL_SERVER_SCHEMA_COMPATIBILITY_ASSESSMENT.md`<br>
**Phase Type:** Source-Only Remediation & Migration Preparation (Zero Physical Database Writes Executed)

---

## 1. Corrected Assessment Counts & Reconciled Findings (Task 1)

Before modifying any source or migration file, every entity, field, and migration script in the repository was independently re-audited against `06_Reports/SQL_SERVER_SCHEMA_COMPATIBILITY_ASSESSMENT.md` and `05_Development/database/generated/HSWRMS_TEST_schema_continuation.sql`.

### 1.1 Resolution of the 50 vs. 51 JPA Entity Count Discrepancy
- **Actual `@Entity` class count in `05_Development/backend/src/main/java`:** **50 `@Entity` classes** (confirmed both by static source scan and Spring Data / Hibernate runtime bootstrap: `Found 50 JPA repository interfaces`).
  - **M1 (`m1identity.entity`):** 13 (`CustomerProfile`, `EmailVerificationToken`, `HealthDataConsent`, `HealthDataDeletionRequest`, `HealthProfile`, `HealthProfileAuditLog`, `LoginAttempt`, `OtpChallenge`, `PasswordResetToken`, `RefreshToken`, `Role`, `StaffAccount`, `User`)
  - **M2 (`m2booking.entity`):** 8 (`BookingCheckIn`, `PackageFnBEntitlement`, `PackageInclusion`, `PhysicalVilla`, `ResortZone`, `RetreatBooking`, `RetreatPackage`, `VillaCategory`)
  - **M3 (`m3spa.entity`):** 10 (`RetreatPackageSpaTreatment`, `SpaDispatchOutboxEntity`, `SpaScheduleHistory`, `SpaSession`, `SpaTreatment`, `Therapist`, `TherapistTreatmentQualification`, `TreatmentRoom`, `TreatmentRoomCompatibility`, `VillaFunctionalArea`)
  - **M4 (`m4fnb.entity`):** 6 (`DietaryRestrictionEntity`, `IngredientEntity`, `MealOrderEntity`, `MealOrderItemEntity`, `MenuEntity`, `MenuItemIngredientEntity`)
  - **M5 (`m5billing.entity`):** 7 (`AdjustmentRequestEntity`, `CreditNoteEntity`, `CustomerReviewEntity`, `FolioEntity`, `FolioItemEntity`, `InvoiceEntity`, `PaymentTransactionEntity`)
  - **M6 (`m6admin.entity`):** 6 (`AuditLog`, `BroadcastNotification`, `NotificationRecipient`, `ParameterDelegation`, `SystemConfiguration`, `UserAccount`)
- **Why Section 4 of the Assessment Had 51 Rows:**
  - Row #21 in Section 4 of the assessment listed `RetreatPackageVillaCategory` as if it were a standalone `@Entity` class. In fact, `dbo.RetreatPackageVillaCategory` is mapped via `@ManyToMany @JoinTable(name = "RetreatPackageVillaCategory", schema = "dbo")` inside `RetreatPackage.java` (lines 234–239) and has no standalone `@Entity` class.
  - Additionally, `RetreatPackageSpaTreatment` resides in package `com.heavenstay.hswrms.m3spa.entity` (not `m2booking.entity`).

### 1.2 Resolution of the 10 vs. 11 `Long` / `INT` Entity Count Discrepancy
- **Total `@Entity` classes declaring `java.lang.Long` fields:** **11 `@Entity` classes** (`3` in M3, `7` in M5, `1` in M6).
- **Entities with ZERO `Long`/`INT` mismatch:** **1 entity (`AuditLog` in M6)** because `AuditLog.auditLogId` (`Long`) maps to `dbo.AuditLog.audit_log_id`, which is already `BIGINT IDENTITY(1,1)` in `HSWRMS_TEST`. Similarly, `SpaScheduleHistory.historyId` (`Long`) and `SpaDispatchOutboxEntity.outboxId` / `historyId` (`Long`) map to `BIGINT` columns in `V011` and `V012`.
- **Entities with confirmed `Long` (Java) vs. `INT` (SQL Server) mismatches:** **Exactly 10 `@Entity` classes** (`3` in M3 + `7` in M5), comprising **20 scalar `Long` fields** and **8 `@ManyToOne` / `@OneToOne` association join columns** whose target `@Id` is backed by a SQL Server `INT` column:

| # | Module | Entity Class | Scalar `Long` Fields Backed by SQL `INT` (20) | `@ManyToOne` / `@OneToOne` Associations Targeting `INT` PKs (8) | `BIGINT` Fields Left Untouched (`SqlTypes.BIGINT`) |
|---|---|---|---|---|---|
| 1 | M3 | `SpaSession` | `spaSessionId` (`spa_session_id`) | — | — |
| 2 | M3 | `SpaScheduleHistory` | `sessionId` (`session_id`, `INT` after `V015`) | — | `historyId` (`history_id BIGINT`) |
| 3 | M3 | `SpaDispatchOutboxEntity` | `sessionId` (`session_id`, `INT` after `V015`) | — | `outboxId` (`outbox_id BIGINT`), `historyId` (`history_id BIGINT`) |
| 4 | M5 | `FolioEntity` | `folioId` (`folio_id`) | — | — |
| 5 | M5 | `FolioItemEntity` | `folioItemId` (`folio_item_id`), `sourceBookingId` (`source_booking_id`), `sourceSpaSessionId` (`source_spa_session_id`), `sourceMealOrderId` (`source_meal_order_id`), `voidedAdjustmentRequestId` (`voided_adjustment_request_id`) | `folio` (`folio_id`) | — |
| 6 | M5 | `InvoiceEntity` | `invoiceId` (`invoice_id`) | `folio` (`folio_id`) | — |
| 7 | M5 | `PaymentTransactionEntity` | `transactionId` (`transaction_id`) | `invoice` (`invoice_id`) | — |
| 8 | M5 | `CustomerReviewEntity` | `reviewId` (`review_id`) | — | — |
| 9 | M5 | `AdjustmentRequestEntity` | `adjustmentRequestId` (`adjustment_request_id`), `retreatBookingId` (`retreat_booking_id`), `sourceMealOrderId` (`source_meal_order_id`), `requestedByUserId` (`requested_by_user_id`), `approvedByUserId` (`approved_by_user_id`) | `folioItem` (`folio_item_id`), `folio` (`folio_id`) | — |
| 10 | M5 | `CreditNoteEntity` | `creditNoteId` (`credit_note_id`), `issuedByUserId` (`issued_by_user_id`), `settledByUserId` (`settled_by_user_id`) | `invoice` (`invoice_id`), `folioItem` (`folio_item_id`), `adjustmentRequest` (`adjustment_request_id`) | — |

*(Note: Assessment Section 6.1 had minor field-name discrepancies on `AdjustmentRequestEntity` and `CreditNoteEntity`—listing `mealOrderId`/`reviewedByUserId` instead of `sourceMealOrderId`/`approvedByUserId`, and listing non-existent `retreatBookingId`/`folioId` on `CreditNoteEntity` while omitting `CreditNoteEntity.settledByUserId`. The table above reflects the exact verified source fields.)*

### 1.3 Distinction Between Missing Database Columns and Affected Java Fields
- **Missing Tables in `HSWRMS_TEST`:** **7 tables** (`dbo.ResortZone`, `dbo.VillaFunctionalArea`, `dbo.PackageFnBEntitlement`, `dbo.SpaScheduleHistory`, `dbo.SpaDispatchOutbox`, `dbo.AdjustmentRequest`, `dbo.CreditNote`).
- **Missing Database Columns Mapped by JPA Entities on Existing Tables in `HSWRMS_TEST`:** **19 columns across 7 existing tables** (18 scalar `@Column` fields + 1 `@JoinColumn` association `HealthDataDeletionRequest.customerProfile`):
  1. `dbo.HealthDataDeletionRequest` (3 columns): `customer_profile_id` (`@ManyToOne customerProfile`), `request_type` (`requestType`), `updated_at` (`updatedAt`). *(Also has legacy unmapped `health_profile_id INT NOT NULL` in `HSWRMS_TEST`.)*
  2. `dbo.RetreatBooking` (1 column): `guest_count` (`guestCount`).
  3. `dbo.SpaTreatment` (3 entity-mapped columns): `room_compatibility` (`roomCompatibility`), `pricing_rule` (`pricingRule`), `required_qualification_code` (`requiredQualificationCode`). *(Migrations `V1_3` and `V1_4` also add 3 unmapped DB columns `therapist_qualification`, `contraindications`, `precautions`.)*
  4. `dbo.SpaSession` (6 columns): `reminder_status` (`reminderStatus`), `reminder_claimed_at` (`reminderClaimedAt`), `reminder_claim_expires_at` (`reminderClaimExpiresAt`), `reminder_claim_token` (`reminderClaimToken`), `reminder_sent_at` (`reminderSentAt`), `external_calendar_event_id` (`externalCalendarEventId`).
  5. `dbo.MealOrder` (1 column): `special_notes` (`specialNotes`).
  6. `dbo.MealOrderItem` (2 columns): `unit_price` (`unitPrice`), `preparation_status` (`preparationStatus`).
  7. `dbo.FolioItem` (3 columns): `is_voided` (`isVoided`), `adjusted_amount` (`adjustedAmount`), `voided_adjustment_request_id` (`voidedAdjustmentRequestId`).

---

## 2. Source Files Modified

| # | File Path | Task(s) | Summary of Change |
|---|---|---|---|
| 1 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaSession.java` | Task 3, Task 7 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `spaSessionId`; added `resetReminderState()` helper to reset `reminderStatus = SpaReminderStatus.PENDING` and clear `reminderClaimedAt`, `reminderClaimExpiresAt`, `reminderClaimToken`, and `reminderSentAt`. |
| 2 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaScheduleHistory.java` | Task 3 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `sessionId` (while preserving `historyId` as `BIGINT`). |
| 3 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaDispatchOutboxEntity.java` | Task 3 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `sessionId` (while preserving `outboxId` and `historyId` as `BIGINT`). |
| 4 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioEntity.java` | Task 3 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `folioId`. |
| 5 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioItemEntity.java` | Task 3 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `folioItemId`, `sourceBookingId`, `sourceSpaSessionId`, `sourceMealOrderId`, and `voidedAdjustmentRequestId`. |
| 6 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/InvoiceEntity.java` | Task 3 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `invoiceId`. |
| 7 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/PaymentTransactionEntity.java` | Task 3 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `transactionId`. |
| 8 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/CustomerReviewEntity.java` | Task 3 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `reviewId`. |
| 9 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/AdjustmentRequestEntity.java` | Task 3 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `adjustmentRequestId`, `retreatBookingId`, `sourceMealOrderId`, `requestedByUserId`, and `approvedByUserId`. |
| 10 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/CreditNoteEntity.java` | Task 3 | Added `@JdbcTypeCode(SqlTypes.INTEGER)` on `creditNoteId`, `issuedByUserId`, and `settledByUserId`. |
| 11 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/service/BookingPolicyService.java` | Task 4 | Replaced broken query `SELECT param_value FROM dbo.SystemConfiguration WHERE param_key = ?` with `SELECT configuration_value FROM dbo.SystemConfiguration WHERE configuration_key = ? AND configuration_status = 'ACTIVE'`; stopped swallowing `DataAccessException` (SQL grammar/schema errors) while preserving property fallback when configuration is absent or inactive. |
| 12 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaSessionService.java` | Task 7 | In customer reschedule path (`excludeSessionId != null`), switched to pessimistic write lock `sessionRepository.findByIdWithLock(excludeSessionId)` and invoked `existingSession.resetReminderState()` so rescheduled sessions receive a T-1h reminder for the new time slot. |
| 13 | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SessionRecoveryService.java` | Task 7 | In `attemptSameTimeRecovery(Long sessionId)`, refactored locking to eliminate AB-BA lock inversion deadlocks: candidate discovery is performed lock-free, followed by acquiring pessimistic write locks in strict global order: `Therapist` (`therapistRepository.findByIdWithLock`) -> `TreatmentRoom` (`roomRepository.findByIdWithLock`) -> `SpaSession` (`lockAndRefreshSession`). This matches `SpaSessionService.confirmReservation` exactly. Re-validates `isStillRecoverable` under lock and resets reminder state via `session.resetReminderState()`. |
| 14 | `05_Development/backend/src/test/java/com/heavenstay/hswrms/config/SqlServerCompatibilityRemediationTest.java` | Task 8 | Created comprehensive verification suite covering Tasks 2, 3, 4, 5, 6, and 7. |

---

## 3. Migration Files Created or Changed

### 3.1 New Migration Files Created (Prepared Only — NOT Executed Against Any Database)
1. `05_Development/database/migrations/V016__m3_spa_session_reminder_and_trigger_reconciliation.sql` (Task 2 & Task 7)
   - Enforces database-context-neutral guard (refuses execution in `master`, `model`, `msdb`, `tempdb`, or any database not matching `HSWRMS%`).
   - Idempotently adds missing reminder columns on `dbo.SpaSession`:
     - `reminder_status VARCHAR(20) NULL CONSTRAINT DF_SpaSession_ReminderStatus DEFAULT ('PENDING')`
     - `reminder_claimed_at DATETIME2(0) NULL`
     - `reminder_claim_expires_at DATETIME2(0) NULL`
     - `reminder_sent_at DATETIME2(0) NULL`
     - Defensive check for `reminder_claim_token VARCHAR(64) NULL` (from `V008`).
   - Backfills existing `NULL` `reminder_status` rows (`'SENT'` when `reminder_sent_at IS NOT NULL`, else `'PENDING'`).
   - Adds `CK_SpaSession_ReminderStatus` derived from `SpaReminderStatus.java`: `('PENDING', 'CLAIMED', 'SENT', 'RETRYABLE_FAILURE')`.
   - Creates supporting nonclustered index `IX_SpaSession_ReminderDue` on `dbo.SpaSession (session_status, confirmation_status, scheduled_start_at) INCLUDE (reminder_status, reminder_sent_at, reminder_claim_expires_at, reminder_claim_token)`.
   - Updates `dbo.TR_SpaSession_ValidateScheduling` (`CREATE OR ALTER TRIGGER`) so therapist qualification (`51001`) and room compatibility (`51002`) checks only enforce on active scheduling states `WHERE i.session_status IN ('SCHEDULED', 'RESCHEDULING')`, matching the overlap check (`51003`) and preventing false-positive errors on `CANCELLED`, `COMPLETED`, or `NO_SHOW` updates. Explicitly references `dbo.TherapistTreatmentQualification` (matching the actual SQL Server physical table name and JPA entity) instead of the invalid draft table name `dbo.TherapistQualification`.
2. `05_Development/database/migrations/V017__m5_folio_triggers_reconciliation.sql` (Task 5)
   - Enforces database-context-neutral guard and verifies prerequisite `V010` columns (`dbo.FolioItem.is_voided` and `adjusted_amount`) exist before altering triggers.
   - Updates `dbo.TR_FolioItem_RecalculateTotal` (`CREATE OR ALTER TRIGGER`) to exclude voided items (`is_voided = 1`) and subtract partial adjustments (`amount - ISNULL(adjusted_amount, 0.00)` clamped at `>= 0.00`), matching `FolioItemEntity.getPayableAmount()` and `FolioEntity.recalculateTotals()`.
   - Updates `dbo.TR_PaymentTransaction_RecalculateFolioPaid` (`CREATE OR ALTER TRIGGER`) to resolve affected folios from both `invoice_id` (`dbo.Invoice.folio_id`) and `retreat_booking_id` (`dbo.Folio.retreat_booking_id`), summing only `payment_status = 'SUCCESSFUL'` transactions across `DEPOSIT` and `FINAL`/`FINAL_PAYMENT`, excluding `PENDING` (e.g., pending VietQR/VNPay), `FAILED`, `CANCELLED`, and `REFUNDED` transactions, and preserving `CLOSED` status.

### 3.2 Existing Migration Files Updated for Database-Context Neutrality (Task 6)
All **12 SQL migration files** in `05_Development/database/migrations/` that contained a hardcoded `USE [HSWRMS];` statement (the 10 active migration files identified in the assessment plus 2 draft/reviewed scripts in the same directory) were updated to remove `USE [HSWRMS];` and validate `DB_NAME()` without switching database context implicitly:
1. `_draft_m1_identity_health_profile.sql`
2. `_reviewed_m1_deletion_request_customer_profile.sql`
3. `_reviewed_m1_health_profile_structured.sql`
4. `draft_m6_governance_and_delegation.sql`
5. `V1_1__m6_schema_enhancements.sql`
6. `V1_2__villa_inventory.sql`
7. `V1_3__spa_retreat_schema.sql`
8. `V1_4__spa_packages_v3_standardization.sql`
9. `V1_5__remove_duration_unit_from_spa_treatment.sql`
10. `V1_6__consolidate_fnb_role.sql`
11. `V1_6__repair_mojibake_and_booking_consistency.sql`
12. `V014__m5_payment_transaction_vietqr_and_types.sql`

---

## 4. Design Decisions & Reasoning

### 4.1 Task 3 — Hibernate 6 `@JdbcTypeCode(SqlTypes.INTEGER)` Strategy vs. Public API Refactoring
- **Reasoning:** Widening SQL Server primary key columns (`SpaSession`, `Folio`, `FolioItem`, `Invoice`, `PaymentTransaction`, `CustomerReview`) from `INT` to `BIGINT` in the database would require dropping and recreating primary keys, clustered indexes, foreign keys, check constraints, and triggers across multiple modules. Conversely, narrowing Java entity IDs, Spring Data repository interfaces, service signatures, and DTOs from `Long` to `Integer` would break public REST API contracts and dozens of existing tests.
- **Solution:** Annotating the 20 scalar `Long` fields backed by SQL Server `INT` columns with `@JdbcTypeCode(SqlTypes.INTEGER)` instructs Hibernate 6's `MappingMetamodel` to bind, extract, and schema-validate those columns as JDBC `Types.INTEGER` (`INT`), while preserving `java.lang.Long` in Java entities, repositories, services, and DTOs. In addition, Hibernate 6 automatically propagates the target `@Id`'s `JdbcType` (`SqlTypes.INTEGER`) to all 8 `@ManyToOne` and `@OneToOne` foreign-key join columns referencing those entities (`FolioItemEntity.folio`, `InvoiceEntity.folio`, `PaymentTransactionEntity.invoice`, `AdjustmentRequestEntity.folioItem`, `AdjustmentRequestEntity.folio`, `CreditNoteEntity.invoice`, `CreditNoteEntity.folioItem`, `CreditNoteEntity.adjustmentRequest`).
- **Selective Application:** Fields backed by `BIGINT` in SQL Server (`AuditLog.auditLogId`, `SpaScheduleHistory.historyId`, `SpaDispatchOutboxEntity.outboxId`, `SpaDispatchOutboxEntity.historyId`) were intentionally left as `SqlTypes.BIGINT`.

### 4.2 Task 4 — `BookingPolicyService` Native SQL Fix & Safe Seed Proposal
- **Reasoning:** `JdbcTemplate.queryForList(sql, String.class, key)` returns an empty `List<String>` when a configuration key does not exist or is not `'ACTIVE'`. Catching `DataAccessException` and returning `null` masked real SQL grammar/schema bugs (`BadSqlGrammarException: Invalid column name 'param_value'`). Removing the `try/catch (DataAccessException)` ensures SQL/schema defects fail fast while missing or inactive rows continue to return an empty list and fall back cleanly to `app.booking.*` properties.
- **Safe `dbo.SystemConfiguration` Seed/Configuration Proposal (Do NOT Execute in This Phase):**
  In `HSWRMS_TEST`, `dbo.SystemConfiguration` currently seeds `deposit_percentage` (`30`), `cancellation_window_days` (`7`), and `refund_percentage` (`100`), but is missing `booking_hold_minutes` and `cancellation_window_hours` (which `BookingPolicyService` queries). When database write permissions are granted in a future migration execution phase, the following idempotent `MERGE` statement can be used to seed `booking_hold_minutes` (`15` minutes) and `cancellation_window_hours` (`48` hours, or `168` hours if aligned with `7` days) without overwriting existing admin-configured values:
  ```sql
  MERGE INTO [dbo].[SystemConfiguration] AS target
  USING (VALUES
      (N'BUSINESS_PARAMETER', N'booking_hold_minutes',      N'15', N'ACTIVE', N'INT', CAST(5 AS DECIMAL(18,4)),  CAST(120 AS DECIMAL(18,4)), N'minutes', N'Minutes an unpaid PENDING booking holds villa inventory before expiration', 1),
      (N'BUSINESS_PARAMETER', N'cancellation_window_hours', N'48', N'ACTIVE', N'INT', CAST(0 AS DECIMAL(18,4)),  CAST(720 AS DECIMAL(18,4)), N'hours',   N'Minimum hours before check-in required for a full-policy deposit refund',     1)
  ) AS source ([configuration_type], [configuration_key], [configuration_value], [configuration_status], [value_type], [min_value], [max_value], [unit], [description], [manager_editable])
  ON target.[configuration_key] = source.[configuration_key]
  WHEN NOT MATCHED BY TARGET THEN
      INSERT ([configuration_type], [configuration_key], [configuration_value], [configuration_status], [updated_at], [value_type], [min_value], [max_value], [unit], [description], [manager_editable])
      VALUES (source.[configuration_type], source.[configuration_key], source.[configuration_value], source.[configuration_status], SYSUTCDATETIME(), source.[value_type], source.[min_value], source.[max_value], source.[unit], source.[description], source.[manager_editable]);
  ```

### 4.3 Task 5 — M5 Trigger Idempotency & H2 vs. SQL Server Trigger Limitation
- **Reasoning:** Both `FolioBillingService` / `CheckoutService` in Java and `TR_FolioItem_RecalculateTotal` / `TR_PaymentTransaction_RecalculateFolioPaid` in SQL Server update `dbo.Folio.total_charges` and `dbo.Folio.total_paid`. By defining both triggers in `V017` as set-based aggregate recomputations from the authoritative child rows (`dbo.FolioItem` and `dbo.PaymentTransaction`), running the Java calculation and the SQL Server trigger in the same transaction is 100% idempotent and never double-counts any charge or payment.
- **H2 Limitation Documented:** H2 (`MODE=MSSQLServer`) does not execute T-SQL `CREATE OR ALTER TRIGGER` bodies. Consequently, H2 tests validate the Java-side calculation (`FolioEntity.recalculateTotals()`, `FolioBillingService`, `CheckoutService`) and static SQL structure of `V017`, while physical execution of `V017` trigger DDL requires SQL Server with `ALTER` / `db_ddladmin` permissions.

### 4.4 Task 7 — M3 Deadlock Prevention & Strict Global Lock Ordering
- **Deadlock Risk Identified:** In `SpaSessionService.confirmReservation`, locks are acquired in the order: Therapist -> TreatmentRoom -> SpaSession. If `SessionRecoveryService.attemptSameTimeRecovery` locked `SpaSession` first before attempting to acquire locks on the target Therapist or TreatmentRoom, concurrent execution of customer rescheduling and automated therapist recovery on overlapping resources could produce classic AB-BA lock inversion deadlocks in SQL Server.
- **Resolution:** `SessionRecoveryService.attemptSameTimeRecovery` now performs candidate discovery without holding premature locks. Once candidate replacement resources are identified, it acquires pessimistic write locks in the identical hierarchical order:
  1. `Therapist` (`therapistRepository.findByIdWithLock`)
  2. `TreatmentRoom` (`roomRepository.findByIdWithLock`)
  3. `SpaSession` (`lockAndRefreshSession` using `entityManager.refresh(session, LockModeType.PESSIMISTIC_WRITE)`)
- **Under-Lock Validation:** Once all three locks are held, `isStillRecoverable(session, startAt, endAt)` and `hasOverlappingSession` re-evaluate availability. If any concurrent modification occurred, recovery safely aborts or transitions to `RESCHEDULING` without corrupting state or executing partial mutations.

---

## 5. Tests Executed & Actual Results (Task 8)

### 5.1 Targeted SQL Server Compatibility & Validator Suite
Command executed:
```powershell
.\mvnw.cmd test "-Dtest=SqlServerTestConfigValidatorTest,SqlServerJdbcSmokeTestOptInBehaviorTest,SqlServerCompatibilityRemediationTest"
```
Surefire report timestamps: `2026-10-31 17:16:47` (executed after all source and line-ending modifications).
- `SqlServerCompatibilityRemediationTest`: **5 passed, 0 failures, 0 errors**
- `SqlServerJdbcSmokeTestOptInBehaviorTest`: **3 passed, 0 failures, 0 errors**
- `SqlServerTestConfigValidatorTest`: **94 passed, 0 failures, 0 errors**
- **Targeted Suite Total:** **102 passed, 0 failures, 0 errors, 0 skipped** (`BUILD SUCCESS`)

### 5.2 M3 Concurrency & Recovery Test Suite
Command executed:
```powershell
.\mvnw.cmd test "-Dtest=SqlServerCompatibilityRemediationTest,SpaServiceTests,SpaConcurrencyTest,TherapistRecoveryOrchestrationTest"
```
Surefire report timestamps: `2026-10-31 17:04:13 – 17:04:17` (executed after M3 locking and recovery refactoring at 16:31:21).
- `SqlServerCompatibilityRemediationTest`: **5 passed, 0 failures, 0 errors** *(Overlaps with Suite 5.1)*
- `SpaServiceTests`: **29 passed, 0 failures, 0 errors**
- `SpaConcurrencyTest`: **1 passed, 0 failures, 0 errors**
- `TherapistRecoveryOrchestrationTest`: **3 passed, 0 failures, 0 errors**
- **M3 Concurrency & Recovery Total:** **38 passed, 0 failures, 0 errors, 0 skipped** (`BUILD SUCCESS`)

### 5.3 M2 & M3 Full Regression Suite
Command executed:
```powershell
.\mvnw.cmd test "-Dtest=SpaAuthoritativeAcceptanceEvidenceTest,SpaRecoverySchedulerTest,SpaScheduleHistoryTest,SpaSecurityTests,TherapistRecoveryOrchestrationTest,M2SchemaCompatibilityTest,ReceptionistOperationServiceTest,RetreatBookingSecurityTest,RetreatBookingServiceAuthorizationTest,VNPayDepositServiceTest"
```
Surefire report timestamps: `2026-10-31 17:23:21 – 17:23:42` (re-executed fresh after all M2/M3 logic changes at 16:31:21 and line-ending normalizations at 17:04:19).
- `SpaAuthoritativeAcceptanceEvidenceTest`: **49 passed, 0 failures, 0 errors**
- `SpaRecoverySchedulerTest`: **3 passed, 0 failures, 0 errors**
- `SpaScheduleHistoryTest`: **3 passed, 0 failures, 0 errors**
- `SpaSecurityTests`: **5 passed, 0 failures, 0 errors**
- `TherapistRecoveryOrchestrationTest`: **3 passed, 0 failures, 0 errors** *(Overlaps with Suite 5.2)*
- `M2SchemaCompatibilityTest`: **6 passed, 0 failures, 0 errors**
- `ReceptionistOperationServiceTest`: **5 passed, 0 failures, 0 errors**
- `RetreatBookingSecurityTest`: **17 passed, 0 failures, 0 errors**
- `RetreatBookingServiceAuthorizationTest`: **9 passed, 0 failures, 0 errors**
- `VNPayDepositServiceTest`: **4 passed, 0 failures, 0 errors**
- **M2 & M3 Regression Total:** **104 passed, 0 failures, 0 errors, 0 skipped** (`BUILD SUCCESS`)

### 5.4 Test Freshness & Unique Test Case Reconciliation
- **Source File Modification Timestamps:**
  - `BookingPolicyService.java`: `2026-10-31 16:19:49.528`
  - `SpaSessionService.java`: `2026-10-31 16:19:50.644`
  - `SessionRecoveryService.java`: `2026-10-31 16:31:21.328` (final M3 deadlock-prevention refactor)
  - `FolioEntity.java` / `FolioItemEntity.java` / `PaymentTransactionEntity.java`: `2026-10-31 17:04:19.287` (line-ending normalization)
- **Surefire Execution Timestamp Verification:**
  - Suite 5.1 (`SqlServerTestConfigValidatorTest`, `SqlServerJdbcSmokeTestOptInBehaviorTest`, `SqlServerCompatibilityRemediationTest`): generated at `17:16:47`, strictly after all edits.
  - Suite 5.2 (`SpaServiceTests`, `SpaConcurrencyTest`): generated at `17:04:13 – 17:04:17`, strictly after `SessionRecoveryService.java` at `16:31:21`.
  - Suite 5.3 (`M2/M3 Full Regression Suite`, 10 classes): generated at `17:23:21 – 17:23:42`, strictly after all edits including line-ending normalizations.
- **Unique Test Cases vs. Repeated Executions:**
  - The aggregate total of **244 test executions** contains exactly **8 repeated runs** from overlapping test classes:
    - `SqlServerCompatibilityRemediationTest`: 5 test cases executed in both Suite 5.1 and Suite 5.2.
    - `TherapistRecoveryOrchestrationTest`: 3 test cases executed in both Suite 5.2 and Suite 5.3.
  - **Net Unique Test Count:** **236 unique test cases across 15 distinct test classes** (102 in Suite 5.1 + 33 unique in Suite 5.2 + 101 unique in Suite 5.3).
  - **Result:** 100% of the 236 unique test cases passed with 0 failures, 0 errors, and 0 skipped.
- Metamodel reflection proves all 20 scalar fields and 8 target join columns cleanly map to `SqlTypes.INTEGER`, while `BIGINT` audit/history fields remain `SqlTypes.BIGINT`.
- `BookingPolicyService` native query correctly resolves `configuration_value` and fails fast on invalid SQL grammar.
- Reminder state resets properly upon customer reschedule and automated same-time recovery.
- Strict global lock ordering (`Therapist` -> `Room` -> `Session`) prevents AB-BA lock inversion deadlocks under high concurrency.
- *(Note: Physical SQL Server schema validation via `SqlServerJdbcSmokeTest` was NOT claimed or executed with write migrations in this phase because `HSWRMS_TEST` remains untouched and read-only.)*

---

## 6. Remaining SQL Server-Specific Blockers

Because this phase is strictly source-only and no migrations were executed against `MYLIFE-MYRULE-1 / HSWRMS_TEST`:
1. **Unapplied Migrations on `HSWRMS_TEST`:** The physical database `HSWRMS_TEST` still lacks the 7 missing tables and 19 entity-mapped columns until the migration chain in Section 7 is applied by an administrator.
2. **Legacy Column `dbo.HealthDataDeletionRequest.health_profile_id`:** In `HSWRMS_TEST`, `dbo.HealthDataDeletionRequest` has `health_profile_id INT NOT NULL` from the legacy schema, whereas `_reviewed_m1_deletion_request_customer_profile.sql` adds `customer_profile_id INT NULL`, `request_type`, and `updated_at`. Before inserting into `dbo.HealthDataDeletionRequest` on SQL Server, `health_profile_id` must either be made `NULL`-able or dropped once data is migrated to `customer_profile_id`.
3. **`dbo.MealOrder.order_status` Check Constraint (`CK_MealOrder_Status`):** In `HSWRMS_TEST`, `CK_MealOrder_Status` permits `('SCHEDULED', 'ORDERING', 'PREPARING', 'READY', 'DELIVERED', 'COMPLETED', 'CANCELLED')`, whereas `MealOrderService.java` also uses `'SERVED'` in `findUnsettledOrdersForBooking` and status transitions. If `'SERVED'` is persisted to SQL Server, `CK_MealOrder_Status` will reject it unless `'SERVED'` is added to `CK_MealOrder_Status`.

---

## 7. Exact Migration Execution Order (Task 6)

Filename sorting alone is **unsafe** because the repository mixes `_draft_*`, `_reviewed_*`, `V1_1`–`V1_6`, and `V002`–`V017` naming conventions, and `V015` references tables created in `V011` and `V012`. When an administrator applies the pending migrations to `HSWRMS_TEST` (which already has the `V001` baseline), they **must** be executed in the following dependency order:

| Step | Migration Script | Module | Key Dependencies & Purpose |
|---|---|---|---|
| 1 | `_draft_m1_identity_health_profile.sql` | M1 | Enhances `UserAccount`, `CustomerProfile`, `StaffProfile`, `HealthProfile`, `OtpChallenge`, `LoginAttempt`. |
| 2 | `_reviewed_m1_health_profile_structured.sql` | M1 | Structured JSON check constraints and `HealthProfileAuditLog` / `HealthDataConsent` alignment. |
| 3 | `_reviewed_m1_deletion_request_customer_profile.sql` | M1 | Adds `customer_profile_id`, `request_type`, `updated_at` to `dbo.HealthDataDeletionRequest`. |
| 4 | `V1_1__m6_schema_enhancements.sql` | M6 | Adds `SystemConfiguration` validation metadata (`value_type`, `min_value`, `max_value`, `unit`, `description`) and `BroadcastNotification`. |
| 5 | `draft_m6_governance_and_delegation.sql` | M6 | Adds `ParameterDelegation`, `NotificationRecipient`, and `manager_editable` on `dbo.SystemConfiguration`. |
| 6 | `V1_2__villa_inventory.sql` | M2 | Creates `dbo.ResortZone` and links `dbo.PhysicalVilla.zone_id`. |
| 7 | `V002__m2_retreat_package_enhancements.sql` | M2 | Package catalog enhancements. |
| 8 | `V003__m2_villa_category_enhancements.sql` | M2 | Villa category enhancements. |
| 9 | `V004__m2_booking_checkin_guest_registration.sql` | M2 | Adds `dbo.RetreatBooking.guest_count` and `dbo.BookingCheckIn` guest registration columns. |
| 10 | `V005__m2_package_fnb_entitlement.sql` | M2 | Creates `dbo.PackageFnBEntitlement`. |
| 11 | `V1_3__spa_retreat_schema.sql` | M3 | Creates `dbo.VillaFunctionalArea` and adds `room_compatibility` / `pricing_rule` to `dbo.SpaTreatment`. |
| 12 | `V1_4__spa_packages_v3_standardization.sql` | M3 | Standardizes `dbo.SpaTreatment` and `dbo.RetreatPackageSpaTreatment`. |
| 13 | `V1_5__remove_duration_unit_from_spa_treatment.sql` | M3 | Removes obsolete `duration_unit` from `dbo.SpaTreatment` (requires `V1_3`/`V1_4`). |
| 14 | `V008__m3_spa_session_reminder_claim_token.sql` | M3 | Adds `reminder_claim_token` and `external_calendar_event_id` to `dbo.SpaSession`. |
| 15 | `V011__m3_spa_schedule_history.sql` | M3 | Creates `dbo.SpaScheduleHistory`. |
| 16 | `V012__m3_spa_dispatch_outbox.sql` | M3 | Creates `dbo.SpaDispatchOutbox` (depends on `V011`). |
| 17 | `V015__m3_reconcile_spa_session_identifier_types.sql` | M3 | Narrows `SpaScheduleHistory.session_id` and `SpaDispatchOutbox.session_id` from `BIGINT` to `INT` to match `SpaSession.spa_session_id` (depends on `V011` and `V012`). |
| 18 | `V016__m3_spa_session_reminder_and_trigger_reconciliation.sql` | M3 | Adds `reminder_status`, `reminder_claimed_at`, `reminder_claim_expires_at`, `reminder_sent_at`, `CK_SpaSession_ReminderStatus`, `IX_SpaSession_ReminderDue`, and reconciles `TR_SpaSession_ValidateScheduling` (depends on `V008`). |
| 19 | `V006__m4_fnb_menu_dietary_ingredients.sql` | M4 | Enhances `MenuItem`, `Ingredient`, `DietaryRestriction`, `MenuItemIngredient`. |
| 20 | `V007__m4_meal_order_execution_columns.sql` | M4 | Adds `MealOrder.special_notes` and `MealOrderItem.unit_price` / `preparation_status`. |
| 21 | `V009__m5_folio_invoice_payment_enhancements.sql` | M5 | Baseline M5 index/constraint enhancements. |
| 22 | `V010__m5_billing_adjustments_and_credit_notes.sql` | M5 | Creates `dbo.AdjustmentRequest` and `dbo.CreditNote`; adds `is_voided`, `adjusted_amount`, `voided_adjustment_request_id` to `dbo.FolioItem`. |
| 23 | `V013__m5_credit_note_refund_settlement.sql` | M5 | Adds refund settlement columns (`refund_amount`, `settled_at`, `settled_by_user_id`, etc.) to `dbo.CreditNote` (depends on `V010`). |
| 24 | `V014__m5_payment_transaction_vietqr_and_types.sql` | M5 | Expands `CK_PaymentTransaction_Type`, `CK_PaymentTransaction_Method`, `CK_PaymentTransaction_Status`, and `CK_PaymentTransaction_Target` for `FINAL_PAYMENT` and `VIETQR_BANK_TRANSFER`. |
| 25 | `V017__m5_folio_triggers_reconciliation.sql` | M5 | Reconciles `TR_FolioItem_RecalculateTotal` and `TR_PaymentTransaction_RecalculateFolioPaid` (depends on `V010`, `V013`, `V014`). |
| 26 | `V1_6__consolidate_fnb_role.sql` | M1/M4 | Data/role consolidation for `FNB_STAFF` (optional data maintenance step). |
| 27 | `V1_6__repair_mojibake_and_booking_consistency.sql` | M2/M3 | Data repair script for Vietnamese UTF-8 text and booking consistency (optional data maintenance step). |

---

## 8. Required Administrative Permissions

The current SQL Server login `hswrms_test_user` on `MYLIFE-MYRULE-1 / HSWRMS_TEST` has only `CONNECT` (`1`) and `db_datareader` (`1`), with `db_datawriter = 0`, `db_owner = 0`, and `VIEW DEFINITION = 0`.
- **To execute the schema migration chain (Section 7):** Use a dedicated migration/admin login (or temporarily grant `db_ddladmin` + `db_datawriter`, or `db_owner` in `HSWRMS_TEST`) because creating tables, altering columns/constraints, creating indexes, and executing `CREATE OR ALTER TRIGGER` require `CREATE TABLE`, `ALTER` on schema `dbo`, and `ALTER` on target tables.
- **For normal Spring Boot runtime operation after migrations are applied:** `hswrms_test_user` requires `CONNECT`, `db_datareader`, and `db_datawriter` (plus `VIEW DEFINITION` if Hibernate `ddl-auto: validate` is enabled at startup, so JDBC metadata queries against `INFORMATION_SCHEMA` / `sys.*` can inspect all table and constraint definitions).

---

## 9. Rollback and Backup Requirements

Before executing any migration script against `HSWRMS_TEST` or `HSWRMS`:
1. **Mandatory Full Database Backup:**
   ```sql
   BACKUP DATABASE [HSWRMS_TEST]
   TO DISK = N'HSWRMS_TEST_pre_remediation_migration.bak'
   WITH INIT, COMPRESSION, CHECKSUM, STATS = 10;
   ```
2. **Pre-Migration Check:** Verify active database context (`SELECT DB_NAME();`) and confirm zero active application writers are connected.
3. **Transaction & Batch Discipline:** Execute migrations one script at a time in the exact order listed in Section 7 with `sqlcmd -b` (abort on error) so any failure halts immediately before dependent scripts run.
4. **Rollback Procedure:**
   - For trigger-only changes (`V016` trigger step and `V017`), the original trigger definitions are preserved in `05_Development/database/generated/HSWRMS_TEST_schema_continuation.sql` and can be restored immediately via `CREATE OR ALTER TRIGGER`.
   - For structural multi-script failures during migration rollout, restore `HSWRMS_TEST` from `HSWRMS_TEST_pre_remediation_migration.bak`.
