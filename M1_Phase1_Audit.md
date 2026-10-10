# PHASE 1 — M1 AUDIT REPORT
> **Branch:** `feature/m1-mvc-baseline` | **Status:** Read-only audit — zero repository modifications made.

---

## 1. Repository Findings

### 1.1 Drawio File Location
> [!IMPORTANT]
> The task prompt references `02_Requirement/M1_*.drawio`, but actual files are in **`03_Design/`**. `02_Requirement/` has only a README. All four drawio files exist and were read directly.

### 1.2 Active Branch and Existing Code
- Active branch: `feature/m1-mvc-baseline`
- **No backend code exists anywhere.** `04_Implement/` and `05_Development/` are empty READMEs.
- No Java, Maven, or Spring Boot artefacts are present.

### 1.3 Technology Baseline (`tech.txt`)
| Layer | Technologies |
|---|---|
| Backend | Java, Spring Boot, Spring MVC, Spring Security, Spring Data JPA/Hibernate, SQL Server, Maven |
| Frontend | React, TypeScript, Vite |
| Architecture | Separate SPA + API. No Thymeleaf. No SSR. HTTP/JSON. |

### 1.4 Web Demo
Path: `..\fall26_isp392_is2005_g1-main` — **accessible and inspected.**

> [!NOTE]
> The Web Demo is a **fully static mock.** No HTTP calls, no JWT, no session. `loginAs(role)` is a local React state toggle. All data is hardcoded mockData. Authentication is entirely simulated. These are UI prototypes, not backend contracts.

---

## 2. M1 Diagram Findings

### 2.1 ERD (`03_Design/M1_ERD.drawio`)
**Title:** "Module 1 — Detailed ERD (User 1 - 0..1 CustomerProfile)"

| Entity | PK | Key Attributes |
|---|---|---|
| **User** | `user_id` | `email`, `phone_number`, `password_hash`, `account_status`, `email_verified`, `created_at`, `updated_at` |
| **AuthIdentity** | `auth_identity_id` | `FK user_id`, `provider`, `provider_subject` |
| **Role** | `role_id` | `role_name`, `description` |
| **UserRole** | `PK/FK user_id + role_id` | `assigned_at` |
| **CustomerProfile** | `customer_profile_id` | `FK user_id`, `full_name`, `date_of_birth`, `preferred_language`, `residential_address`, `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relationship`, `booking_update_notifications`, `pre_checkin_notifications`, `therapy_reminder_notifications`, `created_at`, `updated_at` |
| **HealthProfile** | `health_profile_id` | `FK customer_profile_id`, `current_health_condition`, `surgery_injury_history`, `mobility_joint_notes`, `supplement_notes`, `stress_fatigue_level`, `preferred_therapy_method`, `food_intolerance_notes`, `disliked_ingredients`, `kitchen_special_notes`, `created_at`, `updated_at` |
| **FoodAllergy** | `food_allergy_id` | `FK health_profile_id`, `allergy_name`, `notes`, `created_at` |
| **DietaryRequirement** | `dietary_requirement_id` | `FK health_profile_id`, `requirement_name`, `notes`, `created_at` |
| **TreatmentHealthNote** | `treatment_health_note_id` | `FK health_profile_id`, `note_content`, `created_at` |
| **ConsentRecord** | `consent_id` | `FK customer_profile_id`, `consent_type`, `granted`, `granted_at`, `revoked_at`, `policy_version` |
| **HealthDataDeletionRequest** | `deletion_request_id` | `FK customer_profile_id`, `request_type`, `status`, `requested_at`, `processed_at` |

**Cardinalities (read from ERD edge styles):**
- User 1 to 0..* AuthIdentity
- User 1 to 0..* UserRole; Role 1 to 0..* UserRole
- User 1 to 0..1 CustomerProfile (diagram title explicitly confirms)
- CustomerProfile 1 to 0..1 HealthProfile
- HealthProfile 1 to 0..* FoodAllergy, DietaryRequirement, TreatmentHealthNote
- CustomerProfile 1 to 0..* ConsentRecord, HealthDataDeletionRequest

### 2.2 Use Case Diagram (`03_Design/M1_UseCase.drawio`)
**Boundary:** "M1 - Authentication, Account & Health Profile"

**Actors:** Guest, Registered User (generalized parent), Customer, Receptionist, Spa Therapist/Yoga Instructor, F&B Staff/Chef, Manager, Admin, Email Service (external), Google Identity Provider (external), Facebook Identity Provider (external).

| ID | Use Case | Primary Actors |
|---|---|---|
| UC01 | Register Account | Guest |
| UC02 | Verify Email | Guest + Email Service |
| UC03 | Forgot / Reset Password | Registered User + Email Service |
| UC04 | Login (Email / Password) | Guest + Registered User |
| UC05 | Login with Google | Guest + Google IdP |
| UC06 | Login with Facebook | Guest + Facebook IdP |
| UC07 | Manage Account Settings | Customer |
| UC08 | Manage Health & Dietary Profile | Customer |
| UC09 | Manage Consent | Customer |
| UC10 | Request Health Data Deletion | Customer |

> [!NOTE]
> No Admin or Manager UC exists inside the M1 boundary. They appear only via Registered User generalization (UC03, UC04). **No "Admin manages staff" UC is drawn in M1.**

### 2.3 Business Flow (`03_Design/M1_BusinessFlow.drawio`)
Three swimlanes: User/Customer | System (HSWRMS) | External Services

Key paths confirmed:
1. Register → Initiate Email Verification → Email Service → OTP Verification → Authenticate
2. Login (Email/Password) → Authenticate
3. Forgot Password → Initiate Reset → Email Service → Login
4. SSO (Google/Facebook) → Identity Providers → Map AuthIdentity → Authenticate
5. Authenticate → Role? → Customer Dashboard OR Staff Dashboards
6. Customer Dashboard → Manage Account Settings → Update Customer Profile
7. Customer Dashboard → Manage Health & Dietary Profile → Provide/Update Consent → Save Data
8. Health Data Deletion (immediate): Request → Create Deletion Request → Check Retention → No retreat → Execute Deletion/Anonymization → Mark Completed
9. Health Data Deletion (deferred): Active retreat → Set Status Deferred/Pending → View Pending → Cancel? → Cancel OR Wait Retreat End → Execute Deletion → Mark Completed

### 2.4 Screen Flow (`03_Design/M1_ScreenFlow.drawio`)

| Screen | Name | M1 Scope |
|---|---|---|
| S01 | Public Landing | M1 |
| S03 | Register | M1 |
| S04 | Email OTP Verification | M1 |
| S05 | Login | M1 |
| S06 | Password Reset | M1 |
| Router | Role-based router | M1 |
| S02 | Customer Dashboard | M1 |
| **EXT S20** | Receptionist Dashboard | External (not M1) |
| **EXT S31** | Therapist Dashboard | External (not M1) |
| **EXT S38** | F&B Dashboard | External (not M1) |
| **EXT S55** | Manager Dashboard | External (not M1) |
| **EXT S49** | Admin Dashboard | External (not M1) |
| S07 | Account Settings | M1 |
| S08 | Health & Dietary Profile | M1 |
| S09 | Health Data Deletion Request | M1 |

---

## 3. SRS Findings (M1-Relevant Only)

**UC01-UC10 all confirmed as M1** in SRS section 4.2.

**Roles (SRS section 4.1):** Guest, Registered User, Customer, Receptionist, Spa Therapist/Yoga Instructor, F&B Staff/Chef, Admin, Manager.

> [!IMPORTANT]
> SRS section 4.1 (Manager): "Manager access does **not include staff-account, role, or permission administration** by default. Specific limited administrative capabilities may be **delegated by Admin only**." This confirms the Manager RBAC constraint.

**Key M1 Business Rules:**
| BR | Rule |
|---|---|
| BR1 | Unique account email |
| BR2 | External identity uniqueness: (provider, provider_subject) |
| BR3 | At most one CustomerProfile per User; staff may have none |
| BR4 | Consent required before storing health/dietary/allergy/treatment data |
| BR5 | Deletion lifecycle: immediate if no active retreat, deferred otherwise, cancellable while pending |
| BR26 | Role-based permission assignment |

**SRS vs ERD gap:** SRS section 3.2 has a simplified conceptual ERD. It lists `anonymization_status` on HealthProfile — this field **does not appear in the M1 ERD drawio.** The ERD is authoritative for column-level design.

---

## 4. Web Demo Findings

### 4.1 Auth Pages (`src/pages/auth/`)
- **RegisterPage.tsx:** Fields: `fullName` (required), `email` (required), `phone` (optional), `password` (min 8), `confirmPassword`, `consent` checkbox. Simulates OTP dispatch.
- **LoginPage.tsx:** Fields: `email`, `password`, `rememberMe`. Google/Facebook SSO (simulated). Role-based redirect.
- **EmailOtpVerificationPage.tsx:** OTP entry screen.
- **PasswordResetPage.tsx:** Password reset form.

### 4.2 Customer Pages (`src/pages/customer/`)
- **AccountSettingsPage.tsx:** Edits `fullName`, `email`, `phone`, `dateOfBirth`, `address`, `preferredLanguage`, emergency contact (name/phone/relationship), notifications (email/sms/wellnessReminders). Has change-password sub-form.
- **HealthProfilePage.tsx:** Consent checkbox gates health data save. Health fields: `medicalConditions`, `injuriesOrSurgeries`, `mobilityConsiderations`, `currentMedications`, `stressLevel` (mild/moderate/high), `treatmentPreferences`. Dietary: `allergies`, `dietaryRestrictions`, `intolerances`, `dislikedIngredients`, `specialInstructions`. Consent version: "v1.2".
- **HealthDataDeletionPage.tsx:** Checks `activeBooking`. Active retreat shows deferred warning. Fields: `reason` text, `acknowledged` checkbox. Can cancel pending request.

### 4.3 Admin Pages (`src/pages/admin/`)
- **StaffAccountListPage.tsx:** Admin creates staff (name, email, role, title, department). Activate/deactivate.
- Other admin pages (MasterDataPage, PermissionMatrixPage, AdminDelegationPage, SensitiveAuditLogPage) are clearly M6 governance screens.

### 4.4 Auth Model
`src/types/auth.ts` Roles: `customer | receptionist | therapist | fb_staff | manager | admin`. No `guest` type. All auth is a local UI toggle — not a backend contract.

---

## 5. Cross-Source Comparison

| Topic | ERD | UseCase | BusinessFlow | ScreenFlow | SRS | Web Demo |
|---|---|---|---|---|---|---|
| Core auth entities | Yes | - | - | - | Yes (simplified) | Yes |
| CustomerProfile detail | Yes | - | - | - | Partial | Yes |
| HealthProfile 9 columns | Yes | - | - | - | No (4 collapsed) | Partial |
| FoodAllergy/Dietary as child tables | Yes | - | - | - | No (collapsed) | No (strings) |
| TreatmentHealthNote table | Yes | - | - | - | No (collapsed) | No (plain field) |
| ConsentRecord multi-record | Yes | - | Yes | Yes | Yes | No (single object) |
| Deletion request lifecycle | Yes | UC10 | Yes | S09 | Yes | Yes |
| SSO / AuthIdentity | Yes | UC05/06 | Yes | Yes (dashed) | UC05/06 | Yes (simulated) |
| Admin staff management | No | No | No | No (EXT S49) | Role desc only | Yes (full page) |
| Notification fields (3 event columns) | Yes | - | - | - | Partial | No (3 channel columns) |
| full_name on User | No | - | - | - | Yes | No |
| full_name on CustomerProfile | Yes | - | - | - | No | Yes |
| anonymization_status | No | - | - | - | Yes (HealthProfile) | No |

---

## 6. Conflicts and Ambiguities

### CONFLICT C1 — `full_name` placement
- SRS section 3.2 Entity USER: lists `full_name` on User.
- M1 ERD: `full_name` on **CustomerProfile** only. No `full_name` on User.
- Web Demo: `fullName` on CustomerProfile in `customer.ts` and `AccountSettingsPage.tsx`.
- ERD + Web Demo agree. SRS appears to use a global view. **ERD wins as M1-authoritative, but needs user confirmation.**

### CONFLICT C2 — HealthProfile field names diverge across sources
ERD uses: `current_health_condition`, `surgery_injury_history`, `mobility_joint_notes`, `supplement_notes`, `stress_fatigue_level`, `preferred_therapy_method`, `food_intolerance_notes`, `disliked_ingredients`, `kitchen_special_notes`. SRS collapses to 4. Web Demo uses different camelCase names. ERD column names are authoritative; Web Demo confirms `stress_fatigue_level` is an enum (mild/moderate/high).

### CONFLICT C3 — FoodAllergy/DietaryRequirement: normalized tables vs string arrays
ERD has separate `food_allergies` and `dietary_requirements` child tables with FK. Web Demo uses comma-separated string arrays. SRS collapses both into single attributes on HealthProfile. **ERD is authoritative.** Normalized tables are required for M3/M4 cross-module allergy name queries.

### CONFLICT C4 — ConsentRecord: multi-record (ERD) vs single object (Web Demo)
ERD: `ConsentRecord` is 0..* per CustomerProfile. Web Demo: single `HealthDataConsent` object. Decision needed: ERD multi-record model is more extensible.

### CONFLICT C5 — TreatmentHealthNote author unknown
ERD has `TreatmentHealthNote` as a child table — multiple notes per HealthProfile. Web Demo has `therapistNotes` as a free-text string on HealthProfilePage edited by the customer. **Who creates TreatmentHealthNote — Customer or Therapist?** No actor is specified in ERD. This has RBAC implications (M1 vs M3 scope).

### CONFLICT C6 — `phone_number` on User vs CustomerProfile
ERD: `phone_number` on User. Web Demo RegisterPage: `phone` is an optional registration field. Web Demo AccountSettingsPage and `customer.ts CustomerProfile`: `phone` appears in CustomerProfile. Likely represents same data. Clarification needed.

### CONFLICT C7 — Notification preferences: event-based (ERD) vs channel-based (Web Demo)
ERD: `booking_update_notifications`, `pre_checkin_notifications`, `therapy_reminder_notifications` — event-type booleans. Web Demo: `email`, `sms`, `wellnessReminders` — delivery channel booleans. These are conceptually different and incompatible without user guidance.

### CONFLICT C8 — Admin Staff Management scope
M1 UseCase + ScreenFlow: No admin staff management UC in M1. Admin Dashboard is EXT S49. Web Demo: Full `StaffAccountListPage.tsx`. SRS BF-06: Staff admin is M6. **Conclusion: M6 scope, not M1.** But M1 owns the `users`, `roles`, `user_roles` tables that M6 will depend on.

### CONFLICT C9 — SSO complexity vs academic scope
UC05/UC06 are in M1. Full OAuth2 integration is significantly complex. **Decision needed: implement or defer?**

### CONFLICT C10 — `request_type` values undefined
ERD has `request_type` on HealthDataDeletionRequest with no enum. Web Demo has `targetDataTypes: string[]`. BusinessFlow is generic. Allowed values unknown.

### AMBIGUITY A1 — OTP specification not defined
OTP length, expiry window, retry limit, storage mechanism not defined in any diagram.

### AMBIGUITY A2 — Password reset mechanism not specified
BusinessFlow: "Initiate Password Reset → Email Service" — link-based or OTP-based not specified.

### AMBIGUITY A3 — `account_status` state machine not drawn
SRS mentions: pending, active, inactive, locked — but no formal transition diagram exists.

### AMBIGUITY A4 — Role seed values not defined
Role names to seed in the `roles` table at startup are not formally enumerated in any diagram.

### AMBIGUITY A5 — Deletion: auto-execute vs Admin approval
No approval actor appears in M1 BusinessFlow. System appears to auto-execute if eligible.

### AMBIGUITY A6 — `anonymization_status` field
Appears in SRS HealthProfile but absent from M1 ERD. May have been omitted from the drawio file.

---

## 7. External Dependencies

| Dependency | Required By | Status |
|---|---|---|
| Email Service (SMTP) | UC02 OTP, UC03 password reset | Not configured |
| Google Identity Provider | UC05 | Not integrated |
| Facebook Identity Provider | UC06 | Not integrated |
| M2 RetreatBooking data | BR5 deletion retention check | M2 not yet started |
| M6 AuditLog | BR28 sensitive access logging | M6 not yet started |

> [!WARNING]
> Critical M2 dependency: The deletion lifecycle (BR5) checks whether the customer has an active/upcoming retreat — this requires M2 booking data. M1 cannot fully implement the deletion business flow without a M2 stub or agreed cross-module interface.

---

## 8. Recommended Questions for the User

| ID | Priority | Question |
|---|---|---|
| Q1 | CRITICAL | `full_name` — on **User** (SRS) or **CustomerProfile** (ERD + Web Demo)? |
| Q2 | CRITICAL | SSO UC05/UC06 — implement in M1 baseline or **defer** to later iteration? |
| Q3 | IMPORTANT | Notification preferences — event-based ERD columns or channel-based Web Demo fields? |
| Q4 | IMPORTANT | FoodAllergy + DietaryRequirement — separate child rows (ERD) or text inside HealthProfile? |
| Q5 | IMPORTANT | TreatmentHealthNote — who is the author: Customer (M1) or Therapist (M3)? |
| Q6 | MODERATE | `phone_number` — on User only, CustomerProfile only, or both? |
| Q7 | MODERATE | Health Data Deletion — auto-execute by system or requires Admin approval? |
| Q8 | MODERATE | OTP — specify length, expiry window, max retries, storage (DB table or cache)? |
| Q9 | MODERATE | `HealthDataDeletionRequest.request_type` — what are allowed enum values? |
| Q10 | MODERATE | ConsentRecord — multi-record per consent_type (ERD) or single boolean flag (Web Demo)? |
| Q11 | ADVISORY | Should M1 baseline include Admin staff management screens (currently M6 per diagrams)? |
