import type { Role } from './auth';

export type LayoutType = 'public' | 'customer' | 'operational' | 'manager-admin' | 'auth';

export interface ScreenMetadata {
  number: number;
  name: string;
  module: string;
  primaryActor: string;
  description: string;
  routePath: string;
  layout: LayoutType;
  requiredRole?: Role;
}

export const SCREEN_INVENTORY: ScreenMetadata[] = [
  // 1. Public / Shared Screens
  {
    number: 1,
    name: 'Public Landing',
    module: 'Common / M1-M2',
    primaryActor: 'Public / Shared',
    description: 'Public entry screen providing access to retreat packages, registration and login.',
    routePath: '/',
    layout: 'public'
  },
  {
    number: 2,
    name: 'Customer Dashboard',
    module: 'M1 – Authentication',
    primaryActor: 'Customer',
    description: 'Main post-login navigation screen for Customer, providing access to bookings, spa sessions, meals, profile and folio.',
    routePath: '/customer/dashboard',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 3,
    name: 'Register',
    module: 'M1 – Authentication',
    primaryActor: 'Customer',
    description: 'Allows a new Customer to create an HSWRMS account using required personal and authentication information.',
    routePath: '/register',
    layout: 'auth'
  },
  {
    number: 4,
    name: 'Email OTP Verification',
    module: 'M1 – Authentication',
    primaryActor: 'Customer',
    description: 'Allows Customer to enter the OTP sent by email to verify the registered account.',
    routePath: '/register/verify',
    layout: 'auth'
  },
  {
    number: 5,
    name: 'Login',
    module: 'M1 – Authentication',
    primaryActor: 'Public / Shared',
    description: 'Allows users to sign in using email/password or initiate supported Google/Facebook SSO.',
    routePath: '/login',
    layout: 'auth'
  },
  {
    number: 6,
    name: 'Password Reset',
    module: 'M1 – Authentication',
    primaryActor: 'Public / Shared',
    description: 'Allows a user to request and set a new password when login credentials are forgotten.',
    routePath: '/password-reset',
    layout: 'auth'
  },
  {
    number: 7,
    name: 'Account Settings',
    module: 'M1 – Authentication',
    primaryActor: 'Customer',
    description: 'Allows an authenticated user to manage basic account and security settings, including password change.',
    routePath: '/customer/account',
    layout: 'customer',
    requiredRole: 'customer'
  },

  // 2. Module 1 – Authentication & Sensitive Health Profile
  {
    number: 8,
    name: 'Health & Dietary Profile',
    module: 'M1 – Health Profile',
    primaryActor: 'Customer',
    description: 'Allows Customer to view, create and update allergy, dietary and treatment-relevant health information with explicit consent.',
    routePath: '/customer/health-profile',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 9,
    name: 'Health Data Deletion Request',
    module: 'M1 – Health Profile',
    primaryActor: 'Customer',
    description: 'Allows Customer to request deletion or anonymization of eligible health and allergy data after retreat completion.',
    routePath: '/customer/health-profile/deletion',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 10,
    name: 'Staff Account List',
    module: 'M1 – Staff Account Management',
    primaryActor: 'Admin',
    description: 'Allows Admin to view and search staff accounts and their assigned roles/status.',
    routePath: '/admin/staff',
    layout: 'manager-admin',
    requiredRole: 'admin'
  },
  {
    number: 11,
    name: 'Staff Account Detail',
    module: 'M1 – Staff Account Management',
    primaryActor: 'Admin',
    description: 'Allows Admin to create, edit, assign roles to or deactivate a staff account.',
    routePath: '/admin/staff/:id',
    layout: 'manager-admin',
    requiredRole: 'admin'
  },
  {
    number: 12,
    name: 'Master Data Management',
    module: 'M1 – Master Data',
    primaryActor: 'Admin',
    description: 'Allows Admin to manage master data such as Villa Categories, Spa Services and Retreat Packages.',
    routePath: '/admin/master-data',
    layout: 'manager-admin',
    requiredRole: 'admin'
  },

  // 3. Module 2 – Retreat Booking & Accommodation
  {
    number: 13,
    name: 'Retreat Package List',
    module: 'M2 – Retreat Booking',
    primaryActor: 'Customer / Public',
    description: 'Displays available retreat packages and allows Customer to filter packages by wellness goal or relevant criteria.',
    routePath: '/retreats',
    layout: 'public'
  },
  {
    number: 14,
    name: 'Retreat Package Detail',
    module: 'M2 – Retreat Booking',
    primaryActor: 'Customer / Public',
    description: 'Displays package description, included services, duration, villa options and information required before booking.',
    routePath: '/retreats/:id',
    layout: 'public'
  },
  {
    number: 15,
    name: 'Retreat Booking Form',
    module: 'M2 – Retreat Booking',
    primaryActor: 'Customer',
    description: 'Allows Customer to select retreat dates, package options and villa type and provide required booking information.',
    routePath: '/customer/booking/new',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 16,
    name: 'Booking Summary & Deposit',
    module: 'M2 – Retreat Booking',
    primaryActor: 'Customer',
    description: 'Shows booking summary, deposit amount and payment information before redirecting the Customer to VNPay.',
    routePath: '/customer/booking/summary',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 17,
    name: 'Deposit Payment Result',
    module: 'M2 – Retreat Booking',
    primaryActor: 'Customer',
    description: 'Displays the returned deposit payment result and confirmed booking information after VNPay processing.',
    routePath: '/customer/booking/deposit-result',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 18,
    name: 'My Bookings',
    module: 'M2 – Booking Management',
    primaryActor: 'Customer',
    description: "Displays the Customer's current and historical retreat bookings.",
    routePath: '/customer/bookings',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 19,
    name: 'Booking Detail & Itinerary',
    module: 'M2 – Booking Management',
    primaryActor: 'Customer',
    description: 'Displays booking status, retreat information, accommodation details and itinerary timeline.',
    routePath: '/customer/bookings/:id',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 20,
    name: 'Receptionist Dashboard',
    module: 'M2 – Front Desk',
    primaryActor: 'Receptionist',
    description: 'Main operational navigation screen for Receptionist, including arrivals, check-in, villa operations and checkout access.',
    routePath: '/receptionist/dashboard',
    layout: 'operational',
    requiredRole: 'receptionist'
  },
  {
    number: 21,
    name: 'Daily Arrivals',
    module: 'M2 – Check-In',
    primaryActor: 'Receptionist',
    description: 'Displays Customers expected to arrive and allows Receptionist to open the relevant booking for check-in.',
    routePath: '/receptionist/arrivals',
    layout: 'operational',
    requiredRole: 'receptionist'
  },
  {
    number: 22,
    name: 'Check-In & Residence Information',
    module: 'M2 – Check-In',
    primaryActor: 'Receptionist',
    description: 'Allows Receptionist to verify the Customer and collect required identification and residence information for check-in.',
    routePath: '/receptionist/check-in/:bookingId',
    layout: 'operational',
    requiredRole: 'receptionist'
  },
  {
    number: 23,
    name: 'Villa Assignment',
    module: 'M2 – Check-In',
    primaryActor: 'Receptionist',
    description: 'Allows Receptionist to assign an available physical villa to a confirmed booking during check-in.',
    routePath: '/receptionist/check-in/:bookingId/villa',
    layout: 'operational',
    requiredRole: 'receptionist'
  },
  {
    number: 24,
    name: 'Villa Status Management',
    module: 'M2 – Accommodation Operations',
    primaryActor: 'Receptionist',
    description: 'Allows Receptionist to view and update operational villa status such as Available, Occupied or Maintenance.',
    routePath: '/receptionist/villas',
    layout: 'operational',
    requiredRole: 'receptionist'
  },

  // 4. Module 3 – Spa & Therapy Scheduling
  {
    number: 25,
    name: 'Spa Treatment List',
    module: 'M3 – Spa Scheduling',
    primaryActor: 'Customer',
    description: 'Displays Spa/Therapy services available to the Customer, including services included in the retreat package.',
    routePath: '/customer/spa',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 26,
    name: 'Spa Session Booking',
    module: 'M3 – Spa Scheduling',
    primaryActor: 'Customer',
    description: 'Allows Customer to select a Spa/Therapy service, date and requested time slot with 2D Therapist + Room validation.',
    routePath: '/customer/spa/book',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 27,
    name: 'Available / Alternative Slot Selection',
    module: 'M3 – Spa Scheduling',
    primaryActor: 'Customer',
    description: 'Displays available or alternative time slots when the originally requested Therapist and Treatment Room combination is unavailable.',
    routePath: '/customer/spa/alternatives',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 28,
    name: 'Spa Booking Confirmation',
    module: 'M3 – Spa Scheduling',
    primaryActor: 'Customer',
    description: 'Displays confirmed Spa/Therapy session information after both Therapist and Treatment Room have been successfully reserved.',
    routePath: '/customer/spa/confirmation',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 29,
    name: 'My Spa Sessions',
    module: 'M3 – Spa Scheduling',
    primaryActor: 'Customer',
    description: "Displays upcoming and historical Spa/Therapy sessions belonging to the Customer.",
    routePath: '/customer/spa/sessions',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 30,
    name: 'Manual Extra Spa Booking',
    module: 'M3 – Extra Spa Service',
    primaryActor: 'Receptionist',
    description: 'Allows Receptionist to select a Customer and manually book an extra Spa/Therapy service with charges posted to Customer Folio.',
    routePath: '/receptionist/spa/extra-booking',
    layout: 'operational',
    requiredRole: 'receptionist'
  },
  {
    number: 31,
    name: 'Therapist Dashboard',
    module: 'M3 – Therapist Operations',
    primaryActor: 'Spa Therapist / Yoga Instructor',
    description: 'Main screen showing assigned work and access to the daily schedule.',
    routePath: '/therapist/dashboard',
    layout: 'operational',
    requiredRole: 'therapist'
  },
  {
    number: 32,
    name: 'Therapist Daily Schedule',
    module: 'M3 – Therapist Operations',
    primaryActor: 'Spa Therapist / Yoga Instructor',
    description: 'Displays Spa/Therapy sessions assigned to the logged-in Therapist for the selected working day.',
    routePath: '/therapist/schedule',
    layout: 'operational',
    requiredRole: 'therapist'
  },
  {
    number: 33,
    name: 'Therapist Session Detail',
    module: 'M3 – Therapist Operations',
    primaryActor: 'Spa Therapist / Yoga Instructor',
    description: 'Displays assigned session details and only treatment-relevant health notes; allows Therapist to mark Completed or No-Show.',
    routePath: '/therapist/sessions/:id',
    layout: 'operational',
    requiredRole: 'therapist'
  },

  // 5. Module 4 – Dietary F&B Management
  {
    number: 34,
    name: 'Dietary Menu',
    module: 'M4 – Dietary F&B',
    primaryActor: 'Customer',
    description: "Displays meal options filtered according to the Customer's relevant allergy and dietary profile.",
    routePath: '/customer/dining/menu',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 35,
    name: 'Daily Meal Selection',
    module: 'M4 – Dietary F&B',
    primaryActor: 'Customer',
    description: 'Allows Customer to pre-select meals for the applicable retreat day.',
    routePath: '/customer/dining/select',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 36,
    name: 'Extra A-la-carte Order',
    module: 'M4 – Extra F&B',
    primaryActor: 'Customer',
    description: 'Allows Customer to select and order additional F&B items that are charged to the Customer Folio.',
    routePath: '/customer/dining/extra',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 37,
    name: 'My Meal Plan / Orders',
    module: 'M4 – Dietary F&B',
    primaryActor: 'Customer',
    description: 'Allows Customer to view selected daily meals and submitted additional F&B orders.',
    routePath: '/customer/dining/orders',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 38,
    name: 'F&B Dashboard',
    module: 'M4 – F&B Operations',
    primaryActor: 'F&B Staff / Chef',
    description: 'Main operational screen providing access to daily meal preparation requirements.',
    routePath: '/fb/dashboard',
    layout: 'operational',
    requiredRole: 'fb_staff'
  },
  {
    number: 39,
    name: 'Daily Meal Prep List',
    module: 'M4 – F&B Operations',
    primaryActor: 'F&B Staff / Chef',
    description: 'Displays aggregated meal orders and preparation workload for Chef/F&B Staff.',
    routePath: '/fb/meal-prep',
    layout: 'operational',
    requiredRole: 'fb_staff'
  },
  {
    number: 40,
    name: 'Meal Order Detail',
    module: 'M4 – F&B Operations',
    primaryActor: 'F&B Staff / Chef',
    description: 'Displays meal order details and only relevant allergy/dietary warnings; allows F&B Staff to update status from Preparing to Ready.',
    routePath: '/fb/orders/:id',
    layout: 'operational',
    requiredRole: 'fb_staff'
  },

  // 6. Module 5 – Checkout & Analytics
  {
    number: 41,
    name: 'Customer Folio & Consolidated Invoice',
    module: 'M5 – Checkout',
    primaryActor: 'Receptionist / Customer',
    description: 'Displays consolidated Package, Spa and F&B charges for the stay and identifies outstanding balance with billing guard protection.',
    routePath: '/receptionist/folio/:bookingId',
    layout: 'operational',
    requiredRole: 'receptionist'
  },
  {
    number: 42,
    name: 'Final Payment',
    module: 'M5 – Checkout',
    primaryActor: 'Receptionist',
    description: 'Allows final payment to be initiated only when applicable charges have been consolidated and checkout requirements are satisfied.',
    routePath: '/receptionist/checkout/:bookingId/payment',
    layout: 'operational',
    requiredRole: 'receptionist'
  },
  {
    number: 43,
    name: 'Final Payment Result',
    module: 'M5 – Checkout',
    primaryActor: 'Receptionist',
    description: 'Displays the result returned from the payment process and indicates whether payment was successfully confirmed.',
    routePath: '/receptionist/checkout/:bookingId/payment-result',
    layout: 'operational',
    requiredRole: 'receptionist'
  },
  {
    number: 44,
    name: 'Checkout Confirmation',
    module: 'M5 – Checkout',
    primaryActor: 'Receptionist',
    description: 'Displays successful checkout after payment is confirmed and the booking and villa operational statuses have been updated.',
    routePath: '/receptionist/checkout/:bookingId/confirmation',
    layout: 'operational',
    requiredRole: 'receptionist'
  },
  {
    number: 45,
    name: 'Review & Rating',
    module: 'M5 – Customer Feedback',
    primaryActor: 'Customer',
    description: 'Allows Customer to submit a rating and review for a completed retreat stay, either from HSWRMS or an emailed review link.',
    routePath: '/customer/review/:bookingId',
    layout: 'customer',
    requiredRole: 'customer'
  },
  {
    number: 46,
    name: 'Revenue Dashboard',
    module: 'M5 – Analytics',
    primaryActor: 'Manager',
    description: 'Allows Manager to view revenue information and breakdowns across Retreat Package, Spa and F&B services.',
    routePath: '/manager/revenue',
    layout: 'manager-admin',
    requiredRole: 'manager'
  },
  {
    number: 47,
    name: 'Occupancy Report',
    module: 'M5 – Analytics',
    primaryActor: 'Manager',
    description: 'Allows Manager to view accommodation occupancy information and export permitted report data.',
    routePath: '/manager/occupancy',
    layout: 'manager-admin',
    requiredRole: 'manager'
  },
  {
    number: 48,
    name: 'Therapist Utilization Report',
    module: 'M5 – Analytics',
    primaryActor: 'Manager',
    description: 'Allows Manager to view Therapist utilization information and export permitted report data.',
    routePath: '/manager/therapist-utilization',
    layout: 'manager-admin',
    requiredRole: 'manager'
  },

  // 7. Module 6 – System Administration & Permission Management
  {
    number: 49,
    name: 'Admin Dashboard',
    module: 'M6 – System Administration',
    primaryActor: 'Admin',
    description: 'Main administration navigation screen for Admin, providing access to configuration, permissions, security and audit functions.',
    routePath: '/admin/dashboard',
    layout: 'manager-admin',
    requiredRole: 'admin'
  },
  {
    number: 50,
    name: 'Business Parameters',
    module: 'M6 – System Administration',
    primaryActor: 'Admin',
    description: 'Allows Admin to configure system business parameters such as cancellation windows, refund percentages and other configurable rules.',
    routePath: '/admin/business-params',
    layout: 'manager-admin',
    requiredRole: 'admin'
  },
  {
    number: 51,
    name: 'Feature Flag Management',
    module: 'M6 – System Administration',
    primaryActor: 'Admin',
    description: 'Allows Admin to enable or disable supported system features or modules using feature flags.',
    routePath: '/admin/feature-flags',
    layout: 'manager-admin',
    requiredRole: 'admin'
  },
  {
    number: 52,
    name: 'Permission Matrix',
    module: 'M6 – Permission Management',
    primaryActor: 'Admin',
    description: 'Allows Admin to configure detailed role-to-screen and role-to-function access permissions.',
    routePath: '/admin/permissions',
    layout: 'manager-admin',
    requiredRole: 'admin'
  },
  {
    number: 53,
    name: 'Limited Admin Rights Delegation',
    module: 'M6 – Permission Management',
    primaryActor: 'Admin',
    description: 'Allows Admin to grant or revoke a limited subset of administrative capabilities for Manager.',
    routePath: '/admin/delegation',
    layout: 'manager-admin',
    requiredRole: 'admin'
  },
  {
    number: 54,
    name: 'Sensitive Data Audit Log',
    module: 'M6 – Audit & Security',
    primaryActor: 'Admin',
    description: 'Allows Admin to review logged access and sensitive-data related activities for security and accountability.',
    routePath: '/admin/audit-log',
    layout: 'manager-admin',
    requiredRole: 'admin'
  },
  {
    number: 55,
    name: 'Manager Dashboard',
    module: 'M6 – Management Monitoring',
    primaryActor: 'Manager',
    description: 'Main navigation screen for Manager, providing access to authorized management dashboards, reports and system overview.',
    routePath: '/manager/dashboard',
    layout: 'manager-admin',
    requiredRole: 'manager'
  },
  {
    number: 56,
    name: 'System Overview Dashboard',
    module: 'M6 – System Monitoring',
    primaryActor: 'Admin / Manager',
    description: 'Displays a system-level operational overview to Admin or Manager according to granted permissions, including Police Residency export affordance.',
    routePath: '/admin/system-overview',
    layout: 'manager-admin',
    requiredRole: 'admin'
  }
];
