# M1 Integration Branch Comparison Report

**Original M1 workspace:** `C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-work`  
**Isolated review worktree:** `C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-integration-review`

## 1. Branch and HEAD summary

- Current M1 branch: `DucHoangM1`
- Current M1 HEAD: `1d9750e1e31785429d42ad1f8628df9e7a4f52dd`
- Integration branch: `feature/hswrms-m1-m6-integration`
- Fetched integration HEAD: `efb9b5f` (after M1 finalization)
- Remote ref verified: `refs/heads/feature/hswrms-m1-m6-integration`
- Merge base: `1d9750e1e31785429d42ad1f8628df9e7a4f52dd` (equal to current M1 HEAD)

## 2. Commit ancestry and divergence

- `DucHoangM1` is an ancestor of `feature/hswrms-m1-m6-integration`.
- Unique commits on M1 relative to integration: 0.
- Unique commits on integration relative to M1: 137.
- Therefore, all committed M1 work is already represented in the integration branch. The divergence is integration's additional M2-M6 and cross-module work.
- The current dirty M1 working tree is **not** represented in either committed branch.

## 3. Fetch and worktree result

- Exact ref `refs/heads/feature/hswrms-m1-m6-integration` was verified and fetched successfully.
- Remote-tracking ref created: `refs/remotes/origin/feature/hswrms-m1-m6-integration`.
- Isolated detached worktree created at `C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-integration-review`.
- Integration worktree HEAD: `07c1d5d198decbd6046cfd7ca65426b9a2df15ae`.
- Integration worktree status: clean.
- Original M1 worktree remains on `DucHoangM1` with its existing modified/untracked files preserved.

## 4. M1 features already present in integration

The integration branch contains the M1 backend and frontend already merged from `DucHoangM1`, including:
- Authentication, registration, OTP verification, login/JWT, role authorization.
- Google/Facebook SSO controllers, services, tickets, and callback flow.
- Customer profile, health profile, consent, and deletion-request APIs.
- `HealthDataDeletionRequest` using `customer_profile_id` and the reviewed deletion migration.
- M1 ERD, API Contract section 5, and development schema/migration files.
- Backend M1 tests and security authorization tests.

## 5. M1 features missing from integration (uncommitted M1 work)

The following current M1 changes exist only in the dirty working tree and are not in either committed branch:

Backend:
- `ConsentController.java`
- `CustomerProfileController.java`
- `HealthDataDeletionRequestController.java`
- `HealthProfileController.java`
- `EmailOtpRepository.java`
- `AuthService.java`
- `CustomerEndpointRoleAuthorizationTests.java` (untracked)
- `AuthServiceRegressionTest.java` (untracked)

Frontend:
- `healthProfileApi.ts`
- `CustomerContext.tsx`
- `SpaContext.tsx`
- `mockCustomer.ts`
- `CustomerDashboardPage.tsx`
- `HealthDataDeletionPage.tsx`
- `HealthProfilePage.tsx`
- `RetreatBookingPage.tsx`
- `TherapistSessionDetailPage.tsx`
- `customer.ts`, `spa.ts`
- `deletionRequestApi.ts` (untracked)

Reports:
- `06_Reports/M1_Engineering_Quality_Dossier.md` (untracked)
- `06_Reports/M1_Test_Coverage_Matrix.md` (untracked)
## 6. Integration changes that affect M1

The integration branch adds cross-module and hardening changes on top of M1:
- Account lockout support: `AccountLockoutService`, `failed_login_count`, `locked_at`, `last_login_at` in `User`, and login lockout logic in `AuthService`.
- Audit logging in `HealthProfileService` via `AuditLogService`.
- M6 permission integration in `AuthController` via `/me`, `PermissionService`, and `CurrentActor`.
- Role entity changes: canonical role helpers, constants, description length change from 500 to 250, removal of `equals`/`hashCode` overrides.
- `User` additions for login security.
- API Contract and schema additions.
- M2-M6 modules, migrations, seeds, reports, and frontend pages.

## 7. Potential same-file conflicts and incompatibilities

1. `AuthService.java`: integration adds `AccountLockoutService` dependency and lockout behavior; current dirty M1 also modifies `AuthService` for authorization hardening. Both touch the same constructor and login flow. Manual reconciliation is required.
2. `HealthProfileService.java`: integration adds audit logging and a new constructor; current dirty M1 may also touch this service indirectly. Constructor compatibility must be verified.
3. `AuthController.java`: integration heavily rewrites it to add `/me` and M6 permission dependencies, with duplicate imports in the diff. Current M1 work includes customer authorization hardening. This is a high-risk merge file.
4. `Role.java`: integration changes table mapping, column nullability, description length, and equality semantics. M1 security and tests may depend on `equals`/`hashCode` or the quoted table name. This requires careful review.
5. `User.java`: integration adds account-lockout fields. M1 tests/entities must be checked for schema compatibility.
6. `CustomerContext.tsx`: integration modifies this file substantially. Current dirty M1 also modifies it. This is likely a real conflict.
7. `API_CONTRACT.md` and `schema.sql`: integration adds changes. M1's deletion schema and API contract must not be overwritten accidentally.
8. M6 dependency: integration's `AuthController` and `HealthProfileService` depend on M6 services. M1-only builds may fail unless those dependencies are available or optional injection is handled.

## 8. Shared database/schema/API risks

- Integration adds many migrations and seed scripts. The M1 deletion-request schema mismatch remains governed by the DRAFT ONLY migration; no migration should be executed without approval.
- `HealthDataDeletionRequest` remains `customer_profile_id`-based in both branches, which is consistent with the approved M1 design.
- Consent and health-profile entities are shared with M2-M6 consumers; changes to role/security assumptions can affect M1.
- The installed local database may still be stale relative to both branches.

## 9. Uncommitted M1 work that must be preserved

All current dirty changes listed in section 5 must be preserved. In particular:
- Backend authorization hardening and regression tests.
- Frontend API/context changes that reduce mock/localStorage authority.
- The two M1 documentation reports and this comparison report.

## 10. Recommended integration strategy

1. Do not merge directly into the dirty M1 worktree.
2. First reconcile the current dirty M1 changes into a clean commit or patch set after review.
3. Compare and reconcile high-risk files: `AuthService`, `AuthController`, `HealthProfileService`, `Role`, `User`, `CustomerContext`.
4. Verify optional M6 dependencies (`PermissionService`, `AuditLogService`) do not break M1-only builds.
5. Re-run M1 backend regression, frontend build/lint, and runtime smoke tests after reconciliation.
6. Confirm the deletion schema migration status with the team lead before any database change.
7. Keep the isolated review worktree available for read-only comparison until the merge is planned.

## 11. Recommendation

The integration branch already contains committed M1 work, but the current uncommitted M1 changes and cross-module M6 dependencies require reconciliation before a controlled merge. Status: **needs reconciliation first**, not ready for an immediate merge.

- `06_Reports/M1_INTEGRATION_BRANCH_COMPARISON.md` (this file, untracked)
