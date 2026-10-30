# HSWRMS — PHASE M3 BR-M3-10 FINAL API BOUNDARY & DOCUMENTATION CLEANUP REPORT
**Encapsulation of Internal Claim Tokens, Strict Repository Fencing, and Compliance Matrix Reconciliation**

- **Date:** October 30, 2026
- **Branch:** `feature/hswrms-m1-m6-integration`
- **Component:** Module 3 (Spa & Therapy Scheduling) — BR-M3-10
- **Database Context:** Isolated H2 (`MODE=MSSQLServer`) in-memory; physical SQL Server databases `HSWRMS` and `HSWRMS_TEST` completely untouched.

---

## 1. Executive Summary

Following the successful remediation of the stale-worker lease overwrite race condition via UUID-based claim tokens, this phase executed the final API boundary encapsulation and documentation reconciliation for **BR-M3-10** (T-1h Appointment Confirmation Reminder).

Key outcomes achieved in this phase:
1. **Public DTO Encapsulation:** The internal worker fencing token (`reminderClaimToken`) was completely purged from public API DTOs (`SpaSessionDto`), service-to-DTO conversion logic (`SpaSessionService.toDto`), and frontend contract types (`spaTypes.ts`).
2. **Repository Token-Fencing Hardening:** Unfenced convenience query overloads (`recordReminderSent(sessionId, sentAt)` and `releaseReminderClaim(sessionId)`) were eliminated from `SpaSessionRepository`. All reminder state mutation in the system strictly mandates ownership verification via `claimToken`.
3. **Automated API Regression Protection:** A dedicated regression test (`testBR10_PublicApiSerializationDoesNotExposeReminderClaimToken`) was added to `SpaAuthoritativeAcceptanceEvidenceTest`, asserting that serialized public JSON never exposes `reminderClaimToken` or internal UUID strings.
4. **Documentation & Interval Notation Reconciliation:** The Authoritative Compliance Matrix was updated to reflect current verified test counts (**84 backend M3 tests**, **159 frontend contract tests**, and clean production build) and strict mathematical interval notation:
   - Reminder Eligibility: $60\text{ minutes} < \text{time until appointment} \le 75\text{ minutes}$
   - Confirmation Deadline / Expiration: $\text{time until appointment} \le 60\text{ minutes}$
5. **Preserved Compliance Status:** In accordance with audit instructions, **BR-M3-10 remains classified as PARTIAL** because external live SMTP transmission and Google Calendar synchronization remain decoupled behind local telemetry ports.

---

## 2. Public DTO Exposure Audit & Remediation

### 2.1 Principle of Boundary Encapsulation
The UUID claim token is exclusively a concurrency control mechanism for database-level worker fencing between competing scheduler or recovery instances. Exposing this token to guests, receptionists, therapists, or API consumers introduces:
- Leaked internal scheduler coordination tokens.
- Potential abuse where external clients might fabricate or echo tokens.
- Clutter in public frontend data structures.

### 2.2 Purged Public Surfaces
1. **`SpaSessionDto.java`:**
   - Removed `private String reminderClaimToken;`
   - Removed `getReminderClaimToken()` and `setReminderClaimToken(String)`.
   - Retained legitimate API contract fields: `reminderStatus`, `reminderClaimedAt`, `reminderClaimExpiresAt`, and `reminderSentAt`.
2. **`SpaSessionService.java`:**
   - Removed `dto.setReminderClaimToken(s.getReminderClaimToken());` from `toDto()`.
   - Added public overload `public SpaSessionDto toDto(SpaSession s)` defaulting to guest presentation.
3. **`spaTypes.ts`:**
   - Removed `reminderClaimToken?: string | null;` from `BackendSpaSessionDetail`.
4. **Exhaustive Codebase Verification:**
   - A global scan across all `05_Development/backend/src` and `05_Development/frontend/src` confirmed that `reminderClaimToken` exists exclusively in:
     - `SpaSession.java` (JPA persistence entity column)
     - `SpaSessionRepository.java` (JPQL fenced query predicates)
     - `SessionTimelineScheduler.java` (internal scheduler claim-and-release pipeline)
     - `schema.sql` and `V008` migration script.

### 2.3 Public API Serialization Regression Test
In `SpaAuthoritativeAcceptanceEvidenceTest.java`:
```java
@Test
@DisplayName("BR-M3-10.26: Public API serialization regression - serialized SpaSessionDto must not expose reminderClaimToken")
public void testBR10_PublicApiSerializationDoesNotExposeReminderClaimToken() throws Exception { ... }
```
This test creates a session with an active token in the database, generates `SpaSessionDto` via `spaSessionService.toDto()`, serializes it via Jackson `ObjectMapper`, and asserts:
- `reminderStatus`, `reminderClaimedAt`, and `reminderClaimExpiresAt` are correctly serialized.
- `dtoJson.contains("reminderClaimToken")` is **FALSE**.
- `dtoJson.contains(internalClaimToken)` is **FALSE**.
- `apiResponseJson.contains("reminderClaimToken")` is **FALSE**.

---

## 3. Repository Token-Fencing Audit

### 3.1 Elimination of Unfenced Mutating Overloads
In the initial implementation, `SpaSessionRepository` contained non-token overloads for backward compatibility:
```java
// REMOVED: Bypassed worker ownership verification
int recordReminderSent(@Param("sessionId") Long sessionId, @Param("sentAt") LocalDateTime sentAt);
int releaseReminderClaim(@Param("sessionId") Long sessionId);
```
These unfenced overloads were identified as potential security loopholes: if invoked by any future caller, they would match any session in state `CLAIMED`, ignoring active leases.

Both methods were **completely removed** from `SpaSessionRepository.java`.

### 3.2 Canonical Fenced Repository Contract
All reminder mutation methods on `SpaSessionRepository` strictly require `claimToken`:

```java
@Modifying
@Transactional
@Query("UPDATE SpaSession s SET s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.SENT, " +
       "s.reminderSentAt = :sentAt, s.reminderClaimExpiresAt = NULL, s.reminderClaimToken = NULL " +
       "WHERE s.spaSessionId = :sessionId " +
       "AND s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED " +
       "AND s.reminderClaimToken = :claimToken")
int recordReminderSent(
        @Param("sessionId") Long sessionId,
        @Param("sentAt") LocalDateTime sentAt,
        @Param("claimToken") String claimToken
);

@Modifying
@Transactional
@Query("UPDATE SpaSession s SET s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.RETRYABLE_FAILURE, " +
       "s.reminderClaimExpiresAt = NULL, s.reminderClaimToken = NULL " +
       "WHERE s.spaSessionId = :sessionId " +
       "AND s.reminderStatus = com.heavenstay.hswrms.m3spa.entity.enums.SpaReminderStatus.CLAIMED " +
       "AND s.reminderClaimToken = :claimToken")
int releaseReminderClaim(
        @Param("sessionId") Long sessionId,
        @Param("claimToken") String claimToken
);
```

### 3.3 Atomic Claim / Reclaim Preserved
The atomic claim query retains its full collision-resistant semantics:
```sql
UPDATE SpaSession s 
SET s.reminderStatus = 'CLAIMED',
    s.reminderClaimedAt = :claimedAt,
    s.reminderClaimExpiresAt = :expiresAt,
    s.reminderClaimToken = :claimToken
WHERE s.spaSessionId = :sessionId
  AND s.sessionStatus = 'SCHEDULED'
  AND s.confirmationStatus = 'PENDING'
  AND s.reminderSentAt IS NULL
  AND (s.reminderStatus IS NULL OR s.reminderStatus = 'PENDING'
       OR s.reminderStatus = 'RETRYABLE_FAILURE'
       OR (s.reminderStatus = 'CLAIMED' AND s.reminderClaimExpiresAt <= :claimedAt))
```
Every successful claim or reclaim replaces the previous token with a fresh collision-resistant UUID.

---

## 4. Migration & Schema Integrity Review

| Artifact | Verification Item | Conformance |
|---|---|---|
| `05_Development/database/schema.sql` | `reminder_claim_token VARCHAR(64) NULL` present on `dbo.SpaSession` | **CONFORMS** |
| `05_Development/database/migrations/V008__m3_spa_session_reminder_claim_token.sql` | Idempotent `IF NOT EXISTS` column addition | **CONFORMS** |
| Precision & Type Safety | `VARCHAR(64)` accommodates full standard 36-char UUIDs with headroom; nullable by default | **CONFORMS** |
| Data Continuity | Pre-existing rows remain valid with `NULL` token; no default constraint required | **CONFORMS** |
| Production Database Safety | Physical databases `HSWRMS` and `HSWRMS_TEST` were **never connected to or modified** | **CONFORMS** |

---

## 5. Documentation Reconciliation

The authoritative compliance matrix (`06_Reports/PHASE_M3_AUTHORITATIVE_BR_COMPLIANCE_MATRIX.md`) was updated:
1. **Mathematical Interval Notation Corrected:**
   - Previous imprecise closed bracket notation `[T-75m, T-60m]` was replaced with:
     - Reminder Eligibility Window: $60\text{ minutes} < \text{time until appointment} \le 75\text{ minutes}$
     - Expiration Deadline Threshold: $\text{time until appointment} \le 60\text{ minutes}$
   - These windows are strictly disjoint: a session at exactly $T-60\text{m}$ is subject to deadline expiration, not reminder dispatch.
2. **Reconciled Test Counts:**
   - Previous baseline: 77 or 83 backend tests.
   - Latest verified baseline: **84 / 84 backend M3 tests**, **159 / 159 frontend contract tests**, and successful frontend build in 1.40s.

---

## 6. Actual Test Execution Evidence

### 6.1 Targeted Acceptance Evidence Suite
```text
Command: .\mvnw.cmd test '-Dtest=SpaAuthoritativeAcceptanceEvidenceTest'
Database Profile: In-Memory H2 (MODE=MSSQLServer)
Results: Tests run: 49, Failures: 0, Errors: 0, Skipped: 0
Execution Time: 19.01s (Total: 28.893s)
Exit Code: 0 (BUILD SUCCESS)
```

### 6.2 Full Module 3 Backend Test Suite
```text
Command: .\mvnw.cmd test '-Dtest=SpaAuthoritativeAcceptanceEvidenceTest,SpaServiceTests,SpaConcurrencyTest,SpaSecurityTests'
Database Profile: In-Memory H2 (MODE=MSSQLServer)
Breakdown:
  - SpaAuthoritativeAcceptanceEvidenceTest: 49 tests (including public serialization regression)
  - SpaServiceTests:                       29 tests
  - SpaSecurityTests:                       5 tests
  - SpaConcurrencyTest:                     1 test
Results: Tests run: 84, Failures: 0, Errors: 0, Skipped: 0
Execution Time: 46.036s
Exit Code: 0 (BUILD SUCCESS)
```

### 6.3 Frontend Contract Test Suite
```text
Command: npx tsx --test src/**/*.test.ts
Results: tests 159, suites 48, pass 159, fail 0, skipped 0
Execution Time: 1.42s
Exit Code: 0 (SUCCESS)
```

### 6.4 Frontend Production Build
```text
Command: npm run build (tsc -b && vite build)
Output: 2,728 modules transformed, 0 TypeScript errors
Bundle: index-DF-i4UNa.js (2,839.98 kB), index-EhPFKbM8.css (226.94 kB)
Execution Time: 1.40s
Exit Code: 0 (SUCCESS)
```

---

## 7. Remaining Limitations & Final Compliance Recommendation

### 7.1 Remaining Limitations
1. **External Notification Service Decoupling:**
   `SpaNotificationPort` remains implemented via `DefaultSpaNotificationAdapter`, which formats structured notifications and logs them to application telemetry. Live cloud SMTP email transmission and bidirectional Google Calendar API synchronization are not provisioned with external credentials.
2. **At-Least-Once Delivery Semantics:**
   In catastrophic crash scenarios where notification dispatch succeeds over the network but the database persistence of `recordReminderSent` fails, the retry loop ensures the reminder is re-dispatched. Exactly-once delivery across uncoordinated third-party network boundaries is theoretically impossible.

### 7.2 Final Compliance Matrix Recommendation
- **BR-M3-10 Status:** **`PARTIAL`** (Retained).
- **Matrix Composition:**
  - **11 PASS:** BR-M3-01 to BR-M3-09, BR-M3-11, BR-M3-12.
  - **3 PARTIAL:** BR-M3-10, BR-M3-13, BR-M3-14.
- **Next Phase:** Module 3 BR-M3-13 (Automatic Recovery) has **not** been started in this phase.

