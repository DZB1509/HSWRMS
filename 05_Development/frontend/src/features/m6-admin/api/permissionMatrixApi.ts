import { apiClient } from '../../../api/client/apiClient';
import { evaluatePermission } from './staffAccountsApi';

export interface RoleViewDto {
  roleId: number;
  roleName: string;
  description: string;
}

export interface MatrixRowDto {
  permissionId: number;
  module: string;
  action: string;
  delegable: boolean;
  adminOnly: boolean;
  grants: Record<string, boolean>;
  lockedRoles: string[];
}

export interface MatrixViewDto {
  roles: RoleViewDto[];
  rows: MatrixRowDto[];
}

export interface MatrixChangeDto {
  role: string;
  module: string;
  action: string;
  granted: boolean;
}

export interface MatrixDiffEntryDto {
  role: string;
  module: string;
  action: string;
  from: boolean;
  to: boolean;
}

export interface MatrixChangeRequestDto {
  changes: MatrixChangeDto[];
}

export interface ApiEnvelope<T> {
  timestamp?: string;
  success?: boolean;
  message?: string;
  data: T;
}

/**
 * Metadata for Module / Screen codes
 */
export const MODULE_DESCRIPTIONS: Record<
  string,
  { name: string; domain: string; desc: string; compliance?: string }
> = {
  S10: {
    name: 'Danh Sách Tài Khoản Nhân Viên',
    domain: 'Nhân Sự & Quản Trị',
    desc: 'Xem và quản lý hồ sơ tài khoản nhân sự khu nghỉ dưỡng.',
  },
  S11: {
    name: 'Chi Tiết & Cấp Phát Nhân Sự',
    domain: 'Nhân Sự & Quản Trị',
    desc: 'Thêm mới tài khoản, cập nhật thông tin và khóa/kích hoạt tài khoản.',
  },
  S12: {
    name: 'Dữ Liệu Danh Mục Cốt Lõi',
    domain: 'Dữ Liệu Danh Mục',
    desc: 'Cấu hình danh mục hạng biệt thự, gói nghỉ dưỡng và dịch vụ Spa.',
  },
  S49: {
    name: 'Bảng Điều Khiển Quản Trị',
    domain: 'Giám Sát & Điều Hành',
    desc: 'Tổng quan tình trạng an ninh và cảnh báo đăng nhập thất bại toàn hệ thống.',
  },
  S50: {
    name: 'Tham Số Nghiệp Vụ Vận Hành',
    domain: 'Cấu Hình Hệ Thống',
    desc: 'Cấu hình tỷ lệ cọc, khung giờ hủy phòng và thời gian khóa an toàn.',
  },
  S51: {
    name: 'Ma Trận Phân Quyền (RBAC)',
    domain: 'An Ninh & Phân Quyền',
    desc: 'Thiết lập ma trận phân quyền theo vai trò và kiểm soát ranh giới bảo mật.',
  },
  S52: {
    name: 'Ủy Quyền Quản Lý (Delegation)',
    domain: 'An Ninh & Phân Quyền',
    desc: 'Cấp phát và thu hồi quyền ủy quyền có thời hạn cho vai trò Quản lý.',
  },
  S53: {
    name: 'Nhật Ký Kiểm Toán Nhạy Cảm',
    domain: 'An Ninh & Kiểm Toán',
    desc: 'Truy vết bất biến các hành vi thay đổi cấu hình, phân quyền và dữ liệu cá nhân.',
    compliance: 'Nghị định 13/2023/NĐ-CP & Luật An ninh mạng',
  },
  S54: {
    name: 'Tổng Quan Hệ Thống Quản Lý',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Báo cáo giám sát vận hành cấp cao dành riêng cho Quản lý.',
  },
  S55: {
    name: 'Trung Tâm Điều Hành & Kết Xuất',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Trung tâm tổng hợp báo cáo và tiện ích phân tích vận hành.',
  },
  S55_ADMIN_WIDGETS: {
    name: 'Tiện Ích Quản Trị Nâng Cao S55',
    domain: 'Cấu Hình Hệ Thống',
    desc: 'Tiện ích quản trị nâng cao hiển thị trên màn hình điều hành S55.',
  },
  RESIDENCE_REPORT: {
    name: 'Khai Báo Cư Trú Công An',
    domain: 'Pháp Lý & Cư Trú',
    desc: 'Kết xuất và nộp dữ liệu khai báo tạm trú theo định dạng chuẩn ngành công an.',
    compliance: 'Luật Cư trú 2020 & Nghị định 13/2023/NĐ-CP',
  },
  S02: {
    name: 'Cổng Thông Tin Khách Hàng',
    domain: 'Khách Hàng',
    desc: 'Trang đặt chỗ và quản lý kỳ nghỉ dưỡng của khách.',
  },
  S20: {
    name: 'Điều Hành Lễ Tân (Front-Desk)',
    domain: 'Vận Hành Lễ Tân',
    desc: 'Check-in, check-out, gán biệt thự và tiếp nhận thanh toán dịch vụ.',
  },
  S31: {
    name: 'Lịch Trình Trị Liệu Spa & Yoga',
    domain: 'Sức Khỏe & Spa',
    desc: 'Quản lý lịch phiên trị liệu và phân bổ phòng chuyên dụng 2 chiều.',
  },
  S38: {
    name: 'Điều Hành Bếp Ẩm Thực F&B',
    domain: 'Ẩm Thực F&B',
    desc: 'Chuẩn bị thực đơn dinh dưỡng và kiểm soát suất ăn theo tiêu chuẩn khách sạn.',
  },
  S46: {
    name: 'Báo Cáo Công Suất Buồng Phòng',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Thống kê tỷ lệ lấp đầy phòng theo thời gian thực.',
  },
  S47: {
    name: 'Báo Cáo Doanh Thu Tài Chính',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Doanh thu dịch vụ lưu trú, Spa và ẩm thực nghỉ dưỡng.',
  },
  S48: {
    name: 'Báo Cáo Hiệu Suất Kỹ Thuật Viên',
    domain: 'Báo Cáo Quản Lý',
    desc: 'Thống kê giờ trị liệu và đánh giá năng suất chuyên viên chăm sóc sức khỏe.',
  },
  DATA_HEALTH_FULL: {
    name: 'Hồ Sơ Sức Khỏe Toàn Diện',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    desc: 'Chỉ khách hàng sở hữu mới có quyền truy cập toàn bộ hồ sơ y tế/sức khỏe.',
    compliance: 'Nguyên tắc Tối thiểu hóa dữ liệu (Nghị định 13/2023)',
  },
  DATA_HEALTH_TREATMENT: {
    name: 'Ghi Chú Trị Liệu Sức Khỏe',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    desc: 'Giới hạn nghiêm ngặt chỉ Khách hàng và Kỹ thuật viên phụ trách phiên.',
    compliance: 'Nguyên tắc Tối thiểu hóa dữ liệu (Nghị định 13/2023)',
  },
  DATA_FOOD_ALLERGY: {
    name: 'Cảnh Báo Dị Ứng Món Ăn',
    domain: 'Dữ Liệu Cá Nhân Nhạy Cảm',
    desc: 'Chia sẻ có kiểm soát giữa Khách hàng và Bếp trưởng/F&B để ngăn ngừa rủi ro sốc phản vệ.',
    compliance: 'Nguyên tắc Tối thiểu hóa dữ liệu (Nghị định 13/2023)',
  },
  DATA_RESIDENCE: {
    name: 'Dữ Liệu Giấy Tờ Tùy Thân & Cư Trú',
    domain: 'Dữ Liệu Pháp Lý',
    desc: 'Chỉ Lễ tân có thẩm quyền khai báo cư trú mới được xử lý thông tin CMND/CCCD/Hộ chiếu.',
    compliance: 'Luật Cư trú 2020 & Nghị định 13/2023/NĐ-CP',
  },
};

export const ACTION_NAMES: Record<string, { label: string; desc: string }> = {
  V: { label: 'Xem (View)', desc: 'Xem danh sách và thông tin chi tiết' },
  C: { label: 'Tạo (Create)', desc: 'Khởi tạo bản ghi mới' },
  U: { label: 'Sửa (Update)', desc: 'Chỉnh sửa và cập nhật dữ liệu' },
  D: { label: 'Khóa / Hủy (Deactivate)', desc: 'Vô hiệu hóa hoặc đình chỉ bản ghi' },
  E: { label: 'Xuất (Export)', desc: 'Kết xuất báo cáo Excel/CSV' },
  A: { label: 'Phân Bổ (Assign)', desc: 'Phân công tài nguyên / nhân sự' },
  G: { label: 'Cấu Hình (Grant)', desc: 'Cấp phát và điều chỉnh ma trận quyền' },
};

export const ADMIN_LOCKED_MODULES = new Set([
  'S10',
  'S11',
  'S12',
  'S49',
  'S50',
  'S51',
  'S52',
  'S53',
]);

/**
 * Checks if a specific cell in the matrix is locked from modification.
 */
export function isCellLocked(row: MatrixRowDto, roleName: string): boolean {
  const normRole = roleName.trim().toUpperCase();

  // Admin lock invariant: Admin must never lose core administrative rights
  if (normRole === 'ADMIN' && ADMIN_LOCKED_MODULES.has(row.module)) {
    return true;
  }

  // Row-level locked roles returned by backend
  if (row.lockedRoles && row.lockedRoles.some((r) => r.toUpperCase() === normRole)) {
    return true;
  }

  // Admin-only permissions cannot be granted to non-admin roles
  if (row.adminOnly && normRole !== 'ADMIN') {
    return true;
  }

  return false;
}

/**
 * Helper to get the canonical reason why a cell is locked.
 */
export function getLockReason(row: MatrixRowDto, roleName: string): string | null {
  const normRole = roleName.trim().toUpperCase();

  if (normRole === 'ADMIN' && ADMIN_LOCKED_MODULES.has(row.module)) {
    return `Ranh giới bảo mật bất biến: Vai trò Quản trị viên (Admin) bắt buộc phải duy trì quyền trên phân hệ ${row.module}. Không thể thu hồi.`;
  }

  if (row.adminOnly && normRole !== 'ADMIN') {
    return `Quyền hạn chỉ dành cho Quản trị viên (Admin-Only). Vai trò ${normRole} chỉ có thể nhận quyền tạm thời qua cơ chế Ủy quyền Quản lý (S52).`;
  }

  if (row.module.startsWith('DATA_')) {
    return 'Ranh giới an toàn tuyệt đối: Tuân thủ nguyên tắc tối thiểu hóa dữ liệu cá nhân theo Nghị định 13/2023/NĐ-CP.';
  }

  return null;
}

/**
 * Authorization validation for viewing and previewing the matrix.
 */
export function validateMatrixAuthorization(
  user: { role?: string; permissions?: string[] } | null | undefined
): { canView: boolean; canPreview: boolean } {
  if (!user) {
    return { canView: false, canPreview: false };
  }

  const canView = evaluatePermission(user, 'S51:V');
  const canPreview = evaluatePermission(user, 'S51:G');

  return { canView, canPreview };
}

/**
 * Computes the list of diff changes between backend matrix and current draft state.
 */
export function computePendingChanges(
  originalRows: MatrixRowDto[],
  draftGrants: Record<string, Record<string, boolean>>
): MatrixChangeDto[] {
  const changes: MatrixChangeDto[] = [];

  for (const row of originalRows) {
    const key = `${row.module}:${row.action}`;
    const rowDraft = draftGrants[key];
    if (!rowDraft) continue;

    for (const [roleName, granted] of Object.entries(rowDraft)) {
      const origVal = Boolean(row.grants[roleName]);
      if (origVal !== granted) {
        changes.push({
          role: roleName,
          module: row.module,
          action: row.action,
          granted,
        });
      }
    }
  }

  return changes;
}

export const permissionMatrixApi = {
  /**
   * Fetches the authoritative RBAC matrix from backend.
   * Requires S51:V permission.
   */
  getMatrix: async (): Promise<MatrixViewDto> => {
    const res = await apiClient.get<ApiEnvelope<MatrixViewDto>>('/admin/permissions/matrix');
    if (res && res.data && Array.isArray(res.data.rows)) {
      return res.data;
    }
    return { roles: [], rows: [] };
  },

  /**
   * Previews planned permission changes without persisting anything.
   * Verified 100% read-only in backend service.
   * Requires S51:G permission.
   */
  previewChanges: async (changes: MatrixChangeDto[]): Promise<MatrixDiffEntryDto[]> => {
    if (!changes || changes.length === 0) {
      return [];
    }

    const res = await apiClient.post<ApiEnvelope<MatrixDiffEntryDto[]>>(
      '/admin/permissions/matrix/preview',
      { changes }
    );

    if (res && res.data && Array.isArray(res.data)) {
      return res.data;
    }
    return [];
  },
};
