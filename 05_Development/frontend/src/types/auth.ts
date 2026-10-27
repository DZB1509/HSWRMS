export type Role =
  | 'customer'
  | 'receptionist'
  | 'therapist'
  | 'fb_staff'
  | 'manager'
  | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  avatar?: string;
  department?: string;
  permissions?: string[];
}

export interface AuthSession {
  userId: number;
  email: string;
  fullName: string;
  roles: string[];
  accountStatus: string;
  tokenType: string;
  expiresInMs: number;
  permissions?: string[];
}

export interface MeView {
  userId: number;
  fullName: string;
  email: string;
  roles: string[];
  permissions: string[];
}

export interface AuthContextType {
  currentUser: User | null;
  role: Role | null;
  permissions: string[];
  hasPermission: (code: string) => boolean;
  isAuthenticated: boolean;
  loginAs: (role: Role) => void;
  loginWithCredentials: (session: AuthSession) => Role;
  logout: () => void;
  refreshPermissions: () => Promise<void>;
}

export const MOCK_PERSONAS: Record<Role, User> = {
  customer: {
    id: 'usr-cust-01',
    name: 'Eleanor Vance',
    email: 'eleanor.vance@example.com',
    role: 'customer',
    title: 'Wellness Retreat Customer',
    avatar: 'EV',
    permissions: ['S02:V']
  },
  receptionist: {
    id: 'usr-rec-01',
    name: 'Linh Tran',
    email: 'linh.tran@heavenstay.com',
    role: 'receptionist',
    title: 'Senior Front Desk Officer',
    department: 'Front Office',
    avatar: 'LT',
    permissions: ['S20:V', 'RESIDENCE_REPORT:E']
  },
  therapist: {
    id: 'usr-th-01',
    name: 'David Kim',
    email: 'david.kim@heavenstay.com',
    role: 'therapist',
    title: 'Holistic Therapist & Yoga Master',
    department: 'Spa & Wellness',
    avatar: 'DK',
    permissions: ['S31:V']
  },
  fb_staff: {
    id: 'usr-fb-01',
    name: 'Chef Marcus Chen',
    email: 'marcus.chen@heavenstay.com',
    role: 'fb_staff',
    title: 'Executive Wellness Chef',
    department: 'Dietary Food & Beverage',
    avatar: 'MC',
    permissions: ['S38:V']
  },
  manager: {
    id: 'usr-mgr-01',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@heavenstay.com',
    role: 'manager',
    title: 'Resort Operations Manager',
    department: 'Resort Management',
    avatar: 'SJ',
    permissions: ['S46:V', 'S47:V', 'S47:E', 'S54:V', 'S55:V']
  },
  admin: {
    id: 'usr-adm-01',
    name: 'Alexander Wright',
    email: 'alexander.wright@heavenstay.com',
    role: 'admin',
    title: 'System & Governance Administrator',
    department: 'Information Systems',
    avatar: 'AW',
    permissions: [
      'S10:V', 'S10:C', 'S10:U', 'S10:D',
      'S11:V', 'S11:C', 'S11:U', 'S11:D',
      'S12:V', 'S12:C', 'S12:U', 'S12:D',
      'S49:V', 'S50:V', 'S50:U',
      'S51:V', 'S51:G', 'S52:V', 'S52:C', 'S52:D',
      'S53:V', 'S53:E', 'S55:V', 'RESIDENCE_REPORT:E'
    ]
  }
};
