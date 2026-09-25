# HSWRMS UI Design System & Experience Guide

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Purpose:** Unified UI direction for the HSWRMS demo/prototype and later implementation  
**Design inspiration:** Amanoi / quiet-luxury wellness hospitality aesthetics, adapted for a multi-role resort management system  
**Status:** Week 3 design baseline — UI-first demo, business functions may remain mocked  
**Version:** 1.0

---

## 1. Design Intent

HSWRMS should feel like a **premium wellness resort product**, not a generic admin system.

The visual language keeps the strongest principles from the Amanoi-inspired reference:

- **Quiet Luxury & Minimalism:** warm neutral surfaces, restrained accents, little visual noise.
- **Editorial / High-Fashion Aesthetics:** elegant serif display typography, generous whitespace, strong photography on customer-facing pages.
- **Content-First Visual Storytelling:** retreat, accommodation, spa, dining and wellness content should be image-led.
- **Calm Interaction Rhythm:** subtle animation, deliberate spacing, soft state transitions.
- **No visual excess:** avoid loud gradients, strong box shadows, oversized rounded corners, neon colors or dense decorative effects.

However, HSWRMS is not only a marketing/booking website. It also supports **Receptionist, Therapist/Yoga Instructor, F&B Staff/Chef, Manager and Admin**. Therefore the system uses **one brand language with two interface densities**:

1. **Experience UI** — Public + Customer screens: cinematic, editorial, spacious.
2. **Operational UI** — Staff + Manager + Admin screens: compact, structured, data-first, while preserving the same colors, typography and brand character.

---

## 2. Core Experience Principles

### 2.1 Calm before clever
Prefer clear hierarchy, simple actions and predictable navigation over visual novelty.

### 2.2 Hospitality first
Customer-facing screens should feel like a guided resort journey rather than an e-commerce catalog.

### 2.3 Operational clarity
Staff screens prioritize speed, status visibility, filtering, scheduling and error prevention.

### 2.4 One system, role-aware views
All actors use one coherent design language. Different roles may have different density and navigation, but components should not look like separate products.

### 2.5 Privacy by design
Sensitive health/diet information must never be visually overexposed. Show only role-relevant data and clearly separate sensitive panels from ordinary profile information.

### 2.6 State visibility
Booking, payment, spa session, meal order, villa and account status must always be easy to recognize without relying on color alone.

---

## 3. Brand & Visual Foundation

### 3.1 Color Palette

The palette is **inspired by warm sand, stone, vegetation and natural materials**. These are HSWRMS design tokens, not claims about Amanoi's exact production values.

| Token | Value | Use |
|---|---:|---|
| `--bg-canvas` | `#FAF9F6` | Main application background |
| `--bg-soft` | `#F5F3EF` | Secondary sections / cards |
| `--surface` | `#FFFFFF` | Forms, tables, operational cards |
| `--text-primary` | `#2B2B2B` | Primary text |
| `--text-secondary` | `#706E6B` | Secondary/helper text |
| `--border-subtle` | `#E5E2DC` | Borders/dividers |
| `--accent-forest` | `#4F5A50` | Primary brand accent |
| `--accent-olive` | `#6D7466` | Secondary accent |
| `--accent-sand` | `#D8C7AE` | Warm decorative accent |
| `--success` | `#4E7259` | Confirmed / ready / completed |
| `--warning` | `#A9783B` | Pending / attention |
| `--danger` | `#A24B43` | Error / blocked / failed |
| `--info` | `#527086` | Informational states |
| `--overlay` | `rgba(0,0,0,.35)` | Hero image overlay |

### 3.2 Actor Colors for Screen Flow Documentation

These colors are **documentation/navigation conventions**, not primary UI branding colors.

| Actor | Color | Hex |
|---|---|---|
| Public / Shared | Gray | `#E0E0E0` |
| Customer | Green | `#C8E6C9` |
| Receptionist | Yellow | `#FFF3B0` |
| Therapist / Yoga Instructor | Purple | `#D1C4E9` |
| F&B Staff / Chef | Orange | `#FFD8A8` |
| Manager | Teal | `#B2DFDB` |
| Admin | Blue | `#BBDEFB` |

Do **not** recolor the entire application by actor. Actor colors are primarily for Screen Flow, permission visualization and subtle role indicators.

---

## 4. Typography

### 4.1 Display / Editorial
Use an elegant serif family for public/customer headings.

Recommended practical web-safe/open alternatives:
- **Cormorant Garamond**
- **Playfair Display**
- fallback: Georgia, serif

Use for:
- H1 / H2
- retreat/package names
- villa names
- spa treatment names
- editorial quotes
- premium section headings

### 4.2 Interface / Operational
Use a neutral sans-serif family:

Recommended:
- **Inter**
- fallback: system-ui, Arial, sans-serif

Use for:
- body text
- forms
- labels
- tables
- buttons
- navigation
- dashboards
- system messages

### 4.3 Type Scale

| Style | Size | Weight | Line height |
|---|---:|---:|---:|
| Display XL | 56–72px desktop | 400–500 | 1.05 |
| H1 | 40–48px | 400–500 | 1.15 |
| H2 | 30–36px | 400–500 | 1.2 |
| H3 | 22–28px | 500 | 1.3 |
| Body L | 18px | 400 | 1.7 |
| Body | 16px | 400 | 1.6 |
| Body S | 14px | 400 | 1.5 |
| Label | 12–13px | 500–600 | 1.4 |

Uppercase navigation/CTA text may use `letter-spacing: 0.08em–0.14em`. Avoid excessive tracking in forms and dense dashboards.

---

## 5. Spacing, Grid & Responsive Rules

### 5.1 Spacing scale
Use an 8px-based system:

`4, 8, 12, 16, 24, 32, 48, 64, 80, 96, 128`

### 5.2 Experience UI
- Section vertical padding desktop: **80–128px**
- Max content width: **1200–1320px**
- Editorial text column: **680–840px**
- Hero may use full viewport width
- Image/text split: approximately **60/40**, alternating when appropriate

### 5.3 Operational UI
- Main content max width: fluid / application shell
- Card spacing: 16–24px
- Table row height: 48–56px
- Form field gap: 16px
- Dashboard grid: 12 columns desktop

### 5.4 Breakpoints

| Name | Width |
|---|---:|
| Mobile | `< 640px` |
| Tablet | `640–1023px` |
| Desktop | `1024–1439px` |
| Large Desktop | `>= 1440px` |

All screens used in the demo must remain readable at **1366×768** and **1920×1080**.

---

## 6. Surface & Shape Language

- Border radius: **0–6px** by default.
- Customer image cards may use **0–4px** radius.
- Operational widgets can use **6–8px** when needed for scanability.
- Avoid pill-shaped containers except for status chips/tags.
- Box shadows should be very light: `0 4px 24px rgba(30,30,30,.06)`.
- Prefer 1px borders and whitespace over heavy shadows.
- Divider: `1px solid #E5E2DC`.

---

## 7. Navigation Architecture

### 7.1 Public Navigation
Recommended sections:
- Retreats
- Villas & Accommodation
- Spa & Wellness
- Dining
- Experiences
- About HeavenStay
- Sign In
- **Book Retreat** CTA

Public landing uses a transparent header over hero media, transitioning to warm off-white on scroll.

### 7.2 Customer Navigation
Primary areas:
- Dashboard
- My Bookings
- Spa & Therapy
- Dining / Meal Plan
- Health & Dietary Profile
- Customer Folio
- Account Settings

Use a calm top navigation or compact sidebar depending on viewport.

### 7.3 Staff Navigation
Role-specific left sidebar:
- Receptionist
- Therapist / Yoga Instructor
- F&B Staff / Chef
- Manager
- Admin

Do not expose unavailable functions. Navigation itself must reflect RBAC rather than showing disabled links everywhere.

---

## 8. UI Component System

### 8.1 Buttons
**Primary:** dark forest/charcoal background, light text.  
Use for Book Retreat, Confirm Booking, Continue Payment, Save Changes, Complete Check-In.

**Secondary:** transparent background, 1px border.  
**Tertiary / Text:** text + thin arrow or icon.  
**Destructive:** reserved for deletion/revocation/cancel actions.

Required states:
- default
- hover
- focus
- pressed
- disabled
- loading

Minimum touch target: **44×44px**.

### 8.2 Form Controls
Required:
- Text input
- Password input
- OTP input
- Select
- Multi-select
- Date picker
- Date-range picker
- Time-slot selector
- Checkbox
- Radio group
- Consent checkbox
- Textarea
- Search input
- File/ID capture placeholder where needed

Each control needs label, optional/required indicator, helper text, validation error, disabled state and focus state. Never use placeholder text as the only label.

### 8.3 Status Chips
Status must include **text + color**.

**Booking:** Draft, Pending Deposit, Confirmed, Checked-In, Checked-Out, Cancelled  
**Spa Session:** Confirmed, Completed, No-Show, Cancelled  
**Meal Order:** Submitted, Preparing, Ready, Completed  
**Payment:** Pending, Successful, Failed, Cancelled  
**Villa:** Available, Occupied, Needs Cleaning, Maintenance

### 8.4 Cards
**Editorial Card:** image-first; serif title; short description; subtle text link.  
**Booking Summary Card:** dates, retreat, villa type, pricing and key status.  
**Operational Card:** compact metrics/status; no large decorative photography.  
**Sensitive Information Card:** subtle privacy indicator and role-scoped heading such as “Treatment-Relevant Notes” or “Dietary & Allergy Warnings”.

### 8.5 Tables
Operational tables require:
- search
- filters
- sortable headers where useful
- pagination
- sticky header for long lists
- empty state
- loading state
- row action menu
- status chip
- responsive fallback

### 8.6 Modals & Drawers
Use modal for confirmation, concise editing, payment status and destructive confirmation.  
Use drawer for side details, filters and quick preview.  
Do not place long multi-step booking processes inside one modal.

### 8.7 Feedback Components
Required:
- Toast
- Inline validation
- Alert banner
- Empty state
- Loading skeleton
- Error state
- Success confirmation
- Blocked-action message

Messages should explain **what happened + what the user can do next**.

### 8.8 Calendar / Schedule
Used heavily by M3.

Required views:
- daily schedule
- time slots
- session card
- therapist assignment
- treatment-room availability indicator
- confirmed/unavailable state

For UI demo, availability may use mocked data.

### 8.9 Dashboard Components
**Customer:** upcoming retreat, next spa session, today's meals, outstanding folio amount, quick actions.  
**Receptionist:** today's arrivals, check-ins, villa status snapshot, checkout queue.  
**Therapist:** today's sessions, current/next appointment, daily schedule, treatment-relevant notes link.  
**F&B:** meal prep workload, allergy/diet warnings, Preparing/Ready queue.  
**Manager:** revenue summary, occupancy, therapist utilization, date range/export affordance.  
**Admin:** system overview, staff accounts, feature flags, permission configuration, audit activity.

---

## 9. Photography & Media

Customer/public screens should use premium resort photography with natural light, architecture, wellness, food, landscape and villa interiors.

Recommended ratios:
- Hero: 16:9 or wide cinematic
- Editorial card: 4:3
- Portrait wellness image: 3:4
- Gallery: mixed editorial grid

If final licensed assets are unavailable, use neutral local demo placeholders or generated visuals. Do not hotlink third-party production assets in the final project.

---

## 10. Motion & Micro-interactions

Use sparingly:
- fade-in
- subtle translate Y: 12–20px
- image hover scale: max ~1.02–1.03
- menu underline / border transition
- skeleton loading

Recommended duration:
- UI interaction: 150–250ms
- editorial reveal: 400–700ms

Prefer reduced-motion support. Avoid bouncing controls, parallax overload, disruptive autoplay and flashing states.

---

## 11. Accessibility Baseline

- Target WCAG 2.1 AA contrast where practical.
- Keyboard navigation for all interactive controls.
- Visible focus ring.
- Semantic headings.
- Form labels linked to controls.
- Do not use color as the only state indicator.
- Minimum touch target 44px.
- Meaningful alt text for content images.
- Decorative images use empty alt.
- Respect `prefers-reduced-motion`.

---

## 12. HSWRMS Screen Families by Module

The current screen inventory is a **project baseline/guide**, not an immutable UI specification. Screens may be added, merged or refined when the flow reveals a genuine navigation need, but numbering and naming must be synchronized before SRS freeze.

### M1 — Authentication & Sensitive Health Profile
- Public Landing
- Customer Dashboard
- Register
- Email OTP Verification
- Login
- Password Reset
- Account Settings
- Health & Dietary Profile
- Health Data Deletion Request
- Staff Account List
- Staff Account Detail
- Master Data Management

Design emphasis: trust, consent clarity, privacy, straightforward authentication, clear Customer/Admin separation.

### M2 — Retreat Booking & Accommodation
- Retreat Package List
- Retreat Package Detail
- Retreat Booking Form
- Booking Summary & Deposit
- Deposit Payment Result
- My Bookings
- Booking Detail & Itinerary
- Receptionist Dashboard
- Daily Arrivals
- Check-In & Residence Information
- Villa Assignment
- Villa Status Management

Design emphasis: editorial booking journey for Customer, efficient front-desk operations for Receptionist.

### M3 — Spa & Therapy Scheduling
- Spa Treatment List
- Spa Session Booking
- Available / Alternative Slot Selection
- Spa Booking Confirmation
- My Spa Sessions
- Manual Extra Spa Booking
- Therapist Dashboard
- Therapist Daily Schedule
- Therapist Session Detail

Design emphasis: availability clarity, calm schedule UI, treatment-room + therapist matching, privacy-minimized health notes, Completed/No-Show state visibility.

### M4 — Dietary F&B
- Dietary Menu
- Daily Meal Selection
- Extra A-la-carte Order
- My Meal Plan / Orders
- F&B Dashboard
- Daily Meal Prep List
- Meal Order Detail

Design emphasis: appetizing Customer presentation, high visibility of relevant allergy/diet warnings for kitchen operations.

### M5 — Checkout & Analytics
- Customer Folio & Consolidated Invoice
- Final Payment
- Final Payment Result
- Checkout Confirmation
- Review & Rating
- Revenue Dashboard
- Occupancy Report
- Therapist Utilization Report

Design emphasis: unmistakable outstanding-charge state, separate payment success vs checkout completion, optional post-checkout review, calm analytics UI.

### M6 — Administration & Permission
- Admin Dashboard
- Business Parameters
- Feature Flag Management
- Permission Matrix
- Limited Admin Rights Delegation
- Sensitive Data Audit Log
- Manager Dashboard
- System Overview Dashboard

Design emphasis: RBAC clarity, auditability, confirmation for high-risk actions, restricted Manager views, distinct Admin controls.

---

## 13. Business-Critical UI Rules

### BR-UI-01 — Spa resource matching
A Spa/Therapy booking must not show as confirmed unless both an eligible Therapist and Treatment Room are available for the selected slot.

### BR-UI-02 — Checkout block
The checkout UI must clearly block completion while unpaid/pending extra Spa or F&B charges remain.

### BR-UI-03 — Payment vs checkout
“Payment Successful” and “Checkout Completed” are separate states. Checkout completion is shown only after booking and villa operational status are updated.

### BR-UI-04 — Sensitive data minimization
- Therapist: treatment-relevant health notes only.
- F&B/Chef: allergy/dietary information only.
- Receptionist: no unnecessary sensitive health/diet information.

### BR-UI-05 — Review
Review & Rating is available after a completed stay and may be reached from HSWRMS or an emailed review link. It is not required to complete checkout.

### BR-UI-06 — Role-aware navigation
A user should not see operational routes they are not allowed to use.

---

## 14. Page Templates

### 14.1 Public Landing Template
1. Dual/sticky navigation
2. Cinematic hero
3. Retreat introduction
4. Retreat package showcase
5. Villas/accommodation
6. Wellness & spa
7. Dining
8. Curated experiences
9. Review/testimonial teaser
10. Booking CTA
11. Footer

### 14.2 Customer Content Template
1. Role-aware header
2. Breadcrumb/back navigation where needed
3. Editorial page heading
4. Main content
5. Contextual action panel
6. Status/confirmation section

### 14.3 Staff Operational Template
1. Fixed/compact sidebar
2. Page title + current date/context
3. Search/filter/action toolbar
4. Main table/calendar/cards
5. Detail drawer or dedicated detail screen
6. Toast/alert feedback

### 14.4 Manager/Admin Template
1. Sidebar
2. Scope/date filters
3. KPI row
4. Chart/report/table area
5. Export/action controls
6. Audit/permission warning where relevant

---

## 15. Demo / Prototype Rules

The prototype goal is to **show the system convincingly**, not to finish production logic.

Allowed in the demo:
- mocked JSON data
- local state
- simulated login by role
- simulated payment success/failure
- fake calendar entries
- fake revenue/occupancy charts
- placeholder email/review route
- dummy search/filter behavior

Not required yet:
- real VNPay integration
- real Google/Facebook OAuth
- real email sending
- production database
- encryption implementation
- actual residence reporting integration
- concurrency-safe booking backend

Even in mock mode, the UI must respect the **real business flow and permission rules**.

---

## 16. Suggested Front-End Structure

```text
src/
├─ app/
│  ├─ router/
│  ├─ layouts/
│  └─ providers/
├─ components/
│  ├─ common/
│  ├─ navigation/
│  ├─ forms/
│  ├─ feedback/
│  ├─ data-display/
│  ├─ booking/
│  ├─ spa/
│  ├─ fb/
│  ├─ checkout/
│  └─ admin/
├─ features/
│  ├─ auth/
│  ├─ retreat/
│  ├─ spa/
│  ├─ fb/
│  ├─ checkout/
│  └─ administration/
├─ pages/
├─ data/
│  └─ mock/
├─ styles/
│  ├─ tokens.css
│  └─ globals.css
└─ assets/
```

---

## 17. CSS Token Starter

```css
:root {
  --bg-canvas: #faf9f6;
  --bg-soft: #f5f3ef;
  --surface: #ffffff;
  --text-primary: #2b2b2b;
  --text-secondary: #706e6b;
  --border-subtle: #e5e2dc;
  --accent-forest: #4f5a50;
  --accent-olive: #6d7466;
  --accent-sand: #d8c7ae;
  --success: #4e7259;
  --warning: #a9783b;
  --danger: #a24b43;
  --info: #527086;
  --radius-sm: 2px;
  --radius-md: 6px;
  --radius-lg: 8px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
}
```

---

## 18. Design Review Checklist

Before a screen is accepted:

- [ ] Actor/role is clear.
- [ ] Screen exists for a business reason, not just decoration.
- [ ] Navigation matches the agreed Screen Flow.
- [ ] Main action is obvious.
- [ ] Status is visible in text, not only color.
- [ ] Sensitive data is minimized for the current role.
- [ ] Empty/loading/error/success state has been considered.
- [ ] Component style matches the common system.
- [ ] Layout works at 1366×768.
- [ ] UI does not contradict an SRS business rule.
- [ ] Screen name/number is synchronized with Screen Inventory before SRS freeze.

---

## 19. Final Direction

**HSWRMS should look premium to the Customer and precise to resort staff.**

The public/customer experience inherits the strongest qualities of quiet-luxury wellness websites: warm neutrals, editorial typography, beautiful imagery, generous whitespace and restrained motion.

The operational side deliberately becomes denser, but it must never fall back into an unrelated generic admin template. The same visual tokens, typography, borders, status system and interaction rules should make the entire product feel like one HeavenStay platform.

> **Experience UI:** calm, aspirational, visual.  
> **Operational UI:** clear, efficient, trustworthy.  
> **One brand, one component language, role-aware density.**
