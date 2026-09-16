## SOFTWARE DEVELOPMENT PROJECT SPECIFICATION

Course: Software Development Project (SWP391) | Group Size: 5 Students | Project Code: SWP391-HOS-03 | Lecturer: ManhNC5@fpt.edu.vn

## Project Title: Xoai Aura Retreat - A Wellness Resort & Spa Management System

Domain Application: Hospitality, Wellness Tourism, Healthcare, E-Commerce

## 1. Problem Statement

Traditional Property Management Systems (PMS) are designed for standard hotels where guests simply book a room and occasionally eat at the restaurant. However, modern Wellness Resorts (Khu nghi dwéng tri liéu) operate differently. Guests often book "Retreat Packages" (e.g., a 5- day Detox Journey, a 3-day Yoga Retreat) that include accommodations, specific medical/dietary meal plans, and tightly scheduled Spa and therapy sessions.

Managing these bundled experiences is a logistical nightmare for resort staff. Xoai Aura Retreat is proposed to solve this by providing an integrated platform that handles Villa bookings, complex Spa scheduling (matching therapists with treatment rooms), personalized dietary management, and consolidated billing, all while strictly protecting the guest's sensitive health and allergy data.

## 2. Third-Party Tool Interface

To ensure industry standards, the system must integrate the following external APIs (simulated or real):

- 1. Payment Gateway API (Stripe / VNPay Sandbox / PayPal):

- « Function: To securely process online deposits for Retreat Packages and handle final checkout payments.

- 2. Calendar & Notification API (Google Calendar API / SendGrid):

- Function: To automatically sync Spa/Yoga schedules to the guest's personal calendar and send email reminders 1 hour before a therapy session.

- 3. Authentication API (Google Identity / Facebook Login):

- \+ Function: To provide secure Single Sign-On (SSO) for seamless guest registration.

## 3. External Entity Specification (Actors)

- 1. Guest (Customer): Books retreat packages, fills out dietary/health profiles, schedules spa treatments, and views their itinerary.

- 2. Receptionist (Front Desk): Manages check-in/check-out, assigns physical villas, and processes consolidated invoices.

- 3. Spa Therapist / Yoga Instructor: Views their daily working schedule, checks guest health notes before treatments, and marks sessions as completed.

- 4. F&B Staff / Chef: Views the daily dietary requirements of checked-in guests to prepare personalized meals without seeing unnecessary private medical data.

- 5. System Manager (Admin): Manages master data (Villas, Packages, Spa Services, Staff) and views revenue dashboards.

## 4. Use Cases / User Stories

This project is architected into 5 independent but interconnected modules. Each student must take ownership of one module (Full-stack: DB -> DAO -> Controller -> Ul).

Module 1: Authentication & Sensitive Health Profile (Assigned to Student 1)

- UCO01: As a guest, | want to register, verify my email, and securely log in.

- UCO02: As a Guest, | want to complete my "Dietary & Health Profile" (e.g., vegan, peanut allergy, back pain). Constraint: The Ul must use explicit, unchecked consent boxes for collecting this sensitive data (per Decree 356/2025).

- UCO03: As an Admin, | want to manage staff accounts and assign strict Roles (Therapist, Chef, Receptionist) to limit data access.

- UCO04: As an Admin, | want to manage Master Data for Villa Categories, Spa Services, and Retreat Packages.

- UCO05: As a Guest, | want to exercise my "Right to Deletion", permanently removing my health and allergy data from the system after my retreat ends.

Module 2: Retreat Pack & Accor dation Booking (Assigned to Student 2)


- \+ UCO06: As a Guest, | want to browse available "Retreat Packages" and filter them by goal (e.g., Weight Loss, Stress Relief, Yoga).

- \+ UCO7: As a Guest, | want to select a package, choose my dates, select a Villa type, and pay a deposit securely.

- \+ UCO08: As a Receptionist, | want to view a dashboard of expected arrivals and perform Check-In (assigning a specific Villa number).

- \+ UCO09: As a Receptionist, | want to manage physical Villa statuses (Available, Occupied, Maintenance).

- \+ UC10: As a Guest, | want to view my overall booking details and itinerary timeline.

## Module 3: Spa & Therapy Scheduling Engine - CORE 1 (Assigned to Student 3 - High Complexity)

- UC11: As a Guest (who has booked a package), | want to schedule my included Spa/Therapy sessions by picking a date and time slot.

- UC12: As the System, | must automatically find an available slot by matching an Available Therapist AND an Available Treatment Room simultaneously.

- UC13: As a Spa Therapist, | want to view my daily schedule and access the specific health notes (e.g., back pain) of my assigned guests.

- UC14: As a Spa Therapist, | want to mark a session as "Completed" or "No-Show".

- UC15: As a Receptionist, | want to manually book extra Spa services for a guest and charge it to their Villa folio.

## Module 4: Dietary F&B Management - CORE 2 (Assigned to Student 4)

- UC16: As a Guest, | want to pre-select my daily meals from a menu that is automatically filtered based on my allergy/dietary profile.

- UC17: As a Chef/F&B Staff, | want to view a "Daily Meal Prep Dashboard" showing aggregated meal orders and specific allergy warnings for the day.

- UC18: As a Chef, | want to update the status of a meal order (Preparing -> Ready for Delivery).

- UC19: As a Guest, | want to order extra a-la-carte drinks/food outside my package and charge them to my Villa.

- UC20: As the System, | must mask the Guest's full medical history from the Chef, only displaying relevant "Food Allergies" (Data Minimization principle).

## Module 5: Consolidated Checkout & Analytics (Assigned to Student 5)

- UC21: As a Receptionist, during Check-Out, | want to generate a Consolidated Invoice that sums up the remaining Package Cost, Extra Spa Services, and Extra F&B Orders.

- \+ UC22: As a Receptionist, | want to process the final payment and change the Villa status to Vacant/Needs Cleaning.

- \+ UC23: As a Guest, after checking out, | want to submit a review and rating for my Retreat experience.

- UC24: As a Manager, | want to view a Revenue Dashboard (Pie charts/Bar charts) breaking down income by Packages, Spa, and F&B.

- \+ UC25: As a Manager, | want to export a monthly "Occupancy & Therapist Utilization" report to Excel.

## 5. Business Rules (Strict Constraints)

- 1. 2-Dimensional Double-Booking Prevention (Spa): A Spa booking is only valid if both a specific Therapist AND a specific Treatment Room are available at the requested time. The database transaction must lock both resources simultaneously.

- 2. Consolidated Billing Constraint: A guest CANNOT be checked out if they have pending/unpaid extra Spa or F&B orders.

- 3. Data Minimization (RBAC):

- Therapists can only see health data related to physical treatments (e.g., injuries, back pain).

- Chefs can only see dietary allergies (e.g., peanut allergy, vegan).

- Receptionists cannot see either. This must be enforced in the backend SQL queries and Controllers.

## 6. References & Domain Knowledge (Mandatory Research)

Students must research the following domain-specific regulations and integrate them into the Database Design and Ul.

## A. Legal Compliance & Data Protection

- 1. Vietnam Decree 356/2025/ND-CP on Personal Data Protection (Effective Jan 1, 2026):

- Focus Area: Article 4 (Sensitive Data - Health & Biometrics) and Article 6 (Explicit Consent).

- « Project Application: Dietary requirements (e.g., diabetic diets, severe allergies) and physical conditions are sensitive medical data. The Ul must NOT use "default checked" boxes for data collection. Module 1 must implement database encryption for these fields.

- 2. Law on Residence 2020 (Luat Cw tru 2020):

- \+ Focus Area: Mandatory temporary residence declaration for domestic and foreign guests.

- \+ Project Application: The Check-in process (Module 2) must collect necessary ID data to allow the Manager to export a daily report for local police, while ensuring this ID data is encrypted at rest.

## B. Hospitality & Wellness Domain Operations

- 3. Global Wellness Institute (GWI) Standards:

- \* Focus Area: Taxonomy of Wellness Tourism.

- \* Project Application: Guides the Master Data setup for "Retreat Packages". Students should use industry-standard terms (e.g., Mindfulness


Retreat, Detoxification, Ayurveda) rather than generic hotel terms.

(End of Project Specification)
