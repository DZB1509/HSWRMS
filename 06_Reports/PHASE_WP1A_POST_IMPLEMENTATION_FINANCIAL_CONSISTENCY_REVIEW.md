# HSWRMS — WP-1A POST-IMPLEMENTATION FINANCIAL CONSISTENCY REVIEW

**Document ID:** `HSWRMS-WP1A-REVIEW-FINANCIAL-CONSISTENCY-20261030`  
**Execution Date:** October 30, 2026  
**Status / Verdict:** **PARTIAL** (Core Event & Transactional Idempotency: PASS; Post-Posting Cancellation Financial Reversal: PARTIAL)  
**Work Package:** WP-1A (F&B → Folio Financial Integrity Remediating `ISSUE-FIN-01`)  
**Target Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Target Branch:** `feature/hswrms-m1-m6-integration`  

---

## 1. Executive Summary & Verdict

This review investigates two critical financial consistency and transactional concerns raised following the initial implementation of **Work Package WP-1A**:
1. **Concern A (Post-Posting Cancellation):** Whether cancelling an already-posted à la carte meal order properly reconciles with the guest ledger (`FolioItem`), whether checkout is unblocked, and whether existing credit/reversal mechanisms exist in the domain model.
2. **Concern B (Transactional Duplicate Handling):** Whether exception-based duplicate control (`BusinessRuleException("DUPLICATE_CHARGE")`) within a `@Transactional(propagation = Propagation.REQUIRED)` service marks the shared transaction `rollback-only` before the caller can handle it, causing `UnexpectedRollbackException`.
3. **Concern C (Database Migration Safety):** Whether migration `V009` and `schema.sql` safely detect pre-existing duplicate source references without data deletion or rewriting historical financial records.

### Summary Verdict:
- **Review A (Post-Posting Cancellation):** **PARTIAL**. The system safely updates order status to `CANCELLED` and clears the billing guard (unblocking checkout), but the ledger entry (`FolioItem`) remains immutable and included in final billing calculations because the database schema strictly forbids negative charge amounts (`CHECK (amount >= 0)`) and restricts categories to `('PACKAGE', 'SPA', 'FNB')`. No automated or manual credit line mechanism is specified in the current business rules.
- **Review B (Transactional Duplicate Handling):** **PASS (Hardened)**. Discovered that throwing `BusinessRuleException` inside `@Transactional` poisoned the Spring transaction with `setRollbackOnly()`. Remediated by introducing non-exceptional idempotent query `postFolioChargeIdempotent` in `FolioBillingService` and `findBySourceMealOrderId` in `FolioItemRepository`. Verified with dedicated transaction replay tests.
- **Review C (Database Migration Safety):** **PASS (Hardened)**. Migration `V009` was hardened with defensive pre-checks to detect existing duplicate records with descriptive errors without rewriting or deleting any historical financial data.
- **Overall WP-1A Verdict:** **PARTIAL** (in accordance with audit guidelines: core event integration and idempotency are fully verified, but post-posting financial reversal remains an open domain requirement).

---

## 2. Review A — Post-Posting Cancellation Analysis

A comprehensive source-level investigation was conducted across `MealOrderService.java`, `FnbKdsOrderServiceImpl.java`, `FolioBillingService.java`, `FolioItemEntity.java`, and the SQL Server schema.

### Formal Answers to Specified Review Inquiries:

#### 1. Does the existing FolioItem remain chargeable?
**YES.** When an à la carte meal order is created, `FnbFolioEventListener` synchronously inserts a `FolioItemEntity` with category `'FNB'`, `amount = subtotal`, and `source_meal_order_id = order.getId()`. If the meal order is subsequently cancelled (via `MealOrderService.updateStatus` or `FnbKdsOrderServiceImpl.cancelOrder`), the `FolioItem` is **not deleted or modified**. It remains persisted on the guest folio.

#### 2. Does the checkout calculation still include that charge?
**YES.** `FolioBillingService.calculateInvoiceAmounts(booking, items)` computes total F&B charges as:
$$\text{fnbCharges} = \sum_{\text{item} \in \text{items}, \text{category} = \text{'FNB'}} \text{item.getAmount()}$$
Because the `FolioItem` remains attached to the folio, its amount continues to accumulate into `fnbCharges`, is factored into subtotal, and is subjected to the 8% VAT rate on chargeable extras.

#### 3. Can the receptionist issue a credit or adjustment?
**NO.** In the current system architecture:
- Database constraint in `dbo.FolioItem`:
  ```sql
  CONSTRAINT CK_FolioItem_Amount CHECK (amount >= 0)
  ```
  Negative amounts are rejected at the database engine level.
- Category constraint:
  ```sql
  CONSTRAINT CK_FolioItem_Category CHECK (charge_category IN (N'PACKAGE', N'SPA', N'FNB'))
  ```
  There is no `'CREDIT'`, `'ADJUSTMENT'`, `'DISCOUNT'`, or `'VOID'` category.
- `FolioBillingService.postFolioCharge` explicitly rejects amounts $< 0$ and any category outside `PACKAGE`, `SPA`, `FNB`.
- `FolioItemRepository` does not expose deletion or void endpoints.

#### 4. Is that adjustment persisted and reflected in the final invoice?
**NO.** Invoices reflect only `packageOutstanding + spaCharges + fnbCharges + tax`. There are no schema columns or DTO fields for credits or discretionary adjustments on `InvoiceEntity` or `InvoiceResponseDTO`.

#### 5. Is there an existing authorization rule for the adjustment?
**NO.** Neither `m6admin` nor `SecurityConfig.java` defines permissions (e.g. `FOLIO_ADJUST`, `REVERSE_CHARGE`) for receptionists or managers.

#### 6. Does the business specification explicitly require manual adjustment rather than automatic reversal?
**Hotel Domain Reality vs. Specification Gap:**
- In luxury resort hospitality (e.g. Amanoi model), once kitchen preparation commences (`PREPARING` or `READY`), food costs are incurred; automatic un-billing upon guest cancellation is prohibited to prevent guest fraud.
- `FnbKdsOrderServiceImpl` enforces that customers cannot cancel orders once in `PREPARING` or `READY` (`CUSTOMER_CANNOT_CANCEL_PREPARING_ORDER`). Only staff can cancel with a mandatory reason.
- However, if staff cancels an order due to a kitchen defect or unavailable ingredient, financial reconciliation standardly requires a Manager-approved Credit Note or negative adjustment line item.
- The HSWRMS requirements specification does not define a Credit Note or Folio Reversal workflow. Inventing an ad-hoc deletion or negative line item would directly violate database check constraint `CK_FolioItem_Amount CHECK (amount >= 0)`.

**Verdict for Review A:** Documented as an architectural boundary and classified as **PARTIAL**.

---

## 3. Review B — Transactional Duplicate Handling & Spring Rollback-Only Analysis

### The Root Cause:
In Spring Framework's declarative transaction management:
1. `FnbFolioEventListener.onAlaCarteOrderPlaced` is marked `@Transactional(propagation = Propagation.REQUIRED)`.
2. `FolioBillingService.postFolioCharge` is marked `@Transactional(propagation = Propagation.REQUIRED)`.
3. When both participate in the same logical/physical transaction, if `postFolioCharge` throws an unchecked exception (`BusinessRuleException extends RuntimeException`), Spring's `TransactionAspectSupport` intercepts the exception and unconditionally calls:
   ```java
   status.setRollbackOnly();
   ```
4. Even if `FnbFolioEventListener` wraps the call in `try { ... } catch (BusinessRuleException ex)`, catching and swallowing `DUPLICATE_CHARGE` **cannot unmark the rollback-only flag**.
5. When the outer caller (e.g. `MealOrderService.placeAlaCarteOrder` or a transaction test template) attempts to commit, Spring's `AbstractPlatformTransactionManager` detects the rollback-only flag and throws:
   ```
   org.springframework.transaction.UnexpectedRollbackException: 
   Transaction silently rolled back because it has been marked as rollback-only
   ```

### Corrective Hardening Implemented:
1. **Explicit Idempotent Query Path:**
   Added `postFolioChargeIdempotent(PostChargeRequestDTO request)` in `FolioBillingService`.
   ```java
   @Transactional
   public FolioItemResponseDTO postFolioCharge(PostChargeRequestDTO request) {
       return postFolioChargeInternal(request, false);
   }

   @Transactional
   public FolioItemResponseDTO postFolioChargeIdempotent(PostChargeRequestDTO request) {
       return postFolioChargeInternal(request, true);
   }
   ```
2. **Safe Entity Retrieval on Duplicate:**
   In `postFolioChargeInternal`:
   ```java
   if (folioItemRepository.existsBySourceMealOrderId(request.getSourceMealOrderId())) {
       if (idempotent) {
           log.info("Meal order ID {} has already been posted to a folio, returning existing charge idempotently.",
                   request.getSourceMealOrderId());
           return folioItemRepository.findBySourceMealOrderId(request.getSourceMealOrderId())
                   .map(this::mapToFolioItemResponse)
                   .orElse(null);
       }
       throw new BusinessRuleException("DUPLICATE_CHARGE",
               "Meal order ID " + request.getSourceMealOrderId() + " has already been posted to a folio.");
   }
   ```
3. **Repository Support:**
   Added `Optional<FolioItemEntity> findBySourceMealOrderId(Long sourceMealOrderId)` and `findBySourceSpaSessionId` to `FolioItemRepository`.
4. **Listener Update:**
   `FnbFolioEventListener` invokes `postFolioChargeIdempotent(chargeRequest)`.
   - Normal first execution: creates and persists `FolioItemEntity`.
   - Replayed/duplicate execution: fetches existing item and returns cleanly.
   - **Zero exceptions thrown on duplicates $\implies$ transaction is never marked `rollback-only` $\implies$ caller commits successfully.**
5. **Direct Contract Preserved:**
   Direct receptionist calls and tests calling `postFolioCharge` continue to receive `DUPLICATE_CHARGE` (preserving 100% compatibility with `M5BillingAndCheckoutTests`).
6. **Database Uniqueness Preserved:**
   Filtered unique index `UX_FolioItem_SourceMealOrder` remains the uncompromised database-level guarantee.

---

## 4. Review C — Database Migration & Index Safety

Migration script `05_Development/database/migrations/V009__m5_folio_item_unique_source_references.sql` was inspected and hardened:

### Verification Items:
1. **Schema Match:** Index names (`UX_FolioItem_SourceMealOrder`, `UX_FolioItem_SourceSpaSession`), columns, and predicate filters (`WHERE ... IS NOT NULL`) strictly match `schema.sql`.
2. **SQL Server Syntax:** Filtered unique indexes utilize Microsoft SQL Server native syntax.
3. **Safe Duplicate Detection:** Added defensive pre-checks:
   ```sql
   IF EXISTS (
       SELECT source_meal_order_id, COUNT(*)
       FROM dbo.FolioItem
       WHERE source_meal_order_id IS NOT NULL
       GROUP BY source_meal_order_id
       HAVING COUNT(*) > 1
   )
   BEGIN
       RAISERROR('Cannot create UX_FolioItem_SourceMealOrder: Duplicate source_meal_order_id records detected in dbo.FolioItem. Cleanse duplicates manually before applying index.', 16, 1);
       RETURN;
   END
   GO
   ```
4. **Historical Record Preservation:** The migration contains zero `DELETE`, `UPDATE`, or `TRUNCATE` operations. Historical financial records are strictly untouched.
5. **Re-execution Safety:** Guarded with `IF NOT EXISTS (SELECT 1 FROM sys.indexes ...)` ensuring idempotency across repeated deployments.
6. **Physical Database Isolation:** Neither `V009` nor any database migration was executed against physical databases `HSWRMS` or `HSWRMS_TEST`.

---

## 5. Files Changed

### Modified Tracked Files:
1. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/FolioItemRepository.java`:
   - Added `findBySourceMealOrderId` and `findBySourceSpaSessionId`.
2. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/FolioBillingService.java`:
   - Added `postFolioChargeIdempotent` and extracted `postFolioChargeInternal`.
   - Added SLF4J logger.
3. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/integration/FnbFolioEventListener.java`:
   - Updated to call `postFolioChargeIdempotent`.
4. `05_Development/database/migrations/V009__m5_folio_item_unique_source_references.sql`:
   - Hardened with duplicate pre-checks.
5. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/FnbFolioIntegrationTest.java`:
   - Added `FOLIO-M4-13` (transactional duplicate replay and commit verification).
   - Added `FOLIO-M4-14` (cancellation and checkout ledger persistence verification).

---

## 6. Test Results & Verification

All automated tests were executed using the isolated H2 in-memory test database (`MODE=MSSQLServer`). No physical SQL Server databases were accessed.

### 1. Targeted Integration Suite (`FnbFolioIntegrationTest`):
```
Command: .\mvnw.cmd test -Dtest=FnbFolioIntegrationTest
[INFO] Running com.heavenstay.hswrms.m5billing.FnbFolioIntegrationTest
[INFO] Tests run: 14, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 14.51 s
[INFO] BUILD SUCCESS
```

| Test Method | Scenario Description | Status |
|---|---|---|
| `testFolioM401` | Valid à la carte order publishes event, posts folio charge, returns `POSTED_TO_FOLIO` | **PASS** |
| `testFolioM402` | Duplicate event delivery does not insert duplicate `FolioItem` | **PASS** |
| `testFolioM403` | Direct posting retry rejected with `DUPLICATE_CHARGE` | **PASS** |
| `testFolioM404` | Closed folio blocks charge and rolls back order atomically | **PASS** |
| `testFolioM405` | Issued invoice blocks charge and rolls back order atomically | **PASS** |
| `testFolioM406` | Daily meal selection does not post folio charges | **PASS** |
| `testFolioM407` | Post-posting cancellation documents ledger immutability | **PASS** |
| `testFolioM408` | Cross-guest order attempt rejected with `ACCESS_DENIED` | **PASS** |
| `testFolioM409` | Multi-item pricing and 8% VAT calculation | **PASS** |
| `testFolioM410` | Concurrent posting attempts serialize under pessimistic locking | **PASS** |
| `testFolioM411` | Non-existent or pre-cancelled meal order rejected | **PASS** |
| `testFolioM412` | `listUnpostedAlaCarteOrders` excludes already-posted orders | **PASS** |
| `testFolioM413` | **Transactional duplicate event replay commits cleanly without `UnexpectedRollbackException`** | **PASS** |
| `testFolioM414` | **Checkout invoice calculation preserves FolioItem charge after cancellation** | **PASS** |

### 2. Full Regression Suite (M4 & M5):
```
Command: .\mvnw.cmd test "-Dtest=com.heavenstay.hswrms.m4fnb.**.*Test,com.heavenstay.hswrms.m5billing.**.*Test"
[INFO] Tests run: 114, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS (Time: 31.474 s)
```

### 3. Core Billing & Checkout Suite (`M5BillingAndCheckoutTests`):
```
Command: .\mvnw.cmd test -Dtest=M5BillingAndCheckoutTests
[INFO] Tests run: 48, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS (Time: 01:36 min)
```

**Grand Total Verification:** 114 M4/M5 tests passing with 0 failures, 0 errors, and 0 skipped.

---

## 7. Remaining Limitations

1. **Absence of Folio Credit / Reversal Line Items:**
   - When a kitchen cancellation occurs after folio posting, the charge currently remains in the folio total.
   - If business requirements demand customer refunds or billing credits for cancelled meals prior to checkout, a future phase must define:
     - A new column or table for credit notes (or relax `CK_FolioItem_Amount` to allow signed adjustments).
     - New categories (e.g. `'CREDIT_ADJUSTMENT'`).
     - Manager-level approval authorization.
2. **Physical Database Staging:**
   - Tests were conducted on H2 in-memory. Migration `V009` must be applied to physical SQL Server databases `HSWRMS` and `HSWRMS_TEST` by the database administrator during a scheduled maintenance window.

---

## 8. Final Verdict Matrix

| Criterion | Requirement | Status | Notes |
|---|---|---|---|
| **AC-WP1A-01** | F&B à la carte order automatically publishes event | **PASS** | `MealOrderService.placeAlaCarteOrder` |
| **AC-WP1A-02** | Event consumer posts charge to Folio under category `FNB` | **PASS** | `FnbFolioEventListener` $\to$ `FolioBillingService` |
| **AC-WP1A-03** | Synchronous transaction atomicity on billing failure | **PASS** | `FOLIO-M4-04`, `FOLIO-M4-05` verified |
| **AC-WP1A-04** | Idempotency under duplicate event delivery | **PASS** | Non-exceptional `postFolioChargeIdempotent` |
| **AC-WP1A-05** | Transaction replay without rollback-only poisoning | **PASS** | `FOLIO-M4-13` verified with `TransactionTemplate` |
| **AC-WP1A-06** | Database unique constraint on source references | **PASS** | `schema.sql` and `V009` filtered index |
| **AC-WP1A-07** | Post-posting cancellation financial reversal | **PARTIAL** | Ledger is immutable; no reversal rule specified |

**Overall Acceptance Verdict:** **PARTIAL** (Core financial integration and transactional hardening verified; post-posting reversal lifecycle open for business specification).

