# HeavenStay Wellness Resort Management System (HSWRMS)
## Authentication, Account Seeding, OAuth and OTP Audit Report

- **Date:** October 30, 2026
- **Repository:** `HSWRMS-audit-all-modules`
- **Target Branch:** `feature/hswrms-m1-m6-integration`
- **Scope:** Module M1 Identity, Authentication, Role Mapping, Social Sign-In (Google/Facebook), OTP Delivery.

---

### 1. Root Cause Analysis: Reported Authentication Defects

#### 1.1 The Customer Account Paradox
- **Observed Phenomenon:** The development account `customer@heavenstay.dev` authenticated successfully, but the user could not locate it in the inspected SQL Server database `HSWRMS`.
- **Root Cause Identified:**
  1. **Dual Runtime Profiles:** In local development, the backend typically runs with the `dev,local` profile, which connects to an isolated in-memory H2 database (`jdbc:h2:mem:testdb` or `hswrmsdb`), not the SQL Server host instance `localhost:1433`.
  2. **Domain Discrepancy in SQL Seeds:** In `05_Development/database/seed/V1_5__seed_demo_users.sql`, the accounts were originally defined with the `.com` domain (`customer@heavenstay.com`), whereas `DevAccountBootstrap.java` seeded `customer@heavenstay.dev` at application startup.
  3. **Incomplete Seeder Scope:** In `DevAccountBootstrap.java` (lines 71–73), `ACCOUNT_SEEDS` defined *only* `customer@heavenstay.dev`. The other five roles (`receptionist@`, `therapist@`, `fbstaff@`, `manager@`, `admin@`) were never registered in `ACCOUNT_SEEDS`, despite `ROLE_SEEDS` having all six system roles.

#### 1.2 Frontend Fake Auth Bypass
- **Observed Phenomenon:** Some roles appeared to work partially in local frontend sessions without real backend validation.
- **Root Cause Identified:** In `LoginPage.tsx` (lines 118–137), an unhandled error catch block intercepted rejected login requests, inspected whether the email contained `'admin'`, `'manager'`, or `'receptionist'`, and called `loginAs(role)` in React client state. This bypassed the backend entirely, failed to issue a signed JWT token, and left downstream API calls unauthenticated.

#### 1.3 Social SSO & OTP Gmail Blockers
- **Google & Facebook Sign-In Status:** **BLOCKED / ENVIRONMENT_DEPENDENT**
  - Traced to `SsoClientConfig.java` and `SsoAvailabilityFilter.java`.
  - When `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` or `FACEBOOK_CLIENT_ID` / `FACEBOOK_CLIENT_SECRET` environment variables are absent, `SsoClientConfig` correctly initializes clients in an unconfigured state.
  - Clicking Google or Facebook redirects to `/auth/sso/callback?error=SSO_NOT_CONFIGURED` with the controlled notification: *"Google sign-in is not configured yet. Please try email/password login."* This is proper fail-closed behavior, not a code defect.
- **Gmail OTP Registration Delivery:** **BLOCKED / ENVIRONMENT_DEPENDENT**
  - Traced to `DevEmailDeliveryAdapter.java` vs `SmtpEmailDeliveryAdapter.java`.
  - In `dev` profile without the `smtp` profile active, the application binds `DevEmailDeliveryAdapter`, which routes generated 6-digit OTP codes safely to application stdout logs (`[DEV EMAIL] To: ... OTP: 123456`) to prevent spamming and unauthenticated SMTP relay failures.
  - Live Gmail delivery requires activating `--spring.profiles.active=dev,smtp` with valid `MAIL_USERNAME` and `MAIL_PASSWORD` credentials.

---

### 2. Development Account Verification Matrix

Following repair of `DevAccountBootstrap.java`, all six canonical development accounts are guaranteed on `dev` profile startup with shared password `DevDemo123!`:

| Role | Canonical Email | Exists in DB (dev startup) | Auth Status | Granted Authority | Landing Dashboard Route |
|---|---|---|---|---|---|
| Customer | `customer@heavenstay.dev` | Yes (Auto-seeded) | PASS | `ROLE_CUSTOMER` | `/customer/booking` |
| Receptionist | `receptionist@heavenstay.dev` | Yes (Auto-seeded) | PASS | `ROLE_RECEPTIONIST` | `/receptionist/arrivals` |
| Therapist | `therapist@heavenstay.dev` | Yes (Auto-seeded + Therapist row) | PASS | `ROLE_THERAPIST` | `/therapist/dashboard` |
| F&B Staff | `fbstaff@heavenstay.dev` | Yes (Auto-seeded) | PASS | `ROLE_FNB_STAFF` | `/fb/kds` |
| Manager | `manager@heavenstay.dev` | Yes (Auto-seeded) | PASS | `ROLE_MANAGER` | `/manager/governance` |
| Admin | `admin@heavenstay.dev` | Yes (Auto-seeded) | PASS | `ROLE_ADMIN` | `/admin/staff` |

*(Note: In accordance with safety policies, no plaintext production credentials or secrets are logged.)*

---

### 3. Verification & Remediation Summary

1. **Repaired `DevAccountBootstrap.java`:** Added `receptionist@`, `therapist@`, `fbstaff@`, `manager@`, `admin@` to `ACCOUNT_SEEDS`. Added automatic creation of a corresponding `Therapist` entity in `TherapistRepository` for the therapist user.
2. **Repaired `LoginPage.tsx`:** Removed the silent `loginAs(...)` client-side bypass. Converted demo quick-login buttons to pre-fill real credentials, enforcing real HTTP POST authentication against `/api/v1/auth/login`.
3. **Confirmed Security:** All 6 roles successfully authenticate via BCrypt password hashing, receive real HMAC-SHA256 JWT tokens, and navigate to their respective authorized role dashboards.

