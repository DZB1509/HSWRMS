import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Role } from '../types/auth';
import type {
  BusinessParameter,
  FeatureFlag,
  PermissionRule,
  AdminDelegation,
  AuditEvent,
  PoliceResidenceExportSummary,
  CapabilityKey
} from '../types/governance';
import {
  INITIAL_BUSINESS_PARAMETERS,
  INITIAL_FEATURE_FLAGS,
  PERMISSION_RULES,
  INITIAL_DELEGATIONS,
  INITIAL_AUDIT_EVENTS,
  INITIAL_POLICE_EXPORT_SUMMARY
} from '../data/mockGovernance';
import { useAuth } from '../hooks/useAuth';

export interface GovernanceContextType {
  parameters: BusinessParameter[];
  updateParameter: (key: string, value: number | string) => { success: boolean; error?: string };
  resetParameterToDefault: (key: string) => void;
  featureFlags: FeatureFlag[];
  toggleFeatureFlag: (key: string) => void;
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
  policeExportSummary: PoliceResidenceExportSummary;
  triggerPoliceExport: () => void;
  hasCapability: (role: Role | null, capability: CapabilityKey) => boolean;
  activeDelegations: AdminDelegation[];
  managerDelegatedCapabilities: CapabilityKey[];
  refreshGovernanceData: () => void;
}

const STORAGE_KEYS = {
  PARAMETERS: 'hswrms_business_parameters',
  FEATURE_FLAGS: 'hswrms_feature_flags',
  PERMISSION_RULES: 'hswrms_permission_rules',
  DELEGATIONS: 'hswrms_admin_delegations',
  AUDIT_EVENTS: 'hswrms_audit_events',
};

function getStoredJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function persistJson<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Failed to persist ${key}:`, err);
  }
}

const GovernanceContext = createContext<GovernanceContextType | undefined>(undefined);

export const GovernanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, role } = useAuth();

  const [parameters, setParametersState] = useState<BusinessParameter[]>(() =>
    getStoredJson(STORAGE_KEYS.PARAMETERS, INITIAL_BUSINESS_PARAMETERS)
  );
  const [featureFlags, setFeatureFlagsState] = useState<FeatureFlag[]>(() =>
    getStoredJson(STORAGE_KEYS.FEATURE_FLAGS, INITIAL_FEATURE_FLAGS)
  );
  const [permissionRules, setPermissionRulesState] = useState<PermissionRule[]>(() =>
    getStoredJson(STORAGE_KEYS.PERMISSION_RULES, PERMISSION_RULES)
  );
  const [delegations, setDelegationsState] = useState<AdminDelegation[]>(() =>
    getStoredJson(STORAGE_KEYS.DELEGATIONS, INITIAL_DELEGATIONS)
  );
  const [auditEvents, setAuditEventsState] = useState<AuditEvent[]>(() =>
    getStoredJson(STORAGE_KEYS.AUDIT_EVENTS, INITIAL_AUDIT_EVENTS)
  );
  const [policeExportSummary, setPoliceExportSummary] = useState<PoliceResidenceExportSummary>(
    INITIAL_POLICE_EXPORT_SUMMARY
  );

  const setParameters = (updater: React.SetStateAction<BusinessParameter[]>) => {
    setParametersState((prev) => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      persistJson(STORAGE_KEYS.PARAMETERS, next);
      window.dispatchEvent(new CustomEvent('hswrms_governance_updated', { detail: { type: 'parameters' } }));
      return next;
    });
  };

  const setFeatureFlags = (updater: React.SetStateAction<FeatureFlag[]>) => {
    setFeatureFlagsState((prev) => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      persistJson(STORAGE_KEYS.FEATURE_FLAGS, next);
      window.dispatchEvent(new CustomEvent('hswrms_governance_updated', { detail: { type: 'flags' } }));
      return next;
    });
  };

  const setPermissionRules = (updater: React.SetStateAction<PermissionRule[]>) => {
    setPermissionRulesState((prev) => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      persistJson(STORAGE_KEYS.PERMISSION_RULES, next);
      window.dispatchEvent(new CustomEvent('hswrms_governance_updated', { detail: { type: 'permissions' } }));
      return next;
    });
  };

  const setDelegations = (updater: React.SetStateAction<AdminDelegation[]>) => {
    setDelegationsState((prev) => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      persistJson(STORAGE_KEYS.DELEGATIONS, next);
      window.dispatchEvent(new CustomEvent('hswrms_governance_updated', { detail: { type: 'delegations' } }));
      return next;
    });
  };

  const setAuditEvents = (updater: React.SetStateAction<AuditEvent[]>) => {
    setAuditEventsState((prev) => {
      const next = typeof updater === 'function' ? (updater as any)(prev) : updater;
      persistJson(STORAGE_KEYS.AUDIT_EVENTS, next);
      window.dispatchEvent(new CustomEvent('hswrms_audit_events_updated'));
      window.dispatchEvent(new CustomEvent('hswrms_governance_updated', { detail: { type: 'audit' } }));
      return next;
    });
  };

  const refreshGovernanceData = () => {
    setParametersState(getStoredJson(STORAGE_KEYS.PARAMETERS, INITIAL_BUSINESS_PARAMETERS));
    setFeatureFlagsState(getStoredJson(STORAGE_KEYS.FEATURE_FLAGS, INITIAL_FEATURE_FLAGS));
    setPermissionRulesState(getStoredJson(STORAGE_KEYS.PERMISSION_RULES, PERMISSION_RULES));
    setDelegationsState(getStoredJson(STORAGE_KEYS.DELEGATIONS, INITIAL_DELEGATIONS));
    setAuditEventsState(getStoredJson(STORAGE_KEYS.AUDIT_EVENTS, INITIAL_AUDIT_EVENTS));
  };

  // Cross-tab and external sync listener
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_KEYS.PARAMETERS) {
          setParametersState(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.DELEGATIONS) {
          setDelegationsState(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.AUDIT_EVENTS) {
          setAuditEventsState(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.FEATURE_FLAGS) {
          setFeatureFlagsState(JSON.parse(e.newValue));
        } else if (e.key === STORAGE_KEYS.PERMISSION_RULES) {
          setPermissionRulesState(JSON.parse(e.newValue));
        }
      } catch {}
    };

    const handleExternalGovernance = () => {
      refreshGovernanceData();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('hswrms_sync_request', handleExternalGovernance);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('hswrms_sync_request', handleExternalGovernance);
    };
  }, []);

  // Active delegations calculation
  const now = new Date();
  const activeDelegations = delegations.filter((d) => {
    if (d.status !== 'active') return false;
    const start = new Date(d.startsAt);
    const end = new Date(d.expiresAt);
    return now >= start && now <= end;
  });

  // Calculate manager delegated capabilities for Sarah Jenkins (or current manager)
  const managerDelegatedCapabilities: CapabilityKey[] = activeDelegations
    .filter((d) => d.delegateRole === 'manager')
    .flatMap((d) => d.capabilities);

  // Automatically update statuses of expired delegations on mount
  useEffect(() => {
    setDelegations((prev) =>
      prev.map((d) => {
        if (d.status === 'active' && new Date(d.expiresAt) < now) {
          return { ...d, status: 'expired' };
        }
        return d;
      })
    );
  }, []);

  // Update business parameter with validation
  const updateParameter = (
    key: string,
    value: number | string
  ): { success: boolean; error?: string } => {
    const target = parameters.find((p) => p.key === key);
    if (!target) return { success: false, error: 'Parameter not found' };

    // Validation
    if (target.type === 'number' || target.type === 'percentage' || target.type === 'hours') {
      const numVal = Number(value);
      if (isNaN(numVal)) {
        return { success: false, error: 'Value must be a valid number' };
      }
      if (target.min !== undefined && numVal < target.min) {
        return { success: false, error: `Value cannot be less than ${target.min}${target.unit || ''}` };
      }
      if (target.max !== undefined && numVal > target.max) {
        return { success: false, error: `Value cannot exceed ${target.max}${target.unit || ''}` };
      }
    } else if (target.type === 'time') {
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (typeof value !== 'string' || !timeRegex.test(value)) {
        return { success: false, error: 'Time format must be HH:MM (24-hour format)' };
      }
    }

    const updater = currentUser?.name ? `${currentUser.name} (${role || 'Admin'})` : 'Alexander Wright (Admin)';
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setParameters((prev) =>
      prev.map((p) =>
        p.key === key
          ? {
              ...p,
              currentValue: target.type === 'time' ? String(value) : Number(value),
              lastUpdatedAt: nowStr,
              lastUpdatedBy: updater
            }
          : p
      )
    );

    // Append metadata audit event
    logAuditEvent({
      actorId: currentUser?.id || 'usr-adm-01',
      actorName: currentUser?.name || 'Alexander Wright',
      actorRole: role || 'admin',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: key,
      result: 'SUCCESS',
      detailsKey: 'governance.audit.details.parameterUpdated',
      detailsFallback: `Updated parameter ${target.defaultLabel} to ${value}${target.unit || ''}`
    });

    return { success: true };
  };

  // Reset parameter to default value
  const resetParameterToDefault = (key: string) => {
    const target = parameters.find((p) => p.key === key);
    if (!target) return;
    updateParameter(key, target.defaultValue);
  };

  // Toggle feature flag
  const toggleFeatureFlag = (key: string) => {
    const flag = featureFlags.find((f) => f.key === key);
    if (!flag) return;

    const nextState = !flag.enabled;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const updater = currentUser?.name ? `${currentUser.name} (${role || 'Admin'})` : 'Alexander Wright (Admin)';

    setFeatureFlags((prev) =>
      prev.map((f) =>
        f.key === key
          ? {
              ...f,
              enabled: nextState,
              lastChangedAt: nowStr,
              lastChangedBy: updater
            }
          : f
      )
    );

    // Append metadata audit event
    logAuditEvent({
      actorId: currentUser?.id || 'usr-adm-01',
      actorName: currentUser?.name || 'Alexander Wright',
      actorRole: role || 'admin',
      action: 'TOGGLE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: key,
      result: 'SUCCESS',
      detailsKey: 'governance.audit.details.featureFlagToggled',
      detailsFallback: `Toggled feature flag ${flag.defaultName} to ${nextState ? 'ENABLED' : 'DISABLED'}`
    });
  };

  // Update permission matrix grant (constrained editing)
  const updatePermissionGrant = (
    capability: CapabilityKey,
    targetRole: Role,
    grant: 'granted' | 'denied'
  ): { success: boolean; error?: string } => {
    const rule = permissionRules.find((r) => r.capability === capability);
    if (!rule) return { success: false, error: 'Capability not found' };

    if (rule.isImmutableBoundary) {
      return {
        success: false,
        error: rule.defaultBoundaryReason || 'This capability represents an immutable core safety boundary and cannot be modified.'
      };
    }

    setPermissionRules((prev) =>
      prev.map((r) =>
        r.capability === capability
          ? {
              ...r,
              grants: {
                ...r.grants,
                [targetRole]: grant
              }
            }
          : r
      )
    );

    logAuditEvent({
      actorId: currentUser?.id || 'usr-adm-01',
      actorName: currentUser?.name || 'Alexander Wright',
      actorRole: role || 'admin',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: `${capability}:${targetRole}`,
      result: 'SUCCESS',
      detailsKey: 'governance.audit.details.permissionUpdated',
      detailsFallback: `Updated capability ${rule.defaultName} for role ${targetRole} to ${grant.toUpperCase()}`
    });

    return { success: true };
  };

  // Create limited delegation
  const createDelegation = (data: {
    delegateUserId: string;
    delegateName: string;
    delegateRole: Role;
    capabilities: CapabilityKey[];
    startsAt: string;
    expiresAt: string;
    reason: string;
  }): { success: boolean; error?: string } => {
    if (!data.capabilities || data.capabilities.length === 0) {
      return { success: false, error: 'At least one capability must be selected' };
    }

    // Verify all selected capabilities are actually delegable
    const nonDelegable = data.capabilities.filter((c) => {
      const rule = permissionRules.find((r) => r.capability === c);
      return !rule || !rule.isDelegableToManager;
    });

    if (nonDelegable.length > 0) {
      return {
        success: false,
        error: `Privilege escalation prevented: Capabilities [${nonDelegable.join(', ')}] are not delegable to Manager`
      };
    }

    const start = new Date(data.startsAt);
    const end = new Date(data.expiresAt);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end <= start) {
      return { success: false, error: 'Expiry date must be after start date' };
    }

    const id = `DEL-${Date.now().toString().slice(-6)}`;
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newDelegation: AdminDelegation = {
      id,
      delegateUserId: data.delegateUserId,
      delegateName: data.delegateName,
      delegateRole: data.delegateRole,
      capabilities: data.capabilities,
      startsAt: data.startsAt,
      expiresAt: data.expiresAt,
      status: 'active',
      grantedBy: currentUser?.name ? `${currentUser.name} (${role || 'Admin'})` : 'Alexander Wright (Admin)',
      reason: data.reason,
      createdAt: nowStr
    };

    setDelegations((prev) => [newDelegation, ...prev]);

    logAuditEvent({
      actorId: currentUser?.id || 'usr-adm-01',
      actorName: currentUser?.name || 'Alexander Wright',
      actorRole: role || 'admin',
      action: 'CREATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: id,
      result: 'SUCCESS',
      detailsKey: 'governance.audit.details.delegationCreated',
      detailsFallback: `Created limited delegation ${id} for ${data.delegateName} with ${data.capabilities.length} capabilities`
    });

    return { success: true };
  };

  // Revoke delegation
  const revokeDelegation = (id: string, reason?: string) => {
    const target = delegations.find((d) => d.id === id);
    if (!target) return;

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    setDelegations((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: 'revoked',
              revokedAt: nowStr
            }
          : d
      )
    );

    logAuditEvent({
      actorId: currentUser?.id || 'usr-adm-01',
      actorName: currentUser?.name || 'Alexander Wright',
      actorRole: role || 'admin',
      action: 'UPDATE',
      dataCategory: 'SECURITY_GOVERNANCE',
      targetRef: id,
      result: 'SUCCESS',
      detailsKey: 'governance.audit.details.delegationRevoked',
      detailsFallback: `Revoked delegation ${id} for ${target.delegateName}. Reason: ${reason || 'Administrative discretion'}`
    });
  };

  // Append audit event (metadata only!)
  const logAuditEvent = (event: Omit<AuditEvent, 'id' | 'timestamp'>) => {
    const id = `AUD-${Math.floor(10000 + Math.random() * 90000)}`;
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newEvent: AuditEvent = {
      ...event,
      id,
      timestamp
    };

    setAuditEvents((prev) => [newEvent, ...prev]);
  };

  // Trigger Police Residence Declaration export (Decree 13 / Law on Residence 2020)
  const triggerPoliceExport = () => {
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const batchId = `POLICE-DEC-${nowStr.replace(/[- :]/g, '').slice(0, 12)}`;

    setPoliceExportSummary({
      batchId,
      generatedAt: nowStr,
      totalRecords: 14,
      domesticCount: 8,
      foreignCount: 6,
      status: 'SUBMITTED',
      complianceStandard: 'Vietnam Law on Residence 2020 & Decree 13/2023/ND-CP'
    });

    logAuditEvent({
      actorId: currentUser?.id || 'usr-mgr-01',
      actorName: currentUser?.name || 'Sarah Jenkins',
      actorRole: role || 'manager',
      action: 'EXPORT',
      dataCategory: 'RESIDENCE_IDENTITY',
      targetRef: batchId,
      result: 'SUCCESS',
      detailsKey: 'governance.audit.details.residenceBatchExported',
      detailsFallback: `Generated and submitted daily residence declaration batch ${batchId} (14 records)`
    });
  };

  // Check capability-based permission
  const hasCapability = (targetRole: Role | null, capability: CapabilityKey): boolean => {
    if (!targetRole) return false;

    // Check base permission rule
    const rule = permissionRules.find((r) => r.capability === capability);
    if (!rule) return false;

    if (rule.grants[targetRole] === 'granted') {
      return true;
    }

    // Check delegation for Manager
    if (targetRole === 'manager' && rule.isDelegableToManager) {
      return managerDelegatedCapabilities.includes(capability);
    }

    return false;
  };

  return (
    <GovernanceContext.Provider
      value={{
        parameters,
        updateParameter,
        resetParameterToDefault,
        featureFlags,
        toggleFeatureFlag,
        permissionRules,
        updatePermissionGrant,
        delegations,
        createDelegation,
        revokeDelegation,
        auditEvents,
        logAuditEvent,
        policeExportSummary,
        triggerPoliceExport,
        hasCapability,
        activeDelegations,
        managerDelegatedCapabilities,
        refreshGovernanceData
      }}
    >
      {children}
    </GovernanceContext.Provider>
  );
};

export const useGovernance = (): GovernanceContextType => {
  const context = useContext(GovernanceContext);
  if (!context) {
    throw new Error('useGovernance must be used within a GovernanceProvider');
  }
  return context;
};
