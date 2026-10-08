# HSWRMS System Architecture Baseline

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Architecture Style:** Modular Monolith (Spring Boot 3 + React 19 SPA)  
**Governance Scope:** `05_Development/`

---

## 1. System Topology & Core Stack

```
   ┌─────────────────────────────────────────────────────────────┐
   │                   React 19 SPA (Vite)                       │
   │  - Pure Vanilla CSS Design Tokens (Amanoi luxury aesthetic) │
   │  - React Router DOM v7 (Role-Based Layouts & Guards)        │
   │  - Centralized API Client (Fetch + Error Envelope Parser)   │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ HTTP / JSON (/api/v1)
                                  │ JWT Bearer Token (Stateless)
   ┌──────────────────────────────▼──────────────────────────────┐
   │             Spring Boot 3.3.4 Modular Monolith               │
   │  - Java 17 LTS / Maven Wrapper                              │
   │  - Spring Security 6 (Stateless JWT + Method Security)      │
   │  - Spring Web MVC + Jakarta Validation                      │
   │  - Spring Data JPA (Hibernate 6)                            │
   └──────────────────────────────┬──────────────────────────────┘
                                  │ JDBC (mssql-jdbc)
                                  │ ddl-auto = none / validate
   ┌──────────────────────────────▼──────────────────────────────┐
   │                  Microsoft SQL Server                       │
   │  - Physical Database: HSWRMS                                │
   │  - Development Schema Baseline: 05_Development/database/    │
   └─────────────────────────────────────────────────────────────┘
```

---

## 2. Repository & Project Structure

```
05_Development/
├── backend/
│   ├── .mvn/wrapper/          # Maven wrapper configuration & properties
│   ├── mvnw / mvnw.cmd        # Cross-platform Maven wrapper scripts
│   ├── pom.xml                # Pinned Spring Boot 3.3.4 dependencies
│   └── src/
│       ├── main/java/com/heavenstay/hswrms/
│       │   ├── common/        # ApiResponse, ApiError, GlobalExceptionHandler
│       │   ├── config/        # CorsConfig, WebMvcConfig
│       │   ├── security/      # SecurityConfig, JwtTokenProvider, JwtAuthFilter
│       │   ├── m1identity/    # M1 domain controllers, services, repositories
│       │   ├── m2booking/     # M2 domain controllers, services, repositories
│       │   ├── m3spa/         # M3 domain controllers, services, repositories
│       │   ├── m4fnb/         # M4 domain controllers, services, repositories
│       │   ├── m5billing/     # M5 domain controllers, services, repositories
│       │   └── m6admin/       # M6 domain controllers, services, repositories
│       └── test/              # Hermetic unit & MockMvc integration tests
├── frontend/
│   ├── public/                # Runtime static assets (favicon.svg, icons.svg)
│   ├── src/
│   │   ├── api/               # apiClient.ts, healthApi.ts, common types
│   │   ├── app/               # App.tsx, AppRouter.tsx, layout shells
│   │   ├── components/common/ # Reusable UI design system primitives
│   │   ├── features/          # m1-identity through m6-admin feature folders
│   │   ├── styles/            # Vanilla CSS design tokens & layout stylesheets
│   │   └── types/             # Common domain & navigation types
│   └── package.json           # React 19 + Vite 8 pinned build scripts
├── database/
│   └── schema.sql             # SQL Server physical schema baseline
└── docs/                      # Architectural ADRs, ownership, contracts, guides
```

---

## 3. Modular Monolith Boundary Rules

1. **In-Process Domain Boundaries:**
   * Each module (`m1identity` through `m6admin`) manages its own domain entities, services, and REST controllers.
   * Direct cross-module repository injection is strictly prohibited. Cross-module calls must pass through public service contracts or domain events.
2. **Stateless Security:**
   * All API requests authenticate via HTTP Authorization header (`Bearer <JWT>`).
   * Role-based method security (`@PreAuthorize`) is enforced on service/controller layers.
3. **Data Minimization & Sensitive Health Data:**
   * Customer health records are restricted to treatment-relevant staff projections (M3 Therapists, M4 Chefs) and explicitly protected from general Receptionist/Billing views.
4. **Relational Persistence Guardrails:**
   * `spring.jpa.hibernate.ddl-auto` is set to `none`. Hibernate schema generation is disabled.
   * Automated test configurations isolate database connectivity using in-memory H2 test scope.

---

## 4. REST API Standards

* **Base Path:** `/api/v1`
* **Success Envelope:**
  ```json
  {
    "success": true,
    "message": "Operation completed successfully",
    "timestamp": "2026-10-09T00:00:00Z",
    "data": { ... }
  }
  ```
* **Error Envelope:**
  ```json
  {
    "status": 400,
    "error": "BAD_REQUEST",
    "message": "Validation failed",
    "path": "/api/v1/resource",
    "timestamp": "2026-10-09T00:00:00Z",
    "validationErrors": [ ... ]
  }
  ```
