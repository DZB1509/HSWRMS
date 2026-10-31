# HSWRMS M1 — Engineering Quality Dossier

**Branch:** `feature/hswrms-m1-m6-integration`  
**Type:** Read-only engineering handoff / architecture dossier. No source, test, schema, database, service, or Git state was changed.

## 1. Scope and evidence status

In scope: registration, OTP verification, login/JWT/roles, SSO, customer profile, sensitive health profile, consent, deletion requests, and direct M1 wellness consumers (dashboard, spa, dining).

Out of scope: actual deletion execution, retention policy, M2 active-retreat checks, M2–M6 workflows except as M1 consumers, production deployment.

Evidence is reused from prior reports and current source inspection. Previous test counts are reported results, not freshly executed in this documentation task. Line/branch code coverage is Unknown. Runtime evidence is limited to prior local smoke tests. The installed local database is stale for `HealthDataDeletionRequest`. The intended integration branch is not conclusively identified.

Primary evidence paths:
- `M1_HANDOFF_CONTEXT.md`
- `M1_Phase1_Audit.md`
- `M1_Phase2_Plan.md`
- `05_Development/docs/API_CONTRACT.md`
- `05_Development/database/schema.sql`
- `05_Development/database/migrations/_reviewed_m1_deletion_request_customer_profile.sql`
- `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/...`
- `05_Development/frontend/src/...`
- `05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/...`
- `06_Reports/M1_Test_Coverage_Matrix.md`
## 2. Executive summary and readiness

M1 has a substantial implementation in `05_Development`: backend entities, repositories, services, controllers, DTOs, security integration, frontend API modules, context wiring, and a broad backend test suite. The strongest runtime evidence is health-profile GET/PUT against the local SQL Server database. The main blockers are:

1. `HealthDataDeletionRequest` schema mismatch in the installed local database.
2. Customer-profile writes are localStorage-only in the frontend.
3. Password reset is simulated and has no backend endpoint.
4. `wellnessProfile.isComplete` is semantically unresolved.
5. Deletion UI collects `reason`, but the backend DTO does not accept it.
6. Cross-module frontend screens still use mock/static data and hardcoded fallbacks.

M1 is implementation-heavy and partially runtime-verified, but not merge-ready until the P0/P1 items in section 11 are resolved or explicitly accepted.

## 3. M1 use cases and module boundaries

In-scope use cases (authoritative IDs from `M1_Phase1_Audit.md` / SRS §4.2): UC01 Register Account; UC02 Verify Email; UC03 Forgot/Reset Password; UC04 Login (Email/Password); UC05 Login with Google; UC06 Login with Facebook; UC07 Manage Account Settings; UC08 Manage Health & Dietary Profile; UC09 Manage Consent; UC10 Request Health Data Deletion. Operations without a standalone approved ID (for example context staleness, retry/timeout handling, or consumer projections) are treated as subflows/cross-cutting concerns rather than invented use cases.

Boundaries and deferred behavior: M1 does not execute deletion or anonymization; does not implement the M2 active-retreat check (only defines `hasActiveOrUpcomingRetreat(customerProfileId)`); must not query M2 repositories/tables directly; retention policy and executor remain unresolved; M3/M4 projection field lists require further agreement.

## 4. Technology stack and architecture overview

Backend: Java 17, Spring Boot, Spring Security, Spring Data JPA, Maven, SQL Server. Frontend: React, TypeScript, Vite. Database: SQL Server with Hibernate `ddl-auto: none`. Schema evolution is manual SQL plus idempotent draft/reviewed migrations. Security uses JWT bearer tokens, Spring Security role checks, and service-level ownership checks. API style is REST under `/api/v1` with an `ApiResponse` envelope.

Runtime shape: `React page -> context/hook -> API module -> apiClient -> Spring controller -> service -> repository -> JPA entity -> SQL Server table`. Several write paths still mutate local state only.

## 5. Component and building-block view

Frontend building blocks: auth pages, `HealthProfilePage`, `HealthDataDeletionPage`, `CustomerDashboardPage`; contexts `CustomerContext`, `SpaContext`, `DiningContext`; API modules for auth, customer profile, health profile, consent, deletion; shared `apiClient` and `apiError`.

Backend building blocks: controllers `AuthController`, `SsoController`, `CustomerProfileController`, `HealthProfileController`, `ConsentController`, `HealthDataDeletionRequestController`; services `AuthService`, `CustomerProfileService`, `HealthProfileService`, `ConsentService`, `HealthDataDeletionRequestService`, SSO services; repositories for user, customer profile, health profile, consent, deletion request, email OTP, auth identity, SSO tickets; entities/DTOs for user, profile, health profile, consent, deletion request, auth identity, email OTP.

Database building blocks: authoritative development DDL `05_Development/database/schema.sql`; read-only design baseline `03_Design/Database/HSWRMS_SQLServer_Database.sql`; manual migrations; M1 ERD `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio`.

## 6. Runtime and data-flow notes

Registration/OTP: frontend calls `registerRequest` and `verifyEmailRequest`; backend manages user and OTP records; duplicate-email and OTP invalidation have regression tests. Status: API-wired, browser runtime not re-run in this task.

Login/JWT: frontend calls `loginRequest`, stores token, resolves role routes; backend issues JWT and roles. Status: DB-backed and runtime-verified at API level in prior smoke test.

SSO: frontend redirects to backend OAuth2 start; callback exchanges/resolves tickets. Google SSO verified through a real browser/provider flow. Facebook SSO verified in Meta Tester mode; public Live blocked by Meta. Status: API-wired with provider limitations.

Health profile: `CustomerContext.refreshWellnessProfile` calls health and consent APIs; `HealthProfilePage` loads server data, grants consent if needed, saves, re-reads, and refreshes context. Unknown stress level maps to null/unselected. Status: DB-backed and runtime-verified in prior smoke test.

Consent: backend list/grant/revoke endpoints exist; health-profile save can grant consent when newly selected. Status: API-wired; grant not separately runtime-tested.

Deletion lifecycle: frontend uses list/create/cancel APIs; backend enforces ownership, duplicate-open protection, cancellable states, and never marks requests completed. Status: API-wired but runtime-failing due to stale installed schema.

## 7. Security and data-protection assumptions

- Identity is resolved from the JWT principal, not request body/path/query.
- Ownership is enforced in services using the authenticated user's customer profile.
- Role authorization uses Spring Security `@PreAuthorize`.
- Cross-user isolation: `CustomerEndpointRoleAuthorizationTests` verifies unauthenticated `401` and non-customer `403` behavior plus customer access to their own data; it does not by itself prove two-customer IDOR isolation. Deletion-request ownership is currently tested at service level (`HealthDataDeletionRequestServiceTest.cancel_notOwned_notFound`). Broader two-customer ownership tests remain a gap.
- Consent gating protects health-profile writes.
- Sensitive-data minimization: the frontend `SpaContext` and `DiningContext` filter M1 wellness data into treatment/dietary projections. This is a frontend projection, not by itself a backend security control. Backend M1 endpoints are customer-scoped; M3/M4 backend projections are not yet integrated, so claims that therapists, F&B, receptionists, or managers cannot receive sensitive data require backend authorization/response evidence.
- Tokens, OTPs, and database credentials must not be printed in reports.

## 8. Database authority and migration policy

Authority: M1 ERD is the authoritative target data model; API Contract §5 is the approved API direction where conflicts exist; `05_Development/database/schema.sql` is the authoritative development DDL baseline; `03_Design/Database/HSWRMS_SQLServer_Database.sql` is a read-only design baseline; migrations are manual, idempotent, and DRAFT ONLY unless approved/executed.

Deletion-request schema mismatch: the current entity expects `customer_profile_id` NOT NULL FK to `CustomerProfile`, plus `request_type`, `request_status`, `requested_at`, `processed_at`, `updated_at`. The installed local table currently has `health_profile_id` NOT NULL FK to `HealthProfile`, `requested_by_user_id`, `request_status`, `requested_at`, `processed_at`, and lacks `customer_profile_id`, `request_type`, and `updated_at`. The reviewed migration is explicitly DRAFT ONLY and has not been executed. Do not revert the entity to the legacy column.

## 9. API integration and data-source summary

| Area | Read | Write | Status |
|---|---|---|---|
| Registration | N/A | API | API-wired, not browser-runtime verified |
| Login | API | API | DB-backed, API-level runtime verified |
| SSO | API | API | API-wired, provider limitations |
| Password reset | Local simulation | Local simulation | Not implemented backend |
| Customer profile | API | Local only | Read API-wired; writes not persisted |
| Health profile | API | API | DB-backed, runtime verified |
| Consent | API | API | API-wired, grant not separately runtime tested |
| Deletion requests | API | API | API-wired, runtime failing |
| Dashboard wellness status | API-backed view | Read-only | `isComplete` unresolved |
| Spa therapist projection | API-backed wellness + mock spa data | Read-only | Partially backend-backed |
| Dining projection | API-backed wellness + mock dining data | Read-only | Partially backend-backed |

## 10. Local developer setup and test instructions

Backend: working directory `05_Development/backend`; run `mvnw.cmd spring-boot:run`; default profile `dev`; database SQL Server `localhost:1433`, catalog `HSWRMS`; Hibernate `ddl-auto: none`; initialize a fresh database with `05_Development/database/schema.sql`.

Frontend: working directory `05_Development/frontend`; run `npm run dev`; build with `npm run build`; lint with `npm run lint`.

Tests: backend `mvnw.cmd test`; frontend build/lint. No SQL DDL/DML or migration should be run without approval. Do not expose or invent credentials, JWTs, OTPs, or database passwords.


## 11. Known defects, open requirements and blockers

P0: no confirmed security exposure is currently documented; role/ownership tests cover unauthenticated and non-customer access, but two-customer IDOR coverage remains incomplete.

P1: deletion-request schema mismatch blocks create/list/cancel; customer-profile writes are localStorage-only; password reset is simulated with no backend endpoint.

P2: spa/dining consumers use mock catalogs and hardcoded fallbacks; dashboard status can be misleading; `isComplete` semantics are unresolved; deletion `reason` is collected but not accepted by the API; context staleness and account-switching behavior need stronger tests.

P3: demo-only prototype remains in `04_Implement/Frontend_Prototype`; mock seeds remain in M1 context.

Cross-module/integration: intended merge branch is not conclusively identified (`origin/vinhpt1` is only the most plausible candidate); M2–M6 screens may still use mock/static data; M3/M4 consumers rely on M1 wellness data but their own backends are not integrated.

## 12. Merge readiness checklist

- [ ] Deletion schema aligned with approved migration.
- [ ] Customer-profile writes persist through backend.
- [ ] Password reset scope decided and implemented or removed.
- [ ] `isComplete` definition approved.
- [ ] Deletion `reason` contract decision made.
- [ ] M1 backend regression re-run after any change.
- [ ] Frontend build and lint pass.
- [ ] Runtime smoke tests repeated for health profile and deletion requests.
- [ ] Cross-module consumers reviewed for mock data.
- [ ] Integration branch confirmed by team lead.

## 13. Related deliverables and evidence

- Test matrix: `06_Reports/M1_Test_Coverage_Matrix.md`
- API contract: `05_Development/docs/API_CONTRACT.md`
- M1 ERD: `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio`
- Development schema: `05_Development/database/schema.sql`
- Deletion migration: `05_Development/database/migrations/_reviewed_m1_deletion_request_customer_profile.sql`
- Handoff context: `M1_HANDOFF_CONTEXT.md`
- Phase audit/plan: `M1_Phase1_Audit.md`, `M1_Phase2_Plan.md`
