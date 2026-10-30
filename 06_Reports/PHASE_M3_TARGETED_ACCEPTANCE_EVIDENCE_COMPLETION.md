# HeavenStay Wellness Resort Management System (HSWRMS)
## Module M3: Targeted Acceptance Evidence Completion (Read-First, Minimal Repair)

- **Date:** October 30, 2026
- **Repository:** `HSWRMS-audit-all-modules`
- **Target Branch:** `feature/hswrms-m1-m6-integration`
- **Baseline Git Commit:** `07c1d5d` (Preserved intact; zero commits/pushes made)
- **Document Type:** Targeted Acceptance Evidence Completion Report (Updated with Final Refinements)
- **Baseline Test Suite:** `com.heavenstay.hswrms.m3spa.SpaAuthoritativeAcceptanceEvidenceTest` (17 tests)

---

### 1. Executive Summary & Objective

In accordance with the post-verification mandate, this task addressed and closed specific evidence gaps in the authoritative 14-rule compliance matrix for **Module 3: Spa & Therapy Scheduling**.

Without conducting an unnecessary full-system rewrite, this task followed a **read-first, minimal-repair protocol**:
1. Deeply inspected existing service logic in `SpaSessionService.java`, `SchedulingEngineService.java`, `SessionRecoveryService.java`, and `SessionTimelineScheduler.java`.
2. Created a dedicated, rigorous integration test suite: `SpaAuthoritativeAcceptanceEvidenceTest.java` containing 17 end-to-end acceptance tests.
3. Successfully executed and verified all 17 acceptance tests under isolated in-memory H2 conditions.
4. Confirmed zero regressions across the entire M3 suite (52/52 passed) and the full backend suite (543/553 passed, 10 skipped live SQL Server tests).
5. Confirmed frontend contract stability (145/145 passed, 0 lint errors, clean Vite build).

---

### 2. Targeted Business Rule Evidence Breakdown (17 Dedicated Tests)

Each targeted business rule was audited and verified against its authoritative acceptance criteria with dedicated test methods:

```mermaid
flowchart TD
    subgraph BR_M3_01_Customer_Only["BR-M3-01: Customer Only"]
        A0a[Unauthenticated POST /sessions] -->|HTTP 401 Unauthorized| B0a[Spring Security Filter Blocked]
        A0b[Unauthenticated POST /candidates] -->|HTTP 401 Unauthorized| B0b[Spring Security Filter Blocked]
        A1[Guest / Null User ID] -->|Throws BusinessRuleException| B1[0 Sessions Created]
        A2[Customer without Stay Context] -->|Throws BusinessRuleException| B2[0 Sessions Created]
        A3[Customer with Stay Context] -->|Success| B3[SCHEDULED / PENDING Created]
        A4[Cross-Customer Access] -->|Confirm/Cancel/Reschedule Denied| B4[Strict Tenant Isolation]
    end

    subgraph BR_M3_02_Eligibility["BR-M3-02: Eligibility First"]
        C1[Inactive Treatment] -->|Fail-Closed before Lock| D1[0 Sessions, Resources Intact]
        C2[Invalid Stay Context] -->|Fail-Closed before Lock| D2[0 Sessions, Resources Intact]
        C3[Package Treatment] -->|Package Quota| D3[isIncluded = true]
        C4[Extra Treatment] -->|A-la-carte| D4[isIncluded = false & Billed]
    end

    subgraph BR_M3_04_Joint_Avail["BR-M3-04: Joint Availability"]
        E1[Therapist Free + Room Busy] -->|Rejection| F1[Slot Excluded from Candidates]
        E2[Room Free + Therapist Busy] -->|Rejection| F2[Slot Excluded from Candidates]
    end

    subgraph BR_M3_08_Alt_Loop["BR-M3-08: Alternative Loop"]
        G1[Primary Date Full] -->|Auto-Search Horizon| G2[Generate Alternatives]
        G2 -->|Horizon 0 / Exhaustion| G3[Empty Alternatives]
        G3 -->|Explicit Cancel| G4[CANCELLED Status (Gap: Auto-loop missing)]
    end

    subgraph BR_M3_13_Recovery["BR-M3-13: Automatic Recovery"]
        H1[Trigger 1: Cancellation] -->|Releases Slot Lock| I1[Slot Free for Re-booking]
        H2[Trigger 2: T-60m Non-Confirmation] -->|Scheduler| I2[EXPIRED / RESCHEDULING - No False No-Show]
        H3[Trigger 3: Therapist Unavailable] -->|Same-Time Match| I3[Auto-Rematch Preserving Time]
        H3 -->|No Same-Time Match| I4[Awaits Customer Consent (Gap: Trigger orchestration missing)]
    end

    subgraph BR_M3_14_Change_Trail["BR-M3-14: Change Trail & State Persistence"]
        J1[Schedule Change Paths] -->|Reschedule / Confirm / Complete| K1[Persistent State in spa_sessions]
        J2[External Services] -->|Google Calendar / SMTP| K2[Not Implemented in M3]
    end
```

---

#### 2.1 BR-M3-01 — Customer only
**Authoritative Rule:** Guest cannot participate in M3. Only authenticated Customer with valid retreat/stay context can initiate M3. Customer cannot access or modify another Customer's session.

- **Test Method 1 (HTTP Security Boundary):** `testHttpUnauthenticatedPostSessionsRejectedWith401Unauthorized`
  - *Scenario:* Unauthenticated HTTP POST request to `/api/v1/spa/sessions`.
  - *Assertion:* Rejected with HTTP 401 Unauthorized by Spring Security.
  - *Result:* **PASS**.
- **Test Method 2 (HTTP Security Boundary):** `testHttpUnauthenticatedPostCandidatesRejectedWith401Unauthorized`
  - *Scenario:* Unauthenticated HTTP POST request to `/api/v1/spa/candidates`.
  - *Assertion:* Rejected with HTTP 401 Unauthorized by Spring Security.
  - *Result:* **PASS**.
- **Test Method 3 (Service Layer Boundary):** `testServiceLayerUnauthenticatedCallerRejected`
  - *Scenario:* Null user ID and null retreat booking ID passed to `SpaSessionService.confirmReservation()`.
  - *Assertion:* Throws `BusinessRuleException` ("Authenticated customer context or retreat booking ID is required."). Asserts `sessionRepository.count() == 0`.
  - *Result:* **PASS**.
- **Test Method 4 (Service Layer Stay Context):** `testServiceLayerAuthenticatedCustomerWithoutStayContextRejected`
  - *Scenario:* Authenticated user ID (999) with no active retreat stay booking context.
  - *Assertion:* Throws `BusinessRuleException` ("No active retreat stay found for current user."). Asserts `sessionRepository.count() == 0`.
  - *Result:* **PASS**.
- **Test Method 5 (Service Layer Valid Customer):** `testServiceLayerValidCustomerWithValidStaySucceeds`
  - *Scenario:* Authenticated Customer 1 with active retreat booking 101.
  - *Assertion:* Reservation confirms successfully, yields `SpaSessionDto` with `sessionStatus = SCHEDULED` and `confirmationStatus = PENDING`.
  - *Result:* **PASS**.
- **Test Method 6 (Tenant Isolation):** `testServiceLayerCustomerCannotAccessOrModifyAnotherCustomerSession`
  - *Scenario:* Customer 2 (userId 2, bookingId 102) attempts to:
    1. Confirm attendance on Customer 1's session (`confirmAttendance`).
    2. Cancel Customer 1's session (`cancelSession`).
    3. Reschedule Customer 1's session (`confirmReservation` with `rescheduleSessionId`).
    4. Query personal sessions via `listCustomerSessions(2)`.
  - *Assertion:* All three modification attempts throw `BusinessRuleException` with cross-customer boundary denial. `listCustomerSessions(2)` returns an empty list, completely isolating Customer 1's records.
  - *Result:* **PASS**.

---

#### 2.2 BR-M3-02 — Eligibility first
**Authoritative Rule:** Validate booking/package eligibility before scheduling. Invalid requests terminate as Rejected. Package quota vs extra spa charge must be separated. Eligibility validation occurs before resource reservation.

- **Test Method 7 (Independent Inactive Treatment Validation):** `testEligibilityValidationRejectsInactiveTreatmentBeforeResourceReservation`
  - *Scenario:* Selected treatment is in `TreatmentStatus.INACTIVE`.
  - *Assertions:*
    1. Throws `BusinessRuleException` ("Selected Spa Treatment is currently inactive.").
    2. `sessionRepository.count() == 0` (no session entity created).
    3. Therapist status remains `TherapistStatus.ACTIVE` (unmodified).
    4. Room status remains `TreatmentRoomStatus.AVAILABLE` (unmodified).
    5. `sessionRepository.hasOverlappingSession(...) == false` (no interval reserved).
  - *Result:* **PASS**.
- **Test Method 8 (Independent Invalid Stay Context Validation):** `testEligibilityValidationRejectsInvalidStayContextBeforeResourceReservation`
  - *Scenario:* Caller has no active retreat stay context (userId = 999).
  - *Assertions:*
    1. Throws `BusinessRuleException` ("No active retreat stay found for current user.").
    2. `sessionRepository.count() == 0`.
    3. Therapist and room resources remain untouched.
  - *Result:* **PASS**.
- **Test Method 9 (Package Quota Separation):** `testPackageQuotaEligibilityAndExtraChargeSeparation`
  - *Scenario:* Customer 1 books:
    - Session A: Herbal Compress Massage (included in Retreat Package 1).
    - Session B: Sunrise Hatha Yoga (extra a-la-carte treatment).
  - *Assertion:* Session A has `isIncluded == true` (package covered, 0 charge). Session B has `isIncluded == false` and triggers `DefaultBillingAdapter` to bill the folio.
  - *Result:* **PASS**.

---

#### 2.3 BR-M3-04 — Joint availability
**Authoritative Rule:** A valid candidate requires a qualified Therapist and suitable Treatment Room available for the entire same interval without conflict. Rejection must occur when only one resource is available.

- **Test Method 10 (Room Busy):** `testJointAvailabilityRejectionWhenRoomBusy`
  - *Scenario:* Qualified therapist is free from 09:00 to 10:00, but the only compatible room is booked by a pre-existing session.
  - *Assertion:* Calling `schedulingEngineService.generateCandidates()` returns candidate bundles that strictly exclude the conflicting 09:00 slot.
  - *Result:* **PASS**.
- **Test Method 11 (Therapist Busy):** `testJointAvailabilityRejectionWhenTherapistBusy`
  - *Scenario:* Compatible room is free from 14:00 to 15:00, but the qualified therapist is booked in another room.
  - *Assertion:* Calling `schedulingEngineService.generateCandidates()` returns candidate bundles that strictly exclude the conflicting 14:00 slot.
  - *Result:* **PASS**.

---

#### 2.4 BR-M3-08 — Alternative loop
**Authoritative Rule:** Unavailable/rejected candidates trigger alternatives. Rejecting all alternatives ends as Cancelled.

- **Test Method 12:** `testAlternativeGenerationOnUnavailableDateAndExplicitCancellation`
  - *Scenario:*
    1. Primary date (2026-09-26) is fully booked from 08:00 to 20:00 across all qualified therapists and rooms.
    2. Customer requests candidate generation with `alternativeSearchDays = 3`.
    3. Customer or system requests candidates with exhausted search horizon (`alternativeSearchDays = 0`).
    4. Client explicitly invokes cancellation endpoint on an existing session.
  - *Assertion:*
    - Primary candidate list is empty (`isHasAvailability == false`).
    - System automatically enters the alternative loop and returns non-empty alternatives on subsequent dates (`isAlternative == true`, `date > primaryDate`).
    - When search horizon is 0, both candidates and alternatives are empty.
    - Calling `cancelSession()` transitions entity in database to `sessionStatus = CANCELLED` and `confirmationStatus = DECLINED`.
  - *Documented Gap (Why PARTIAL):* Candidate generation is a stateless read-only query. There is no stateful in-flight negotiation session that iteratively tracks candidate rejections and automatically mutates a session to `CANCELLED` upon exhaustion without an explicit `cancelSession()` API call.
  - *Result:* **PARTIAL (Stateless Generation Verified / Automated Loop Gap Documented)**.

---

#### 2.5 BR-M3-13 — Automatic recovery
**Authoritative Rule:** Customer cancellation/non-confirmation or Therapist unavailability triggers automatic recovery/rematching.

- **Test Method 13 (Trigger 1: Customer Cancellation):** `testTrigger1CustomerCancellationReleasesResourceLocksWithoutProactiveWaitlistRematching`
  - *Scenario:* Customer 1 books a slot, blocking Customer 2. Customer 1 cancels the session.
  - *Assertion:* Session transitions to `CANCELLED` and `DECLINED`. Resource lock is released (`hasOverlappingSession == false`). Customer 2 can now manually reserve the freed slot.
  - *Documented Gap:* HSWRMS has no background waitlist queue to automatically trigger proactive rematching on cancellation.
  - *Result:* **PARTIAL (Lock Release Verified / Proactive Rematching Missing)**.
- **Test Method 14 (Trigger 2: T-60m Non-Confirmation Deadline):** `testTrigger2CustomerNonConfirmationSchedulerDeadlineTransitionWithoutAutomatedRecoveryInvocation`
  - *Scenario:* Session reaches T-60m deadline while remaining in `PENDING` confirmation status. `SessionTimelineScheduler.processConfirmationDeadlines()` executes.
  - *Assertion:* Evaluated session transitions to `confirmationStatus = EXPIRED` and `sessionStatus = RESCHEDULING`. It strictly does **NOT** transition to `NO_SHOW` (preventing false punitive status before scheduled time).
  - *Documented Gap:* The scheduler marks the session for rescheduling, but does not automatically invoke `SessionRecoveryService.attemptSameTimeRecovery()`.
  - *Result:* **PARTIAL (State Transition Verified / Automatic Recovery Invocation Missing)**.
- **Test Method 15 (Trigger 3A: Therapist Unavailability with Same-Time Rematch):** `testTrigger3ASameTimeRecoveryAlgorithmPreservesTimeWhenReplacementTherapistAvailable`
  - *Scenario:* Assigned therapist is suspended (`TherapistStatus.SUSPENDED`). Second qualified therapist is free at the exact same interval. `SessionRecoveryService.attemptSameTimeRecovery()` executes.
  - *Assertion:* `recoveryResult.isRecovered() == true`, `recoveryResult.isPreservedSameTime() == true`, and session is re-assigned to the second therapist while preserving the exact start and end times.
  - *Result:* **PASS (at Service Layer)**.
- **Test Method 16 (Trigger 3B: Therapist Unavailability without Same-Time Rematch):** `testTrigger3BRecoveryAlgorithmRequiresCustomerConsentWhenNoSameTimeTherapistAvailable`
  - *Scenario:* All qualified therapists are unavailable at the scheduled time. `SessionRecoveryService.attemptSameTimeRecovery()` executes.
  - *Assertion:* `recoveryResult.isRecovered() == false`, `recoveryResult.isRequiresCustomerConsent() == true`. Session transitions to `RESCHEDULING` awaiting customer consent. System does not alter session time silently.
  - *Result:* **PASS (at Service Layer)**.
  - *Documented Gap for Trigger 3:* There is no event listener or automated trigger orchestration that calls `attemptSameTimeRecovery()` when a therapist's status is modified.
  - *Overall BR-M3-13 Status:* **PARTIAL**.

---

#### 2.6 BR-M3-14 — Accepted change notification and history
**Authoritative Rule:** Every accepted schedule change notifies Customer, updates Calendar, and records history.

- **Test Method 17:** `testAcceptedScheduleChangePathsMaintainPersistentScheduleStateWithoutExternalDispatch`
  - *Scenario:* Traces the complete lifecycle of schedule changes:
    1. Initial creation (`SCHEDULED`, `PENDING`).
    2. Path A: Customer-initiated reschedule (new time, updated therapist/room, note preserved, entity ID maintained).
    3. Path B: Customer attendance confirmation (`CONFIRMED`, `SCHEDULED`).
    4. Path C: Assigned therapist outcome completion (`COMPLETED`).
  - *Assertion:* All state transitions are permanently committed and intact in `spa_sessions`.
  - *Documented Gaps:*
    1. Schedule updates mutate the session row in-place; no separate `SpaSessionHistory` audit table exists in M3.
    2. There are no notification or Google Calendar integration classes in `m3spa`. External dispatch is not implemented.
  - *Result:* **PARTIAL (State Persistence Verified / Notification & Calendar Missing)**.

---

### 3. Verification Metrics Summary

| Test Suite | Tests Run | Passed | Failed | Errors | Skipped | Execution Time |
|---|---|---|---|---|---|---|
| `SpaAuthoritativeAcceptanceEvidenceTest` (Refined Suite) | 17 | 17 | 0 | 0 | 0 | 26.21s |
| `SpaSecurityTests` | 5 | 5 | 0 | 0 | 0 | 0.21s |
| `SpaConcurrencyTest` | 1 | 1 | 0 | 0 | 0 | 5.41s |
| `SpaServiceTests` | 29 | 29 | 0 | 0 | 0 | 1.80s |
| **Total M3 Test Suite** | **52** | **52** | **0** | **0** | **0** | **41.76s** |
| **Total HSWRMS Backend Tests (M1–M6)** | **553** | **543** | **0** | **0** | **10\*** | **4m 27s** |
| **Total Frontend Contract Tests** | **145** | **145** | **0** | **0** | **0** | **1.89s** |
| **Frontend Linter (`oxlint`)** | 216 files | 0 errors | - | - | - | 73ms |
| **Frontend Production Build (`vite build`)** | 2,728 modules | Clean | - | - | - | 2.93s |

*\*Note: The 10 skipped backend tests correspond to `SqlServerJdbcSmokeTest` (5) and `SqlServerSpringBootContextTest` (5), safely bypassed in H2 to preserve Microsoft SQL Server databases.*

---

### 4. Reconciled Compliance Status Summary

- **PASS (10 Rules):** BR-M3-01, BR-M3-02, BR-M3-03, BR-M3-04, BR-M3-05, BR-M3-06, BR-M3-07, BR-M3-09, BR-M3-11, BR-M3-12.
- **PARTIAL (4 Rules):**
  - **BR-M3-08:** Stateless candidate generation on unavailable date & manual cancellation pass; automated multi-turn iterative rejection loop not implemented.
  - **BR-M3-10:** Scheduler T-60m deadline inspection and `EXPIRED`/`RESCHEDULING` transition pass; external reminder dispatch not implemented in M3.
  - **BR-M3-13:** Cancellation lock release, scheduler deadline transition, and service-level same-time recovery/consent fallback algorithms pass; automated trigger orchestration upon therapist status modification is missing.
  - **BR-M3-14:** Persistent schedule state commits cleanly across all 4 lifecycle paths; external Google Calendar sync, email dispatch, and dedicated audit history tables are not implemented in M3.
