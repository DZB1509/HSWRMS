# PHASE 5.8.3.106 — BUSINESS CATALOG DATA READINESS & ROUTE CONSISTENCY AUDIT

**Phase:** 5.8.3.106  
**Module:** HSWRMS Business Catalogs, API Contract Consistency & Database Readiness  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Date:** 2026-10-28 23:30:00 +07:00  
**Status:** COMPLETED — 100% AUDITED (Strictly Read-Only, Zero Data Mutations, Zero Code Edits)  
**Target Database:** `HSWRMS_TEST` (Database ID: `45`, Status: `ONLINE`, Host: `localhost:1433`)  
**Protected Database:** `HSWRMS` (Isolated, `HAS_DBACCESS = 0`)  
**Audited Principal:** `hswrms_test_user` (Roles: `public`, `db_datareader`)  

---

## 1. Executive Summary

During the Phase 5.8.3.105 controlled read-only API testing suite, two notable behaviors were observed:
1. Public operational catalog endpoints (`/api/v1/retreat-packages`, `/api/v1/retreat-packages/villa-categories`, `/api/v1/spa/treatments`, and `/api/v1/fnb/customer/menu-items`) returned HTTP `200 OK` with empty data payloads (`data: []`).
2. The endpoint `GET /api/v1/packages` returned HTTP `500 INTERNAL_SERVER_ERROR` with a `NoResourceFoundException`.

Phase 5.8.3.106 conducted an exhaustive, read-only architectural investigation to reconcile frontend and backend route contracts, inspect catalog schema dependencies in `HSWRMS_TEST`, and evaluate existing seed sources across the repository.

### Summary of Audit Discoveries:
1. **Route Contract Reconciliation:**
   - The authoritative backend route for retreat packages is `/api/v1/retreat-packages`, implemented in `RetreatPackageController.java`.
   - The route `/api/v1/packages` was an early architectural draft namespace documented in `05_Development/docs/API_CONTRACT.md` and permitted in `SecurityConfig.java`, but no controller handler was ever mapped to it.
   - The frontend API client (`retreatBookingApi.ts`) strictly calls `/retreat-packages`. Zero frontend components call `/packages`.
2. **HTTP 500 Root Cause:**
   - In Spring Boot 3.3.4 (Spring MVC 6.1+), unmapped routes throw `org.springframework.web.servlet.resource.NoResourceFoundException`.
   - Because `GlobalExceptionHandler.java` lacks an explicit `@ExceptionHandler(NoResourceFoundException.class)` handler, unmapped routes fall through to the catch-all `@ExceptionHandler(Exception.class)`, converting what should be an HTTP `404 Not Found` into an HTTP `500 Internal Server Error`.
3. **Catalog Data Readiness:**
   - All 9 business catalog tables currently hold **0 rows** in `HSWRMS_TEST`: `RetreatPackage` (0), `VillaCategory` (0), `PhysicalVilla` (0), `RetreatPackageVillaCategory` (0), `RetreatPackageSpaTreatment` (0), `SpaTreatment` (0), `MenuItem` (0), `MenuItemIngredient` (0), `Ingredient` (0).
   - Foreign-key graph analysis confirms that returning realistic catalog responses requires cross-table referential integrity (e.g., `RetreatPackage` requires `RetreatPackageVillaCategory` and `VillaCategory` to provide non-empty eligible villa categories to customer booking screens).
4. **Authoritative Seed Sources & Gap Analysis:**
   - An approved SQL seed exists only for Spa Treatments: `05_Development/database/seed/m3_spa_seed.sql` (5 treatments, 5 rooms).
   - Authoritative domain definitions for packages, villa categories, and dining items exist in frontend TypeScript fixtures (`mockMasterData.ts`, `mockDining.ts`) and demo-runner code (`M5DataInitializer.java`), but no standalone, idempotent SQL seed workflow exists for `HSWRMS_TEST`.

---

## 2. Step 1 — Route Consistency Audit

### 2.1 Route Mapping Analysis: `/api/v1/retreat-packages` vs. `/api/v1/packages`

| Layer / Artifact | Configured Path | Status & Implementation Details |
|---|---|---|
| **Backend Controller** | `/api/v1/retreat-packages` | Implemented in [`RetreatPackageController.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/controller/RetreatPackageController.java). Exposes `GET /`, `GET /{id}`, `GET /villa-categories`, and `POST /calculate`. |
| **Backend Controller** | `/api/v1/packages` | **UNMAPPED**. No controller or `@RequestMapping` exists in the entire backend for this path. |
| **Security Configuration** | `/api/v1/packages/**` & `/api/v1/packages` | Configured as `permitAll()` in [`SecurityConfig.java#L120`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java#L120). |
| **Security Configuration** | `/api/v1/retreat-packages/**` & `/api/v1/retreat-packages` | Configured as `permitAll()` in [`SecurityConfig.java#L121`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java#L121). |
| **API Contract Doc** | `/api/v1/packages/**` | Listed in [`05_Development/docs/API_CONTRACT.md#L82`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/docs/API_CONTRACT.md#L82) under "Reserved Module Route Namespaces" (Commit `4b44f3d`). |
| **Frontend API Client** | `/retreat-packages` | Implemented in [`frontend/src/api/booking/retreatBookingApi.ts#L158`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/api/booking/retreatBookingApi.ts#L158). Uses `apiClient` with base URL `/api/v1`. |

### 2.2 Frontend Reference Audit
A full codebase scan across `05_Development/frontend/src` for references to `packages` revealed:
- `retreatBookingApi.ts`: Calls `/retreat-packages`, `/retreat-packages/{packageId}`, `/retreat-packages/villa-categories`, `/retreat-packages/calculate`.
- `RetreatListPage.tsx`, `RetreatBookingPage.tsx`, `RetreatDetailPage.tsx`: Use `retreatBookingApi` or local mock data (`MOCK_RETREAT_PACKAGES`).
- **Zero frontend files call `/api/v1/packages` or `'/packages'`.**
- **Conclusion:** There is **no frontend/backend runtime contract mismatch**. The frontend already targets the authoritative route `/api/v1/retreat-packages`.

### 2.3 Mechanism of the HTTP 500 Response
In Spring Boot 3.3.4 (Spring MVC 6.1+):
1. An HTTP request for `GET /api/v1/packages` bypasses authentication because `SecurityConfig` marks `/api/v1/packages/**` as `permitAll()`.
2. `DispatcherServlet` queries `RequestMappingHandlerMapping`, which returns no handler since no controller is mapped to `/api/v1/packages`.
3. `DispatcherServlet` falls back to `ResourceHttpRequestHandler` to check for static web resources.
4. Because no static file exists at `api/v1/packages`, `ResourceHttpRequestHandler` throws `org.springframework.web.servlet.resource.NoResourceFoundException: No static resource api/v1/packages.`.
5. [`GlobalExceptionHandler.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/common/exception/GlobalExceptionHandler.java) handles specific exceptions (`ResourceNotFoundException`, `BusinessRuleException`, `ConflictException`, etc.), but does **not** have a handler for `NoResourceFoundException`.
6. As a result, the exception falls into the catch-all `@ExceptionHandler(Exception.class)` (lines 124–134):
   ```java
   @ExceptionHandler(Exception.class)
   public ResponseEntity<ApiError> handleGenericException(Exception ex, HttpServletRequest request) {
       log.error("Unhandled internal server error on [{}]: {}", request.getRequestURI(), ex.getMessage(), ex);
       ApiError error = new ApiError(
               HttpStatus.INTERNAL_SERVER_ERROR.value(),
               "INTERNAL_SERVER_ERROR",
               "An unexpected server error occurred...",
               request.getRequestURI()
       );
       return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
   }
   ```
7. Consequently, any unmapped URL that matches `permitAll()` or carries valid credentials emits an HTTP `500 INTERNAL_SERVER_ERROR` instead of an HTTP `404 NOT_FOUND`.

### 2.4 Smallest Safe Corrections (Evaluated for a Future Phase)

| Option | Approach | Safety & Contract Impact | Recommendation |
|---|---|---|---|
| **Option A (Controller Dual-Mapping)** | In `RetreatPackageController.java`, change annotation to `@RequestMapping({"/api/v1/retreat-packages", "/api/v1/packages"})`. | **Safe & Zero Risk**: Makes `/api/v1/packages` an active alias for the retreat package catalog, fulfilling both legacy documentation and current implementations. | **Recommended for M2** |
| **Option B (Global 404 Handler)** | In `GlobalExceptionHandler.java`, add `@ExceptionHandler(NoResourceFoundException.class)` returning `HttpStatus.NOT_FOUND` with code `"RESOURCE_NOT_FOUND"`. | **Safe & Best Practice**: Fixes the fundamental framework issue so all unmapped routes across all modules emit clean 404s rather than 500s. | **Strongly Recommended** |
| **Option C (Prune Dead Matcher)** | Remove `/api/v1/packages` from `SecurityConfig.java` line 120 and update `API_CONTRACT.md`. | **Low Risk**: Cleans up dead configuration; callers to `/packages` will get 401/403 or 404. | Optional Cleanup |

---

## 3. Step 2 — Catalog Data Readiness Audit

### 3.1 Live Catalog Table Inventory & Row Counts
Queried directly from `HSWRMS_TEST` using `hswrms_test_user`:

| Table Name | Entity Class | Row Count | Primary Key | Status Column & Constraints |
|---|---|---|---|---|
| `dbo.[RetreatPackage]` | `RetreatPackage` | **0** | `retreat_package_id` (IDENTITY) | `package_status` (`CHECK IN ('ACTIVE','INACTIVE')`) |
| `dbo.[VillaCategory]` | `VillaCategory` | **0** | `villa_category_id` (IDENTITY) | `category_status` (`CHECK IN ('ACTIVE','INACTIVE')`) |
| `dbo.[PhysicalVilla]` | `PhysicalVilla` | **0** | `villa_id` (IDENTITY) | `villa_status` (`CHECK IN ('AVAILABLE','OCCUPIED','MAINTENANCE','NEEDS_CLEANING','INACTIVE')`) |
| `dbo.[RetreatPackageVillaCategory]` | Junction (`@ManyToMany`) | **0** | `(retreat_package_id, villa_category_id)` | N/A |
| `dbo.[RetreatPackageSpaTreatment]` | Junction | **0** | `(retreat_package_id, treatment_id)` | `entitlement_status` (Default: `'INCLUDED'`) |
| `dbo.[SpaTreatment]` | `SpaTreatment` | **0** | `treatment_id` (IDENTITY) | `treatment_status` (`CHECK IN ('ACTIVE','INACTIVE')`) |
| `dbo.[MenuItem]` | `MenuItemEntity` | **0** | `menu_item_id` (IDENTITY) | `availability_status` (`CHECK IN ('AVAILABLE','UNAVAILABLE')`) |
| `dbo.[MenuItemIngredient]` | Junction | **0** | `(menu_item_id, ingredient_id)` | `required_quantity` (`CHECK > 0`) |
| `dbo.[Ingredient]` | `Ingredient` | **0** | `ingredient_id` (IDENTITY) | N/A |

### 3.2 Foreign-Key Dependency Graph
The live SQL Server metadata (`sys.foreign_keys`) establishes the following referential hierarchy:

```
[VillaCategory] <-------------------+
       ^                            |
       | (FK_PhysicalVilla_Category)| (FK_RPVC_VillaCategory)
       |                            |
[PhysicalVilla]           [RetreatPackageVillaCategory]
                                    |
                                    | (FK_RPVC_RetreatPackage)
                                    v
                             [RetreatPackage] <------+
                                    |                |
                                    | (FK_RPST_RP)   | (FK_RetreatBooking_Package)
                                    v                v
                       [RetreatPackageSpaTreatment] [RetreatBooking]
                                    |
                                    | (FK_RPST_SpaTreatment)
                                    v
                             [SpaTreatment]
                                    ^
                                    | (FK_SpaSession_Treatment)
                               [SpaSession]

[Ingredient] <----------------------+
       ^                            |
       | (FK_IngredientBatch)       | (FK_MenuItemIngredient_Ingredient)
       |                            |
[IngredientBatch]          [MenuItemIngredient]
                                    |
                                    | (FK_MenuItemIngredient_MenuItem)
                                    v
                               [MenuItem] <---------- [MealOrderItem]
```

### 3.3 Minimum Data Requirements per Catalog Endpoint

#### 1. `GET /api/v1/retreat-packages`
- **Service Query:** `RetreatPackageRepository.findByPackageStatus("ACTIVE")`.
- **Entity Hydration:** `RetreatPackage` contains `@ManyToMany private Set<VillaCategory> eligibleVillaCategories` joined through `dbo.RetreatPackageVillaCategory`.
- **Dependency Requirement:**
  - Inserting only into `dbo.RetreatPackage` allows the endpoint to return packages, but `eligibleVillaCategories` will be empty `[]`.
  - For full contract compatibility with booking calculation (`/api/v1/retreat-packages/calculate`) and customer booking pages:
    - Minimum 1 row in `dbo.VillaCategory` (`category_status = 'ACTIVE'`).
    - Minimum 1 row in `dbo.RetreatPackage` (`package_status = 'ACTIVE'`).
    - Minimum 1 row in `dbo.RetreatPackageVillaCategory` linking both IDs.

#### 2. `GET /api/v1/retreat-packages/villa-categories`
- **Service Query:** `VillaCategoryRepository.findByCategoryStatus("ACTIVE")`.
- **Dependency Requirement:**
  - Standalone entity: Requires only 1 row in `dbo.VillaCategory` with `category_status = 'ACTIVE'`.
  - However, for operational booking availability (`VillaAvailabilityService`), at least 1 `dbo.PhysicalVilla` referencing that category with `villa_status = 'AVAILABLE'` is required.

#### 3. `GET /api/v1/spa/treatments`
- **Service Query:** `SpaTreatmentRepository.findByTreatmentStatus(TreatmentStatus.ACTIVE)`.
- **Dependency Requirement:**
  - Standalone entity: Requires only rows in `dbo.SpaTreatment` with `treatment_status = 'ACTIVE'`.
  - For package entitlement evaluation (`customerStayPort.isTreatmentIncludedInPackage`), `dbo.RetreatPackageSpaTreatment` must link `retreat_package_id` to `treatment_id`.

#### 4. `GET /api/v1/fnb/customer/menu-items`
- **Service Query:** `MenuItemRepository.findAllAvailable()` (`WHERE availability_status = 'AVAILABLE'`).
- **Dependency Requirement:**
  - Standalone entity: Requires only rows in `dbo.MenuItem` with `availability_status = 'AVAILABLE'`.
  - `MenuItemIngredient` and `Ingredient` are optional for browsing, but required for recipe explosion and dietary allergen checking.

---

## 4. Step 3 — Seed Source Review & Evaluation

### 4.1 Inventory of Available Seed Assets

| Source Asset | Location | Catalog Coverage | Format / Technology | Production / Demo Ready? |
|---|---|---|---|---|
| `m3_spa_seed.sql` | `05_Development/database/seed/m3_spa_seed.sql` | **Module 3:** 5 Spa Treatments, 5 Treatment Rooms | Idempotent SQL (`IF NOT EXISTS`) | **YES** — Approved development seed script. |
| `mockMasterData.ts` | `05_Development/frontend/src/data/mockMasterData.ts` | **Module 2 & 3:** 4 Packages (`RET-DETOX-01`, `RET-YOGA-02`, `RET-SLEEP-03`, `RET-AYUR-04`), 3 Villa Categories (`CAT-GARDEN`, `CAT-OCEAN`, `CAT-HILLSIDE`), 4 Spa Services | TypeScript Fixtures | **Domain Authoritative** — Represents core business definitions. |
| `mockDining.ts` | `05_Development/frontend/src/data/mockDining.ts` | **Module 4:** 12+ Menu Items with dietary tags, allergens, meal periods, prices | TypeScript Fixtures | **Domain Authoritative** — Represents full culinary catalog. |
| `M5DataInitializer.java` | `05_Development/backend/.../m5billing/config/` | **Full Stay:** Seeds 1 category, 1 package, 4 villas, 1 treatment, users, booking HSW-88192, folio | Spring Boot `CommandLineRunner` | **Dev/Demo Only** — Requires `app.seed.demo-data: true`; disabled in `sqlserver-test`. |
| `DevAccountBootstrap.java`| `05_Development/backend/.../config/` | **Module 1:** 6 canonical roles, 6 demo user accounts | Spring Boot `ApplicationRunner` | **Dev Only** — Gated by `@Profile("dev")`. |

### 4.2 Seed Workflow Assessment
- **Finding:** A unified, supported seed workflow for business catalog master data in the dedicated test environment (`HSWRMS_TEST`) does **NOT** currently exist.
- `m3_spa_seed.sql` is ready and verified, but has not yet been applied to `HSWRMS_TEST`.
- There is no existing SQL seed file for `RetreatPackage`, `VillaCategory`, `PhysicalVilla`, or `MenuItem`.
- Application-level initializers (`M5DataInitializer`, `DevAccountBootstrap`) cannot run under `sqlserver-test` because:
  1. The test login `hswrms_test_user` holds `db_datareader` only and will fail with SQL Server Error 229 (SELECT permission only).
  2. Test invariants strictly prohibit uncontrolled runtime seeding during application startup.

### 4.3 Proposed Smallest Controlled Seed Plan (For Future Authorization)

To allow public catalog endpoints and subsequent integration tests to return realistic, non-empty data without inventing fictional content, the following controlled seed plan is proposed for a future separately authorized phase:

#### Phase A: Module 2 Retreat Packages & Villa Inventory Seed
- **Source:** Extracted directly from `mockMasterData.ts`:
  - **3 Villa Categories:**
    - `CAT-GARDEN`: "Garden Sanctuary Pool Villa", maxOccupancy = 2, hasPrivatePool = 1, inventoryCount = 8, priceModifier = 0.00, status = 'ACTIVE'
    - `CAT-OCEAN`: "Oceanfront Sunset Wellness Villa", maxOccupancy = 2, hasPrivatePool = 1, inventoryCount = 6, priceModifier = 2,300,000.00, status = 'ACTIVE'
    - `CAT-HILLSIDE`: "Hillside Panoramic Yoga Pavilion", maxOccupancy = 4, hasPrivatePool = 1, inventoryCount = 4, priceModifier = 4,700,000.00, status = 'ACTIVE'
  - **4 Retreat Packages:**
    - `RET-DETOX-01`: "Holistic Detox & Cleansing Journey", 4 nights, 24,500,000 VND, status = 'ACTIVE'
    - `RET-YOGA-02`: "Mindfulness, Prana & Yoga Immersion", 6 nights, 32,000,000 VND, status = 'ACTIVE'
    - `RET-SLEEP-03`: "Deep Sleep & Circadian Restoration", 3 nights, 19,500,000 VND, status = 'ACTIVE'
    - `RET-AYUR-04`: "Ayurvedic Rejuvenation & Vitality", 5 nights, 28,000,000 VND, status = 'ACTIVE'
  - **Junction Links:** Mappings in `dbo.RetreatPackageVillaCategory` linking each package to its eligible villa categories.
  - **Baseline Physical Villas:** 3 physical villas (1 per category: Villa 101, Villa 201, Villa 301) with `villa_status = 'AVAILABLE'`.

#### Phase B: Module 3 Spa Treatments & Rooms Seed
- **Source:** Authoritative script `05_Development/database/seed/m3_spa_seed.sql`:
  - **5 Spa Treatments:** Herbal Poultice Therapy, Lotus Radiance Facial, Mineral Hydrotherapy Soak, Mindful Pranyama & Meditation, Deep Tissue Bamboo Massage.
  - **5 Treatment Rooms:** Lotus Pavilion Suite 1/2, Bamboo Sanctuary Suite A, Hydro-Thermal Suite, Meditation Garden Pavilion.
  - **Package Inclusion Links:** Mappings in `dbo.RetreatPackageSpaTreatment` assigning included treatments to the 4 packages.

#### Phase C: Module 4 F&B Dietary Menu Items Seed
- **Source:** Authoritative definitions from `mockDining.ts`:
  - **4 Canonical Menu Items:**
    - `MENU-001`: "Cháo Yến Mạch Quả Mọng Hữu Cơ" (Breakfast, vegetarian/dairy-free, AVAILABLE)
    - `MENU-002`: "Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ" (Breakfast, eggs/lacto-ovo, AVAILABLE)
    - `MENU-003`: "Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng" (Lunch, vegan/gluten-free, AVAILABLE)
    - `MENU-004`: "Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây" (Dinner, pescatarian/keto, AVAILABLE)

---

## 5. Changed Files & Git Status

### 5.1 Changed Files Summary
- **Modified Production Files (`src/main`):** **NONE** (0 files modified)
- **Modified Test Files (`src/test`):** **NONE** (0 files modified)
- **Staged / Committed Files:** **NONE** (0 files staged, 0 commits made)

### 5.2 Working Tree Git Status
```
On branch feature/hswrms-m1-m6-integration
Your branch is ahead of 'isp-origin/feature/hswrms-m1-m6-integration' by 5 commits.
  (use "git push" to publish your local commits)

Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
	modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SchedulingConfig.java
	modified:   05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java
	modified:   05_Development/backend/src/test/resources/application-sqlserver-test.yml
	modified:   05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerSpringBootContextTest.java
	05_Development/database/generated/
	05_Development/database/migrations/V003__m2_retreat_booking_schema_reconciliation.sql
	05_Development/database/migrations/V004__m5_customer_review_category_ratings.sql
	05_Development/database/migrations/V005__m6_audit_log.sql
	05_Development/database/migrations/draft_m6_governance_and_delegation.sql
	05_Development/database/reports/
	05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
	05_Development/database/scripts/set_hswrms_test_credential.ps1
    ... (historical report inventory)

no changes added to commit (use "git add" and/or "git commit -a")
```

---

## 6. Audit Conclusion & Recommendations

1. **Route Mismatch:** `/api/v1/packages` is an unmapped legacy alias. The active, authoritative route is `/api/v1/retreat-packages`. In a future phase, adding `@ExceptionHandler(NoResourceFoundException.class)` to `GlobalExceptionHandler.java` will ensure all unmapped endpoints return HTTP `404` rather than HTTP `500`.
2. **Catalog Empty Responses:** The empty responses are mathematically expected because all catalog tables in `HSWRMS_TEST` have exactly 0 rows.
3. **Seed Readiness:** To achieve non-empty catalog API responses, a controlled, idempotent seed script using the authoritative domain definitions (`mockMasterData.ts`, `m3_spa_seed.sql`, and `mockDining.ts`) should be authored and executed under administrative authorization in a subsequent phase.

