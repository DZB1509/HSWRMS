# HSWRMS — Antigravity IDE Build Prompts

## Recommended workspace context

Place these files in the project before prompting the Agent:

```text
Fall26\_ISP392\_IS2005\_G1/

│

├── AGENTS.md

│

├── 02\_Requirement/

│   ├── HSWRMS\_ISP392\_G1\_SRS.docx

│   ├── HSWRMS\_ISP39\_Project\_Specification.md

│   └── Screen\_List.md

│

├── 03\_Design/

│   ├── HSWRMS\_DESIGN.md

│   └── HSWRMS\_Antigravity\_Prompts.md

│

└── 04\_Implement/

&#x20;   └── Frontend\_Prototype/```

If possible, keep a Markdown/text version of important requirement tables next to PDF/DOCX files so the agent can cite and reason from text without guessing.

\---

# Prompt 0 — Inspect and plan only

Use this first. Do not let the agent code yet.

```text
You are the lead front-end architect and UI engineer for the HeavenStay Wellness Resort Management System (HSWRMS).

First, inspect the project files and requirements before writing any application code.

Read and treat these files as the source of truth:
@docs/requirements/HSWRMS\_SRS.pdf
@docs/requirements/Screen\_List.md
@docs/requirements/Screen\_Flow.png
@docs/design/HSWRMS\_DESIGN.md

Goal:
Build a convincing front-end UI demo/prototype of HSWRMS for project presentation. We are NOT implementing production backend functionality yet.

Important constraints:
1. Do not invent business rules that contradict the requirement files.
2. If the files disagree or a screen/flow is unclear, list the discrepancy and ask for a decision instead of silently choosing.
3. Keep all role/access logic visually consistent with the requirements.
4. Preserve the HSWRMS design system in HSWRMS\_DESIGN.md.
5. Use mocked/local data only for this iteration.
6. Do not implement real VNPay, Google/Facebook OAuth, email delivery, database, encryption, residence-reporting integration, or production concurrency.
7. Simulated states are allowed, but the UI must still reflect the real business rules.
8. The demo must support these roles: Public/Shared, Customer, Receptionist, Therapist/Yoga Instructor, F\&B Staff/Chef, Manager, Admin.
9. The Screen List is a baseline. Do not renumber or rename screens casually. If a genuine extra navigation screen is required, propose it first.
10. Payment Success and Checkout Completed are separate states.
11. Spa confirmation requires both Therapist and Treatment Room availability.
12. Checkout must be blocked while applicable Spa/F\&B charges remain outstanding.
13. Apply health-data minimization by role.

Before coding, produce an implementation plan containing:
- exact front-end stack recommendation;
- route map grouped by role/module;
- screen inventory mapped to routes;
- shared layouts;
- shared reusable components;
- mock-data model;
- navigation strategy;
- design-token implementation;
- proposed folder structure;
- which screens can reuse one template;
- risks/inconsistencies found in the requirement files;
- build sequence in small reviewable phases.

Do not create or modify application code until I approve the plan.
```

\---

# Prompt 1 — Create the UI shell

Run after approving the plan.

```text
Implement Phase 1 only: create the HSWRMS front-end shell.

Use:
- React
- TypeScript
- Vite
- React Router
- Tailwind CSS or a lightweight token-based CSS approach consistent with HSWRMS\_DESIGN.md
- Lucide icons
- Recharts only where charts are needed later

Requirements:
- No backend.
- No real authentication.
- Use local mock data.
- Create central design tokens from @docs/design/HSWRMS\_DESIGN.md.
- Create reusable ExperienceLayout for Public/Customer pages.
- Create reusable OperationalLayout for Receptionist/Therapist/F\&B/Manager/Admin.
- Add a development-only Role Switcher so reviewers can jump between roles.
- Create routing placeholders for the agreed screens.
- Create shared Button, Input, Select, StatusChip, Card, Alert, TableShell, Modal and EmptyState components.
- Make the shell responsive at minimum for 1366x768 and 1920x1080.
- Keep the appearance quiet-luxury: warm neutrals, elegant serif display headings, clean sans-serif operational text, subtle borders and minimal shadows.

Before finishing:
1. run the app;
2. use the browser to verify the shell;
3. fix visible overflow/navigation issues;
4. report the files created and routes implemented.

Do not implement full page details yet.
```

\---

# Prompt 2 — Public + Customer foundation

```text
Implement the public/customer-facing UI screens from the approved Screen Inventory, starting with M1 and M2.

Priorities:
- Public Landing
- Register
- Email OTP Verification
- Login
- Password Reset
- Customer Dashboard
- Account Settings
- Health \& Dietary Profile
- Health Data Deletion Request
- Retreat Package List
- Retreat Package Detail
- Retreat Booking Form
- Booking Summary \& Deposit
- Deposit Payment Result
- My Bookings
- Booking Detail \& Itinerary

Use mock data and simulated navigation only.

Design rules:
- Public/Customer screens should use the Experience UI direction from @docs/design/HSWRMS\_DESIGN.md.
- Use premium local placeholder imagery; do not hotlink third-party resort production assets.
- Keep the booking journey easy to follow.
- Explicit consent must be visible around health/diet profile capture.
- Do not expose staff/admin actions in Customer navigation.

After implementation, run a browser walkthrough from Landing -> Login/Dashboard -> Package -> Booking -> Deposit Result -> My Bookings.
Fix broken routes and obvious visual problems before reporting completion.
```

\---

# Prompt 3 — M3 Spa \& Therapy

```text
Implement the M3 Spa \& Therapy Scheduling UI according to the requirements and agreed Screen Flow.

Include:
- Spa Treatment List
- Spa Session Booking
- Available / Alternative Slot Selection
- Spa Booking Confirmation
- My Spa Sessions
- Manual Extra Spa Booking
- Therapist Dashboard
- Therapist Daily Schedule
- Therapist Session Detail

Required demo logic:
- Simulate Therapist + Treatment Room availability.
- If the requested slot is unavailable, show alternative slots.
- Do not show booking as confirmed until both resources are available.
- Receptionist can simulate an extra spa booking for a Customer.
- Therapist sees only treatment-relevant health notes.
- Therapist can mark an assigned session Completed OR No-Show.
- Completed and No-Show are mutually exclusive.

Use mock data only.

Verify three independent navigation paths:
1. Customer spa path.
2. Receptionist extra-spa path.
3. Therapist daily-work path.

Do not merge these into one fake linear user journey.
```

\---

# Prompt 4 — M4 F\&B

```text
Implement M4 Dietary F\&B UI with mock data.

Include:
- Dietary Menu
- Daily Meal Selection
- Extra A-la-carte Order
- My Meal Plan / Orders
- F\&B Dashboard
- Daily Meal Prep List
- Meal Order Detail

Rules:
- Customer menu can visually reflect dietary/allergy filtering.
- Extra F\&B items should visibly add a mock charge to the Customer Folio data.
- F\&B Staff/Chef sees only food-relevant allergy/dietary warnings.
- Do not expose unrelated health information.
- Meal order status should support Submitted / Preparing / Ready / Completed where applicable.

Verify Customer and F\&B operational flows in browser.
```

\---

# Prompt 5 — M5 Checkout \& Analytics

```text
Implement M5 Checkout \& Analytics UI with mock data.

Include:
- Customer Folio \& Consolidated Invoice
- Final Payment
- Final Payment Result
- Checkout Confirmation
- Review \& Rating
- Revenue Dashboard
- Occupancy Report
- Therapist Utilization Report

Rules:
- Consolidated folio shows Package + Spa + F\&B.
- If applicable charges are outstanding, checkout is blocked and the UI explains why.
- Simulate Cash and/or VNPay only if the approved requirements keep both options.
- Payment Successful is NOT the same as Checkout Completed.
- Checkout Confirmation appears only after simulated booking status and villa operational status updates.
- Review is optional and post-checkout.
- Manager analytics are read-oriented and should not look like Admin configuration screens.

Verify:
1. blocked checkout;
2. successful payment followed by checkout finalization;
3. review path;
4. Manager analytics navigation.
```

\---

# Prompt 6 — M6 Administration

```text
Implement M6 System Administration \& Permission UI with mock data.

Include:
- Admin Dashboard
- Business Parameters
- Feature Flag Management
- Permission Matrix
- Limited Admin Rights Delegation
- Sensitive Data Audit Log
- Manager Dashboard
- System Overview Dashboard

Rules:
- Admin and Manager are not the same role.
- Manager access is limited/read-oriented unless explicit delegated rights are shown.
- High-impact Admin actions require confirmation.
- Permission Matrix must be readable and role-oriented.
- Audit Log should clearly show actor, action, target, timestamp and result in mock data.
- Do not expose Admin navigation to ordinary staff roles.

Verify Admin and Manager views separately.
```

\---

# Prompt 7 — Final visual QA

```text
Perform a final UI-demo QA pass. Do not add major new features.

Use the browser to inspect the main routes and fix:
- inconsistent typography;
- wrong colors/tokens;
- overflow;
- broken routing;
- missing back navigation;
- inconsistent button styles;
- unusable tables;
- missing empty/error/success states;
- inconsistent status chips;
- accidental role-access leaks;
- terminology mismatches such as Guest vs Customer or AWRMS vs HSWRMS.

Check the UI against:
@docs/design/HSWRMS\_DESIGN.md
@docs/requirements/HSWRMS\_SRS.pdf
@docs/requirements/Screen\_List.md

Then produce:
1. a route/screen coverage checklist;
2. list of deliberately mocked functions;
3. unresolved requirement questions;
4. screenshots or browser artifacts of the main Public, Customer, Receptionist, Therapist, F\&B, Manager and Admin views.

Do not implement backend integrations in this pass.
```

