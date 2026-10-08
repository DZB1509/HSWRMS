# HSWRMS Database Development Baseline

This directory contains the working database schema and migrations for the HeavenStay Wellness Resort Management System (HSWRMS).

## DBMS Specification
- **Engine:** Microsoft SQL Server
- **Target Database Name:** `HSWRMS`
- **Default Port:** `1433`

## Directory Structure
- `schema.sql`: Authoritative development DDL baseline (derived from `03_Design/Database/HSWRMS_SQLServer_Database.sql`).
- `seed/`: Master catalog seeds, reference data, and development accounts.
- `migrations/`: Future incremental migration scripts.

## Database Initialization
1. Ensure your local or containerized Microsoft SQL Server instance is running.
2. Connect using `sqlcmd`, Azure Data Studio, or SQL Server Management Studio (SSMS).
3. Execute `schema.sql`:
   ```bash
   sqlcmd -S localhost -U sa -P "YourStrong@Password" -i schema.sql
   ```

## Development Schema Evolution Rules
- **Design vs. Development Rule:** The file in `03_Design/Database/` is the read-only conceptual/design baseline. All implementation adjustments, index optimizations, and approved business model fixes live here under `05_Development/database/`.
- **Non-Destructive Hibernate Mode:** Spring Boot should use `spring.jpa.hibernate.ddl-auto=validate` (or `none`) to ensure Hibernate never silently mutates or drops the relational schema.
- **Naming Reconciliation Note (M4):** The approved business domain terminology for `dbo.MenuItemIngredient` is `quantity_per_serving`. The current DDL column is `required_quantity`. During module development, this will be formally mapped via JPA `@Column(name = "required_quantity")` or reconciled in migration scripts.
