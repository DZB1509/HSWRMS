# HeavenStay Wellness Resort Management System (HSWRMS)
## Module M3: BR-M3-08 Implementation & Verification Report
### Alternative Slot Rejection, Multi-Turn Negotiation, Exhaustion & Cancellation

- **Date:** October 30, 2026
- **Repository:** `HSWRMS-audit-all-modules`
- **Target Branch:** `feature/hswrms-m1-m6-integration`
- **Authoritative Rule:** **BR-M3-08 — Alternative Loop**
  > *"Unavailable/rejected candidates trigger alternatives. Rejecting all alternatives ends as Cancelled."*
- **Reconciled Compliance Status:** **PASS** (Upgraded from PARTIAL)

---

### 1. Executive Summary

This report documents the design, implementation, and rigorous automated verification of the authoritative **BR-M3-08 (Alternative Loop)** business requirement in Module 3 (Spa & Therapy Scheduling) of the HSWRMS application.

#### Key Deliverables:
1. **Stateless Candidate Exclusion in Scheduling Engine:** Enhanced `SchedulingEngineService` and `GenerateCandidatesRequest` to accept `rejectedCandidateIds: List<String>`. The engine filters out rejected candidates deterministically without persisting transient session state, preserving the strict invariant that candidate generation is read-only and lock-free (BR-M3-03, BR-M3-05). Added fail-closed check preventing inactive treatments from generating candidate slots.
2. **Cancellation Idempotency in Service Layer:** Modified `SpaSessionService.cancelSession()` to be idempotent. Duplicate or repeated cancellation requests on a session already in `CANCELLED` status safely return the session DTO with `SpaConfirmationStatus.DECLINED` rather than throwing an exception.
3. **Frontend Multi-Turn Negotiation & Exhaustion UI:** Updated `SpaAlternativeSlotsPage.tsx` to allow dismissing individual candidate bundles (`#btn-reject-candidate-{id}`), tracking accumulated rejections across negotiation turns, automatically re-querying the engine for subsequent alternatives, presenting an explicit Exhaustion Panel (`#spa-alternatives-exhausted-panel`) when all candidates are declined, and offering server-confirmed session cancellation (`#btn-cancel-exhausted-session`, `#btn-decline-all-alternatives`). Equipped with request sequence tokens to eliminate asynchronous out-of-order race conditions.
4. **Comprehensive Automated Verification:**
   - **Backend Acceptance Suite:** 23 tests in `SpaAuthoritativeAcceptanceEvidenceTest.java` (23 passing, 0 failing).
   - **Full Module 3 Regression Suite:** 58 tests across `SpaAuthoritativeAcceptanceEvidenceTest`, `SpaServiceTests`, `SpaSecurityTests`, and `SpaConcurrencyTest` (58 passing, 0 failing).
   - **Frontend Contract Suite:** 14 tests in `alternativeRejectionSafety.test.ts` (159 passing across all frontend suites, 0 failing).
   - **Production Build:** Verified with `tsc -b && vite build` (0 errors).

---

### 2. Architectural Analysis & Design Decisions

#### Why Option A (Client-Orchestrated Negotiation with Stateless Filtering) Was Chosen

Two architectural approaches were evaluated:
- **Option A (Client-Orchestrated Negotiation with Backend Stateless Filtering):** The frontend tracks rejected candidate IDs during the booking session and includes `rejectedCandidateIds: string[]` in candidate generation requests. The backend excludes matching candidates using their deterministic stable `candidateId` and returns remaining primary or alternative bundles.
- **Option B (Server-Side Transient Negotiation State Machine):** Creating a database table (`spa_negotiation_sessions` or transient `SpaSession` rows in `NEGOTIATING` status) to track server-side negotiation turns.

**Decision: Option A was selected.**
- **Preservation of Authoritative Invariants:** BR-M3-03 and BR-M3-05 strictly mandate that candidate generation is *read-only, non-persisting, and does not hold locks*. Introducing transient database rows or locks during candidate browsing would violate these rules, cause database bloat, and risk dangling locks on unconfirmed sessions.
- **Deterministic Candidate Identification:** In `SchedulingEngineService`, candidate IDs are computed deterministically from `(treatmentId + "_" + therapistId + "_" + roomId + "_" + startAt)`. Because candidate IDs are uniquely identifiable across calls, the backend can effortlessly exclude previously rejected candidates in successive negotiation turns.
- **Clean Separation of Concerns:** Transient customer browsing decisions remain in client state; persistent state transitions (`SCHEDULED` -> `CANCELLED`) occur only when the customer explicitly decides to cancel or confirm an existing session.

---

### 3. Detailed Technical Modifications

#### A. Backend Modifications

1. **`GenerateCandidatesRequest.java`:**
   - Added `private List<String> rejectedCandidateIds;`
   - Added constructors and getter/setter: `getRejectedCandidateIds()`, `setRejectedCandidateIds(List<String>)`.

2. **`SchedulingEngineService.java`:**
   - In `generateCandidates(GenerateCandidatesRequest req)`:
     - Added fail-closed check for inactive treatment: `if (treatment.getTreatmentStatus() != TreatmentStatus.ACTIVE) throw new BusinessRuleException("Selected Spa Treatment is currently inactive.");`
     - Extracted `List<String> rejectedCandidateIds = req.getRejectedCandidateIds();` and forwarded it to `searchCandidatesForDate()`.
   - In `searchCandidatesForDate(...)`: Added candidate filtering:
     ```java
     // BR-M3-08: Exclude candidates previously rejected in this negotiation round
     if (rejectedCandidateIds != null && rejectedCandidateIds.contains(candidateId)) {
         continue;
     }
     ```
   - When all candidates for a date are rejected or unavailable, the engine searches subsequent dates within `searchHorizon` and returns alternative bundles. If all alternatives are also rejected, the engine returns empty candidate and alternative lists (`candidates = []`, `alternatives = []`, `hasAvailability = false`).

3. **`SpaSessionService.java`:**
   - Updated `cancelSession(Long sessionId, Integer authenticatedUserId)`:
     ```java
     if (session.getSessionStatus() == SpaSessionStatus.CANCELLED) {
         // Idempotent cancellation: safe handling of duplicate or repeated cancellation requests
         return toDto(session, "Customer", true);
     }
     if (session.getSessionStatus() == SpaSessionStatus.COMPLETED) {
         throw new BusinessRuleException("Cannot cancel session already COMPLETED");
     }
     session.setSessionStatus(SpaSessionStatus.CANCELLED);
     session.setConfirmationStatus(SpaConfirmationStatus.DECLINED);
     ```

#### B. Frontend Modifications

1. **`spaTypes.ts`:**
   - Updated `GenerateCandidatesPayload` to include `rejectedCandidateIds?: string[]`, `rescheduleSessionId?: number`, and `alternativeSearchDays?: number`.

2. **`SpaAlternativeSlotsPage.tsx`:**
   - Added negotiation state: `rejectedCandidateIds: string[]`, `cancelling: boolean`, `cancellationComplete: boolean`.
   - Added request sequence token `requestIdRef = useRef(0)` to prevent out-of-order asynchronous responses from overwriting newer UI state.
   - Added `useEffect` to reset `rejectedCandidateIds` and `selectedCandidate` when search criteria (`treatmentId`, `preferredDate`) change, ensuring negotiation isolation.
   - **Candidate Rejection (`handleRejectCandidate`):**
     - Appends candidate ID to `rejectedCandidateIds`.
     - Removes candidate from visible `candidates` and `alternativeCandidates` lists.
     - Resets `selectedCandidate` if the dismissed candidate was selected.
     - If visible candidates reach zero, automatically re-queries `spaApi.generateCandidates()` with `rejectedCandidateIds` to fetch subsequent available bundles.
   - **Session Cancellation & Rejection Completion (`handleDeclineAllAlternatives`):**
     - For reschedule flow (`rescheduleSessionId`): Calls `spaApi.cancelSession(rescheduleSessionId)`. On success, renders confirmed cancellation view. On error, displays server error message (preventing false success).
     - For new booking flow: Safely exits to the spa catalogue (`/customer/spa`) with zero database mutations.
   - **UI Elements:**
     - Individual dismiss buttons: `#btn-reject-candidate-{id}` on each candidate bundle.
     - Bulk decline button: `#btn-decline-all-alternatives` in sidebar drawer.
     - Exhaustion panel: `#spa-alternatives-exhausted-panel` with `#btn-cancel-exhausted-session` (rendered for both flows) and `#btn-adjust-criteria`.
     - Confirmed cancellation view (`#screen-27-cancellation-confirmed`) with navigation to `#btn-view-my-sessions`.

---

### 4. Automated Verification Results

#### A. Backend Acceptance Tests (`SpaAuthoritativeAcceptanceEvidenceTest.java`)

Execution command: `.\mvnw.cmd test -Dtest=SpaAuthoritativeAcceptanceEvidenceTest`

```
[INFO] Running com.heavenstay.hswrms.m3spa.SpaAuthoritativeAcceptanceEvidenceTest
...
[INFO] Tests run: 23, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 28.24 s -- in com.heavenstay.hswrms.m3spa.SpaAuthoritativeAcceptanceEvidenceTest
[INFO] BUILD SUCCESS
```

Direct assertions proving BR-M3-08 and contract invariants:
1. `testAlternativeGenerationOnUnavailableDateAndExplicitCancellation`: Proves unavailable primary date automatically generates nearest verified alternative bundles on subsequent days, and explicit cancellation transitions session to `CANCELLED` and `DECLINED`.
2. `testAlternativeLoopSuccessiveRejectionExcludesPreviousCandidates`: Proves multi-turn negotiation excludes rejected candidate IDs in turn $N+1$.
3. `testAlternativeLoopExhaustionProducesEmptyAvailability`: Proves that successively rejecting all offered candidates across multiple negotiation turns terminates in zero availability (`candidates = []`, `alternatives = []`, `hasAvailability = false`).
4. `testAlternativeLoopCancellationIdempotency`: Proves repeated cancellation requests return `CANCELLED` status safely without throwing errors.
5. `testAlternativeLoopCancellationReleasesResourceLocks`: Proves cancelling a session immediately frees resource locks, allowing another customer to book the slot.
6. `testBR03_InvariantsPreservedWithClientProvidedRejectedIds`: Proves that client-provided candidate IDs cannot inject bundles, bypass inactive treatment status, or create database records.
7. `testBR08_ExhaustionSemanticsDistinguishNewBookingVsExistingSession`: Proves that Flow A (new booking) exhaustion creates zero database records, while Flow B (rescheduling) transitions the persistent session to `CANCELLED` and `DECLINED`.

#### B. Full Module 3 Regression Suite

Execution command: `.\mvnw.cmd test "-Dtest=SpaAuthoritativeAcceptanceEvidenceTest,SpaServiceTests,SpaConcurrencyTest,SpaSecurityTests"`

```
[INFO] Running com.heavenstay.hswrms.m3spa.SpaConcurrencyTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.heavenstay.hswrms.m3spa.SpaSecurityTests
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.heavenstay.hswrms.m3spa.SpaServiceTests
[INFO] Tests run: 29, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.heavenstay.hswrms.m3spa.SpaAuthoritativeAcceptanceEvidenceTest
[INFO] Tests run: 23, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] Tests run: 58, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

#### C. Frontend Contract Safety Tests (`alternativeRejectionSafety.test.ts`)

Execution command: `npx tsx --test src/features/m3-spa/alternativeRejectionSafety.test.ts`

```
▶ BR-M3-08 Alternative Slot Rejection & Cancellation Contract Safety
  ✔ 1. correctly accumulates rejected candidate IDs without duplication
  ✔ 2. filters out rejected candidates from visible candidate pool
  ✔ 3. detects non-exhausted state when alternatives are still available
  ✔ 4. detects exhaustion when both primary and alternatives are empty
  ✔ 5. does not flag exhaustion while loading is true
  ✔ 6. clears selectedCandidate if the rejected candidate was selected
  ✔ 7. preserves selectedCandidate if a different candidate is rejected
  ✔ 8. builds generateCandidates payload preserving rejectedCandidateIds and rescheduleSessionId
  ✔ 9. successive rejection leads to complete exhaustion
  ✔ 10. rejection does not auto-confirm or mutate unconsented candidates
  ✔ 11. race-condition safety: discards stale out-of-order asynchronous responses
  ✔ 12. negotiation isolation: resets rejection list when search criteria change
  ✔ 13. exhaustion semantics: distinguishes Flow A (new booking) vs Flow B (rescheduling)
  ✔ 14. harmlessness of fabricated candidate IDs: forged IDs do not crash or corrupt filtering
✔ BR-M3-08 Alternative Slot Rejection & Cancellation Contract Safety
ℹ tests 14
ℹ suites 1
ℹ pass 14
ℹ fail 0
```

All 159 tests across all frontend suites (`src/**/*.test.ts`) pass with zero failures.

#### D. Production Build & Static Analysis
- `npm run lint` (`oxlint`): 0 errors across 217 frontend files.
- `npm run build` (`tsc -b && vite build`): Succeeded in 2.21s without compilation warnings or errors.

---

### 5. Authoritative Compliance Status

With the completion and post-implementation review of BR-M3-08, the authoritative Module 3 compliance matrix is updated:

- **11 Rules PASS (78.6%):**
  - BR-M3-01 — Customer only
  - BR-M3-02 — Eligibility first
  - BR-M3-03 — System-generated scheduling
  - BR-M3-04 — Joint availability
  - BR-M3-05 — Final human confirmation
  - BR-M3-06 — Revalidation before commit
  - BR-M3-07 — Atomic reservation
  - **BR-M3-08 — Alternative loop (PASS)**
  - BR-M3-09 — Extra Spa uses same engine
  - BR-M3-11 — Customer confirmation does not equal attendance
  - BR-M3-12 — Therapist owns final attendance outcome
- **3 Rules PARTIAL (21.4%):**
  - BR-M3-10 — T-1h reminder (Scheduler deadline detection verified; external reminder dispatch omitted in M3)
  - BR-M3-13 — Automatic recovery (Lock release, scheduler transition, same-time rematch, and consent fallback verified; automated trigger orchestration omitted in M3)
  - BR-M3-14 — Notify every accepted change (Persistent state update verified; dedicated audit history tables, Google Calendar synchronization, and email dispatch omitted in M3)
