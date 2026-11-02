# HSWRMS - M1 Session Handoff (updated 2026-10-19, branch DucHoangM1)

## 12. M1 status update (verified 2026-10-19) — READ FIRST; supersedes stale status claims in section 11 (esp. 11.5–11.8) and section 10's env-var note

### 12.1 Google SSO — WORKING (do not redo unless a NEW failure occurs)
- Logged in with a real Google account successfully, both BEFORE and AFTER saving the credentials persistently.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are saved as Windows **User** environment variables. Both verified available (`True`) in a NEWLY opened PowerShell session.
- Backend restarted successfully and Google SSO kept working WITHOUT re-entering the variables — the per-launch `$env:` re-entry pain recorded in section 10's env-var note is gone for Google.
- The `SsoUserInfoDiagnosticsServiceTest.java` compilation issue is fixed: `.\mvnw.cmd -DskipTests test-compile` passes, compiling all 19 test source files (details in 12.3).
- `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` remain session-scoped only (Facebook is deferred — 12.2).
- RULE: never write actual credential values into documentation or commit secrets.

### 12.2 Facebook SSO — DEFERRED (no further investigation or code changes requested now)
- Facebook OAuth consent is reached, but the callback fails with `SSO_EMAIL_NOT_VERIFIED` because the provider response did not supply an email address (11.1; hypotheses H1–H4 in 11.2 remain open).
- At a future session: reassess Meta permissions/configuration together with the diagnostics log line (11.2). If the issue is too costly or blocked by provider restrictions, consider REMOVING Facebook SSO from scope.

### 12.3 Compile blocker — RESOLVED 2026-10-19 (supersedes the stale claims in 11.5, 11.6, 11.7 and 11.8 steps 1–2)
- The local Spring jars were NOT corrupted. Root cause: wrong package/method names in the source vs the actual Spring Security 6.3.3 API. Smallest compatible fixes applied (no dependency changes, no JAR deletions):
  - `SsoUserInfoDiagnosticsService` — `OidcUserService` and `OidcUserRequest` both belong to `org.springframework.security.oauth2.client.oidc.userinfo` (oauth2-CLIENT jar; their absence from oauth2-core is normal — this answers the 11.6 "tension": the "expectations were wrong" branch was the correct one).
  - `SsoOAuth2FailureHandler` — `OAuth2AuthenticationException.getError()` (NOT `getOAuth2Error()`) and `OAuth2Error.getErrorCode()` (NOT `getCode()`), verified against the official Spring Security `6.3.3` tag sources and local `javap`.
  - `SsoUserInfoDiagnosticsServiceTest` — reassembled after an interrupted edit: imports fixed, `facebookRegistration()` builder completed, stranded helpers + 4th test moved back inside the class; all 4 tests preserved.
- Verified: `.\mvnw.cmd -DskipTests compile` (81 main files) and `.\mvnw.cmd -DskipTests test-compile` (19 test files) both BUILD SUCCESS — `spring-boot:run` is unblocked.

### 12.4 Next session
- Continue from `DucHoangM1` (HEAD `ffdd40a` = origin) and PRESERVE all uncommitted changes — nothing was committed, staged, or pushed; the 11.3 inventory still applies.
- Do NOT redo Google SSO implementation or troubleshooting unless a new failure occurs (12.1).
- Resume the next outstanding M1 task after updating this handoff (section 9 lists the pending runtime-verification items); revisit Facebook SSO only if explicitly requested (12.2).

## 11. Facebook SSO login fails `SSO_EMAIL_NOT_VERIFIED` — INVESTIGATION PAUSED 2026-10-18, now DEFERRED (2026-10-19, see 12.2) (uncommitted work; tree was NOT compile-verified then — compile-verified 2026-10-19 per 12.3)

Status: Facebook SSO feature + diagnosis code exists ONLY as uncommitted working-tree changes on `DucHoangM1` (HEAD `ffdd40a` = origin). The diagnosis session was cancelled mid-task; the tree contained at least one file that could not compile (11.5 — RESOLVED 2026-10-19, see 12.3). Nothing was committed/pushed; no credentials were recorded. Sections 1/8's "only modified file is this doc" claims are dated 2026-10-17 and are SUPERSEDED by 11.3.

### 11.1 Exact error + reproduction (observed twice)
- Meta app "HSWRMS", App ID `1075580311951397`; Facebook Login (App OAuth + Web OAuth) enabled; `email`/`public_profile` "Ready for testing"; consent screen requested name/profile picture + email.
- Backend :8080 run with `FACEBOOK_CLIENT_ID`/`FACEBOOK_CLIENT_SECRET` set in the PowerShell session (values never written down anywhere).
- Sequence: SPA "Continue with Facebook" → `GET /api/v1/auth/sso/facebook` → Facebook consent (user accepts) → callback `http://localhost:8080/api/v1/auth/sso/callback/facebook` → SPA shows "Your social account email is not available. Please grant email permission and try again." Backend log: `SSO login rejected (SSO_EMAIL_NOT_VERIFIED): The provider did not supply an email address for this account. Please grant email permission and try again.`
- The Facebook account's email already exists as an HSWRMS account. Auto-linking on email match must stay FORBIDDEN; Facebook registrations keep the OTP verification path.

### 11.2 Confirmed facts (code-level) vs UNVERIFIED hypotheses
Confirmed by reading the working tree this session:
- The exact rejection text matches `SsoService.resolveIdentity` (`SsoService.java` ~line 101), which only runs AFTER `SsoOAuth2SuccessHandler` receives a successful authentication. A token-exchange or `/me` HTTP failure would hit the failure handler instead → different message (`SSO_AUTH_FAILED`). Inference: code exchange and `/me` succeeded and the Graph response carried id/name but no usable `email` attribute. NOT yet proven against a live backend log.
- `SsoClientConfig` registration: scopes `email,public_profile`; v26.0 endpoints (dialog/oauth, graph token, `/me?fields=id,name,email`); `userNameAttributeName=id`; `CLIENT_SECRET_POST`; redirect `{baseUrl}/api/v1/auth/sso/callback/facebook`. No scope overrides in YAML (`application.yml.example` is comments only). So "backend never requested email" is REFUTED at code level.
- The Facebook path deliberately sets `emailVerified=false`; `SsoService` rejects provider auto-link for Facebook — safe-linking invariant intact.
- TEMPORARY diagnostics added: `SsoUserInfoDiagnosticsService` wired via `oauth2Login().userInfoEndpoint().userService(...)` in `SecurityConfig`; it logs grantedScopes + userInfoFieldNames + emailAttributePresent (KEY NAMES ONLY — never values/tokens/secret). `SsoOAuth2FailureHandler` now logs the OAuth2 provider error code + description capped at 500 chars.

Hypotheses (NOT root causes — decide from the diagnostics log line when resumed):
- H1: `email` missing from GRANTED scopes (earlier decline without `auth_type=rerequest`; Meta app dev-mode/tester-role restriction) → re-consent / app-role fix.
- H2: `email` granted but Graph omits it for this account (unconfirmed or phone-only Facebook account) → provider-side; no backend change justified.
- H3: Graph v26.0 version behavior difference. H4: backend response-parsing defect or swallowed provider error (less likely per code reading).

### 11.3 Uncommitted working-tree inventory (verified 2026-10-18; nothing staged; no commits)
Modified (16 files, +458/−106): backend `GlobalExceptionHandler` (SsoRejectedException → 400), `SecurityConfig` (diagnostics wiring), `SsoClientConfig` (Facebook registration), `AuthService` (Facebook OTP identity binding via in-memory `pendingFacebookBindings`), `SsoAvailabilityFilter`, `SsoOAuth2FailureHandler` (provider-error logging), `SsoOAuth2SuccessHandler` (OIDC vs plain-OAuth2 branch), `SsoService`, `application.yml.example`, tests `SsoAuthEndpointTests` (+49), `SsoServiceTest` (+26); frontend `authApi.ts`, `i18n/locales/en/auth.json`, `LoginPage.tsx`, `RegisterPage.tsx`, `SsoCallbackPage.tsx`.
Untracked (3): `m1identity/sso/SsoUserInfoDiagnosticsService.java` (complete), `m1identity/service/AuthServiceSsoFacebookTest.java` (complete, ends cleanly), `m1identity/sso/SsoUserInfoDiagnosticsServiceTest.java` (BROKEN — see 11.5).

### 11.4 What the cancelled task completed before interruption
- Wrote + wired the diagnostics service; enhanced the failure handler; created the diagnostics test file; created `AuthServiceSsoFacebookTest`; began investigating a backend compile failure (jar-integrity hypothesis); confirmed via direct download that repo.maven.apache.org returns bytes IDENTICAL to the local jars (11.6).
- NOT done: fixing the compile, running ANY Maven/JS build or test after these edits, the live Facebook re-test, and the final report. Last command still in flight when cancelled: `git diff --stat` (inspection only). Two `java.exe` processes observed (PIDs 420, 19332) were left running; they held locks on the `~/.m2` jars. No git state-changing command was executed at any point.

### 11.5 KNOWN BROKEN FILE — `SsoUserInfoDiagnosticsServiceTest.java` does NOT compile as-is (FIXED 2026-10-19 — file repaired, test-compile green with 19 test files; see 12.3)
- (a) `facebookRegistration()` (lines ~80–88) is unterminated: the builder ends at `.tokenUri(...)`; missing `.userInfoUri(...)`, `.userNameAttributeName("id")`, `.clientName("Facebook");`, `.build()`, and the method's closing `}`.
- (b) Lines 174–176 AFTER the class's closing brace (line 172) contain those same three orphaned fragment lines.
- (c) Helpers `accessToken(...)` and `facebookUser(...)` are referenced by every test but defined nowhere in the file.
- (d) Only 3 @Test methods exist (routing / log-key-names-only / delegate-failure-propagated); the previously noted 4th "pass-through" test is missing — presumably lost in the same interrupted edit.
- Suspicious (unverified): `AuthService.java` ends at line 359 with `    }}` (two closing braces on one line) — plausible but odd; no compile has confirmed it.

### 11.6 Backend compile blocker — UNRESOLVED at the time; do NOT assume "corrupted local repo" (RESOLVED 2026-10-19: the jars were authentic; the earlier "expectations were wrong" branch was correct — `OidcUserRequest` lives in the oauth2-CLIENT jar and Spring Security 6.3.3 exposes `getError()`/`getErrorCode()`; see 12.3)
Verified lightweight this session: local `spring-security-oauth2-core-6.3.3.jar` = 105,001 bytes, SHA-256 `C6ED9B51…`, 98 entries, NO `OidcUserRequest.class`; a fresh download from repo.maven.apache.org is byte-identical; its SHA-1 `d592c08316e3b6c0d361c931ae11d3c7f3ebd21d` equals the `.sha1` served by BOTH repo.maven.apache.org AND Google's GCS Central mirror. `spring-security-oauth2-client-6.3.3.jar` = 258 entries (`OidcUserService` under `client/oidc/userinfo/`, `DefaultOAuth2UserService` under `client/userinfo/`). UNRESOLVED TENSION: the content lacks classes expected in Spring Security 6.3.3 while matching the checksums both hosts publish — either this machine's network path consistently alters jars AND `.sha1` files, or earlier size/API expectations were wrong. Next session must check an authoritative Central file listing (real size for this coordinate) before deleting anything; deletion is anyway blocked while PIDs 420/19332 hold locks. Re-verify the diagnostics service's OIDC imports against the resolved jars before compiling.

### 11.7 Test status
- Previously PASSED (earlier report; predates the 11.4 edits; NOT re-verified): backend `mvnw test` 95/95; frontend `npx tsc -b` exit 0; `npm run build` exit 0.
- NOT RUN / UNVERIFIED after the latest backend edits: the entire backend suite (tree cannot currently compile), all diagnostics tests, and whether `AuthServiceSsoFacebookTest` was included in the 95. Frontend files were untouched since their green run but are unverified now. (2026-10-19: the "(tree cannot currently compile)" claim in this bullet is STALE — main + test sources both compile now and test-compile is green; the full suite still has NOT been re-run — see 12.3.)

### 11.8 Exact resume procedure (smallest steps; never weaken email verification or the no-auto-link rule) — 2026-10-19: step 1 DONE (test file repaired) and step 2's compile blocker RESOLVED (compile + test-compile green; full `mvnw test` suite still not run) per 12.3; resume at step 3 only if Facebook work is explicitly restarted (12.2)
1. Repair 11.5's test file (rejoin the builder, restore the two helpers + the pass-through test); eyeball `AuthService.java`'s EOF.
2. Resolve 11.6 via an independent authoritative source; then get `mvnw test` fully green (expect prior 95 + 3–4 diagnostics tests) — this is the first time the current tree would be compile-verified.
3. Restart the backend; reproduce the real Facebook login ONCE; read the new line `SSO userinfo diagnostics [facebook]: grantedScopes=…, userInfoFieldNames=…, emailAttributePresent=…` (plus failure-handler providerError lines if any) and act on H1 vs H2 from 11.2. That log line must never contain tokens/secrets/profile values — the tests assert this.
4. Only after evidence: apply the minimal justified fix, add focused tests, re-verify with a real Facebook login. Then remove the TEMPORARY diagnostics wrapper + its `SecurityConfig` wiring. Never auto-link the pre-existing account by email match. No commit/push without explicit human approval.

## 10. Google SSO — IMPLEMENTED, TESTED, MANUALLY VERIFIED 2026-10-18 (commit: `feat(m1): implement Google SSO login and registration`)

Status: Google OAuth2/OIDC sign-in for Customers is complete on `DucHoangM1`.
The final commit for this work is visible in Git history as
`feat(m1): implement Google SSO login and registration` (see `git log`).

- Integration location: `05_Development/backend` (Spring Security OAuth2/OIDC client,
  `SsoClientConfig` + dedicated SSO `SecurityFilterChain` + `m1identity/sso/*` +
  `SsoController` ticket endpoints + `AuthService.registerWithSso`) and
  `05_Development/frontend` (`SsoCallbackPage`, `roleRouting`, `authApi` SSO calls,
  Login/Register integration, router callback route, i18n).
- Local callback URI (registered in Google Cloud Console, must match exactly):
  `http://localhost:8080/api/v1/auth/sso/callback/google`
- Callback routing fix: the SSO chain's OAuth2 `redirectionEndpoint` base URI is
  `/api/v1/auth/sso/callback/*` (wildcard required so the OAuth2 login filter
  processes `/callback/google` instead of falling through to a 500
  `NoResourceFoundException`). Authorization start route unchanged:
  `GET /api/v1/auth/sso/google`.
- Manually verified in a real browser 2026-10-18 (local dev, backend :8080 + SPA :5173):
  1. Existing Customer signed in with Google and reached the Customer Dashboard.
  2. A new Google identity reached the existing registration form with provider
     name/email prefilled; after entering the missing information and accepting
     the required Terms of Service/Privacy Policy, registration completed and the
     user reached the Customer Dashboard.
  3. Reusing that newly registered Google identity signed directly into the same
     Customer Dashboard without registering again.
  Scope note: only these local Customer login/registration scenarios were manually
  exercised; not every role/provider/error edge case was browser-tested.
- Automated verification (no live provider needed):
  full backend Maven suite 83 tests / 0 failures / 0 errors / 0 skipped;
  focused `SsoAuthEndpointTests` 7/7 passed (includes the callback-filter
  regression test); frontend `npx tsc -b` exit 0 and `npm run build` exit 0.
- Key behaviors (covered by tests + preserved): provider identity validated via
  OIDC `sub` + `AuthIdentity` linking; employee-role accounts blocked from SSO;
  new-Customer flow creates no User/consent at provider callback — account
  creation happens only on registration-form submission via ticket-bound email;
  single-use short-lived tickets; standard JWT issuance; existing
  email/password login, OTP, consent, and role routing intact.
- Google OAuth credentials (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) and
  `SSO_FRONTEND_BASE_URL` remain LOCAL PowerShell-session environment variables
  only — never committed to Git. A new terminal/session may require re-entering
  them. (UPDATED 2026-10-19: GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET are NOW saved as Windows User env vars — verified `True` in a fresh PowerShell session and across a backend restart without re-entering; see 12.1. FACEBOOK_* remain session-scoped.) A pre-commit secret scan of the staged diff and new SSO files found no
  secrets.
- Facebook SSO remains out of scope — not configured or implemented in this task. (Historical for the Google task; Facebook was later implemented as uncommitted work, tried live, and is now DEFERRED — see 11 and 12.2.)
- Next session (2026-10-19): inspect the pushed commit on `origin/DucHoangM1` and
  continue remaining M1 work; do NOT repeat Google setup or redo SSO unless a
  regression is found. No database migration was run for SSO; running services
  were not stopped/restarted during finalization.

---

# HSWRMS - M1 Session Handoff (updated 2026-10-17, branch DucHoangM1)

Status: HEAD is `6a2901d` (`fix(m1): correct role-based login redirects`), in sync with
`origin/DucHoangM1`. Verified 2026-10-17 BEFORE this doc edit: working tree clean
(`git status -sb` — no modifications, no untracked files). CURRENT state (verified this
session): `M1_HANDOFF_CONTEXT.md` is the ONLY modified file, UNCOMMITTED, left for review —
do NOT describe the tree as clean while this edit is pending. Everything described below as
"implemented" is COMMITTED source code (no uncommitted code slices remain). Commits since the previous handoff (`1dcc3b1`):
`700bdd0` (health profile + consent APIs, dev bootstrap, schema alignment), `23b0561`
(merge: integrate main UI design system into M1), `6a2901d` (role-based login redirects).
Auth (register + verify-email; OTP prints to the backend console under the default `dev`
profile — Gmail SMTP only when the `smtp` profile is active), login/JWT, customer-profile
GET/PUT, consent backend (GET/POST consents + revoke + guard), structured Health & Dietary
Profile backend (GET/PUT gated on active HEALTH_DATA_PROCESSING consent), and the matching
frontend wiring all exist as committed code. Migration `_reviewed_m1_health_profile_structured.sql`
was EXECUTED on the local dev DB 2026-10-16 — section 6. Deletion APIs NOT implemented.
Live SQL Server E2E VERIFIED 2026-10-16: register -> console OTP -> verify -> login for all
six demo roles -> profile (200 with JWT, 401 without). Frontend `tsc -b` + `npm run build`
VERIFIED 2026-10-17 for `05_Development/frontend` after `6a2901d` (build evidence only —
browser login per role NOT re-run in that session).

## 1. Branch, HEAD, working tree (verified live via git, 2026-10-17)

- Repository: C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-work
- Branch: DucHoangM1, tracking origin/DucHoangM1, in sync (no ahead/behind).
- HEAD: `6a2901d46d204ef904f6dab4dd13d6edb50e2df5` = `fix(m1): correct role-based login redirects`.
- BEFORE this doc edit (2026-10-17): `git status -sb` CLEAN — zero tracked modifications,
  zero untracked files.
- CURRENT (verified this session): `M M1_HANDOFF_CONTEXT.md` is the ONLY working-tree change;
  `git diff --name-only` returns just this file. Nothing staged, committed, pushed, and no
  other file touched by this doc-only session.
- Commit chain (all pushed / in sync with origin):
  - `ff49668` feat(m1): integrate login and customer profile
  - `3e90756` feat(m1): persist ToS consent on registration
  - `1dcc3b1` feat(m1): integrate email OTP registration flow
  - `700bdd0` feat(m1): structured health profile + consent APIs, dev bootstrap, schema alignment
  - `23b0561` merge: integrate main UI design system into M1
  - `6a2901d` fix(m1): correct role-based login redirects (HEAD)
- Prior handoff staleness note (do NOT rely on the old text): the previous version of this file
  still described HEAD as `1dcc3b1` with 9 unstaged modifications + 20 untracked files. Those
  slices were committed via `700bdd0` (+ consent/health/dev-bootstrap/schema work), `23b0561`
  (design-system merge into `05_Development/frontend`), and `6a2901d` (redirect fix). There are
  NO remaining uncommitted implementation files to preserve — do NOT treat the old section 1/8
  inventories as current.

## 2. Implemented: auth + profile + consent + health + redirects (ALL COMMITTED)

- POST /api/v1/auth/register + verify-email — E2E confirmed on real SQL Server (earlier sessions;
  verified test account ACTIVE).
- POST /api/v1/auth/login — AuthService.login() (generic 401 for bad credentials; 400 EMAIL_NOT_VERIFIED / ACCOUNT_NOT_ACTIVE), JwtTokenProvider.getExpirationMs(), SecurityConfig permitAll matcher.
- GET/PUT /api/v1/customers/me/profile — CustomerProfileController + CustomerProfileService + CustomerProfileResponse + UpdateCustomerProfileRequest. userId always comes from the JWT principal; email is read-only; DOB must be a past date.
- Real frontend wiring: api/auth/authApi.ts (loginRequest); AuthProvider stores the token/session (hswrms_auth_session) and maps backend roles; LoginPage calls the real API (mock timeout removed); CustomerContext loads the server profile (refreshServerProfile/isProfileLoading) with the authenticated identity taking precedence over the stored mock; AccountSettingsPage saves via PUT then refreshes, shows real error messages, and marks email read-only; 5 new alert keys in each of en/fr/ja/vi/zh-CN auth.json; types/auth.ts + types/customer.ts extended.
- customerProfileApi.ts was MANUALLY simplified to just getMyProfile() + updateMyProfile() — no dietary/health fields (see section 5).
- HUMAN-VERIFIED E2E (2026-10-13, user-reported): edited Account Settings profile fields, submitted with Enter, stopped and restarted the backend, and confirmed the new data persisted in SQL Server. This exercises the full chain (UI -> JWT -> PUT /customers/me/profile -> DB -> GET after restart). Negative login paths (wrong password, unverified email) remain covered by unit/slice tests only — not E2E-retested.
- NEW (COMMITTED via `700bdd0`, 2026-10-16) — Consent backend: `GET /api/v1/customers/me/consents`
  (200 history), `POST /api/v1/customers/me/consents` (201 new / 200 idempotent existing;
  server-controlled versions TO_SERVICE=v1.0, HEALTH_DATA_PROCESSING=v1.2; unknown type -> 400
  CONSENT_TYPE_UNSUPPORTED), `POST /api/v1/customers/me/consents/{type}/revoke` (200 closed; none
  active -> 400 CONSENT_NOT_ACTIVE). Identity from JWT principal only. Reusable guard
  `ConsentService.requireActiveConsent` (missing -> 400 HEALTH_CONSENT_REQUIRED). Persistence reuses
  legacy `consent_status` + `revoked_at` columns. `ConsentServiceTest` 6/6.
- NEW (COMMITTED via `700bdd0`, 2026-10-15/16) — Health backend: `GET /api/v1/customers/me/health-profile`
  (200, empty structure + `hasConsented` when none) and `PUT` (200; partial update, child-list full
  replace, §5.3 validation). PUT calls `requireActiveConsent` FIRST (unit-verified no-save on
  failure). Fields: currentHealthCondition, injurySurgeryHistory, mobilityJointNotes,
  currentMedications, stressFatigueLevel (mild|moderate|high), foodIntoleranceNotes,
  dislikedIngredients, kitchenNotes, foodAllergies[], dietaryRequirements[], therapyPreferences[]
  (+ write-only therapyCode). `anonymizationStatus` excluded from DTOs.
  `HealthProfileServiceTest` 3/3. Migration `_reviewed_m1_health_profile_structured.sql` EXECUTED
  on the local dev DB 2026-10-16 (see section 6 — local only; other environments unverified).
- NEW (COMMITTED via `700bdd0`, 2026-10-16) — Health frontend wiring: `healthProfileApi.ts` + `consentApi.ts`
  typed to backend DTOs; `HealthProfilePage.tsx` loads via GET on open (loading banner; error panel
  + Retry, no silent mock fallback), grants HEALTH_DATA_PROCESSING via POST before PUT only when
  newly checked (PUT never sent if grant fails; no implicit revoke), maps all fields/arrays, and
  re-GETs after PUT to render persisted state. `tsc -b` exit 0. Deletion NOT implemented.
- NEW (COMMITTED via `700bdd0`, 2026-10-16) — Fresh-clone auth enablement (zero-manual-setup goal):
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
  - Frontend (`05_Development/frontend`): `LoginPage.tsx` prefills `customer@heavenstay.dev`;
    `AuthProvider.tsx` no longer starts with a mock persona (default `null` — a real login is
    required). Since `6a2901d`, `<RoleSwitcher />` is unmounted from the normal running UI
    (file `src/components/navigation/RoleSwitcher.tsx` kept, unreferenced); the app switches
    roles by logging into the matching demo account. Note: `04_Implement/Frontend_Prototype`
    still contains its own mock-only switcher — out of scope, never part of the M1 runtime.
  - `database/schema.sql`: HealthProfile CREATE aligned with the entity (8 §5.3 columns +
    `CK_HealthProfile_StressLevel`) plus CREATE TABLE `FoodAllergy` / `DietaryRequirement` /
    `HealthProfileTherapyPreference` — fresh installs now match what the code selects (section 6).
- NEW (COMMITTED via `23b0561`, 2026-10-17) — UI design-system merge into M1: 37 files under
  `05_Development/frontend/` (layouts, navigation, motion, customer pages incl. `AccountSettingsPage`
  + `HealthProfilePage`, styles/tokens, landing). Design-only; no auth/RBAC logic change.
- NEW (COMMITTED via `6a2901d` = HEAD, 2026-10-17) — Role-based login redirect fix
  (`05_Development/frontend`, 4 files, +44/-9; verified in `git show 6a2901d` this session):
  - `src/pages/auth/LoginPage.tsx`: `?redirect=` is now accepted only when it is an internal
    path (`startsWith('/')`) under the authenticated role's allowlist
    (`REDIRECT_PREFIXES_BY_ROLE`: customer → `/customer`,`/retreats`,`/`; receptionist →
    `/receptionist`; therapist → `/therapist`; fb_staff → `/fb`; manager →
    `/manager`,`/admin/system-overview`; admin → `/admin`,`/manager`); otherwise falls back to
    that role's `DASHBOARD_BY_ROLE` entry. SSO demo path reuses the same resolver.
    Root cause fixed: a stale `?redirect=/customer/dashboard` no longer traps staff roles on a
    Customer-only route. RBAC untouched — no cross-role grants.
  - `src/app/router/guards/RoleGuard.tsx`: removed the "Demo Role Switcher" reviewer tip →
    neutral signed-in identity text (name + email + role); "Go to My Dashboard" now uses the
    verified `DASHBOARD_BY_ROLE` map via `navigate()` (fixes `fb_staff` → `/fb/dashboard`
    instead of the fabricated `/fb_staff/dashboard`).
  - `src/App.tsx`: unmounted `<RoleSwitcher />` from the normal running UI (file
    `src/components/navigation/RoleSwitcher.tsx` kept, unreferenced — still tracked).
  - `src/app/providers/AuthProvider.tsx`: added the missing `fbstaff` / `fb staff` aliases to
    the existing `normalizeRole` (canonical `fb_staff` preserved). No synthetic tokens, no
    `demo-token-*`, no offline mock-login fallback introduced — real `/api/v1/auth/login` JWT
    flow preserved.
  - Verified file states this session: `git ls-files` confirms all five key files tracked;
    `Select-String` over `05_Development/frontend/src` returns ZERO matches for `demo-token`
    and ZERO remaining references to `RoleSwitcher />` / `navigation/RoleSwitcher` import /
    `Demo Role Switcher` text.
  - Landing routes (all verified against `src/app/router/index.tsx`):
    customer → `/customer/dashboard`; receptionist → `/receptionist/dashboard`;
    therapist → `/therapist/dashboard`; fb_staff → `/fb/dashboard`;
    manager → `/manager/dashboard`; admin → `/admin/dashboard`.

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
   GET /api/v1/customers/me/profile 200 with the Bearer token and 401 without it. SEPARATELY, the
   six seeded demo accounts each logged in with the correct roles (Customer, Receptionist, Therapist, F&B Staff,
   Manager, Admin). Do NOT imply all six accounts went through the full register/OTP flow — only the demo
   login + role check + profile 200/401 pattern is evidenced per account.
   HealthProfile structured columns + 3 child tables confirmed present post-migration.
- STILL UNVERIFIED (do NOT claim): browser/UI-driven run of the `6a2901d` redirect logic
  (SPA login per role incl. stale `?redirect=/customer/dashboard`, RoleGuard landing per role,
  logout/account-switch staleness, RoleSwitcher absence in the running UI), health flow E2E
  (grant HEALTH_DATA_PROCESSING -> PUT health-profile -> GET -> persistence across restart),
  negative auth paths (wrong password / bad OTP) on the live DB, IDOR/concurrency tests on a
  real database.
- CONFIRMED 2026-10-17 (this session, BUILD-ONLY evidence for `05_Development/frontend` at
  HEAD `6a2901d`): `npx --no-install tsc -b` exit 0; `npm run build` exit 0
  (2688 modules transformed, built in ~1s); `oxlint` on the 4 touched files = 0 problems.
  Explicitly NOT verified in that session: any browser/runtime login, backend availability,
  SQL Server state. Do NOT present this build pass as login/RBAC proof.
- EVIDENCE RULE (standing): old test/E2E claims (55/55 backend suite, 2026-10-16 live SQL
  Server HTTP E2E) are HISTORICAL results tied to their sessions, NOT re-validation of the
  current HEAD. They remain recorded above for provenance; any claim about `6a2901d`
  runtime behavior requires a fresh live run.

## 4. Encoding defects — RESOLVED 2026-10-13 (history; re-validation in section 3)

- FIXED — AccountSettingsPage.tsx: the 9 CP437-mangled lines (197, 324, 326, 327, 328, 483, 527, 530, 562) were restored to correct UTF-8 and the UTF-8 BOM stripped, using a byte-safe node Buffer method (NOT PowerShell `>` redirection). Verified at the time: working copy byte-matched checkpoint blob 9a057bc; `git diff 9a057bc` for this file was empty; no mojibake remained.
- FIXED — CustomerContext.tsx: UTF-8 BOM stripped; content otherwise identical to checkpoint. `git diff 9a057bc` empty at the time.
- Re-validation: the post-fix `tsc -b` / `mvnw test` runs recorded in section 3 (2026-10-13 baseline 39 tests; 2026-10-16 55/55) came AFTER these fixes — no separate re-run is outstanding. The old "run both before committing" instruction is WITHDRAWN.
- The i18n locale files (en/fr/ja/vi/zh-CN auth.json) were verified byte-clean (proper Unicode, no BOM, no mojibake).
- Demo-only / mocked (unchanged): password change (no backend), notification preference toggles, membership/villa panel, resend-OTP, SSO buttons, and all customer-domain pages beyond Account Settings (bookings, wellness, etc. still use mock/localStorage data).
- Not implemented: logout/token refresh/revocation (a token stays valid even if account status later changes — accepted known risk); GET /api/v1/customers/me without the /profile suffix is not a route (use /profile).

## 5. Health & Dietary Profile — decisions finalized and PARTIALLY implemented (health/consent committed via `700bdd0`; deletion NOT implemented)

Team-lead decisions (approved 2026-10-13, recorded in `M1_Phase2_Plan.md` §R9 and encoded into
the two authoritative design artifacts below) are FINAL for M1 scope. Implementation status:
consent + health-profile read/write are COMMITTED code (section 2); HealthDataDeletionRequest
execution and any deletion/anonymization endpoints are NOT implemented (deferred — retention
policy + M2 contract `hasActiveOrUpcomingRetreat(customerProfileId)`).
Authoritative design artifacts:
- ERD: `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio` (valid XML).
- API contract: `05_Development/docs/API_CONTRACT.md` §5.

Key approved decisions:
- ConsentRecord: FK stays `user_id` (NOT customer_profile_id); history-preserving grant/revoke
  (grant = INSERT new row; revoke closes via `revoked_at`; re-grant = new row); max 1 active per
  `(user_id, consent_type)`; types {TO_SERVICE, HEALTH_DATA_PROCESSING}. HISTORICAL note: the old
  text claimed the Java `consent_status` enum was SUPERSEDED by `granted` + `revoked_at` with a
  pending code change — that pending-change note is SUPERSEDED; `700bdd0` committed
  `ConsentService` reusing the legacy `consent_status` + `revoked_at` columns (section 2).
- Registration persists a TO_SERVICE consent (provisional policy `v1.0`). HEALTH_DATA_PROCESSING is never auto-granted (policy `v1.2`). Health-profile writes are REJECTED by the backend without an active health consent; the frontend checkbox is never sufficient authorization.
- HealthProfile aligned to the detailed frontend fields (9 content attributes); FoodAllergy + DietaryRequirement remain 1..* children; therapy preferences become a new child `HealthProfileTherapyPreference` (nullable `therapy_code` reserved for future M3 catalog — M1 creates NO catalog); `stress_fatigue_level` enum = mild|moderate|high; `anonymization_status` retained but system-managed (excluded from customer DTOs/UI).
- TreatmentHealthNote is M3-OWNED (therapist-authored); NO M1 customer write API; M1 may later expose only a treatment-safe projection.
- HealthDataDeletionRequest: FK `customer_profile_id` + retained `requested_by_user_id` -> User + `request_type` (scope only, does NOT imply hard-delete vs anonymize). Basic flow = create PENDING / read / cancel while PENDING|DEFERRED. Actual deletion/anonymization execution stays DEFERRED (retention policy + M2 contract `hasActiveOrUpcomingRetreat(customerProfileId)`).

(Committed state, 2026-10-17: consent + health-profile read/write ARE implemented via `700bdd0` —
section 2. Deletion-request execution and any deletion/anonymization endpoints still do NOT exist.)

Session changes (design-only, committed via `700bdd0` unless noted):
- `M1_Phase2_Plan.md`: fixed stale root `M1_ERD.drawio` reference to the authoritative `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio`; older Sections 1-9 marked HISTORICAL/superseded; R-sections carry the revised plan.
- `05_Development/frontend/src/types/customer.ts` + `data/mockCustomer.ts`: removed the obsolete customer-facing `therapistNotes` field (F5) — it was unused by any customer UI and TreatmentHealthNote is M3-owned; therapist-relevant notes now live in the M3 therapist-session flow.

## 6. Database migration status (updated 2026-10-17 — local run vs other environments)

- `_draft_m1_identity_health_profile.sql` — NEVER EXECUTED; do not run it. (Old text describing an
  "uncommitted diff (+24/-6)" is SUPERSEDED — tree is clean at `6a2901d`; the draft remains a
  draft-only file.)
- `_reviewed_m1_health_profile_structured.sql` — EXECUTED 2026-10-16 on the LOCAL dev SQL Server
  ONLY (database `HSWRMS`). Evidence: the live failure it fixed (verify-email 500
  `Invalid column name 'current_health_condition'`) plus the post-migration green run in section 3.
  The script is additive + idempotent (8 ADD COLUMN, 3 CREATE TABLE,
  3 nonclustered indexes; no DROP/UPDATE/DELETE anywhere; no backup was taken — rollback = drop
  those additive objects). It re-ran cleanly as its own idempotency check.
- OTHER ENVIRONMENTS — UNVERIFIED: the file header's "DBA/team approval + backup" requirement
  still applies to ANY other environment — the team must ratify this local run and handle
  shared/prod DBs separately. Do NOT claim the migration ran anywhere besides the local dev DB.
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

## 8. Working-tree inventory — `M1_HANDOFF_CONTEXT.md` is the ONLY uncommitted change

- BEFORE this doc edit (verified 2026-10-17): `git status -sb` CLEAN — no tracked
  modifications, no untracked files.
- CURRENT (verified this session): `M M1_HANDOFF_CONTEXT.md`, uncommitted, left for review.
  `git diff --name-only` returns just this file. Do NOT describe the tree as clean while this
  edit is pending; re-run `git status -sb` before any commit decision.
- Historical inventories (2026-10-13 / 2026-10-16 unstaged edits, untracked consent/health files,
  root `AccountSettings_*` recovery artifacts) are SUPERSEDED — summarized in one line each for
  provenance, do NOT act on them:
  - Old modified list: SecurityConfig / AuthController / AuthService / JwtTokenProvider /
    AuthServiceTest / AuthProvider.tsx / CustomerContext.tsx / LoginPage.tsx /
    AccountSettingsPage.tsx / i18n auth.json (×5) / types/auth.ts / types/customer.ts — all
    committed via `ff49668` → `1dcc3b1` → `700bdd0` → `6a2901d`.
  - Old untracked list (one-line summary; full per-file text removed 2026-10-17 to avoid
    duplication): ConsentController / ConsentRecordResponse / GrantConsentRequest /
    ConsentService / ConsentServiceTest / HealthProfileController / HealthProfileResponse /
    UpdateHealthProfileRequest / FoodAllergy / DietaryRequirement /
    HealthProfileTherapyPreference (+ repositories) / HealthProfileService /
    HealthProfileServiceTest / `_reviewed_m1_health_profile_structured.sql` /
    `config/DevAccountBootstrap.java` / `api/health/*` / `api/auth/*` / `api/customer/*` — all
    committed via `700bdd0`.
  - Root `AccountSettings_*.tmp` / `AccountSettings_show.txt` artifacts: ABSENT from the current
    tree (verified — `git status` clean, no such files). No deletion action needed.
  - `auth-test.http` scratch: state in current tree NOT verified this session — check before use.

- No credentials, OTP values, tokens, or secrets are committed anywhere in this repository
  (carried-over claim; no secret scan was run this session — treat as unverified beyond the
  `demo-token` grep in section 2, which returned zero matches in `05_Development/frontend/src`).

## 9. Next step (updated 2026-10-17): LIVE runtime verification of HEAD — highest value first

1. DONE 2026-10-16: migration/entity/schema.sql compatibility verified — columns and tables
   match the entities; `schema.sql` patched (section 6).
2. DONE 2026-10-16 (with caveat): migration executed on the LOCAL dev DB only — additive,
   idempotent, no backup (section 6). Any other instance still needs the disposable-copy +
   backup procedure required by the script header.
3. DONE 2026-10-16 (historical HTTP-level proof, pre-`6a2901d`): ONE full register -> console
   OTP -> verify -> login -> role check -> profile (200/401) flow, PLUS separate demo login +
   role checks for all six demo roles via HTTP. This does NOT validate the `6a2901d` redirect
   logic — see item 5.
4. DONE 2026-10-17 (build-only, HEAD `6a2901d`): `npx --no-install tsc -b` exit 0,
   `npm run build` exit 0 (2688 modules), `oxlint` 0 problems on the 4 touched files
   (section 3). No runtime meaning — do NOT cite as login/RBAC evidence.
5. NEXT — HIGHEST VALUE (live runtime on HEAD `6a2901d`; run in a future session — nothing
   started, stopped, or tested here):
   a. Start with TWO logins only: `customer@heavenstay.dev` (expect `/customer/dashboard`) and
      ONE staff account, e.g. `receptionist@heavenstay.dev` (expect `/receptionist/dashboard`,
      including the stale `?redirect=/customer/dashboard` case rerouting to the staff dashboard).
      This confirms the basic flow + the `6a2901d` role-aware redirect with minimum effort.
   b. If (a) passes, expand to the remaining four roles (`therapist`, `fbstaff`, `manager`,
      `admin` → section 2 landing map), plus: Customer-only routes still deny staff,
      logout/account-switch leaves no stale role, no RoleSwitcher in UI, no switcher-tip text.
   c. Only then: health-profile E2E (grant HEALTH_DATA_PROCESSING -> PUT -> GET -> restart
      persistence) + negative paths (wrong password / bad OTP).
   Backend = dev profile on :8080 with SQL Server reachable; frontend = `npm run dev` in
   `05_Development/frontend` (:5173). No services were touched in this doc-only session.
6. This handoff-doc update is left UNCOMMITTED for review — the "clean tree" statement in
   sections 1/8 refers to the 2026-10-17 verification BEFORE this edit. Re-run
   `git status -sb` before any commit decision; do NOT commit, stage, or push from this session.
## 13. M1 session finalization (2026-10-21) — READ FIRST where it supersedes 12.x

### 13.1 Current repository state
- Branch: `DucHoangM1`. No `audit-all-modules` branch exists locally or remotely; per the safety rule the session stayed on `DucHoangM1` and did not switch branches. Push target used: `origin/DucHoangM1` (normal, non-force).
- Pre-finalization HEAD: `ffdd40afa9aa4acf1c4f045c12bd20c1376bcf70` (= origin/DucHoangM1); no remote advancement, so push is a fast-forward.
- Commits this session:
  - `bc9100a` — feat(m1): Screen #9 health-data deletion request (customer_profile ownership, contract 5.4)
  - `4f2db9b` — feat(m1): Facebook SSO flow, SSO ticket/linking, email delivery adapters, frontend auth updates
  - handoff commit = HEAD after this update (hash recorded in the finalization report)
- Working tree is clean after these commits except for nothing intentionally left uncommitted. No secrets, `.env`, generated artifacts, or unrelated changes were staged.

### 13.2 Google SSO
- Status: verified working in a real session (prior). Credentials stored as Windows User env vars. No code changes this session. Do not redo unless a new failure occurs.

### 13.3 Facebook SSO (status updated — no longer deferred)
- Verified for a Meta app Tester account: Facebook OAuth consent reached and callback succeeds for Tester accounts.
- When the Facebook email matches an existing HSWRMS account, the app initiates email OTP confirmation/linking (SsoLinkRequest / SsoTicketService).
- OTP email delivery via Gmail SMTP confirmed in a real mailbox (SmtpEmailDeliveryAdapter).
- Public login for arbitrary non-Tester accounts remains unverified because the Meta app is not released to Live. Do not reopen this task without new evidence.
- Facebook credentials remain session-scoped unless saved as persistent env vars (same pattern as Google).

### 13.4 Screen #9 — Health Data Deletion Request
- Entity `HealthDataDeletionRequest` now owns `customer_profile_id` (FK -> `CustomerProfile.customer_profile_id`, NOT NULL). Legacy `health_profile_id` retained, nullable, with FK -> `HealthProfile`.
- `request_type` CHECK = `HEALTH_DATA` (API Contract §5.4). `request_status` CHECK = `PENDING`/`DEFERRED`/`COMPLETED`/`CANCELLED`.
- Ownership enforced in backend: customer profile resolved from the authenticated user; active requests queried by `customer_profile_id` + status IN (`PENDING`, `DEFERRED`).
- Actual deletion/anonymization is NOT implemented in M1; the service only creates the request. Execution is deferred to retention policy / M2.
- Migration `_reviewed_m1_deletion_request_customer_profile.sql` remains DRAFT and UNEXECUTED; not database-validated.
- Migration CHECK constraint name aligned to `CK_HealthDeletion_Status` to match `schema.sql` / design baseline (prevents a duplicate constraint on schema.sql-created DBs).
- Legacy `health_profile_id` data requires the documented read-only preflight before migration.

### 13.5 Schema initialization path
- `05_Development/database/schema.sql` is the dev baseline (Hibernate `ddl-auto: none`; ADR-03). No Flyway/Liquibase.
- `03_Design/Database/HSWRMS_SQLServer_Database.sql` remains the frozen design reference and is NOT the development provisioning source (per repository documentation). Do not modify unless explicitly approved.

### 13.6 Manual migration strategy
- Scripts under `05_Development/database/migrations/` are manual, idempotent (guarded by `COL_LENGTH`/`OBJECT_ID` existence checks), and header-marked DRAFT; require DBA/team approval + backup.
- No automated pickup by the application.

### 13.7 Tests / build actually run this session
- `HealthDataDeletionRequestServiceTest`: 12/12 pass.
- `SsoUserInfoDiagnosticsServiceTest`: 4/4 pass (test-only fix: non-empty OIDC ID-token claims).
- `SsoServiceTest` 14/14, `SsoTicketServiceTest` 6/6, `SsoJwtRoundTripTest` 1/1, `SsoAuthEndpointTests` 12/12, `AuthServiceSsoFacebookTest` 9/9, `SmtpEmailDeliveryAdapterTest` 2/2, `EmailDeliveryAdapterProfileTest` 5/5, `DevEmailDeliveryAdapterTest` 2/2, `SsoLinkTicketTtlTests` 1/1.
- Backend `test-compile`: BUILD SUCCESS.
- Frontend `npx tsc --noEmit`: exit 0.
- Exhaustive M1 regression was NOT re-run this session (only focused SSO + Screen #9 tests). Full regression deferred to M2-M6 integration.

### 13.8 Outstanding work
- Coordinate SRS differences with BA.
- Complete full regression testing after M2-M6 integration.
- Validate and approve the deletion-request migration against an appropriate DB after running the preflight checks.
- Resolve remaining retreat/M2 and retention-policy decisions (DEFERRED->COMPLETED transition, `hasActiveOrUpcomingRetreat`, hard delete vs anonymization, executor).
- Ensure M6 uses the shared M1 `User`, `Role`, and `UserRole` system.
- Facebook public/Live access remains blocked/pending Meta requirements; do not reopen without new evidence.
- Optional performance index on `HealthDataDeletionRequest.customer_profile_id` for the active-requests query (not a contract requirement).

### 13.9 Status caution
- Do NOT mark all of M1 complete. Runtime verification and the decisions above are still pending.

