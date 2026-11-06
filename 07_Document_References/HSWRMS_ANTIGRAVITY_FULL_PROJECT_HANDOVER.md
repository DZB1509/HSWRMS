# HSWRMS --- FULL PROJECT HANDOVER FOR ANTIGRAVITY

**Purpose:** Transfer the current HSWRMS project context from the
ChatGPT/Codex workflow to Antigravity before further implementation.
**Date:** 01 November 2026 **Repository:**
`E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`
**Latest reported branch:** `feature/hswrms-m1-m6-integration` **Latest
reported HEAD:** `fcd628eb32679f75fef385f1f656a07c83f1a5aa` **Immediate
status:** Context intake only. No implementation is authorized.

> This handover consolidates user-provided reports and prior
> conversation context. It is not proof of the live workspace state.
> Antigravity must verify repository facts read-only and distinguish
> fresh evidence from historical reports.

## 1. First-use instruction

Read this entire file and the current repository report
`06_Reports/M3_COMPLETE_GAP_CLOSURE_IMPLEMENTATION_REPORT.md`. Then
perform **read-only context intake only**, produce an evidence-based
intake report, and wait for the user's next instruction.

Do not edit, repair, refactor, optimize, migrate, stage, commit, push,
fetch, merge, rebase, reset, clean, run tests, start the application, or
connect to external services during intake.

The user has not yet selected the next implementation phase. Do not
assume it is M3, SQL Server migration, or any particular module.

## 2. Product and module map

HSWRMS is a hospitality/resort management system with Java Spring Boot
backend, React/TypeScript frontend, SQL Server database
scripts/migrations and project reports.

High-level module map (verify actual ownership from source and
requirements): - **M1:** Identity, user/account, profile, health
profile, consent and deletion-request-related functionality. - **M2:**
Retreat/resort booking, packages, villa inventory/categories, guest
registration/check-in, booking policy and related workflows. - **M3:**
Spa management, treatments, therapists, treatment rooms, session
scheduling, recovery, reminders, dispatch and schedule history. -
**M4:** F&B menu, dietary/ingredient information, meal orders and order
execution. - **M5:** Folio, invoice, payment, billing adjustments,
credit notes, refunds and settlement. - **M6:** Governance/delegation
and schema enhancements.

This is a navigation map, not a substitute for source-backed
requirements. Do not invent behavior or module ownership.

## 3. Technology and repository layout

Previously reported stack: - Backend: Java 17, Spring Boot 3.3.4, Maven
wrapper, Spring Data JPA/Hibernate 6. - Frontend: React, Vite,
TypeScript. - Intended runtime database: Microsoft SQL Server. - H2:
used for automated unit/integration tests; H2 success does not prove SQL
Server compatibility.

Known paths: - Backend: `05_Development/backend` - Frontend:
`05_Development/frontend` - Database: `05_Development/database` -
Reports: `06_Reports` - Decisions:
`05_Development/docs/PROJECT_DECISIONS.md`

Verify current versions and structure from `pom.xml`, `package.json`,
source tree and repository instructions.

## 4. Current Git baseline and preservation requirements

Repository:
`E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`

Latest reported branch: `feature/hswrms-m1-m6-integration`

Latest reported HEAD: `fcd628eb32679f75fef385f1f656a07c83f1a5aa`

Remotes: - `isp-origin` --- GitLab:
`https://gitlab.com/manhnc2/fal26-isp392-is2005-g1.git` - `origin` ---
GitHub. **Never push to or contact this remote.**

An earlier Codex handover dated 31 October reported an older HEAD
`f6a4a48...`; this is stale. The later controlled GitLab integration
brought the reported Local branch and `isp-origin` tracking ref to
`fcd628e...`. No push was made during that integration and GitHub
`origin` was not contacted. The working tree remained dirty with
preserved modifications and untracked files.

**Verify current state locally. Do not repair discrepancies. If branch
or HEAD differs from the latest reported baseline, stop and report. Do
not contact either remote during intake.**

Preservation assets reported: - Stash
`b3e223508fb6e242a2827af7d4f994d557e5a052` - Stash
`250dc3d82c53d7cf482cb731da5a1fcb7cd2b4a8` - Recovery snapshot:
`E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-original-recovery-snapshot-20261101` -
Phase 5.8.19 checkpoint:
`E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-phase-5.8.19-pretest-checkpoint-20261101` -
Phase 5.8.20 checkpoint:
`E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-phase-5.8.20-pretest-checkpoint-20261101`

Do not delete, overwrite, move, apply or drop any preservation asset. Do
not run stash pop/drop/clear.

### Git safety rules

-   No fetch, pull, merge, rebase, cherry-pick, reset, clean, amend or
    history rewrite during intake.
-   Never use `git reset --hard`, `git clean`, destructive
    checkout/restore or force push.
-   Never use `git add .`; do not stage anything.
-   Preserve modified, untracked and ignored files.
-   Do not alter remotes, branches, upstreams or Git configuration.
-   Do not claim a clean tree or synchronized remote without evidence.
-   Future publication, if explicitly authorized, is only to
    `isp-origin`.

## 5. Latest M3 implementation state

Latest supplied report:
`06_Reports/M3_COMPLETE_GAP_CLOSURE_IMPLEMENTATION_REPORT.md`

The report was supplied on 01 November 2026. Its overall conclusion is
**M3 PARTIAL**.

### 5.1 Stage A --- transaction-safe outbox

Reported: - `SpaScheduleAuditEventListener` persists schedule history
and outbox entries in the business transaction; it no longer
synchronously dispatches external work inside that transaction. - Worker
handles committed outbox entries. - Missing providers do not become
`SENT`; outcomes are recorded as suppressed or failed according to
worker policy. - Tests cover transaction boundaries, rollback preventing
dispatch, post-commit worker processing and provider outcomes. -
Schedule history tests inspect Calendar state after worker processing.

Do not reintroduce synchronous external dispatch inside the business
transaction.

### 5.2 Stage B --- BR-M3-10 timeline and decline

Reported: - Four independent reminder checkpoints enqueue idempotent
work: - T-24h information reminder. - T-2h confirmation request. - T-75m
final confirmation reminder. - T-15m upcoming reminder. - Idempotency
includes session, schedule version and checkpoint. - T-60m confirmation
deadline processing expires confirmation and starts recovery. - Stale
schedule versions are suppressed. - Claim-token fencing and claim expiry
remain in use. - Customer decline is distinct from cancellation: records
`DECLINED`, moves session to `RESCHEDULING`, and does not silently
change the appointment. A time change still requires Customer consent.

BR-M3-10 remains **PARTIAL overall** because live email delivery and SQL
Server runtime behavior remain unverified.

### 5.3 Stage C --- BR-M3-13 recovery

Reported: - Confirmation expiry, approved Customer decline and Therapist
unavailability use existing
`SessionRecoveryService.attemptSameTimeRecovery`. - Existing same-time
replacement algorithm and resource revalidation were preserved. - A
concurrency test exposed competing transactions incrementing schedule
version twice. A stale-recovery guard now re-checks expected version,
original Therapist and room, active status and interval before applying
recovery. - Competing stale triggers should not cause a second schedule
change. - Cross-Customer slot swaps requiring mutual consent remain
outside this implementation.

BR-M3-13 remains **PARTIAL overall** because SQL Server locking behavior
and mutual-consent cross-Customer swaps are not verified/implemented.

### 5.4 Stage D --- BR-M3-14 and OI-02

The user selected OI-02 Option B. A dated addendum was recorded in
`05_Development/docs/PROJECT_DECISIONS.md`.

Approved project-level policy: - Five total attempts, including the
initial attempt. - Delays after retryable failures: 30 seconds, 1
minute, 2 minutes, 4 minutes. - Terminal failure after the fifth
retryable failure. - Permanent configuration/authentication failures
must not retry indefinitely. - Retain the same idempotency key across
retries. - Centralize retry configuration. - Provider ambiguity must be
handled according to provider limitations.

Reported implementation: - Centralized `SpaOutboxProperties`. - Typed
outcomes distinguish accepted, retryable, permanent, ambiguous and
suppressed. - Ambiguous SMTP outcomes are not blindly resent. -
Exactly-once delivery is not claimed. - Deterministic Calendar identity:
`hswrms-spa-{sessionId}`. - No authenticated Google Calendar API client
exists. Calendar adapter does not create/update/cancel live events;
enabled-without-client reports permanent configuration failure, disabled
operation is suppressed. - SMTP outcome policy is unit-tested; no live
SMTP send occurred.

BR-M3-14 remains **PARTIAL** because SMTP was not tested against a live
server and live Calendar create/update/cancel is unavailable.

### 5.5 M3 database impact

Reported: - `05_Development/database/schema.sql` clean-install baseline
includes outbox schedule-version/retry-state fields. -
`05_Development/database/migrations/V019__m3_timeline_outbox_versioning_and_retry_state.sql`
adds the upgrade path. - V019 was inspected as source only and **was not
executed**. - No database was created, restored or changed during the
reported implementation. - Tests used isolated H2
(`jdbc:h2:mem:testdb`). - SQL Server opt-in tests were among the skipped
tests.

Do not execute V019 or any migration without separate, explicit,
task-specific authorization and verified safeguards.

### 5.6 Reported validation

Focused outbox/timeline/provider suite: 80 tests passed, no
failures/errors/skips.

Recovery concurrency/orchestration suite: 11 tests passed, no
failures/errors/skips.

Complete M3 inventory across two commands: **129 passed, 0 failures, 0
errors, 0 skipped**.

Full backend: `.\mvnw.cmd test` Reported: **770 tests, 0 failures, 0
errors, 10 skipped; BUILD SUCCESS; 3:10 elapsed**.

Tests used H2. These are supplied report results, not fresh Antigravity
executions. Keep H2 evidence distinct from SQL Server validation, live
provider delivery and browser E2E.

## 6. Unresolved decisions and ownership boundaries

-   **OI-01:** M3/M4 to M5 Folio charge posting ownership/write path
    remains unresolved. Do not invent module ownership, API or
    transaction boundary.
-   **OI-03:** Bell/Push notification scope remains unresolved. Do not
    assume push, browser, mobile or in-app behavior.
-   **Cross-Customer recovery swaps:** mutual consent is required; this
    workflow is not implemented by the reported M3 work. Do not silently
    enable it.

## 7. Earlier M2 and integration work to preserve

### Phase 5.8.19 --- controlled GitLab integration

Reported: - Three GitLab commits integrated by fast-forward; Local HEAD
and `isp-origin` tracking reached `fcd628e...`. - No content
conflicts. - No push; GitHub `origin` not contacted. - Existing Local
modifications and untracked files preserved. - Stashes and recovery
snapshot preserved. - Backend focused H2 tests, frontend TypeScript
check and build passed at that phase. - Frontend API tests were
initially unavailable before later test-runner work. - SQL Server not
validated.

### Phase 5.8.20 --- M2 post-merge gap closure

Reported: - Fail-closed actor attribution implemented in
`VillaInventoryController` and `ReceptionistOperationController`; no
fallback actor IDs 1 or 2. - Focused backend H2 tests: 58/58. - Added
`V018__m2_add_villa_pricing_columns.sql`, additive nullable pricing
columns; not executed. - Added `tsx` and `npm run test:m6-api`; frontend
API tests 117/117. - TypeScript and build passed; lint had 12 existing
warnings and bundle-size warning. - `npm install` reported one high
severity audit finding; investigation status not established here. - No
M3 application/migration files changed in that phase. - No
stage/commit/push/fetch. - V018 must not be assumed deployment-ready.

## 8. Earlier SQL Server context --- historical, not current proof

An older Codex handover reported: - SQL Server instance
`MYLIFE-MYRULE-1`, database `HSWRMS_TEST`. - Login `hswrms_test_user`
was read-only (CONNECT and db_datareader; no db_datawriter/db_owner/VIEW
DEFINITION). - A previous Spring Boot JDBC smoke test connected
successfully at that time. - Historical schema assessment identified
missing tables/columns and SQL Server compatibility risks. - V016 and
V017 were prepared source migrations but not executed at that time. -
V018 later added M2 pricing columns; V019 later added M3 outbox fields.

All details are historical until freshly verified. Do not connect to SQL
Server during intake. Do not request or expose credentials.

## 9. Known limitations

According to the latest supplied report: - M3 remains PARTIAL. - No SQL
Server schema/runtime/locking verification for the new M3 work. - V019
not executed. - No live SMTP send. - No authenticated Google Calendar
API client/live Calendar operation. - OI-01 and OI-03 unresolved. -
Mutual-consent cross-Customer recovery swap not implemented. - M3 tests
do not establish production readiness or full M1--M6 integration.

Earlier whole-project limitations, subject to fresh verification: -
M4/M5 SQL Server integration and trigger behavior need validation. -
Full-system M1--M6 integration and browser E2E have not been established
by prior evidence. - Earlier SQL Server migration ordering was a
proposal, not approved.

## 10. Mandatory operating principles

1.  Inspect before changing; identify real code paths, contracts, data
    ownership and tests.
2.  Preserve existing behavior and algorithms unless evidence and
    explicit scope justify change.
3.  Separate verified facts, supplied report claims, historical
    findings, assumptions and recommendations.
4.  Make minimal, scoped changes only after the user authorizes a
    specific task.
5.  Do not invent requirements or resolve OI-01/OI-03 by guess.
6.  H2 success is not SQL Server proof; static T-SQL inspection is not
    execution; adapter tests are not live delivery; API tests are not
    browser E2E.
7.  Enforce customer ownership and consent. Never introduce
    cross-customer fallback behavior.
8.  Never mark external work SENT/success without provider acceptance
    evidence. Do not blindly retry ambiguous non-idempotent operations.
9.  No hardcoded credentials, secret output or requests for passwords in
    chat.
10. Preserve modified, untracked and ignored files; no cleanup.
11. No stage/commit/push without explicit authorization. If later
    authorized, only `isp-origin`.
12. No database DDL/DML, migration, seed, trigger or permission change
    without explicit task-specific authorization.
13. Avoid redundant full audits and unnecessary test runs; conserve
    execution quota.
14. Report exact commands, test counts, skips, failures, changed files
    and unverified areas.

## 11. Required Antigravity intake report

Antigravity must report:

### A. Workspace and Git state

Repository accessibility, branch, HEAD, upstream, remotes,
staged/unstaged/untracked status, match with latest reported baseline,
stash and recovery snapshot presence. Do not contact remotes.

### B. Project structure and M1--M6

Summarize module responsibilities from actual repository evidence,
architecture and integration boundaries. Cite paths.

### C. M3 implementation

Explain outbox transaction boundary, reminder checkpoints, T-60
deadline, decline/recovery behavior, OI-02 policy, provider outcomes,
Calendar/SMTP limitations and V019/schema status.

### D. Decisions and unresolved items

OI-01, OI-03 and cross-Customer mutual-consent recovery status.

### E. Evidence classification

Label key claims: - **Verified now** --- fresh read-only
repository/command evidence. - **Supplied report** --- user-provided
report claim not freshly reproduced. - **Historical** --- older evidence
that may no longer apply. - **Unknown / needs authorization** --- not
verified.

### F. Risks and possible next-step candidates

Evidence-backed candidates only. Do not select or start one for the
user.

### G. Explicit status

State: **CONTEXT INTAKE ONLY --- NO IMPLEMENTATION STARTED.** Then wait
for the user's next instruction.

------------------------------------------------------------------------

**End of handover.**
