import type { CustomerProfile, WellnessProfile } from '../types/customer';

export type CustomerPrivateRecordKind = 'profile' | 'wellness';

const LEGACY_KEY_BY_KIND: Record<CustomerPrivateRecordKind, string> = {
  profile: 'hsw_customer_profile_v1',
  wellness: 'hsw_wellness_profile_v1',
};

type IdentityEnvelope<T> = {
  identity: string;
  value: T;
};

export type CustomerPrivateStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function customerPrivateStorageKey(
  kind: CustomerPrivateRecordKind,
  identity: string | null,
): string | null {
  const normalizedIdentity = identity?.trim();
  if (!normalizedIdentity) return null;
  return `${LEGACY_KEY_BY_KIND[kind]}:${encodeURIComponent(normalizedIdentity)}`;
}

export function readCustomerPrivateValue<T>(
  storage: CustomerPrivateStorage,
  kind: CustomerPrivateRecordKind,
  identity: string | null,
): T | null {
  const key = customerPrivateStorageKey(kind, identity);
  if (!key || !identity) return null;

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as IdentityEnvelope<T>;
    if (parsed.identity !== identity || !('value' in parsed)) return null;
    return parsed.value;
  } catch {
    return null;
  }
}

export function writeCustomerPrivateValue<T>(
  storage: CustomerPrivateStorage,
  kind: CustomerPrivateRecordKind,
  identity: string | null,
  value: T,
): boolean {
  const key = customerPrivateStorageKey(kind, identity);
  if (!key || !identity) return false;

  try {
    const envelope: IdentityEnvelope<T> = { identity, value };
    storage.setItem(key, JSON.stringify(envelope));
    return true;
  } catch {
    return false;
  }
}

export function createAuthenticatedCustomerProfile(
  identity: string,
  fullName: string,
  email: string,
): CustomerProfile {
  return {
    id: identity,
    fullName,
    email,
    phone: '',
    dateOfBirth: '',
    address: '',
    preferredLanguage: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
    notificationPreferences: { email: false, sms: false, wellnessReminders: false },
    membershipTier: '',
    memberSince: '',
  };
}

export function createEmptyWellnessProfile(): WellnessProfile {
  return {
    consent: { hasConsented: false, consentedAt: '', policyVersion: '', purposeSummary: '' },
    healthNotes: {
      medicalConditions: [],
      injuriesOrSurgeries: '',
      mobilityConsiderations: '',
      currentMedications: '',
      stressLevel: 'unspecified',
      treatmentPreferences: [],
    },
    dietaryProfile: {
      allergies: [],
      dietaryRestrictions: [],
      intolerances: [],
      dislikedIngredients: [],
      specialInstructions: '',
    },
    isComplete: false,
    lastUpdated: '',
  };
}
