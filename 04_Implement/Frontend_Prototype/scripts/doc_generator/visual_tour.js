import fs from 'fs';
import path from 'path';

function getBase64Image(filename) {
  const filepath = path.resolve('public', 'screenshots', filename);
  if (fs.existsSync(filepath)) {
    const data = fs.readFileSync(filepath);
    return `data:image/png;base64,${data.toString('base64')}`;
  }
  return '';
}

export function renderVisualTour() {
  const screenshots = [
    {
      num: 1,
      name: 'Public Landing',
      file: 'screen_01_public_landing.png',
      actor: 'Public / Shared',
      badgeClass: 'badge-public',
      purpose: 'Public brand showcase presenting luxury wellness pillars, signature retreat packages, and multi-language access.',
      components: 'Editorial hero typography, multi-language switcher dropdown (5 languages), featured retreat carousel, CTA buttons.',
      interaction: 'Clicking "Khám Phá Các Gói Kỳ Nghỉ" navigates to Screen 13 catalog; changing language dynamically updates entire UI text.'
    },
    {
      num: 2,
      name: 'Customer Dashboard',
      file: 'screen_02_customer_dashboard.png',
      actor: 'Customer',
      badgeClass: 'badge-customer',
      purpose: 'Central authenticated hub for the in-house customer tracking active stay status, itinerary schedule, and wellness readiness.',
      components: 'Customer welcome banner, active retreat summary card (HSW-88192, Villa #102, 30% deposit paid), wellness readiness cards.',
      interaction: 'Quick-action shortcuts navigate directly to Health Profile (Screen 8), Spa Booking (Screen 25), and Dining (Screen 34).'
    },
    {
      num: 8,
      name: 'Health & Dietary Profile',
      file: 'screen_08_health_profile.png',
      actor: 'Customer',
      badgeClass: 'badge-customer',
      purpose: 'Confidential wellness intake form capturing physical precautions and food allergies under Vietnam PDPD consent standards.',
      components: 'Explicit unchecked-by-default consent checkbox, medical condition tags, mobility constraints, food allergy selector.',
      interaction: 'Customer toggles health conditions; system enforces unchecked consent validation before saving profile to secure storage.'
    },
    {
      num: 16,
      name: 'Booking Summary & Deposit',
      file: 'screen_16_booking_summary.png',
      actor: 'Customer',
      badgeClass: 'badge-customer',
      purpose: 'Pre-payment booking verification calculating mandatory 30% retreat deposit and presenting cancellation refund policy.',
      components: 'Package itemization, dates, villa category, 30% deposit calculation, cancellation policy notice, VNPay payment CTA.',
      interaction: 'Clicking "Thanh Toán Đặt Cọc (VNPay)" simulates redirect to VNPay gateway callback (Screen 17).'
    },
    {
      num: 21,
      name: 'Daily Arrivals Queue',
      file: 'screen_21_daily_arrivals.png',
      actor: 'Receptionist',
      badgeClass: 'badge-receptionist',
      purpose: 'Front Desk daily arrival management displaying arriving guests, deposit verification, and statutory residence compliance.',
      components: 'Daily arrivals table, ETA indicators, booking reference, villa readiness tag, statutory Law on Residence banner.',
      interaction: 'Receptionist clicks "Bắt Đầu Check-In" to initiate mandatory identification verification on Screen 22.'
    },
    {
      num: 23,
      name: 'Physical Villa Assignment',
      file: 'screen_23_villa_assignment.png',
      actor: 'Receptionist',
      badgeClass: 'badge-receptionist',
      purpose: 'Allocates a specific physical villa unit (e.g. Villa #102) matching the abstract villa category booked by the customer.',
      components: 'Physical villa inventory grid, housekeeping status chips (Available, Cleaning, Maintenance), room view and floor tags.',
      interaction: 'Receptionist verifies housekeeping readiness dot and clicks "Phân Bổ Villa" to bind physical room to guest stay.'
    },
    {
      num: 26,
      name: 'Spa Session Booking',
      file: 'screen_26_spa_booking.png',
      actor: 'Customer',
      badgeClass: 'badge-customer',
      purpose: 'Therapeutic appointment selection initiating system-driven atomic 2D resource matching (Therapist + Room).',
      components: '7-day date selector strip, available time slot grid, treatment duration pill, special request textarea, candidate preview tile.',
      interaction: 'Selecting a date dynamically fetches open slots; choosing a slot locks both practitioner and treatment room.'
    },
    {
      num: 33,
      name: 'Therapist Session Detail',
      file: 'screen_33_therapist_session_detail.png',
      actor: 'Spa Therapist / Yoga Instructor',
      badgeClass: 'badge-therapist',
      purpose: 'Clinical treatment delivery view projecting Treatment Safety Health Notes while strictly masking customer dietary and PII data.',
      components: 'Session time block, Treatment Safety Notes card (lumbar tension, hypertension), special requests, Completed & No-Show CTAs.',
      interaction: 'Therapist reviews musculoskeletal precautions before starting session; marks Completed or No-Show upon conclusion.'
    },
    {
      num: 34,
      name: 'Dietary Menu',
      file: 'screen_34_dietary_menu.png',
      actor: 'Customer',
      badgeClass: 'badge-customer',
      purpose: 'Organic dining catalog dynamically filtered according to customer allergy profile and nutritional goals.',
      components: 'Meal period tabs (Breakfast, Lunch, Dinner), dietary badges (Vegan, Pescatarian, Gluten-Conscious), allergen warning badges.',
      interaction: 'Dishes containing allergens declared in Screen 8 are automatically flagged or masked from selection.'
    },
    {
      num: 39,
      name: 'Daily Meal Prep List',
      file: 'screen_39_meal_prep_list.png',
      actor: 'F&B Staff / Chef',
      badgeClass: 'badge-fb',
      purpose: 'Kitchen preparation command board aggregating meal portion requirements and highlighting critical culinary allergies.',
      components: 'Meal prep cards grouped by service period and villa delivery location, high-contrast red allergen alert badges (Nuts, Shellfish).',
      interaction: 'Kitchen staff clicks into an order ticket (Screen 40) to transition meal fulfillment from Preparing to Ready.'
    },
    {
      num: 41,
      name: 'Customer Folio & Consolidated Invoice',
      file: 'screen_41_customer_folio.png',
      actor: 'Receptionist / Customer',
      badgeClass: 'badge-receptionist',
      purpose: 'Itemized financial statement aggregating retreat package balance, extra spa treatments, and extra a-la-carte dining charges.',
      components: 'Summary metric cards (Package Total, Spa Extras, Dining Extras, Outstanding Balance), itemized line-item audit table.',
      interaction: 'Displays in read-only mode for Customer (<code>/customer/folio</code>) and operational settlement mode for Front Desk.'
    },
    {
      num: 44,
      name: 'Checkout Confirmation & Departure Handover',
      file: 'screen_44_checkout_confirmation.png',
      actor: 'Receptionist',
      badgeClass: 'badge-receptionist',
      purpose: 'Final departure handover enforcing the Billing Guard blocker and updating physical villa status to housekeeping cleaning.',
      components: 'Billing guard verification banner, checkout record details, villa turnover confirmation, review submission link.',
      interaction: 'If unpaid charges remain, checkout is blocked; once settled, clicking finalize transitions villa to Vacant Needs Cleaning.'
    },
    {
      num: 46,
      name: 'Manager Revenue Dashboard',
      file: 'screen_46_revenue_dashboard.png',
      actor: 'Manager',
      badgeClass: 'badge-manager',
      purpose: 'Executive financial reporting displaying revenue breakdowns across Package, Spa, and Dining without exposing guest PII.',
      components: 'Revenue summary cards, historical revenue bar chart, service category distribution donut chart, date range picker.',
      interaction: 'Manager filters date horizon (Monthly, Quarterly) and triggers export of aggregated analytical reports.'
    },
    {
      num: 53,
      name: 'Limited Admin Rights Delegation',
      file: 'screen_53_admin_delegation.png',
      actor: 'Admin',
      badgeClass: 'badge-admin',
      purpose: 'Governance console allowing Administrator to delegate tightly scoped operational capabilities to Manager with anti-escalation controls.',
      components: 'Active delegation records table, capability selector, validity time window input, mandatory justification reason field.',
      interaction: 'Admin creates temporary 24-hour delegation; system prevents delegation of master passwords or security audit logs.'
    }
  ];

  let html = `
<div class="page-break">
  <h1>Visual UI/UX Walkthrough (Representative Screen Tour)</h1>
  <p>
    The following representative screens were captured directly from the live, running frontend prototype (React 19 / Vite preview server). Each figure documents the assigned screen number, primary actor, core operational purpose, key UI components, and verified interactive behavior.
  </p>
`;

  for (const s of screenshots) {
    const base64Img = getBase64Image(s.file);
    html += `
  <div class="figure-card">
    <div class="figure-caption" style="border-top: none; border-bottom: 1px solid #eae5db;">
      <div class="figure-header">
        <div class="figure-title">Screen #${s.num}: ${s.name}</div>
        <div><span class="badge ${s.badgeClass}">${s.actor}</span></div>
      </div>
      <div class="figure-desc">${s.purpose}</div>
    </div>
    <div class="figure-img-wrap">
      ${base64Img ? `<img src="${base64Img}" class="figure-img" alt="Screen #${s.num}: ${s.name}" />` : `<div style="color: #fff; padding: 40px;">Screenshot file ${s.file}</div>`}
    </div>
    <div class="figure-caption">
      <div class="figure-details">
        <div><strong>Key UI Components:</strong> ${s.components}</div>
        <div><strong>Important Interaction:</strong> ${s.interaction}</div>
      </div>
    </div>
  </div>
`;
  }

  html += `</div>`;
  return html;
}
