# HeavenStay Wellness Resort Management System (HSWRMS)
## Post-Merge Comprehensive Repair Changelog

- **Date:** October 30, 2026
- **Repository:** `HSWRMS-audit-all-modules`
- **Target Branch:** `feature/hswrms-m1-m6-integration`
- **Baseline Git Commit:** `07c1d5d`
- **Scope:** Complete itemized inventory of all modified and newly created source, configuration, and documentation files during post-merge audit and repair.

---

### 1. Summary of Changes

| Category | Files Modified | Files Added | Test Regressions |
|---|---|---|---|
| **Backend Core & Security** | 8 | 0 | 0 (536 passing) |
| **Frontend UI & Contexts** | 11 | 0 | 0 (145 passing, clean build) |
| **Audit Reports (`06_Reports/`)** | 1 | 6 | N/A |
| **Total** | **20** | **6** | **0 Regressions** |

---

### 2. Itemized File-by-File Changelog

#### 2.1 Backend Code Modifications

##### 1. `05_Development/backend/src/main/java/com/heavenstay/hswrms/config/DevAccountBootstrap.java`
- **Defect Addressed:** Only `customer@heavenstay.dev` was being seeded during local development startup. Accounts for Receptionist, Therapist, F&B Staff, Manager, and Admin were absent, leading to authentication failures.
- **Changes Implemented:**
  - Expanded `ACCOUNT_SEEDS` to include all 6 canonical system accounts with roles:
    - `customer@heavenstay.dev` (`ROLE_CUSTOMER`)
    - `receptionist@heavenstay.dev` (`ROLE_RECEPTIONIST`)
    - `therapist@heavenstay.dev` (`ROLE_THERAPIST`)
    - `fbstaff@heavenstay.dev` (`ROLE_FNB_STAFF`)
    - `manager@heavenstay.dev` (`ROLE_MANAGER`)
    - `admin@heavenstay.dev` (`ROLE_ADMIN`)
  - Injected `ObjectProvider<TherapistRepository>` to safely create an associated `Therapist` record for `therapist@heavenstay.dev` with active certification and skills.
- **Verification:** Application startup logs verify idempotent account provisioning; all accounts authenticate successfully.

##### 2. `05_Development/backend/src/main/java/com/heavenstay/hswrms/m3spa/service/SpaSessionService.java`
- **Defect Addressed:** Line 215 had a test stub `Long resolvedBookingId = (stayBookingId != null) ? stayBookingId : 101L;` allowing spa appointments to be booked against nonexistent retreats.
- **Changes Implemented:** Removed fallback `101L` and added strict fail-closed validation throwing `BusinessRuleException` if authenticated customer context or valid retreat booking is missing.
- **Verification:** Unit and integration tests pass; orphans can no longer be created.

##### 3. `05_Development/backend/src/main/resources/application.yml`
- **Defect Addressed:** Unset environment variables `SPA_OPEN_TIME`, `SPA_CLOSE_TIME`, and `SPA_ALT_DAYS` caused candidate slot generation to throw `BusinessRuleException` in unconfigured local environments.
- **Changes Implemented:** Added resilient default fallback values:
  ```yaml
  app:
    spa:
      scheduling:
        operating-open: ${SPA_OPEN_TIME:08:00}
        operating-close: ${SPA_CLOSE_TIME:20:00}
        alternative-search-days: ${SPA_ALT_DAYS:3}
  ```
- **Verification:** `SpaServiceTests.testSchedulingFailsSafelyWhenOperatingHoursNotConfigured` continues to pass while runtime application generates candidate slots reliably.

##### 4–8. Module M4 F&B Controllers:
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/controller/FnbDashboardController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/controller/IngredientController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/controller/MealOrderController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/controller/MenuController.java`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m4fnb/controller/RetreatPackageFnbController.java`
- **Defect Addressed:** `CustomUserDetails` normalizes staff authority to `ROLE_FNB_STAFF`, whereas M4 controllers strictly guarded endpoints with `hasAuthority('ROLE_F&B STAFF')`, causing 403 Forbidden for authenticated F&B staff.
- **Changes Implemented:** Updated `@PreAuthorize` across all F&B operational endpoints to `hasAnyAuthority('ROLE_FNB_STAFF', 'ROLE_F&B STAFF')`. Preserved strict exclusion of `ROLE_ADMIN` from kitchen dietary and order modifications per `FnbRoleAccessTest`.
- **Verification:** `FnbRoleAccessTest` passes 100%; live F&B staff can view KDS and manage meal orders.

---

#### 2.2 Frontend Code Modifications

##### 9. `05_Development/frontend/src/pages/auth/LoginPage.tsx`
- **Defect Addressed:** Login catch block intercepted HTTP errors and silently triggered fake client-side logins (`loginAs('admin')`, etc.), masking authentication failures. Quick demo buttons also bypassed real API requests.
- **Changes Implemented:**
  - Removed client-side catch block `loginAs(...)` fallback.
  - Converted demo role buttons into quick-fill credential helpers that populate email and password inputs with `.dev` credentials (`DevDemo123!`), forcing execution of real HTTP POST requests to `/api/v1/auth/login`.
- **Verification:** Submitting invalid credentials shows genuine server error toast; valid credentials authenticate and receive genuine JWT tokens.

##### 10. `05_Development/frontend/src/context/CustomerContext.tsx`
- **Defect Addressed:** Confirming retreat packages created ephemeral in-memory records without persisting them to the database.
- **Changes Implemented:** Connected `createBooking(...)` to `createCustomerBooking(...)` from `retreatBookingApi.ts`, mapping retreat details, guest counts, and dates to `POST /api/v1/customer/bookings`.
- **Verification:** Confirmed retreat bookings persist to database tables `retreat_bookings`, `booking_guests`, and `folios`.

##### 11. `05_Development/frontend/src/context/DiningContext.tsx`
- **Defect Addressed:** Kitchen display system and daily prep lists used hardcoded date `'2026-09-24'`, failing to display current orders.
- **Changes Implemented:** Replaced hardcoded date with dynamic date resolution `new Date().toISOString().split('T')[0]`.
- **Verification:** KDS displays live orders for the current operating day.

##### 12–17. Frontend M3 Spa Dynamic Date Adjustments:
- `05_Development/frontend/src/pages/customer/SpaBookingPage.tsx`
- `05_Development/frontend/src/pages/customer/SpaAlternativeSlotsPage.tsx`
- `05_Development/frontend/src/pages/customer/SpaConfirmationPage.tsx`
- `05_Development/frontend/src/pages/receptionist/ManualExtraSpaPage.tsx`
- `05_Development/frontend/src/pages/therapist/TherapistDashboardPage.tsx`
- `05_Development/frontend/src/pages/therapist/TherapistSchedulePage.tsx`
- **Defect Addressed:** All spa scheduling and therapist schedule pages referenced static dates in September 2026 (`2026-09-24` to `2026-09-27`), preventing testing with current system dates.
- **Changes Implemented:** Replaced hardcoded September 2026 strings with dynamic current date calculations (`new Date().toISOString().split('T')[0]`) across date selectors, query parameters, and schedule navigation.
- **Verification:** Spa candidate slots, therapist calendars, and manual bookings render current dates seamlessly.

##### 18. `05_Development/frontend/src/pages/customer/FolioInvoicePage.tsx`
- **Defect Addressed:** Customer guests were provided with "Proceed to Final Payment" and "Proceed to Resort Checkout" action buttons on their folio invoice page, attempting to invoke staff-restricted endpoints.
- **Changes Implemented:** Added role evaluation (`isStaff`). Customers now see a view-only statement informing them to complete physical room inspection and key return at the front desk. Staff members retain the full settlement toolbar.
- **Verification:** Customers can inspect charges without triggering 403 Forbidden; staff can finalize checkout.

##### 19. `05_Development/frontend/src/pages/receptionist/ReceptionistBookingsPage.tsx`
- **Defect Addressed:** Receptionists had no direct link from the arrivals/guest list to access guest folios and finalize checkout.
- **Changes Implemented:** Added a dedicated "Folio & Check-out" button for all `CHECKED_IN` bookings navigating directly to `/customer/folio/${bookingReference}`.
- **Verification:** Front-desk staff can transition directly into the folio settlement workflow.

---

#### 2.3 Documentation & Audit Reports Added in `06_Reports/`

1. `06_Reports/PHASE_POST_MERGE_COMPREHENSIVE_FUNCTIONAL_AUDIT.md`: End-to-end multi-module audit overview, architecture diagrams, and module findings.
2. `06_Reports/PHASE_AUTHENTICATION_OAUTH_OTP_AUDIT.md`: Complete identity, OAuth 2.0, OTP, BCrypt, and role account verification report.
3. `06_Reports/PHASE_DATABASE_SOURCE_OF_TRUTH_AND_PERSISTENCE_AUDIT.md`: Flyway migration history, schema mapping, seeder analysis, and persistence audit.
4. `06_Reports/PHASE_M3_SPA_SCHEDULING_BUSINESS_RULE_COMPLIANCE.md`: Verification matrix for all 14 business rules (BR-M3-01 to BR-M3-14) with test methods.
5. `06_Reports/PHASE_FOLIO_CHECKOUT_AUTHORIZATION_AUDIT.md`: Front-desk settlement boundaries, RBAC matrix, and customer view-only mode audit.
6. `06_Reports/PHASE_CROSS_MODULE_E2E_REGRESSION_RESULTS.md`: Detailed test metrics (536 backend, 145 frontend, linter, build) and external service reality.
7. `06_Reports/PHASE_POST_MERGE_REPAIR_CHANGELOG.md`: This comprehensive file-by-file record.

