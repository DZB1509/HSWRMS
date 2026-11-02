# HSWRMS — Phase 1 Security Lockdown Implementation Report (`P0-01`, `P0-02`, `P1-02`, `P2-05`)

**Date:** 2026-10-31  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Target Branch:** `feature/hswrms-m1-m6-integration`  
**Baseline `HEAD`:** `a053774c992472c7fb5aacb029e57ff1ffdb4380`  
**Audit Reference:** `06_Reports/PHASE_M1_M6_INTEGRATION_READINESS_REVIEW.md`  
**Phase Scope:** Narrowly Scoped Security Hardening (`P0-01`, `P0-02`, `P1-02`, `P2-05`)  

---

## Executive Classification Summary

| Finding ID | Description | Final Classification |
| :--- | :--- | :--- |
| **`P0-01`** | `DevAuthController` (`GET /api/v1/auth/dev-token`) was not restricted to development/test profiles or opt-in property | **`FIXED AND VERIFIED`** |
| **`P0-02`** | S42 payment initiation, VietQR, and payment-status endpoints had overly permissive `.permitAll()` access without ownership checks | **`FIXED AND VERIFIED`** |
| **`P1-02`** | Customer review lookup (`GET /api/v1/customer/reviews/booking/{bookingId}`) did not enforce booking ownership | **`FIXED AND VERIFIED`** |
| **`P2-05`** | `ROLE_MANAGER` had excessive access to receptionist write operations (`POST`/`PATCH`) under `/api/v1/receptionist/**` | **`FIXED AND VERIFIED`** |

---

## 1. Baseline Branch and HEAD

| Property | Value |
| :--- | :--- |
| **Branch** | `feature/hswrms-m1-m6-integration` |
| **Baseline & Current `HEAD`** | `a053774c992472c7fb5aacb029e57ff1ffdb4380` |
| **Remote (`isp-origin`) `HEAD`** | `a053774c992472c7fb5aacb029e57ff1ffdb4380` |
| **Pre-Implementation Tracked Diff** | Clean (`0` staged changes, `0` unstaged tracked modifications) |
| **Pre-Existing Untracked Paths Preserved** | `05_Development/database/generated/`<br>`06_Reports/PHASE_FINAL_REMEDIATION_COMMIT_AND_PUSH_REPORT.md`<br>`06_Reports/PHASE_M1_M6_INTEGRATION_READINESS_REVIEW.md`<br>`06_Reports/audit-output/backup_targeted_correction_20261029/`<br>`06_Reports/visual-evidence/` |

---

## 2. Files Inspected and Modified

### 2.1. Files Inspected Before Implementation
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/common/api/DevAuthController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/DevAccountBootstrap.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/PaymentController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CheckoutController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/VnpayWebhookController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/VNPaySimulationController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CustomerReviewController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/security/BillingAccessEvaluator.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VNPayService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VietQrService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/ReviewService.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/InvoiceRepository.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/PaymentTransactionRepository.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/controller/ReceptionistOperationController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/controller/VNPayCallbackController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/controller/M2VNPaySimulationController.java`
- `05_Development/backend/src/main/resources/application.yml` & `05_Development/backend/src/test/resources/application.yml`
- `05_Development/frontend/src/api/client/apiClient.ts` & `05_Development/frontend/src/features/m5-billing/api/billingApi.ts`

### 2.2. Files Modified / Created During Phase 1

| File Path | Action | Finding(s) Addressed |
| :--- | :--- | :--- |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/common/api/DevAuthController.java` | Modified (`+4/-0`) | `P0-01` |
| `05_Development/backend/src/main/resources/application.yml` | Modified (`+2/-0`) | `P0-01` |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java` | Modified (`+25/-8`) | `P0-01`, `P0-02`, `P2-05` |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/security/BillingAccessEvaluator.java` | Modified (`+84/-1`) | `P0-02` |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/PaymentController.java` | Modified (`+4/-0`) | `P0-02` |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CheckoutController.java` | Modified (`+3/-0`) | `P0-02` |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CustomerReviewController.java` | Modified (`+11/-5`) | `P1-02` |
| `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/ReviewService.java` | Modified (`+4/-0`) | `P1-02` |
| `05_Development/backend/src/test/java/com/heavenstay/hswrms/common/api/DevAuthControllerSecurityTest.java` | Created (`+97` lines) | `P0-01` verification |
| `05_Development/backend/src/test/java/com/heavenstay/hswrms/m2booking/RetreatBookingSecurityTest.java` | Modified (`+86/-0`) | `P2-05` verification |
| `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/M5BillingAndCheckoutTests.java` | Modified (`+239/-0`) | `P0-02`, `P1-02` verification |
| `06_Reports/PHASE_1_SECURITY_LOCKDOWN_IMPLEMENTATION_REPORT.md` | Created | Phase 1 deliverable |

*(Note: No frontend files required modification because `05_Development/frontend/src/api/client/apiClient.ts` already attaches `Authorization: Bearer <token>` on all `billingApi` requests.)*

---

## 3. Root Cause for Each Finding

1. **`P0-01` (`DevAuthController` Unrestricted Token Issuance):**
   - `DevAuthController` (`GET /api/v1/auth/dev-token`) had neither a `@Profile` restriction nor a `@ConditionalOnProperty` guard, and `/api/v1/auth/dev-token` was unconditionally whitelisted with `.permitAll()` in `SecurityConfig.java`. Any unauthenticated caller could request `?role=ADMIN` or `?role=ALL` to mint a signed JWT for `userId=1` with `ROLE_ADMIN`.
2. **`P0-02` (Overly Permissive S42 Payment Endpoints):**
   - Collaborator commits `1fe60ba` and `dcff137` added `.permitAll()` in `SecurityConfig.java` (lines 125–128) for `POST /api/v1/payments/vnpay/create-payment-url`, `GET /api/v1/payments/status/**`, `GET /api/v1/invoices/*/payment-status`, `GET /api/v1/billing/invoices/*/vietqr`, `GET /api/v1/billing/checkout/vietqr/*`, `GET /api/v1/billing/deposit/*/vietqr`, `GET /api/v1/billing/checkout/deposit/*/vietqr`, and `GET /api/v1/billing/payments/transactions/*/status`, and omitted `@PreAuthorize` ownership annotations on `PaymentController` and `CheckoutController`.
   - This allowed unauthenticated users to initiate VNPay payment URLs (mutating invoice state to `ISSUED` and cancelling prior `PENDING` transactions), generate VietQR payloads, or poll payment status for any guest's invoice, booking, or transaction.
3. **`P1-02` (Customer Review Lookup Missing Ownership Enforcement):**
   - `CustomerReviewController.getReviewByBookingId` (`GET /api/v1/customer/reviews/booking/{bookingId}`) used `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or hasRole('CUSTOMER')")` without calling `@billingAccess.canAccessBooking(#bookingId, authentication)`, and `ReviewService.getReviewByBookingId(Long bookingId, Long authenticatedUserId)` ignored `authenticatedUserId`. Any authenticated customer could read reviews belonging to another customer's booking.
4. **`P2-05` (Manager Role Permitted on Receptionist Write Operations):**
   - `SecurityConfig.java` line 134 matched `.requestMatchers("/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN")` across all HTTP methods, and `ReceptionistOperationController` had no method-level `@PreAuthorize` restrictions. Consequently, `ROLE_MANAGER` could execute receptionist operational writes (`POST /walk-in`, `POST /check-in/{id}/residence`, `POST /check-in/{id}/assign-villa`, `PATCH /villas/{id}/status`, `POST /bookings/{id}/cancel`) instead of having read-only visibility (`GET`).

---

## 4. Exact Implementation Changes

### 4.1. `P0-01` — Restrict Dev Token Issuance
- **`DevAuthController.java`:**
  - Added `@Profile({"dev", "local", "test"})` matching the repository's existing simulation controller convention (`VNPaySimulationController`, `M2VNPaySimulationController`).
  - Added `@ConditionalOnProperty(name = "app.auth.dev-token-enabled", havingValue = "true", matchIfMissing = false)` so the controller bean is disabled by default even in `dev`/`local`/`test` profiles unless explicitly opted in.
- **`application.yml`:**
  - Added `app.auth.dev-token-enabled: ${APP_AUTH_DEV_TOKEN_ENABLED:false}` (defaulting to `false`).
- **`SecurityConfig.java`:**
  - Gated the `/api/v1/auth/dev/**` and `/api/v1/auth/dev-token` `.permitAll()` matcher behind `allowDevTokenEndpoint = devTokenEnabled && environment != null && environment.acceptsProfiles(Profiles.of("dev", "local", "test"))`.

### 4.2. `P0-02` — Secure S42 Payment Initiation, VietQR, and Status Endpoints
- **`SecurityConfig.java`:**
  - Replaced `.permitAll()` with `.hasAnyRole("CUSTOMER", "RECEPTIONIST", "ADMIN")` on:
    - `POST /api/v1/payments/vnpay/create-payment-url`
    - `GET /api/v1/payments/status/**`, `/api/v1/invoices/*/payment-status`
    - `GET /api/v1/billing/invoices/*/vietqr`, `/api/v1/billing/checkout/vietqr/*`, `/api/v1/billing/deposit/*/vietqr`, `/api/v1/billing/checkout/deposit/*/vietqr`
    - `GET /api/v1/billing/payments/transactions/*/status`
  - Preserved `.permitAll()` strictly on provider-facing callbacks and cryptographically verified return endpoints (`/api/v1/payments/vnpay-ipn`, `/api/v1/payments/vnpay-return`, `/api/v1/payments/vnpay/verify-return`, `/api/v1/commerce/payment/webhook/**`).
- **`BillingAccessEvaluator.java` (`@billingAccess`):**
  - Added `canAccessBooking(Integer bookingId, Authentication authentication)` overload.
  - Hardened `canAccessInvoice(Long invoiceId, Authentication authentication)` so that if an invoice with `invoiceId` exists (`invoiceRepository.existsById(invoiceId)`), ownership is strictly checked via `invoiceRepository.existsByIdAndCustomerUserId(invoiceId, userId)`; only if no invoice with that ID exists does it fall back to `bookingRepository.existsByIdAndCustomerUserId(invoiceId, userId)`. This prevents ID-collision bypasses while supporting legitimate booking-ID fallback resolution.
  - Added `canCreateVnpayPayment(VnpayCreatePaymentRequest request, Authentication authentication)` to validate ownership of `request.invoiceId()` and/or `request.bookingId()` before `VNPayService.createPaymentUrl` executes any state mutation. If both `invoiceId` and `bookingId` are provided in the request payload, both must belong to the authenticated customer.
  - Added `canAccessTransaction(String transactionReference, Authentication authentication)` using `PaymentTransactionRepository.findByTransactionReference` to verify that a `ROLE_CUSTOMER` caller owns the associated `InvoiceEntity` or `RetreatBooking` (and returning `false` / `403 Forbidden` if unowned or non-existent).
- **`PaymentController.java`:**
  - Added `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canCreateVnpayPayment(#request, authentication)")` on `createPaymentUrl`.
  - Added `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessTransaction(#transactionRef, authentication)")` on `status`.
  - Added `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessInvoice(#invoiceId, authentication)")` on `invoicePaymentStatus`.
- **`CheckoutController.java`:**
  - Added `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessInvoice(#invoiceId, authentication)")` on `getInvoiceVietQr`.
  - Added `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessBooking(#bookingId, authentication)")` on `getDepositVietQr`.
  - Added `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessTransaction(#transactionReference, authentication)")` on `getTransactionStatus`.

### 4.3. `P1-02` — Enforce Customer Review Ownership
- **`CustomerReviewController.java`:**
  - Updated `getReviewByBookingId` (`GET /api/v1/customer/reviews/booking/{bookingId}`) to use `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessBooking(#bookingId, authentication)")`.
  - Passed `customerUserId` (`null` for staff, `BillingAccessEvaluator.customerUserId(authentication)` for customers) to `reviewService.getReviewByBookingId(bookingId, customerUserId)`.
- **`ReviewService.java`:**
  - Added defense-in-depth ownership verification in `getReviewByBookingId(Long bookingId, Long authenticatedUserId)`: if `authenticatedUserId != null && !bookingRepository.existsByIdAndCustomerUserId(bookingId, authenticatedUserId)`, throws `AccessDeniedException` before querying `reviewRepository`.

### 4.4. `P2-05` — Restrict Receptionist Write Operations
- **`SecurityConfig.java`:**
  - Replaced `.requestMatchers("/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN")` with:
    ```java
    .requestMatchers(HttpMethod.GET, "/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN")
    .requestMatchers("/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "ADMIN")
    ```
  - This preserves `ROLE_MANAGER` read-only operational visibility across all `GET /api/v1/receptionist/**` endpoints while restricting all write methods (`POST`, `PUT`, `PATCH`, `DELETE`) to `ROLE_RECEPTIONIST` and `ROLE_ADMIN`.

---

## 5. Endpoint Authorization Matrix (Before vs After)

| HTTP Method & Path | Controller Method | Before Phase 1 | After Phase 1 (URL + Method Authorization) | Ownership Rule (`ROLE_CUSTOMER`) | Public Gateway Callback? | Mutates State? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `GET /api/v1/auth/dev-token` | `DevAuthController.getDevToken` | `.permitAll()`, active in all profiles | `@Profile({"dev","local","test"})` + `@ConditionalOnProperty(name="app.auth.dev-token-enabled", havingValue="true", matchIfMissing=false)` | N/A (Dev/Test opt-in only; disabled by default) | No | No (mints JWT) |
| `POST /api/v1/payments/vnpay/create-payment-url` | `PaymentController.createPaymentUrl` | `.permitAll()`, no `@PreAuthorize` | `hasAnyRole('CUSTOMER','RECEPTIONIST','ADMIN')` + `@billingAccess.canCreateVnpayPayment(#request, authentication)` | Must own `request.invoiceId` and/or `request.bookingId` before URL creation | No | **Yes** (marks invoice `ISSUED`, fails prior `PENDING` VNPAY txs, creates `PENDING` tx) |
| `GET /api/v1/payments/status/{transactionRef}` | `PaymentController.status` | `.permitAll()`, no `@PreAuthorize` | `hasAnyRole('CUSTOMER','RECEPTIONIST','ADMIN')` + `@billingAccess.canAccessTransaction(#transactionRef, authentication)` | Must own transaction's `invoice` or `retreatBooking` | No | No |
| `GET /api/v1/invoices/{invoiceId}/payment-status` | `PaymentController.invoicePaymentStatus` | `.permitAll()`, no `@PreAuthorize` | `hasAnyRole('CUSTOMER','RECEPTIONIST','ADMIN')` + `@billingAccess.canAccessInvoice(#invoiceId, authentication)` | Must own `invoiceId` (or fallback `bookingId` if no invoice with `invoiceId` exists) | No | Yes (if invoice not yet generated for booking fallback) |
| `GET /api/v1/billing/invoices/{invoiceId}/vietqr`<br>`GET /api/v1/billing/checkout/vietqr/{invoiceId}` | `CheckoutController.getInvoiceVietQr` | `.permitAll()`, no `@PreAuthorize` | `hasAnyRole('CUSTOMER','RECEPTIONIST','ADMIN')` + `@billingAccess.canAccessInvoice(#invoiceId, authentication)` | Must own `invoiceId` | No | **Yes** (saves `PENDING` `VIETQR_BANK_TRANSFER` tx) |
| `GET /api/v1/billing/deposit/{bookingId}/vietqr`<br>`GET /api/v1/billing/checkout/deposit/{bookingId}/vietqr` | `CheckoutController.getDepositVietQr` | `.permitAll()`, no `@PreAuthorize` | `hasAnyRole('CUSTOMER','RECEPTIONIST','ADMIN')` + `@billingAccess.canAccessBooking(#bookingId, authentication)` | Must own `bookingId` | No | **Yes** (saves `PENDING` deposit `VIETQR_BANK_TRANSFER` tx) |
| `GET /api/v1/billing/payments/transactions/{transactionReference}/status` | `CheckoutController.getTransactionStatus` | `.permitAll()`, no `@PreAuthorize` | `hasAnyRole('CUSTOMER','RECEPTIONIST','ADMIN')` + `@billingAccess.canAccessTransaction(#transactionReference, authentication)` | Must own transaction's `invoice` or `retreatBooking` | No | No |
| `GET /api/v1/payments/vnpay-ipn` | `VNPayCallbackController.handleVNPayIpn` | `.permitAll()` + HMAC-SHA512 | `.permitAll()` + HMAC-SHA512 + amount & txnRef verification | Verified by cryptographic HMAC-SHA512 + `vnp_TxnRef` | **Yes** (Provider IPN) | **Yes** (idempotent deposit confirmation) |
| `GET /api/v1/payments/vnpay-return` | `VNPayCallbackController.handleVNPayReturn` | `.permitAll()` + HMAC-SHA512 | `.permitAll()` + HMAC-SHA512 + amount & txnRef verification | Verified by cryptographic HMAC-SHA512 + `vnp_TxnRef` | **Yes** (Signed return) | **Yes** (idempotent deposit confirmation) |
| `GET /api/v1/payments/vnpay/verify-return` | `PaymentController.verifyReturn` | `.permitAll()` + HMAC-SHA512 | `.permitAll()` + HMAC-SHA512 + amount & txnRef verification | Verified by cryptographic HMAC-SHA512 + `vnp_TxnRef` | **Yes** (Signed return) | **Yes** (idempotent final payment settlement) |
| `GET/POST /api/v1/commerce/payment/webhook/vnpay` | `VnpayWebhookController.handleVnpayWebhook` | `.permitAll()` + HMAC-SHA512 | `.permitAll()` + HMAC-SHA512 + amount & txnRef verification | Verified by cryptographic HMAC-SHA512 + `vnp_TxnRef` | **Yes** (Provider IPN) | **Yes** (idempotent final payment settlement) |
| `POST /api/v1/commerce/payment/webhook/vietqr`<br>`POST /api/v1/commerce/payment/webhook/bank-transfer` | `VnpayWebhookController.handleVietQrWebhook` | `.permitAll()` + `X-Webhook-Secret` header | `.permitAll()` + mandatory `X-Webhook-Secret` header (`401` if invalid) | Verified by `X-Webhook-Secret` + `transactionReference` | **Yes** (Provider Webhook) | **Yes** (idempotent VietQR settlement) |
| `GET /api/v1/customer/reviews/booking/{bookingId}` | `CustomerReviewController.getReviewByBookingId` | `hasAnyRole('RECEPTIONIST','ADMIN') or hasRole('CUSTOMER')` (no ownership check) | `hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.canAccessBooking(#bookingId, authentication)` + service-level check | Must own `bookingId` (`403 Forbidden` if unowned or non-existent) | No | No |
| `GET /api/v1/receptionist/**` | `ReceptionistOperationController` (`getDailyArrivals`, `getAllVillas`, `getAllBookings`, etc.) | `hasAnyRole('RECEPTIONIST','MANAGER','ADMIN')` | `hasAnyRole('RECEPTIONIST','MANAGER','ADMIN')` | Staff/Manager read-only visibility | No | No |
| `POST/PATCH /api/v1/receptionist/**` | `ReceptionistOperationController` (`createWalkInBooking`, `recordResidenceInfo`, `assignVillaAndCheckIn`, `updateVillaStatus`, `cancelBooking`) | `hasAnyRole('RECEPTIONIST','MANAGER','ADMIN')` | `hasAnyRole('RECEPTIONIST','ADMIN')` (`ROLE_MANAGER` denied with `403`) | Receptionist / Admin operational writes only | No | **Yes** |

---

## 6. Test Cases Added or Modified

1. **`DevAuthControllerSecurityTest.java` (New — 5 tests for `P0-01`):**
   - `devAuthControllerUnavailableInProductionProfileEvenIfPropertyTrue`: Verifies `DevAuthController` bean is not registered under `prod` profile even if `app.auth.dev-token-enabled=true`.
   - `devAuthControllerUnavailableWhenPropertyMissing`: Verifies `DevAuthController` bean is not registered under `dev` profile when `app.auth.dev-token-enabled` is omitted.
   - `devAuthControllerUnavailableWhenPropertyFalse`: Verifies `DevAuthController` bean is not registered under `dev` profile when `app.auth.dev-token-enabled=false`.
   - `devAuthControllerAvailableOnlyWhenProfileAndOptInPropertyActive`: Verifies `DevAuthController` bean is registered and functional only when profile is in `{"dev", "local", "test"}` AND `app.auth.dev-token-enabled=true`.
   - `defaultContextBlocksDevTokenEndpoint`: Verifies the default `@SpringBootTest` context does not register `DevAuthController` and rejects unauthenticated `GET /api/v1/auth/dev-token` with `401 Unauthorized`.

2. **`RetreatBookingSecurityTest.java` (Modified — +3 tests for `P2-05`, total 17 tests):**
   - `testManagerCanAccessPermittedReceptionistGetEndpoints`: Verifies `ROLE_MANAGER` receives `200 OK` on `GET /api/v1/receptionist/arrivals`, `/villas`, and `/bookings`.
   - `testManagerDeniedReceptionistWriteOperations`: Verifies `ROLE_MANAGER` receives `403 Forbidden` on `POST /walk-in`, `POST /check-in/1/residence`, `POST /check-in/1/assign-villa`, `PATCH /villas/1/status`, and `POST /bookings/1/cancel`, and confirms `ReceptionistOperationService` write methods are never invoked.
   - `testReceptionistAndAdminCanPerformReceptionistWrites`: Verifies `ROLE_RECEPTIONIST` and `ROLE_ADMIN` receive `200 OK` on receptionist write endpoints.

3. **`M5BillingAndCheckoutTests.java` (Modified — +4 comprehensive test methods for `P0-02` and `P1-02`, total 56 tests):**
   - `testP002UnauthenticatedS42EndpointsRejected`: Verifies `401 Unauthorized` across all 8 S42 payment initiation, VietQR, and status endpoints when unauthenticated.
   - `testP002S42OwnershipAndStaffAuthorization`: Verifies Customer B receives `403 Forbidden` on Customer A's invoice/booking/transaction across all S42 endpoints, Customer A receives `200 OK` on their own invoice/booking/transaction, and `ROLE_RECEPTIONIST`/`ROLE_ADMIN` receive `200 OK`.
   - `testP002CallbacksAndVerifyReturnSecurity`: Verifies `/api/v1/payments/vnpay/verify-return` and `/api/v1/commerce/payment/webhook/vietqr` remain publicly reachable for callbacks while rejecting forged signatures (`RspCode 97`), unknown transaction references (`RspCode 01`), and missing/invalid webhook secrets (`401` + `code 97`).
   - `testP102CustomerReviewOwnershipEnforcement`: Verifies Customer A can retrieve their own review (`200 OK`), Customer B is denied (`403 Forbidden`), non-existent booking IDs return `403 Forbidden` to customers (no existence leakage), service-level `getReviewByBookingId` throws `AccessDeniedException` on non-owner `userId`, and `RECEPTIONIST`/`ADMIN` receive `200 OK` (or `404 Not Found` when absent).

---

## 7. Actual Test Execution Results

All tests were executed against isolated in-memory H2 (`jdbc:h2:mem:testdb;MODE=MSSQLServer`). Physical SQL Server databases `HSWRMS` and `HSWRMS_TEST` were never contacted.

| Test Suite / Command | Tests Run | Passed | Failed | Errors | Skipped | Exit Code |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `.\mvnw.cmd test -Dtest="DevAuthControllerSecurityTest,RetreatBookingSecurityTest,VNPayDepositServiceTest,AuthLoginEndpointTests,AuthConcurrencyMappingTests,SsoAuthEndpointTests,AuthServiceTest"` | **60** | **60** | 0 | 0 | 0 | `0` |
| `.\mvnw.cmd test -Dtest="AdjustmentServiceTest,RefundSettlementLifecycleTest,FnbFolioIntegrationTest,AdminControllersSecurityTest"` *(executed in batch `task-6772`)* | **75** | **75** | 0 | 0 | 0 | `0` *(suite level)* |
| `.\mvnw.cmd test -Dtest="M5BillingAndCheckoutTests,VietQrAndPaymentWebhookTest"` (`task-6795`) | **59** | **59** | 0 | 0 | 0 | `0` |
| Frontend Contract Suite: `npx tsx --test "src/**/*.test.ts"` (`48` suites) | **159** | **159** | 0 | 0 | 0 | `0` |
| **Total Newly Executed Verification Tests** | **353** | **353** | **0** | **0** | **0** | **`0`** |

---

## 8. Payment and Webhook Regression Assessment

1. **M2 VNPay Deposit Flow (`PASS`):**
   - `POST /api/v1/customer/bookings/{id}/vnpay-url` continues to enforce customer ownership via `VNPayDepositService`.
   - `GET /api/v1/payments/vnpay-ipn` and `GET /api/v1/payments/vnpay-return` remain publicly reachable for VNPay callbacks and enforce HMAC-SHA512 checksum and amount validation (`VNPayDepositServiceTest`: `4/4 PASS`).
2. **M5 VNPay Final Payment & VietQR Flows (`PASS`):**
   - Authenticated customers can initiate VNPay payment URLs (`POST /api/v1/payments/vnpay/create-payment-url`), generate invoice/deposit VietQR codes (`GET /api/v1/billing/invoices/{id}/vietqr`, `GET /api/v1/billing/deposit/{id}/vietqr`), and poll transaction/invoice status for their own stays.
   - `RECEPTIONIST` and `ADMIN` roles retain full operational access to initiate and monitor payments across stays.
   - Provider callbacks (`GET/POST /api/v1/commerce/payment/webhook/vnpay`, `POST /api/v1/commerce/payment/webhook/vietqr`) and signed return verification (`GET /api/v1/payments/vnpay/verify-return`) remain reachable without a JWT and enforce HMAC-SHA512 / `X-Webhook-Secret`, exact server-side amount matching (`RspCode 04` on mismatch), and idempotent settlement (`M5BillingAndCheckoutTests`: `56/56 PASS`, `VietQrAndPaymentWebhookTest`: `3/3 PASS`).

---

## 9. Security Review Results (Section 8 Checklist)

| Review Criterion | Result | Evidence |
| :--- | :--- | :--- |
| **Accidental public access introduced by matcher ordering** | **NONE (`PASS`)** | All specific `.permitAll()` catalog/callback rules are scoped by exact HTTP method and path; `/api/v1/receptionist/**` `HttpMethod.GET` precedes the write fallback matcher; `.anyRequest().authenticated()` terminates the chain. |
| **Payment endpoint protected at URL layer but missing object-level ownership validation** | **NONE (`PASS`)** | Every S42 endpoint in `PaymentController` and `CheckoutController` is annotated with `@PreAuthorize("hasAnyRole('RECEPTIONIST','ADMIN') or @billingAccess.can...")`. |
| **Public callbacks that no longer work** | **NONE (`PASS`)** | `/api/v1/payments/vnpay-ipn`, `/api/v1/payments/vnpay-return`, `/api/v1/payments/vnpay/verify-return`, and `/api/v1/commerce/payment/webhook/**` remain `.permitAll()` and pass all callback tests. |
| **Browser return routes mistakenly treated as trusted provider callbacks** | **NONE (`PASS`)** | Both `/api/v1/payments/vnpay-return` and `/api/v1/payments/vnpay/verify-return` verify `vnp_SecureHash` via HMAC-SHA512 (`verifyChecksum`) and validate `vnp_TxnRef` + `vnp_Amount` before any state change. |
| **Dev token endpoint available outside approved profiles** | **NONE (`PASS`)** | `@Profile({"dev", "local", "test"})` on `DevAuthController` + `Profiles.of("dev", "local", "test")` check in `SecurityConfig` prevents activation in `prod`. |
| **Dev token feature enabled by default** | **NONE (`PASS`)** | `matchIfMissing = false` on `@ConditionalOnProperty` and `app.auth.dev-token-enabled: ${APP_AUTH_DEV_TOKEN_ENABLED:false}` in `application.yml` keep it disabled by default. |
| **Customer ownership checks bypassable with a supplied user ID** | **NONE (`PASS`)** | `BillingAccessEvaluator.customerUserId(authentication)` extracts `userId` exclusively from the authenticated `CustomUserDetails` principal. |
| **Manager write access accidentally retained** | **NONE (`PASS`)** | Only `HttpMethod.GET` on `/api/v1/receptionist/**` includes `MANAGER`; `POST`/`PATCH`/`PUT`/`DELETE` require `hasAnyRole("RECEPTIONIST", "ADMIN")`. |
| **Regression to M2 deposit and M5 final payment** | **NONE (`PASS`)** | Verified by `VNPayDepositServiceTest` (`4/4`), `M5BillingAndCheckoutTests` (`56/56`), `VietQrAndPaymentWebhookTest` (`3/3`), and frontend suite (`159/159`). |
| **Sensitive data exposed in error responses** | **NONE (`PASS`)** | Unauthorized/forbidden requests return standard `401`/`403` `ApiResponse` payloads without leaking booking existence or PII. |

---

## 10. Remaining Issues and Limitations (Deferred to Subsequent Phases)

Per Section 1 & Section 9 scope rules ("Do not expand the scope to unrelated P1/P2 findings"), the following non-Phase-1 findings from `06_Reports/PHASE_M1_M6_INTEGRATION_READINESS_REVIEW.md` remain queued for Phase 2+:
- **`P1-01`:** `CheckoutService.confirmGatewayPayment` auto-closes stay (`closeStayAndReleaseVilla`) upon webhook settlement without calling `folioBillingService.validateBillingGuard(bookingId)`.
- **`P1-03`:** Secondary endpoint `PATCH /api/v1/villas/{villaNumber}/status` in `VillaInventoryController.java` updates `villaStatus` without checking for an active `CHECKED_IN` booking.
- **`P1-04`:** `SystemOverviewService` (`/api/v1/manager/dashboard`, `/api/v1/system-overview`, `/api/v1/system-overview/police-residency-report/export`) returns static widget values and a static 2-row CSV instead of querying live tables.
- **`P2-01` / `P2-02` / `P2-03` / `P2-06` / `P2-07`:** Unmapped `createVilla`/`createVillaCategory` methods in `VillaInventoryController`, booking reference prefix unification, extra Spa session cancellation folio synchronization, `ManagerDashboardPage.tsx` live API wiring, and `JwtAuthenticationFilter.isAccountActive` fallback semantics.

---

## 11. Final Git Status

- **Branch:** `feature/hswrms-m1-m6-integration`
- **HEAD:** `a053774c992472c7fb5aacb029e57ff1ffdb4380` (unchanged)
- **Staged Files:** `0`
- **Unstaged Modified Tracked Files (`10`):**
  - `M 05_Development/backend/src/main/java/com/heavenstay/hswrms/common/api/DevAuthController.java`
  - `M 05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java`
  - `M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CheckoutController.java`
  - `M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CustomerReviewController.java`
  - `M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/PaymentController.java`
  - `M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/security/BillingAccessEvaluator.java`
  - `M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/ReviewService.java`
  - `M 05_Development/backend/src/main/resources/application.yml`
  - `M 05_Development/backend/src/test/java/com/heavenstay/hswrms/m2booking/RetreatBookingSecurityTest.java`
  - `M 05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/M5BillingAndCheckoutTests.java`
- **Untracked Paths (`7`):**
  - `?? 05_Development/backend/src/test/java/com/heavenstay/hswrms/common/api/DevAuthControllerSecurityTest.java`
  - `?? 05_Development/database/generated/`
  - `?? 06_Reports/PHASE_1_SECURITY_LOCKDOWN_IMPLEMENTATION_REPORT.md`
  - `?? 06_Reports/PHASE_FINAL_REMEDIATION_COMMIT_AND_PUSH_REPORT.md`
  - `?? 06_Reports/PHASE_M1_M6_INTEGRATION_READINESS_REVIEW.md`
  - `?? 06_Reports/audit-output/backup_targeted_correction_20261029/`
  - `?? 06_Reports/visual-evidence/`

---

## 12. Explicit Safety Confirmation

- **No Git Staging, Commits, or Pushes:** Zero `git add`, `git commit`, or `git push` operations were executed. `HEAD` remains at `a053774c992472c7fb5aacb029e57ff1ffdb4380`.
- **No Destructive Git Operations:** Zero `git reset`, `git clean`, `git checkout`, `git stash`, or `git rebase` commands were executed; all pre-existing untracked files and directories are preserved intact.
- **No Physical SQL Server Connections or Writes:** All tests ran exclusively against isolated in-memory H2 (`jdbc:h2:mem:testdb`). Physical SQL Server databases `HSWRMS` and `HSWRMS_TEST` were never accessed or modified.

