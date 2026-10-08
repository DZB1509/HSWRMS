# 05_Development — HSWRMS Full-Stack Production Workspace

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Phase:** Phase 1 — Team Development Base Foundation Established

Welcome to the active development workspace for HSWRMS. All full-stack production code, backend services, frontend feature integration, and database migrations live strictly inside this directory.

---

## 1. Directory Structure

```
05_Development/
├── backend/                   # Spring Boot 3 Modular Monolith (Java 17, Maven)
│   ├── .mvn/wrapper/          # Maven Wrapper distribution configuration
│   ├── mvnw / mvnw.cmd        # Cross-platform Maven Wrapper executables
│   ├── pom.xml                # Maven project descriptor
│   └── src/                   # com.heavenstay.hswrms (common, config, security, m1–m6)
├── frontend/                  # React 19 + TypeScript + Vite SPA
│   ├── package.json           # Frontend dependencies & build scripts
│   └── src/                   # app, api, features (m1–m6), components, pages, styles, i18n
├── database/                  # Microsoft SQL Server DDL & migrations
│   ├── schema.sql             # Authoritative working development DDL
│   ├── seed/                  # Reference catalogs & test fixtures
│   └── migrations/            # Future incremental DDL patches
├── docs/                      # Architectural & team guidelines
│   ├── ARCHITECTURE.md             # System topology, boundaries, & REST envelopes
│   ├── TEAM_DEVELOPMENT_GUIDE.md   # Step-by-step developer onboarding & rules
│   ├── MODULE_OWNERSHIP.md         # Responsibilities & code boundaries (M1–M6)
│   ├── API_CONTRACT.md             # REST endpoints, envelopes, & namespaces
│   ├── PROJECT_DECISIONS.md        # Architecture Decision Records (ADRs)
│   └── DEVELOPMENT_STATUS.md       # Milestones & component health tracker
├── .gitignore                 # Development environment ignore rules
└── README.md                  # This file
```

---

## 2. Technology Stack

* **Frontend:** React 19, TypeScript, Vite 8, React Router DOM 7, Lucide Icons, Recharts, i18next (5 languages), GSAP, Lenis.
* **Backend:** Java 17, Spring Boot 3.3.4, Spring Web MVC, Spring Data JPA, Spring Security 6 (stateless JWT), Jakarta Validation, Microsoft SQL Server JDBC Driver.
* **Database:** Microsoft SQL Server.

---

## 3. Quick Start

### 1. Database Setup
1. Start your local Microsoft SQL Server instance (default port 1433).
2. Execute `database/schema.sql` to initialize the `HSWRMS` database and tables.
3. See [database/README.md](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/Fall26_ISP392_IS2005_G1/05_Development/database/README.md) for detailed credentials and configuration.

### 2. Backend Execution
* **Windows:**
  ```powershell
  cd 05_Development/backend
  .\mvnw.cmd spring-boot:run
  ```
* **macOS / Linux:**
  ```bash
  cd 05_Development/backend
  ./mvnw spring-boot:run
  ```
* **Base URL:** `http://localhost:8080/api/v1`
* **Health Check:** `http://localhost:8080/api/v1/health`

### 3. Frontend Execution
```bash
cd 05_Development/frontend
npm install
npm run dev
```
* **App URL:** `http://localhost:5173`
* A live backend connectivity indicator is mounted in the bottom-left corner of the UI during development.

---

## 4. Quality Verification Gates

Run these commands before pushing any code to maintain repository stability:

* **Backend Test Suite:**
  * Windows: `cd 05_Development/backend && .\mvnw.cmd test`
  * macOS/Linux: `cd 05_Development/backend && ./mvnw test`
* **Backend Packaging:**
  * Windows: `cd 05_Development/backend && .\mvnw.cmd package`
  * macOS/Linux: `cd 05_Development/backend && ./mvnw package`
* **Frontend Compilation & Bundle:**
  ```bash
  cd 05_Development/frontend && npx tsc --noEmit && npm run build
  ```

---

## 5. Team Governance & Documentation Links

Before contributing code, team members must review the following:
* [Team Development Guide](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/Fall26_ISP392_IS2005_G1/05_Development/docs/TEAM_DEVELOPMENT_GUIDE.md)
* [Module Ownership Matrix](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/Fall26_ISP392_IS2005_G1/05_Development/docs/MODULE_OWNERSHIP.md)
* [API Contract & Error Conventions](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/Fall26_ISP392_IS2005_G1/05_Development/docs/API_CONTRACT.md)
* [Project Decisions (ADRs)](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/Fall26_ISP392_IS2005_G1/05_Development/docs/PROJECT_DECISIONS.md)
* [Development Status](file:///e:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/Fall26_ISP392_IS2005_G1/05_Development/docs/DEVELOPMENT_STATUS.md)
