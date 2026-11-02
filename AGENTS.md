# HSWRMS Project Context

Project: HeavenStay Wellness Resort Management System (HSWRMS)

## Primary Requirement Sources

* @02\_Requirement/SRS/HSWRMS\_ISP392\_G1\_SRS.pdf
* @02\_Requirement/SRS/HSWRMS\_ISP392\_G1\_SRS.docx
* @02\_Requirement/Project\_Specification/HSWRMS\_ISP392\_Project\_Specification.md
* @02\_Requirement/Screen\_Inventory/Screen\_List.md

## UI/UX Source of Truth

* @03\_Design/UI\_UX/HSWRMS\_DESIGN.md

## AI Implementation Prompt Reference

* @03\_Design/Prompts/HSWRMS\_Antigravity\_Prompts.md

## Current Goal

Build a front-end prototype/demo of HSWRMS for presentation purposes.

The current phase focuses on:

* page structure
* navigation
* role-based layouts
* visual design
* screen coverage
* mocked data
* simulated UI states

Production backend functionality is NOT required yet.

## Mandatory Rules

* Use the project name HSWRMS consistently.
* Use the term Customer consistently instead of Guest.
* Follow Screen_List.md for the baseline screen scope.
* Follow HSWRMS_DESIGN.md for UI/UX decisions.
* Do not invent business rules that contradict the SRS.
* Respect role-based access and sensitive-data minimization:
  * Therapist sees only treatment-relevant health notes.
  * F&B Staff/Chef sees only relevant allergy/dietary information.
  * Receptionist must not see unnecessary sensitive health information.
  * Manager is not a full Admin.
* Spa booking is confirmed only when both Therapist and Treatment Room are available.
* Checkout cannot complete while unpaid Spa/F&B charges remain.
* Payment success is not the same as checkout completion.
* Review & Rating is optional and post-checkout.

## Skill-Driven Architecture & Engineering Rules

### 1. Backend Standards (`java-pro`, `api-design-principles`, `api-documentation`)
* **Framework & Runtime:** Java 17+, Spring Boot 3.3.4 (Modular Monolith M1 -> M6).
* **API Endpoints:** RESTful URLs in plural kebab-case (e.g. `/api/v1/bookings`, `/api/v1/spa-appointments`).
* **Response Envelope:** All responses must be wrapped in a consistent generic envelope `ApiResponse<T>` with `code`, `message`, `data`, and `timestamp`.
* **Data Transfer Objects:** Prefer Java `record` for immutable Request/Response DTOs.
* **Service & Persistence:** Service layer manages business transactions via `@Transactional`. Never expose entity models directly to controller responses.
* **Documentation:** All controllers and endpoints must include OpenAPI 3 / Swagger annotations (`@Operation`, `@ApiResponse`, `@Tag`).

### 2. Security & Vulnerability Hardening (`api-security`, `hunt-springboot`)
* **Method-level Security:** Enforce strict RBAC on every endpoint using `@PreAuthorize("hasRole(...)")` or `@PreAuthorize("hasAuthority(...)")`.
* **Actuator Hardening:** Never expose sensitive actuator endpoints (`/actuator/heapdump`, `/actuator/env`, `/actuator/shutdown`) to public traffic.
* **SQL Injection & SpEL Prevention:** Use JPA parameterized queries or Spring Data repository query methods. Never concatenate raw SQL or untrusted input into SpEL expressions.
* **JWT Integrity:** Enforce stateless JWT authentication with token validation and expiration checks on every secured route.

### 3. Frontend Standards (`react-best-practices`, `react-state-management`, `typescript-pro`, `frontend-api-integration-patterns`)
* **Framework:** React 19 + TypeScript + Vite.
* **Type Safety:** Strict TypeScript enabled. Never use `any`; define explicit interfaces or types for all Props, DTOs, and state models.
* **Performance:** Eliminate unnecessary re-renders; derive state during render instead of redundant `useEffect`; use memoization (`useMemo`, `useCallback`) where appropriate.
* **API Client & Auth:** Centralize all API calls in `@/api/client`; automatically attach Bearer JWT tokens via interceptors; provide standardized error boundaries and loading/skeleton states.
* **State Management:** Isolate module state cleanly across features (`m1-identity`, `m2-booking`, `m3-spa`, `m4-fnb`, `m5-billing`, `m6-admin`).

### 4. UI/UX Design System Excellence (`ui-ux-pro-max`)
* **Aesthetic Theme:** Luxury Wellness & Tranquility (Deep Forest Green, Warm Sand, Gold accents, Calming neutrals).
* **Typography:** Modern serif/sans pairings (Outfit, Inter, or Playfair Display).
* **Micro-interactions:** Smooth transitions using GSAP / Lenis; responsive across Mobile, Tablet, and Desktop; avoid abrasive or distracting animations.

## Audit & Change Tracking Rule (`AUDIT_AGENT.md`)
* After every significant prompt execution involving architecture, source code, or configuration changes:
  * The agent must conduct post-audit verification (type check, build check, git status).
  * An entry must be recorded in `AUDIT_LOG.md` following the standard schema defined in `AUDIT_AGENT.md`.

## Implementation Location

* Prototype Presentation Code: `@04_Implement/Frontend_Prototype/`
* Production Development Code: `@05_Development/` (with `backend/` and `frontend/`)
* Do not place application source code in Requirement (`02_Requirement`) or Design (`03_Design`) folders.

