import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createIdentityScopedState,
  identityScopedReducer,
  selectIdentityScopedState,
} from './identityScopedState.ts';

interface RecordForCustomer {
  id: string;
  customerId: string;
}

describe('identity-scoped M3 and Customer caches', () => {
  it('loads sessions for the authenticated identity on initial login', () => {
    let state = createIdentityScopedState<RecordForCustomer[]>(null, []);

    const initialView = selectIdentityScopedState(state, 'user-a', []);
    assert.deepEqual(initialView.data, []);
    assert.equal(initialView.isLoading, true);

    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-a', requestId: 1, emptyData: [], isLoading: true,
    });
    state = identityScopedReducer(state, {
      type: 'resolve', identity: 'user-a', requestId: 1,
      data: [{ id: 'session-a', customerId: 'user-a' }], error: null,
    });

    assert.equal(selectIdentityScopedState(state, 'user-a', []).data[0]?.customerId, 'user-a');
    assert.equal(selectIdentityScopedState(state, 'user-a', []).isLoading, false);
  });

  it('clears prior sessions and starts a new load on a same-role account switch', () => {
    let state = createIdentityScopedState<RecordForCustomer[]>(null, []);
    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-a', requestId: 1, emptyData: [], isLoading: true,
    });
    state = identityScopedReducer(state, {
      type: 'resolve', identity: 'user-a', requestId: 1,
      data: [{ id: 'session-a', customerId: 'user-a' }], error: null,
    });

    const switchedView = selectIdentityScopedState(state, 'user-b', []);
    assert.deepEqual(switchedView.data, []);
    assert.equal(switchedView.isLoading, true);

    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-b', requestId: 2, emptyData: [], isLoading: true,
    });
    state = identityScopedReducer(state, {
      type: 'resolve', identity: 'user-b', requestId: 2,
      data: [{ id: 'session-b', customerId: 'user-b' }], error: null,
    });
    assert.deepEqual(selectIdentityScopedState(state, 'user-b', []), {
      identity: 'user-b', requestId: 2, data: [{ id: 'session-b', customerId: 'user-b' }], isLoading: false, error: null,
    });
  });

  it('clears customer-specific sessions and errors on logout', () => {
    let state = createIdentityScopedState<RecordForCustomer[]>(null, []);
    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-a', requestId: 1, emptyData: [], isLoading: true,
    });
    state = identityScopedReducer(state, {
      type: 'resolve', identity: 'user-a', requestId: 1,
      data: [{ id: 'session-a', customerId: 'user-a' }], error: 'old error',
    });
    state = identityScopedReducer(state, {
      type: 'begin', identity: null, requestId: 2, emptyData: [], isLoading: false,
    });

    const loggedOutView = selectIdentityScopedState(state, null, []);
    assert.deepEqual(loggedOutView.data, []);
    assert.equal(loggedOutView.isLoading, false);
    assert.equal(loggedOutView.error, null);
  });

  it('ignores an old in-flight response after a newer identity load begins', () => {
    let state = createIdentityScopedState<RecordForCustomer[]>(null, []);
    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-a', requestId: 1, emptyData: [], isLoading: true,
    });
    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-b', requestId: 2, emptyData: [], isLoading: true,
    });
    const afterSwitch = state;

    state = identityScopedReducer(state, {
      type: 'resolve', identity: 'user-a', requestId: 1,
      data: [{ id: 'late-session-a', customerId: 'user-a' }], error: null,
    });

    assert.equal(state, afterSwitch);
    assert.deepEqual(selectIdentityScopedState(state, 'user-b', []).data, []);
    assert.equal(selectIdentityScopedState(state, 'user-b', []).isLoading, true);
  });

  it('refreshes Customer bookings on identity change without exposing A bookings to B', () => {
    let state = createIdentityScopedState<RecordForCustomer[]>(null, []);
    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-a', requestId: 1, emptyData: [], isLoading: true,
    });
    state = identityScopedReducer(state, {
      type: 'resolve', identity: 'user-a', requestId: 1,
      data: [{ id: 'booking-a', customerId: 'user-a' }], error: null,
    });

    state = identityScopedReducer(state, {
      type: 'begin', identity: 'user-b', requestId: 2, emptyData: [], isLoading: true,
    });
    const duringRefresh = selectIdentityScopedState(state, 'user-b', []);
    assert.deepEqual(duringRefresh.data, []);
    assert.equal(duringRefresh.isLoading, true);

    state = identityScopedReducer(state, {
      type: 'resolve', identity: 'user-b', requestId: 2,
      data: [{ id: 'booking-b', customerId: 'user-b' }], error: null,
    });
    assert.deepEqual(selectIdentityScopedState(state, 'user-b', []).data, [
      { id: 'booking-b', customerId: 'user-b' },
    ]);
  });
});
