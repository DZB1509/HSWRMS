# HSWRMS — PHASE 1.1: INDEPENDENT SECURITY REVIEW (READ-ONLY)

- **Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`
- **Branch:** `feature/hswrms-m1-m6-integration`
- **Verified Baseline HEAD:** `a053774c992472c7fb5aacb029e57ff1ffdb4380`
- **Reference Implementation Report:** `06_Reports/PHASE_1_SECURITY_LOCKDOWN_IMPLEMENTATION_REPORT.md`
- **Review Mode:** Independent, Read-Only Security & Regression Audit (Zero source, test, configuration, or prior report files modified)
- **Review Date:** 2026-10-31

---

## 1. Executive Summary & Overall Verdict

### Overall Verdict: **CONDITIONAL PASS (Core P0/P1/P2 Lockdowns Verified; 1 P1 Edge-Case Defect and 2 P2 Findings Identified for Remediation)**

An independent, read-only security audit was conducted directly against the unstaged working-tree diff (`10` modified tracked files and `1` untracked security test file) and the surrounding service/repository call graph (`VNPayService`, `VietQrService`, `VnpayWebhookController`, `InvoiceRepository`, `RetreatBookingRepository`, `PaymentTransactionRepository`, `ReceptionistOperationController`).

1. **`P0-01` (`DevAuthController` Production Exposure): VERIFIED CLOSED.**
   - Dual-gated at both the Spring bean registration layer (`@Profile({"dev", "local", "test"})` + `@ConditionalOnProperty(name = "app.auth.dev-token-enabled", havingValue = "true", matchIfMissing = false)`) and the HTTP security filter layer (`SecurityConfig` only registers `.permitAll()` on `/api/v1/auth/dev/**` and `/api/v1/auth/dev-token` when both conditions hold).
2. **`P0-02` (S42 Payment Initiation, VietQR & Payment-Status Unauthenticated/Cross-Customer Exposure): SUBSTANTIALLY CLOSED, WITH 1 `P1` MIXED-IDENTIFIER BYPASS (`P1-IR-01`) AND 2 `P2` SERVICE-LAYER FINDINGS (`P2-IR-02`, `P2-IR-03`).**
   - Unauthenticated access to all 5 S42 customer/staff endpoints is completely blocked (`401 Unauthorized`), while genuine external callbacks (`/api/v1/payments/vnpay/callback`, `/api/v1/payments/vnpay/ipn`, `/api/v1/billing/webhooks/vnpay`, `/api/v1/billing/webhooks/vietqr`) remain reachable and protected by HMAC-SHA512 / API key verification.
   - However, static path analysis of `BillingAccessEvaluator.canCreateVnpayPayment` vs `VNPayService.resolveInvoice` uncovered a **mixed-identifier authorization bypass (`P1-IR-01`)** when a customer supplies both their own un-invoiced `bookingId` and another customer's `bookingId` inside the `invoiceId` field (where no `InvoiceEntity` has primary key `invoice_id == request.invoiceId()`).
   - Additionally, `VietQrService.generateInvoiceVietQr(Long invoiceId)` has a **booking-ID fallback identifier mismatch (`P2-IR-02`)** (using the path parameter `invoiceId` instead of `invoice.getInvoiceId()` when querying prior payments and building `txnRef`), and both `GET .../vietqr` endpoints **mutate state and insert a new `PENDING` `PaymentTransactionEntity` on every HTTP `GET` request (`P2-IR-03`)**.
3. **`P1-02` (Customer Review Lookup Cross-Booking IDOR): VERIFIED CLOSED.**
   - Enforced at both the controller layer (`@AuthenticationPrincipal JwtUserPrincipal` in `CustomerReviewController.getReviewsByBooking`) and the service layer (`ReviewService.getReviewsByBooking(Integer bookingId, Integer customerUserId)` verifying `booking.getCustomer().getUserId().equals(customerUserId)`).
4. **`P2-05` (Manager Role Excessive Write Access on `/api/v1/receptionist/**`): VERIFIED CLOSED.**
   - `SecurityConfig` orders `.requestMatchers(HttpMethod.GET, "/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN")` strictly before `.requestMatchers("/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "ADMIN")`.

---

## 2. Independent Review of the Four Phase 1 Findings

| Phase 1 Finding ID | Target Area | Implementation Status | Independent Review Verdict | Notes / Residual Findings |
| :--- | :--- | :--- | :--- | :--- |
| **`P0-01`** | `DevAuthController` & `/api/v1/auth/dev/**` | Implemented in `DevAuthController.java`, `SecurityConfig.java`, `application.yml` | **PASS (Closed)** | Bean is absent and URLs require authentication by default across all profiles unless `app.auth.dev-token-enabled=true` AND profile is `dev`/`local`/`test`. Even with `app.auth.dev-token-enabled=true` in `prod`, bean registration and `permitAll()` remain disabled. |
| **`P0-02`** | S42 VNPay / VietQR / Payment Status (`PaymentController`, `CheckoutController`, `SecurityConfig`, `BillingAccessEvaluator`) | Implemented in `SecurityConfig.java`, `BillingAccessEvaluator.java`, `PaymentController.java`, `CheckoutController.java` | **CONDITIONAL PASS (`P1-IR-01`, `P2-IR-02`, `P2-IR-03`)** | Unauthenticated access (`401`) and standard single-ID cross-customer access (`403`) are blocked. However, a mixed `{bookingId, invoiceId}` payload can bypass `canCreateVnpayPayment` (`P1-IR-01`), and `VietQrService` has a fallback ID collision (`P2-IR-02`) and non-idempotent `GET` transaction creation (`P2-IR-03`). |
| **`P1-02`** | `GET /api/v1/customer/reviews/booking/{bookingId}` | Implemented in `CustomerReviewController.java`, `ReviewService.java` | **PASS (Closed)** | Cross-customer requests receive `403 Forbidden` (`AccessDeniedException`), and unauthenticated requests receive `401 Unauthorized`. |
| **`P2-05`** | `ROLE_MANAGER` write restriction on `/api/v1/receptionist/**` | Implemented in `SecurityConfig.java` | **PASS (Closed)** | `ROLE_MANAGER` retains `GET /api/v1/receptionist/**` (`200 OK`) and is denied (`403 Forbidden`) on `POST`, `PUT`, `PATCH`, `DELETE`. |

---

## 3. Detailed Evaluation of the 10 Review Targets & 7 Special-Attention Scenarios

### Target 1: `DevAuthController` Profile and Opt-In Property Behavior
- **Files & Methods Inspected:**
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/common/api/DevAuthController.java` (lines 28–39)
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java` (lines 48–50, 99–104)
  - `05_Development/backend/src/main/resources/application.yml` (lines 111–113)
- **Special-Attention Question — Can `DevAuthController` be activated accidentally in production?**
  - **No.** Activation requires the logical conjunction of two independent guards:
    1. Active Spring profile matching `@Profile({"dev", "local", "test"})` (and `environment.acceptsProfiles(Profiles.of("dev", "local", "test"))` in `SecurityConfig`).
    2. Property `app.auth.dev-token-enabled=true` (which defaults to `false` in `application.yml` via `${APP_AUTH_DEV_TOKEN_ENABLED:false}` and has `matchIfMissing = false` on `@ConditionalOnProperty`).
  - Even if `APP_AUTH_DEV_TOKEN_ENABLED=true` is accidentally set in a `prod` environment, `@Profile({"dev", "local", "test"})` prevents `DevAuthController` from being instantiated, and `SecurityConfig` does not add `.permitAll()` for `/api/v1/auth/dev/**` or `/api/v1/auth/dev-token` (falling through to `.anyRequest().authenticated()` → `401 Unauthorized`).
  - Conversely, in a `dev`, `local`, or `test` profile where `APP_AUTH_DEV_TOKEN_ENABLED` is not set, `app.auth.dev-token-enabled` defaults to `false`, so `DevAuthController` is not registered and `/api/v1/auth/dev-token` returns `401 Unauthorized`.
- **Minor Observation (`P3-IR-01` — Intentional Local Dev Behavior):**
  - When explicitly opted-in during local development (`spring.profiles.active=dev` + `app.auth.dev-token-enabled=true`), `GET /api/v1/auth/dev-token` mints a multi-role token for `userId=1` (`eleanor.vance@heavenstay.resort`). Because it is impossible to enable in `prod` and disabled by default in all profiles, this is an intentional local development convenience, not a production defect.

---

### Target 2 & Target 8: `SecurityConfig` Matcher Ordering, Fallback Behavior, and Receptionist `GET` vs Write Rules
- **File & Lines Inspected:**
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java` (lines 90–160)
- **Matcher Ordering Analysis:**
  1. Optional dev-auth `.permitAll()` (lines 99–104, only if `devTokenEnabled && environment.acceptsProfiles(Profiles.of("dev", "local", "test"))`).
  2. Public auth endpoints `/api/v1/auth/login`, `/api/v1/auth/register`, `/api/v1/auth/google`, `/api/v1/auth/Staff-login`, `/api/v1/auth/forgot-password`, `/api/v1/auth/reset-password` (`.permitAll()`, lines 105–112).
  3. Public catalog/room/voucher/F&B menu read endpoints (`.permitAll()`, lines 113–122).
  4. External payment gateway callbacks:
     - `/api/v1/billing/webhooks/**` (`.permitAll()`, line 124)
     - `HttpMethod.GET, "/api/v1/payments/vnpay/callback", "/api/v1/payments/vnpay/ipn"` (`.permitAll()`, line 125)
  5. Role-scoped and authenticated matchers:
     - `/api/v1/payments/vnpay/**` → `hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")` (line 126)
     - `/api/v1/invoices/**` → `hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")` (line 127)
     - `/api/v1/billing/**` → `.authenticated()` (line 135, further constrained by `@PreAuthorize` on every controller method in `CheckoutController` and `FnbBillingController`)
     - `HttpMethod.GET, "/api/v1/receptionist/**"` → `hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN")` (line 153)
     - `"/api/v1/receptionist/**"` → `hasAnyRole("RECEPTIONIST", "ADMIN")` (line 154)
     - Fallback `.anyRequest().authenticated()` (line 156).
- **Special-Attention Question — Could any `OPTIONS`, `HEAD`, `PUT`, `DELETE`, or `PATCH` path under `/api/v1/receptionist/**` behave unexpectedly?**
  - **CORS Preflight (`OPTIONS`):** Because `.cors(Customizer.withDefaults())` is enabled on `HttpSecurity` (line 91), Spring Security's `CorsFilter` processes preflight `OPTIONS` requests before `AuthorizationFilter`. Thus browser CORS preflight requests are not broken by the `/api/v1/receptionist/**` authorization rule.
  - **Write Methods (`POST`, `PUT`, `PATCH`, `DELETE`):** None of these match `HttpMethod.GET`, so they all fall through to line 154 (`.requestMatchers("/api/v1/receptionist/**").hasAnyRole("RECEPTIONIST", "ADMIN")`), rejecting `ROLE_MANAGER` and `ROLE_CUSTOMER` with `403 Forbidden`.
  - **`HEAD` Requests:** Spring MVC does not declare custom `@RequestMapping(method = RequestMethod.HEAD)` handlers on `ReceptionistOperationController`, and non-`GET` methods fall through to line 154 (`RECEPTIONIST`, `ADMIN`). All 14 endpoints in `ReceptionistOperationController` use `@GetMapping`, `@PostMapping`, or `@PatchMapping` exclusively.

---

### Target 3, Target 4 & Target 5: `BillingAccessEvaluator` Ownership Logic, `PaymentController` / `CheckoutController` Method-Level Authorization, and `VNPayService` / `VietQrService` Fallback Behavior

This is the most critical area of the independent review. All 4 special-attention questions for `BillingAccessEvaluator`, `VNPayService`, and `VietQrService` are analyzed below.

#### Finding `P1-IR-01` (Genuine Defect — Severity: **P1 High**): Mixed `bookingId` + `invoiceId` Authorization Bypass in `BillingAccessEvaluator.canCreateVnpayPayment` vs `VNPayService.resolveInvoice`
- **File & Method:**
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/security/BillingAccessEvaluator.java` — `canCreateVnpayPayment(VnpayCreatePaymentRequest request, Authentication authentication)` (lines 68–100)
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VNPayService.java` — `resolveInvoice(VnpayCreatePaymentRequest req)` (lines 122–137)
- **Exact Problematic Condition:**
  In `BillingAccessEvaluator.canCreateVnpayPayment` (lines 89–98):
  ```java
  if (hasInvoiceId) {
      if (invoiceRepository.existsById(request.invoiceId())) {
          if (!invoiceRepository.existsByIdAndCustomerUserId(request.invoiceId(), userId)) {
              return false;
          }
      } else if (!hasBookingId && !bookingRepository.existsByIdAndCustomerUserId(request.invoiceId(), userId)) {
          return false;
      }
  }
  if (hasBookingId && !bookingRepository.existsByIdAndCustomerUserId(request.bookingId(), userId)) {
      return false;
  }
  return true;
  ```
  Now compare this with `VNPayService.resolveInvoice(VnpayCreatePaymentRequest req)` (lines 122–137):
  ```java
  private InvoiceEntity resolveInvoice(VnpayCreatePaymentRequest req) {
      if (req.bookingId() != null && req.bookingId() > 0) {
          Optional<InvoiceEntity> byBooking = invoiceRepository.findByRetreatBookingId(req.bookingId());
          if (byBooking.isPresent()) return byBooking.get();
      }
      if (req.invoiceId() != null && req.invoiceId() > 0) {
          Optional<InvoiceEntity> byId = invoiceRepository.findByIdWithDetails(req.invoiceId());
          if (byId.isPresent()) return byId.get();
          if (req.invoiceId() <= Integer.MAX_VALUE) {
              Optional<InvoiceEntity> byBooking = invoiceRepository.findByRetreatBookingId(req.invoiceId().intValue());
              if (byBooking.isPresent()) return byBooking.get();
          }
          throw new ResourceNotFoundException("Invoice not found with ID: " + req.invoiceId());
      }
      throw new BusinessRuleException("MISSING_TARGET", "invoiceId or bookingId is required.");
  }
  ```
- **Concrete Exploit / Bypass Scenario:**
  1. Suppose **Customer A** owns `Booking #10`, which is in `PENDING` or `CONFIRMED` status and **does not yet have an `InvoiceEntity`** (`invoiceRepository.findByRetreatBookingId(10L)` is `Optional.empty()`).
  2. Suppose **Customer B** owns `Booking #50`, which has `Invoice #2` (`invoice_id = 2`, `retreat_booking_id = 50`), and no invoice in the database has primary key `invoice_id = 50` (`invoiceRepository.existsById(50L)` is `false`).
  3. Customer A sends:
     `POST /api/v1/payments/vnpay/create-payment-url`
     ```json
     { "bookingId": 10, "invoiceId": 50 }
     ```
  4. In `BillingAccessEvaluator.canCreateVnpayPayment`:
     - `hasInvoiceId` is `true` (`50`), `hasBookingId` is `true` (`10`).
     - `invoiceRepository.existsById(50L)` is `false`.
     - The `else if (!hasBookingId && ...)` branch is **skipped** because `hasBookingId` is `true`!
     - `bookingRepository.existsByIdAndCustomerUserId(10L, customerAUserId)` is `true` (Customer A owns Booking #10).
     - `canCreateVnpayPayment` returns **`true`**!
  5. Execution enters `VNPayService.createPaymentUrl` → `resolveInvoice`:
     - Step 1: `req.bookingId()` is `10`. `invoiceRepository.findByRetreatBookingId(10L)` returns `Optional.empty()` because Booking #10 has no invoice.
     - Step 2: Execution falls through to `req.invoiceId()` (`50`). `invoiceRepository.findByIdWithDetails(50L)` returns `Optional.empty()`.
     - Step 3: `invoiceRepository.findByRetreatBookingId(50)` returns **Customer B's `Invoice #2`**!
     - `VNPayService.createPaymentUrl` transitions Customer B's `Invoice #2` to `ISSUED`, creates a `PENDING` `PaymentTransactionEntity` on Customer B's invoice, and returns Customer B's invoice payment URL and amount to Customer A.
- **Why It Happens:**
  - First, `else if (!hasBookingId && ...)` skips validating `request.invoiceId()` as a fallback `bookingId` whenever `hasBookingId` is `true`.
  - Second, when both `invoiceId` and `bookingId` are provided in `VnpayCreatePaymentRequest`, neither `BillingAccessEvaluator` nor `VNPayService` verifies that `invoiceId` and `bookingId` refer to the **same** booking/invoice.
- **Recommended Minimal Correction:**
  1. In `BillingAccessEvaluator.canCreateVnpayPayment`:
     - Remove `!hasBookingId &&` from the `else if` branch so `request.invoiceId()` is **always** verified against either `invoiceRepository.existsByIdAndCustomerUserId(request.invoiceId(), userId)` (when `invoiceRepository.existsById(request.invoiceId())` is true) or `bookingRepository.existsByIdAndCustomerUserId(request.invoiceId(), userId)` (when `invoiceRepository.existsById(request.invoiceId())` is false).
     - If both `hasInvoiceId` and `hasBookingId` are true and `invoiceRepository.existsById(request.invoiceId())` is true, also verify that the invoice actually belongs to `request.bookingId()` (or in `VNPayService.resolveInvoice`, do not fall through from a provided `req.bookingId()` to `req.invoiceId()`).

---

#### Special-Attention Analysis: What if `targetId` Matches Both an `invoiceId` of Customer A and a `bookingId` of Customer B (ID Collision)?
- **Files & Methods Inspected:**
  - `BillingAccessEvaluator.canAccessInvoiceOrBookingTarget(Long targetId, Authentication authentication)` (lines 52–66)
  - `VietQrService.generateInvoiceVietQr(Long invoiceId)` (lines 67–71)
  - `VNPayService.resolveInvoice(VnpayCreatePaymentRequest req)` (lines 126–135)
- **Analysis of Authorization Consistency:**
  - Suppose `targetId = 5` is the primary key of **Customer A's `Invoice #5`** (for Booking #20) AND `5` is also the primary key of **Customer B's `Booking #5`** (whose invoice is `Invoice #12`).
  - Both `VietQrService.generateInvoiceVietQr(5L)` and `VNPayService.resolveInvoice` (when given `invoiceId = 5`) resolve `invoiceRepository.findByIdWithDetails(5L)` **first**, before falling back to `findByRetreatBookingId(5)`.
  - In `BillingAccessEvaluator.canAccessInvoiceOrBookingTarget(5L, auth)`:
    ```java
    if (invoiceRepository.existsById(targetId)) {
        return invoiceRepository.existsByIdAndCustomerUserId(targetId, userId);
    }
    return bookingRepository.existsByIdAndCustomerUserId(targetId, userId);
    ```
    Because `invoiceRepository.existsById(5L)` is `true`, `BillingAccessEvaluator` checks ownership of **`Invoice #5` (Customer A)** and rejects **Customer B (`403 Forbidden`)**.
  - **Can Customer B access Customer A's `Invoice #5` via this collision?** **No** — Customer B is rejected (`403`) because `existsById(5L)` is `true` and `existsByIdAndCustomerUserId(5L, customerB)` is `false`.
  - **What happens if Customer B tries to pass their `bookingId = 5` to `GET /api/v1/billing/invoices/5/vietqr` instead of their `invoiceId = 12`?** Customer B gets `403 Forbidden` (because `/api/v1/billing/invoices/5/vietqr` resolves `5` as `Invoice #5`, which belongs to Customer A). If Customer B uses their actual `invoiceId = 12` (`/api/v1/billing/invoices/12/vietqr`), it succeeds.

---

#### Finding `P2-IR-02` (Genuine Functional/Financial Bug — Severity: **P2 Medium**): `VietQrService.generateInvoiceVietQr` Uses Path Parameter `invoiceId` Instead of Resolved `invoice.getInvoiceId()` After Booking-ID Fallback
- **File & Method:**
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VietQrService.java` — `generateInvoiceVietQr(Long invoiceId)` (lines 67–133)
- **Exact Problematic Condition:**
  In `VietQrService.generateInvoiceVietQr(Long invoiceId)`:
  ```java
  InvoiceEntity invoice = invoiceRepository.findByIdWithDetails(invoiceId)
          .or(() -> invoiceId <= Integer.MAX_VALUE
                  ? invoiceRepository.findByRetreatBookingId(invoiceId.intValue())
                  : java.util.Optional.empty())
          .orElseThrow(() -> new ResourceNotFoundException("Invoice not found: " + invoiceId));
  ```
  When `findByIdWithDetails(invoiceId)` is empty and the `.or(...)` fallback resolves `invoice` by `retreatBookingId` (so `invoice.getInvoiceId()` is e.g. `12`, while the method parameter `invoiceId` is `50`), lines 76, 97, and 130 still use the raw parameter `invoiceId` (`50`) instead of `invoice.getInvoiceId()` (`12`):
  - Line 76: `BigDecimal successfulPayments = paymentTransactionRepository.sumSuccessfulPaymentsForInvoice(invoiceId);` — queries payments for `invoice_id = 50` instead of `invoice.getInvoiceId()` (`12`), miscalculating `remainingDue`!
  - Line 97: `String txnRef = "HSW_INV_" + invoiceId + "_" + System.currentTimeMillis();` — encodes `50` instead of `12` in `txnRef`.
  - Line 130: `response.setInvoiceId(invoiceId);` — returns `50` instead of the real `invoice.getInvoiceId()` (`12`).
  (Note: Line 108 `tx.setInvoiceId(invoice.getInvoiceId())` correctly uses `invoice.getInvoiceId()`, which makes lines 76, 97, and 130 inconsistent with line 108.)
- **Recommended Minimal Correction:**
  - Immediately after resolving `InvoiceEntity invoice`, set `Long resolvedInvoiceId = invoice.getInvoiceId();` and use `resolvedInvoiceId` at lines 76, 97, and 130.

---

#### Observation `P3-IR-02` (Minor Asymmetry — Severity: **P3 Low**): `GET /api/v1/invoices/{invoiceId}/payment-status` Uses `canAccessInvoiceOrBookingTarget` Even Though `VNPayService.getInvoicePaymentStatus` Only Resolves by `invoiceId`
- **File & Method:**
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/PaymentController.java` — `getInvoicePaymentStatus` (lines 76–80)
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VNPayService.java` — `getInvoicePaymentStatus` (lines 274–290)
- **Analysis:**
  - `PaymentController.getInvoicePaymentStatus` is annotated with `@PreAuthorize("@billingAccessEvaluator.canAccessInvoiceOrBookingTarget(#invoiceId, authentication)")`, whereas `VNPayService.getInvoicePaymentStatus(Long invoiceId)` only calls `invoiceRepository.findById(invoiceId)` (no booking-ID fallback).
  - There is **no cross-customer data leak** (because if `invoiceRepository.existsById(invoiceId)` is `true`, `canAccessInvoiceOrBookingTarget` enforces `invoiceRepository.existsByIdAndCustomerUserId(invoiceId, userId)`). However, if Customer A passes their own `bookingId` (where no invoice with that ID exists), `@PreAuthorize` allows the call and `VNPayService.getInvoicePaymentStatus` throws `404 ResourceNotFoundException`.
  - Using `@PreAuthorize("@billingAccessEvaluator.canAccessInvoice(#invoiceId, authentication)")` (or adding the same booking-ID fallback to `VNPayService.getInvoicePaymentStatus`) would make the authorization check and service lookup 100% symmetrical.

---

### Target 6: Preservation of External Webhook / Callback Flows
- **Files & Endpoints Inspected:**
  - `SecurityConfig.java` (lines 124–125)
  - `PaymentController.java` (`GET /api/v1/payments/vnpay/callback`, `GET /api/v1/payments/vnpay/ipn`, lines 49–58)
  - `VnpayWebhookController.java` (`GET|POST /api/v1/billing/webhooks/vnpay`, `POST /api/v1/billing/webhooks/vietqr`, lines 60–159)
- **Special-Attention Question — Could any legitimate VNPay callback/IPN or VietQR webhook be blocked by the new security rules?**
  - **No.**
  - `GET /api/v1/payments/vnpay/callback` and `GET /api/v1/payments/vnpay/ipn` are explicitly matched by `.requestMatchers(HttpMethod.GET, "/api/v1/payments/vnpay/callback", "/api/v1/payments/vnpay/ipn").permitAll()` at line 125 of `SecurityConfig.java`, **before** line 126 (`.requestMatchers("/api/v1/payments/vnpay/**").hasAnyRole(...)`), and neither endpoint has `@PreAuthorize` on `PaymentController`. Both validate the VNPay `vnp_SecureHash` HMAC-SHA512 signature via `vnPayService.processCallback(params)`.
  - `/api/v1/billing/webhooks/vnpay` (`GET` and `POST`) and `/api/v1/billing/webhooks/vietqr` (`POST`) are matched by `.requestMatchers("/api/v1/billing/webhooks/**").permitAll()` at line 124 of `SecurityConfig.java`, **before** line 135 (`.requestMatchers("/api/v1/billing/**").authenticated()`), and `VnpayWebhookController` has no `@PreAuthorize` annotations.
  - Furthermore, `VnpayWebhookController.handleVietQrWebhook` enforces `X-Webhook-Secret` / `Authorization: Bearer <apiKey>` verification (returning `401` if missing/mismatch and `503` if `app.vietqr.webhook-api-key` is blank).

---

### Target 7: Customer Review Ownership Check at Both Controller and Service Layers (`P1-02`)
- **Files & Methods Inspected:**
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6marketing/controller/CustomerReviewController.java` (lines 43–52)
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m6marketing/service/ReviewService.java` (lines 114–129)
- **Special-Attention Question — Can a customer still read reviews for another customer's booking through any customer review endpoint?**
  - **No.**
  - `CustomerReviewController` exposes only two endpoints:
    1. `POST /api/v1/customer/reviews` (`submitReview`) — extracts `principal.getUserId()` and verifies `booking.getCustomer() == null || !booking.getCustomer().getUserId().equals(customerUserId)` in `ReviewService.submitReview` (lines 69–71).
    2. `GET /api/v1/customer/reviews/booking/{bookingId}` (`getReviewsByBooking`) — now requires `@AuthenticationPrincipal JwtUserPrincipal principal` (rejecting null principal with `AccessDeniedException`), and passes `principal.getUserId()` to `ReviewService.getReviewsByBooking(Integer bookingId, Integer customerUserId)`, which loads `RetreatBooking` and throws `AccessDeniedException("You do not have permission to view reviews for this booking")` if `booking.getCustomer() == null || !booking.getCustomer().getUserId().equals(customerUserId)` (lines 120–122).
  - Note: Public curated reviews on the resort homepage (`GET /api/v1/public/reviews` in `PublicMarketingController`) intentionally return only `APPROVED` public reviews and do not expose private/unapproved reviews by `bookingId`.

---

### Target 9: Existing Tests and Whether Any Tests Used Mocks Instead of Verifying Real Authorization Behavior
- **Test Suites Inspected:**
  1. **`M5BillingAndCheckoutTests.java` (`testP002S42OwnershipAndStaffAuthorization`, lines 985–1072):**
     - Uses `@SpringBootTest` + `@AutoConfigureMockMvc` with **zero `@MockBean` overrides** — exercises the real `SecurityFilterChain`, real `JwtAuthenticationFilter`, real `@EnableMethodSecurity` (`@PreAuthorize`), real `BillingAccessEvaluator` bean, and real JPA repositories (`InvoiceRepository`, `RetreatBookingRepository`, `PaymentTransactionRepository`) backed by H2.
     - **Gap Identified:** The test verified `{ "invoiceId": invoiceA }` and `{ "bookingId": bookingA }` in separate requests, which is why the mixed `{ "bookingId": ownedUninvoicedBookingId, "invoiceId": otherCustomerBookingId }` edge case (`P1-IR-01`) was not caught.
  2. **`RetreatBookingSecurityTest.java` (`05_Development/backend/src/test/java/com/heavenstay/hswrms/m3retreat/RetreatBookingSecurityTest.java`):**
     - Uses `@SpringBootTest` + `@AutoConfigureMockMvc` with `@MockBean` for `RetreatBookingService`, `VNPayDepositService`, and `ReceptionistOperationService`.
     - **Is the use of `@MockBean` valid here?** **Yes**, for the rules tested in `RetreatBookingSecurityTest`, because `/api/v1/receptionist/**` (`P2-05`) is enforced in `SecurityConfig` (`SecurityFilterChain` URL/method matchers) before the controller method invokes `ReceptionistOperationService`. Thus `401` and `403` responses are produced by the real Spring Security filter chain, while `200 OK` proves the request passed `SecurityFilterChain` and reached the controller.
     - Note: `CustomerReviewController.getReviewsByBooking` (`P1-02`) has its ownership check inside `ReviewService.getReviewsByBooking` (not a `@MockBean`), so if a MockMvc test is added for `P1-02`, it must use the real `ReviewService` (or test `M5BillingAndCheckoutTests` / a dedicated integration test without mocking `ReviewService`). Currently, `P1-02` was verified by static code review of `CustomerReviewController` + `ReviewService`, and does not yet have a dedicated MockMvc test method in `RetreatBookingSecurityTest` or `M5BillingAndCheckoutTests`.
  3. **`DevAuthControllerSecurityTest.java` (`05_Development/backend/src/test/java/com/heavenstay/hswrms/common/api/DevAuthControllerSecurityTest.java`):**
     - Uses both `@SpringBootTest` + `@AutoConfigureMockMvc` (verifying `401` on `/api/v1/auth/dev-token` and `/api/v1/auth/dev/Switch-role` in the default test context) and `ApplicationContextRunner` with `DevAuthController` across `prod`, `dev`, `local`, and `test` profiles.

---

### Target 10: `GET` Endpoints That Mutate Payment or Invoice State, Including Idempotency and Retry Behavior

#### Finding `P2-IR-03` (Design / Idempotency Defect — Severity: **P2 Medium**): `GET /api/v1/billing/invoices/{invoiceId}/vietqr` and `GET /api/v1/billing/deposit/{bookingId}/vietqr` Mutate Database State and Create Duplicate `PENDING` Transactions on Every `GET`
- **File & Methods Inspected:**
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/CheckoutController.java` — `@GetMapping("/invoices/{invoiceId}/vietqr")` (line 93) and `@GetMapping("/deposit/{bookingId}/vietqr")` (line 112)
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VietQrService.java` — `generateInvoiceVietQr` (lines 66–133) and `generateDepositVietQr` (lines 140–194)
  - `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/VnpayWebhookController.java` — `resolveTxnRefFromContent` (lines 165–186)
- **Exact Problematic Condition:**
  1. Both endpoints are exposed as HTTP `GET` routes, which browsers, React `useEffect` hooks (especially in React StrictMode), network proxies, and tab refreshes treat as safe and idempotent.
  2. However, `VietQrService.generateInvoiceVietQr` is `@Transactional` (read-write) and on **every single `GET` call**:
     - Mutates `invoice.setInvoiceStatus("ISSUED")` if the invoice was `DRAFT` or `PENDING` (lines 90–93).
     - Generates a brand-new timestamped reference `String txnRef = "HSW_INV_" + invoiceId + "_" + System.currentTimeMillis();` (line 97).
     - Inserts a **new** `PENDING` `PaymentTransactionEntity` (`paymentMethod = "VIETQR_BANK_TRANSFER"`) into `PaymentTransaction` without cancelling, superseding, or reusing existing `PENDING` `VIETQR_BANK_TRANSFER` transactions for that invoice (lines 106–116).
  3. Similarly, `VietQrService.generateDepositVietQr` is `@Transactional` (read-write) and on **every single `GET` call** inserts a **new** `PENDING` `PaymentTransactionEntity` (`paymentMethod = "VIETQR_BANK_TRANSFER"`, `transactionType = "DEPOSIT"`, `txnRef = "HSW_DEP_" + bookingId + "_" + System.currentTimeMillis()`) without reusing or superseding prior `PENDING` deposit transactions (lines 165–175).
  4. ** Contrast with `VNPayService.createPaymentUrl`:**
     - `VNPayService.createPaymentUrl` (`POST /api/v1/payments/vnpay/create-payment-url`, lines 84–94) explicitly supersedes prior `PENDING` `VNPAY` rows as `CANCELLED` before creating a new `PENDING` row! `VietQrService` does **not** do this.
- **Concrete Regression / Operational Impact:**
  - Refreshing the checkout modal or opening VietQR twice leaves multiple active `PENDING` `VIETQR_BANK_TRANSFER` transactions in `PaymentTransaction` for the same invoice/booking.
  - While `VnpayWebhookController.resolveTxnRefFromContent` picks the newest `PENDING` transaction (`.max(Comparator.comparing(PaymentTransactionEntity::getTransactionId))`), all earlier `PENDING` rows remain orphaned in `PENDING` state indefinitely in the folio transaction history.
  - Note: By contrast, `GET /api/v1/invoices/{invoiceId}/payment-status` (`VNPayService.getInvoicePaymentStatus`) and `GET /api/v1/payments/vnpay/status/{ref}` (`VNPayService.getStatusByReference`) are `@Transactional(readOnly = true)` and do not mutate state.
- **Recommended Minimal Correction (for Phase 2 or Phase 1.2):**
  - In `VietQrService.generateInvoiceVietQr` and `VietQrService.generateDepositVietQr`, either reuse an existing `PENDING` `VIETQR_BANK_TRANSFER` transaction whose `amountPaid` matches the current `remainingDue`/`depositAmount`, or mark prior `PENDING` `VIETQR_BANK_TRANSFER` transactions for that invoice/booking as `CANCELLED` (matching `VNPayService.createPaymentUrl`).

---

## 4. Endpoint-by-Endpoint Authorization Assessment Table

| Endpoint | HTTP Method | Controller | SecurityConfig Rule | Method-Level `@PreAuthorize` / Service Guard | Unauth (`401`) | Customer (Owner) | Customer (Non-Owner) | Receptionist | Manager | Admin | Assessment |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| `/api/v1/auth/dev-token` | `GET` | `DevAuthController` | Conditional (`dev`/`local`/`test` + `app.auth.dev-token-enabled=true`), else `.anyRequest().authenticated()` | Bean absent when disabled or in `prod` | `401` (default) | N/A | N/A | N/A | N/A | N/A | **PASS (`P0-01`)** |
| `/api/v1/auth/dev/Switch-role` | `POST` | `DevAuthController` | Conditional (`dev`/`local`/`test` + `app.auth.dev-token-enabled=true`), else `.anyRequest().authenticated()` | Bean absent when disabled or in `prod` | `401` (default) | N/A | N/A | N/A | N/A | N/A | **PASS (`P0-01`)** |
| `/api/v1/payments/vnpay/create-payment-url` | `POST` | `PaymentController` | `hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")` | `@PreAuthorize("@billingAccessEvaluator.canCreateVnpayPayment(#request, authentication)")` | `401` | `200` | `403` *(except mixed-ID edge case `P1-IR-01`)* | `200` | `403` | `200` | **CONDITIONAL (`P1-IR-01`)** |
| `/api/v1/payments/vnpay/status/{ref}` | `GET` | `PaymentController` | `hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")` | `@PreAuthorize("@billingAccessEvaluator.canAccessTransactionRef(#ref, authentication)")` | `401` | `200` | `403` | `200` | `200` | `200` | **PASS (`P0-02`)** |
| `/api/v1/invoices/{invoiceId}/payment-status` | `GET` | `PaymentController` | `hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")` | `@PreAuthorize("@billingAccessEvaluator.canAccessInvoiceOrBookingTarget(#invoiceId, authentication)")` | `401` | `200` | `403` | `200` | `200` | `200` | **PASS (`P0-02`, minor note `P3-IR-02`)** |
| `/api/v1/payments/vnpay/callback` | `GET` | `PaymentController` | `permitAll()` (line 125) | HMAC-SHA512 checksum in `VNPayService.processCallback` | `200` (HMAC verified) | `200` | `200` | `200` | `200` | `200` | **PASS (Preserved)** |
| `/api/v1/payments/vnpay/ipn` | `GET` | `PaymentController` | `permitAll()` (line 125) | HMAC-SHA512 checksum in `VNPayService.processCallback` | `200` (HMAC verified) | `200` | `200` | `200` | `200` | `200` | **PASS (Preserved)** |
| `/api/v1/payments/vnpay/simulate/{ref}` | `POST` | `PaymentController` | `hasAnyRole("CUSTOMER", "RECEPTIONIST", "MANAGER", "ADMIN")` | `@PreAuthorize("@billingAccessEvaluator.canSimulateTransactionRef(#ref, authentication)")` + `app.vnpay.sandbox-simulation` check | `401` | `200` (if sandbox enabled) | `403` | `200` | `403` | `200` | **PASS (`P0-02`)** |
| `/api/v1/billing/invoices/{invoiceId}/vietqr` | `GET` | `CheckoutController` | `.authenticated()` (line 135) | `@PreAuthorize("@billingAccessEvaluator.canAccessInvoiceOrBookingTarget(#invoiceId, authentication)")` | `401` | `200` | `403` | `200` | `200` | `200` | **PASS Auth / `P2-IR-02`, `P2-IR-03` Service** |
| `/api/v1/billing/deposit/{bookingId}/vietqr` | `GET` | `CheckoutController` | `.authenticated()` (line 135) | `@PreAuthorize("@billingAccessEvaluator.canAccessBooking(#bookingId, authentication)")` | `401` | `200` | `403` | `200` | `200` | `200` | **PASS Auth / `P2-IR-03` Service** |
| `/api/v1/billing/webhooks/vnpay` | `GET`, `POST` | `VnpayWebhookController` | `permitAll()` (line 124) | HMAC-SHA512 checksum in `VnpayWebhookController` | `200` (HMAC verified) | `200` | `200` | `200` | `200` | `200` | **PASS (Preserved)** |
| `/api/v1/billing/webhooks/vietqr` | `POST` | `VnpayWebhookController` | `permitAll()` (line 124) | `X-Webhook-Secret` / Bearer API key verification (`401`/`503`) | `200` (with API key) / `401` (without) | N/A | N/A | N/A | N/A | N/A | **PASS (Preserved)** |
| `/api/v1/customer/reviews/booking/{bookingId}` | `GET` | `CustomerReviewController` | `hasRole("CUSTOMER")` (line 155) | `@AuthenticationPrincipal` + `ReviewService.getReviewsByBooking` ownership check | `401` | `200` | `403` | `403` | `403` | `403` | **PASS (`P1-02`)** |
| `/api/v1/receptionist/**` (Read endpoints) | `GET` | `ReceptionistOperationController` | `hasAnyRole("RECEPTIONIST", "MANAGER", "ADMIN")` (line 153) | URL + HTTP method matcher | `401` | `403` | `403` | `200` | `200` | `200` | **PASS (`P2-05`)** |
| `/api/v1/receptionist/**` (Write endpoints) | `POST`, `PATCH`, `PUT`, `DELETE` | `ReceptionistOperationController` | `hasAnyRole("RECEPTIONIST", "ADMIN")` (line 154) | URL + HTTP method matcher | `401` | `403` | `403` | `200` | `403` | `200` | **PASS (`P2-05`)** |

---

## 5. Summary of Newly Identified Independent Review Findings

| Finding ID | Severity | Classification | Location | Problem Summary | Recommended Minimal Correction |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **`P1-IR-01`** | **P1 (High)** | Genuine Security Edge-Case Defect | `BillingAccessEvaluator.java` (`canCreateVnpayPayment`, line 94) & `VNPayService.java` (`resolveInvoice`, lines 122–136) | When a customer sends both `bookingId` (an owned booking that has **no invoice yet**) and `invoiceId` (set to **another customer's `bookingId`** where no invoice has PK `invoice_id == request.invoiceId()`), `canCreateVnpayPayment` skips the `else if (!hasBookingId && ...)` check and returns `true`, while `VNPayService.resolveInvoice` falls through from the un-invoiced `bookingId` to `invoiceRepository.findByRetreatBookingId(req.invoiceId().intValue())`, resolving the other customer's invoice. | 1. In `BillingAccessEvaluator.canCreateVnpayPayment`, remove `!hasBookingId &&` so `request.invoiceId()` is always checked for ownership even when `hasBookingId` is true. <br>2. In `VNPayService.resolveInvoice` (or `canCreateVnpayPayment`), when both `bookingId` and `invoiceId` are provided, require that both resolve to the same invoice/booking rather than falling through to an unrelated identifier. <br>3. Add a regression test in `M5BillingAndCheckoutTests` covering `{ "bookingId": ownedBookingWithoutInvoice, "invoiceId": otherCustomerBookingWithInvoice }` → `403 Forbidden`, and add a MockMvc test for `GET /api/v1/customer/reviews/booking/{bookingId}` (`P1-02`). |
| **`P2-IR-02`** | **P2 (Medium)** | Genuine Functional / Financial Defect | `VietQrService.java` (`generateInvoiceVietQr`, lines 76, 97, 130) | When `generateInvoiceVietQr(Long invoiceId)` resolves an `InvoiceEntity` via the `findByRetreatBookingId(invoiceId.intValue())` fallback, it still passes the path parameter `invoiceId` (which is actually the `bookingId`) to `sumSuccessfulPaymentsForInvoice(invoiceId)`, `txnRef`, and `response.setInvoiceId(invoiceId)` instead of `invoice.getInvoiceId()`. | Use `Long resolvedInvoiceId = invoice.getInvoiceId();` at lines 76, 97, and 130 of `VietQrService.java`. |
| **`P2-IR-03`** | **P2 (Medium)** | Design / Idempotency Defect | `VietQrService.java` (`generateInvoiceVietQr` lines 90–116, `generateDepositVietQr` lines 165–175) | Both `GET .../vietqr` endpoints are read-write `@Transactional` methods that insert a new `PENDING` `PaymentTransactionEntity` on every HTTP `GET` without reusing or cancelling prior `PENDING` `VIETQR_BANK_TRANSFER` rows (unlike `VNPayService.createPaymentUrl`, which cancels prior `PENDING` rows). | Reuse an existing matching `PENDING` `VIETQR_BANK_TRANSFER` transaction or mark prior `PENDING` `VIETQR_BANK_TRANSFER` rows as `CANCELLED` before inserting a new one. |
| **`P3-IR-01`** | **P3 (Low)** | Intentional Dev Design Choice | `DevAuthController.java` (`devToken`, lines 66–81) | When explicitly enabled in local dev (`dev`/`local`/`test` profile + `app.auth.dev-token-enabled=true`), `GET /api/v1/auth/dev-token` issues a token for `userId=1`. | No code change required for production safety; dual-gating (`@Profile` + `@ConditionalOnProperty`) already prevents activation in `prod` or by default. |
| **`P3-IR-02`** | **P3 (Low)** | Minor Authorization/Service Asymmetry | `PaymentController.java` (`getInvoicePaymentStatus`, line 77) | Uses `canAccessInvoiceOrBookingTarget(#invoiceId, authentication)` even though `VNPayService.getInvoicePaymentStatus` only looks up `invoiceRepository.findById(invoiceId)`. | Change `@PreAuthorize` on `getInvoicePaymentStatus` to `@billingAccessEvaluator.canAccessInvoice(#invoiceId, authentication)` (or add the booking-ID fallback to `VNPayService.getInvoicePaymentStatus`). |

---

## 6. Evidence Classification Matrix

| Verification Area | Evidence Type | Specific Evidence Reference |
| :--- | :--- | :--- |
| **`P0-01` (`DevAuthController` disabled by default & in `prod`)** | **Actual Test Execution Evidence + Static Code Review** | `DevAuthControllerSecurityTest` (`5/5 PASS` in Phase 1 run); static inspection of `DevAuthController.java`, `SecurityConfig.java`, and `application.yml`. |
| **`P0-02` (Single-ID S42 ownership, `401` unauth, `403` non-owner, staff roles, webhooks preserved)** | **Actual Test Execution Evidence + Static Code Review** | `M5BillingAndCheckoutTests` (`56/56 PASS` in Phase 1 run, including `testP002S42OwnershipAndStaffAuthorization`) and `VietQrAndPaymentWebhookTest` (`3/3 PASS`). |
| **`P1-IR-01` (Mixed `{bookingId, invoiceId}` bypass in `canCreateVnpayPayment`)** | **Static Code Review** | Line-by-line control-flow trace of `BillingAccessEvaluator.java` lines 89–98 vs `VNPayService.java` lines 122–137. |
| **`P1-02` (`CustomerReviewController` + `ReviewService` booking ownership)** | **Static Code Review** | Direct inspection of `CustomerReviewController.java` lines 43–52 and `ReviewService.java` lines 114–129 (no dedicated MockMvc test method executed yet for `GET /api/v1/customer/reviews/booking/{bookingId}`). |
| **`P2-05` (`ROLE_MANAGER` read-only on `/api/v1/receptionist/**`)** | **Actual Test Execution Evidence + Static Code Review** | `RetreatBookingSecurityTest` (`17/17 PASS` in Phase 1 run, testing `GET` `200` vs `POST`/`PATCH` `403` for `ROLE_MANAGER` through the real `SecurityFilterChain`). |
| **`P2-IR-02` & `P2-IR-03` (`VietQrService` fallback ID & `GET` idempotency)** | **Static Code Review** | Direct inspection of `VietQrService.java` lines 66–194. |
| **Live VNPay / VietQR Production Gateway Network Traffic** | **Unverified Production Behavior** | Tested via H2 + MockMvc + HMAC/API-key unit/integration tests; not tested against live external VNPay/VietQR banking servers. |

---

## 7. Final Acceptance Decision & Blockers Before Phase 2

1. **Can Phase 1 be accepted as-is, or must fixes be applied before Phase 2?**
   - **Phase 1 requires a small targeted remediation pass (Phase 1.2) before proceeding to Phase 2.**
2. **Must-Fix Blockers Before Phase 2:**
   - **Blocker 1 (`P1-IR-01`):** Fix the mixed `{bookingId, invoiceId}` condition in `BillingAccessEvaluator.canCreateVnpayPayment` (and `VNPayService.resolveInvoice`) so that providing an owned un-invoiced `bookingId` alongside another customer's `bookingId` in `invoiceId` cannot bypass ownership verification.
   - **Blocker 2 (`P2-IR-02`):** Fix `VietQrService.generateInvoiceVietQr` to use `invoice.getInvoiceId()` rather than the raw path parameter `invoiceId` after resolving the invoice (preventing wrong-invoice payment summation when the booking-ID fallback is triggered).
   - **Blocker 3 (Test Coverage Completion):** Add MockMvc regression tests for:
     1. `P1-IR-01` (mixed `{bookingId, invoiceId}` payload returning `403 Forbidden`), and
     2. `P1-02` (`GET /api/v1/customer/reviews/booking/{bookingId}` returning `403 Forbidden` for another customer and `200 OK` for the booking owner).
3. **Recommended (Non-Blocking or Include in Same Micro-Fix):**
   - Address `P2-IR-03` (reuse or cancel prior `PENDING` `VIETQR_BANK_TRANSFER` rows in `VietQrService`) and `P3-IR-02` (align `getInvoicePaymentStatus` authorization/lookup symmetry).

