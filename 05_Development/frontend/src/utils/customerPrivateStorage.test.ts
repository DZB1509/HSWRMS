import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createIdentityScopedState,
  identityScopedReducer,
  selectIdentityScopedState,
} from './identityScopedState.ts';
import {
  customerPrivateStorageKey,
  readCustomerPrivateValue,
  writeCustomerPrivateValue,
} from './customerPrivateStorage.ts';

class MemoryStorage {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe('customer private profile and wellness storage isolation', () => {
  it('does not expose Customer A profile or wellness data to Customer B', () => {
    const storage = new MemoryStorage();
    const profileA = { id: 'user-a', phone: 'private-a' };
    const wellnessA = { dietaryProfile: { allergies: ['private-allergy-a'] } };

    assert.equal(writeCustomerPrivateValue(storage, 'profile', 'user-a', profileA), true);
    assert.equal(writeCustomerPrivateValue(storage, 'wellness', 'user-a', wellnessA), true);

    assert.deepEqual(readCustomerPrivateValue(storage, 'profile', 'user-a'), profileA);
    assert.equal(readCustomerPrivateValue(storage, 'profile', 'user-b'), null);
    assert.equal(readCustomerPrivateValue(storage, 'wellness', 'user-b'), null);
  });

  it("keeps Customer B's writes inside B's namespace", () => {
    const storage = new MemoryStorage();
    const profileA = { id: 'user-a', phone: 'private-a' };
    const profileB = { id: 'user-b', phone: 'private-b' };
    writeCustomerPrivateValue(storage, 'profile', 'user-a', profileA);
    writeCustomerPrivateValue(storage, 'profile', 'user-b', profileB);

    assert.deepEqual(readCustomerPrivateValue(storage, 'profile', 'user-a'), profileA);
    assert.deepEqual(readCustomerPrivateValue(storage, 'profile', 'user-b'), profileB);
    assert.notEqual(customerPrivateStorageKey('profile', 'user-a'), customerPrivateStorageKey('profile', 'user-b'));
  });

  it('does not hydrate or overwrite legacy global keys when identity is missing', () => {
    const storage = new MemoryStorage();
    storage.setItem('hsw_customer_profile_v1', 'legacy-private-profile');
    storage.setItem('hsw_wellness_profile_v1', 'legacy-private-wellness');

    assert.equal(readCustomerPrivateValue(storage, 'profile', null), null);
    assert.equal(readCustomerPrivateValue(storage, 'wellness', ''), null);
    assert.equal(writeCustomerPrivateValue(storage, 'profile', null, { id: 'unknown' }), false);
    assert.equal(storage.getItem('hsw_customer_profile_v1'), 'legacy-private-profile');
    assert.equal(storage.getItem('hsw_wellness_profile_v1'), 'legacy-private-wellness');
    assert.equal(customerPrivateStorageKey('profile', '  '), null);
  });

  it('preserves unrelated non-sensitive preferences', () => {
    const storage = new MemoryStorage();
    storage.setItem('hsw_theme_v1', 'dark');
    writeCustomerPrivateValue(storage, 'wellness', 'user-a', { allergies: [] });

    assert.equal(storage.getItem('hsw_theme_v1'), 'dark');
  });

  it('clears previous in-memory state during account switch and logout', () => {
    let state = createIdentityScopedState<{ phone: string } | null>('user-a', { phone: 'private-a' });
    assert.equal(selectIdentityScopedState(state, 'user-b', null).data, null);

    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-b', requestId: 1, emptyData: null, isLoading: false,
    });
    assert.equal(selectIdentityScopedState(state, 'user-b', null).data, null);

    state = identityScopedReducer(state, {
      type: 'begin', identity: null, requestId: 2, emptyData: null, isLoading: false,
    });
    assert.equal(selectIdentityScopedState(state, null, null).data, null);
  });

  it("ignores Customer A's late response after switching to Customer B", () => {
    let state = createIdentityScopedState<{ allergies: string[] } | null>(null, null);
    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-a', requestId: 1, emptyData: null, isLoading: true,
    });
    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-b', requestId: 2, emptyData: null, isLoading: true,
    });
    const stateForB = state;

    state = identityScopedReducer(state, {
      type: 'resolve', identity: 'user-a', requestId: 1,
      data: { allergies: ['private-a'] }, error: null,
    });

    assert.equal(state, stateForB);
    assert.equal(selectIdentityScopedState(state, 'user-b', null).data, null);
  });
});
