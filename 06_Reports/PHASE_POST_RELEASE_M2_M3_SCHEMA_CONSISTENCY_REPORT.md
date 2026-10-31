# HSWRMS — POST-RELEASE SCHEMA CONSISTENCY & OUTBOX RELIABILITY AUDIT REPORT

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`
**Current Branch:** `feature/hswrms-m1-m6-integration`
**Expected Released HEAD:** `125ca519e068843006c7857ecd57a47f65c455f1`
**Actual Local HEAD:** `125ca519e068843006c7857ecd57a47f65c455f1`
**Target Remote:** `isp-origin` (`https://gitlab.com/manhnc2/fal26-isp392-is2005-g1.git`)
**Remote HEAD:** `d930b757a554066cd7dd49a02f48e953e3fe53c8` (Advanced by 5 commits)
**Audit Timestamp:** 2026-10-31T12:12:00+07:00
**Preservation Policy:** Read-Only Audit & Safety Hold. Zero Commits, Zero Pushes, Zero Physical DB Mutations.

---

## 1. BASELINE, REMOTE DISCOVERY & SAFETY HOLD

### 1.1. Git State Inspection
- `git branch --show-current`: `feature/hswrms-m1-m6-integration`
- `git rev-parse HEAD`: `125ca519e068843006c7857ecd57a47f65c455f1` (Matches expected released baseline)
- `git fetch isp-origin` Output:
  ```text
  From https://gitlab.com/manhnc2/fal26-isp392-is2005-g1
     125ca51..d930b75  feature/hswrms-m1-m6-integration -> isp-origin/feature/hswrms-m1-m6-integration
  ```
- **Remote Branch Status:** The remote branch `isp-origin/feature/hswrms-m1-m6-integration` has advanced by **5 commits** authored by collaborator `hoatxhe180798`:
  - `875b0e6` feat(m5): add payment migration V008 and backend configurations
  - `1fe60ba` feat(m5): implement real VNPay and VietQR services, lock down simulation endpoints
  - `dcff137` feat(m5-ui): resolve folio breakdown on S42, connect live payment gateways
  - `ce0572d` docs(m5): add M5 payment gateway and settlement integrity audit report
  - `d930b75` fix(m5): resolve credit note balance calculation drift and restore frontend billing types
- **Critical Migration Notice:** Remote commit `d930b75` introduced `V014__m5_payment_transaction_vietqr_and_types.sql`. Therefore, **migration version V014 is already taken on remote**. Any new additive migration must be designated **V015**.
- **Mandatory Policy Adherence:** Per prompt section 1 (*"If the local branch is stale, diverged, or contains unexpected changes, STOP before editing. Report the exact state and request a safe synchronization decision"*), **all source modifications are held**. This report delivers the complete technical diagnosis and proposed remediation without mutating the codebase prior to authorized synchronization.

---

## 2. M3 — PK/FK DATA TYPE CONSISTENCY AUDIT

### 2.1. Exact Schema & Entity Definitions

| Component / Table | Column Name | Role | SQL Server Data Type (`schema.sql` / Migration) | Java / JPA Type (Entity) | Nullable | Referenced Table & Column |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `dbo.SpaSession` | `spa_session_id` | **PK** | `INT IDENTITY(1,1)` | `Long` (`@Column(name = "spa_session_id")`) | No | N/A (Primary Key) |
| `dbo.SpaScheduleHistory` | `session_id` | **FK** | `BIGINT` (`V011__m3_spa_schedule_history.sql:12`) | `Long` (`@Column(name = "session_id")`) | No | `dbo.SpaSession(spa_session_id)` |
| `dbo.SpaDispatchOutbox` | `session_id` | **FK** | `BIGINT` (`V012__m3_spa_dispatch_outbox.sql:14`) | `Long` (`@Column(name = "session_id")`) | No | `dbo.SpaSession(spa_session_id)` |
| `dbo.FolioItem` | `source_spa_session_id` | Ref | `INT` (`schema.sql:2054`) | `Long` | Yes | N/A (Indexed reference) |

### 2.2. Verdict: **CONFIRMED DEFECT IN SQL SERVER DDL**

#### Technical Impact Analysis:
1. **Microsoft SQL Server Foreign Key Invariant Violation:**
   - Under Microsoft SQL Server rules, referencing and referenced columns in a foreign key constraint **must have the identical base data type**.
   - Attempting to execute `ALTER TABLE ... ADD CONSTRAINT FK_... FOREIGN KEY (session_id) REFERENCES dbo.SpaSession (spa_session_id)` where child is `BIGINT` and parent is `INT` will fail in SQL Server with:
     > `Msg 1778, Level 16, State 0: Column 'dbo.SpaSession.spa_session_id' is not the same data type as referencing column 'dbo.SpaScheduleHistory.session_id' in foreign key 'FK_SpaScheduleHistory_SpaSession'.`
     > `Msg 1778, Level 16, State 0: Column 'dbo.SpaSession.spa_session_id' is not the same data type as referencing column 'dbo.SpaDispatchOutbox.session_id' in foreign key 'FK_SpaDispatchOutbox_SpaSession'.`
2. **Why It Succeeded in H2:**
   - H2 in-memory test database auto-converts integer types (`INT` vs `BIGINT`) and does not enforce SQL Server's strict base type equivalence rule for foreign key definitions.
3. **JPA Entity vs DDL Discrepancy:**
   - In `SpaSession.java`, `spaSessionId` is mapped as `Long`. In SQL Server DDL, `spa_session_id` is `INT`. While Java `Long` can hold 32-bit `INT` values safely, the DDL constraint mismatch in SQL Server prevents migration execution.

#### Proposed Minimal Safe Remediation (Additive Migration V015):
Because migrations `V011` and `V012` are already published and released in commit `54bc98e`, they **must not be edited in-place**. The correction must be applied via a new additive migration (V015):
```sql
-- Migration V015: Reconcile Spa Schedule Audit and Outbox Foreign Key Types
-- Align child FK columns to INT to match parent dbo.SpaSession(spa_session_id)

-- 1. Drop existing FK constraints if present
IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SpaScheduleHistory_SpaSession')
    ALTER TABLE dbo.SpaScheduleHistory DROP CONSTRAINT FK_SpaScheduleHistory_SpaSession;

IF EXISTS (SELECT 1 FROM sys.foreign_keys WHERE name = 'FK_SpaDispatchOutbox_SpaSession')
    ALTER TABLE dbo.SpaDispatchOutbox DROP CONSTRAINT FK_SpaDispatchOutbox_SpaSession;

-- 2. Alter column types from BIGINT to INT
ALTER TABLE dbo.SpaScheduleHistory ALTER COLUMN session_id INT NOT NULL;
ALTER TABLE dbo.SpaDispatchOutbox ALTER COLUMN session_id INT NOT NULL;

-- 3. Re-create Foreign Key Constraints with matching INT types
ALTER TABLE dbo.SpaScheduleHistory ADD CONSTRAINT FK_SpaScheduleHistory_SpaSession
    FOREIGN KEY (session_id) REFERENCES dbo.SpaSession (spa_session_id);

ALTER TABLE dbo.SpaDispatchOutbox ADD CONSTRAINT FK_SpaDispatchOutbox_SpaSession
    FOREIGN KEY (session_id) REFERENCES dbo.SpaSession (spa_session_id);
```

---

## 3. M2 — VILLA CATEGORY VS. PHYSICAL VILLA ATTRIBUTE AUDIT

### 3.1. Comparison Table of Overlapping Attributes

| Attribute / Column | VillaCategory | PhysicalVilla | Semantic Meaning & Domain Scope | Verdict & Architectural Justification |
| :--- | :--- | :--- | :--- | :--- |
| **Max Occupancy** | `max_occupancy` (`INT`, default 2) | `max_occupancy` (`INT`, default 3) | **Category:** Default contractual booking limit for package sales.<br>**Physical:** Specific physical capacity limit of the exact villa unit. | **NOT A DEFECT (Intentional Specialization):** Different physical villas in the same category may have accessibility alterations or spatial variations. |
| **Area** | `area_description` (`NVARCHAR(50)`, e.g. "80 - 120 m²") | `area_sqm` (`DECIMAL(10,2)`, e.g. 105.00) | **Category:** Marketing brochure range string.<br>**Physical:** Exact surveyor-measured floor area for facility management. | **NOT A DEFECT (Distinct Semantics & Types):** Text range vs. numeric physical property measurement. |
| **Bedroom Information** | `bedroom_count` (`INT`)<br>`bedroom_description` (`NVARCHAR(100)`) | `bedroom_info` (`NVARCHAR(100)`) | **Category:** Structured count & marketing tier (e.g. 2 PN).<br>**Physical:** Specific bed layout (e.g. "1 King Bed (Suite 1A)"). | **NOT A DEFECT (Distinct Purpose):** Category aggregates room inventory; physical villa describes the actual installed furniture. |
| **Private Pool** | `has_private_pool` (`BIT`, default 0)<br>`pool_description` (`NVARCHAR(100)`) | `has_private_pool` (`BIT`, default 0)<br>`pool_info` (`NVARCHAR(100)`) | **Category:** Category offering promise.<br>**Physical:** Unit-level asset presence for maintenance & housekeeping. | **NOT A DEFECT (Operational Denormalization):** Allows receptionist dashboard (S20) and maintenance filtering without requiring table joins. |
| **Duplicate Columns Inside DDL** | Lines 677–694 repeated at Lines 699–716 in `schema.sql` | Lines 777–794 repeated at Lines 799–816 in `schema.sql` | Identical column definitions declared twice in the same `CREATE TABLE` block in `schema.sql`. | **CONFIRMED DEFECT IN `schema.sql` (Copy-Paste DDL artifact):** Duplicate column declarations within single table scripts fail SQL Server DDL compilation. |

### 3.2. Verdict on M2 Attribute Overlap
- **Database Model:** The attribute repetition between `VillaCategory` and `PhysicalVilla` is **intentional, harmless, and semantically distinct** (Category-level contractual/marketing tier vs. Unit-level operational/facility reality). Normalizing them by deleting unit-level columns would break Screen 20 (Receptionist Dashboard), Screen 23 (Villa Assignment), and `VillaInventoryDataInitializer`.
- **`schema.sql` Syntax Artifact:** A genuine formatting defect exists inside `schema.sql` where `bedroom_count`, `has_private_pool`, and related columns are listed twice within the `CREATE TABLE dbo.VillaCategory` and `CREATE TABLE dbo.PhysicalVilla` blocks. This must be cleaned up in `schema.sql`.

---

## 4. TARGETED M3 OUTBOX CHECK

| High-Risk Outbox Consideration | Inspection Findings in `SpaDispatchOutboxWorker` & `SpaScheduleAuditEventListener` | Risk Level | Delivery Guarantee & Mitigation |
| :--- | :--- | :---: | :--- |
| **1. Dual-Instance Race Condition** | `processPendingOutboxDispatches()` queries `findByStatusInAndRetryCountLessThanOrderByCreatedAtAsc` without a pessimistic lock (`SELECT FOR UPDATE`) or state claim (`UPDATE ... SET status = 'PROCESSING'`). | **Medium** | In a multi-instance cluster, two workers could query and attempt to dispatch the same `PENDING` outbox entry simultaneously. |
| **2. Unique Idempotency Key** | Database constraint `UQ_SpaDispatchOutbox_IdempotencyKey UNIQUE (idempotency_key)` exists in `V012` line 29 and entity mapping. | **Zero** | Database strictly guarantees that duplicate outbox records cannot be inserted for the same event and channel. |
| **3. Transaction Boundary** | Event listener `onScheduleAccepted` is annotated with `@Transactional`. History save and outbox record save share the transaction boundary. | **Low** | If the transaction fails, neither history nor outbox is committed. Immediate processing exceptions are caught and swallowed, leaving the durable record for scheduled retry. |
| **4. Bounded Retries** | Query filters `retry_count < 5`. Worker increments `retry_count` on failure. Entity enforces `max_retries = 5`. | **Zero** | Retries are strictly bounded. Poison-pill dispatches stop executing after 5 failed attempts. |
| **5. Post-Provider-Success Crash** | Provider is called before updating outbox status to `SENT`. If JVM crashes between external call and database commit, status remains `PENDING`. | **Expected (At-Least-Once)** | Classic distributed systems limitation. The delivery guarantee is **At-Least-Once**, not exactly-once. Because SMTP has no external deduplication key, a crash during that window may result in a duplicate email notification. |

---

## 5. SUMMARY OF DEFECTS VS. FALSE ALARMS

| Issue Inspected | Status | Nature of Finding | Recommended Action |
| :--- | :---: | :--- | :--- |
| **M3: PK/FK Type Mismatch** | **FIX NEEDED** | Real defect under Microsoft SQL Server (`INT` PK vs `BIGINT` FK). | Introduce additive migration `V015` converting child `session_id` columns to `INT`. |
| **M2: Duplicated Attributes** | **NOT A DEFECT** | False alarm. Attributes represent distinct category tier vs. physical unit properties. | Retain existing column structure. |
| **M2: Duplicate DDL in `schema.sql`** | **FIX NEEDED** | Copy-paste duplication of column blocks inside `schema.sql`. | Remove redundant repeated lines in `schema.sql`. |
| **M3: Outbox Concurrency Claim** | **PARTIAL** | Worker does not perform pessimistic or atomic status claim on poll. | Add atomic `claimPendingDispatches` update or pessimistic locking in future phase. |
| **M3: External Integrations** | **PARTIAL** | Honest assessment. Adapters tested in decoupled mode; live cloud credentials remain unconfigured. | Maintain `PARTIAL` status until cloud staging credentials exist. |

---

## 6. SYNCHRONIZATION DECISION & NEXT STEPS

Because the remote branch `isp-origin/feature/hswrms-m1-m6-integration` has advanced to commit `d930b75` (introducing `V014` on remote):
1. **Request User Approval to Synchronize:** Fast-forward or rebase local `feature/hswrms-m1-m6-integration` onto `isp-origin/feature/hswrms-m1-m6-integration`.
2. **Apply Additive Migration V015:** Add `V015__m3_reconcile_spa_outbox_fk_types.sql` to align `session_id` to `INT`.
3. **Clean Redundant DDL Lines in `schema.sql`:** Remove copy-pasted duplicate column declarations from `dbo.VillaCategory` and `dbo.PhysicalVilla`.
4. **Re-Run Full Test Suite:** Execute all 82 backend tests and 159 frontend tests to verify 100% regression safety.
