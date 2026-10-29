# HSWRMS — Phase 5.8.3.119: Local Startup & Manual Test Readiness Report

**Generated:** 2026-10-29  
**Scope:** One-pass diagnosis, repair, and live validation of HSWRMS Backend and Frontend for local manual testing.  
**Mode:** In-Memory H2 Database (`local,dev` profiles). Zero SQL Server connectivity.

---

## 1. Confirmed Root Causes

### Root Cause 1: Duplicate YAML Keys in `application.yml`
* **Evidence:** Git merge commit `966858632` introduced duplicate mappings for `billing:`, `vnpay:`, and `seed:` under the top-level `app:` block.
* **Impact:** SnakeYAML 2.2 (used by Spring Boot 3.3.4) enforces `allowDuplicateKeys = false`, throwing `org.yaml.snakeyaml.constructor.DuplicateKeyException: found duplicate key billing` during initial configuration loading before any beans or profiles could initialize.
* **Resolution:** Duplicate stub block (lines 60–70) removed in `application.yml`.

### Root Cause 2: Missing `DBO` Schema in In-Memory H2 Database
* **Evidence:** In `%TEMP%\hswrms-startup.log`:
  ```
  org.hibernate.tool.schema.spi.CommandAcceptanceException: Error executing DDL "drop table if exists dbo."AuditLog" cascade" via JDBC [Schema "DBO" not found;]
  ...
  Caused by: org.h2.jdbc.JdbcSQLSyntaxErrorException: Schema "DBO" not found; SQL statement:
  select r1_0.role_id,r1_0.description,r1_0.role_name from dbo.Role r1_0 where upper(r1_0.role_name)=upper(?) [90079-224]
  at com.heavenstay.hswrms.m6admin.service.M6DataInitializer.run(M6DataInitializer.java:59)
  ```
* **Impact:** M1, M2, M3, M4, and M6 JPA entities hardcode `schema = "dbo"` to match Microsoft SQL Server production schemas. However, H2 in-memory databases default to schema `PUBLIC` and do not have schema `dbo` pre-created. All Hibernate table creation DDL in `dbo` failed silently on startup. When `M6DataInitializer` ran its initial `roleRepo.findByRoleNameIgnoreCase()` query, H2 threw a fatal syntax exception because `dbo` did not exist, terminating the Spring Boot process with exit code 1.
* **Resolution:** Updated `application-local.yml` JDBC URL with `INIT=CREATE SCHEMA IF NOT EXISTS dbo\;SET SCHEMA dbo` and added `hibernate.default_schema: dbo`.

---

## 2. Files Changed and Exact Reasons

| File | Change | Reason |
| :--- | :--- | :--- |
| `05_Development/backend/src/main/resources/application.yml` | Removed lines 60–70 (redundant duplicate `billing`, `vnpay`, and `seed` keys). | Resolves SnakeYAML `DuplicateKeyException` during YAML configuration parsing. |
| `05_Development/backend/src/main/resources/application-local.yml` | 1. Added `INIT=CREATE SCHEMA IF NOT EXISTS dbo\;SET SCHEMA dbo` to `spring.datasource.url`.<br>2. Added `default_schema: dbo` under `spring.jpa.properties.hibernate`. | Ensures H2 initializes the `dbo` schema and assigns all entities to `dbo`, matching entity `@Table(..., schema="dbo")` annotations and SQL Server architecture. |

*Note: All existing migration scripts, generated artifacts, and reports were left completely untouched.*

---

## 3. Validation Commands and Actual Outcomes

### 3.1 Backend Health Validation
* **Command:** `Invoke-RestMethod -Uri "http://localhost:8080/api/v1/health" -Method Get`
* **Result (HTTP 200 OK):**
  ```json
  {
    "service": "HSWRMS Modular Monolith Backend",
    "status": "UP",
    "timestamp": "2026-10-29T11:58:00.929389200Z"
  }
  ```

### 3.2 Backend Authentication & Seed Validation
* **Command:** `Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body '{"email":"customer@heavenstay.dev","password":"DevDemo123!"}' -ContentType "application/json"`
* **Result (HTTP 200 OK):**
  ```json
  {
    "success": true,
    "message": "Login successful.",
    "data": {
      "token": "eyJhbGciOiJIUzUxMiJ9..."
    }
  }
  ```

### 3.3 Frontend Server Validation
* **Command:** `Invoke-WebRequest -Uri "http://localhost:5173" -UseBasicParsing`
* **Result (HTTP 200 OK):** Vite development server responded with HTML index and module assets in < 500 ms.

---

## 4. Execution Commands for Manual Testing

### 4.1 Backend (Terminal 1)
* **Working Directory:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules\05_Development\backend`
* **PowerShell Command:**
  ```powershell
  .\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=local,dev"
  ```

### 4.2 Frontend (Terminal 2)
* **Working Directory:** `E:\FU_Learning\5.Spring2025_Semester5\ISP392_Ver2\HSWRMS-audit-all-modules\05_Development\frontend`
* **PowerShell Command:**
  ```powershell
  npm run dev
  ```

---

## 5. Expected Local URLs

| Service | URL | Notes |
| :--- | :--- | :--- |
| **Frontend Application** | `http://localhost:5173` | React / Vite SPA |
| **Backend Health Endpoint** | `http://localhost:8080/api/v1/health` | Public health check |
| **H2 Database Console** | `http://localhost:8080/h2-console` | See limitations below |

---

## 6. Verified Demo Account

* **Role:** Customer
* **Email:** `customer@heavenstay.dev`
* **Password:** `DevDemo123!`
* *(Automatically seeded by `DevAccountBootstrap` under the `dev` profile).*

---

## 7. Known Manual-Test Limitations

1. **Volatile Storage (In-Memory H2):** The database runs with `ddl-auto: create-drop`. Any data created during testing (bookings, folios, reviews) is stored in memory and reset upon restarting the backend.
2. **H2 Web Console Security:** While H2 Console is enabled in `application-local.yml`, `SecurityConfig.java` does not exempt `/h2-console/**` or disable frame options. Unauthenticated access from browsers will be challenged by Spring Security.
3. **Frontend API Integration Scope:** Most frontend screens operate using React context mock data. Only villa inventory synchronization (`OperationsContext.tsx`) actively pulls from `http://localhost:8080/api/v1/villas` (with silent mock fallback if offline).

---

## 8. Remaining Blockers
* **None.** Both backend and frontend boot cleanly and pass health verification.

