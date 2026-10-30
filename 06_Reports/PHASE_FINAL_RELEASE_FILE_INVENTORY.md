# HSWRMS — FINAL RELEASE FILE INVENTORY & COMMIT GROUPING REPORT

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Repository:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules`  
**Target Branch:** `feature/hswrms-m1-m6-integration`  
**Baseline HEAD Commit:** `77389306de4388a6cf95c6115a3e0936cbc6f9a1`  
**Expected Remote:** `isp-origin` (`https://gitlab.com/manhnc2/fal26-isp392-is2005-g1.git`)  
**Audit Timestamp:** 2026-10-31T03:11:00+07:00  

---

## 1. INVENTORY OVERVIEW

- **Total Modified Tracked Files:** 25
- **Total Staged Files:** 0
- **Total Untracked Source, Migration, & Report Files Approved for Release:** 23
- **Total Untracked Directories Intentionally Excluded & Preserved Locally:** 3
- **Total Planned Logical Commits:** 4

---

## 2. MODIFIED TRACKED FILES INVENTORY (25 files)

### A. Module M5 — Billing, Folio Adjustments & Checkout (13 files)
1. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/controller/AdjustmentController.java`: Endpoints for adjustment requests and refund settlement confirmation.
2. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/AdjustmentResponseDTO.java`: Response DTO with adjustment lifecycle details.
3. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/CreditNoteResponseDTO.java`: Credit note response exposing status and settlement audit metadata.
4. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/FolioItemResponseDTO.java`: Folio item DTO with adjusted amounts and payable balances.
5. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/InvoiceResponseDTO.java`: Record exposing `pendingRefundTotal` and invoice calculations.
6. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/CreditNoteEntity.java`: Entity with settlement audit fields and constraints.
7. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioEntity.java`: Folio aggregate recalculating payable balances.
8. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/entity/FolioItemEntity.java`: Immutable original charge with `adjustedAmount` and `isVoided`.
9. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/repository/CreditNoteRepository.java`: Pessimistic locking and status query methods.
10. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/AdjustmentService.java`: Service interface for adjustments and refund settlement.
11. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/AdjustmentServiceImpl.java`: Full business logic, amount checks, manager authorization, and idempotency.
12. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/service/FolioBillingService.java`: Folio charge calculations and checkout guards.
13. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/AdjustmentServiceTest.java`: 25 test cases verifying void/credit note logic.

### B. Module M3 — Spa & Wellness (7 files)
14. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/controller/TherapistController.java`: Therapist status update endpoint.
15. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaSession.java`: Spa session entity with external calendar event reference.
16. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/DefaultSpaNotificationAdapter.java`: Fallback notification adapter.
17. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/SpaNotificationPort.java`: Notification port interface.
18. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/SpaSessionRepository.java`: Queries for active upcoming sessions with unavailable therapists.
19. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SessionRecoveryService.java`: Automated reassignment and rescheduling logic.
20. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaSessionService.java`: Spa scheduling orchestration.

### C. Frontend Billing Integration (2 files)
21. `05_Development/frontend/src/features/m5-billing/types/index.ts`: TypeScript contracts for credit notes, adjustments, and refunds.
22. `05_Development/frontend/src/pages/customer/FolioInvoicePage.tsx`: Folio invoice viewing and settlement display.

### D. Canonical Database Schema (1 file)
23. `05_Development/database/schema.sql`: Master SQL Server DDL matching all migrations through V013.

### E. Authoritative Project Documentation (2 files)
24. `06_Reports/PHASE_GIT_TEMPORARY_CHECKPOINT_AND_PUSH_REPORT.md`: Prior temporary checkpoint record.
25. `06_Reports/PHASE_M3_AUTHORITATIVE_BR_COMPLIANCE_MATRIX.md`: Complete business rule compliance matrix.

---

## 3. UNTRACKED SOURCE & TEST FILES APPROVED FOR RELEASE (23 files)

### A. Module M5 Billing Additions (3 files)
1. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m5billing/dto/SettleRefundDTO.java`: Request DTO for refund settlement confirmation.
2. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m5billing/RefundSettlementLifecycleTest.java`: 8 test cases verifying refund settlement lifecycle.
3. `05_Development/database/migrations/V013__m5_refund_settlement_and_partial_adjustment.sql`: Additive Flyway migration for settlement fields and adjusted amounts.

### B. Module M3 Spa Additions (13 files)
4. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaDispatchOutboxEntity.java`: Outbox entity for external dispatches.
5. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/entity/SpaScheduleHistory.java`: Audit history entity.
6. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/GoogleCalendarAdapter.java`: Google Calendar port adapter.
7. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/SmtpSpaNotificationAdapter.java`: SMTP notification port adapter.
8. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/port/SpaCalendarPort.java`: Calendar port interface.
9. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/SpaDispatchOutboxRepository.java`: Outbox queue repository.
10. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/repository/SpaScheduleHistoryRepository.java`: Schedule audit history repository.
11. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/scheduler/TherapistRecoveryScheduler.java`: Periodic background sweep for orphaned sessions.
12. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaDispatchOutboxWorker.java`: Scheduled outbox dispatcher worker with exponential backoff.
13. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaScheduleAuditEventListener.java`: Event listener with deduplication and outbox enqueueing.
14. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/TherapistStatusRecoveryListener.java`: Event listener for real-time therapist status changes.
15. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/TherapistStatusService.java`: Service managing therapist availability and event publication.
16. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/event/SpaScheduleAcceptedEvent.java`: Domain event for schedule acceptance.
17. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/event/TherapistStatusChangedEvent.java`: Domain event for therapist status transition.
18. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/GoogleCalendarAdapterTest.java`: 3 tests for calendar sync.
19. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SmtpSpaNotificationAdapterTest.java`: 5 tests for SMTP notifications.
20. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaDispatchOutboxTest.java`: 4 tests for transactional outbox.
21. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaRecoverySchedulerTest.java`: 3 tests for background recovery sweep.
22. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/SpaScheduleHistoryTest.java`: 3 tests for schedule audit history.
23. `05_Development/backend/src/test/java/com/heavenstay/hswrms/m3spa/TherapistRecoveryOrchestrationTest.java`: 3 tests for recovery orchestration.
24. `05_Development/database/migrations/V011__m3_spa_schedule_history.sql`: Additive migration for SpaScheduleHistory table.
25. `05_Development/database/migrations/V012__m3_spa_dispatch_outbox.sql`: Additive migration for SpaDispatchOutbox table.

### C. Technical Deliverable Reports (7 files)
26. `06_Reports/PHASE_M2_FULL_HISTORY_MERGE_INTEGRATION_REPORT.md`: Comprehensive merge report for M2.
27. `06_Reports/PHASE_M2_FULL_HISTORY_MERGE_TRIAL_REPORT.md`: Trial integration execution report.
28. `06_Reports/PHASE_M2_SOURCE_HISTORY_PRESERVATION_AND_INTEGRATION_PLAN.md`: Preservation plan for source history.
29. `06_Reports/PHASE_M3_BR10_BR13_BR14_COMPLETION_AND_REGRESSION_REPORT.md`: Verification report for M3 rules.
30. `06_Reports/PHASE_M3_RELIABILITY_WP1B_REFUND_LIFECYCLE_REPORT.md`: Verification report for M3 reliability and WP-1B refund lifecycle.
31. `06_Reports/PHASE_WP1B_FINANCIAL_INTEGRITY_CORRECTION_AND_VERIFICATION.md`: Verification report for WP-1B financial integrity.
32. `06_Reports/PHASE_WP1B_M3_POST_IMPLEMENTATION_ACCEPTANCE_GATE.md`: Post-implementation acceptance gate report.

---

## 4. INTENTIONALLY EXCLUDED DIRECTORIES (Preserved locally, not committed)

1. `05_Development/database/generated/`:
   - Contains temporary SQL schema extracts from local test databases (`HSWRMS_TEST_schema.sql`, `HSWRMS_TEST_schema_continuation.sql`).
   - Reason for exclusion: Redundant machine-generated diagnostic dumps; master schema is maintained in `schema.sql`.
2. `06_Reports/audit-output/backup_targeted_correction_20261029/`:
   - Contains backup copies of earlier member scoring spreadsheets and CSV logs.
   - Reason for exclusion: Redundant snapshot copies; primary reconciliation reports were committed in earlier phases.
3. `06_Reports/visual-evidence/`:
   - Contains 118 raw PNG screenshots of browser automation runs.
   - Reason for exclusion: Large binary test run artifacts; preserved locally on disk without bloating Git repository history.

---

## 5. PROPOSED LOGICAL COMMIT GROUPS

| Group | Suggested Commit Subject | Scope & Included Components |
| :--- | :--- | :--- |
| **Commit 1** | `fix(m5): enforce folio adjustment and refund settlement integrity` | All M5 billing adjustments, immutable folio items, credit note entities, settlement DTO/controller/service, migration `V013`, frontend types & UI, unit and integration tests. |
| **Commit 2** | `feat(m3): add resilient therapist session recovery` | M3 therapist availability management, reactive event listener, recovery scheduler, session reassignment queries, and recovery orchestration tests. |
| **Commit 3** | `feat(m3): add durable schedule audit and dispatch outbox` | M3 persistent schedule audit history, transactional outbox entity, repository, worker with exponential backoff, calendar & SMTP adapters, migrations `V011` & `V012`, master `schema.sql`, and tests. |
| **Commit 4** | `docs(hswrms): record integration and release verification evidence` | Authoritative technical reports for M2 merge, M3 BR compliance, WP-1B acceptance, outbox reliability, and release file inventory. |
