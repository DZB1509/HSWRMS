import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { OperationalLayout } from '../layouts/OperationalLayout';
import { ManagerAdminLayout } from '../layouts/ManagerAdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { RoleGuard } from './guards/RoleGuard';
import { PlaceholderScreen } from '../../components/common/PlaceholderScreen';
import type { ScreenMetadata } from '../../types/screen';
import { SCREEN_INVENTORY } from '../../types/screen';

// Phase 2.1 Implemented Screens
import { LandingPage } from '../../pages/public/LandingPage';
import { RetreatListPage } from '../../pages/retreats/RetreatListPage';
import { RetreatDetailPage } from '../../pages/retreats/RetreatDetailPage';
import { LoginPage } from '../../pages/auth/LoginPage';
import { RegisterPage } from '../../pages/auth/RegisterPage';
import { EmailOtpVerificationPage } from '../../pages/auth/EmailOtpVerificationPage';
import { PasswordResetPage } from '../../pages/auth/PasswordResetPage';

// Phase 2.2 Customer Screens
import { CustomerDashboardPage } from '../../pages/customer/CustomerDashboardPage';
import { AccountSettingsPage } from '../../pages/customer/AccountSettingsPage';
import { HealthProfilePage } from '../../pages/customer/HealthProfilePage';
import { HealthDataDeletionPage } from '../../pages/customer/HealthDataDeletionPage';
import { RetreatBookingPage } from '../../pages/customer/RetreatBookingPage';
import { BookingSummaryPage } from '../../pages/customer/BookingSummaryPage';
import { DepositPaymentResultPage } from '../../pages/customer/DepositPaymentResultPage';
import { MyBookingsPage } from '../../pages/customer/MyBookingsPage';
import { BookingDetailPage } from '../../pages/customer/BookingDetailPage';

// Phase 2.3 Receptionist / Front Desk Screens
import { ReceptionistDashboardPage } from '../../pages/receptionist/ReceptionistDashboardPage';
import { DailyArrivalsPage } from '../../pages/receptionist/DailyArrivalsPage';
import { CheckInPage } from '../../pages/receptionist/CheckInPage';
import { VillaAssignmentPage } from '../../pages/receptionist/VillaAssignmentPage';
import { VillaStatusPage } from '../../pages/receptionist/VillaStatusPage';

// Phase 2.4 Spa & Therapy Screens (Customer)
import { SpaTreatmentListPage } from '../../pages/customer/SpaTreatmentListPage';
import { SpaBookingPage } from '../../pages/customer/SpaBookingPage';
import { SpaAlternativeSlotsPage } from '../../pages/customer/SpaAlternativeSlotsPage';
import { SpaConfirmationPage } from '../../pages/customer/SpaConfirmationPage';
import { MySpaSessions } from '../../pages/customer/MySpaSessions';

// Phase 2.4 Receptionist Extra Spa
import { ManualExtraSpaPage } from '../../pages/receptionist/ManualExtraSpaPage';

// Phase 2.4 Therapist Screens
import { TherapistDashboardPage } from '../../pages/therapist/TherapistDashboardPage';
import { TherapistSchedulePage } from '../../pages/therapist/TherapistSchedulePage';
import { TherapistSessionDetailPage } from '../../pages/therapist/TherapistSessionDetailPage';

// Phase 2.5 Dining & F&B Screens (Customer)
import { DietaryMenuPage } from '../../pages/customer/DietaryMenuPage';
import { DailyMealSelectionPage } from '../../pages/customer/DailyMealSelectionPage';
import { AlaCarteOrderPage } from '../../pages/customer/AlaCarteOrderPage';
import { MyMealPlanPage } from '../../pages/customer/MyMealPlanPage';

// Phase 2.5 Dining & F&B Screens (Staff)
import { FnbDashboardPage } from '../../pages/fb/FnbDashboardPage';
import { MealPrepListPage } from '../../pages/fb/MealPrepListPage';
import { MealOrderDetailPage } from '../../pages/fb/MealOrderDetailPage';

// Helper to look up screen metadata by screen number
const getScreen = (num: number): ScreenMetadata => {
  const found = SCREEN_INVENTORY.find((s) => s.number === num);
  if (!found) {
    throw new Error(`Screen #${num} not found in inventory`);
  }
  return found;
};

export const AppRouter: React.FC = () => {
  return (
    <Routes>
      {/* ====================================================================
          1. Public / Shared Pages (PublicLayout)
          ==================================================================== */}
      <Route element={<PublicLayout />}>
        {/* Screen #1: Public Landing */}
        <Route path="/" element={<LandingPage />} />
        {/* Screen #13: Retreat Package List */}
        <Route path="/retreats" element={<RetreatListPage />} />
        {/* Screen #14: Retreat Package Detail */}
        <Route path="/retreats/:id" element={<RetreatDetailPage />} />
      </Route>

      {/* ====================================================================
          2. Authentication & Account Access (AuthLayout)
          ==================================================================== */}
      <Route element={<AuthLayout />}>
        {/* Screen #5: Login */}
        <Route path="/login" element={<LoginPage />} />
        {/* Screen #3: Register */}
        <Route path="/register" element={<RegisterPage />} />
        {/* Screen #4: Email OTP Verification */}
        <Route path="/register/verify" element={<EmailOtpVerificationPage />} />
        {/* Screen #6: Password Reset */}
        <Route path="/password-reset" element={<PasswordResetPage />} />
      </Route>

      {/* ====================================================================
          3. Customer Journey (CustomerLayout - Guard: Customer)
          ==================================================================== */}
      <Route
        path="/customer"
        element={
          <RoleGuard allowedRoles={['customer']}>
            <CustomerLayout />
          </RoleGuard>
        }
      >
        {/* Module 1: Customer Profile & Settings */}
        <Route path="dashboard" element={<CustomerDashboardPage />} />
        <Route path="account" element={<AccountSettingsPage />} />
        <Route path="health-profile" element={<HealthProfilePage />} />
        <Route path="health-profile/deletion" element={<HealthDataDeletionPage />} />
        
        {/* Module 2: Booking Journey */}
        <Route path="retreats" element={<RetreatListPage />} />
        <Route path="retreats/:id" element={<RetreatDetailPage />} />
        <Route path="booking/new" element={<RetreatBookingPage />} />
        <Route path="booking/summary" element={<BookingSummaryPage />} />
        <Route path="booking/deposit-result" element={<DepositPaymentResultPage />} />
        <Route path="bookings" element={<MyBookingsPage />} />
        <Route path="bookings/:id" element={<BookingDetailPage />} />

        {/* Module 3: Spa & Therapy (Phase 2.4 — Implemented) */}
        <Route path="spa" element={<SpaTreatmentListPage />} />
        <Route path="spa/book" element={<SpaBookingPage />} />
        <Route path="spa/alternatives" element={<SpaAlternativeSlotsPage />} />
        <Route path="spa/confirmation" element={<SpaConfirmationPage />} />
        <Route path="spa/sessions" element={<MySpaSessions />} />

        {/* Module 4: Dining F&B */}
        <Route path="dining/menu" element={<DietaryMenuPage />} />
        <Route path="dining/select" element={<DailyMealSelectionPage />} />
        <Route path="dining/extra" element={<AlaCarteOrderPage />} />
        <Route path="dining/orders" element={<MyMealPlanPage />} />

        {/* Module 5: Customer Read-only Folio & Review */}
        <Route
          path="folio"
          element={
            <PlaceholderScreen
              screen={{
                ...getScreen(41),
                name: 'My Stay Charges & Folio Summary',
                description: 'Customer read-only view of current retreat balance, spa sessions, and dining charges (role-adapted view of Screen #41).'
              }}
            />
          }
        />
        <Route path="review/:bookingId" element={<PlaceholderScreen screen={getScreen(45)} />} />
        
        <Route index element={<Navigate to="/customer/dashboard" replace />} />
      </Route>

      {/* ====================================================================
          4. Receptionist Operations (OperationalLayout - Guard: Receptionist)
          ==================================================================== */}
      <Route
        path="/receptionist"
        element={
          <RoleGuard allowedRoles={['receptionist']}>
            <OperationalLayout />
          </RoleGuard>
        }
      >
        <Route path="dashboard" element={<ReceptionistDashboardPage />} />
        <Route path="arrivals" element={<DailyArrivalsPage />} />
        <Route path="check-in/:bookingId" element={<CheckInPage />} />
        <Route path="check-in/:bookingId/villa" element={<VillaAssignmentPage />} />
        <Route path="villas" element={<VillaStatusPage />} />
        
        {/* Module 3 Manual Extra Spa (Phase 2.4 — Implemented) */}
        <Route path="spa/extra-booking" element={<ManualExtraSpaPage />} />
        
        {/* Module 5 Checkout Consolidation */}
        <Route path="folio/:bookingId" element={<PlaceholderScreen screen={getScreen(41)} />} />
        <Route path="checkout/:bookingId/payment" element={<PlaceholderScreen screen={getScreen(42)} />} />
        <Route path="checkout/:bookingId/payment-result" element={<PlaceholderScreen screen={getScreen(43)} />} />
        <Route path="checkout/:bookingId/confirmation" element={<PlaceholderScreen screen={getScreen(44)} />} />

        <Route index element={<Navigate to="/receptionist/dashboard" replace />} />
      </Route>

      {/* ====================================================================
          5. Therapist Operations (OperationalLayout - Guard: Therapist)
          ==================================================================== */}
      <Route
        path="/therapist"
        element={
          <RoleGuard allowedRoles={['therapist']}>
            <OperationalLayout />
          </RoleGuard>
        }
      >
        <Route path="dashboard" element={<TherapistDashboardPage />} />
        <Route path="schedule" element={<TherapistSchedulePage />} />
        <Route path="sessions/:id" element={<TherapistSessionDetailPage />} />
        <Route index element={<Navigate to="/therapist/dashboard" replace />} />
      </Route>

      {/* ====================================================================
          6. F&B Staff / Chef Operations (OperationalLayout - Guard: F&B Staff)
          ==================================================================== */}
      <Route
        path="/fb"
        element={
          <RoleGuard allowedRoles={['fb_staff']}>
            <OperationalLayout />
          </RoleGuard>
        }
      >
        <Route path="dashboard" element={<FnbDashboardPage />} />
        <Route path="meal-prep" element={<MealPrepListPage />} />
        <Route path="orders/:id" element={<MealOrderDetailPage />} />
        <Route index element={<Navigate to="/fb/dashboard" replace />} />
      </Route>

      {/* ====================================================================
          7. Manager Operations (ManagerAdminLayout - Guard: Manager)
          ==================================================================== */}
      <Route
        path="/manager"
        element={
          <RoleGuard allowedRoles={['manager']}>
            <ManagerAdminLayout />
          </RoleGuard>
        }
      >
        <Route path="dashboard" element={<PlaceholderScreen screen={getScreen(55)} />} />
        <Route path="revenue" element={<PlaceholderScreen screen={getScreen(46)} />} />
        <Route path="occupancy" element={<PlaceholderScreen screen={getScreen(47)} />} />
        <Route path="therapist-utilization" element={<PlaceholderScreen screen={getScreen(48)} />} />
        <Route
          path="system-overview"
          element={
            <PlaceholderScreen
              screen={{
                ...getScreen(56),
                name: 'System Overview Dashboard (Manager View)',
                description: 'Manager-scoped view of resort operations overview and Police Residency Declaration export.'
              }}
            />
          }
        />
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
      </Route>

      {/* ====================================================================
          8. Admin System Administration (ManagerAdminLayout - Guard: Admin)
          ==================================================================== */}
      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={['admin']}>
            <ManagerAdminLayout />
          </RoleGuard>
        }
      >
        <Route path="dashboard" element={<PlaceholderScreen screen={getScreen(49)} />} />
        <Route path="staff" element={<PlaceholderScreen screen={getScreen(10)} />} />
        <Route path="staff/:id" element={<PlaceholderScreen screen={getScreen(11)} />} />
        <Route path="master-data" element={<PlaceholderScreen screen={getScreen(12)} />} />
        <Route path="business-params" element={<PlaceholderScreen screen={getScreen(50)} />} />
        <Route path="feature-flags" element={<PlaceholderScreen screen={getScreen(51)} />} />
        <Route path="permissions" element={<PlaceholderScreen screen={getScreen(52)} />} />
        <Route path="delegation" element={<PlaceholderScreen screen={getScreen(53)} />} />
        <Route path="audit-log" element={<PlaceholderScreen screen={getScreen(54)} />} />
        <Route path="system-overview" element={<PlaceholderScreen screen={getScreen(56)} />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
