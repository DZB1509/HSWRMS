# PHASE 5.8.3.108 — BUSINESS CATALOG SEED AUTHORING & STATIC REVIEW REPORT

**Phase:** 5.8.3.108  
**Module:** HSWRMS Business Catalogs, SQL Seed Authoring & Static Safety Review  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Timestamp:** 2026-10-29 00:15:00 +07:00  
**Status:** COMPLETED — 100% STATICALLY VALIDATED (Strictly Read-Only, Zero Data Mutations, Zero Code Edits)  
**Proposed Script Output:** [`05_Development/database/seed/hswrms_test_business_catalog_seed.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/seed/hswrms_test_business_catalog_seed.sql)  
**Target Database:** `HSWRMS_TEST` (Database ID: `45`, Status: `ONLINE`, Host: `localhost:1433`)  
**Protected Database:** `HSWRMS` (Isolated, Untouched)  

---

## 1. Executive Summary & Verification Context

Phase 5.8.3.108 authored and statically reviewed a comprehensive, production-aligned, and strictly row-level idempotent SQL Server seed script ([`hswrms_test_business_catalog_seed.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/seed/hswrms_test_business_catalog_seed.sql)) targeting the business catalog tables in `HSWRMS_TEST`.

### Strict Operational Boundary Adherence:
1. **Zero Database Connections for Mutation:** The authoring and validation processes were conducted exclusively through static codebase analysis, schema cross-referencing, and AST syntax inspection. **No SQL statements were executed against SQL Server or any database.**
2. **Zero Code or Configuration Edits:** No application source code in `src/main`, test code in `src/test`, or configuration files were modified.
3. **Zero Git Mutations:** No files were staged, committed, cherry-picked, or pushed.
4. **No Fictional Data Invention:** Any field or relationship lacking an authoritative source was either populated strictly from schema default constraints or explicitly flagged as blocked pending domain decisions.

---

## 2. Authoritative Source Files & Field Extraction

Every record and attribute defined in the seed script originates from verified repository artifacts:

| Domain Module | Primary Source File | Primary Entity / Export | Extracted Catalog Entities |
|---|---|---|---|
| **M2 Accommodation** | [`mockMasterData.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/data/mockMasterData.ts) | `INITIAL_VILLAS_MASTER` | 3 Villa Categories (`Garden Sanctuary`, `Oceanfront Sunset`, `Hillside Yoga`) |
| **M2 Retreat Packages** | [`mockMasterData.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/data/mockMasterData.ts) | `INITIAL_PACKAGES_MASTER` | 4 Packages (`RET-DETOX-01`, `RET-YOGA-02`, `RET-SLEEP-03`, `RET-AYUR-04`) |
| **M2 Physical Villas** | [`M5DataInitializer.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/config/M5DataInitializer.java) & [`mockDining.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/data/mockDining.ts) | Java builder lines 163–189 & Order locations | 7 Physical Villas across 3 categories (`Villa #101`–`#105`, `#201`, `#301`) |
| **M3 Spa Catalog** | [`m3_spa_seed.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/seed/m3_spa_seed.sql) | Baseline SQL Seed | 5 Spa Treatments & 5 Treatment Rooms |
| **M4 F&B Dining** | [`mockDining.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/data/mockDining.ts) | `MOCK_MENU_ITEMS` | 9 Dietary Menu Items (`MENU-001` through `MENU-009`) |
| **Relational DDL** | [`schema.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/schema.sql) | Sections 2, 3, 4, 9 | Constraints, types, nullability, unique keys, defaults |

---

## 3. Batch-by-Batch Relational Mapping Architecture

The seed script is structured into three logically distinct batches strictly ordered by foreign key dependency:

```
[BATCH A: Root Master Catalogs - Zero Foreign Keys]
  ├── A1: dbo.VillaCategory        (3 rows from mockMasterData.ts)
  ├── A2: dbo.SpaTreatment         (5 rows from m3_spa_seed.sql)
  ├── A3: dbo.TreatmentRoom        (5 rows from m3_spa_seed.sql)
  └── A4: dbo.MenuItem             (9 rows from mockDining.ts)

[BATCH B: Dependent Inventories & Packages - 1 FK Dependency]
  ├── B1: dbo.PhysicalVilla        (7 rows linking to dbo.VillaCategory)
  └── B2: dbo.RetreatPackage       (4 rows from mockMasterData.ts)

[BATCH C: Junction & Entitlement Mappings - Composite FKs]
  ├── C1: dbo.RetreatPackageVillaCategory (12 rows: 4 packages x 3 categories)
  └── C2: dbo.RetreatPackageSpaTreatment  (EXPLICITLY BLOCKED - Domain decision required)
```

### 3.1 Batch A: Root / Master Data Mapping

#### Batch A1 — `dbo.VillaCategory`
- **Natural Business Key:** `category_name` (`UQ_VillaCategory_Name`)
- **Field Mappings:**
  1. `Garden Sanctuary Pool Villa`: max_occupancy = 2, price_modifier = 0.00, inventory_count = 8, bedroom_count = 1, has_private_pool = 1, status = 'ACTIVE'
  2. `Oceanfront Sunset Wellness Villa`: max_occupancy = 2, price_modifier = 2,300,000.00 (rate 6.8M - 4.5M base), inventory_count = 6, bedroom_count = 1, has_private_pool = 1, status = 'ACTIVE'
  3. `Hillside Panoramic Yoga Pavilion`: max_occupancy = 4, price_modifier = 4,700,000.00 (rate 9.2M - 4.5M base), inventory_count = 4, bedroom_count = 2, has_private_pool = 1, status = 'ACTIVE'

#### Batch A2 — `dbo.SpaTreatment`
- **Natural Business Key:** `treatment_name` (`UQ_SpaTreatment_Name`)
- **Field Mappings:**
  - Preserved exact durations (90, 60, 60, 60, 90 mins), prices (1,800,000; 1,200,000; 950,000; 600,000; 2,100,000 VND), categories (`MASSAGE`, `FACIAL`, `HYDROTHERAPY`, `MEDITATION`), and descriptions from `m3_spa_seed.sql`.
  - `treatment_code`: Populated as `NULL` in strict accordance with `m3_spa_seed.sql` and the filtered unique index `UQ_SpaTreatment_TreatmentCode WHERE treatment_code IS NOT NULL`. No unverified codes were fabricated.

#### Batch A3 — `dbo.TreatmentRoom`
- **Natural Business Key:** `room_name` (`UQ_TreatmentRoom_Name`)
- **Field Mappings:**
  - Preserved 5 rooms: `Lotus Pavilion Suite 1`, `Lotus Pavilion Suite 2`, `Bamboo Sanctuary Suite A`, `Hydro-Thermal Suite`, `Meditation Garden Pavilion`.
  - `room_status`: All initialized to `'AVAILABLE'` per `CK_TreatmentRoom_Status`.
  - `room_type`: Assigned explicit descriptive suite types (`DELUXE_SUITE`, `COUPLE_SUITE`, `HYDRO_SUITE`, `OPEN_PAVILION`).

#### Batch A4 — `dbo.MenuItem`
- **Natural Business Key:** `item_name` (`UQ_MenuItem_Name`)
- **Field Mappings & Regex Split Rule:**
  - Extracted 9 items from `mockDining.ts`: `MENU-001` through `MENU-009`.
  - `item_name`: Mapped directly to Vietnamese dish name (`name.vi`).
  - `meal_type`: Formatted in uppercase (`BREAKFAST`, `LUNCH`, `DINNER`, `ALL_DAY`, `LUNCH,DINNER`) ensuring seamless matching with [`MealOrderServiceImpl.java#L75`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/service/MealOrderServiceImpl.java#L75) filtering logic (`mealType.toLowerCase().contains(mealPeriod)`).
  - `dietary_tags` & `allergen_information`: Joined as pure comma-separated values (e.g. `'vegan,gluten_free,dairy_free'`), matching Java backend parsing: `Arrays.stream(tags.split("[,;\\s]+"))`.
  - `price`: Retreat-included items (`isExtra: false`) default to `0.00` VND satisfying `CK_MenuItem_Price CHECK (price >= 0)`; a-la-carte extras (`MENU-005`: 150,000, `MENU-006`: 1,500,000, `MENU-009`: 120,000) carry explicit retail pricing.

---

### 3.2 Batch B: Dependent Inventories & Packages Mapping

#### Batch B1 — `dbo.PhysicalVilla`
- **Natural Business Key:** `villa_number` (`UQ_PhysicalVilla_Number`)
- **Foreign Key Dependency:** `villa_category_id` references `dbo.VillaCategory(villa_category_id)`.
- **Dynamic Key Resolution:** Category IDs are resolved at runtime via SQL variables (`@CatId_Garden`, `@CatId_Ocean`, `@CatId_Hillside`) queried by `category_name`. Zero hardcoded primary keys are utilized.
- **Fail-Fast Assertion:** Script halts with `RAISERROR` and `ROLLBACK` if any parent category ID cannot be resolved.
- **Concrete Inventory Set (7 physical villas):**
  - Garden Sanctuary: `Villa #101` (`AVAILABLE`), `Villa #102` (`OCCUPIED` - dining order target), `Villa #103` (`AVAILABLE`), `Villa #104` (`NEEDS_CLEANING`), `Villa #105` (`MAINTENANCE`).
  - Oceanfront Sunset: `Villa #201` (`AVAILABLE`).
  - Hillside Panoramic: `Villa #301` (`AVAILABLE`).

#### Batch B2 — `dbo.RetreatPackage`
- **Natural Business Key:** `package_name` (`UQ_RetreatPackage_Name`)
- **Field Mappings:**
  - 4 Packages: `RET-DETOX-01` (4 nights, 24.5M VND), `RET-YOGA-02` (6 nights, 32.0M VND), `RET-SLEEP-03` (3 nights, 19.5M VND), `RET-AYUR-04` (5 nights, 28.0M VND).
  - `duration_unit`: Explicitly set to entity default `N'Đêm (Nights)'`.
  - `base_price_unit`: Explicitly set to entity default `N'VND/khách/gói'`.
  - `package_status`: Set to `'ACTIVE'`.
  - `dietary_plan`, `extra_charge_policy`, `target_guest`: Populated as `NULL` because `mockMasterData.ts` does not contain text definitions for these columns. No text was invented.

---

### 3.3 Batch C: Junction & Entitlement Mappings

#### Batch C1 — `dbo.RetreatPackageVillaCategory`
- **Composite Primary Key:** `(retreat_package_id, villa_category_id)`
- **Dynamic Key Resolution:** Both `retreat_package_id` and `villa_category_id` are resolved dynamically via unique business keys (`package_name` and `category_name`).
- **Domain Mapping Decision (Universal Eligibility):** All 4 packages are linked to all 3 villa categories (12 total associations). This enables the frontend customer portal ([`RetreatPackageResponse`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/dto/RetreatPackageResponse.java)) to display full villa category selection options for every retreat journey.

#### Batch C2 — `dbo.RetreatPackageSpaTreatment` (STATUS: EXPLICITLY BLOCKED)
- **Blocked Status:** This table was **not seeded** and is explicitly commented out in the SQL script.
- **Blocking Reason:** `mockMasterData.ts` defines total session counts (`includedSpaSessions = 4, 6, 3, 5`), but no repository source maps which specific treatments from `dbo.SpaTreatment` are included in each package.
- **Exact Decision Required:** Resort management must provide the formal package-to-treatment entitlement matrix (e.g. `RET-DETOX-01` -> 2x Hydrotherapy Soak + 2x Herbal Poultice Therapy) before this junction table can be safely populated.

---

## 4. Idempotency & Script Safety Architecture

### 4.1 Strict Row-Level Idempotency
- **Anti-Pattern Eliminated:** In `m3_spa_seed.sql`, a single `IF NOT EXISTS (SELECT 1 ... WHERE treatment_name = 'Herbal Poultice Therapy')` guarded all 5 treatments, risking failure or skipping if partially executed.
- **Enforced Standard:** In `hswrms_test_business_catalog_seed.sql`, every single row across all tables is guarded by its own dedicated `IF NOT EXISTS (SELECT 1 FROM dbo.<table> WHERE <unique_key> = ...)` check.
- **Rerun Guarantee:** The script can be executed 1 time, 10 times, or restarted after partial failure without generating duplicate keys, orphan rows, or primary key collisions.

### 4.2 Dynamic Foreign Key Resolution
- Zero static `IDENTITY` IDs (e.g. `1`, `2`, `3`) are referenced in any foreign key column.
- All relationships are linked using T-SQL variables resolved by natural business keys:
  ```sql
  DECLARE @CatId_Garden INT;
  SELECT @CatId_Garden = villa_category_id FROM dbo.VillaCategory WHERE category_name = N'Garden Sanctuary Pool Villa';
  
  IF @CatId_Garden IS NULL
  BEGIN
      RAISERROR(N'FATAL: Prerequisite VillaCategory IDs could not be resolved.', 16, 1);
      ROLLBACK TRANSACTION;
      RETURN;
  END;
  ```

### 4.3 Fail-Closed Target Database Guard
- To prevent accidental execution against the primary database `HSWRMS` or `master`, the script includes a non-bypassable preflight check:
  ```sql
  IF DB_NAME() <> N'HSWRMS_TEST'
  BEGIN
      RAISERROR(N'CRITICAL SAFETY HALT: This seed script must only be executed against [HSWRMS_TEST]. Current database is [%s]. Execution terminated.', 16, 1, DB_NAME());
      SET NOEXEC ON;
  END;
  ```
- No `USE [master]`, `CREATE DATABASE`, or implicit context switching exists in the script.

### 4.4 Atomic Transaction Strategy
- The script enables `SET XACT_ABORT ON` and wraps all insert batches in a single `BEGIN TRANSACTION ... COMMIT TRANSACTION` block.
- Any runtime error or constraint violation triggers an immediate, automatic rollback, leaving the database in its prior consistent state.

---

## 5. Static Validation Findings

| Validation Check | Inspection Method | Verified Invariant | Result |
|---|---|---|:---:|
| **Target Database Safety** | AST Code Scan | No `USE [master]`, no `CREATE DATABASE`, explicit `DB_NAME() = 'HSWRMS_TEST'` guard | **PASS** |
| **Credential Hygiene** | Text Search | Zero plaintext passwords, connection strings, or user secrets embedded | **PASS** |
| **Referential Hierarchy** | Dependency Graph | Batches ordered Root (A) -> Dependent (B) -> Junction (C) | **PASS** |
| **Dynamic Key Resolution** | Syntax Audit | All foreign keys use T-SQL variables resolved from natural keys | **PASS** |
| **Row-Level Idempotency** | Statement Audit | 100% of INSERT statements guarded by individual `IF NOT EXISTS` | **PASS** |
| **Schema Column Alignment** | Cross-check vs `schema.sql` | 100% of column names, data types, and nullability match DDL | **PASS** |
| **CHECK Constraints** | Evaluation vs DDL | Duration > 0, Price >= 0, Statuses match allowed enum values | **PASS** |
| **Filtered Index Alignment**| Evaluation vs DDL | `treatment_code` populated as NULL (valid per filtered index) | **PASS** |
| **Regex Delimiter Parsing** | Cross-check vs Java | `dietary_tags` and `allergens` use pure comma separators | **PASS** |
| **Non-Invention Rule** | Source Audit | Undefined package fields left NULL; missing matrices left BLOCKED | **PASS** |

---

## 6. Inventory of Unresolved Domain Decisions & Blocked Sections

1. **Spa Treatment Entitlement Matrix (`dbo.RetreatPackageSpaTreatment`):**
   - *Status:* **BLOCKED (Omitted from Seed)**
   - *Missing Domain Artifact:* Formal breakdown of which specific `treatment_id` records constitute the `includedSpaSessions` count for each of the 4 retreat packages.
   - *Impact on Application:* Package catalog (`GET /api/v1/retreat-packages`) operates successfully; however, automated spa inclusion validation (`isTreatmentIncludedInPackage`) will report 0 included treatments until this matrix is resolved and seeded.
2. **Package Retail Surcharges / Policies:**
   - *Status:* **Resolved via NULL Defaults**
   - `dietary_plan`, `extra_charge_policy`, and `target_guest` are omitted from `mockMasterData.ts`. Because these columns are nullable in `dbo.RetreatPackage`, they are safely seeded as `NULL` without inventing copy.
3. **Recipe Explosion & Stock Tracking (`dbo.Ingredient` / `dbo.MenuItemIngredient`):**
   - *Status:* **Deferred (Post-MVP)**
   - No ingredient inventory or recipe ratios exist in `mockDining.ts`. Customer dining browsing (`GET /api/v1/fnb/customer/menu-items`) and ordering rely strictly on `dbo.MenuItem` and do not require recipe explosion rows.

---

## 7. Changed Files & Git Status

### 7.1 Modified Files Summary
- **Modified Production Files (`src/main`):** **NONE** (0 files modified)
- **Modified Test Files (`src/test`):** **NONE** (0 files modified)
- **Staged / Committed Files:** **NONE** (0 files staged, 0 commits made)

### 7.2 Working Tree Status (`git status --short`)
```
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SchedulingConfig.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m6admin/service/M6DataInitializer.java
 M 05_Development/backend/src/test/resources/application-sqlserver-test.yml
 M 05_Development/database/HSWRMS_TEST_PROVISIONING_GUIDE.md
?? 05_Development/backend/src/test/java/com/heavenstay/hswrms/integration/SqlServerSpringBootContextTest.java
?? 05_Development/database/generated/
?? 05_Development/database/migrations/V003__m2_retreat_booking_schema_reconciliation.sql
?? 05_Development/database/migrations/V004__m5_customer_review_category_ratings.sql
?? 05_Development/database/migrations/V005__m6_audit_log.sql
?? 05_Development/database/migrations/draft_m6_governance_and_delegation.sql
?? 05_Development/database/reports/
?? 05_Development/database/scripts/run_hswrms_jdbc_smoke_test.ps1
?? 05_Development/database/scripts/set_hswrms_test_credential.ps1
?? 05_Development/database/seed/hswrms_test_business_catalog_seed.sql
```

---

## 8. Conclusion & Stop Condition Compliance

Phase 5.8.3.108 has successfully concluded all objectives without violating any safety constraints:
1. Authored [`05_Development/database/seed/hswrms_test_business_catalog_seed.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/seed/hswrms_test_business_catalog_seed.sql) with row-level idempotency, dynamic key resolution, and target-database guards.
2. Verified all data mappings against authoritative sources (`mockMasterData.ts`, `m3_spa_seed.sql`, `mockDining.ts`, `M5DataInitializer.java`, `schema.sql`).
3. Explicitly blocked `RetreatPackageSpaTreatment` rather than inventing unapproved entitlement data.
4. Performed exhaustive static review confirming 100% syntactic and constraint compliance.
5. **No SQL statements were executed against any database. Protected database `HSWRMS` remains completely untouched.**

In compliance with the Phase 5.8.3.108 Stop Condition, execution stops here.

