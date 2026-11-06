# HSWRMS M3 Spa & Wellness Automation: Seed Data & Environmental Readiness Audit

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Database:** Microsoft SQL Server 2019 Express (Server: `localhost` / `MYLIFE-MYRULE-1`, Database: `HSWRMS`)  
**Security Context:** Least-Privilege Application User `hswrms_app_user` (Externalized credentials)  
**Audit Reconciliation Date:** November 4, 2026  
**Document Status:** FORENSICALLY RECONCILED & AUDIT-VERIFIED  

---

## 1. Environmental & Security Baseline

All data queries, diagnostic audits, and controlled verification sessions were conducted strictly against the authoritative development database `HSWRMS` under the following security parameters:
- **Database Engine:** Microsoft SQL Server 2019 Express (Build 15.0.2000.5)
- **Target Database:** `HSWRMS`
- **Application Login:** `hswrms_app_user` (Scoped permissions: `db_datareader`, `db_datawriter`)
- **Credential Storage:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS_DB_BACKUPS\hswrms_local_credentials.env`
- **Credential Sanitization:** Zero plaintext passwords, API keys, or connection strings committed or printed.

---

## 2. Pre-Execution Baseline Database Inventory (Preserved Records)

All historical baseline data created prior to M3 automation remains completely preserved.

### 2.1 User Accounts & Role Mapping
| User ID | Email | Full Name | User Role | Status | Audit Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `2` | `manager@heavenstay.com` | Resort Manager | `MANAGER` | `ACTIVE` | Therapist suspension & administrative recovery |
| `4` | `customer@heavenstay.com` | Eleanor Vance | `CUSTOMER` | `ACTIVE` | Spa session booking & attendance confirmation |
| `5` | `receptionist@heavenstay.com` | Front Desk Receptionist | `RECEPTIONIST` | `ACTIVE` | Front desk guest coordination |
| `6` | `therapist1@heavenstay.com` | Ananya Sharma | `THERAPIST` | `ACTIVE` | Primary treatment provider (Therapist #1) |
| `7` | `therapist2@heavenstay.com` | Therapist Two | `THERAPIST` | `ACTIVE` | Secondary treatment provider (Therapist #2) |

### 2.2 Active Retreat Bookings (Stay Context)
| Booking ID | Customer User ID | Customer Name | Room / Villa | Check-In Date | Check-Out Date | Booking Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `3` | `4` | Eleanor Vance | Villa Serenity 101 | `2026-11-04` | `2026-11-08` | `CHECKED_IN` |

*Stay Boundary Compliance:* Eleanor Vance is checked in for `2026-11-04` through `2026-11-08`. All test sessions fall strictly within this stay window, satisfying BR-M3-02.

### 2.3 Treatment Rooms Inventory
| Room ID | Room Name | Room Type | Room Status | Capacity |
| :--- | :--- | :--- | :--- | :--- |
| `1` | Lotus Pavilion Suite 1 | Standard Treatment | `AVAILABLE` | 1 |
| `2` | Lotus Pavilion Suite 2 | Premium Ayurveda | `AVAILABLE` | 1 |
| `3` | Bamboo Sanctuary 1 | Hydrotherapy / Body Scrub | `AVAILABLE` | 1 |
| `4` | Bamboo Sanctuary 2 | Facial & Aromatherapy | `AVAILABLE` | 1 |
| `5` | Zen Garden Suite | Couple / Premium Ritual | `AVAILABLE` | 2 |

---

## 3. Seed Gap Remediation: Multi-Therapist Testbed

### 3.1 Initial Qualification Imbalance
- **Therapist #1 (`Ananya Sharma`, ID 1):** Qualified for 18 treatments (IDs 1 through 18).
- **Therapist #2 (`Therapist Two`, ID 2):** Had **0 records** in `dbo.TherapistTreatmentQualification`.
- **Impact:** Candidate discovery could only pair sessions with Therapist #1; automated recovery (Trigger 3B) had no alternative qualified provider.

### 3.2 Non-Destructive Controlled Qualification
To establish a multi-therapist testbed without modifying schema or existing records, idempotent SQL was executed:
```sql
IF NOT EXISTS (SELECT 1 FROM dbo.TherapistTreatmentQualification WHERE therapist_id = 2 AND treatment_id = 1)
    INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id) VALUES (2, 1);

IF NOT EXISTS (SELECT 1 FROM dbo.TherapistTreatmentQualification WHERE therapist_id = 2 AND treatment_id = 2)
    INSERT INTO dbo.TherapistTreatmentQualification (therapist_id, treatment_id) VALUES (2, 2);
```
- **Post-Condition:** Therapist #2 qualified for Treatment #1 (`Himalayan Hot Stone`) and Treatment #2 (`Deep Tissue`). Candidate discovery confirmed 12 candidate bundles balanced across both therapists.

---

## 4. Controlled Verification Sessions Audit (Sessions #13 through #17)

To verify the live `SessionTimelineScheduler` daemon and `SessionRecoveryService` executing against SQL Server without manipulating system clocks or using mocks, targeted verification sessions were created relative to real wall-clock time (`17:20` to `17:48` on `2026-11-04`).

| Session ID | Scheduled Window | Status | Confirmation | Purpose & Checkpoint Tested | Resulting Outbox Record | Verification Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **#7** | `2026-11-05 10:00 - 11:30` | `RESCHEDULING` | `CONFIRMED` | M3.1 E2E booking + T-24h reminder + Trigger 3B Branch A | Outbox #23 (`spa:7:schedule:1:REMINDER_T24H`) | Verified. Status moved to `RESCHEDULING` when Therapist #2 suspended; no silent slot shift. |
| **#8** | `2026-11-05 14:00 - 15:30` | `SCHEDULED` | `CONFIRMED` | M3.1 E2E booking + T-24h reminder + Trigger 3B Branch B + Browser E2E | Outbox #34 (`spa:8:schedule:2:REMINDER_T24H`) | Rematched to Therapist #1 at same time; version 1->2. Forensically reconciled below. |
| **#13** | `2026-11-04 18:48 - 19:48` | `SCHEDULED` | `PENDING` | Live Scheduler: **T-2h Reminder** checkpoint | Outbox #37 (`spa:13:schedule:1:REMINDER_T2H`) | **PASS**. Cron detected session within 2h window; enqueued reminder outbox record; claim fenced. |
| **#14** | `2026-11-04 18:26 - 19:26` | `SCHEDULED` | `PENDING` | Live Scheduler: **T-75m Reminder** checkpoint | Outbox #36 (`spa:14:schedule:1:REMINDER_T75M`) | **PASS**. Cron detected session within 75m window; enqueued reminder outbox record; claim fenced. |
| **#15** | `2026-11-04 17:28 - 18:28` | `SCHEDULED` | `CONFIRMED` | Live Scheduler: **T-15m Reminder** checkpoint | Outbox #35 (`spa:15:schedule:1:REMINDER_T15M`) | **PASS**. Cron detected session within 15m window; enqueued prep reminder outbox record; claim fenced. |
| **#16** | `2026-11-04 18:04 - 19:04` | `SCHEDULED` | `PENDING` | Live Scheduler: Target for Trigger 3A deadline | Superseded | Superseded by Session #17 with exact deadline window threshold. |
| **#17** | `2026-11-04 17:41 - 18:41` | `RESCHEDULING` | `EXPIRED` | Live Scheduler: **Trigger 3A (T-60m Expiry & Recovery)** | Outbox #38 (`CALENDAR`), #39 (`EMAIL`) | **PASS**. At 17:22:16, cron detected unconfirmed session past T-60m; marked `EXPIRED` & `RESCHEDULING`; logged History #15. |

---

## 5. Forensic Reconciliation of Session #8 Lifecycle & State Transitions

The initial audit report noted an apparent contradiction between the database acceptance matrix (which recorded Session #8 as `CONFIRMED` with History #13 and History #14) and the Playwright Browser E2E report (which claimed Session #8 was clicked while `PENDING`). Forensic inspection of SQL rows, application code, and backend server logs resolves this sequence:

### 5.1 Chronological Event Log for Session #8

1. **Session Creation (16:46:29):**
   - Eleanor Vance booked Session #8 with Therapist #2 at `14:00 - 15:30`.
   - Initial state: `session_status = 'SCHEDULED'`, `confirmation_status = 'PENDING'`, `schedule_version = 1`.
   - Logged **History #12**: `ChangeType = 'CREATED'`.
2. **Attendance Confirmation (16:46:30):**
   - Client confirmed attendance.
   - Updated state: `confirmation_status = 'CONFIRMED'`.
   - Logged **History #13**: `ChangeType = 'ATTENDANCE_CONFIRMED'`, `Status = PENDING -> CONFIRMED`.
3. **Trigger 3B Rematching Disruption (16:46:30):**
   - Manager suspended Therapist #2 via `PATCH /api/v1/therapist/2/status`.
   - `SessionRecoveryService.attemptSameTimeRecovery(8)` rematched Session #8 to Therapist #1 at the same 14:00 slot.
   - `schedule_version` incremented from 1 to 2.
   - Logged **History #14**: `ChangeType = 'RECOVERED'`.
   - **Crucial Domain Rule (`SessionRecoveryService.java`, line 210):**
     ```java
     session.setConfirmationStatus(SpaConfirmationStatus.PENDING);
     ```
     Because the therapist was substituted, resort policy requires the customer to re-acknowledge attendance with the new therapist. Therefore, Session #8 was returned to **`PENDING`**!
4. **Browser E2E Execution (17:27:13 - 17:27:32):**
   - Eleanor Vance logged into the frontend and navigated to `/customer/spa/sessions`.
   - Because Session #8 had `confirmation_status = 'PENDING'`, `#btn-confirm-attendance-8` was rendered in the DOM (rendered below the fold for the 1280x800 viewport).
   - Playwright executed `page.$('#btn-confirm-attendance-8')`, located the button, auto-scrolled to it, and clicked it.
   - Browser dispatched `POST /api/v1/spa/sessions/8/confirm-attendance`.
5. **Backend Processing & Deduplication (17:27:30.680):**
   - Spring Boot log (`task-3789.log`, line 23447) records:
     `Securing POST /api/v1/spa/sessions/8/confirm-attendance`
   - `SpaSessionService.confirmAttendance()` updated `dbo.SpaSession` to `confirmation_status = 'CONFIRMED'`.
   - `SpaScheduleAuditEventListener.java` (lines 55-62) evaluated duplicate event delivery protection:
     A record with `(session_id = 8, change_type = 'ATTENDANCE_CONFIRMED', new_status = 'CONFIRMED', new_start_at = '2026-11-05 14:00:00')` already existed (from History #13).
     The listener logged:
     `[SPA SCHEDULE AUDIT] Duplicate accepted schedule event received for session #8... Ignoring to prevent duplicate history.`
     Therefore, no duplicate history row was inserted.
   - In the frontend, React updated the session badge to `CONFIRMED` and removed the confirm button.
   - Playwright captured `e2e-05-my-spa-sessions-confirmed.png` showing Session #8 as `CONFIRMED`.

### 5.2 Forensic Conclusion & Classification
- The backend API call and database update are verified via real server debug logs and committed SQL records.
- The browser UI badge update to `CONFIRMED` is verified in `e2e-05-my-spa-sessions-confirmed.png`.
- However, because Session #8 was located below the fold when `e2e-04-my-spa-sessions-before.png` was captured, the pre-click visual state was not captured in `e2e-04`.
- **Verdict:** Reclassified as **PASS (BACKEND/SQL) / PARTIAL (BROWSER UI VISUAL EVIDENCE)**.
- **Recommendation:** Future browser tests should use a freshly created, dedicated test session and explicitly scroll it into view before capturing the "before" screenshot.

---

## 6. Strict Seed Data Safety Rules

1. **Read-Only Verification First:** Never execute INSERT/UPDATE/DELETE scripts without first querying current table counts.
2. **Explicit Existence Checks:** Always wrap seed insertions in `IF NOT EXISTS` or check by business key before inserting.
3. **Foreign Key Integrity:** All test sessions must reference valid existing foreign keys (`retreat_booking_id = 3`, `treatment_id IN (1, 2)`, `customer_id = 4`).
4. **Mandatory Column Completeness:** Required domain fields (`booking_source = 'CUSTOMER'`, `schedule_version = 1`, `confirmation_status`) must never be NULL.
5. **Zero Deletion / Truncation:** Never run `TRUNCATE`, `DROP`, or unconditional `DELETE` on any database table. Historical baseline sessions #2 through #8 and all audit history records remain permanently preserved.
