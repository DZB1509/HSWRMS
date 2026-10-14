# HSWRMS - M1 Session Handoff (updated 2026-10-13, branch DucHoangM1)

Status: Auth (register + verify-email), login/JWT and customer-profile GET/PUT are implemented and committed at `ff49668` (was ca0383cc). Real frontend wiring is in place and human-verified via the Account Settings UI. The earlier encoding defects (BOM + 9 mangled lines in AccountSettingsPage.tsx; BOM in CustomerContext.tsx) were already fixed byte-safe in a prior session and re-verified. This session (2026-10-13) was DESIGN-ONLY: it revised the M1 plan and produced the Health & Dietary Profile / Consent / Deletion design baseline in the ERD + API_CONTRACT.md §5, applied team-lead decisions, and fixed two doc/type defects (F1 stale root-ERD path in M1_Phase2_Plan.md; F5 removed the unused customer-facing `HealthNotes.therapistNotes` field + its mock value). Health, consent and deletion BACKEND/FRONTEND code is STILL NOT implemented (sections 5, 7). Draft SQL migration NOT run (section 6). The design baseline is NOT proof that the SRS, Java code, SQL schema and live DB agree — live SQL Server schema has NOT been verified via any E2E integration test.

## 1. Branch, HEAD, working tree (branch/HEAD carried from prior verified context; NOT re-run via git this session)

- Repository: C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-work
- Branch: DucHoangM1 (must remain; do not switch). HEAD: ff49668 = the commit that landed registration, login/JWT and customer-profile work (prior baseline was ca0383cc = "feat(m1): checkpoint registration and email verification"). NOTE: HEAD was NOT re-verified with a live git command this session; Claude should confirm with `git rev-parse --short HEAD` before relying on it.
- Nothing in this session was staged or committed (design-only edits only). Re-verify with `git status --short` before acting.
- Design-only edits made THIS session (uncommitted): `M1_Phase2_Plan.md` (F1 path fix + revised-plan status), `05_Development/frontend/src/types/customer.ts` (F5 field removal), `05_Development/frontend/src/data/mockCustomer.ts` (F5 mock value removal).

## 2. Implemented (uncommitted) and human-verified

- POST /api/v1/auth/register + verify-email — E2E confirmed on real SQL Server (earlier sessions; verified test account ACTIVE).
- POST /api/v1/auth/login — AuthService.login() (generic 401 for bad credentials; 400 EMAIL_NOT_VERIFIED / ACCOUNT_NOT_ACTIVE), JwtTokenProvider.getExpirationMs(), SecurityConfig permitAll matcher.
- GET/PUT /api/v1/customers/me/profile — CustomerProfileController + CustomerProfileService + CustomerProfileResponse + UpdateCustomerProfileRequest. userId always comes from the JWT principal; email is read-only; DOB must be a past date.
- Real frontend wiring: api/auth/authApi.ts (loginRequest); AuthProvider stores the token/session (hswrms_auth_session) and maps backend roles; LoginPage calls the real API (mock timeout removed); CustomerContext loads the server profile (refreshServerProfile/isProfileLoading) with the authenticated identity taking precedence over the stored mock; AccountSettingsPage saves via PUT then refreshes, shows real error messages, and marks email read-only; 5 new alert keys in each of en/fr/ja/vi/zh-CN auth.json; types/auth.ts + types/customer.ts extended.
- customerProfileApi.ts was MANUALLY simplified to just getMyProfile() + updateMyProfile() — no dietary/health fields (see section 5).
- HUMAN-VERIFIED E2E (2026-10-13, user-reported): edited Account Settings profile fields, submitted with Enter, stopped and restarted the backend, and confirmed the new data persisted in SQL Server. This exercises the full chain (UI -> JWT -> PUT /customers/me/profile -> DB -> GET after restart). Negative login paths (wrong password, unverified email) remain covered by unit/slice tests only — not E2E-retested.

## 3. Verification performed (exact commands, 2026-10-13)

- Frontend: cd 05_Development\frontend; npx --no-install tsc -b -> exit 0, no errors.
- Backend: cd 05_Development\backend; .\mvnw.cmd test -> exit 0, BUILD SUCCESS: Tests run: 39, Failures: 0, Errors: 0, Skipped: 0. Breakdown: HswrmsApplicationTests 3, AuthServiceTest 16, AuthLoginEndpointTests 4, CustomerProfileControllerTests 6, CustomerProfileServiceTest 3, EmailOtpRepositoryContractTest 3, JwtTokenProviderTest 3, AuthConcurrencyMappingTests 1. (Supersedes the previous "30 green".)
- Known cosmetic H2-only warning still appears during tests ("Schema DBO not found" while running create-drop DDL) — non-fatal, unchanged.
- NOT run this session: mvnw package (last known success: 2026-10-12), mvnw spring-boot:run by the assistant, any live HTTP E2E by the assistant (the UI test in section 2 was done by the human separately).

## 4. Encoding defects — RESOLVED (fixed this session, 2026-10-13)

- FIXED — AccountSettingsPage.tsx: the 9 CP437-mangled lines (197, 324, 326, 327, 328, 483, 527, 530, 562) were restored to correct UTF-8 and the UTF-8 BOM stripped, using a byte-safe node Buffer method (NOT PowerShell `>` redirection). Verified: working copy now byte-matches checkpoint blob 9a057bc; `git diff 9a057bc` for this file is empty; no mojibake remains.
- FIXED — CustomerContext.tsx: UTF-8 BOM stripped; content otherwise identical to checkpoint. `git diff 9a057bc` empty.
- NOTE: these fixes were NOT re-validated with `tsc -b` or `mvnw test` after the edit — run both before committing (see section 9).
- The i18n locale files (en/fr/ja/vi/zh-CN auth.json) were verified byte-clean (proper Unicode, no BOM, no mojibake).
- Demo-only / mocked (unchanged): password change (no backend), notification preference toggles, membership/villa panel, resend-OTP, SSO buttons, and all customer-domain pages beyond Account Settings (bookings, wellness, etc. still use mock/localStorage data).
- Not implemented: logout/token refresh/revocation (a token stays valid even if account status later changes — accepted known risk); GET /api/v1/customers/me without the /profile suffix is not a route (use /profile).

## 5. Health & Dietary Profile — DESIGN COMPLETED (design-only; NOT implemented)

The Health & Dietary Profile feature was re-scoped from "paused" to a completed design phase. Team-lead decisions (approved 2026-10-13) are recorded in `M1_Phase2_Plan.md` §R9 and encoded into the two authoritative design artifacts:
- ERD: `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio` (valid XML).
- API contract: `05_Development/docs/API_CONTRACT.md` §5.

Key approved decisions:
- ConsentRecord: FK stays `user_id` (NOT customer_profile_id); history-preserving grant/revoke (grant = INSERT new row; revoke closes via `revoked_at`; re-grant = new row); max 1 active per `(user_id, consent_type)`; types {TO_SERVICE, HEALTH_DATA_PROCESSING}. NOTE: the existing Java `consent_status` enum (GRANTED/REVOKED/PENDING) is SUPERSEDED by `granted` + `revoked_at` — a code change is still pending (see section 6).
- Registration persists a TO_SERVICE consent (provisional policy `v1.0`). HEALTH_DATA_PROCESSING is never auto-granted (policy `v1.2`). Health-profile writes are REJECTED by the backend without an active health consent; the frontend checkbox is never sufficient authorization.
- HealthProfile aligned to the detailed frontend fields (9 content attributes); FoodAllergy + DietaryRequirement remain 1..* children; therapy preferences become a new child `HealthProfileTherapyPreference` (nullable `therapy_code` reserved for future M3 catalog — M1 creates NO catalog); `stress_fatigue_level` enum = mild|moderate|high; `anonymization_status` retained but system-managed (excluded from customer DTOs/UI).
- TreatmentHealthNote is M3-OWNED (therapist-authored); NO M1 customer write API; M1 may later expose only a treatment-safe projection.
- HealthDataDeletionRequest: FK `customer_profile_id` + retained `requested_by_user_id` -> User + `request_type` (scope only, does NOT imply hard-delete vs anonymize). Basic flow = create PENDING / read / cancel while PENDING|DEFERRED. Actual deletion/anonymization execution stays DEFERRED (retention policy + M2 contract `hasActiveOrUpcomingRetreat(customerProfileId)`).

NO endpoint in API_CONTRACT §5 exists in code yet. Design review (checkpoint B in plan §R6) is the next approval gate before any health/consent/deletion code is written.

Session changes (design-only, uncommitted):
- `M1_Phase2_Plan.md`: fixed stale root `M1_ERD.drawio` reference to the authoritative `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio`; older Sections 1-9 marked HISTORICAL/superseded; R-sections carry the revised plan.
- `05_Development/frontend/src/types/customer.ts` + `data/mockCustomer.ts`: removed the obsolete customer-facing `therapistNotes` field (F5) — it was unused by any customer UI and TreatmentHealthNote is M3-owned; therapist-relevant notes now live in the M3 therapist-session flow.

## 6. Database migration is still a DRAFT — must not be executed

- 05_Development/database/migrations/_draft_m1_identity_health_profile.sql has NOT been run against any database. Do not run it, and do not create or modify any migration, table, or data. Its current uncommitted diff (+24/-6) only replaces the otp_code->otp_hash auto-rename with a halting pre-migration validation block (THROW if legacy plaintext otp_code exists).

## 7. Hard prohibitions (never do)

- No git reset / stash / clean / checkout / branch switch / commit / push / stage without explicit human approval.
- No SQL scripts or migrations; never ALTER/INSERT/UPDATE/DELETE data or schema; NEVER run _draft_m1_identity_health_profile.sql or _draft_m1_roles_seed.sql. Do not create test accounts or change the database.
- Do not start/stop/kill processes (including anything on ports 8080/1433) without approval.
- Never write passwords, DB credentials, JWT secrets, tokens, or OTPs into files, logs, commits, or reports.
- Do not repair/refactor source code (including the section 4 encoding defects) or implement features without explicit approval in the session where the work is done.
- Never present unit/slice test results as SQL Server E2E proof.

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

## 9. Next recommended tasks for Claude — PRIORITY ORDER

IMPORTANT CAVEAT: The approved design (ERD + API contract §5) is NOT proof that the SRS, Java code, SQL schema, and the live database agree. The live SQL Server schema has NOT been verified through any end-to-end integration test. Do not treat the design as implemented or verified.

1. Reconfirm real state (git read-only): `git branch --show-current` (expect DucHoangM1); `git rev-parse --short HEAD`; `git status --short`. Do not assume this handoff's HEAD (ff49668) — verify it. Section 8's inventory predates this session's design edits.
2. Re-validate after this session's edits (encoding fix + F5 type/mock removal) BEFORE anything else:
   - `cd 05_Development\frontend; npx --no-install tsc -b` (expect exit 0 — the F5 `therapistNotes` removal must not break any import/usage).
   - `cd 05_Development\backend; .\mvnw.cmd test` (expect 39 green — backend was not touched by the design edits, so it should be unchanged).
   If either fails, STOP and report — do not improvise.
3. Design review / approval checkpoint (checkpoint B in plan §R6): have the team review `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio` and `05_Development/docs/API_CONTRACT.md` §5. NO health/consent/deletion code is written until this is approved. Resolve the "Still open" items in plan §R9 (retention policy, M2 contract, M3/M4 projection field lists, text-field serialization format, validation limits, effect of consent revocation on stored data, concurrent deletion requests) with a human — do NOT decide business/SRS questions silently.
4. Implement in this dependency order (each a small, independently testable slice; NOT started yet):
   a. C. Consent persistence + backend enforcement FIRST: persist TO_SERVICE ConsentRecord at registration; consent endpoints per API_CONTRACT §5.2 (userId from JWT principal only; grant/revoke history; single-active rule). NOTE: the existing Java `consent_status` enum is superseded by `granted` + `revoked_at` — plan this code change.
   b. D. HealthProfile read/write APIs per the ERD, GATED on active HEALTH_DATA_PROCESSING consent (reject writes otherwise). Add FoodAllergy/DietaryRequirement/HealthProfileTherapyPreference children; exclude anonymization_status from DTOs.
   c. E. Validation, authorization, IDOR isolation tests, role restrictions.
   d. F. Frontend integration (preserve current UI + field semantics): healthProfileApi.ts + consentApi.ts; CustomerContext loads server wellness profile with authenticated-identity precedence.
   e. G. Schema reconciliation/migration — SEPARATE, explicitly-reviewed task; draft-only; NEVER executed without explicit human approval; `ddl-auto` stays `none`.
   f. H. Deletion request basic flow (create PENDING / read / cancel while PENDING|DEFERRED). Actual deletion/anonymization execution stays DEFERRED pending retention policy + M2 contract.
5. Commit staging: only when explicitly instructed, `git add <specific paths>` — NEVER `git add -A` (root .tmp/.txt artifacts). Suggested split: backend identity/profile code + tests; frontend auth/profile wiring; i18n; docs. Exclude `auth-test.http`, root `AccountSettings_*` artifacts, and the draft SQL migration. No push unless the human asks explicitly.
- On any unexpected state (different files modified, tests failing, tsc errors): stop and report — do not improvise or change production code.
- Note (carried over): exhausted OTP accounts remain PENDING (no code path sets LOCKED on failed attempts).
