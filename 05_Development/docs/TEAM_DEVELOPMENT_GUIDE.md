# HSWRMS Team Development Guide

**Target Audience:** HSWRMS University Project Team Members & Module Developers  
**Scope:** Working under `05_Development/`

---

## 1. Quick Start & Local Setup

### Prerequisites
- **JDK 17** (must be installed on the developer machine)
- **Node.js**
- **npm**
- **Microsoft SQL Server**

*(Note: A standalone Maven installation is NOT required. The repository includes the standard Maven Wrapper (`.\mvnw.cmd` on Windows, `./mvnw` on macOS/Linux) which provides the pinned Maven runtime automatically. Do not modify system-level PATH or JAVA_HOME automatically.)*

### Running the Backend
1. Open a terminal in `05_Development/backend`:
   * **Windows (Command Prompt / PowerShell):**
     ```powershell
     cd 05_Development/backend
     .\mvnw.cmd spring-boot:run
     ```
   * **macOS / Linux:**
     ```bash
     cd 05_Development/backend
     ./mvnw spring-boot:run
     ```
2. The server starts on `http://localhost:8080`.
3. Verify connectivity:
   ```bash
   curl http://localhost:8080/api/v1/health
   # Returns: {"status":"UP","service":"HSWRMS Modular Monolith Backend",...}
   ```

### Running the Frontend
1. Open a terminal in `05_Development/frontend`:
   ```bash
   cd 05_Development/frontend
   npm install
   npm run dev
   ```
2. The SPA dev server runs on `http://localhost:5173`.
3. Notice the **Dev Backend Status** pill in the bottom-left corner of the browser, which reflects real-time connectivity to `/api/v1/health`.

---

## 2. Git & Branching Conventions

* **Baseline Branch:** `main` (or designated team integration branch).
* **Feature Branches:** Each module developer creates a branch following the naming pattern:
  * `feature/m1-identity`
  * `feature/m2-booking`
  * `feature/m3-spa`
  * `feature/m4-fnb`
  * `feature/m5-billing`
  * `feature/m6-admin`
* **Workflow:**
  1. Always pull latest `main` before starting work: `git pull origin main`.
  2. Implement code strictly inside your assigned module folder.
  3. Run the full verification suite before pushing (see Section 6).

---

## 3. Module Ownership & Code Placement

### Backend Directory Layout
In `05_Development/backend/src/main/java/com/heavenstay/hswrms/`:
```
mXmodule/
├── controller/       # Spring REST controllers (@RestController, @RequestMapping("/api/v1/..."))
├── service/          # Business logic and @Transactional service methods
├── repository/       # Spring Data JPA interfaces (extending JpaRepository<Entity, ID>)
├── entity/           # JPA entities mapped to SQL Server tables
├── dto/
│   ├── request/      # Incoming JSON request payloads (with Jakarta validation)
│   └── response/     # Outgoing projection DTOs
└── mapper/           # Entity <-> DTO converters
```

### Frontend Directory Layout
In `05_Development/frontend/src/`:
```
features/mX-name/
├── api/              # Module HTTP functions calling apiClient.get/post/etc.
├── hooks/            # React Query / custom hooks managing module state
├── types/            # TypeScript interfaces for module requests & DTOs
└── components/       # Module-specific widgets, cards, and modal dialogs

pages/                # Official screens (Screens 1–56) belong here
components/common/    # Reusable shared buttons, cards, dialogs, form fields
```

---

## 4. REST Endpoints, DTOs & Validation

### Creating an Endpoint
1. All endpoints must be namespaced under `/api/v1/<resource>`.
2. Controller methods should return `ResponseEntity<ApiResponse<T>>`:
   ```java
   @RestController
   @RequestMapping("/api/v1/retreats")
   public class RetreatController {
       @GetMapping("/{id}")
       public ResponseEntity<ApiResponse<RetreatPackageDto>> getPackage(@PathVariable Integer id) {
           RetreatPackageDto dto = packageService.findById(id);
           return ResponseEntity.ok(ApiResponse.ok(dto));
       }
   }
   ```
3. Use Jakarta Bean Validation annotations (`@Valid`, `@NotNull`, `@NotBlank`, `@Min`, `@Size`) on request DTOs.
4. Validation failures are automatically caught by `GlobalExceptionHandler` and formatted into standard JSON:
   ```json
   {
     "timestamp": "2026-10-09T00:30:00Z",
     "status": 400,
     "code": "VALIDATION_ERROR",
     "message": "Validation failed for request attributes.",
     "path": "/api/v1/...",
     "errors": [
       { "field": "email", "rejectedValue": "bad", "message": "must be a well-formed email address" }
     ]
   }
   ```

---

## 5. Exception Handling Guidelines

Do NOT catch exceptions and return null or ad-hoc error maps. Throw explicit exceptions:
* `ResourceNotFoundException`: When an ID does not exist (results in HTTP 404).
* `BusinessRuleException`: When a domain constraint is violated (e.g., attempting checkout with unpaid charges; results in HTTP 400).
* `ConflictException`: When an interval or unique constraint clashes (results in HTTP 409).

---

## 6. Pre-Push Quality Verification Checklist

Before pushing any commit to GitHub:
1. **Backend Tests & Packaging:**
   * **Windows:**
     ```powershell
     cd 05_Development/backend
     .\mvnw.cmd test
     .\mvnw.cmd package
     ```
   * **macOS / Linux:**
     ```bash
     cd 05_Development/backend
     ./mvnw test
     ./mvnw package
     ```
   *Must output `BUILD SUCCESS` with 0 test failures.*
2. **Frontend Type-Check & Build:**
   ```bash
   cd 05_Development/frontend
   npx tsc --noEmit
   npm run build
   ```
   *Must output 0 TypeScript errors and successfully bundle.*
3. **Zero Secrets Rule:**
   * Never commit database passwords, JWT secrets, or VNPay credentials.
   * Put local secrets in `application-dev.yml` or environment variables (both are git-ignored).
4. **Git Scope Check:**
   * Ensure no files under `04_Implement/` or root requirement folders were accidentally modified.
   * Check `git status --short`.
