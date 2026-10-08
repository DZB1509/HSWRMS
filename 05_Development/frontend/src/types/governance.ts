import type { Role } from './auth';

export type ParameterCategory = 'booking' | 'cancellation' | 'dietary' | 'compliance' | 'spa';

export type ParameterType = 'number' | 'percentage' | 'hours' | 'time';

export interface BusinessParameter {
  key: string;
  labelKey: string;
  defaultLabel: string;
  descriptionKey: string;
  defaultDescription: string;
  category: ParameterCategory;
  type: ParameterType;
  currentValue: number | string;
  defaultValue: number | string;
  unit?: string;
  min?: number;
  max?: number;
  lastUpdatedAt: string;
  lastUpdatedBy: string;
}

export type FeatureFlagScope = 'global' | 'customer' | 'operations' | 'compliance';

export interface FeatureFlag {
  key: string;
  nameKey: string;
  defaultName: string;
  descriptionKey: string;
  defaultDescription: string;
  enabled: boolean;
  scope: FeatureFlagScope;
  impactLevel: 'low' | 'medium' | 'high';
  lastChangedAt: string;
  lastChangedBy: string;
}

export type CapabilityKey =
  // Experience & Customer
  | 'book_retreat_package'
  | 'manage_own_health_profile'
  | 'request_health_data_deletion'
  | 'view_own_folio'
  // Front Desk / Reception
  | 'view_daily_arrivals'
  | 'check_in_customer_collect_residence'
  | 'assign_manage_villas'
  | 'book_manual_extra_spa'
  | 'generate_folio_process_checkout'
  // Therapy & Wellness
  | 'view_assigned_therapist_schedule'
  | 'view_treatment_relevant_health_notes'
  | 'complete_spa_sessions'
  // Culinary & F&B
  | 'view_meal_prep_queue'
  | 'view_dietary_allergy_warnings'
  | 'update_meal_order_status'
  // Management Reporting
  | 'view_revenue_reports'
  | 'view_occupancy_reports'
  | 'view_therapist_utilization_reports'
  | 'view_manager_dashboard'
  // Governance & Administration
  | 'export_police_residence_declaration'
  | 'configure_business_parameters'
  | 'manage_feature_flags'
  | 'view_permission_matrix'
  | 'delegate_admin_rights'
  | 'view_sensitive_data_audit_log'
  | 'view_system_overview';

export type PermissionGrantState = 'granted' | 'denied' | 'delegated';

export interface PermissionRule {
  capability: CapabilityKey;
  categoryKey: string;
  defaultCategory: string;
  nameKey: string;
  defaultName: string;
  descriptionKey: string;
  defaultDescription: string;
  grants: Record<Role, 'granted' | 'denied'>;
  isImmutableBoundary: boolean;
  boundaryReasonKey?: string;
  defaultBoundaryReason?: string;
  isDelegableToManager?: boolean;
}

export type DelegationStatus = 'active' | 'expired' | 'revoked';

export interface AdminDelegation {
  id: string;
  delegateUserId: string;
  delegateName: string;
  delegateRole: Role;
  capabilities: CapabilityKey[];
  startsAt: string;
  expiresAt: string;
  status: DelegationStatus;
  grantedBy: string;
  reason: string;
  createdAt: string;
  revokedAt?: string;
}

export type AuditAction = 'READ' | 'CREATE' | 'UPDATE' | 'DELETE' | 'EXPORT' | 'TOGGLE';

export type AuditDataCategory =
  | 'HEALTH_WELLNESS'
  | 'RESIDENCE_IDENTITY'
  | 'DIETARY_ALLERGY'
  | 'PAYMENT_TRANSACTION'
  | 'SECURITY_GOVERNANCE';

export type AuditResult = 'SUCCESS' | 'DENIED';

export interface AuditEvent {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: AuditAction;
  dataCategory: AuditDataCategory;
  targetRef: string;
  result: AuditResult;
  detailsKey: string;
  detailsFallback: string;
}

export interface PoliceResidenceExportSummary {
  batchId: string;
  generatedAt: string;
  totalRecords: number;
  domesticCount: number;
  foreignCount: number;
  status: 'READY' | 'SUBMITTED';
  complianceStandard: string;
}
