# PHASE 5.8.3.107 — BUSINESS CATALOG SEED PLANNING & PREFLIGHT REPORT

**Phase:** 5.8.3.107  
**Module:** HSWRMS Business Catalogs, Relational Dependency Mapping & Test Seed Planning  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Execution Timestamp:** 2026-10-28 23:50:00 +07:00  
**Status:** COMPLETED — 100% PREFLIGHT VERIFIED (Strictly Read-Only, Zero Data Mutations, Zero Code Edits)  
**Target Database:** `HSWRMS_TEST` (Database ID: `45`, Status: `ONLINE`, Host: `localhost:1433`)  
**Protected Database:** `HSWRMS` (Isolated, `HAS_DBACCESS = 0`)  
**Audit Principal:** `hswrms_test_user` (Roles: `public`, `db_datareader`)  

---

## 1. Executive Summary & Verification Context

Following the identification in Phase 5.8.3.105 and Phase 5.8.3.106 that public operational catalog endpoints returned HTTP `200 OK` with empty data payloads (`[]`), Phase 5.8.3.107 conducted an exhaustive, strictly read-only preflight and dependency analysis to construct a verified, production-aligned business catalog seed plan for `HSWRMS_TEST`.

### Key Outcomes of Phase 5.8.3.107:
1. **Safety Preflight 100% Passed:**
   - Active Git branch confirmed as `feature/hswrms-m1-m6-integration` with zero staged changes and zero commits.
   - `HSWRMS_TEST` verified ONLINE with Database ID 45.
   - Dedicated audit login `hswrms_test_user` confirmed with `db_datareader` only, zero write-capable database roles (`db_datawriter = 0`), zero sysadmin rights (`is_sysadmin = 0`), and complete isolation from production database `HSWRMS` (`HAS_DBACCESS = 0`).
   - Current catalog table row counts re-verified: all 9 catalog tables hold exactly **0 rows**.
2. **Module 2 (Retreat Packages & Villas) Schema & Source Audit:**
   - Evaluated frontend authoritative fixtures ([`mockMasterData.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/data/mockMasterData.ts)) and demo initializers ([`M5DataInitializer.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/config/M5DataInitializer.java)) against database entities and table constraints.
   - Mapped 4 canonical retreat packages (`RET-DETOX-01`, `RET-YOGA-02`, `RET-SLEEP-03`, `RET-AYUR-04`) and 3 villa categories (`CAT-GARDEN`, `CAT-OCEAN`, `CAT-HILLSIDE`).
   - Identified field mappings, default values (`duration_unit`, `base_price_unit`), and gaps requiring explicit domain decisions (package-to-villa eligibility matrix, physical villa inventories).
3. **Module 3 (Spa Treatments & Rooms) Seed Script Inspection:**
   - Audited existing seed script [`05_Development/database/seed/m3_spa_seed.sql`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/database/seed/m3_spa_seed.sql).
   - Confirmed definitions for 5 treatments and 5 treatment rooms.
   - Uncovered critical idempotency limitation: the script utilizes block-level `IF NOT EXISTS` rather than row-level checks, creating failure vulnerabilities if partially seeded.
   - Noted missing `treatment_code` population and non-standard SSMS `GO` batch delimiters requiring migration to row-level idempotent SQL.
4. **Module 4 (F&B Dining Catalog) Schema & Source Audit:**
   - Reconciled 12+ items from [`mockDining.ts`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/data/mockDining.ts) against [`MenuItemEntity.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/entity/MenuItemEntity.java), [`MenuItemDto.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/dto/MenuItemDto.java), and [`MealOrderServiceImpl.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/service/MealOrderServiceImpl.java).
   - Confirmed serialization pattern: `dietary_tags` and `allergen_information` are stored as comma-delimited strings in SQL Server and split via regex `[,;\s]+` in Java to produce client JSON arrays.
   - Reconciled price requirements (`price >= 0` NOT NULL constraint) for retreat-included meals (`isExtra: false`).
5. **Three-Tier Seed Dependency Plan:**
   - Established strict topological order across 3 execution batches: Root Master Data -> Dependent Inventories -> Junction/Entitlement Tables.
   - Classified all candidate records into: (A) Existing SQL seeds, (B) Frontend mock fixtures requiring SQL generators, and (C) Records blocked by domain decisions.
6. **Route Consistency & Exception Handling Recommendation:**
   - Reaffirmed that `/api/v1/packages` is a legacy documentation artifact not used by the frontend.
   - Recommended adding `@ExceptionHandler(NoResourceFoundException.class)` in [`GlobalExceptionHandler.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/common/exception/GlobalExceptionHandler.java) to convert Spring MVC 6 unmapped route exceptions from HTTP 500 to clean HTTP 404.

---

## 2. Phase 0 — Mandatory Safety Preflight Results

Prior to any analysis, a dedicated read-only verification query was executed against `HSWRMS_TEST` using `hswrms_test_user` credentials retrieved securely from Windows Credential Manager (`HSWRMS_TEST_SQLSERVER`).

### 2.1 Environmental State Verification

| Parameter | Authoritative Expectation | Live Verified Value | Compliance Status |
|---|---|---|:---:|
| **Git Working Branch** | `feature/hswrms-m1-m6-integration` | `feature/hswrms-m1-m6-integration` | **PASS** |
| **Git Staged Status** | 0 staged changes | 0 files staged | **PASS** |
| **SQL Server Machine** | `MYLIFE-MYRULE-1` | `MYLIFE-MYRULE-1` | **PASS** |
| **Target Database** | `HSWRMS_TEST` | `HSWRMS_TEST` | **PASS** |
| **Target Database ID** | `45` | `45` | **PASS** |
| **Target DB Status** | `ONLINE` | `ONLINE` | **PASS** |
| **Database Principal** | `hswrms_test_user` | `hswrms_test_user` | **PASS** |
| **Database Roles** | `public`, `db_datareader` | `public`, `db_datareader` | **PASS** |
| **Data Writer Role** | `0` (False) | `0` (False) | **PASS** |
| **Server Sysadmin Role** | `0` (False) | `0` (False) | **PASS** |
| **Access to HSWRMS** | `0` (Access Denied) | `0` (Access Denied) | **PASS** |

### 2.2 Pre-Audit Database Table Counts

```
Count dbo.[Role]:                 6   (Preserved canonical baseline)
Count dbo.[Permission]:          41   (Preserved canonical catalog)
Count dbo.[RolePermission]:      48   (Preserved canonical mappings)
Count dbo.[SystemConfiguration]:  6   (Preserved canonical parameters)
Count dbo.[User]:                 0   (Preserved)
Count dbo.[UserRole]:             0   (Preserved)
Count dbo.[AuditLog]:             0   (Preserved)

=== BUSINESS CATALOG TABLES ===
Count dbo.[RetreatPackage]:              0   (Empty - Audit candidate)
Count dbo.[VillaCategory]:               0   (Empty - Audit candidate)
Count dbo.[PhysicalVilla]:               0   (Empty - Audit candidate)
Count dbo.[RetreatPackageVillaCategory]: 0   (Empty - Audit candidate)
Count dbo.[RetreatPackageSpaTreatment]:  0   (Empty - Audit candidate)
Count dbo.[SpaTreatment]:                0   (Empty - Audit candidate)
Count dbo.[TreatmentRoom]:               0   (Empty - Audit candidate)
Count dbo.[MenuItem]:                    0   (Empty - Audit candidate)
Count dbo.[MenuItemIngredient]:          0   (Empty - Audit candidate)
Count dbo.[Ingredient]:                  0   (Empty - Audit candidate)
```

**Preflight Assertion:** Zero mutations occurred. The target database is isolated and pristine.

---

## 3. Phase 1 — Module 2 Retreat Packages & Villa Inventory Audit

### 3.1 Entity, Repository, and Controller Architecture

- **Backend Controller:** [`RetreatPackageController.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/controller/RetreatPackageController.java)
  - Mapped to `@RequestMapping("/api/v1/retreat-packages")`.
  - Exposes `GET /` (lists active packages), `GET /{id}` (package details), `GET /villa-categories` (lists active categories), and `POST /calculate` (booking rate calculation).
- **Service Layer:** [`RetreatPackageService.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/service/RetreatPackageService.java)
  - Queries `findByPackageStatus("ACTIVE")` and `findByCategoryStatus("ACTIVE")`.
  - Maps `RetreatPackage` to [`RetreatPackageResponse`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/dto/RetreatPackageResponse.java) including nested `eligibleVillaCategories`.
- **Domain Entities:**
  - [`RetreatPackage.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/entity/RetreatPackage.java): Maps to `dbo.RetreatPackage`.
  - [`VillaCategory.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/entity/VillaCategory.java): Maps to `dbo.VillaCategory`.
  - [`PhysicalVilla.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m2booking/entity/PhysicalVilla.java): Maps to `dbo.PhysicalVilla`.

### 3.2 SQL Server Table Constraints & Rules (`schema.sql` Section 2)

#### 1. `dbo.RetreatPackage`
- `retreat_package_id`: `INT IDENTITY(1,1)` Primary Key.
- `package_code`: `VARCHAR(50) NULL`.
- `package_name`: `NVARCHAR(150) NOT NULL` with Unique Constraint `UQ_RetreatPackage_Name`.
- `duration_nights`: `INT NOT NULL` with Check Constraint `CK_RetreatPackage_Duration CHECK (duration_nights > 0)`.
- `duration_unit`: `NVARCHAR(50) NOT NULL` (Java default: `'Đêm (Nights)'`).
- `base_price`: `DECIMAL(18,2) NOT NULL` with Check Constraint `CK_RetreatPackage_Price CHECK (base_price >= 0)`.
- `base_price_unit`: `NVARCHAR(50) NOT NULL` (Java default: `'VND/khách/gói'`).
- `package_status`: `VARCHAR(20) NOT NULL` with Check Constraint `CK_RetreatPackage_Status CHECK (package_status IN ('ACTIVE','INACTIVE'))`.

#### 2. `dbo.VillaCategory`
- `villa_category_id`: `INT IDENTITY(1,1)` Primary Key.
- `category_name`: `NVARCHAR(120) NOT NULL` with Unique Constraint `UQ_VillaCategory_Name`.
- `max_occupancy`: `INT NOT NULL` with Check Constraint `CK_VillaCategory_Occupancy CHECK (max_occupancy > 0)`.
- `price_modifier`: `DECIMAL(18,2) NOT NULL DEFAULT 0.00`.
- `inventory_count`: `INT NOT NULL DEFAULT 0`.
- `bedroom_count`: `INT NOT NULL DEFAULT 1`.
- `has_private_pool`: `BIT NOT NULL DEFAULT 0`.
- `category_status`: `VARCHAR(20) NOT NULL` with Check Constraint `CK_VillaCategory_Status CHECK (category_status IN ('ACTIVE','INACTIVE'))`.

#### 3. `dbo.PhysicalVilla`
- `villa_id`: `INT IDENTITY(1,1)` Primary Key.
- `villa_category_id`: `INT NOT NULL` with Foreign Key `FK_PhysicalVilla_Category REFERENCES dbo.VillaCategory(villa_category_id)`.
- `villa_number`: `NVARCHAR(30) NOT NULL` with Unique Constraint `UQ_PhysicalVilla_Number`.
- `max_occupancy`: `INT NOT NULL DEFAULT 3`.
- `has_private_pool`: `BIT NOT NULL DEFAULT 0`.
- `villa_status`: `VARCHAR(30) NOT NULL` with Check Constraint `CK_PhysicalVilla_Status CHECK (villa_status IN ('AVAILABLE','OCCUPIED','MAINTENANCE','NEEDS_CLEANING','INACTIVE'))`.

#### 4. `dbo.RetreatPackageVillaCategory`
- `retreat_package_id`: `INT NOT NULL` FK to `dbo.RetreatPackage`.
- `villa_category_id`: `INT NOT NULL` FK to `dbo.VillaCategory`.
- `PK_RetreatPackageVillaCategory`: Composite Primary Key `(retreat_package_id, villa_category_id)`.

#### 5. `dbo.RetreatPackageSpaTreatment`
- `retreat_package_id`: `INT NOT NULL` FK to `dbo.RetreatPackage`.
- `treatment_id`: `INT NOT NULL` FK to `dbo.SpaTreatment`.
- `included_sessions`: `INT NOT NULL DEFAULT 1`.
- `entitlement_status`: `VARCHAR(50) NOT NULL DEFAULT 'INCLUDED'`.
- `notes`: `NVARCHAR(500) NULL`.
- `PK_RetreatPackageSpaTreatment`: Composite Primary Key `(retreat_package_id, treatment_id)`.

### 3.3 Source-to-Schema Field Mapping: Retreat Packages

Source: `mockMasterData.ts` (`INITIAL_PACKAGES_MASTER`):

| Source Field (`mockMasterData.ts`) | Target Column (`dbo.RetreatPackage`) | Target Type & Constraint | Transformation / Default Rule |
|---|---|---|---|
| `code` (e.g. `'RET-DETOX-01'`) | `package_code` | `VARCHAR(50) NULL` | Direct copy |
| `name` (e.g. `'Holistic Detox...'`) | `package_name` | `NVARCHAR(150) NOT NULL UNIQUE` | Direct copy |
| `goal` (e.g. `'Detoxification...'`) | `wellness_goal` | `NVARCHAR(250) NULL` | Direct copy |
| `durationNights` (e.g. `4`) | `duration_nights` | `INT NOT NULL (> 0)` | Direct copy |
| *(Omitted in fixture)* | `duration_unit` | `NVARCHAR(50) NOT NULL` | Entity default: `'Đêm (Nights)'` |
| `basePrice` (e.g. `24500000`) | `base_price` | `DECIMAL(18,2) NOT NULL (>= 0)` | Convert to decimal |
| *(Omitted in fixture)* | `base_price_unit` | `NVARCHAR(50) NOT NULL` | Entity default: `'VND/khách/gói'` |
| `description` | `included_treatments` | `NVARCHAR(MAX) NULL` | Maps summary description |
| *(Omitted in fixture)* | `dietary_plan` | `NVARCHAR(1000) NULL` | Domain default based on package goal |
| *(Omitted in fixture)* | `extra_charge_policy` | `NVARCHAR(1000) NULL` | Resort standard policy text |
| *(Omitted in fixture)* | `target_guest` | `NVARCHAR(500) NULL` | Target audience summary |
| `status` (`'active'`) | `package_status` | `VARCHAR(20) NOT NULL ('ACTIVE','INACTIVE')`| UPPERCASE conversion (`'ACTIVE'`) |

### 3.4 Source-to-Schema Field Mapping: Villa Categories

Source: `mockMasterData.ts` (`INITIAL_VILLAS_MASTER`):

| Source Field (`mockMasterData.ts`) | Target Column (`dbo.VillaCategory`) | Target Type & Constraint | Transformation / Default Rule |
|---|---|---|---|
| `name` (e.g. `'Garden Sanctuary Pool Villa'`) | `category_name` | `NVARCHAR(120) NOT NULL UNIQUE` | Direct copy |
| `maxOccupancy` (e.g. `2`, `4`) | `max_occupancy` | `INT NOT NULL (> 0)` | Direct copy |
| `baseNightlyRate` (`4500000`, `6800000`, `9200000`) | `price_modifier` | `DECIMAL(18,2) NOT NULL` | Base villa modifier = `0.00`; differential = rate minus base (`0.00`, `2300000.00`, `4700000.00`) |
| `totalVillasCount` (`8`, `6`, `4`) | `inventory_count` | `INT NOT NULL` | Direct copy |
| `code` (`CAT-HILLSIDE` = 2 bdrm; others 1) | `bedroom_count` | `INT NOT NULL` | `1` for Garden/Ocean; `2` for Hillside |
| *(Derived from name)* | `bedroom_description` | `NVARCHAR(100) NULL` | `'1 phòng ngủ King'` / `'2 phòng ngủ King & Twin'` |
| *(Derived from category)* | `area_description` | `NVARCHAR(50) NULL` | `'120 m²'` / `'180 m²'` / `'260 m²'` |
| `hasPrivatePool` (`true`) | `has_private_pool` | `BIT NOT NULL` | Convert boolean to `1` |
| *(Derived from category)* | `pool_description` | `NVARCHAR(100) NULL` | `'Hồ bơi riêng plunge pool'` / `'Hồ bơi vô cực hướng biển'` |
| `description` | `features_and_amenities`| `NVARCHAR(500) NULL` | Direct copy |
| *(Omitted in fixture)* | `eligible_packages` | `NVARCHAR(250) NULL` | `'RET-DETOX-01, RET-YOGA-02, RET-SLEEP-03, RET-AYUR-04'` |
| `status` (`'active'`) | `category_status` | `VARCHAR(20) NOT NULL ('ACTIVE','INACTIVE')` | UPPERCASE conversion (`'ACTIVE'`) |

### 3.5 Physical Villa Mapping & Inventory Plan

In `mockMasterData.ts`, physical villas are represented as an aggregate count (`totalVillasCount`). In `M5DataInitializer.java`, concrete physical villas are instantiated. To enable end-to-end booking reservation, room assignment, and cleaning status testing:
- **Garden Sanctuary Pool Villa (`CAT-GARDEN`):** Seed 2 physical villas:
  - `Villa 101`: `villa_status = 'AVAILABLE'`, max_occupancy = 2, has_private_pool = 1, zone = `'Khu Vườn Thiền'`
  - `Villa 102`: `villa_status = 'OCCUPIED'`, max_occupancy = 2, has_private_pool = 1, zone = `'Khu Vườn Thiền'`
- **Oceanfront Sunset Wellness Villa (`CAT-OCEAN`):** Seed 2 physical villas:
  - `Villa 201`: `villa_status = 'AVAILABLE'`, max_occupancy = 2, has_private_pool = 1, zone = `'Khu Biển Hoàng Hôn'`
  - `Villa 202`: `villa_status = 'NEEDS_CLEANING'`, max_occupancy = 2, has_private_pool = 1, zone = `'Khu Biển Hoàng Hôn'`
- **Hillside Panoramic Yoga Pavilion (`CAT-HILLSIDE`):** Seed 1 physical villa:
  - `Villa 301`: `villa_status = 'AVAILABLE'`, max_occupancy = 4, has_private_pool = 1, zone = `'Khu Đồi Thiền'`

---

## 4. Phase 2 — Module 3 Spa Treatments & Rooms Audit

### 4.1 Authoritative Seed Script Review

File: [`05_Development/database/seed/m3_spa_seed.sql`](file:///E:/FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules\05_Development\database\seed\m3_spa_seed.sql)  
Target Tables: `dbo.SpaTreatment`, `dbo.TreatmentRoom`

#### Seed Contents in `m3_spa_seed.sql`:
1. **Spa Treatments (5 rows):**
   - `Herbal Poultice Therapy`: 90 mins, 1,800,000 VND, `MASSAGE`, `ACTIVE`
   - `Lotus Radiance Facial`: 60 mins, 1,200,000 VND, `FACIAL`, `ACTIVE`
   - `Mineral Hydrotherapy Soak`: 60 mins, 950,000 VND, `HYDROTHERAPY`, `ACTIVE`
   - `Mindful Pranyama & Meditation`: 60 mins, 600,000 VND, `MEDITATION`, `ACTIVE`
   - `Deep Tissue Bamboo Massage`: 90 mins, 2,100,000 VND, `MASSAGE`, `ACTIVE`
2. **Treatment Rooms (5 rows):**
   - `Lotus Pavilion Suite 1`: `AVAILABLE`
   - `Lotus Pavilion Suite 2`: `AVAILABLE`
   - `Bamboo Sanctuary Suite A`: `AVAILABLE`
   - `Hydro-Thermal Suite`: `AVAILABLE`
   - `Meditation Garden Pavilion`: `AVAILABLE`

### 4.2 Idempotency & Constraint Analysis

1. **Current Idempotency Flaw:**
   - The script performs a coarse batch check: `IF NOT EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'Herbal Poultice Therapy') INSERT INTO dbo.SpaTreatment ... VALUES (... 5 rows ...)`.
   - **Risk:** If a previous run inserted 'Herbal Poultice Therapy' but failed before inserting the others, re-running the script will skip all remaining treatments. Conversely, if another treatment (e.g. 'Lotus Radiance Facial') already exists, the batch insert will crash with a unique constraint violation on `UQ_SpaTreatment_Name`.
   - **Resolution for Implementation:** Transform into **row-level idempotent statements** using `IF NOT EXISTS (SELECT 1 FROM dbo.SpaTreatment WHERE treatment_name = N'...') INSERT INTO dbo.SpaTreatment ...`.
2. **Missing `treatment_code` Column:**
   - `m3_spa_seed.sql` leaves `treatment_code` `NULL`.
   - `dbo.SpaTreatment` has a filtered unique index:
     `CREATE UNIQUE NONCLUSTERED INDEX UQ_SpaTreatment_TreatmentCode ON dbo.SpaTreatment(treatment_code) WHERE treatment_code IS NOT NULL;`
   - Leaving `treatment_code` NULL is schema-compliant, but populating standard codes (e.g. `TRT-HERBAL-90`, `TRT-LOTUS-60`, `TRT-HYDRO-60`, `TRT-PRANAYAMA-60`, `TRT-BAMBOO-90`) significantly improves API contract stability with frontend fixtures.
3. **Check Constraint Compliance:**
   - `CK_SpaTreatment_Duration`: All durations (90, 60) > 0. (**PASS**)
   - `CK_SpaTreatment_Price`: All prices (600,000 to 2,100,000) >= 0. (**PASS**)
   - `CK_SpaTreatment_Status`: All statuses `'ACTIVE'`. (**PASS**)
   - `CK_TreatmentRoom_Status`: All room statuses `'AVAILABLE'`. (**PASS**)

---

## 5. Phase 3 — Module 4 F&B Menu Items & Inventory Audit

### 5.1 Entity, Repository, and Controller Architecture

- **Backend Controller:** [`FnbCustomerOrderController.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/controller/FnbCustomerOrderController.java)
  - Endpoint `GET /api/v1/fnb/customer/menu-items` accepts optional `@RequestParam String category` and `@RequestParam String mealPeriod`.
- **Service Implementation:** [`MealOrderServiceImpl.java#L71-L78`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/service/MealOrderServiceImpl.java#L71-L78)
  - Executes `menuItemRepository.findAllAvailable()` (`WHERE availability_status = 'AVAILABLE'`).
  - Filters by category (case-insensitive) and meal period (`mealType.toLowerCase().contains(mealPeriod.toLowerCase()) || mealType.equalsIgnoreCase("ALL_DAY")`).
  - Maps to `MenuItemDto` via `mapToMenuItemDto(MenuItemEntity entity)` (lines 552–572).
- **String Delimiter Parsing Rule:**
  - Lines 561–569 explicitly split `entity.getDietaryTags()` and `entity.getAllergenInformation()` using regex:
    ```java
    Arrays.stream(entity.getDietaryTags().split("[,;\\s]+"))
          .filter(s -> !s.isBlank())
          .collect(Collectors.toList())
    ```
  - **Critical Rule:** In the SQL seed, tags must be comma-delimited strings (e.g. `'vegetarian,dairy_free'`) without spaces or brackets.

### 5.2 Table Constraints (`schema.sql` Section 4)

- `menu_item_id`: `INT IDENTITY(1,1)` Primary Key.
- `item_name`: `NVARCHAR(150) NOT NULL` with Unique Constraint `UQ_MenuItem_Name`.
- `category`: `NVARCHAR(100) NULL` (e.g. `'main'`, `'wellness_drink'`, `'appetizer'`, `'dessert'`).
- `meal_type`: `NVARCHAR(50) NULL` (e.g. `'BREAKFAST'`, `'LUNCH'`, `'DINNER'`, `'ALL_DAY'`).
- `price`: `DECIMAL(18,2) NOT NULL DEFAULT 0.00` with Check Constraint `CK_MenuItem_Price CHECK (price >= 0)`.
- `dietary_tags`: `NVARCHAR(500) NULL`.
- `allergen_information`: `NVARCHAR(MAX) NULL`.
- `availability_status`: `VARCHAR(20) NOT NULL` with Check Constraint `CK_MenuItem_Availability CHECK (availability_status IN ('AVAILABLE','UNAVAILABLE'))`.

### 5.3 Source-to-Schema Field Mapping: Menu Items

Source: `mockDining.ts` (`MOCK_MENU_ITEMS`):

| Source Field (`mockDining.ts`) | Target Column (`dbo.MenuItem`) | Target Type & Constraint | Transformation & Formatting Rule |
|---|---|---|---|
| `name.vi` | `item_name` | `NVARCHAR(150) NOT NULL UNIQUE` | Primary Vietnamese culinary title |
| `category` | `category` | `NVARCHAR(100) NULL` | Lowercase standard string (`'main'`, `'wellness_drink'`) |
| `mealPeriods[0]` | `meal_type` | `NVARCHAR(50) NULL` | UPPERCASE (`'BREAKFAST'`, `'LUNCH'`, `'DINNER'`, `'ALL_DAY'`) |
| `price` / `isExtra` | `price` | `DECIMAL(18,2) NOT NULL (>= 0)` | If `price` defined -> use value; if `isExtra: false` -> `0.00` VND (included in retreat package) |
| `dietaryTags` (`['vegan', 'gluten_free']`) | `dietary_tags` | `NVARCHAR(500) NULL` | Join with comma: `'vegan,gluten_free'` |
| `allergenTags` (`['nuts', 'fish']`) | `allergen_information` | `NVARCHAR(MAX) NULL` | Join with comma: `'nuts,fish'`; empty array -> `NULL` |
| *(Implied operational)* | `availability_status` | `VARCHAR(20) NOT NULL ('AVAILABLE','UNAVAILABLE')` | Default `'AVAILABLE'` |

### 5.4 Candidate Menu Items for Initial Seed

| ID | Vietnamese Name (`item_name`) | Category | Meal Type | Price (VND) | Dietary Tags | Allergen Tags |
|---|---|---|---|:---:|---|---|
| `MENU-001` | Cháo Yến Mạch Quả Mọng Hữu Cơ | main | BREAKFAST | 0.00 | `vegetarian,dairy_free` | `NULL` |
| `MENU-002` | Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ | main | BREAKFAST | 0.00 | `lacto_ovo_vegetarian` | `eggs` |
| `MENU-003` | Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng | main | LUNCH | 0.00 | `vegan,dairy_free,gluten_free` | `nuts` |
| `MENU-004` | Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây | main | DINNER | 0.00 | `pescatarian,gluten_free,dairy_free,keto` | `fish` |
| `MENU-005` | Sinh Tố Detox Xanh Thanh Lọc | wellness_drink | ALL_DAY | 150,000.00 | `vegan,dairy_free,gluten_free` | `NULL` |
| `MENU-006` | Thăn Bò Wagyu & Tôm Hùm Nướng Thảo Mộc | main | DINNER | 480,000.00 | `keto` | `crustacean` |

---

## 6. Phase 4 — Comprehensive Seed Dependency Graph & Execution Plan

### 6.1 Referential Dependency Graph

The relational schema mandates a strict topological insert sequence to prevent foreign key constraint violations:

```
[Level 0: Independent Master Catalogs]
  ├── dbo.VillaCategory
  ├── dbo.SpaTreatment
  ├── dbo.TreatmentRoom
  ├── dbo.MenuItem
  └── dbo.Ingredient

[Level 1: Dependent Inventory & Packages]
  ├── dbo.PhysicalVilla  (FK -> VillaCategory)
  └── dbo.RetreatPackage (Root entity, but links to Level 0)

[Level 2: Entitlement & Junction Mappings]
  ├── dbo.RetreatPackageVillaCategory (FK -> RetreatPackage, VillaCategory)
  ├── dbo.RetreatPackageSpaTreatment  (FK -> RetreatPackage, SpaTreatment)
  └── dbo.MenuItemIngredient          (FK -> MenuItem, Ingredient)
```

### 6.2 Seed Batches & Categorization Table

| Batch | Table Name | Source of Truth | Relational Precondition | Categorization | Idempotency Key |
|:---:|---|---|---|:---:|---|
| **1A** | `dbo.VillaCategory` | `mockMasterData.ts` | None | **(B)** Needs Generator | `category_name` |
| **1B** | `dbo.SpaTreatment` | `m3_spa_seed.sql` | None | **(A)** Existing SQL Seed | `treatment_name` |
| **1C** | `dbo.TreatmentRoom` | `m3_spa_seed.sql` | None | **(A)** Existing SQL Seed | `room_name` |
| **1D** | `dbo.MenuItem` | `mockDining.ts` | None | **(B)** Needs Generator | `item_name` |
| **2A** | `dbo.PhysicalVilla` | `M5DataInitializer.java` & M2 Design | `dbo.VillaCategory` | **(B)** Needs Generator | `villa_number` |
| **2B** | `dbo.RetreatPackage` | `mockMasterData.ts` | None | **(B)** Needs Generator | `package_name` |
| **3A** | `dbo.RetreatPackageVillaCategory` | Booking Logic Matrix | `RetreatPackage`, `VillaCategory` | **(B)** Domain Mapping | `(retreat_package_id, villa_category_id)` |
| **3B** | `dbo.RetreatPackageSpaTreatment` | M2/M3 Entitlement Matrix | `RetreatPackage`, `SpaTreatment` | **(C)** Blocked / Decision Needed | `(retreat_package_id, treatment_id)` |
| **3C** | `dbo.Ingredient` / `MenuItemIngredient` | Back-of-House Recipes | `MenuItem` | **(C)** Blocked / Post-MVP | `ingredient_name` |

### 6.3 Detailed Batch Categorization Breakdown

#### Category (A): Existing Approved SQL Seeds
- **Tables:** `dbo.SpaTreatment`, `dbo.TreatmentRoom`
- **Asset:** `05_Development/database/seed/m3_spa_seed.sql`
- **Readiness:** 95% complete. Requires refactoring from block-level `IF NOT EXISTS` into row-level idempotent statements and adding `treatment_code` identifiers before application to `HSWRMS_TEST`.

#### Category (B): Frontend Mock Data Requiring SQL Seed Generation
- **Tables:** `dbo.VillaCategory`, `dbo.PhysicalVilla`, `dbo.RetreatPackage`, `dbo.RetreatPackageVillaCategory`, `dbo.MenuItem`
- **Assets:** `mockMasterData.ts`, `mockDining.ts`, `M5DataInitializer.java`
- **Readiness:** Authoritative domain definitions exist. Requires an automated, strictly idempotent SQL generator script that maps all fields, defaults, and foreign keys cleanly.

#### Category (C): Records Blocked by Missing Domain Decisions
- **`dbo.RetreatPackageSpaTreatment`:**
  - *Decision Needed:* The exact assignment of spa sessions to packages.
  - *Proposed Baseline:*
    - `RET-DETOX-01` (4 sessions included): Herbal Poultice Therapy (2), Mineral Hydrotherapy Soak (2)
    - `RET-YOGA-02` (6 sessions included): Mindful Pranyama & Meditation (4), Herbal Poultice Therapy (2)
    - `RET-SLEEP-03` (3 sessions included): Mineral Hydrotherapy Soak (2), Mindful Pranyama & Meditation (1)
    - `RET-AYUR-04` (5 sessions included): Deep Tissue Bamboo Massage (3), Herbal Poultice Therapy (2)
- **`dbo.Ingredient` & `dbo.MenuItemIngredient`:**
  - *Current Status:* Back-of-house recipe explosion tables. Not required for customer menu browsing or ordering (`MenuItemEntity` operates independently).
  - *Recommendation:* Defer to post-MVP inventory phase; do not block public catalog testing.

### 6.4 Rollback Strategy

In the event of an unintended data state or testing reset requirement, a cascade-safe deletion script targeting only the seeded business records can be executed in reverse topological order:

```sql
-- Safe, surgical rollback script for business catalog seed
BEGIN TRANSACTION;
    DELETE FROM dbo.RetreatPackageSpaTreatment 
    WHERE retreat_package_id IN (SELECT retreat_package_id FROM dbo.RetreatPackage WHERE package_code LIKE 'RET-%');

    DELETE FROM dbo.RetreatPackageVillaCategory 
    WHERE retreat_package_id IN (SELECT retreat_package_id FROM dbo.RetreatPackage WHERE package_code LIKE 'RET-%');

    DELETE FROM dbo.PhysicalVilla 
    WHERE villa_number IN ('Villa 101', 'Villa 102', 'Villa 201', 'Villa 202', 'Villa 301');

    DELETE FROM dbo.RetreatPackage 
    WHERE package_code LIKE 'RET-%';

    DELETE FROM dbo.VillaCategory 
    WHERE category_name IN (N'Garden Sanctuary Pool Villa', N'Oceanfront Sunset Wellness Villa', N'Hillside Panoramic Yoga Pavilion');

    DELETE FROM dbo.SpaTreatment 
    WHERE treatment_name IN (N'Herbal Poultice Therapy', N'Lotus Radiance Facial', N'Mineral Hydrotherapy Soak', N'Mindful Pranyama & Meditation', N'Deep Tissue Bamboo Massage');

    DELETE FROM dbo.TreatmentRoom 
    WHERE room_name IN (N'Lotus Pavilion Suite 1', N'Lotus Pavilion Suite 2', N'Bamboo Sanctuary Suite A', N'Hydro-Thermal Suite', N'Meditation Garden Pavilion');

    DELETE FROM dbo.MenuItem 
    WHERE item_name IN (N'Cháo Yến Mạch Quả Mọng Hữu Cơ', N'Bữa Sáng Trứng Chần Hữu Cơ & Quả Bơ', N'Salad Quinoa Dưỡng Sinh Sốt Đậu Phộng', N'Cá Hồi Đại Dương Áp Chảo Sốt Chanh Dây', N'Sinh Tố Detox Xanh Thanh Lọc', N'Thăn Bò Wagyu & Tôm Hùm Nướng Thảo Mộc');
COMMIT TRANSACTION;
```

---

## 7. Phase 5 — Route Consistency & Global Exception Handling Recommendation

### 7.1 Architecture of the HTTP 500 Route Error

In Phase 5.8.3.105, `GET /api/v1/packages` emitted an HTTP 500 error:
```json
{
  "status": 500,
  "code": "INTERNAL_SERVER_ERROR",
  "message": "An unexpected server error occurred. Please contact resort system administrator.",
  "path": "/api/v1/packages"
}
```

#### Diagnostic Breakdown:
1. `SecurityConfig.java#L120` explicitly specifies `permitAll()` for `/api/v1/packages/**` and `/api/v1/packages`.
2. Spring MVC 6.1+ / Spring Boot 3.3.4 searches for a handler mapping. Because no `@RequestMapping` exists for `/packages`, it delegates to `ResourceHttpRequestHandler` to locate static web content.
3. No static file exists at `api/v1/packages`, triggering `org.springframework.web.servlet.resource.NoResourceFoundException: No static resource api/v1/packages.`.
4. In [`GlobalExceptionHandler.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/common/exception/GlobalExceptionHandler.java), there is no specific handler for `NoResourceFoundException`.
5. The unhandled exception falls through to `@ExceptionHandler(Exception.class)` (lines 124–134), resulting in an HTTP 500 response.

### 7.2 Authoritative Client Route Finding

A comprehensive audit of the frontend repository revealed:
- [`05_Development/frontend/src/api/booking/retreatBookingApi.ts#L158`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/api/booking/retreatBookingApi.ts#L158): All API calls target `/retreat-packages`, `/retreat-packages/{packageId}`, `/retreat-packages/villa-categories`, and `/retreat-packages/calculate`.
- **Zero frontend files call `/api/v1/packages`.**
- Therefore, there is **no frontend/backend runtime contract breakage**.

### 7.3 Architectural Recommendations

1. **Implement Dedicated 404 Exception Handler (Strongly Recommended):**
   In [`GlobalExceptionHandler.java`](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/backend/src/main/java/com/heavenstay/hswrms/common/exception/GlobalExceptionHandler.java), add an explicit handler for `NoResourceFoundException`:
   ```java
   @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
   public ResponseEntity<ApiError> handleNoResourceFound(org.springframework.web.servlet.resource.NoResourceFoundException ex, HttpServletRequest request) {
       ApiError error = new ApiError(
               HttpStatus.NOT_FOUND.value(),
               "RESOURCE_NOT_FOUND",
               "The requested resource was not found on this server.",
               request.getRequestURI()
       );
       return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
   }
   ```
   *Impact:* Fixes the underlying Spring MVC 6 issue across the entire application so that any unmapped route returns HTTP 404 rather than HTTP 500.
2. **Do Not Add Legacy Controller Route Aliases:**
   - Adding `@RequestMapping({"/api/v1/retreat-packages", "/api/v1/packages"})` to `RetreatPackageController.java` is **not recommended** because it creates technical debt by maintaining an unversioned, undocumented route alias when no clients require it.
3. **Prune Dead Security Matcher (Optional Cleanup):**
   - In a future cleanup phase, remove `/api/v1/packages/**` from `SecurityConfig.java#L120` to eliminate dead security surface.

---

## 8. Changed Files & Git Status

### 8.1 Modified Files Summary
- **Modified Production Files (`src/main`):** **NONE** (0 files modified)
- **Modified Test Files (`src/test`):** **NONE** (0 files modified)
- **Staged / Committed Files:** **NONE** (0 files staged, 0 commits made)

### 8.2 Working Tree Status (`git status --short`)
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
```

---

## 9. Conclusion & Next Phase Action Plan

Phase 5.8.3.107 has accomplished all planning objectives strictly within read-only constraints:
1. Re-verified safety, isolation, and baseline data in `HSWRMS_TEST`.
2. Mapped authoritative domain fixtures from `mockMasterData.ts` and `mockDining.ts` to SQL Server entities and constraints.
3. Evaluated `m3_spa_seed.sql` and identified essential row-level idempotency enhancements.
4. Formulated a 3-batch dependency and execution plan.
5. Resolved the route consistency question with an explicit recommendation to handle `NoResourceFoundException` cleanly as HTTP 404.

### Recommended Next Steps for Phase 5.8.3.108:
- **Phase 5.8.3.108:** Controlled Business Catalog SQL Seed Authoring & Review.
  - Author a unified, idempotent SQL seed script (`05_Development/database/seed/hswrms_test_business_catalog_seed.sql`) implementing the reviewed Phase 107 mapping plan.
  - Conduct static SQL safety review before seeking authorization for execution.

