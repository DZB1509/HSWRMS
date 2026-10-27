export interface StaffAccountDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
  accountStatus: 'PENDING' | 'ACTIVE' | 'INACTIVE' | 'LOCKED';
  failedLoginCount: number;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StaffCreateRequest {
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

export interface StaffUpdateRequest {
  fullName: string;
  phoneNumber?: string;
  role: string;
}

export interface StaffStatusRequest {
  status: 'ACTIVE' | 'INACTIVE' | 'LOCKED';
}

export interface TempPasswordResponse {
  userId: number;
  email: string;
  temporaryPassword: string;
  instructions: string;
}

export interface SystemConfigurationDto {
  configId: number;
  key: string;
  value: string;
  description?: string;
  category: string;
  dataType: 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'STRING' | 'TIME_HHMM' | 'JSON';
  minValue?: string;
  maxValue?: string;
  allowedValues?: string;
  managerEditable: boolean;
  updatedAt: string;
  updatedBy?: number;
}

export interface ParameterUpdateRequest {
  value: string;
}

export interface PermissionDto {
  permissionId: number;
  moduleOrScreen: string;
  actionType: string;
  delegable: boolean;
  adminOnly: boolean;
}

export interface MatrixCellDto {
  role: string;
  moduleOrScreen: string;
  actionType: string;
  granted: boolean;
  delegable: boolean;
  adminOnly: boolean;
  locked: boolean;
}

export interface PermissionMatrixResponse {
  roles: string[];
  permissions: PermissionDto[];
  cells: MatrixCellDto[];
  lockedScreens: string[];
  sensitiveDataAllowedRoles: Record<string, string[]>;
}

export interface MatrixChange {
  role: string;
  module: string;
  action: string;
  grant: boolean;
}

export interface MatrixChangeRequest {
  changes: MatrixChange[];
}

export interface MatrixDiffItem {
  role: string;
  module: string;
  action: string;
  before: boolean;
  after: boolean;
}

export interface MatrixDiffResponse {
  totalModifications: number;
  diffs: MatrixDiffItem[];
  valid: boolean;
}

export interface DelegablePermissionDto {
  permissionId: number;
  module: string;
  action: string;
}

export interface DelegationDto {
  delegationId: number;
  managerUserId: number;
  managerName?: string;
  grantedByAdminUserId?: number;
  validFrom: string;
  validUntil: string;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED' | 'EXPIRED';
  permissions: string[];
  revokedAt?: string;
  startsAt?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface DelegationCreateRequest {
  managerUserId: number;
  permissionIds: number[];
  validFrom: string;
  validUntil: string;
}

export interface AuditLogEntryDto {
  auditLogId: number;
  actorUserId?: number;
  actorRole?: string;
  action: string;
  screenOrModule?: string;
  targetResourceType?: string;
  targetResourceId?: string;
  clientIpAddress?: string;
  requestPayloadMasked?: string;
  responseStatus?: number;
  createdAt: string;
}

export interface AuditLogPageResponse {
  content: AuditLogEntryDto[];
  totalElements: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
}

export interface VillaCategoryDto {
  villaCategoryId: number;
  categoryName: string;
  description?: string;
  baseRatePerNight: number;
  maxOccupancy: number;
  active: boolean;
}

export interface SpaTreatmentDto {
  spaTreatmentId: number;
  treatmentName: string;
  category: string;
  durationMinutes: number;
  price: number;
  active: boolean;
}

export interface RetreatPackageDto {
  retreatPackageId: number;
  packageName: string;
  durationDays: number;
  basePrice: number;
  includedSessionsCount: number;
  active: boolean;
}

export interface DashboardWidget {
  key: string;
  title: string;
  available: boolean;
  value: Record<string, unknown> | number | string;
  note?: string;
}

export interface DashboardView {
  title: string;
  navigation: string[];
  widgets: DashboardWidget[];
}

export interface AuthLoginResponse {
  token: string;
  user: {
    userId: number;
    email: string;
    fullName: string;
    roles: string[];
  };
}
