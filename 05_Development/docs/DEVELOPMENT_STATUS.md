# HSWRMS Development Status Tracker

**Current Phase:** Phase 5.8 Integration — M1–M6 Integrated Monolith & M3 Code-Complete  
**Last Updated:** November 1, 2026  

---

## 1. Phase Milestones & Roadmap

| Phase | Milestone Name | Status | Key Deliverables |
|---|---|---|---|
| **Phase 0** | Discovery & Audit | **COMPLETED & APPROVED** | Repository map, 56-screen matrix, contradiction analysis, migration blueprint. |
| **Phase 0.1** | Audit Correction Pass | **COMPLETED & APPROVED** | Reconciled M4 recipe terminology, restored official Open Items OI-01 – OI-09, corrected M3 confirmation states. |
| **Phase 1** | Team Development Base Foundation | **COMPLETED** | Target workspace `05_Development/` created, React frontend baseline migrated with API client, Spring Boot 3 modular monolith scaffolded, SQL Server development schema, security foundation, documentation. |
| **Phase 2** | M1: Identity, Auth & Sensitive Health | **IMPLEMENTED** | User registration, email OTP, JWT authentication, CustomerProfile, HealthProfile with explicit consent, data minimization projections, deletion request. |
| **Phase 3** | M2: Retreat Booking & Receptionist | **IMPLEMENTED** | Packages catalog, Villa categories, Physical villas, booking & deposit boundary, Receptionist check-in & ResidenceRecord, Walk-in on S15, V018 villa pricing columns. |
| **Phase 4** | M3: Spa & Therapy Scheduling Engine | **API E2E ACCEPTED (30/30 on H2) / SQL SERVER PENDING** | All 6 official screens (#25–#33) integrated with live APIs; indivisible bundles (Time + Qualified Therapist + Compatible Room); pessimistic locking; dual lifecycle (`session_status`/`confirmation_status`); T-60m deadline scheduler; same-time recovery; customer consent for time change; attendance decline workflow; transactional outbox with OI-02 exponential backoff retry. Verified across 30 end-to-end API workflows (13 Customer, 8 Therapist, 6 Receptionist, 3 Manager). SQL Server runtime verification pending live DB execution. |
| **Phase 5** | M4: Dietary F&B Management | **IMPLEMENTED** | MenuItem ↔ Ingredient recipes, batch stock tracking, usable inventory calculation, personalized menus, KDS preparation states, inventory deduction strictly on `PREPARING`. |
| **Phase 6** | M5: Folio, Payment, Checkout & Analytics | **IMPLEMENTED** | Folio & FolioItem billing aggregation, Invoice finalization, VNPay idempotent payment return/webhook, guarded checkout validation, Customer review, Manager revenue/occupancy dashboards. |
| **Phase 7** | M6: Admin, Governance & Permissions | **IMPLEMENTED** | Staff management, master data, business parameters, dynamic permission matrix (`@perm.has`), limited admin delegation, immutable audit log. |
| **Phase 8** | External Integrations & Background Processing | **IMPLEMENTED / PARTIAL** | VNPay sandbox integration, Outbox SMTP email adapter with retry policy. Google Calendar and Push channels fail closed/suppressed per OI-03. |
| **Phase 9** | Cross-Module Integration | **IMPLEMENTED** | 56/56 verified screens routed in `AppRouter`, modular monolith boundary ports, end-to-end REST client integration across all roles. |
| **Phase 10** | Final QA & Release Freeze | **IN PROGRESS** | Full backend test suite passing: 770 tests run (760 passed, 0 failures, 0 errors, 10 skipped live DB smoke tests); frontend production build passing (2,725 modules, 0 errors); 141 frontend tests passed. |

---

## 2. Component Health in Phase 5.8 (M3 Complete & Project-Wide Hardening)

* **Frontend Status:** UI Implementation & Integration Complete. `npx tsc -b` and `npm run build` pass cleanly (0 errors, 2,725 modules transformed). All 56 official screens active, guarded, and connected to REST APIs.
* **Backend Status:** Complete Modular Monolith. `.\mvnw.cmd test` passes with 760 passed, 0 failures, 0 errors, 10 skipped (770 total tests, 100% pass rate). M3 focused test inventory passes 167/167 tests.
* **Security Model:** Authoritative backend enforcement via Spring Security (`@PreAuthorize`, `@perm.has`) and session ownership verification. Public endpoints strictly restricted to catalog and auth endpoints. Unauthenticated requests return 401; wrong role returns 403; cross-user tampering returns 400/403.
* **Database Readiness:** Microsoft SQL Server baseline `05_Development/database/schema.sql` (1,428 lines, 50+ tables) and Flyway migrations V001–V019 aligned. Clean separation between schema migrations and seed scripts. H2 validated for CI; live SQL Server migration execution remains pending authorized deployment.
* **Zero Contamination:** No modifications to `01_Planning/`, `02_Requirement/`, `03_Design/`, or legacy `04_Implement/Frontend_Prototype/`.
* **Open Items Integrity:** OI-01 through OI-09 preserved without unilateral policy fabrication. Decoupled port boundaries used for cross-module interactions (`BillingPort`, `HealthProjectionPort`, `CustomerStayPort`).
* **Concurrency Validation:** Pessimistic locking logic validated on H2 in-memory engine across booking, spa scheduling, recovery, and checkout settlement.
* **API E2E Acceptance:** 30/30 workflows passed on live HTTP backend (13 Customer, 8 Therapist, 6 Receptionist, 3 Manager). Documented in `06_Reports/M3_API_E2E_ACCEPTANCE.md` and `06_Reports/audit-output/m3_api_e2e_results.json`. SQL Server acceptance remains pending authorized live database deployment.
