import type { Role } from './auth';

export type StaffStatus = 'active' | 'suspended';

export interface StaffAccount {
  id: string;
  name: string;
  email: string;
  role: Role;
  title: string;
  department: string;
  status: StaffStatus;
  joinedDate: string;
  lastActiveAt: string;
  avatar: string;
  phone?: string;
}
