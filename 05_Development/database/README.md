# HSWRMS Database Development Baseline

This directory contains the working database schema and migrations for the HeavenStay Wellness Resort Management System (HSWRMS).

## DBMS Specification
- **Engine:** Microsoft SQL Server
- **Target Database Name:** `HSWRMS`
- **Default Port:** `1433`

## Directory Structure
- `schema.sql`: Authoritative development DDL baseline containing the full schema across all modules (M1 to M6).
- `seed/`: Master catalog seeds, reference data, and development accounts.
- `migrations/`: Incremental SQL Server migration scripts for manual database upgrades.

## Automated Migration Runner Status
- **No Automated Runner:** The backend Spring Boot application **does not** configure an automated migration runner (such as Flyway or Liquibase). Migration scripts are **not executed automatically** upon application startup.
- **Hibernate Non-Destructive Mode:** In production and local development, Spring Boot should use `spring.jpa.hibernate.ddl-auto=validate` (or `none`) so Hibernate never automatically alters, creates, or drops database tables. In automated unit tests, H2 runs with in-memory isolated schema (`create-drop`).

## Database Initialization and Upgrade Workflows

### 1. Fresh Database Initialization (New Environment)
For a completely new database instance, run `schema.sql` directly. It contains the unified, canonical schema for all modules (M1 through M6).
**Do not run incremental migration scripts on a fresh database initialized with `schema.sql`.**

```bash
sqlcmd -S localhost -U sa -P "YourStrong@Password" -i schema.sql
```

### 2. Upgrading an Existing Database (Manual Incremental Migrations)
For existing database instances provisioned from an earlier baseline that need incremental schema updates, a database administrator must manually execute the versioned migration scripts in `migrations/` in strict sequential order via `sqlcmd` or SQL Server Management Studio (SSMS):

1. `V001__m3_spa_scheduling.sql`: Adds rich display attributes to `dbo.SpaTreatment`.
2. `V002__m3_reconcile_treatment_code_and_room_type.sql`: Adds treatment codes and room types.
3. `V003__m2_retreat_booking_schema_reconciliation.sql`: Reconciles M2 columns, default constraints, and bridge table metadata. Fails clearly if prerequisite baseline tables (`dbo.RetreatPackage`, `dbo.VillaCategory`, `dbo.PhysicalVilla`) are absent.
4. `V004__m5_customer_review_category_ratings.sql`: Adds optional category ratings (`room_rating`, `spa_rating`, `dining_rating`) to `dbo.CustomerReview`.
5. `V005__m6_audit_log.sql`: Idempotently creates `dbo.AuditLog` table and index `IX_AuditLog_ActorCreatedAt` for existing databases.
6. `draft_m6_governance_and_delegation.sql` (DRAFT / UNNUMBERED): Idempotently enhances `dbo.[User]`, `dbo.[Permission]`, `dbo.SystemConfiguration`, `dbo.RightDelegation`, and `dbo.AuditLog`. This script is deliberately maintained as an unnumbered draft pending Module 4 (F&B) schema reconciliation, so final sequential numbering (e.g. `V006`) can be assigned without sequence reordering or migration rewrite.

> **Note on Draft Files:** Files prefixed with `_draft` or `_reviewed` (e.g. `_draft_m1_identity_health_profile.sql`, `_reviewed_m1_health_profile_structured.sql`) are research notes. The `draft_m6_governance_and_delegation.sql` script is an unnumbered candidate migration awaiting M4 ordering reconciliation.

> **Caution:** Never run migration scripts against production databases or databases containing live customer data without prior verification on a dedicated staging environment.

## Development Schema Evolution Rules
- **Design vs. Development Rule:** The file in `03_Design/Database/` is the read-only conceptual/design baseline. All implementation adjustments, index optimizations, and approved business model fixes live here under `05_Development/database/`.
- **Naming Reconciliation Note (M4):** The approved business domain terminology for `dbo.MenuItemIngredient` is `quantity_per_serving`. The current DDL column is `required_quantity`. During module development, this will be formally mapped via JPA `@Column(name = "required_quantity")` or reconciled in migration scripts.

## Migration Preconditions & Compatibility Matrix (V001–V005)

### 1. Prerequisites and Table Creation Summary

| Migration | Script File | Prerequisite Objects (Must Exist Before Run) | Tables Created by Migration | Baseline Tables Required |
|---|---|---|---|---|
| **V001** | `V001__m3_spa_scheduling.sql` | `dbo.SpaTreatment` | *(None)* | `dbo.SpaTreatment` |
| **V002** | `V002__m3_reconcile_treatment_code_and_room_type.sql` | `dbo.SpaTreatment`, `dbo.TreatmentRoom` | *(None)* | `dbo.SpaTreatment`, `dbo.TreatmentRoom` |
| **V003** | `V003__m2_retreat_booking_schema_reconciliation.sql` | `dbo.RetreatPackage`, `dbo.VillaCategory`, `dbo.PhysicalVilla`, `dbo.SpaTreatment` | `dbo.RetreatPackageSpaTreatment` *(bridge table if missing)* | `dbo.RetreatPackage`, `dbo.VillaCategory`, `dbo.PhysicalVilla`, `dbo.SpaTreatment` |
| **V004** | `V004__m5_customer_review_category_ratings.sql` | `dbo.CustomerReview` | *(None)* | `dbo.CustomerReview` |
| **V005** | `V005__m6_audit_log.sql` | `dbo.[User]` *(FK target)* | `dbo.AuditLog` | `dbo.[User]` |
| **DRAFT** | `draft_m6_governance_and_delegation.sql` | `dbo.[User]`, `dbo.[Permission]`, `dbo.SystemConfiguration`, `dbo.RightDelegation`, `dbo.AuditLog` | *(None)* | `dbo.[User]`, `dbo.[Permission]`, `dbo.SystemConfiguration`, `dbo.RightDelegation`, `dbo.AuditLog` |

### 2. Compatibility Across Database States

#### State 1: Fresh Database Provisioned via `schema.sql`
- **Description:** A clean database instance created directly using `05_Development/database/schema.sql`.
- **Precondition Status:** All baseline and migrated tables/columns already exist (`AuditLog`, `RetreatPackageSpaTreatment`, `CustomerReview` ratings, etc.).
- **Behavior of V001–V005:** All migrations use `IF NOT EXISTS` / `COL_LENGTH` / `OBJECT_ID` checks, making them completely idempotent (no-op).
- **Recommendation:** **Do not run V001–V005 on fresh instances.** `schema.sql` is already the unified source of truth.

#### State 2: Existing Database with Complete Baseline (Missing Extension Columns)
- **Description:** A database created from an earlier release containing all canonical baseline tables (`User`, `SpaTreatment`, `TreatmentRoom`, `RetreatPackage`, `VillaCategory`, `PhysicalVilla`, `CustomerReview`), but lacking M2/M3/M5/M6 enhancements.
- **Precondition Status:** **Fully satisfied.**
- **Behavior of V001–V005:** Running scripts in strict sequence (`V001 -> V002 -> V003 -> V004 -> V005`) successfully applies all column additions, constraints, indexes, and bridge tables.
- **Recommendation:** **Fully supported upgrade path.**

#### State 3: Partial / Fragmented Schema (Missing Prerequisite Baseline Tables)
- **Description:** A fragmented database where only a subset of modules was provisioned (e.g., only M1 tables exist, or `dbo.CustomerReview` / `dbo.RetreatPackage` / `dbo.[User]` are missing).
- **Precondition Status:** **NOT SATISFIED.**
- **Behavior of V001–V005:**
  - `V001` / `V002`: Fails if `dbo.SpaTreatment` or `dbo.TreatmentRoom` is missing (`Cannot find the object`).
  - `V003`: **Fails fast** at lines 10–16 if prerequisite tables `dbo.RetreatPackage`, `dbo.VillaCategory`, `dbo.PhysicalVilla` are missing, and at Section 4.1 if `dbo.SpaTreatment` is missing when creating or adding foreign keys to `dbo.RetreatPackageSpaTreatment`:
    ```sql
    IF OBJECT_ID(N'dbo.SpaTreatment', N'U') IS NULL
    BEGIN
        RAISERROR(N'HSWRMS Migration V003 Precondition Failed: Prerequisite baseline table dbo.SpaTreatment does not exist. Cannot create bridge table dbo.RetreatPackageSpaTreatment...', 16, 1);
        RETURN;
    END
    ```
  - `V004`: Fails with SQL error if `dbo.CustomerReview` is missing (`Cannot find the object "dbo.CustomerReview"`).
  - `V005`: Fails with SQL error if `dbo.[User]` is missing (`Foreign key 'FK_AuditLog_User' references invalid table 'dbo.User'`).
- **Policy & Recommendation:** **State 3 is explicitly NOT supported by incremental migrations.**
  - **Do NOT claim that incremental migration scripts support arbitrary incomplete databases.**
  - **Remediation:** Incomplete databases must be provisioned with the full baseline (`schema.sql`) first rather than running incremental evolution scripts.

### 3. Environment Testing Limitations
- **Verification Environment:** All Java entity mappings, schema compatibility assertions, and constraints are validated via in-memory H2 database test suites (`M2SchemaCompatibilityTest`, Spring Boot `@DataJpaTest`).
- **SQL Server Testing Status:** The versioned SQL Server DDL migrations (V001–V005) have **not been executed against a live Microsoft SQL Server instance** in the current CI/development workspace, as no active SQL Server instance was available. DBA review and dry-run execution on a dedicated SQL Server staging instance is mandatory prior to production deployment.
