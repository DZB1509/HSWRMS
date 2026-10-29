import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { CustomerLayout } from '../layouts/CustomerLayout';
import { OperationalLayout } from '../layouts/OperationalLayout';
import { ManagerAdminLayout } from '../layouts/ManagerAdminLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { RoleGuard } from './guards/RoleGuard';
import { StaffAccountListPage } from '../../pages/admin/StaffAccountListPage';
import { StaffAccountDetailPage } from '../../pages/admin/StaffAccountDetailPage';
import { MasterDataPage } from '../../pages/admin/MasterDataPage';

// Phase 2.1 Implemented Screens
import { LandingPage } from '../../pages/public/LandingPage';
import { RetreatListPage } from '../../pages/retreats/RetreatListPage';
import { RetreatDetailPage } from '../../pages/retreats/RetreatDetailPage';
import { LoginPage } from '../../pages/auth/LoginPage';
import { RegisterPage } from '../../pages/auth/RegisterPage';
import { SsoCallbackPage } from '../../pages/auth/SsoCallbackPage';
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
import { ReceptionistBookingsPage } from '../../pages/receptionist/ReceptionistBookingsPage';

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

// Phase 2.6 Module 5 Screens (Folio, Payment, Checkout, Review, Analytics)
import { FolioInvoicePage } from '../../pages/customer/FolioInvoicePage';
import { FinalPaymentPage } from '../../pages/customer/FinalPaymentPage';
import { FinalPaymentResultPage } from '../../pages/customer/FinalPaymentResultPage';
import { CheckoutConfirmationPage } from '../../pages/customer/CheckoutConfirmationPage';
import { ReviewRatingPage } from '../../pages/customer/ReviewRatingPage';
import { RevenueDashboardPage } from '../../pages/manager/RevenueDashboardPage';
import { OccupancyReportPage } from '../../pages/manager/OccupancyReportPage';
import { TherapistUtilizationReportPage } from '../../pages/manager/TherapistUtilizationReportPage';

// Phase 2.7 Module 6 Screens (Admin, Permissions, Governance & Monitoring)
import { AdminDashboardPage } from '../../pages/admin/AdminDashboardPage';
import { BusinessParametersPage } from '../../pages/admin/BusinessParametersPage';
import { FeatureFlagsPage } from '../../pages/admin/FeatureFlagsPage';
import { PermissionMatrixPage } from '../../pages/admin/PermissionMatrixPage';
import { AdminDelegationPage } from '../../pages/admin/AdminDelegationPage';
import { SensitiveAuditLogPage } from '../../pages/admin/SensitiveAuditLogPage';
import { ManagerDashboardPage } from '../../pages/manager/ManagerDashboardPage';
import { VillaManagementPage } from '../../pages/manager/VillaManagementPage';
import { SpaManagementPage } from '../../pages/manager/SpaManagementPage';
import { SystemOverviewPage } from '../../pages/common/SystemOverviewPage';

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
        {/* Screen #6: Google SSO Callback */}
        <Route path="/auth/sso/callback" element={<SsoCallbackPage />} />
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
        <Route path="booking" element={<RetreatBookingPage />} />
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

        {/* Module 5: Customer Read-only Folio, Payment, Checkout & Review */}
        <Route path="folio" element={<FolioInvoicePage />} />
        <Route path="checkout/payment" element={<FinalPaymentPage />} />
        <Route path="checkout/payment-result" element={<FinalPaymentResultPage />} />
        <Route path="checkout/confirmation" element={<CheckoutConfirmationPage />} />
        <Route path="review/:bookingId" element={<ReviewRatingPage />} />
        
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
        <Route path="bookings" element={<ReceptionistBookingsPage />} />
        <Route path="check-in/:bookingId" element={<CheckInPage />} />
        <Route path="check-in/:bookingId/villa" element={<VillaAssignmentPage />} />
        <Route path="villas" element={<VillaStatusPage />} />
        
        {/* Module 3 Manual Extra Spa (Phase 2.4 — Implemented) */}
        <Route path="spa/extra-booking" element={<ManualExtraSpaPage />} />
        
        {/* Module 5 Checkout Consolidation */}
        <Route path="folio/:bookingId" element={<FolioInvoicePage />} />
        <Route path="checkout/:bookingId/payment" element={<FinalPaymentPage />} />
        <Route path="checkout/:bookingId/payment-result" element={<FinalPaymentResultPage />} />
        <Route path="checkout/:bookingId/confirmation" element={<CheckoutConfirmationPage />} />

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
        <Route path="dashboard" element={<ManagerDashboardPage />} />
        <Route path="villas" element={<VillaManagementPage />} />
        <Route path="spa" element={<SpaManagementPage />} />
        <Route path="revenue" element={<RevenueDashboardPage />} />
        <Route path="occupancy" element={<OccupancyReportPage />} />
        <Route path="therapist-utilization" element={<TherapistUtilizationReportPage />} />
        <Route path="system-overview" element={<SystemOverviewPage />} />
        <Route index element={<Navigate to="/manager/dashboard" replace />} />
      </Route>

      {/* ====================================================================
          8. Admin System Administration (ManagerAdminLayout)
          Parent admits admin + manager ONLY so a Manager holding a valid delegation can reach
          the delegated business-params screen. Every child is individually guarded:
          admin-only, except business-params (capability-gated). Backend @PreAuthorize is the
          source of truth; these guards are UX protection.
          ==================================================================== */}
      <Route
        path="/admin"
        element={
          <RoleGuard allowedRoles={['admin', 'manager']}>
            <ManagerAdminLayout />
          </RoleGuard>
        }
      >
        <Route path="dashboard" element={<RoleGuard allowedRoles={['admin']}><AdminDashboardPage /></RoleGuard>} />
        <Route path="villas" element={<RoleGuard allowedRoles={['admin', 'manager']}><VillaManagementPage /></RoleGuard>} />
        <Route path="spa" element={<RoleGuard allowedRoles={['admin', 'manager']}><SpaManagementPage /></RoleGuard>} />
        <Route path="staff" element={<RoleGuard allowedRoles={['admin']} requiredPermission="S10:V"><StaffAccountListPage /></RoleGuard>} />
        <Route path="staff/:id" element={<RoleGuard allowedRoles={['admin']} requiredPermission="S11:V"><StaffAccountDetailPage /></RoleGuard>} />
        <Route path="master-data" element={<RoleGuard allowedRoles={['admin']}><MasterDataPage /></RoleGuard>} />
        <Route
          path="business-params"
          element={
            <RoleGuard requiredCapability="configure_business_parameters">
              <BusinessParametersPage />
            </RoleGuard>
          }
        />
        <Route
          path="feature-flags"
          element={
            <RoleGuard requiredCapability="manage_feature_flags">
              <FeatureFlagsPage />
            </RoleGuard>
          }
        />
        <Route path="permissions" element={<RoleGuard allowedRoles={['admin']} requiredPermission="S51:V"><PermissionMatrixPage /></RoleGuard>} />
        <Route path="delegation" element={<RoleGuard allowedRoles={['admin']} requiredPermission="S52:V"><AdminDelegationPage /></RoleGuard>} />
        <Route path="audit-log" element={<RoleGuard allowedRoles={['admin']} requiredPermission="S53:V"><SensitiveAuditLogPage /></RoleGuard>} />
        <Route path="system-overview" element={<SystemOverviewPage />} />
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      {/* Fallback 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
