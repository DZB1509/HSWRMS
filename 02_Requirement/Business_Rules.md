# Business Rules Specification (BRS)
## Project: Xoai Aura Retreat — Wellness Resort & Spa Management System
**Document Code:** SWP391-HOS-03-BRS  
**Target System:** Xoai Aura Retreat Management Platform  
**Author:** Business Analysis Agent  
**Status:** Approved / Baseline  

---

## 1. Overview & Objective
This document outlines the authoritative set of Business Rules (BR) governing the Xoai Aura Retreat system. These rules define constraints, calculations, authorization matrices, and transactional state transitions required across all 5 core modules.

---

## 2. Role-Based Access Control (RBAC) & Data Minimization Matrix

| Data Entity / Field Group | Guest | Receptionist (Front Desk) | Spa Therapist / Instructor | F&B Staff / Chef | System Manager (Admin) |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Account & Login Credentials** | Own Profile | View basic info | View basic info | View basic info | Full CRUD |
| **National ID / Passport (Residence Law)** | Own Info | Input / Verify | Masked | Masked | Export (Encrypted) |
| **Sensitive Health Data (Physical injuries, back pain)** | Own Profile | ❌ **Masked / No Access** | ✅ **Read-Only** (Assigned guests) | ❌ **Masked / No Access** | ❌ **No Access** (HIPAA/Decree 356) |
| **Dietary & Food Allergies (Peanut allergy, vegan)** | Own Profile | ❌ **Masked / No Access** | ❌ **Masked / No Access** | ✅ **Read-Only** (Daily meal prep) | ❌ **No Access** |
| **Villa Inventory & Room Status** | View Available | Full Manage | Read-Only | Read-Only | Full CRUD |
| **Spa Slots & Resource Allocation** | Book own slot | Book / Charge Extra | View own schedule | No Access | Full CRUD |
| **F&B Menus & Daily Meal Orders** | Order / Select | Charge to Folio | No Access | Update status | Full CRUD |
| **Consolidated Invoices & Billing** | View / Pay own | Generate / Settle | No Access | No Access | Read-Only Audit |
| **Revenue Dashboard & Reports** | No Access | No Access | No Access | No Access | Full Access & Excel Export |

---

## 3. Detailed Business Rules Catalog

### 3.1. Module 1: Authentication, Compliance & Sensitive Health Profile
- **BR-AUTH-01 (Account Verification):** All new guest accounts registered via local email must undergo email verification with an expiring token (valid for 15 minutes) before the account becomes active. Third-party SSO (Google / Facebook) accounts are pre-verified.
- **BR-AUTH-02 (Explicit Consent under Decree 356/2025/ND-CP):**
  - Collection of sensitive health data (medical history, injuries, chronic pains) and dietary allergy information requires an explicit, standalone, **unchecked by default** consent checkbox on the UI.
  - Pre-ticked checkboxes or implicit consents bundled inside General Terms of Service are strictly prohibited.
- **BR-AUTH-03 (Field-Level Encryption for Sensitive Health & ID Data):**
  - All health conditions, allergy records, and government ID / Passport numbers must be encrypted at rest in the database using AES-256 before persistence.
  - Decryption keys must not be exposed to unauthorized services or logged in plaintext.
- **BR-AUTH-04 (Right to Erasure / Data Deletion):**
  - A Guest who has checked out and settled all invoices has the legal right to request permanent deletion of their health and allergy profile.
  - Upon deletion request, the system must hard-delete or irreversibly anonymize health profile tables while retaining necessary financial transaction logs for tax/accounting audit requirements.
- **BR-AUTH-05 (Staff Role Segregation):**
  - An Admin cannot bypass RBAC data masking to view sensitive guest medical records unless explicitly designated as a medical officer with logged audit trails.

---

### 3.2. Module 2: Retreat Package & Villa Accommodation Booking
- **BR-BOOK-01 (Package Validity & Minimum Stay):**
  - Retreat packages (e.g., 3-Day Yoga, 5-Day Detox) define fixed lengths of stay and bundled inclusions (X nights villa accommodation + Y spa sessions + Z daily curated meals).
  - Booking dates must match or exceed the package duration.
- **BR-BOOK-02 (Deposit Requirement):**
  - Online booking of a Retreat Package requires a mandatory deposit of at least 30% of total package cost via integrated payment gateways (Stripe / VNPay / PayPal).
  - Unpaid bookings are automatically cancelled after a 30-minute hold window.
- **BR-BOOK-03 (Villa State Machine):**
  - A Villa can only be in one of the following states: `AVAILABLE`, `RESERVED`, `OCCUPIED`, `DIRTY_CLEANING`, `MAINTENANCE`.
  - Check-in is only permitted if the assigned Villa is in `AVAILABLE` status.
- **BR-BOOK-04 (Residence Law 2020 Compliance):**
  - Check-in requires capturing mandatory guest identification (Citizen ID / Passport, Nationality, Date of Birth).
  - The system must generate a standardized Daily Temporary Residence Declaration file for export to local authorities.

---

### 3.3. Module 3: Spa & Therapy Scheduling Engine (Core 1)
- **BR-SPA-01 (2-Dimensional Resource Concurrency Locking):**
  - A Spa session booking is valid **ONLY IF** both:
    1. A qualified **Spa Therapist / Instructor** is available and not booked during the requested slot `[StartTime, EndTime]`.
    2. A designated **Treatment Room** is available and not booked during the same slot.
  - The database transaction must acquire an atomic lock across both resources to prevent race conditions and double-booking.
- **BR-SPA-02 (Therapist Rest & Turnaround Time):**
  - A minimum buffer time of 15 minutes is automatically added between consecutive spa sessions for therapist sanitization and room prep.
- **BR-SPA-03 (Package Quota vs. Extra Services):**
  - Sessions booked within the package quota are marked as `INCLUDED_IN_PACKAGE` ($0 billable at session time).
  - Extra spa treatments requested beyond package allowance are tagged as `A_LA_CARTE_EXTRA` and automatically posted to the Guest's Villa Folio.
- **BR-SPA-04 (Session Lifecycle & Status Transitions):**
  - Status progression: `SCHEDULED` $\rightarrow$ `CONFIRMED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `COMPLETED` or `NO_SHOW` / `CANCELLED`.
  - Cancellation must occur at least 4 hours before the session time to allow resource release without penalty.

---

### 3.4. Module 4: Dietary F&B Management (Core 2)
- **BR-FNB-01 (Allergy-Safe Menu Filtering):**
  - Before a Customer sees a menu, the system must hide every item containing an allergen declared in that Customer's food profile. Allergen-conflicting items must not be selectable or orderable through the API. The menu must also be filtered according to the Customer's dietary preferences so only items compatible with those preferences are shown.
- **BR-FNB-02 (Kitchen Display Masking):**
  - The Chef's Daily Meal Prep Dashboard must display: Villa Number, Guest First Name, Meal Selection, and **Specific Food Allergens only**.
  - The chef must NOT see any underlying medical diagnoses, therapies, or general health notes (Strict Data Minimization).
- **BR-FNB-03 (Meal Order Progression):**
  - Lifecycle: `ORDERED` $\rightarrow$ `PREPARING` $\rightarrow$ `READY_FOR_DELIVERY` $\rightarrow$ `SERVED`.
- **BR-FNB-04 (A-la-carte Room Folio Posting):**
  - Non-package food/drink orders require Villa number and Guest PIN/Signature confirmation before being charged to the open villa invoice.

---

### 3.5. Module 5: Consolidated Checkout, Folio Billing & Analytics
- **BR-BILL-01 (Consolidated Invoice Aggregation):**
  - The consolidated folio calculation is deterministic:
    $$\text{Total Invoice} = \text{Remaining Package Balance} + \sum \text{Extra Spa Services} + \sum \text{Extra F\&B Orders} + \text{Taxes/Fees} - \text{Deposit Paid}$$
- **BR-BILL-02 (Strict Checkout Lock on Pending Orders):**
  - A Guest **CANNOT** be checked out if there are active unfinalized F&B orders (`ORDERED`, `PREPARING`) or uncompleted Spa sessions that have not been settled or cancelled.
- **BR-BILL-03 (Checkout State Reversion):**
  - Upon successful final payment confirmation from the Payment Gateway or Front Desk Cash/POS, the Villa status immediately transitions to `DIRTY_CLEANING`, and keys/access tokens are revoked.
- **BR-BILL-04 (Post-Stay Feedback Integrity):**
  - Review & rating submissions (1 to 5 stars + comments) are strictly restricted to verified guests who have completed checkout.
- **BR-BILL-05 (Managerial Dashboard Aggregation):**
  - Financial reports and utilization metrics must aggregate data across all 3 revenue streams (Packages, Spa, F&B) with breakdown filters by date range, therapist workload utilization, and villa occupancy rates.
