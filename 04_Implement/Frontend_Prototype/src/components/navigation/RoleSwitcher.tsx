import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import type { Role } from '../../types/auth';
import { MOCK_PERSONAS } from '../../types/auth';
import { Users, LogOut, Check, ChevronUp, ChevronDown } from 'lucide-react';

const ROLE_DASHBOARDS: Record<Role, string> = {
  customer: '/customer/dashboard',
  receptionist: '/receptionist/dashboard',
  therapist: '/therapist/dashboard',
  fb_staff: '/fb/dashboard',
  manager: '/manager/dashboard',
  admin: '/admin/dashboard'
};

const ROLE_COLORS: Record<Role, { bg: string; text: string }> = {
  customer: { bg: 'var(--actor-customer)', text: 'var(--actor-customer-text)' },
  receptionist: { bg: 'var(--actor-receptionist)', text: 'var(--actor-receptionist-text)' },
  therapist: { bg: 'var(--actor-therapist)', text: 'var(--actor-therapist-text)' },
  fb_staff: { bg: 'var(--actor-fb)', text: 'var(--actor-fb-text)' },
  manager: { bg: 'var(--actor-manager)', text: 'var(--actor-manager-text)' },
  admin: { bg: 'var(--actor-admin)', text: 'var(--actor-admin-text)' }
};

export const RoleSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { role, isAuthenticated, loginAs, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSelectRole = (newRole: Role) => {
    loginAs(newRole);
    setIsOpen(false);
    showToast(`Switched persona to ${MOCK_PERSONAS[newRole].name} (${newRole.toUpperCase()})`, 'success');
    navigate(ROLE_DASHBOARDS[newRole]);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    showToast('Switched to Public / Unauthenticated state', 'info');
    navigate('/');
  };

  const activeLabel = isAuthenticated && role
    ? MOCK_PERSONAS[role].name
    : 'Visitor';
  const roleCode = isAuthenticated && role ? role.toUpperCase() : 'PUBLIC';

  return (
    <div className="hsw-role-switcher" aria-label="Developer Persona Switcher">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="role-switcher-toggle"
        title="Quick Role & Persona Switcher (Dev Demo Tool)"
        aria-expanded={isOpen}
      >
        <span className="role-switcher-demo-badge">DEMO</span>
        <Users size={13} style={{ color: 'var(--accent-sand)' }} />
        <span className="role-switcher-active-name">{activeLabel}</span>
        <span className="role-switcher-code-tag">{roleCode}</span>
        {isOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
      </button>

      {isOpen && (
        <div className="role-switcher-panel">
          <div className="role-switcher-header">
            <span>Switch Role Persona</span>
            <span style={{ fontSize: '10px', color: 'var(--accent-olive)' }}>Phase 1 Shell</span>
          </div>

          {/* Unauthenticated / Public State */}
          <button
            onClick={handleLogout}
            className={`role-option-btn ${!isAuthenticated ? 'active' : ''}`}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                Public / Unauthenticated
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                Visitor browsing public pages
              </div>
            </div>
            {!isAuthenticated ? (
              <Check size={16} style={{ color: 'var(--accent-forest)' }} />
            ) : (
              <LogOut size={14} style={{ color: 'var(--text-tertiary)' }} />
            )}
          </button>

          {/* 6 Authenticated Roles */}
          {(Object.keys(MOCK_PERSONAS) as Role[]).map((r) => {
            const persona = MOCK_PERSONAS[r];
            const colors = ROLE_COLORS[r];
            const isActive = isAuthenticated && role === r;

            return (
              <button
                key={r}
                onClick={() => handleSelectRole(r)}
                className={`role-option-btn ${isActive ? 'active' : ''}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      className="role-badge-tag"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {r.replace('_', ' ')}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>
                      {persona.name}
                    </span>
                  </div>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {persona.title}
                  </div>
                </div>
                {isActive && <Check size={16} style={{ color: 'var(--accent-forest)' }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
