# HSWRMS — WP-1A.1: F&B CANCELLATION & FINANCIAL ADJUSTMENT REQUIREMENTS DISCOVERY

**Document ID:** `HSWRMS-WP1A-1-DISCOVERY-20261030`  
**Classification:** Requirements Discovery & Architectural Impact Report  
**Author:** Principal Software Architect & QA Architect  
**Target Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Target Branch:** `feature/hswrms-m1-m6-integration`  
**Date:** October 30, 2026  
**Status:** `DISCOVERY_COMPLETE / AWAITING_PO_DECISION`  
**Mode:** Strictly READ-ONLY (No code, schema, or database changes applied)

---

## 1. EXECUTIVE SUMMARY

### 1.1 Context & Background
During work package **WP-1A (F&B → Folio Integrity Implementation)**, the critical revenue loss vulnerability `ISSUE-FIN-01` was resolved by implementing `FnbFolioEventListener`, `FolioStatusPort`, and `DefaultFolioStatusAdapter`. When an extra à la carte meal order is confirmed via `MealOrderService.placeAlaCarteOrder`, an `AlaCarteOrderPlacedEvent` is published and consumed synchronously within the booking transaction, recording an `FNB` charge line item in `dbo.FolioItem`. This implementation was verified across 14 dedicated integration tests (`FOLIO-M4-01` to `FOLIO-M4-14`) and 114 M4/M5 regression tests.

However, the post-implementation review (`PHASE_WP1A_POST_IMPLEMENTATION_FINANCIAL_CONSISTENCY_REVIEW.md`) identified a critical financial consistency gap:
> **When an à la carte meal order is cancelled after its charge has been posted to Folio, the order status in `dbo.MealOrder` is updated to `CANCELLED`, which unblocks the checkout guard (`BR-BILL-02`), but the already-posted `FolioItemEntity` remains in the folio total. The customer is subsequently invoiced and forced to pay for a cancelled meal.**

### 1.2 Core Discovery Findings
A comprehensive, read-only audit of all authoritative project requirements (SRS, Business Rules, 5 Main Flows Analysis, Project Specification Ver2, Database DDL, and source code) revealed:

1. **Operational Cancellation is Explicitly Defined:** The operational lifecycle of meal orders (`PENDING -> PREPARING -> READY -> DELIVERED`) and cancellation constraints (Customer can only cancel in `PENDING`; Staff can cancel in `PREPARING`/`READY` with mandatory reason; no cancellation once `DELIVERED`) are rigorously specified and implemented in `FnbKdsOrderServiceImpl.java`.
2. **Checkout Blocker is Explicitly Defined:** `BR-BILL-02` and `BR-09` explicitly state: *"A customer cannot be checked out if they have any active pending orders (SPA session in PROGRESS or FNB order in PREPARING/READY). Settle or cancel before checkout."*
3. **Financial Cancellation / Adjustment is NOT SPECIFIED:** There is **zero specification** in any requirements document defining what happens to a posted `FolioItem` when a meal order is cancelled. HSWRMS has no requirements for voiding line items, issuing credit notes, calculating partial refunds, recording waste liabilities, or adjusting issued invoices.
4. **Database Schema Enforces Immutability and Non-Negativity:** The database schema (`dbo.FolioItem`) enforces `CONSTRAINT CK_FolioItem_Amount CHECK (amount >= 0)` and `CONSTRAINT CK_FolioItem_Category CHECK (charge_category IN ('PACKAGE', 'SPA', 'FNB'))`. The table lacks an `is_voided` flag, `status` column, or contra/credit adjustment category. Negative adjustments are physically rejected by the database engine.
5. **Requirement Conflict on Charge Timing:** The SRS Business Function `BF-04` specifies that F&B charges are recorded *"after the meal has been prepared/fulfilled"*, whereas `BR-FNB-04`, `UC19`, and the actual system implementation post charges immediately upon order placement (`ORDERED`).

### 1.3 Key Recommendation
**Do not invent or implement ad-hoc financial reversal logic.** A formal business decision must be rendered by the Product Owner (PO) regarding the accounting treatment of cancelled orders (Void vs. Credit Note vs. Delivery-Milestone Posting) before engineering work begins on WP-1A.2.

---

## 2. SOURCE DOCUMENTS REVIEWED

The following authoritative documents and source files were inspected in the repository:

| # | Document / Source File | Path in Repository | Focus & Scope |
|---|------------------------|--------------------|---------------|
| 1 | **Business Rules Specification** | `02_Requirement/Business_Rules.md` | `BR-FNB-03` (Order progression & cancellation), `BR-FNB-04` (Folio posting), `BR-BILL-01` (Invoice aggregation), `BR-BILL-02` (Checkout lock) |
| 2 | **5 Main Flows Analysis** | `02_Requirement/5_Main_Flows_Analysis.md` | Flow 4 (Personalized Dietary Meal Management) & Flow 5 (Checkout & Billing) |
| 3 | **System Requirements Specification (SRS)** | `02_Requirement/SRS/HSWRMS_ISP392_G1_SRS.md` | Section 2.4 (`BF-04`), Section 3.2, UC16–UC20 (M4 F&B), UC21–UC25 (M5 Billing), UC26 (M6 Configuration) |
| 4 | **Project Specification Ver2** | `02_Requirement/Project_Specification/HSWRMS_ISP392_Project_Specification_Ver2.md` | Section 4 (`BR-08`, `BR-09`), Use Cases UC18, UC19, UC21, UC22 |
| 5 | **Database Schema DDL** | `05_Development/database/schema.sql` | Table definitions: `dbo.MealOrder`, `dbo.FolioItem`, `dbo.Invoice`; check constraints, foreign keys, and indexes |
| 6 | **Database Migration History** | `05_Development/database/migrations/` | Migrations `V001` through `V009` |
| 7 | **F&B Order Service Implementation** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4diet/service/impl/FnbKdsOrderServiceImpl.java` | Order cancellation methods (`cancelOrder`, `cancelOrderInternal`), cancellation rules, and audit logging |
| 8 | **Meal Order Placement Service** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4diet/service/impl/MealOrderServiceImpl.java` | À la carte order placement, event publication (`AlaCarteOrderPlacedEvent`) |
| 9 | **Folio Billing Service** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/impl/FolioBillingServiceImpl.java` | Folio charge posting (`postFolioChargeIdempotent`), invoice calculation |
| 10 | **Checkout Service** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/impl/CheckoutServiceImpl.java` | Pre-checkout validation of active pending orders and settlement status |
| 11 | **F&B Folio Event Listener** | `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/listener/FnbFolioEventListener.java` | Synchronous event listener mapping `AlaCarteOrderPlacedEvent` to `postFolioChargeIdempotent` |
| 12 | **WP-1A Post-Implementation Review** | `06_Reports/PHASE_WP1A_POST_IMPLEMENTATION_FINANCIAL_CONSISTENCY_REVIEW.md` | Technical audit identifying the post-posting cancellation discrepancy |

---

## 3. EVIDENCE AND CITATIONS

### 3.1 Business Rules Citations (`Business_Rules.md`)

#### Citation 1: `BR-FNB-03` — Meal Order Progression
> *"Meal orders must follow strict progression: `ORDERED -> PREPARING -> READY_FOR_DELIVERY -> SERVED`. Status skips are rejected. Cancellation is permitted only from `ORDERED` state by customer; staff may cancel from `PREPARING` with mandatory reason."*

#### Citation 2: `BR-FNB-04` — A-la-carte Room Folio Posting
> *"A-la-carte orders not covered by package entitlement must be posted to the customer's room folio immediately upon order confirmation."*

#### Citation 3: `BR-BILL-01` — Consolidated Invoice Aggregation
> *"At checkout, all unpaid charges (room nights, extra spa, extra F&B, damages, late fees) must be aggregated into a single consolidated invoice."*

#### Citation 4: `BR-BILL-02` — Strict Checkout Lock on Pending Orders
> *"A customer cannot be checked out if they have any active pending orders (SPA session in PROGRESS or FNB order in PREPARING/READY). The checkout attempt must be rejected with the prompt: 'Active pending orders exist. Settle or cancel before checkout.'"*

---

### 3.2 5 Main Flows Analysis Citations (`5_Main_Flows_Analysis.md`)

#### Citation 5: Flow 5 — Checkout & Billing (Step 2: Pre-checkout validation)
> *"2. System: Checks for uncompleted Spa sessions or preparing F&B orders. If found -> Check-out Blocked: Active pending orders exist. Settle or cancel before checkout."*

#### Citation 6: Flow 4 — Personalized Dietary Meal Management (Cancellation)
> *"Customer can cancel meal order before kitchen marks it as PREPARING. Once in PREPARING, only Kitchen/F&B Staff can cancel with a logged reason (e.g., out of ingredients, guest request via front desk)."*

---

### 3.3 System Requirements Specification Citations (`HSWRMS_ISP392_G1_SRS.md`)

#### Citation 7: Section 2.4 — Business Function BF-04 (Meal Management)
> *"BF-04: Meal Planning, Dietary Personalization, and Food & Beverage Service...*  
> *End Condition: The meal has been prepared/fulfilled and any additional F&B charge has been recorded in the Customer Folio."*

#### Citation 8: Section 4 — UC19 (Order Extra A-la-carte Item)
> *"`| UC19 | Order Extra A-la-carte Item | M4 | Guest orders an extra item and charges it to the villa folio. |`"*

#### Citation 9: Section 4 — UC21 (Generate Consolidated Invoice)
> *"`| UC21 | Generate Consolidated Invoice | M5 Checkout & Analytics | Receptionist aggregates package, spa and F&B charges by Room_Booking_ID. |`"*

#### Citation 10: Section 4 — UC26 (Configure Business Parameters)
> *"`| UC26 | Configure Business Parameters | M6 Administration | Manager sets refund percentage, cancellation windows, dynamic pricing rates. |`"*  
> *(Note: UC26 governs package/room booking cancellation windows and refund percentages, but contains no mention of F&B meal cancellation or adjustment).*

---

### 3.4 Project Specification Ver2 Citations (`Project_Specification_Ver2.md`)

#### Citation 11: Section 4.3 — `BR-08` (Consolidated Folio Accounting)
> *"All billable transactions (accommodation, wellness/spa, dietary/F&B) must be linked to a single room booking folio. Every charge must reference its source transaction ID."*

#### Citation 12: Section 4.3 — `BR-09` (Checkout Guard)
> *"Checkout is blocked if active orders (Spa in PROGRESS, F&B in PREPARING) exist or if folio has unsettled balance."*

---

### 3.5 Database DDL & Schema Constraints (`schema.sql`)

#### Citation 13: `dbo.FolioItem` Schema Definition & Constraints
```sql
CREATE TABLE dbo.FolioItem (
    folio_item_id        BIGINT IDENTITY(1,1) NOT NULL,
    room_booking_id      BIGINT               NOT NULL,
    charge_category      NVARCHAR(50)         NOT NULL,
    description          NVARCHAR(255)        NOT NULL,
    amount               DECIMAL(18,2)        NOT NULL,
    source_meal_order_id BIGINT               NULL,
    source_spa_session_id BIGINT              NULL,
    posted_at            DATETIME2            NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_FolioItem PRIMARY KEY (folio_item_id),
    CONSTRAINT FK_FolioItem_RoomBooking FOREIGN KEY (room_booking_id) 
        REFERENCES dbo.RoomBooking(room_booking_id),
    CONSTRAINT CK_FolioItem_Amount CHECK (amount >= 0),
    CONSTRAINT CK_FolioItem_Category CHECK (charge_category IN (N'PACKAGE', N'SPA', N'FNB'))
);
```
*(Key Finding: Check constraint `CK_FolioItem_Amount` strictly prohibits negative amounts. Check constraint `CK_FolioItem_Category` permits only `PACKAGE`, `SPA`, and `FNB`. There is no `status` column, `is_voided` flag, or adjustment category).*

---

### 3.6 Backend Source Code Citations

#### Citation 14: `FnbKdsOrderServiceImpl.java` — Operational Cancellation Logic (Lines 357–410)
```java
if (order.getStatus() == MealOrderStatus.DELIVERED) {
    throw new ResponseStatusException(HttpStatus.CONFLICT, "ORDER_ALREADY_DELIVERED");
}

if (isCustomer) {
    if (order.getStatus() != MealOrderStatus.PENDING) {
        throw new ResponseStatusException(HttpStatus.CONFLICT, "CUSTOMER_CANNOT_CANCEL_PREPARING_ORDER");
    }
} else {
    if (reason == null || reason.trim().isEmpty()) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "CANCELLATION_REASON_REQUIRED");
    }
}

order.setStatus(MealOrderStatus.CANCELLED);
order.setCancellationReason(reason != null ? reason.trim() : "Cancelled by customer");
order.setCancelledAt(LocalDateTime.now());
order.setCancelledBy(userId != null ? userId.toString() : "UNKNOWN");
mealOrderRepository.save(order);

auditLogPort.record(
    "CANCEL_MEAL_ORDER",
    "MEAL_ORDER",
    orderId.toString(),
    userId != null ? userId.toString() : "ANONYMOUS",
    "Order #" + orderId + " cancelled. Reason: " + order.getCancellationReason()
);
```
*(Key Finding: The method transitions `order.status` to `CANCELLED` and writes an audit log. **It does not emit an event, notify FolioBillingService, or touch `dbo.FolioItem`.**)*

#### Citation 15: `FolioBillingServiceImpl.java` — Invoice Calculation Logic (Lines 142–165)
```java
List<FolioItemEntity> items = folioItemRepository.findByRoomBookingId(roomBookingId);
BigDecimal packageCharges = BigDecimal.ZERO;
BigDecimal spaCharges = BigDecimal.ZERO;
BigDecimal fnbCharges = BigDecimal.ZERO;

for (FolioItemEntity item : items) {
    if ("PACKAGE".equalsIgnoreCase(item.getChargeCategory())) {
        packageCharges = packageCharges.add(item.getAmount());
    } else if ("SPA".equalsIgnoreCase(item.getChargeCategory())) {
        spaCharges = spaCharges.add(item.getAmount());
    } else if ("FNB".equalsIgnoreCase(item.getChargeCategory())) {
        fnbCharges = fnbCharges.add(item.getAmount());
    }
}
```
*(Key Finding: `calculateInvoice` indiscriminately sums every row in `dbo.FolioItem` matching the `roomBookingId`. Because `FolioItemEntity` lacks a status or void flag, any item written during order placement is permanently added to `fnbCharges`.)*

---

## 4. SCENARIO DECISION MATRIX

The following matrix evaluates the 10 required operational and financial scenarios against the 6 required criteria, based strictly on authoritative HSWRMS artifacts:

| # | Scenario Description | 1. Cancellation Allowed? | 2. FolioItem Chargeable? | 3. Credit / Reversal Required? | 4. Who Can Authorize? | 5. Audit Record Required? | 6. Invoice Recalculated? |
|---|----------------------|--------------------------|--------------------------|--------------------------------|-----------------------|---------------------------|--------------------------|
| **1** | **Customer cancels before kitchen preparation (`PENDING`)** | **YES** (`BR-FNB-03`, `FnbKdsOrderServiceImpl:366`) | **NO (Commercial Expectation)** / **YES (Current Implementation)** | **NOT_SPECIFIED** in requirements (Required commercially) | Customer (`CUSTOMER` role) | **YES** (`CANCEL_MEAL_ORDER` logged) | **NOT_SPECIFIED** (Would need recalculation if unbilled) |
| **2** | **Customer attempts cancellation during `PREPARING`** | **NO** (`CUSTOMER_CANNOT_CANCEL_PREPARING_ORDER`) | **YES** (Order continues to completion) | **NO** (Cancellation rejected) | N/A (Action blocked) | **NO** (409 Conflict thrown) | **NO** (No change) |
| **3** | **Customer attempts cancellation after `READY`** | **NO** (Blocked by customer guard) | **YES** (Order continues to delivery) | **NO** (Cancellation rejected) | N/A (Action blocked) | **NO** (409 Conflict thrown) | **NO** (No change) |
| **4** | **Staff cancels because ingredients are unavailable** | **YES** (Staff with mandatory reason) | **NO (Commercial Expectation)** / **YES (Current Implementation)** | **NOT_SPECIFIED** in requirements (Mandatory commercially) | Kitchen / F&B Staff (`CHEF`, `RESTAURANT_STAFF`) | **YES** (`CANCEL_MEAL_ORDER` with reason logged) | **NOT_SPECIFIED** (Uninvoiced folio total must drop) |
| **5** | **Staff cancels because of kitchen quality problems** | **YES** (Staff with mandatory reason) | **NO (Commercial Expectation)** / **YES (Current Implementation)** | **NOT_SPECIFIED** in requirements (Mandatory commercially) | Kitchen Staff / Head Chef | **YES** (`CANCEL_MEAL_ORDER` with reason logged) | **NOT_SPECIFIED** (Uninvoiced folio total must drop) |
| **6** | **Staff cancels an already-posted order** | **YES** (Staff with mandatory reason) | **NO (Commercial Expectation)** / **YES (Current Implementation)** | **NOT_SPECIFIED** in requirements (Critical gap) | Kitchen Staff or Receptionist | **YES** (`CANCEL_MEAL_ORDER` logged) | **NOT_SPECIFIED** (Invoice total discrepancy) |
| **7** | **Folio has not yet been invoiced** | **YES** (Subject to state guards in 1–5) | **NO** if cancelled; **YES** if fulfilled | **NOT_SPECIFIED** (Void vs. Contra-charge vs. Delete) | Kitchen Staff / Receptionist | **YES** for order cancellation | **YES** (Invoice not yet generated; draft total recalculated) |
| **8** | **Invoice has already been issued** | **CONFLICTING / BLOCKED** (Order can be cancelled in KDS, but `Invoice` is immutable) | **YES** (Already locked into issued invoice) | **NOT_SPECIFIED** (Credit Note / Amended Invoice missing) | Receptionist / Manager | **YES** for order cancellation | **NOT_SPECIFIED** (No invoice re-calculation API exists) |
| **9** | **Invoice has already been paid** | **BLOCKED** (Stay is finalized; checkout complete) | **YES** (Payment settled) | **NOT_SPECIFIED** (Out-of-band cash/gateway refund missing) | Hotel Manager | **NOT_SPECIFIED** | **NO** (Paid invoice is immutable historical record) |
| **10** | **Manager reviews a disputed F&B charge** | **NOT_SPECIFIED** (No dispute UI or API exists) | **NOT_SPECIFIED** (No manual adjustment mechanism) | **NOT_SPECIFIED** (No credit adjustment mechanism) | Manager (`MANAGER` role) | **NOT_SPECIFIED** (No audit action defined for dispute) | **NOT_SPECIFIED** |

---

## 5. EXPLICIT REQUIREMENTS

The following requirements are **directly and unambiguously stated** in authoritative HSWRMS documentation:

1. **Strict Order State Progression (`BR-FNB-03`):**  
   Meal orders must follow: `ORDERED -> PREPARING -> READY_FOR_DELIVERY -> SERVED`. State skipping is prohibited.
2. **Customer Cancellation Boundary (`BR-FNB-03`, `5_Main_Flows_Analysis.md:Flow 4`):**  
   A customer is permitted to cancel a meal order **only** while it is in the `ORDERED` (`PENDING`) state. Once the kitchen transitions the order to `PREPARING`, customer-initiated cancellation is strictly blocked (`CUSTOMER_CANNOT_CANCEL_PREPARING_ORDER`).
3. **Staff Cancellation with Mandatory Reason (`BR-FNB-03`, `FnbKdsOrderServiceImpl:372`):**  
   Staff may cancel an order in `PREPARING` or `READY_FOR_DELIVERY` states, but **must** provide a non-empty cancellation reason (`CANCELLATION_REASON_REQUIRED`).
4. **Delivered Order Cancellation Block (`FnbKdsOrderServiceImpl:359`):**  
   An order that has reached `DELIVERED` (`SERVED`) status can **never** be cancelled by customer or staff (`ORDER_ALREADY_DELIVERED`).
5. **Immediate Folio Posting (`BR-FNB-04`, `Project_Specification_Ver2:BR-08`):**  
   Extra à la carte orders not covered by package entitlements must be posted to the customer's room folio.
6. **Checkout Guard on Active Orders (`BR-BILL-02`, `Project_Specification_Ver2:BR-09`, `5_Main_Flows_Analysis.md:Flow 5`):**  
   Checkout cannot proceed if any active pending orders exist (`FNB order in PREPARING/READY` or `SPA session in PROGRESS`). The system must block checkout and prompt: *"Active pending orders exist. Settle or cancel before checkout."*
7. **Consolidated Billing Aggregation (`BR-BILL-01`, `SRS UC21`):**  
   At checkout, all unpaid charges (package, spa, F&B, damages, late fees) must be aggregated into a single consolidated invoice tied to `room_booking_id`.
8. **Folio Ledger Non-Negativity (`schema.sql`):**  
   `dbo.FolioItem.amount` must be greater than or equal to zero (`CONSTRAINT CK_FolioItem_Amount CHECK (amount >= 0)`).
9. **Folio Ledger Category Restriction (`schema.sql`):**  
   `dbo.FolioItem.charge_category` must be one of `PACKAGE`, `SPA`, `FNB` (`CONSTRAINT CK_FolioItem_Category`).

---

## 6. IMPLIED REQUIREMENTS

The following behaviors are **strongly implied** by the existing operational flows and business rules, but are not formally defined as financial rules:

1. **Cancellation Unblocks Checkout:**  
   The checkout blocker prompt explicitly states: *"Active pending orders exist. Settle or cancel before checkout."* This implies that cancelling a pending order transitions its state to `CANCELLED`, which is not an active state, thereby satisfying the guard and allowing checkout to proceed.
2. **Guests Should Not Pay for Unfulfilled Meals:**  
   If a customer cancels an order while it is `PENDING` (before the kitchen has spent ingredients or labor), or if staff cancels an order due to unavailable ingredients, commercial logic implies that the customer should not be billed for that meal.
3. **Auditability of Staff Financial Actions:**  
   Because staff cancellation requires a mandatory reason and logs `CANCEL_MEAL_ORDER`, it is implied that cancellations have financial and operational consequences that management must be able to audit.

---

## 7. UNSPECIFIED REQUIREMENTS

The following critical business and technical aspects are **completely absent** from all HSWRMS specification documents:

1. **Folio Charge Handling upon Cancellation:**  
   There is no requirement stating whether the existing `FolioItem` should be deleted, marked void, or offset by a reversal line item when an order is cancelled.
2. **Absence of Folio Item Status Lifecycle:**  
   `dbo.FolioItem` has no `status` column (e.g., `POSTED`, `VOIDED`, `REVERSED`) and no `is_voided` boolean flag.
3. **Absence of Credit Note / Adjustment Mechanism:**  
   There is no requirement or data model for Credit Notes, Contra-charges, or Adjustments. Check constraint `CK_FolioItem_Amount CHECK (amount >= 0)` physically blocks negative amounts.
4. **Kitchen Waste / Ingredient Liability:**  
   If an order is in `PREPARING` and staff cancels it due to customer request via front desk, there is no specification stating whether the customer is charged a partial cancellation fee, charged in full, or refunded in full.
5. **Post-Invoice Cancellation Handling:**  
   If an invoice is already in `ISSUED` status, and an F&B order is subsequently cancelled (e.g., delivered dish returned due to quality issue), there is no specification for re-issuing, voiding, or crediting the invoice.
6. **Manager Approval for Adjustments:**  
   There is no use case or business rule defining who has the authority to write off or reverse an F&B charge. M6 configuration (`UC26`) defines booking refund percentages, but has no parameters for F&B write-offs.
7. **Dispute Resolution Workflow:**  
   There is no UI screen or backend service allowing a receptionist or manager to review, contest, or adjust individual line items on an active folio.

---

## 8. CONFLICTING REQUIREMENTS

The audit identified two significant requirement conflicts across project documents:

### 8.1 Conflict 1: Folio Charge Posting Milestone
* **SRS Section 2.4 (`BF-04 End Condition`):**  
  > *"End Condition: The meal has been prepared/fulfilled and any additional F&B charge has been recorded in the Customer Folio."*  
  *(Implies charge is recorded **after** preparation/fulfillment).*
* **Business Rules (`BR-FNB-04`) & SRS Use Case 19 (`UC19`):**  
  > *"A-la-carte orders not covered by package entitlement must be posted to the customer's room folio immediately upon order confirmation."*  
  *(Implies charge is recorded **upfront** upon order creation).*
* **Impact:** In the current implementation, posting occurs upfront on order placement (`AlaCarteOrderPlacedEvent`). If the charge were instead posted only upon `SERVED` / `DELIVERED` (as implied by BF-04), cancelled orders would never have a folio charge to reverse in the first place.

### 8.2 Conflict 2: Checkout Guard Instruction vs. Folio Charge Retention
* **Checkout Blocker (`BR-BILL-02`):**  
  Instructs staff: *"Active pending orders exist. Settle or cancel before checkout."*
* **Folio Aggregation (`BR-BILL-01` & `FolioBillingServiceImpl`):**  
  All records in `dbo.FolioItem` are summed into the final invoice without checking the status of `dbo.MealOrder`.
* **Impact:** Staff members who follow the prompt and cancel a pending meal order to unblock checkout inadvertently leave the full charge on the customer's bill, forcing the customer to pay for the cancelled meal.

---

## 9. RECOMMENDED QUESTIONS FOR PRODUCT / BUSINESS OWNER

To resolve the ambiguities and provide an authoritative basis for WP-1A.2 implementation, the following structured questions must be submitted to the Product Owner:

### Question 1: Accounting Model for Reversals
> **How should cancelled à la carte meal charges be treated in the Folio ledger?**
> * **Option A (Physical Void / Soft Delete):** Add `is_voided BIT NOT NULL DEFAULT 0` and `voided_at DATETIME2` to `dbo.FolioItem`. When cancelled, mark the line item as void. Exclude voided items from invoice totals. (Preserves audit history without creating new rows).
> * **Option B (Contra-Charge / Credit Note):** Add a new category `FNB_REVERSAL` or allow negative amounts by modifying `CK_FolioItem_Amount`. Post an offsetting negative `FolioItem` linked to the original charge. (Standard double-entry accounting).
> * **Option C (Hard Delete):** Delete the `FolioItem` record from `dbo.FolioItem` when the order is cancelled. *(Not recommended: destroys audit trail).*

### Question 2: Timing of Charge Posting
> **Should à la carte F&B orders be charged upon order placement or upon delivery?**
> * **Option A (Upfront Posting — Current):** Post charge to folio upon order placement (`ORDERED`). Requires reversal logic if cancelled.
> * **Option B (Milestone Posting — SRS BF-04):** Post charge to folio only when order status reaches `SERVED` / `DELIVERED`. Pre-delivery cancellation requires zero folio adjustments.

### Question 3: Cancellation Liability & Waste Policy
> **When staff cancels an order in `PREPARING` or `READY` status, does the customer incur any charge?**
> * **Option A (Full Relief):** Customer is credited 100% of the meal price, regardless of when staff cancelled. The resort absorbs ingredient costs as kitchen waste.
> * **Option B (Kitchen Fault vs. Guest Request):** If staff cancels due to kitchen reasons (`OUT_OF_STOCK`, `QUALITY_ISSUE`), credit 100%. If staff cancels due to guest late-cancellation request, charge a configurable cancellation fee (e.g., 50% or 100%).

### Question 4: Post-Invoice Adjustments
> **What should occur if an F&B order is disputed or cancelled after an invoice has already been `ISSUED` or `PAID`?**
> * **Option A (Strict Lock):** Once an invoice is `ISSUED`, F&B orders tied to that folio cannot be cancelled or adjusted. Any refund must be processed out-of-band via front-desk cash/POS refund.
> * **Option B (Invoice Void & Regenerate):** Allow the receptionist to void the `ISSUED` invoice, trigger the folio adjustment, and re-generate a new consolidated invoice.

### Question 5: Authorization & Roles
> **Who has authority to reverse or adjust an F&B folio charge?**
> * **Option A (Automatic):** Cancelling the meal order in KDS automatically reverses the folio charge without additional approval.
> * **Option B (Manager Approval Required):** Cancelling the meal order sets the folio charge to `PENDING_ADJUSTMENT`, requiring a user with `MANAGER` role to approve the credit.

---

## 10. POTENTIAL ARCHITECTURE IMPACT

If the Product Owner approves an automatic void or reversal mechanism, the following components across HSWRMS will be impacted:

### 10.1 M4 F&B Module
* **`MealOrderCancelledEvent`:**  
  Introduce a new domain event published by `FnbKdsOrderServiceImpl.cancelOrderInternal`:
  ```java
  public record MealOrderCancelledEvent(
      Long mealOrderId,
      Long roomBookingId,
      String reason,
      String cancelledBy,
      LocalDateTime cancelledAt
  ) {}
  ```
* **Event Publication Boundary:** Must be published within the cancellation transaction so listeners can react consistently.

### 10.2 M5 Billing & Folio Module
* **`FolioAdjustmentPort` / `FolioBillingService`:**  
  Add a method to handle meal cancellation:
  ```java
  void reverseFolioChargeForMealOrder(Long mealOrderId, String reason, String cancelledBy);
  ```
* **`FnbFolioEventListener`:**  
  Add an `@EventListener` method listening to `MealOrderCancelledEvent` and delegating to `reverseFolioChargeForMealOrder`.
* **`FolioItemEntity` & Repository:**  
  Update entity and queries (`findByRoomBookingId`) to filter out voided items:
  ```java
  List<FolioItemEntity> findByRoomBookingIdAndIsVoidedFalse(Long roomBookingId);
  ```
* **`InvoiceCalculation` in `FolioBillingServiceImpl`:**  
  Ensure `calculateInvoice` calculates charges exclusively from active, non-voided line items.
* **`CheckoutServiceImpl`:**  
  Ensure pre-checkout validations properly account for un-invoiced balances after adjustments.

### 10.3 Database Schema & Migrations (`05_Development/database`)
* **Migration `V010` (Design Option A — Void Flag):**
  ```sql
  ALTER TABLE dbo.FolioItem ADD is_voided BIT NOT NULL CONSTRAINT DF_FolioItem_IsVoided DEFAULT 0;
  ALTER TABLE dbo.FolioItem ADD void_reason NVARCHAR(255) NULL;
  ALTER TABLE dbo.FolioItem ADD voided_at DATETIME2 NULL;
  ALTER TABLE dbo.FolioItem ADD voided_by NVARCHAR(100) NULL;
  CREATE NONCLUSTERED INDEX IX_FolioItem_ActiveCharges 
      ON dbo.FolioItem(room_booking_id, is_voided) 
      INCLUDE (charge_category, amount);
  ```
* **Migration `V010` (Design Option B — Contra Category):**
  ```sql
  ALTER TABLE dbo.FolioItem DROP CONSTRAINT CK_FolioItem_Category;
  ALTER TABLE dbo.FolioItem ADD CONSTRAINT CK_FolioItem_Category 
      CHECK (charge_category IN (N'PACKAGE', N'SPA', N'FNB', N'FNB_REVERSAL'));
  ```

### 10.4 M6 Administration, Security & Audit
* **Audit Logging:**  
  Record `VOID_FOLIO_CHARGE` in `dbo.AuditLog` with link to `source_meal_order_id` and the staff member who authorized the cancellation.
* **Security & Permissions:**  
  If manual adjustment is required, define permission `FOLIO_CHARGE_ADJUST` and restrict to `RECEPTIONIST` or `MANAGER`.

---

## 11. FINAL READINESS ASSESSMENT

| Metric / Dimension | Status | Notes |
|--------------------|--------|-------|
| **Operational Cancellation Discovery** | **COMPLETE** | Fully documented and verified against `FnbKdsOrderServiceImpl.java` |
| **Checkout Blocker Discovery** | **COMPLETE** | Fully verified against `BR-BILL-02`, `BR-09`, and `CheckoutServiceImpl.java` |
| **Financial Reversal Requirements** | **MISSING (UNSPECIFIED)** | No specification exists in SRS or Business Rules |
| **Database Schema Capability** | **BLOCKED** | Check constraints currently prohibit negative amounts; schema lacks void status |
| **System Integrity Risk** | **HIGH** | Unserved/cancelled meals are billed to customers at checkout |
| **Readiness for Code Implementation** | **BLOCKED** | Pending PO business decision on Questions 1–5 |
| **Overall Assessment** | `DISCOVERY_COMPLETE / AWAITING_PO_DECISION` | Formal handoff to Product Owner required |

### Next Steps:
1. Present this report to the Product Owner and Lead Architect.
2. Secure formal answers to the 5 Recommended Questions in Section 9.
3. Upon approval of the business policy, formulate **WP-1A.2 (F&B Cancellation & Financial Reversal Implementation Plan)** covering schema migration, domain events, and end-to-end integration tests.

---
*End of Report — HSWRMS-WP1A-1-DISCOVERY-20261030*

