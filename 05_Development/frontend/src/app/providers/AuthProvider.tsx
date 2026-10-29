import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Role, AuthContextType, AuthSession } from '../../types/auth';
import { MOCK_PERSONAS } from '../../types/auth';
import { clearAuthToken, getAuthToken, setAuthToken, apiClient } from '../../api/client/apiClient';
import {
  parseAuthMePermissions,
  handleAuthMeError,
  evaluatePermission,
} from '../../features/m6-admin/api/staffAccountsApi';
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
  title: MOCK_PERSONAS[role]?.title || 'Staff Member',
  department: MOCK_PERSONAS[role]?.department || 'Resort Operations',
  avatar: MOCK_PERSONAS[role]?.avatar || 'ST',
  permissions: session.permissions || [],
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
  const permissions = currentUser?.permissions || [];

  const logout = useCallback(() => {
    setCurrentUser(null);
    clearAuthToken();
    try {
      sessionStorage.removeItem(AUTH_SESSION_KEY);
      localStorage.removeItem(AUTH_SESSION_KEY);
    } catch {
      // Storage unavailable; in-memory logout already applied.
    }
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'public');
  }, []);

  const fetchEffectivePermissions = useCallback(async (): Promise<string[] | null> => {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const res = await apiClient.get<unknown>('/auth/me');
      return parseAuthMePermissions(res);
    } catch (err: unknown) {
      handleAuthMeError(err, logout);
      return null;
    }
  }, [logout]);

  const hasPermission = useCallback((code: string): boolean => {
    return evaluatePermission(currentUser, code);
  }, [currentUser]);

  const refreshPermissions = useCallback(async (): Promise<void> => {
    const perms = await fetchEffectivePermissions();
    if (perms !== null) {
      setCurrentUser((prev) => (prev ? { ...prev, permissions: perms } : null));
      const session = readStoredSession();
      if (session) {
        try {
          sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify({ ...session, permissions: perms }));
        } catch {
          // Ignore storage quota
        }
      }
    }
  }, [fetchEffectivePermissions]);

  const loginAs = (newRole: Role) => {
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

    const creds: Partial<Record<Role, { email: string; pass: string }>> = {
      admin: { email: 'admin@heavenstay.com', pass: 'Admin@123456' },
      manager: { email: 'manager@heavenstay.com', pass: 'Manager@123456' },
      receptionist: { email: 'receptionist@heavenstay.com', pass: 'Staff@123456' },
      therapist: { email: 'therapist@heavenstay.com', pass: 'Staff@123456' },
      fb_staff: { email: 'fnb@heavenstay.com', pass: 'Staff@123456' }
    };
    const targetCred = creds[newRole];
    if (targetCred) {
      fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetCred.email, password: targetCred.pass })
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.data?.token) {
            setAuthToken(data.data.token, true);
          }
        })
        .catch(() => {});
    }
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

    // Asynchronously synchronize effective permissions from /auth/me
    fetchEffectivePermissions().then((perms) => {
      if (perms !== null) {
        setCurrentUser((prev) => (prev ? { ...prev, permissions: perms } : null));
        try {
          const updated: AuthSession = { ...session, permissions: perms };
          sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
        } catch {
          // Storage quota
        }
      }
    });

    return mapped;
  };

  // On mount: if authenticated with real token, refresh permissions from /auth/me
  useEffect(() => {
    const token = getAuthToken();
    const session = readStoredSession();
    if (token && session) {
      fetchEffectivePermissions().then((perms) => {
        if (perms !== null) {
          setCurrentUser((prev) => (prev ? { ...prev, permissions: perms } : null));
          try {
            const updated: AuthSession = { ...session, permissions: perms };
            sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(updated));
          } catch {
            // Storage quota
          }
        }
      });
    }
  }, [fetchEffectivePermissions]);

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, currentUser.role);
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'public');
    }
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role,
        permissions,
        hasPermission,
        isAuthenticated,
        loginAs,
        loginWithCredentials,
        logout,
        refreshPermissions,
      }}
    >
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

