# SOFTWARE DEVELOPMENT PROJECT SPECIFICATION

**Course:** ISP392 - Software Development Project  
**Project Title:** HEAVENSTAY WELLNESS RESORT MANAGEMENT SYSTEM  
**Project Acronym:** HSWRMS  
**Team Structure:** 6 Students / 6 Modules  
**Domain Application:** Hospitality, Wellness Tourism, Healthcare, E-Commerce  
**Revision:** Current ISP392 Project Baseline - September 2026

> This document is a revised project specification adapted from the supplied baseline specification and aligned with the current HSWRMS scope agreed by the team: 6 modules, VNPay as the implemented payment gateway, Google and Facebook SSO, and a separate limited Manager role alongside Admin.

## 1. Problem Statement

Traditional Property Management Systems (PMS) are designed mainly for standard hotels where guests reserve rooms, check in, use basic services, and check out. A wellness resort operates differently because the guest experience is organized around a complete retreat journey: accommodation, retreat packages, sensitive health and dietary profiles, scheduled Spa/Therapy/Yoga sessions, personalized meals, extra services, consolidated billing, and management analytics.

**HEAVENSTAY WELLNESS RESORT MANAGEMENT SYSTEM (HSWRMS)** is proposed as an integrated information system for a fictional wellness resort scenario. The system must support the guest journey from registration and retreat booking through check-in, therapy scheduling, personalized F&B, checkout, payment, review, and reporting.

The main design challenge is not only to provide convenient screens, but to coordinate multiple operational resources and protect sensitive data. In particular, HSWRMS must:

- prevent double-booking of both Therapist and Treatment Room;
- protect health, allergy, dietary, and residence-identification data;
- allow each role to access only the information required for its work;
- aggregate Package, Spa, and F&B charges into one Guest/Villa Folio;
- prevent checkout while unpaid extra charges remain;
- support operational and management reporting without giving Manager full administrative authority.

## 2. Third-Party Tool Interfaces

HSWRMS integrates with the following external services.

### 2.1 VNPay Payment Gateway

**Purpose:** Process the retreat deposit and final checkout payment.

**Main interactions:**
- HSWRMS sends payment amount and transaction/order information to VNPay.
- VNPay returns payment result / payment confirmation to HSWRMS.
- HSWRMS records the confirmed transaction against the related booking or invoice.

### 2.2 Calendar and Notification Services

**Google Calendar**

**Purpose:** Synchronize confirmed Spa/Therapy/Yoga sessions to the Guest's personal calendar.

**Email Notification Service (SendGrid or compatible provider)**

**Purpose:**
- send email OTP for account verification;
- send therapy-session reminder approximately 1 hour before a confirmed session.

### 2.3 Authentication Providers

**Google Identity** and **Facebook Login**

**Purpose:** Provide Social Single Sign-On (SSO) in addition to the normal email/password authentication flow.

## 3. External Entity Specification (Actors)

1. **Guest (Customer):** Registers or signs in, maintains dietary/health profile, browses and books retreat packages, pays deposit, views booking and itinerary, schedules included Spa/Therapy sessions, selects meals, pays at checkout, and submits review/rating.
2. **Receptionist (Front Desk):** Views arrivals, verifies Guest information, collects residence-identification data, assigns a physical Villa at check-in, manages operational Villa status, manually books extra Spa services, reviews Guest Folio, generates consolidated invoice, and performs checkout.
3. **Spa Therapist / Yoga Instructor:** Views assigned daily schedule, accesses only treatment-relevant health notes of assigned Guests, performs sessions, and marks sessions Completed or No-Show.
4. **F&B Staff / Chef:** Views daily meal-preparation requirements, relevant allergy/dietary warnings, prepares meals, updates meal status, and handles extra a-la-carte orders without seeing unnecessary medical history.
5. **Manager:** Primarily views approved Dashboard/Report functions such as revenue, occupancy, therapist utilization, and system overview. Manager may receive limited delegated rights but must not have unrestricted Admin authority.
6. **Admin:** Manages system-level configuration, permission matrix, feature flags, audit information, staff/system administration, and approved master data.

### External Systems

- **VNPay Payment Gateway**
- **Google Calendar**
- **Email Notification Service**
- **Google Identity**
- **Facebook Login**

## 4. Use Cases / User Stories

The project is organized into **6 independent but interconnected modules**. Each student owns one module end-to-end and coordinates shared interfaces with the other modules.

### Module 1 - Authentication & Sensitive Health Profile

- **UC01 - Register, Verify Email & Login:** As a Guest, I want to register, verify my email via OTP, log in securely, or use Google/Facebook SSO.
- **UC02 - Manage Dietary & Health Profile:** As a Guest, I want to create and update my Dietary & Health Profile with explicit, unchecked consent for sensitive-data collection.
- **UC03 - Manage Staff Accounts & Roles:** As an authorized administrator, I want to create, edit, deactivate staff accounts and assign roles.
- **UC04 - Manage Master Data:** As an authorized administrator, I want to manage approved master data such as Villa Categories, Spa Services, and Retreat Packages using appropriate wellness terminology.
- **UC05 - Request Health Data Deletion:** As a Guest, I want to request deletion/anonymization of my health and allergy data after my retreat has ended, subject to required audit/retention rules.

### Module 2 - Retreat Package & Accommodation Booking

- **UC06 - Browse Retreat Packages:** As a Guest, I want to browse available Retreat Packages and filter them by wellness goal.
- **UC07 - Book Retreat & Pay Deposit:** As a Guest, I want to select a package, dates and Villa type, then pay a deposit securely through VNPay.
- **UC08 - Check-In & Assign Villa:** As a Receptionist, I want to view expected arrivals, verify the Guest, collect required residence-identification information, and assign a specific physical Villa.
- **UC09 - Manage Villa Status:** As a Receptionist, I want to manage physical Villa status such as Available, Occupied, Maintenance, and post-checkout cleaning state.
- **UC10 - View Booking & Itinerary:** As a Guest, I want to view my booking details and itinerary timeline.

**Residence-compliance clarification for UC08:** Required Guest identification data must be protected at rest, and authorized management must be able to export the daily residence-declaration report required by the project's residence-law research.

### Module 3 - Spa & Therapy Scheduling Engine - CORE 1

- **UC11 - Schedule Included Spa/Therapy Session:** As a Guest with a valid retreat booking, I want to schedule an included Spa/Therapy/Yoga session by selecting an eligible date/time slot.
- **UC12 - Match Therapist & Treatment Room:** The system must confirm a slot only when both an eligible Therapist and an available Treatment Room exist for the same time interval.
- **UC13 - View Therapist Schedule & Health Notes:** As a Therapist, I want to view my assigned daily schedule and only the treatment-relevant health notes of assigned Guests.
- **UC14 - Mark Session Completed / No-Show:** As a Therapist, I want to update the outcome of an assigned session.
- **UC15 - Manually Book Extra Spa Service:** As a Receptionist, I want to manually book an extra Spa service for a Guest; the booking must use the same resource-conflict checks and the charge must be posted to the Guest/Villa Folio.

**Supporting behavior:** Confirmed sessions are synchronized to Google Calendar and receive an email reminder approximately 1 hour before the session.

### Module 4 - Dietary F&B Management - CORE 2

- **UC16 - Pre-select Daily Meals:** As a Guest, I want to pre-select daily meals from options filtered by my allergy/dietary profile.
- **UC17 - View Daily Meal Prep Dashboard:** As Chef/F&B Staff, I want to view aggregated daily meal orders and relevant allergy warnings.
- **UC18 - Update Meal Order Status:** As Chef/F&B Staff, I want to change meal status from Preparing to Ready for Delivery.
- **UC19 - Order Extra A-la-carte Item:** As a Guest, I want to order an extra a-la-carte item and charge it to my Villa Folio.
- **UC20 - Minimize Health Data for Chef:** The system must expose only food-related allergy/dietary information to Chef/F&B Staff and must hide unrelated medical history.

### Module 5 - Consolidated Checkout & Analytics

- **UC21 - Generate Consolidated Invoice:** As a Receptionist, I want to generate one invoice that consolidates remaining Package cost, Extra Spa services, and Extra F&B orders for the booking.
- **UC22 - Process Final Payment & Update Villa:** As a Receptionist, I want to process final payment through VNPay and update the Villa state after successful checkout.
- **UC23 - Submit Review & Rating:** As a Guest, I want to submit a review and rating after checkout.
- **UC24 - View Revenue Dashboard:** As a Manager, I want to view revenue breakdown by Package, Spa, and F&B.
- **UC25 - Export Occupancy & Therapist Utilization:** As a Manager, I want to export occupancy and therapist-utilization reports.

**Checkout guard:** UC22 may proceed only when all pending/unpaid Extra Spa and F&B charges have been settled.

### Module 6 - System Administration & Permission Management

- **UC26 - Configure Business Parameters:** As an Admin, I want to configure approved system parameters such as refund percentage and cancellation window.
- **UC27 - Toggle Feature Flags:** As an Admin, I want to enable or disable approved functionality by module.
- **UC28 - Configure Permission Matrix:** As an Admin, I want to configure detailed permissions by screen/action/role.
- **UC29 - Delegate Limited Admin Rights:** As an Admin, I want to delegate a limited subset of administrative rights to Manager without granting full Admin authority.
- **UC30 - View Sensitive-Data Audit Log:** As an Admin, I want to review sensitive-data access events for governance and troubleshooting.
- **UC31 - View System Overview Dashboard:** As an Admin or authorized Manager, I want to view an overview of system operations and management indicators.

## 5. Business Rules (Strict Constraints)

1. **BR-01 - Two-Dimensional Double-Booking Prevention:** A Spa booking is valid only if a specific eligible Therapist **and** a specific Treatment Room are both available for the requested time slot. The system must reserve both resources consistently so concurrent requests cannot create conflicting bookings.
2. **BR-02 - Consolidated Billing / Checkout Guard:** A Guest cannot complete checkout while pending or unpaid Extra Spa or F&B charges remain.
3. **BR-03 - Data Minimization and RBAC:**
   - Therapists can view only health data relevant to physical treatment and only for assigned Guests.
   - Chef/F&B Staff can view only food-related allergy/dietary information required for meal preparation.
   - Receptionists must not see unnecessary sensitive Health/Diet data.
   - Access rules must be enforced in backend authorization and data-access logic, not only in the UI.
4. **BR-04 - Folio Accounting:** Extra Spa and F&B charges must be posted to the Guest/Villa Folio and linked to the related `Room_Booking_ID` so Module 5 can calculate the consolidated invoice.
5. **BR-05 - Residence Data Protection:** Residence-identification data collected during check-in must be protected at rest and accessed only by authorized roles.
6. **BR-06 - Manager Least Privilege:** Manager may view approved dashboards/reports and receive explicitly delegated limited rights, but must not inherit unrestricted Admin permissions.
7. **BR-07 - Right to Deletion Timing:** Guest health/allergy deletion or anonymization is available after the retreat has ended and must preserve any legally or operationally required audit evidence.

## 6. References & Domain Knowledge (Mandatory Research)

Students must research the following domain-specific requirements and reflect the findings in database design, authorization, UI behavior, and SRS business rules.

### A. Legal Compliance & Data Protection

1. **Vietnam Decree 356/2025/ND-CP on Personal Data Protection** (as stated in the supplied project baseline)  
   Focus areas: sensitive health/biometric data and explicit consent.  
   Project application: Health/Diet data requires explicit consent, must not use default-checked consent, and must be protected appropriately.

2. **Law on Residence 2020 (Luật Cư trú 2020)**  
   Focus area: mandatory temporary-residence declaration for domestic and foreign Guests.  
   Project application: check-in collects required identification information; the data is protected at rest; authorized management can produce the daily residence-declaration report required by the project scope.

### B. Hospitality & Wellness Domain Operations

3. **Global Wellness Institute (GWI) Standards / Wellness Taxonomy**  
   Focus area: taxonomy and terminology for wellness tourism.  
   Project application: Retreat Package master data should use wellness-domain terminology instead of generic hotel wording.

4. **Guest Folio & Night Audit Practices (AHLEI-oriented research)**  
   Focus area: accounting mechanisms in which point-of-sale services such as Spa and F&B post charges to a central Guest Folio.  
   Project application: Module 5 aggregates Package, Spa, and F&B charges using the booking as the primary business link.

### C. Technical Synthesis

5. **Encryption and Concurrency Research**  
   Focus areas: encryption of sensitive data at rest, RBAC enforcement, transactional/concurrency controls, and prevention of Spa resource double-booking.

## 7. Module Integration Summary

The six modules form one end-to-end business flow:

`Authentication & Health Profile -> Retreat Booking & Deposit -> Check-In & Villa Assignment -> Spa/Therapy + F&B Operations -> Guest/Villa Folio -> Consolidated Checkout & Analytics`

**Module 6 (System Administration & Permission Management)** operates across the whole system to control permissions, configuration, feature flags, auditability, and management visibility.

The system-wide integrations are:

- **M1 <-> M6:** account roles and permission matrix;
- **M2 / M5 <-> VNPay:** deposit and final payment;
- **M3 <-> Google Calendar / Email:** session synchronization and reminder;
- **M2 + M3 + M4 -> M5:** package/service charges aggregated into the Folio and consolidated invoice.

---

**End of Revised HSWRMS Project Specification**
