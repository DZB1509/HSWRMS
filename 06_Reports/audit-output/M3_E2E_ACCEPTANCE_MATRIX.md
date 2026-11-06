# HSWRMS M3 Spa & Wellness Automation: End-to-End Acceptance Matrix

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Execution Date:** November 4, 2026  
**Backend:** Spring Boot 3.3.4 (Java 17, Port 8080, Profile `dev`)  
**Database:** Microsoft SQL Server 2019 Express (`HSWRMS`)  
**Frontend:** React 19 + TypeScript + Vite (Port 5173, `05_Development/frontend`)  
**Browser Engine:** Google Chrome 145 via Playwright  
**Document Status:** FORENSICALLY RECONCILED & AUDIT-VERIFIED  

---

## 1. Comprehensive Acceptance Criteria & Execution Matrix

| Test ID | Test Scenario | Trigger & Component | Input Parameters | Expected Outcome | Observable SQL Server & API Evidence | Final Reconciled Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Customer & Manager Authentication | `POST /api/v1/auth/login` | Email / Dev Password | HTTP 200, JWT token issued, user roles verified | Eleanor Vance (`CUSTOMER`) and Resort Manager (`MANAGER`) authenticated. Bearer JWTs verified. | **PASS** |
| **TC-02** | Indivisible Candidate Discovery (BR-M3-01) | `POST /api/v1/spa/candidates` | Treatment #1, Date `2026-11-05` | HTTP 200, Candidate list pairing qualified therapists and compatible rooms | 12 candidates returned across Therapist #1 and Therapist #2; room capacity and qualification verified. | **PASS** |
| **TC-03** | Atomic Session Reservation (BR-M3-01, BR-M3-04) | `POST /api/v1/spa/sessions` | Booking #3, Treatment #1, Therapist #2, Room #2, `2026-11-05 10:00:00` | HTTP 201, `dbo.SpaSession` row created with `schedule_version = 1`, `confirmation_status = PENDING` | `dbo.SpaSession` ID #7 persisted. `dbo.SpaScheduleHistory` #8 logged `CREATED`. | **PASS** |
| **TC-04** | Customer Attendance Confirmation (BR-M3-11) | `POST /api/v1/spa/sessions/7/confirm-attendance` | Session #7, Customer Bearer JWT | HTTP 200, `confirmation_status` advances to `CONFIRMED` | `dbo.SpaSession` #7 confirmation status = `CONFIRMED`. `dbo.SpaScheduleHistory` #9 logged `ATTENDANCE_CONFIRMED`. | **PASS** |
| **TC-05** | Transactional Outbox Persistence (BR-M3-14 / OI-02) | `SpaScheduleEventOutboxListener.java`<br>`SpaDispatchOutboxWorker.java` | Session creation and attendance events | Outbox records inserted in same DB transaction; worker processes async | `dbo.SpaDispatchOutbox` rows #18, #19, #20, #21 persisted with unique idempotency keys. Processed safely (`SKIPPED`). | **PASS** |
| **TC-06** | Timeline Reminder: T-24h Checkpoint (BR-M3-10) | `SessionTimelineScheduler.java` | Session #7 start time `2026-11-05 10:00:00` | Cron detects session within T-24h window; generates reminder outbox record | `dbo.SpaDispatchOutbox` #23 created with idempotency key `spa:7:schedule:1:REMINDER_T24H`. Claim fencing verified. | **PASS** |
| **TC-07** | Timeline Reminders: T-2h, T-75m, T-15m (BR-M3-10) | `SessionTimelineScheduler.java` | Sessions #13 (18:48), #14 (18:26), #15 (17:28) | Background cron detects live sessions; claims execution; inserts checkpoint outbox entries | **T-2h:** Outbox #37 (`spa:13:schedule:1:REMINDER_T2H`).<br>**T-75m:** Outbox #36 (`spa:14:schedule:1:REMINDER_T75M`).<br>**T-15m:** Outbox #35 (`spa:15:schedule:1:REMINDER_T15M`). All 4 checkpoints live! | **PASS** |
| **TC-08** | Trigger 3A: T-60m Unconfirmed Expiry & Recovery (BR-M3-13) | `SessionTimelineScheduler.java`<br>`SessionRecoveryService.java` | Session #17 start `17:41:39`, `PENDING` (past T-60m deadline) | Transition to `EXPIRED` & `RESCHEDULING`; log history; enqueue recovery dispatch | Live daemon ran at 17:22:16: `SpaSession #17` updated to `EXPIRED` & `RESCHEDULING`. `SpaScheduleHistory #15` logged `RESCHEDULING`. Outbox #38 & #39 enqueued. | **PASS** |
| **TC-09** | Trigger 3B Disruption - Branch A: No Same-Time Replacement | `PATCH /api/v1/therapist/2/status`<br>`SessionRecoveryService.java` | Therapist #2 `SUSPENDED` while Therapist #1 is BUSY (Session #6 at 10:00) | System detects conflict; does NOT silently shift time; sets `RESCHEDULING` | `dbo.SpaSession` #7 status = `RESCHEDULING`. `dbo.SpaScheduleHistory` #11 logged `Same-time replacement unavailable; awaiting customer consent`. | **PASS** |
| **TC-10** | Trigger 3B Disruption - Branch B: Same-Time Rematching | `PATCH /api/v1/therapist/2/status`<br>`SessionRecoveryService.java` | Therapist #2 `SUSPENDED` while Therapist #1 is FREE (Session #8 at 14:00) | Same-time rematching succeeds; Therapist #1 assigned; same time preserved; version incremented; status reset to PENDING | `dbo.SpaSession` #8 therapist updated #2 -> #1; `schedule_version` = 2; `confirmation_status = PENDING`. `dbo.SpaScheduleHistory` #14 logged `RECOVERED`. Outbox #32, #33, #34 created. | **PASS** |
| **TC-11** | Outbox Outcome & Retry Policy Suite (BR-M3-14) | `SpaDispatchOutcomePolicyTest` | 5 unit test scenarios | Exponential backoff, ambiguous outcome terminal suppression, permanent failure handling | **5/5 PASS** (`retryableFailureUsesConfiguredDelayAndStableIdempotencyKey`, `ambiguousEmailOutcomeIsTerminalAndNeverBlindlyRetried`, etc.). | **PASS (AUTOMATED)** |
| **TC-12** | Outbox Integration & Concurrency Suite (BR-M3-14) | `SpaDispatchOutboxTest` | 9 integration test scenarios | Worker lock competition, crash before mark sent, deduplication, restart, retry exhaustion | **9/9 PASS** (`testTwoConcurrentWorkersClaimingSameRecord`, `testApplicationRestartWithPendingDispatch`, `testRetryExhaustionStopsFurtherDispatchAttempts`, etc.). | **PASS (AUTOMATED)** |
| **TC-13** | Timeline Checkpoints Domain Suite (BR-M3-10) | `SpaTimelineCheckpointTest` | 4 domain test scenarios | Checkpoint independence, stale reminder suppression, recovery queuing | **4/4 PASS** (`checkpointsAreIndependentAndIdempotent`, `staleReminderIsNeverSentAfterReschedule`, etc.). | **PASS (AUTOMATED)** |
| **TC-14** | External Outbox Adapter Fault Isolation (BR-M3-14) | `SmtpSpaNotificationAdapterTest`<br>`GoogleCalendarAdapterTest` | 10 unit test scenarios | Fault tolerance when external mail/calendar unconfigured | **10/10 PASS** (7 SMTP tests + 3 Calendar tests pass). Decoupled status handling verified. | **PASS (ADAPTER UNIT)<br>PARTIAL (NETWORK DELIVERY)** |
| **TC-15** | Frontend Spa API Integration Contract Suite | `spaApiIntegration.test.ts` | 10 contract test cases | 10/10 pass | Full lifecycle API contract: treatments, candidates, sessions, attendance confirm/decline, therapist portal. | **PASS (AUTOMATED)** |
| **TC-16** | Frontend Alternative Rejection Safety Suite (BR-M3-08) | `alternativeRejectionSafety.test.ts` | 14 safety contract tests | 14/14 pass | Candidate bundle rejection accumulation, exhaustion semantics, state isolation, race-condition prevention. | **PASS (AUTOMATED)** |
| **TC-17** | Playwright Browser E2E: Customer Journey | `scratch/test_browser_m3_e2e.js` | Native Chrome -> Vite Port 5173 -> Backend Port 8080 | Customer login, catalog navigation, sessions view, attendance confirmation click | Login $\rightarrow$ Treatments $\rightarrow$ Sessions. Clicked `#btn-confirm-attendance-8` at 17:27:30.680; UI badge updated to `CONFIRMED` (`e2e-05`). Note: Initial pending button was rendered below the fold in `e2e-04`. | **PASS (BACKEND/SQL)<br>PARTIAL (UI EVIDENCE)** |
| **TC-18** | Playwright Browser E2E: Manager Portal | `scratch/test_browser_m3_e2e.js` | Native Chrome -> `/manager/spa` | Manager resource view and therapist operational grid | Authenticated manager session; `/manager/spa` rendered therapist status table and operational schedule (`e2e-06`). Note: Suspension was not triggered in UI. | **PASS (PAGE RENDER)<br>NOT VERIFIED (ACTION)** |
| **TC-19** | Frontend TypeScript Compilation Check | `npx tsc --noEmit` | Entire frontend project | Zero compilation errors | Exited with code 0; 0 errors across all TypeScript files. | **PASS** |

---

## 2. SQL Server Persistence Evidence

### 2.1 SpaSession Table Rows (Key Verification Sessions)
```sql
SELECT spa_session_id, retreat_booking_id, treatment_id, therapist_id, room_id, session_status, confirmation_status, scheduled_start_at, scheduled_end_at, schedule_version, recovery_attempted_version FROM dbo.SpaSession WHERE spa_session_id IN (7, 8, 13, 14, 15, 17) ORDER BY spa_session_id ASC;
```
| Session ID | Booking ID | Treatment ID | Therapist ID | Room ID | Status | Confirmation | Scheduled Start | Scheduled End | Version | Recovery Attempted |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `7` | `3` | `1` | `2` | `2` | `RESCHEDULING` | `CONFIRMED` | `2026-11-05 10:00:00` | `2026-11-05 11:30:00` | `1` | `1` |
| `8` | `3` | `1` | `1` | `2` | `SCHEDULED` | `CONFIRMED` | `2026-11-05 14:00:00` | `2026-11-05 15:30:00` | `2` | `0` |
| `13` | `3` | `1` | `1` | `1` | `SCHEDULED` | `PENDING` | `2026-11-04 18:48:47` | `2026-11-04 19:48:47` | `1` | `0` |
| `14` | `3` | `1` | `1` | `2` | `SCHEDULED` | `PENDING` | `2026-11-04 18:26:47` | `2026-11-04 19:26:47` | `1` | `0` |
| `15` | `3` | `1` | `1` | `1` | `SCHEDULED` | `CONFIRMED` | `2026-11-04 17:28:47` | `2026-11-04 18:28:47` | `1` | `0` |
| `17` | `3` | `1` | `1` | `1` | `RESCHEDULING` | `EXPIRED` | `2026-11-04 17:41:39` | `2026-11-04 18:41:39` | `1` | `1` |

### 2.2 SpaScheduleHistory Audit Trail (Audit Immutability & Deduplication)
```sql
SELECT history_id, session_id, actor_role, change_type, previous_status, new_status, reason FROM dbo.SpaScheduleHistory WHERE session_id IN (7, 8, 17) ORDER BY history_id ASC;
```
| History ID | Session ID | Actor Role | Change Type | Previous Status | New Status | Reason |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `8` | `7` | `Customer` | `CREATED` | `NULL` | `SCHEDULED` | `Automated M3.1 Acceptance Verification Session` |
| `9` | `7` | `Customer` | `ATTENDANCE_CONFIRMED` | `PENDING` | `CONFIRMED` | `Customer attendance confirmed` |
| `11` | `7` | `SYSTEM` | `RESCHEDULING` | `SCHEDULED` | `RESCHEDULING` | `Same-time replacement unavailable; awaiting customer consent` |
| `12` | `8` | `Customer` | `CREATED` | `NULL` | `SCHEDULED` | `Automated M3.1 Same-Time Rematch Test` |
| `13` | `8` | `Customer` | `ATTENDANCE_CONFIRMED` | `PENDING` | `CONFIRMED` | `Customer attendance confirmed` |
| `14` | `8` | `SYSTEM` | `RECOVERED` | `SCHEDULED` | `SCHEDULED` | `Automated same-time rematching` |
| `15` | `17` | `SYSTEM` | `RESCHEDULING` | `SCHEDULED` | `RESCHEDULING` | `Same-time replacement unavailable; awaiting customer consent` |

*Note on Duplicate Protection:* When attendance on Session #8 was confirmed again during the browser E2E test at 17:27:30, `SpaScheduleAuditEventListener` evaluated `existsBySessionIdAndChangeTypeAndNewStatusAndNewStartAt()` and detected matching History #13. The listener correctly logged a warning and suppressed duplicate history insertion, preserving audit integrity.

### 2.3 SpaDispatchOutbox Records (Persistence & Claim Fencing)
| Outbox ID | Session ID | Channel | Status | Retries | Idempotency Key | Checkpoint / Event |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `18` | `7` | `CALENDAR` | `SKIPPED` | 0 | `outbox-session-7-hist-8-CALENDAR` | Creation Calendar |
| `19` | `7` | `EMAIL` | `SKIPPED` | 0 | `outbox-session-7-hist-8-EMAIL` | Creation Email |
| `20` | `7` | `CALENDAR` | `SKIPPED` | 0 | `outbox-session-7-hist-9-CALENDAR` | Confirmation Calendar |
| `21` | `7` | `EMAIL` | `SKIPPED` | 0 | `outbox-session-7-hist-9-EMAIL` | Confirmation Email |
| `23` | `7` | `EMAIL` | `SKIPPED` | 0 | `spa:7:schedule:1:REMINDER_T24H` | **T-24h Reminder** |
| `26` | `7` | `CALENDAR` | `SKIPPED` | 0 | `outbox-session-7-hist-11-CALENDAR` | Disruption Calendar |
| `27` | `7` | `EMAIL` | `SKIPPED` | 0 | `outbox-session-7-hist-11-EMAIL` | Disruption Email |
| `28` | `8` | `CALENDAR` | `SKIPPED` | 0 | `outbox-session-8-hist-12-CALENDAR` | Creation Calendar |
| `29` | `8` | `EMAIL` | `SKIPPED` | 0 | `outbox-session-8-hist-12-EMAIL` | Creation Email |
| `30` | `8` | `CALENDAR` | `SKIPPED` | 0 | `outbox-session-8-hist-13-CALENDAR` | Confirmation Calendar |
| `31` | `8` | `EMAIL` | `SKIPPED` | 0 | `outbox-session-8-hist-13-EMAIL` | Confirmation Email |
| `32` | `8` | `CALENDAR` | `SKIPPED` | 0 | `outbox-session-8-hist-14-CALENDAR` | Recovery Calendar |
| `33` | `8` | `EMAIL` | `SKIPPED` | 0 | `outbox-session-8-hist-14-EMAIL` | Recovery Email |
| `34` | `8` | `EMAIL` | `SKIPPED` | 0 | `spa:8:schedule:2:REMINDER_T24H` | **T-24h Reminder** |
| `35` | `15` | `EMAIL` | `SKIPPED` | 0 | `spa:15:schedule:1:REMINDER_T15M` | **T-15m Reminder** |
| `36` | `14` | `EMAIL` | `SKIPPED` | 0 | `spa:14:schedule:1:REMINDER_T75M` | **T-75m Reminder** |
| `37` | `13` | `EMAIL` | `SKIPPED` | 0 | `spa:13:schedule:1:REMINDER_T2H` | **T-2h Reminder** |
| `38` | `17` | `CALENDAR` | `SKIPPED` | 0 | `outbox-session-17-hist-15-CALENDAR` | Trigger 3A Calendar |
| `39` | `17` | `EMAIL` | `SKIPPED` | 0 | `outbox-session-17-hist-15-EMAIL` | Trigger 3A Email |

*Outbox Clarification:* All live rows show `status = 'SKIPPED'` and `retry_count = 0` because no external email or calendar provider was configured in the local development environment. Live retries under real network failures were NOT simulated on SQL Server; retry and backoff mechanics are verified via automated test suites TC-11 and TC-12.

---

## 3. Browser E2E Coverage Breakdown Across 10 Scenarios

| Scenario | Scope | Execution | Result | Evidence |
| :--- | :--- | :--- | :---: | :--- |
| **A. Customer Authentication** | Login form | Form fill & submit | **PASS** | `e2e-01-customer-login.png` |
| **B. Customer Dashboard** | Post-login dashboard | URL redirect verification | **PASS** | `e2e-02-customer-dashboard.png` |
| **C. Spa Catalog Loading** | Treatments catalog | `/customer/spa` route | **PASS** | `e2e-03-spa-treatments.png` |
| **D. Candidate Discovery** | Search available slots | Not performed in browser | **NOT VERIFIED (BROWSER)** | Tested via API |
| **E. New Booking Creation** | Form reservation submit | Not performed in browser | **NOT VERIFIED (BROWSER)** | Tested via API |
| **F. My Spa Sessions** | Sessions listing view | `/customer/spa/sessions` route | **PASS** | `e2e-04-my-spa-sessions-before.png` |
| **G. Attendance Confirmation** | Confirm button click | Button click & badge update | **PARTIAL** | Backend request executed (`task-3789.log`), UI updated to `CONFIRMED` (`e2e-05`). Pre-click button was below the fold in `e2e-04`. |
| **H. Manager Spa Rendering** | Roster & resource grid | `/manager/spa` route | **PASS** | `e2e-06-manager-spa.png` |
| **I. Manager Therapist Suspension** | Action button in UI | Not performed in browser | **NOT VERIFIED (BROWSER)** | Tested via API |
| **J. Customer Recovery Feedback** | Interactive reschedule | Not performed in browser | **NOT VERIFIED (BROWSER)** | Tested via API |

---

## 4. Forensic Reconciliation Summary

1. **What was confirmed:**
   - Real-time Spring Boot scheduler executing against SQL Server 2019 Express `HSWRMS`.
   - All 4 reminder checkpoints persisted to `dbo.SpaDispatchOutbox` (#23, #34, #35, #36, #37).
   - Trigger 3A deadline expiry and Trigger 3B disruption recovery verified live on SQL Server.
   - Exact 52 automated tests passing without regression.
2. **What was contradictory:**
   - Previous report claimed Session #8 before-state was shown in `e2e-04-my-spa-sessions-before.png`. In fact, Session #8 was rendered below the viewport fold and was not visible until Playwright auto-scrolled to click it.
   - Previous report claimed "clean branch" despite 6 unstaged tracked modifications.
   - Previous report claimed "circuit-breaking" when the implementation actually uses retry exhaustion and terminal suppression.
3. **What was corrected:**
   - Git state terminology corrected to "unstaged working tree with 6 preserved configuration modifications".
   - Browser E2E scope honestly partitioned across all 10 user journeys.
   - Outbox retry claims accurately split between automated tests (PASS) and live provider failure (NOT VERIFIED LIVE).
4. **What remains unverified:**
   - Interactive browser candidate search and booking creation (Screens 27 & 28).
   - Interactive manager therapist suspension button click in browser UI.
   - Live external SMTP email transmission (blocked on credential rotation).
   - Live Google Calendar OAuth2 synchronization (unconfigured).
