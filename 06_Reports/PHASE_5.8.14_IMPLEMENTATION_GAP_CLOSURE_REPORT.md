# Phase 5.8.14 — Implementation Gap Closure Report

Date: 2026-11-01  
Repository: `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`

## Baseline and preservation

- Branch: `feature/hswrms-m1-m6-integration`
- HEAD: `ab1d2451d6d2500dfd4065b4c14c1f53eef37871` (expected)
- Both preservation stashes were present before and after the work:
  - `HSWRMS Phase 5.8.12 preservation 2026-11-01`
  - `HSWRMS consolidation preservation before fast-forward 2026-11-01`
- Work was performed in the original repository. No clone was created. No Git reset, clean, rebase, cherry-pick, merge, stage, commit, or push was performed.
- Existing working-tree changes and untracked artifacts were retained. There were already broad local changes before this phase; file-level candidate lists below identify only the scope addressed by this phase and must be reviewed with those existing edits before any later commit.

## Changes made

### M3 clean-install schema

Updated `05_Development/database/schema.sql` with the six `dbo.SpaSession` fields and definitions aligned to `SpaSession.java` and the existing migration sequence:

| Column | Definition |
| --- | --- |
| `reminder_status` | `VARCHAR(20) NULL`, default `PENDING` |
| `reminder_claimed_at` | `DATETIME2(0) NULL` |
| `reminder_claim_expires_at` | `DATETIME2(0) NULL` |
| `reminder_claim_token` | `VARCHAR(64) NULL` |
| `reminder_sent_at` | `DATETIME2(0) NULL` |
| `external_calendar_event_id` | `VARCHAR(255) NULL` |

The baseline also includes the reminder-status check constraint and due index represented by V016. Static comparison found that the existing baseline trigger applied therapist and room compatibility checks to terminal sessions, unlike V016. Its checks now apply only to `SCHEDULED` and `RESCHEDULING`, matching V016 while retaining the trigger and its conflict checks. Migrations V008, V011, V012, V015, and V016 were not modified or renumbered; V016 backfill, constraint, index, and trigger logic remain intact.

This was a source comparison and static review only. SQL Server syntax/runtime was not validated against SQL Server, and no migration was run.

### M5 invoice VietQR ownership and payment safety

- The existing `CheckoutController` invoice VietQR route and its authorization contract were retained; no duplicate route or guessed API contract was introduced.
- `BillingAccessEvaluator.canAccessInvoice` now checks only the real invoice ID and authenticated Customer ownership. It does not fall back to a booking ID.
- `VietQrService.generateInvoiceVietQr` looks up only the specified invoice and is read-only. Generating the QR no longer changes invoice status, creates/reuses/fails payment transactions, or reports a transaction reference/status as pending. Its response states that QR creation does not confirm payment.
- The separate M2 deposit QR flow was left unchanged.
- M5 coverage verifies valid invoice access through existing tests, ownership denial, missing/invalid identifiers, and that repeat invoice QR generation does not change transaction, invoice, meal, or Spa state.
- The payment page no longer fabricates invoice/payment identifiers or displays payment polling/status as active when the QR response has no transaction reference.

### M6 authorization and M1 preservation

- Both Manager and Admin System Overview routes are guarded by the backend-loaded `S55:V` permission through `RoleGuard`. Existing backend enforcement remains authoritative; frontend permission loading continues to fail closed.
- Added frontend authorization coverage for loading, error, missing-grant, and granted states; added backend coverage that a persisted Receptionist without `S55:V` receives 403.
- The local `OtpIssuanceConcurrencyTest.java` was retained. Inspection confirmed bounded executor cleanup (`shutdownNow`/`awaitTermination`) and a bounded readiness assertion. It remains an untracked test candidate for a later reviewed commit.

## Verification

### Backend

Command (from `05_Development/backend`):

```text
.\mvnw.cmd '-Dtest=OtpIssuanceConcurrencyTest,AuthServiceTest,AuthServiceRegressionTest,AuthServiceSsoFacebookTest,HealthDataDeletionRequestServiceTest,SpaBookingValidationTests,SpaServiceTests,M5BillingAndCheckoutTests,DelegationServiceTest,M6AdminIntegrationTests,AdminControllersSecurityTest' test
```

Final result: **BUILD SUCCESS — 183 tests, 0 failures, 0 errors, 0 skipped**. Runtime logs showed `jdbc:h2:mem:testdb`; the tests used local H2/MockMvc. No external payment gateway was contacted. The suite includes local mocked/test callback behavior only. Existing warnings included Spring `open-in-view`, Java class-data-sharing, and an unchecked-operation note in `InventoryServiceTest`.

During the initial run, the new Receptionist authorization test returned 401 because its token referenced a nonexistent user. The fixture was corrected to create an active persisted Receptionist, the focused regression passed, and the full 183-test set was rerun successfully.

### Frontend

- `node --experimental-strip-types --test src/context/governanceAuthorization.test.ts src/features/m5-billing/utils/bookingResolver.test.ts src/features/m5-billing/utils/paymentSafety.test.ts` — **34 passed, 0 failed**.
- `npm run lint` — completed with **11 warnings, 0 errors**. Warnings are unused caught/declared variables and existing unnecessary escapes; no lint autofix was run.
- `npm run build` — **passed** (`tsc -b` and Vite production build). Vite reported the existing large-chunk advisory (2,737.92 kB minified JS).
- `npx tsc --noEmit` — **exit code 0**.

### Static safety

- `git diff --check` — passed (Git emitted a line-ending normalization warning for the edited backend security test).
- Static review confirmed all six schema columns occur once and their types/nullability match the entity and V016. Existing migration history was left unchanged.
- No SQL Server connection, SQL script execution, migration execution, frontend application startup, external email/calendar/payment delivery, or production acceptance run occurred. Spring Boot test contexts did start against H2 as part of the requested tests.

## Remaining gaps and limits

- The clean-install SQL baseline was not executed on SQL Server; SQL Server compatibility remains unverified at runtime.
- No production payment settlement, bank transfer notification, webhook delivery, or real VietQR payment verification was tested. QR generation is intentionally not evidence of payment.
- Broader M1–M6 integration, SQL Server concurrency, browser acceptance, and production readiness are not established by this focused H2/frontend verification.
- The repository contains substantial pre-existing uncommitted work. Review it together with this phase’s changes before selecting any future commit.

## Files in this phase’s implementation candidate set

- `05_Development/database/schema.sql`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/security/BillingAccessEvaluator.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/VietQrService.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/M5BillingAndCheckoutTests.java`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m6admin/AdminControllersSecurityTest.java`
- `05_Development/frontend/src/app/router/index.tsx`
- `05_Development/frontend/src/features/m5-billing/types/index.ts`
- `05_Development/frontend/src/pages/customer/FinalPaymentPage.tsx`
- `05_Development/frontend/src/context/governanceAuthorization.test.ts`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/service/OtpIssuanceConcurrencyTest.java` (retained local test candidate)

The requested report is the only new file created by this phase. No files were staged, committed, or pushed.

## Final Git state

- Branch: `feature/hswrms-m1-m6-integration`
- HEAD: `ab1d2451d6d2500dfd4065b4c14c1f53eef37871`
- Working tree remains dirty: **77 modified tracked paths, 35 untracked paths (112 total)**, including the phase implementation/test edits above, the new report, and unrelated pre-existing tracked/untracked work. `git diff --check` passed.
- Both preservation stashes remain present.

