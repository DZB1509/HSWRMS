export interface IdentityScopedState<T> {
  identity: string | null;
  requestId: number;
  data: T;
  isLoading: boolean;
  error: string | null;
}

export type IdentityScopedAction<T> =
  | { type: 'begin'; identity: string | null; requestId: number; emptyData: T; isLoading: boolean }
  | { type: 'resolve'; identity: string | null; requestId: number; data: T; error: string | null }
  | { type: 'update'; identity: string | null; update: (data: T) => T };

export function createIdentityScopedState<T>(identity: string | null, data: T): IdentityScopedState<T> {
  return { identity, requestId: 0, data, isLoading: false, error: null };
}

export function identityScopedReducer<T>(
  state: IdentityScopedState<T>,
  action: IdentityScopedAction<T>,
): IdentityScopedState<T> {
  if (action.type === 'begin') {
    if (action.requestId < state.requestId) return state;
    return {
      identity: action.identity,
      requestId: action.requestId,
      data: action.emptyData,
      isLoading: action.isLoading,
      error: null,
    };
  }

  if (action.type === 'resolve') {
    if (state.identity !== action.identity || state.requestId !== action.requestId) return state;
    return { ...state, data: action.data, isLoading: false, error: action.error };
  }

  if (state.identity !== action.identity) return state;
  return { ...state, data: action.update(state.data) };
}

export function selectIdentityScopedState<T>(
  state: IdentityScopedState<T>,
  identity: string | null,
  emptyData: T,
): IdentityScopedState<T> {
  if (state.identity === identity) return state;
  return {
    identity,
    requestId: -1,
    data: emptyData,
    isLoading: identity !== null,
    error: null,
  };
}
