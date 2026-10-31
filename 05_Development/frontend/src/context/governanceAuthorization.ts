import type { Role } from '../types/auth';

export type PermissionLoadState = 'loading' | 'ready' | 'error';

/** Capability checks only pass after a successful backend permission load. */
export function isCapabilityAuthorized(
  requestedRole: Role | null,
  currentRole: Role | null,
  permissionCode: string | undefined,
  effectivePermissions: string[] | null,
  loadState: PermissionLoadState,
): boolean {
  return Boolean(
    requestedRole &&
    requestedRole === currentRole &&
    permissionCode &&
    loadState === 'ready' &&
    effectivePermissions?.includes(permissionCode)
  );
}

/** Permission-code guards must wait until /auth/me has verified the current identity. */
export function isPermissionAuthorized(
  permissionCode: string | undefined,
  hasBackendLoadedPermission: boolean,
  loadState: PermissionLoadState,
): boolean {
  return Boolean(permissionCode && loadState === 'ready' && hasBackendLoadedPermission);
}
