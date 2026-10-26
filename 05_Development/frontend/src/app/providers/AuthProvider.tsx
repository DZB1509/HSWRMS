import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Role, AuthContextType } from '../../types/auth';
import { MOCK_PERSONAS } from '../../types/auth';
import { setAuthToken, clearAuthToken, getAuthToken } from '../../api/client/apiClient';
import { switchAuthRole } from '../../api/booking/retreatBookingApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'hswrms_active_role';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = sessionStorage.getItem(AUTH_STORAGE_KEY);
    if (saved === 'public') return null;
    if (saved && saved in MOCK_PERSONAS) {
      return MOCK_PERSONAS[saved as Role];
    }
    // Default to Customer for presentation preview
    return MOCK_PERSONAS.customer;
  });

  const acquireBackendToken = useCallback(async (targetRole: Role) => {
    try {
      const authData = await switchAuthRole(targetRole);
      if (authData && authData.token) {
        setAuthToken(authData.token);
      }
    } catch (err) {
      console.warn('Failed to acquire backend JWT for role:', targetRole, err);
    }
  }, []);

  const loginAs = (newRole: Role) => {
    const user = MOCK_PERSONAS[newRole];
    setCurrentUser(user);
    sessionStorage.setItem(AUTH_STORAGE_KEY, newRole);
    acquireBackendToken(newRole);
  };

  const logout = () => {
    setCurrentUser(null);
    clearAuthToken();
    sessionStorage.setItem(AUTH_STORAGE_KEY, 'public');
  };

  useEffect(() => {
    if (currentUser) {
      sessionStorage.setItem(AUTH_STORAGE_KEY, currentUser.role);
      // Ensure backend JWT token is present in apiClient session
      if (!getAuthToken()) {
        acquireBackendToken(currentUser.role);
      }
    } else {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'public');
      clearAuthToken();
    }
  }, [currentUser, acquireBackendToken]);

  const role = currentUser ? currentUser.role : null;
  const isAuthenticated = currentUser !== null;

  return (
    <AuthContext.Provider value={{ currentUser, role, isAuthenticated, loginAs, logout }}>
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
