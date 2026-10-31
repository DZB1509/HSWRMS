# HSWRMS M1 — Defense Study Guide

**Branch:** `feature/hswrms-m1-m6-integration`  
**Final integration HEAD used for this guide:** `efb9b5f` (after M1 finalization commits)  
**Scope:** M1 Authentication, Account Settings, Sensitive Health Profile, Consent, Health-Data Deletion Request  
**Purpose:** Train the developer to open the real codebase and trace every M1 request from browser URL/button through frontend, backend, and database.

---

## 1. 30-second M1 overview

M1 owns identity and sensitive customer data. It provides registration with email OTP verification, login with JWT and role authorities, Google/Facebook SSO linking, customer profile storage, health/dietary profile storage, consent history, and health-data deletion requests. M1 does not execute deletion/anonymization, does not own retreat booking/spa/dining backends, and does not implement M2/M3/M4 business logic. M1 data is consumed by M2-M4 through authenticated M1 APIs and projections.

---

## 2. 2-minute technical architecture explanation

Frontend is a React SPA built with Vite/TypeScript. Routing is declared in `05_Development/frontend/src/app/router/index.tsx`. M1 pages call typed API modules such as `05_Development/frontend/src/api/auth/authApi.ts` and `05_Development/frontend/src/api/customer/customerProfileApi.ts`. The shared API client attaches the JWT bearer token.

Backend is a Spring Boot modular monolith. M1 controllers are under `com.heavenstay.hswrms.m1identity.controller`. Requests enter Spring's `DispatcherServlet`, handler mappings select the controller method by HTTP method and path, Spring Security filters authenticate/authorize, then the controller delegates to a service. Services use Spring Data JPA repositories and entities mapped to SQL Server tables in `05_Development/database/schema.sql`.

Database is SQL Server. Hibernate uses `ddl-auto: none` in production/dev baseline; schema is managed by `schema.sql` and reviewed migrations. M1 tables include `User`, `AuthIdentity`, `Role`, `UserRole`, `CustomerProfile`, `ConsentRecord`, `HealthProfile`, `FoodAllergy`, `DietaryRequirement`, `HealthProfileTherapyPreference`, `HealthDataDeletionRequest`, and `EmailOtp`.

---

## 3. Frontend URL routing map (actual React Router)

Route file: `05_Development/frontend/src/app/router/index.tsx`.

| Browser URL/path | Route configuration | React page/component | Guard | Purpose |
|---|---|---|---|---|
| `/login` | `<Route path="login" .../>` | `pages/auth/LoginPage.tsx` | Public | Email/password login |
| `/register` | `<Route path="register" .../>` | `pages/auth/RegisterPage.tsx` | Public | Customer registration |
| `/verify-email` | `<Route path="verify-email" .../>` | `pages/auth/EmailOtpVerificationPage.tsx` | Public | OTP verification |
| `/forgot-password` | `<Route path="forgot-password" .../>` | `pages/auth/PasswordResetPage.tsx` | Public | Password reset |
| `/auth/callback` | `<Route path="auth/callback" .../>` | `pages/auth/SsoCallbackPage.tsx` | Public | OAuth callback/ticket handling |
| `/customer/dashboard` | nested route | `pages/customer/CustomerDashboardPage.tsx` | Authenticated customer | Customer dashboard |
| `/customer/account` | nested route | `pages/customer/AccountSettingsPage.tsx` | Authenticated customer | Customer profile settings |
| `/customer/health-profile` | nested route | `pages/customer/HealthProfilePage.tsx` | Authenticated customer | Health/dietary profile |
| `/customer/health-profile/deletion` | nested route | `pages/customer/HealthDataDeletionPage.tsx` | Authenticated customer | Deletion request lifecycle |

React Router selects the route by matching the browser path against the route tree; nested routes render inside the layout's `<Outlet />`. Frontend guards improve UX but are not security; backend `@PreAuthorize` remains authoritative.
## 4. Backend URL mapping map (Spring MVC)

Base API path: `/api/v1`. Controllers are ordinary `@RestController` classes; Spring does not create one servlet per URL. `DispatcherServlet` receives all requests, handler mappings resolve controller methods, then Spring Security filters run.

| HTTP method + API path | Controller class/method | Security requirement | Request DTO | Service method | Response DTO |
|---|---|---|---|---|---|
| POST `/api/v1/auth/register` | `AuthController.registerGuest` | Public | `RegisterRequest` | `AuthService.registerGuest` | `RegisterResponse` |
| POST `/api/v1/auth/verify-email` | `AuthController.verifyEmail` | Public | `VerifyEmailRequest` | `AuthService.verifyEmail` | `VerifyEmailResponse` |
| POST `/api/v1/auth/login` | `AuthController.login` | Public | `LoginRequest` | `AuthService.login` | `LoginResponse` |
| POST `/api/v1/auth/forgot-password` | `AuthController.forgotPassword` | Public | `ForgotPasswordRequest` | `AuthService.requestPasswordReset` | void envelope |
| POST `/api/v1/auth/reset-password` | `AuthController.resetPassword` | Public | `ResetPasswordRequest` | `AuthService.resetPassword` | void envelope |
| GET `/api/v1/auth/me` | `AuthController.me` | Authenticated | none | `UserRepository`, `PermissionService` | `MeView` |
| GET `/api/v1/customers/me/profile` | `CustomerProfileController.getMyProfile` | Authenticated | none | `CustomerProfileService.getMyProfile` | `CustomerProfileResponse` |
| PUT `/api/v1/customers/me/profile` | `CustomerProfileController.updateMyProfile` | Authenticated | `UpdateCustomerProfileRequest` | `CustomerProfileService.updateMyProfile` | `CustomerProfileResponse` |
| GET `/api/v1/customers/me/health-profile` | `HealthProfileController.getMyHealthProfile` | Authenticated | none | `HealthProfileService.getMyHealthProfile` | `HealthProfileResponse` |
| PUT `/api/v1/customers/me/health-profile` | `HealthProfileController.updateMyHealthProfile` | Authenticated + consent | `UpdateHealthProfileRequest` | `HealthProfileService.updateMyHealthProfile` | `HealthProfileResponse` |
| GET `/api/v1/customers/me/consents` | `ConsentController.listMyConsents` | Authenticated | none | `ConsentService.listMyConsents` | `ConsentRecordResponse[]` |
| POST `/api/v1/customers/me/consents` | `ConsentController.grantConsent` | Authenticated | `GrantConsentRequest` | `ConsentService.grantConsent` | `ConsentRecordResponse` |
| POST `/api/v1/customers/me/consents/{consentType}/revoke` | `ConsentController.revokeConsent` | Authenticated | path variable | `ConsentService.revokeConsent` | `ConsentRecordResponse` |
| POST `/api/v1/customers/me/deletion-requests` | `HealthDataDeletionRequestController.createDeletionRequest` | Authenticated | `CreateDeletionRequestRequest` | `HealthDataDeletionRequestService.createDeletionRequest` | `DeletionRequestResponse` |
| GET `/api/v1/customers/me/deletion-requests` | `HealthDataDeletionRequestController.listDeletionRequests` | Authenticated | none | `HealthDataDeletionRequestService.listDeletionRequests` | `DeletionRequestResponse[]` |
| POST `/api/v1/customers/me/deletion-requests/{id}/cancel` | `HealthDataDeletionRequestController.cancelDeletionRequest` | Authenticated | path variable | `HealthDataDeletionRequestService.cancelDeletionRequest` | `DeletionRequestResponse` |

## 5. UI action-to-database traceability matrix

| User action/button | JSX event binding | Handler method | API function | HTTP method/path | Backend controller method | Service method | Repository/entity/table |
|---|---|---|---|---|---|---|---|
| Register account | RegisterPage submit | page submit handler | `registerRequest` | POST `/api/v1/auth/register` | `AuthController.registerGuest` | `AuthService.registerGuest` | `User`, `UserRole`, `CustomerProfile`, `ConsentRecord`, `EmailOtp` |
| Verify email OTP | EmailOtpVerificationPage submit | page submit handler | `verifyEmailRequest` | POST `/api/v1/auth/verify-email` | `AuthController.verifyEmail` | `AuthService.verifyEmail` | `EmailOtp`, `User` |
| Login | LoginPage submit | page submit handler | `loginRequest` | POST `/api/v1/auth/login` | `AuthController.login` | `AuthService.login` | `User`, `UserRole`, `Role` |
| Forgot password request | PasswordResetPage step 1 submit | `handleSendCode` | `forgotPasswordRequest` | POST `/api/v1/auth/forgot-password` | `AuthController.forgotPassword` | `AuthService.requestPasswordReset` | `User`, `EmailOtp` |
| Reset password | PasswordResetPage step 2 submit | `handleSavePassword` | `resetPasswordRequest` | POST `/api/v1/auth/reset-password` | `AuthController.resetPassword` | `AuthService.resetPassword` | `EmailOtp`, `User` |
| Continue with Google | LoginPage button | browser redirect | `ssoAuthorizeUrl('google')` | GET `/api/v1/auth/sso/google` | Spring Security OAuth2 | `SsoOAuth2SuccessHandler`, `SsoService` | `User`, `AuthIdentity`, `SsoTicket` |
| Facebook SSO/link confirmation | SsoCallbackPage / link form | ticket exchange | `ssoLinkTicket` | POST `/api/v1/auth/sso/tickets/link` | SSO controller/service | `AuthService` OTP binding | `AuthIdentity`, `EmailOtp` |
| Update customer profile | AccountSettingsPage submit | `handleSaveProfile` | `updateMyProfile` | PUT `/api/v1/customers/me/profile` | `CustomerProfileController.updateMyProfile` | `CustomerProfileService.updateMyProfile` | `CustomerProfile` |
| Load health profile | HealthProfilePage mount | `useEffect` | `getMyHealthProfile` | GET `/api/v1/customers/me/health-profile` | `HealthProfileController.getMyHealthProfile` | `HealthProfileService.getMyHealthProfile` | `HealthProfile`, `FoodAllergy`, `DietaryRequirement`, `HealthProfileTherapyPreference` |
| Save health profile | HealthProfilePage submit | `handleSave` | `updateMyHealthProfile` | PUT `/api/v1/customers/me/health-profile` | `HealthProfileController.updateMyHealthProfile` | `HealthProfileService.updateMyHealthProfile` | health tables + `ConsentRecord` check |
| Grant consent | HealthProfilePage save path | checkbox + save | `grantConsent` | POST `/api/v1/customers/me/consents` | `ConsentController.grantConsent` | `ConsentService.grantConsent` | `ConsentRecord` |
| Revoke consent | consent UI | revoke action | API call | POST `/api/v1/customers/me/consents/{type}/revoke` | `ConsentController.revokeConsent` | `ConsentService.revokeConsent` | `ConsentRecord` |
| Create deletion request | HealthDataDeletionPage submit | `handleSubmit` | context `submitDeletionRequest` | POST `/api/v1/customers/me/deletion-requests` | `HealthDataDeletionRequestController.createDeletionRequest` | `HealthDataDeletionRequestService.createDeletionRequest` | `HealthDataDeletionRequest`, `CustomerProfile` |
| Cancel deletion request | HealthDataDeletionPage button | `handleCancel` | context `cancelDeletionRequest` | POST `/api/v1/customers/me/deletion-requests/{id}/cancel` | `HealthDataDeletionRequestController.cancelDeletionRequest` | `HealthDataDeletionRequestService.cancelDeletionRequest` | `HealthDataDeletionRequest` |

The deletion `reason` field is not part of the approved backend contract and was removed from the UI.

## 4. Backend URL mapping map (Spring MVC)

Base API path: `/api/v1`. Controllers are ordinary `@RestController` classes; Spring does not create one servlet per URL. `DispatcherServlet` receives all requests, handler mappings resolve controller methods, then Spring Security filters run.

| HTTP method + API path | Controller class/method | Security requirement | Request DTO | Service method | Response DTO |
|---|---|---|---|---|---|
| POST `/api/v1/auth/register` | `AuthController.registerGuest` | Public | `RegisterRequest` | `AuthService.registerGuest` | `RegisterResponse` |
| POST `/api/v1/auth/verify-email` | `AuthController.verifyEmail` | Public | `VerifyEmailRequest` | `AuthService.verifyEmail` | `VerifyEmailResponse` |
| POST `/api/v1/auth/login` | `AuthController.login` | Public | `LoginRequest` | `AuthService.login` | `LoginResponse` |
| POST `/api/v1/auth/forgot-password` | `AuthController.forgotPassword` | Public | `ForgotPasswordRequest` | `AuthService.requestPasswordReset` | void envelope |
| POST `/api/v1/auth/reset-password` | `AuthController.resetPassword` | Public | `ResetPasswordRequest` | `AuthService.resetPassword` | void envelope |
| GET `/api/v1/auth/me` | `AuthController.me` | Authenticated | none | `UserRepository`, `PermissionService` | `MeView` |
| GET `/api/v1/customers/me/profile` | `CustomerProfileController.getMyProfile` | Authenticated | none | `CustomerProfileService.getMyProfile` | `CustomerProfileResponse` |
| PUT `/api/v1/customers/me/profile` | `CustomerProfileController.updateMyProfile` | Authenticated | `UpdateCustomerProfileRequest` | `CustomerProfileService.updateMyProfile` | `CustomerProfileResponse` |
| GET `/api/v1/customers/me/health-profile` | `HealthProfileController.getMyHealthProfile` | Authenticated | none | `HealthProfileService.getMyHealthProfile` | `HealthProfileResponse` |
| PUT `/api/v1/customers/me/health-profile` | `HealthProfileController.updateMyHealthProfile` | Authenticated + consent | `UpdateHealthProfileRequest` | `HealthProfileService.updateMyHealthProfile` | `HealthProfileResponse` |
| GET `/api/v1/customers/me/consents` | `ConsentController.listMyConsents` | Authenticated | none | `ConsentService.listMyConsents` | `ConsentRecordResponse[]` |
| POST `/api/v1/customers/me/consents` | `ConsentController.grantConsent` | Authenticated | `GrantConsentRequest` | `ConsentService.grantConsent` | `ConsentRecordResponse` |
| POST `/api/v1/customers/me/consents/{consentType}/revoke` | `ConsentController.revokeConsent` | Authenticated | path variable | `ConsentService.revokeConsent` | `ConsentRecordResponse` |
| POST `/api/v1/customers/me/deletion-requests` | `HealthDataDeletionRequestController.createDeletionRequest` | Authenticated | `CreateDeletionRequestRequest` | `HealthDataDeletionRequestService.createDeletionRequest` | `DeletionRequestResponse` |
| GET `/api/v1/customers/me/deletion-requests` | `HealthDataDeletionRequestController.listDeletionRequests` | Authenticated | none | `HealthDataDeletionRequestService.listDeletionRequests` | `DeletionRequestResponse[]` |
| POST `/api/v1/customers/me/deletion-requests/{id}/cancel` | `HealthDataDeletionRequestController.cancelDeletionRequest` | Authenticated | path variable | `HealthDataDeletionRequestService.cancelDeletionRequest` | `DeletionRequestResponse` |

## 6. M1 database table catalog

| Table | Purpose | PK | Important FK | Important columns/constraints | JPA Entity | Services/APIs using it |
|---|---|---|---|---|---|---|
| `User` | Account identity/login | `user_id` | none | `email` unique, `account_status` check, lockout fields | `User` | AuthService, AuthController |
| `AuthIdentity` | SSO provider subject mapping | `auth_identity_id` | `user_id` | unique `(provider, provider_subject)` | `AuthIdentity` | SsoService, AuthService |
| `Role` | Role catalog | `role_id` | none | `role_name` | `Role` | AuthService, PermissionService |
| `UserRole` | User-role junction | `(user_id, role_id)` | both | `assigned_at` | `UserRole` | AuthService |
| `CustomerProfile` | Customer account/profile data | `customer_profile_id` | `user_id` unique | profile/contact/notification fields | `CustomerProfile` | CustomerProfileService |
| `ConsentRecord` | Consent history | `consent_id` | `user_id` | `consent_type`, `granted`, `granted_at`, `revoked_at`, `policy_version` | `ConsentRecord` | ConsentService, HealthProfileService |
| `HealthProfile` | Sensitive health/dietary data | `health_profile_id` | `customer_profile_id` unique | stress level check, anonymization status | `HealthProfile` | HealthProfileService |
| `FoodAllergy` | Allergy child rows | `food_allergy_id` | `health_profile_id` cascade | `allergen_name` | `FoodAllergy` | HealthProfileService |
| `DietaryRequirement` | Dietary child rows | `dietary_requirement_id` | `health_profile_id` cascade | `requirement_name` | `DietaryRequirement` | HealthProfileService |
| `HealthProfileTherapyPreference` | Therapy preference child rows | `therapy_preference_id` | `health_profile_id` | `preference_label` | `HealthProfileTherapyPreference` | HealthProfileService |
| `HealthDataDeletionRequest` | Deletion request lifecycle | `deletion_request_id` | `customer_profile_id`, `health_profile_id`, `requested_by_user_id` | status check, request type check | `HealthDataDeletionRequest` | HealthDataDeletionRequestService |
| `EmailOtp` | OTP storage | `otp_id` | `user_id` | `purpose` check, `consumed`, `attempt_count`, `expires_at` | `EmailOtp` | AuthService |

`User`, `CustomerProfile`, and `HealthProfile` are separate because identity/authentication, account/profile settings, and sensitive health data have different owners, lifecycles, and privacy rules. `User` authenticates; `CustomerProfile` stores contact/preference data; `HealthProfile` stores medical/dietary data and is gated by `HEALTH_DATA_PROCESSING` consent.

The installed local database may still be stale for `HealthDataDeletionRequest`. The reviewed migration `_reviewed_m1_deletion_request_customer_profile.sql` remains DRAFT ONLY and must not be executed without approval. `schema.sql` is the clean-install baseline.

## 5. UI action-to-database traceability matrix

| User action/button | JSX event binding | Handler method | API function | HTTP method/path | Backend controller method | Service method | Repository/entity/table |
|---|---|---|---|---|---|---|---|
| Register account | RegisterPage submit | page submit handler | `registerRequest` | POST `/api/v1/auth/register` | `AuthController.registerGuest` | `AuthService.registerGuest` | `User`, `UserRole`, `CustomerProfile`, `ConsentRecord`, `EmailOtp` |
| Verify email OTP | EmailOtpVerificationPage submit | page submit handler | `verifyEmailRequest` | POST `/api/v1/auth/verify-email` | `AuthController.verifyEmail` | `AuthService.verifyEmail` | `EmailOtp`, `User` |
| Login | LoginPage submit | page submit handler | `loginRequest` | POST `/api/v1/auth/login` | `AuthController.login` | `AuthService.login` | `User`, `UserRole`, `Role` |
| Forgot password request | PasswordResetPage step 1 submit | `handleSendCode` | `forgotPasswordRequest` | POST `/api/v1/auth/forgot-password` | `AuthController.forgotPassword` | `AuthService.requestPasswordReset` | `User`, `EmailOtp` |
| Reset password | PasswordResetPage step 2 submit | `handleSavePassword` | `resetPasswordRequest` | POST `/api/v1/auth/reset-password` | `AuthController.resetPassword` | `AuthService.resetPassword` | `EmailOtp`, `User` |
| Continue with Google | LoginPage button | browser redirect | `ssoAuthorizeUrl('google')` | GET `/api/v1/auth/sso/google` | Spring Security OAuth2 | `SsoOAuth2SuccessHandler`, `SsoService` | `User`, `AuthIdentity`, `SsoTicket` |
| Facebook SSO/link confirmation | SsoCallbackPage / link form | ticket exchange | `ssoLinkTicket` | POST `/api/v1/auth/sso/tickets/link` | SSO controller/service | `AuthService` OTP binding | `AuthIdentity`, `EmailOtp` |
| Update customer profile | AccountSettingsPage submit | `handleSaveProfile` | `updateMyProfile` | PUT `/api/v1/customers/me/profile` | `CustomerProfileController.updateMyProfile` | `CustomerProfileService.updateMyProfile` | `CustomerProfile` |
| Load health profile | HealthProfilePage mount | `useEffect` | `getMyHealthProfile` | GET `/api/v1/customers/me/health-profile` | `HealthProfileController.getMyHealthProfile` | `HealthProfileService.getMyHealthProfile` | `HealthProfile`, `FoodAllergy`, `DietaryRequirement`, `HealthProfileTherapyPreference` |
| Save health profile | HealthProfilePage submit | `handleSave` | `updateMyHealthProfile` | PUT `/api/v1/customers/me/health-profile` | `HealthProfileController.updateMyHealthProfile` | `HealthProfileService.updateMyHealthProfile` | health tables + `ConsentRecord` check |
| Grant consent | HealthProfilePage save path | checkbox + save | `grantConsent` | POST `/api/v1/customers/me/consents` | `ConsentController.grantConsent` | `ConsentService.grantConsent` | `ConsentRecord` |
| Revoke consent | consent UI | revoke action | API call | POST `/api/v1/customers/me/consents/{type}/revoke` | `ConsentController.revokeConsent` | `ConsentService.revokeConsent` | `ConsentRecord` |
| Create deletion request | HealthDataDeletionPage submit | `handleSubmit` | context `submitDeletionRequest` | POST `/api/v1/customers/me/deletion-requests` | `HealthDataDeletionRequestController.createDeletionRequest` | `HealthDataDeletionRequestService.createDeletionRequest` | `HealthDataDeletionRequest`, `CustomerProfile` |
| Cancel deletion request | HealthDataDeletionPage button | `handleCancel` | context `cancelDeletionRequest` | POST `/api/v1/customers/me/deletion-requests/{id}/cancel` | `HealthDataDeletionRequestController.cancelDeletionRequest` | `HealthDataDeletionRequestService.cancelDeletionRequest` | `HealthDataDeletionRequest` |

The deletion `reason` field is not part of the approved backend contract and was removed from the UI.

## 6. M1 database table catalog

| Table | Purpose | PK | Important FK | Important columns/constraints | JPA Entity | Services/APIs using it |
|---|---|---|---|---|---|---|
| `User` | Account identity/login | `user_id` | none | `email` unique, `account_status` check, lockout fields | `User` | AuthService, AuthController |
| `AuthIdentity` | SSO provider subject mapping | `auth_identity_id` | `user_id` | unique `(provider, provider_subject)` | `AuthIdentity` | SsoService, AuthService |
| `Role` | Role catalog | `role_id` | none | `role_name` | `Role` | AuthService, PermissionService |
| `UserRole` | User-role junction | `(user_id, role_id)` | both | `assigned_at` | `UserRole` | AuthService |
| `CustomerProfile` | Customer account/profile data | `customer_profile_id` | `user_id` unique | profile/contact/notification fields | `CustomerProfile` | CustomerProfileService |
| `ConsentRecord` | Consent history | `consent_id` | `user_id` | `consent_type`, `granted`, `granted_at`, `revoked_at`, `policy_version` | `ConsentRecord` | ConsentService, HealthProfileService |
| `HealthProfile` | Sensitive health/dietary data | `health_profile_id` | `customer_profile_id` unique | stress level check, anonymization status | `HealthProfile` | HealthProfileService |
| `FoodAllergy` | Allergy child rows | `food_allergy_id` | `health_profile_id` cascade | `allergen_name` | `FoodAllergy` | HealthProfileService |
| `DietaryRequirement` | Dietary child rows | `dietary_requirement_id` | `health_profile_id` cascade | `requirement_name` | `DietaryRequirement` | HealthProfileService |
| `HealthProfileTherapyPreference` | Therapy preference child rows | `therapy_preference_id` | `health_profile_id` | `preference_label` | `HealthProfileTherapyPreference` | HealthProfileService |
| `HealthDataDeletionRequest` | Deletion request lifecycle | `deletion_request_id` | `customer_profile_id`, `health_profile_id`, `requested_by_user_id` | status check, request type check | `HealthDataDeletionRequest` | HealthDataDeletionRequestService |
| `EmailOtp` | OTP storage | `otp_id` | `user_id` | `purpose` check, `consumed`, `attempt_count`, `expires_at` | `EmailOtp` | AuthService |

`User`, `CustomerProfile`, and `HealthProfile` are separate to enforce least privilege and different lifecycles: authentication identity, account/profile settings, and sensitive medical/dietary data.

The installed local database may still be stale for `HealthDataDeletionRequest`. The reviewed migration `_reviewed_m1_deletion_request_customer_profile.sql` remains DRAFT ONLY and must not be executed without approval. `schema.sql` is the clean-install baseline.

## 7. Sequence diagrams (textual)

### Register -> OTP issuance -> email verification -> account activation
1. Browser submits `POST /api/v1/auth/register`.
2. `AuthController.registerGuest` -> `AuthService.registerGuest`.
3. Service normalizes email, checks uniqueness, creates `User(PENDING)`, assigns `Customer` role, creates `CustomerProfile`, persists `TO_SERVICE` consent.
4. Service invalidates previous unconsumed `EMAIL_VERIFICATION` OTPs, creates a new `EmailOtp`, sends OTP through `EmailDeliveryAdapter`.
5. Browser submits `POST /api/v1/auth/verify-email` with OTP.
6. Service locks latest unconsumed OTP, checks expiry/attempts/hash, marks it consumed, sets `User.emailVerified=true` and account status `ACTIVE`.

### Login -> JWT -> protected request
1. Browser submits credentials.
2. `AuthService.login` validates password, lockout state, email verification, account status.
3. Service returns JWT containing user ID, email, full name, roles.
4. Browser sends `Authorization: Bearer <token>` to protected endpoint.
5. Spring Security validates token and authorities; controller uses principal user ID for ownership.

### Google OAuth2 callback -> local identity resolution
1. Browser redirected to `/api/v1/auth/sso/google`.
2. Spring Security OAuth2 client handles provider login.
3. `SsoOAuth2SuccessHandler` resolves or creates local user/ticket.
4. For verified Google email, `AuthService.registerWithSso` creates ACTIVE user and binds `AuthIdentity`.
5. Backend returns/redirects with SSO ticket or JWT according to flow.

### Health profile read/write -> server-side consent check
1. `GET /api/v1/customers/me/health-profile` returns stored profile regardless of consent.
2. `PUT` requires active `HEALTH_DATA_PROCESSING` consent; service checks `ConsentRecord` before any write.
3. Service replaces scalar fields and child collections transactionally.
4. Frontend re-reads authoritative server state after save.

### Consent grant/revoke
1. Grant inserts a new `ConsentRecord` or returns existing active one.
2. Revoke closes the active record (`revoked_at`, `granted=false`).
3. History rows are not deleted or overwritten.

### Deletion request create/list/cancel
1. Create checks for open `PENDING`/`DEFERRED` request and returns 409 if one exists.
2. List returns open requests newest first.
3. Cancel allows `PENDING`/`DEFERRED`, is idempotent for `CANCELLED`, rejects `COMPLETED`.
4. Actual execution/anonymization is out of M1 scope.

### Password reset
1. `POST /forgot-password` generates and emails a `PASSWORD_RESET` OTP if the account can use password login.
2. `POST /reset-password` verifies OTP and updates `User.passwordHash`.
3. OTP is single-use and attempt-limited.

## 8. Important source files

| File | Defines | Responsibility | Called by | Calls next | State/data owned | DB/API connection |
|---|---|---|---|---|---|---|
| `frontend/src/app/router/index.tsx` | route table | URL-to-page selection | browser | page components | route state | SPA routes |
| `frontend/src/context/CustomerContext.tsx` | `CustomerProvider` | customer profile, wellness, deletion context | app tree | customer APIs | profile/wellness/deletion state | M1 APIs |
| `frontend/src/api/auth/authApi.ts` | API functions | typed auth calls | pages | apiClient | request/response types | `/api/v1/auth/**` |
| `frontend/src/api/customer/customerProfileApi.ts` | API functions | customer profile calls | AccountSettingsPage | apiClient | profile DTOs | `/api/v1/customers/me/profile` |
| `frontend/src/api/health/healthProfileApi.ts` | API functions | health profile calls | HealthProfilePage | apiClient | health DTOs | `/api/v1/customers/me/health-profile` |
| `backend/.../controller/AuthController.java` | `AuthController` | auth endpoints, `/me` | DispatcherServlet | AuthService, repositories | none | auth APIs |
| `backend/.../service/AuthService.java` | `AuthService` | registration, OTP, login, SSO registration, password reset | controllers | repositories, JWT, email | transactional auth state | User, EmailOtp, etc. |
| `backend/.../repository/EmailOtpRepository.java` | repository | OTP queries/locks/invalidation | AuthService | JPA/SQL Server | OTP rows | `EmailOtp` |
| `backend/.../controller/CustomerProfileController.java` | controller | customer profile endpoints | DispatcherServlet | CustomerProfileService | none | profile API |
| `backend/.../controller/HealthProfileController.java` | controller | health profile endpoints | DispatcherServlet | HealthProfileService | none | health API |
| `backend/.../controller/ConsentController.java` | controller | consent endpoints | DispatcherServlet | ConsentService | none | consent API |
| `backend/.../controller/HealthDataDeletionRequestController.java` | controller | deletion endpoints | DispatcherServlet | HealthDataDeletionRequestService | none | deletion API |
| `backend/.../service/HealthProfileService.java` | service | health profile persistence and consent gate | controller | repositories, AuditLogService | transactional health data | health tables |
| `backend/.../service/ConsentService.java` | service | consent history | controller | ConsentRecordRepository | consent state | `ConsentRecord` |
| `backend/.../service/HealthDataDeletionRequestService.java` | service | deletion lifecycle | controller | deletion repository | request state | `HealthDataDeletionRequest` |
| `backend/.../service/CustomerProfileService.java` | service | customer profile persistence | controller | CustomerProfileRepository | profile state | `CustomerProfile` |

## 9. M1 database relationship explanation

- `User` 1..0..* `AuthIdentity`: one account can have multiple SSO identities.
- `User` 1..0..* `UserRole` and `Role` 1..0..* `UserRole`: RBAC junction.
- `User` 1..0..1 `CustomerProfile`: customer account profile.
- `CustomerProfile` 1..0..1 `HealthProfile`: sensitive data is separate and optional.
- `HealthProfile` 1..0..* `FoodAllergy`, `DietaryRequirement`, `HealthProfileTherapyPreference`.
- `CustomerProfile` 1..0..* `ConsentRecord`, `HealthDataDeletionRequest`.

`User`, `CustomerProfile`, and `HealthProfile` are separate to enforce least privilege and different lifecycles: authentication identity, account/profile settings, and sensitive medical/dietary data.

---

## 10. Glossary

- **Customer**: authenticated customer role/domain term.
- **OTP**: one-time password, stored as a hash in `EmailOtp`.
- **JWT**: JSON Web Token issued by `JwtTokenProvider`.
- **ConsentRecord**: append-only consent history.
- **HealthProfile**: sensitive health/dietary profile.
- **Deletion request**: request record only; execution is out of M1 scope.
- **CurrentActor**: M6 security context helper representing authenticated user.
- **Projection**: frontend-filtered subset of health data for therapist/kitchen; not a backend security boundary.
- **DispatcherServlet**: Spring's front controller receiving all web requests.

---

## 11. Items deliberately not changed / blockers

- Deletion migration remains DRAFT ONLY; installed local database may be stale.
- Customer profile writes are API-backed through `AccountSettingsPage`.
- Password reset is implemented through OTP endpoints.
- OTP invalidation is implemented, but true concurrent issuance safety still depends on transaction/database locking; sequential tests do not prove concurrency.
- Spa/dining/retreat catalogs remain cross-module/mock concerns outside M1.
- `isComplete` business definition remains unresolved.
- Deletion `reason` is not stored because the approved DTO does not accept it.
- Facebook Live remains blocked by external Meta release conditions; Meta Tester mode was used.
- M2 active-retreat check for deferred deletion is not implemented.

---

## 12. Realistic lecturer questions (30)

1. Which URL renders the login page? `/login` -> `LoginPage.tsx` via `app/router/index.tsx`.
2. Why is `/login` not a backend servlet? The frontend is an SPA; Spring handles `/api/v1/**`, not page routes.
3. Which function handles login button click? `LoginPage` submit handler calls `loginRequest`.
4. What happens after login success? JWT is stored and user is routed by role.
5. Which controller method issues JWT? `AuthService.login`.
6. Where is password verified? `passwordEncoder.matches` in `AuthService.login`.
7. Which table stores users? `User`.
8. Why is email normalized to lowercase? To enforce case-insensitive uniqueness.
9. How does registration create OTP? `AuthService.registerGuest` generates, hashes, stores `EmailOtp`, sends raw OTP.
10. Why store OTP hash? To avoid leaking raw OTP if DB is exposed.
11. How is old OTP invalidated? `EmailOtpRepository.invalidatePreviousOtps`.
12. Does invalidation prove concurrency safety? No; it is a bulk update and does not add a constraint.
13. What locks OTP verification? `findLatestUnconsumedOtpForUpdate` uses `PESSIMISTIC_WRITE`.
14. Which endpoint requires consent? PUT health profile.
15. Where is consent checked? `HealthProfileService` before write.
16. Can frontend checkbox bypass consent? No, backend checks `ConsentRecord`.
17. What is consent history model? Grant inserts, revoke closes, re-grant inserts.
18. Why are consent records append-only? To preserve audit history.
19. Which endpoint creates deletion request? POST deletion-requests.
20. What status values exist? `PENDING`, `DEFERRED`, `COMPLETED`, `CANCELLED`.
21. Can a completed deletion request be cancelled? No, returns 409.
22. Is deletion executed by M1? No.
23. Which table stores deletion requests? `HealthDataDeletionRequest`.
24. Why is `customer_profile_id` used instead of `health_profile_id`? Approved design links deletion to customer profile.
25. Why is the migration draft only? It changes shared schema and requires approval.
26. How does customer profile update work? `AccountSettingsPage` calls `updateMyProfile`, backend persists `CustomerProfile`.
27. Which identity is used for ownership? JWT principal user ID.
28. Can user A read user B's profile? No, service resolves profile from JWT user ID.
29. What is `CurrentActor`? M6 helper exposing authenticated actor.
30. What evidence proves backend behavior? JUnit tests and full `mvnw test` (704 tests passed).

---

## 13. Exercises (15)

1. Locate the route for `/customer/health-profile` and name the page component.
2. Find the API function called by AccountSettingsPage to save profile.
3. Trace `handleSaveProfile` to controller and service method.
4. Find where `HEALTH_DATA_PROCESSING` consent is checked before health profile write.
5. Locate `invalidatePreviousOtps` and its repository query.
6. Find the pessimistic lock method on `EmailOtpRepository`.
7. Identify which table stores OTP attempt count.
8. Find the DTO that accepts deletion request creation.
9. Locate cancel deletion request ownership check.
10. Find where JWT roles are mapped to authorities.
11. Locate Google SSO success handler.
12. Find the frontend API function for password reset completion.
13. Identify which method updates `User.passwordHash`.
14. Find where `CustomerProfile` is created during registration.
15. Locate the schema definition for `HealthDataDeletionRequest`.

---

## 14. Two-week learning plan

Week 1:
- Day 1-2: React Router, pages, contexts, API modules.
- Day 3-4: Spring MVC request mapping, security filters, controllers.
- Day 5: AuthService registration/login/OTP.
- Day 6: CustomerProfile and HealthProfile persistence.
- Day 7: Consent and deletion request lifecycle.

Week 2:
- Day 8-9: SSO ticket flow.
- Day 10: Database tables/relationships and schema safety.
- Day 11: Tests: read AuthServiceTest, EmailOtpRepositoryContractTest, controller tests.
- Day 12: Run backend tests and frontend build; inspect failures.
- Day 13: Trace one full request manually with breakpoints/logs.
- Day 14: Defense rehearsal using section 12 questions.

---

## 15. Final readiness statement

M1 is implementation-heavy and runtime/test-verified for core auth, OTP, profile, health, consent, and deletion request lifecycle. Remaining blockers are schema approval for deletion migration, concurrency proof for OTP issuance, unresolved completeness definition, and cross-module dependencies. Do not describe M1 as fully complete without these caveats.

