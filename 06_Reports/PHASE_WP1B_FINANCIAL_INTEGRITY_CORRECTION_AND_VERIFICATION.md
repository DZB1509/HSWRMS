# HSWRMS — PHASE WP-1B FINANCIAL INTEGRITY CORRECTION & VERIFICATION REPORT

**Document ID:** HSWRMS-FIN-INTEGRITY-WP1B-01  
**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Workspace:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Branch:** `feature/hswrms-m1-m6-integration`  
**Execution Timestamp:** 2026-10-31T00:06:00+07:00  
**Final Verdict:** **PASS WITH LIMITATIONS** (All core financial, authorization, calculation, and UI requirements verified; runtime database and external gateway limitations documented)

---

## 1. EXECUTIVE SUMMARY

Following the baseline implementation of Work Package 1B (Manager-Approved F&B Void and Credit Note Workflow), a targeted financial integrity audit identified four critical architectural vulnerabilities:
1. **Issue A (Partial Adjustment vs Full Void Overkill):** Any approved adjustment unconditionally set `isVoided = true` on the `FolioItem`, causing subsequent folio recalculations and draft invoice generations to wipe out 100% of the charge rather than reducing it by the requested partial amount.
2. **Issue B (Credit Note Misrepresentation on Paid Invoices):** Credit Notes issued against already `PAID` invoices directly reduced `amountDue`, creating negative balances (or incorrect balance zeroing) while silently confusing an open refund liability with an actual disbursement.
3. **Issue C (Authorization & Role Asymmetry):** Front-desk receptionists (`ROLE_RECEPTIONIST`) and F&B staff (`ROLE_FNB_STAFF`) lacked explicit controller-level authorization to submit adjustments on behalf of guests, while manager decision endpoints required verification of strict separation of duties (`requester != approver`).
4. **Issue D & E (Verification Integrity & Frontend Representation):** Test and build execution logs required full reproducible evidence without simulated or skipped tests, and frontend UI had to clearly distinguish between full voids, partial adjustments, applied credits, and pending refund disbursements.

Through this work package, the domain model, database migration schema, financial calculation engine, role-based access control (RBAC), frontend type definitions, and user interface components have been systematically remediated and verified.

The complete backend test suite executed **136 tests** across 5 service/integration test classes with **0 failures and 0 errors** (exit code `0`). The frontend passed `oxlint` with **0 errors**, TypeScript compilation (`tsc -b`) with **0 errors** (exit code `0`), and Vite production bundling with **0 errors** (exit code `0`).

---

## 2. INITIAL FINDINGS VERIFIED AGAINST SOURCE CODE

Before implementing any modifications, a source-level inspection was performed on the existing codebase:

| Component | Inspected Source File | Initial Verified State | Deficiency Confirmed |
| :--- | :--- | :--- | :--- |
| **FolioItem Domain** | `FolioItemEntity.java` | Only contained `isVoided` (`boolean`). Did not contain any field to track cumulative adjusted amounts. | Confirmed: Cannot distinguish between partial reduction and 100% void. |
| **Folio Recalculation** | `FolioEntity.java` | Iterated over `items`, checking `if (Boolean.TRUE.equals(item.isVoided())) continue;` and added full `item.getAmount()`. | Confirmed: If marked void, skipped entire amount; if not void, charged entire amount. |
| **Invoice Calculation** | `FolioBillingService.java` | Line 851 summed `item.getAmount()` for non-void items. Draft invoice subtotal did not subtract approved adjustments. | Confirmed: Pre-invoice partial adjustment was ignored until 100% voided, at which point 100% was deducted. |
| **Credit Note Domain** | `CreditNoteEntity.java` | Contained only `amount`, `taxAmount`, and `finalCreditAmount`. No lifecycle `status` or `refundAmount` tracking. | Confirmed: Post-payment credit notes were indistinguishable from pre-payment credit adjustments. |
| **Billing Balance Due** | `FolioBillingService.java` | Subtracted `creditNotes` from `finalAmount - amountPaid` without clamping or checking invoice status. | Confirmed: Could produce negative `amountDue` or misstate customer obligations when invoice was already `PAID`. |
| **Adjustment Controller** | `AdjustmentController.java` | Methods restricted to `ROLE_STAFF`, `ROLE_MANAGER`, `ROLE_ADMIN`. Omitted canonical HSWRMS roles `ROLE_RECEPTIONIST` and `ROLE_FNB_STAFF`. | Confirmed: Receptionists and F&B staff received HTTP 403 when submitting customer adjustments. |
| **Frontend Display** | `FolioInvoicePage.tsx` | Helper `isItemVoided(item)` showed `line-through` and `(VOIDED)` for any item having an adjustment, disregarding partial amounts. | Confirmed: Guest saw entire charge voided on screen even if only a partial discount was approved. |

---

## 3. ROOT CAUSE FOR EACH CONFIRMED ISSUE

### Root Cause A: Coarse Boolean Void State
In `AdjustmentServiceImpl.java`, the approval handler executed:
```java
item.setVoided(true);
item.setVoidedAdjustmentRequestId(saved.getAdjustmentRequestId());
```
Because the domain entity lacked a field for partial reductions, `isVoided` was overloaded to represent both "charge cancelled" and "partially reduced". In accounting, the original charge record is immutable, while partial adjustments accumulate against a dedicated adjustment ledger column (`adjusted_amount`).

### Root Cause B: Conflating Receivable Adjustment with Payable Liability
When an invoice is in `ISSUED` status (unpaid), a Credit Note reduces accounts receivable (AR). The calculation `amountDue = finalAmount - amountPaid - creditNotes` is financially valid because the resort simply expects less money from the guest.
However, when an invoice is in `PAID` status, the guest has already settled the bill. The resort now owes money back to the guest (Accounts Payable / Refund Liability). Directly subtracting `creditNotes` from an already zeroed `amountDue` would either yield negative due or fail to signal to the front desk / cashier that an actual cash or payment-gateway payout must occur.

### Root Cause C: Strict Role Disconnect in Security Mappings
In HSWRMS, the database stores roles as `"Receptionist"` and `"F&B Staff"`. `CustomUserDetails.normalizeRoleAuthorities()` maps these to `ROLE_RECEPTIONIST` and `ROLE_FNB_STAFF`. Because `AdjustmentController` explicitly required `hasAnyRole('STAFF', 'MANAGER', 'ADMIN')`, users logged in with receptionist credentials were denied access to `POST /api/v1/adjustments`.

### Root Cause D: Unused Declarations & Compilation Warnings
In frontend TypeScript configuration (`tsconfig.json`), `noUnusedLocals` is enabled. Refactoring `isItemVoided` to `getItemAdjustment` left the old helper unreferenced in `FolioInvoicePage.tsx`, causing `tsc -b` to fail with error `TS6133`.

---

## 4. FILES INSPECTED

The following files were inspected in the source tree:
- `05_Development/database/schema.sql`
- `05_Development/database/migrations/V010__m5_fnb_void_and_credit_note.sql`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioEntity.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioItemEntity.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/CreditNoteEntity.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/InvoiceEntity.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/FolioRepository.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/FolioItemRepository.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/CreditNoteRepository.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/AdjustmentRequestRepository.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/AdjustmentServiceImpl.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/FolioBillingService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/AdjustmentController.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/AdjustmentServiceTest.java`
- `05_Development/frontend/src/features/m5-billing/types/index.ts`
- `05_Development/frontend/src/pages/customer/FolioInvoicePage.tsx`

---

## 5. FILES MODIFIED

All modifications strictly adhered to safety rules (preserving existing logic, no destructive operations, no git commits):

1. **`05_Development/database/schema.sql`**: Added `adjusted_amount DECIMAL(18,2) NOT NULL DEFAULT (0)` to `dbo.FolioItem`, and `status VARCHAR(30) NOT NULL DEFAULT ('CREDIT_APPLIED')`, `refund_amount DECIMAL(18,2) NOT NULL DEFAULT (0)` to `dbo.CreditNote`.
2. **`05_Development/database/migrations/V010__m5_fnb_void_and_credit_note.sql`**: Aligned migration script with updated schema definitions.
3. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioItemEntity.java`**: Added `@Column(name = "adjusted_amount") BigDecimal adjustedAmount = BigDecimal.ZERO;` and helper `getPayableAmount()`.
4. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioEntity.java`**: Updated `recalculateTotals()` to aggregate `item.getPayableAmount()`.
5. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/CreditNoteEntity.java`**: Added `status` (`CREDIT_APPLIED` vs `PENDING_REFUND`) and `refundAmount`.
6. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/CreditNoteRepository.java`**: Added query `sumPendingRefundAmountByInvoiceId`.
7. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/FolioItemResponseDTO.java`**: Added `adjustedAmount` and `payableAmount` to response record.
8. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/CreditNoteResponseDTO.java`**: Added `status` and `refundAmount`.
9. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/InvoiceResponseDTO.java`**: Added `creditNotesTotal` and `pendingRefundTotal` fields, plus overloaded constructors.
10. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/AdjustmentResponseDTO.java`**: Added `creditNoteStatus` and `refundAmount`.
11. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/AdjustmentServiceImpl.java`**:
    - Pre-invoice: updates `adjustedAmount`, sets `isVoided = true` only when `adjustedAmount >= amount`, recalculates folio totals and draft invoices.
    - Post-invoice: issues Credit Note with `status = "PENDING_REFUND"` and `refundAmount = finalCreditAmount` when `isPaid == true`; else `status = "CREDIT_APPLIED"` and `refundAmount = 0.00`.
12. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/FolioBillingService.java`**:
    - Line 851: computes charges using `item.getPayableAmount()`.
    - Line 1249: clamps `amountDue` to `Math.max(0, finalAmount - amountPaid - creditNotes)`.
    - Populates `creditNotesTotal` and `pendingRefundTotal` in `InvoiceResponseDTO`.
13. **`05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/AdjustmentController.java`**:
    - Added `RECEPTIONIST` and `FNB_STAFF` to `@PreAuthorize` on submission and listing endpoints.
    - Preserved strict `MANAGER` and `ADMIN` restriction on decision endpoint.
14. **`05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/AdjustmentServiceTest.java`**: Added 5 new targeted unit tests (tests 21-25) verifying Issues A, B, and C.
15. **`05_Development/frontend/src/features/m5-billing/types/index.ts`**: Aligned TypeScript DTO interfaces with new financial fields.
16. **`05_Development/frontend/src/pages/customer/FolioInvoicePage.tsx`**: Updated UI to render partial adjustment badges, remaining payable amounts, credit note liability statuses, and pending refund banners.

---

## 6. SCHEMA AND MIGRATION CHANGES

### A. Migration Script: `V010__m5_fnb_void_and_credit_note.sql`
```sql
-- 1. Extend FolioItem for partial adjustment accumulation
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.FolioItem') AND name = 'adjusted_amount'
)
BEGIN
    ALTER TABLE dbo.FolioItem ADD adjusted_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_FolioItem_adjusted_amount DEFAULT (0);
END;

-- 2. Extend CreditNote for refund liability tracking
IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CreditNote') AND name = 'status'
)
BEGIN
    ALTER TABLE dbo.CreditNote ADD status VARCHAR(30) NOT NULL CONSTRAINT DF_CreditNote_status DEFAULT ('CREDIT_APPLIED');
END;

IF NOT EXISTS (
    SELECT 1 FROM sys.columns 
    WHERE object_id = OBJECT_ID('dbo.CreditNote') AND name = 'refund_amount'
)
BEGIN
    ALTER TABLE dbo.CreditNote ADD refund_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_CreditNote_refund_amount DEFAULT (0);
END;
```

### B. Canonical Baseline: `schema.sql`
- `dbo.FolioItem` includes `adjusted_amount DECIMAL(18,2) NOT NULL DEFAULT (0)`.
- `dbo.CreditNote` includes:
  - `status VARCHAR(30) NOT NULL DEFAULT ('CREDIT_APPLIED')`
  - `refund_amount DECIMAL(18,2) NOT NULL DEFAULT (0)`

---

## 7. FINANCIAL CALCULATION RULES BEFORE AND AFTER CORRECTION

### Rule 1: Folio Item Payable Amount
- **Before:**
  $$\text{Payable} = \begin{cases} 0 & \text{if } \text{isVoided} = \text{true} \\ \text{amount} & \text{if } \text{isVoided} = \text{false} \end{cases}$$
- **After:**
  $$\text{Payable} = \begin{cases} 0 & \text{if } \text{isVoided} = \text{true} \\ \max(0, \text{amount} - \text{adjusted\_amount}) & \text{if } \text{isVoided} = \text{false} \end{cases}$$

### Rule 2: Folio Total Charges
- **Before:**
  $$\text{TotalCharges} = \sum_{i \in \text{Items}, \neg i.\text{isVoided}} i.\text{amount}$$
- **After:**
  $$\text{TotalCharges} = \sum_{i \in \text{Items}} i.\text{getPayableAmount}()$$

### Rule 3: Invoice Amount Due & Liability Recognition
- **Before:**
  $$\text{AmountDue} = \text{finalAmount} - \text{amountPaid} - \text{creditNotes}$$
  *(Unclamped; could result in negative due on paid invoices)*
- **After:**
  $$\text{AmountDue} = \max(0, \text{finalAmount} - \text{amountPaid} - \text{creditNotes})$$
  $$\text{PendingRefundLiability} = \sum_{\text{cn} \in \text{CreditNotes}, \text{cn}.\text{status} = \text{'PENDING\_REFUND'}} \text{cn}.\text{refundAmount}$$

---

## 8. FULL-VOID AND PARTIAL-ADJUSTMENT EXAMPLES

### Scenario 1: Pre-Invoice Partial Adjustment
1. **Initial Charge:** À la carte Dinner served: `amount = 120,000 VND`. `adjusted_amount = 0 VND`, `payableAmount = 120,000 VND`, `isVoided = false`.
2. **Guest Feedback:** Soup was cold; receptionist requests 40,000 VND adjustment.
3. **Manager Approval:**
   - `item.adjusted_amount = 40,000 VND`
   - `item.isVoided = false` (since $40,000 < 120,000$)
   - `item.getPayableAmount() = 80,000 VND`
   - `Folio.totalCharges` reduces by exactly 40,000 VND.
   - Draft invoice recalculation: `fnbCharges = 80,000 VND`, `tax = 80,000 \times 8\% = 6,400 VND`.
   - Original charge `amount = 120,000 VND` remains immutable.

### Scenario 2: Cumulative Adjustments Reaching Full Void
1. Same item (`amount = 120,000 VND`), currently adjusted by `40,000 VND`.
2. Second issue reported; manager approves additional `80,000 VND` adjustment.
3. **State Transition:**
   - `item.adjusted_amount = 40,000 + 80,000 = 120,000 VND`
   - Because `adjusted_amount >= amount`, `item.isVoided = true`.
   - `item.getPayableAmount() = 0 VND`.

---

## 9. ISSUED VERSUS PAID INVOICE BEHAVIOR

| Dimension | Adjustment Against `DRAFT` Invoice | Adjustment Against `ISSUED` Invoice (Unpaid) | Adjustment Against `PAID` Invoice |
| :--- | :--- | :--- | :--- |
| **Adjustment Mechanism** | Direct Folio Item Reduction | Credit Note Issuance | Credit Note Issuance |
| **Folio Item Mutation** | `adjusted_amount` increased; `isVoided` updated | FolioItem unmodified (Ledger locked) | FolioItem unmodified (Ledger locked) |
| **Invoice Final Amount** | Recomputed on draft regeneration | Retains original historical amount | Retains original historical amount |
| **Credit Note Status** | N/A | `CREDIT_APPLIED` | `PENDING_REFUND` |
| **Credit Note Refund Amount**| N/A | `0.00 VND` | `finalCreditAmount` (Base + Tax) |
| **Impact on `amountDue`** | Decreased directly | Decreased by `finalCreditAmount` | Clamped at `0.00 VND` (no negative balance) |
| **Resort Accounting Effect** | Reduced gross billable revenue | Reduced Accounts Receivable (AR) | Created Accounts Payable / Guest Liability |

---

## 10. REFUND LIABILITY AND SETTLEMENT LIMITATIONS

1. **Liability Tracking vs Cash Payout:**
   In HSWRMS M5, approving a Credit Note on a `PAID` invoice registers a **claim against the resort** (`PENDING_REFUND`). It does **not** initiate an automated banking or VNPay refund disbursement API call.
2. **Operational Settlement Protocol:**
   The front-desk receptionist or finance officer must manually execute the refund payout via the resort's external banking terminal / cash drawer or VNPay merchant portal. Once disbursed, the refund transaction will be settled.
3. **Audit Trail Safeguard:**
   The `refund_amount` on `dbo.CreditNote` ensures that finance managers can run reconciliation queries to inspect all outstanding refund liabilities without confusing them with active guest debts.

---

## 11. AUTHORIZATION MATRIX AND TEST EVIDENCE

| Role | Submit Adjustment (`POST /api/v1/adjustments`) | View Folio Adjustments (`GET /api/v1/adjustments/folio/{id}`) | Approve/Reject Decision (`POST /api/v1/adjustments/{id}/decision`) | Self-Approval Allowed? |
| :--- | :---: | :---: | :---: | :---: |
| **ROLE_RECEPTIONIST** | **ALLOWED** | **ALLOWED** | **DENIED (403 / UNAUTHORIZED)** | No |
| **ROLE_FNB_STAFF** | **ALLOWED** | **ALLOWED** | **DENIED (403 / UNAUTHORIZED)** | No |
| **ROLE_STAFF** | **ALLOWED** | **ALLOWED** | **DENIED (403 / UNAUTHORIZED)** | No |
| **ROLE_MANAGER** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **DENIED (400 SEPARATION_OF_DUTIES)** |
| **ROLE_ADMIN** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **DENIED (400 SEPARATION_OF_DUTIES)** |
| **ROLE_CUSTOMER** | **DENIED (403)** | **DENIED (403)** | **DENIED (403)** | No |

### Test Verification:
- `test06_requesterCannotApproveTheirOwnRequest`: Verified that manager submitting their own request fails with `SEPARATION_OF_DUTIES_VIOLATION`.
- `test07_unauthorizedUserCannotApproveOrReject`: Verified that customer/receptionist cannot approve.
- `test25_receptionistAndFnbStaffPermissions`: Verified that receptionist can submit, but attempting to approve throws `UNAUTHORIZED_APPROVER`, whereas admin approval succeeds.

---

## 12. BACKEND TEST COMMANDS AND FINAL EXIT CODES

### Executed Command:
```powershell
cd E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules\05_Development\backend
.\mvnw.cmd test "-Dtest=AdjustmentServiceTest,FnbFolioIntegrationTest,M5BillingAndCheckoutTests,FnbKdsOrderServiceTest,MealOrderServiceTest"
```

### Execution Telemetry:
- **Exit Code:** `0`
- **Total Execution Duration:** 2 minutes 11 seconds
- **Completion Timestamp:** 2026-10-31T00:02:59+07:00

### Test Results Breakdown:
| Test Class | Tests Run | Failures | Errors | Skipped | Status |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `AdjustmentServiceTest` | 25 | 0 | 0 | 0 | **PASSED** |
| `FnbFolioIntegrationTest` | 27 | 0 | 0 | 0 | **PASSED** |
| `M5BillingAndCheckoutTests`| 48 | 0 | 0 | 0 | **PASSED** |
| `FnbKdsOrderServiceTest` | 21 | 0 | 0 | 0 | **PASSED** |
| `MealOrderServiceTest` | 15 | 0 | 0 | 0 | **PASSED** |
| **Consolidated Total** | **136** | **0** | **0** | **0** | **100% PASSED** |

---

## 13. FRONTEND LINT / TYPE-CHECK / BUILD COMMANDS AND FINAL EXIT CODES

### 1. Lint (`oxlint`)
- **Command:** `cd 05_Development/frontend; npm run lint`
- **Exit Code:** `0`
- **Output:** `Found 0 errors (10 pre-existing harmless warnings in unrelated components). Finished in 38ms on 217 files.`

### 2. TypeScript Compilation Check (`tsc -b`)
- **Command:** `cd 05_Development/frontend; npx tsc -b`
- **Exit Code:** `0`
- **Output:** Clean compilation, 0 errors.

### 3. Production Build (`vite build`)
- **Command:** `cd 05_Development/frontend; npm run build`
- **Exit Code:** `0`
- **Output:**
  ```text
  vite v8.3.4 building client environment for production...
  transforming...
  ✓ 2728 modules transformed.
  rendering chunks...
  dist/index.html                     1.58 kB │ gzip:   0.75 kB
  dist/assets/index-EhPFKbM8.css    226.94 kB │ gzip:  33.96 kB
  dist/assets/index-DmfAMIRs.js   2,854.34 kB │ gzip: 751.61 kB
  ✓ built in 1.29s
  ```

---

## 14. H2 DATABASE VERIFICATION

During automated test execution in the isolated Spring Boot H2 in-memory environment:
- JPA entity mappings for `adjusted_amount`, `status`, and `refund_amount` were verified against schema constraints.
- Foreign keys (`FK_CreditNote_FolioItem`, `FK_CreditNote_Invoice`, `FK_CreditNote_AdjustmentRequest`) were validated through cascading saves and relational integrity checks.
- Zero database lock contention or constraint violations occurred across all 136 tests.

---

## 15. SQL SERVER LIMITATIONS

In accordance with strict safety instructions:
- **No connection or migration was applied to physical SQL Server databases** (`HSWRMS` or `HSWRMS_TEST`).
- Production deployment of script `05_Development/database/migrations/V010__m5_fnb_void_and_credit_note.sql` remains pending the formal scheduled maintenance window.
- The SQL Server migration script uses non-destructive, idempotent checks (`IF NOT EXISTS (SELECT 1 FROM sys.columns ...)`) and is ready for execution by the DBA.

---

## 16. REMAINING RISKS AND BLOCKERS

1. **Physical Cash / Gateway Refund API:** As documented in Section 10, credit note approvals for paid invoices track `PENDING_REFUND` liabilities in the resort database, but do not execute automated payouts via third-party gateways. Front-desk training is recommended for manual disbursement procedures.
2. **DBA Migration Execution:** Physical database deployment must be executed by an authorized administrator prior to running this build in the staging/production environment.

---

## 17. GIT WORKING-TREE STATUS

- **Target Branch:** `feature/hswrms-m1-m6-integration`
- **Commit / Push Status:** In strict compliance with instructions, **NO commits and NO git push operations were performed**.
- **Working Tree State:**
  ```text
  Changes not staged for commit:
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/AdjustmentController.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/AdjustmentResponseDTO.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/CreditNoteResponseDTO.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/FolioItemResponseDTO.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/InvoiceResponseDTO.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/CreditNoteEntity.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioEntity.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioItemEntity.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/CreditNoteRepository.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/AdjustmentServiceImpl.java
    modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/FolioBillingService.java
    modified:   05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/AdjustmentServiceTest.java
    modified:   05_Development/database/migrations/V010__m5_fnb_void_and_credit_note.sql
    modified:   05_Development/database/schema.sql
    modified:   05_Development/frontend/src/features/m5-billing/types/index.ts
    modified:   05_Development/frontend/src/pages/customer/FolioInvoicePage.tsx
    modified:   06_Reports/PHASE_GIT_TEMPORARY_CHECKPOINT_AND_PUSH_REPORT.md

  Untracked files:
    05_Development/database/generated/
    06_Reports/audit-output/backup_targeted_correction_20261029/
    06_Reports/visual-evidence/
  ```

---

## FINAL VERDICT

# **PASS WITH LIMITATIONS**

All core financial integrity mechanisms, ledger immutability safeguards, partial vs full void distinction, credit note refund liability states, and role-based authorization rules are fully implemented and verified with zero test failures across backend (136/136) and frontend builds. Physical database migration and external gateway payout execution remain documented operational handoffs.

