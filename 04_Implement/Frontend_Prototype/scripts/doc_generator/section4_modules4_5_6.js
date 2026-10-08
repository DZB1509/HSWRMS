export function renderSection4() {
  return `
<!-- 8. MODULE 4 — DIETARY F&B MANAGEMENT -->
<div class="page-break">
  <h1>8. Module 4 — Dietary F&B Management</h1>

  <h2>8.1 Customer Dietary Journey (Screens 34 to 37)</h2>
  <p>
    Module 4 delivers bespoke organic dining tailored to each customer's nutritional goals and medical food intolerances:
  </p>
  <ul>
    <li><strong>Screen 34 (Dietary Menu):</strong> Interactive dining catalog showcasing farm-to-table dishes categorized by meal period (Breakfast, Lunch, Dinner, All-Day) and wellness tags (Pescatarian, Vegan, Gluten-Conscious, Ayurvedic).</li>
    <li><strong>Screen 35 (Daily Meal Selection):</strong> Allows customer to pre-select included package meals for each stay date, enabling kitchen staff to plan fresh ingredient prep ahead of time.</li>
    <li><strong>Screen 36 (Extra A-la-carte Order):</strong> Enables ordering supplemental gourmet wellness dishes, cold-pressed elixirs, or artisanal tea service charged directly to the Customer Folio (<code>M4 ➔ M5 Folio</code>).</li>
    <li><strong>Screen 37 (My Meal Plan / Orders):</strong> Aggregated view displaying selected daily courses, fulfillment status (Pending, Preparing, Ready, Delivered), and submitted extra charges.</li>
  </ul>

  <h2>8.2 Kitchen & Chef Operational Screens (Screens 38 to 40)</h2>
  <ul>
    <li><strong>Screen 38 (F&B Dashboard):</strong> Kitchen command board summarizing upcoming meal service periods, total daily covers, critical allergy alerts, and active kitchen ticket counts.</li>
    <li><strong>Screen 39 (Daily Meal Prep List):</strong> Workload aggregation board grouping meal prep tickets by meal period, villa delivery destination, and dietary requirements. High-contrast warning chips highlight severe allergies (Nuts, Shellfish, Eggs).</li>
    <li><strong>Screen 40 (Meal Order Detail):</strong> Individual preparation ticket displaying dish recipes, plating instructions, customer special requests, and status transition triggers (Preparing ➔ Ready ➔ Delivered).</li>
  </ul>

  <h2>8.3 Personalized Menu Formulation Logic</h2>
  <div class="card-box" style="background: #ffffff; border-left: 4px solid #4f5a50; padding: 12px;">
    <div style="font-weight: 700; color: #2d4834; font-size: 9.5pt; margin-bottom: 6px;">Dynamic Menu Availability Equation</div>
    <div style="font-family: monospace; font-size: 8.5pt; color: #333; line-height: 1.6;">
      [Customer Allergy/Dietary Profile] + [Dish Ingredient Formulation] + [Real-Time Stock Availability]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= Personalized Available Menu (Unsafe items masked or flagged with warnings)
    </div>
  </div>

  <h2>8.4 Advanced Ingredient Quantity Model & Inventory Recalculation</h2>
  <p>
    In the latest approved requirements, culinary operations rely on a four-tier relational model linking menu items to physical storeroom inventory:
  </p>
  <div class="card-box" style="font-size: 8.5pt;">
    <strong>Relational Structure:</strong> <code>MENU_ITEM</code> ──(1:N)──► <code>MENU_ITEM_INGREDIENT</code> ──(N:1)──► <code>INGREDIENT</code> ──(1:N)──► <code>INGREDIENT_BATCH</code><br>
    <strong>Quantity Computation:</strong> <code>quantity_per_serving × number_of_servings = required_ingredient_quantity</code><br><br>
    <div class="grid-2">
      <div>
        <strong>Estimated Ingredient Requirement:</strong> Calculated in advance when customers submit Daily Meal Selections (Screen 35), allowing the Head Chef to forecast daily requisition orders.
      </div>
      <div>
        <strong>Actual Ingredient Usage:</strong> Recorded upon fulfillment on Screen 40, accounting for yield loss, culinary adjustments, and batch expiration FIFO tracking.
      </div>
    </div>
  </div>

  <div class="callout callout-warning">
    <div class="callout-title">Architecture Synchronization Note: Current Prototype vs. Relational Model</div>
    In the current React prototype (<code>types/dining.ts</code>), dietary options are implemented via static tag arrays (<code>dietaryTags</code>, <code>allergenTags</code>) and mock orders. The detailed relational entity <code>MENU_ITEM_INGREDIENT</code> and batch inventory math represent an approved requirement scheduled for production backend implementation and is flagged in the Gap Analysis.
  </div>
</div>

<!-- 9. MODULE 5 — CONSOLIDATED CHECKOUT & ANALYTICS -->
<div class="page-break">
  <h1>9. Module 5 — Consolidated Checkout & Analytics</h1>

  <h2>9.1 The Checkout Journey (Screens 41 to 45)</h2>
  <p>
    Module 5 provides end-of-stay financial reconciliation and management performance analytics:
  </p>
  <div class="card-box" style="background: #ffffff; border-left: 4px solid #4f5a50; padding: 10px;">
    <strong>Checkout Sequence:</strong> Screen 41 (Customer Folio & Consolidated Invoice) ➔ Screen 42 (Final Payment Console) ➔ Screen 43 (Final Payment Result Callback) ➔ Screen 44 (Checkout Confirmation & Departure Handover) ➔ Screen 45 (Review & Rating).
  </div>

  <h2>9.2 The Critical Billing Guard & Checkout Blocker</h2>
  <div class="callout callout-danger">
    <div class="callout-title">Mandatory Business Rule: Outstanding Services Block Resort Checkout (Screen 44)</div>
    Checkout <strong>cannot</strong> be completed while unpaid or unfinalized charges remain on the customer folio. The billing guard evaluates four distinct blocker conditions:
    <ol style="margin-left: 20px; font-size: 8.5pt; margin-top: 4px;">
      <li><code>unpaid_balance</code>: Remaining retreat package balance or unbilled extra charges greater than 0 VND.</li>
      <li><code>unsettled_spa</code>: Extra spa treatments delivered but not yet posted or settled on the folio.</li>
      <li><code>unsettled_fnb</code>: In-villa dining or a-la-carte orders in progress or unbilled.</li>
      <li><code>not_in_stay</code>: Reservation not in active checked-in stay status.</li>
    </ol>
    If any blocker is triggered, Screen 44 displays the <strong>Resort Departure Handover Blocked</strong> panel with itemized amounts, preventing checkout until resolved.
  </div>

  <h2>9.3 Fundamental Domain Rule: Payment Success != Checkout Complete</h2>
  <p>
    A recurring trap in generic hotel software is conflating card payment authorization with resort checkout. In HSWRMS:
  </p>
  <table>
    <thead>
      <tr>
        <th style="width: 50%;">Payment Success (Screen 43)</th>
        <th style="width: 50%;">Checkout Completed (Screen 44)</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>A purely financial transaction outcome returned by the VNPay payment gateway or cash receipt confirmation.</td>
        <td>An operational state transition across multiple resort entities.</td>
      </tr>
      <tr>
        <td>Reduces <code>outstandingBalance</code> to 0 VND.</td>
        <td>Requires 4 coordinated actions:<br>
          1. Consolidated Invoice marked <code>PAID</code>.<br>
          2. Customer Folio marked <code>CLOSED</code>.<br>
          3. Room Booking status transitions to <code>CHECKED_OUT</code>.<br>
          4. Physical Villa status transitions to <code>VACANT_NEEDS_CLEANING</code>.
        </td>
      </tr>
    </tbody>
  </table>

  <h2>9.4 Manager Analytical Reports (Screens 46 to 48)</h2>
  <ul>
    <li><strong>Screen 46 (Revenue Dashboard):</strong> Aggregated gross revenue charts (Recharts) broken down by Retreat Packages, Spa Holistic Therapies, and Dining Extras. Excludes personal customer medical or payment card identifiers.</li>
    <li><strong>Screen 47 (Occupancy Report):</strong> Accommodation analytics tracking villa category occupancy percentages, average length of stay (ALOS), and turn-around cleaning intervals.</li>
    <li><strong>Screen 48 (Therapist Utilization Report):</strong> Workforce efficiency analytics displaying therapist session hours, billable treatment utilization percentages, and treatment category popularity.</li>
  </ul>
</div>

<!-- 10. MODULE 6 — SYSTEM ADMINISTRATION & GOVERNANCE -->
<div class="page-break">
  <h1>10. Module 6 — System Administration & Governance</h1>

  <h2>10.1 Module Purpose & Scope (Screens 49 to 56)</h2>
  <p>
    Module 6 enforces governance, operational parameters, security auditing, and least-privilege role boundaries across the entire HSWRMS ecosystem:
  </p>
  <ul>
    <li><strong>Screen 49 (Admin Dashboard):</strong> Administrator command portal displaying system operational health, active staff counts, audit summary, and quick links to configuration consoles.</li>
    <li><strong>Screen 50 (Business Parameters):</strong> Configurable business policy settings: Deposit percentage (30%), Retreat cancellation refund lead times (14 days, 7 days), Spa cancellation windows, and tax rates.</li>
    <li><strong>Screen 51 (Feature Flag Management):</strong> Runtime operational toggles to enable or disable modules or sub-features (e.g. <code>enable_vnpay_live</code>, <code>enable_in_villa_delivery</code>, <code>enable_guest_rating_portal</code>).</li>
    <li><strong>Screen 52 (Permission Matrix):</strong> Granular matrix mapping system roles to operational screens and capabilities.</li>
    <li><strong>Screen 53 (Limited Admin Rights Delegation):</strong> Formal mechanism allowing Admin to temporarily delegate tightly scoped operational capabilities to Manager without granting full Admin credentials.</li>
    <li><strong>Screen 54 (Sensitive Data Audit Log):</strong> Immutable security access log recording every view, update, or deletion of sensitive health profiles, identity documents, and payment records.</li>
    <li><strong>Screen 55 (Manager Dashboard):</strong> Executive management portal providing overview of revenue, operations, and resort metrics within granted permissions.</li>
    <li><strong>Screen 56 (System Overview Dashboard):</strong> Cross-module application health board and official statutory export interface for the <strong>Police Residency Declaration Report</strong> (Luật Cư trú 2020).</li>
  </ul>

  <h2>10.2 Role Demarcation: Administrator vs. Manager</h2>
  <div class="callout callout-danger">
    <div class="callout-title">Core Security Boundary: The Manager Is NOT a Full Administrator</div>
    Under HSWRMS security architecture:
    <ul style="margin-left: 20px; font-size: 8.5pt; margin-top: 4px;">
      <li><strong>Administrator:</strong> Technical authority responsible for account provisioning, RBAC matrix reconfiguration, security log auditing, master data schemas, and disaster recovery. Has no clinical care duties.</li>
      <li><strong>Manager:</strong> Operational resort supervisor possessing read-only analytical visibility over revenues, occupancy, and labor utilization. Manager <strong>cannot</strong> reset staff passwords, alter role matrices, access raw medical profiles, or inspect security audit logs unless explicitly granted via Screen 53.</li>
    </ul>
  </div>

  <h2>10.3 Limited Admin Rights Delegation Mechanism (Screen 53)</h2>
  <p>
    When operational emergencies occur (e.g. coastal weather advisories requiring temporary adjustment of retreat cancellation windows), Administrator can grant a <strong>Scoped Delegation</strong>:
  </p>
  <ul>
    <li>Delegation must specify: Delegatee (Manager), Granted Capabilities (e.g. <code>configure_business_parameters</code>), Validity Window (e.g. 24 hours), and Mandatory Justification Reason.</li>
    <li><strong>Anti-Escalation Protection (BR-06):</strong> Master password changes, security audit log viewing, and re-delegation powers are strictly non-delegable.</li>
    <li>Delegations automatically lapse at expiration and are logged in the audit trail.</li>
  </ul>
</div>
`;
}
