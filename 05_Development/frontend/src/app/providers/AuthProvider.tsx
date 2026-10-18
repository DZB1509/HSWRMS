import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role, AuthContextType, AuthSession } from '../../types/auth';
import { MOCK_PERSONAS } from '../../types/auth';
import { clearAuthToken, getAuthToken } from '../../api/client/apiClient';
const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'hswrms_active_role';
const AUTH_SESSION_KEY = 'hswrms_auth_session';

const normalizeRole = (value: string | undefined | null): Role | null => {
  const normalized = (value ?? '').trim().toLowerCase();
  if (normalized === 'customer') return 'customer';
  if (normalized === 'receptionist') return 'receptionist';
  if (normalized === 'therapist' || normalized === 'therapist / yoga instructor') return 'therapist';
  if (normalized === 'f&b staff' || normalized === 'fb_staff' || normalized === 'fb-staff' || normalized === 'f&b_staff' || normalized === 'fbstaff' || normalized === 'fb staff') return 'fb_staff';
  if (normalized === 'manager') return 'manager';
  if (normalized === 'admin' || normalized === 'administrator') return 'admin';
  return null;
};

export const mapBackendRolesToRole = (roles: string[] | undefined | null): Role | null => {
  if (!roles) return null;
  for (const candidate of roles) {
    const mapped = normalizeRole(candidate);
    if (mapped) return mapped;
  }
  return null;
};

const readStoredSession = (): AuthSession | null => {
  try {
    const raw = sessionStorage.getItem(AUTH_SESSION_KEY) || localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed || typeof parsed.email !== 'string' || !Array.isArray(parsed.roles)) return null;
    return parsed;
  } catch {
    return null;
  }
};

const userFromSession = (session: AuthSession, role: Role): User => ({
  id: `usr-${session.userId}`,
  name: session.fullName,
  email: session.email,
  role,
  title: MOCK_PERSONAS[role].title,
  department: MOCK_PERSONAS[role].department,
  avatar: MOCK_PERSONAS[role].avatar,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const session = readStoredSession();
    const token = getAuthToken();
    if (session && token) {
      const mapped = mapBackendRolesToRole(session.roles);
      if (mapped) return userFromSession(session, mapped);
    }
    const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (saved === 'public') return null;
    if (saved && saved in MOCK_PERSONAS) {
      return MOCK_PERSONAS[saved as Role];
    }
    // No stored session/token: start as a PUBLIC visitor so real login and
    // RoleGuard redirects work. Demo personas are chosen via RoleSwitcher.
    return null;
  });

  const role = currentUser ? currentUser.role : null;
  const isAuthenticated = currentUser !== null;

  const loginAs = (newRole: Role) => {
    // Demo persona switch must never inherit the real user's JWT: a mock
    // identity paired with a real token would misattribute protected requests.
    clearAuthToken();
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // Storage unavailable; in-memory switch already applied below.
    }
    const user = MOCK_PERSONAS[newRole];
    setCurrentUser(user);
    sessionStorage.setItem(AUTH_STORAGE_KEY, newRole);
  };

  const loginWithCredentials = (session: AuthSession): Role => {
    const mapped = mapBackendRolesToRole(session.roles) ?? 'customer';
    const user = userFromSession(session, mapped);
    setCurrentUser(user);
    try {
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    } catch {
      // Session storage unavailable; auth state remains in memory.
    }
    sessionStorage.setItem(AUTH_STORAGE_KEY, mapped);
    return mapped;
  };

  const logout = () => {
    setCurrentUser(null);
    clearAuthToken();
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // Storage unavailable; in-memory logout already applied.
    }
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'public');
  };

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, currentUser.role);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'public');
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider value={{ currentUser, role, isAuthenticated, loginAs, loginWithCredentials, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

