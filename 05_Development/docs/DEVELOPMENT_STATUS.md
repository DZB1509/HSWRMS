# HSWRMS Development Status Tracker

**Current Phase:** Phase 1 Complete — Team Development Base Foundation Established  
**Last Updated:** October 2026

---

## 1. Phase Milestones & Roadmap

| Phase | Milestone Name | Status | Key Deliverables |
|---|---|---|---|
| **Phase 0** | Discovery & Audit | **COMPLETED & APPROVED** | Repository map, 56-screen matrix, contradiction analysis, migration blueprint. |
| **Phase 0.1** | Audit Correction Pass | **COMPLETED & APPROVED** | Reconciled M4 recipe terminology, restored official Open Items OI-01 – OI-09, corrected M3 confirmation states. |
| **Phase 1** | Team Development Base Foundation | **COMPLETED** | Target workspace `05_Development/` created, React frontend baseline migrated with API client, Spring Boot 3 modular monolith scaffolded, SQL Server development schema, security foundation, documentation. |
| **Phase 2** | M1: Identity, Auth & Sensitive Health | *QUEUED* | User registration, email OTP, JWT authentication, CustomerProfile, HealthProfile with explicit consent, data minimization projections, deletion request. |
| **Phase 3** | M2: Retreat Booking & Receptionist | *QUEUED* | Packages catalog, Villa categories, Physical villas, booking & deposit boundary, Receptionist check-in & ResidenceRecord, Walk-in on S15. |
| **Phase 4** | M3: Spa & Therapy Scheduling Engine | **PARTIAL** | UI implementation complete (Screens 25–33); core scheduling engine implemented (indivisible bundles: Time + Qualified Therapist + Compatible Room; pessimistic locking; dual lifecycle `session_status`/`confirmation_status`; T-60m deadline scheduler; same-time recovery; customer consent for time change). Production upstream integration is **PARTIAL** (M1 auth/customer profile, M2 retreat stay, M5 folio posting, real SMTP email delivery are fail-closed replaceable port boundaries). Concurrency validated on H2; SQL Server runtime verification remains pending. |
| **Phase 5** | M4: Dietary F&B Management | *QUEUED* | MenuItem ↔ Ingredient recipes, batch stock tracking, usable inventory calculation, personalized menus, F&B Dashboard hierarchy (Demand + Shortage alerts + Menu availability). |
| **Phase 6** | M5: Folio, Payment, Checkout & Analytics | *QUEUED* | Folio & FolioItem billing aggregation, Invoice finalization, Payment idempotency, guarded checkout validation, Customer review, Manager dashboards. |
| **Phase 7** | M6: Admin, Governance & Permissions | *QUEUED* | Staff management, master data, business parameters, feature flags, dynamic permission matrix, limited admin delegation, immutable audit log. |
| **Phase 8** | External Integrations & Background Processing | *QUEUED* | Dedicated adapters for VNPay, Email/Notifications, and Social SSO. |
| **Phase 9** | Cross-Module Integration | *QUEUED* | Removal of obsolete mock contexts, end-to-end REST/database wiring across all roles. |
| **Phase 10** | Final QA & Release Freeze | *QUEUED* | 56/56 verified screens, automated test suite, 5-language visual verification, SQL Server integrity checks. |

---

## 2. Component Health in Phase 4.1 (M3 Hardening & Correction)

* **Frontend Status:** UI Implementation Complete. `npx tsc -b` and `npm run build` pass cleanly (0 errors, 2,682 modules transformed). Official screens 25–33 active and connected to M3 REST APIs.
* **Backend Status:** Core Engine Complete, Upstream Integration PARTIAL. `.\mvnw.cmd test` (38 tests passed, 0 failures, 0 errors, 100% success rate, including concurrent multi-threaded race conditions, security role tests, same-time recovery, customer consent enforcement, configurable search horizon, treatment_code/room_type persistence, and booking/date-range queries) and `.\mvnw.cmd package` (executable jar packaged successfully).
* **Security Model:** Enforced via Spring Security and method/session ownership. Protected endpoints require authenticated `CUSTOMER` / `RECEPTIONIST` or `THERAPIST`. Unauthenticated requests yield 401; wrong role yields 403; cross-user session tampering yields 400/403. Public access is strictly restricted to catalog endpoints (`GET /api/v1/spa/treatments/**`).
* **Database Readiness:** Development migrations `V001__m3_spa_scheduling.sql` and `V002__m3_reconcile_treatment_code_and_room_type.sql` are strictly idempotent (`IF NOT EXISTS` column and filtered index additions). Clean-install `05_Development/database/schema.sql` aligned with `treatment_code` (with filtered unique index) and `room_type`. Demo seed data separated into `05_Development/database/seed/m3_spa_seed.sql`.
* **Zero Contamination:** No files in `04_Implement/` or requirement/design folders outside `05_Development/` were touched.
* **Open Items Integrity:** OI-01, OI-02, OI-03, OI-08, OI-09 preserved without unilateral assumptions. Upstream M1/M2/M5 concepts bound via clean replaceable fail-closed port adapters (`CustomerStayPort`, `TherapistHealthProjectionPort`, `BillingPort`). Test fakes exist strictly under test scope.
* **Concurrency Validation:** Pessimistic locking logic validated on H2 in-memory engine; production SQL Server runtime verification remains pending local SQL Server instance setup.
