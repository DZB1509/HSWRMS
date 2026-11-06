# HSWRMS Final Pre-Commit Review Report
## Comprehensive Read-Only Audit of 119 Staged Files (Groups 1–5)

**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Branch:** `feature/hswrms-m1-m6-integration`  
**Current HEAD:** `4b93dc74c1d4e6d9254d630efcb0d8b80f033a94`  
**Audit Scope:** 119 staged files across Groups 1–5  
**Audit Mode:** Strictly Read-Only  
**Generated At:** 2026-11-06T17:55:00+07:00  

---

## 1. Executive Summary

This comprehensive pre-commit audit evaluates the full integration index of 119 staged files across the HeavenStay Wellness Resort Management System (HSWRMS). The staged scope represents the atomic convergence of:
1. **Group 1 (11 files):** Authentication, Role Navigation & Unified Account Layout.
2. **Group 2 (42 files):** Centralized Multilingual Localization (vi, en, fr, ja, zh-CN) & Dynamic Content Resolvers.
3. **Group 3 (37 files):** M3 Spa Catalog, Local High-Res Photo Assets, Booking Validations & Therapist Operational Roster.
4. **Group 4 (12 files):** M4 F&B SQL Server Integration, KDS Kitchen Dashboard & Folio Schema Alignment.
5. **Group 5 (17 files):** Automated Unit/Integration Test Suites, Dedicated Test Fixture & Process Safety Tooling.

All 119 files have been inspected at the diff level. Deep automated scans for hardcoded secrets, authentication bypasses, privilege escalations, destructive DDL, and process termination risks returned **zero blocking violations**.

### Final Audit Verdict: `APPROVED FOR COMMIT`

- **Blocking Issues:** **0**
- **Non-Blocking Architecture Observations:** **2** (interim frontend dynamic content mapping; test datasource fallback naming)
- **Sensitive Credentials Detected:** **0**
- **Git Safety Invariants:** 100% Preserved (4 stashes intact, 0 unstaged modifications to tracked files, untracked artifacts unstaged).

---

## 2. Git State & Inventory Verification

### 2.1 Working Tree & Index State
- **Branch:** `feature/hswrms-m1-m6-integration`
- **HEAD Commit:** `4b93dc74c1d4e6d9254d630efcb0d8b80f033a94`
- **Total Staged Files:** `119`
- **Total Unstaged Tracked Changes:** `0` (working tree is 100% clean of tracked modifications)
- **Diff Statistics:** `119 files changed, 12243 insertions(+), 1783 deletions(-)`
- **Existing Git Stashes Preserved:**
  - `stash@{0}`: `local-working-tree-pre-sync`
  - `stash@{1}`: `HSWRMS pre-fast-forward preservation 2026-11-03`
  - `stash@{2}`: `HSWRMS Phase 5.8.12 preservation 2026-11-01`
  - `stash@{3}`: `HSWRMS consolidation preservation before fast-forward 2026-11-01`

### 2.2 Group-by-Group File Count Breakdown
| Group | Description | Approved Staged Count | Index Verification |
| :--- | :--- | :---: | :---: |
| **Group 1** | Authentication & Shared Account Layout | **11** | Verified (Exact Match) |
| **Group 2** | Global i18n & Dynamic Content | **42** | Verified (Exact Match) |
| **Group 3** | M3 Spa Treatment Catalog, JPEGs & Therapist Workflow | **37** | Verified (Exact Match) |
| **Group 4** | M4 F&B SQL Server Integration & KDS Dashboard | **12** | Verified (Exact Match) |
| **Group 5** | Automated Tests & Infrastructure Fixtures | **17** | Verified (Exact Match) |
| **Total** | **Full Feature Integration Scope** | **`119`** | **100% Verified** |

### 2.3 Untracked Asset Isolation
The following untracked directories remain completely unstaged and excluded from Git index:
- `06_Reports/` (all verification and scope review reports)
- `scratch/` (temporary diagnostic scripts and test runners)
- `05_Development/database/generated/` (transient schema and migration outputs)
- `07_Document_References/` (project handoff and historical reference notes)

---

## 3. Group-by-Group Deep Diff Review

### 3.1 Group 1 — Authentication & Shared Account Layout (11 Files)
- **Files Reviewed:**
  - `05_Development/frontend/src/components/navigation/UserAccountMenu.tsx` (New)
  - `05_Development/frontend/src/pages/auth/LoginPage.tsx` (Modified)
  - `05_Development/frontend/src/app/providers/AuthProvider.tsx` (Modified)
  - `05_Development/frontend/src/types/auth.ts` (Modified)
  - `05_Development/frontend/src/App.tsx` (Modified)
  - `05_Development/frontend/src/components/navigation/CustomerNavbar.tsx` (Modified)
  - `05_Development/frontend/src/components/navigation/OperationalSidebar.tsx` (Modified)
  - `05_Development/frontend/src/app/layouts/OperationalLayout.tsx` (Modified)
  - `05_Development/frontend/src/app/layouts/ManagerAdminLayout.tsx` (Modified)
  - `05_Development/frontend/src/styles/components.css` (Modified)
  - `05_Development/frontend/src/styles/layouts.css` (Modified)

- **Key Findings & Verification:**
  - **Unified Account Menu:** `UserAccountMenu.tsx` replaces ad-hoc user badges across `CustomerNavbar`, `OperationalLayout`, and `ManagerAdminLayout`. It provides consistent profile display, theme toggling, language switcher, real-time backend health check, and a unified sign-out trigger.
  - **Safe Logout Handling:** `handleSignOut()` invokes `logout()` in `AuthProvider`, clearing tokens, `sessionStorage`, `localStorage`, resetting in-memory role to `public`, and redirecting to `/login` with `{ replace: true }`.
  - **Demo Login Isolation:** In `LoginPage.tsx`, the quick demo account buttons are strictly gated by `Boolean(import.meta.env.DEV && searchParams.get('demo') === '1')`. In production builds, `import.meta.env.DEV` evaluates to `false`, completely eliminating demo shortcuts from production artifacts.
  - **Automated Test Locators:** All demo buttons feature explicit IDs (`demo-login-admin`, `demo-login-manager`, `demo-login-receptionist`, `demo-login-therapist`, `demo-login-fbstaff`, `demo-login-customer`).
  - **Role Normalization:** Aligned F&B staff demo account email to `fnb@heavenstay.dev` consistently across `AuthProvider`, `types/auth.ts`, and `LoginPage`.
  - **No Authentication Bypass:** Protected routes and permission guards in `AppRouter` and `AuthProvider` remain strictly enforced.

---

### 3.2 Group 2 — Global i18n & Dynamic Content (42 Files)
- **Files Reviewed:**
  - `05_Development/frontend/src/api/client/apiClient.ts` (Modified)
  - `05_Development/frontend/src/i18n/index.ts` (Modified)
  - `05_Development/frontend/src/i18n/dynamicContent.ts` (Modified)
  - `05_Development/frontend/src/context/CustomerContext.tsx` (Modified)
  - `05_Development/frontend/src/components/common/DevHealthIndicator.tsx` (Modified)
  - `05_Development/frontend/src/components/navigation/Footer.tsx` (Modified)
  - `05_Development/frontend/src/components/retreat/RetreatCard.tsx` (Modified)
  - 30 Locale JSON dictionaries: 6 namespaces (`auth`, `common`, `customer`, `navigation`, `operations`, `retreat`) across 5 languages (`vi`, `en`, `fr`, `ja`, `zh-CN`).
  - 5 Customer & Retreat Pages: `BookingDetailPage.tsx`, `CustomerDashboardPage.tsx`, `MyBookingsPage.tsx`, `RetreatBookingPage.tsx`, `RetreatDetailPage.tsx`.

- **Key Findings & Verification:**
  - **API Locale Propagation:** In `apiClient.ts`, every HTTP request inspects `localStorage.getItem('hswrms_language') || 'vi'` and automatically attaches `'Accept-Language': currentLang`, ensuring backend services receive client locale context.
  - **Resource Construction:** `i18n/index.ts` uses recursive `deepMerge` to compile namespace resources across all 5 supported languages, guaranteeing that missing keys in regional translations cleanly fall back to default languages without crashing.
  - **Dynamic Entity Localization:** `dynamicContent.ts` provides complete authentic 5-language translations for the 8 Retreat Packages, 6 Villa Categories, 18 Spa Treatments, and Booking/Payment statuses. Lookups are keyed by immutable database IDs (`id: 1..8`) and codes.
  - **Architectural Qualification:** `dynamicContent.ts` operates as an interim frontend translation resolver. The system is NOT yet a database-driven multilingual CMS; future database localization architecture is documented in `06_Reports/HSWRMS_CENTRALIZED_MULTILINGUAL_ARCHITECTURE_SPEC.md`.
  - **Currency Stability:** Currency formatting adheres strictly to Vietnamese Dong (`VND`) as the primary resort pricing currency; changing language does not alter financial amounts.

---

### 3.3 Group 3 — M3 Spa Treatment Catalog, Booking & Therapist Workflow (37 Files)
- **Files Reviewed:**
  - 19 Local JPEG Images: `05_Development/frontend/public/assets/spa/*.jpg` (18 treatments + `fallback.jpg`).
  - Frontend Spa Modules: `SpaContext.tsx`, `mockSpa.ts`, `mockSpaInventory.ts`, `spa.css`, `SpaTreatmentListPage.tsx`, `SpaBookingPage.tsx`, `SpaConfirmationPage.tsx`, `SpaManagementPage.tsx`, `TherapistDashboardPage.tsx`, `TherapistSchedulePage.tsx`, `TherapistSessionDetailPage.tsx`.
  - Backend Spa Modules: `TherapistRosterDto.java`, `TherapistController.java`, `TherapistStatusService.java`, `TherapistTreatmentQualificationRepository.java`, `SpaSessionService.java`, `DefaultCustomerStayAdapter.java`, `SecurityConfig.java`.

- **Key Findings & Verification:**
  - **Dual Availability Invariant:** `SpaSessionService.confirmReservation` requires both Therapist and Treatment Room to be available simultaneously.
  - **Stay-Period Boundary Validation (BR-M3-02):** `SpaSessionService.validateStayWindow()` asserts that the scheduled session start and end times fall strictly within the active customer's retreat stay (`stay.checkInDate` to `stay.checkOutDate`).
  - **Active Stay Priority:** `DefaultCustomerStayAdapter` prioritizes `CHECKED_IN` bookings over `CONFIRMED` bookings when resolving active customer context.
  - **SQL Server Syntax:** Refactored SQL queries from ANSI quotes (`dbo."User"`) to T-SQL brackets (`dbo.[User]`), preventing SQL syntax errors on Microsoft SQL Server.
  - **Strict RBAC Hardening:**
    - `GET /api/v1/therapist` and `GET /api/v1/therapist/roster`: Enforce `@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")`.
    - `PATCH /api/v1/therapist/{id}/status`: Enforce `@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")` (Receptionist role revoked from altering therapist operational statuses).
    - `/api/v1/therapist/**` (clinical/schedule): Strictly limited to `hasRole('THERAPIST')`.
  - **Sensitive Data Minimization:** Therapists see only relevant medical notes, contraindications, and customer preferences. Receptionist has no access to sensitive therapy intake data.
  - **Mock Data Decoupling:** `mockSpa.ts` is purely a visual fallback asset catalog (`/assets/spa/*.jpg`). API failures dispatch explicit error flags and never silently fall back to synthetic responses.

---

### 3.4 Group 4 — M4 F&B SQL Server Integration & KDS Dashboard (12 Files)
- **Files Reviewed:**
  - Backend F&B Services: `FnbDashboardController.java`, `FnbKdsOrderServiceImpl.java`.
  - Frontend F&B Modules: `DiningContext.tsx`, `mockDining.ts`, `fnbApi.ts`, `fnbDto.ts`, `DietaryMenuPage.tsx`, `FnbDashboardPage.tsx`.
  - Configuration & Schema: `application.yml`, `application-dev.yml`, `application-sqlserver.yml`, `schema.sql`.

- **Key Findings & Verification:**
  - **Date Parameter Handling:** `FnbDashboardController` accepts both `date` and `asOfDate` query parameters, defaulting to `LocalDate.now()`.
  - **Resilient Entity Projection:** `FnbKdsOrderServiceImpl` supports both eager and lazy relations for `RetreatBooking`, resolving guest names and villa numbers safely.
  - **Dietary Data Minimization:** Kitchen prep entries project food allergies and dietary preferences via `DietaryProfilePort.FoodProfileProjection`; non-dietary medical notes are excluded from kitchen visibility.
  - **Non-Destructive DDL:** In `schema.sql`, added `adjusted_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_FolioItem_AdjustedAmount DEFAULT (0)` to `dbo.FolioItem`, reconciling the database schema with the JPA entity model. No existing columns or tables were dropped or modified destructively.
  - **Database Profile Isolation:** `application.yml`, `application-dev.yml`, and `application-sqlserver.yml` configure the default target database as `HSWRMS_TEST` and default user as `hswrms_app_user`. Default passwords have been stripped.
  - **CORS Hardening:** Allowed origins include both `localhost` and `127.0.0.1` on ports `5173` and `4173`.

---

### 3.5 Group 5 — Automated Tests & Infrastructure Fixtures (17 Files)
- **Files Reviewed:**
  - 8 Modified Tests: `AuthServiceTest.java`, `SpaScheduleVersionLifecycleTest.java`, `SpaSecurityTests.java`, `SpaServiceTests.java`, `SpaTestConfig.java`, `SpaTimelineCheckpointTest.java`, `TherapistHealthProjectionConsentTest.java`, `TherapistRecoveryOrchestrationTest.java`.
  - 4 New Tests: `SpaBookingLifecycleHardeningTest.java`, `TherapistRosterServiceTest.java`, `HswrmsDatabaseBootstrapIntegrationTest.java`, `FnbCrossModuleWorkflowIntegrationTest.java`.
  - 1 Fixture: `V1_8__seed_dedicated_test_therapist_fixture.sql`.
  - 4 Tooling Scripts: `run-dev.ps1`, `stop-dev.ps1`, `05_Development/backend/run-dev.ps1`, `05_Development/backend/run-local.ps1`.

- **Key Findings & Verification:**
  - **Fixture Environment Guards:** `V1_8__seed_dedicated_test_therapist_fixture.sql` contains exact dual-identity guard assertions (instance `MYLIFE-MYRULE-1` + target databases `HSWRMS_TEST`, `HSWRMS_DEV_TEST`, `HSWRMS_DISPOSABLE_TEST`). It strictly rejects system databases (`master`, `model`, `msdb`, `tempdb`), production-like editions, and clustered/HADR instances.
  - **Therapist Protection:** The fixture creates a dedicated isolated user `TEST_THERAPIST_99` (`password_hash = NULL`), preserving existing Therapist #1 (`therapist@heavenstay.dev`) and Therapist #2 untouched.
  - **Transactional Test Rollback:** Integration tests (such as `FnbCrossModuleWorkflowIntegrationTest`) leverage Spring `@Transactional` to guarantee complete rollback after execution, preventing test pollution.
  - **Process Termination Safety:** `stop-dev.ps1` verifies PID, creation timestamp, and command line before terminating any process. It explicitly safeguards Antigravity, LanguageServer, Gemini, VS Code, and Windows system processes from accidental termination.
  - **Credential Leak Prevention:** In `run-local.ps1`, all hardcoded dev Gmail credentials were completely excised. The script defaults to console logging via `DevEmailDeliveryAdapter` unless external environment variables are provided.

---

## 4. Cross-Module Integration Assessment

The 8 primary cross-module interaction dimensions were evaluated against architectural standards:

| Integration Dimension | Upstream Module | Downstream Module | Contract Status | Evaluation Summary |
| :--- | :--- | :--- | :---: | :--- |
| **1. Auth & Navigation** | M1 Identity (`AuthProvider`) | Shared UI (`UserAccountMenu`, `AppRouter`) | **HEALTHY** | Stateless JWT tokens, role-based route guards, and synchronized menus across Customer, Therapist, F&B Staff, Manager, and Admin. |
| **2. Locale Propagation** | Shared UI (`LanguageSwitcher`) | Backend APIs (`apiClient`) | **HEALTHY** | `Accept-Language` header sent on all API calls; frontend `dynamicContent.ts` provides fallback localization. |
| **3. Stay-Period Validation** | M2 Booking (`CustomerStayPort`) | M3 Spa (`SpaSessionService`) | **HEALTHY** | `validateStayWindow` guarantees spa bookings cannot occur before check-in or after check-out. |
| **4. Therapist Roster RBAC** | M3 Therapist (`TherapistController`) | M6 Manager UI (`SpaManagementPage`) | **HEALTHY** | Strict `@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")` on roster and status updates; Receptionist excluded. |
| **5. Dietary Profile & KDS** | M1 Health Profile (`DietaryProfilePort`) | M4 F&B Kitchen (`FnbKdsOrderServiceImpl`) | **HEALTHY** | Sensitive health minimization: kitchen views food allergies and dietary preferences only. Private clinical notes remain inaccessible. |
| **6. F&B Folio Billing** | M4 F&B Orders (`FnbKdsOrderServiceImpl`) | M5 Billing (`FolioBillingService`) | **HEALTHY** | Daily meal package items incur zero additional charge; a la carte items post idempotent folio charges with `adjusted_amount`. |
| **7. Service Order Restrictions**| M3/M4 Open Orders | M5 Checkout (`FolioBillingService`) | **HEALTHY** | Unfulfilled spa appointments and in-prep dining orders block checkout completion. |
| **8. Profile Isolation** | Spring Boot (`application*.yml`) | Microsoft SQL Server | **HEALTHY** | Default database isolated to `HSWRMS_TEST` with `hswrms_app_user`. Zero hardcoded credentials committed. |

---

## 5. Sensitive Information & Security Scan

An exhaustive regex and AST scan was conducted across all 119 staged files (both diff additions and complete file contents).

### 5.1 Scan Target Categories
- Database passwords and connection strings containing credentials
- API keys, JWT signing keys, and private keys
- Hardcoded SMTP credentials and app passwords
- Personal identifying information (PII) or unmasked test credentials

### 5.2 Scan Results
| File Path | Line | Parameter / Key | Scanned Pattern | Classification | Status |
| :--- | :---: | :--- | :--- | :--- | :---: |
| `05_Development/backend/run-dev.ps1` | 119 | `Password: [PROTECTED]` | Console log string | Masked String Literal | **PASS** |
| `05_Development/backend/src/main/resources/application.yml` | 19 | `password: ${HSWRMS_DB_PASSWORD:...}` | Spring property | Env Var Substitution | **PASS** |
| `05_Development/backend/src/main/resources/application-dev.yml` | 19 | `password: ${HSWRMS_DB_PASSWORD:...}` | Spring property | Env Var Substitution | **PASS** |
| `05_Development/backend/src/main/resources/application-sqlserver.yml` | 13 | `password: ${HSWRMS_DB_PASSWORD:...}` | Spring property | Env Var Substitution | **PASS** |
| `05_Development/backend/src/test/.../HswrmsDatabaseBootstrapIntegrationTest.java` | 48 | `"spring.datasource.password=${HSWRMS_DB_PASSWORD:}"` | Test property | Env Var Substitution | **PASS** |

**Total Real Credentials Committed: `0`**  
All secret properties resolve dynamically via environment variables with blank fallbacks. Hardcoded passwords previously present in `run-local.ps1` have been completely removed.

---

## 6. Database & Infrastructure Safety Review

1. **Destructive DDL Assessment:**
   - `schema.sql` was checked for `DROP TABLE`, `DROP COLUMN`, `TRUNCATE`, and incompatible `ALTER TABLE` statements.
   - Result: Only non-destructive column addition: `adjusted_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_FolioItem_AdjustedAmount DEFAULT (0)` on `dbo.FolioItem`.
2. **Database Mutation Invariant:**
   - Zero database write commands or live migrations were executed during review.
3. **Database Selection Posture:**
   - Application YAML profiles default to `HSWRMS_TEST`, preventing accidental modification of primary business database `HSWRMS` during unconfigured runs.
4. **Fixture Safety:**
   - `V1_8__seed_dedicated_test_therapist_fixture.sql` has `@AllowLocalDevDbOptIn = 0` by default and strict dual-identity server/database assertions.

---

## 7. Severity-Ranked Findings

| Finding ID | Severity | File Reference | Description | Status |
| :--- | :---: | :--- | :--- | :---: |
| `FINDING-G2-01` | **LOW** | `05_Development/frontend/src/i18n/dynamicContent.ts` | **Interim Frontend Translation Resolver:** Dynamic catalog entities (treatments, retreat packages, villa categories) are mapped in frontend code rather than a centralized database CMS. Documented in `HSWRMS_CENTRALIZED_MULTILINGUAL_ARCHITECTURE_SPEC.md` for future database-driven translation tables. | Non-blocking (Design intentional) |
| `FINDING-G5-01` | **LOW** | `05_Development/backend/src/test/.../HswrmsDatabaseBootstrapIntegrationTest.java#L46` | **Test Property Default Fallback:** Fallback database URL in `@TestPropertySource` specifies `databaseName=HSWRMS` instead of `HSWRMS_TEST` if `HSWRMS_DB_URL` is unset. Tests are strictly read-only assertions and perform zero writes. | Non-blocking (Future cleanup) |

**Summary:** 0 Critical, 0 High, 0 Medium, 2 Low (non-blocking architectural and test configuration observations).

---

## 8. Commit Structure Recommendation

### 8.1 Strategy Analysis: Option A vs. Option B
- **Option A: Single Atomic Integration Commit (RECOMMENDED)**
  - *Rationale:* All 119 files are mutually coherent and verified together. Group 1 navigation components directly depend on Group 2 locale files; Group 3 spa controllers rely on Group 1 security configurations; Group 4 F&B services rely on schema adjustments; and Group 5 tests validate the integrated behavior. Committing atomically preserves complete build integrity without risking broken intermediate states.
- **Option B: Five Logical Group Commits**
  - *Risk:* Splitting the already-staged index into 5 commits requires resetting parts of the index, introducing unnecessary staging churn and potential drift on the integration branch.

### 8.2 Proposed Commit Messages

#### Recommended: Option A — Single Atomic Integration Commit
```git
feat(integration): unify M1-M6 authentication, i18n, spa, fnb, and test fixtures

- M1 Auth & Layout: unified UserAccountMenu, dev-demo login isolation (?demo=1), role-based operational layouts
- Global i18n: complete 5-language static/dynamic localization (vi, en, fr, ja, zh-CN) and Accept-Language propagation
- M3 Spa: therapist roster management, qualification repository, stay-period boundary enforcement, and photo assets
- M4 F&B: KDS order lifecycle, resilient booking projection, dietary allergy isolation, and folio item adjustment schema
- M5/M6 & Infrastructure: database profile hardening (HSWRMS_TEST), safe PID process shutdown, and integration test suites
```

#### Alternative: Option B — Five Granular Commits (if explicitly preferred)
1. `feat(auth): unify account layout, dev demo gate, and role navigation` (11 files)
2. `feat(i18n): expand 5-language localization, dynamic content map, and Accept-Language client` (42 files)
3. `feat(m3-spa): add therapist roster, stay boundary validation, and treatment photo assets` (37 files)
4. `feat(m4-fnb): integrate KDS kitchen workflow, dietary alert projections, and folio item schema` (12 files)
5. `test(infra): harden test fixtures, database configuration profiles, and dev runners` (17 files)

---

## 9. Final Verdict & Next Steps

### Verdict: `APPROVED FOR COMMIT`

The staged index is clean, coherent, secure, and ready for commit.

### Mandatory Pre-Commit Checklist:
- [x] Exact 119 files staged across Groups 1–5.
- [x] Zero unstaged modifications to tracked files.
- [x] Zero hardcoded credentials or secrets.
- [x] Zero destructive DDL changes.
- [x] Dual-identity guards active on SQL fixtures.
- [x] Process safety verified in tooling scripts.
- [x] All 4 Git stashes preserved intact.
- [x] No commit or push has been executed.

**Awaiting user authorization to proceed with committing.**

