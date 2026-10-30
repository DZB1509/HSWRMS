# HSWRMS — WP-1A.2: F&B FINANCIAL POLICY IMPLEMENTATION REPORT

**Document ID:** `HSWRMS-WP1A-2-POLICY-IMPLEMENTATION-20261030`  
**Execution Date:** October 30, 2026  
**Status / Verdict:** **PASS (Phase 1 Charge-on-Delivery & Checkout Guard Hardening Verified)**  
**Work Package:** WP-1A.2 (Implementation of `HSWRMS-FNB-FIN-POLICY-01` Resolving `ISSUE-FIN-01`)  
**Target Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Target Branch:** `feature/hswrms-m1-m6-integration`  
**Authoritative Policy Document:** `C:\Users\ADMIN\.gemini\antigravity\brain\4bcd6798-4d45-4413-91f2-15f0b7ab31ff\fnb_financial_policy_assessment.md` (Approved by User)

---

## 1. Executive Summary & Verdict

Following formal user approval of the Architectural and Financial Policy Assessment (`fnb_financial_policy_assessment.md`), this implementation phase realizes **Phase 1 of Policy HSWRMS-FNB-FIN-POLICY-01** ("Charge-on-Delivery, Extended Checkout Guard, and Closed-Stay Order Defense") without requiring disruptive database schema alterations.

### Key Remediation Achievements:
1. **Charge Recognition on Delivery (Eliminating Pre-Delivery Cancellation Overbilling):**
   - In accordance with Section 1 of the policy, à la carte F&B charges are no longer posted to the guest's Folio upon order placement (`ORDERED`/`PENDING`).
   - Posting occurs strictly when the kitchen confirms the order as `DELIVERED` / `SERVED`.
   - As a direct consequence, orders cancelled while `PENDING` (by guest) or while `PREPARING`/`READY` (by kitchen/staff) never generate ledger line items. The folio balance for cancelled orders remains strictly 0 VND, mathematically eliminating the overbilling defect without requiring negative line items or credit notes in Phase 1.
2. **Extended Multi-State Checkout Guard & Receptionist Transparency:**
   - In accordance with Section 2 of the policy, M5 billing and checkout guards now block checkout across all in-flight and active order states: `PENDING`, `ORDERED`, `PREPARING`, `READY`, and `READY_FOR_DELIVERY`.
   - The receptionist receives an explicit, actionable error listing each outstanding order with its ID, status, meal period, and date (e.g., `Order #14 (PREPARING, DINNER, date: 2026-10-30)`), preventing accidental checkout with unsettled kitchen orders.
3. **Closed-Stay & Inactive Booking Defense:**
   - In accordance with Section 3 of the policy, order placement is blocked if a booking is in `COMPLETED` or `CHECKED_OUT` status, or if the associated Folio is `CLOSED` or the Invoice is `ISSUED`/`PAID`.
   - This eliminates orphaned food orders that cannot legally be billed to a departed guest.
4. **Authoritative Regression Verification:**
   - Complete M4/M5 test suite: **113/113 tests passed (100% BUILD SUCCESS, 0 failures, 0 errors, 0 skipped, total execution time: 02:10 min)**.

---

## 2. Business & Financial Policy Compliance: `HSWRMS-FNB-FIN-POLICY-01`

| Policy Section | Requirement Description | Implementation Mechanism | Status |
| :--- | :--- | :--- | :--- |
| **Section 1: F&B Charge Recognition** | Extra à la carte charges must post to Folio *only* when the meal order reaches `DELIVERED` or `SERVED`. Orders in `PENDING`, `PREPARING`, `READY`, or `CANCELLED` must generate 0 charges. | `MealOrderService.placeAlaCarteOrder` sets order status to `PENDING` and returns `"PENDING_DELIVERY"`. `FnbKdsOrderServiceImpl.updateOrderStatus` calls `postFolioChargeIfEligible(order)` upon reaching `DELIVERED` and publishes `AlaCarteOrderDeliveredEvent`. | **PASS** |
| **Section 2: Extended Checkout Guard** | M5 must prevent checkout while any active dining order remains in `PENDING`, `ORDERED`, `PREPARING`, `READY`, or `READY_FOR_DELIVERY`. Error message must list order IDs and statuses. | `MealOrderRepository.findUnsettledOrdersForBooking` updated to `m.orderStatus NOT IN ('DELIVERED', 'SERVED', 'CANCELLED')`. `FolioBillingService.validateBillingGuard` formats detailed list: `Order #X (STATUS, MEAL_PERIOD, date: YYYY-MM-DD)`. | **PASS** |
| **Section 3: Closed-Stay & Inactive Booking Defense** | Reject new meal orders against `COMPLETED` / `CHECKED_OUT` bookings or `CLOSED` / `ISSUED` folios. | `DefaultBookingAndDietaryIntegrationService.requireEligibleCustomerBooking` enforces active status. `MealOrderService` queries `FolioStatusPort.isFolioOpenForBooking(bookingId)`. | **PASS** |
| **Section 4: Role-Separated Adjustments (Phase 2)** | Post-delivery cancellations require Manager-approved void/credit notes. | Scheduled for Phase 2 via migration `V010`. Documented architectural boundary; zero schema churn required for Phase 1. | **PLANNED (Phase 2)** |

---

## 3. Detailed Architectural & Source Code Modifications

### 3.1. Module M4 (F&B Management)

1. **`AlaCarteOrderDeliveredEvent.java` (NEW):**
   - Path: `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/event/AlaCarteOrderDeliveredEvent.java`
   - Purpose: Authoritative domain event published when an à la carte meal order is delivered to the customer. Contains `orderId`, `bookingId`, `subtotal`, and `guestName`.

2. **`FolioStatusPort.java` (NEW):**
   - Path: `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/integration/FolioStatusPort.java`
   - Purpose: Inversion-of-control SPI allowing M4 to query folio lifecycle state without direct cyclic dependency on M5 internal repositories.
   - Method: `boolean isFolioOpenForBooking(Integer retreatBookingId)`

3. **`MealOrderService.java` (MODIFIED):**
   - Path: `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/service/MealOrderService.java`
   - Modifications:
     - Injected `FolioStatusPort`.
     - Validates `folioPort.isFolioOpenForBooking(request.bookingId())` before creating the meal order; throws `BusinessRuleException("FOLIO_CLOSED", ...)` if closed.
     - Sets à la carte order status to `PENDING` (was previously `ORDERED`).
     - Returns `folioPostingStatus: "PENDING_DELIVERY"` (was previously `"POSTED_TO_FOLIO"`).
     - Does not invoke `folioBillingService.postFolioCharge` upon order creation.

4. **`FnbKdsOrderServiceImpl.java` (MODIFIED):**
   - Path: `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/service/FnbKdsOrderServiceImpl.java`
   - Modifications:
     - Injected `FolioBillingService` and `ApplicationEventPublisher`.
     - In `updateOrderStatus`, when `newStatus == MealOrderStatus.DELIVERED`, calls helper `postFolioChargeIfEligible(order)`.
     - Creates `PostChargeRequestDTO` with `chargeCategory: "FNB"`, `amount: order.getSubtotal()`, and `sourceMealOrderId: order.getId()`.
     - Calls `folioBillingService.postFolioChargeIdempotent(chargeReq)`.
     - Publishes `AlaCarteOrderDeliveredEvent` to allow asynchronous or decoupled downstream subscribers to react.

5. **`DefaultBookingAndDietaryIntegrationService.java` (MODIFIED):**
   - Path: `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/integration/DefaultBookingAndDietaryIntegrationService.java`
   - Modifications:
     - In `requireEligibleCustomerBooking`, added validation checking `booking.getBookingStatus()`. If `COMPLETED` or `CHECKED_OUT`, throws `BusinessRuleException("BOOKING_COMPLETED", "Booking is already completed or checked out. Cannot place meal orders.")`.

6. **`MealOrderRepository.java` (MODIFIED):**
   - Path: `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/repository/MealOrderRepository.java`
   - Modifications:
     - Updated JPQL query `findUnsettledOrdersForBooking`:
       ```java
       @Query("SELECT m FROM MealOrder m WHERE m.retreatBooking.id = :bookingId AND m.orderStatus NOT IN ('DELIVERED', 'SERVED', 'CANCELLED')")
       List<MealOrder> findUnsettledOrdersForBooking(@Param("bookingId") Integer bookingId);
       ```
     - Encompasses all non-terminal and preparation states (`PENDING`, `ORDERED`, `PREPARING`, `READY`, `READY_FOR_DELIVERY`).

---

### 3.2. Module M5 (Billing & Folio Management)

1. **`DefaultFolioStatusAdapter.java` (NEW):**
   - Path: `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/integration/DefaultFolioStatusAdapter.java`
   - Purpose: Implements M4's `FolioStatusPort`.
   - Logic: Queries `FolioRepository` and `InvoiceRepository`. Returns `false` if `folio.getFolioStatus().equalsIgnoreCase("CLOSED")` or if any invoice has status `"ISSUED"` or `"PAID"`. Otherwise returns `true`.

2. **`FnbFolioEventListener.java` (MODIFIED):**
   - Path: `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/integration/FnbFolioEventListener.java`
   - Modifications:
     - Added `@EventListener` for `AlaCarteOrderDeliveredEvent`. Executes `folioBillingService.postFolioChargeIdempotent(...)`.
     - Updated `onAlaCarteOrderPlaced`: logs informational message that ledger posting is deferred to delivery, avoiding premature charge posting.

3. **`FolioBillingService.java` (MODIFIED):**
   - Path: `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/FolioBillingService.java`
   - Modifications:
     - Hardened `validateBillingGuard`: formats each unsettled order using `Order #%d (%s, %s, date: %s)` while preserving the legacy test prefix `"dining order(s) remain PENDING, PREPARING, or READY: [...]"`.
     - Maintains non-exceptional `postFolioChargeIdempotent` to prevent rollback-only transaction poisoning.

---

## 4. Verification Evidence & Test Execution Report

Automated tests were executed against the Spring Boot H2 in-memory test profile using the official Maven wrapper.

### Command Executed:
```bash
./mvnw test "-Dtest=FnbFolioIntegrationTest,M5BillingAndCheckoutTests,FnbKdsOrderServiceTest,MealOrderServiceTest,DefaultBookingAndDietaryIntegrationServiceTest"
```

### Execution Summary:
- **Build Status:** `BUILD SUCCESS`
- **Total Execution Time:** `02:10 min`
- **Total Tests Run:** `113`
- **Failures:** `0`
- **Errors:** `0`
- **Skipped:** `0`

### Test Breakdown by Suite:

| Test Class | Module | Tests Run | Pass | Fail | Description / Key Invariants Verified |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `FnbFolioIntegrationTest` | M4 / M5 | 16 | 16 | 0 | Verifies `PENDING_DELIVERY` status, charge recognition on delivery, idempotent replay, non-poisoning duplicate handling, closed folio defense (`FOLIO-M4-15`), and detailed checkout blocker (`FOLIO-M4-16`). |
| `M5BillingAndCheckoutTests` | M5 | 48 | 48 | 0 | Full billing lifecycle: room charges, spa charges, à la carte FNB charges, VAT calculations, checkout guards, invoice finalization, and cash/online settlement. |
| `FnbKdsOrderServiceTest` | M4 | 25 | 25 | 0 | Kitchen display workflows: preparation transitions, cancellation role permissions (guest vs staff), cancellation reasons, and status auditing. |
| `DefaultBookingAndDietaryIntegrationServiceTest` | M4 | 14 | 14 | 0 | Customer stay validation, retreat booking validation, dietary requirements, and active stay eligibility checks. |
| `MealOrderServiceTest` | M4 | 10 | 10 | 0 | À la carte menu validation, package meal limits, order creation, subtotal calculations, and order retrieval. |
| **TOTAL** | — | **113** | **113** | **0** | **100% Passing Regression Suite** |

---

## 5. Architectural Boundaries & Next Phases

### Phase 1 (Completed & Authoritative):
- Charge recognition delayed until physical food delivery (`DELIVERED`/`SERVED`).
- Pre-delivery cancellation leaves Folio balance at 0 VND.
- Strict multi-state checkout guard active across `PENDING`, `ORDERED`, `PREPARING`, `READY`, `READY_FOR_DELIVERY`.
- Closed-stay & closed-folio order defense active.
- Schema changes: None required. Fully compatible with current database structure.

### Phase 2 (Roadmap & Prerequisites):
If post-delivery disputes or returns must be recorded on the Folio:
1. Migration `V010__m5_folio_credit_note_and_reversals.sql`:
   - Adjust `CK_FolioItem_Category` to permit `'ADJUSTMENT'` or `'CREDIT'`.
   - Add nullable `voided_at`, `voided_by_user_id`, and `void_reason` columns to `dbo.FolioItem`.
2. M6 RBAC update:
   - Add `FOLIO_VOID_ITEM` or `FOLIO_APPLY_ADJUSTMENT` authority restricted to `MANAGER` role.
   - Staff/Receptionist requests void; Manager approves.
3. Receptionist UI update:
   - Expose explicit "Void Charge / Credit Note" button in Folio UI with mandatory justification dialog.

---

## 6. Repository Integrity & Safety Compliance Record

1. **Physical SQL Server Isolation:**
   - Physical databases `HSWRMS` and `HSWRMS_TEST` were strictly untouched. No connections or DDL migrations were executed against them.
   - All verification tests executed strictly against in-memory H2 databases.
2. **Git Workspace Preservation:**
   - No destructive commands (`git reset`, `git clean`, `git checkout .`, `rebase`, `merge`) were executed.
   - Zero commits or pushes performed.
   - All pre-existing untracked files, reports, and modifications remain preserved.

