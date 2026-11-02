# HeavenStay Wellness Resort Management System (HSWRMS)
## Post-Implementation Acceptance Gate: WP-1B & Module M3 (BR-M3-10 / BR-M3-13 / BR-M3-14)

- **Date:** October 31, 2026
- **Repository:** `HSWRMS-audit-all-modules`
- **Target Branch:** `feature/hswrms-m1-m6-integration`
- **Baseline Git Commit:** `77389306de4388a6cf95c6115a3e0936cbc6f9a1`
- **Environment:** Isolated H2 In-Memory (`test` profile); strictly zero physical SQL Server database connections or mutations.
- **Document Purpose:** Formal evidence-based post-implementation acceptance gate verifying WP-1B (F&B Void & Credit Note Workflow) and Module M3 advanced integration rules (BR-M3-10, BR-M3-13, BR-M3-14).

---

## 1. Git and Change Preservation Audit

### 1.1 Repository State & Commit Integrity
- **Active Branch:** `feature/hswrms-m1-m6-integration`
- **Current HEAD Commit:** `77389306de4388a6cf95c6115a3e0936cbc6f9a1`
- **Commit / Push Status:** **STRICTLY ZERO COMMITS OR PUSHES PERFORMED** during this acceptance gate.
- **Safety Invariant:** All changes remain strictly in the local working directory. No destructive operations (`git reset`, `git clean`, `git checkout`, `rebase`, or force push) were invoked.

### 1.2 Working Tree Status (`git status --short`)
```
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/controller/TherapistController.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaSession.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/DefaultSpaNotificationAdapter.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/SpaNotificationPort.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/SpaSessionRepository.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SessionRecoveryService.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaSessionService.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/AdjustmentController.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/AdjustmentResponseDTO.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/CreditNoteResponseDTO.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/FolioItemResponseDTO.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/InvoiceResponseDTO.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/CreditNoteEntity.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioEntity.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioItemEntity.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/CreditNoteRepository.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/AdjustmentServiceImpl.java
 M 05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/FolioBillingService.java
 M 05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/AdjustmentServiceTest.java
 M 05_Development/database/migrations/V010__m5_fnb_void_and_credit_note.sql
 M 05_Development/database/schema.sql
 M 05_Development/frontend/src/features/m5-billing/types/index.ts
 M 05_Development/frontend/src/pages/customer/FolioInvoicePage.tsx
 M 06_Reports/PHASE_GIT_TEMPORARY_CHECKPOINT_AND_PUSH_REPORT.md
 M 06_Reports/PHASE_M3_AUTHORITATIVE_BR_COMPLIANCE_MATRIX.md
?? 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaScheduleHistory.java
?? 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/GoogleCalendarAdapter.java
?? 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/SmtpSpaNotificationAdapter.java
?? 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/SpaCalendarPort.java
?? 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/SpaScheduleHistoryRepository.java
?? 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaScheduleAuditEventListener.java
?? 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/TherapistStatusRecoveryListener.java
?? 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/TherapistStatusService.java
?? 05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/event/
?? 05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/GoogleCalendarAdapterTest.java
?? 05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SmtpSpaNotificationAdapterTest.java
?? 05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaScheduleHistoryTest.java
?? 05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistRecoveryOrchestrationTest.java
?? 05_Development/database/generated/
?? 05_Development/database/migrations/V011__m3_spa_schedule_history.sql
?? 06_Reports/PHASE_M2_FULL_HISTORY_MERGE_INTEGRATION_REPORT.md
?? 06_Reports/PHASE_M2_FULL_HISTORY_MERGE_TRIAL_REPORT.md
?? 06_Reports/PHASE_M2_SOURCE_HISTORY_PRESERVATION_AND_INTEGRATION_PLAN.md
?? 06_Reports/PHASE_M3_BR10_BR13_BR14_COMPLETION_AND_REGRESSION_REPORT.md
?? 06_Reports/PHASE_WP1B_FINANCIAL_INTEGRITY_CORRECTION_AND_VERIFICATION.md
?? 06_Reports/audit-output/backup_targeted_correction_20261029/
?? 06_Reports/visual-evidence/
```

---

## 2. WP-1B Financial Integrity & Accounting Acceptance Audit

### 2.1 Partial Adjustment Amount Calculation
- **Source Verification:** `FolioItemEntity.java` lines 42–49, 176–191.
- **Payable Amount Invariant:** The original posted financial charge `FolioItemEntity.amount` is strictly immutable. Financial reductions accumulate in `FolioItemEntity.adjustedAmount`.
- **Mathematical Definition:**
  $$\text{payableAmount} = \begin{cases} 0 & \text{if } \text{isVoided} = \text{true} \\ \max(0, \text{amount} - \text{adjustedAmount}) & \text{if } \text{isVoided} = \text{false} \end{cases}$$
- **Pre-Invoice Recalculation:** `FolioEntity.recalculateTotals()` computes folio subtotal as $\sum \text{item.getPayableAmount()}$. If a draft invoice exists, `FolioBillingService.calculateInvoiceAmounts` dynamically derives updated subtotal and VAT.

### 2.2 Full Void vs. Partial Adjustment Semantics
- **Source Verification:** `AdjustmentServiceImpl.java` lines 229–266.
- **Pre-Invoice Logic:**
  - When an adjustment is approved before invoice issuance:
    - If `newTotalAdjusted >= item.getAmount()`: Marked as a **Full Void** (`item.setIsVoided(true)` and `item.setVoidedAdjustmentRequestId(adj.getAdjustmentRequestId())`).
    - If `newTotalAdjusted < item.getAmount()`: Marked as a **Partial Adjustment** (`item.setIsVoided(false)` and `item.setAdjustedAmount(newTotalAdjusted)`).
  - This eliminates the bug where a partial adjustment would mistakenly mark the entire charge item as voided.
- **Post-Invoice Logic:**
  - Once an invoice is `ISSUED` or `PAID`, `FolioItemEntity` is **never mutated** (`isVoided` remains `false`).
  - Instead, the adjustment issues an official `CreditNoteEntity` referencing the invoice and folio item.

### 2.3 Cumulative Approved Adjustment Tracking
- **Source Verification:** `AdjustmentRequestRepository.sumApprovedAmountByFolioItemId(Long folioItemId)` & `AdjustmentServiceImpl.java` lines 90–111, 215–222.
- **Concurrency & Overflow Guard:**
  $$\text{remainingAdjustable} = \text{item.getAmount()} - \sum \text{approvedAdjustments}$$
  - A new adjustment request is rejected if $\text{requestedAmount} > \text{remainingAdjustable}$.
  - During the approval step, a pessimistic lock (`findByIdForUpdate`) recalculates the current approved sum and throws `BusinessRuleException("EXCEEDS_ADJUSTABLE_AMOUNT")` if a concurrent approval has already consumed the available margin.

### 2.4 Tax-Inclusive Credit Note Calculation
- **Source Verification:** `AdjustmentServiceImpl.java` lines 278–282.
- **Formula:**
  $$\text{baseAmount} = \text{adj.getRequestedAmount()}$$
  $$\text{taxAmount} = \text{round}_{\text{HALF\_UP}}(\text{baseAmount} \times \text{vatRate}, 2)$$
  $$\text{finalCreditAmount} = \text{baseAmount} + \text{taxAmount}$$
  *(where $\text{vatRate}$ is configured via `app.billing.vat-rate`, defaulting to 0.08 / 8%)*.

### 2.5 Paid Invoice Refund Liability & Customer Credit Persistence
- **Source Verification:** `CreditNoteEntity.java` lines 40–45, `AdjustmentServiceImpl.java` lines 283–298, `FolioBillingService.java` lines 612–635, and `CreditNoteRepository.java` lines 26–31.
- **Persistence Model:**
  - `CreditNoteEntity` contains dedicated audit columns:
    - `status`: `'CREDIT_APPLIED'` (unpaid invoice) vs. `'PENDING_REFUND'` (paid invoice) vs. `'REFUNDED'` (completed payout).
    - `refund_amount`: Holds $\text{finalCreditAmount}$ when issued against a `PAID` invoice; holds $0.00$ when issued against an `ISSUED` (unpaid) invoice.
  - `InvoiceResponseDTO` exposes:
    - `creditNotes`: Total final credit amount issued against the invoice.
    - `pendingRefundTotal`: Cumulative sum of refund liabilities (`WHERE status = 'PENDING_REFUND'`).
- **Gateway Settlement Distinction (Honest Accounting Separation):**
  - **Accounting Layer (Implemented & Verified):** Credit Notes issued against already-paid invoices record an explicit, auditable liability (`status = 'PENDING_REFUND'`, `refund_amount = finalCreditAmount`), preventing double-crediting or balance distortion.
  - **Downstream Disbursement Layer (Decoupled):** Automated payment gateway reversal API (e.g., Stripe/VNPay refund callback) is decoupled from internal accounting adjustment issuance. Cashier or financial controller executes external gateway settlement downstream.

### 2.6 Idempotency & Concurrency Defenses
- **Duplicate Request Defense:** `adjustmentRequestRepository.existsByFolioItemFolioItemIdAndStatus(item.getFolioItemId(), "PENDING_APPROVAL")` prevents submitting multiple concurrent pending adjustments for the same charge item.
- **Credit Note Number Uniqueness:** `CreditNoteEntity.creditNoteNumber` is protected by a unique database constraint (`UQ_CreditNote_Number`) and generated deterministically (`CN-YYYYMMDD-{invoiceId}-{requestId}`) with sequential collision resolution (`existsByCreditNoteNumber`).
- **Idempotent Decision:** Duplicate approval or rejection requests return the existing entity state safely without duplicating Credit Notes or ledger entries.

### 2.7 Authorization & Separation of Duties
- **Request Submission:** Restricted to `@PreAuthorize("hasAnyRole('RECEPTIONIST', 'STAFF', 'FNB_STAFF', 'MANAGER', 'ADMIN')")`.
- **Decision Processing:** Restricted to `@PreAuthorize("hasAnyRole('MANAGER', 'ADMIN')")`.
- **Self-Approval Prohibition:** `AdjustmentServiceImpl.java` lines 171–174 explicitly checks:
  ```java
  if (adj.getRequestedByUserId() != null && adj.getRequestedByUserId().equals(approverUserId)) {
      throw new BusinessRuleException("SEPARATION_OF_DUTIES_VIOLATION",
          "Requester cannot approve their own adjustment request.");
  }
  ```

---

## 3. BR-M3-10 External Integration Acceptance Audit

### 3.1 Google Calendar Adapter (`GoogleCalendarAdapter.java`)
- **Port Contract:** Implements `SpaCalendarPort`.
- **Configuration & Decoupled Execution:**
  - `@Value("${google.calendar.enabled:false}")` (default: false).
  - `@Value("${google.calendar.calendar-id:primary}")`.
- **Decoupled Fallback:** In development/test/local mode (`enabled: false`), the adapter generates structured telemetry and returns a deterministic decoupled reference (`gcal-decoupled-{sessionId}`), eliminating dependencies on external cloud OAuth tokens.
- **Enabled Mode:** When enabled, formats event payload (`summary`, `description`, `location`, `timestamps`) and generates calendar event IDs.
- **Live Sync Proof:** Adapter contract and formatting verified (3 tests in `GoogleCalendarAdapterTest`). Live synchronization with Google Calendar servers is unverified due to lack of Google Cloud OAuth2 service credentials in test environment.
- **Reconciled Status:** **PARTIAL** (Contract implemented & verified; live cloud unverified).

### 3.2 SMTP Spa Notification Adapter (`SmtpSpaNotificationAdapter.java`)
- **Port Contract:** Implements `SpaNotificationPort`.
- **Profile Activation:** Annotated with `@Profile("smtp")` and `@Primary`.
- **Message Construction:** Utilizes Spring's `JavaMailSender` and `SimpleMailMessage` with branded HeavenStay subject, appointment details, specialist name, suite location, and confirmation links.
- **Fault Handling & Retry Eligibility:**
  - Catches `MailException` without leaking mail credentials or sensitive guest tokens in logs.
  - Returns `false` upon delivery failure, allowing upstream schedulers (`SessionTimelineScheduler`) to release claim leases and trigger backoff retries.
- **Reconciled Status:** **PARTIAL** (Production adapter implemented & unit-tested with mock `JavaMailSender`; live external SMTP relay connection unverified in test environment).

---

## 4. BR-M3-13 Recovery Reliability Acceptance Audit

### 4.1 State Transitions & Event Publication
- **Source Verification:** `TherapistStatusService.java` & `TherapistStatusRecoveryListener.java`.
- **Pessimistic Locking:** `TherapistStatusService.updateTherapistStatus` acquires a pessimistic lock (`findByIdWithLock`) on the therapist before updating status to `INACTIVE` or `SUSPENDED`.
- **Event Flow:** Synchronous application event `TherapistStatusChangedEvent` is published via `ApplicationEventPublisher`.

### 4.2 Duplicate Event & Idempotency Handling
- If `previousStatus == newStatus`, `TherapistStatusService` immediately logs a no-op update and emits zero events.
- In `SessionRecoveryService.attemptSameTimeRecovery`, each session evaluates its current state and therapist qualifications before mutating resources, preventing duplicate conflicts.

### 4.3 Listener Failure Resilience
- In `TherapistStatusRecoveryListener.onTherapistStatusChanged`, affected sessions retrieved via `sessionRepository.findActiveUpcomingSessionsByTherapist` are processed in an isolated loop:
  ```java
  for (SpaSession session : affectedSessions) {
      try {
          sessionRecoveryService.attemptSameTimeRecovery(session.getSpaSessionId());
      } catch (Exception ex) {
          log.error("Error attempting recovery for SpaSession #{}: {}", session.getSpaSessionId(), ex.getMessage());
      }
  }
  ```
  A failure on one session is safely contained and does not abort recovery for other affected sessions.

### 4.4 Process Crash Resilience & Durable Recovery
- Recovery is backed by the durable query `sessionRepository.findActiveUpcomingSessionsByTherapist(therapistId, now)`.
- If the application crashes during or after a status update, any subsequent background health sweep or manual trigger can scan this query directly from the database and recover unrematched sessions.
- **Reconciled Status:** **PASS**.

---

## 5. BR-M3-14 Audit Durability Acceptance Audit

### 5.1 Audit History Persistence
- **Entity:** `SpaScheduleHistory.java` mapped to `dbo.SpaScheduleHistory`.
- **Trigger Points:** Synchronous audit row persisted for every accepted state change:
  - Initial reservation creation (`CREATED`)
  - Rescheduling (`RESCHEDULED`)
  - Attendance confirmation (`ATTENDANCE_CONFIRMED`)
  - Cancellation (`CANCELLED`)
  - Therapist outcome recording (`COMPLETED`, `NO_SHOW`)
  - Automated recovery rematching (`RECOVERED`)
- **Exclusion of Rejected Actions:** Validation failures, unauthorized callers, or conflicting slots throw exceptions *before* `SpaScheduleAcceptedEvent` publication, ensuring zero dirty/rejected records in history.

### 5.2 External Provider Non-Blocking Semantics
- In `SpaScheduleAuditEventListener.onScheduleAccepted`:
  - Step 1: Saves `SpaScheduleHistory` to database.
  - Step 2: Calendar synchronization wrapped in an isolated `try-catch`.
  - Step 3: Notification dispatch wrapped in an isolated `try-catch`.
  - External network or provider failures log errors but **NEVER roll back or invalidate** the committed database transition.

### 5.3 Audit Tracking Fields
- `history_id`: Primary key (identity).
- `session_id`: Target spa session ID.
- `actor_user_id`: Authenticated user ID executing the change.
- `actor_role`: Operational role (`CUSTOMER`, `RECEPTIONIST`, `THERAPIST`, `SYSTEM`).
- `change_type`: State machine transition type.
- `previous_status` & `new_status`: Confirmation and session statuses.
- `previous_start_at` & `new_start_at`: Time intervals.
- `previous_therapist_id` & `new_therapist_id`: Assigned therapist IDs.
- `previous_room_id` & `new_room_id`: Assigned treatment suite IDs.
- `reason`: Operational explanation or customer note.
- `external_calendar_id`: External calendar reference ID.
- `created_at`: UTC audit timestamp.

### 5.4 Database DDL Parity
- Schema migration `V011__m3_spa_schedule_history.sql` and canonical `schema.sql` contain identical DDL definitions for `dbo.SpaScheduleHistory` and `IX_SpaScheduleHistory_session_id`.
- **Reconciled Status:** **PASS**.

---

## 6. Targeted Test Execution Evidence

All targeted acceptance tests were executed via Maven under isolated in-memory H2 configuration:

```powershell
cd 05_Development/backend
.\mvnw.cmd test "-Dtest=AdjustmentServiceTest,FnbFolioIntegrationTest,GoogleCalendarAdapterTest,SmtpSpaNotificationAdapterTest,TherapistRecoveryOrchestrationTest,SpaScheduleHistoryTest"
```

### 6.1 Test Execution Results Table

| Test Suite Class | Domain / Module | Tests Run | Failures | Errors | Skipped | Elapsed Time | Exit Code | Result |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `GoogleCalendarAdapterTest` | M3 Calendar Port / Adapter | 3 | 0 | 0 | 0 | 0.184 s | 0 | **PASS** |
| `SmtpSpaNotificationAdapterTest` | M3 Notification Port / Adapter | 5 | 0 | 0 | 0 | 1.488 s | 0 | **PASS** |
| `SpaScheduleHistoryTest` | M3 Audit History Persistence (BR-M3-14) | 3 | 0 | 0 | 0 | 1.348 s | 0 | **PASS** |
| `TherapistRecoveryOrchestrationTest` | M3 Automatic Recovery (BR-M3-13) | 3 | 0 | 0 | 0 | 1.258 s | 0 | **PASS** |
| `AdjustmentServiceTest` | M5 Void & Credit Note (WP-1B) | 25 | 0 | 0 | 0 | 2.502 s | 0 | **PASS** |
| `FnbFolioIntegrationTest` | M4/M5 Checkout Guard & Charge Invariants | 28 | 0 | 0 | 0 | 1.303 s | 0 | **PASS** |
| **Targeted Total** | **Combined Acceptance Suite** | **67** | **0** | **0** | **0** | **44.138 s** | **0** | **PASS** |

### 6.2 Full Regression Baseline Evidence

| Test Scope | Executed Suite | Tests Run | Pass | Failures / Errors | Status |
|---|---|:---:|:---:|:---:|:---:|
| **Module M3 Backend** | `SpaAuthoritativeAcceptanceEvidenceTest`, `SpaServiceTests`, `SpaSecurityTests`, `SpaConcurrencyTest`, M3 Adapter & History Suites | 98 | 98 | 0 | **PASS** |
| **WP-1B / Cross-Module Regression** | M4 F&B, M5 Billing, Adjustment Services, Checkout Guard Suites | 136 | 136 | 0 | **PASS** |
| **Frontend Contract & Build** | Vitest contract suites (`alternativeRejectionSafety`, `paymentSafety`, `fnbVoidSafety`, etc.) | 159 | 159 | 0 | **PASS** |
| **Frontend Static Typing & Linting** | `oxlint`, `tsc -b`, `vite build` | — | — | 0 errors | **PASS** |

---

## 7. Authoritative Acceptance Matrix & Verdicts

| Acceptance Criterion | Functional & Architectural Scope | Source Implementation Proof | Automated Test Proof | Verdict |
|---|---|---|---|:---:|
| **WP-1A: Checkout Guard & Invariants** | Blocks checkout when active meal orders exist; blocks meal order creation once folio is closed/paid. | `FolioBillingService.hasUnsettledOrders`, `MealOrderService.createMealOrder` | `FnbFolioIntegrationTest` (28 tests) | **PASS** |
| **WP-1B: Folio Void Workflow (Pre-Invoice)** | Immutable charge retention; partial adjustment accumulates in `adjustedAmount`; full void marks `isVoided = true`. | `FolioItemEntity.getPayableAmount()`, `AdjustmentServiceImpl.processAdjustmentDecision` | `AdjustmentServiceTest.testApproveAdjustment_PreInvoice_Partial` | **PASS** |
| **WP-1B: Credit Note Issuance (Post-Invoice)** | Tax-inclusive credit note calculation; immutable folio retention; invoice balance adjustment. | `CreditNoteEntity`, `AdjustmentServiceImpl.generateCreditNoteNumber` | `AdjustmentServiceTest.testApproveAdjustment_PostInvoice_CreditNote` | **PASS** |
| **WP-1B: Paid Invoice Refund Liability Tracking** | Explicit tracking of refund liability (`status = 'PENDING_REFUND'`, `refund_amount = finalCreditAmount`) on paid invoices. | `CreditNoteEntity.status`, `CreditNoteRepository.sumPendingRefundAmountByInvoiceId` | `AdjustmentServiceTest.testApproveAdjustment_PaidInvoice_SetsPendingRefundStatus` | **PASS** |
| **WP-1B: Gateway Automated Settlement** | Real-time automated physical disbursement / payment gateway refund API execution. | Decoupled downstream operational step; not automated in accounting layer. | Manual / external banking process | **PARTIAL**<br>*(Decoupled)* |
| **WP-1B: Governance & Separation of Duties** | Requesters cannot approve their own requests; Manager/Admin authorization required. | `AdjustmentServiceImpl` (`SEPARATION_OF_DUTIES_VIOLATION`), `AdjustmentController` | `AdjustmentServiceTest.testSeparationOfDutiesViolation` | **PASS** |
| **BR-M3-10: T-1h Reminder Scheduling & Fencing** | 60-min window scanner, UUID claim token fencing, multi-instance deduplication, retry semantics. | `SessionTimelineScheduler`, `SpaSessionRepository` (`reminder_claim_token`) | `SpaAuthoritativeAcceptanceEvidenceTest` (21 tests) | **PASS** |
| **BR-M3-10: Notification Port & SMTP Adapter** | Production `JavaMailSender` adapter, error handling, credential/PII protection. | `SpaNotificationPort`, `SmtpSpaNotificationAdapter` | `SmtpSpaNotificationAdapterTest` (5 tests) | **PARTIAL**<br>*(Live SMTP unverified)* |
| **BR-M3-10: Calendar Port & Google Adapter** | Decoupled adapter contract, configurable enabled vs decoupled modes. | `SpaCalendarPort`, `GoogleCalendarAdapter` | `GoogleCalendarAdapterTest` (3 tests) | **PARTIAL**<br>*(Live OAuth unverified)* |
| **BR-M3-13: Automatic Recovery Orchestration** | Therapist suspension/inactivation triggers automated session rematching; preserves slot or requests consent. | `TherapistStatusService`, `TherapistStatusRecoveryListener`, `SessionRecoveryService` | `TherapistRecoveryOrchestrationTest` (3 tests) | **PASS** |
| **BR-M3-14: Audit History Durability** | Persistent immutable history row written on all accepted transitions; non-blocking external dispatch. | `SpaScheduleHistory`, `SpaScheduleAuditEventListener`, `V011__m3_spa_schedule_history.sql` | `SpaScheduleHistoryTest` (3 tests) | **PASS** |

---

## 8. Summary & Recommendation

1. **WP-1B Financial Acceptance:** The financial integrity workflow meets all accounting and data immutability requirements. Original folio charge records remain strictly immutable, partial adjustments do not void entire items, cumulative approved amounts cannot exceed original charges, and refund liabilities for already-paid invoices are persisted with status `PENDING_REFUND`.
2. **Module M3 Integration Acceptance:**
   - **BR-M3-13 (Automatic Recovery):** Fully compliant (**PASS**). Therapist status changes trigger automated rescheduling workflows with fault-tolerant iteration and durable database query support.
   - **BR-M3-14 (Audit Durability):** Fully compliant (**PASS**). All accepted schedule changes record immutable audit rows in `dbo.SpaScheduleHistory`. Calendar and notification dispatch errors are non-blocking and do not roll back committed transitions.
   - **BR-M3-10 (Calendar & Notification):** Reconciled as **PARTIAL** based on strict acceptance guidelines: core scheduling, temporal windows, multi-instance UUID fencing, and decoupled adapter contracts are fully verified (**PASS** in code and unit tests), while live external synchronization with Google Calendar (requiring Google Cloud OAuth credentials) and live SMTP relay remain unverified against live external cloud providers in the local test environment.
3. **Preservation Commitment:** All code, test, and documentation assets remain safely in the working directory without unauthorized Git commits or pushes.

