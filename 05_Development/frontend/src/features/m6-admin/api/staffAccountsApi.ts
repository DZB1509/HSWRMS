import { apiClient } from '../../../api/client/apiClient';
import type { StaffAccount, StaffStatus } from '../../../types/staff';
import type { Role } from '../../../types/auth';

/** Shape returned by backend AdminDtos.StaffView. */
interface StaffViewDto {
  userId: number;
  fullName: string;
  email: string;
  phoneNumber?: string | null;
  role: string | null;
  status: string;
  lastLoginAt?: string | null;
  createdAt?: string | null;
}

interface ApiEnvelope<T> {
  data: T;
  message?: string;
}

interface PageDto<T> {
  items: T[];
}

export interface StaffCreatedResult {
  staff: StaffAccount;
  temporaryPassword: string;
}

const ROLE_FROM_BACKEND: Record<string, Role> = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  RECEPTIONIST: 'receptionist',
  THERAPIST: 'therapist',
  FNB_STAFF: 'fb_staff',
};

const ROLE_TO_BACKEND: Record<string, string> = {
  admin: 'ADMIN',
  manager: 'MANAGER',
  receptionist: 'RECEPTIONIST',
  therapist: 'THERAPIST',
  fb_staff: 'FNB_STAFF',
};

const DEPARTMENT: Record<string, string> = {
  admin: 'Công Nghệ & Hệ Thống Thông Tin',
  manager: 'Ban Quản Lý Điều Hành',
  receptionist: 'Bộ Phận Tiền Sảnh',
  therapist: 'Chăm Sóc Sức Khỏe & Spa',
  fb_staff: 'Ẩm Thực & Dinh Dưỡng F&B',
};

const TITLE: Record<string, string> = {
  admin: 'Quản Trị Viên Hệ Thống',
  manager: 'Quản Lý Điều Hành',
  receptionist: 'Lễ Tân',
  therapist: 'Chuyên Viên Trị Liệu',
  fb_staff: 'Nhân Viên F&B / Bếp',
};

export const toBackendRole = (role: Role): string => ROLE_TO_BACKEND[role] ?? role.toUpperCase();

const initials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const relativeTime = (iso?: string | null): string => {
  if (!iso) return 'Chưa đăng nhập';
  const diffMin = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  if (diffMin < 1440) return `${Math.round(diffMin / 60)} giờ trước`;
  return `${Math.round(diffMin / 1440)} ngày trước`;
};

export const mapStaffView = (v: StaffViewDto): StaffAccount => {
  const key = (v.role ?? '').toUpperCase().replace(/[^A-Z]/g, '');
  const normalized = key === 'FBSTAFF' || key === 'FNBSTAFF' ? 'FNB_STAFF' : key;
  const role: Role = ROLE_FROM_BACKEND[normalized] || 'receptionist';
  const status: StaffStatus = v.status === 'ACTIVE' ? 'active' : 'suspended';
  return {
    id: String(v.userId),
    name: v.fullName,
    email: v.email,
    role,
    title: TITLE[role],
    department: DEPARTMENT[role],
    status,
    joinedDate: v.createdAt ? v.createdAt.split('T')[0] : '',
    lastActiveAt: relativeTime(v.lastLoginAt),
    avatar: initials(v.fullName),
    phone: v.phoneNumber ?? undefined,
  };
};

export const staffAccountsApi = {
  list: async (): Promise<StaffAccount[]> => {
    const res = await apiClient.get<ApiEnvelope<PageDto<StaffViewDto>>>('/admin/staff', {
      params: { size: 100 },
    });
    return res.data.items.map(mapStaffView);
  },

  get: async (id: string): Promise<StaffAccount> => {
    const res = await apiClient.get<ApiEnvelope<StaffViewDto>>(`/admin/staff/${id}`);
    return mapStaffView(res.data);
  },

  create: async (body: {
    fullName: string;
    email: string;
    phoneNumber?: string;
    role: Role;
  }): Promise<StaffCreatedResult> => {
    const res = await apiClient.post<ApiEnvelope<{ staff: StaffViewDto; temporaryPassword: string }>>(
      '/admin/staff',
      { ...body, role: toBackendRole(body.role) },
    );
    return { staff: mapStaffView(res.data.staff), temporaryPassword: res.data.temporaryPassword };
  },

  /** ACTIVE = unlock/activate, INACTIVE = lock (login + existing tokens rejected by backend). */
  setStatus: async (id: string, active: boolean): Promise<StaffAccount> => {
    const res = await apiClient.patch<ApiEnvelope<StaffViewDto>>(`/admin/staff/${id}/status`, {
      status: active ? 'ACTIVE' : 'INACTIVE',
    });
    return mapStaffView(res.data);
  },
};
