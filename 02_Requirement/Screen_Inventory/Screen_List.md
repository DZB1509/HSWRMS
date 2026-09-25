# HSWRMS Screen List

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Purpose:** Baseline screen inventory for UI prototyping, Screen Flow, SRS completion, and Antigravity Agent context.  
**Status:** Working baseline. Screens may be added, merged, renamed, or refined when Screen Flow and UI design reveal a genuine need. Keep numbering synchronized before SRS freeze.

---

## 1. Public / Shared Screens

| # | Screen Name | Module / Feature | Primary Actor(s) | Description |
|---:|---|---|---|---|
| 1 | Public Landing | Common / M1-M2 | Public / Shared | Public entry screen providing access to retreat packages, registration and login. |
| 2 | Customer Dashboard | M1 – Authentication | Customer | Main post-login navigation screen for Customer, providing access to bookings, spa sessions, meals, profile and folio. |
| 3 | Register | M1 – Authentication | Customer | Allows a new Customer to create an HSWRMS account using required personal and authentication information. |
| 4 | Email OTP Verification | M1 – Authentication | Customer | Allows Customer to enter the OTP sent by email to verify the registered account. |
| 5 | Login | M1 – Authentication | Public / Shared | Allows users to sign in using email/password or initiate supported Google/Facebook SSO. |
| 6 | Password Reset | M1 – Authentication | Public / Shared | Allows a user to request and set a new password when login credentials are forgotten. |
| 7 | Account Settings | M1 – Authentication | Authenticated User | Allows an authenticated user to manage basic account and security settings, including password change. |

---

## 2. Module 1 – Authentication & Sensitive Health Profile

| # | Screen Name | Feature | Primary Actor(s) | Description |
|---:|---|---|---|---|
| 8 | Health & Dietary Profile | M1 – Health Profile | Customer | Allows Customer to view, create and update allergy, dietary and treatment-relevant health information with explicit consent. |
| 9 | Health Data Deletion Request | M1 – Health Profile | Customer | Allows Customer to request deletion or anonymization of eligible health and allergy data after retreat completion. |
| 10 | Staff Account List | M1 – Staff Account Management | Admin | Allows Admin to view and search staff accounts and their assigned roles/status. |
| 11 | Staff Account Detail | M1 – Staff Account Management | Admin | Allows Admin to create, edit, assign roles to or deactivate a staff account. |
| 12 | Master Data Management | M1 – Master Data | Admin | Allows Admin to manage master data such as Villa Categories, Spa Services and Retreat Packages. |

---

## 3. Module 2 – Retreat Booking & Accommodation

| # | Screen Name | Feature | Primary Actor(s) | Description |
|---:|---|---|---|---|
| 13 | Retreat Package List | M2 – Retreat Booking | Customer | Displays available retreat packages and allows Customer to filter packages by wellness goal or relevant criteria. |
| 14 | Retreat Package Detail | M2 – Retreat Booking | Customer | Displays package description, included services, duration, villa options and information required before booking. |
| 15 | Retreat Booking Form | M2 – Retreat Booking | Customer | Allows Customer to select retreat dates, package options and villa type and provide required booking information. |
| 16 | Booking Summary & Deposit | M2 – Retreat Booking | Customer | Shows booking summary, deposit amount and payment information before redirecting the Customer to VNPay. |
| 17 | Deposit Payment Result | M2 – Retreat Booking | Customer | Displays the returned deposit payment result and confirmed booking information after VNPay processing. |
| 18 | My Bookings | M2 – Booking Management | Customer | Displays the Customer's current and historical retreat bookings. |
| 19 | Booking Detail & Itinerary | M2 – Booking Management | Customer | Displays booking status, retreat information, accommodation details and itinerary timeline. |
| 20 | Receptionist Dashboard | M2 – Front Desk | Receptionist | Main operational navigation screen for Receptionist, including arrivals, check-in, villa operations and checkout access. |
| 21 | Daily Arrivals | M2 – Check-In | Receptionist | Displays Customers expected to arrive and allows Receptionist to open the relevant booking for check-in. |
| 22 | Check-In & Residence Information | M2 – Check-In | Receptionist | Allows Receptionist to verify the Customer and collect required identification and residence information for check-in. |
| 23 | Villa Assignment | M2 – Check-In | Receptionist | Allows Receptionist to assign an available physical villa to a confirmed booking during check-in. |
| 24 | Villa Status Management | M2 – Accommodation Operations | Receptionist | Allows Receptionist to view and update operational villa status such as Available, Occupied or Maintenance. |

---

## 4. Module 3 – Spa & Therapy Scheduling

| # | Screen Name | Feature | Primary Actor(s) | Description |
|---:|---|---|---|---|
| 25 | Spa Treatment List | M3 – Spa Scheduling | Customer | Displays Spa/Therapy services available to the Customer, including services included in the retreat package. |
| 26 | Spa Session Booking | M3 – Spa Scheduling | Customer | Allows Customer to select a Spa/Therapy service, date and requested time slot. The system validates both Therapist and Treatment Room availability. |
| 27 | Available / Alternative Slot Selection | M3 – Spa Scheduling | Customer | Displays available or alternative time slots when the originally requested Therapist and Treatment Room combination is unavailable. |
| 28 | Spa Booking Confirmation | M3 – Spa Scheduling | Customer | Displays confirmed Spa/Therapy session information after both Therapist and Treatment Room have been successfully reserved. |
| 29 | My Spa Sessions | M3 – Spa Scheduling | Customer | Displays upcoming and historical Spa/Therapy sessions belonging to the Customer. |
| 30 | Manual Extra Spa Booking | M3 – Extra Spa Service | Receptionist | Allows Receptionist to select a Customer and manually book an extra Spa/Therapy service, with the charge posted to the Customer Folio. |
| 31 | Therapist Dashboard | M3 – Therapist Operations | Spa Therapist / Yoga Instructor | Main screen showing assigned work and access to the daily schedule. |
| 32 | Therapist Daily Schedule | M3 – Therapist Operations | Spa Therapist / Yoga Instructor | Displays Spa/Therapy sessions assigned to the logged-in Therapist for the selected working day. |
| 33 | Therapist Session Detail | M3 – Therapist Operations | Spa Therapist / Yoga Instructor | Displays assigned session details and only treatment-relevant health notes; allows Therapist to mark the session Completed or No-Show. |

---

## 5. Module 4 – Dietary F&B Management

| # | Screen Name | Feature | Primary Actor(s) | Description |
|---:|---|---|---|---|
| 34 | Dietary Menu | M4 – Dietary F&B | Customer | Displays meal options filtered according to the Customer's relevant allergy and dietary profile. |
| 35 | Daily Meal Selection | M4 – Dietary F&B | Customer | Allows Customer to pre-select meals for the applicable retreat day. |
| 36 | Extra A-la-carte Order | M4 – Extra F&B | Customer | Allows Customer to select and order additional F&B items that are charged to the Customer Folio. |
| 37 | My Meal Plan / Orders | M4 – Dietary F&B | Customer | Allows Customer to view selected daily meals and submitted additional F&B orders. |
| 38 | F&B Dashboard | M4 – F&B Operations | F&B Staff / Chef | Main operational screen providing access to daily meal preparation requirements. |
| 39 | Daily Meal Prep List | M4 – F&B Operations | F&B Staff / Chef | Displays aggregated meal orders and preparation workload for Chef/F&B Staff. |
| 40 | Meal Order Detail | M4 – F&B Operations | F&B Staff / Chef | Displays meal order details and only relevant allergy/dietary warnings; allows F&B Staff to update status from Preparing to Ready. |

---

## 6. Module 5 – Checkout & Analytics

| # | Screen Name | Feature | Primary Actor(s) | Description |
|---:|---|---|---|---|
| 41 | Customer Folio & Consolidated Invoice | M5 – Checkout | Receptionist | Displays consolidated Package, Spa and F&B charges for the selected stay and identifies any outstanding amount. |
| 42 | Final Payment | M5 – Checkout | Receptionist / Customer | Allows final payment to be initiated only when applicable charges have been consolidated and checkout requirements are satisfied. |
| 43 | Final Payment Result | M5 – Checkout | Receptionist / Customer | Displays the result returned from the payment process and indicates whether payment was successfully confirmed. |
| 44 | Checkout Confirmation | M5 – Checkout | Receptionist / Customer | Displays successful checkout after payment is confirmed and the booking and villa operational statuses have been updated. |
| 45 | Review & Rating | M5 – Customer Feedback | Customer | Allows Customer to submit a rating and review for a completed retreat stay, either from HSWRMS or an emailed review link. |
| 46 | Revenue Dashboard | M5 – Analytics | Manager | Allows Manager to view revenue information and breakdowns across Retreat Package, Spa and F&B services. |
| 47 | Occupancy Report | M5 – Analytics | Manager | Allows Manager to view accommodation occupancy information and export permitted report data. |
| 48 | Therapist Utilization Report | M5 – Analytics | Manager | Allows Manager to view Therapist utilization information and export permitted report data. |

> **Note:** Some draft Screen Flow fragments may currently use different numbering/names for M5. Before SRS freeze, synchronize this list, the Master Screen Flow and all M5 diagrams to one final numbering scheme.

---

## 7. Module 6 – System Administration & Permission Management

| # | Screen Name | Feature | Primary Actor(s) | Description |
|---:|---|---|---|---|
| 49 | Admin Dashboard | M6 – System Administration | Admin | Main administration navigation screen for Admin, providing access to configuration, permissions, security and audit functions. |
| 50 | Business Parameters | M6 – System Administration | Admin | Allows Admin to configure business parameters such as cancellation windows, refund percentages and other configurable rules. |
| 51 | Feature Flag Management | M6 – System Administration | Admin | Allows Admin to enable or disable supported system features or modules using feature flags. |
| 52 | Permission Matrix | M6 – Permission Management | Admin | Allows Admin to configure detailed role-to-screen and role-to-function access permissions. |
| 53 | Limited Admin Rights Delegation | M6 – Permission Management | Admin | Allows Admin to grant or revoke a limited subset of administrative capabilities for Manager. |
| 54 | Sensitive Data Audit Log | M6 – Audit & Security | Admin | Allows Admin to review logged access and sensitive-data related activities for security and accountability. |
| 55 | Manager Dashboard | M6 – Management Monitoring | Manager | Main navigation screen for Manager, providing access to authorized management dashboards, reports and system overview. |
| 56 | System Overview Dashboard | M6 – System Monitoring | Admin / Manager | Displays a system-level operational overview according to granted permissions. |

---

## 8. Actor Color Convention for Screen Flow

| Actor / Type | Color | Hex |
|---|---|---|
| Public / Shared | Gray | `#E0E0E0` |
| Customer | Green | `#C8E6C9` |
| Receptionist | Yellow | `#FFF3B0` |
| Therapist / Yoga Instructor | Purple | `#D1C4E9` |
| F&B Staff / Chef | Orange | `#FFD8A8` |
| Manager | Teal | `#B2DFDB` |
| Admin | Blue | `#BBDEFB` |

---

## 9. Screen Flow Guidance

- Each module owner may first draw a **Screen Flow Fragment** for their module.
- A fragment must show:
  - screens belonging to the module,
  - navigation/transition between screens,
  - external entry/exit points,
  - actor access,
  - agreed actor colors.
- Screen numbering does **not** imply that users must navigate through screens in numerical order.
- Do not model backend-only processing as a screen.
- The final deliverable is **one Master Screen Flow for the whole HSWRMS project**.
- Shared screens should be merged rather than duplicated.
- Before SRS freeze, synchronize:
  - Screen List,
  - Master Screen Flow,
  - UI prototype,
  - Functional Requirements.

---

## 10. Important Business Constraints Affecting UI

1. **Spa booking confirmation:** both a specific Therapist and a specific Treatment Room must be available for the selected slot before the session can be confirmed.
2. **Checkout blocking:** checkout cannot be completed while unpaid/pending extra Spa or F&B charges remain.
3. **Payment vs Checkout:** payment success is not the same as checkout completion. Booking and villa statuses must be updated before checkout is shown as completed.
4. **Health-data minimization:**
   - Therapist sees only treatment-relevant health notes.
   - F&B/Chef sees only allergy/dietary information relevant to food preparation.
   - Receptionist should not see unnecessary sensitive health/diet information.
5. **Review:** Review & Rating is post-checkout and optional.
6. **Manager access:** Manager is not a full Admin; Manager primarily has restricted/read-only monitoring and reporting access.

---

## 11. Current Prototype Goal

For the current UI/demo phase:

- The screens above are the baseline scope.
- Real backend functionality is not required yet.
- Mocked data and simulated states are acceptable.
- The UI must still respect the real business rules and actor permissions.
- If a new screen is introduced during Screen Flow/UI refinement, update this file first or update it together with the diagram so the project stays synchronized.
