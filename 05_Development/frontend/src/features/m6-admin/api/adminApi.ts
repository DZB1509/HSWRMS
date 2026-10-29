import { apiClient, getAuthToken } from '../../../api/client/apiClient';
import type {
  StaffAccountDto,
  StaffCreateRequest,
  StaffUpdateRequest,
  StaffStatusRequest,
  TempPasswordResponse,
  SystemConfigurationDto,
  ParameterUpdateRequest,
  PermissionMatrixResponse,
  MatrixChangeRequest,
  MatrixDiffResponse,
  DelegationDto,
  DelegationCreateRequest,
  DelegablePermissionDto,
  AuditLogPageResponse,
  VillaCategoryDto,
  SpaTreatmentDto,
  RetreatPackageDto,
  DashboardView,
  AuthLoginResponse,
} from '../types/admin';

interface ApiResponse<T> {
  timestamp: string;
  success: boolean;
  message: string;
  data: T;
}

const unwrap = <T>(res: ApiResponse<T>): T => res.data;

export const adminApi = {
  // Auth
  login: async (email: string, password: string): Promise<AuthLoginResponse> => {
    const res = await apiClient.post<ApiResponse<AuthLoginResponse>>('/auth/login', { email, password });
    return unwrap(res);
  },

  getCurrentUser: async (): Promise<AuthLoginResponse['user']> => {
    const res = await apiClient.get<ApiResponse<AuthLoginResponse['user']>>('/auth/me');
    return unwrap(res);
  },

  // Staff (S10, S11)
  getStaffList: async (params?: { search?: string; role?: string; status?: string; page?: number; size?: number }) => {
    const res = await apiClient.get<ApiResponse<{
      content: StaffAccountDto[];
      totalElements: number;
      totalPages: number;
      pageNumber: number;
      pageSize: number;
    }>>('/admin/staff', { params });
    return unwrap(res);
  },

  getStaffDetail: async (id: number): Promise<StaffAccountDto> => {
    const res = await apiClient.get<ApiResponse<StaffAccountDto>>(`/admin/staff/${id}`);
    return unwrap(res);
  },

  createStaff: async (body: StaffCreateRequest): Promise<TempPasswordResponse> => {
    const res = await apiClient.post<ApiResponse<TempPasswordResponse>>('/admin/staff', body);
    return unwrap(res);
  },

  updateStaff: async (id: number, body: StaffUpdateRequest): Promise<StaffAccountDto> => {
    const res = await apiClient.put<ApiResponse<StaffAccountDto>>(`/admin/staff/${id}`, body);
    return unwrap(res);
  },

  updateStaffStatus: async (id: number, status: StaffStatusRequest['status']): Promise<StaffAccountDto> => {
    const res = await apiClient.patch<ApiResponse<StaffAccountDto>>(`/admin/staff/${id}/status`, { status });
    return unwrap(res);
  },

  resetStaffPassword: async (id: number): Promise<TempPasswordResponse> => {
    const res = await apiClient.post<ApiResponse<TempPasswordResponse>>(`/admin/staff/${id}/reset-password`);
    return unwrap(res);
  },

  // Business Parameters (S50)
  getParameters: async (category?: string): Promise<SystemConfigurationDto[]> => {
    const res = await apiClient.get<ApiResponse<SystemConfigurationDto[]>>('/admin/parameters', {
      params: category ? { category } : undefined,
    });
    return unwrap(res);
  },

  updateParameter: async (key: string, value: string): Promise<SystemConfigurationDto> => {
    const res = await apiClient.put<ApiResponse<SystemConfigurationDto>>(`/admin/parameters/${encodeURIComponent(key)}`, {
      value,
    } as ParameterUpdateRequest);
    return unwrap(res);
  },

  // Permission Matrix (S51)
  getPermissionMatrix: async (): Promise<PermissionMatrixResponse> => {
    const res = await apiClient.get<ApiResponse<PermissionMatrixResponse>>('/admin/permissions/matrix');
    return unwrap(res);
  },

  previewMatrixChanges: async (request: MatrixChangeRequest): Promise<MatrixDiffResponse> => {
    const res = await apiClient.post<ApiResponse<MatrixDiffResponse>>('/admin/permissions/matrix/preview', request);
    return unwrap(res);
  },

  updatePermissionMatrix: async (request: MatrixChangeRequest): Promise<PermissionMatrixResponse> => {
    const res = await apiClient.put<ApiResponse<PermissionMatrixResponse>>('/admin/permissions/matrix', request);
    return unwrap(res);
  },

  // Delegation (S52)
  getDelegations: async (status?: string): Promise<DelegationDto[]> => {
    const res = await apiClient.get<ApiResponse<DelegationDto[]>>('/admin/delegations', {
      params: status ? { status } : undefined,
    });
    return unwrap(res);
  },

  getDelegablePermissions: async (): Promise<DelegablePermissionDto[]> => {
    const res = await apiClient.get<ApiResponse<DelegablePermissionDto[]>>('/admin/delegations/delegable-permissions');
    return unwrap(res);
  },

  createDelegation: async (body: DelegationCreateRequest): Promise<DelegationDto> => {
    const res = await apiClient.post<ApiResponse<DelegationDto>>('/admin/delegations', body);
    return unwrap(res);
  },

  revokeDelegation: async (id: number): Promise<DelegationDto> => {
    const res = await apiClient.post<ApiResponse<DelegationDto>>(`/admin/delegations/${id}/revoke`);
    return unwrap(res);
  },

  // Sensitive Audit Log (S53)
  getAuditLogs: async (params?: {
    actor?: number;
    screen?: string;
    fromDate?: string;
    toDate?: string;
    page?: number;
    size?: number;
  }): Promise<AuditLogPageResponse> => {
    const res = await apiClient.get<ApiResponse<AuditLogPageResponse>>('/admin/audit-logs', { params });
    return unwrap(res);
  },

  exportAuditLogsCsv: async (): Promise<string> => {
    const token = getAuthToken();
    const response = await fetch('http://localhost:8080/api/v1/admin/audit-logs/export', {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    return response.text();
  },

  // Master Data (S12)
  getVillas: async (): Promise<VillaCategoryDto[]> => {
    const res = await apiClient.get<ApiResponse<VillaCategoryDto[]>>('/admin/master-data/villas');
    return unwrap(res);
  },

  createVilla: async (body: Partial<VillaCategoryDto>): Promise<VillaCategoryDto> => {
    const res = await apiClient.post<ApiResponse<VillaCategoryDto>>('/admin/master-data/villas', body);
    return unwrap(res);
  },

  updateVilla: async (id: number, body: Partial<VillaCategoryDto>): Promise<VillaCategoryDto> => {
    const res = await apiClient.put<ApiResponse<VillaCategoryDto>>(`/admin/master-data/villas/${id}`, body);
    return unwrap(res);
  },

  getSpaTreatments: async (): Promise<SpaTreatmentDto[]> => {
    const res = await apiClient.get<ApiResponse<SpaTreatmentDto[]>>('/admin/master-data/spa-treatments');
    return unwrap(res);
  },

  createSpaTreatment: async (body: Partial<SpaTreatmentDto>): Promise<SpaTreatmentDto> => {
    const res = await apiClient.post<ApiResponse<SpaTreatmentDto>>('/admin/master-data/spa-treatments', body);
    return unwrap(res);
  },

  updateSpaTreatment: async (id: number, body: Partial<SpaTreatmentDto>): Promise<SpaTreatmentDto> => {
    const res = await apiClient.put<ApiResponse<SpaTreatmentDto>>(`/admin/master-data/spa-treatments/${id}`, body);
    return unwrap(res);
  },

  getRetreatPackages: async (): Promise<RetreatPackageDto[]> => {
    const res = await apiClient.get<ApiResponse<RetreatPackageDto[]>>('/admin/master-data/retreat-packages');
    return unwrap(res);
  },

  createRetreatPackage: async (body: Partial<RetreatPackageDto>): Promise<RetreatPackageDto> => {
    const res = await apiClient.post<ApiResponse<RetreatPackageDto>>('/admin/master-data/retreat-packages', body);
    return unwrap(res);
  },

  updateRetreatPackage: async (id: number, body: Partial<RetreatPackageDto>): Promise<RetreatPackageDto> => {
    const res = await apiClient.put<ApiResponse<RetreatPackageDto>>(`/admin/master-data/retreat-packages/${id}`, body);
    return unwrap(res);
  },

  // Dashboards (S49, S54, S55)
  getAdminDashboard: async (): Promise<DashboardView> => {
    const res = await apiClient.get<ApiResponse<DashboardView>>('/admin/dashboard');
    return unwrap(res);
  },

  getManagerDashboard: async (): Promise<DashboardView> => {
    const res = await apiClient.get<ApiResponse<DashboardView>>('/manager/dashboard');
    return unwrap(res);
  },

  getSystemOverview: async (): Promise<DashboardView> => {
    const res = await apiClient.get<ApiResponse<DashboardView>>('/system-overview');
    return unwrap(res);
  },

  exportPoliceResidencyReportCsv: async (): Promise<string> => {
    const token = getAuthToken();
    const response = await fetch('http://localhost:8080/api/v1/system-overview/police-residency-report/export', {
      headers: {
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
    return response.text();
  },
};
