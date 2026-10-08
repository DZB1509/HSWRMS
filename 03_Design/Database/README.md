# HSWRMS Database Baseline

## Official DBMS
Microsoft SQL Server

## Current authoritative schema
HSWRMS_SQLServer_Database.sql

This SQL Server schema is the current physical database baseline
for HSWRMS before full-stack development begins.

The schema may be revised during implementation when:
- approved business requirements change;
- SRS/ERD inconsistencies are corrected;
- new constraints/indexes are required;
- implementation reveals a justified schema issue.

Any development-time database changes must be made under:

05_Development/database/

The SQL file in 03_Design/Database is treated as a read-only baseline.

## Important
MySQL / MySQL Workbench files are historical experiments only
and are NOT the target database technology.

Official production/development DBMS:
Microsoft SQL Server.