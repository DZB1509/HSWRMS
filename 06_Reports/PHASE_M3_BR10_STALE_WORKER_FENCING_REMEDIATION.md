# HSWRMS — PHASE M3 BR-M3-10 STALE WORKER FENCING REMEDIATION REPORT
**Remediation of Stale-Worker Lease Corruption in T-1h Confirmation Reminder Dispatch**

- **Date:** October 30, 2026
- **Branch:** `feature/hswrms-m1-m6-integration`
- **Component:** Module 3 (Spa & Therapy Scheduling) — BR-M3-10
- **Database Context:** Isolated H2 (`MODE=MSSQLServer`) in-memory; physical databases `HSWRMS` and `HSWRMS_TEST` completely untouched.

---

## 1. Executive Summary

During the previous BR-M3-10 concurrency audit (`06_Reports/PHASE_M3_BR10_FINAL_CONCURRENCY_RETRY_INTEGRITY_AUDIT.md`), empirical testing demonstrated a critical race vulnerability: in a multi-instance or long-pause scenario, a stale Worker A whose lease had expired could awaken and execute `releaseReminderClaim(sessionId)` or `recordReminderSent(sessionId, now)`, mutating or corrupting the active lease acquired by a successor Worker B.

This vulnerability was rooted in the query predicate:
```sql
WHERE s.spaSessionId = :sessionId AND s.reminderStatus = 'CLAIMED'
```
Because the predicate validated only that the session was in state `CLAIMED` without verifying claim ownership or lease continuity, any worker holding an expired lease was able to mutate active rows owned by other workers.

In this phase, we implemented a dedicated **UUID-based Claim Token Fencing** mechanism (`reminderClaimToken`). Every claim or reclaim generates a unique, collision-resistant token persisted atomically with the lease. Mutating queries (`recordReminderSent` and `releaseReminderClaim`) strictly require matching token ownership (`AND s.reminderClaimToken = :claimToken`). If a worker's lease is superseded or expired, its update modifies **0 rows**, completely safeguarding the winning worker's lease and state.

---

## 2. Root Cause Analysis

### 2.1 The Vulnerability Mechanism
1. **Initial Lease:** At $T_0 = 10:00$, Worker A acquires a 2-minute claim lease on `SpaSession #10` (expiring at $T_0 + 2\text{m} = 10:02$).
2. **Extended Pause:** Worker A experiences an external dispatch delay, GC pause, or transient network stall lasting 3 minutes ($> 2\text{m}$).
3. **Lease Expiration & Reclaim:** At $T_1 = 10:03$, Worker B inspects due sessions. Finding an expired lease (`reminderClaimExpiresAt <= now`), Worker B executes `claimSessionForReminder` and claims the session with a new lease expiring at $10:05$.
4. **Stale Mutation:** At $10:03:30$, Worker A recovers from its pause. Having encountered an error or completing its delayed dispatch, Worker A invokes:
   ```sql
   UPDATE SpaSession s 
   SET s.reminderStatus = 'RETRYABLE_FAILURE', s.reminderClaimExpiresAt = NULL
   WHERE s.spaSessionId = 10 AND s.reminderStatus = 'CLAIMED'
   ```
   Because Worker B is currently in state `CLAIMED`, Worker A's statement matched Worker B's active row! Worker B's lease was corrupted to `RETRYABLE_FAILURE` and its expiration timestamp cleared, while Worker B was still processing notification dispatch.

### 2.2 Why Timestamp Fencing Alone Was Insufficient
In SQL Server production schemas (`05_Development/database/schema.sql`), timestamps on `SpaSession` are typed as `DATETIME2(0)`:
```sql
reminder_claimed_at DATETIME2(0) NULL,
reminder_claim_expires_at DATETIME2(0) NULL,
```
`DATETIME2(0)` truncates fractional seconds to whole integer seconds. Relying solely on `LocalDateTime` equality for fencing would create collision vulnerabilities when multiple worker attempts or retries occur within the same 1-second wall-clock window. A collision-resistant UUID token (`VARCHAR(64)`) eliminates all timestamp precision dependencies and clock skew edge cases.

---

## 3. Chosen Fencing Design & Architecture

### 3.1 Dedicated Column: `reminder_claim_token`
A nullable string column `reminder_claim_token VARCHAR(64) NULL` was added to `dbo.SpaSession` and mapped in `SpaSession.java`:
```java
@Column(name = "reminder_claim_token", length = 64)
private String reminderClaimToken;
```

### 3.2 Atomic Claim & Reclaim
On every claim attempt (whether initial or reclaim of an expired lease), the worker generates a fresh random UUID (`UUID.randomUUID().toString()`) and atomically persists it via conditional JPQL update:
```sql
UPDATE SpaSession s 
SET s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED,
    s.reminderClaimedAt = :claimedAt,
    s.reminderClaimExpiresAt = :expiresAt,
    s.reminderClaimToken = :claimToken
WHERE s.spaSessionId = :sessionId
  AND s.sessionStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaSessionStatus.SCHEDULED
  AND s.confirmationStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaConfirmationStatus.PENDING
  AND s.reminderSentAt IS NULL
  AND (s.reminderStatus IS NULL 
       OR s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.PENDING
       OR s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.RETRYABLE_FAILURE
       OR (s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED 
           AND s.reminderClaimExpiresAt <= :claimedAt))
```
- If two workers race to claim an expired lease, the database update lock ensures exactly one worker updates the row and secures ownership with its token. The losing worker updates 0 rows.

### 3.3 Fenced Terminal Persistence (`recordReminderSent`)
```sql
UPDATE SpaSession s 
SET s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.SENT,
    s.reminderSentAt = :sentAt,
    s.reminderClaimExpiresAt = NULL,
    s.reminderClaimToken = NULL
WHERE s.spaSessionId = :sessionId
  AND s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED
  AND s.reminderClaimToken = :claimToken
```

### 3.4 Fenced Failure Release (`releaseReminderClaim`)
```sql
UPDATE SpaSession s 
SET s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.RETRYABLE_FAILURE,
    s.reminderClaimExpiresAt = NULL,
    s.reminderClaimToken = NULL
WHERE s.spaSessionId = :sessionId
  AND s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED
  AND s.reminderClaimToken = :claimToken
```

### 3.5 Scheduler Lifecycle Execution
In `SessionTimelineScheduler.dispatchUpcomingSessionReminders()`:
1. Worker generates `claimToken = UUID.randomUUID().toString()`.
2. Worker executes `claimSessionForReminder(sessionId, now, leaseExpiresAt, claimToken)`.
3. If `claimed == 0`: another worker holds an active lease or won the reclaim race; skip session.
4. If `claimed == 1`: worker holds exclusive fenced ownership. External dispatch occurs outside database transactions.
5. On success: worker calls `recordReminderSent(sessionId, now, claimToken)`. If superseding occurred, update returns 0 and logs a warning; otherwise records `SENT` and clears token.
6. On error: worker calls `releaseReminderClaim(sessionId, claimToken)`. If superseding occurred, update returns 0; otherwise releases to `RETRYABLE_FAILURE` and clears token.

---

## 4. Source Files Modified & Created

| File | Change Summary |
|---|---|
| `SpaSession.java` | Added `@Column(name = "reminder_claim_token", length = 64) private String reminderClaimToken;` with getters/setters. |
| `SpaSessionDto.java` | Added `private String reminderClaimToken;` with getters/setters. |
| `SpaSessionService.java` | In `toDto`, added mapping: `dto.setReminderClaimToken(s.getReminderClaimToken());`. |
| `spaTypes.ts` | Added `reminderClaimToken?: string \| null;` and `reminderClaimExpiresAt?: string \| null;` to `BackendSpaSessionDetail`. |
| `schema.sql` | Added `reminder_claim_token VARCHAR(64) NULL,` to `dbo.SpaSession`. |
| `V008__m3_spa_session_reminder_claim_token.sql` | Created idempotent migration script adding `reminder_claim_token` if absent. |
| `SpaSessionRepository.java` | Added `claimToken` parameter and predicates to `claimSessionForReminder`, `recordReminderSent`, and `releaseReminderClaim`. Added overloaded convenience methods. |
| `SessionTimelineScheduler.java` | Generated random UUID claim tokens per session and passed tokens through claim, sent, and release calls. |
| `SpaAuthoritativeAcceptanceEvidenceTest.java` | Replaced vulnerability demonstration test with remediated fencing assertions; added Tests A through F (+5 new unit tests, 48 total in suite). |
| `PHASE_M3_AUTHORITATIVE_BR_COMPLIANCE_MATRIX.md` | Reconciled M3 test counts (83/83) and updated BR-M3-10 evidence description. |

---

## 5. Before vs. After Execution Trace

### Before Remediation (Vulnerable)
```text
[10:00:00] Worker A: claimSessionForReminder(10, 10:00, 10:02) -> 1 row (CLAIMED)
[10:00:01] Worker A: Paused / network delay > 2 minutes
[10:02:00] -- Lease for Worker A expires --
[10:03:00] Worker B: claimSessionForReminder(10, 10:03, 10:05) -> 1 row (CLAIMED)
[10:03:00] Worker B: Active leaseholder, sending email notification...
[10:03:30] Worker A: Awakens! Encountered timeout error.
[10:03:30] Worker A: releaseReminderClaim(10) [Predicate: WHERE s.id = 10 AND s.status = 'CLAIMED']
[10:03:30] Worker A: Updated 1 row! Status = RETRYABLE_FAILURE, expiresAt = NULL.
[10:03:35] Worker B: Email sent! Calls recordReminderSent(10, 10:03:35)
[10:03:35] Worker B: Fails or encounters corrupt state because status is no longer CLAIMED!
```

### After Remediation (Fenced with UUID Token)
```text
[10:00:00] Worker A: TokenA = "7a8b...". claimSessionForReminder(10, 10:00, 10:02, TokenA) -> 1 row (CLAIMED, TokenA)
[10:00:01] Worker A: Paused / network delay > 2 minutes
[10:02:00] -- Lease for Worker A expires --
[10:03:00] Worker B: TokenB = "9c2e...". claimSessionForReminder(10, 10:03, 10:05, TokenB) -> 1 row (CLAIMED, TokenB)
[10:03:00] Worker B: Active leaseholder with TokenB, sending email notification...
[10:03:30] Worker A: Awakens! Encountered timeout error.
[10:03:30] Worker A: releaseReminderClaim(10, TokenA) [Predicate: WHERE s.id = 10 AND s.status = 'CLAIMED' AND s.reminderClaimToken = '7a8b...']
[10:03:30] Worker A: 0 rows updated! Worker B's active lease, token ("9c2e..."), and status remain UNCORRUPTED.
[10:03:35] Worker B: Email sent! Calls recordReminderSent(10, 10:03:35, TokenB)
[10:03:35] Worker B: Exactly 1 row updated! Status = SENT, reminderSentAt = 10:03:35, leaseExpiresAt = NULL, token = NULL.
```

---

## 6. Regression Testing & Verification Evidence

### 6.1 Targeted Regression Tests (Tests A through G)
In `SpaAuthoritativeAcceptanceEvidenceTest.java`:

- **Test A — Stale Worker Release Rejection (`testBR10_RemediatedStaleWorkerFencing_ReleaseRejected`):**
  Worker A claims with `tokenA`. Lease expires. Worker B reclaims with `tokenB`. Stale Worker A calls `releaseReminderClaim(sId, tokenA)`.
  *Result:* Exactly **0 rows updated**. Worker B's lease with `tokenB` and status `CLAIMED` remains intact. **PASS**.
- **Test B — Stale Worker Success Rejection (`testBR10_TestB_StaleWorkerSuccess_Rejected`):**
  Worker A claims with `tokenA`. Lease expires. Worker B reclaims with `tokenB`. Stale Worker A calls `recordReminderSent(sId, now, tokenA)`.
  *Result:* Exactly **0 rows updated**. Session remains `CLAIMED` by Worker B and is not prematurely marked `SENT`. **PASS**.
- **Test C — Current Worker Success (`testBR10_TestC_CurrentWorkerSuccess_RecordedAndCleared`):**
  Worker B claims with `tokenB` and calls `recordReminderSent(sId, sentTime, tokenB)`.
  *Result:* Exactly **1 row updated**. Status transitions to `SENT`; `reminderClaimToken` and `reminderClaimExpiresAt` are cleared to null. **PASS**.
- **Test D — Current Worker Failure (`testBR10_TestD_CurrentWorkerFailure_ReleasedAndCleared`):**
  Worker B claims with `tokenB` and calls `releaseReminderClaim(sId, tokenB)`.
  *Result:* Exactly **1 row updated**. Status transitions to `RETRYABLE_FAILURE`; `reminderClaimToken` and `reminderClaimExpiresAt` are cleared to null. **PASS**.
- **Test E — Concurrent Reclaim Race (`testBR10_TestE_ConcurrentReclaim_ExactlyOneWinner`):**
  10 concurrent threads simultaneously race via `CyclicBarrier` to reclaim an expired lease.
  *Result:* Exactly **1 thread wins** and updates 1 row; 9 threads update 0 rows. The winning worker's token is the sole persisted token. **PASS**.
- **Test F — Reclaim Token Uniqueness (`testBR10_TestF_ReclaimTokenUniqueness_WithinSameSecond`):**
  5 consecutive claim-and-release cycles executed at the exact same whole-second timestamp.
  *Result:* All 5 generated UUID tokens are strictly unique. **PASS**.
- **Test G — Existing Crash Recovery Suite (`testBR10_ProcessCrash...`, `testBR10_OutageRecovery...`):**
  All 19 previous BR-M3-10 timing, outage recovery, and deadline boundary tests re-verified.
  *Result:* **19 / 19 PASS**.

### 6.2 Test Execution Results

#### 1. Targeted Acceptance Evidence Suite
```text
Command: mvnw.cmd test -Dtest=SpaAuthoritativeAcceptanceEvidenceTest
Database: H2 In-Memory (MODE=MSSQLServer)
Results: Tests run: 48, Failures: 0, Errors: 0, Skipped: 0
Execution Time: 32.06s (Total: 57.288s)
Exit Code: 0 (BUILD SUCCESS)
```

#### 2. Full Module 3 Backend Suite
```text
Command: .\mvnw.cmd test '-Dtest=SpaAuthoritativeAcceptanceEvidenceTest,SpaServiceTests,SpaConcurrencyTest,SpaSecurityTests'
Database: H2 In-Memory (MODE=MSSQLServer)
Breakdown:
  - SpaAuthoritativeAcceptanceEvidenceTest: 48 tests
  - SpaServiceTests:                       29 tests
  - SpaSecurityTests:                       5 tests
  - SpaConcurrencyTest:                     1 test
Results: Tests run: 83, Failures: 0, Errors: 0, Skipped: 0
Execution Time: 51.745s
Exit Code: 0 (BUILD SUCCESS)
```

#### 3. Frontend Contract Test Suite
```text
Command: npx tsx --test src/**/*.test.ts
Results: tests 159, suites 48, pass 159, fail 0, skipped 0
Execution Time: 2.88s
Exit Code: 0 (SUCCESS)
```

#### 4. Frontend Production Build & TypeScript Verification
```text
Command: tsc -b && vite build
Output: 2,728 modules transformed, 0 TypeScript errors
Execution Time: 1.90s
Exit Code: 0 (SUCCESS)
```

---

## 7. Remaining Limitations & Authoritative Status

1. **Decoupled External Adapters:**
   While the database state machine, claim leasing, crash recovery, outage catch-up, and stale-worker fencing are fully verified, live SMTP transmission and external Google Calendar synchronization remain decoupled behind `SpaNotificationPort` and operate using structured local telemetry logging (`DefaultSpaNotificationAdapter`).
2. **At-Least-Once Semantics:**
   If a network provider delivers an email but the application process crashes before `recordReminderSent` commits to the database, the expired lease will be reclaimed upon recovery and the reminder dispatched again. The system guarantees at-least-once delivery; exactly-once external delivery is physically impossible in the presence of uncoordinated network boundaries.
3. **Status Recommendation:**
   In accordance with strict audit safety and user directives, **BR-M3-10 is retained as PARTIAL** (11 PASS, 3 PARTIAL: BR-M3-10, BR-M3-13, BR-M3-14). No work on BR-M3-13 has been initiated in this phase.

