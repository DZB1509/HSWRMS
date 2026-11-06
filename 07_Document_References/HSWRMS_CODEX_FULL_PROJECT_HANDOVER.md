# HSWRMS — FULL PROJECT HANDOVER FOR CODEX

**Scope:** HSWRMS M1–M6  
**Purpose:** Transfer project context from the previous Antigravity/ChatGPT workflow to Codex.  
**Status:** Handover document only. Phase 1.3 has NOT started.  
**Date:** 31 October 2026  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`

> **Evidence note:** This document consolidates project facts, logs and reports supplied by the user in prior work. Codex must verify current repository, Git and database state before acting. Historical findings may have changed. Do not treat this document as authorization to modify code or databases.

## 1. Purpose and first-use instructions

Codex is taking over an existing multi-phase project. It must first read this handover, inspect the repository in read-only mode, report what it can verify, and wait for explicit approval.

**Do not run Phase 1.3 yet.** The immediate task is context intake only.

The handover covers:
- Product and M1–M6 scope.
- Architecture and technology.
- Repository, Git branch and remotes.
- SQL Server connectivity and schema assessment.
- Source-only SQL Server compatibility remediation.
- Test evidence and its limitations.
- Outstanding work and proposed roadmap.
- Mandatory operating and safety rules.

## 2. Project overview

HSWRMS is a hospitality/resort management system organized into modules M1–M6. The repository contains a Java Spring Boot backend, React/TypeScript frontend, SQL Server database scripts/migrations and project reports.

Module map from prior project context:
- **M1:** Identity, user/account, profile and health-profile/deletion-request-related functionality.
- **M2:** Retreat/resort booking, packages, villa inventory/categories, guest registration/check-in, booking policy and related booking workflows.
- **M3:** Spa management, treatment, therapist, treatment room, spa-session scheduling, recovery, reminders and dispatch.
- **M4:** F&B menu, dietary/ingredient information, meal orders and order execution.
- **M5:** Folio, invoice, payment, billing adjustments, credit notes and refund/settlement.
- **M6:** Governance/delegation and schema enhancements.

This is a high-level map, not a substitute for source-backed requirements. Codex must inspect actual code, UI, API, entities and project documentation before asserting detailed behavior.

## 3. Technology and architecture

### Backend
- Spring Boot 3.3.4
- Java 17
- Maven; wrapper `mvnw.cmd`
- Spring Data JPA / Hibernate 6
- SQL Server is the intended application database.
- H2 is used for some local/test scenarios.

### Frontend
- React
- Vite
- TypeScript

### Known repository paths
- Backend: `05_Development/backend`
- Frontend: `05_Development/frontend`
- Database migrations: `05_Development/database/migrations`
- Generated database artifacts: `05_Development/database/generated`
- Reports: `06_Reports`

Codex must verify versions and architecture from `pom.xml`, frontend `package.json`, source structure and project instructions.

## 4. Git repository and latest reported baseline

Repository:
`E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`

Branch:
`feature/hswrms-m1-m6-integration`

Remotes:
- `isp-origin` — GitLab: `https://gitlab.com/manhnc2/fal26-isp392-is2005-g1.git`
- `origin` — GitHub: `https://github.com/DZB1509/HSWRMS.git`

**Only use `isp-origin` for explicitly authorized pushes. Never push to `origin` unless the user separately authorizes it.**

### Latest reported Git state (31/10/2026)
- Local HEAD: `f6a4a48350eaf7e409feccd220b2869318538d2e`
- Reported GitLab tracking HEAD: same hash.
- Latest commit message: `fix(database): remediate SQL Server compatibility, M3 concurrency and M5 trigger reconciliation`
- Parent: `3ee06447bfc1c76757866d8dd12bcc21b591b801` (`fix function`)
- Previous baseline: `d7df3d4be03e9de50705f3c3e4b7be53b3a61903` (`fix(security): complete security lockdown and billing remediation`)
- Backup branch: `backup/pre-rebase-sqlserver-remediation-37119ca`
- Backup branch target: `37119ca1e2affb9d6cc72d8bdc8f658edb0137a5` (pre-rebase local commit).

These values are historical reported state. Verify with `git status`, `git branch -vv`, `git remote -v`, `git log`, `git rev-parse HEAD` and remote tracking refs.

### Rebase and remote contribution
Remote commit `3ee0644` was reported to change nine files, including backend security, retreat-package and spa-treatment code, `application-dev.yml`, package lock and frontend SpaManagementPage. The reported functional changes included `includeInactive` behavior for retreat packages and spa treatments.

The controlled rebase had one reported conflict: `application-dev.yml`. The resolution retained environment-variable-based database configuration while preserving other changes from `3ee0644`.

### Git safety
- Never force push or force-with-lease.
- Never use `git reset --hard`, `git clean`, destructive checkout/restore, or discard user work.
- Do not rebase, merge, amend or rewrite shared history unless explicitly authorized.
- Never use `git add .`; stage only explicitly approved paths.
- Inspect staged and unstaged changes before commit.
- Preserve untracked files and generated artifacts.
- If remote diverges or has new commits, stop and report.
- Do not push to GitHub `origin`.
- Do not claim Git status without command evidence.

## 5. SQL Server connectivity

Prior reported SQL Server details:
- Server: `MYLIFE-MYRULE-1`
- Database: `HSWRMS_TEST`
- Login: `hswrms_test_user`
- SQL Server version: `15.0.2130.3`
- Edition: Express Edition 64-bit
- Database state: ONLINE

Reported permissions for `hswrms_test_user`:
- CONNECT = 1
- db_datareader = 1
- db_datawriter = 0
- db_owner = 0
- VIEW DEFINITION = 0

The account was read-only and cannot be assumed to have DDL privileges. Do not grant permissions or try to elevate it.

### Externalized credentials
The SQL Server profiles were changed to use:
- `HSWRMS_DB_URL`
- `HSWRMS_DB_USERNAME`
- `HSWRMS_DB_PASSWORD`

A reported `application-dev.yml` resolution used this pattern:
```yaml
datasource:
  url: ${HSWRMS_DB_URL:jdbc:sqlserver://${DB_HOST:localhost}:${DB_PORT:1433};databaseName=${DB_NAME:HSWRMS_TEST};encrypt=true;trustServerCertificate=true;sendStringParametersAsUnicode=true}
  username: ${HSWRMS_DB_USERNAME:${DB_USERNAME:}}
  password: ${HSWRMS_DB_PASSWORD:${DB_PASSWORD:}}
```
Verify actual current files and profile hierarchy. Never hardcode credentials or ask the user to paste passwords.

### Actual JDBC smoke-test evidence
A prior actual Spring Boot JDBC smoke test was reported successful:
- Spring Boot 3.3.4 / Java 17.0.12.
- Active profile `sqlserver-test`.
- Hikari pool `HSWRMS-SqlServerTestPool` started.
- JDBC connection established.
- `SqlServerJdbcSmokeTest`: 1 passed, 0 failures/errors/skips.
- `BUILD SUCCESS`.

This proves connectivity for that test execution only. It does not prove full schema compatibility, all application workflows or current Codex environment connectivity.

The previously successful PowerShell command was:
```powershell
.\mvnw.cmd test "-Dtest=SqlServerJdbcSmokeTest" "-Dspring.profiles.active=sqlserver-test" "-Dhswrms.sqlserver.test.enabled=true"
```
Environment variables were set locally by the user. Do not ask for passwords or expose secrets.

## 6. Prior SQL Server schema assessment

A prior read-only assessment reported the following database inventory:
- 42 tables
- 295 columns
- 56 foreign keys
- 103 index entries
- 49 check constraints
- 67 default constraints
- 3 triggers

Reported seed data:
- Role: 6
- Permission: 41
- RolePermission: 48
- SystemConfiguration: 6

The database was reported to be at an early baseline schema level (schema.sql / V001–V005 + V1_1 + initial M1/M6 drafts), with 15 subsequent migrations unapplied at that time.

### Reported missing schema
Seven missing entity tables:
- M2: `ResortZone`, `VillaFunctionalArea`
- M3: `PackageFnBEntitlement`, `SpaScheduleHistory`, `SpaDispatchOutbox`
- M5: `AdjustmentRequest`, `CreditNote`

Also reported:
- 19 missing mapped columns across 7 existing tables.
- Reminder fields in `SpaSession` addressed by prepared V008/V016 work.
- `HealthDataDeletionRequest.health_profile_id INT NOT NULL` legacy field was a blocker; a reviewed M1 migration was intended to replace it with `customer_profile_id` and other request fields.
- `CK_MealOrder_Status` did not include `SERVED`, while application code queried that status.
- Several Java `Long` fields mapped to SQL Server `INT` columns, creating Hibernate 6 validation concerns.

### Other reported risks
- `BookingPolicyService` used `param_key`/`param_value`, but actual `SystemConfiguration` columns were `configuration_key`/`configuration_value`.
- DB had `refund_percentage=80`; app fallback was reported as 100.
- `booking_hold_minutes` was absent at assessment time.
- Original `TR_FolioItem_RecalculateTotal` did not properly exclude void items/deduct adjustments.
- Original `TR_PaymentTransaction_RecalculateFolioPaid` omitted booking deposits from paid totals and could overwrite totals incorrectly.
- `TR_SpaSession_ValidateScheduling` could reject status updates after qualification/room mapping changes; checks needed to be scoped to active scheduling states.
- Pre-V014 `CK_Payment_Type` allowed DEPOSIT/FINAL; V014 was intended to update `FINAL_PAYMENT`.
- Ten migration scripts had hardcoded `USE [HSWRMS]`, risking execution against the wrong DB.
- Mapping duplication risks: `User` and `UserAccount` both map `dbo.User`; M2 `PaymentTransaction` and M5 `PaymentTransactionEntity` both map `dbo.PaymentTransaction`.
- M3 mutation paths depended on `SpaScheduleHistory` and `SpaDispatchOutbox`; outbox worker polls every 15 seconds.
- M5 checkout/payment queries referenced missing `CreditNote`.
- `VIEW DEFINITION=0` redacted some constraint/default/filter/trigger definitions.

All figures are historical. Fresh read-only verification is required before any migration planning.

## 7. Source-only SQL Server compatibility remediation

The remediation was committed and pushed in reported commit `f6a4a48...`, containing exactly 36 files:
- 32 modified tracked files.
- Four new approved files:
  1. `05_Development/backend/src/test/java/com/heavenstay/hswrms/config/SqlServerCompatibilityRemediationTest.java`
  2. `05_Development/database/migrations/V016__m3_spa_session_reminder_and_trigger_reconciliation.sql`
  3. `05_Development/database/migrations/V017__m5_folio_triggers_reconciliation.sql`
  4. `06_Reports/SQL_SERVER_COMPATIBILITY_REMEDIATION_REPORT.md`

### Remediation details reported

**Hibernate 6 INT mapping**
- Ten entity classes had Java `Long` values backed by SQL Server `INT`.
- Twenty scalar fields were annotated with `@JdbcTypeCode(SqlTypes.INTEGER)`.
- Eight association join columns target INT primary keys and were expected to inherit target JDBC type.
- Actual `BIGINT` fields were left unchanged, including `AuditLog.auditLogId`, `SpaScheduleHistory.historyId`, `SpaDispatchOutboxEntity.outboxId/historyId`.
- Assessment counted 50 actual `@Entity` classes; `RetreatPackageVillaCategory` was a `@JoinTable`, not an entity.

**BookingPolicyService**
- Query corrected to:
```sql
SELECT configuration_value
FROM dbo.SystemConfiguration
WHERE configuration_key = ?
  AND configuration_status = 'ACTIVE'
```
- Removed swallowed `DataAccessException` so schema errors fail fast.
- Missing/inactive rows may still use application-property fallback.

**M3 reminder/concurrency**
- `SpaSession.resetReminderState()` resets reminder to PENDING and clears claim/sent timestamps/tokens.
- `SpaSessionService.confirmReservation` takes a pessimistic lock on the excluded existing session and resets reminder state when rescheduling.
- `SessionRecoveryService.attemptSameTimeRecovery` discovers candidates without locks, then locks in order Therapist → TreatmentRoom → SpaSession, revalidates availability and resets reminder state.
- This was designed to avoid AB-BA lock inversion with `confirmReservation`.

**V016 prepared, NOT EXECUTED**
- File: `V016__m3_spa_session_reminder_and_trigger_reconciliation.sql`
- DB context guard rejects master/model/msdb/tempdb/non-HSWRMS database.
- Idempotently adds reminder columns such as `reminder_status`, claim/sent timestamps and `reminder_claim_token`.
- Backfills reminder status, adds check constraint/index.
- Reconciles `TR_SpaSession_ValidateScheduling` so qualification/room checks apply only in `SCHEDULED` and `RESCHEDULING`, based on `dbo.TherapistTreatmentQualification`.

**V017 prepared, NOT EXECUTED**
- File: `V017__m5_folio_triggers_reconciliation.sql`
- Context guard and V010 prerequisite verification.
- `TR_FolioItem_RecalculateTotal` excludes void items and deducts adjustments.
- `TR_PaymentTransaction_RecalculateFolioPaid` resolves affected folios via invoice and retreat booking, sums successful deposit/final payments, excludes pending/failed/cancelled/refunded and preserves CLOSED.
- Intended to be set-based and idempotent.
- H2 does not execute T-SQL trigger bodies; static SQL tests do not prove real trigger behavior.

**Migration context safety**
- Hardcoded `USE [HSWRMS]` was removed from 12 migration scripts (10 active + 2 draft/reviewed), replaced by `DB_NAME()` guards.
- No migration was executed during this remediation.

## 8. Previous proposed migration order — NOT APPROVED

The earlier remediation report proposed:
1. `_draft_m1_identity_health_profile.sql`
2. `_reviewed_m1_health_profile_structured.sql`
3. `_reviewed_m1_deletion_request_customer_profile.sql`
4. `V1_1__m6_schema_enhancements.sql`
5. `draft_m6_governance_and_delegation.sql`
6. `V1_2__villa_inventory.sql`
7. `V002__m2_retreat_package_enhancements.sql`
8. `V003__m2_villa_category_enhancements.sql`
9. `V004__m2_booking_checkin_guest_registration.sql`
10. `V005__m2_package_fnb_entitlement.sql`
11. `V1_3__spa_retreat_schema.sql`
12. `V1_4__spa_packages_v3_standardization.sql`
13. `V1_5__remove_duration_unit_from_spa_treatment.sql`
14. `V008__m3_spa_session_reminder_claim_token.sql`
15. `V011__m3_spa_schedule_history.sql`
16. `V012__m3_spa_dispatch_outbox.sql`
17. `V015__m3_reconcile_spa_session_identifier_types.sql`
18. `V016__m3_spa_session_reminder_and_trigger_reconciliation.sql`
19. `V006__m4_fnb_menu_dietary_ingredients.sql`
20. `V007__m4_meal_order_execution_columns.sql`
21. `V009__m5_folio_invoice_payment_enhancements.sql`
22. `V010__m5_billing_adjustments_and_credit_notes.sql`
23. `V013__m5_credit_note_refund_settlement.sql`
24. `V014__m5_payment_transaction_vietqr_and_types.sql`
25. `V017__m5_folio_triggers_reconciliation.sql`
26. `V1_6__consolidate_fnb_role.sql` (optional data/role maintenance)
27. `V1_6__repair_mojibake_and_booking_consistency.sql` (optional data repair)

**This sequence is only a proposal and must not be executed as-is.** Two files share V1_6 naming; draft/reviewed scripts may overlap; optional data repair should be separated from required schema changes. Codex must independently verify dependencies, preconditions, idempotency, data impact, DB context and rollback.

## 9. Post-rebase test evidence

The user supplied a report that three selected test groups passed after rebase:

### SQL Server compatibility/validator
```powershell
.\mvnw.cmd test "-Dtest=SqlServerTestConfigValidatorTest,SqlServerJdbcSmokeTestOptInBehaviorTest,SqlServerCompatibilityRemediationTest"
```
- Validator: 94 passed
- JDBC smoke opt-in behavior: 3 passed
- Compatibility remediation: 5 passed
- Total: **102 passed, 0 failures, 0 errors**, BUILD SUCCESS.

### M2/M3 regression
```powershell
.\mvnw.cmd test "-Dtest=SpaAuthoritativeAcceptanceEvidenceTest,SpaRecoverySchedulerTest,SpaScheduleHistoryTest,SpaSecurityTests,TherapistRecoveryOrchestrationTest,M2SchemaCompatibilityTest,ReceptionistOperationServiceTest,RetreatBookingSecurityTest,RetreatBookingServiceAuthorizationTest,VNPayDepositServiceTest"
```
- `SpaAuthoritativeAcceptanceEvidenceTest`: 49
- `SpaRecoverySchedulerTest`: 3
- `SpaScheduleHistoryTest`: 3
- `SpaSecurityTests`: 5
- `TherapistRecoveryOrchestrationTest`: 3
- `M2SchemaCompatibilityTest`: 6
- `ReceptionistOperationServiceTest`: 5
- `RetreatBookingSecurityTest`: 17
- `RetreatBookingServiceAuthorizationTest`: 9
- `VNPayDepositServiceTest`: 4
- Total: **104 passed, 0 failures, 0 errors**, BUILD SUCCESS.

### Tests for remote commit changes
```powershell
.\mvnw.cmd test "-Dtest=RetreatBookingServiceTest,SpaServiceTests"
```
- `RetreatBookingServiceTest`: 5
- `SpaServiceTests`: 29
- Total: **34 passed, 0 failures, 0 errors**, BUILD SUCCESS.

### Combined interpretation
240 test executions passed across these three selected post-rebase runs. This is not the entire project test suite. Keep distinct:
- H2 unit/integration tests.
- SQL Server JDBC connectivity.
- Static migration/SQL structure tests.
- Actual SQL Server schema validation.
- Actual SQL Server trigger execution.
- Browser end-to-end tests.

Do not claim full M1–M6 completion from these test results.

## 10. Untracked artifacts to preserve

Five untracked paths were reported after the push:
1. `05_Development/database/generated/`
2. `06_Reports/SQL_SERVER_CONNECTIVITY_BASELINE_REPORT.md`
3. `06_Reports/SQL_SERVER_SCHEMA_COMPATIBILITY_ASSESSMENT.md`
4. `06_Reports/audit-output/backup_targeted_correction_20261029/`
5. `06_Reports/visual-evidence/`

Preserve these. Do not delete, overwrite, stage or commit without explicit authorization. Verify they still exist.

## 11. Incomplete work and blockers

### SQL Server/database
- Prior assessment reported 7 missing tables and 19 missing columns.
- `hswrms_test_user` was read-only and lacked DDL/data-writer privileges.
- No V016/V017 migration was reported executed.
- Migration order has not been approved.
- Draft/reviewed and duplicate V1_6 scripts need disposition.
- `HealthDataDeletionRequest` legacy required column and `CK_MealOrder_Status` need fresh verification.

### M3
- Prior acceptance status: 11 PASS / 3 PARTIAL.
- BR-M3-10 remained PARTIAL pending actual SMTP and Google Calendar verification.
- Do not call M3 complete until external integrations and acceptance evidence are verified.

### M4/M5
- F&B `SERVED` status and constraints need database verification.
- Folio/payment totals, adjustments and credit-note flows need SQL Server integration validation.
- V017 trigger behavior needs actual SQL Server verification after separately approved migration.

### Whole system
- Full-system M1–M6 integration and browser E2E have not been established by the evidence in this handover.
- Production readiness has not been established.

## 12. Proposed roadmap (not authorization)

### Phase 1.3 — SQL Server Migration Readiness Review
Read-only assessment:
- Verify Git and working tree.
- Reassess live `HSWRMS_TEST` schema.
- Inventory all migration scripts and classify active/draft/reviewed/optional.
- Validate dependency order.
- Analyze data loss, idempotency and context guards.
- Verify privileges and backup/restore prerequisites.
- Produce `06_Reports/PHASE_1.3_SQL_SERVER_MIGRATION_READINESS_REPORT.md`.
- Give GO / CONDITIONAL GO / NO-GO.
- **Do not execute migrations in this phase.**

### Phase 1.4 — M3 completion
Complete remaining M3 partial criteria, especially real SMTP and Google Calendar verification, then validate scheduling/recovery/reminder/outbox behavior against SQL Server.

### Phase 1.5 — M4/M5 SQL Server integration
Validate F&B order lifecycle, Folio, Invoice, Payment, Adjustment, CreditNote and V017 trigger behavior on SQL Server after approved migrations.

### Phase 1.6 — Full-system verification
Cross-module M1–M6 integration, API and browser E2E where applicable, security/authorization, data integrity, regression and release-readiness evidence.

All future database writes, migrations, source changes, commits and pushes require explicit user authorization.

## 13. Mandatory Codex operating rules

### Evidence and scope
- Inspect before modifying.
- Separate confirmed facts, historical reports, assumptions and recommendations.
- Do not invent APIs, files, requirements, schema or test outcomes.
- Do not broaden scope without asking.
- Avoid repeated full audits and redundant test runs.
- Report exact commands, counts, skips, failures and build result.
- Be clear about what was and was not verified.

### Database safety
- Treat physical databases `HSWRMS` and `HSWRMS_TEST` as protected.
- No DDL/DML, migrations, seed scripts, trigger changes, permission changes or destructive actions without task-specific explicit authorization.
- Read-only metadata inspection only when authorized and safely configured.
- Never expose credentials or request passwords in chat.
- Never assume a migration targets the intended database.
- Require verified backup and restore plan before any future authorized migration.
- Do not grant permissions.

### Git safety
- No force push.
- No destructive reset/clean.
- Do not push to `origin`.
- Do not stage all files.
- Preserve backup branch and untracked artifacts.
- Stop on unexpected remote divergence.
- Require explicit authorization for commit/push.

### Test semantics
- H2 success is not SQL Server schema proof.
- JDBC connection is not schema validation.
- Static T-SQL checks are not trigger execution proof.
- API wiring is not browser E2E proof.
- Do not mark M3 complete without SMTP/Calendar evidence.

## 14. Codex first-session checklist

Before project work:
1. Confirm repository path is accessible in the current Codex environment.
2. Verify branch, HEAD, upstream, remotes and working tree.
3. Check whether HEAD equals expected `f6a4a48...`; if not, stop and report.
4. Verify backup branch points to `37119ca...`.
5. Verify the five untracked artifact paths and preserve them.
6. Read `AGENTS.md` and other repository instructions.
7. Verify key reports and migration files exist.
8. Summarize M1–M6 from repository evidence.
9. Separate current facts from historical context.
10. State explicitly that Phase 1.3 has NOT started.
11. Wait for user approval.

## 15. Explicit status at handover

According to the latest user-provided report:
- Remediation commit `f6a4a48...` was pushed successfully to GitLab `isp-origin`.
- Local and remote HEADs were reported identical.
- The controlled rebase preserved both the other member's `3ee0644` commit and the remediation commit.
- Three selected post-rebase test groups reported 240/240 passing executions.
- A prior actual Spring Boot JDBC smoke test connected to SQL Server.
- Source-only remediation and V016/V017 migration files were committed.
- **No physical SQL Server migration, including V016 or V017, was executed.**
- **Phase 1.3 has NOT been started.**
- This handover does not authorize database writes, migrations, source edits, commits or pushes.

---
**End of handover.**
