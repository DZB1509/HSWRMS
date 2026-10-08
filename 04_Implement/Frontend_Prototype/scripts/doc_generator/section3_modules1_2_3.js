export function renderSection3() {
  return `
<!-- 5. MODULE 1 — AUTHENTICATION & SENSITIVE HEALTH PROFILE -->
<div class="page-break">
  <h1>5. Module 1 — Authentication & Sensitive Health Profile</h1>

  <h2>5.1 Module Purpose & Scope</h2>
  <p>
    Module 1 governs user onboarding, identity authentication, credential recovery, confidential health profile capture, post-retreat health data deletion, staff directory administration, and resort master data management. It establishes the baseline security boundary for the resort management system.
  </p>

  <h2>5.2 Detailed Screen-by-Screen Breakdown (Screens 1 to 12)</h2>
  <div class="card-box">
    <div class="card-title">Screen #1: Public Landing (Route: <code>/</code> | Layout: <code>PublicLayout</code> | Actor: Public)</div>
    <div class="card-body">
      <strong>Purpose:</strong> Primary public showcase communicating HeavenStay's quiet-luxury wellness ethos.<br>
      <strong>Main UI Areas:</strong> Editorial hero banner with typography, featured retreat packages carousel, holistic wellness pillars (Sleep, Nutrition, Herbal Therapies, Movement), resort sanctuary imagery, and multi-language switcher.<br>
      <strong>Primary Actions:</strong> "Khám Phá Các Gói Kỳ Nghỉ" (Explore Retreats ➔ Screen 13), "Hành Trình Chữa Lành" (Wellness Philosophy), "Đặt Kỳ Nghỉ" (Book Now ➔ Screen 13/5).<br>
      <strong>Validation & States:</strong> Language state persists via i18next across 5 languages (vi, en, zh-CN, ja, fr).<br>
      <strong>Privacy Considerations:</strong> No personal or session data exposed. Completely open to web crawlers with SEO meta tags.
    </div>
  </div>

  <div class="card-box">
    <div class="card-title">Screen #2: Customer Dashboard (Route: <code>/customer/dashboard</code> | Layout: <code>CustomerLayout</code> | Actor: Customer)</div>
    <div class="card-body">
      <strong>Purpose:</strong> Central authenticated command center for the in-house or booked resort customer.<br>
      <strong>Main UI Areas:</strong> Personalized greeting banner ("Chào buổi sáng, Eleanor Vance"), active retreat booking summary card (Dates, Villa #102, Deposit Status, Ref HSW-88192), quick-access readiness cards for Health Profile, Spa Scheduling, and Personalized Dining.<br>
      <strong>Primary Actions:</strong> "Xem Chi Tiết & Lịch Trình" (Screen 19), "Cập Nhật Hồ Sơ Sức Khỏe" (Screen 8), "Đặt Liệu Trình Spa" (Screen 25), "Chọn Thực Đơn" (Screen 34), "Hóa Đơn Lưu Trú" (Screen 41).<br>
      <strong>Validation:</strong> RoleGuard verifies active role is 'customer'. If booking is empty, renders friendly discovery empty state.
    </div>
  </div>

  <div class="card-box">
    <div class="card-title">Screen #3: Register & Screen #4: Email OTP Verification (Routes: <code>/register</code>, <code>/register/verify</code>)</div>
    <div class="card-body">
      <strong>Purpose:</strong> Self-service customer account creation followed by mandatory two-factor email ownership verification.<br>
      <strong>Main Controls & Inputs:</strong> Full legal name, email address, international phone number, password with strength meter, terms acceptance checkbox, 6-digit numeric OTP entry with countdown resend timer.<br>
      <strong>Validation Rules:</strong> Password requires min 8 characters, uppercase, lowercase, numeric and special characters. OTP enforces exact 6 digits with simulated 60-second cooldown.<br>
      <strong>Business Rule:</strong> Unverified accounts cannot book retreats or record health profiles. Simulated SendGrid OTP is pre-filled as <code>123456</code> for demo convenience.
    </div>
  </div>

  <div class="card-box">
    <div class="card-title">Screen #5: Login & Screen #6: Password Reset (Routes: <code>/login</code>, <code>/password-reset</code>)</div>
    <div class="card-body">
      <strong>Purpose:</strong> Credential authentication with simulated Google/Facebook SSO buttons; self-service password recovery.<br>
      <strong>UI Controls:</strong> Email, password, "Remember me", Social SSO buttons, "Forgot Password?" hyperlink.<br>
      <strong>Validation:</strong> Validates RFC email format and non-empty password. Failed login displays localized alert banner.
    </div>
  </div>

  <div class="card-box">
    <div class="card-title">Screen #8: Health & Dietary Profile (Route: <code>/customer/health-profile</code> | Actor: Customer)</div>
    <div class="card-body">
      <strong>Purpose:</strong> Confidential wellness profile collection covering physical conditions, mobility restrictions, dietary preferences, and food allergies.<br>
      <strong>Core Privacy Guard (Vietnam Decree on Personal Data Protection):</strong> Explicit, <strong>unchecked-by-default consent checkbox</strong> stating: <em>"Tôi đồng ý cho phép HeavenStay thu thập và xử lý thông tin sức khỏe và chế độ ăn của tôi nhằm mục đích cá nhân hóa liệu trình và đảm bảo an toàn..."</em><br>
      <strong>Main UI Areas:</strong> Medical condition tags (Hypertension, Lumbar tension, Pregnancy), Mobility requirements (Ground floor, wheelchair access), Food Allergies (Peanuts, Shellfish, Gluten, Dairy), Stress level indicator (Mild, Moderate, High).<br>
      <strong>Data Minimization Boundary:</strong> Health notes are stored separately from general profile data and are never exposed to Front Desk receptionists.
    </div>
  </div>

  <div class="card-box">
    <div class="card-title">Screen #9: Health Data Deletion Request (Route: <code>/customer/health-profile/deletion</code> | Actor: Customer)</div>
    <div class="card-body">
      <strong>Purpose:</strong> Customer affordance to exercise the "Right to be Forgotten" regarding sensitive health and dietary history post-retreat.<br>
      <strong>UI Areas:</strong> Deletion eligibility notice (requires completed retreat checkout), confirmation input requiring customer to type "CONFIRM", impact summary warning that future retreats will require re-entry.<br>
      <strong>Business Rule:</strong> Health data deletion soft-deletes or anonymizes medical tags while retaining statutory financial records (M5 Folio) for accounting compliance.
    </div>
  </div>

  <div class="card-box">
    <div class="card-title">Screens #10, #11, #12: Staff Directory & Master Data Management (Routes: <code>/admin/staff</code>, <code>/admin/master-data</code>)</div>
    <div class="card-body">
      <strong>Purpose:</strong> Administrator maintenance of resort staff accounts, role assignments (Receptionist, Therapist, Chef, Manager), and resort master data catalogs (Villa Categories, Spa Services, Retreat Packages).<br>
      <strong>Controls:</strong> Searchable staff data table with status pills (Active, Suspended), role dropdown, master catalog tabs with inline editing of package durations and service pricing.
    </div>
  </div>
</div>

<!-- 6. MODULE 2 — RETREAT BOOKING & ACCOMMODATION -->
<div class="page-break">
  <h1>6. Module 2 — Retreat Booking & Accommodation</h1>

  <h2>6.1 Customer Booking Flow (Screens 13 to 19)</h2>
  <p>
    Module 2 governs the primary revenue lifecycle of HSWRMS, progressing from catalog exploration to front-desk check-in:
  </p>
  <div class="card-box" style="background: #ffffff; border-left: 4px solid #4f5a50; padding: 10px;">
    <strong>Customer Journey:</strong> Screen 13 (Retreat Package Catalog) ➔ Screen 14 (Package Detail & Included Services) ➔ Screen 15 (Booking Form: Dates, Guests, Villa Type) ➔ Screen 16 (Booking Summary & Deposit Calculation) ➔ External Gateway (VNPay Deposit 30%) ➔ Screen 17 (Deposit Payment Result) ➔ Screen 18 (My Bookings) ➔ Screen 19 (Booking Detail & Comprehensive Itinerary).
  </div>

  <h2>6.2 Key Domain Concept: Villa Category vs. Physical Villa</h2>
  <div class="callout callout-warning">
    <div class="callout-title">Critical Hospitality Principle: Catalog Category != Physical Inventory Unit</div>
    <p>
      In HSWRMS, the Customer books a <strong>Villa Category</strong> (e.g. <em>Ocean Pool Villa</em>, <em>Tranquil Garden Villa</em>, <em>Mountain Sunrise Suite</em>) during the online reservation flow (Screen 15). The Customer <strong>never</strong> reserves a physical villa number directly online.<br>
      The assignment of a <strong>Physical Villa</strong> (e.g. <em>Villa #102</em>, <em>Villa #205</em>) occurs exclusively at the Front Desk during the Check-In process (Screen 23) managed by the <strong>Receptionist</strong>. This guarantees that housekeeping status, maintenance blocks, and early arrivals can be dynamically managed without double-booking rooms.
    </p>
  </div>

  <h2>6.3 Receptionist Front Desk Operations (Screens 20 to 24)</h2>
  <ul>
    <li><strong>Screen 20 (Receptionist Dashboard):</strong> Operational morning briefing showing daily arrivals count, expected departures, in-house guests, and real-time villa occupancy.</li>
    <li><strong>Screen 21 (Daily Arrivals):</strong> Searchable arrivals queue displaying guest names, arrival times, deposit status, and pre-assigned villa categories. Includes the statutory compliance banner for daily residence declarations.</li>
    <li><strong>Screen 22 (Check-In & Residence Information):</strong> Captures mandatory identification data pursuant to the <strong>Vietnam Law on Residence 2020</strong> (Luật Cư trú 2020 & Nghị định 144/2021/NĐ-CP). Collects full legal name, nationality, passport/CCCD number, issue date, permanent address, and entry transport.</li>
    <li><strong>Screen 23 (Villa Assignment):</strong> Displays real-time physical villa grid filtered by matching category. Receptionist verifies housekeeping readiness (Available vs Cleaning vs Maintenance) and binds a physical villa to the active booking.</li>
    <li><strong>Screen 24 (Villa Status Management):</strong> Housekeeping operational matrix enabling Receptionist and cleaning staff to transition villas between <em>Available</em>, <em>Occupied</em>, <em>Vacant Needs Cleaning</em>, and <em>Maintenance</em>.</li>
  </ul>
</div>

<!-- 7. MODULE 3 — SPA & THERAPY SCHEDULING -->
<div class="page-break">
  <h1>7. Module 3 — Spa & Therapy Scheduling</h1>

  <h2>7.1 Approved Conceptual Scheduling Logic: System-Driven Candidate Generation</h2>
  <div class="callout callout-luxury">
    <div class="callout-title">Authoritative M3 Scheduling Architecture (Approved Business Flow)</div>
    <p>
      Under the latest approved business logic for HSWRMS:
    </p>
    <ol style="margin-left: 20px; font-size: 8.5pt;">
      <li>The Customer (or Receptionist) specifies only: <strong>Treatment Desired</strong>, <strong>Preferred Date / Time Window</strong>, and <strong>Optional Notes</strong>.</li>
      <li><strong>HSWRMS generates the complete scheduling candidate:</strong><br>
        <code>Time Slot + Qualified Therapist / Instructor + Compatible Treatment Room</code>.<br>
        The user does <strong>not</strong> manually select or assemble these operational resources individually.
      </li>
      <li><strong>Atomic 2D Reservation:</strong> Both the qualified therapist and the treatment room are locked atomically in a single database transaction. No partial reservation is ever permitted.</li>
      <li><strong>Revalidation at Confirmation:</strong> Before finalizing confirmation, HSWRMS revalidates resource availability to eliminate race conditions.</li>
      <li><strong>Recovery & Replacement:</strong> If a therapist becomes unavailable (e.g. sick leave), HSWRMS attempts an invisible same-slot qualified therapist substitution. If no practitioner is available, the customer is invited to consent to a rescheduled time or alternate treatment.</li>
    </ol>
  </div>

  <h2>7.2 Detailed Screen-by-Screen Breakdown (Screens 25 to 33)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 5%;">#</th>
        <th style="width: 18%;">Screen Name</th>
        <th style="width: 12%;">Actor</th>
        <th style="width: 25%;">Primary Operational Purpose</th>
        <th style="width: 40%;">Key UI Controls & Data Displayed</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>25</strong></td>
        <td>Spa Treatment List</td>
        <td>Customer</td>
        <td>Browse therapeutic catalog; view included retreat treatments vs. extra chargeable therapies.</td>
        <td>Category filter pills (Massage, Herbal, Hydrotherapy, Yoga), duration badges, included indicators ("Trong Gói"), pricing, "Đặt Liệu Trình" CTA.</td>
      </tr>
      <tr>
        <td><strong>26</strong></td>
        <td>Spa Session Booking</td>
        <td>Customer</td>
        <td>Input preferred date, time window, and initiate atomic candidate matching.</td>
        <td>Date strip (7-day horizon), time slot grid, special request textarea, candidate preview tile showing assigned room suite and practitioner.</td>
      </tr>
      <tr>
        <td><strong>27</strong></td>
        <td>Alternative Slot Selection</td>
        <td>Customer</td>
        <td>Present system-recommended alternatives when requested slot has resource conflicts.</td>
        <td>Conflict diagnosis banner (Therapist busy / Room occupied), curated alternative recommendation cards with one-click selection.</td>
      </tr>
      <tr>
        <td><strong>28</strong></td>
        <td>Spa Booking Confirmation</td>
        <td>Customer</td>
        <td>Display confirmed 2D lock reservation, appointment time, room location, and calendar sync.</td>
        <td>Success checkmark, session voucher summary, simulated Google Calendar sync toggle, reminder schedule notice.</td>
      </tr>
      <tr>
        <td><strong>29</strong></td>
        <td>My Spa Sessions</td>
        <td>Customer</td>
        <td>Review upcoming and past therapy sessions; view confirmation countdown status.</td>
        <td>Timeline cards sorted chronologically, session status chips (Scheduled, Confirmed, Completed), room name, cancellation action.</td>
      </tr>
      <tr>
        <td><strong>30</strong></td>
        <td>Manual Extra Spa Booking</td>
        <td>Receptionist</td>
        <td>Book an ad-hoc extra spa service for an in-house customer with automatic charge posting to folio.</td>
        <td>Customer lookup dropdown, treatment picker, system candidate slot generator, automatic charge posting preview (<code>M3 ➔ M5 Folio</code>).</td>
      </tr>
      <tr>
        <td><strong>31</strong></td>
        <td>Therapist Dashboard</td>
        <td>Therapist</td>
        <td>Personal daily overview showing assigned treatments, today's schedule, and room assignments.</td>
        <td>Next session highlight card, daily KPI metrics (Sessions today, Total therapy minutes), quick link to full daily schedule.</td>
      </tr>
      <tr>
        <td><strong>32</strong></td>
        <td>Therapist Daily Schedule</td>
        <td>Therapist</td>
        <td>Chronological agenda of treatments for selected date; access individual session details.</td>
        <td>Timeline schedule view, customer first name, treatment type, room suite, status chips, "Chi Tiết" button.</td>
      </tr>
      <tr>
        <td><strong>33</strong></td>
        <td>Therapist Session Detail</td>
        <td>Therapist</td>
        <td>Review treatment safety precautions; record clinical notes; mark session Completed or No-Show.</td>
        <td><strong>Treatment Safety Health Notes</strong> (muscular/joint precautions only), special requests, clinical notes input, action buttons (Bắt Đầu, Hoàn Tất, Vắng Mặt).</td>
      </tr>
    </tbody>
  </table>

  <h2>7.3 Dual State Model: Session Status vs. Confirmation Status</h2>
  <p>
    A critical architectural requirement of M3 is the separation of the <strong>Operational Session Lifecycle</strong> from the <strong>Customer Confirmation Protocol</strong>:
  </p>
  <div class="grid-2">
    <div class="card-box">
      <div class="card-title">Session Operational Status (Entity Lifecycle)</div>
      <ul style="font-size: 8pt;">
        <li><code>SCHEDULED</code>: Initial system-generated reservation locked in database.</li>
        <li><code>CUSTOMER_CONFIRMED</code>: Customer responded positively to pre-session confirmation.</li>
        <li><code>RESCHEDULING</code>: In process of finding alternative slot due to disruption.</li>
        <li><code>CANCELLED</code>: Session revoked by customer or resort administration.</li>
        <li><code>COMPLETED</code>: Treatment successfully delivered by practitioner.</li>
        <li><code>NO_SHOW</code>: Customer failed to attend session within grace period.</li>
      </ul>
    </div>
    <div class="card-box">
      <div class="card-title">Confirmation Status (Customer Engagement Protocol)</div>
      <ul style="font-size: 8pt;">
        <li><code>PENDING</code>: Confirmation request dispatched; awaiting customer response.</li>
        <li><code>CONFIRMED</code>: Customer clicked confirm in app or notification link.</li>
        <li><code>DECLINED</code>: Customer actively requested cancellation or reschedule.</li>
        <li><code>EXPIRED</code>: Confirmation window lapsed without customer response.<br>
          <em style="color: #a51d24;">Critical Rule: EXPIRED != NO_SHOW. An expired confirmation allows the resort to reallocate resources or follow up, whereas NO_SHOW occurs only after session start time.</em>
        </li>
      </ul>
    </div>
  </div>

  <h2>7.4 Reminder Timeline Specification</h2>
  <table>
    <thead>
      <tr>
        <th>Trigger Timeline</th>
        <th>Message Type</th>
        <th>Primary Channel</th>
        <th>System Action & Behavioral Impact</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>T - 24 Hours</strong></td>
        <td>Informational Reminder</td>
        <td>In-App & Email</td>
        <td>Notifies customer of upcoming treatment tomorrow; displays preparation guidelines (e.g. hydration, attire).</td>
      </tr>
      <tr>
        <td><strong>T - 2 Hours</strong></td>
        <td>Confirmation Request</td>
        <td>In-App Banner & SMS/Push</td>
        <td>Requests active confirmation from customer (Confirm / Reschedule). Confirmation status transitions to <code>PENDING</code>.</td>
      </tr>
      <tr>
        <td><strong>T - 75 Minutes</strong></td>
        <td>Final Reminder</td>
        <td>High-priority Alert</td>
        <td>Sent if confirmation remains pending with 15 minutes remaining before release deadline.</td>
      </tr>
      <tr>
        <td><strong>T - 60 Minutes</strong></td>
        <td>Confirmation Deadline</td>
        <td>System Event</td>
        <td>If unconfirmed, status transitions to <code>EXPIRED</code>. System may alert Receptionist to call villa or reassign therapist.</td>
      </tr>
      <tr>
        <td><strong>T - 15 Minutes</strong></td>
        <td>Upcoming Reminder</td>
        <td>In-App Notification</td>
        <td>Advises customer to proceed to the Spa Sanctuary treatment pavilion.</td>
      </tr>
    </tbody>
  </table>

  <h2>7.5 Sensitive Health Data Isolation: Treatment Safety Health Profile</h2>
  <div class="callout callout-danger">
    <div class="callout-title">Therapist Data Minimization Boundary (Screen 33)</div>
    Therapists have <strong>no access</strong> to the customer's full medical history, bloodwork, medications, psychological assessments, home address, passport data, or food allergies. Screen 33 renders a strictly filtered <code>TherapistSafeWellnessView</code> projecting only:
    <ul style="margin-left: 20px; font-size: 8.5pt; margin-top: 4px;">
      <li>Customer first name only (e.g. "Eleanor").</li>
      <li>Musculoskeletal conditions (e.g. "Mild lumbar tension", "Past knee surgery").</li>
      <li>Cardiovascular precautions affecting heat/pressure therapies (e.g. "Mild hypertension (well managed)").</li>
      <li>Customer physical comfort preferences (e.g. "Prefers lavender oil; lower back cushion").</li>
    </ul>
  </div>
</div>
`;
}
