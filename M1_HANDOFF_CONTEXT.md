# HSWRMS - M1 Session Handoff (updated 2026-10-16, branch DucHoangM1)

Status: HEAD is `1dcc3b1` (`feat(m1): integrate email OTP registration flow`), in sync with
`origin/DucHoangM1`. Auth (register + verify-email; OTP prints to the backend console under the
default `dev` profile — Gmail SMTP only when the `smtp` profile is active), login/JWT and
customer-profile GET/PUT exist from prior committed work. Uncommitted working-tree slices
(NOT staged, committed, or pushed): (1) Consent backend
(GET/POST consents + revoke + guard, ConsentServiceTest 6/6); (2) Health & Dietary Profile backend
(GET/PUT gated on active HEALTH_DATA_PROCESSING consent, structured §5.3 fields + child tables,
HealthProfileServiceTest 3/3; reviewed migration EXECUTED on the local dev DB 2026-10-16 —
section 6); (3) Health frontend wiring
(healthProfileApi.ts + consentApi.ts, server-backed HealthProfilePage.tsx, tsc -b exit 0);
(4) fresh-clone auth enablement — default `dev` profile, DevAccountBootstrap demo accounts,
seeded logins in auth-test.http, login prefill (section 2). Tracked modifications:
`HealthProfile.java`, `HealthProfilePage.tsx`, `application*.yml`, `schema.sql`,
`AuthProvider.tsx`, `LoginPage.tsx`. Deletion APIs NOT implemented. Live SQL Server E2E
VERIFIED 2026-10-16: register -> console OTP -> verify -> login for all six demo roles ->
profile (200 with JWT, 401 without).

## 1. Branch, HEAD, working tree (verified live via git, 2026-10-16)

- Repository: C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-work
- Branch: DucHoangM1, tracking origin/DucHoangM1, in sync (no ahead/behind).
- HEAD: `1dcc3b1ea5fdfc8305ce0aa5324bf48d97e96b2a` = `feat(m1): integrate email OTP registration flow`.
- `git status -sb` (2026-10-16, re-verified): 9 tracked modifications (unstaged), 20 meaningful
  untracked implementation files, plus pre-existing artifacts. Nothing staged, committed, pushed.
- Tracked modifications (unstaged):
  - `M 05_Development/backend/.../m1identity/entity/HealthProfile.java` (structured §5.3 columns +
    3 child collections; legacy columns kept)
  - `M 05_Development/frontend/src/pages/customer/HealthProfilePage.tsx` (server-backed load/save)
  - `M 05_Development/backend/src/main/resources/application.yml` + `application.yml.example` +
    `application-dev.yml.example` (default profile `dev` — section 2)
  - `M 05_Development/database/schema.sql` (HealthProfile §5.3 columns + 3 child tables — section 6)
  - `M 05_Development/frontend/src/app/providers/AuthProvider.tsx` (no default mock persona)
  - `M 05_Development/frontend/src/pages/auth/LoginPage.tsx` (demo email prefill)
  - `M M1_HANDOFF_CONTEXT.md` (this file)
- Untracked implementation files (preserve; do NOT reset/clean/add -A):
  - Consent backend: `controller/ConsentController.java`, `dto/ConsentRecordResponse.java`,
    `dto/GrantConsentRequest.java`, `service/ConsentService.java`,
    `src/test/.../service/ConsentServiceTest.java`
  - Health backend: `controller/HealthProfileController.java`, `dto/HealthProfileResponse.java`,
    `dto/UpdateHealthProfileRequest.java`, `entity/FoodAllergy.java`,
    `entity/DietaryRequirement.java`, `entity/HealthProfileTherapyPreference.java`,
    `repository/FoodAllergyRepository.java`, `repository/DietaryRequirementRepository.java`,
    `repository/HealthProfileTherapyPreferenceRepository.java`, `service/HealthProfileService.java`,
    `src/test/.../service/HealthProfileServiceTest.java`
  - Migration: `05_Development/database/migrations/_reviewed_m1_health_profile_structured.sql`
    (EXECUTED on the local dev DB 2026-10-16 — section 6; never run on any other instance)
  - Fresh-clone auth (NEW): `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/DevAccountBootstrap.java`
  - Frontend wiring: `05_Development/frontend/src/api/health/healthProfileApi.ts`,
    `05_Development/frontend/src/api/health/consentApi.ts`
  - Pre-existing (preserve, never commit): `05_Development/backend/auth-test.http` (edited this
    session — now also holds seeded demo-login requests using the dev-only password), root
    `AccountSettings_*.tmp` (7 files) + `AccountSettings_show.txt`

## 2. Implemented: auth + profile (committed) AND consent + health (uncommitted working tree)

- POST /api/v1/auth/register + verify-email — E2E confirmed on real SQL Server (earlier sessions; verified test account ACTIVE).
- POST /api/v1/auth/login — AuthService.login() (generic 401 for bad credentials; 400 EMAIL_NOT_VERIFIED / ACCOUNT_NOT_ACTIVE), JwtTokenProvider.getExpirationMs(), SecurityConfig permitAll matcher.
- GET/PUT /api/v1/customers/me/profile — CustomerProfileController + CustomerProfileService + CustomerProfileResponse + UpdateCustomerProfileRequest. userId always comes from the JWT principal; email is read-only; DOB must be a past date.
- Real frontend wiring: api/auth/authApi.ts (loginRequest); AuthProvider stores the token/session (hswrms_auth_session) and maps backend roles; LoginPage calls the real API (mock timeout removed); CustomerContext loads the server profile (refreshServerProfile/isProfileLoading) with the authenticated identity taking precedence over the stored mock; AccountSettingsPage saves via PUT then refreshes, shows real error messages, and marks email read-only; 5 new alert keys in each of en/fr/ja/vi/zh-CN auth.json; types/auth.ts + types/customer.ts extended.
- customerProfileApi.ts was MANUALLY simplified to just getMyProfile() + updateMyProfile() — no dietary/health fields (see section 5).
- HUMAN-VERIFIED E2E (2026-10-13, user-reported): edited Account Settings profile fields, submitted with Enter, stopped and restarted the backend, and confirmed the new data persisted in SQL Server. This exercises the full chain (UI -> JWT -> PUT /customers/me/profile -> DB -> GET after restart). Negative login paths (wrong password, unverified email) remain covered by unit/slice tests only — not E2E-retested.
- NEW (uncommitted, 2026-10-15/16) — Consent backend: `GET /api/v1/customers/me/consents`
  (200 history), `POST /api/v1/customers/me/consents` (201 new / 200 idempotent existing;
  server-controlled versions TO_SERVICE=v1.0, HEALTH_DATA_PROCESSING=v1.2; unknown type -> 400
  CONSENT_TYPE_UNSUPPORTED), `POST /api/v1/customers/me/consents/{type}/revoke` (200 closed; none
  active -> 400 CONSENT_NOT_ACTIVE). Identity from JWT principal only. Reusable guard
  `ConsentService.requireActiveConsent` (missing -> 400 HEALTH_CONSENT_REQUIRED). Persistence reuses
  legacy `consent_status` + `revoked_at` columns. `ConsentServiceTest` 6/6.
- NEW (uncommitted, 2026-10-15/16) — Health backend: `GET /api/v1/customers/me/health-profile`
  (200, empty structure + `hasConsented` when none) and `PUT` (200; partial update, child-list full
  replace, §5.3 validation). PUT calls `requireActiveConsent` FIRST (unit-verified no-save on
  failure). Fields: currentHealthCondition, injurySurgeryHistory, mobilityJointNotes,
  currentMedications, stressFatigueLevel (mild|moderate|high), foodIntoleranceNotes,
  dislikedIngredients, kitchenNotes, foodAllergies[], dietaryRequirements[], therapyPreferences[]
  (+ write-only therapyCode). `anonymizationStatus` excluded from DTOs.
  `HealthProfileServiceTest` 3/3. Migration script drafted but NOT executed (see section 6).
- NEW (uncommitted, 2026-10-16) — Health frontend wiring: `healthProfileApi.ts` + `consentApi.ts`
  typed to backend DTOs; `HealthProfilePage.tsx` loads via GET on open (loading banner; error panel
  + Retry, no silent mock fallback), grants HEALTH_DATA_PROCESSING via POST before PUT only when
  newly checked (PUT never sent if grant fails; no implicit revoke), maps all fields/arrays, and
  re-GETs after PUT to render persisted state. `tsc -b` exit 0. Deletion NOT implemented.
- NEW (uncommitted, 2026-10-16) — Fresh-clone auth enablement (zero-manual-setup goal):
  - `application.yml` (+ `application.yml.example` + `application-dev.yml.example`):
    `spring.profiles.active: ${SPRING_PROFILES_ACTIVE:dev}` so a fresh clone boots `dev` out of
    the box — OTP verification codes print to the backend console (DevEmailDeliveryAdapter) and
    DevAccountBootstrap runs; `src/test/resources/application.yml` fully shadows main config, so
    `mvnw test` is unaffected (suite 55/55).
  - NEW `config/DevAccountBootstrap.java` (`@Profile("dev")`, ApplicationRunner, idempotent):
    seeds the 6 canonical roles (case-insensitive lookup + `FB_STAFF` alias) and one ACTIVE,
    e-mail-verified demo account per role —
    `{customer,receptionist,therapist,fbstaff,manager,admin}@heavenstay.dev`, shared dev-only
    password `DevDemo123!` (documented demo credential, NOT a secret). The customer seed also
    gets a CustomerProfile + active `TO_SERVICE` consent (mirrors registerGuest). Never
    overwrites an existing password/status; logs a WARN and continues if the DB is unreachable.
  - `auth-test.http`: seeded-login requests for all six demo accounts.
  - Frontend: `LoginPage.tsx` prefills `customer@heavenstay.dev`; `AuthProvider.tsx` no longer
    starts with a mock persona (default `null` — a real login is required). Note: the mock
    RoleSwitcher/MOCK_PERSONAS UI remains only in `04_Implement/Frontend_Prototype`; the
    `05_Development` app switches roles by logging into the matching demo account.
  - `database/schema.sql`: HealthProfile CREATE aligned with the entity (8 §5.3 columns +
    `CK_HealthProfile_StressLevel`) plus CREATE TABLE `FoodAllergy` / `DietaryRequirement` /
    `HealthProfileTherapyPreference` — fresh installs now match what the code selects (section 6).

## 3. Verification performed (confirmed results vs unverified live integration)

- CONFIRMED 2026-10-13 baseline: frontend `tsc -b` exit 0; backend `mvnw test` exit 0, 39 tests green
  (breakdown in original handoff). H2-only "Schema DBO not found" warning is non-fatal.
- CONFIRMED 2026-10-15: `ConsentServiceTest` targeted run pass (exit 0 after stripping a
  PowerShell-introduced BOM from `ConsentService.java`); full backend suite per
  `target/surefire-reports/*.txt` (22:39): **55 tests, 0 failures, 0 errors** (incl.
  HealthProfileServiceTest 3/3, ConsentServiceTest 6/6, AuthServiceTest 17/17). The interactive
  `mvnw test` tail could not be observed (terminal busy) — report-file evidence, not a live
  BUILD SUCCESS line.
- CONFIRMED 2026-10-16: frontend `npx --no-install tsc -b` exit 0 after health page wiring AND
  again after the fresh-clone auth edits. No frontend unit tests exist for these pages; none added.
- CONFIRMED 2026-10-16 (this session, LIVE SQL Server on localhost:1433): backend
  `mvnw -B test` -> BUILD SUCCESS, 55/55 (compiles DevAccountBootstrap); `tsc -b` exit 0. Backend
  started with the default profile ("The following 1 profile is active: dev"); DevAccountBootstrap
  seeded 6/6 demo accounts (existing role rows reused case-insensitively), zero ERROR lines.
  HTTP E2E: register -> OTP read from the backend console -> verify-email 200
  (`emailVerified: true`) -> login 200 (JWT in `data.token`, roles in `data.roles`) ->
  GET /api/v1/customers/me/profile 200 with the Bearer token and 401 without it; all six demo
  accounts log in with the correct roles (Customer, Receptionist, Therapist, F&B Staff, Manager,
  Admin). HealthProfile structured columns + 3 child tables confirmed present post-migration.
- STILL UNVERIFIED (do NOT claim): browser/UI-driven run (SPA + RoleGuard redirects), health
  flow E2E (grant HEALTH_DATA_PROCESSING -> PUT health-profile -> GET -> persistence across
  restart), negative auth paths (wrong password / bad OTP) on the live DB, IDOR/concurrency
  tests on a real database.

## 4. Encoding defects — RESOLVED (fixed this session, 2026-10-13)

- FIXED — AccountSettingsPage.tsx: the 9 CP437-mangled lines (197, 324, 326, 327, 328, 483, 527, 530, 562) were restored to correct UTF-8 and the UTF-8 BOM stripped, using a byte-safe node Buffer method (NOT PowerShell `>` redirection). Verified: working copy now byte-matches checkpoint blob 9a057bc; `git diff 9a057bc` for this file is empty; no mojibake remains.
- FIXED — CustomerContext.tsx: UTF-8 BOM stripped; content otherwise identical to checkpoint. `git diff 9a057bc` empty.
- NOTE: these fixes were NOT re-validated with `tsc -b` or `mvnw test` after the edit — run both before committing (see section 9).
- The i18n locale files (en/fr/ja/vi/zh-CN auth.json) were verified byte-clean (proper Unicode, no BOM, no mojibake).
- Demo-only / mocked (unchanged): password change (no backend), notification preference toggles, membership/villa panel, resend-OTP, SSO buttons, and all customer-domain pages beyond Account Settings (bookings, wellness, etc. still use mock/localStorage data).
- Not implemented: logout/token refresh/revocation (a token stays valid even if account status later changes — accepted known risk); GET /api/v1/customers/me without the /profile suffix is not a route (use /profile).

## 5. Health & Dietary Profile — DESIGN COMPLETED (since implemented in the working tree; decisions below still authoritative)

The Health & Dietary Profile feature was re-scoped from "paused" to a completed design phase. Team-lead decisions (approved 2026-10-13) are recorded in `M1_Phase2_Plan.md` §R9 and encoded into the two authoritative design artifacts:
- ERD: `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio` (valid XML).
- API contract: `05_Development/docs/API_CONTRACT.md` §5.

Key approved decisions:
- ConsentRecord: FK stays `user_id` (NOT customer_profile_id); history-preserving grant/revoke (grant = INSERT new row; revoke closes via `revoked_at`; re-grant = new row); max 1 active per `(user_id, consent_type)`; types {TO_SERVICE, HEALTH_DATA_PROCESSING}. NOTE: the existing Java `consent_status` enum (GRANTED/REVOKED/PENDING) is SUPERSEDED by `granted` + `revoked_at` — a code change is still pending (see section 6).
- Registration persists a TO_SERVICE consent (provisional policy `v1.0`). HEALTH_DATA_PROCESSING is never auto-granted (policy `v1.2`). Health-profile writes are REJECTED by the backend without an active health consent; the frontend checkbox is never sufficient authorization.
- HealthProfile aligned to the detailed frontend fields (9 content attributes); FoodAllergy + DietaryRequirement remain 1..* children; therapy preferences become a new child `HealthProfileTherapyPreference` (nullable `therapy_code` reserved for future M3 catalog — M1 creates NO catalog); `stress_fatigue_level` enum = mild|moderate|high; `anonymization_status` retained but system-managed (excluded from customer DTOs/UI).
- TreatmentHealthNote is M3-OWNED (therapist-authored); NO M1 customer write API; M1 may later expose only a treatment-safe projection.
- HealthDataDeletionRequest: FK `customer_profile_id` + retained `requested_by_user_id` -> User + `request_type` (scope only, does NOT imply hard-delete vs anonymize). Basic flow = create PENDING / read / cancel while PENDING|DEFERRED. Actual deletion/anonymization execution stays DEFERRED (retention policy + M2 contract `hasActiveOrUpcomingRetreat(customerProfileId)`).

(STALE note, 2026-10-16: consent + health-profile read/write ARE implemented in the working tree — section 2. Deletion endpoints still do not exist.)

Session changes (design-only, uncommitted):
- `M1_Phase2_Plan.md`: fixed stale root `M1_ERD.drawio` reference to the authoritative `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio`; older Sections 1-9 marked HISTORICAL/superseded; R-sections carry the revised plan.
- `05_Development/frontend/src/types/customer.ts` + `data/mockCustomer.ts`: removed the obsolete customer-facing `therapistNotes` field (F5) — it was unused by any customer UI and TreatmentHealthNote is M3-owned; therapist-relevant notes now live in the M3 therapist-session flow.

## 6. Database migration status (updated 2026-10-16)

- `_draft_m1_identity_health_profile.sql` — STILL NEVER EXECUTED; do not run it. Its current
  uncommitted diff (+24/-6) only replaces the otp_code->otp_hash auto-rename with a halting
  pre-migration validation block (THROW if legacy plaintext otp_code exists).
- `_reviewed_m1_health_profile_structured.sql` — EXECUTED 2026-10-16 on the LOCAL dev SQL Server
  (database `HSWRMS`) during the fresh-clone E2E task: verify-email had returned 500
  (`Invalid column name 'current_health_condition'`) because the entity carried §5.3 columns the
  live schema lacked. The script is additive + idempotent (8 ADD COLUMN, 3 CREATE TABLE,
  3 nonclustered indexes; no DROP/UPDATE/DELETE anywhere; no backup was taken — rollback = drop
  those additive objects). It re-ran cleanly as its own idempotency check. The file header's
  "DBA/team approval + backup" requirement still applies to ANY other environment — the team
  must ratify this local run and handle shared/prod DBs separately.
- `05_Development/database/schema.sql` — PATCHED the same session: HealthProfile CREATE now
  carries the 8 §5.3 columns + `CK_HealthProfile_StressLevel`, and the three child tables
  (FoodAllergy, DietaryRequirement, HealthProfileTherapyPreference) are created — previously
  fresh installs predated the restructure and broke auth/profile queries the moment the
  customer-profile chain was loaded. `03_Design/Database/HSWRMS_SQLServer_Database.sql` still
  shows the OLD HealthProfile shape (design reference only, never executed — update separately
  if parity is wanted).
- Post-migration live verification (section 3): register -> console OTP -> verify -> login ->
  profile all green.

## 7. Hard prohibitions (never do)

- No git reset / stash / clean / checkout / branch switch / commit / push / stage without explicit human approval.
- No SQL scripts or migrations without explicit approval in the session that needs them; NEVER run _draft_m1_identity_health_profile.sql or _draft_m1_roles_seed.sql. Test accounts come only from DevAccountBootstrap (dev profile) — do not hand-craft more by INSERT.
- Do not start/stop/kill processes (including anything on ports 8080/1433) without approval in the session that needs them.
- Never write real passwords, DB credentials, JWT secrets, tokens, or OTPs into files, logs, commits, or reports. (The dev-only demo password `DevDemo123!` documented in section 2 / auth-test.http is a throwaway seed, not a secret; the machine's DB password appears nowhere in the repo.)
- Do not repair/refactor source code (including the section 4 encoding defects) or implement features without explicit approval in the session where the work is done.
- Never present unit/slice test results as SQL Server E2E proof.
- Session-scoped authorizations exercised by the 2026-10-16 fresh-clone task (one-off — NOT
  standing): start/stop the backend on 8080 for E2E; seed demo accounts via DevAccountBootstrap;
  run the REVIEWED additive HealthProfile migration on the LOCAL dev DB and align schema.sql
  (details in section 6).

## 8. Uncommitted working-tree inventory (verified via git status --porcelain, 2026-10-13)

Likely M1 work — modified (tracked), keep uncommitted until explicitly staged/committed:
- 05_Development/backend/src/main/java/com/heavenstay/hswrms/config/SecurityConfig.java (+1: permitAll POST /api/v1/auth/login)
- 05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/controller/AuthController.java (+8: POST /login)
- 05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/service/AuthService.java (+52: login())
- 05_Development/backend/src/main/java/com/heavenstay/hswrms/security/JwtTokenProvider.java (+4: getExpirationMs())
- 05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/service/AuthServiceTest.java (+120: login tests)
- 05_Development/frontend/src/app/providers/AuthProvider.tsx (real session handling; note extra blank line at EOF per git diff --check)
- 05_Development/frontend/src/context/CustomerContext.tsx (server-profile loading; UTF-8 BOM defect — section 4)
- 05_Development/frontend/src/pages/auth/LoginPage.tsx (real login call + error mapping)
- 05_Development/frontend/src/pages/customer/AccountSettingsPage.tsx (profile PUT wiring; 9 mangled lines + BOM defect — section 4)
- 05_Development/frontend/src/i18n/locales/{en,fr,ja,vi,zh-CN}/auth.json (+5 alert keys each; byte-clean)
- 05_Development/frontend/src/types/auth.ts (+AuthSession etc.), 05_Development/frontend/src/types/customer.ts (+refreshServerProfile/isProfileLoading)

Likely M1 work — untracked, keep:
- 05_Development/backend/auth-test.http (scratch; exclude from any commit)
- 05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/controller/CustomerProfileController.java
- 05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/service/CustomerProfileService.java
- 05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/dto/{CustomerProfileResponse,LoginRequest,LoginResponse,UpdateCustomerProfileRequest}.java
- 05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/controller/ (AuthConcurrencyMappingTests, AuthLoginEndpointTests, CustomerProfileControllerTests)
- 05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/repository/ (EmailOtpRepositoryContractTest)
- 05_Development/backend/src/test/java/com/heavenstay/hswrms/m1identity/service/CustomerProfileServiceTest.java
- 05_Development/backend/src/test/java/com/heavenstay/hswrms/security/ (JwtTokenProviderTest)
- 05_Development/frontend/src/api/auth/ (authApi.ts)
- 05_Development/frontend/src/api/customer/ (customerProfileApi.ts — manually simplified, section 2)
- 05_Development/database/migrations/_draft_m1_identity_health_profile.sql is modified (draft only — section 6)

Temporary recovery artifacts in the repository ROOT — NOT M1 deliverables; delete after review (deletion needs human approval):
- AccountSettings_a3f82d9.tmp, AccountSettings_ckpt10.tmp (large — contains multiple concatenated git-show dumps), AccountSettings_d890ab5.tmp (empty), AccountSettings_head.tmp, AccountSettings_main.tmp, AccountSettings_run9.tmp, AccountSettings_run9_noreg.tmp, AccountSettings_show.txt

- No credentials, OTP values, tokens, or secrets are committed anywhere in this repository (re-verified claim; no secret scan was run this session — treat as unverified beyond file review).
- 2026-10-16 addendum (git status re-verified): the older tracked edits listed above
  (SecurityConfig/AuthController/AuthService/...) are already part of commit `1dcc3b1`. Current
  unstaged modifications = the section-1 list; new untracked file this session =
  `config/DevAccountBootstrap.java`. The health/consent untracked set and root AccountSettings_*
  artifacts are unchanged.

## 9. Next step (updated 2026-10-16): browser E2E + health-flow E2E, then commit staging

1. DONE 2026-10-16: migration/entity/schema.sql compatibility verified — columns and tables
   match the entities; `schema.sql` patched (section 6).
2. DONE 2026-10-16 (with caveat): migration executed on the LOCAL dev DB only — additive,
   idempotent, no backup (section 6). Any other instance still needs the disposable-copy +
   backup procedure required by the script header.
3. PARTIAL 2026-10-16: register -> console OTP -> verify -> login -> role check -> profile
   (200/401) verified live for all six demo roles via HTTP. REMAINING: browser run (frontend dev
   server -> login with a demo account -> RoleGuard redirects per role), health flow E2E (grant
   HEALTH_DATA_PROCESSING -> PUT health-profile -> GET -> persistence across backend restart),
   negative paths (wrong password / wrong OTP) against the live DB.
4. Commit staging (ONLY when explicitly instructed, NEVER `git add -A`): suggested split is
   consent backend + test; health backend + test + entity edit; fresh-clone auth enablement
   (application*.yml, DevAccountBootstrap.java, AuthProvider.tsx, LoginPage.tsx);
   database/schema.sql + reviewed migration; frontend health APIs + page. Exclude
   `auth-test.http` and root `AccountSettings_*` artifacts. No push unless asked.
