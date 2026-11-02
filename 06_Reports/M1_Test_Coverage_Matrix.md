# HSWRMS M1 — Test Coverage Matrix

**Branch:** `feature/hswrms-m1-m6-integration`  
**Type:** Read-only test coverage and edge-case baseline. No tests or source were changed.

## 1. Status legend

- **Verified pass**: behavior actually exercised and passed, with evidence.
- **Verified fail**: behavior exercised and failed.
- **Implemented not tested**: implementation exists but no dedicated test evidence.
- **Blocked**: implementation exists but cannot currently be verified due to environment/schema/dependency.
- **Not implemented**: implementation is absent.
- **Unresolved requirement**: expected behavior is not defined or approved.

Test layers: Unit, Controller/Security, Repository/Contract, Integration, Runtime/API, Browser/E2E, Static inspection.

Priority: P0 security/corrupt sensitive data; P1 core flow failure or false success; P2 resilience/recovery/concurrency/stale state; P3 low-impact demo residue.

Code coverage percentages: Unknown (no coverage report found).

## 2. Matrix

| Test ID | Requirement / use case | Scenario | Preconditions | Expected behavior (source) | Priority | Implementation / file | Existing test | Layer | Last known result | Status | Recommended next action |
|---|---|---|---|---|---|---|---|---|---|---|---|
| M1-AUTH-001 | UC01 | Valid registration creates user and verification state | No existing user | Account is created and verification can proceed (API Contract/AuthService) | P1 | `AuthController.register`, `AuthService.register` | `AuthServiceTest`, `AuthServiceRegressionTest` | Unit/Integration | Focused suites reported pass | Implemented not tested at browser level | Add controller/runtime registration test |
| M1-AUTH-002 | UC01 | Missing/invalid registration fields | Invalid request | Backend validation rejects request with 400 (API Contract §2) | P1 | `AuthController`, DTO validation | `AuthLoginEndpointTests` partial | Controller | Not separately evidenced | Implemented not tested | Add request validation tests |
| M1-AUTH-003 | UC01 | Duplicate email registration | Existing user | Conflict response, no duplicate account (AuthService regression) | P0 | `AuthService.register` | `AuthServiceRegressionTest.registerGuest_normalDuplicateEmail_throwsConflictBeforeSave` | Unit | Reported pass | Verified pass (unit) | Add concurrent registration test |
| M1-AUTH-004 | UC01 | Concurrent duplicate registrations | Same email submitted simultaneously | Only one account; constraint violation mapped to conflict | P0 | `AuthService`, DB unique constraint | None | Integration | Not run | Implemented not tested | Add transaction/concurrency test |
| M1-AUTH-005 | UC02 | OTP issued and previous OTP invalidated | Registration/reissue | New OTP valid; old OTP invalid (AuthService regression) | P1 | `AuthService`, `EmailOtpRepository` | `AuthServiceRegressionTest.registerGuest_issuingNewOtp_callsInvalidatePreviousOtpsFirst` | Unit | Reported pass | Verified pass (unit) | Add persistence-level test |
| M1-AUTH-006 | UC02 | Valid OTP verifies account | Pending OTP | Account becomes verified/active (AuthService) | P1 | `AuthService.verifyEmail` | `AuthServiceTest` / `AuthLoginEndpointTests` | Unit/Controller | Reported pass | Implemented not tested end-to-end | Add runtime API test |
| M1-AUTH-007 | UC02 | Old OTP rejected after reissue | Two OTPs issued | `OTP_INVALID` (AuthService regression) | P1 | `AuthService.verifyEmail` | `AuthServiceRegressionTest.verifyEmail_oldOtpAValueWhileOtpBIsLatest_returnsOtpInvalid` | Unit | Reported pass | Verified pass (unit) | Add controller test |
| M1-AUTH-008 | UC02 | Expired OTP rejected | Expired OTP | OTP rejected (EmailOtpRepository contract) | P1 | `EmailOtpRepository`, `AuthService` | `EmailOtpRepositoryContractTest` | Repository/Contract | Reported pass | Implemented not tested for exact expiry | Add expiry boundary tests |
| M1-AUTH-009 | UC02 | Used OTP cannot be reused | Consumed OTP | OTP rejected (AuthService) | P1 | `AuthService` | None dedicated | Unit | Not evidenced | Implemented not tested | Add reuse test |
| M1-AUTH-010 | UC02 | Attempt-count limit/error recovery | Repeated invalid OTP | Attempts tracked and rejection occurs (EmailOtp) | P2 | `EmailOtp` entity/repository | None dedicated | Unit/Integration | Not evidenced | Implemented not tested | Add attempt-limit tests |

| M1-AUTH-011 | UC04 | Valid login returns JWT and role | Active verified user | JWT and role returned (API Contract) | P0 | `AuthController.login`, `AuthService.login` | `AuthLoginEndpointTests` | Controller/Security | Reported pass | Verified pass (controller) | Add runtime API smoke test |
| M1-AUTH-012 | UC04 | Wrong password rejected | Existing user | 401/invalid credentials (API Contract) | P0 | `AuthService.login` | `AuthLoginEndpointTests` partial | Controller | Not separately evidenced | Implemented not tested | Add negative login test |
| M1-AUTH-013 | UC04 (login; depends on UC02 verification) | Unverified user cannot log in or is handled | Unverified account | Account lifecycle enforced (AuthService) | P1 | `AuthService.login` | None dedicated | Unit | Not evidenced | Implemented not tested | Add lifecycle test |
| M1-AUTH-014 | UC04 | Expired or malformed JWT rejected | Expired/invalid token | 401 (API Contract §2) | P0 | Spring Security/JWT provider | `JwtTokenProviderTest`, `SsoJwtRoundTripTest` | Unit | Reported pass | Verified pass (unit) | Add endpoint 401 test |
| M1-AUTH-015 | UC04 (role boundary) | Employee role cannot access customer endpoints | Employee JWT | 403 (API Contract) | P0 | `@PreAuthorize`, controllers | `CustomerEndpointRoleAuthorizationTests` | Controller/Security | Reported pass | Verified pass (controller) | Keep in regression |
| M1-AUTH-016 | Cross-cutting authorization (UC04/UC07/UC08/UC09/UC10) | User A cannot read/modify user B data | Two customer accounts | 401/404 (API Contract) | P0 | Service ownership checks | `HealthDataDeletionRequestServiceTest.cancel_notOwned_notFound` partial | Unit/Integration | Unit only | Implemented not tested end-to-end | Add integration ownership tests |
| M1-AUTH-017 | UC05 | Google login/link/registration | Provider configured | Ticket exchange/registration works (SSO service) | P1 | `SsoController`, `SsoService`, `SsoTicketService` | `SsoAuthEndpointTests`, `SsoServiceTest`, `SsoTicketServiceTest` | Unit/Controller | Reported pass; user-verified browser flow | Verified pass with provider limitations | Document provider setup dependency |
| M1-AUTH-018 | UC06 | Facebook login/link in Tester mode | Meta Tester account | Flow works in Tester mode (SSO service) | P1 | Same as above | `AuthServiceSsoFacebookTest` | Unit | Reported pass in Tester mode | Verified pass with limitation | Public Live blocked by Meta |
| M1-AUTH-019 | UC05/UC06 | Expired/replayed ticket rejected | Ticket consumed/expired | Rejection (SsoTicketService) | P1 | `SsoTicketService` | `SsoLinkTicketTtlTests`, `SsoTicketServiceTest` | Unit | Reported pass | Verified pass (unit) | Add endpoint replay test |
| M1-PROFILE-001 | UC07 | Authenticated customer reads own profile | Customer JWT | Profile fields returned (API Contract) | P1 | `CustomerProfileController`, `CustomerProfileService` | `CustomerProfileControllerTests`, `CustomerProfileServiceTest` | Controller/Unit | Reported pass | Verified pass (backend) | Add runtime API smoke test |
| M1-PROFILE-002 | UC07 | Frontend profile edit persists | Customer JWT | PUT updates profile and read-back reflects changes | P1 | Backend `CustomerProfileController`; frontend `CustomerContext.updateProfile` does not call API | Backend tests only | Static inspection | Frontend write local-only | Not implemented on frontend | Wire `updateProfile` to `updateMyProfile` |
| M1-PROFILE-003 | UC07 (fallback subflow) | No server profile falls back safely | Logged-in customer, API unavailable | Stored/mock fallback used without corrupting identity | P2 | `CustomerContext.profile` | None | Static inspection | Not evidenced | Implemented not tested | Add fallback/context test |
| M1-HEALTH-001 | UC08 | Empty/unknown profile loads | Customer with no saved profile | Backend returns profile shape; unknown stress is null (API Contract) | P1 | `HealthProfileController`, `HealthProfileService` | `HealthProfileServiceTest` | Unit/Integration | Runtime GET returned HTTP 200 | Verified pass (runtime/API) | Add browser load test |
| M1-HEALTH-002 | UC08 | Valid save persists and reloads | Active consent | PUT succeeds and GET returns same values (API Contract) | P0 | `HealthProfileController`, `HealthProfileService` | `HealthProfileServiceTest.write_withConsent_persists` | Unit + Runtime/API | Runtime PUT/GET passed | Verified pass | Keep regression |
| M1-HEALTH-003 | UC08 | Save after consent revoked is rejected | Revoked consent | `HEALTH_CONSENT_REQUIRED` (HealthProfileService) | P0 | `HealthProfileService` | `HealthProfileServiceTest.write_withoutConsent_rejected` | Unit | Reported pass | Verified pass (unit) | Add controller/runtime test |
| M1-HEALTH-004 | UC08 | Null/empty optional fields | Authenticated customer | Null/empty accepted or mapped consistently (API Contract) | P2 | `UpdateHealthProfileRequest`, service | Partial in service tests | Unit | Not separately evidenced | Implemented not tested | Add empty-field tests |
| M1-HEALTH-005 | UC08 | Oversized notes rejected or handled | Long input | Validation/constraint behavior (API Contract provisional limits) | P2 | DTO validation, DB columns | None | Unit/Integration | Not evidenced | Implemented not tested | Define limits and test |
| M1-HEALTH-006 | UC08 | Partial PUT updates only supplied fields | Existing profile | Supplied fields update; omitted fields remain (API Contract) | P2 | `HealthProfileService` | None dedicated | Unit | Not evidenced | Implemented not tested | Add partial update test |
| M1-HEALTH-007 | UC08 | Allergies/dietary/therapy arrays map correctly | Save arrays | Arrays persist and read back (API Contract) | P1 | `HealthProfileService`, entities | `HealthProfileServiceTest` partial | Unit | Not separately evidenced | Implemented not tested | Add array round-trip test |
| M1-HEALTH-008 | UC08 | Unknown stress displays unselected | Null stress | UI maps null to unselected (frontend mapping) | P2 | `HealthProfilePage`, `CustomerContext.mapHealthProfileToWellness` | Static inspection | Static inspection | API stress null observed | Implemented, browser not tested | Add browser assertion |
| M1-HEALTH-009 | UC08 | Profile completeness after save | Saved profile | Definition unresolved; currently always false | P2 | `CustomerContext.mapHealthProfileToWellness` | None | Static inspection | Code shows `isComplete: false` | Unresolved requirement | Approve completeness rule |

| M1-CONS-001 | UC09 | Active consent visible | Granted consent | Active HEALTH_DATA_PROCESSING consent returned (API Contract) | P1 | `ConsentController`, `ConsentService` | `ConsentServiceTest`, `CustomerEndpointRoleAuthorizationTests` | Unit/Controller | Runtime wellness load used list | Implemented not tested runtime | Add runtime consent test |
| M1-CONS-002 | UC09 | Grant consent from health page | No active consent | Consent record created and write succeeds (API Contract) | P1 | `ConsentController.grant`, `ConsentService` | `ConsentServiceTest` | Unit | Not separately runtime tested | Implemented not tested runtime | Add runtime grant test |
| M1-CONS-003 | UC09 | Revoke consent | Active consent | Revoke sets revoked state; subsequent writes fail (API Contract) | P1 | `ConsentController.revoke`, `ConsentService` | `ConsentServiceTest` | Unit | Not runtime tested | Implemented not tested | Add revoke/re-write test |
| M1-CONS-004 | UC09 (role boundary) | Non-customer cannot access consent endpoints | Employee JWT | 403 (API Contract) | P0 | ConsentController `@PreAuthorize` | `CustomerEndpointRoleAuthorizationTests` | Controller/Security | Reported pass | Verified pass (controller) | Keep regression |
| M1-DEL-001 | UC10 | List own deletion requests | Customer JWT | Requests returned; none returns `[]` (API Contract) | P1 | `HealthDataDeletionRequestController.list`, service | `HealthDataDeletionRequestServiceTest.list_ownRequestsOnly` | Unit | Runtime GET returned HTTP 500 | Verified fail (runtime) | Fix schema, retest |
| M1-DEL-002 | UC10 | Create HEALTH_DATA request | No open request, active consent | PENDING request created (API Contract) | P1 | Controller/service/repository | `HealthDataDeletionRequestServiceTest.create_*` | Unit | Runtime POST returned HTTP 500 | Verified fail (runtime) | Fix schema, retest |
| M1-DEL-003 | UC10 | Duplicate pending/deferred request rejected | Open request exists | 409 `DELETION_REQUEST_ALREADY_OPEN` (API Contract) | P1 | Service duplicate checks | `create_duplicatePending_rejected`, `create_duplicateDeferred_rejected` | Unit | Reported pass | Verified pass (unit) | Add runtime duplicate test |
| M1-DEL-004 | UC10 | Unknown request type rejected | Customer JWT | 400 `REQUEST_TYPE_UNSUPPORTED` (API Contract) | P2 | `normalizeRequestType` | `create_unknownType_rejected` | Unit | Reported pass | Verified pass (unit) | Add controller test |
| M1-DEL-005 | UC10 | User cannot read/cancel another user's request | Other user's request ID | 404 no existence disclosure (API Contract) | P0 | Service/repository ownership query | `cancel_notOwned_notFound` | Unit | Reported pass | Verified pass (unit) | Add integration test |
| M1-DEL-006 | UC10 | Cancel pending request | PENDING request | Status becomes CANCELLED (API Contract) | P1 | `cancelDeletionRequest` | `cancel_pending_cancelled` | Unit | Not runtime tested | Implemented not tested runtime | Retest after schema fix |
| M1-DEL-007 | UC10 | Cancel deferred request | DEFERRED request | Status becomes CANCELLED (API Contract) | P1 | `cancelDeletionRequest` | `cancel_deferred_cancelled` | Unit | Not runtime tested | Implemented not tested runtime | Retest after schema fix |
| M1-DEL-008 | UC10 | Completed request cannot be cancelled | COMPLETED request | 409 `DELETION_REQUEST_NOT_CANCELLABLE` (API Contract) | P1 | `cancelDeletionRequest` | `cancel_completed_rejected` | Unit | Reported pass | Verified pass (unit) | Add controller test |
| M1-DEL-009 | UC10 | Cancel already-cancelled request | CANCELLED request | 200 idempotent (service) | P2 | `cancelDeletionRequest` | `cancel_alreadyCancelled_idempotent` | Unit | Reported pass | Verified pass (unit) | Add runtime test |
| M1-DEL-010 | UC10 | Request is never marked completed in M1 | Any request | `processedAt` remains null (service) | P2 | Service lifecycle | `requestNeverCompleted_processedAtNull` | Unit | Reported pass | Verified pass (unit) | Keep regression |
| M1-DEL-011 | UC10 (contract subflow) | Optional reason submitted | Reason entered | Reason is not persisted; backend DTO has no reason field | P3 | `HealthDataDeletionPage`, `CustomerContext`, `CreateDeletionRequestRequest` | None | Static inspection | Code confirms discard | Unresolved requirement | Decide contract change or remove field |
| M1-DEL-012 | UC10 (schema subflow) | Installed DB matches approved schema | Local SQL Server | Table has customer_profile_id, request_type, updated_at | P1 | Migration script (DRAFT ONLY) | None | Static inspection | DB lacks columns | Verified fail (runtime) | Approve/execute migration |

| M1-CTX-001 | Cross-cutting (no standalone UC) | Account switch clears/refreshes server data | Login as different user | Context resets and reloads server profile/health/deletion | P2 | `CustomerContext` effects | None | Static inspection | Not evidenced | Implemented not tested | Add context tests |
| M1-CTX-002 | Cross-cutting (no standalone UC) | Backend unavailable shows error, not mock success | Backend down | Error message shown; no false success (HealthProfilePage) | P2 | API modules, pages | None | Browser/E2E | Not run | Implemented not tested | Add E2E failure test |
| M1-CTX-003 | Cross-cutting (no standalone UC) | Stored profile fallback after logout | Logged-out state | Fallback does not override authenticated identity | P2 | `CustomerContext.profile` | None | Static inspection | Not evidenced | Implemented not tested | Add context tests |
| M1-CTX-004 | Cross-cutting (no standalone UC) | Duplicate submission after timeout | Slow/failed request | No duplicate or clear error; list refreshed (API contract) | P2 | Deletion service/API | None | Runtime/API | Not tested | Blocked/Implemented not tested | Add retry/idempotency tests |
| M1-CONSUMER-001 | UC08 (dashboard status) | Dashboard reflects saved profile | Saved health profile | Status should reflect completeness; currently always false | P2 | `CustomerDashboardPage`, `CustomerContext` | None | Static inspection | Code shows hardcoded false | Implemented not tested | Fix and test |
| M1-CONSUMER-002 | UC08 (treatment-safe projection) | Therapist sees treatment-relevant notes only | Logged-in canonical customer | Only relevant medical/mobility/stress data exposed (M1 ERD/privacy) | P1 | `SpaContext.getTherapistRelevantWellnessInfo` | None | Static inspection | Code shows filtering | Implemented not tested | Add projection tests |
| M1-CONSUMER-003 | M3 dependency (no M1 UC) | Spa scheduling uses mock catalogs | Any user | Mock data is demo-only and not M1-owned | P3 | `SpaContext` initial state | None | Static inspection | Code uses `INITIAL_*` | Not implemented backend | Track as M3 dependency |
| M1-CONSUMER-004 | UC08 (dietary projection) | F&B projection uses real wellness data for logged-in customer | Logged-in customer | Allergies/restrictions come from backend wellness data (M1) | P2 | `DiningContext.getDietaryProjection` | None | Static inspection | Code uses wellnessProfile | Implemented not tested | Add projection test |
| M1-CONSUMER-005 | M4 dependency (no M1 UC) | Dining uses mock menu/orders | Any user | Mock data is demo-only and not M1-owned | P3 | `DiningContext` initial state | None | Static inspection | Code uses `MOCK_*` | Not implemented backend | Track as M4 dependency |
| M1-DB-001 | Cross-cutting (UC08 consent constraint) | Health profile consent constraint | Revoked consent | Write rejected by service (HealthProfileService) | P0 | `HealthProfileService`, DB | `write_withoutConsent_rejected` | Unit | Reported pass | Verified pass (unit) | Add DB constraint test |
| M1-DB-002 | Cross-cutting (all M1 UCs) | Entity matches approved schema | Local DB | Entity and schema agree for all M1 tables | P0 | All M1 entities/schema | None | Static inspection | Deletion mismatch confirmed | Verified fail (static) | Reconcile schema |
| M1-DB-003 | Cross-cutting (all M1 UCs) | Draft migration not executed without approval | Local DB | Migration remains draft unless approved | P2 | Migration headers | None | Static inspection | Headers say DRAFT ONLY | Verified pass (static) | Keep policy |
| M1-DB-004 | UC10 (concurrency) | Concurrent deletion create requests | Same customer | Duplicate-open protection prevents duplicates | P1 | Service/repository | None | Integration | Not run | Implemented not tested | Add concurrency test |
| M1-SEC-001 | Cross-cutting authorization (all M1 UCs) | No-token access rejected | No JWT | 401 (API Contract) | P0 | Spring Security | `CustomerEndpointRoleAuthorizationTests` no-token cases | Controller/Security | Reported pass | Verified pass (controller) | Keep regression |
| M1-SEC-002 | UC08 (privacy boundary) | Therapist does not receive full health profile | Therapist JWT | Only treatment-relevant notes returned (M1 ERD/privacy) | P1 | `SpaContext` projection | None | Static inspection | Code filters fields | Implemented not tested | Add projection/contract test |
| M1-SEC-003 | UC08 (privacy boundary) | F&B does not receive unnecessary health data | F&B user | Only allergies/dietary restrictions returned (M1 privacy) | P1 | `DiningContext` projection | None | Static inspection | Code filters fields | Implemented not tested | Add projection/contract test |

## 3. Scenario coverage summary

- Registration, OTP, login, JWT, role authorization: good unit/controller coverage; browser/runtime coverage is limited.
- Health profile: strong unit/runtime evidence; null/empty/oversized/partial tests are weak.
- Consent: unit coverage exists; runtime grant/revoke not separately verified.
- Deletion requests: strong unit coverage; runtime blocked by schema mismatch.
- Frontend context, fallback, stale state, account switching: no dedicated tests found.
- Consumers: static inspection only; no automated projection tests found.
- Code coverage percentages: Unknown.

## 4. Top missing or weak tests

P0:
1. Runtime deletion request list/create/cancel after schema alignment.
2. Concurrent duplicate registration and duplicate deletion request.
3. End-to-end ownership/cross-user isolation.

P1:
4. Frontend customer-profile write persistence.
5. Consent grant/revoke runtime and re-write behavior.
6. Therapist/F&B projection assertions.

P2:
7. Null/empty/oversized/partial health profile fields.
8. Context staleness, account switching, loading/error handling.
9. Request retry/timeout ambiguity.

P3:
10. Demo-only consumer mock-data labeling and cleanup.

## 5. Facts that could not be verified

- Exact backend test pass count in the current workspace was not re-run in this task; prior reports state 145 tests passed and 50 focused tests passed.
- Frontend lint warning count is from prior reports, not re-run here.
- Runtime browser behavior was not executed in this task.
- Code/line coverage is Unknown.
- Intended integration branch is unconfirmed.
- Some business rules (completeness, reason field, retention) remain unresolved.

| M1-AUTH-020 | UC03 | Password reset end-to-end | Reset request | Not implemented backend; frontend is simulated | P1 | `PasswordResetPage.tsx` only | None | Static inspection | Simulation only | Not implemented | Implement backend or remove/disable screen |
