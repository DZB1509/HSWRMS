import type { Role } from '../../types/auth';

/**
 * Shared post-login routing rules (used by the password login flow and the
 * Google SSO callback so both land users on identical targets).
 */
export const DASHBOARD_BY_ROLE: Record<Role, string> = {
  customer: '/customer/dashboard',
  receptionist: '/receptionist/dashboard',
  therapist: '/therapist/dashboard',
  fb_staff: '/fb/dashboard',
  manager: '/manager/dashboard',
  admin: '/admin/dashboard',
};

/** Route prefixes each role may be sent back to via `?redirect=` (verified against the router). */
const REDIRECT_PREFIXES_BY_ROLE: Record<Role, string[]> = {
  customer: ['/customer', '/retreats', '/'],
  receptionist: ['/receptionist'],
  therapist: ['/therapist'],
  fb_staff: ['/fb'],
  manager: ['/manager', '/admin/system-overview'],
  admin: ['/admin', '/manager'],
};

/**
 * Accepts the requested `?redirect=` only when it is an internal path the
 * authenticated role is actually allowed to visit; otherwise falls back to that
 * role's own dashboard so Customer-only URLs never trap staff.
 */
export const resolvePostLoginTarget = (redirectParam: string | null, resolvedRole: Role): string => {
  if (redirectParam && redirectParam.startsWith('/')) {
    const allowed = REDIRECT_PREFIXES_BY_ROLE[resolvedRole] ?? [];
    if (
      allowed.some(
        (prefix) =>
          redirectParam === prefix ||
          redirectParam === '/' ||
          (prefix !== '/' && redirectParam.startsWith(`${prefix}/`)),
      )
    ) {
      return redirectParam;
    }
  }
  return DASHBOARD_BY_ROLE[resolvedRole];
};
