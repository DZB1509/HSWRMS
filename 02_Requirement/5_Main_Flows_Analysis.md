# Analysis of 5 Main System Flows

## Project: Xoai Aura Retreat — Wellness Resort & Spa Management System

**Document Code:** SWP391-HOS-03-FLOWS
**Target Folder:** `02_Requirement/`
**Source Baseline:** `Requirement_Traceability_Matrix.md` & `Context_Diagram_HOS03.drawio`
**Author:** Senior Business Analyst
**Version:** 1.0 (Baseline)
**Date:** September 16, 2026

---

## Executive Summary

Based on the Requirements Traceability Matrix and DFD Level 0 Context Diagram, the 25 Use Cases are structured into **5 End-to-End Main Flows**. Each flow represents an operational lifecycle within Xoai Aura Retreat, owned by one student engineer and strictly governed by domain business rules and Vietnamese legal regulations (Decree 356/2025/ND-CP & Law on Residence 2020).

```mermaid
flowchart LR
    F1["Flow 1: Guest Identity &<br>Sensitive Health Profile<br>(Student 1)"] --> F2["Flow 2: Package Booking &<br>Villa Check-In<br>(Student 2)"]
    F2 --> F3["Flow 3: 2D Spa Scheduling<br>& Therapy Execution<br>(Student 3)"]
    F2 --> F4["Flow 4: Personalized Dietary<br>Meal Management<br>(Student 4)"]
    F3 --> F5["Flow 5: Consolidated Folio<br>Checkout & Analytics<br>(Student 5)"]
    F4 --> F5
```

---

## Flow 1: Guest Onboarding, Sensitive Health Profile & Compliance Lifecycle

- **Primary Module:** Module 1 (Assigned to **Student 1**)
- **Use Cases Covered:** UC01, UC02, UC03, UC04, UC05
- **Primary Actors:** Guest, System Manager (Admin), Google Identity/SSO, System Encryption Service
- **Key Business Rules:** BR-AUTH-01, BR-AUTH-02, BR-AUTH-03, BR-AUTH-04, BR-AUTH-05

### 1.1. Detailed Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor G as Guest
    actor A as Admin
    participant UI as Web Frontend
    participant BE as Backend Controller
    participant SSO as Google Identity / SendGrid
    participant DB as Encrypted Database

    Note over G, SSO: Phase A: Registration & Authentication (UC01)
    alt Local Registration
        G->>UI: Input Email & Password
        UI->>BE: Submit Registration
        BE->>SSO: Send Activation Token via Email
        G->>UI: Click Verification Link
        UI->>BE: Activate Account
    else SSO Login
        G->>UI: Click "Login with Google"
        UI->>SSO: OAuth2 Request
        SSO-->>BE: Return Verified Token & Identity
    end

    Note over G, DB: Phase B: Sensitive Health Profile with Explicit Consent (UC02)
    G->>UI: Open Health & Dietary Form
    UI->>G: Display UNCHECKED consent checkboxes (Decree 356/2025)
    G->>UI: Explicitly check consent & enter conditions (e.g. back pain, peanut allergy)
    UI->>BE: Submit Health Profile Payload
    BE->>DB: Store with AES-256 Field Encryption

    Note over A, DB: Phase C: Admin Staff Role Management & Master Data (UC03, UC04)
    A->>UI: Assign Staff Roles (Therapist, Chef, Receptionist)
    A->>UI: Configure Villa Categories, Packages & Spa Catalog
    UI->>BE: Update Master Data & RBAC Policies

    Note over G, DB: Phase D: Post-Retreat Right to Deletion (UC05)
    G->>UI: Request Data Erasure (Right to Deletion)
    BE->>DB: Hard delete / Anonymize HealthProfile (Retain financial audit logs)
    BE-->>G: Deletion Confirmation Receipt
```

### 1.2. Operational Steps & Edge Cases

1. **Unchecked Consent Validation:** If the guest does not explicitly check the Decree 356/2025 consent checkbox, the system rejects health profile submission and operates in basic hospitality mode.
2. **Field-Level Encryption:** Health notes and allergy data are never stored in plaintext SQL columns.
3. **Right to Erasure Trigger:** Can only be triggered after the guest's folio balance is zero and checkout is completed.

---

## Flow 2: Wellness Retreat Discovery, Villa Reservation & Arrival Check-In

- **Primary Module:** Module 2 (Assigned to **Student 2**)
- **Use Cases Covered:** UC06, UC07, UC08, UC09, UC10
- **Primary Actors:** Guest, Receptionist, Payment Gateway (Stripe/VNPay), System Engine
- **Key Business Rules:** BR-BOOK-01, BR-BOOK-02, BR-BOOK-03, BR-BOOK-04

### 2.1. Detailed Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor G as Guest
    actor R as Receptionist
    participant UI as Portal / PMS UI
    participant BE as Booking Engine
    participant PG as Payment Gateway (Stripe/VNPay)
    participant DB as Central Database

    Note over G, PG: Phase A: Package Browsing & Booking (UC06, UC07, UC10)
    G->>UI: Filter Packages by Wellness Goal (Detox, Yoga, Stress Relief)
    UI->>BE: Query Available Packages & Villa Types
    BE-->>UI: Return Curated Packages & Available Dates
    G->>UI: Select Package, Dates, Villa Type & Proceed to Deposit
    UI->>PG: Initiate 30% Deposit Transaction
    PG-->>BE: Webhook: Payment SUCCESS
    BE->>DB: Create Booking Record (Status: CONFIRMED)
    BE-->>G: Send Booking Confirmation & Itinerary Timeline

    Note over R, DB: Phase B: Front Desk Check-In & Residence Declaration (UC08, UC09)
    R->>UI: Open Expected Arrivals Dashboard
    G->>R: Arrive at Resort Front Desk
    R->>UI: Scan / Input Guest Citizen ID / Passport (Law on Residence 2020)
    R->>UI: Assign physical Villa number (Must be status: AVAILABLE)
    UI->>BE: Execute Check-In
    BE->>DB: Update Villa Status to OCCUPIED & Encrypt Guest ID
    BE-->>R: Check-In Complete; Print Welcome Slip
```

### 2.2. Operational Steps & Edge Cases

1. **Deposit Expiry:** If the 30% deposit is not settled within 30 minutes, the reserved villa lock is released automatically.
2. **Villa Status Conflict:** Check-in fails immediately if the target villa is in `DIRTY_CLEANING` or `MAINTENANCE` state.
3. **Residence Compliance:** Foreign passport and domestic citizen ID data are segregated and exported for local police reporting.

---

## Flow 3: 2-Dimensional Concurrency Spa Scheduling & Therapy Execution

- **Primary Module:** Module 3 (Assigned to **Student 3 - Core 1 Complexity**)
- **Use Cases Covered:** UC11, UC12, UC13, UC14, UC15
- **Primary Actors:** Guest, Spa Therapist, Receptionist, Calendar Service (Google Calendar/SendGrid)
- **Key Business Rules:** BR-SPA-01, BR-SPA-02, BR-SPA-03, BR-SPA-04, RBAC Data Minimization

### 3.1. Detailed Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor G as Guest
    actor T as Spa Therapist
    actor R as Receptionist
    participant BE as 2D Scheduling Engine
    participant CAL as Google Calendar / SendGrid
    participant DB as Database (Pessimistic Lock)

    Note over G, CAL: Phase A: 2D Concurrent Slot Booking (UC11, UC12)
    G->>BE: Request Spa Slot (Date, Service, Time)
    critical 2D Concurrency Lock (BR-SPA-01)
        BE->>DB: Query & Lock Therapist Availability
        BE->>DB: Query & Lock Treatment Room Availability
    option Both Available
        BE->>DB: Create SpaBooking (Status: SCHEDULED)
        BE->>CAL: Sync to Guest Calendar & Queue 1-Hour Reminder
        BE-->>G: Booking Confirmed
    option Either Busy
        BE-->>G: Conflict Error: "Slot unavailable. Please select another time."
    end

    Note over T, DB: Phase B: Therapy Session Execution & Physical Health Access (UC13, UC14)
    T->>BE: View Daily Working Schedule
    BE->>DB: Fetch Assigned Guest Physical Health Notes ONLY (e.g. Lower back pain)
    BE-->>T: Display Schedule & Masked Health Notes (No F&B or Billing data)
    T->>G: Conduct Therapy Session
    T->>BE: Update Session Status to COMPLETED (or NO_SHOW)
    BE->>DB: Persist Session Completion Record

    Note over R, DB: Phase C: Extra A-la-Carte Spa Booking (UC15)
    R->>BE: Book Extra Spa Treatment for Guest
    BE->>DB: Create SpaBooking tagged as A_LA_CARTE_EXTRA
    BE->>DB: Auto-post charge to Guest's Open Villa Folio
```

### 3.2. Operational Steps & Edge Cases

1. **2D Resource Contention:** Simultaneous booking requests for the same room or therapist are resolved via database isolation (Pessimistic/Optimistic locking) to ensure zero double-booking.
2. **RBAC Filtering:** Therapists can inspect physical ailment notes (injuries, spine issues) but have zero access to food allergies or financial invoices.

---

## Flow 4: Personalized Dietary Meal Planning & Kitchen Fulfillment

- **Primary Module:** Module 4 (Assigned to **Student 4 - Core 2 Complexity**)
- **Use Cases Covered:** UC16, UC17, UC18, UC19, UC20
- **Primary Actors:** Guest, Chef / F&B Staff, Kitchen Display System (KDS)
- **Key Business Rules:** BR-FNB-01, BR-FNB-02, BR-FNB-03, BR-FNB-04, RBAC Data Minimization

### 4.1. Detailed Sequence Diagram

1. 4.2. Operational Steps & Edge Cases
1. **Severe Allergen Alert:** Kitchen display renders prominent visual indicators (red banners) for any orders associated with severe allergies.
1.
1. **Medical History Isolation:** Under no circumstances does the chef interface expose physical therapy notes, diagnoses, or ID details.

---

## Flow 5: Consolidated Folio Billing, Check-Out & Executive Analytics

- **Primary Module:** Module 5 (Assigned to **Student 5**)
- **Use Cases Covered:** UC21, UC22, UC23, UC24, UC25
- **Primary Actors:** Guest, Receptionist, System Manager (Admin), Payment Gateway
- **Key Business Rules:** BR-BILL-01, BR-BILL-02, BR-BILL-03, BR-BILL-04, BR-BILL-05

### 5.1. Detailed Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor G as Guest
    actor R as Receptionist
    actor M as System Manager
    participant UI as PMS Front Desk / Manager UI
    participant BE as Billing & Analytics Engine
    participant PG as Payment Gateway / POS
    participant DB as Central Database

    Note over G, PG: Phase A: Consolidated Folio Generation & Settlement (UC21, UC22)
    G->>R: Request Check-Out at Front Desk
    R->>UI: Search Villa Number / Guest Name
    UI->>BE: Generate Consolidated Invoice
    critical Consolidated Billing Validation (BR-BILL-02)
        BE->>DB: Check for uncompleted Spa sessions or preparing F&B orders
    option Pending Orders Found
        BE-->>UI: Check-out Blocked: "Active pending orders exist. Settle or cancel before checkout."
    option All Orders Settled/Completed
        BE->>DB: Aggregate: (Remaining Package + Extra Spa + Extra F&B - Deposit Paid)
        BE-->>UI: Display Itemized Consolidated Invoice
    end
    R->>PG: Process Final Payment (Credit Card / VNPay / Cash)
    PG-->>BE: Payment Successful
    BE->>DB: Update Folio Status -> SETTLED
    BE->>DB: Update Villa Status -> DIRTY_CLEANING
    BE-->>R: Print Official VAT Invoice & Release Guest

    Note over G, DB: Phase B: Guest Review Submission (UC23)
    G->>UI: Submit Rating & Experience Review (Post-checkout verified)
    UI->>BE: Persist Review in DB

    Note over M, DB: Phase C: Executive Analytics & Excel Export (UC24, UC25)
    M->>UI: Open Executive BI Dashboard
    BE->>DB: Aggregate Revenue by Stream (Packages, Spa, F&B)
    UI-->>M: Render Interactive Pie/Bar Charts
    M->>UI: Click "Export Occupancy & Therapist Utilization Report"
    BE->>UI: Generate & Download Excel Workbook (.xlsx)
```

### 5.2. Operational Steps & Edge Cases

1. **Unpaid Orders Prevention:** Check-out transaction aborts if any pending F&B or extra Spa order is in unbilled status.
2. **Immediate Room Turnaround:** Villa status changes instantly to `DIRTY_CLEANING` to signal housekeeping.
3. **Multi-Stream Revenue Integrity:** Analytics engine reconciles deposits, final settlements, and refunds with zero discrepancy.

---

## 6. Summary Matrix: Use Case to Flow Mapping

| Flow Number | Flow Name                                     |   Module & Owner   |      Included Use Cases      | External Integrations         | Primary Business Rules             |
| :---------: | :-------------------------------------------- | :----------------: | :--------------------------: | :---------------------------- | :--------------------------------- |
| **Flow 1**  | Guest Identity, Sensitive Health & Compliance | MOD-01 (Student 1) | UC01, UC02, UC03, UC04, UC05 | Google Identity SSO, SendGrid | BR-AUTH-01 to 05, Decree 356       |
| **Flow 2**  | Package Discovery, Villa Booking & Check-In   | MOD-02 (Student 2) | UC06, UC07, UC08, UC09, UC10 | Stripe / VNPay Sandbox        | BR-BOOK-01 to 04, Law on Residence |
| **Flow 3**  | 2D Spa Scheduling & Therapy Execution         | MOD-03 (Student 3) | UC11, UC12, UC13, UC14, UC15 | Google Calendar API, SendGrid | BR-SPA-01 to 04, RBAC Minimization |
| **Flow 4**  | Personalized Dietary Meal Management          | MOD-04 (Student 4) | UC16, UC17, UC18, UC19, UC20 | Kitchen Display System        | BR-FNB-01 to 04, Allergen Safety   |
| **Flow 5**  | Consolidated Folio, Checkout & Analytics      | MOD-05 (Student 5) | UC21, UC22, UC23, UC24, UC25 | Payment Gateway, Excel Export | BR-BILL-01 to 05, Accounting Audit |

```mermaid
sequenceDiagram
    autonumber
    actor G as Guest
    actor C as Chef / Kitchen Staff
    participant UI as Guest App / Kitchen KDS
    participant BE as F&B Controller
    participant DB as Central Database

    Note over G, BE: Phase A: Allergy-Filtered Meal Selection (UC16, UC19)
    G->>UI: View Daily Retreat Menu
    BE->>DB: Retrieve Guest Dietary & Allergy Profile
    BE->>UI: Return Filtered Menu (items with declared allergens excluded)
    G->>UI: Select Package Meals & optional A-la-carte beverages
    UI->>BE: Submit Meal Order
    alt Package Meal
        BE->>DB: Record Meal Order (Billable: $0)
    else A-la-carte Extra Order
        BE->>DB: Record Order & Post Charge to Villa Folio
    end

    Note over C, DB: Phase B: Kitchen Display & Data-Minimized Prep (UC17, UC18, UC20)
    C->>UI: Open Kitchen Daily Meal Prep Dashboard
    BE->>DB: Fetch Active Orders & Food Allergies
    Note over BE: Data Minimization (UC20):<br>Mask full medical history, show ONLY food allergies
    BE-->>UI: Display Orders (Villa No, Meal Item, ALLERGY WARNING: e.g. "Severe Peanut Allergy")
    C->>UI: Update Order Status -> PREPARING
    C->>UI: Update Order Status -> READY_FOR_DELIVERY
    BE->>DB: Update MealOrderStatus in DB
```
