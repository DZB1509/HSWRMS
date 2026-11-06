# 0# HSWRMS Project Context

# 

# Project: \*\*HeavenStay Wellness Resort Management System (HSWRMS)\*\*

# 

# This repository is now in the \*\*full-stack implementation and integration phase\*\*.

# 

# The old front-end prototype is no longer the active implementation target. Production-oriented development must happen under `05\_Development/` and must follow the approved requirements, architecture, business rules, planning tasks, and module boundaries.

# 

# \---

# 

# \## 1. Source Precedence

# 

# When project sources conflict, use this precedence:

# 

# 1\. Explicit approved decisions in the current implementation prompt

# 2\. Latest approved SRS and unresolved Open Items

# 3\. `05\_Development/docs/PROJECT\_DECISIONS.md`

# 4\. Approved ERD / Microsoft SQL Server database model

# 5\. Screen Inventory / Use Cases / Business Flows

# 6\. Current planning files in `01\_Planning/`

# 7\. Design documentation in `03\_Design/`

# 8\. Existing rendered prototype in `04\_Implement/Frontend\_Prototype/`

# 9\. Legacy mock data, comments, obsolete implementation artifacts, or stale generated code

# 

# Do \*\*not\*\* silently resolve conflicts. If two approved sources disagree and the precedence above does not clearly resolve the issue, report the mismatch and keep the affected implementation `PARTIAL` or `BLOCKED` as appropriate.

# 

# \---

# 

# \## 2. Primary Requirement Sources

# 

# Read and respect the relevant project requirement sources before implementing a module or business flow:

# 

# \- `02\_Requirement/SRS/HSWRMS\_ISP392\_G1\_SRS.pdf`

# \- `02\_Requirement/SRS/HSWRMS\_ISP392\_G1\_SRS.docx`

# \- `02\_Requirement/Project\_Specification/HSWRMS\_ISP392\_Project\_Specification.md`

# \- `02\_Requirement/Screen\_Inventory/Screen\_List.md`

# 

# Do not modify files under `02\_Requirement/` during normal implementation unless the current prompt explicitly requests a requirements update.

# 

# \---

# 

# \## 3. Planning Files

# 

# Current implementation planning files:

# 

# \- `01\_Planning/Task\_Project\_G1\_IS2005.xlsx`

# \- `01\_Planning/Task\_Project\_G1\_IS2005.csv`

# 

# Interpretation:

# 

# \- XLSX is the human-maintained \*\*master planning workbook\*\*.

# \- CSV is the machine-readable companion/export for easier parsing.

# \- Read CSV using UTF-8.

# \- If Vietnamese names or notes in CSV appear corrupted/mojibake, do not guess. Use the XLSX copy for PIC, Support, Notes, and Vietnamese text.

# 

# Planning files describe:

# 

# \- Week / implementation phase

# \- Task ID and task name

# \- PIC / Support

# \- Complexity

# \- planned dates

# \- Status

# \- planning notes

# 

# Planning files describe \*\*WHEN / WHO / planned scope\*\*. They are \*\*not\*\* authoritative for unresolved business rules.

# 

# If planning wording conflicts with approved requirements or project decisions, follow the approved source precedence and report the planning mismatch.

# 

# Do not modify `01\_Planning/` during module implementation unless explicitly instructed.

# 

# \---

# 

# \## 4. UI/UX Source of Truth

# 

# Primary UI/UX reference:

# 

# \- `03\_Design/UI\_UX/HSWRMS\_DESIGN.md`

# 

# Use the design source for layout, visual language, interaction patterns, and role-specific presentation.

# 

# Do not modify files under `03\_Design/` during normal development unless explicitly requested.

# 

# \---

# 

# \## 5. Prototype Reference

# 

# Legacy high-fidelity prototype:

# 

# \- `04\_Implement/Frontend\_Prototype/`

# 

# The prototype is \*\*reference-only\*\* for screen coverage, visual intent, interaction ideas, and existing mock states.

# 

# Rules:

# 

# \- Do not treat mock data as production business truth.

# \- Do not treat prototype-only logic as authoritative backend logic.

# \- Do not continue production development inside `04\_Implement/Frontend\_Prototype/`.

# \- Do not modify the prototype during normal implementation unless explicitly requested.

# 

# \---

# 

# \## 6. Production Implementation Location

# 

# All active application development must be created or updated under:

# 

# \- `05\_Development/backend/`

# \- `05\_Development/frontend/`

# \- `05\_Development/database/`

# \- `05\_Development/docs/`

# 

# Production implementation stack:

# 

# \### Backend

# 

# \- Java 17

# \- Spring Boot

# \- Spring MVC REST

# \- Spring Data JPA / Hibernate

# \- Spring Security / JWT

# \- Maven Wrapper (`mvnw.cmd` on Windows)

# 

# \### Frontend

# 

# \- React

# \- TypeScript

# \- Vite

# 

# \### Database

# 

# \- Microsoft SQL Server

# 

# Use the existing team foundation and modular package structure. Do not redesign the foundation unless explicitly requested.

# 

# \---

# 

# \## 7. Module Boundaries

# 

# HSWRMS modules:

# 

# \- \*\*M1\*\* — Authentication \& Sensitive Health Profile

# \- \*\*M2\*\* — Retreat Package \& Accommodation Booking

# \- \*\*M3\*\* — Spa \& Therapy Scheduling

# \- \*\*M4\*\* — Dietary F\&B Management

# \- \*\*M5\*\* — Consolidated Checkout \& Analytics

# \- \*\*M6\*\* — System Administration \& Permission Management

# 

# Respect module ownership.

# 

# When another module is incomplete:

# 

# \- use a clean replaceable port/interface where appropriate;

# \- fail closed when production data or authorization is required;

# \- keep test doubles under test scope only;

# \- do not fabricate production Customer, booking, allowance, health, payment, or billing data;

# \- mark the integration `PARTIAL` instead of claiming completion.

# 

# Do not implement another module merely to make the current module appear complete unless the current prompt explicitly authorizes that scope.

# 

# \---

# 

# \## 8. Current Development Workflow

# 

# For every implementation task:

# 

# 1\. Inspect the actual working tree first (`git status`, relevant diffs, existing code).

# 2\. Read the relevant requirement, decisions, planning task, and current implementation status.

# 3\. Identify the matching Module / Week / Task ID(s).

# 4\. Implement only the requested scope.

# 5\. Preserve unresolved Open Items instead of inventing policy.

# 6\. Add or update automated tests for changed business behavior.

# 7\. Run the applicable backend and frontend quality gates.

# 8\. Report what is `IMPLEMENTED`, `PARTIAL`, `BLOCKED`, or intentionally not started.

# 9\. Do not commit or push unless the user explicitly requests it.

# 

# Do not trust an earlier AI implementation report blindly. Verify actual source code, configuration, database scripts, and tests.

# 

# \---

# 

# \## 9. Mandatory Project-Wide Rules

# 

# \- Use the project name \*\*HSWRMS\*\* consistently.

# \- Use the term \*\*Customer\*\* consistently instead of Guest for the authenticated customer role/domain terminology.

# \- Follow `Screen\_List.md` for official screen scope.

# \- Do not invent business rules that are not approved.

# \- Keep backend authorization authoritative; frontend guards are not sufficient security.

# \- Respect role-based access control and least privilege.

# \- Respect sensitive-data minimization.

# \- Therapist sees only treatment-relevant health/safety information.

# \- F\&B Staff/Chef sees only relevant allergy/dietary information.

# \- Receptionist must not have unrestricted access to sensitive health information.

# \- Manager is not equivalent to full Admin.

# \- Feature flags must not bypass RBAC, audit requirements, payment guards, or checkout guards.

# \- Review \& Rating is optional and only available for an eligible completed stay/booking.

# 

# \---

# 

# \## 10. M3 Spa Scheduling Invariants

# 

# When working on M3, preserve these approved rules:

# 

# \- Scheduling is \*\*system-driven\*\*.

# \- Customer/Receptionist selects treatment plus preferred date/time or time range and optional flexibility/note.

# \- Customer/Receptionist must not independently choose Therapist or Treatment Room as separate booking resources.

# \- A scheduling candidate is an indivisible bundle:

# &#x20; - Time Slot

# &#x20; - Qualified Therapist/Instructor

# &#x20; - Compatible Treatment Room

# \- Candidate generation does not reserve resources.

# \- Final reservation must revalidate and reserve atomically.

# \- Resource conflict must not create partial reservations.

# \- Existing Customer session remains valid while the Customer browses reschedule candidates; replacement becomes effective only after a successful transactional replacement.

# \- Same-time recovery should preserve the original time where possible by replacing Therapist and/or Room.

# \- A recovery that changes time requires Customer consent.

# \- Do not auto-swap another Customer's slot without the required consent workflow.

# \- Do not invent a fixed alternative-search count/horizon or operating-hour rule unless it is explicitly approved/configured.

# 

# M3 lifecycle rules:

# 

# \- Session statuses: `SCHEDULED`, `RESCHEDULING`, `CANCELLED`, `COMPLETED`, `NO\_SHOW`

# \- Confirmation statuses: `PENDING`, `CONFIRMED`, `DECLINED`, `EXPIRED`

# \- Do not introduce `CUSTOMER\_CONFIRMED` as a session status.

# \- Do not persist `IN\_PROGRESS` unless explicitly approved in a future decision.

# 

# Notification timeline must follow approved M3 decisions. Email is the mandatory approved channel; do not claim real email delivery when only logging/abstraction exists.

# 

# \---

# 

# \## 11. Cross-Module Business Invariants

# 

# \### M1 / Sensitive Health Data

# 

# \- Keep identity/authentication, customer profile, and health profile concerns separated.

# \- Consent must be explicit where required.

# \- Health-data deletion may need to remain pending/deferred while an active/upcoming stay still requires the data.

# \- Do not invent deletion grace periods.

# 

# \### M2 / Booking \& Accommodation

# 

# \- Retreat Booking is the stay anchor.

# \- Villa Category is not the same as a Physical Villa.

# \- Resource allocation/concurrency must be enforced by backend logic.

# 

# \### M4 / F\&B

# 

# \- Do not create a separate Allergy entity if the approved model stores allergy/diet data in the health profile.

# \- Ingredient availability must respect usable quantity, expiry, and condition.

# \- Reserve/deduct inventory when an order enters the approved preparation state; do not invent an earlier deduction policy.

# 

# \### M5 / Checkout \& Payment

# 

# \- Folio is a mutable running stay account; Invoice is a formal snapshot.

# \- Payment success is \*\*not\*\* the same as checkout completion.

# \- Checkout cannot complete while unresolved/unpaid Spa or F\&B charges remain.

# \- VNPay callback handling must be idempotent.

# \- Do not confuse payment type with payment method.

# 

# \### M6 / Administration

# 

# \- RBAC must be enforced by backend authorization.

# \- Role/permission relationships must be explicit.

# \- Rights delegation to Manager must be scoped, temporary/time-bounded where required, and auditable.

# \- Audit records should be treated as immutable/read-only operational evidence.

# 

# \---

# 

# \## 12. Open Items — Do Not Resolve Silently

# 

# Unless a newer approved source explicitly resolves them, preserve these Open Items:

# 

# \- \*\*OI-01\*\* — M3/M4 → M5 Folio charge posting ownership/write path

# \- \*\*OI-02\*\* — M3 notification retry/backoff policy

# \- \*\*OI-03\*\* — Bell/Push notification scope

# \- \*\*OI-04\*\* — M2 ↔ M5 PaymentTransaction ownership

# \- \*\*OI-05\*\* — Payment methods beyond confirmed VNPay (including Cash handling)

# \- \*\*OI-06\*\* — F\&B service location behavior

# \- \*\*OI-07\*\* — Package-specific menu restriction

# \- \*\*OI-08\*\* — Persisted Start Session / `IN\_PROGRESS`

# \- \*\*OI-09\*\* — Exact persistence representation for attendance confirmation

# 

# Do not silently choose an event, direct repository write, API call, queue/message, retry count, timing rule, payment policy, or similar mechanism while the corresponding Open Item remains unresolved.

# 

# \---

# 

# \## 13. Security Rules

# 

# \- Protected APIs must not be exposed through broad `permitAll()` rules.

# \- Public access is allowed only for endpoints explicitly intended to be public.

# \- Enforce role authorization in Spring Security and/or method-level authorization.

# \- Enforce resource ownership where a Customer or Therapist accesses session-specific data.

# \- Unauthenticated protected requests should return `401`.

# \- Authenticated wrong-role requests should return `403`.

# \- Never rely only on frontend `RoleGuard` or user-supplied IDs for authorization.

# \- Never commit credentials, secrets, tokens, or machine-specific passwords.

# 

# \---

# 

# \## 14. Database Rules

# 

# \- `05\_Development/database/schema.sql` is the clean-install baseline unless a newer approved database strategy states otherwise.

# \- Migrations must be compatible with Microsoft SQL Server.

# \- Avoid duplicate-column/table creation between baseline and migration paths.

# \- Keep migrations idempotent where appropriate for the agreed development workflow.

# \- Keep development/demo seed data under `05\_Development/database/seed/` rather than mixing it into schema migrations.

# \- H2 tests are useful but do not prove SQL Server runtime behavior.

# \- Do not claim SQL Server concurrency validation unless it was actually executed against SQL Server.

# 

# \---

# 

# \## 15. Frontend Rules

# 

# \- Preserve official screen coverage and approved UI/UX intent.

# \- Replace mock behavior with API-backed behavior incrementally.

# \- Do not reintroduce prototype-only business logic as production truth.

# \- Frontend must not implement security rules that exist only in the UI; backend enforcement remains mandatory.

# \- Do not add new official screens unless requirements explicitly require them.

# 

# \---

# 

# \## 16. Testing \& Quality Gates

# 

# For backend changes, run as applicable:

# 

# ```text

# cd 05\_Development/backend

# .\\mvnw.cmd test

# .\\mvnw.cmd package

# ```

# 

# For frontend changes, run as applicable:

# 

# ```text

# cd 05\_Development/frontend

# npx tsc --noEmit

# npm run build

# ```

# 

# For business-critical code, test relevant happy paths and failure paths, including:

# 

# \- authorization / ownership

# \- validation

# \- transaction rollback

# \- concurrency where relevant

# \- invalid lifecycle transitions

# \- unresolved dependency behavior / fail-closed adapters

# 

# Do not weaken tests merely to make a build pass.

# 

# \---

# 

# \## 17. Documentation \& Status Rules

# 

# Keep these development documents aligned with the actual implementation when the current task changes their scope:

# 

# \- `05\_Development/docs/API\_CONTRACT.md`

# \- `05\_Development/docs/DEVELOPMENT\_STATUS.md`

# \- `05\_Development/docs/PROJECT\_DECISIONS.md`

# 

# Status must be evidence-based:

# 

# \- `IMPLEMENTED` — implemented and supported by the required production dependencies for the declared scope

# \- `PARTIAL` — core implementation exists but one or more required integrations/policies remain incomplete

# \- `BLOCKED` — implementation cannot safely continue because a required dependency/decision is missing

# \- `NOT STARTED` — no meaningful implementation yet

# 

# A screen compiling successfully does not by itself mean its production integration is complete.

# 

# \---

# 

# \## 18. Planning Traceability

# 

# Before implementation, identify when practical:

# 

# \- Current Module

# \- Matching Task ID(s)

# \- Planned Week(s)

# \- PIC / Support

# \- Complexity

# \- tasks covered by the implementation

# \- tasks intentionally not covered yet

# \- planning mismatches

# \- tasks implemented ahead of plan

# 

# In implementation reports, map relevant changes back to planning Task IDs where useful.

# 

# Do not expand scope simply because future-week tasks are visible in the planning workbook.

# 

# \---

# 

# \## 19. Git \& Change-Control Rules

# 

# \- Inspect the working tree before editing.

# \- Do not overwrite unrelated team changes.

# \- Do not modify `01\_Planning/`, `02\_Requirement/`, `03\_Design/`, or `04\_Implement/` during normal development unless explicitly authorized.

# \- Keep commits logically aligned with project tasks/weeks when the user asks for commits.

# \- Prefer normal full-file staging unless the user explicitly requests partial staging.

# \- Do not run `git commit`, `git push`, force-push, branch deletion, or destructive reset unless explicitly requested.

# \- Never add secrets or local credentials to Git.

# 

# \---

# 

# \## 20. Final AI Implementation Rule

# 

# When implementing or correcting code:

# 

# \- inspect actual code first;

# \- implement the smallest approved scope;

# \- preserve module boundaries;

# \- preserve unresolved Open Items;

# \- fail closed rather than fabricate upstream production data;

# \- keep security authoritative on the backend;

# \- test the changed behavior;

# \- report limitations truthfully;

# \- stop when the requested phase is complete.

# 

# Do not claim production completeness based only on compilation, UI rendering, mock data, placeholder adapters, logging-only integrations, or tests against a different database engine.



