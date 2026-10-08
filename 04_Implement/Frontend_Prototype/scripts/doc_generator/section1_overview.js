export function renderSection1() {
  return `
<!-- COVER PAGE -->
<div class="cover-page">
  <div class="cover-header">
    <div class="cover-brand">HeavenStay Wellness Resort Management System</div>
    <div class="cover-title">Web UI Demo — Functional & UI/UX Overview</div>
    <div class="cover-subtitle">
      A Comprehensive Technical & Architectural Synthesis of the 56-Screen Front-End Prototype, Domain Workflows, Role-Based Access Boundaries, and Verification Baselines.
    </div>
  </div>

  <div class="cover-meta-grid">
    <div class="cover-meta-item">
      <div class="cover-meta-label">Project Name</div>
      <div class="cover-meta-val">HSWRMS (HeavenStay Wellness Resort Management System)</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Course & Academic Context</div>
      <div class="cover-meta-val">ISP392 — IS2005 Group 1 (Fall 2026 / Spring 2025)</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Module Scope</div>
      <div class="cover-meta-val">M1 through M6 (Full 6-Module Domain Lifecycle)</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Screen Scope Baseline</div>
      <div class="cover-meta-val">Official 56 Baseline Screens (100% Implemented in Prototype)</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Frontend Stack Baseline</div>
      <div class="cover-meta-val">React 19, TypeScript, Vite 8, React Router v7, Vanilla CSS Tokens</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Primary Document Purpose</div>
      <div class="cover-meta-val">ISP392 Defense, Demo Walkthrough, SRS Cross-Check & Onboarding</div>
    </div>
  </div>

  <div class="cover-footer">
    <div>Classification: Academic Project Specification & System Review</div>
    <div>Document Revision: 2.0 (Official Baseline Alignment)</div>
    <div>Date: October 2026</div>
  </div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="page-break">
  <h1>Table of Contents</h1>
  <div style="margin-top: 20px;">
    <ul class="toc-list">
      <li class="toc-item"><span><span class="toc-num">1.</span> Executive Overview</span> <span>3</span></li>
      <li class="toc-item"><span><span class="toc-num">2.</span> UI/UX Design System Overview</span> <span>5</span></li>
      <li class="toc-item"><span><span class="toc-num">3.</span> Role-Based UI Architecture</span> <span>8</span></li>
      <li class="toc-item"><span><span class="toc-num">4.</span> Master Screen & Navigation Overview</span> <span>11</span></li>
      <li class="toc-item"><span><span class="toc-num">5.</span> Module 1 — Authentication & Sensitive Health Profile</span> <span>15</span></li>
      <li class="toc-item"><span><span class="toc-num">6.</span> Module 2 — Retreat Booking & Accommodation</span> <span>18</span></li>
      <li class="toc-item"><span><span class="toc-num">7.</span> Module 3 — Spa & Therapy Scheduling</span> <span>21</span></li>
      <li class="toc-item"><span><span class="toc-num">8.</span> Module 4 — Dietary F&B Management</span> <span>26</span></li>
      <li class="toc-item"><span><span class="toc-num">9.</span> Module 5 — Consolidated Checkout & Analytics</span> <span>30</span></li>
      <li class="toc-item"><span><span class="toc-num">10.</span> Module 6 — System Administration & Permission Management</span> <span>34</span></li>
      <li class="toc-item"><span><span class="toc-num">11.</span> Screen-by-Screen UI Catalog (Screens 1 to 56)</span> <span>38</span></li>
      <li class="toc-item"><span><span class="toc-num">12.</span> Status & State Reference Guide</span> <span>46</span></li>
      <li class="toc-item"><span><span class="toc-num">13.</span> Cross-Module UI Dependencies & Data Flow</span> <span>49</span></li>
      <li class="toc-item"><span><span class="toc-num">14.</span> Prototype vs Approved Business Requirements (Gap Analysis)</span> <span>51</span></li>
      <li class="toc-item"><span><span class="toc-num">15.</span> UI/UX Quality & Usability Review</span> <span>54</span></li>
      <li class="toc-item"><span><span class="toc-num">16.</span> Demo Walkthrough Script (10–15 Minutes Presentation)</span> <span>57</span></li>
      <li class="toc-item"><span><span class="toc-num">17.</span> Mock Viva: 20+ Challenging Defense Questions & Answers</span> <span>60</span></li>
      <li class="toc-item"><span><span class="toc-num">18.</span> Open Architectural Items & Known Limitations</span> <span>66</span></li>
      <li class="toc-item"><span><span class="toc-num">19.</span> Technical Frontend Summary & Source Topology</span> <span>69</span></li>
      <li class="toc-item"><span><span class="toc-num">20.</span> Final Assessment & Defense Readiness Checklist</span> <span>71</span></li>
    </ul>
  </div>

  <div class="callout callout-luxury" style="margin-top: 30px;">
    <div class="callout-title">Document Scope & Methodological Integrity Notice</div>
    This document constitutes the definitive architectural and functional review of the <strong>HeavenStay Wellness Resort Management System (HSWRMS)</strong> front-end prototype. All statements, component inventories, route mappings, and state transitions described herein have been cross-verified against the actual React 19 source code, the official <code>Screen_List.md</code> inventory, and the authoritative Software Requirements Specification (<code>HSWRMS_ISP392_G1_SRS.pdf</code>). Where current front-end prototype behaviors diverge from approved SRS business rules, both states are documented explicitly in the Gap Analysis without silent reconciliation.
  </div>
</div>

<!-- 1. EXECUTIVE OVERVIEW -->
<div class="page-break">
  <h1>1. Executive Overview</h1>

  <h2>1.1 What HSWRMS Is</h2>
  <p>
    <strong>HeavenStay Wellness Resort Management System (HSWRMS)</strong> is an integrated enterprise hospitality management platform purpose-built for luxury wellness resorts. Unlike conventional Property Management Systems (PMS) that focus narrowly on room inventory and basic folio billing, HSWRMS coordinates multi-day holistic wellness retreats combining sanctuary accommodations, personalized therapeutic spa sessions, tailored nutritional culinary programs, and statutory residence compliance into a cohesive guest experience.
  </p>

  <h2>1.2 Why the Web UI Demo Exists</h2>
  <p>
    The front-end Web UI Demo was created to serve as an interactive, high-fidelity presentation baseline for the <strong>ISP392 Software Project</strong>. It provides complete visual, structural, and behavioral verification of all user journeys prior to full production backend deployment. By implementing the entire 56-screen inventory with interactive state management, simulated gateway workflows, and role-adapted layouts, the demo enables academic examiners, stakeholders, and project members to evaluate system completeness, role boundaries, sensitive data isolation, and user experience coherence.
  </p>

  <h2>1.3 Target Users Supported</h2>
  <p>
    HSWRMS supports six distinct authenticated operational personas alongside unauthenticated public visitors:
  </p>
  <ul>
    <li><strong>Public Visitor (Unauthenticated):</strong> Explores retreat packages, villa suites, resort philosophies, and initiates account registration or authentication.</li>
    <li><strong>Customer:</strong> The resort guest (strictly termed <em>Customer</em>, never <em>Guest</em> in authenticated contexts). Manages confidential wellness profiles, reserves multi-day retreats, schedules included and extra therapies, pre-selects dietary meals, monitors in-house folios, and submits post-checkout feedback.</li>
    <li><strong>Receptionist (Front Desk):</strong> Manages daily arrivals, executes legal identity verification and residence reporting (Vietnam Law on Residence 2020), assigns physical sanctuary villas, books manual extra therapies, performs billing audits, and finalizes resort departure.</li>
    <li><strong>Spa Therapist / Yoga Instructor:</strong> Reviews assigned daily treatment schedules, accesses strictly treatment-relevant health precautions, and updates session fulfillment statuses (Completed or No-Show).</li>
    <li><strong>F&B Staff / Chef:</strong> Manages culinary kitchen prep lists, receives allergen and dietary alerts while keeping sensitive medical records masked, and transitions meal orders from Preparing to Ready.</li>
    <li><strong>Manager:</strong> Operational overseer operating under least-privilege principles (not an administrator). Monitors aggregated revenue, villa occupancy, therapist utilization, and system-wide operational health.</li>
    <li><strong>Admin (System Administrator):</strong> Configures staff credentials, maintains master catalogs, tunes business parameters, toggles feature flags, enforces the RBAC permission matrix, delegates limited operational rights, and audits sensitive data access.</li>
  </ul>

  <h2>1.4 How the UI Connects the Six Modules</h2>
  <p>
    HSWRMS is architecturally partitioned into six tightly coupled functional modules, linked by an end-to-end data chain:
  </p>

  <div class="card-box" style="background: #ffffff; border-left: 4px solid #2d4834; padding: 12px 16px;">
    <div style="font-weight: 700; color: #2d4834; font-size: 10pt; margin-bottom: 6px;">End-to-End Enterprise Module Chain</div>
    <div style="font-family: monospace; font-size: 8.5pt; color: #333; line-height: 1.6;">
      [M1: Authentication & Health Profile] ──(Explicit Consent & Medical Notes)──► [M3: Spa Scheduling] & [M4: Dining F&B]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      [M2: Retreat Package & Villa Booking] ──(Active Stay Context & Deposit Paid)──► [M3] & [M4] Service Entitlement<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      [M3 & M4 Service Consumption] ──(Extra Charges & Fulfillment Records)──────► [M5: Consolidated Folio & Checkout]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      [M6: Administration & Governance] ──(RBAC, Feature Flags, Audit Logging)──────► Governs Modules M1 through M5
    </div>
  </div>

  <h2>1.5 Core Distinction: Conventional PMS vs. Wellness Resort Management System</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 20%;">Dimension</th>
        <th style="width: 40%;">Conventional Hotel/Resort PMS</th>
        <th style="width: 40%;">HeavenStay Wellness Resort (HSWRMS)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Primary Unit of Sale</strong></td>
        <td>Physical room night (Room Only or Room + Breakfast).</td>
        <td>Comprehensive Wellness Retreat Package combining lodging, daily therapies, and nutritional meal plans.</td>
      </tr>
      <tr>
        <td><strong>Guest Health Data</strong></td>
        <td>Usually uncollected or limited to informal text notes in guest comments.</td>
        <td>Legally safeguarded Sensitive Health Profile requiring explicit consent under Vietnam PDPD decree; subject to post-stay erasure.</td>
      </tr>
      <tr>
        <td><strong>Data Minimization</strong></td>
        <td>Staff members typically share unrestricted view of guest reservation profile.</td>
        <td>Role-adapted data projections: Therapist sees only muscular/joint precautions; Chef sees only food allergens; Receptionist sees no medical notes.</td>
      </tr>
      <tr>
        <td><strong>Spa Scheduling</strong></td>
        <td>Loose calendar booking; often detached from room stay or therapist availability.</td>
        <td>Strict 2D Atomic Lock: Session confirmed only when both qualified practitioner and compatible treatment room are simultaneously available.</td>
      </tr>
      <tr>
        <td><strong>Dining Operations</strong></td>
        <td>POS ticket printing; kitchen unaware of customer medical restrictions.</td>
        <td>Personalized culinary filtering based on dietary profile; ingredient-level requirement calculation and allergen cross-check.</td>
      </tr>
      <tr>
        <td><strong>Checkout Lifecycle</strong></td>
        <td>Payment of bill immediately completes checkout.</td>
        <td>Decoupled two-stage process: Payment Success != Checkout Complete. Departure requires settling billing guards and reassigning villa to housekeeping.</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- 2. UI/UX DESIGN SYSTEM OVERVIEW -->
<div class="page-break">
  <h1>2. UI/UX Design System Overview</h1>

  <h2>2.1 Visual Philosophy: Quiet Luxury & Restrained Minimalist Hospitality</h2>
  <p>
    The visual interface of HSWRMS is implemented strictly in accordance with <code>HSWRMS_DESIGN.md</code>. Inspired by ultra-luxury wellness havens such as Amanoi Ninh Thuan, the design language rejects loud commercial gradients, heavy drop shadows, and high-contrast neon styling. Instead, it employs organic earth tones, soft stone surfaces, generous whitespace, tactile card elevations, and editorial serif typography.
  </p>

  <h2>2.2 Design Tokens & Visual Hierarchy</h2>
  <div class="grid-2">
    <div class="card-box">
      <div class="card-title">Color Palette & Surface Tones</div>
      <ul style="font-size: 8.5pt;">
        <li><strong>Canvas Background:</strong> <code>#FAF9F6</code> (Warm off-white stone canvas)</li>
        <li><strong>Soft Background:</strong> <code>#F5F3EF</code> (Subtle container fill)</li>
        <li><strong>Card Surface:</strong> <code>#FFFFFF</code> (Clean white surface elevation)</li>
        <li><strong>Primary Text:</strong> <code>#2B2B2B</code> (Deep charcoal, never pure black)</li>
        <li><strong>Secondary Text:</strong> <code>#706E6B</code> (Muted slate gray for subtitles)</li>
        <li><strong>Brand Forest Accent:</strong> <code>#4F5A50</code> (Deep pine/forest green)</li>
        <li><strong>Brand Olive Accent:</strong> <code>#6D7466</code> (Earthy natural olive)</li>
        <li><strong>Brand Sand Accent:</strong> <code>#D8C7AE</code> (Warm coastal sand accent)</li>
      </ul>
    </div>
    <div class="card-box">
      <div class="card-title">Typography & Shape Language</div>
      <ul style="font-size: 8.5pt;">
        <li><strong>Display Typography:</strong> <code>Cormorant Garamond</code> (Serif, elegant, applied to page titles, package headers, and editorial callouts).</li>
        <li><strong>UI & Tabular Typography:</strong> <code>Inter</code> (Sans-serif, neutral, high legibility for data grids, badges, inputs, and numbers).</li>
        <li><strong>Radius Scale:</strong> <code>6px</code> (inputs/chips), <code>10px</code> (controls), <code>14px</code> (buttons), <code>18px</code> (standard cards), <code>22px</code> (hero panels), <code>9999px</code> (pills).</li>
        <li><strong>Elevation & Shadows:</strong> Tactile micro-shadows (<code>0 4px 20px rgba(30, 30, 30, 0.06)</code>) preventing visual noise.</li>
      </ul>
    </div>
  </div>

  <h2>2.3 Actor Badge Color Conventions</h2>
  <p>
    To ensure instantaneous cognitive recognition across complex cross-role operations, each actor role is assigned a distinct, low-saturation pastel identification token (matching <code>Screen_List.md §8</code>):
  </p>
  <table>
    <thead>
      <tr>
        <th>Actor Persona</th>
        <th>Background Color</th>
        <th>Hex Code</th>
        <th>Text Color</th>
        <th>Operational Application</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Public / Shared</strong></td>
        <td>Pastel Slate</td>
        <td><code>#E0E0E0</code></td>
        <td><code>#424242</code></td>
        <td>Public landing, authentication modals, shared system screens</td>
      </tr>
      <tr>
        <td><strong>Customer</strong></td>
        <td>Soft Meadow Green</td>
        <td><code>#C8E6C9</code></td>
        <td><code>#204B23</code></td>
        <td>Customer portal, booking cards, health profile indicators</td>
      </tr>
      <tr>
        <td><strong>Receptionist</strong></td>
        <td>Warm Primrose Yellow</td>
        <td><code>#FFF3B0</code></td>
        <td><code>#665A00</code></td>
        <td>Front desk workspace, daily arrivals, villa check-in controls</td>
      </tr>
      <tr>
        <td><strong>Spa Therapist</strong></td>
        <td>Lavender Mist</td>
        <td><code>#D1C4E9</code></td>
        <td><code>#3C2466</code></td>
        <td>Therapist schedule, session details, treatment notes</td>
      </tr>
      <tr>
        <td><strong>F&B Staff / Chef</strong></td>
        <td>Peach Amber</td>
        <td><code>#FFD8A8</code></td>
        <td><code>#703C00</code></td>
        <td>Kitchen preparation board, dining orders, dietary warning cards</td>
      </tr>
      <tr>
        <td><strong>Manager</strong></td>
        <td>Quiet Seafoam Teal</td>
        <td><code>#B2DFDB</code></td>
        <td><code>#004D40</code></td>
        <td>Revenue reports, occupancy analytics, therapist utilization</td>
      </tr>
      <tr>
        <td><strong>Admin</strong></td>
        <td>Sky Horizon Blue</td>
        <td><code>#BBDEFB</code></td>
        <td><code>#0D47A1</code></td>
        <td>System dashboard, staff lists, feature flags, audit logs</td>
      </tr>
    </tbody>
  </table>

  <h2>2.4 Reusable Component Library</h2>
  <p>
    The frontend prototype avoids ad-hoc styling by constructing every screen from a dedicated library of typed, modular UI components located in <code>src/components/</code>:
  </p>
  <table>
    <thead>
      <tr>
        <th style="width: 22%;">Component Name</th>
        <th style="width: 28%;">Source Location</th>
        <th style="width: 25%;">Primary Variants</th>
        <th style="width: 25%;">UI Consistency Benefit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><code>Button</code></td>
        <td><code>components/common/Button.tsx</code></td>
        <td><code>primary</code>, <code>secondary</code>, <code>ghost</code>, <code>danger</code></td>
        <td>Standardizes quiet-luxury interactive states, loading spinners, and focus rings.</td>
      </tr>
      <tr>
        <td><code>Card</code></td>
        <td><code>components/common/Card.tsx</code></td>
        <td><code>default</code>, <code>elevated</code>, <code>interactive</code>, <code>bordered</code></td>
        <td>Ensures consistent 18px border radius, subtle borders, and soft padding across screens.</td>
      </tr>
      <tr>
        <td><code>StatusChip</code></td>
        <td><code>components/common/StatusChip.tsx</code></td>
        <td><code>success</code>, <code>warning</code>, <code>danger</code>, <code>neutral</code></td>
        <td>Harmonizes status indicators for booking, payment, and meal readiness.</td>
      </tr>
      <tr>
        <td><code>VillaStatusChip</code></td>
        <td><code>components/operations/VillaStatusChip.tsx</code></td>
        <td><code>available</code>, <code>occupied</code>, <code>maintenance</code>, <code>cleaning</code></td>
        <td>Encapsulates operational housekeeping statuses with color-coded dot badges.</td>
      </tr>
      <tr>
        <td><code>OperationalPageHeader</code></td>
        <td><code>components/operations/OperationalPageHeader.tsx</code></td>
        <td>Operational with badge, date stamp, actions</td>
        <td>Provides consistent top title hierarchy and screen number tag for all staff views.</td>
      </tr>
      <tr>
        <td><code>OperationalSidebar</code></td>
        <td><code>components/navigation/OperationalSidebar.tsx</code></td>
        <td>Receptionist, Therapist, Chef navigation</td>
        <td>Fixed left rail navigation featuring role badge, active indicators, and logout.</td>
      </tr>
      <tr>
        <td><code>CustomerNavbar</code></td>
        <td><code>components/navigation/CustomerNavbar.tsx</code></td>
        <td>Customer navigation header</td>
        <td>Includes brand logomark, stay shortcut, language selector, and profile dropdown.</td>
      </tr>
      <tr>
        <td><code>Modal</code> / <code>ConfirmDialog</code></td>
        <td><code>components/common/Modal.tsx</code></td>
        <td>Standard modal, centered dialog</td>
        <td>Provides accessible focus trapping, blurred backdrop overlays, and escape key handling.</td>
      </tr>
      <tr>
        <td><code>OperationalPagination</code></td>
        <td><code>components/operations/OperationalPagination.tsx</code></td>
        <td>Paged data table controls</td>
        <td>Standardizes pagination buttons, item counts, and page sizing for staff tables.</td>
      </tr>
      <tr>
        <td><code>Toast</code></td>
        <td><code>components/common/Toast.tsx</code></td>
        <td><code>success</code>, <code>error</code>, <code>info</code></td>
        <td>Delivers non-disruptive feedback banners floating in the top-right corner.</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- 3. ROLE-BASED UI ARCHITECTURE -->
<div class="page-break">
  <h1>3. Role-Based UI Architecture</h1>

  <h2>3.1 The 5 Top-Level Application Layouts</h2>
  <p>
    The prototype segregates user experiences across five top-level React layouts defined in <code>src/app/layouts/</code>:
  </p>
  <ul>
    <li><strong><code>PublicLayout</code>:</strong> Editorial, full-width presentation container with transparent-to-solid sticky navbar and luxury brand footer. Wraps public discovery screens (Landing, Packages, Package Details).</li>
    <li><strong><code>AuthLayout</code>:</strong> Focused, centered card container against warm canvas background for sign-in, registration, OTP verification, and password recovery.</li>
    <li><strong><code>CustomerLayout</code>:</strong> Dedicated customer workspace featuring the top navigation bar, active stay breadcrumbs, customer quick-links, and profile dropdown.</li>
    <li><strong><code>OperationalLayout</code>:</strong> High-efficiency staff operational layout with a fixed 260px left sidebar, resort operational clock, role-specific navigation hierarchy, and responsive workspace. Used by Receptionist, Therapist, and F&B Staff.</li>
    <li><strong><code>ManagerAdminLayout</code>:</strong> Analytical and governance operational shell supporting KPI summary headers, date range pickers, export triggers, and delegated-capability indicators. Used by Manager and Administrator.</li>
  </ul>

  <h2>3.2 Actor UI Breakdown & Information Boundaries</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 16%;">Role</th>
        <th style="width: 18%;">Primary Layout</th>
        <th style="width: 22%;">Permitted Screens</th>
        <th style="width: 22%;">Strictly Restricted Data</th>
        <th style="width: 22%;">Typical Navigation Flow</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Customer</strong></td>
        <td><code>CustomerLayout</code></td>
        <td>Screens 2, 7–9, 13–19, 25–29, 34–37, 41 (read-only), 45</td>
        <td>Internal staff operations, other guests' records, resort analytics, administration.</td>
        <td>Dashboard ➔ Retreat Booking ➔ Health Profile ➔ Spa Schedule ➔ Meals ➔ Folio ➔ Review</td>
      </tr>
      <tr>
        <td><strong>Receptionist</strong></td>
        <td><code>OperationalLayout</code></td>
        <td>Screens 20–24, 30, 41–44</td>
        <td>Detailed medical records, kitchen recipes, system feature flags, executive revenue metrics.</td>
        <td>Dashboard ➔ Daily Arrivals ➔ Check-In & Residence ➔ Villa Assign ➔ Folio Settlement</td>
      </tr>
      <tr>
        <td><strong>Therapist / Instructor</strong></td>
        <td><code>OperationalLayout</code></td>
        <td>Screens 31–33</td>
        <td>Dietary/food allergy notes, customer payment amounts, folio charges, room billing status.</td>
        <td>Dashboard ➔ Daily Schedule ➔ Session Detail ➔ View Precautions ➔ Complete Session</td>
      </tr>
      <tr>
        <td><strong>F&B Staff / Chef</strong></td>
        <td><code>OperationalLayout</code></td>
        <td>Screens 38–40</td>
        <td>Customer physical medical history, spa notes, passport numbers, billing records.</td>
        <td>Dashboard ➔ Meal Prep List ➔ Order Detail ➔ Review Allergen Warnings ➔ Mark Ready</td>
      </tr>
      <tr>
        <td><strong>Manager</strong></td>
        <td><code>ManagerAdminLayout</code></td>
        <td>Screens 46–48, 55, 56 (+ delegated Screens 50, 51)</td>
        <td>Individual customer health records, raw credit card data, staff password management, security audit log (unless delegated).</td>
        <td>Dashboard ➔ Revenue Analysis ➔ Occupancy Report ➔ Therapist Utilization ➔ System Overview</td>
      </tr>
      <tr>
        <td><strong>Administrator</strong></td>
        <td><code>ManagerAdminLayout</code></td>
        <td>Screens 10–12, 49–54, 56</td>
        <td>Clinical health details (system admin can view audit logs of access, but does not browse personal health profiles without audit trail).</td>
        <td>Admin Dashboard ➔ Staff Management ➔ Master Catalogs ➔ Feature Flags ➔ Delegation ➔ Audit Log</td>
      </tr>
    </tbody>
  </table>

  <div class="callout callout-danger">
    <div class="callout-title">Architectural Security Principle: Frontend Visibility != System Authorization</div>
    The front-end client utilizes <code>RoleGuard</code> to route users to contextually appropriate screens and conditionally conceal restricted controls. <strong>However, UI-level hiding does not constitute a security boundary.</strong> In production, every API query and mutation must enforce server-side Role-Based Access Control (RBAC), verifying user tokens, active stay tenure, and least-privilege scoping.
  </div>
</div>
`;
}
