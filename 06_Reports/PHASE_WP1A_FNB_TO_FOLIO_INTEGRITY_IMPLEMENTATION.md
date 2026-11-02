# HSWRMS — WP-1A: F&B → FOLIO INTEGRITY IMPLEMENTATION REPORT

**Document ID:** `HSWRMS-WP1A-FNB-FOLIO-INTEGRITY-20261030`  
**Execution Date:** October 30, 2026  
**Status:** PASS / VERIFIED  
**Work Package:** WP-1A (F&B → Folio Financial Integrity Remediating `ISSUE-FIN-01`)  
**Target Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Target Branch:** `feature/hswrms-m1-m6-integration`  

---

## 1. Executive Summary

This report documents the design, implementation, and rigorous automated verification for **Work Package WP-1A**, resolving high-severity architectural gap **`ISSUE-FIN-01 — AlaCarteOrderPlacedEvent has no consumer`** discovered during the Full System Technical & Functional Audit.

Prior to this implementation, when a retreat guest placed an à la carte dining order, `MealOrderService.placeAlaCarteOrder` dispatched an `AlaCarteOrderPlacedEvent`. However, zero listeners existed anywhere across the backend codebase to consume this event. As a consequence, extra food and beverage orders never posted charges to the guest's `FolioItem`, allowing dining services to be consumed without billing reconciliation, directly threatening revenue integrity and causing invoice discrepancies at guest checkout.

Under WP-1A:
1. A decoupled, transactionally bounded listener (`FnbFolioEventListener`) was implemented in M5 (Billing & Folio), consuming `AlaCarteOrderPlacedEvent` synchronously with `Propagation.REQUIRED`.
2. Clean architectural boundaries were maintained by introducing `FolioStatusPort` in M4 and `DefaultFolioStatusAdapter` in M5, ensuring M4 has zero compile-time dependencies on M5 ($M5 \to M4$ strictly).
3. Dual-layer idempotency was established: application-level query deduplication and pessimistic locking on `MealOrder`, paired with database-level filtered unique indexes (`UX_FolioItem_SourceMealOrder`) in `schema.sql` and migration `V009`.
4. Comprehensive test suite `FnbFolioIntegrationTest` was authored covering 12 test scenarios (`FOLIO-M4-01` through `FOLIO-M4-12`), resulting in **12/12 PASS**.
5. Full regression across M4 and M5 test suites verified **112/112 PASS** (including 48/48 `M5BillingAndCheckoutTests` and 10/10 `MealOrderServiceTest`), confirming zero regressions.

---

## 2. Original Root Cause (`ISSUE-FIN-01`)

During the Master Technical & Functional Audit Phase A, static analysis identified:
- `MealOrderService.java` contained:
  ```java
  if (orderType == FnbOrderType.A_LA_CARTE) {
      eventPublisher.publishEvent(new AlaCarteOrderPlacedEvent(
          order.getId(), order.getRetreatBookingId(), response.subtotal(), createdAt));
  }
  ```
- Grepping the entire repository for `@EventListener` yielded **0 occurrences**.
- `FolioBillingService.postFolioCharge` supported category `"FNB"` and parameter `sourceMealOrderId`, but was only accessible via a receptionist REST endpoint (`/api/v1/billing/folios/{folioId}/charges`), which was never called by the automated guest dining workflow.
- In `MealOrderService.mapOrders`, the folio posting status was hardcoded to `boolean posted = false;`, mapping every à la carte order to `"PENDING_RECONCILIATION"` indefinitely.
- Result: Extra à la carte meals remained unpaid on the guest ledger, bypassing billing guard validation unless manually entered by a receptionist.

---

## 3. Source Verification Evidence

Before implementing any changes, baseline source inspection and test verification were conducted:
- Inspected `AlaCarteOrderPlacedEvent.java`: Immutable record containing `(Integer mealOrderId, Integer bookingId, BigDecimal subtotal, LocalDateTime createdAt)`.
- Inspected `FolioBillingService.java`:
  - `postFolioCharge` executes `@Transactional(propagation = Propagation.REQUIRED)`.
  - Acquires pessimistic write lock `mealOrderRepository.findByIdWithLock(orderId)`.
  - Validates `existsBySourceMealOrderId(orderId)`, throwing `DUPLICATE_CHARGE` if already posted.
  - Rejects `DAILY_MEAL` orders (`CANNOT_CHARGE_INCLUDED_SERVICE`) and cancelled orders (`INVALID_ORDER_STATE`).
  - Contains defensive check for `RetreatBooking` ID matching the folio's booking.
- Defensive Null-Safety Hardening:
  - In `FolioBillingService.java` line 150, `mealOrder.getRetreatBooking().getRetreatBookingId()` risked `NullPointerException` when `mealOrder` entity had only `retreatBookingId` populated. This was hardened to check `mealOrder.getRetreatBookingId() != null ? mealOrder.getRetreatBookingId() : mealOrder.getRetreatBooking().getRetreatBookingId()`.
- Verified Baseline Tests:
  - `MealOrderServiceTest`: 10/10 PASS.
  - `FnbBillingIntegrationTest`: 2/2 PASS.
  - `M5BillingAndCheckoutTests`: 48/48 PASS.

---

## 4. Architecture & Transaction Decision

Three architectural alternatives were analyzed:

| Pattern | Mechanism | Pros | Cons | Decision |
|---|---|---|---|---|
| **Option 1: Synchronous In-Transaction Listener** | `@EventListener` with `Propagation.REQUIRED` | Transactional atomicity: if folio posting fails (folio closed, invoice issued), the meal order transaction rolls back. No orphan unpaid orders. | Coupling of execution latency within same thread. | **SELECTED** |
| **Option 2: Asynchronous Event Listener** | `@Async` + `@TransactionalEventListener(AFTER_COMMIT)` | Decouples dining ordering response time from billing processing. | Eventual consistency: if folio posting fails after commit, meal order remains created but unbilled; requires Outbox table and retry worker. | Rejected (overkill for monolithic resort system). |
| **Option 3: Direct Service Invocation** | M4 `MealOrderService` injects M5 `FolioBillingService` directly | Direct, simple call. | Violates DDD modularity; introduces circular dependency between M4 and M5. | Rejected (violates module decoupling rules). |

### Architectural Decoupling:
- M4 defines port `FolioStatusPort` with method `boolean isMealOrderPostedToFolio(Integer mealOrderId)`.
- M5 provides `DefaultFolioStatusAdapter` implementing `FolioStatusPort` using `FolioItemRepository.existsBySourceMealOrderId(orderId.longValue())`.
- M5 provides `FnbFolioEventListener` listening to `AlaCarteOrderPlacedEvent`.
- `MealOrderService` injects `ObjectProvider<FolioStatusPort>` defensively.
- Dependency arrow strictly conforms to $M5 \to M4$.

---

## 5. Files Changed & Created

### New Files Created:
1. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/integration/FolioStatusPort.java`:
   - Decoupled query port in M4 domain.
2. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/integration/DefaultFolioStatusAdapter.java`:
   - M5 adapter implementing `FolioStatusPort`.
3. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/integration/FnbFolioEventListener.java`:
   - Event listener consuming `AlaCarteOrderPlacedEvent` and invoking `FolioBillingService.postFolioCharge`.
4. `05_Development/database/migrations/V009__m5_folio_item_unique_source_references.sql`:
   - Idempotent SQL Server DDL migration creating filtered unique indexes.
5. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/FnbFolioIntegrationTest.java`:
   - 12 comprehensive integration tests covering `FOLIO-M4-01` through `FOLIO-M4-12`.

### Files Modified:
1. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/service/MealOrderService.java`:
   - Injected `ObjectProvider<FolioStatusPort>`.
   - Updated `placeOrder` to dynamically resolve `POSTED_TO_FOLIO` upon successful event dispatch.
   - Updated `mapOrders` and `listUnpostedAlaCarteOrders` to utilize `FolioStatusPort` instead of hardcoded values.
   - Preserved backwards-compatible constructors for unit tests.
2. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/FolioBillingService.java`:
   - Hardened `postFolioCharge` booking check to prevent NPE when `mealOrder.getRetreatBooking()` is not eagerly loaded.
3. `05_Development/database/schema.sql`:
   - Added filtered unique indexes `UX_FolioItem_SourceMealOrder` and `UX_FolioItem_SourceSpaSession`.

---

## 6. Database Schema / Migration Impact

### Filtered Unique Index DDL:
```sql
/* Prevent duplicate charge items for the same source F&B meal order */
CREATE UNIQUE NONCLUSTERED INDEX UX_FolioItem_SourceMealOrder
    ON dbo.FolioItem(source_meal_order_id)
    WHERE source_meal_order_id IS NOT NULL;
GO

/* Prevent duplicate charge items for the same source spa session */
CREATE UNIQUE NONCLUSTERED INDEX UX_FolioItem_SourceSpaSession
    ON dbo.FolioItem(source_spa_session_id)
    WHERE source_spa_session_id IS NOT NULL;
GO
```

### Migration File:
`05_Development/database/migrations/V009__m5_folio_item_unique_source_references.sql` contains idempotent `sys.indexes` guards ensuring safe execution across deployment stages without breaking physical tables.

---

## 7. Idempotency Design

Idempotency is enforced across three sequential defensive boundaries:
1. **Pre-Dispatch Check (`FnbFolioEventListener`):**
   - Listener queries `folioItemRepository.existsBySourceMealOrderId(orderId.longValue())`. If true, skips processing immediately.
2. **Pessimistic Locking & Service Check (`FolioBillingService.postFolioCharge`):**
   - Acquires `PESSIMISTIC_WRITE` lock on `MealOrder` via `mealOrderRepository.findByIdWithLock(orderId)`.
   - Re-checks `existsBySourceMealOrderId(orderId.longValue())`. If exists, throws `BusinessRuleException("DUPLICATE_CHARGE")`.
   - `FnbFolioEventListener` catches `DUPLICATE_CHARGE` and logs an idempotent warning without failing the caller.
3. **Database Uniqueness Constraint:**
   - Filtered unique index `UX_FolioItem_SourceMealOrder` on `dbo.FolioItem(source_meal_order_id) WHERE source_meal_order_id IS NOT NULL`.

---

## 8. Amount Calculation Rules

F&B meal charges and tax calculations adhere strictly to resort specifications:
1. **Meal Order Item Total:**
   $$\text{Line Total} = \text{unitPrice} \times \text{quantity}$$
2. **Order Subtotal:**
   $$\text{Subtotal} = \sum \text{Line Total}$$
3. **FolioItem Amount:**
   Posted as `charge_category = 'FNB'` with `amount = subtotal`.
4. **Consolidated Invoice Calculation (`InvoiceCalculation.java`):**
   - **Package Accommodation:** $\text{packageCharges} - \text{depositPaid} = \text{packageOutstanding}$.
   - **Chargeable Extras:** $\text{chargeableExtras} = \text{spaCharges} + \text{fnbCharges}$.
   - **VAT (8%):** Calculated only on chargeable extras:
     $$\text{VAT} = \text{chargeableExtras} \times 0.08$$
   - **Subtotal:**
     $$\text{Subtotal} = \text{packageOutstanding} + \text{chargeableExtras}$$
   - **Final Amount Due:**
     $$\text{Final Amount} = \text{Subtotal} + \text{VAT}$$

---

## 9. Cancellation / Reversal Handling & Boundaries

The cancellation and reconciliation boundary conforms to resort domain requirements:
1. **Cancellation Before Folio Posting:**
   - If a meal order is cancelled before charge posting, `FolioBillingService.postFolioCharge` rejects it with `INVALID_ORDER_STATE`.
2. **Cancellation After Folio Posting:**
   - If an order is cancelled after posting to `FolioItem`, `MealOrder.orderStatus` transitions to `CANCELLED`.
   - `FolioBillingService.validateBillingGuard` clears the checkout block because the order is no longer in `PENDING`, `PREPARING`, or `READY`.
   - The ledger entry (`FolioItem`) remains immutable. HSWRMS does not currently specify an automated reverse credit folio line item (e.g. `FNB_REFUND`). Any manual adjustment is performed by a receptionist through manual charge credits.

---

## 10. Test Results (`FOLIO-M4-01` to `FOLIO-M4-12`)

The test suite `com.heavenstay.hswrms.m5billing.FnbFolioIntegrationTest` executed with 100% pass rate:

```
[INFO] Running com.heavenstay.hswrms.m5billing.FnbFolioIntegrationTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 18.72 s
```

### Scenario Breakdown:
- **`FOLIO-M4-01` (PASS):** Valid à la carte order publishes event, synchronously creates `FolioItem` with category `FNB`, links `source_meal_order_id`, and returns `folioPostingStatus = "POSTED_TO_FOLIO"`.
- **`FOLIO-M4-02` (PASS):** Duplicate event dispatch is completely idempotent and does not create duplicate `FolioItem` records.
- **`FOLIO-M4-03` (PASS):** Retry after initial processing is deduplicated via application and database guards.
- **`FOLIO-M4-04` (PASS):** Placing an à la carte order for a stay whose folio is `CLOSED` throws `FOLIO_CLOSED` and rolls back meal order creation atomically.
- **`FOLIO-M4-05` (PASS):** Placing an order when an invoice is already `ISSUED` or `PAID` throws `INVOICE_ALREADY_ISSUED` and rolls back order creation.
- **`FOLIO-M4-06` (PASS):** Daily meal selection (`DAILY_MEAL`) does not publish `AlaCarteOrderPlacedEvent` and never posts charges to the folio.
- **`FOLIO-M4-07` (PASS):** Cancelling an order after folio posting updates order status to `CANCELLED` and documents ledger immutability.
- **`FOLIO-M4-08` (PASS):** Cross-guest security: customer cannot post charges to another guest's booking/folio (`ACCESS_DENIED`).
- **`FOLIO-M4-09` (PASS):** Multi-item order subtotal matches line items, correctly aggregates under `fnbCharges`, and applies 8% VAT in consolidated invoice calculation.
- **`FOLIO-M4-10` (PASS):** Concurrent charge posting attempts across parallel threads serialize under pessimistic locking, resulting in exactly one `FolioItem`.
- **`FOLIO-M4-11` (PASS):** Attempting to post charges for a non-existent or cancelled meal order fails with `INVALID_ORDER_STATE` or `NOT_FOUND`.
- **`FOLIO-M4-12` (PASS):** `listUnpostedAlaCarteOrders` accurately filters out orders already posted to the folio.

---

## 11. Regression Verification Results

Full regression testing across the entire M4 (F&B) and M5 (Billing) suites was executed:

```
Command: .\mvnw.cmd test "-Dtest=com.heavenstay.hswrms.m4fnb.**.*Test,com.heavenstay.hswrms.m5billing.**.*Test"
[INFO] Tests run: 112, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### Key Sub-Suite Results:
- `M5BillingAndCheckoutTests`: **48/48 PASS** (all billing invariants, checkout guards, invoice generations, and payment flows verified).
- `MealOrderServiceTest`: **10/10 PASS**.
- `FnbBillingIntegrationTest`: **2/2 PASS**.
- `InventoryServiceTest`: **11/11 PASS**.
- `MenuServiceTest`: **2/2 PASS**.
- `RetreatPackageFnbServiceTest`: **7/7 PASS**.
- `FnbControllersSecurityTest`: **17/17 PASS**.
- `FnbFolioIntegrationTest`: **12/12 PASS**.

**Total Test Count:** 112 tests executed, 0 failures, 0 errors, 0 skipped.

---

## 12. Known Limitations

1. **Ledger Immutability vs. Post-Posting Cancellation:**
   - In accordance with the current HSWRMS domain specifications, cancelling a meal order after charge posting transitions the order status to `CANCELLED` (which unblocks checkout), but does not automatically generate a negative/void `FolioItem`. If credit or refund is required, it must be performed manually by a receptionist.
2. **Cross-Service Event Dispatch within Monolith:**
   - The solution uses Spring's in-memory synchronous `ApplicationEventPublisher`. While appropriate for the monolithic deployment, if M4 and M5 are extracted into distributed microservices in the future, an Outbox Pattern with a message broker (e.g. RabbitMQ/Kafka) will be required.

---

## 13. SQL Server Verification Status

- **Isolation Constraint:** In strict compliance with environment safety instructions, physical SQL Server databases `HSWRMS` and `HSWRMS_TEST` were **never connected to, queried, or modified**.
- **Test Database:** All automated tests were executed using the isolated H2 in-memory test database with `MODE=MSSQLServer`.
- **Migration Script:** Script `05_Development/database/migrations/V009__m5_folio_item_unique_source_references.sql` was authored with SQL Server specific syntax (`IF NOT EXISTS (SELECT * FROM sys.indexes ...)`). It is validated for future execution on staging/production environments by the Database Administrator.

---

## 14. Git Status & Safety Preservation

- Strictly zero git destructive commands were issued.
- Strictly zero git commits, pushes, rebases, merges, resets, cleans, or branch switches were executed.
- All pre-existing user modifications and untracked report files remain intact.
- Targeted file diff summary:
  - `MealOrderService.java`: Injected port, added backwards-compatible constructors, connected folio status.
  - `FolioBillingService.java`: Defensive check for `retreatBookingId`.
  - `schema.sql`: Added 2 filtered unique indexes (12 lines).
  - New files: `FolioStatusPort.java`, `DefaultFolioStatusAdapter.java`, `FnbFolioEventListener.java`, `V009 migration`, and `FnbFolioIntegrationTest.java`.

---

## 15. Final Acceptance Verdict

| Audit Finding ID | Description | Severity | Prior State | Remediated State | Verdict |
|---|---|---|---|---|---|
| **ISSUE-FIN-01** | `AlaCarteOrderPlacedEvent` has no consumer; extra dining charges never posted to folio | HIGH | OPEN / DEFECTIVE | FIXED & VERIFIED (12/12 Integration Tests, 112/112 Regression Tests) | **PASS** |

**Remediation for WP-1A is complete, robust, verified, and ready for deployment.**

