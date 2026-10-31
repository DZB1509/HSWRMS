# HSWRMS — Post-Release M2 & M3 Defect Remediation & Final Verification Report

**Date:** 2026-10-31
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`
**Target Branch:** `feature/hswrms-m1-m6-integration`
**Target Remote:** `isp-origin` (`https://gitlab.com/manhnc2/fal26-isp392-is2005-g1.git`)
**Previous Released Baseline Commit:** `125ca519e068843006c7857ecd57a47f65c455f1`
**Synchronized HEAD Commit:** `d930b757a554066cd7dd49a02f48e953e3fe53c8`

---

## 1. Final Git State & Resumption Summary

- **Local Branch:** `feature/hswrms-m1-m6-integration`
- **Local HEAD:** `d930b757a554066cd7dd49a02f48e953e3fe53c8`
- **Remote Tracking (`isp-origin/feature/hswrms-m1-m6-integration`):** `d930b757a554066cd7dd49a02f48e953e3fe53c8`
- **Secondary Remote (`origin`):** Untouched.
- **Commits / Pushes Performed in This Phase:** None (strictly prohibited by phase rules).
- **Integrated Collaborator Commits (`125ca51..d930b75`):**
  - `875b0e6` `feat(m5): add payment migration V008 and backend configurations`
  - `1fe60ba` `feat(m5): implement real VNPay and VietQR services, lock down simulation endpoints`
  - `dcff137` `feat(m5-ui): resolve folio breakdown on S42, connect live payment gateways`
  - `ce0572d` `docs(m5): add M5 payment gateway and settlement integrity audit report`
  - `d930b75` `fix(m5): resolve credit note balance calculation drift and restore frontend billing types`

---

## 2. Files Modified / Created Across Remediation & Final Verification

| File Path | Status | Delta Since Previous Report | Purpose |
| :--- | :---: | :--- | :--- |
| [`05_Development/database/migrations/V015__m3_reconcile_spa_session_identifier_types.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/migrations/V015__m3_reconcile_spa_session_identifier_types.sql) | **NEW** | Unchanged (verified intact) | Additive SQL Server migration reconciling `session_id` to `INT NOT NULL` and adding outbox claim columns/constraints |
| [`05_Development/database/schema.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/schema.sql) | **MODIFIED** | Verified intact | Removed duplicate M2 column blocks in `VillaCategory` and `PhysicalVilla`; synchronized `V014` and `V015` schema definitions |
| [`05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaDispatchOutboxEntity.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaDispatchOutboxEntity.java) | **MODIFIED** | Verified intact | Added `claimedAt` and `claimedBy` mappings and `PROCESSING` lifecycle support |
| [`05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/SpaDispatchOutboxRepository.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/SpaDispatchOutboxRepository.java) | **MODIFIED** | Verified intact | Added `findClaimableEntries` and atomic `claimRecordForProcessing` queries |
| [`05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaDispatchOutboxWorker.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaDispatchOutboxWorker.java) | **MODIFIED** | Restored first-level JPA cache sync in `tryClaimRecord` lost during IDE format save | Atomic worker claiming, 5-minute stale lease recovery, bounded retry guard, and At-Least-Once documentation |
| [`05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaDispatchOutboxTest.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaDispatchOutboxTest.java) | **MODIFIED** | Verified intact | Added 5 concurrency, stale recovery, at-least-once crash window, retry exhaustion, and rollback tests (9 tests total) |
| [`05_Development/frontend/src/features/m5-billing/utils/bookingResolver.test.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/features/m5-billing/utils/bookingResolver.test.ts) | **MODIFIED** | Updated in Final Verification | Aligned demo reference assertion (`HSW-88192`, `HSW-88001`, `BK-01` -> `1`) with collaborator commit `dcff137` while preserving fail-closed assertions on unknown references |
| [`05_Development/frontend/src/features/m5-billing/utils/paymentSafety.test.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/features/m5-billing/utils/paymentSafety.test.ts) | **MODIFIED** | Updated in Final Verification | Verified `HSW-88192` resolves to known demo booking `1` (never guessing `192`) and unknown reference codes (`HSW-999`, `HSW-84920`) fail closed (`null`) |
| [`06_Reports/PHASE_POST_RELEASE_M2_M3_DEFECT_REMEDIATION_REPORT.md`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/PHASE_POST_RELEASE_M2_M3_DEFECT_REMEDIATION_REPORT.md) | **MODIFIED** | Updated in Final Verification | Authoritative remediation and final verification report |

---

## 3. Outbox Implementation On-Disk Verification

On-disk inspection of [`SpaDispatchOutboxWorker.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaDispatchOutboxWorker.java), [`SpaDispatchOutboxRepository.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/SpaDispatchOutboxRepository.java), and [`SpaDispatchOutboxEntity.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaDispatchOutboxEntity.java) confirmed:

1. **Atomic Conditional Claim Before Dispatch:** `claimAndProcessEntry` and `tryClaimRecord` invoke `outboxRepository.claimRecordForProcessing(outboxId, workerId, now, staleThreshold, maxRetries)`, which executes an atomic conditional `UPDATE` transitioning `status` to `'PROCESSING'`, setting `claimed_at = :claimedAt`, and setting `claimed_by = :workerId` only if `retryCount < :maxRetries` and `status IN ('PENDING', 'FAILED')` or `(status = 'PROCESSING' AND claimed_at < :staleThreshold)`.
2. **First-Level Cache Consistency Restored:** During the on-disk inspection in Step 2, it was detected that an IDE editor format/save on `SpaDispatchOutboxWorker.java` had dropped the in-memory `findById(outboxId).ifPresent(...)` synchronization inside `tryClaimRecord`. This block was immediately restored on disk and re-verified with `SpaDispatchOutboxTest` (9/9 PASS).
3. **Stale-Claim Lease Recovery:** `STALE_CLAIM_MINUTES = 5` ensures that any worker interrupted while a record is in `PROCESSING` has its stale lease reclaimed after 5 minutes, while fresh claims (< 5 minutes) are protected from concurrent workers.
4. **Bounded Retry Enforcement:** `MAX_RETRIES = 5` prevents infinite retry loops once `retryCount` reaches `5`.
5. **Claim Metadata Cleanup:** Both `markSent` and `markFailed` clear `claimedAt = null` and `claimedBy = null` before persisting.

---

## 4. M3 Migration (`V015`) & M2 Canonical Schema Verification

### 4.1. `SpaSession` PK/FK Reference Matrix

| Table / Entity / Layer | Column / Field | SQL Server Type (Before) | SQL Server Type (After) | Java / TS Type | FK / Index Reference | Verification Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `dbo.SpaSession` (`SpaSession.java`) | `spa_session_id` / `spaSessionId` | `INT IDENTITY(1,1) NOT NULL` | `INT IDENTITY(1,1) NOT NULL` | `Long` | `PK_SpaSession` | **Consistent (`INT`)** |
| `dbo.FolioItem` (`FolioItemEntity.java`) | `source_spa_session_id` / `sourceSpaSessionId` | `INT NULL` | `INT NULL` | `Long` | `FK_FolioItem_SpaSession`, `UX_FolioItem_SourceSpaSession` | **Consistent (`INT`)** |
| `dbo.SpaScheduleHistory` (`SpaScheduleHistory.java`) | `session_id` / `sessionId` | `BIGINT NOT NULL` | `INT NOT NULL` | `Long` | `FK_SpaScheduleHistory_SpaSession`, `IX_SpaScheduleHistory_session_id` | **Reconciled (`INT`)** |
| `dbo.SpaDispatchOutbox` (`SpaDispatchOutboxEntity.java`) | `session_id` / `sessionId` | `BIGINT NOT NULL` | `INT NOT NULL` | `Long` | `FK_SpaDispatchOutbox_SpaSession`, `IX_SpaDispatchOutbox_session_id` | **Reconciled (`INT`)** |

### 4.2. Migration Integrity & M2 Schema Cleanup
- **Historical Migrations Preserved:** `V001` through `V014` have zero modifications (`git status` confirms only `V015` is untracked in `05_Development/database/migrations/`).
- **M2 Duplicate DDL Removed:** Redundant copy-pasted column blocks in `dbo.VillaCategory` (18 lines) and `dbo.PhysicalVilla` (18 lines) are removed from `schema.sql`, while all legitimate category-tier and physical-unit attributes remain intact.
- **Static DDL Validation:** All 52 `CREATE TABLE` blocks in `schema.sql` parsed cleanly with **0 duplicate column declarations** and **0 duplicate constraint names**.

---

## 5. Frontend Test Resolution & Verification Results

### 5.1. Investigation of Collaborator Commit `dcff137`
Inspection of `git show dcff137 -- 05_Development/frontend/src/features/m5-billing/utils/bookingResolver.ts` confirmed that collaborator `hoatxhe180798` intentionally updated `resolveNumericBookingId` with the following documented rule:
> *"3. For prototype / demo resilience, known default reference codes ("HSW-88192", "HSW-88001") map to primary test booking ID 1 so frontend navigation never breaks."*

Specifically, `bookingResolver.ts` maps `'HSW-88192'`, `'HSW-88001'`, and `'BK-01'` (when passed via `paramBookingId` or `bookingReference`) to booking ID `1`, while continuing to fail closed (`return null`) for all other non-numeric reference codes (`'HSW-84920'`, `'HSW-15'`, `'HSW-BK-2026-0881'`, `'HSW-999'`) and never guessing IDs from suffix digits (`192`).

### 5.2. Test Alignment Applied
- Updated [`bookingResolver.test.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/features/m5-billing/utils/bookingResolver.test.ts#L18-L32) and [`paymentSafety.test.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/features/m5-billing/utils/paymentSafety.test.ts#L85-L92) to verify:
  1. Known demo references (`'HSW-88192'`, `'HSW-88001'`, `'BK-01'`) map to `1` and never guess `192`.
  2. Unknown/unverified reference strings (`'HSW-84920'`, `'HSW-15'`, `'HSW-BK-2026-0881'`, `'HSW-999'`) strictly fail closed and return `null`.
  3. Collaborator implementation in `bookingResolver.ts` was preserved without modification.

### 5.3. Frontend Verification Results
1. **Targeted Frontend Tests:**
   - Command: `npx tsx --test "src/features/m5-billing/utils/bookingResolver.test.ts" "src/features/m5-billing/utils/paymentSafety.test.ts"`
   - Result: **19/19 PASS** (`5` suites, `0` failures, `0` skipped)
   - Exit Code: **`0`**
2. **Full Frontend Contract Test Suite:**
   - Command: `npx tsx --test "src/**/*.test.ts"`
   - Result: **159/159 PASS** (`48` suites, `0` failures, `0` skipped)
   - Exit Code: **`0`**
3. **Frontend Production Build (Executed Separately):**
   - Command: `npx tsc -b ; if ($LASTEXITCODE -eq 0) { npx vite build }`
   - Result: **PASS** (`2,726` modules transformed, built in `2.24s`)
   - Exit Code: **`0`**

---

## 6. Backend Verification & Regression Summary

> **Environment Note:** All automated backend tests ran against isolated in-memory **H2** (`jdbc:h2:mem:testdb`). Physical SQL Server databases (`HSWRMS` and `HSWRMS_TEST`) were not connected to or mutated.

1. **Focused Post-Fix Verification (`SpaDispatchOutboxTest`):**
   - Command: `.\mvnw.cmd test "-Dtest=SpaDispatchOutboxTest"`
   - Result: **9/9 PASS** (`0` failures, `0` errors, `0` skipped)
   - Exit Code: **`0`**
   - Surefire Report: `05_Development/backend/target/surefire-reports/com.heavenstay.hswrms.m3spa.SpaDispatchOutboxTest.txt`
2. **Cumulative M3 & M5 Remediation & Regression Suite:**
   - Command: `.\mvnw.cmd test "-Dtest=SpaScheduleHistoryTest,SpaDispatchOutboxTest,SpaRecoverySchedulerTest,TherapistRecoveryOrchestrationTest,AdjustmentServiceTest,RefundSettlementLifecycleTest,FnbFolioIntegrationTest,M5BillingAndCheckoutTests,VietQrAndPaymentWebhookTest"`
   - Result: **134/134 PASS** (`0` failures, `0` errors, `0` skipped)
   - Exit Code: **`0`**
3. **M2 Schema Compatibility & Villa Availability Suite:**
   - Command: `.\mvnw.cmd test "-Dtest=M2SchemaCompatibilityTest,VillaAvailabilityServiceTest"`
   - Result: **10/10 PASS** (`0` failures, `0` errors, `0` skipped)
   - Exit Code: **`0`**

---

## 7. Remaining Limitations & Acceptance Status

1. **Physical SQL Server Migration Execution Not Run:** Because connecting to or mutating physical SQL Server databases (`HSWRMS` and `HSWRMS_TEST`) is prohibited by safety rules, `V015__m3_reconcile_spa_session_identifier_types.sql` and `schema.sql` were validated via static DDL analysis and H2 integration tests rather than live execution against a physical SQL Server instance.
2. **At-Least-Once External Dispatch Window:** Because SMTP lacks native deduplication tokens, if a worker process crashes in the narrow window after external SMTP delivery succeeds but before the database transaction commits `status = 'SENT'`, stale-claim recovery after 5 minutes will re-send the email notification (**At-Least-Once** delivery guarantee).

| Issue / Requirement | Acceptance Status | Evidence Summary |
| :--- | :---: | :--- |
| **Phase 1: Remote Collaborator Synchronization** | **PASS** | Fast-forwarded cleanly from `125ca51` to `d930b75` (`5` commits integrated, zero conflicts). |
| **Phase 2: M3 `SpaSession` PK/FK Type Reconciliation** | **FIXED** | Reconciled `SpaScheduleHistory.session_id` and `SpaDispatchOutbox.session_id` to `INT NOT NULL` via `V015` and `schema.sql`. |
| **Phase 3: M2 Overlapping Domain Attributes** | **NOT A DEFECT** | Category-level vs physical-villa attributes represent valid domain specialization. |
| **Phase 3: M2 Duplicate DDL in `schema.sql`** | **FIXED** | Removed copy-pasted duplicate column blocks in `dbo.VillaCategory` and `dbo.PhysicalVilla`; verified 0 duplicates across all 52 tables. |
| **Phase 4: M3 Outbox Concurrency Hardening** | **FIXED** | Added `PROCESSING` state, `claimed_at`/`claimed_by` metadata, atomic conditional `UPDATE` claiming, and 5-minute stale-claim recovery; verified by 9/9 tests in `SpaDispatchOutboxTest`. |
| **Frontend Contract Suite (`bookingResolver` / `paymentSafety`)** | **FIXED** | Aligned outdated demo-reference assertions with collaborator commit `dcff137`; **159/159** frontend tests and Vite production build passing (`0` exit code). |
| **Physical SQL Server Execution of `V015`** | **BLOCKED (By Safety Rule)** | Physical database connections/mutations are prohibited; verified via static DDL validator and 144 H2 backend tests. |
