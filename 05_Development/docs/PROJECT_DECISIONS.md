# HSWRMS Architecture Decision Records (ADR) & Technical Baseline

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Status:** Approved Baseline (Phase 1)  
**Governance Scope:** `05_Development/`

---

## ADR-01: Architectural Pattern — Modular Monolith
* **Context:** The system coordinates 6 interconnected modules (M1–M6) sharing transaction boundaries, security contexts, and resort stay accounts.
* **Decision:** Implement a **Modular Monolith** using Spring Boot 3 on Java 17 and a single deployable artifact, communicating with a React Single-Page Application (SPA) over REST/JSON.
* **Rationale:** Eliminates unnecessary distributed systems complexity, network serialization latency, and eventual consistency failures in a university software development project while strictly enforcing modular code isolation.
* **Constraint:** No microservices or event brokers without explicit architectural approval.

---

## ADR-02: Technology Stack & Pinned Baseline
* **Frontend:**
  * Framework: React 19 (`19.2.8`) with TypeScript (`~6.0.2`)
  * Build Tool: Vite 8 (`8.3.4`)
  * Router: React Router DOM 7 (`7.18.4`)
  * Styling: Pure Vanilla CSS with CSS Custom Properties implementing `HSWRMS_DESIGN.md`
  * Motion: GSAP (`3.15.0`) & Lenis (`1.3.26`)
  * Icons: Lucide React (`1.48.0`)
  * Charts: Recharts (`3.10.1`)
  * Localization: `i18next` (`26.4.2`) & `react-i18next` (`17.0.15`) supporting 5 languages (`vi`, `en`, `zh-CN`, `ja`, `fr`)
  * HTTP Client: Native typed `fetch` client abstraction (`apiClient.ts`)
* **Backend:**
  * Runtime: Java 17 LTS (`17.0.12`)
  * Framework: Spring Boot 3 (`3.3.4`)
  * Modules: Spring Web MVC, Spring Data JPA (Hibernate 6), Spring Security 6, Jakarta Validation
  * Persistence Driver: Microsoft SQL Server JDBC Driver (`com.microsoft.sqlserver:mssql-jdbc`)
  * Security Token: JJWT (`0.12.6`)
  * Build Tool: Apache Maven (`3.9.9`)
* **Database:**
  * Engine: Microsoft SQL Server
  * Target Database: `HSWRMS`

---

## ADR-03: Relational Persistence Baseline & Hibernate Policy
* **Source Baseline:** `03_Design/Database/HSWRMS_SQLServer_Database.sql` is the frozen design baseline.
* **Development Baseline:** `05_Development/database/schema.sql` is the active development version.
* **Hibernate Strategy:** `spring.jpa.hibernate.ddl-auto=none` (or `validate`). Hibernate must never execute `create`, `update`, or `create-drop` against the production/development SQL Server instance.
* **Naming Reconciliation (M4):** The canonical recipe field is `dbo.MenuItemIngredient.required_quantity`. The entity, API, validation, calculations, and documentation use `required_quantity` consistently. Preserve the existing SQL Server type, precision, and constraints; do not rename the field or add a migration just to change its name.

---

## ADR-04: Security & Authentication Architecture
* **Stateless Sessions:** Sessions are stateless (`SessionCreationPolicy.STATELESS`); no HTTP session cookies.
* **Token Standard:** JWT signed with HMAC-SHA256 (`Keys.hmacShaKeyFor`) carrying subject (email), `userId`, `fullName`, and `roles`.
* **Authorization Enforcement:** Method security (`@EnableMethodSecurity`) enforced on Spring controllers and services. Client-side route guards are UX conveniences only.
* **CORS:** Centralized in `CorsConfig` permitting local Vite development origins (`http://localhost:5173`, `http://localhost:4173`).

---

## ADR-05: Common REST API & Error Conventions
* **Base Path:** `/api/v1`
* **Success Envelope:** `ApiResponse<T>` with timestamp, success flag, message, and typed data payload.
* **Error Envelope:** Standardized `ApiError` with timestamp, HTTP status, error code string, human message, request URI path, and optional `ValidationErrorDetail` items.
* **Exception Handling:** Centralized `@RestControllerAdvice` in `GlobalExceptionHandler`.

---

## ADR-06: Preservation of Official Open Items (OI-01 – OI-09)
The following architectural open items remain officially unresolved and must not be unilaterally hard-coded:
1. **OI-01:** M3/M4 → M5 Folio charge posting ownership and write path (direct insert vs. service/API boundary).
2. **OI-02:** M3 background job retry and exponential backoff policy.
3. **OI-03:** M3 notification channel scope (Email mandatory; in-app/push open).
4. **OI-04:** M2 ↔ M5 PaymentTransaction ownership (Deposit vs. Final Checkout).
5. **OI-05:** Supported payment methods (VNPay confirmed; Cash scope unresolved).
6. **OI-06:** M2 ↔ M4 meal delivery and dining location behavior.
7. **OI-07:** Package-specific menu restrictions.
8. **OI-08:** M3 Start Session / `IN_PROGRESS` persistence prohibition.
9. **OI-09:** M3 confirmation persistence representation (session lifecycle vs. confirmation lifecycle).
