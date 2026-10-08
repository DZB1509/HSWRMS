export function renderSection2() {
  return `
<!-- 4. MASTER SCREEN & NAVIGATION OVERVIEW -->
<div class="page-break">
  <h1>4. Master Screen & Navigation Overview</h1>

  <p>
    The official screen inventory of HSWRMS consists of exactly <strong>56 baseline screens</strong> catalogued in <code>Screen_List.md</code>. In the current frontend prototype, 100% of these screens are implemented as dedicated React components, registered in the router, and connected through simulated domain contexts.
  </p>

  <h2>4.1 Master Screen Inventory Table (Screens 1 through 56)</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 4%;">#</th>
        <th style="width: 15%;">Screen Name</th>
        <th style="width: 10%;">Module</th>
        <th style="width: 10%;">Actor</th>
        <th style="width: 17%;">Route</th>
        <th style="width: 16%;">React Component</th>
        <th style="width: 16%;">Previous Screen</th>
        <th style="width: 12%;">Next Screen</th>
      </tr>
    </thead>
    <tbody>
      <!-- Shared & M1 -->
      <tr>
        <td><strong>1</strong></td>
        <td>Public Landing</td>
        <td>Common / M1-M2</td>
        <td><span class="badge badge-public">Public</span></td>
        <td><code>/</code></td>
        <td><code>LandingPage</code></td>
        <td>External / Browser</td>
        <td>Screen 3, 5, 13</td>
      </tr>
      <tr>
        <td><strong>2</strong></td>
        <td>Customer Dashboard</td>
        <td>M1 – Auth</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/dashboard</code></td>
        <td><code>CustomerDashboardPage</code></td>
        <td>Screen 5 (Login)</td>
        <td>Screen 8, 18, 25, 34</td>
      </tr>
      <tr>
        <td><strong>3</strong></td>
        <td>Register</td>
        <td>M1 – Auth</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/register</code></td>
        <td><code>RegisterPage</code></td>
        <td>Screen 1, 5</td>
        <td>Screen 4</td>
      </tr>
      <tr>
        <td><strong>4</strong></td>
        <td>Email OTP Verification</td>
        <td>M1 – Auth</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/register/verify</code></td>
        <td><code>EmailOtpVerificationPage</code></td>
        <td>Screen 3</td>
        <td>Screen 5, 8</td>
      </tr>
      <tr>
        <td><strong>5</strong></td>
        <td>Login</td>
        <td>M1 – Auth</td>
        <td><span class="badge badge-public">Public</span></td>
        <td><code>/login</code></td>
        <td><code>LoginPage</code></td>
        <td>Screen 1, 3</td>
        <td>Screen 2, 20, 31, 38, 49</td>
      </tr>
      <tr>
        <td><strong>6</strong></td>
        <td>Password Reset</td>
        <td>M1 – Auth</td>
        <td><span class="badge badge-public">Public</span></td>
        <td><code>/password-reset</code></td>
        <td><code>PasswordResetPage</code></td>
        <td>Screen 5</td>
        <td>Screen 5</td>
      </tr>
      <tr>
        <td><strong>7</strong></td>
        <td>Account Settings</td>
        <td>M1 – Auth</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/account</code></td>
        <td><code>AccountSettingsPage</code></td>
        <td>Screen 2</td>
        <td>Screen 2, 8</td>
      </tr>
      <tr>
        <td><strong>8</strong></td>
        <td>Health & Dietary Profile</td>
        <td>M1 – Health</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/health-profile</code></td>
        <td><code>HealthProfilePage</code></td>
        <td>Screen 2, 4</td>
        <td>Screen 9, 25, 34</td>
      </tr>
      <tr>
        <td><strong>9</strong></td>
        <td>Health Data Deletion Request</td>
        <td>M1 – Health</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/health-profile/deletion</code></td>
        <td><code>HealthDataDeletionPage</code></td>
        <td>Screen 8</td>
        <td>Screen 8</td>
      </tr>
      <tr>
        <td><strong>10</strong></td>
        <td>Staff Account List</td>
        <td>M1 – Staff</td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td><code>/admin/staff</code></td>
        <td><code>StaffAccountListPage</code></td>
        <td>Screen 49</td>
        <td>Screen 11</td>
      </tr>
      <tr>
        <td><strong>11</strong></td>
        <td>Staff Account Detail</td>
        <td>M1 – Staff</td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td><code>/admin/staff/:id</code></td>
        <td><code>StaffAccountDetailPage</code></td>
        <td>Screen 10</td>
        <td>Screen 10</td>
      </tr>
      <tr>
        <td><strong>12</strong></td>
        <td>Master Data Management</td>
        <td>M1 – Master</td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td><code>/admin/master-data</code></td>
        <td><code>MasterDataPage</code></td>
        <td>Screen 49</td>
        <td>Screen 49</td>
      </tr>

      <!-- Module 2 -->
      <tr>
        <td><strong>13</strong></td>
        <td>Retreat Package List</td>
        <td>M2 – Booking</td>
        <td><span class="badge badge-customer">Customer/Public</span></td>
        <td><code>/retreats</code></td>
        <td><code>RetreatListPage</code></td>
        <td>Screen 1, 2</td>
        <td>Screen 14</td>
      </tr>
      <tr>
        <td><strong>14</strong></td>
        <td>Retreat Package Detail</td>
        <td>M2 – Booking</td>
        <td><span class="badge badge-customer">Customer/Public</span></td>
        <td><code>/retreats/:id</code></td>
        <td><code>RetreatDetailPage</code></td>
        <td>Screen 13</td>
        <td>Screen 15</td>
      </tr>
      <tr>
        <td><strong>15</strong></td>
        <td>Retreat Booking Form</td>
        <td>M2 – Booking</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/booking/new</code></td>
        <td><code>RetreatBookingPage</code></td>
        <td>Screen 14</td>
        <td>Screen 16</td>
      </tr>
      <tr>
        <td><strong>16</strong></td>
        <td>Booking Summary & Deposit</td>
        <td>M2 – Booking</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/booking/summary</code></td>
        <td><code>BookingSummaryPage</code></td>
        <td>Screen 15</td>
        <td>VNPay Gateway (Ext)</td>
      </tr>
      <tr>
        <td><strong>17</strong></td>
        <td>Deposit Payment Result</td>
        <td>M2 – Booking</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/booking/deposit-result</code></td>
        <td><code>DepositPaymentResultPage</code></td>
        <td>VNPay Gateway (Ext)</td>
        <td>Screen 18, 19</td>
      </tr>
      <tr>
        <td><strong>18</strong></td>
        <td>My Bookings</td>
        <td>M2 – Booking</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/bookings</code></td>
        <td><code>MyBookingsPage</code></td>
        <td>Screen 2, 17</td>
        <td>Screen 19</td>
      </tr>
      <tr>
        <td><strong>19</strong></td>
        <td>Booking Detail & Itinerary</td>
        <td>M2 – Booking</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/bookings/:id</code></td>
        <td><code>BookingDetailPage</code></td>
        <td>Screen 18</td>
        <td>Screen 25, 34, 41</td>
      </tr>
      <tr>
        <td><strong>20</strong></td>
        <td>Receptionist Dashboard</td>
        <td>M2 – Front Desk</td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td><code>/receptionist/dashboard</code></td>
        <td><code>ReceptionistDashboardPage</code></td>
        <td>Screen 5</td>
        <td>Screen 21, 24, 41</td>
      </tr>
      <tr>
        <td><strong>21</strong></td>
        <td>Daily Arrivals</td>
        <td>M2 – Check-In</td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td><code>/receptionist/arrivals</code></td>
        <td><code>DailyArrivalsPage</code></td>
        <td>Screen 20</td>
        <td>Screen 22</td>
      </tr>
      <tr>
        <td><strong>22</strong></td>
        <td>Check-In & Residence Info</td>
        <td>M2 – Check-In</td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td><code>/receptionist/check-in/:bookingId</code></td>
        <td><code>CheckInPage</code></td>
        <td>Screen 21</td>
        <td>Screen 23</td>
      </tr>
      <tr>
        <td><strong>23</strong></td>
        <td>Villa Assignment</td>
        <td>M2 – Check-In</td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td><code>/receptionist/check-in/:bookingId/villa</code></td>
        <td><code>VillaAssignmentPage</code></td>
        <td>Screen 22</td>
        <td>Screen 21, 24</td>
      </tr>
      <tr>
        <td><strong>24</strong></td>
        <td>Villa Status Management</td>
        <td>M2 – Accom Ops</td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td><code>/receptionist/villas</code></td>
        <td><code>VillaStatusPage</code></td>
        <td>Screen 20</td>
        <td>Screen 20</td>
      </tr>

      <!-- Module 3 -->
      <tr>
        <td><strong>25</strong></td>
        <td>Spa Treatment List</td>
        <td>M3 – Spa</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/spa</code></td>
        <td><code>SpaTreatmentListPage</code></td>
        <td>Screen 2, 19</td>
        <td>Screen 26</td>
      </tr>
      <tr>
        <td><strong>26</strong></td>
        <td>Spa Session Booking</td>
        <td>M3 – Spa</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/spa/book</code></td>
        <td><code>SpaBookingPage</code></td>
        <td>Screen 25</td>
        <td>Screen 27, 28</td>
      </tr>
      <tr>
        <td><strong>27</strong></td>
        <td>Alternative Slot Selection</td>
        <td>M3 – Spa</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/spa/alternatives</code></td>
        <td><code>SpaAlternativeSlotsPage</code></td>
        <td>Screen 26 (Conflict)</td>
        <td>Screen 28</td>
      </tr>
      <tr>
        <td><strong>28</strong></td>
        <td>Spa Booking Confirmation</td>
        <td>M3 – Spa</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/spa/confirmation</code></td>
        <td><code>SpaConfirmationPage</code></td>
        <td>Screen 26, 27</td>
        <td>Screen 29</td>
      </tr>
      <tr>
        <td><strong>29</strong></td>
        <td>My Spa Sessions</td>
        <td>M3 – Spa</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/spa/sessions</code></td>
        <td><code>MySpaSessions</code></td>
        <td>Screen 2, 28</td>
        <td>Screen 25, 26</td>
      </tr>
      <tr>
        <td><strong>30</strong></td>
        <td>Manual Extra Spa Booking</td>
        <td>M3 – Extra Spa</td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td><code>/receptionist/spa/extra-booking</code></td>
        <td><code>ManualExtraSpaPage</code></td>
        <td>Screen 20</td>
        <td>Screen 41</td>
      </tr>
      <tr>
        <td><strong>31</strong></td>
        <td>Therapist Dashboard</td>
        <td>M3 – Ops</td>
        <td><span class="badge badge-therapist">Therapist</span></td>
        <td><code>/therapist/dashboard</code></td>
        <td><code>TherapistDashboardPage</code></td>
        <td>Screen 5</td>
        <td>Screen 32</td>
      </tr>
      <tr>
        <td><strong>32</strong></td>
        <td>Therapist Daily Schedule</td>
        <td>M3 – Ops</td>
        <td><span class="badge badge-therapist">Therapist</span></td>
        <td><code>/therapist/schedule</code></td>
        <td><code>TherapistSchedulePage</code></td>
        <td>Screen 31</td>
        <td>Screen 33</td>
      </tr>
      <tr>
        <td><strong>33</strong></td>
        <td>Therapist Session Detail</td>
        <td>M3 – Ops</td>
        <td><span class="badge badge-therapist">Therapist</span></td>
        <td><code>/therapist/sessions/:id</code></td>
        <td><code>TherapistSessionDetailPage</code></td>
        <td>Screen 32</td>
        <td>Screen 32</td>
      </tr>

      <!-- Module 4 -->
      <tr>
        <td><strong>34</strong></td>
        <td>Dietary Menu</td>
        <td>M4 – Dining</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/dining/menu</code></td>
        <td><code>DietaryMenuPage</code></td>
        <td>Screen 2, 19</td>
        <td>Screen 35, 36</td>
      </tr>
      <tr>
        <td><strong>35</strong></td>
        <td>Daily Meal Selection</td>
        <td>M4 – Dining</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/dining/select</code></td>
        <td><code>DailyMealSelectionPage</code></td>
        <td>Screen 34</td>
        <td>Screen 37</td>
      </tr>
      <tr>
        <td><strong>36</strong></td>
        <td>Extra A-la-carte Order</td>
        <td>M4 – Extra F&B</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/dining/extra</code></td>
        <td><code>AlaCarteOrderPage</code></td>
        <td>Screen 34</td>
        <td>Screen 37, 41</td>
      </tr>
      <tr>
        <td><strong>37</strong></td>
        <td>My Meal Plan / Orders</td>
        <td>M4 – Dining</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/dining/orders</code></td>
        <td><code>MyMealPlanPage</code></td>
        <td>Screen 2, 35, 36</td>
        <td>Screen 34</td>
      </tr>
      <tr>
        <td><strong>38</strong></td>
        <td>F&B Dashboard</td>
        <td>M4 – Ops</td>
        <td><span class="badge badge-fb">F&B Staff / Chef</span></td>
        <td><code>/fb/dashboard</code></td>
        <td><code>FnbDashboardPage</code></td>
        <td>Screen 5</td>
        <td>Screen 39</td>
      </tr>
      <tr>
        <td><strong>39</strong></td>
        <td>Daily Meal Prep List</td>
        <td>M4 – Ops</td>
        <td><span class="badge badge-fb">F&B Staff / Chef</span></td>
        <td><code>/fb/meal-prep</code></td>
        <td><code>MealPrepListPage</code></td>
        <td>Screen 38</td>
        <td>Screen 40</td>
      </tr>
      <tr>
        <td><strong>40</strong></td>
        <td>Meal Order Detail</td>
        <td>M4 – Ops</td>
        <td><span class="badge badge-fb">F&B Staff / Chef</span></td>
        <td><code>/fb/orders/:id</code></td>
        <td><code>MealOrderDetailPage</code></td>
        <td>Screen 39</td>
        <td>Screen 39</td>
      </tr>

      <!-- Module 5 -->
      <tr>
        <td><strong>41</strong></td>
        <td>Folio & Consolidated Invoice</td>
        <td>M5 – Checkout</td>
        <td><span class="badge badge-receptionist">Receptionist</span> / <span class="badge badge-customer">Customer</span></td>
        <td><code>/receptionist/folio/:bookingId</code><br><code>/customer/folio</code></td>
        <td><code>FolioInvoicePage</code></td>
        <td>Screen 20, 2</td>
        <td>Screen 42</td>
      </tr>
      <tr>
        <td><strong>42</strong></td>
        <td>Final Payment</td>
        <td>M5 – Checkout</td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td><code>/receptionist/checkout/:bookingId/payment</code><br><code>/customer/checkout/payment</code></td>
        <td><code>FinalPaymentPage</code></td>
        <td>Screen 41</td>
        <td>Screen 43</td>
      </tr>
      <tr>
        <td><strong>43</strong></td>
        <td>Final Payment Result</td>
        <td>M5 – Checkout</td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td><code>/receptionist/checkout/:bookingId/payment-result</code><br><code>/customer/checkout/payment-result</code></td>
        <td><code>FinalPaymentResultPage</code></td>
        <td>Screen 42</td>
        <td>Screen 44</td>
      </tr>
      <tr>
        <td><strong>44</strong></td>
        <td>Checkout Confirmation</td>
        <td>M5 – Checkout</td>
        <td><span class="badge badge-receptionist">Receptionist</span></td>
        <td><code>/receptionist/checkout/:bookingId/confirmation</code><br><code>/customer/checkout/confirmation</code></td>
        <td><code>CheckoutConfirmationPage</code></td>
        <td>Screen 43</td>
        <td>Screen 20, 45</td>
      </tr>
      <tr>
        <td><strong>45</strong></td>
        <td>Review & Rating</td>
        <td>M5 – Feedback</td>
        <td><span class="badge badge-customer">Customer</span></td>
        <td><code>/customer/review/:bookingId</code></td>
        <td><code>ReviewRatingPage</code></td>
        <td>Screen 44 / Email</td>
        <td>Screen 2</td>
      </tr>
      <tr>
        <td><strong>46</strong></td>
        <td>Revenue Dashboard</td>
        <td>M5 – Analytics</td>
        <td><span class="badge badge-manager">Manager</span></td>
        <td><code>/manager/revenue</code></td>
        <td><code>RevenueDashboardPage</code></td>
        <td>Screen 55</td>
        <td>Screen 47, 48</td>
      </tr>
      <tr>
        <td><strong>47</strong></td>
        <td>Occupancy Report</td>
        <td>M5 – Analytics</td>
        <td><span class="badge badge-manager">Manager</span></td>
        <td><code>/manager/occupancy</code></td>
        <td><code>OccupancyReportPage</code></td>
        <td>Screen 55</td>
        <td>Screen 46, 48</td>
      </tr>
      <tr>
        <td><strong>48</strong></td>
        <td>Therapist Utilization Report</td>
        <td>M5 – Analytics</td>
        <td><span class="badge badge-manager">Manager</span></td>
        <td><code>/manager/therapist-utilization</code></td>
        <td><code>TherapistUtilizationReportPage</code></td>
        <td>Screen 55</td>
        <td>Screen 46, 47</td>
      </tr>

      <!-- Module 6 -->
      <tr>
        <td><strong>49</strong></td>
        <td>Admin Dashboard</td>
        <td>M6 – Admin</td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td><code>/admin/dashboard</code></td>
        <td><code>AdminDashboardPage</code></td>
        <td>Screen 5</td>
        <td>Screen 10, 12, 50-54</td>
      </tr>
      <tr>
        <td><strong>50</strong></td>
        <td>Business Parameters</td>
        <td>M6 – Admin</td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td><code>/admin/business-params</code></td>
        <td><code>BusinessParametersPage</code></td>
        <td>Screen 49</td>
        <td>Screen 49</td>
      </tr>
      <tr>
        <td><strong>51</strong></td>
        <td>Feature Flag Management</td>
        <td>M6 – Admin</td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td><code>/admin/feature-flags</code></td>
        <td><code>FeatureFlagsPage</code></td>
        <td>Screen 49</td>
        <td>Screen 49</td>
      </tr>
      <tr>
        <td><strong>52</strong></td>
        <td>Permission Matrix</td>
        <td>M6 – Admin</td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td><code>/admin/permissions</code></td>
        <td><code>PermissionMatrixPage</code></td>
        <td>Screen 49</td>
        <td>Screen 53</td>
      </tr>
      <tr>
        <td><strong>53</strong></td>
        <td>Admin Rights Delegation</td>
        <td>M6 – Admin</td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td><code>/admin/delegation</code></td>
        <td><code>AdminDelegationPage</code></td>
        <td>Screen 49, 52</td>
        <td>Screen 49</td>
      </tr>
      <tr>
        <td><strong>54</strong></td>
        <td>Sensitive Data Audit Log</td>
        <td>M6 – Audit</td>
        <td><span class="badge badge-admin">Admin</span></td>
        <td><code>/admin/audit-log</code></td>
        <td><code>SensitiveAuditLogPage</code></td>
        <td>Screen 49</td>
        <td>Screen 49</td>
      </tr>
      <tr>
        <td><strong>55</strong></td>
        <td>Manager Dashboard</td>
        <td>M6 – Monitoring</td>
        <td><span class="badge badge-manager">Manager</span></td>
        <td><code>/manager/dashboard</code></td>
        <td><code>ManagerDashboardPage</code></td>
        <td>Screen 5</td>
        <td>Screen 46-48, 56</td>
      </tr>
      <tr>
        <td><strong>56</strong></td>
        <td>System Overview Dashboard</td>
        <td>M6 – Monitoring</td>
        <td><span class="badge badge-admin">Admin</span> / <span class="badge badge-manager">Manager</span></td>
        <td><code>/admin/system-overview</code><br><code>/manager/system-overview</code></td>
        <td><code>SystemOverviewPage</code></td>
        <td>Screen 49, 55</td>
        <td>Screen 49, 55</td>
      </tr>
    </tbody>
  </table>

  <h2>4.2 Shared Screens and Role-Adapted Screen Architecture</h2>
  <div class="card-box">
    <div class="card-title">Shared vs. Role-Adapted Screen Patterns in HSWRMS</div>
    <ul style="font-size: 8.5pt;">
      <li><strong>Public vs. Authenticated Packages (Screens 13 & 14):</strong> When accessed by an unauthenticated visitor, <code>RetreatListPage</code> and <code>RetreatDetailPage</code> render inside <code>PublicLayout</code> with public call-to-action buttons ("Sign In to Book"). When accessed by an authenticated customer (<code>/customer/retreats</code>), they render inside <code>CustomerLayout</code> with direct booking routing.</li>
      <li><strong>Customer Folio & Consolidated Invoice (Screen 41):</strong> In the Receptionist workspace (<code>/receptionist/folio/:bookingId</code>), Screen 41 functions as an operational checkout control deck with billing guard checks, charge reconciliation, and invoice finalization. In the Customer workspace (<code>/customer/folio</code>), Screen 41 adapts to a clean, read-only itemized statement. This achieves 100% functional coverage without inventing an unofficial screen number.</li>
      <li><strong>System Overview Dashboard (Screen 56):</strong> Shared between Administrator and Manager. If accessed by Administrator, the top bar displays <em>"Administrator Clearance"</em> with full operational drill-down controls and police residence export affordance. If accessed by Manager, it displays <em>"Manager Limited Scope"</em> with restricted monitoring metrics.</li>
      <li><strong>External Gateway Transitions:</strong> The prototype explicitly models simulated returns from external payment processing (VNPay deposit callback on Screen 17; VNPay final settlement callback on Screen 43) with query parameter state emulation (<code>?txId=...</code>, <code>?vnp_ResponseCode=00</code>).</li>
    </ul>
  </div>
</div>
`;
}
