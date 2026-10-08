import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, Role, AuthContextType } from '../../types/auth';
import { MOCK_PERSONAS } from '../../types/auth';

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

  const role = currentUser ? currentUser.role : null;
  const isAuthenticated = currentUser !== null;

  const loginAs = (newRole: Role) => {
    const user = MOCK_PERSONAS[newRole];
    setCurrentUser(user);
    sessionStorage.setItem(AUTH_STORAGE_KEY, newRole);
  };

  const logout = () => {
    setCurrentUser(null);
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
