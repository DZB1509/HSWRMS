# HSWRMS FULL TEAM CONTRIBUTION AUDIT, MODULE COMPLETENESS & GAP ANALYSIS REPORT

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Academic Context:** ISP392 / IS2005 / Group 1 (FPT University - Fall 2026)  
**Audit Target Path:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Primary Integration Branch:** `feature/hswrms-m1-m6-integration`  
**Audited Local HEAD Commit:** `3042eb40495890a959e426bedbc65acffb2e67cf`  
**GitLab Remote:** `isp-origin` (`https://gitlab.com/manhnc2/fal26-isp392-is2005-g1.git`)  
**Audit Timestamp:** 2026-10-29T17:15:00+07:00  
**Audit Execution Mode:** Strictly Read-Only, Non-Destructive, Zero Live Database Mutations  

---

## MANAGEMENT SUMMARY

| Question | Executive Answer |
|---|---|
| **What has already been implemented?** | All 6 functional modules (M1–M6) and Shared Infrastructure have extensive backend and frontend implementations: **38 Spring Boot Controllers**, **56 Frontend Screens** mapped in React Router, and a **42-table canonical SQL schema** covering Identity, Booking, Spa, F&B, Billing, and Governance. |
| **What has been integrated?** | All **7 mandatory contributor branches** (`DucHoangM1`, `dat-nguyen-gia`, `thao-product`, `vinhpt1`, `vinhpt`, `NTDatZB`, `XH`) have been reconciled. Phase 5.8.3.118 recovered the interrupted `XH` merge, resolved **44 merge conflict paths**, eliminated 6 provisional JPA stubs in favor of canonical entities, and synchronized the branch with GitLab remote `isp-origin`. (Branch `XH4` was confirmed out-of-scope with 0 code files). |
| **What has been verified?** | **Automated test suite (536 tests run; 526 passed, 0 failures, 0 errors, 10 skipped)** in Maven/Java 17; **Frontend production build clean (2,728 modules transformed, 0 errors)**; **Oxlint scan clean (216 files, 0 errors, 10 non-blocking warnings)**. Dual-chain security and test harness isolation defects (H2 MSSQLServer mode property override and M6 dynamic manager ID) have been diagnosed and fixed. |
| **What is still unverified?** | Runtime execution against **live third-party services** (Google/Facebook OAuth2 handshakes, VNPay merchant IPN callbacks); **live SQL Server 2022 locking behavior** (`WITH (UPDLOCK)`); and **end-to-end multi-module operational walkthroughs** in a running deployment. All automated tests executed against in-memory H2. |
| **What are the most important gaps?** | **(P0)** Local development auth bypass (`/api/v1/auth/dev/**`) permitted in `SecurityConfig.java`; **(P1)** Unexecuted business catalog seed in `HSWRMS_TEST` (failed on syntax error in Phase 112, fixed in 113, but never re-executed; tables hold 0 rows); **(P1)** 4 untracked migration scripts need sequential Flyway numbering; **(P1)** Live payment gateway and OAuth2 staging verification. |
| **What evidence supports each member's contribution?** | All 6 student team members have defensible Git commit history, code artifacts, and task plan alignment: **Lê Đức Hoàng** (M1: 13 commits, 77 tests, SSO & GDPR deletion); **Nguyễn Gia Đạt** (M2: 8 commits, 34 tests, 3,417 lines added in booking/receptionist); **Nguyễn Tất Đạt** (M3 & Lead Integrator: 102 commits, shared UI tokens/layouts, full team merge & conflict recovery); **Vũ Phương Thảo** (M4: 57 commits, 42 tests, menu, KDS queue & inventory deduction); **Trần Xuân Hòa** (M5: 8 commits, 48 tests, 7,608 lines added in folio billing, checkout & analytics); **Phan Thành Vinh** (M6 & Master Data: 22 commits, 49 tests, 4,600+ lines in villa/spa manager UI & modals). |
| **What additional evidence is needed before final member evaluation?** | A live demonstration / staging walkthrough where each member operates their respective module flows, and official student ID confirmation for members whose university emails were not captured in Git author metadata. |

---

## 1. EXECUTIVE SUMMARY

Phases 5.8.3.117 and 5.8.3.118 achieved the consolidation of isolated feature branches into a unified integration branch: `feature/hswrms-m1-m6-integration`. The repository represents a complex enterprise wellness resort management system incorporating Identity & Access (M1), Retreat Booking & Accommodation (M2), Spa & Therapy Operations (M3), Food & Beverage Nutrition & KDS (M4), Consolidated Billing, Checkout & Invoicing (M5), and System Administration & Governance (M6).

The audit confirms that the codebase compiles cleanly and passes 526 automated unit and service slice tests. However, the system's runtime behavior against live external infrastructure (Microsoft SQL Server 2022, VNPay payment gateway, Google/Facebook OAuth2 endpoints, and real SMTP dispatch) remains unexecuted and unverified due to strict testing boundaries. 

This audit establishes a rigorous, evidence-backed foundation for project completion and provides Excel-ready contribution ledgers ensuring fair, transparent academic evaluation.

---

## 2. AUDIT SCOPE AND EVIDENCE SOURCES

The audit was executed under a strict read-only policy. No project files, database tables, or Git branches were modified.

### Evidence Hierarchy
1. **Primary Evidence:** Current repository source code files, Git commit graph, diffstats, and read-only shell inspection.
2. **Secondary Evidence:** Build logs, automated test execution reports, and linter telemetry.
3. **Tertiary Evidence:** Historical phase documentation (Phases 31 through 118).
4. **Contextual Evidence:** Project WBS task plan (`01_Planning/Task_Project_G1_IS2005.csv`) and SRS documents.

### Key Evidence Artifacts Indexed (33 Key Sources)
- `06_Reports/PHASE_5.8.3.117-5.8.3.118_FULL_TEAM_MERGE_HISTORY.txt` (Comprehensive merge chronicle)
- `05_Development/database/reports/PHASE_5.8.3.118_INTEGRATION_RECOVERY_AND_RESUMPTION_REPORT.md` (Phase 118 recovery log)
- `05_Development/database/reports/PHASE_5.8.3.115_BACKLOG_INVENTORY_AND_RESIDUAL_CHECKPOINT_REPORT.md` (Pre-merge baseline)
- `05_Development/database/reports/PHASE_5.8.3.112_AUTHORIZED_SEED_EXECUTION_REPORT.md` (Catalog seed execution syntax failure)
- `01_Planning/Task_Project_G1_IS2005.csv` (Official group task plan & PIC assignments)
- `05_Development/database/schema.sql` (Authoritative 42-table DDL schema)
- 6 Deferred Database Files across `generated/` and `migrations/` directories

> [!NOTE]
> **Absence of Phases 5.8.3.119 and 5.8.3.120:**
> Extensive filesystem and Git search confirmed that no commits, branches, or files exist for Phase 5.8.3.119 or 5.8.3.120. Integration activities formally concluded at Phase 5.8.3.118 (commit `3042eb4`).

---

## 3. CURRENT REPOSITORY AND GIT STATE

- **Working Directory:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`
- **Active Branch:** `feature/hswrms-m1-m6-integration`
- **Current Local HEAD:** `3042eb40495890a959e426bedbc65acffb2e67cf`
- **Remote Tracking:** `isp-origin/feature/hswrms-m1-m6-integration` (Synchronized; 0 ahead, 0 behind)
- **Git Remotes:**
  - `isp-origin`: `https://gitlab.com/manhnc2/fal26-isp392-is2005-g1.git` (Primary academic GitLab repository)
  - `origin`: `https://github.com/DZB1509/HSWRMS.git` (Lead developer secondary GitHub mirror)
- **Tracked Working Tree:** Clean. Zero modified or staged tracked project files.
- **Untracked Working Tree State:**
  - `05_Development/database/generated/` (2 ephemeral test schema deployment scripts)
  - `05_Development/database/migrations/V003__m2_retreat_booking_schema_reconciliation.sql`
  - `05_Development/database/migrations/V004__m5_customer_review_category_ratings.sql`
  - `05_Development/database/migrations/V005__m6_audit_log.sql`
  - `05_Development/database/migrations/draft_m6_governance_and_delegation.sql`
  - `06_Reports/PHASE_5.8.3.117-5.8.3.118_FULL_TEAM_MERGE_HISTORY.txt`
  - `06_Reports/audit-output/` (Newly created directory holding audit CSVs and reports)

---

## 4. BRANCH INTEGRATION MATRIX

| Contributor Branch | Associated Member | Intended Scope | Integration Mechanism | Integration Commit | Verification Status | Remaining Uncertainty |
|---|---|---|---|---|---|---|
| `isp-origin/DucHoangM1` | Lê Đức Hoàng | M1: Identity, SSO, Deletion | True Merge (two parents) | `602c6f8` | MERGED_AND_VERIFIED | Live Google/Facebook OAuth2 network callbacks unverified |
| `isp-origin/dat-nguyen-gia` | Nguyễn Gia Đạt | M2: Booking, Receptionist, VNPay | Selective Integration (single parent) | `0f257ad` | SELECTIVELY_INTEGRATED | Raw schema overwrite excluded; live VNPay IPN unverified |
| `isp-origin/thao-product` | Vũ Phương Thảo | M4: F&B, KDS, Inventory | True Merge (two parents) | `6ff5b9a` | MERGED_AND_VERIFIED | Multi-day meal order traversal pending live deployment |
| `isp-origin/vinhpt1` | Phan Thành Vinh | M6: Admin; M2/M3: Villa/Spa Specs | True Merge (two parents) | `39b086f` | MERGED_AND_VERIFIED | Rich UI modals require running database for full roundtrip |
| `isp-origin/vinhpt` | Phan Thành Vinh | Early M6 prototype | Superseded by vinhpt1 | N/A | SUPERSEDED | Fully superseded by vinhpt1 (confirmed) |
| `isp-origin/NTDatZB` | Nguyễn Tất Đạt | M3: Spa; Shared Infrastructure | Ancestor in Baseline | `ff9f44b` | ANCESTOR_IN_BASELINE | Live SQL Server concurrency hints unverified on H2 |
| `isp-origin/XH` | Trần Xuân Hòa | M5: Billing, Checkout, Reviews | True Merge (two parents) | `9668586` | MERGED_AND_VERIFIED | Live payment gateway and PDF streaming under load unverified |
| `isp-origin/XH4` | Trần Xuân Hòa | Early October Documentation | Incidental Inspection Only | N/A | OUT_OF_SCOPE | Excluded from required scope; 0 code files in 05_Development |

### Rationale for Selective Integration of `dat-nguyen-gia`
A direct `git merge` of `dat-nguyen-gia` was intentionally avoided because commits on that branch (e.g. `d2d36de`, `1619ebe`) contained raw, conflicting alterations to `05_Development/database/schema.sql` that would have corrupted the authoritative 42-table baseline established in Phases 47–85. Instead, 50 functional files (+4,963 / -361 lines) were integrated cleanly in commit `0f257ad` while preserving the canonical database schema.

---

## 5. MODULE-BY-MODULE FUNCTION INVENTORY

### M1 — Identity & Access Management (Lê Đức Hoàng)
- **Backend Evidence:** `AuthController`, `ConsentController`, `CustomerProfileController`, `HealthProfileController`, `HealthDataDeletionRequestController`, `SsoController`, `AuthService`, `JwtTokenProvider`, `DevEmailDeliveryAdapter`.
- **Frontend Evidence:** `LoginPage`, `RegisterPage`, `EmailOtpVerificationPage`, `SsoCallbackPage`, `CustomerDashboardPage`, `AccountSettingsPage`, `HealthProfilePage`, `HealthDataDeletionPage`.
- **Database Tables:** `dbo.User`, `dbo.UserRole`, `dbo.Role`, `dbo.AuthIdentity`, `dbo.EmailOtp`, `dbo.CustomerProfile`, `dbo.HealthProfile`, `dbo.ConsentRecord`, `dbo.HealthDataDeletionRequest`.
- **Test Evidence:** 77 passing backend tests (`AuthServiceTest`, `SsoAuthEndpointTests` 14/14, `AccountLockoutIntegrationTest` 8/8).
- **Status:** IMPLEMENTED_EVIDENCE_FOUND / AUTOMATED_TESTS_ONLY.

### M2 — Retreat Booking & Accommodation (Nguyễn Gia Đạt)
- **Backend Evidence:** `RetreatPackageController`, `RetreatBookingController`, `ReceptionistOperationController`, `VillaInventoryController`, `VNPayCallbackController`, `RetreatBookingService`, `ReceptionistOperationService`, `VNPayDepositService`, `VillaAvailabilityService`, `JdbcCustomerIdentityAdapter`.
- **Frontend Evidence:** `RetreatListPage`, `RetreatDetailPage`, `RetreatBookingPage`, `BookingSummaryPage`, `DepositPaymentResultPage`, `MyBookingsPage`, `BookingDetailPage`, `DailyArrivalsPage`, `CheckInPage`, `VillaAssignmentPage`, `VillaStatusPage`, `ReceptionistBookingsPage`.
- **Database Tables:** `dbo.RetreatPackage`, `dbo.PackageVillaCategoryMapping`, `dbo.RetreatBooking`, `dbo.PhysicalVilla`, `dbo.VillaCategory`, `dbo.ResidenceRecord`, `dbo.PaymentTransaction`.
- **Test Evidence:** 34 passing backend tests (`ReceptionistOperationServiceTest` 5/5, `M2SchemaCompatibilityTest` 6/6, `RetreatBookingServiceAuthorizationTest` 9/9).
- **Status:** IMPLEMENTED_EVIDENCE_FOUND / AUTOMATED_TESTS_ONLY.

### M3 — Spa & Wellness Operations (Nguyễn Tất Đạt)
- **Backend Evidence:** `SpaBookingController`, `SpaMasterController`, `SpaTreatmentController`, `TherapistController`, `SpaService`, `DefaultCustomerStayAdapter`.
- **Frontend Evidence:** `SpaTreatmentListPage`, `SpaBookingPage`, `SpaAlternativeSlotsPage`, `SpaConfirmationPage`, `MySpaSessions`, `ManualExtraSpaPage`, `TherapistDashboardPage`, `TherapistSchedulePage`, `TherapistSessionDetailPage`.
- **Database Tables:** `dbo.SpaTreatment`, `dbo.RetreatPackageSpaTreatment`, `dbo.TreatmentRoom`, `dbo.Therapist`, `dbo.TherapistSchedule`, `dbo.SpaSession`.
- **Test Evidence:** 24 passing backend tests (`SpaServiceTests` 12/12, `SpaSecurityTests`).
- **Status:** IMPLEMENTED_EVIDENCE_FOUND / AUTOMATED_TESTS_ONLY.

### M4 — Food & Beverage Management & KDS (Vũ Phương Thảo)
- **Backend Evidence:** `MenuController`, `FnbCustomerOrderController`, `FnbDashboardController`, `FnbKdsController`, `IngredientController`, `MealOrderController`, `RetreatPackageFnbController`, `MenuService`, `MealOrderService`, `FnbKdsOrderService`, `InventoryService`, `TextEncodingSanitizer`.
- **Frontend Evidence:** `DietaryMenuPage`, `DailyMealSelectionPage`, `AlaCarteOrderPage`, `MyMealPlanPage`, `FnbDashboardPage`, `MealPrepListPage`, `MealOrderDetailPage`, `DiningLocationPicker.tsx`.
- **Database Tables:** `dbo.MenuCategory`, `dbo.MenuItem`, `dbo.MealOrder`, `dbo.MealOrderItem`, `dbo.Ingredient`, `dbo.RecipeIngredient`, `dbo.InventoryTransaction`.
- **Test Evidence:** 42 passing backend tests (`MealOrderServiceTest` 6/6, `InventoryServiceTest` 8/8, `MenuServiceTest` 4/4).
- **Status:** IMPLEMENTED_EVIDENCE_FOUND / AUTOMATED_TESTS_ONLY.

### M5 — Billing, Folio, Checkout & Invoicing (Trần Xuân Hòa)
- **Backend Evidence:** `FolioBillingController`, `CheckoutController`, `InvoiceController`, `CustomerReviewController`, `AnalyticsController`, `VnpayWebhookController`, `FolioBillingService`, `CheckoutService`, `InvoicePdfService`, `ReviewService`, `AnalyticsService`.
- **Frontend Evidence:** `FolioInvoicePage`, `FinalPaymentPage`, `FinalPaymentResultPage`, `CheckoutConfirmationPage`, `ReviewRatingPage`, `RevenueDashboardPage`, `OccupancyReportPage`, `TherapistUtilizationReportPage`, `billingApi.ts`.
- **Database Tables:** `dbo.Folio`, `dbo.FolioItem`, `dbo.Invoice`, `dbo.PaymentTransaction`, `dbo.CustomerReview`, `dbo.CustomerReviewCategoryRating`.
- **Test Evidence:** 48 passing backend tests (`M5BillingAndCheckoutTests` 48/48, `paymentSafety.test.ts`).
- **Status:** IMPLEMENTED_EVIDENCE_FOUND / AUTOMATED_TESTS_ONLY.

### M6 — Administration & Governance (Phan Thành Vinh)
- **Backend Evidence:** `AdminAuditLogController`, `AdminDashboardController`, `AdminDelegationController`, `AdminMasterDataController`, `AdminParameterController`, `AdminPermissionController`, `AdminStaffController`, `DashboardController`, `PermissionMatrixService`, `StaffAccountService`, `DelegationService`, `AuditLogService`, `BusinessParameterService`.
- **Frontend Evidence:** `AdminDashboardPage`, `BusinessParametersPage`, `FeatureFlagsPage`, `PermissionMatrixPage`, `AdminDelegationPage`, `SensitiveAuditLogPage`, `ManagerDashboardPage`, `VillaManagementPage`, `SpaManagementPage`, `SystemOverviewPage`, 11 operational modals.
- **Database Tables:** `dbo.SystemParameter`, `dbo.FeatureFlag`, `dbo.AuditLog`, `dbo.ManagerDelegation`, `dbo.RolePermission`, `dbo.Permission`.
- **Test Evidence:** 49 passing backend tests (`M6AdminIntegrationTests` 11/11, `DelegationServiceTest` 10/10, `PermissionMatrixServiceTest` 6/6).
- **Status:** IMPLEMENTED_EVIDENCE_FOUND / AUTOMATED_TESTS_ONLY.

### Shared Infrastructure (Nguyễn Tất Đạt)
- **Backend Evidence:** `SecurityConfig`, `CustomUserDetailsService`, `JwtAuthenticationFilter`, `DevAccountBootstrap`, `ApiResponse`, `GlobalExceptionHandler`, `CustomerStayPort`.
- **Frontend Evidence:** `PublicLayout`, `CustomerLayout`, `OperationalLayout`, `ManagerAdminLayout`, `AuthLayout`, `RoleGuard`, design tokens (`tokens.css`), responsive layouts.
- **Test Evidence:** 252 passing security and infrastructure slice tests.
- **Status:** IMPLEMENTED_EVIDENCE_FOUND / AUTOMATED_TESTS_ONLY.

---

## 6. CROSS-MODULE INTEGRATION FINDINGS

During the integration and merge recovery phases (Phases 5.8.3.117–118), several cross-module incompatibilities were discovered and harmonized:

1. **JPA Entity Collision (Resolved in Phase 118):**
   Branch `XH` had introduced 6 provisional entity stubs (`CustomerProfileEntity`, `UserEntity`, `PhysicalVillaEntity`, `RetreatBookingEntity`, `SpaSessionEntity`, `TherapistEntity`). These collided with canonical entities in M1, M2, and M3. All 6 stubs were permanently deleted (`git rm -f`), and M5 repositories/services were adapted to reference canonical models.
2. **Dual-Chain Security Configuration (Preserved in Phase 118):**
   HEAD’s dual security architecture was maintained:
   - Dedicated `ssoSecurityFilterChain` for `/api/v1/auth/sso/**` handling OAuth2 redirect callbacks.
   - Stateless `apiSecurityFilterChain` for JWT-authenticated API endpoints with RBAC checks.
   - Integrated local sandbox convenience `.requestMatchers("/api/v1/auth/dev/**").permitAll()`.
3. **Database Schema DDL Nesting Fix (Resolved in Phase 118):**
   In `schema.sql`, table `dbo.RetreatPackageSpaTreatment` was inadvertently nested inside the definition of `dbo.SpaTreatment`. This was un-nested and separated into valid SQL Server DDL statements.
4. **Dependency Deduplication (Resolved in Phase 118):**
   Deduplicated redundant declarations of `poi-ooxml` and `openpdf` in backend `pom.xml`.
5. **Test Isolation Defects Diagnosed and Fixed (Commit `1f7ebc1`):**
   - **H2 MSSQLServer Mode Defect:** `HswrmsApplicationTests.java` had hardcoded a DataSource URL override lacking `;MODE=MSSQLServer`. When executed in the full suite, H2 rejected `dbo.[User]` queries in `DefaultCustomerStayAdapter`. Fixed by removing the override.
   - **M6 Dynamic Manager Allocation:** `M6AdminIntegrationTests.java` had hardcoded user ID `2` for delegation validation. When run in the full suite, user `2` was an existing test user without the `MANAGER` role, causing unexpected validation errors. Fixed by dynamically allocating an active manager.

---

## 7. BUILD AND TEST EVIDENCE

### Backend Maven Suite
- **Toolchain:** OpenJDK 17.0.12, Apache Maven 3.9
- **Command:** `mvn -f HSWRMS-audit-all-modules/05_Development/backend/pom.xml test`
- **Result:** **BUILD SUCCESS**
- **Metrics:** 536 tests run; **526 passed**, **0 failures**, **0 errors**, **10 skipped**.
- **Skipped Tests:**
  - `com.heavenstay.hswrms.integration.SqlServerJdbcSmokeTest` (1 skipped)
  - `com.heavenstay.hswrms.integration.SqlServerSpringBootContextTest` (9 skipped)
  *Skipping Rationale:* These are opt-in live database tests configured with `@EnabledIfEnvironmentVariable`. They skip by design to prevent accidental live database mutations during standard builds.

### Frontend Vite Build & Linter
- **Build Tool:** Vite v8.3.4, TypeScript ~6.0.2
- **Command:** `npm --prefix HSWRMS-audit-all-modules/05_Development/frontend run build`
- **Result:** **SUCCESS** in 997ms. 2,728 modules transformed; **0 TypeScript compilation errors**.
- **Linter Tool:** Oxlint v1.81.0
- **Command:** `npm --prefix HSWRMS-audit-all-modules/05_Development/frontend run lint`
- **Result:** **0 errors**, 10 non-blocking informational warnings across 216 files (unused parameters in fallback catch blocks).

### What the Test Suite Proves vs. Does Not Prove
- **Proves:** Syntactic correctness, valid dependency injection, Spring context bean creation, in-memory repository CRUD, validation logic, calculation math (VAT, deposit percentages, inventory counts), and mock HTTP routing.
- **Does Not Prove:** Outbound network communication with real Google/Facebook OAuth2 servers; real bank redirect and IPN processing with VNPay; live SQL Server 2022 locking behavior (`WITH (UPDLOCK)`); connection pool saturation under multi-user concurrency; live email delivery via external SMTP.

---

## 8. DATABASE AND SECURITY REVIEW

### Database Findings
- **Canonical Schema:** `05_Development/database/schema.sql` defines 42 tables.
- **Live Database Invariant:** **Zero live database mutations** occurred during integration and testing. Databases `HSWRMS` and `HSWRMS_TEST` remain completely isolated and unmutated.
- **History of Catalog Seed Failure (Phase 5.8.3.112):**
  Phase 5.8.3.112 attempted to execute `hswrms_test_business_catalog_seed.sql` against `HSWRMS_TEST`. It halted with a Level 15 compile-time syntax error on Line 52 (`Msg 102: Incorrect syntax near 'DB_NAME'`). The batch was rejected before execution, and 0 rows were inserted. Although the syntax was remediated in Phase 5.8.3.113 (`6f7774f`), the script has **never been re-executed**. Tables in `HSWRMS_TEST` currently hold 0 catalog rows.
- **Untracked Deferred Database Scripts (6 Files, SHA-256 Verified):**
  1. `generated/HSWRMS_TEST_schema.sql` (SHA-256: `DB643DDBC0E5CF5BE848D1CF6EA33DC51B124B89DFAC0CE327CAEEE0C91E6D70`)
  2. `generated/HSWRMS_TEST_schema_continuation.sql` (SHA-256: `2479ED70438B808538EFEEF3B440924E8128BD9FCABBC0C2473E1598A3433D68`)
  3. `migrations/V003__m2_retreat_booking_schema_reconciliation.sql` (SHA-256: `8E7E8433D3D05A8A2BC1A43052132E34A90992789B46BF5A27D7FFBDD0262EE0`)
  4. `migrations/V004__m5_customer_review_category_ratings.sql` (SHA-256: `3834E58A9A20E2BFA111CB639AA3883B23B4CEB9097C82B092FEF33FE3EE1F7F`)
  5. `migrations/V005__m6_audit_log.sql` (SHA-256: `5A714520E860C1EEFC1822B11319D0268447EA93B0728191E819E05718AF513E`)
  6. `migrations/draft_m6_governance_and_delegation.sql` (SHA-256: `605FC640A43C487CDAE9B6B97C38F4935CE7A8737343314D7BDD96D3BAEF190B`)

### Security Findings
- **Security Chain Separation:** Dedicated OAuth2 SSO callback filter chain and stateless JWT API filter chain.
- **Granular RBAC:** 41 distinct permissions enforced via Spring Security `@PreAuthorize("hasAuthority('...')")`.
- **High-Risk Endpoint Identified (CRITICAL P0):**
  `SecurityConfig.java` explicitly permits all requests to `/api/v1/auth/dev/**`. `DevAuthController` allows instant generation of valid JWT tokens for any system role without password verification. This is acceptable for local development but represents a **critical vulnerability** if deployed to staging or production. It must be locked behind `@Profile("dev")`.

---

## 9. TEAM CONTRIBUTION EVIDENCE SUMMARY

Contributions were evaluated across 12 distinct dimensions (A through L), rigorously separating commit volume from implementation complexity and verified outcomes:

### 1. Lê Đức Hoàng (ID-01) — Module 1 Lead
- **Authored Commits:** 13 commits on `DucHoangM1`.
- **Key Deliverables:** Google & Facebook SSO flows, SSO ticket exchange, email OTP registration, customer profile, health profile, and Screen #9 GDPR health data deletion request.
- **Testing & Quality:** Authored 77 backend tests (`AuthServiceTest`, `SsoAuthEndpointTests`, `AccountLockoutIntegrationTest`). Comprehensive architectural handoff documentation (`M1_HANDOFF_CONTEXT.md`).
- **Attribution Confidence:** HIGH.

### 2. Nguyễn Gia Đạt (ID-02) — Module 2 Lead
- **Authored Commits:** 8 commits on `dat-nguyen-gia`.
- **Key Deliverables:** Full Module 2 implementation in commit `4bd4ecd` (+3,417 lines, 33 files): receptionist operations, retreat booking calculation, room assignment, VNPay deposit gateway, and customer identity adapter (`CustomerIdentityPort`).
- **Testing & Quality:** Authored 34 backend tests (`ReceptionistOperationServiceTest`, `VNPayDepositServiceTest`). Resolved customer profile persistence bugs.
- **Attribution Confidence:** HIGH.

### 3. Nguyễn Tất Đạt (ID-03) — Technical Lead & Integrator (Module 3)
- **Authored Commits:** 102 commits across branches and integration branch.
- **Key Deliverables:** System architecture, shared UI design tokens & layouts, Module 3 Spa scheduling engine & UI (`SpaService`, `SpaBookingController`), cross-module stay adapter (`DefaultCustomerStayAdapter`), entire full team merge and conflict resolution (Phases 117–118), and test suite harmonization (`1f7ebc1`).
- **Testing & Quality:** Authored 24 M3 tests; diagnosed and fixed full suite test regressions; maintained zero-mutation database safety invariant; produced extensive audit reports.
- **Attribution Confidence:** HIGH.

### 4. Vũ Phương Thảo (ID-04) — Module 4 Lead
- **Authored Commits:** 57 commits on `thao-product`.
- **Key Deliverables:** Menu catalog, dietary allergen filtering (`dietaryFilter.ts`), daily meal plan selection, a-la-carte ordering, Kitchen Display System (KDS), recipe ingredient tracking & stock deduction (`InventoryService`), and text encoding repair sanitizers.
- **Testing & Quality:** Authored 42 backend tests (`MealOrderServiceTest`, `InventoryServiceTest`, `MenuServiceTest`). High commit frequency with clean, incremental feature delivery.
- **Attribution Confidence:** HIGH.

### 5. Trần Xuân Hòa (ID-05) — Module 5 Lead
- **Authored Commits:** 8 commits on `XH` / `XH4`.
- **Key Deliverables:** Massive Module 5 delivery in commit `ebaddc7` (+7,608 lines, 68 files): real-time folio aggregation, multi-channel checkout payments, VAT calculation & PDF invoicing (`InvoicePdfService`), customer post-stay reviews & ratings, and manager financial analytics.
- **Testing & Quality:** Authored comprehensive test suite `M5BillingAndCheckoutTests` (48/48 tests passing). Harmonized stubs to canonical entities in commit `9668586`.
- **Attribution Confidence:** HIGH.

### 6. Phan Thành Vinh (ID-06) — Module 6 Lead
- **Authored Commits:** 22 commits on `vinhpt` and `vinhpt1`.
- **Key Deliverables:** Manager villa management page (2,765 lines) and spa management page (1,843 lines), 11 operational modals in `components/operations`, master data seed scripts (`V1_2`, `V1_3`, `V1_4`), admin governance UI, and detailed business flow documentation.
- **Testing & Quality:** Authored 49 backend tests (`M6AdminIntegrationTests`, `DelegationServiceTest`). Rich interactive UI implementation.
- **Attribution Confidence:** HIGH.

### 7. Nguyễn Cường Mạnh (ID-07) — Supervisor / Lecturer
- **Role:** Course Instructor & Academic Supervisor (`manhnc5@fe.edu.vn`). Initial repository setup.

---

## 10. UNRESOLVED IDENTITY AND ATTRIBUTION QUESTIONS

1. **Student ID Captures:**
   University student roll numbers were captured directly for Nguyễn Tất Đạt (`HE181883`), Nguyễn Gia Đạt (`HE181035`), and Trần Xuân Hòa (`HE180798`). Student roll numbers for Lê Đức Hoàng, Vũ Phương Thảo, and Phan Thành Vinh were not captured in Git author email addresses (they used personal Gmail accounts). However, their full names and task ownership are 100% verified against `01_Planning/Task_Project_G1_IS2005.csv`.
2. **Branch `vinhpt` vs `vinhpt1`:**
   Confirmed that `vinhpt` was an early 3-commit skeleton branch superseded by `vinhpt1`. Both were authored by Phan Thành Vinh.
3. **Branch `XH4` vs `XH`:**
   Confirmed that `XH4` contained only early documentation and 0 code files in `05_Development/`, having been superseded by `XH`.

---

## 11. CONSOLIDATED GAP REGISTER

| Gap ID | Module | Risk / Defect / Condition | Category | Severity | Priority | Proposed Task | Suggested Owner |
|---|---|---|---|---|---|---|---|
| **GAP-05** | Security | `/api/v1/auth/dev/**` bypass endpoint permitted in SecurityConfig | Security Review | CRITICAL | **P0** | Lock dev auth endpoints behind `@Profile("dev")` | Lê Đức Hoàng & Nguyễn Tất Đạt |
| **GAP-01** | M2/M5 | Live VNPay gateway deposit & final checkout IPN unverified | Runtime Verification | HIGH | **P1** | Configure VNPay sandbox credentials and test live IPN | Nguyễn Gia Đạt & Trần Xuân Hòa |
| **GAP-02** | M1 | Live Google & Facebook OAuth2 network handshakes unverified | Runtime Verification | HIGH | **P1** | Register OAuth2 client secrets and verify live redirect login | Lê Đức Hoàng |
| **GAP-03** | Database | Business catalog tables in `HSWRMS_TEST` hold 0 rows | Database Alignment | HIGH | **P1** | Authorize and execute fixed catalog seed against `HSWRMS_TEST` | Nguyễn Tất Đạt |
| **GAP-04** | Database | 4 migration scripts deferred as untracked files on disk | Database Alignment | MEDIUM | **P1** | Sequence and integrate migrations into formal Flyway baseline | Nguyễn Tất Đạt |
| **GAP-06** | Cross-Module | End-to-end multi-module operational walkthrough unexecuted | Runtime Verification | HIGH | **P1** | Deploy to staging and execute full guest journey walkthrough | Entire Team (Lead: Nguyễn Tất Đạt) |
| **GAP-07** | M2/M4 | High-concurrency room booking & stock deduction contention | Concurrency / Load | MEDIUM | **P2** | Run JMeter concurrency stress test on room locking | Nguyễn Gia Đạt & Vũ Phương Thảo |
| **GAP-08** | M1 | Live email OTP dispatch via production SMTP unconfigured | Runtime Verification | LOW | **P2** | Configure SMTP credentials in production environment | Lê Đức Hoàng |

---

## 12. PRIORITIZED IMPROVEMENT ROADMAP

### Milestone 1: Immediate Security & Database Hardening (Pre-Release)
- **Task ACT-01 (P0):** Lock down `/api/v1/auth/dev/**` endpoint using `@Profile("dev")`. Ensure it returns 404 in production.
- **Task ACT-02 (P1):** Obtain operator authorization and execute remediated `hswrms_test_business_catalog_seed.sql` against `HSWRMS_TEST`.
- **Task ACT-03 (P1):** Reconcile the 4 deferred migration scripts into Flyway sequential version migrations.

### Milestone 2: Staging Integration & Third-Party Gateway Testing
- **Task ACT-04 (P1):** Connect VNPay sandbox test credentials; verify deposit payment callback and checkout balance settlement.
- **Task ACT-05 (P1):** Register Google and Facebook OAuth2 client secrets; verify production SSO login redirects.
- **Task ACT-08 (P2):** Configure SMTP credentials for live customer email OTP delivery.

### Milestone 3: End-to-End Operational Walkthrough & Concurrency Hardening
- **Task ACT-06 (P1):** Conduct full team end-to-end lifecycle demonstration on staging server (Guest Booking -> Check-In -> Dining Order in KDS -> Spa Treatment -> Checkout Invoicing).
- **Task ACT-07 (P2):** Execute multi-threaded concurrency load tests on room booking and kitchen stock deduction.

---

## 13. EXCEL-READY DATA INVENTORY

All tabular datasets generated during this audit have been exported as standardized, filterable CSV files inside the audit-output directory:
`E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules\06_Reports\audit-output\`

| Dataset File Name | Description & Contents | Record Count |
|---|---|---:|
| `01_Executive_Summary.csv` | Executive metrics, repository state, test results, and recommendations | 16 rows |
| `02_Member_Summary.csv` | Member evaluation summary, scope, commit volume, quality, and notes | 7 rows |
| `03_Contribution_Log.csv` | Granular contribution ledger classified by types A–L with commit SHAs | 44 rows |
| `04_Module_Completeness.csv` | Feature inventory across M1–M6 + Infra with evidence and runtime states | 47 rows |
| `05_Branch_Integration.csv` | Contributor branch integration mechanisms, heads, merge bases, and status | 8 rows |
| `06_Test_Evidence.csv` | Test suite metrics, execution times, what it proves vs does not prove | 12 rows |
| `07_Gap_Register.csv` | Consolidated gap register with categories, severity, priority, and tasks | 8 rows |
| `08_Action_Plan.csv` | Prioritized remediation tasks, owners, prerequisites, and criteria | 8 rows |
| `09_Evidence_Index.csv` | Index of 33 key reports, scripts, plans, and commit checkpoints | 33 rows |
| `10_Identity_Mapping.csv` | Student names, roll numbers, emails, git aliases, and module roles | 7 rows |

---

## 14. LIMITATIONS AND UNVERIFIED CLAIMS

1. **In-Memory Test Execution Boundary:**
   All 526 passed backend tests executed against in-memory H2 in MSSQLServer compatibility mode. While this validates SQL grammar and Spring bean wiring, it does not prove behavior under live Microsoft SQL Server 2022 concurrency locks or isolation levels.
2. **Third-Party External Services Boundary:**
   Google/Facebook OAuth2 endpoints, VNPay payment gateways, and SendGrid/SMTP dispatch were validated using mocked responses and HMAC checksum unit tests. No live external network calls were executed.
3. **Phase 119 and 120 Non-Existence:**
   As independently verified, Phases 5.8.3.119 and 5.8.3.120 were never executed or authored. Phase 5.8.3.118 represents the terminal integration milestone of the current repository.

---

## 15. RECOMMENDED NEXT STEPS

1. **Faculty / Supervisor Review:**
   Present this audit report and the exported CSV ledgers to Course Instructor Nguyễn Cường Mạnh for formal contribution verification.
2. **Pre-Staging Security Lockdown:**
   Implement Task ACT-01 immediately to remove or restrict the `/api/v1/auth/dev/**` backdoor before deploying to any shared staging network.
3. **Controlled Test Database Seed Execution:**
   Execute Task ACT-02 to populate the empty `HSWRMS_TEST` catalogs under controlled administrative supervision.
4. **Conduct Acceptance Walkthrough:**
   Schedule a 60-minute multi-module walkthrough on a staging instance with all 6 team members demonstrating their integrated screens.

