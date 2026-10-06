# SOFTWARE DEVELOPMENT PROJECT SPECIFICATION

**Course:** ISP392 - Software Development Project  
**Project Title:** HEAVENSTAY WELLNESS RESORT MANAGEMENT SYSTEM  
**Project Acronym:** HSWRMS  
**Team Structure:** 6 Students / 6 Modules  
**Domain Application:** Hospitality, Wellness Tourism, Healthcare, E-Commerce  
**Revision:** HSWRMS Project Specification Ver2 - October 2026

> This revision updates the September 2026 baseline to align the Project Specification with the current SRS, Business Flows, Use Case Diagrams, Screen Flow and agreed module behavior.

## 1. Problem Statement

Traditional Property Management Systems mainly support standard hotel operations such as room booking, check-in and checkout. A wellness resort requires a broader journey combining retreat packages, accommodation, sensitive health and dietary information, Spa/Therapy/Yoga scheduling, personalized dining, extra services, consolidated billing and management reporting.

**HEAVENSTAY WELLNESS RESORT MANAGEMENT SYSTEM (HSWRMS)** is an integrated system for a fictional wellness resort. It supports the Customer journey from registration and retreat booking through check-in, treatment scheduling, personalized F&B, checkout, payment, review and reporting.

HSWRMS must:
- prevent scheduling conflicts for both Therapist/Yoga Instructor and Treatment Room;
- protect health, allergy, dietary and residence-identification data using role-based access;
- automatically coordinate Spa/Therapy scheduling and recovery while keeping final Customer/Receptionist confirmation;
- use ingredient batch information to determine F&B and menu availability;
- consolidate Package, Spa, F&B and approved Villa/Facility charges into one Customer Folio;
- prevent checkout while required charges or operational checks remain incomplete;
- separate payment confirmation from checkout completion;
- provide management reporting without granting Manager unrestricted Admin authority.

## 2. Third-Party Tool Interfaces

HSWRMS integrates with the following external services.

### 2.1 VNPay Payment Gateway

**Purpose:** Process supported online payment transactions for retreat deposits and final checkout.

**Main interactions:**
- HSWRMS sends payment amount and transaction/order information to VNPay.
- VNPay returns the payment result to HSWRMS.
- HSWRMS records the confirmed transaction against the related booking or invoice.
- A successful payment transaction does not by itself complete resort checkout.

### 2.2 Calendar & Notification Services

**Purpose:** Support account notifications and Spa/Therapy session communication.

**Main interactions:**
- send email OTP for account verification;
- synchronize confirmed or changed Spa/Therapy sessions to the Customer calendar;
- send T-24h informational reminder;
- send T-2h primary confirmation request;
- send T-75m final reminder when no response has been received;
- support the T-60m confirmation deadline;
- send T-15m upcoming-session reminder for an active confirmed session;
- notify Customers of accepted schedule or Therapist assignment changes.

HSWRMS remains the source of truth for scheduling decisions and session status.

### 2.3 Identity Providers

**Google Identity** and **Facebook Login**

**Purpose:** Provide Social Single Sign-On (SSO) in addition to normal email/password authentication.

## 3. External Entity Specification (Actors)

1. **Guest:** An unauthenticated public user who can browse public resort/retreat information and start registration, sign-in, password recovery or supported SSO. Guest cannot access authenticated Customer or staff functions.
2. **Registered User:** Abstract/general actor representing an authenticated HSWRMS account holder. It provides common authentication/account interactions inherited by Customer and staff roles; it is not an independent business role and grants no additional permission by itself.
3. **Customer:** Authenticated resort customer who manages personal wellness information, books retreat services, confirms Spa/Therapy schedules, selects meals, views itinerary/folio, makes supported payments and may review a completed stay.
4. **Receptionist:** Handles arrivals, check-in/check-out, residence information, physical Villa assignment/status, Customer folio operations and Spa/Therapy requests on behalf of Customers. Receptionist does not manually choose Therapist or Treatment Room.
5. **Spa Therapist / Yoga Instructor:** Views assigned schedule and the Customer's Treatment Safety Health Profile required for safe treatment, performs the assigned session and records the final attendance outcome. Unrelated payment, residence and account-security information remains hidden.
6. **F&B Staff / Chef:** Manages meal-preparation operations, ingredient batch/availability information, necessary allergy/dietary warnings, ingredient usage and meal-order status without accessing unrelated medical information.
7. **Manager:** Uses approved read-only/restricted dashboards and reports such as revenue, occupancy and Therapist utilization. Manager does not have unrestricted Admin authority by default.
8. **Admin:** Manages staff accounts, approved master data, system parameters, feature flags, permission configuration, limited delegation and audit/security administration.

### External Systems
- **VNPay Payment Gateway**
- **Calendar & Notification Services**
- **Google Identity**
- **Facebook Login**

## 4. Use Cases / User Stories

The project is organized into **6 interconnected modules**. Each module has a primary owner while sharing data and business rules across the system.

### Module 1 - Authentication & Sensitive Health Profile

- **UC01 - Register, Verify Email & Login:** As a Guest, I want to create an account, verify email, sign in securely or use supported Google/Facebook SSO.
- **UC02 - Manage Dietary & Health Profile:** As a Customer, I want to create and maintain dietary, allergy and treatment-safety information with explicit consent.
- **UC03 - Manage Staff Accounts & Roles:** As an Admin, I want to create, edit, deactivate staff accounts and assign authorized roles.
- **UC04 - Manage Master Data:** As an Admin, I want to manage approved system master data such as Villa Categories, Retreat Packages, Spa Services and other configured catalogs used by operations.
- **UC05 - Request Health Data Deletion:** As a Customer, I want to request deletion/anonymization of eligible health/allergy data after the retreat, subject to required retention and audit rules.

### Module 2 - Retreat Package & Accommodation Booking

- **UC06 - Browse Retreat Packages:** As a Guest or Customer, I want to browse available Retreat Packages and public package details.
- **UC07 - Book Retreat & Pay Deposit:** As a Customer, I want to select a Retreat Package, dates and Villa type, then pay the required deposit through VNPay.
- **UC08 - Check-In & Assign Villa:** As a Receptionist, I want to verify the Customer, collect required residence-identification information and assign an available physical Villa.
- **UC09 - Manage Villa Status:** As a Receptionist, I want to manage Villa operational states such as Available, Occupied, Maintenance and Needs Cleaning.
- **UC10 - View Booking & Itinerary:** As a Customer, I want to view my booking, accommodation information and itinerary.

**Residence-compliance clarification:** Required Customer identification/residence data must be protected at rest and limited to authorized access.

### Module 3 - Spa & Therapy Scheduling Engine - CORE

- **UC11 - Schedule Spa/Therapy Session:** As a Customer or Receptionist, I want to request a Spa/Therapy service and confirm one of the scheduling options automatically generated by HSWRMS.
- **UC12 - Automatic Therapist & Treatment Room Matching:** HSWRMS generates ranked candidates using preferred day/time constraints and confirms a candidate only when a qualified Therapist/Yoga Instructor and compatible Treatment Room are both available for the full interval.
- **UC13 - Manage Pre-Session Confirmation & Recovery:** HSWRMS manages reminders, Customer confirmation, automatic rescheduling/re-matching, schedule-change notification and slot-swap fallback when required.
- **UC14 - View Therapist Schedule & Treatment Safety Health Profile:** As a Therapist/Yoga Instructor, I want to view assigned sessions and the treatment-safety health information required to assess contraindications and safely deliver treatment.
- **UC15 - Record Session Attendance & Outcome:** As the assigned Therapist/Yoga Instructor, I want to record the final session outcome as Completed or No-Show.

**Supporting behavior:**
- Customer/Receptionist may provide treatment and preferred day/time constraints but does not manually choose Therapist or Treatment Room.
- HSWRMS revalidates the selected candidate before commit and reserves Therapist + Treatment Room atomically.
- Extra Spa/Therapy services use the same scheduling engine and applicable charges are posted to the Customer Folio.
- Confirmation timeline: T-24h information, T-2h primary confirmation, T-75m final reminder, T-60m deadline and T-15m upcoming reminder.
- Declined/Expired confirmation and Therapist unavailability trigger automatic recovery.
- Customer slot swap is a final fallback and requires explicit acceptance from every affected Customer before revalidation and atomic commit.
- Customer confirmation is not attendance; the Therapist/Yoga Instructor owns the final Completed/No-Show outcome.

### Module 4 - Dietary F&B Management - CORE

- **UC16 - Manage Ingredient Batches & Availability:** As F&B Staff/Chef, I want to maintain ingredient batch information including food type, received date, expiry date, quantity and condition so HSWRMS can determine ingredient availability.
- **UC17 - Select Personalized Daily Meals:** As a Customer, I want to view and select available meals filtered by relevant allergy/dietary information and current menu availability.
- **UC18 - Order Extra A-la-carte Items:** As a Customer, I want to order additional F&B items and post the applicable charge to my Customer Folio.
- **UC19 - Fulfill Meal Orders:** As F&B Staff/Chef, I want to view required allergy/dietary alerts, prepare meals, record ingredient usage and update order status through Preparing -> Ready -> Delivered.
- **UC20 - Enforce F&B Health-Data Minimization:** HSWRMS exposes only food-related allergy/dietary information required for meal preparation and hides unrelated medical history.

**Supporting behavior:**
- HSWRMS recalculates ingredient and related menu availability based on quantity, expiry and condition.
- Ingredient usage updates remaining quantity and may change menu availability.
- Daily meals and extra a-la-carte items use the same meal-order fulfillment process where applicable.

### Module 5 - Consolidated Checkout & Analytics

- **UC21 - Inspect Villa & Finalize Consolidated Invoice:** As a Receptionist, I want to inspect the Villa/facility checklist, record chargeable missing/damaged items when applicable, and finalize one Customer invoice containing Package, Spa, F&B and approved Villa/Facility charges.
- **UC22 - Process Final Payment:** As a Receptionist, I want to process the outstanding final amount using supported payment methods such as Cash or VNPay and record the confirmed payment result.
- **UC23 - Complete Checkout & Submit Review:** As a Receptionist, I want to complete checkout only after all requirements are satisfied; after checkout, the Customer may optionally submit a review and rating.
- **UC24 - View Revenue Dashboard:** As a Manager, I want to view revenue breakdown across Retreat Package, Spa/Therapy, F&B and other approved charge categories.
- **UC25 - View Occupancy & Therapist Utilization Reports:** As a Manager, I want to view permitted occupancy and Therapist-utilization information and export supported report data where available.

**Checkout rules:**
- Villa/facility inspection occurs before the final invoice is locked.
- Approved Villa/Facility charges are posted to the Customer Folio before final payment.
- Checkout is blocked while required Spa, F&B, Villa/Facility or other outstanding charges remain unresolved.
- Payment confirmation does not equal checkout completion.
- After checkout completion, the Villa status is updated to the configured post-checkout state such as Needs Cleaning.
- Review/rating is optional and available only after a completed stay.

### Module 6 - System Administration & Permission Management

- **UC26 - Configure Business Parameters:** As an Admin, I want to configure approved system parameters such as cancellation windows, refund percentages and other supported rules.
- **UC27 - Toggle Feature Flags:** As an Admin, I want to enable or disable approved functionality by module.
- **UC28 - Configure Permission Matrix:** As an Admin, I want to configure detailed permissions by role, screen and action.
- **UC29 - Delegate Limited Admin Rights:** As an Admin, I want to grant or revoke a limited subset of administrative capabilities for Manager without granting full Admin authority.
- **UC30 - View Sensitive-Data Audit Log:** As an Admin, I want to review sensitive-data access and security-relevant events.
- **UC31 - View System Overview Dashboard:** As an Admin or authorized Manager, I want to view system-level operational information according to granted access.

## 5. Business Rules (Strict Constraints)

1. **BR-01 - Guest vs Customer State:** Guest is unauthenticated and limited to public/authentication functions. Authenticated resort business functions are performed by Customer or authorized staff roles.
2. **BR-02 - Automated Spa Scheduling:** HSWRMS generates scheduling candidates; Customer/Receptionist does not manually select Therapist or Treatment Room.
3. **BR-03 - Joint Availability, Revalidation & Atomic Commit:** A Spa/Therapy candidate is valid only when a qualified Therapist/Yoga Instructor and compatible Treatment Room are available for the same complete interval. Availability must be revalidated immediately before atomic reservation/commit.
4. **BR-04 - Spa Confirmation, Recovery & Swap Consent:** Declined/Expired confirmation or Therapist unavailability triggers automatic recovery. Any confirmed Customer time change requires Customer acceptance. A slot swap is committed only after every affected Customer explicitly accepts and the proposal is revalidated.
5. **BR-05 - Confirmation Is Not Attendance:** Pre-session Customer confirmation only retains the slot. Only the assigned Therapist/Yoga Instructor records final attendance as Completed or No-Show.
6. **BR-06 - Treatment Safety Data Access:** Therapist/Yoga Instructor may access the complete treatment-safety health information required for assigned treatment, while unrelated administrative, residence, payment and account-security data remains hidden.
7. **BR-07 - F&B Data Minimization & Availability:** F&B Staff/Chef may access only required food-related allergy/dietary information. Ingredient batch quantity, expiry and condition determine ingredient and related menu availability.
8. **BR-08 - Consolidated Folio Accounting:** Package, Extra Spa/Therapy, Extra F&B and approved Villa/Facility charges are posted to the Customer Folio with traceable links to the related stay/booking.
9. **BR-09 - Checkout Guard:** Checkout cannot complete while required charges, payment confirmation or required checkout checks remain unresolved.
10. **BR-10 - Payment vs Checkout:** A successful payment transaction records payment only; HSWRMS completes checkout separately after all checkout conditions are satisfied.
11. **BR-11 - Residence Data Protection:** Residence-identification data collected at check-in must be protected at rest and accessible only to authorized roles.
12. **BR-12 - Manager Least Privilege:** Manager may access approved dashboards/reports and explicitly delegated limited capabilities but must not inherit unrestricted Admin permissions.
13. **BR-13 - Health Data Deletion Timing:** Customer health/allergy deletion or anonymization is available subject to retreat lifecycle, operational retention and audit requirements.

## 6. References & Domain Knowledge (Mandatory Research)

Students must continue to research and document the legal, hospitality, wellness and technical basis used by the project.

### A. Legal Compliance & Data Protection

1. **Vietnam personal-data protection requirements (as referenced by the supplied project baseline)**  
   Focus areas: sensitive health data, explicit consent, access control and appropriate protection.  
   Project application: Health/Diet data requires explicit consent, must not use default-checked consent and must be protected appropriately.

2. **Law on Residence 2020 (Luật Cư trú 2020)**  
   Focus area: temporary-residence information for resort Customers.  
   Project application: check-in collects required residence-identification information; access is restricted and protected at rest.

### B. Hospitality & Wellness Domain Operations

3. **Global Wellness Institute (GWI) Standards / Wellness Taxonomy**  
   Project application: Retreat Package and wellness-service terminology should reflect the wellness-tourism domain rather than generic hotel wording.

4. **Guest/Customer Folio & Night Audit Practices (AHLEI-oriented research)**  
   Project application: operational service charges are posted to a central Customer Folio and consolidated during checkout.

### C. Technical Synthesis

5. **Encryption, Authorization and Concurrency Research**  
   Focus areas: protection of sensitive data at rest, backend RBAC, transactional resource reservation, scheduling concurrency, payment confirmation and auditability.

## 7. Module Integration Summary

The six modules form one end-to-end resort journey:

`Authentication & Wellness Profile -> Retreat Booking & Deposit -> Check-In & Villa Assignment -> Spa/Therapy + F&B Operations -> Customer Folio & Villa Inspection -> Final Payment -> Checkout -> Review & Analytics`

**Module 6** operates across the system to control permissions, configuration, auditability and management visibility.

Key integrations:
- **M1 <-> M6:** account roles, permission model and controlled administration;
- **M2 / M5 <-> VNPay:** retreat deposit and supported final online payment;
- **M3 <-> Calendar & Notification Services:** calendar synchronization, confirmation lifecycle and schedule-change notifications;
- **M2 + M3 + M4 + Villa/Facility inspection -> M5:** charges are aggregated into the Customer Folio and final invoice;
- **M4:** ingredient usage updates inventory availability and may affect Customer-facing menu availability.


**End of HSWRMS Project Specification Ver2**
