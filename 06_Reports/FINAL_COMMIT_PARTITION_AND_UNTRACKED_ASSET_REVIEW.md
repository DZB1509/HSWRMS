# HSWRMS Final Commit Partitioning & Untracked Asset Classification
## Safe Six-Commit Execution Plan & Untracked Asset Governance

**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Branch:** `feature/hswrms-m1-m6-integration`  
**Current HEAD:** `4b93dc74c1d4e6d9254d630efcb0d8b80f033a94`  
**Current Staged Scope:** Exactly 119 files across 5 functional groups  
**Audit & Review Mode:** Strictly Read-Only (Zero Commits / Zero Staging Mod / Zero Database Writes)  
**Updated At:** 2026-11-06T18:22:00+07:00  

---

## 1. Executive Summary

This report establishes the finalized, deterministic, and safe Git execution plan to commit the full integration milestone for the HeavenStay Wellness Resort Management System (HSWRMS). 

### Key Accomplishments & Architectural Decisions:
1. **Six-Commit Sequential Structure:**
   - Commits 1–5: Partitions the 119 staged files into 5 focused functional commits (Auth, i18n, Spa, F&B, Tests).
   - Commit 6: Preserves curated requirements, Software Design Specifications (SDS), architecture/database UML diagrams, Architecture Decision Records (ADRs), authoritative audit evidence, and curated visual acceptance screenshots.
2. **Safe Staging Index Partitioning & Hardened Recovery Architecture:**
   - Resolves the challenge of all 119 files currently residing together in the staging index.
   - Eliminates dangerous history-rewriting rollback commands (`git reset --soft`).
   - Implements monotonic, forward-only recovery principles:
     - Pre-flight index backup (`.git/index_backup_119_staged`) and manifest capture (`.git/staged_manifest_119.txt`).
     - Pre-commit assertion gates verifying exact file lists and counts.
     - Post-commit hash recording and membership verification.
     - Immediate halt on failure without resetting HEAD or overwriting index.
     - The original index backup may only be restored if zero commits have been made.
3. **Resolution of Documentation Review Points:**
   - **Review Point A (`M3_4_1...` Report):** Confirmed included in Commit 6. It provides crucial audit verification for RBAC hardening, live SQL Server roster integration, and Playwright browser regression tests.
   - **Review Point B (`07_Document_References/AGENTS.md`):** Content inspection proved it is **not** an obsolete duplicate of root `AGENTS.md`. It is an 835-line comprehensive implementation reference and historical governance guide. Confirmed included in Commit 6.
4. **Visual Evidence Governance:**
   - The 52 curated visual acceptance screenshots (~23.5 MB across `global-ui-acceptance/`, `spa-catalog-final-acceptance/`, and `multilingual-dynamic-content/`) are included in Commit 6 to provide definitive, verifiable visual evidence for academic defense and project evaluation.
   - Ephemeral bulk root screenshots (~47 MB) and transient raw test dumps remain strictly excluded.
5. **Zero Exposure & Zero Risk:**
   - Automated secret scanners confirmed 0 hardcoded credentials or private keys across all staged and untracked assets.
   - All 4 Git stashes remain 100% intact. Zero files were committed or pushed during this task.

---

## 2. Git State & Staged Inventory Verification

- **Branch:** `feature/hswrms-m1-m6-integration`
- **HEAD Commit:** `4b93dc74c1d4e6d9254d630efcb0d8b80f033a94`
- **Total Staged Files:** Exactly `119` (`119 files changed, 12243 insertions(+), 1783 deletions(-)`)
- **Unstaged Tracked Changes:** `0` (working tree has zero unstaged tracked modifications)
- **Git Stashes Intact:** 4 stashes verified:
  - `stash@{0}`: `local-working-tree-pre-sync`
  - `stash@{1}`: `HSWRMS pre-fast-forward preservation 2026-11-03`
  - `stash@{2}`: `HSWRMS Phase 5.8.12 preservation 2026-11-01`
  - `stash@{3}`: `HSWRMS consolidation preservation before fast-forward 2026-11-01`

### Summary of Staged Group Counts
| Commit | Subsystem / Scope | File Count | Status in Git Index |
| :---: | :--- | :---: | :---: |
| **Commit 1** | Group 1 — Authentication & Account Layout | **11** | Staged & Verified |
| **Commit 2** | Group 2 — Global i18n & Dynamic Content | **42** | Staged & Verified |
| **Commit 3** | Group 3 — M3 Spa Catalog, Photos & Therapist Workflow | **37** | Staged & Verified |
| **Commit 4** | Group 4 — M4 F&B SQL Server Integration & KDS Dashboard | **12** | Staged & Verified |
| **Commit 5** | Group 5 — Automated Tests & Infrastructure Fixtures | **17** | Staged & Verified |
| **Subtotal** | **Functional Integration Scope** | **`119`** | **Atomic Staging Complete** |
| **Commit 6** | Curated Project Documentation, Diagrams & Visual Evidence | **`159`** | **Untracked Curated Scope** |

---

## 3. Five Proposed Functional Commits (Staged Scope)

### Commit 1: `feat(auth): unify authentication and role-based layouts`
**Scope:** Group 1 — 11 files  
**Rationale:** Establishes the core user session layout, unified account dropdown, gated developer demo shortcuts, and role-specific layouts across Customer and Operations.
```
05_Development/frontend/src/App.tsx
05_Development/frontend/src/app/layouts/ManagerAdminLayout.tsx
05_Development/frontend/src/app/layouts/OperationalLayout.tsx
05_Development/frontend/src/app/providers/AuthProvider.tsx
05_Development/frontend/src/components/navigation/CustomerNavbar.tsx
05_Development/frontend/src/components/navigation/OperationalSidebar.tsx
05_Development/frontend/src/components/navigation/UserAccountMenu.tsx
05_Development/frontend/src/pages/auth/LoginPage.tsx
05_Development/frontend/src/styles/components.css
05_Development/frontend/src/styles/layouts.css
05_Development/frontend/src/types/auth.ts
```

---

### Commit 2: `feat(i18n): add global multilingual support`
**Scope:** Group 2 — 42 files  
**Rationale:** Delivers comprehensive 5-language localization (`vi`, `en`, `fr`, `ja`, `zh-CN`), recursive resource merging, `Accept-Language` API propagation, dynamic entity resolvers, and localized customer retreat pages.
```
05_Development/frontend/src/api/client/apiClient.ts
05_Development/frontend/src/components/common/DevHealthIndicator.tsx
05_Development/frontend/src/components/navigation/Footer.tsx
05_Development/frontend/src/components/retreat/RetreatCard.tsx
05_Development/frontend/src/context/CustomerContext.tsx
05_Development/frontend/src/i18n/dynamicContent.ts
05_Development/frontend/src/i18n/index.ts
05_Development/frontend/src/i18n/locales/en/auth.json
05_Development/frontend/src/i18n/locales/en/common.json
05_Development/frontend/src/i18n/locales/en/customer.json
05_Development/frontend/src/i18n/locales/en/navigation.json
05_Development/frontend/src/i18n/locales/en/operations.json
05_Development/frontend/src/i18n/locales/en/retreat.json
05_Development/frontend/src/i18n/locales/fr/auth.json
05_Development/frontend/src/i18n/locales/fr/common.json
05_Development/frontend/src/i18n/locales/fr/customer.json
05_Development/frontend/src/i18n/locales/fr/navigation.json
05_Development/frontend/src/i18n/locales/fr/operations.json
05_Development/frontend/src/i18n/locales/fr/retreat.json
05_Development/frontend/src/i18n/locales/ja/auth.json
05_Development/frontend/src/i18n/locales/ja/common.json
05_Development/frontend/src/i18n/locales/ja/customer.json
05_Development/frontend/src/i18n/locales/ja/navigation.json
05_Development/frontend/src/i18n/locales/ja/operations.json
05_Development/frontend/src/i18n/locales/ja/retreat.json
05_Development/frontend/src/i18n/locales/vi/auth.json
05_Development/frontend/src/i18n/locales/vi/common.json
05_Development/frontend/src/i18n/locales/vi/customer.json
05_Development/frontend/src/i18n/locales/vi/navigation.json
05_Development/frontend/src/i18n/locales/vi/operations.json
05_Development/frontend/src/i18n/locales/vi/retreat.json
05_Development/frontend/src/i18n/locales/zh-CN/auth.json
05_Development/frontend/src/i18n/locales/zh-CN/common.json
05_Development/frontend/src/i18n/locales/zh-CN/customer.json
05_Development/frontend/src/i18n/locales/zh-CN/navigation.json
05_Development/frontend/src/i18n/locales/zh-CN/operations.json
05_Development/frontend/src/i18n/locales/zh-CN/retreat.json
05_Development/frontend/src/pages/customer/BookingDetailPage.tsx
05_Development/frontend/src/pages/customer/CustomerDashboardPage.tsx
05_Development/frontend/src/pages/customer/MyBookingsPage.tsx
05_Development/frontend/src/pages/customer/RetreatBookingPage.tsx
05_Development/frontend/src/pages/retreats/RetreatDetailPage.tsx
```

---

### Commit 3: `feat(spa): complete spa catalog and therapist workflow`
**Scope:** Group 3 — 37 files  
**Rationale:** Delivers the M3 Spa treatment catalog, 19 high-resolution JPEG assets, stay-period boundary validation, dual therapist/room availability enforcement, therapist operational roster, and strict RBAC.
```
05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java
05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/controller/TherapistController.java
05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/dto/response/TherapistRosterDto.java
05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/DefaultCustomerStayAdapter.java
05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/TherapistTreatmentQualificationRepository.java
05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaSessionService.java
05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/TherapistStatusService.java
05_Development/frontend/public/assets/spa/fallback.jpg
05_Development/frontend/public/assets/spa/spa-body-01-coffee-coconut-polish.jpg
05_Development/frontend/public/assets/spa/spa-body-02-warm-mineral-wrap.jpg
05_Development/frontend/public/assets/spa/spa-face-01-jade-guasha-facelift.jpg
05_Development/frontend/public/assets/spa/spa-face-02-deep-hydration-repair.jpg
05_Development/frontend/public/assets/spa/spa-face-03-marine-collagen.jpg
05_Development/frontend/public/assets/spa/spa-heal-01-tibetan-sound-bath.jpg
05_Development/frontend/public/assets/spa/spa-heal-02-ayurvedic-shirodhara.jpg
05_Development/frontend/public/assets/spa/spa-heal-03-chi-nei-tsang-abdominal.jpg
05_Development/frontend/public/assets/spa/spa-hydro-01-vichy-rain-therapy.jpg
05_Development/frontend/public/assets/spa/spa-hydro-02-red-dao-herbal-bath.jpg
05_Development/frontend/public/assets/spa/spa-mass-01-himalayan-hot-stone.jpg
05_Development/frontend/public/assets/spa/spa-mass-02-deep-tissue.jpg
05_Development/frontend/public/assets/spa/spa-mass-03-lymphatic-drainage.jpg
05_Development/frontend/public/assets/spa/spa-mass-04-vietnamese-acupressure.jpg
05_Development/frontend/public/assets/spa/spa-mass-05-herbal-compress.jpg
05_Development/frontend/public/assets/spa/spa-mass-06-prenatal-massage.jpg
05_Development/frontend/public/assets/spa/spa-yoga-01-spine-therapy-yoga.jpg
05_Development/frontend/public/assets/spa/spa-yoga-02-pranayama-meditation.jpg
05_Development/frontend/src/context/SpaContext.tsx
05_Development/frontend/src/data/mockSpa.ts
05_Development/frontend/src/data/mockSpaInventory.ts
05_Development/frontend/src/pages/customer/SpaBookingPage.tsx
05_Development/frontend/src/pages/customer/SpaConfirmationPage.tsx
05_Development/frontend/src/pages/customer/SpaTreatmentListPage.tsx
05_Development/frontend/src/pages/manager/SpaManagementPage.tsx
05_Development/frontend/src/pages/therapist/TherapistDashboardPage.tsx
05_Development/frontend/src/pages/therapist/TherapistSchedulePage.tsx
05_Development/frontend/src/pages/therapist/TherapistSessionDetailPage.tsx
05_Development/frontend/src/styles/spa.css
```

---

### Commit 4: `feat(fnb): integrate dining workflow with folio`
**Scope:** Group 4 — 12 files  
**Rationale:** Integrates M4 F&B dining orders with kitchen display (KDS), dietary allergy projections, folio adjustment schema alignment, and isolated database connection profiles.
```
05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/controller/FnbDashboardController.java
05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/service/FnbKdsOrderServiceImpl.java
05_Development/backend/src/main/resources/application-dev.yml
05_Development/backend/src/main/resources/application-sqlserver.yml
05_Development/backend/src/main/resources/application.yml
05_Development/database/schema.sql
05_Development/frontend/src/context/DiningContext.tsx
05_Development/frontend/src/data/mockDining.ts
05_Development/frontend/src/features/m4-fnb/api/fnbApi.ts
05_Development/frontend/src/features/m4-fnb/types/fnbDto.ts
05_Development/frontend/src/pages/customer/DietaryMenuPage.tsx
05_Development/frontend/src/pages/fb/FnbDashboardPage.tsx
```

---

### Commit 5: `test(integration): add M1-M6 integration coverage`
**Scope:** Group 5 — 17 files  
**Rationale:** Seals the feature integration with hardened unit/integration test suites, dedicated test therapist fixture (`TEST_THERAPIST_99`), safe process control scripts, and credential leak prevention.
```
05_Development/backend/run-dev.ps1
05_Development/backend/run-local.ps1
05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/HswrmsDatabaseBootstrapIntegrationTest.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/service/AuthServiceTest.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaBookingLifecycleHardeningTest.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaScheduleVersionLifecycleTest.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaSecurityTests.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaServiceTests.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaTestConfig.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaTimelineCheckpointTest.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistHealthProjectionConsentTest.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistRecoveryOrchestrationTest.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistRosterServiceTest.java
05_Development/backend/src/test/java/com/heavenstay/hswrms/m4fnb/service/FnbCrossModuleWorkflowIntegrationTest.java
05_Development/database/seed/V1_8__seed_dedicated_test_therapist_fixture.sql
run-dev.ps1
stop-dev.ps1
```

---

## 4. Documentation & Visual Evidence Governance (Commit 6)

### 4.1 Resolution of Specific Review Points

#### Point A: `06_Reports/audit-output/M3_4_1_SECURITY_CORRECTION_AND_INTEGRATION_VERIFICATION.md`
- **Audit Finding:** Inspected at the text level (233 lines, 14.5 KB).
- **Evaluation:** Directly records the authorization correction on `TherapistController.java` & `SecurityConfig.java`, dynamic SQL Server roster DTO mapping, and Playwright browser regression test suite results (75/75 passing tests).
- **Decision:** **CONFIRMED FOR INCLUSION in Commit 6.** It provides irreplaceable security and implementation evidence for M3.

#### Point B: `07_Document_References/AGENTS.md` vs Root `AGENTS.md`
- **Audit Finding:** Direct content comparison proved they are **fundamentally different**:
  - Root `AGENTS.md`: 92 lines (5,160 bytes) — concise prompt summary.
  - `07_Document_References/AGENTS.md`: **835 lines (18,184 bytes)** — exhaustive implementation guide detailing Source Precedence, Architecture Rules, Business Invariants across M1–M6, and detailed task execution context.
- **Decision:** **CONFIRMED FOR INCLUSION in Commit 6.** It is a primary historical specification, not an obsolete duplicate.

### 4.2 Visual Evidence Recommendation
- **Decision:** Include the **52 curated acceptance screenshots** (~23.5 MB) in Commit 6:
  1. `global-ui-acceptance/` (21 PNGs, 10.13 MB) — multi-role operational topbar, account menu, and 5-language dashboard evidence.
  2. `spa-catalog-final-acceptance/` (12 files, 3.78 MB) — spa treatment categories, responsive mobile view, and booking entry navigation.
  3. `multilingual-dynamic-content/` (19 PNGs, 9.61 MB) — localized dashboards and retreat catalogs across `vi`, `en`, `fr`, `ja`, and `zh-CN`.
- **Exclusion:** All 124 bulk loose root screenshots (~47 MB) and older intermediate folders (`m3-3/`, `ui-polish-m4/`) remain excluded from Git.

---

## 5. Safe Staging Index Partitioning & Hardened Recovery Architecture

### 5.1 Architecture & Safety Principles
Because all 119 files are currently staged together in `.git/index`, running `git commit` directly would commit all files into a single commit.
To partition the index deterministically without any risk to the working tree or branch history:

1. **Pre-Flight Index Backup & Manifest:**
   Before any Git index modification, save the original index bit-for-bit AND capture the exact staged manifest:
   ```powershell
   Copy-Item .git\index .git\index_backup_119_staged -Force
   git diff --cached --name-only | Out-File -FilePath .git\staged_manifest_119.txt -Encoding UTF8
   ```
2. **Working Tree Invariant:**
   `git diff --name-only` is completely empty (0 files). Every staged change already exists on disk in the working tree.
   Therefore, unstaging changes via `git restore --staged -- <paths>` ONLY modifies index pointers; it **never** alters, deletes, or truncates working tree files.
3. **Strict Validation Gates:**
   Before each commit, `git diff --cached --name-only` is asserted against the exact expected file list and count. If any discrepancy appears, the script immediately halts BEFORE creating the commit.
4. **Post-Commit Hash & Membership Recording:**
   After each successful commit, record its full hash and verify its file membership (`git diff-tree --no-commit-id --name-only -r <hash>`).
5. **Hardened Failure & Recovery Strategy (Monotonic / Forward-Only):**
   - **NEVER use `git reset --soft` after one or more commits have been created.** Resetting HEAD rewrites history and mixing the old 119-file index with an advanced commit graph corrupts repository state.
   - **NEVER overwrite `.git/index` with the original backup after any commit has been created.**
   - **Immediate Halt on Failure:** If any command fails during execution:
     1. Stop immediately.
     2. Do NOT reset HEAD.
     3. Do NOT rewrite branch history.
     4. Do NOT overwrite the current index.
     5. Preserve all successfully created commits and the current working tree.
     6. Report the exact completed and pending groups with full commit hashes.
   - **Safe Resumption Protocol:** Inspect current `HEAD`, `git status --short`, and resume execution from the exact failed step forward.
   - **Permissible Use of Pre-Commit Index Backup:** The original index backup `.git/index_backup_119_staged` may ONLY be restored if **ZERO commits** have been created (`HEAD` is still `4b93dc74c1d4e6d9254d630efcb0d8b80f033a94`) and the repository state has been verified.
   - **Retention:** `.git/index_backup_119_staged` must NOT be deleted until all six commits have been created, verified, and audited.

---

## 6. Exact Six-Commit Execution Procedure

When authorized by the user, the execution will be performed via the following deterministic sequence:

```powershell
# ==============================================================================
# HSWRMS DETERMINISTIC SIX-COMMIT EXECUTION SEQUENCE
# ==============================================================================

# Step 0: Create physical backup of current staged index and manifest
Copy-Item .git\index .git\index_backup_119_staged -Force
git diff --cached --name-only | Out-File -FilePath .git\staged_manifest_119.txt -Encoding UTF8

# ------------------------------------------------------------------------------
# STEP 1: Commit 1 (11 files)
# Unstage Groups 2, 3, 4, 5, leaving only Group 1 staged
# ------------------------------------------------------------------------------
git restore --staged -- `
  05_Development/frontend/src/api/client/apiClient.ts `
  05_Development/frontend/src/components/common/DevHealthIndicator.tsx `
  05_Development/frontend/src/components/navigation/Footer.tsx `
  05_Development/frontend/src/components/retreat/RetreatCard.tsx `
  05_Development/frontend/src/context/CustomerContext.tsx `
  05_Development/frontend/src/i18n/dynamicContent.ts `
  05_Development/frontend/src/i18n/index.ts `
  05_Development/frontend/src/i18n/locales/en/auth.json `
  05_Development/frontend/src/i18n/locales/en/common.json `
  05_Development/frontend/src/i18n/locales/en/customer.json `
  05_Development/frontend/src/i18n/locales/en/navigation.json `
  05_Development/frontend/src/i18n/locales/en/operations.json `
  05_Development/frontend/src/i18n/locales/en/retreat.json `
  05_Development/frontend/src/i18n/locales/fr/auth.json `
  05_Development/frontend/src/i18n/locales/fr/common.json `
  05_Development/frontend/src/i18n/locales/fr/customer.json `
  05_Development/frontend/src/i18n/locales/fr/navigation.json `
  05_Development/frontend/src/i18n/locales/fr/operations.json `
  05_Development/frontend/src/i18n/locales/fr/retreat.json `
  05_Development/frontend/src/i18n/locales/ja/auth.json `
  05_Development/frontend/src/i18n/locales/ja/common.json `
  05_Development/frontend/src/i18n/locales/ja/customer.json `
  05_Development/frontend/src/i18n/locales/ja/navigation.json `
  05_Development/frontend/src/i18n/locales/ja/operations.json `
  05_Development/frontend/src/i18n/locales/ja/retreat.json `
  05_Development/frontend/src/i18n/locales/vi/auth.json `
  05_Development/frontend/src/i18n/locales/vi/common.json `
  05_Development/frontend/src/i18n/locales/vi/customer.json `
  05_Development/frontend/src/i18n/locales/vi/navigation.json `
  05_Development/frontend/src/i18n/locales/vi/operations.json `
  05_Development/frontend/src/i18n/locales/vi/retreat.json `
  05_Development/frontend/src/i18n/locales/zh-CN/auth.json `
  05_Development/frontend/src/i18n/locales/zh-CN/common.json `
  05_Development/frontend/src/i18n/locales/zh-CN/customer.json `
  05_Development/frontend/src/i18n/locales/zh-CN/navigation.json `
  05_Development/frontend/src/i18n/locales/zh-CN/operations.json `
  05_Development/frontend/src/i18n/locales/zh-CN/retreat.json `
  05_Development/frontend/src/pages/customer/BookingDetailPage.tsx `
  05_Development/frontend/src/pages/customer/CustomerDashboardPage.tsx `
  05_Development/frontend/src/pages/customer/MyBookingsPage.tsx `
  05_Development/frontend/src/pages/customer/RetreatBookingPage.tsx `
  05_Development/frontend/src/pages/retreats/RetreatDetailPage.tsx `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/controller/TherapistController.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/dto/response/TherapistRosterDto.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/DefaultCustomerStayAdapter.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/TherapistTreatmentQualificationRepository.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaSessionService.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/TherapistStatusService.java `
  05_Development/frontend/public/assets/spa/fallback.jpg `
  05_Development/frontend/public/assets/spa/spa-body-01-coffee-coconut-polish.jpg `
  05_Development/frontend/public/assets/spa/spa-body-02-warm-mineral-wrap.jpg `
  05_Development/frontend/public/assets/spa/spa-face-01-jade-guasha-facelift.jpg `
  05_Development/frontend/public/assets/spa/spa-face-02-deep-hydration-repair.jpg `
  05_Development/frontend/public/assets/spa/spa-face-03-marine-collagen.jpg `
  05_Development/frontend/public/assets/spa/spa-heal-01-tibetan-sound-bath.jpg `
  05_Development/frontend/public/assets/spa/spa-heal-02-ayurvedic-shirodhara.jpg `
  05_Development/frontend/public/assets/spa/spa-heal-03-chi-nei-tsang-abdominal.jpg `
  05_Development/frontend/public/assets/spa/spa-hydro-01-vichy-rain-therapy.jpg `
  05_Development/frontend/public/assets/spa/spa-hydro-02-red-dao-herbal-bath.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-01-himalayan-hot-stone.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-02-deep-tissue.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-03-lymphatic-drainage.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-04-vietnamese-acupressure.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-05-herbal-compress.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-06-prenatal-massage.jpg `
  05_Development/frontend/public/assets/spa/spa-yoga-01-spine-therapy-yoga.jpg `
  05_Development/frontend/public/assets/spa/spa-yoga-02-pranayama-meditation.jpg `
  05_Development/frontend/src/context/SpaContext.tsx `
  05_Development/frontend/src/data/mockSpa.ts `
  05_Development/frontend/src/data/mockSpaInventory.ts `
  05_Development/frontend/src/pages/customer/SpaBookingPage.tsx `
  05_Development/frontend/src/pages/customer/SpaConfirmationPage.tsx `
  05_Development/frontend/src/pages/customer/SpaTreatmentListPage.tsx `
  05_Development/frontend/src/pages/manager/SpaManagementPage.tsx `
  05_Development/frontend/src/pages/therapist/TherapistDashboardPage.tsx `
  05_Development/frontend/src/pages/therapist/TherapistSchedulePage.tsx `
  05_Development/frontend/src/pages/therapist/TherapistSessionDetailPage.tsx `
  05_Development/frontend/src/styles/spa.css `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/controller/FnbDashboardController.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/service/FnbKdsOrderServiceImpl.java `
  05_Development/backend/src/main/resources/application-dev.yml `
  05_Development/backend/src/main/resources/application-sqlserver.yml `
  05_Development/backend/src/main/resources/application.yml `
  05_Development/database/schema.sql `
  05_Development/frontend/src/context/DiningContext.tsx `
  05_Development/frontend/src/data/mockDining.ts `
  05_Development/frontend/src/features/m4-fnb/api/fnbApi.ts `
  05_Development/frontend/src/features/m4-fnb/types/fnbDto.ts `
  05_Development/frontend/src/pages/customer/DietaryMenuPage.tsx `
  05_Development/frontend/src/pages/fb/FnbDashboardPage.tsx `
  05_Development/backend/run-dev.ps1 `
  05_Development/backend/run-local.ps1 `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/HswrmsDatabaseBootstrapIntegrationTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/service/AuthServiceTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaBookingLifecycleHardeningTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaScheduleVersionLifecycleTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaSecurityTests.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaServiceTests.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaTestConfig.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaTimelineCheckpointTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistHealthProjectionConsentTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistRecoveryOrchestrationTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistRosterServiceTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m4fnb/service/FnbCrossModuleWorkflowIntegrationTest.java `
  05_Development/database/seed/V1_8__seed_dedicated_test_therapist_fixture.sql `
  run-dev.ps1 `
  stop-dev.ps1

# Pre-commit Gate 1: Assert exactly 11 files staged
git commit -m "feat(auth): unify authentication and role-based layouts"
# Post-commit Check 1: Record hash & verify membership

# ------------------------------------------------------------------------------
# STEP 2: Commit 2 (42 files)
# ------------------------------------------------------------------------------
git add -- `
  05_Development/frontend/src/api/client/apiClient.ts `
  05_Development/frontend/src/components/common/DevHealthIndicator.tsx `
  05_Development/frontend/src/components/navigation/Footer.tsx `
  05_Development/frontend/src/components/retreat/RetreatCard.tsx `
  05_Development/frontend/src/context/CustomerContext.tsx `
  05_Development/frontend/src/i18n/dynamicContent.ts `
  05_Development/frontend/src/i18n/index.ts `
  05_Development/frontend/src/i18n/locales/en/auth.json `
  05_Development/frontend/src/i18n/locales/en/common.json `
  05_Development/frontend/src/i18n/locales/en/customer.json `
  05_Development/frontend/src/i18n/locales/en/navigation.json `
  05_Development/frontend/src/i18n/locales/en/operations.json `
  05_Development/frontend/src/i18n/locales/en/retreat.json `
  05_Development/frontend/src/i18n/locales/fr/auth.json `
  05_Development/frontend/src/i18n/locales/fr/common.json `
  05_Development/frontend/src/i18n/locales/fr/customer.json `
  05_Development/frontend/src/i18n/locales/fr/navigation.json `
  05_Development/frontend/src/i18n/locales/fr/operations.json `
  05_Development/frontend/src/i18n/locales/fr/retreat.json `
  05_Development/frontend/src/i18n/locales/ja/auth.json `
  05_Development/frontend/src/i18n/locales/ja/common.json `
  05_Development/frontend/src/i18n/locales/ja/customer.json `
  05_Development/frontend/src/i18n/locales/ja/navigation.json `
  05_Development/frontend/src/i18n/locales/ja/operations.json `
  05_Development/frontend/src/i18n/locales/ja/retreat.json `
  05_Development/frontend/src/i18n/locales/vi/auth.json `
  05_Development/frontend/src/i18n/locales/vi/common.json `
  05_Development/frontend/src/i18n/locales/vi/customer.json `
  05_Development/frontend/src/i18n/locales/vi/navigation.json `
  05_Development/frontend/src/i18n/locales/vi/operations.json `
  05_Development/frontend/src/i18n/locales/vi/retreat.json `
  05_Development/frontend/src/i18n/locales/zh-CN/auth.json `
  05_Development/frontend/src/i18n/locales/zh-CN/common.json `
  05_Development/frontend/src/i18n/locales/zh-CN/customer.json `
  05_Development/frontend/src/i18n/locales/zh-CN/navigation.json `
  05_Development/frontend/src/i18n/locales/zh-CN/operations.json `
  05_Development/frontend/src/i18n/locales/zh-CN/retreat.json `
  05_Development/frontend/src/pages/customer/BookingDetailPage.tsx `
  05_Development/frontend/src/pages/customer/CustomerDashboardPage.tsx `
  05_Development/frontend/src/pages/customer/MyBookingsPage.tsx `
  05_Development/frontend/src/pages/customer/RetreatBookingPage.tsx `
  05_Development/frontend/src/pages/retreats/RetreatDetailPage.tsx

# Pre-commit Gate 2: Assert exactly 42 files staged
git commit -m "feat(i18n): add global multilingual support"
# Post-commit Check 2: Record hash & verify membership

# ------------------------------------------------------------------------------
# STEP 3: Commit 3 (37 files)
# ------------------------------------------------------------------------------
git add -- `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/controller/TherapistController.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/dto/response/TherapistRosterDto.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/DefaultCustomerStayAdapter.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/TherapistTreatmentQualificationRepository.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaSessionService.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/TherapistStatusService.java `
  05_Development/frontend/public/assets/spa/fallback.jpg `
  05_Development/frontend/public/assets/spa/spa-body-01-coffee-coconut-polish.jpg `
  05_Development/frontend/public/assets/spa/spa-body-02-warm-mineral-wrap.jpg `
  05_Development/frontend/public/assets/spa/spa-face-01-jade-guasha-facelift.jpg `
  05_Development/frontend/public/assets/spa/spa-face-02-deep-hydration-repair.jpg `
  05_Development/frontend/public/assets/spa/spa-face-03-marine-collagen.jpg `
  05_Development/frontend/public/assets/spa/spa-heal-01-tibetan-sound-bath.jpg `
  05_Development/frontend/public/assets/spa/spa-heal-02-ayurvedic-shirodhara.jpg `
  05_Development/frontend/public/assets/spa/spa-heal-03-chi-nei-tsang-abdominal.jpg `
  05_Development/frontend/public/assets/spa/spa-hydro-01-vichy-rain-therapy.jpg `
  05_Development/frontend/public/assets/spa/spa-hydro-02-red-dao-herbal-bath.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-01-himalayan-hot-stone.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-02-deep-tissue.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-03-lymphatic-drainage.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-04-vietnamese-acupressure.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-05-herbal-compress.jpg `
  05_Development/frontend/public/assets/spa/spa-mass-06-prenatal-massage.jpg `
  05_Development/frontend/public/assets/spa/spa-yoga-01-spine-therapy-yoga.jpg `
  05_Development/frontend/public/assets/spa/spa-yoga-02-pranayama-meditation.jpg `
  05_Development/frontend/src/context/SpaContext.tsx `
  05_Development/frontend/src/data/mockSpa.ts `
  05_Development/frontend/src/data/mockSpaInventory.ts `
  05_Development/frontend/src/pages/customer/SpaBookingPage.tsx `
  05_Development/frontend/src/pages/customer/SpaConfirmationPage.tsx `
  05_Development/frontend/src/pages/customer/SpaTreatmentListPage.tsx `
  05_Development/frontend/src/pages/manager/SpaManagementPage.tsx `
  05_Development/frontend/src/pages/therapist/TherapistDashboardPage.tsx `
  05_Development/frontend/src/pages/therapist/TherapistSchedulePage.tsx `
  05_Development/frontend/src/pages/therapist/TherapistSessionDetailPage.tsx `
  05_Development/frontend/src/styles/spa.css

# Pre-commit Gate 3: Assert exactly 37 files staged
git commit -m "feat(spa): complete spa catalog and therapist workflow"
# Post-commit Check 3: Record hash & verify membership

# ------------------------------------------------------------------------------
# STEP 4: Commit 4 (12 files)
# ------------------------------------------------------------------------------
git add -- `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/controller/FnbDashboardController.java `
  05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/service/FnbKdsOrderServiceImpl.java `
  05_Development/backend/src/main/resources/application-dev.yml `
  05_Development/backend/src/main/resources/application-sqlserver.yml `
  05_Development/backend/src/main/resources/application.yml `
  05_Development/database/schema.sql `
  05_Development/frontend/src/context/DiningContext.tsx `
  05_Development/frontend/src/data/mockDining.ts `
  05_Development/frontend/src/features/m4-fnb/api/fnbApi.ts `
  05_Development/frontend/src/features/m4-fnb/types/fnbDto.ts `
  05_Development/frontend/src/pages/customer/DietaryMenuPage.tsx `
  05_Development/frontend/src/pages/fb/FnbDashboardPage.tsx

# Pre-commit Gate 4: Assert exactly 12 files staged
git commit -m "feat(fnb): integrate dining workflow with folio"
# Post-commit Check 4: Record hash & verify membership

# ------------------------------------------------------------------------------
# STEP 5: Commit 5 (17 files)
# ------------------------------------------------------------------------------
git add -- `
  05_Development/backend/run-dev.ps1 `
  05_Development/backend/run-local.ps1 `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/HswrmsDatabaseBootstrapIntegrationTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/service/AuthServiceTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaBookingLifecycleHardeningTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaScheduleVersionLifecycleTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaSecurityTests.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaServiceTests.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaTestConfig.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaTimelineCheckpointTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistHealthProjectionConsentTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistRecoveryOrchestrationTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistRosterServiceTest.java `
  05_Development/backend/src/test/java/com/heavenstay/hswrms/m4fnb/service/FnbCrossModuleWorkflowIntegrationTest.java `
  05_Development/database/seed/V1_8__seed_dedicated_test_therapist_fixture.sql `
  run-dev.ps1 `
  stop-dev.ps1

# Pre-commit Gate 5: Assert exactly 17 files staged
git commit -m "test(integration): add M1-M6 integration coverage"
# Post-commit Check 5: Record hash & verify membership
# Verify tracked modified working tree is 100% clean (0 files)

# ------------------------------------------------------------------------------
# STEP 6: Commit 6 (Curated Documentation, Diagrams & Visual Evidence)
# ------------------------------------------------------------------------------
git add -- `
  02_Requirement/Other `
  02_Requirement/SDS `
  03_Design/Diagrams `
  03_Design/Others `
  07_Document_References `
  06_Reports/HSWRMS_CENTRALIZED_MULTILINGUAL_ARCHITECTURE_SPEC.md `
  06_Reports/FINAL_PRE_COMMIT_REVIEW.md `
  06_Reports/FINAL_DATABASE_PROFILE_HARDENING.md `
  06_Reports/FINAL_DATABASE_PROFILE_SAFETY_REVIEW.md `
  06_Reports/FINAL_COMMIT_PARTITION_AND_UNTRACKED_ASSET_REVIEW.md `
  06_Reports/audit-output/M3_REQUIREMENTS_TRACEABILITY.md `
  06_Reports/audit-output/M3_E2E_ACCEPTANCE_MATRIX.md `
  06_Reports/audit-output/M3_SEED_DATA_AUDIT.md `
  06_Reports/audit-output/APP_02_4_FINAL_EVIDENCE_CLOSURE.md `
  06_Reports/audit-output/M3_4_1_SECURITY_CORRECTION_AND_INTEGRATION_VERIFICATION.md `
  06_Reports/visual-evidence/global-ui-acceptance `
  06_Reports/visual-evidence/spa-catalog-final-acceptance `
  06_Reports/visual-evidence/multilingual-dynamic-content

# Pre-commit Gate 6: Assert curated paths staged
git commit -m "docs(project): preserve finalized requirements, designs, and audit evidence"
# Post-commit Check 6: Record hash & verify membership
```

---

## 7. Remaining Risks & Mitigations

| Potential Risk | Severity | Built-In Mitigation |
| :--- | :---: | :--- |
| **Accidental working tree loss** | NONE | Procedure uses only `git restore --staged` and `git add`, which never modify file content on disk. |
| **Index corruption / mismatch** | NONE | Physical bit-for-bit backup `.git/index_backup_119_staged` allows verification and pre-commit isolation. |
| **Premature / partial commit recovery error** | NONE | Hardened recovery policy strictly prohibits `git reset --soft` and forbids restoring old index once any commit has been created. |
| **Wrong file committed in wrong group** | LOW | Explicit file lists used in every `git add` / `git restore` command; zero wildcards or `git add .`. |
| **Credential leak in Commit 6** | NONE | Exhaustive AST/regex scanner verified 0 secrets in all documentation and reports. |

---

## 8. Final Status & Waiting for Authorization

- **Current Git Index:** Exactly **119 files staged** across Groups 1–5.
- **Tracked Modifications:** **0 unstaged files**.
- **Stashes Intact:** All 4 stashes preserved.
- **Safety Status:** **STRICT READ-ONLY PRESERVED.** No commits, unstaging, or resets have been executed.

**Ready for execution upon your explicit command.**
