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
}

export interface AuthSession {
  userId: number;
  email: string;
  fullName: string;
  roles: string[];
  accountStatus: string;
  tokenType: string;
  expiresInMs: number;
}

export interface AuthContextType {
  currentUser: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  loginAs: (role: Role) => void;
  loginWithCredentials: (session: AuthSession) => Role;
  logout: () => void;
}

export const MOCK_PERSONAS: Record<Role, User> = {
  customer: {
    id: 'usr-cust-01',
    name: 'Eleanor Vance',
    email: 'eleanor.vance@example.com',
    role: 'customer',
    title: 'Wellness Retreat Customer',
    avatar: 'EV'
  },
  receptionist: {
    id: 'usr-rec-01',
    name: 'Linh Tran',
    email: 'linh.tran@heavenstay.com',
    role: 'receptionist',
    title: 'Senior Front Desk Officer',
    department: 'Front Office',
    avatar: 'LT'
  },
  therapist: {
    id: 'usr-th-01',
    name: 'David Kim',
    email: 'david.kim@heavenstay.com',
    role: 'therapist',
    title: 'Holistic Therapist & Yoga Master',
    department: 'Spa & Wellness',
    avatar: 'DK'
  },
  fb_staff: {
    id: 'usr-fb-01',
    name: 'Chef Marcus Chen',
    email: 'marcus.chen@heavenstay.com',
    role: 'fb_staff',
    title: 'Executive Wellness Chef',
    department: 'Dietary Food & Beverage',
    avatar: 'MC'
  },
  manager: {
    id: 'usr-mgr-01',
    name: 'Sarah Jenkins',
    email: 'sarah.jenkins@heavenstay.com',
    role: 'manager',
    title: 'Resort Operations Manager',
    department: 'Resort Management',
    avatar: 'SJ'
  },
  admin: {
    id: 'usr-adm-01',
    name: 'Alexander Wright',
    email: 'alexander.wright@heavenstay.com',
    role: 'admin',
    title: 'System & Governance Administrator',
    department: 'Information Systems',
    avatar: 'AW'
  }
};
