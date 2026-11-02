# HeavenStay Wellness Resort Management System (HSWRMS)
## Phase Full System Functional Workflow Audit Report

- **Date:** October 30, 2026
- **Repository:** `HSWRMS-audit-all-modules`
- **Target Branch:** `feature/hswrms-m1-m6-integration`
- **Baseline Git Commit:** `07c1d5d`
- **Document Status:** Authoritative End-to-End Functional Traceability Audit
- **Audit Mandate:** Follow every business workflow across all layers:
  `User Interaction → Frontend Component → API Client → HTTP Endpoint → Controller → Service → Repository → Database`

---

### 1. Workflow Classification Framework

Every audited workflow is classified into one of seven authoritative statuses:
1. `FULLY_IMPLEMENTED`: End-to-end implementation exists and sufficient evidence supports the complete behavior.
2. `IMPLEMENTED_WITH_LIMITATIONS`: Main functionality exists, but important operational or exceptional behavior is incomplete.
3. `PARTIALLY_IMPLEMENTED`: Some layers exist, but the complete workflow is missing.
4. `MOCK_OR_HARDCODED`: UI or backend behavior relies on mock data, hardcoded values, simulated responses, or local-only state.
5. `NOT_IMPLEMENTED`: Required functionality has no meaningful implementation.
6. `BROKEN`: Implementation exists but evidence indicates that it does not work correctly.
7. `NOT_VERIFIABLE`: Insufficient evidence or required environment access is unavailable.

---

### 2. Comprehensive Workflow Matrix & Status Summary

| Workflow ID | Workflow Name | Module | Primary Actor | Execution Path & Termination Point | Functional Classification | Core Deficiency / Limitation |
|---|---|---|---|---|---|---|
| **WF-01** | Guest Registration & Email OTP Verification | M1 | Guest / Customer | `RegisterPage` → `authApi.registerRequest` → `POST /auth/register` → `AuthService.registerGuest` → `User` + `EmailOtp` + `CustomerProfile` in DB. | `FULLY_IMPLEMENTED` | Requires active SMTP or `dev` console logging for OTP delivery. |
| **WF-02** | Customer / Staff Authentication & JWT Issuance | M1 | All Roles | `LoginPage` → `authApi.loginRequest` → `POST /auth/login` → `AuthService.login` → `User` + `UserRole` check → JWT token. | `FULLY_IMPLEMENTED` | Account lockout triggers after 5 failed attempts; auto-unlock after 15m. |
| **WF-03** | Google / Facebook SSO & Account Linking | M1 | Customer | `LoginPage` → OAuth Redirect → `SsoOAuth2SuccessHandler` → `POST /auth/sso/tickets/exchange` → JWT. | `IMPLEMENTED_WITH_LIMITATIONS` | Google SSO verified; Facebook OTP linking verified; requires cloud OAuth client credentials. |
| **WF-04** | Health Profile & Consent Capture | M1 | Customer | `HealthProfilePage` → `healthProfileApi` → `PUT /customer/health-profile` → `HealthProfileService` → `HealthProfile` + allergies/dietary in DB. | `FULLY_IMPLEMENTED` | Requires mandatory `HEALTH_DATA_PROCESSING` consent record prior to save. |
| **WF-05** | Health Data Erasure Request (Right to Erasure) | M1 | Customer | `HealthDataDeletionPage` → `CustomerContext.submitDeletionRequest` → **Stops in `localStorage`**. | `MOCK_OR_HARDCODED` | Frontend ignores `HealthDataDeletionRequestController`; generates mock ID in browser. |
| **WF-06** | Retreat Package Discovery & Catalog Browsing | M2 | Guest / Customer | `RetreatListPage` + `RetreatDetailPage` → **Stops in `mockRetreats.ts`**. | `MOCK_OR_HARDCODED` | Frontend hardcodes `MOCK_RETREAT_PACKAGES`; ignores backend `GET /api/v1/retreat-packages`. |
| **WF-07** | Retreat Booking Calculation & Draft Creation | M2 | Customer | `RetreatBookingPage` → `BookingSummaryPage` → `CustomerContext.createBooking` → `POST /customer/bookings`. | `MOCK_OR_HARDCODED` | Frontend calculates price in JS; `createBooking` hardcodes `retreatPackageId=1, villaCategoryId=1, guestCount=1`. |
| **WF-08** | Booking Deposit Payment (VNPay) | M2 | Customer | `BookingSummaryPage` → **Modal with `setTimeout` simulator** → Fake `VNPAY-XXXXXXXX` reference. | `MOCK_OR_HARDCODED` | Bypasses backend `POST /customer/bookings/{id}/vnpay-url`; never redirects to real VNPay gateway. |
| **WF-09** | Front-Desk Daily Arrivals & Check-in Lookup | M2 | Receptionist | `DailyArrivalsPage` + `CheckInPage` → **Stops in `OperationsContext` (`localStorage`)**. | `MOCK_OR_HARDCODED` | Zero API calls to `ReceptionistOperationController.getDailyArrivals`; displays mock arrivals. |
| **WF-10** | Front-Desk Physical Villa Assignment & Check-in | M2 | Receptionist | `VillaAssignmentPage` → **Mutates `OperationsContext` in `localStorage`**. | `MOCK_OR_HARDCODED` | Zero API calls to `ReceptionistOperationController.assignVillaAndCheckIn`; DB remains unassigned. |
| **WF-11** | Receptionist Booking History & Front-Desk Search | M2 | Receptionist | `ReceptionistBookingsPage` → `retreatBookingApi` → `GET /receptionist/bookings` → `RetreatBookingRepository`. | `FULLY_IMPLEMENTED` | Full search, filtering, and detail modal backed by real SQL database. |
| **WF-12** | Spa Candidate Generation & Indivisible Bundling | M3 | Customer / Receptionist | `SpaBookingPage` → `spaApi.generateCandidates` → `POST /spa/candidates` → `SchedulingEngineService`. | `FULLY_IMPLEMENTED` | Enforces joint therapist/room availability; rejects manual resource selection (BR-M3-03/04). |
| **WF-13** | Spa Alternative Search & Rejection Loop | M3 | Customer | `SpaAlternativeSlotsPage` → `spaApi.generateCandidates` with `rejectedCandidateIds` → Cancellation. | `FULLY_IMPLEMENTED` | Multi-turn negotiation state isolated; successive rejection correctly terminates in cancellation (BR-M3-08). |
| **WF-14** | Spa T-1h Reminder Dispatch & Fencing | M3 | System Scheduler | `SessionTimelineScheduler.dispatchUpcomingSessionReminders` → `SpaNotificationPort` → DB Sent. | `IMPLEMENTED_WITH_LIMITATIONS` | Atomic UUID claim-token fencing verified (84 tests); Google Calendar & SMTP run local telemetry. |
| **WF-15** | Spa Attendance Confirmation | M3 | Customer | `MySpaSessions` → `spaApi.confirmAttendance` → `POST /spa/sessions/{id}/confirm-attendance`. | `FULLY_IMPLEMENTED` | Serialized via `findByIdWithLock` (`PESSIMISTIC_WRITE`); sets status to `CONFIRMED`. |
| **WF-16** | Therapist Daily Schedule & Outcome Recording | M3 | Therapist | `TherapistSchedulePage` (hardcoded `THER-01`) → `TherapistSessionDetailPage` → `spaApi.recordOutcome`. | `IMPLEMENTED_WITH_LIMITATIONS` | Backend verified (`COMPLETED`/`NO_SHOW`); frontend hardcodes `THER-01` and has mock fallback. |
| **WF-17** | Daily Meal Selection | M4 | Customer | `DailyMealSelectionPage` → `fnbApi.placeDailyMealOrder` → `POST /fnb/customer/orders`. | `IMPLEMENTED_WITH_LIMITATIONS` | Enforces dietary safety; frontend clamps `bookingId >= 1000 -> 1` and swallows errors. |
| **WF-18** | À La Carte Food Ordering & Folio Posting | M4 / M5 | Customer | `AlaCarteOrderPage` → `fnbApi.placeAlaCarteOrder` → `AlaCarteOrderPlacedEvent` → **NO LISTENER**. | `BROKEN` | Order is stored in `MealOrder`, but event is never handled; charge is NEVER posted to Folio. |
| **WF-19** | Kitchen Display System (KDS) & Prep Queue | M4 | F&B Staff / Chef | `FnbDashboardPage` + `MealPrepListPage` → `fnbApi.getDashboard` → `IngredientBatch` & stock. | `FULLY_IMPLEMENTED` | Real inventory tracking, batch allocation, shortfall alerts, and stage transitions. |
| **WF-20** | Master Folio Aggregation & Invoicing | M5 | Customer / Receptionist | `FolioInvoicePage` → `billingApi.getFolio` → **Renders mock lines from `FolioContext`**. | `MOCK_OR_HARDCODED` | Backend aggregates charges correctly; frontend UI ignores backend lines and shows mock items. |
| **WF-21** | Final Stay Payment Settlement | M5 | Customer / Receptionist | `FinalPaymentPage` → Generates fake `VNP-M5-XXXXXX` → `POST /billing/invoices/{id}/pay`. | `MOCK_OR_HARDCODED` | Bypasses real VNPay gateway; requires `mockAutoConfirm=true` or hangs in `PENDING` forever. |
| **WF-22** | Resort Checkout Finalization | M5 | Receptionist | `CheckoutConfirmationPage` → **Mutates `FolioContext` in `localStorage`**. | `MOCK_OR_HARDCODED` | Bypasses `POST /billing/invoices/{id}/finalize-checkout`; database booking/folio remains open. |
| **WF-23** | Post-Checkout Customer Review & Rating | M5 | Customer | `ReviewRatingPage` → Gated by `FolioContext.isStayCheckedOut` in `localStorage` → `POST /customer/reviews`. | `IMPLEMENTED_WITH_LIMITATIONS` | Backend verified; frontend gate depends on browser `localStorage` checkout record. |
| **WF-24** | Management Analytics & Financial Export | M5 | Manager / Admin | `RevenueDashboardPage` + `OccupancyReportPage` → `billingApi` + Excel export. | `IMPLEMENTED_WITH_LIMITATIONS` | Top-level KPIs fetch real API; detailed analytical table rows display mock folio items. |
| **WF-25** | Staff Account Management & Temporary Password | M6 | Admin | `StaffAccountListPage` → `staffAccountsApi` → `POST /admin/staff` → `User` + `UserRole` in DB. | `FULLY_IMPLEMENTED` | Requires `S10:V` / `S11:C` permission; audited in `dbo.AuditLog`. |
| **WF-26** | Role Permission Matrix & Delegation | M6 | Admin | `PermissionMatrixPage` + `AdminDelegationPage` → `delegationApi` → `RightDelegation` in DB. | `FULLY_IMPLEMENTED` | Dynamic capability evaluation; automatic expiration via `DelegationExpiryJob`. |
| **WF-27** | System Business Parameters & Feature Flags | M6 | Admin / Delegated Mgr | `BusinessParametersPage` → `parametersApi` → `PATCH /admin/parameters/{key}` → `SystemConfiguration`. | `FULLY_IMPLEMENTED` | Audited configuration updates; runtime parameter cache invalidation. |
| **WF-28** | Admin Master Data Management | M6 | Admin | `MasterDataPage` → **Direct React state mutation on mock arrays**. | `MOCK_OR_HARDCODED` | Zero calls to `AdminMasterDataController`; edits are lost on browser refresh. |
| **WF-29** | Sensitive Audit Log Inspection & Retention | M6 | Admin | `SensitiveAuditLogPage` → `auditLogApi` → `GET /admin/audit-logs` → `dbo.AuditLog`. | `FULLY_IMPLEMENTED` | Immutable audit stream with multi-criteria filtering; automated daily purge job. |

---

### 3. Detailed Trace of Critical Business Workflows

#### 3.1 Workflow WF-08: Booking Deposit Payment (M2)
- **Actor:** Customer.
- **Preconditions:** Customer is authenticated, has configured a retreat package and dates.
- **User Actions:** Customer clicks "Proceed to Deposit Payment" on `BookingSummaryPage`.
- **Intended Backend Execution Path:**
  `POST /api/v1/customer/bookings/{id}/vnpay-url` → `VNPayDepositService.generateDepositUrl` → Redirect to VNPay Gateway → Gateway Callback `GET /api/v1/payments/vnpay-return` → `VNPayDepositService.processIpn` → Update `RetreatBooking.bookingStatus = 'CONFIRMED'`.
- **Actual Frontend Execution:**
  `BookingSummaryPage.tsx` lines 114–140:
  Opens modal `isVnpayModalOpen`, triggers `handleSimulatePayment('success')` which sets a 1000ms `setTimeout`, manufactures `transactionId: VNPAY-${Date.now().toString().slice(-8)}`, marks `depositStatus = 'paid'`, and updates React state.
- **Failure Analysis:** Real VNPay gateway is **never called**. A real customer cannot pay via real banking apps or credit cards.
- **Classification:** `MOCK_OR_HARDCODED`.

#### 3.2 Workflow WF-18: À La Carte Order Folio Posting (M4 / M5)
- **Actor:** In-stay Customer.
- **Preconditions:** Customer has an active retreat booking (`CHECKED_IN`).
- **User Actions:** Customer orders food on `AlaCarteOrderPage.tsx`.
- **Execution Path:**
  1. `fnbApi.placeAlaCarteOrder` → `POST /api/v1/fnb/customer/orders` (HTTP 200).
  2. `MealOrderController.placeAlaCarteOrder` calls `MealOrderService.placeAlaCarteOrder`.
  3. `MealOrderService` line 196 publishes `new AlaCarteOrderPlacedEvent(order.getId(), bookingId, subtotal, createdAt)`.
  4. Spring `ApplicationEventPublisher` broadcasts event.
  5. **Termination Point:** Zero event listeners exist anywhere in the application.
- **Database Effect:** Row is inserted into `dbo.MealOrder` and `dbo.MealOrderItem`. Zero rows are inserted into `dbo.FolioItem`. Folio balance remains unmodified.
- **Business Impact:** The customer consumes the meal, but upon checkout, the hotel folio does not contain the charge. Financial loss to resort.
- **Classification:** `BROKEN`.

#### 3.3 Workflow WF-09 / WF-10: Receptionist Check-In & Villa Assignment (M2)
- **Actor:** Front-desk Receptionist.
- **Preconditions:** Customer arrives at resort; reservation is in `CONFIRMED` status.
- **User Actions:** Receptionist opens `DailyArrivalsPage`, clicks "Check-In" on guest row, reviews ID, and assigns a physical villa.
- **Intended Backend Execution Path:**
  `GET /api/v1/receptionist/arrivals` → `GET /api/v1/receptionist/check-in/{id}/available-villas` → `POST /api/v1/receptionist/check-in/{id}/assign-villa` → `RetreatBooking.bookingStatus = 'CHECKED_IN'` and `PhysicalVilla.villaStatus = 'OCCUPIED'`.
- **Actual Frontend Execution:**
  `DailyArrivalsPage.tsx`, `CheckInPage.tsx`, `VillaAssignmentPage.tsx` do not import or call any API client. They read and mutate `arrivals` in `OperationsContext.tsx`, which persists to `localStorage.setItem('hsw_operations_arrivals_v1', ...)`.
- **Database Effect:** Zero SQL queries executed. The booking remains `CONFIRMED` in the database. The physical villa remains `AVAILABLE` in the database.
- **Business Impact:** Front desk staff believe the guest is checked in because the screen updates locally, but backend schedulers and other staff (housekeeping, F&B, spa) see the guest as not checked in.
- **Classification:** `MOCK_OR_HARDCODED`.

#### 3.4 Workflow WF-21 / WF-22: Stay Folio Settlement & Resort Checkout (M5)
- **Actor:** Customer / Receptionist.
- **Preconditions:** Stay duration has completed; guest is departing.
- **User Actions:** User reviews `FolioInvoicePage`, navigates to `FinalPaymentPage`, and confirms checkout on `CheckoutConfirmationPage`.
- **Intended Backend Execution Path:**
  `GET /api/v1/billing/folios/{bookingId}` → `POST /api/v1/billing/folios/{bookingId}/invoice` → `POST /api/v1/billing/invoices/{invoiceId}/pay` → `POST /api/v1/billing/invoices/{invoiceId}/finalize-checkout` → Update `RetreatBooking.bookingStatus = 'COMPLETED'`, `Folio.folioStatus = 'CLOSED'`, `PhysicalVilla.villaStatus = 'CLEANING'`.
- **Actual Frontend Execution:**
  1. `FolioInvoicePage.tsx` fetches backend folio summary, but ignores `backendFolio.items` and renders mock line items from `FolioContext`.
  2. `FinalPaymentPage.tsx` generates a random `VNP-M5-XXXXXX` string on client side and posts it to `/invoices/{invoiceId}/pay`. If `VNPAY_MOCK_AUTO_CONFIRM` is false, transaction remains `PENDING` in database.
  3. `CheckoutConfirmationPage.tsx` calls `completeResortCheckout` in `FolioContext.tsx`, which records `checkoutRecords[bookingRef]` into `localStorage` and updates local villa status to `cleaning`.
  4. **Termination Point:** `finalizeCheckout` API is never called.
- **Database Effect:** In SQL Server, `dbo.Folio` remains `OPEN`, `dbo.Invoice` remains `ISSUED` (unsettled), `dbo.RetreatBooking` remains `CHECKED_IN`, and `dbo.PhysicalVilla` remains `OCCUPIED`.
- **Business Impact:** The system never officially completes the checkout in persistence.
- **Classification:** `MOCK_OR_HARDCODED`.

---

### 4. Summary of Discovered Gaps by Operational Role

1. **Customer Role:**
   - Can register, verify email, log in, manage health profile, and schedule spa sessions with full real persistence.
   - CANNOT actually book a chosen package/villa (hardcoded to package 1, villa 1).
   - CANNOT pay real deposit or final balance (mock simulators only).
   - CANNOT reliably delete health data (request stays in browser localStorage).
2. **Receptionist Role:**
   - Can view real booking lists via `ReceptionistBookingsPage`.
   - CANNOT perform real daily arrivals scanning, identity verification, check-in, or villa assignment (all run in browser localStorage).
   - CANNOT finalize resort checkout in the database.
3. **Therapist Role:**
   - Can record session outcome (`COMPLETED`/`NO_SHOW`) via real API when navigating directly to session detail.
   - Dashboard and schedule pages hardcode `CURRENT_THERAPIST_ID = 'THER-01'` and rely on mock spa data.
4. **F&B Staff / Chef Role:**
   - Can view KDS orders and manage ingredient batches via real API.
   - À la carte orders placed by customers are not connected to customer billing folios.
5. **Manager & Administrator Role:**
   - Can manage staff accounts, permissions, delegations, business parameters, and view audit logs with full real persistence.
   - CANNOT manage master data (packages, spa treatments, villas) via `MasterDataPage` (changes are lost on refresh).
   - Villa management page uses hardcoded `http://localhost:8080` URLs and targets endpoints missing `@PostMapping` on the backend.

