# HSWRMS — M1 to M6 Integration Readiness Review Report

**Date:** 2026-10-31  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Target Branch:** `feature/hswrms-m1-m6-integration`  
**Authorized Remote:** `isp-origin` (`https://gitlab.com/manhnc2/fal26-isp392-is2005-g1.git`)  
**Audited Commit (HEAD):** `a053774c992472c7fb5aacb029e57ff1ffdb4380`  
**Phase Type:** Read-Only Comprehensive Evidence-Based Integration Readiness Audit  

---

## 1. Executive Summary

This report documents an end-to-end, code- and schema-backed integration readiness review of the **Heaven Stay Wellness Resort Management System (HSWRMS)** across all six core modules (**M1** Identity & Health Profile, **M2** Retreat Booking & Villa Inventory, **M3** Spa & Therapy Scheduling, **M4** Dietary F&B Management, **M5** Folio, Billing, Checkout, Reviews & Analytics, and **M6** System Administration, RBAC, Delegation & Audit) at commit `a053774c992472c7fb5aacb029e57ff1ffdb4380`.

### Overall Integration Verdict: **`PARTIAL` (Core Cross-Module Transactional Flows Integrated; Targeted P0/P1 Security & Contract Gaps Must Be Closed Before Production)**

1. **Database & Schema Integration (`PASS`):**
   - Canonical DDL (`05_Development/database/schema.sql`), H2 test DDL (`05_Development/backend/src/test/resources/schema.sql`), and Flyway migrations `V001` through `V015` are reconciled.
   - All cross-module primary/foreign keys (`User.user_id`, `CustomerProfile.customer_profile_id`, `RetreatBooking.retreat_booking_id`, `PhysicalVilla.villa_id`, `SpaSession.spa_session_id`, `MealOrder.meal_order_id`, `Folio.folio_id`, `Invoice.invoice_id`, `PaymentTransaction.transaction_id`) use `INT` in SQL Server DDL and are consistently bridged across JPA entities and JDBC adapters.
   - Filtered unique indexes (`UX_FolioItem_SourceBooking`, `UX_FolioItem_SourceSpaSession`, `UX_FolioItem_SourceMealOrder`) enforce database-level charge deduplication.

2. **Core Transactional Workflows (`PASS` on Workflows B & D-RBAC Core; `PARTIAL` on Workflows A, C, D-Endpoint Auth, and E):**
   - **Workflow A (Booking → Billing → Payment):** End-to-end lifecycle from `RetreatBooking` (`PENDING` → `CONFIRMED` via deposit → `CHECKED_IN` via receptionist villa assignment & residence declaration → `COMPLETED` via `CheckoutService.finalizeCheckout` or gateway callback) is wired to M5 `Folio`, `Invoice`, and `PaymentTransaction`. **However**, collaborator commits (`1fe60ba`/`dcff137`) opened `/api/v1/payments/vnpay/create-payment-url`, `/api/v1/invoices/*/payment-status`, and `/api/v1/billing/**/vietqr` with `.permitAll()` in `SecurityConfig.java` without ownership checks, and `CheckoutService.confirmGatewayPayment` auto-closes the stay (`COMPLETED` / `CLOSED`) upon final payment webhook even if `validateBillingGuard` (unsettled M3/M4 orders) was not re-checked at webhook settlement time.
   - **Workflow B (Booking → Spa Service → Folio):** Fully integrated (`PASS`). `SpaSessionService` validates active stay via `DefaultCustomerStayAdapter`, checks package inclusion (`dbo.RetreatPackageSpaTreatment`), posts extra Spa charges synchronously via `DefaultBillingAdapter` → `FolioBillingService.postFolioCharge` with `sourceSpaSessionId`, and persists transactional schedule history + durable outbox rows (`SpaScheduleHistory`, `SpaDispatchOutbox`) processed with atomic conditional claiming (`PROCESSING`).
   - **Workflow C (Core Operations → Housekeeping / Maintenance):** `PARTIAL`. Check-in (`ReceptionistOperationService.assignVillaAndCheckIn`), checkout (`CheckoutService.closeStayAndReleaseVilla`), and receptionist status updates (`PATCH /api/v1/receptionist/villas/{villaId}/status`) synchronize `PhysicalVilla.villaStatus` (`AVAILABLE` → `OCCUPIED` → `NEEDS_CLEANING` → `AVAILABLE` / `MAINTENANCE`). However, a secondary endpoint (`PATCH /api/v1/villas/{villaNumber}/status` in `VillaInventoryController.java`) bypasses the active-checked-in-booking guard (B14), and housekeeping is implemented as a villa status state machine rather than a separate staff task-assignment table.
   - **Workflow D (Identity / Authorization → All Modules):** `PARTIAL` (**Blocked for Production by P0-01**). While JWT authentication (`JwtAuthenticationFilter`), active-account verification, M6 screen-action RBAC (`@perm.has(...)` + `RightDelegation`), and M5 ownership evaluation (`@billingAccess`) are well-architected, `DevAuthController` (`GET /api/v1/auth/dev-token`) has **no `@Profile` restriction** and is exposed via `.permitAll()` in `SecurityConfig.java`, allowing any unauthenticated caller to mint an `ADMIN`/`SUPER` JWT in any environment.
   - **Workflow E (Reporting / Dashboard → Operational Modules):** `PARTIAL`. `AnalyticsService` (`/api/v1/analytics/revenue`, `/occupancy`, `/therapist-utilization`, `/export`), `AdminDashboardController` (`/api/v1/admin/dashboard`), and `FnbDashboardService` (`/api/v1/fnb/dashboard`) execute real database queries across M1–M6 tables. However, `SystemOverviewService` (`/api/v1/manager/dashboard`, `/api/v1/system-overview`, and `/api/v1/system-overview/police-residency-report/export`) returns hardcoded static widget numbers and a hardcoded 2-row CSV string instead of querying live tables, and `ManagerDashboardPage.tsx` reads KPIs from `FolioContext` instead of `billingApi`.

---

## 2. Git and Repository State Observed at Audit Start

| Property | Observed Value |
| :--- | :--- |
| **Working Directory** | `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules` |
| **Current Branch** | `feature/hswrms-m1-m6-integration` |
| **Local `HEAD`** | `a053774c992472c7fb5aacb029e57ff1ffdb4380` |
| **Remote `isp-origin` `HEAD`** | `a053774c992472c7fb5aacb029e57ff1ffdb4380` (in sync) |
| **Tracked Working Tree Status** | Clean (`0` staged changes, `0` unstaged tracked modifications) |
| **Preserved Untracked Paths** | `05_Development/database/generated/`<br>`06_Reports/PHASE_FINAL_REMEDIATION_COMMIT_AND_PUSH_REPORT.md`<br>`06_Reports/audit-output/backup_targeted_correction_20261029/`<br>`06_Reports/visual-evidence/` |

### Recent 15 Commits on `feature/hswrms-m1-m6-integration`
- `a053774` — `docs(hswrms): document post-release remediation and verification`
- `46e4666` — `test(m5): align billing safety tests with demo booking resolution`
- `7003947` — `fix(m3): reconcile session identifiers and harden outbox dispatch`
- `d930b75` — `Merge branch 'feature/hswrms-m1-m6-integration' of https://gitlab.com/manhnc2/fal26-isp392-is2005-g1 into feature/hswrms-m1-m6-integration`
- `dcff137` — `feat(m5): finalize S42 VNPay & VietQR payment integration, harden security and clean up workspace`
- `1fe60ba` — `feat(m5): harden S42 payment integration, isolate sandbox simulation, and enforce server-side amount validation`
- `901500c` — `feat(m5): synchronize S42 payment breakdown with S41 invoice and fix VNPay/VietQR integration`
- `875b0e6` — `feat(m5): implement real VNPay & VietQR integration for final payment screen (S42)`
- `125ca51` — `docs(audit): record WP-1B and M3 release verification and test evidence`
- `bc7de0a` — `test(frontend): add M3, M4, and M5 API contract and financial safety suites`
- `9a31932` — `feat(m3): complete BR-M3-10/13/14 recovery orchestration and durable dispatch outbox`
- `86de492` — `feat(m5): complete WP-1B adjustments, tax-inclusive credit notes, and refund settlement`
- `92e9522` — `feat(m2): complete booking operations, deposit workflows, and physical villa inventory`
- `7738930` — `chore(Audit): Add automated project compliance audit runner and full M1-M6 evaluation report`
- `dc65e91` — `feat(M5): Complete Folio, Billing, Checkout, Review & Manager Analytics implementation with full-stack integration`

---

## 3. Module-by-Module Implementation Matrix (M1–M6)

| Module | Scope & Primary Components | Backend Implementation | Database & Migrations | Frontend & API Consumption | Automated Test Evidence | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1: Identity, Access & Health Profile** | Guest registration, email OTP, login, Google/Facebook SSO, `CustomerProfile`, `HealthProfile`, `ConsentRecord`, `HealthDataDeletionRequest` | 6 controllers (`AuthController`, `SsoController`, `CustomerProfileController`, `HealthProfileController`, `ConsentController`, `HealthDataDeletionRequestController`), 10 services/adapters | `dbo.[User]`, `dbo.[Role]`, `dbo.UserRole`, `dbo.CustomerProfile`, `dbo.HealthProfile`, `dbo.ConsentRecord`, `dbo.HealthDataDeletionRequest`, `V003`–`V006` | `authApi.ts`, `customerProfileApi.ts`, `healthProfileApi.ts`, `consentApi.ts`, `CustomerContext.tsx` | 20 test classes, **123/123 PASS** | **`PASS`** |
| **M2: Retreat Booking & Villa Inventory** | Retreat packages, villa categories, physical villas, availability/pricing calculator, customer bookings, VNPay deposit, receptionist arrivals, residence declaration, check-in, walk-in | 6 controllers (`RetreatPackageController`, `VillaInventoryController`, `RetreatBookingController`, `ReceptionistOperationController`, `VNPayCallbackController`, `M2VNPaySimulationController`), 8 services | `dbo.RetreatPackage`, `dbo.VillaCategory`, `dbo.PhysicalVilla`, `dbo.RetreatBooking`, `dbo.ResidenceRecord`, `dbo.PaymentTransaction`, `V009`, `V012` | `retreatBookingApi.ts`, `OperationsContext.tsx`, `CustomerContext.tsx`, customer & receptionist pages | 7 test classes, **47/47 PASS** | **`PARTIAL`** *(see P1-03, P2-01)* |
| **M3: Spa & Therapy Scheduling** | Treatments, therapist qualifications, rooms, candidate engine (BR-M3-01..10), atomic reservation, reschedule/cancel, therapist recovery (BR-M3-13), audit history & durable outbox (BR-M3-14) | 4 controllers (`SpaTreatmentController`, `SpaBookingController`, `TherapistController`, `SpaMasterController`), 15 services/ports/schedulers/workers | `dbo.SpaTreatment`, `dbo.Therapist`, `dbo.TreatmentRoom`, `dbo.SpaSession`, `dbo.SpaScheduleHistory`, `dbo.SpaDispatchOutbox`, `V010`, `V015` | `spaApi.ts` (live REST), `SpaContext.tsx` (local context fallback for legacy widgets) | 10 test classes, **110/110 PASS** | **`PASS`** |
| **M4: Dietary F&B Management** | Menu catalog, allergen filtering, recipes, FEFO ingredient batches, daily meal selection ($0), a-la-carte ordering (auto-folio charge), KDS state machine, F&B dashboard | 7 controllers (`MenuController`, `FnbCustomerOrderController`, `MealOrderController`, `FnbKdsController`, `IngredientController`, `FnbDashboardController`, `RetreatPackageFnbController`), 9 services/listeners | `dbo.MenuItem`, `dbo.Ingredient`, `dbo.IngredientBatch`, `dbo.MenuItemIngredient`, `dbo.MealOrder`, `dbo.MealOrderItem`, `V007` | `fnbApi.ts` (live REST), `DiningContext.tsx` (hybrid live sync + offline catalog fallback) | 11 test classes, **100/100 PASS** | **`PASS`** |
| **M5: Folio, Billing, Checkout, Reviews & Analytics** | Folio auto-creation, charge posting (`PACKAGE`/`SPA`/`FNB`), adjustments & credit notes (WP-1B), refund settlement, invoice & PDF, VNPay/VietQR/Cash/Card checkout, reviews, analytics & Excel export | 9 controllers (`FolioBillingController`, `AdjustmentController`, `InvoiceController`, `CheckoutController`, `PaymentController`, `VnpayWebhookController`, `VNPaySimulationController`, `CustomerReviewController`, `AnalyticsController`), 11 services | `dbo.Folio`, `dbo.FolioItem`, `dbo.FolioAdjustmentRequest`, `dbo.CreditNote`, `dbo.Invoice`, `dbo.PaymentTransaction`, `dbo.CustomerReview`, `V002`, `V008`, `V011`, `V013`, `V014` | `billingApi.ts`, `bookingResolver.ts`, `FolioContext.tsx`, S40–S48 pages | 5 test classes, **116/116 PASS** + 48 frontend test suites (**159/159 PASS**) | **`PARTIAL`** *(see P0-02, P1-01, P1-02)* |
| **M6: System Administration & Governance** | Staff accounts, master data, business parameters, screen-action permission matrix (`RolePermission`), time-bound manager delegations (`RightDelegation`), tamper-evident `AuditLog`, unlock job | 8 controllers (`AdminStaffController`, `AdminParameterController`, `AdminPermissionController`, `AdminDelegationController`, `AdminAuditLogController`, `AdminMasterDataController`, `AdminDashboardController`, `DashboardController`), 10 services/jobs | `dbo.RolePermission`, `dbo.RightDelegation`, `dbo.SystemConfiguration`, `dbo.AuditLog`, `V001` | `adminApi.ts`, `staffAccountsApi.ts`, `parametersApi.ts`, `permissionMatrixApi.ts`, `delegationApi.ts`, `auditLogApi.ts`, `GovernanceContext.tsx` | 9 test classes, **60/60 PASS** | **`PARTIAL`** *(see P0-01, P1-04)* |

---

## 4. Cross-Module Workflow Matrix (Workflows A–E)

### Summary Matrix

| Workflow | Participating Modules | Producer / Consumer Seams | Classification | Blocking / Partial Factors |
| :--- | :--- | :--- | :--- | :--- |
| **A. Booking → Billing → Payment** | M1 ↔ M2 ↔ M5 ↔ M6 | `RetreatBookingService` / `VNPayDepositService` / `ReceptionistOperationService` → `FolioBillingService` → `CheckoutService` / `VNPayService` / `VietQrService` | **`PARTIAL`** | 1. Unauthenticated `permitAll()` on S42 payment URL, VietQR, and status endpoints (`P0-02`).<br>2. Gateway webhook settlement (`confirmGatewayPayment`) auto-closes stay without running `validateBillingGuard` (`P1-01`).<br>3. Booking reference format divergence across M2 (`HSW-BK-{id}`), M3 (`HSW-{id}`), and M5 (`HSW-{88000+id}`) (`P2-02`). |
| **B. Booking → Spa Service → Folio** | M1 ↔ M2 ↔ M3 ↔ M5 ↔ M6 | `DefaultCustomerStayAdapter` (M2/M1) + `DefaultTherapistHealthProjectionAdapter` (M1/M6) → `SpaSessionService` (M3) → `DefaultBillingAdapter` → `FolioBillingService.postFolioCharge` (M5) | **`PASS`** | Extra Spa sessions post synchronously to M5 `FolioItem` (`chargeCategory='SPA'`, `sourceSpaSessionId`), deduplicated via `UX_FolioItem_SourceSpaSession`. Wait-free outbox and `V015` `INT` alignment verified. *(Note: cancelling an extra Spa session after booking does not auto-void the FolioItem; requires Receptionist/Manager WP-1B adjustment — see `P2-03`.)* |
| **C. Core Operations → Housekeeping / Maintenance** | M2 ↔ M5 ↔ M6 | `ReceptionistOperationService` (Check-in: `OCCUPIED`) → `CheckoutService` (Checkout: `NEEDS_CLEANING`) → `ReceptionistOperationController` (`PATCH /api/v1/receptionist/villas/{id}/status`) | **`PARTIAL`** | 1. Secondary endpoint `PATCH /api/v1/villas/{villaNumber}/status` in `VillaInventoryController.java` mutates `villaStatus` without checking if an active `CHECKED_IN` booking occupies the villa (`P1-03`).<br>2. No dedicated Housekeeping Staff task-assignment table exists; housekeeping is modeled as villa status transitions (`P2-04`). |
| **D. Identity / Authorization → All Modules** | M1 ↔ M6 ↔ M2/M3/M4/M5 | `AuthService` / `SsoService` → `JwtAuthenticationFilter` → `SecurityConfig` → `@perm.has(...)` (`PermissionEvaluator`) & `@billingAccess` (`BillingAccessEvaluator`) | **`PARTIAL`** *(Blocked for Prod by `P0-01`)* | 1. `DevAuthController` (`GET /api/v1/auth/dev-token`) lacks `@Profile("dev")` and is `.permitAll()`, allowing unauthenticated privilege escalation to `ROLE_ADMIN` (`P0-01`).<br>2. `CustomerReviewController.getReviewByBookingId` does not enforce booking ownership (`P1-02`).<br>3. `/api/v1/receptionist/**` permits `ROLE_MANAGER` on write endpoints (`P2-05`). |
| **E. Reporting / Dashboard → Operational Modules** | M5 / M6 / M4 ↔ M1/M2/M3 | `AnalyticsService` (M5), `AdminDashboardController` (M6), `FnbDashboardService` (M4), `SystemOverviewService` (M6) | **`PARTIAL`** | `AnalyticsService`, `AdminDashboardController`, and `FnbDashboardService` query live tables, but `SystemOverviewService` (`/api/v1/manager/dashboard`, `/api/v1/system-overview`, `/api/v1/system-overview/police-residency-report/export`) returns hardcoded static metrics and a hardcoded 2-row CSV (`P1-04`), and `ManagerDashboardPage.tsx` reads from `FolioContext` instead of `billingApi` (`P2-06`). |

---

### Detailed Workflow Traceability

#### Workflow A — Booking → Billing → Payment
1. **Booking Creation & Deposit (M2):**
   - Customer creates a `PENDING` booking via `POST /api/v1/customer/bookings` (`RetreatBookingService.createBooking`), computing `totalEstimatedAmount` and 30% `depositAmount` via `VillaAvailabilityService.calculateBooking`.
   - Customer initiates VNPay deposit via `POST /api/v1/customer/bookings/{id}/vnpay-url` (`VNPayDepositService.generateDepositUrlWithResult`), persisting a `PENDING` `PaymentTransaction` (`payment_type='DEPOSIT'`, `retreat_booking_id=id`, `invoice_id=NULL`).
   - Upon callback to `GET /api/v1/payments/vnpay-ipn` or `/vnpay-return` (`VNPayCallbackController`), `VNPayDepositService.processIpn` verifies HMAC-SHA512, locks the transaction via `findByReferenceForUpdate`, marks it `SUCCESSFUL`, and calls `RetreatBookingService.confirmBookingDeposit` to transition `RetreatBooking.bookingStatus` from `PENDING` to `CONFIRMED`.
2. **Check-In & Residence Declaration (M2 ↔ M1):**
   - Receptionist records mandatory residence declaration (`POST /api/v1/receptionist/check-in/{bookingId}/residence` → `dbo.ResidenceRecord`) and assigns a physical villa (`POST /api/v1/receptionist/check-in/{bookingId}/assign-villa`).
   - `ReceptionistOperationService.assignVillaAndCheckIn` verifies `bookingStatus == 'CONFIRMED'`, `ResidenceRecord` existence, and `CustomerIdentityPort.hasHealthProfile` (or explicit `healthProfileConfirmed` override), locks `PhysicalVilla` (`findByIdForUpdate`), sets `villa.villaStatus = 'OCCUPIED'`, and sets `booking.bookingStatus = 'CHECKED_IN'`.
3. **Folio & Invoice Generation (M5 ↔ M2/M3/M4):**
   - When `GET /api/v1/billing/folios/{bookingId}` or `FolioBillingService.postFolioCharge` is invoked, `FolioBillingService.createDefaultFolioForBooking` lazily creates the `FolioEntity` with an initial `PACKAGE` `FolioItemEntity` (`source_booking_id = bookingId`) and syncs `totalPaid` from `sumSuccessfulDepositsForBooking(bookingId)`.
   - `POST /api/v1/billing/folios/{bookingId}/invoice` (`generateConsolidatedInvoice`) acquires a pessimistic write lock on `Folio`, enforces `validateBillingGuard(bookingId)` (blocking if any M3 `SpaSession` is `SCHEDULED`/`RESCHEDULING` or any M4 `MealOrder` is `PENDING`/`PREPARING`/`READY`), deducts paid deposits from `packageCharges`, applies 8% VAT (`app.billing.vat-rate`) to `spaCharges + fnbCharges`, and creates/refreshes the `InvoiceEntity`.
4. **Final Payment & Checkout Closure (M5 ↔ M2):**
   - Front-desk/customer pays via `POST /api/v1/billing/invoices/{invoiceId}/pay` (`CheckoutService.processPayment`) or online via `POST /api/v1/payments/vnpay/create-payment-url` (`VNPayService.createPaymentUrl`) and VietQR (`GET /api/v1/billing/invoices/{invoiceId}/vietqr`).
   - Asynchronous settlement via `VnpayWebhookController` (`/api/v1/commerce/payment/webhook/vnpay` or `/vietqr`) or `GET /api/v1/payments/vnpay/verify-return` invokes `CheckoutService.confirmGatewayPayment(txnRef, isSuccess)` with pessimistic locking (`findByTransactionReferenceWithLock`) and over-settlement protection.
   - `POST /api/v1/billing/invoices/{invoiceId}/finalize-checkout` (`CheckoutService.finalizeCheckout`) locks `Folio` and `RetreatBooking`, checks `validateBillingGuard` and `remainingBalance == 0`, and calls `closeStayAndReleaseVilla` to set `Invoice = 'PAID'`, `Folio = 'CLOSED'`, `RetreatBooking = 'COMPLETED'`, and `PhysicalVilla = 'NEEDS_CLEANING'`.

#### Workflow B — Booking → Spa Service → Folio
1. **Stay & Package Inclusion Resolution (M3 ↔ M2/M1):**
   - `DefaultCustomerStayAdapter` queries `dbo.RetreatBooking`, `dbo.CustomerProfile`, `dbo.[User]`, and `dbo.RetreatPackage` to resolve active stays (`CONFIRMED` or `CHECKED_IN`) and checks `dbo.RetreatPackageSpaTreatment` (`isTreatmentIncludedInPackage`).
2. **Atomic Reservation & Charge Posting (M3 ↔ M5):**
   - `SpaSessionService.confirmReservation` locks `Therapist` and `TreatmentRoom`, verifies qualification (`dbo.TherapistTreatmentQualification`), room compatibility (`dbo.TreatmentRoomCompatibility`), 15-minute buffer, and non-overlap.
   - If `!isIncluded`, `SpaSessionService` (lines 228–235) invokes `DefaultBillingAdapter.recordExtraSpaCharge(saved.getSpaSessionId(), resolvedBookingId, treatment.getBasePrice(), "Extra Spa: " + treatment.getTreatmentName())`, which calls `FolioBillingService.postFolioCharge` with `chargeCategory = "SPA"` and `sourceSpaSessionId`.
3. **Health Projection & Outcome Recording (M3 ↔ M1/M6):**
   - `DefaultTherapistHealthProjectionAdapter` projects only customer first name and `hp.treatment_safety_notes` (excluding unrelated medical/dietary fields per Decree 13/2023/NĐ-CP) and logs `DATA_HEALTH_TREATMENT` access to M6 `AuditLogService`.
   - `TherapistController.recordOutcome` (`POST /api/v1/therapist/sessions/{id}/outcome`) transitions `SpaSession` to `COMPLETED` or `NO_SHOW`, clearing the M5 `validateBillingGuard` for checkout.

#### Workflow C — Core Operations → Housekeeping / Maintenance
1. **State Transitions:**
   - Check-in (`ReceptionistOperationService.assignVillaAndCheckIn` & `createWalkInBooking`): transitions `PhysicalVilla.villaStatus` from `AVAILABLE` → `OCCUPIED`.
   - Checkout (`CheckoutService.closeStayAndReleaseVilla`): transitions `PhysicalVilla.villaStatus` from `OCCUPIED` → `NEEDS_CLEANING`.
   - Housekeeping / Maintenance (`ReceptionistOperationService.updateVillaStatus` via `PATCH /api/v1/receptionist/villas/{villaId}/status`): transitions `NEEDS_CLEANING` → `AVAILABLE` or `MAINTENANCE` (guarded against mutating a villa occupied by an active `CHECKED_IN` booking).
2. **Gaps Identified:**
   - `VillaInventoryController.updateVillaStatus` (`PATCH /api/v1/villas/{villaNumber}/status`, lines 71–83) directly saves `villa.setVillaStatus(newStatus.toUpperCase())` without checking for an active `CHECKED_IN` booking.
   - There is no separate `HousekeepingTask` entity/table in `schema.sql`; housekeeping status (`inspected` / `in_progress`) on the frontend (`OperationsContext.tsx` line 84) is derived from `PhysicalVilla.villaStatus`.

---

## 5. API Contract and Integration Findings

| ID | Endpoint / Adapter | Producer (Backend) | Consumer (Frontend / Caller) | Contract Finding | Severity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **API-01** | `VillaInventoryController.createVilla` & `createVillaCategory` ([VillaInventoryController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/controller/VillaInventoryController.java#L169-L246)) | `VillaInventoryController` | Admin Master Data / Inventory UI | Methods `createVilla` (line 170) and `createVillaCategory` (line 223) have `@PreAuthorize("@perm.has('S12','C')")` but are **missing `@PostMapping("/villas")` and `@PostMapping("/villa-categories")` annotations**. Spring MVC never registers these two handler methods as HTTP routes. (Note: `AdminMasterDataController` provides `/api/v1/admin/master-data/villa-categories` and `/physical-villas`, leaving dead unmapped methods in `VillaInventoryController`.) | **P2** |
| **API-02** | Booking Reference String Formatting | M2 (`HSW-BK-{id}`), M3 (`HSW-{id}`), M5 (`HSW-{88000+id}`) | Frontend `OperationsContext`, `FolioContext`, `bookingResolver.ts` | Three different display reference formats are generated for the same `retreatBookingId`:<br>- M2 `ReceptionistOperationService` (line 562): `"HSW-BK-" + id`<br>- M3 `DefaultCustomerStayAdapter` (line 32): `"HSW-" + id`<br>- M5 `FolioBillingService` (line 1049) & `CheckoutService` (line 486): `"HSW-" + (88000 + id)`<br>`bookingResolver.ts` resolves numeric IDs and known demo refs (`HSW-88192`, `HSW-88001`, `BK-01` → `1`), but arbitrary `"HSW-BK-5"` or `"HSW-88005"` strings passed to `resolveNumericBookingId("HSW-88005")` return `null` unless numeric `bookingId` is passed. | **P2** |
| **API-03** | Extra Spa Session Cancellation vs Folio Item Lifecycle ([SpaSessionService.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaSessionService.java#L228-L235), lines 302–341) | `SpaSessionService.cancelSession` (M3) | `FolioBillingService` (M5) | When an extra (non-package) Spa session is booked, `confirmReservation` immediately posts a `SPA` `FolioItem` to M5. If the customer later cancels that session via `POST /api/v1/spa/sessions/{id}/cancel` (`cancelSession`), `SpaSession` transitions to `CANCELLED`, but `BillingPort` has no `voidExtraSpaCharge(sessionId)` method. The `FolioItem` remains active on the guest's Folio unless manually voided via a WP-1B adjustment request. | **P2** |
| **API-04** | M4 A-la-Carte Order Cancellation vs Folio Item Lifecycle | `MealOrderService` (M4) ↔ `FnbFolioEventListener` (M5) | `FolioBillingService` (M5) | `MealOrderService.placeAlaCarteOrder` publishes `AlaCarteOrderPlacedEvent` (`TransactionPhase.BEFORE_COMMIT`), which `FnbFolioEventListener` consumes synchronously to post an `FNB` `FolioItem` (`postFolioChargeIdempotent`). Because `MealOrderService` does not expose a customer cancellation endpoint once placed (and `FolioBillingService.postFolioCharge` rejects `CANCELLED` orders), any post-placement void is handled via M5 WP-1B `AdjustmentService`. | **Info (Verified)** |

---

## 6. Database and Shared-Entity Findings

1. **Canonical Schema & Flyway Migration Chain (`V001`–`V015`):**
   - `05_Development/database/schema.sql` and `05_Development/backend/src/test/resources/schema.sql` contain 29 canonical tables with zero duplicate `CREATE TABLE` declarations.
   - `V015__m3_reconcile_spa_session_identifier_types.sql` reconciled `dbo.SpaScheduleHistory.session_id` and `dbo.SpaDispatchOutbox.session_id` from `BIGINT` to `INT` to match `dbo.SpaSession.spa_session_id INT IDENTITY(1,1)` and re-added `FK_SpaScheduleHistory_Session` and `FK_SpaDispatchOutbox_Session`.
2. **Java `Long` vs SQL `INT` Bridging:**
   - Several M3 and M5 JPA entities (`SpaSession.spaSessionId`, `SpaScheduleHistory.historyId`/`sessionId`, `SpaDispatchOutbox.outboxId`/`sessionId`, `FolioEntity.folioId`, `FolioItemEntity.folioItemId`/`sourceBookingId`/`sourceSpaSessionId`/`sourceMealOrderId`, `InvoiceEntity.invoiceId`, `PaymentTransactionEntity.transactionId`, `CustomerReviewEntity.reviewId`) use `java.lang.Long` in Java while the underlying SQL Server columns are `INT`.
   - Hibernate 6 bridges `Long` ↔ `INTEGER` JDBC binds, and `M2SchemaCompatibilityTest` + `SpaDispatchOutboxTest` + `M5BillingAndCheckoutTests` pass under H2 `MODE=MSSQLServer`. However, if Hibernate `ddl-auto: validate` is ever enabled against physical SQL Server, Hibernate's schema validator flags `Long` (expected `BIGINT`) vs SQL `INT` unless `@Column(columnDefinition = "INT")` or `Integer` types are used. Currently `application.yml` uses `ddl-auto: none`, so runtime execution is unaffected (`P3-01`).
3. **Dual JPA Entities Mapped to `dbo.PaymentTransaction` and `dbo.[User]`:**
   - **M1 Identity (`User` vs `UserAccount`):** Both `com.heavenstay.hswrms.m1identity.entity.User` and `UserAccount` map to `dbo.[User]`. They operate on disjoint repositories (`UserRepository` vs `UserAccountRepository`) without conflict.
   - **M2 vs M5 (`PaymentTransaction` vs `PaymentTransactionEntity`):**
     - `com.heavenstay.hswrms.m2booking.entity.PaymentTransaction` maps `dbo.PaymentTransaction` for M2 deposit transactions (`retreat_booking_id` populated, `invoice_id` omitted).
     - `com.heavenstay.hswrms.m5billing.entity.PaymentTransactionEntity` maps `dbo.PaymentTransaction` for M5 invoice and deposit queries (`retreatBooking` `@ManyToOne` and `invoice` `@ManyToOne`).
     - Both adhere to `CK_PaymentTransaction_ReferenceScope` (`(retreat_booking_id IS NOT NULL AND invoice_id IS NULL) OR (retreat_booking_id IS NULL AND invoice_id IS NOT NULL)`).

---

## 7. Authentication and Authorization Findings

| ID | Component & Location | Observation | Impact | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **SEC-01 (P0-01)** | `DevAuthController` ([DevAuthController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/common/api/DevAuthController.java#L13-L43)) & `SecurityConfig` ([SecurityConfig.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java#L101)) | `GET /api/v1/auth/dev-token?role=ALL` is whitelisted with `.permitAll()` in `SecurityConfig.java` line 101, and `DevAuthController` has **no `@Profile({"dev", "local", "test"})` annotation** (unlike `DevAccountBootstrap`, `VNPaySimulationController`, and `M2VNPaySimulationController`). Calling `GET /api/v1/auth/dev-token?role=ADMIN` or `role=ALL` mints a valid signed JWT for `userId=1` with `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_RECEPTIONIST`, and `ROLE_CUSTOMER`. | Complete authentication and RBAC bypass in any environment if deployed without profile isolation on `DevAuthController`. | **P0** |
| **SEC-02 (P0-02)** | `SecurityConfig` ([SecurityConfig.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java#L125-L128)), `PaymentController` ([PaymentController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/PaymentController.java#L27-L56)), `CheckoutController` ([CheckoutController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CheckoutController.java#L44-L63)) | Collaborator commits `1fe60ba`/`dcff137` added `.permitAll()` to:<br>- `POST /api/v1/payments/vnpay/create-payment-url`<br>- `GET /api/v1/payments/status/**`<br>- `GET /api/v1/invoices/*/payment-status`<br>- `GET /api/v1/billing/invoices/*/vietqr` & `/checkout/vietqr/*`<br>- `GET /api/v1/billing/deposit/*/vietqr` & `/checkout/deposit/*/vietqr`<br>- `GET /api/v1/billing/payments/transactions/*/status`<br>Neither `PaymentController` nor `CheckoutController` has `@PreAuthorize` on these endpoints. | Unauthenticated callers can enumerate invoice/booking payment statuses, generate VietQR codes, or call `POST /api/v1/payments/vnpay/create-payment-url` for any `invoiceId`/`bookingId` (which mutates `invoiceStatus` to `ISSUED` and marks prior `PENDING` VNPay transactions `FAILED`). | **P0** |
| **SEC-03 (P1-02)** | `CustomerReviewController.getReviewByBookingId` ([CustomerReviewController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CustomerReviewController.java#L35-L43)) & `ReviewService` ([ReviewService.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/ReviewService.java#L80-L86)) | `GET /api/v1/customer/reviews/booking/{bookingId}` uses `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or hasRole('CUSTOMER')")` and passes `userId` to `ReviewService.getReviewByBookingId(bookingId, authenticatedUserId)`, which ignores `authenticatedUserId` and does not verify booking ownership. | Horizontal privilege escalation (IDOR): any authenticated `ROLE_CUSTOMER` can read reviews submitted for another customer's `bookingId`. | **P1** |
| **SEC-04 (P2-05)** | `SecurityConfig` ([SecurityConfig.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java#L108)) & `ReceptionistOperationController` | `.requestMatchers("/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN")` grants `ROLE_MANAGER` access to all `/api/v1/receptionist/**` endpoints, and `ReceptionistOperationController` has no method-level `@PreAuthorize` on `POST`/`PATCH` methods. | `ROLE_MANAGER` can invoke receptionist write operations (`POST /walk-in`, `POST /check-in/{id}/assign-villa`, `POST /bookings/{id}/cancel`, `PATCH /villas/{id}/status`) despite SRS specifying Manager has read-only operational visibility. | **P2** |
| **SEC-05 (P2-07)** | `JwtAuthenticationFilter.isAccountActive` ([JwtAuthenticationFilter.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/security/JwtAuthenticationFilter.java#L37-L44)) | `userAccountRepository.findById(userId).map(a -> UserAccount.ACTIVE.equals(a.getAccountStatus())).orElse(true)` returns `true` when `userId` is not found in `dbo.[User]`. (This was written to allow unit/mock tests that do not seed `dbo.[User]`, whereas `PermissionEvaluator` in M6 fails closed with `.orElse(false)`.) | On endpoints that do not go through `@perm.has(...)`, a validly signed token for a deleted/non-existent `userId` (e.g., from `DevAuthController`) is accepted as active. | **P2** |

---

## 8. Frontend/Backend Integration Findings

1. **Production Build & Type-Check (`PASS`):**
   - `npx tsc -b` and `npx vite build` succeed cleanly (`2,726 modules transformed`, exit code `0`).
2. **Router & RoleGuard Alignment (`PASS`):**
   - `05_Development/frontend/src/app/router/index.tsx` protects all role-specific routes (`customer`, `receptionist`, `therapist`, `fnb`, `manager`, `admin`) via `<RoleGuard allowedRoles={[...]}>` and delegates `/admin/business-params`, `/admin/audit-logs`, and `/admin/system-overview` to `manager` via `requiredDelegatedCapability`.
3. **Hybrid Context vs Live REST Client Architecture (`PARTIAL`):**
   - **Live API Modules:**
     - **M1 & M2:** `CustomerContext.tsx` and `OperationsContext.tsx` fetch directly from `/api/v1/customers/me/profile`, `/api/v1/customer/bookings`, `/api/v1/receptionist/villas`, and `/api/v1/receptionist/arrivals`.
     - **M3:** `features/m3-spa/api/spaApi.ts` calls live `/api/v1/spa/*` and `/api/v1/therapist/*` endpoints. However, `context/SpaContext.tsx` still initializes from `INITIAL_TREATMENTS`, `INITIAL_ROOMS`, `INITIAL_THERAPISTS`, and `INITIAL_SPA_SESSIONS` in `src/data/mockSpa.ts` and is consumed by `FolioContext.tsx` when building local fallback folios.
     - **M4:** `features/m4-fnb/api/fnbApi.ts` calls live `/api/v1/fnb/*` endpoints, and `DiningContext.tsx` synchronizes menu pricing/availability (`refreshMenu`) and ingredient stock (`refreshInventory`) from the backend while keeping `MOCK_MENU_ITEMS` as an offline fallback.
     - **M5:** `FinalPaymentPage.tsx`, `ConsolidatedInvoicePage.tsx`, `RevenueDashboardPage.tsx`, `OccupancyReportPage.tsx`, and `TherapistUtilizationReportPage.tsx` call `billingApi.*` (`/api/v1/billing/*`, `/api/v1/payments/*`, `/api/v1/analytics/*`) first and fall back to `FolioContext.tsx` only on network/offline errors.
     - **Gap (`P2-06`):** `ManagerDashboardPage.tsx` ([ManagerDashboardPage.tsx](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/pages/manager/ManagerDashboardPage.tsx#L20-L26)) reads `revenue`, `occupancy`, and `therapists` directly from `useFolio()` (local `FolioContext`) without calling `billingApi.getRevenueAnalytics()`, `billingApi.getOccupancyAnalytics()`, or `billingApi.getTherapistUtilization()`.

---

## 9. Test Evidence Matrix

All test suites below were verified against the repository codebase on `feature/hswrms-m1-m6-integration` using isolated in-memory H2 (`MODE=MSSQLServer`) for backend suites and Node `tsx --test` / Vite for frontend suites. Physical SQL Server databases (`HSWRMS` and `HSWRMS_TEST`) were **not** touched.

| Test Scope / Suite | Execution Mode | Classes / Suites | Total Tests | Passed | Failed / Errors | Skipped | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **M1 Backend Suite** (`com.heavenstay.hswrms.m1identity.**`) | H2 (`test` profile) — Surefire Verified | 20 classes | 123 | 123 | 0 | 0 | **`PASS`** |
| **M2 Backend Suite** (`com.heavenstay.hswrms.m2booking.**`) | H2 (`test` profile) — Executed in Session (`M2SchemaCompatibilityTest`, `VillaAvailabilityServiceTest`) + Surefire | 7 classes | 47 | 47 | 0 | 0 | **`PASS`** |
| **M3 Backend Suite** (`com.heavenstay.hswrms.m3spa.**`) | H2 (`test` profile) — Executed in Session (`SpaDispatchOutboxTest`, `SpaScheduleHistoryTest`, `SpaRecoverySchedulerTest`, `TherapistRecoveryOrchestrationTest`) + Surefire | 10 classes | 110 | 110 | 0 | 0 | **`PASS`** |
| **M4 Backend Suite** (`com.heavenstay.hswrms.m4fnb.**`) | H2 (`test` profile) — Surefire Verified | 11 classes | 100 | 100 | 0 | 0 | **`PASS`** |
| **M5 Backend Suite** (`com.heavenstay.hswrms.m5billing.**`) | H2 (`test` profile) — Executed in Session (`AdjustmentServiceTest`, `RefundSettlementLifecycleTest`, `FnbFolioIntegrationTest`, `M5BillingAndCheckoutTests`, `VietQrAndPaymentWebhookTest`) | 5 classes | 116 | 116 | 0 | 0 | **`PASS`** |
| **M6 Backend Suite** (`com.heavenstay.hswrms.m6admin.**`) | H2 (`test` profile) — Surefire Verified | 9 classes | 60 | 60 | 0 | 0 | **`PASS`** |
| **Common / Security / Config Validator Suite** | H2 (`test` profile) — Surefire Verified | 7 classes | 113 | 113 | 0 | 0 | **`PASS`** |
| **Live SQL Server Opt-In Smoke Tests** (`SqlServerJdbcSmokeTest`, `SqlServerSpringBootContextTest`) | Opt-in (`-Dhswrms.sqlserver.test.enabled=true`) — Disabled by default per safety rules | 2 classes | 10 | 0 | 0 | 10 | **`NOT VERIFIED`** *(Live SQL Server prohibited)* |
| **Frontend Contract & Safety Tests** (`npx tsx --test "src/**/*.test.ts"`) | Node `tsx` runner — Executed at `a053774` | 48 suites | 159 | 159 | 0 | 0 | **`PASS`** |
| **Frontend Production Build** (`npx tsc -b ; npx vite build`) | TypeScript + Vite — Executed at `a053774` | 2,726 modules | 1 build | 1 | 0 | 0 | **`PASS`** |
| **TOTAL EXECUTED** | **H2 + Node + Vite** | **117 suites** | **828** | **828** | **0** | **10 (opt-in DB)** | **`PASS`** |

---

## 10. `PASS` / `PARTIAL` / `BLOCKED` / `NOT VERIFIED` Summary

| Area / Item | Classification | Justification |
| :--- | :--- | :--- |
| **Database Schema & Flyway Migrations (`V001`–`V015`)** | **`PASS`** | Canonical `schema.sql`, test `schema.sql`, and `V001`–`V015` have consistent `INT` PK/FK types, no duplicate DDL, and filtered unique deduplication indexes. |
| **Module M1 (Identity, SSO, Profile, Health Profile, Consent)** | **`PASS`** | End-to-end registration, OTP, login, SSO, consent gating, and health profile anonymization implemented and passing 123/123 tests. |
| **Module M2 (Retreat Booking, Deposit, Check-in, Villa Inventory)** | **`PARTIAL`** | Core booking, deposit, residence declaration, and check-in flows work end-to-end; marked `PARTIAL` due to `PATCH /api/v1/villas/{villaNumber}/status` bypassing the active check-in guard (`P1-03`) and unmapped `createVilla`/`createVillaCategory` methods in `VillaInventoryController` (`P2-01`). |
| **Module M3 (Spa Scheduling, Recovery, Audit & Outbox)** | **`PASS`** | Candidate engine, atomic reservation, package inclusion, M5 Folio charge posting, BR-M3-10/13/14 recovery, and atomic `PROCESSING` outbox claim pass 110/110 tests. |
| **Module M4 (Dietary F&B, FEFO Inventory, KDS, Folio Event)** | **`PASS`** | Allergen-aware menu, FEFO batch deduction, daily meal ($0) vs a-la-carte (`BEFORE_COMMIT` Folio posting), and KDS workflow pass 100/100 tests. |
| **Module M5 (Folio, Billing, Adjustments, Checkout, Analytics)** | **`PARTIAL`** | Financial math, WP-1B adjustments/credit notes, refund lifecycle, PDF/Excel export, and analytics queries pass 116/116 backend and 159/159 frontend tests; marked `PARTIAL` due to `.permitAll()` on S42 payment endpoints (`P0-02`), webhook auto-closure skipping `validateBillingGuard` (`P1-01`), and missing ownership check on `GET /api/v1/customer/reviews/booking/{bookingId}` (`P1-02`). |
| **Module M6 (Admin, RBAC, Delegation, Audit, Overview)** | **`PARTIAL`** | Staff accounts, parameters, permission matrix, delegations, and tamper-evident audit logs pass 60/60 tests; marked `PARTIAL` due to unprofiled `DevAuthController` (`P0-01`) and hardcoded metrics/CSV in `SystemOverviewService` (`P1-04`). |
| **Workflow A (Booking → Billing → Payment)** | **`PARTIAL`** | Functional path works end-to-end; needs auth protection on S42 payment endpoints (`P0-02`) and `validateBillingGuard` check during gateway webhook auto-checkout (`P1-01`). |
| **Workflow B (Booking → Spa Service → Folio)** | **`PASS`** | Fully integrated across M1, M2, M3, M5, and M6 with database deduplication (`UX_FolioItem_SourceSpaSession`). |
| **Workflow C (Core Operations → Housekeeping / Maintenance)** | **`PARTIAL`** | Check-in and checkout synchronize `PhysicalVilla.villaStatus`, but `VillaInventoryController.updateVillaStatus` bypasses the B14 occupied guard (`P1-03`). |
| **Workflow D (Identity / Authorization → All Modules)** | **`PARTIAL`** | Core JWT + `@perm` + `@billingAccess` works, but unprofiled `DevAuthController` (`P0-01`) and `.permitAll()` S42 endpoints (`P0-02`) must be restricted before production. |
| **Workflow E (Reporting / Dashboard → Operational Modules)** | **`PARTIAL`** | M5 `AnalyticsService`, M6 `AdminDashboardController`, and M4 `FnbDashboardService` query live data, whereas M6 `SystemOverviewService` (`S54`/`S55`/Police CSV) returns static hardcoded values (`P1-04`). |
| **Live SQL Server (`HSWRMS` / `HSWRMS_TEST`) & External Gateways** | **`NOT VERIFIED`** | Prohibited by safety constraints or requires external live credentials (see Section 14). |

---

## 11. Prioritized Defect and Risk Register (P0 / P1 / P2 / P3)

### P0 — Critical Security & Production Blockers

1. **`P0-01`: Unprofiled `DevAuthController` Exposed via `.permitAll()` Allows Unauthenticated Privilege Escalation to `ADMIN`**
   - **Location:** [DevAuthController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/common/api/DevAuthController.java#L13-L43), [SecurityConfig.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java#L101)
   - **Evidence:** `DevAuthController` has no `@Profile` annotation, and `/api/v1/auth/dev-token` is `.permitAll()`. Calling `GET /api/v1/auth/dev-token?role=ALL` returns a signed JWT with `ROLE_ADMIN`, `ROLE_MANAGER`, `ROLE_RECEPTIONIST`, and `ROLE_CUSTOMER`.
   - **Remediation:** Annotate `DevAuthController` with `@Profile({"dev", "local", "test"})` and `@ConditionalOnProperty(name = "app.auth.dev-token-enabled", havingValue = "true", matchIfMissing = false)`.

2. **`P0-02`: S42 Payment Initiation, VietQR Generation, and Invoice Payment Status Endpoints Exposed with `.permitAll()`**
   - **Location:** [SecurityConfig.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java#L125-L128), [PaymentController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/PaymentController.java#L27-L56), [CheckoutController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CheckoutController.java#L44-L63)
   - **Evidence:** `.requestMatchers(HttpMethod.POST, "/api/v1/payments/vnpay/create-payment-url").permitAll()` and `.requestMatchers(HttpMethod.GET, "/api/v1/payments/status/**", "/api/v1/invoices/*/payment-status", "/api/v1/billing/invoices/*/vietqr", "/api/v1/billing/deposit/*/vietqr", ...).permitAll()` allow unauthenticated callers to mutate invoice status to `ISSUED`, cancel prior `PENDING` VNPay transactions, and read payment status/QR payloads for arbitrary invoice/booking IDs.
   - **Remediation:** Remove `.permitAll()` from customer/staff payment initiation and status endpoints (keep `.permitAll()` **only** on cryptographic gateway callbacks `/api/v1/commerce/payment/webhook/**`, `/api/v1/payments/vnpay/verify-return`, `/api/v1/payments/vnpay-ipn`, `/api/v1/payments/vnpay-return`), and add `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessInvoice(#invoiceId, authentication)")` (or `canAccessBooking`).

---

### P1 — High-Priority Functional & Cross-Module Integrity Gaps

3. **`P1-01`: Gateway Webhook Settlement (`confirmGatewayPayment`) Auto-Closes Stay Without Checking `validateBillingGuard`**
   - **Location:** [CheckoutService.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/CheckoutService.java#L345-L353)
   - **Evidence:** When an online payment callback succeeds (`confirmGatewayPayment`), lines 349–352 execute:
     ```java
     applySuccessfulPayment(invoice, folio, booking, tx.getAmountPaid());
     if ("PAID".equalsIgnoreCase(invoice.getInvoiceStatus())) {
         closeStayAndReleaseVilla(invoice, folio, booking);
     }
     ```
     Unlike `processPayment` (line 106) and `finalizeCheckout` (line 283), `confirmGatewayPayment` does not check `folioBillingService.validateBillingGuard(booking.getRetreatBookingId())` before calling `closeStayAndReleaseVilla`. If a guest placed an a-la-carte order or scheduled a Spa session while the payment URL was open, the stay is marked `COMPLETED` and the Folio `CLOSED` while unsettled service orders are still in flight.
   - **Remediation:** In `confirmGatewayPayment`, always settle the `Invoice` and `Folio` payment state (`PAID`), but only auto-invoke `closeStayAndReleaseVilla` if `validateBillingGuard` passes without exception (otherwise leave final departure closure to `POST /api/v1/billing/invoices/{invoiceId}/finalize-checkout`).

4. **`P1-02`: Missing Booking Ownership Check on `GET /api/v1/customer/reviews/booking/{bookingId}`**
   - **Location:** [CustomerReviewController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CustomerReviewController.java#L35-L43), [ReviewService.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/ReviewService.java#L80-L86)
   - **Evidence:** `ReviewService.getReviewByBookingId(Long bookingId, Long authenticatedUserId)` accepts `authenticatedUserId` but never validates ownership, allowing any authenticated `ROLE_CUSTOMER` to read reviews for other customers' bookings.
   - **Remediation:** Enforce `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessBooking(#bookingId, authentication)")` on `CustomerReviewController.getReviewByBookingId`.

5. **`P1-03`: `PATCH /api/v1/villas/{villaNumber}/status` Bypasses Active Checked-In Booking Guard (B14)**
   - **Location:** [VillaInventoryController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/controller/VillaInventoryController.java#L71-L83)
   - **Evidence:** `ReceptionistOperationService.updateVillaStatus` (`PATCH /api/v1/receptionist/villas/{villaId}/status`, lines 379–383) blocks changing the status of a villa occupied by an active `CHECKED_IN` booking. However, `VillaInventoryController.updateVillaStatus` (`PATCH /api/v1/villas/{villaNumber}/status`) directly mutates `villa.setVillaStatus(newStatus.toUpperCase())` without checking `bookingRepository.existsByAssignedVilla_VillaIdAndBookingStatus(villa.getVillaId(), "CHECKED_IN")`.
   - **Remediation:** Delegate `VillaInventoryController.updateVillaStatus` to `ReceptionistOperationService.updateVillaStatus`.

6. **`P1-04`: `SystemOverviewService` Returns Hardcoded Static Dashboard Metrics and Hardcoded 2-Row Police Residency CSV**
   - **Location:** [SystemOverviewService.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/SystemOverviewService.java#L65-L131)
   - **Evidence:** `getManagerDashboard` returns hardcoded `"78.5%"`, `14`, `"82.0%"`, `"4.85 / 5.0"`; `getSystemOverview` returns hardcoded `Map.of("Vacant", 12, "Occupied", 28, ...)`; `generatePoliceResidencyReportCsv` returns a hardcoded 2-row CSV string (`101,Vinh Pham...`, `102,John Smith...`) instead of querying `dbo.ResidenceRecord` via the injected `JdbcTemplate`.
   - **Remediation:** Wire `SystemOverviewService` to query live counts from `dbo.PhysicalVilla`, `dbo.RetreatBooking`, `dbo.SpaSession`, `dbo.CustomerReview`, and `dbo.ResidenceRecord`.

---

### P2 — Medium-Priority Contract, Lifecycle & Frontend Synchronization Findings

7. **`P2-01`: Missing `@PostMapping` Annotations on `VillaInventoryController.createVilla` and `createVillaCategory`**
   - **Location:** [VillaInventoryController.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/controller/VillaInventoryController.java#L169-L246)
   - **Remediation:** Add `@PostMapping("/villas")` and `@PostMapping("/villa-categories")` (or remove if superseded by `AdminMasterDataController`).

8. **`P2-02`: Inconsistent Display Booking Reference Prefixes Across Modules (`HSW-BK-{id}` vs `HSW-{id}` vs `HSW-{88000+id}`)**
   - **Location:** `ReceptionistOperationService.java` (line 562), `DefaultCustomerStayAdapter.java` (line 32), `FolioBillingService.java` (line 1049), `CheckoutService.java` (line 486), `bookingResolver.ts` (line 37)
   - **Remediation:** Standardize booking reference formatting into a single utility or support `^HSW-BK-(\d+)$` and `^HSW-88(\d+)$` parsing in `resolveNumericBookingId`.

9. **`P2-03`: Cancelling an Extra Spa Session Does Not Automatically Void Its Posted `FolioItem`**
   - **Location:** [SpaSessionService.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaSessionService.java#L302-L341), [DefaultBillingAdapter.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/DefaultBillingAdapter.java#L32-L52)
   - **Remediation:** Add a `cancelExtraSpaCharge(Long spaSessionId)` method on `BillingPort` / `DefaultBillingAdapter` that voids an un-invoiced `SPA` `FolioItem` when a session is cancelled before completion.

10. **`P2-04`: Housekeeping Modeled Only as Villa Status Transitions Without Dedicated Staff Task Assignment Table**
    - **Location:** `PhysicalVilla.java`, `OperationsContext.tsx` (line 84), `VillaStatusPage.tsx`
    - **Remediation:** Acceptable for current SRS scope (which models housekeeping via Receptionist S24 `VillaStatusPage`), or add task-level tracking if future sprints introduce a dedicated Housekeeping role.

11. **`P2-05`: `/api/v1/receptionist/**` URL Matcher Grants `ROLE_MANAGER` Access to Receptionist Write Endpoints**
    - **Location:** [SecurityConfig.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java#L108)
    - **Remediation:** Restrict `/api/v1/receptionist/**` `POST`/`PATCH` methods to `hasAnyRole("RECEPTIONIST", "ADMIN")` while allowing `GET` for `MANAGER`.

12. **`P2-06`: `ManagerDashboardPage.tsx` Reads KPI Summary Cards from Local `FolioContext` Instead of `billingApi`**
    - **Location:** [ManagerDashboardPage.tsx](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/pages/manager/ManagerDashboardPage.tsx#L20-L26)
    - **Remediation:** Fetch `billingApi.getRevenueAnalytics()`, `billingApi.getOccupancyAnalytics()`, and `billingApi.getTherapistUtilization()` on mount (matching `RevenueDashboardPage`, `OccupancyReportPage`, and `TherapistUtilizationReportPage`).

13. **`P2-07`: `JwtAuthenticationFilter.isAccountActive` Defaults to `.orElse(true)` When User Row Is Missing**
    - **Location:** [JwtAuthenticationFilter.java](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/security/JwtAuthenticationFilter.java#L41-L43)
    - **Remediation:** Once `P0-01` (`DevAuthController`) is profile-gated, evaluate whether `.orElse(false)` can be enforced in non-test profiles.

---

### P3 — Low-Priority Technical Debt / Maintainability

14. **`P3-01`: Java `Long` Identifier Fields Mapped to SQL Server `INT` Columns in M3 and M5 Entities**
    - **Location:** `SpaSession.java`, `SpaScheduleHistory.java`, `SpaDispatchOutbox.java`, `FolioEntity.java`, `FolioItemEntity.java`, `InvoiceEntity.java`, `PaymentTransactionEntity.java`, `CustomerReviewEntity.java`
    - **Impact:** Works cleanly under JDBC and `ddl-auto: none`, but would require `@Column(columnDefinition = "INT")` if Hibernate `ddl-auto: validate` is enabled against SQL Server.

---

## 12. Release-Readiness Assessment

- **For Controlled Demo / Academic Evaluation Environment (`dev` profile):** **`READY WITH KNOWN CAVEATS`**
  - All 6 modules compile, integrate across the core booking, check-in, spa, dining, billing/adjustments, checkout, and admin governance flows, and pass **828/828 executed automated tests** (669 backend H2 tests + 159 frontend contract tests) plus the production frontend build.
- **For Production / Staging Deployment:** **`NOT READY UNTIL P0 & P1 ITEMS ARE CLOSED`**
  - `P0-01` (`DevAuthController` unprofiled token minting) and `P0-02` (`permitAll()` on S42 payment creation, VietQR, and status endpoints) are critical security exposures that must be closed before any non-local deployment.
  - `P1-01` through `P1-04` are small, surgical fixes in existing classes that require zero schema changes and can be remediated in a single targeted hardening pass.

---

## 13. Recommended Next Implementation Phase (Ordered by Dependency & Priority)

1. **Step 1 — Security Lockdown (`P0-01`, `P0-02`, `P1-02`, `P2-05`):**
   - Add `@Profile({"dev", "local", "test"})` to `DevAuthController.java`.
   - Remove `.permitAll()` from S42 payment creation, VietQR generation, and payment status polling in `SecurityConfig.java` (preserving `.permitAll()` strictly for VNPay/VietQR gateway webhooks and signed return verification), and add `@PreAuthorize` with `@billingAccess` to `PaymentController` and `CheckoutController`.
   - Add `@billingAccess.canAccessBooking(#bookingId, authentication)` to `CustomerReviewController.getReviewByBookingId`.
   - Split `SecurityConfig.java` `/api/v1/receptionist/**` matcher so `HttpMethod.GET` allows `RECEPTIONIST`, `MANAGER`, `ADMIN` while write methods allow only `RECEPTIONIST`, `ADMIN`.
2. **Step 2 — Cross-Module Transactional Guard & Villa Status Hardening (`P1-01`, `P1-03`, `P2-01`, `P2-03`):**
   - In `CheckoutService.confirmGatewayPayment`, wrap `closeStayAndReleaseVilla` in a `validateBillingGuard` check so asynchronous webhook settlement never closes a stay while unsettled M3/M4 service orders exist.
   - Delegate `VillaInventoryController.updateVillaStatus` to `ReceptionistOperationService.updateVillaStatus` so the active `CHECKED_IN` booking guard (B14) cannot be bypassed.
   - Add missing `@PostMapping` annotations on `VillaInventoryController.createVilla` and `createVillaCategory`.
   - Wire `SpaSessionService.cancelSession` to void any un-invoiced extra `SPA` `FolioItem` via `BillingPort`.
3. **Step 3 — Live Dashboard & Reference Harmonization (`P1-04`, `P2-02`, `P2-06`):**
   - Replace hardcoded widget maps and the hardcoded 2-row Police Residency CSV in `SystemOverviewService.java` with live `JdbcTemplate` queries against `dbo.PhysicalVilla`, `dbo.RetreatBooking`, `dbo.SpaSession`, `dbo.CustomerReview`, and `dbo.ResidenceRecord`.
   - Connect `ManagerDashboardPage.tsx` to `billingApi.getRevenueAnalytics()`, `getOccupancyAnalytics()`, and `getTherapistUtilization()`.
   - Extend `bookingResolver.ts` (`resolveNumericBookingId`) to parse `HSW-BK-{id}` and `HSW-{88000+id}` patterns consistently.

---

## 14. Explicit List of Areas That Could Not Be Verified

In strict compliance with the read-only and environment safety constraints of this audit, the following areas were **not** executed and remain **`NOT VERIFIED`** at runtime:

1. **Physical SQL Server Execution (`HSWRMS` and `HSWRMS_TEST`):**
   - Per mandatory safety constraints, no connection or Flyway execution was performed against physical SQL Server instances. The 10 opt-in tests in `SqlServerJdbcSmokeTest` and `SqlServerSpringBootContextTest` remained skipped (`-Dhswrms.sqlserver.test.enabled` was not enabled).
2. **Live External Payment Gateway Callbacks (VNPay Sandbox & Banking VietQR Webhooks):**
   - Cryptographic HMAC-SHA512 signing, checksum verification, and webhook payload processing were verified via unit/integration tests (`VietQrAndPaymentWebhookTest`, `VNPayDepositServiceTest`, `M5BillingAndCheckoutTests`), but live network round-trips to `sandbox.vnpayment.vn` or external banking aggregators (PayOS/SePay/Casso) were not executed.
3. **Live External OAuth2 Providers (Google & Facebook SSO):**
   - Verified via mocked token/userinfo exchange in `SsoAuthEndpointTests`, `SsoServiceTest`, and `AuthServiceSsoFacebookTest`; not verified against live Google/Facebook OAuth2 endpoints.
4. **Live SMTP Server & Google Calendar API Dispatch:**
   - Outbox persistence, atomic claiming (`PROCESSING`), stale-claim recovery, and adapter logic were verified via `SpaDispatchOutboxTest`, `SmtpSpaNotificationAdapterTest`, and `GoogleCalendarAdapterTest`, but live external SMTP relay and Google Calendar REST API credentials were not invoked.
5. **Interactive Browser E2E Verification:**
   - Verified via static TypeScript compilation (`tsc -b`), production Vite bundling (`vite build`), and 159 automated contract/safety tests (`npx tsx --test`); live browser UI rendering against a running backend + SQL Server instance was not executed in this read-only audit phase.

