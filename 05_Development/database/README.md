# HSWRMS Database Development Baseline

This directory contains the working database schema and migrations for the HeavenStay Wellness Resort Management System (HSWRMS).

## DBMS Specification
- **Engine:** Microsoft SQL Server
- **Target Database Name:** `HSWRMS`
- **Default Port:** `1433`

## Directory Structure
- `schema.sql`: Authoritative development DDL baseline (derived from `03_Design/Database/HSWRMS_SQLServer_Database.sql`).
- `seed/`: Master catalog seeds, reference data, and development accounts.
  - `seed/_draft_m1_roles_seed.sql`: 6 canonical system roles.
  - `seed/V1_2__seed_villa_inventory.sql`: 27 physical villas, 6 categories, 6 zones, and 16 functional spaces from `02_Requirement/Screen_Inventory/HSWRMS_Villa_Inventory (1).xlsx`.
  - `seed/V1_3__seed_spa_retreat_packages.sql`: Spa treatments and retreat packages catalog.
  - `seed/V1_4__seed_spa_packages_v3.sql`: Standardized treatments, retreat packages, room types, and FnB entitlements.
- `migrations/`: Incremental migration scripts.
  - `migrations/V1_1__m6_schema_enhancements.sql`: M6 Admin, Permissions & Audit logs.
  - `migrations/V1_2__villa_inventory.sql`: Schema enhancements for Villa Inventory & Resort Physical Layout.
  - `migrations/V1_3__spa_retreat_schema.sql`: Spa & Retreat package enhancements.
  - `migrations/V1_4__spa_packages_v3_standardization.sql`: RoomTypeMaster, PackageFnBEntitlement, QualificationMaster.
  - `migrations/V1_5__remove_duration_unit_from_spa_treatment.sql`: Normalization of spa treatment duration to minutes.
  - `migrations/V2__customer_review_category_ratings.sql`: Category ratings (room, spa, dining) on customer reviews.

## Database Initialization
1. Ensure your local or containerized Microsoft SQL Server instance is running.
2. Connect using `sqlcmd`, Azure Data Studio, or SQL Server Management Studio (SSMS).
3. Execute `schema.sql`:
   ```bash
   sqlcmd -S localhost -U sa -P "YourStrong@Password" -i schema.sql
   ```
4. Execute seed data:
   ```bash
   sqlcmd -S localhost -U sa -P "YourStrong@Password" -i seed/_draft_m1_roles_seed.sql
   sqlcmd -S localhost -U sa -P "YourStrong@Password" -i seed/V1_2__seed_villa_inventory.sql
   sqlcmd -S localhost -U sa -P "YourStrong@Password" -i seed/V1_4__seed_spa_packages_v3.sql
   ```

## Development Schema Evolution Rules
- **Design vs. Development Rule:** The file in `03_Design/Database/` is the read-only conceptual/design baseline. All implementation adjustments, index optimizations, and approved business model fixes live here under `05_Development/database/`.
- **Non-Destructive Hibernate Mode:** Spring Boot should use `spring.jpa.hibernate.ddl-auto=validate` (or `none`) to ensure Hibernate never silently mutates or drops the relational schema.
- **Naming Reconciliation Note (M4):** The approved business domain terminology for `dbo.MenuItemIngredient` is `quantity_per_serving`. The current DDL column is `required_quantity`. During module development, this will be formally mapped via JPA `@Column(name = "required_quantity")` or reconciled in migration scripts.
