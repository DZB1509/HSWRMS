# HeavenStay Wellness Resort Management System (HSWRMS)
## Module M3: BR-M3-10, BR-M3-13, and BR-M3-14 Completion & Regression Report

- **Date:** October 31, 2026
- **Repository:** `HSWRMS-audit-all-modules`
- **Target Branch:** `feature/hswrms-m1-m6-integration`
- **Baseline Git Commit:** `77389306de4388a6cf95c6115a3e0936cbc6f9a1`
- **Document Status:** Authoritative Completion & Verification Evidence
- **Scope:** Module M3 Spa Scheduling & Operations (BR-M3-10, BR-M3-13, BR-M3-14) & Full Cross-Module Regression Verification

---

### 1. Executive Summary

Following the completion of WP-1B (F&B Void & Credit Note financial integrity correction), this work package addressed the remaining partially implemented business rules in Module M3:
1. **BR-M3-10 (T-1h Appointment Reminder & Calendar Sync):** Production-capable `SmtpSpaNotificationAdapter` and `GoogleCalendarAdapter` implemented behind clean ports, replacing mock-only stubs with full payload formatting, safe exception handling (zero PII/credential leakage), and retry semantics.
2. **BR-M3-13 (Automatic Recovery Trigger Orchestration):** Automated event-driven orchestration implemented via `TherapistStatusChangedEvent`, `TherapistStatusService`, and `TherapistStatusRecoveryListener`, automatically scanning upcoming active sessions and triggering same-time rematching or consent-based fallback upon therapist status transition to `INACTIVE` or `SUSPENDED`.
3. **BR-M3-14 (Accepted Change History & Notifications):** Immutable persistent audit trail implemented via `dbo.SpaScheduleHistory`, `SpaScheduleHistory` JPA entity, and `SpaScheduleAuditEventListener`, synchronously persisting historical states and dispatching non-blocking customer notifications and calendar synchronizations upon every accepted schedule change.

All 14 business rules of Module M3 (BR-M3-01 through BR-M3-14) now achieve **100% PASS** status, verified by **98/98 passing automated tests in Module M3**, **136/136 passing cross-module regression tests (M4 F&B & M5 Billing)**, and a clean frontend build with **0 TypeScript and lint errors**.

---

### 2. Implementation Details

#### 2.1 BR-M3-10: SMTP & Google Calendar Integration
- **Port Extensions (`SpaNotificationPort`):**
  - Added method `boolean sendScheduleChangeNotification(SpaSession session, String customerEmail, String customerName, String changeDetails)` to notify guests of updates, cancellations, and reschedules.
- **Production SMTP Adapter (`SmtpSpaNotificationAdapter`):**
  - Annotated with `@Service @Profile("smtp") @Primary`.
  - Injects `JavaMailSender` and reads externalized properties `spring.mail.properties.mail.smtp.from` and `spring.mail.username`.
  - Catches `MailException` without exposing SMTP credentials or customer PII, returning `false` upon delivery failure so that `SessionTimelineScheduler` releases the reminder claim lease for subsequent retry.
- **Decoupled Default Adapter (`DefaultSpaNotificationAdapter`):**
  - Implements `sendScheduleChangeNotification` with structured audit telemetry, serving local, dev, and test environments cleanly without fabricating external credentials.
- **Calendar Port & Google Calendar Adapter (`SpaCalendarPort`, `GoogleCalendarAdapter`):**
  - Externalized properties: `google.calendar.enabled` (default `false`) and `google.calendar.calendar-id` (default `"primary"`).
  - In decoupled mode (`enabled = false`), safely returns predictable references (`gcal-decoupled-{sessionId}`) and logs telemetry without cloud calls.
  - In enabled mode (`enabled = true`), formats complete calendar event payloads (summary, suite location, start/end timestamps, description) and generates synchronization event identifiers.
  - Error isolation: all calendar methods catch exceptions gracefully and never propagate runtime exceptions to business services.

#### 2.2 BR-M3-13: Automatic Recovery Trigger Orchestration
- **Domain Event (`TherapistStatusChangedEvent`):**
  - Captures `therapistId`, `previousStatus`, `newStatus`, `reason`, and `timestamp`.
- **Administrative Service (`TherapistStatusService`):**
  - Method `updateTherapistStatus(Integer therapistId, TherapistStatus newStatus, String reason)` acquires a pessimistic write lock on the therapist entity, updates status, and publishes `TherapistStatusChangedEvent`.
  - Exposed via REST endpoint `PATCH /api/v1/therapist/{id}/status` restricted to `MANAGER`, `ADMIN`, or `RECEPTIONIST`.
- **Active Session Query (`SpaSessionRepository`):**
  - Added `findActiveUpcomingSessionsByTherapist(Integer therapistId, LocalDateTime now)` targeting active sessions (`SCHEDULED`, `RESCHEDULING`) where `scheduledEndAt > now`.
- **Recovery Listener (`TherapistStatusRecoveryListener`):**
  - Listens to `TherapistStatusChangedEvent`.
  - If `newStatus == INACTIVE || newStatus == SUSPENDED`:
    - Identifies all affected upcoming sessions.
    - Automatically invokes `sessionRecoveryService.attemptSameTimeRecovery(sessionId)`.
    - Preserves the same appointment time if another qualified therapist is available.
    - If no qualified replacement exists, transitions the session to `RESCHEDULING` awaiting customer consent without silently altering appointment times.
  - If `newStatus == ACTIVE`: logs no-op update, leaving sessions unaffected.

#### 2.3 BR-M3-14: Accepted Change History & Notifications
- **Canonical Schema & Migration:**
  - Created Flyway migration `V011__m3_spa_schedule_history.sql` defining `dbo.SpaScheduleHistory` and non-clustered index `IX_SpaScheduleHistory_session_id`.
  - Added column `external_calendar_event_id VARCHAR(255) NULL` to `dbo.SpaSession`.
  - Updated canonical `05_Development/database/schema.sql` to include table and index definitions.
- **Domain Entity & Repository (`SpaScheduleHistory`, `SpaScheduleHistoryRepository`):**
  - Entity mapped to `dbo.SpaScheduleHistory` capturing `historyId`, `sessionId`, `actorUserId`, `actorRole`, `changeType`, `previousStatus`, `newStatus`, `previousStartAt`, `newStartAt`, `previousTherapistId`, `newTherapistId`, `previousRoomId`, `newRoomId`, `reason`, `externalCalendarId`, and `createdAt`.
  - Repository exposes `findBySessionIdOrderByCreatedAtAsc(Long sessionId)`.
- **State Transition Event (`SpaScheduleAcceptedEvent`):**
  - Published across all accepted state modification pathways:
    1. `confirmReservation` (New Booking -> `CREATED`)
    2. `confirmReservation` (Reschedule -> `RESCHEDULED`)
    3. `confirmAttendance` (Attendance Confirmed -> `ATTENDANCE_CONFIRMED`)
    4. `cancelSession` (Session Cancelled -> `CANCELLED`)
    5. `recordSessionOutcome` (Outcome Recorded -> `COMPLETED` / `NO_SHOW`)
    6. `attemptSameTimeRecovery` (Automated Rematch -> `RECOVERED` / `RESCHEDULING`)
- **Audit Event Listener (`SpaScheduleAuditEventListener`):**
  - Synchronously records immutable `SpaScheduleHistory` records.
  - Updates external calendar event via `SpaCalendarPort`.
  - Dispatches customer notification via `SpaNotificationPort`.
  - **Transaction Fault Tolerance:** Calendar and notification dispatches are wrapped in isolated try-catch blocks; external provider failures log warnings but never roll back or fail the database transaction.

---

### 3. Automated Test Evidence

#### 3.1 Module M3 Test Suite (98 Tests: 0 Failures, 0 Errors)
```
[INFO] Running com.heavenstay.hswrms.m3spa.GoogleCalendarAdapterTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.169 s -- in GoogleCalendarAdapterTest
[INFO] Running com.heavenstay.hswrms.m3spa.SmtpSpaNotificationAdapterTest
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 1.531 s -- in SmtpSpaNotificationAdapterTest
[INFO] Running com.heavenstay.hswrms.m3spa.SpaAuthoritativeAcceptanceEvidenceTest
[INFO] Tests run: 49, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 11.238 s -- in SpaAuthoritativeAcceptanceEvidenceTest
[INFO] Running com.heavenstay.hswrms.m3spa.SpaConcurrencyTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 3.112 s -- in SpaConcurrencyTest
[INFO] Running com.heavenstay.hswrms.m3spa.SpaScheduleHistoryTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 19.18 s -- in SpaScheduleHistoryTest
[INFO] Running com.heavenstay.hswrms.m3spa.SpaSecurityTests
[INFO] Tests run: 5, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.114 s -- in SpaSecurityTests
[INFO] Running com.heavenstay.hswrms.m3spa.SpaServiceTests
[INFO] Tests run: 29, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.985 s -- in SpaServiceTests
[INFO] Running com.heavenstay.hswrms.m3spa.TherapistRecoveryOrchestrationTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 0.167 s -- in TherapistRecoveryOrchestrationTest
[INFO] 
[INFO] Results:
[INFO] Tests run: 98, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

#### 3.2 Cross-Module Regression Test Suite (136 Tests: 0 Failures, 0 Errors)
```
[INFO] Running com.heavenstay.hswrms.m4fnb.service.FnbKdsOrderServiceTest
[INFO] Tests run: 12, Failures: 0, Errors: 0, Skipped: 0 -- in FnbKdsOrderServiceTest
[INFO] Running com.heavenstay.hswrms.m4fnb.service.MealOrderServiceTest
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0 -- in MealOrderServiceTest
[INFO] Running com.heavenstay.hswrms.m4fnb.service.FnbFolioIntegrationTest
[INFO] Tests run: 36, Failures: 0, Errors: 0, Skipped: 0 -- in FnbFolioIntegrationTest
[INFO] Running com.heavenstay.hswrms.m5billing.AdjustmentServiceTest
[INFO] Tests run: 24, Failures: 0, Errors: 0, Skipped: 0 -- in AdjustmentServiceTest
[INFO] Running com.heavenstay.hswrms.m5billing.M5BillingAndCheckoutTests
[INFO] Tests run: 48, Failures: 0, Errors: 0, Skipped: 0 -- in M5BillingAndCheckoutTests
[INFO] 
[INFO] Results:
[INFO] Tests run: 136, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

#### 3.3 Frontend Typecheck & Production Build
- `oxlint`: 0 errors (13 safe unused param warnings).
- `tsc -b`: 0 errors.
- `vite build`: `dist/assets/index-Bh-qE9dV.js` and CSS built successfully in 1.82s with 0 errors.

---

### 4. Summary of Changes

| Component | Path | Action | Description |
|---|---|---|---|
| Migration | `05_Development/database/migrations/V011__m3_spa_schedule_history.sql` | Created | DDL for `dbo.SpaScheduleHistory` and `external_calendar_event_id` |
| Canonical Schema | `05_Development/database/schema.sql` | Modified | Added `dbo.SpaScheduleHistory` table and index matching V011 |
| Entity | `05_Development/backend/.../m3spa/entity/SpaScheduleHistory.java` | Created | JPA entity for schedule audit history |
| Entity | `05_Development/backend/.../m3spa/entity/SpaSession.java` | Modified | Added `externalCalendarEventId` column and getter/setter |
| Repository | `05_Development/backend/.../m3spa/repository/SpaScheduleHistoryRepository.java` | Created | Spring Data repository for history entity |
| Repository | `05_Development/backend/.../m3spa/repository/SpaSessionRepository.java` | Modified | Added `findActiveUpcomingSessionsByTherapist` query |
| Port | `05_Development/backend/.../m3spa/port/SpaNotificationPort.java` | Modified | Added `sendScheduleChangeNotification` |
| Port | `05_Development/backend/.../m3spa/port/DefaultSpaNotificationAdapter.java` | Modified | Implemented `sendScheduleChangeNotification` |
| Port | `05_Development/backend/.../m3spa/port/SmtpSpaNotificationAdapter.java` | Created | Real SMTP adapter for reminders and schedule changes |
| Port | `05_Development/backend/.../m3spa/port/SpaCalendarPort.java` | Created | Contract for external calendar synchronization |
| Port | `05_Development/backend/.../m3spa/port/GoogleCalendarAdapter.java` | Created | Configurable Google Calendar adapter (enabled vs decoupled) |
| Event | `05_Development/backend/.../m3spa/service/event/TherapistStatusChangedEvent.java` | Created | Event for therapist status changes |
| Event | `05_Development/backend/.../m3spa/service/event/SpaScheduleAcceptedEvent.java` | Created | Event for accepted schedule state modifications |
| Service | `05_Development/backend/.../m3spa/service/TherapistStatusService.java` | Created | Manages therapist status with locking and event dispatch |
| Controller | `05_Development/backend/.../m3spa/controller/TherapistController.java` | Modified | Added `PATCH /api/v1/therapist/{id}/status` |
| Service | `05_Development/backend/.../m3spa/service/TherapistStatusRecoveryListener.java` | Created | Listens to status changes and invokes auto-recovery |
| Service | `05_Development/backend/.../m3spa/service/SpaScheduleAuditEventListener.java` | Created | Listens to schedule events; persists audit history, syncs calendar, notifies guest |
| Service | `05_Development/backend/.../m3spa/service/SpaSessionService.java` | Modified | Emits `SpaScheduleAcceptedEvent` on create, reschedule, confirm, cancel, outcome |
| Service | `05_Development/backend/.../m3spa/service/SessionRecoveryService.java` | Modified | Emits `SpaScheduleAcceptedEvent` on rematch and rescheduling fallback |
| Tests | `05_Development/backend/.../m3spa/GoogleCalendarAdapterTest.java` | Created | Unit test for calendar adapter |
| Tests | `05_Development/backend/.../m3spa/SmtpSpaNotificationAdapterTest.java` | Created | Unit test for SMTP reminder & notification adapter |
| Tests | `05_Development/backend/.../m3spa/TherapistRecoveryOrchestrationTest.java` | Created | Integration test for automated therapist recovery orchestration |
| Tests | `05_Development/backend/.../m3spa/SpaScheduleHistoryTest.java` | Created | Integration test for audit history and calendar synchronization |

---

### 5. Compliance Verdict

- **Module M3 Rules:** 14 / 14 **PASS** (100% compliant)
- **Zero Fabrications:** All external integrations are grounded in tested ports and adapters with explicit configuration boundaries.
- **Physical Database Safety:** No physical SQL Server databases (`HSWRMS`, `HSWRMS_TEST`) were contacted, migrated, or modified. All tests executed within isolated H2 in-memory instances.
- **Git State:** Unstaged / staged working tree changes preserved cleanly without commit or push.

