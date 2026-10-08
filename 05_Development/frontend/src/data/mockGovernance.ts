import type {
  BusinessParameter,
  FeatureFlag,
  PermissionRule,
  AdminDelegation,
  AuditEvent,
  PoliceResidenceExportSummary
} from '../types/governance';

export const INITIAL_BUSINESS_PARAMETERS: BusinessParameter[] = [
  {
    key: 'deposit_default_percentage',
    labelKey: 'governance.params.depositDefault.label',
    defaultLabel: 'Retreat Booking Required Deposit',
    descriptionKey: 'governance.params.depositDefault.desc',
    defaultDescription: 'Required upfront deposit percentage calculated on retreat package base cost prior to VNPay confirmation (30% baseline per booking contract).',
    category: 'booking',
    type: 'percentage',
    currentValue: 30,
    defaultValue: 30,
    unit: '%',
    min: 20,
    max: 100,
    lastUpdatedAt: '2026-09-24 09:00',
    lastUpdatedBy: 'Alexander Wright (Admin)'
  },
  {
    key: 'free_cancellation_window_hours',
    labelKey: 'governance.params.cancellationWindow.label',
    defaultLabel: 'Free Cancellation Cutoff Window',
    descriptionKey: 'governance.params.cancellationWindow.desc',
    defaultDescription: 'Minimum hours prior to retreat arrival date allowed for penalty-free cancellation or full refund eligibility (UC26).',
    category: 'cancellation',
    type: 'hours',
    currentValue: 72,
    defaultValue: 72,
    unit: 'hours',
    min: 24,
    max: 168,
    lastUpdatedAt: '2026-09-24 09:00',
    lastUpdatedBy: 'Alexander Wright (Admin)'
  },
  {
    key: 'cancellation_refund_percentage',
    labelKey: 'governance.params.cancellationRefund.label',
    defaultLabel: 'Standard Cancellation Refund Rate',
    descriptionKey: 'governance.params.cancellationRefund.desc',
    defaultDescription: 'Percentage of deposit refunded when cancellation occurs before the free cancellation cutoff window (UC26).',
    category: 'cancellation',
    type: 'percentage',
    currentValue: 80,
    defaultValue: 80,
    unit: '%',
    min: 0,
    max: 100,
    lastUpdatedAt: '2026-09-24 09:00',
    lastUpdatedBy: 'Alexander Wright (Admin)'
  },
  {
    key: 'dietary_preselection_cutoff_hours',
    labelKey: 'governance.params.dietaryCutoff.label',
    defaultLabel: 'Meal Preselection Lead Time',
    descriptionKey: 'governance.params.dietaryCutoff.desc',
    defaultDescription: 'Hours in advance required for Customer to preselect daily meal courses to allow culinary kitchen prep and allergen verification (UC16).',
    category: 'dietary',
    type: 'hours',
    currentValue: 48,
    defaultValue: 48,
    unit: 'hours',
    min: 12,
    max: 72,
    lastUpdatedAt: '2026-09-24 09:00',
    lastUpdatedBy: 'Alexander Wright (Admin)'
  },
  {
    key: 'police_declaration_export_time',
    labelKey: 'governance.params.policeExportTime.label',
    defaultLabel: 'Daily Police Residence Declaration Batch Time',
    descriptionKey: 'governance.params.policeExportTime.desc',
    defaultDescription: 'Scheduled local time for nightly generation of the temporary residence report modeled around Vietnam Law on Residence 2020.',
    category: 'compliance',
    type: 'time',
    currentValue: '22:00',
    defaultValue: '22:00',
    unit: 'local 24h',
    lastUpdatedAt: '2026-09-25 14:30',
    lastUpdatedBy: 'Alexander Wright (Admin)'
  }
];

export const INITIAL_FEATURE_FLAGS: FeatureFlag[] = [
  {
    key: 'enable_online_extra_spa_booking',
    nameKey: 'governance.flags.extraSpaOnline.name',
    defaultName: 'Customer Online Extra Spa Booking',
    descriptionKey: 'governance.flags.extraSpaOnline.desc',
    defaultDescription: 'Allows checked-in Customers to book supplementary Spa treatments directly from their portal (in addition to Receptionist manual booking).',
    enabled: true,
    scope: 'customer',
    impactLevel: 'medium',
    lastChangedAt: '2026-09-26 10:15',
    lastChangedBy: 'Alexander Wright (Admin)'
  },
  {
    key: 'enable_online_extra_fnb_order',
    nameKey: 'governance.flags.extraFnbOnline.name',
    defaultName: 'Customer In-Villa Dining A-la-carte Ordering',
    descriptionKey: 'governance.flags.extraFnbOnline.desc',
    defaultDescription: 'Allows Customers to order extra a-la-carte nourishing dishes and wellness tonics directly charged to Villa Folio (UC19).',
    enabled: true,
    scope: 'customer',
    impactLevel: 'medium',
    lastChangedAt: '2026-09-26 10:15',
    lastChangedBy: 'Alexander Wright (Admin)'
  },
  {
    key: 'enable_vietnam_residence_auto_export',
    nameKey: 'governance.flags.residenceExport.name',
    defaultName: 'Nightly Police Residence Declaration Batch Schedule',
    descriptionKey: 'governance.flags.residenceExport.desc',
    defaultDescription: 'Automates the scheduled nightly batch compiling of daily customer check-in identification records (mandatory temporary residence declaration duty remains active).',
    enabled: true,
    scope: 'compliance',
    impactLevel: 'high',
    lastChangedAt: '2026-09-25 15:00',
    lastChangedBy: 'Alexander Wright (Admin)'
  },
  {
    key: 'enable_post_checkout_review_invitations',
    nameKey: 'governance.flags.reviewInvites.name',
    defaultName: 'Automated Post-Checkout Review Invitations',
    descriptionKey: 'governance.flags.reviewInvites.desc',
    defaultDescription: 'Triggers optional post-checkout wellness review and rating prompt to Customer after invoice settlement and departure (UC23).',
    enabled: true,
    scope: 'customer',
    impactLevel: 'low',
    lastChangedAt: '2026-09-24 09:00',
    lastChangedBy: 'Alexander Wright (Admin)'
  }
];

export const PERMISSION_RULES: PermissionRule[] = [
  // 1. Customer Experience
  {
    capability: 'book_retreat_package',
    categoryKey: 'governance.permissions.categories.experience',
    defaultCategory: 'Customer Retreat Experience',
    nameKey: 'governance.permissions.bookRetreat.name',
    defaultName: 'Book Retreat Package & Pay Deposit',
    descriptionKey: 'governance.permissions.bookRetreat.desc',
    defaultDescription: 'Browse packages, select retreat dates, configure villa category, and execute deposit via VNPay.',
    grants: {
      customer: 'granted',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'manage_own_health_profile',
    categoryKey: 'governance.permissions.categories.experience',
    defaultCategory: 'Customer Retreat Experience',
    nameKey: 'governance.permissions.manageHealth.name',
    defaultName: 'Manage Own Sensitive Health & Dietary Profile',
    descriptionKey: 'governance.permissions.manageHealth.desc',
    defaultDescription: 'Provide explicit consent to record allergies, dietary restrictions, and physical contraindications.',
    grants: {
      customer: 'granted',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.healthConsent',
    defaultBoundaryReason: 'Strict privacy boundary: Sensitive health records require explicit self-consent under Decree 13.'
  },
  {
    capability: 'request_health_data_deletion',
    categoryKey: 'governance.permissions.categories.experience',
    defaultCategory: 'Customer Retreat Experience',
    nameKey: 'governance.permissions.deleteHealth.name',
    defaultName: 'Request Post-Retreat Health Data Deletion',
    descriptionKey: 'governance.permissions.deleteHealth.desc',
    defaultDescription: 'Exercise statutory right to erase or anonymize health notes after retreat completion (BR-07).',
    grants: {
      customer: 'granted',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.statutoryDeletion',
    defaultBoundaryReason: 'Statutory Customer Right: Data subject deletion request cannot be executed by staff.'
  },
  {
    capability: 'view_own_folio',
    categoryKey: 'governance.permissions.categories.experience',
    defaultCategory: 'Customer Retreat Experience',
    nameKey: 'governance.permissions.viewOwnFolio.name',
    defaultName: 'View In-House Consolidated Folio',
    descriptionKey: 'governance.permissions.viewOwnFolio.desc',
    defaultDescription: 'Read-only access to own villa charges, deposits, and invoice line items.',
    grants: {
      customer: 'granted',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },

  // 2. Front Desk Operations
  {
    capability: 'view_daily_arrivals',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Front Desk Operations',
    nameKey: 'governance.permissions.viewArrivals.name',
    defaultName: 'View Daily Customer Arrivals & Schedules',
    descriptionKey: 'governance.permissions.viewArrivals.desc',
    defaultDescription: 'Access expected customer arrivals, arrival times, and check-in preparation status.',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'check_in_customer_collect_residence',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Front Desk Operations',
    nameKey: 'governance.permissions.checkInGuest.name',
    defaultName: 'Perform Customer Check-In & Collect Residence ID',
    descriptionKey: 'governance.permissions.checkInGuest.desc',
    defaultDescription: 'Verify customer identity, collect passport/CCCD details for Law on Residence compliance, and activate stay.',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.frontDeskOnly',
    defaultBoundaryReason: 'Operational integrity: Physical identification check and key handover restricted to Front Desk.'
  },
  {
    capability: 'assign_manage_villas',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Front Desk Operations',
    nameKey: 'governance.permissions.assignVillas.name',
    defaultName: 'Assign Physical Villas & Update Operational Status',
    descriptionKey: 'governance.permissions.assignVillas.desc',
    defaultDescription: 'Allocate available villas to bookings and transition villa statuses (Cleaning, Available, Maintenance).',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'book_manual_extra_spa',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Front Desk Operations',
    nameKey: 'governance.permissions.bookExtraSpa.name',
    defaultName: 'Manual Front Desk Extra Spa Booking',
    descriptionKey: 'governance.permissions.bookExtraSpa.desc',
    defaultDescription: 'Schedule walk-up or concierge extra spa sessions with strict 2D resource validation (Therapist + Room).',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'generate_folio_process_checkout',
    categoryKey: 'governance.permissions.categories.frontDesk',
    defaultCategory: 'Front Desk Operations',
    nameKey: 'governance.permissions.checkoutProcess.name',
    defaultName: 'Consolidate Folio, Collect Payment & Checkout',
    descriptionKey: 'governance.permissions.checkoutProcess.desc',
    defaultDescription: 'Generate consolidated tax invoice, collect final payment, and complete checkout after verifying zero unpaid charges (BR-02).',
    grants: {
      customer: 'denied',
      receptionist: 'granted',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.frontDeskCheckout',
    defaultBoundaryReason: 'Financial accountability: Cashier and key return operations belong strictly to Front Desk.'
  },

  // 3. Therapy & Wellness
  {
    capability: 'view_assigned_therapist_schedule',
    categoryKey: 'governance.permissions.categories.wellness',
    defaultCategory: 'Spa & Therapy Fulfillment',
    nameKey: 'governance.permissions.viewTherapistSchedule.name',
    defaultName: 'View Personal Assigned Therapy Schedule',
    descriptionKey: 'governance.permissions.viewTherapistSchedule.desc',
    defaultDescription: 'Access assigned daily therapy and yoga sessions with customer arrival times and treatment rooms.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'granted',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_treatment_relevant_health_notes',
    categoryKey: 'governance.permissions.categories.wellness',
    defaultCategory: 'Spa & Therapy Fulfillment',
    nameKey: 'governance.permissions.viewHealthNotes.name',
    defaultName: 'View Treatment-Relevant Clinical Health Notes',
    descriptionKey: 'governance.permissions.viewHealthNotes.desc',
    defaultDescription: 'Inspect strictly physical contraindications, injuries, and focus areas for assigned therapy customers (BR-03).',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'granted',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.therapistHealthOnly',
    defaultBoundaryReason: 'Data minimization (BR-03): Clinical health notes accessible ONLY by assigned treating therapists.'
  },
  {
    capability: 'complete_spa_sessions',
    categoryKey: 'governance.permissions.categories.wellness',
    defaultCategory: 'Spa & Therapy Fulfillment',
    nameKey: 'governance.permissions.completeSpa.name',
    defaultName: 'Record Spa Session Outcomes (Completed / No-Show)',
    descriptionKey: 'governance.permissions.completeSpa.desc',
    defaultDescription: 'Mark therapy sessions completed with practitioner notes or register customer no-show.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'granted',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },

  // 4. Culinary & Dietary
  {
    capability: 'view_meal_prep_queue',
    categoryKey: 'governance.permissions.categories.culinary',
    defaultCategory: 'Culinary & F&B Operations',
    nameKey: 'governance.permissions.viewMealPrep.name',
    defaultName: 'View Kitchen Daily Meal Preparation Queue',
    descriptionKey: 'governance.permissions.viewMealPrep.desc',
    defaultDescription: 'Access daily meal orders aggregated by meal window, delivery villa, and prep status.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'granted',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_dietary_allergy_warnings',
    categoryKey: 'governance.permissions.categories.culinary',
    defaultCategory: 'Culinary & F&B Operations',
    nameKey: 'governance.permissions.viewDietaryWarnings.name',
    defaultName: 'View Food-Related Allergy & Dietary Warnings',
    descriptionKey: 'governance.permissions.viewDietaryWarnings.desc',
    defaultDescription: 'Inspect strictly culinary allergen tags and food preferences without access to general health records (BR-03).',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'granted',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.fnbDietaryOnly',
    defaultBoundaryReason: 'Data minimization (BR-03): Kitchen staff sees allergy tags only; clinical diagnoses strictly withheld.'
  },
  {
    capability: 'update_meal_order_status',
    categoryKey: 'governance.permissions.categories.culinary',
    defaultCategory: 'Culinary & F&B Operations',
    nameKey: 'governance.permissions.updateMealStatus.name',
    defaultName: 'Update Meal Status (Preparing / Ready / Delivered)',
    descriptionKey: 'governance.permissions.updateMealStatus.desc',
    defaultDescription: 'Progress meal orders through kitchen prep stages to delivery.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'granted',
      manager: 'denied',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },

  // 5. Management Reporting
  {
    capability: 'view_revenue_reports',
    categoryKey: 'governance.permissions.categories.management',
    defaultCategory: 'Management Analytics & Oversight',
    nameKey: 'governance.permissions.viewRevenue.name',
    defaultName: 'View Revenue & Financial Performance Reports',
    descriptionKey: 'governance.permissions.viewRevenue.desc',
    defaultDescription: 'Access aggregated financial reporting across package base fees, spa revenue, and dining revenue.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_occupancy_reports',
    categoryKey: 'governance.permissions.categories.management',
    defaultCategory: 'Management Analytics & Oversight',
    nameKey: 'governance.permissions.viewOccupancy.name',
    defaultName: 'View Villa Occupancy & Inventory Utilization',
    descriptionKey: 'governance.permissions.viewOccupancy.desc',
    defaultDescription: 'Inspect real-time resort occupancy rates, villa category performance, and maintenance ratios.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_therapist_utilization_reports',
    categoryKey: 'governance.permissions.categories.management',
    defaultCategory: 'Management Analytics & Oversight',
    nameKey: 'governance.permissions.viewTherapistReports.name',
    defaultName: 'View Practitioner Utilization & Workload Reports',
    descriptionKey: 'governance.permissions.viewTherapistReports.desc',
    defaultDescription: 'Monitor aggregate treatment minutes, scheduled sessions, and completion ratios by therapist.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'view_manager_dashboard',
    categoryKey: 'governance.permissions.categories.management',
    defaultCategory: 'Management Analytics & Oversight',
    nameKey: 'governance.permissions.viewManagerDashboard.name',
    defaultName: 'Access Executive Management Cockpit',
    descriptionKey: 'governance.permissions.viewManagerDashboard.desc',
    defaultDescription: 'Executive cockpit summarizing key operational KPIs and direct navigation to authorized analytical reports.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'denied'
    },
    isImmutableBoundary: false
  },

  // 6. Governance & Administration
  {
    capability: 'export_police_residence_declaration',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Governance & System Administration',
    nameKey: 'governance.permissions.exportPolice.name',
    defaultName: 'Export Daily Police Residence Declarations',
    descriptionKey: 'governance.permissions.exportPolice.desc',
    defaultDescription: 'Generate official metadata export file for local police temporary residence compliance (Law on Residence 2020).',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false
  },
  {
    capability: 'configure_business_parameters',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Governance & System Administration',
    nameKey: 'governance.permissions.configureParams.name',
    defaultName: 'Configure System Business Parameters',
    descriptionKey: 'governance.permissions.configureParams.desc',
    defaultDescription: 'Adjust deposit requirements, cancellation thresholds, refund rates, and dietary preselection cutoffs.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: true
  },
  {
    capability: 'manage_feature_flags',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Governance & System Administration',
    nameKey: 'governance.permissions.manageFlags.name',
    defaultName: 'Manage Modular Feature Flags',
    descriptionKey: 'governance.permissions.manageFlags.desc',
    defaultDescription: 'Toggle optional customer self-service modules and automated compliance routines.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: false,
    isDelegableToManager: true
  },
  {
    capability: 'view_permission_matrix',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Governance & System Administration',
    nameKey: 'governance.permissions.viewMatrix.name',
    defaultName: 'Inspect System RBAC Permission Matrix',
    descriptionKey: 'governance.permissions.viewMatrix.desc',
    defaultDescription: 'Review cross-role functional capability allocations and security boundary definitions.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.adminOnly',
    defaultBoundaryReason: 'Security governance: RBAC matrix configuration reserved strictly for System Administrator.'
  },
  {
    capability: 'delegate_admin_rights',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Governance & System Administration',
    nameKey: 'governance.permissions.delegateRights.name',
    defaultName: 'Delegate Limited Admin Rights to Manager',
    descriptionKey: 'governance.permissions.delegateRights.desc',
    defaultDescription: 'Grant time-bounded, scoped subset of administrative capabilities to Resort Operations Manager.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.delegationAdminOnly',
    defaultBoundaryReason: 'Privilege escalation protection: Delegation powers cannot be sub-delegated or self-assigned.'
  },
  {
    capability: 'view_sensitive_data_audit_log',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Governance & System Administration',
    nameKey: 'governance.permissions.viewAuditLog.name',
    defaultName: 'View Sensitive Data Access Audit Log',
    descriptionKey: 'governance.permissions.viewAuditLog.desc',
    defaultDescription: 'Inspect chronological metadata log of sensitive health, identity, and financial access events.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'denied',
      admin: 'granted'
    },
    isImmutableBoundary: true,
    boundaryReasonKey: 'governance.permissions.boundaries.auditAdminOnly',
    defaultBoundaryReason: 'Accountability: Audit trail inspection reserved exclusively for System Administrator.'
  },
  {
    capability: 'view_system_overview',
    categoryKey: 'governance.permissions.categories.governance',
    defaultCategory: 'Governance & System Administration',
    nameKey: 'governance.permissions.viewSystemOverview.name',
    defaultName: 'View System-Wide Operational Health & Compliance',
    descriptionKey: 'governance.permissions.viewSystemOverview.desc',
    defaultDescription: 'Cross-module rollup of bookings, villas, treatments, dining, and daily police export status.',
    grants: {
      customer: 'denied',
      receptionist: 'denied',
      therapist: 'denied',
      fb_staff: 'denied',
      manager: 'granted',
      admin: 'granted'
    },
    isImmutableBoundary: false
  }
];

export const INITIAL_DELEGATIONS: AdminDelegation[] = [
  {
    id: 'DEL-2026-001',
    delegateUserId: 'usr-mgr-01',
    delegateName: 'Sarah Jenkins',
    delegateRole: 'manager',
    capabilities: ['configure_business_parameters'],
    startsAt: '2026-09-27 08:00',
    expiresAt: '2026-09-28 18:00',
    status: 'active',
    grantedBy: 'Alexander Wright (Admin)',
    reason: 'Temporary authority to adjust cancellation lead-time during forecast coastal weather advisory.',
    createdAt: '2026-09-27 07:45'
  },
  {
    id: 'DEL-2026-000',
    delegateUserId: 'usr-mgr-01',
    delegateName: 'Sarah Jenkins',
    delegateRole: 'manager',
    capabilities: ['manage_feature_flags'],
    startsAt: '2026-09-20 08:00',
    expiresAt: '2026-09-22 18:00',
    status: 'expired',
    grantedBy: 'Alexander Wright (Admin)',
    reason: 'Operational evaluation of in-villa dining orders during Mid-Autumn wellness festival.',
    createdAt: '2026-09-20 07:30'
  }
];

export const INITIAL_AUDIT_EVENTS: AuditEvent[] = [
  {
    id: 'AUD-89104',
    timestamp: '2026-09-27 16:42:10',
    actorId: 'usr-th-01',
    actorName: 'David Kim',
    actorRole: 'therapist',
    action: 'READ',
    dataCategory: 'HEALTH_WELLNESS',
    targetRef: 'CUST-8801',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.treatmentNotesConsultation',
    detailsFallback: 'Consulted treatment-relevant clinical notes for scheduled afternoon herbal bath session.'
  },
  {
    id: 'AUD-89103',
    timestamp: '2026-09-27 15:30:05',
    actorId: 'usr-rec-01',
    actorName: 'Linh Tran',
    actorRole: 'receptionist',
    action: 'READ',
    dataCategory: 'RESIDENCE_IDENTITY',
    targetRef: 'CUST-8802',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.residenceIdVerified',
    detailsFallback: 'Verified customer residence identification document metadata during physical check-in.'
  },
  {
    id: 'AUD-89102',
    timestamp: '2026-09-27 14:15:22',
    actorId: 'usr-rec-01',
    actorName: 'Linh Tran',
    actorRole: 'receptionist',
    action: 'READ',
    dataCategory: 'HEALTH_WELLNESS',
    targetRef: 'CUST-8803',
    result: 'DENIED',
    detailsKey: 'governance.audit.details.receptionistHealthBlocked',
    detailsFallback: 'Access to full medical contraindications blocked by RBAC data minimization policy (BR-03).'
  },
  {
    id: 'AUD-89101',
    timestamp: '2026-09-27 12:05:44',
    actorId: 'usr-fb-01',
    actorName: 'Marcus Chen',
    actorRole: 'fb_staff',
    action: 'READ',
    dataCategory: 'DIETARY_ALLERGY',
    targetRef: 'CUST-8801',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.kitchenAllergenCheck',
    detailsFallback: 'Accessed culinary allergen flags for lunch course preparation (Gluten-Free & Tree Nut allergy).'
  },
  {
    id: 'AUD-89100',
    timestamp: '2026-09-27 11:10:18',
    actorId: 'usr-rec-01',
    actorName: 'Linh Tran',
    actorRole: 'receptionist',
    action: 'UPDATE',
    dataCategory: 'PAYMENT_TRANSACTION',
    targetRef: 'FOLIO-2026-001',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.folioSettlementRecorded',
    detailsFallback: 'Recorded VNPay terminal transaction reference for final checkout folio settlement.'
  },
  {
    id: 'AUD-89099',
    timestamp: '2026-09-27 07:45:12',
    actorId: 'usr-adm-01',
    actorName: 'Alexander Wright',
    actorRole: 'admin',
    action: 'CREATE',
    dataCategory: 'SECURITY_GOVERNANCE',
    targetRef: 'DEL-2026-001',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.delegationGranted',
    detailsFallback: 'Granted temporary parameter configuration delegation to Manager Sarah Jenkins.'
  },
  {
    id: 'AUD-89098',
    timestamp: '2026-09-26 18:20:00',
    actorId: 'usr-adm-01',
    actorName: 'Alexander Wright',
    actorRole: 'admin',
    action: 'EXPORT',
    dataCategory: 'RESIDENCE_IDENTITY',
    targetRef: 'BATCH-2026-09-26',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.residenceBatchExported',
    detailsFallback: 'Generated Law on Residence compliance export package (24 active resident records).'
  },
  {
    id: 'AUD-89097',
    timestamp: '2026-09-26 10:15:30',
    actorId: 'usr-adm-01',
    actorName: 'Alexander Wright',
    actorRole: 'admin',
    action: 'TOGGLE',
    dataCategory: 'SECURITY_GOVERNANCE',
    targetRef: 'enable_online_extra_spa_booking',
    result: 'SUCCESS',
    detailsKey: 'governance.audit.details.featureFlagToggled',
    detailsFallback: 'Updated feature flag status to ENABLED with global customer scope.'
  }
];

export const INITIAL_POLICE_EXPORT_SUMMARY: PoliceResidenceExportSummary = {
  batchId: 'POLICE-DEC-20260927',
  generatedAt: '2026-09-27 18:00',
  totalRecords: 14,
  domesticCount: 8,
  foreignCount: 6,
  status: 'READY',
  complianceStandard: 'Vietnam Law on Residence 2020 & Decree 13/2023/ND-CP'
};
