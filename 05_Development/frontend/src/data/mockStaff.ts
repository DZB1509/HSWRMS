import type { StaffAccount } from '../types/staff';

export const INITIAL_STAFF_ACCOUNTS: StaffAccount[] = [
  {
    id: 'usr-adm-01',
    name: 'Alexander Wright',
    email: 'alexander.wright@heavenstay.com',
    role: 'admin',
    title: 'Quản Trị Viên Hệ Thống & Quản Trị Dữ Liệu',
    department: 'Công Nghệ & Hệ Thống Thông Tin',
    status: 'active',
    joinedDate: '2025-01-15',
    lastActiveAt: 'Vừa xong',
    avatar: 'AW',
    phone: '+84 258 399 1001'
  },
  {
    id: 'usr-mgr-01',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@heavenstay.com',
    role: 'manager',
    title: 'Quản Lý Vận Hành Khu Nghỉ Dưỡng',
    department: 'Ban Quản Lý Điều Hành',
    status: 'active',
    joinedDate: '2025-02-01',
    lastActiveAt: '15 phút trước',
    avatar: 'SJ',
    phone: '+84 258 399 1002'
  },
  {
    id: 'usr-rec-01',
    name: 'Trần Thị Linh',
    email: 'linh.tran@heavenstay.com',
    role: 'receptionist',
    title: 'Chuyên Viên Lễ Tân Cao Cấp',
    department: 'Bộ Phận Tiền Sảnh',
    status: 'active',
    joinedDate: '2025-03-10',
    lastActiveAt: '10 phút trước',
    avatar: 'TL',
    phone: '+84 258 399 1003'
  },
  {
    id: 'usr-rec-02',
    name: 'Phạm Thu Hương',
    email: 'pham.huong@heavenstay.com',
    role: 'receptionist',
    title: 'Nhân Viên Lễ Tân',
    department: 'Bộ Phận Tiền Sảnh',
    status: 'active',
    joinedDate: '2025-06-20',
    lastActiveAt: 'Hôm qua',
    avatar: 'PH',
    phone: '+84 258 399 1004'
  },
  {
    id: 'usr-th-01',
    name: 'David Kim',
    email: 'david.kim@heavenstay.com',
    role: 'therapist',
    title: 'Chuyên Viên Trị Liệu Toàn Diện & Bậc Thầy Yoga',
    department: 'Chăm Sóc Sức Khỏe & Spa',
    status: 'active',
    joinedDate: '2025-02-15',
    lastActiveAt: '1 giờ trước',
    avatar: 'DK',
    phone: '+84 258 399 1005'
  },
  {
    id: 'usr-th-02',
    name: 'Nguyễn Thị Lan',
    email: 'lan.nguyen@heavenstay.com',
    role: 'therapist',
    title: 'Chuyên Viên Trị Liệu Spa Cao Cấp',
    department: 'Chăm Sóc Sức Khỏe & Spa',
    status: 'active',
    joinedDate: '2025-03-01',
    lastActiveAt: '2 giờ trước',
    avatar: 'NL',
    phone: '+84 258 399 1006'
  },
  {
    id: 'usr-th-03',
    name: 'Trần Văn Minh',
    email: 'minh.tran@heavenstay.com',
    role: 'therapist',
    title: 'Chuyên Gia Bấm Huyệt & Dược Liệu',
    department: 'Chăm Sóc Sức Khỏe & Spa',
    status: 'active',
    joinedDate: '2025-04-12',
    lastActiveAt: '3 giờ trước',
    avatar: 'TM',
    phone: '+84 258 399 1007'
  },
  {
    id: 'usr-fb-01',
    name: 'Bếp Trưởng Marcus Chen',
    email: 'marcus.chen@heavenstay.com',
    role: 'fb_staff',
    title: 'Bếp Trưởng Thực Dưỡng Wellness',
    department: 'Ẩm Thực & Dinh Dưỡng F&B',
    status: 'active',
    joinedDate: '2025-01-20',
    lastActiveAt: '30 phút trước',
    avatar: 'MC',
    phone: '+84 258 399 1008'
  },
  {
    id: 'usr-fb-02',
    name: 'Hoàng Thị Mai',
    email: 'mai.hoang@heavenstay.com',
    role: 'fb_staff',
    title: 'Bếp Phó Dinh Dưỡng Thực Dưỡng',
    department: 'Ẩm Thực & Dinh Dưỡng F&B',
    status: 'active',
    joinedDate: '2025-05-18',
    lastActiveAt: 'Hôm qua',
    avatar: 'HM',
    phone: '+84 258 399 1009'
  }
];

const STAFF_STORAGE_KEY = 'hswrms_staff_accounts';

export function getStoredStaffAccounts(): StaffAccount[] {
  if (typeof window === 'undefined') return INITIAL_STAFF_ACCOUNTS;
  try {
    const raw = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(INITIAL_STAFF_ACCOUNTS));
      return [...INITIAL_STAFF_ACCOUNTS];
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return [...INITIAL_STAFF_ACCOUNTS];
  } catch (err) {
    console.error('Failed to parse stored staff accounts:', err);
    return [...INITIAL_STAFF_ACCOUNTS];
  }
}

export function saveStoredStaffAccounts(accounts: StaffAccount[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(accounts));
    window.dispatchEvent(new Event('hswrms_staff_accounts_updated'));
  } catch (err) {
    console.error('Failed to save staff accounts:', err);
  }
}

export function updateStaffAccountStatus(id: string, status: StaffStatus): StaffAccount[] {
  const accounts = getStoredStaffAccounts();
  const updated = accounts.map((acc) => (acc.id === id ? { ...acc, status } : acc));
  saveStoredStaffAccounts(updated);
  return updated;
}

export function addStaffAccount(account: StaffAccount): StaffAccount[] {
  const accounts = getStoredStaffAccounts();
  const updated = [account, ...accounts];
  saveStoredStaffAccounts(updated);
  return updated;
}

export function resetStaffAccounts(): StaffAccount[] {
  saveStoredStaffAccounts(INITIAL_STAFF_ACCOUNTS);
  return [...INITIAL_STAFF_ACCOUNTS];
}

export function getStaffStatistics(): { total: number; active: number; suspended: number } {
  const accounts = getStoredStaffAccounts();
  const active = accounts.filter((s) => s.status === 'active').length;
  return {
    total: accounts.length,
    active,
    suspended: accounts.length - active
  };
}
