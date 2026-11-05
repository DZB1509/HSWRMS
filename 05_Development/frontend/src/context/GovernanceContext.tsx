import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Role } from '../types/auth';
import type {
  BusinessParameter,
  PermissionRule,
  AdminDelegation,
  AuditEvent,
  PoliceResidenceExportSummary,
  CapabilityKey,
} from '../types/governance';
import { useAuth } from '../hooks/useAuth';
import { apiClient, getAuthToken } from '../api/client/apiClient';
import { parseAuthMePermissions } from '../features/m6-admin/api/staffAccountsApi';
import { isCapabilityAuthorized, type PermissionLoadState } from './governanceAuthorization';

export interface GovernanceContextType {
  parameters: BusinessParameter[];
  updateParameter: (key: string, value: number | string) => { success: boolean; error?: string };
  resetParameterToDefault: (key: string) => void;
  permissionRules: PermissionRule[];
  updatePermissionGrant: (
    capability: CapabilityKey,
    role: Role,
    grant: 'granted' | 'denied'
  ) => { success: boolean; error?: string };
  delegations: AdminDelegation[];
  createDelegation: (data: {
    delegateUserId: string;
    delegateName: string;
    delegateRole: Role;
    capabilities: CapabilityKey[];
    startsAt: string;
    expiresAt: string;
    reason: string;
  }) => { success: boolean; error?: string };
  revokeDelegation: (id: string, reason?: string) => void;
  auditEvents: AuditEvent[];
  logAuditEvent: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => void;
  policeExportSummary: PoliceResidenceExportSummary | null;
  triggerPoliceExport: () => void;
  hasCapability: (role: Role | null, capability: CapabilityKey) => boolean;
  activeDelegations: AdminDelegation[];
  managerDelegatedCapabilities: CapabilityKey[];
  refreshGovernanceData: () => void;
  permissionLoadState: PermissionLoadState;
}

// These mappings are limited to capabilities whose backend screen/action
// contract is explicit. Unmapped capabilities fail closed in the UI.
const CAPABILITY_PERMISSION: Partial<Record<CapabilityKey, string>> = {
  configure_business_parameters: 'S50:U',
  view_permission_matrix: 'S51:V',
  delegate_admin_rights: 'S52:C',
  view_sensitive_data_audit_log: 'S53:V',
  view_manager_dashboard: 'S54:V',
  view_system_overview: 'S55:V',
  export_police_residence_declaration: 'RESIDENCE_REPORT:E',
  view_villa_inventory: 'S12:V',
  manage_villa_inventory: 'S12:U',
  manage_villa_maintenance: 'S12:U',
  view_villa_categories: 'S12:V',
  manage_villa_categories: 'S12:U',
  view_functional_areas: 'S12:V',
  manage_functional_areas: 'S12:U',
  manage_pricing: 'S12:U',
  manage_spa_packages: 'S12:U',
};

const emptyUnavailable = <T,>(): T[] => [];

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

export const GovernanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role, isAuthenticated, refreshPermissions } = useAuth();
  const [effectivePermissions, setEffectivePermissions] = useState<string[] | null>(null);
  const [permissionLoadState, setPermissionLoadState] = useState<PermissionLoadState>('loading');
  const [permissionIdentity, setPermissionIdentity] = useState<string | null>(null);
  const permissionRequestId = React.useRef(0);

  const loadEffectivePermissions = useCallback(async () => {
    const requestId = ++permissionRequestId.current;
    if (!isAuthenticated || !getAuthToken()) {
      setEffectivePermissions([]);
      setPermissionIdentity(currentUser?.id ?? null);
      setPermissionLoadState('ready');
      return;
    }
    setPermissionLoadState('loading');
    setEffectivePermissions(null);
    try {
      const response = await apiClient.get<unknown>('/auth/me');
      if (requestId !== permissionRequestId.current) return;
      setEffectivePermissions(parseAuthMePermissions(response));
      setPermissionIdentity(currentUser?.id ?? null);
      setPermissionLoadState('ready');
    } catch {
      if (requestId !== permissionRequestId.current) return;
      setEffectivePermissions([]);
      setPermissionIdentity(currentUser?.id ?? null);
      setPermissionLoadState('error');
    }
  }, [currentUser?.id, isAuthenticated, role]);

  useEffect(() => {
    void loadEffectivePermissions();
  }, [loadEffectivePermissions]);

  const permissionStateMatchesUser = permissionIdentity === (currentUser?.id ?? null);
  const currentPermissionLoadState = permissionStateMatchesUser ? permissionLoadState : 'loading';
  const verifiedPermissions = permissionStateMatchesUser && permissionLoadState === 'ready'
    ? effectivePermissions
    : [];

  const hasCapability = (targetRole: Role | null, capability: CapabilityKey): boolean => {
    const permission = CAPABILITY_PERMISSION[capability];
    return isCapabilityAuthorized(targetRole, role, permission, verifiedPermissions, currentPermissionLoadState);
  };

  const managerDelegatedCapabilities = useMemo(() => {
    if (role !== 'manager') return [];
    return (Object.keys(CAPABILITY_PERMISSION) as CapabilityKey[])
      .filter((capability) => {
        const permission = CAPABILITY_PERMISSION[capability];
        return Boolean(permission && verifiedPermissions?.includes(permission));
      });
  }, [role, verifiedPermissions]);

  const unavailable = (feature: string) => ({
    success: false,
    error: `${feature} is unavailable through the governance context. Use its verified backend page/API when available.`,
  });

  const value: GovernanceContextType = {
    // Governance pages with verified APIs load their server data directly.
    // This shared compatibility context intentionally contains no mock state.
    parameters: emptyUnavailable<BusinessParameter>(),
    updateParameter: () => unavailable('Parameter updates'),
    resetParameterToDefault: () => undefined,
    permissionRules: emptyUnavailable<PermissionRule>(),
    updatePermissionGrant: () => unavailable('Permission updates'),
    delegations: emptyUnavailable<AdminDelegation>(),
    createDelegation: () => unavailable('Delegation creation'),
    revokeDelegation: () => undefined,
    auditEvents: emptyUnavailable<AuditEvent>(),
    logAuditEvent: (event) => { void event; },
    policeExportSummary: null,
    triggerPoliceExport: () => undefined,
    hasCapability,
    activeDelegations: emptyUnavailable<AdminDelegation>(),
    managerDelegatedCapabilities,
    permissionLoadState: currentPermissionLoadState,
    refreshGovernanceData: () => {
      void refreshPermissions();
      void loadEffectivePermissions();
    },
  };

  return <GovernanceContext.Provider value={value}>{children}</GovernanceContext.Provider>;
};

export const useGovernance = (): GovernanceContextType => {
  const context = useContext(GovernanceContext);
  if (!context) {
    throw new Error('useGovernance must be used within a GovernanceProvider');
  }
  return context;
};
