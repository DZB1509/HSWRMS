export function renderSection5() {
  return `
<!-- 11. SCREEN-BY-SCREEN UI CATALOG -->
<div class="page-break">
  <h1>11. Screen-by-Screen UI Catalog</h1>

  <p>
    This catalog provides a compact technical specification for all 56 official baseline screens implemented in the HSWRMS prototype. Every entry lists the verified route, component name, actor, primary controls, displayed data, primary call-to-action (CTA), and simulated status/error states.
  </p>

  <h2>11.1 Screens 1 to 12 (Common, Public & Module 1)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 15%;">Screen & Route</th>
        <th style="width: 10%;">Actor</th>
        <th style="width: 25%;">Purpose & Main Controls</th>
        <th style="width: 25%;">Displayed Data</th>
        <th style="width: 11%;">Primary CTA</th>
        <th style="width: 10%;">Status / Errors</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>1</strong></td>
        <td><strong>Public Landing</strong><br><code>/</code></td>
        <td><span class="badge badge-public">Public</span></td>
        <td>Editorial discovery; package cards, language switcher, brand story.</td>
        <td>Hero statement, 3 retreat packages, wellness pillars, testimonials.</td>
        <td>"Khám Phá Các Gói Kỳ Nghỉ"</td>
        <td>Language toggle (vi, en, zh-CN, ja, fr)</td>
      </tr>
      <tr>
        <td><strong>2</strong></td>
        <td><strong>Customer Dashboard</strong><br><code>/customer/dashboard</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Main customer hub; active stay banner, action shortcuts.</td>
        <td>Customer name, active booking summary, villa #102, readiness chips.</td>
        <td>"Xem Chi Tiết & Lịch Trình"</td>
        <td>Stay status (Confirmed, In-Stay)</td>
      </tr>
      <tr>
        <td><strong>3</strong></td>
        <td><strong>Register</strong><br><code>/register</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Account signup; input name, email, phone, password, terms.</td>
        <td>Registration form fields, password strength indicator.</td>
        <td>"Tạo Tài Khoản"</td>
        <td>Validation error, email conflict</td>
      </tr>
      <tr>
        <td><strong>4</strong></td>
        <td><strong>Email OTP Verify</strong><br><code>/register/verify</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Two-factor email ownership verification; 6-digit OTP input.</td>
        <td>Masked email address, resend cooldown timer.</td>
        <td>"Xác Thực Tài Khoản"</td>
        <td>Invalid OTP, expired OTP</td>
      </tr>
      <tr>
        <td><strong>5</strong></td>
        <td><strong>Login</strong><br><code>/login</code></td>
        <td><span class="badge badge-public">Public</span></td>
        <td>Credential sign-in; email, password, Google/Facebook SSO.</td>
        <td>Login form fields, "Remember Me" checkbox, reset link.</td>
        <td>"Đăng Nhập"</td>
        <td>Invalid credentials, locked account</td>
      </tr>
      <tr>
        <td><strong>6</strong></td>
        <td><strong>Password Reset</strong><br><code>/password-reset</code></td>
        <td><span class="badge badge-public">Public</span></td>
        <td>Self-service recovery; enter email, receive simulated token.</td>
        <td>Email field, reset instructions, new password inputs.</td>
        <td>"Gửi Liên Kết Đặt Lại"</td>
        <td>Email not found, weak password</td>
      </tr>
      <tr>
        <td><strong>7</strong></td>
        <td><strong>Account Settings</strong><br><code>/customer/account</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Personal details, contact phone, password change.</td>
        <td>Name, email, phone, notification preferences.</td>
        <td>"Lưu Thay Đổi"</td>
        <td>Password mismatch, update success</td>
      </tr>
      <tr>
        <td><strong>8</strong></td>
        <td><strong>Health & Dietary Profile</strong><br><code>/customer/health-profile</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Confidential medical & food profile with explicit consent.</td>
        <td>Medical conditions, mobility, allergies, dietary goals, consent status.</td>
        <td>"Lưu Hồ Sơ Sức Khỏe"</td>
        <td>Consent required error, save success</td>
      </tr>
      <tr>
        <td><strong>9</strong></td>
        <td><strong>Health Data Deletion</strong><br><code>/customer/health-profile/deletion</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>GDPR/PDPD right to be forgotten request for health data.</td>
        <td>Eligibility criteria, confirmation phrase field, impact warning.</td>
        <td>"Xác Nhận Yêu Cầu Xóa"</td>
        <td>Stay active blocker, request lodged</td>
      </tr>
      <tr>
        <td><strong>10</strong></td>
        <td><strong>Staff Account List</strong><br><code>/admin/staff</code></td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td>Staff directory; search, filter by role/department, add staff.</td>
        <td>Staff table: ID, name, email, role, status pill, last login.</td>
        <td>"+ Thêm Nhân Viên"</td>
        <td>Filter empty, pagination</td>
      </tr>
      <tr>
        <td><strong>11</strong></td>
        <td><strong>Staff Account Detail</strong><br><code>/admin/staff/:id</code></td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td>Staff profile, role assignment, active/suspend toggle.</td>
        <td>User credentials, department, assigned permissions, audit trail.</td>
        <td>"Cập Nhật Tài Khoản"</td>
        <td>Role conflict, status changed</td>
      </tr>
      <tr>
        <td><strong>12</strong></td>
        <td><strong>Master Data Management</strong><br><code>/admin/master-data</code></td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td>Resort master catalogs; villa types, treatments, packages.</td>
        <td>Tabbed master data tables, pricing, duration, inclusion rules.</td>
        <td>"Lưu Cấu Hình Dữ Liệu"</td>
        <td>Pricing validation, catalog updated</td>
      </tr>
    </tbody>
  </table>

  <h2>11.2 Screens 13 to 24 (Module 2: Retreat Booking & Accommodation)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 15%;">Screen & Route</th>
        <th style="width: 10%;">Actor</th>
        <th style="width: 25%;">Purpose & Main Controls</th>
        <th style="width: 25%;">Displayed Data</th>
        <th style="width: 11%;">Primary CTA</th>
        <th style="width: 10%;">Status / Errors</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>13</strong></td>
        <td><strong>Retreat Package List</strong><br><code>/retreats</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Browse wellness packages; wellness goal filters.</td>
        <td>Package cards, days/nights, included therapies, starting rate.</td>
        <td>"Xem Chi Tiết"</td>
        <td>Filter results empty</td>
      </tr>
      <tr>
        <td><strong>14</strong></td>
        <td><strong>Retreat Package Detail</strong><br><code>/retreats/:id</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>In-depth retreat itinerary, included meals/spa, villa options.</td>
        <td>Editorial narrative, daily schedule breakdown, inclusions list.</td>
        <td>"Đặt Gói Nghỉ Dưỡng"</td>
        <td>Package not found (404)</td>
      </tr>
      <tr>
        <td><strong>15</strong></td>
        <td><strong>Retreat Booking Form</strong><br><code>/customer/booking/new</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Date range selector, guest count, villa category selection.</td>
        <td>Calendar picker, price breakdown, villa amenities.</td>
        <td>"Tiếp Tục Đến Tóm Tắt"</td>
        <td>Invalid dates, unavailable villa</td>
      </tr>
      <tr>
        <td><strong>16</strong></td>
        <td><strong>Booking Summary & Deposit</strong><br><code>/customer/booking/summary</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Review reservation, calculate mandatory 30% VNPay deposit.</td>
        <td>Total package cost, 30% deposit due, cancellation terms.</td>
        <td>"Thanh Toán Đặt Cọc (VNPay)"</td>
        <td>Price revalidation conflict</td>
      </tr>
      <tr>
        <td><strong>17</strong></td>
        <td><strong>Deposit Payment Result</strong><br><code>/customer/booking/deposit-result</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>VNPay payment callback display; confirm booking reference.</td>
        <td>Transaction ID, amount paid, booking reference, receipt.</td>
        <td>"Xem Lịch Trình Kỳ Nghỉ"</td>
        <td>Payment Success vs. Failure</td>
      </tr>
      <tr>
        <td><strong>18</strong></td>
        <td><strong>My Bookings</strong><br><code>/customer/bookings</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Customer booking history; upcoming, active, completed stays.</td>
        <td>Booking cards, stay dates, villa category, status chip.</td>
        <td>"Chi Tiết Đặt Chỗ"</td>
        <td>No active bookings</td>
      </tr>
      <tr>
        <td><strong>19</strong></td>
        <td><strong>Booking Detail & Itinerary</strong><br><code>/customer/bookings/:id</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Day-by-day retreat timeline; check-in details, inclusions.</td>
        <td>Timeline cards, scheduled spa sessions, assigned meals.</td>
        <td>"Đặt Dịch Vụ Tiếp Theo"</td>
        <td>Booking status badge</td>
      </tr>
      <tr>
        <td><strong>20</strong></td>
        <td><strong>Receptionist Dashboard</strong><br><code>/receptionist/dashboard</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td>Front desk operational KPIs; arrivals, departures, villa counts.</td>
        <td>Today's metrics, quick search, recent arrival cards.</td>
        <td>"Xem Khách Đến Hôm Nay"</td>
        <td>Real-time counter updates</td>
      </tr>
      <tr>
        <td><strong>21</strong></td>
        <td><strong>Daily Arrivals</strong><br><code>/receptionist/arrivals</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td>Searchable arrivals queue; statutory police declaration banner.</td>
        <td>Arrival table: ETA, guest, booking ref, deposit paid, villa status.</td>
        <td>"Bắt Đầu Check-In"</td>
        <td>Expected, Arrived, Checked-In</td>
      </tr>
      <tr>
        <td><strong>22</strong></td>
        <td><strong>Check-In & Residence Info</strong><br><code>/receptionist/check-in/:id</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td>Verify guest identity; collect Vietnam Residence Law 2020 data.</td>
        <td>Full legal name, passport/CCCD, nationality, address, entry point.</td>
        <td>"Tiếp Tục Phân Bổ Villa"</td>
        <td>Missing mandatory residence data</td>
      </tr>
      <tr>
        <td><strong>23</strong></td>
        <td><strong>Villa Assignment</strong><br><code>/receptionist/check-in/:id/villa</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td>Assign physical available villa matching booked category.</td>
        <td>Physical villa cards, floor, view, readiness status.</td>
        <td>"Xác Nhận Phân Bổ Villa"</td>
        <td>Villa in maintenance / cleaning</td>
      </tr>
      <tr>
        <td><strong>24</strong></td>
        <td><strong>Villa Status Management</strong><br><code>/receptionist/villas</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td>Resort-wide villa grid; housekeeping status management.</td>
        <td>Villa cards grouped by category, status toggle chips.</td>
        <td>"Cập Nhật Trạng Thái"</td>
        <td>Available, Occupied, Cleaning, Maint</td>
      </tr>
    </tbody>
  </table>

  <h2>11.3 Screens 25 to 33 (Module 3: Spa & Therapy Scheduling)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 15%;">Screen & Route</th>
        <th style="width: 10%;">Actor</th>
        <th style="width: 25%;">Purpose & Main Controls</th>
        <th style="width: 25%;">Displayed Data</th>
        <th style="width: 11%;">Primary CTA</th>
        <th style="width: 10%;">Status / Errors</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>25</strong></td>
        <td><strong>Spa Treatment List</strong><br><code>/customer/spa</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Browse therapy catalog; category filter, duration, included tags.</td>
        <td>Treatment cards, benefits, contraindications preview.</td>
        <td>"Đặt Lịch Liệu Trình"</td>
        <td>Filter empty</td>
      </tr>
      <tr>
        <td><strong>26</strong></td>
        <td><strong>Spa Session Booking</strong><br><code>/customer/spa/book</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Select date, time slot; system computes 2D resource candidate.</td>
        <td>7-day date strip, time slot grid, assigned room & practitioner tile.</td>
        <td>"Xác Nhận Giữ Chỗ"</td>
        <td>Resource conflict (➔ Screen 27)</td>
      </tr>
      <tr>
        <td><strong>27</strong></td>
        <td><strong>Alternative Slot Selection</strong><br><code>/customer/spa/alternatives</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Select alternative available slots after scheduling conflict.</td>
        <td>Conflict diagnosis banner, suggested alternative slot cards.</td>
        <td>"Chọn Khung Giờ Này"</td>
        <td>All alternatives booked error</td>
      </tr>
      <tr>
        <td><strong>28</strong></td>
        <td><strong>Spa Booking Confirmation</strong><br><code>/customer/spa/confirmation</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Confirmed appointment summary; calendar sync, reminder notices.</td>
        <td>Confirmed voucher, room pavilion, practitioner, reminder times.</td>
        <td>"Xem Buổi Trị Liệu Của Tôi"</td>
        <td>Atomic lock confirmed</td>
      </tr>
      <tr>
        <td><strong>29</strong></td>
        <td><strong>My Spa Sessions</strong><br><code>/customer/spa/sessions</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Chronological list of booked treatments; cancel/reschedule.</td>
        <td>Session cards, confirmation status chip, room, cancel modal.</td>
        <td>"Chi Tiết / Hủy Lịch"</td>
        <td>Scheduled, Confirmed, Completed</td>
      </tr>
      <tr>
        <td><strong>30</strong></td>
        <td><strong>Manual Extra Spa Booking</strong><br><code>/receptionist/spa/extra-booking</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td>Front desk books extra spa for customer; posts charge to folio.</td>
        <td>Customer picker, treatment selector, folio posting preview.</td>
        <td>"Xác Nhận & Ghi Vào Hóa Đơn"</td>
        <td>Candidate unavailable, charge posted</td>
      </tr>
      <tr>
        <td><strong>31</strong></td>
        <td><strong>Therapist Dashboard</strong><br><code>/therapist/dashboard</code></td>
        <td><span class="badge badge-therapist">Therapist</span></td>
        <td>Practitioner overview; next session highlight, daily session count.</td>
        <td>Next client card, room suite, daily treatment hours metric.</td>
        <td>"Xem Lịch Làm Việc Hôm Nay"</td>
        <td>Duty status (Available, Busy)</td>
      </tr>
      <tr>
        <td><strong>32</strong></td>
        <td><strong>Therapist Daily Schedule</strong><br><code>/therapist/schedule</code></td>
        <td><span class="badge badge-therapist">Therapist</span></td>
        <td>Timeline agenda for date; session cards with customer first names.</td>
        <td>Timeline blocks, treatment types, assigned rooms, session chips.</td>
        <td>"Xem Chi Tiết & Ghi Chú"</td>
        <td>Scheduled, Confirmed, Completed</td>
      </tr>
      <tr>
        <td><strong>33</strong></td>
        <td><strong>Therapist Session Detail</strong><br><code>/therapist/sessions/:id</code></td>
        <td><span class="badge badge-therapist">Therapist</span></td>
        <td>Review <strong>Treatment Safety Notes</strong>; mark Completed/No-Show.</td>
        <td>Muscular/joint precautions, clinical notes input, action buttons.</td>
        <td>"Hoàn Tất Buổi Trị Liệu"</td>
        <td>Completed vs. No-Show</td>
      </tr>
    </tbody>
  </table>

  <h2>11.4 Screens 34 to 40 (Module 4: Dietary F&B Management)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 15%;">Screen & Route</th>
        <th style="width: 10%;">Actor</th>
        <th style="width: 25%;">Purpose & Main Controls</th>
        <th style="width: 25%;">Displayed Data</th>
        <th style="width: 11%;">Primary CTA</th>
        <th style="width: 10%;">Status / Errors</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>34</strong></td>
        <td><strong>Dietary Menu</strong><br><code>/customer/dining/menu</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Browse organic menu; filter by meal period & wellness tags.</td>
        <td>Dish cards, nutrition info, dietary tags, allergen badges.</td>
        <td>"Chọn Cho Hôm Nay"</td>
        <td>Allergen conflict masked</td>
      </tr>
      <tr>
        <td><strong>35</strong></td>
        <td><strong>Daily Meal Selection</strong><br><code>/customer/dining/select</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Pre-select included package meals for breakfast, lunch, dinner.</td>
        <td>Meal period tabs, course selectors (starter, main, dessert).</td>
        <td>"Xác Nhận Thực Đơn Ngày"</td>
        <td>Pre-selection confirmed</td>
      </tr>
      <tr>
        <td><strong>36</strong></td>
        <td><strong>Extra A-la-carte Order</strong><br><code>/customer/dining/extra</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Order supplemental gourmet dishes charged to customer folio.</td>
        <td>Priced dish catalog, cart drawer, villa delivery time field.</td>
        <td>"Đặt Món & Ghi Vào Hóa Đơn"</td>
        <td>Cart empty, charge posted to M5</td>
      </tr>
      <tr>
        <td><strong>37</strong></td>
        <td><strong>My Meal Plan / Orders</strong><br><code>/customer/dining/orders</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Review selected daily courses and submitted a-la-carte orders.</td>
        <td>Ordered dishes, fulfillment status pill, itemized extra amounts.</td>
        <td>"Xem Thực Đơn Thêm"</td>
        <td>Pending, Preparing, Ready, Delivered</td>
      </tr>
      <tr>
        <td><strong>38</strong></td>
        <td><strong>F&B Dashboard</strong><br><code>/fb/dashboard</code></td>
        <td><span class="badge badge-fb">F&B Staff / Chef</span></td>
        <td>Kitchen command board; upcoming covers, active orders, allergy alerts.</td>
        <td>Service period cards, active ticket count, severe allergen alerts.</td>
        <td>"Xem Danh Sách Chế Biến"</td>
        <td>Real-time kitchen load</td>
      </tr>
      <tr>
        <td><strong>39</strong></td>
        <td><strong>Daily Meal Prep List</strong><br><code>/fb/meal-prep</code></td>
        <td><span class="badge badge-fb">F&B Staff / Chef</span></td>
        <td>Aggregated culinary prep workload grouped by meal period & villa.</td>
        <td>Dish prep cards, portion counts, prominent allergen warning chips.</td>
        <td>"Xem Chi Tiết Món Ăn"</td>
        <td>Filter by service period</td>
      </tr>
      <tr>
        <td><strong>40</strong></td>
        <td><strong>Meal Order Detail</strong><br><code>/fb/orders/:id</code></td>
        <td><span class="badge badge-fb">F&B Staff / Chef</span></td>
        <td>Individual culinary ticket; recipe notes, transition to Ready.</td>
        <td>Customer name, villa #, ingredient notes, status toggle buttons.</td>
        <td>"Đánh Dấu: Đã Sẵn Sàng"</td>
        <td>Preparing ➔ Ready ➔ Delivered</td>
      </tr>
    </tbody>
  </table>

  <h2>11.5 Screens 41 to 48 (Module 5: Checkout & Analytics)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 15%;">Screen & Route</th>
        <th style="width: 10%;">Actor</th>
        <th style="width: 25%;">Purpose & Main Controls</th>
        <th style="width: 25%;">Displayed Data</th>
        <th style="width: 11%;">Primary CTA</th>
        <th style="width: 10%;">Status / Errors</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>41</strong></td>
        <td><strong>Folio & Consolidated Invoice</strong><br><code>/receptionist/folio/:id</code><br><code>/customer/folio</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span><br><span class="badge badge-customer">Customer</span></td>
        <td>Itemized statement of package, spa extras, and dining extras.</td>
        <td>Package balance, spa line items, dining line items, outstanding due.</td>
        <td>"Tiến Hành Thanh Toán" (Staff)</td>
        <td>Pending Settlement, Settled</td>
      </tr>
      <tr>
        <td><strong>42</strong></td>
        <td><strong>Final Payment</strong><br><code>/receptionist/checkout/:id/payment</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td>Final settlement payment console; VNPay gateway simulation.</td>
        <td>Total settlement due, booking ref, VNPay QR / mode selector.</td>
        <td>"Xác Nhận Thanh Toán (VNPay)"</td>
        <td>Processing, Gateway timeout</td>
      </tr>
      <tr>
        <td><strong>43</strong></td>
        <td><strong>Final Payment Result</strong><br><code>/receptionist/checkout/:id/payment-result</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td>Transaction outcome callback; balance marked zero.</td>
        <td>Transaction ID, amount paid, status checkmark, print button.</td>
        <td>"Tiến Hành Trả Phòng (Check-Out)"</td>
        <td>Payment Success vs. Failure</td>
      </tr>
      <tr>
        <td><strong>44</strong></td>
        <td><strong>Checkout Confirmation</strong><br><code>/receptionist/checkout/:id/confirmation</code></td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td>Finalize departure; billing guard checks; release villa to cleaning.</td>
        <td>Billing guard verification, checkout record, housekeeping update.</td>
        <td>"Hoàn Tất Trả Phòng & Bàn Giao"</td>
        <td>Blocked by Unpaid Charges</td>
      </tr>
      <tr>
        <td><strong>45</strong></td>
        <td><strong>Review & Rating</strong><br><code>/customer/review/:bookingId</code></td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td>Post-checkout retreat feedback; star rating, textual comments.</td>
        <td>5-star rating selector, category ratings (Spa, Food, Villa), text area.</td>
        <td>"Gửi Đánh Giá Kỳ Nghỉ"</td>
        <td>Optional; submitted confirmation</td>
      </tr>
      <tr>
        <td><strong>46</strong></td>
        <td><strong>Revenue Dashboard</strong><br><code>/manager/revenue</code></td>
        <td><span class="badge badge-manager">Manager</span></td>
        <td>Gross revenue trends; breakdown by Package, Spa, and Dining.</td>
        <td>Bar charts, donut distribution, gross revenue totals, date filter.</td>
        <td>"Xuất Báo Cáo Doanh Thu"</td>
        <td>Date range filter update</td>
      </tr>
      <tr>
        <td><strong>47</strong></td>
        <td><strong>Occupancy Report</strong><br><code>/manager/occupancy</code></td>
        <td><span class="badge badge-manager">Manager</span></td>
        <td>Accommodation analytics; occupancy rates by villa category.</td>
        <td>Occupancy percentage cards, trend graphs, average length of stay.</td>
        <td>"Xuất Báo Cáo Công Suất"</td>
        <td>Historical filter</td>
      </tr>
      <tr>
        <td><strong>48</strong></td>
        <td><strong>Therapist Utilization</strong><br><code>/manager/therapist-utilization</code></td>
        <td><span class="badge badge-manager">Manager</span></td>
        <td>Workforce efficiency; billable session hours per therapist.</td>
        <td>Practitioner utilization bars, total therapy hours delivered.</td>
        <td>"Xuất Báo Cáo Trị Liệu"</td>
        <td>Utilization benchmark thresholds</td>
      </tr>
    </tbody>
  </table>

  <h2>11.6 Screens 49 to 56 (Module 6: Administration & Governance)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 15%;">Screen & Route</th>
        <th style="width: 10%;">Actor</th>
        <th style="width: 25%;">Purpose & Main Controls</th>
        <th style="width: 25%;">Displayed Data</th>
        <th style="width: 11%;">Primary CTA</th>
        <th style="width: 10%;">Status / Errors</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>49</strong></td>
        <td><strong>Admin Dashboard</strong><br><code>/admin/dashboard</code></td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td>System administration command center; security summary.</td>
        <td>Active users, audit event counts, flag status, configuration links.</td>
        <td>"Quản Trị Người Dùng & Cấu Hình"</td>
        <td>System health status</td>
      </tr>
      <tr>
        <td><strong>50</strong></td>
        <td><strong>Business Parameters</strong><br><code>/admin/business-params</code></td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td>System business settings; deposit rates, cancellation windows.</td>
        <td>Deposit % (30%), refund cutoff days, spa cancellation lead hours.</td>
        <td>"Lưu Cấu Hình Tham Số"</td>
        <td>Validation error, saved success</td>
      </tr>
      <tr>
        <td><strong>51</strong></td>
        <td><strong>Feature Flag Management</strong><br><code>/admin/feature-flags</code></td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td>Runtime toggles for system features; emergency circuit breakers.</td>
        <td>Feature list: VNPay live, In-villa dining, Rating portal, Audit log.</td>
        <td>"Cập Nhật Cờ Tính Năng"</td>
        <td>Protected flag warning</td>
      </tr>
      <tr>
        <td><strong>52</strong></td>
        <td><strong>Permission Matrix</strong><br><code>/admin/permissions</code></td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td>Role-to-screen & role-to-capability RBAC access table.</td>
        <td>Matrix grid mapping 6 roles to operational modules and endpoints.</td>
        <td>"Lưu Ma Trận Phân Quyền"</td>
        <td>Admin role uneditable</td>
      </tr>
      <tr>
        <td><strong>53</strong></td>
        <td><strong>Admin Rights Delegation</strong><br><code>/admin/delegation</code></td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td>Delegate limited administrative capabilities to Manager.</td>
        <td>Active delegations table, capability picker, justification field.</td>
        <td>"+ Cấp Quyền Ủy Quyền Mới"</td>
        <td>Anti-escalation guard, Expired</td>
      </tr>
      <tr>
        <td><strong>54</strong></td>
        <td><strong>Sensitive Audit Log</strong><br><code>/admin/audit-log</code></td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td>Immutable audit log of all sensitive health & financial access.</td>
        <td>Timestamp, actor ID, action type (View, Update, Export), target record.</td>
        <td>"Xuất Nhật Ký Kiểm Toán"</td>
        <td>Search / filter results</td>
      </tr>
      <tr>
        <td><strong>55</strong></td>
        <td><strong>Manager Dashboard</strong><br><code>/manager/dashboard</code></td>
        <td><span class="badge badge-manager">Manager</span></td>
        <td>Executive operational hub for resort operations manager.</td>
        <td>Revenue KPIs, today's occupancy, active therapies, culinary count.</td>
        <td>"Xem Chi Tiết Báo Cáo"</td>
        <td>Read-only manager scope</td>
      </tr>
      <tr>
        <td><strong>56</strong></td>
        <td><strong>System Overview Dashboard</strong><br><code>/admin/system-overview</code></td>
        <td><span class="badge badge-admin">Admin</span><br><span class="badge badge-manager">Manager</span></td>
        <td>Cross-module application health & statutory police residence export.</td>
        <td>Accommodation, therapy, kitchen, and folio operational health.</td>
        <td>"Xuất Báo Cáo Khai Báo Cư Trú"</td>
        <td>Admin clearance vs. Manager scope</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- 12. STATUS & STATE REFERENCE -->
<div class="page-break">
  <h1>12. Status & State Reference Guide</h1>

  <h2>12.1 Persistent Database States vs. Transient Runtime Results</h2>
  <div class="callout callout-info">
    <div class="callout-title">Architectural Distinction: Persistent State vs. Runtime Event</div>
    To maintain data integrity, developers and evaluators must distinguish <strong>Persistent States</strong> (stored in database entities and surviving server restarts) from <strong>Transient Runtime Results</strong> (ephemeral evaluation outcomes returned during request processing, such as an invalid payment checksum or a scheduling resource collision). Runtime events must never be persisted as entity statuses.
  </div>

  <h2>12.2 Consolidated System Status Matrix</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 14%;">Entity / Domain</th>
        <th style="width: 18%;">Status Value</th>
        <th style="width: 12%;">Type</th>
        <th style="width: 36%;">Business Meaning & Transition Trigger</th>
        <th style="width: 20%;">UI Representation</th>
      </tr>
    </thead>
    <tbody>
      <!-- Retreat Booking -->
      <tr>
        <td rowspan="4"><strong>Retreat Booking</strong> (<code>Room_Booking</code>)</td>
        <td><code>PENDING_DEPOSIT</code></td>
        <td>Persistent</td>
        <td>Reservation initiated; awaiting VNPay 30% deposit within 15 min.</td>
        <td><span class="badge badge-receptionist">Chờ Đặt Cọc</span></td>
      </tr>
      <tr>
        <td><code>CONFIRMED</code></td>
        <td>Persistent</td>
        <td>Deposit received; sanctuary villa category guaranteed.</td>
        <td><span class="badge badge-customer">Đã Xác Nhận</span></td>
      </tr>
      <tr>
        <td><code>CHECKED_IN</code></td>
        <td>Persistent</td>
        <td>Customer verified at Front Desk; physical villa assigned (Screen 22).</td>
        <td><span class="badge badge-customer">Đang Lưu Trú</span></td>
      </tr>
      <tr>
        <td><code>CHECKED_OUT</code></td>
        <td>Persistent</td>
        <td>Folio settled; departure handover complete (Screen 44).</td>
        <td><span class="badge badge-public">Đã Trả Phòng</span></td>
      </tr>

      <!-- Physical Villa -->
      <tr>
        <td rowspan="4"><strong>Physical Villa</strong> (<code>Villa_Inventory</code>)</td>
        <td><code>AVAILABLE</code></td>
        <td>Persistent</td>
        <td>Clean, inspected, ready for immediate guest check-in.</td>
        <td><span class="badge badge-customer">Sẵn Sàng</span> (Green dot)</td>
      </tr>
      <tr>
        <td><code>OCCUPIED</code></td>
        <td>Persistent</td>
        <td>In-house customer residing in villa.</td>
        <td><span class="badge badge-fb">Đang Ở</span> (Amber dot)</td>
      </tr>
      <tr>
        <td><code>VACANT_CLEANING</code></td>
        <td>Persistent</td>
        <td>Customer departed; assigned to housekeeping for sanitization.</td>
        <td><span class="badge badge-therapist">Cần Dọn Dẹp</span> (Purple dot)</td>
      </tr>
      <tr>
        <td><code>MAINTENANCE</code></td>
        <td>Persistent</td>
        <td>Out of order for mechanical, pool, or structural repair.</td>
        <td><span class="badge severity-high">Bảo Trì</span> (Red dot)</td>
      </tr>

      <!-- Spa Session Lifecycle -->
      <tr>
        <td rowspan="6"><strong>Spa Session</strong> (<code>Spa_Session</code>)</td>
        <td><code>SCHEDULED</code></td>
        <td>Persistent</td>
        <td>Candidate generated; therapist and room atomically locked.</td>
        <td><span class="badge badge-customer">Đã Lên Lịch</span></td>
      </tr>
      <tr>
        <td><code>CUSTOMER_CONFIRMED</code></td>
        <td>Persistent</td>
        <td>Customer affirmed upcoming attendance via pre-session prompt.</td>
        <td><span class="badge badge-customer">Khách Xác Nhận</span></td>
      </tr>
      <tr>
        <td><code>RESCHEDULING</code></td>
        <td>Persistent</td>
        <td>Disruption detected; alternative slot negotiation in progress.</td>
        <td><span class="badge badge-receptionist">Đang Đổi Lịch</span></td>
      </tr>
      <tr>
        <td><code>CANCELLED</code></td>
        <td>Persistent</td>
        <td>Session revoked prior to treatment start time.</td>
        <td><span class="badge badge-public">Đã Hủy</span></td>
      </tr>
      <tr>
        <td><code>COMPLETED</code></td>
        <td>Persistent</td>
        <td>Therapist marked session delivered; clinical notes recorded.</td>
        <td><span class="badge badge-customer">Hoàn Tất</span></td>
      </tr>
      <tr>
        <td><code>NO_SHOW</code></td>
        <td>Persistent</td>
        <td>Customer failed to attend within grace period (mutually exclusive with Completed).</td>
        <td><span class="badge severity-high">Vắng Mặt</span></td>
      </tr>

      <!-- Spa Confirmation Protocol -->
      <tr>
        <td rowspan="4"><strong>Spa Confirmation</strong> (Protocol)</td>
        <td><code>PENDING</code></td>
        <td>Persistent</td>
        <td>Dispatched at T-2h; awaiting customer acknowledgement.</td>
        <td><span class="badge badge-receptionist">Chờ Xác Nhận</span></td>
      </tr>
      <tr>
        <td><code>CONFIRMED</code></td>
        <td>Persistent</td>
        <td>Customer clicked affirmative confirmation button.</td>
        <td><span class="badge badge-customer">Đã Xác Nhận</span></td>
      </tr>
      <tr>
        <td><code>DECLINED</code></td>
        <td>Persistent</td>
        <td>Customer declined attendance or requested reschedule.</td>
        <td><span class="badge severity-high">Từ Chối</span></td>
      </tr>
      <tr>
        <td><code>EXPIRED</code></td>
        <td>Persistent</td>
        <td>Confirmation window lapsed at T-60m (Does NOT equal No-Show).</td>
        <td><span class="badge badge-public">Hết Hạn XN</span></td>
      </tr>

      <!-- Culinary Orders -->
      <tr>
        <td rowspan="4"><strong>Dining Order</strong> (<code>Meal_Order</code>)</td>
        <td><code>PENDING</code></td>
        <td>Persistent</td>
        <td>Meal selected by customer; queued in kitchen prep system.</td>
        <td><span class="badge badge-receptionist">Chờ Xử Lý</span></td>
      </tr>
      <tr>
        <td><code>PREPARING</code></td>
        <td>Persistent</td>
        <td>Chef commenced culinary cooking and ingredient assembly.</td>
        <td><span class="badge badge-fb">Đang Chế Biến</span></td>
      </tr>
      <tr>
        <td><code>READY</code></td>
        <td>Persistent</td>
        <td>Dish plated, inspected against allergens, ready for service/delivery.</td>
        <td><span class="badge badge-customer">Đã Sẵn Sàng</span></td>
      </tr>
      <tr>
        <td><code>DELIVERED</code></td>
        <td>Persistent</td>
        <td>Delivered to restaurant table or customer sanctuary villa.</td>
        <td><span class="badge badge-public">Đã Bàn Giao</span></td>
      </tr>

      <!-- Folio & Invoice -->
      <tr>
        <td rowspan="3"><strong>Customer Folio</strong> (<code>Stay_Folio</code>)</td>
        <td><code>OPEN</code></td>
        <td>Persistent</td>
        <td>Active stay; accepting extra charges from Spa (M3) and Dining (M4).</td>
        <td><span class="badge badge-customer">Đang Mở</span></td>
      </tr>
      <tr>
        <td><code>SETTLED</code></td>
        <td>Persistent</td>
        <td>All line items paid; zero balance; cleared for checkout.</td>
        <td><span class="badge badge-customer">Đã Quyết Toán</span></td>
      </tr>
      <tr>
        <td><code>CLOSED</code></td>
        <td>Persistent</td>
        <td>Stay finalized; locked against further debit or credit postings.</td>
        <td><span class="badge badge-public">Đã Đóng</span></td>
      </tr>

      <!-- Runtime Events -->
      <tr>
        <td rowspan="3"><strong>Runtime Evaluation Results</strong> (Non-Persistent)</td>
        <td><code>CANDIDATE_UNAVAILABLE</code></td>
        <td><strong>Runtime Event</strong></td>
        <td>No therapist + room combination open for requested window.</td>
        <td>Error banner ➔ Redirect to Screen 27</td>
      </tr>
      <tr>
        <td><code>ALLERGY_CONFLICT_DETECTED</code></td>
        <td><strong>Runtime Event</strong></td>
        <td>Dish contains allergen listed in customer health profile.</td>
        <td>Red warning badge; dish masked/disabled</td>
      </tr>
      <tr>
        <td><code>BILLING_GUARD_BLOCKED</code></td>
        <td><strong>Runtime Event</strong></td>
        <td>Attempted checkout while unpaid charges or active orders exist.</td>
        <td>Screen 44 Blocker Panel with line-item detail</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- 13. CROSS-MODULE UI DEPENDENCIES -->
<div class="page-break">
  <h1>13. Cross-Module UI Dependencies & Data Flow</h1>

  <h2>13.1 Cross-Module Data Handoff Architecture</h2>
  <p>
    No module in HSWRMS operates as a silo. Every guest experience and staff action relies on verified data published by preceding modules in the lifecycle:
  </p>

  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Originating Source</th>
        <th style="width: 25%;">Consuming Module & Screen</th>
        <th style="width: 25%;">Transferred Data Payload</th>
        <th style="width: 25%;">Enforced Business Dependency</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>M1: Health Profile</strong><br>(Screen 8)</td>
        <td><strong>M3: Spa Session Detail</strong><br>(Screen 33)</td>
        <td>Musculoskeletal tension, mobility constraints, heat precautions.</td>
        <td>Therapist must adapt treatment pressure and oils without viewing medical history.</td>
      </tr>
      <tr>
        <td><strong>M1: Health Profile</strong><br>(Screen 8)</td>
        <td><strong>M4: Kitchen Prep List</strong><br>(Screen 39)</td>
        <td>Food allergies (Nuts, Shellfish, Gluten, Dairy), dietary regime.</td>
        <td>Chef must segregate preparation utensils; allergens highlighted in bold red.</td>
      </tr>
      <tr>
        <td><strong>M2: Retreat Booking</strong><br>(Screen 15–17)</td>
        <td><strong>M3: Spa Scheduling</strong><br>(Screen 26)</td>
        <td>Active stay dates, retreat package code, included therapy quota.</td>
        <td>Spa appointments must fall strictly within retreat check-in and check-out dates.</td>
      </tr>
      <tr>
        <td><strong>M2: Retreat Booking</strong><br>(Screen 15–17)</td>
        <td><strong>M4: Dietary Dining</strong><br>(Screen 35)</td>
        <td>Stay tenure, guest headcount, included daily meal entitlement.</td>
        <td>Daily meal pre-selection available only for dates corresponding to booked stay.</td>
      </tr>
      <tr>
        <td><strong>M3: Extra Spa Booking</strong><br>(Screen 30)</td>
        <td><strong>M5: Consolidated Folio</strong><br>(Screen 41)</td>
        <td>Service ID, treatment title, practitioner, price (VND), timestamp.</td>
        <td>Extra therapy charges immediately append as pending debit line items on folio.</td>
      </tr>
      <tr>
        <td><strong>M4: A-la-carte Dining</strong><br>(Screen 36)</td>
        <td><strong>M5: Consolidated Folio</strong><br>(Screen 41)</td>
        <td>Order ID, line items, quantity, total price (VND), delivery villa.</td>
        <td>Culinary room-service charges automatically post to customer folio.</td>
      </tr>
      <tr>
        <td><strong>M2 + M3 + M4</strong><br>(All Active Services)</td>
        <td><strong>M5: Consolidated Invoice</strong><br>(Screen 41–44)</td>
        <td>Package balance + Spa extras + F&B extras + Statutory taxes.</td>
        <td>Billing guard aggregates all debits; checkout blocked until folio reaches 0 balance.</td>
      </tr>
      <tr>
        <td><strong>M6: Business Params & Flags</strong><br>(Screen 50, 51)</td>
        <td><strong>Modules 1 through 5</strong><br>(All System Screens)</td>
        <td>Deposit % (30%), refund windows, feature flags, RBAC rules.</td>
        <td>Runtime behavior and feature availability dynamically governed across all screens.</td>
      </tr>
    </tbody>
  </table>

  <h2>13.2 Visual End-to-End Enterprise Flowchart</h2>
  <div class="card-box" style="background: #ffffff; padding: 14px; text-align: center;">
    <div style="font-family: monospace; font-size: 8pt; line-height: 1.5; display: inline-block; text-align: left;">
      [Customer Signs Up & Verifies OTP (Screens 3, 4)]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      [Records Health & Dietary Profile with Explicit Consent (Screen 8)]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      [Books Retreat Package & Pays 30% VNPay Deposit (Screens 13–17)]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;├─────────────────────────────────────────┐<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      [Schedules 2D Spa Therapies (Screens 25–28)]&nbsp;&nbsp;&nbsp;&nbsp;[Pre-selects Daily Meals (Screens 34–35)]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      [Therapist Delivers Session (Screen 33)]&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Chef Prepares & Fulfills Dishes (Screen 40)]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└────────────────────┬────────────────────┘<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Front Desk Consolidates Folio (Screen 41)]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Processes Final Settlement Payment (Screens 42–43)]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Billing Guard Validated ➔ Checkout Confirmed (Screen 44)]<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;│<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;▼<br>
      &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Optional Post-Stay Rating & Review (Screen 45)]
    </div>
  </div>
</div>
`;
}
