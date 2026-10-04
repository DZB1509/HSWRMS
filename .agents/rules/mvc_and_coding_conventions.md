# MANDATORY CODE GENERATION RULES & ARCHITECTURAL CONSTRAINTS

All code generation, refactoring, and code review within this repository MUST strictly follow the architecture decision and coding conventions documented in:
1. [`03-Design/ADR-001_MVC-Pattern.md`](file:///c:/Users/PC/fal26-isp392-is2005-g1/03-Design/ADR-001_MVC-Pattern.md)
2. [`03-Design/Coding-Convention.md`](file:///c:/Users/PC/fal26-isp392-is2005-g1/03-Design/Coding-Convention.md)

## Core Enforcements

1. **MVC Pattern Separation:**
   - **Model:** DAO / Repository & Entity classes handles MySQL CSDL queries, transaction management, PII encryption/decryption (`GUEST_HEALTH_PROFILE`), and business rules.
   - **Controller:** Servlets / Controllers handle HTTP requests, session authentication (`CURRENT_USER_ID`), RBAC authorization, input validation, and forwarding to View.
   - **View:** JSP templates / HTML pages ONLY render model data. **STRICTLY PROHIBITED:** Direct SQL queries, database connections, or inline business logic inside JSP/View files.

2. **Traceable Code Requirement (Code Truy Vết):**
   - Every source file and business method MUST include a **Traceability Header Block**:
     ```java
     // ============================================================================
     // [TRACEABILITY HEADER - ISO/IEC 25010 STANDARD]
     // ----------------------------------------------------------------------------
     // Requirement ID  : [SR-ID / US-ID / UC-ID]
     // Business Rule   : [BR-ID]
     // Database Entity : [TABLE_NAME]
     // Compliance Scope: Nghị định 356/2025/NĐ-CP
     // MVC Layer       : [MODEL / CONTROLLER / VIEW]
     // ============================================================================
     ```
   - Crucial logic lines must have step-by-step explanatory comments in Vietnamese describing data flow and business alignment for non-coder accessibility.

3. **International Naming Conventions:**
   - **Packages:** `lowercase` without underscores (`com.heavenstay.hswrms.controller`)
   - **Classes & Enums:** `UpperCamelCase` (`GuestHealthProfileDAO`, `HealthProfileController`)
   - **Methods:** `lowerCamelCase` starting with verbs (`getProfileByAccountId()`, `updateConsentStatus()`)
   - **Variables & Parameters:** `lowerCamelCase` (`guestProfile`, `currentAccountId`)
   - **Constants:** `UPPER_SNAKE_CASE` (`MAX_FAILED_LOGIN_ATTEMPTS`)
   - **DB Tables & Columns:** `UPPER_SNAKE_CASE` (`GUEST_HEALTH_PROFILE`, `HealthProfileID`)
   - **View Files & Assets:** `kebab-case.jsp` (`health-profile-view.jsp`)
   - **REST API Routes:** `kebab-case` plural nouns (`/api/v1/guests/health-profiles`)
