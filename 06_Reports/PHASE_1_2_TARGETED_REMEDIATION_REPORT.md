# HSWRMS — PHASE 1.2: TARGETED SECURITY & BILLING REMEDIATION REPORT

- **Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`
- **Branch:** `feature/hswrms-m1-m6-integration`
- **Verified Baseline HEAD:** `a053774c992472c7fb5aacb029e57ff1ffdb4380`
- **Reference Reports:**
  - `06_Reports/PHASE_1_SECURITY_LOCKDOWN_IMPLEMENTATION_REPORT.md`
  - `06_Reports/PHASE_1_1_INDEPENDENT_SECURITY_REVIEW.md`
- **Date:** 2026-10-31

---

## 1. Findings Remediated vs. Deferred

| Finding ID | Severity | Description | Phase 1.2 Status |
| :--- | :---: | :--- | :--- |
| **`P1-IR-01`** | **P1 (High)** | Mixed `bookingId` + `invoiceId` payload bypass in `BillingAccessEvaluator.canCreateVnpayPayment` and `VNPayService.resolveInvoice` | **FIXED & VERIFIED** |
| **`P2-IR-02`** | **P2 (Medium)** | `VietQrService.generateInvoiceVietQr` used raw path parameter `invoiceId` instead of canonical `invoice.getInvoiceId()` after booking-ID fallback | **FIXED & VERIFIED** |
| **`P2-IR-03`** | **P2 (Medium)** | Repeated `GET` calls to `/api/v1/billing/invoices/{invoiceId}/vietqr` and `/api/v1/billing/deposit/{bookingId}/vietqr` created duplicate `PENDING` `PaymentTransactionEntity` rows | **FIXED & VERIFIED** |
| **`P1-02` (Test)** | **P1 (High)** | Complete MockMvc regression coverage (`401` Unauthenticated, `200` Owner, `403` Other Customer) for `GET /api/v1/customer/reviews/booking/{bookingId}` using real `ReviewService` | **FIXED & VERIFIED** |
| **`P3-IR-01`** | **P3 (Low)** | `DevAuthController` local dev `userId=1` token behavior when explicitly opted-in under `dev`/`local`/`test` | **NO CHANGE REQUIRED (Intentional local dev design; blocked in `prod` & by default)** |
| **`P3-IR-02`** | **P3 (Low)** | Minor asymmetry on `GET /api/v1/invoices/{invoiceId}/payment-status` (`canAccessInvoice` fallback vs `VNPayService.getInvoicePaymentStatus` lookup) | **DEFERRED (Per Phase 1.2 scope instructions; no cross-customer data exposure)** |

---

## 2. Root Cause & Exact Remediation for Each Finding

### 2.1. `P1-IR-01` — Mixed `bookingId` / `invoiceId` Payment Authorization Bypass
- **Root Cause:**
  1. In `BillingAccessEvaluator.canCreateVnpayPayment(VnpayCreatePaymentRequest request, Authentication authentication)`, the `else if (!hasBookingId && !bookingRepository.existsByIdAndCustomerUserId(request.invoiceId(), userId))` condition skipped ownership validation of `request.invoiceId()` whenever `hasBookingId` was `true` and no `InvoiceEntity` had primary key `invoice_id == request.invoiceId()`.
  2. In `VNPayService.resolveInvoice(VnpayCreatePaymentRequest req)`, when `req.bookingId()` was provided for a booking that did not yet have an invoice (`findByRetreatBookingId(req.bookingId())` empty), execution fell through to `req.invoiceId()` (including its `findByRetreatBookingId(req.invoiceId().intValue())` fallback), without verifying that both identifiers belonged to the customer and referred to the same invoice.
- **Remediation:**
  1. **`BillingAccessEvaluator.canCreateVnpayPayment` (`lines 89–115`):**
     - Always verifies `bookingRepository.existsByIdAndCustomerUserId(request.bookingId(), userId)` when `hasBookingId` is `true`.
     - Always verifies `request.invoiceId()` ownership when `hasInvoiceId` is `true` (removing the `!hasBookingId` skip).
     - When both `hasBookingId` and `hasInvoiceId` are `true`:
       - If `invoiceRepository.existsById(request.invoiceId())` is `true`, verifies that `invoiceRepository.findByRetreatBookingId(request.bookingId())` resolves to the exact same `request.invoiceId()`.
       - If `invoiceRepository.existsById(request.invoiceId())` is `false` (booking-ID fallback), requires `request.invoiceId().equals(request.bookingId())`.
  2. **`VNPayService.resolveInvoice` (`lines 122–157`):**
     - When both `bookingId` and `invoiceId` are provided, resolves both targets and enforces `Objects.equals(byBooking.getInvoiceId(), byInvoice.getInvoiceId())` (throwing `BusinessRuleException("TARGET_MISMATCH", ...)` if mismatched, or `ResourceNotFoundException` if either target has no invoice).
     - When only `bookingId` is provided, resolves strictly by `findByRetreatBookingId(req.bookingId())` without falling through to `invoiceId`.

### 2.2. `P2-IR-02` — Canonical Invoice ID After Booking-ID Fallback in `VietQrService`
- **Root Cause:**
  - `VietQrService.generateInvoiceVietQr(Long invoiceId)` resolved `InvoiceEntity invoice` via `findByIdWithDetails(invoiceId).or(() -> findByRetreatBookingId(invoiceId.intValue()))`, but continued passing the raw path parameter `invoiceId` (which could be a `retreatBookingId` different from `invoice.getInvoiceId()`) to `sumSuccessfulPaymentsForInvoice(invoiceId)`, `txnRef`, and `response.setInvoiceId(invoiceId)`.
- **Remediation:**
  - In `VietQrService.generateInvoiceVietQr` (`lines 76–155`), extracted `Long canonicalInvoiceId = invoice.getInvoiceId();` immediately after resolving `InvoiceEntity invoice` and used `canonicalInvoiceId` for:
    - `paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(canonicalInvoiceId)`
    - `creditNoteRepository.sumFinalCreditAmountByInvoiceId(canonicalInvoiceId)`
    - Fallback `invoiceNum` and `txnRef` (`"HSW_INV_" + canonicalInvoiceId + "_" + ...`)
    - `response.setInvoiceId(canonicalInvoiceId)`

### 2.3. `P2-IR-03` — VietQR `GET` Idempotency & Duplicate `PENDING` Transaction Prevention
- **Root Cause:**
  - `VietQrService.generateInvoiceVietQr` and `VietQrService.generateDepositVietQr` inserted a new `PENDING` `PaymentTransactionEntity` on every HTTP `GET` call without reusing a valid existing `PENDING` transaction or superseding stale `PENDING` rows.
- **Remediation:**
  - **`VietQrService.generateInvoiceVietQr` (`lines 100–134`) & `VietQrService.generateDepositVietQr` (`lines 185–219`):**
    - Queries existing transactions for `canonicalInvoiceId` (or `bookingId` for deposit) and inspects `PENDING` rows with `paymentMethod = "VIETQR_BANK_TRANSFER"` and matching `paymentType` (`FINAL` / `DEPOSIT`).
    - Reuses the existing `PENDING` transaction (preserving its `transactionReference` without inserting a duplicate row) if its `amountPaid` matches the current `balanceDue` (or `depositAmount`) and its reference matches the canonical target prefix.
    - Marks any stale/mismatched `PENDING` `VIETQR_BANK_TRANSFER` rows for that same target as `FAILED` before creating a new `PENDING` transaction when the amount has changed.
    - Never modifies `SUCCESSFUL` transactions, non-VietQR transactions, or transactions belonging to other invoices/bookings.
  - **`VnpayWebhookController.resolveTxnRefFromContent` (`lines 118–134`):**
    - Updated content-based fallback resolution (`"HSW INV <invoiceNumber>"`) to prioritize active `PENDING` `VIETQR_BANK_TRANSFER` transactions over superseded `FAILED` transactions so webhook auto-discovery remains deterministic after balance changes.

### 2.4. `P1-02` — Customer Review Ownership MockMvc Regression Test
- **Remediation:**
  - Extended `M5BillingAndCheckoutTests.testP102CustomerReviewOwnershipEnforcement` (`lines 1904–1955`) using the real `ReviewService`, real `SecurityFilterChain`, real `BillingAccessEvaluator`, and H2 to verify:
    - Unauthenticated `GET /api/v1/customer/reviews/booking/{bookingId}` → `401 Unauthorized`
    - Booking owner (`ROLE_CUSTOMER`) → `200 OK`
    - Another customer (`ROLE_CUSTOMER`) → `403 Forbidden`
    - Non-existent booking ID for customer → `403 Forbidden` (no existence leakage)
    - Receptionist / Admin → `200 OK` (and `404 Not Found` when absent)

---

## 3. Files Modified in Phase 1.2

| File Path | Summary of Phase 1.2 Changes |
| :--- | :--- |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/security/BillingAccessEvaluator.java` | Enforced strict ownership and cross-identifier consistency in `canCreateVnpayPayment` (`P1-IR-01`). |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VNPayService.java` | Hardened `resolveInvoice` so `bookingId` never falls through to an unrelated `invoiceId` and requires both identifiers to resolve to the same invoice (`P1-IR-01`). |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VietQrService.java` | Used `canonicalInvoiceId = invoice.getInvoiceId()` (`P2-IR-02`) and implemented `PENDING` transaction reuse / stale superseding in `generateInvoiceVietQr` and `generateDepositVietQr` (`P2-IR-03`). |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/VnpayWebhookController.java` | Updated `resolveTxnRefFromContent` to prefer active `PENDING` `VIETQR_BANK_TRANSFER` rows (`P2-IR-03`). |
| `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/M5BillingAndCheckoutTests.java` | Added `testP1IR01MixedBookingAndInvoiceIdBypassBlocked`, `testP2IR02VietQrFallbackUsesCanonicalInvoiceId`, `testP2IR03VietQrIdempotencyReusesValidPendingAndSupersedesStale`, and unauthenticated `401` assertion in `testP102CustomerReviewOwnershipEnforcement`. |
| `06_Reports/PHASE_1_2_TARGETED_REMEDIATION_REPORT.md` | Created Phase 1.2 deliverable report. |

*(All prior Phase 1 modified files and untracked artifacts were preserved intact.)*

---

## 4. Test Execution Evidence

### 4.1. Executed Test Commands & Results

| Step | Command Executed | Exit Code | Tests Run | Passed | Failed | Errors | Skipped |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **1 (Targeted Phase 1.2 Tests)** | `.\mvnw.cmd test -Dtest="M5BillingAndCheckoutTests#testP1IR01MixedBookingAndInvoiceIdBypassBlocked+testP2IR02VietQrFallbackUsesCanonicalInvoiceId+testP2IR03VietQrIdempotencyReusesValidPendingAndSupersedesStale+testP102CustomerReviewOwnershipEnforcement"` | `0` | **4** | **4** | 0 | 0 | 0 |
| **2 (Full M5 Billing & Security Regression Suite)** | `.\mvnw.cmd test -Dtest="M5BillingAndCheckoutTests,VietQrAndPaymentWebhookTest,DevAuthControllerSecurityTest,RetreatBookingSecurityTest"` | `0` | **84** | **84** | 0 | 0 | 0 |

Breakdown of the `84` executed tests in Step 2:
- `DevAuthControllerSecurityTest`: `5/5 PASS`
- `RetreatBookingSecurityTest`: `17/17 PASS`
- `M5BillingAndCheckoutTests`: `59/59 PASS` (including `testP002UnauthenticatedS42EndpointsRejected`, `testP002S42OwnershipAndStaffAuthorization`, `testP002CallbacksAndVerifyReturnSecurity`, `testP102CustomerReviewOwnershipEnforcement`, `testP1IR01MixedBookingAndInvoiceIdBypassBlocked`, `testP2IR02VietQrFallbackUsesCanonicalInvoiceId`, and `testP2IR03VietQrIdempotencyReusesValidPendingAndSupersedesStale`)
- `VietQrAndPaymentWebhookTest`: `3/3 PASS`

### 4.2. Tests Intentionally Not Re-Run in Phase 1.2 (Per Minimal-Testing Constraint)
- Unrelated M1/M3/M4/M6 backend test classes and the frontend `vitest`/`tsx` suite (`159/159` previously verified in Phase 1) were not re-run because zero frontend or M1/M3/M4/M6 source files were modified in Phase 1.2.

---

## 5. Remaining Risks & Concurrency Considerations

1. **Concurrent Simultaneous First-Time `GET .../vietqr` Requests (Low Risk):**
   - `VietQrService.generateInvoiceVietQr` and `generateDepositVietQr` reuse an existing valid `PENDING` `VIETQR_BANK_TRANSFER` transaction on sequential/repeated `GET` calls (such as page refreshes or tab re-opens) without introducing database schema locks or changing migrations.
   - Under an extreme sub-millisecond race where two identical initial `GET` requests arrive simultaneously before the first transaction commits, two `PENDING` rows could be inserted; the next `GET` call will automatically retain one valid `PENDING` row and transition the duplicate to `FAILED`, and `VnpayWebhookController` settles the matched `transactionReference` with `@Lock(LockModeType.PESSIMISTIC_WRITE)` (`findByTransactionReferenceWithLock`).
2. **Deferred Low-Severity Observation (`P3-IR-02`):**
   - `PaymentController.getInvoicePaymentStatus` uses `@billingAccess.canAccessInvoice(#invoiceId, authentication)` while `VNPayService.getInvoicePaymentStatus` looks up `invoiceRepository.findById(invoiceId)` directly. This does not allow any cross-customer access (returning `404` only if a customer passes their own un-invoiced `bookingId`), and was deferred per Phase 1.2 scope instructions.

---

## 6. Database & Git Safety Verification

- **Physical SQL Server Safety:** Confirmed that physical SQL Server databases `HSWRMS` and `HSWRMS_TEST` were **never** accessed or mutated. All tests ran strictly against in-memory H2 (`jdbc:h2:mem:testdb`).
- **Migration / Schema Safety:** Zero Flyway migrations or schema files were modified.
- **Git State Verification:**
  - **Branch:** `feature/hswrms-m1-m6-integration`
  - **HEAD:** `a053774c992472c7fb5aacb029e57ff1ffdb4380` (unchanged; no `git add`, `git commit`, `git push`, `git reset`, `git clean`, `git checkout`, or `git rebase` was performed).
  - **Modified Tracked Files (`13` files, unstaged):**
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/common/api/DevAuthController.java`
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java`
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CheckoutController.java`
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CustomerReviewController.java`
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/PaymentController.java`
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/VnpayWebhookController.java`
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/security/BillingAccessEvaluator.java`
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/ReviewService.java`
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VNPayService.java`
    - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VietQrService.java`
    - `05_Development/backend/src/main/resources/application.yml`
    - `05_Development/backend/src/test/java/com/heavenstay/hswrms/m2booking/RetreatBookingSecurityTest.java`
    - `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/M5BillingAndCheckoutTests.java`
  - **Untracked Files (All Preserved):**
    - `05_Development/backend/src/test/java/com/heavenstay/hswrms/common/api/DevAuthControllerSecurityTest.java`
    - `05_Development/database/generated/`
    - `06_Reports/PHASE_1_2_TARGETED_REMEDIATION_REPORT.md`
    - `06_Reports/PHASE_1_1_INDEPENDENT_SECURITY_REVIEW.md`
    - `06_Reports/PHASE_1_SECURITY_LOCKDOWN_IMPLEMENTATION_REPORT.md`
    - `06_Reports/PHASE_FINAL_REMEDIATION_COMMIT_AND_PUSH_REPORT.md`
    - `06_Reports/PHASE_M1_M6_INTEGRATION_READINESS_REVIEW.md`
    - `06_Reports/audit-output/backup_targeted_correction_20261029/`
    - `06_Reports/visual-evidence/`

