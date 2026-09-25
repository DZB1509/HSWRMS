# HSWRMS Front-End Prototype — Implementation Plan (Final Baseline)

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Revision:** Final Baseline with SRS & Inventory Alignment (September 2026)  
**Primary Requirement Sources:**
- `AGENTS.md`
- `02_Requirement/SRS/HSWRMS_ISP392_G1_SRS.pdf`
- `02_Requirement/Project_Specification/HSWRMS_ISP392_Project_Specification.md`
- `02_Requirement/Screen_Inventory/Screen_List.md`
- `03_Design/UI_UX/HSWRMS_DESIGN.md`

**Status:** Awaiting Approval — **No code, packages, or scaffolding until approved.**

---

## 1. Executive Summary & Objective

The objective is to build a **high-fidelity front-end UI prototype/demo** of HSWRMS for presentation purposes.
- **Focus:** Page structure, navigation, role-based layouts, quiet-luxury visual design, exact 56-screen inventory coverage, realistic mock data, and simulated UI states.
- **Constraints:** No production backend, no real database, no live external API connections (VNPay, Google/Facebook SSO, Google Calendar, SendGrid).
- **UI/UX Truth:** `HSWRMS_DESIGN.md` (warm sand/stone/forest palette, Cormorant Garamond + Inter typography, restrained quiet luxury).
- **Terminology:** **"Customer"** must be used consistently instead of "Guest" (per `AGENTS.md`).
- **Official Screen Count:** Exactly **56 baseline screens** per `Screen_List.md`. No new numbered screens are introduced. Role-specific presentations (such as customer-facing read-only folio views) are implemented as role-adapted views of documented capabilities.

---

## 2. SRS Extraction: Business Rules, Actors, Flows & Integration Nuances

Following a comprehensive review of `HSWRMS_ISP392_G1_SRS.pdf`, the following requirements directly shape the front-end prototype:

### 2.1 Actor Model & Authentication State
- **Unauthenticated State:** Public visitor (can browse Landing, Retreat Packages, Package Details, Login, Register, OTP, Password Reset).
- **6 Authenticated Roles:**
  1. **Customer:** Maintains dietary/health profile with explicit consent; browses and books retreat packages; pays deposit via VNPay; schedules included spa sessions; pre-selects daily meals; orders extra a-la-carte items; views booking details and personal stay charges; submits post-checkout review.
  2. **Receptionist:** Manages daily arrivals; performs identity verification & temporary residence registration (Law on Residence 2020); assigns physical villas; manages villa operational statuses; manually books extra spa services for customers; reviews customer folio; generates consolidated invoice; processes checkout payment (Cash or VNPay); releases villa.
  3. **Spa Therapist / Yoga Instructor:** Views assigned daily schedule; accesses **treatment-relevant health notes only** for assigned customers; marks sessions **Completed** or **No-Show** (mutually exclusive).
  4. **F&B Staff / Chef:** Views daily meal preparation workload; sees **relevant food allergy/dietary warnings only** (medical history strictly masked); transitions meal orders from Preparing to Ready.
  5. **Manager:** Restricted least-privilege role (not an Admin). Views management dashboards (Revenue, Occupancy, Therapist Utilization) and operational overview. May receive explicitly delegated limited administrative rights.
  6. **Admin:** System administrator. Manages staff accounts, master data (Villa categories, Spa services, Retreat packages), business parameters, feature flags, permission matrix, limited admin delegation, and sensitive-data audit logs.

### 2.2 External System Interfaces (Simulated in Prototype)
1. **VNPay Payment Gateway:** Simulated deposit payment flow (M2) and checkout QR/Card payment flow (M5).
2. **Google Calendar:** Simulated appointment sync confirmation for completed spa bookings (M3).
3. **Email Notification Service (SendGrid/Compatible):** Simulated email OTP dispatch (M1), 1-hour therapy reminder (M3), and post-checkout e-Invoice & Rating link dispatch (M5).
4. **Google Identity & Facebook Login:** Simulated Social SSO buttons on login/register modals (M1).

### 2.3 Core Business Flows & Front-End Rules
- **BF-01 (Customer Onboarding & Wellness Profile):** Health & Dietary profile collection requires an **explicit, unchecked consent checkbox** (Vietnam Decree on Personal Data Protection). Post-retreat health data deletion request (UC05) is submitted by Customer via Screen 9.
- **BF-02 (Retreat Booking & Check-In):** Customer booking requires package selection, dates, villa type, and deposit via VNPay. Receptionist check-in requires collecting customer identification/residence data, physical villa assignment, and updating villa status to Occupied (Screens 20–24).
- **BF-03 (Spa/Therapy 2D-Lock Scheduling):** A spa slot is confirmed **only** when both an eligible Therapist **and** an available Treatment Room are simultaneously reserved. If unavailable, alternative available slots are displayed (Screen 27). Completed vs. No-Show outcomes are mutually exclusive. Extra spa bookings by Receptionist automatically post charges to the customer folio.
- **BF-04 (Personalized Dining):** Customer meal menu is filtered by allergy/dietary preferences. Extra a-la-carte orders post charges to the folio. Kitchen dashboard displays allergen warnings prominently while concealing unrelated health notes.
- **BF-05 (Consolidated Checkout & Billing Guard):**
  - Checkout is initiated and controlled at the Front Desk by the **Receptionist** via `Room_Booking_ID`.
  - **Billing Guard (BR-02):** HSWRMS checks for pending/unsettled extra charges. If pending charges exist, checkout is blocked and an alert is shown.
  - Once resolved, consolidated invoice aggregates remaining retreat balance + extra spa charges + extra F&B charges + taxes.
  - Payment options supported: **Cash** (Receptionist records receipt) or **VNPay** (QR code/terminal).
  - **Payment Success ≠ Checkout Completion (BR-UI-03):** Payment confirmation triggers booking closure, stay status update to "Checked-Out", and villa status update to "Vacant Needs Cleaning".
  - **Review & Rating (UC23):** Triggered post-checkout via email link or customer portal. Optional; does not block checkout.
- **BF-06 (Administration & Delegation):** Admin can delegate specific capabilities (business parameters, feature flags, audit log viewing, police residence report export) to the Manager without granting full Admin rights.

---

## 3. Technology Stack & Design System Alignment

| Layer | Selection | Justification |
|---|---|---|
| **Build Tool** | Vite | Lightning-fast HMR, lightweight, native ES modules |
| **Framework** | React 18+ (TypeScript) | Strong component isolation, robust type definitions for domain entities |
| **Routing** | React Router v6 | Nested layouts, dynamic params, role guards, programmatic redirects |
| **Styling** | Vanilla CSS + CSS Custom Properties | Implements `HSWRMS_DESIGN.md` §17 design tokens directly without framework bloat |
| **Typography** | Cormorant Garamond (Display) + Inter (Body/UI) | Loaded via Google Fonts per design system specification |
| **Icons** | Lucide React | High-clarity minimalist line icons matching quiet-luxury aesthetic |
| **Charts** | Recharts | Composable React chart components for Manager/Admin analytics |
| **State Management** | React Context (`AuthContext`, `MockDataContext`) | Centralized state for simulated authentication, active role, and mock entities |

---

## 4. Re-Evaluation of Architectural Decisions & Screen Inventory

### 4.1 Customer Folio: Role-Specific View, Not an Additional Screen
- **Inventory Rule:** The baseline screen inventory contains exactly **56 screens**. Screen 41 is titled *"Customer Folio & Consolidated Invoice"*.
- **Role Adaptation:**
  - In the **Receptionist** workspace, Screen 41 (`/receptionist/folio/:bookingId`) serves as the operational checkout console with billing guard checks, charge reconciliation, and invoice finalization.
  - In the **Customer** workspace, the route `/customer/folio` is implemented as a **read-only view/variant of the Screen 41 folio capability**, allowing the in-house customer to review itemized retreat, spa, and dining charges without front-desk settlement controls.
  - This strictly adheres to the 56-screen inventory without inventing an extra numbered screen.

### 4.2 Receptionist Ownership of Screens 42–44 (Payment & Checkout)
- **SRS Alignment:** SRS BF-05 shows the checkout payment workflow occurring at the Front Desk under the control of the Receptionist. UC22 explicitly defines the actor as Receptionist.
- **Resolution:**
  - Primary routes for Screens 42–44 are placed under `/receptionist/checkout/:bookingId/payment`, `/receptionist/checkout/:bookingId/payment-result`, and `/receptionist/checkout/:bookingId/confirmation`.
  - When VNPay is selected, the Receptionist screen presents a customer-facing QR code overlay or modal simulating the customer scanning and paying at the desk.
  - Customer routes `/customer/checkout/...` are omitted to avoid violating the front-desk checkout guard and physical villa release lifecycle.

### 4.3 Public Accessibility of Retreat Packages (Screens 13 & 14)
- **SRS Reality:** SRS BF-02 explicitly starts with the Customer searching and browsing retreat packages and checking availability.
- **Resolution:**
  - Routes `/retreats` and `/retreats/:id` are **Public** (rendered inside `PublicLayout`).
  - When an unauthenticated visitor clicks "Book Retreat", they are directed to `/login?redirect=/customer/booking/new?packageId=:id`.
  - When an authenticated Customer navigates to packages, they see the catalog inside `CustomerLayout` (`/customer/retreats`).

### 4.4 Screen 56 (System Overview Dashboard): Strictly Documented Scope
- **Boundary Rule:** No ungrounded technical metrics (e.g. server CPU/memory, database connection pool, active WebSocket sessions, background queue latency) will be created.
- **SRS Scope (BF-06 & Figure 7):** Screen 56 is strictly limited to:
  1. High-level resort operational indicators (overall occupancy percentage, active daily retreat stays, daily spa session summary, kitchen meal order totals).
  2. System-wide permission-governed status overview (active module feature flags, recent system audit summary).
  3. Confirmed legal compliance export action: **"Export Police Residency Declaration Report (Luật Cư trú 2020)"**.

### 4.5 Health Data Deletion Administration (Screen 9 vs. Admin Side)
- **Customer Side:** Screen 9 (*Health Data Deletion Request*) is the confirmed customer-facing screen to request deletion/anonymization post-retreat.
- **Admin Side:** SRS Module 6 diagram (Figure 7) includes an Admin task *"Manage Data Privacy & Deletion (Execute Soft-Delete)"*. However, the official Screen Inventory does not define a dedicated screen for Admin deletion approval.
- **Status:** **Marked as Unresolved / Derived.** In Phase 1 and Phase 6, we do not assume a permanent placement inside Screen 54 or Screen 12. Until the team confirms whether this should be a tab in Audit Log, a feature flag, or a separate view, the prototype will focus on Screen 9 for the customer submission and mock the Admin soft-delete status in the data layer.

### 4.6 Spa Alternative-Slot Navigation (Screen 27)
- **SRS Reality:** SRS BF-03 flow chart (p. 10) explicitly branches to "Find Alternative Available Slots" -> "Review Suggested Alternative Slots" -> "Select Alternative Time Slot".
- **Resolution:** Maintained as a dedicated route `/customer/spa/alternatives` (Screen 27), matching Screen List #27 1-to-1.

---

## 5. Identified Inconsistencies & Conflicts Between Project Documents

| ID | Conflict | Source A | Source B | Architectural Resolution for Prototype |
|---|---|---|---|---|
| **C-1** | **Customer vs. Guest Terminology** | `AGENTS.md` (Mandatory Rules): *"Use the term Customer consistently instead of Guest."* | `SRS PDF` (pp. 5, 6, 8, 15, 16): Uses *"Guest"*, *"Guest Folio"*, *"Guest Verification"* throughout. | **Prototype strictly follows `AGENTS.md`**: All UI copy, navigation, forms, and mock models use **"Customer"**. |
| **C-2** | **Checkout Actor Attribution (Screens 42–44)** | `SRS PDF` (BF-05, UC21, UC22): Checkout is operated exclusively by the Receptionist at the Front Desk. | `Screen_List.md` (Screens 42–44): Lists Primary Actor(s) as *"Receptionist / Customer"*. | **Receptionist owns checkout execution**: Routes are placed under `/receptionist/checkout/...`. Customer sees payment QR code during front-desk interaction. |
| **C-3** | **Checkout Payment Methods** | `SRS PDF` (BF-05 p. 12 & Fig. 6 p. 23): Explicitly details both **Cash** and **Card/VNPay** paths at checkout. | `Project Specification` (§2.1, §4 UC22): Emphasizes VNPay as the primary payment gateway. | **Support both Cash and VNPay** options on the Receptionist final payment screen. |
| **C-4** | **Legacy Acronym "AWRMS"** | `SRS PDF` (p. 5 Acronym table, p. 6 Context Diagram text): Contains leftover references to *"AWRMS"*. | `AGENTS.md` & `Project Specification`: Name is strictly **HeavenStay Wellness Resort Management System (HSWRMS)**. | **Strictly use HSWRMS** across all headers, titles, mock data, and metadata. |
| **C-5** | **Police Residency Declaration Reporting** | `SRS PDF` (Figure 7, Module 6 diagram): Explicitly models *"Export Police Residency Report"* extending System Overview. | `Screen_List.md`: Does not assign a standalone screen number for Police Declaration. | **Embed export action in Screen 56** (System Overview Dashboard) rather than creating an unlisted screen. |
| **C-6** | **Health Data Deletion Execution Location** | `SRS PDF` (Figure 7 p. 24): Admin executes *"Manage Data Privacy & Deletion (Execute Soft-Delete)"*. | `Screen_List.md`: Only lists Screen 9 (Customer request). Admin side is unassigned. | **Marked as Unresolved/Derived**: Implemented in data layer; UI placement pending team confirmation. |

---

## 6. RoleSwitcher Architecture & State Model

### 6.1 Separation of Authentication State from Roles
- **Unauthenticated (Public):** `isAuthenticated = false`, `currentUser = null`, `activeRole = null`.
- **Authenticated Roles (Exactly 6):**
  1. `customer`
  2. `receptionist`
  3. `therapist`
  4. `fb_staff`
  5. `manager`
  6. `admin`

### 6.2 Developer RoleSwitcher Widget
A floating, collapsible dev toolbar fixed at the bottom-right of the viewport:
- **State Toggle:** `[ Public / Logged Out ]` button.
- **Role Buttons:** 6 distinct persona buttons (Customer, Receptionist, Therapist, Chef, Manager, Admin).
- **Behavior:** Clicking a role instantly switches the `AuthContext`, sets current mock user data, and navigates to the role's default dashboard with feedback toast.

---

## 7. Complete Route Architecture (56 Baseline Screens Mapped)

```text
/ (PublicLayout)
├── / (Screen 1: Public Landing)
├── /retreats (Screen 13: Retreat Package List - Public)
├── /retreats/:id (Screen 14: Retreat Package Detail - Public)
├── /login (Screen 5: Login)
├── /register (Screen 3: Register)
├── /register/verify (Screen 4: Email OTP Verification)
└── /password-reset (Screen 6: Password Reset)

/customer/* (CustomerLayout - Guard: Customer)
├── /customer/dashboard (Screen 2: Customer Dashboard)
├── /customer/account (Screen 7: Account Settings)
├── /customer/health-profile (Screen 8: Health & Dietary Profile)
├── /customer/health-profile/deletion (Screen 9: Health Data Deletion Request)
├── /customer/retreats (Screen 13: Retreat Package List - Authenticated)
├── /customer/retreats/:id (Screen 14: Retreat Package Detail - Authenticated)
├── /customer/booking/new (Screen 15: Retreat Booking Form)
├── /customer/booking/summary (Screen 16: Booking Summary & Deposit)
├── /customer/booking/deposit-result (Screen 17: Deposit Payment Result)
├── /customer/bookings (Screen 18: My Bookings)
├── /customer/bookings/:id (Screen 19: Booking Detail & Itinerary)
├── /customer/spa (Screen 25: Spa Treatment List)
├── /customer/spa/book (Screen 26: Spa Session Booking)
├── /customer/spa/alternatives (Screen 27: Available / Alternative Slot Selection)
├── /customer/spa/confirmation (Screen 28: Spa Booking Confirmation)
├── /customer/spa/sessions (Screen 29: My Spa Sessions)
├── /customer/dining/menu (Screen 34: Dietary Menu)
├── /customer/dining/select (Screen 35: Daily Meal Selection)
├── /customer/dining/extra (Screen 36: Extra A-la-carte Order)
├── /customer/dining/orders (Screen 37: My Meal Plan / Orders)
├── /customer/folio (Screen 41: Customer Folio - Read-only View Variant)
└── /customer/review/:bookingId (Screen 45: Review & Rating - Post-checkout)

/receptionist/* (OperationalLayout - Guard: Receptionist)
├── /receptionist/dashboard (Screen 20: Receptionist Dashboard)
├── /receptionist/arrivals (Screen 21: Daily Arrivals)
├── /receptionist/check-in/:bookingId (Screen 22: Check-In & Residence Information)
├── /receptionist/check-in/:bookingId/villa (Screen 23: Villa Assignment)
├── /receptionist/villas (Screen 24: Villa Status Management)
├── /receptionist/spa/extra-booking (Screen 30: Manual Extra Spa Booking)
├── /receptionist/folio/:bookingId (Screen 41: Customer Folio & Consolidated Invoice)
├── /receptionist/checkout/:bookingId/payment (Screen 42: Final Payment)
├── /receptionist/checkout/:bookingId/payment-result (Screen 43: Final Payment Result)
└── /receptionist/checkout/:bookingId/confirmation (Screen 44: Checkout Confirmation)

/therapist/* (OperationalLayout - Guard: Therapist)
├── /therapist/dashboard (Screen 31: Therapist Dashboard)
├── /therapist/schedule (Screen 32: Therapist Daily Schedule)
└── /therapist/sessions/:id (Screen 33: Therapist Session Detail)

/fb/* (OperationalLayout - Guard: F&B Staff)
├── /fb/dashboard (Screen 38: F&B Dashboard)
├── /fb/meal-prep (Screen 39: Daily Meal Prep List)
└── /fb/orders/:id (Screen 40: Meal Order Detail)

/manager/* (ManagerAdminLayout - Guard: Manager)
├── /manager/dashboard (Screen 55: Manager Dashboard)
├── /manager/revenue (Screen 46: Revenue Dashboard)
├── /manager/occupancy (Screen 47: Occupancy Report)
├── /manager/therapist-utilization (Screen 48: Therapist Utilization Report)
└── /manager/system-overview (Screen 56: System Overview Dashboard - Manager View)

/admin/* (ManagerAdminLayout - Guard: Admin)
├── /admin/dashboard (Screen 49: Admin Dashboard)
├── /admin/staff (Screen 10: Staff Account List)
├── /admin/staff/:id (Screen 11: Staff Account Detail)
├── /admin/master-data (Screen 12: Master Data Management)
├── /admin/business-params (Screen 50: Business Parameters)
├── /admin/feature-flags (Screen 51: Feature Flag Management)
├── /admin/permissions (Screen 52: Permission Matrix)
├── /admin/delegation (Screen 53: Limited Admin Rights Delegation)
├── /admin/audit-log (Screen 54: Sensitive Data Audit Log)
└── /admin/system-overview (Screen 56: System Overview Dashboard - Admin View)
```

---

## 8. Shared Layouts & Component Architecture

### 8.1 Shared Layouts
1. **`PublicLayout`:** Transparent header transitioning to warm stone `#FAF9F6` on scroll; full-width hero container; public navigation links; luxury footer.
2. **`CustomerLayout`:** Refined top navigation bar with user profile dropdown, active booking shortcut, breadcrumbs, and quiet-luxury styling.
3. **`OperationalLayout`:** Compact, high-efficiency fixed left sidebar; contextual header with role badge, current resort date/time, and quick-filter toolbar (used by Receptionist, Therapist, F&B Staff).
4. **`ManagerAdminLayout`:** Extended operational layout featuring KPI summary strips, date-range selectors, report export triggers, and delegated-rights indicators.
5. **`AuthLayout`:** Minimalist centered card layout on soft canvas background with HeavenStay brand identity for login, registration, and recovery.

### 8.2 Reusable UI Component Library
- **Common:** `Button`, `StatusChip`, `Card`, `Modal`, `Drawer`, `Toast`, `AlertBanner`, `EmptyState`, `LoadingSkeleton`, `ConfirmDialog`.
- **Navigation:** `PublicNavbar`, `CustomerNavbar`, `OperationalSidebar`, `Breadcrumb`, `Footer`, `RoleSwitcher`.
- **Forms:** `TextInput`, `PasswordInput`, `OtpInput`, `Select`, `DatePicker`, `DateRangePicker`, `TimeSlotSelector`, `Checkbox`, `ConsentCheckbox`, `SearchInput`.
- **Data Display:** `DataTable`, `KpiCard`, `Timeline`, `SensitiveInfoCard`.
- **Schedule:** `DailySchedule`, `TimeSlotGrid`, `SessionCard`.

---

## 9. Revised Implementation Phases

### Phase 1 — Front-End Shell, Design Tokens & Routing Skeleton (FIRST STEP ONLY)
**Scope:** Scaffold project, design system, layouts, navigation, and placeholder routing.
- Initialize Vite + React + TypeScript in `04_Implement/Frontend_Prototype/`.
- Install only: `react-router-dom`, `lucide-react`, `recharts`.
- Create `tokens.css` with exact HSWRMS design tokens and `globals.css` with Google Fonts (Cormorant Garamond, Inter).
- Build the 5 shared layouts (`PublicLayout`, `CustomerLayout`, `OperationalLayout`, `ManagerAdminLayout`, `AuthLayout`).
- Build core UI components: `Button`, `StatusChip`, `Card`, `Modal`, `EmptyState`, `Toast`, `RoleSwitcher`.
- Implement `AuthContext` with mock user state and role switching (supporting Public + 6 authenticated roles).
- Configure all 56 routes with typed placeholder screens displaying screen number, name, actor, and module.
- **Verification:** Run development server; verify role switching across all 6 roles + unauthenticated public state; verify responsive layouts at 1366×768 and 1920×1080.
- **No business logic or page details are built in Phase 1.**

### Phase 2 — Public Portal, Customer Journey & Receptionist Front Desk (M1 & M2)
**Scope:** Covers all of Module 1 and Module 2.
- Build public screens: Landing (#1), Packages (#13, #14), Auth (#3, #4, #5, #6).
- Implement explicit consent health profile (#8) and customer deletion request (#9).
- Implement full booking flow: Booking Form (#15) → Summary & Deposit (#16) → VNPay Result simulation (#17) → My Bookings (#18) → Itinerary (#19).
- **Implement Receptionist Front Desk screens (#20–24) in full:**
  - Receptionist Dashboard (#20)
  - Daily Arrivals (#21)
  - Check-in & Residence Information collection (#22)
  - Physical Villa Assignment (#23)
  - Villa Status Management (#24)

### Phase 3 — Spa & Therapy 2D-Lock Scheduling (M3)
**Scope:** Screens 25–33.
- Build Customer Spa flow: Treatment List (#25) → Slot Booking (#26) → Alternative Slot Selection (#27) → Confirmation (#28) → Sessions (#29).
- Implement Therapist views: Dashboard (#31) → Daily Schedule (#32) → Session Detail (#33) with **minimized treatment notes** and Completed/No-Show actions.
- Implement Receptionist manual booking (#30) with automatic folio charge posting.

### Phase 4 — Dietary F&B Operations (M4)
**Scope:** Screens 34–40.
- Build Customer dining: Menu (#34) filtered by health profile, Meal Selection (#35), Extra A-la-carte ordering (#36), Orders list (#37).
- Build Kitchen operations: F&B Dashboard (#38), Prep List (#39), Order Detail (#40) with prominent allergy alerts and hidden medical history.

### Phase 5 — Front Desk Checkout Consolidation & Manager Analytics (M5)
**Scope:** Screens 41–48.
- **Integrates with existing M2 Front Desk screens (does not re-implement them):** Uses the arrivals, booking records, and villa statuses established in Phase 2.
- Build Folio & Invoicing: Screen 41 with **Billing Guard check** (blocks if pending charges exist).
- Build Payment: Final payment (#42 with Cash/VNPay options), Payment Result (#43), Checkout Confirmation (#44 with villa cleaning update).
- Build Analytics: Revenue (#46), Occupancy (#47), Therapist Utilization (#48).
- Build Customer Review & Rating (#45).

### Phase 6 — Administration & System Governance (M6)
**Scope:** Screens 49–56.
- Build Admin console: Staff accounts (#10, #11), Master data (#12), Business params (#50), Feature flags (#51), Permission matrix (#52), Delegation (#53), Audit log (#54).
- Build Manager Dashboard (#55) and System Overview (#56 with strictly documented operational KPIs and the Police Residency Declaration export affordance).
- Connect Admin soft-delete status tracking in data layer.

### Phase 7 — Visual QA, Accessibility & Demonstration Polish
- Comprehensive audit of typography, quiet-luxury aesthetics, spacing, and micro-interactions.
- Verify sensitive-data minimization across all role views.
- Test edge cases: blocked checkout, unavailable spa slots, dietary filtering.
- Produce final walkthrough documentation and screenshot artifacts.

---

## 10. Summary of Plan Corrections

1. **Phase 5 Ownership Corrected:** Front Desk & Villa screens (#20–24) are explicitly owned and implemented in **Phase 2 (M1 & M2)**. Phase 5 strictly focuses on M5 Checkout (Screens 41–44) and Analytics (Screens 46–48), integrating with the existing M2 screens rather than duplicating them.
2. **Health Data Deletion Administration Defined as Derived/Unresolved:** Marked Admin-side soft-delete execution as an unresolved UI placement. Customer Screen 9 is confirmed; Admin side is tracked in the data layer until team placement is settled.
3. **Screen 56 Scoped to Documented Content:** Removed speculative technical server metrics. Screen 56 is strictly bounded to documented operational overview indicators, permission summaries, and the Law on Residence 2020 export action.
4. **Customer Folio Clarified as Role View:** `/customer/folio` is confirmed as a role-specific read-only view of Screen 41, preserving the official 56-screen inventory.
5. **Phase 1 Independence:** Phase 1 requires zero unresolved business decisions to execute.
