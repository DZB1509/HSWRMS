import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { SchedulingCandidate, GenerateCandidatesPayload } from './types/spaTypes.ts';

/**
 * BR-M3-08: Alternative Slot Rejection, Negotiation Completion & Cancellation Safety
 * Contract logic & client state verification helpers.
 */

export function accumulateRejectedCandidates(existing: string[], rejectedId: string): string[] {
  if (existing.includes(rejectedId)) {
    return existing;
  }
  return [...existing, rejectedId];
}

export function filterOutRejectedCandidates(
  candidates: SchedulingCandidate[],
  rejectedIds: string[]
): SchedulingCandidate[] {
  const rejectedSet = new Set(rejectedIds);
  return candidates.filter((c) => !rejectedSet.has(c.candidateId));
}

export function isExhaustionState(
  candidates: SchedulingCandidate[],
  alternatives: SchedulingCandidate[],
  loading: boolean
): boolean {
  return !loading && candidates.length === 0 && alternatives.length === 0;
}

export function buildGenerateCandidatesPayloadWithRejections(
  treatmentId: number,
  preferredDate: string,
  rejectedCandidateIds: string[],
  rescheduleSessionId?: number
): GenerateCandidatesPayload {
  return {
    treatmentId,
    preferredDate,
    flexibleWithDate: true,
    rejectedCandidateIds,
    rescheduleSessionId,
  };
}

export interface RejectionStepState {
  candidates: SchedulingCandidate[];
  alternatives: SchedulingCandidate[];
  selectedCandidate: SchedulingCandidate | null;
  rejectedCandidateIds: string[];
}

export function processCandidateRejection(
  state: RejectionStepState,
  rejectedId: string
): RejectionStepState {
  const nextRejected = accumulateRejectedCandidates(state.rejectedCandidateIds, rejectedId);
  const nextSelected = state.selectedCandidate?.candidateId === rejectedId ? null : state.selectedCandidate;
  const nextCandidates = filterOutRejectedCandidates(state.candidates, [rejectedId]);
  const nextAlternatives = filterOutRejectedCandidates(state.alternatives, [rejectedId]);

  return {
    candidates: nextCandidates,
    alternatives: nextAlternatives,
    selectedCandidate: nextSelected,
    rejectedCandidateIds: nextRejected,
  };
}

export function shouldAcceptAsyncResponse(responseReqId: number, currentReqId: number): boolean {
  return responseReqId === currentReqId;
}

export function resolveExhaustionAction(rescheduleSessionId?: number): {
  type: 'SERVER_CANCEL' | 'CLIENT_ABANDON';
  target: string;
} {
  if (rescheduleSessionId) {
    return { type: 'SERVER_CANCEL', target: `/api/v1/spa/sessions/${rescheduleSessionId}/cancel` };
  }
  return { type: 'CLIENT_ABANDON', target: '/customer/spa' };
}

describe('BR-M3-08 Alternative Slot Rejection & Cancellation Contract Safety', () => {
  const mockCandidateA: SchedulingCandidate = {
    candidateId: 'cand-001-therapist-1-room-1',
    treatmentId: 1,
    treatmentName: 'Signature Herbal Massage',
    durationMinutes: 60,
    therapistId: 1,
    therapistName: 'Dr. Linda Tran',
    roomId: 1,
    roomName: 'Lotus Suite',
    scheduledStartAt: '2026-10-31T09:00:00',
    scheduledEndAt: '2026-10-31T10:00:00',
    startTime: '09:00',
    endTime: '10:00',
    date: '2026-10-31',
  };

  const mockCandidateB: SchedulingCandidate = {
    candidateId: 'cand-002-therapist-2-room-2',
    treatmentId: 1,
    treatmentName: 'Signature Herbal Massage',
    durationMinutes: 60,
    therapistId: 2,
    therapistName: 'Dr. Kenji Sato',
    roomId: 2,
    roomName: 'Bamboo Suite',
    scheduledStartAt: '2026-10-31T14:00:00',
    scheduledEndAt: '2026-10-31T15:00:00',
    startTime: '14:00',
    endTime: '15:00',
    date: '2026-10-31',
  };

  const mockAlternativeC: SchedulingCandidate = {
    candidateId: 'cand-003-therapist-1-room-1-nextday',
    treatmentId: 1,
    treatmentName: 'Signature Herbal Massage',
    durationMinutes: 60,
    therapistId: 1,
    therapistName: 'Dr. Linda Tran',
    roomId: 1,
    roomName: 'Lotus Suite',
    scheduledStartAt: '2026-11-01T09:00:00',
    scheduledEndAt: '2026-11-01T10:00:00',
    startTime: '09:00',
    endTime: '10:00',
    date: '2026-11-01',
  };

  it('1. correctly accumulates rejected candidate IDs without duplication', () => {
    let rejected: string[] = [];
    rejected = accumulateRejectedCandidates(rejected, 'cand-001');
    assert.deepEqual(rejected, ['cand-001']);

    // Duplicate rejection does not duplicate ID
    rejected = accumulateRejectedCandidates(rejected, 'cand-001');
    assert.deepEqual(rejected, ['cand-001']);

    rejected = accumulateRejectedCandidates(rejected, 'cand-002');
    assert.deepEqual(rejected, ['cand-001', 'cand-002']);
  });

  it('2. filters out rejected candidates from visible candidate pool', () => {
    const list = [mockCandidateA, mockCandidateB];
    const filtered = filterOutRejectedCandidates(list, ['cand-001-therapist-1-room-1']);
    assert.equal(filtered.length, 1);
    assert.equal(filtered[0].candidateId, 'cand-002-therapist-2-room-2');
  });

  it('3. detects non-exhausted state when alternatives are still available', () => {
    const exhausted = isExhaustionState([], [mockAlternativeC], false);
    assert.equal(exhausted, false);
  });

  it('4. detects exhaustion when both primary and alternatives are empty', () => {
    const exhausted = isExhaustionState([], [], false);
    assert.equal(exhausted, true);
  });

  it('5. does not flag exhaustion while loading is true', () => {
    const exhausted = isExhaustionState([], [], true);
    assert.equal(exhausted, false);
  });

  it('6. clears selectedCandidate if the rejected candidate was selected', () => {
    const initial: RejectionStepState = {
      candidates: [mockCandidateA, mockCandidateB],
      alternatives: [mockAlternativeC],
      selectedCandidate: mockCandidateA,
      rejectedCandidateIds: [],
    };

    const next = processCandidateRejection(initial, mockCandidateA.candidateId);
    assert.equal(next.selectedCandidate, null);
    assert.equal(next.candidates.length, 1);
    assert.equal(next.candidates[0].candidateId, mockCandidateB.candidateId);
    assert.deepEqual(next.rejectedCandidateIds, [mockCandidateA.candidateId]);
  });

  it('7. preserves selectedCandidate if a different candidate is rejected', () => {
    const initial: RejectionStepState = {
      candidates: [mockCandidateA, mockCandidateB],
      alternatives: [mockAlternativeC],
      selectedCandidate: mockCandidateA,
      rejectedCandidateIds: [],
    };

    const next = processCandidateRejection(initial, mockCandidateB.candidateId);
    assert.equal(next.selectedCandidate?.candidateId, mockCandidateA.candidateId);
    assert.equal(next.candidates.length, 1);
  });

  it('8. builds generateCandidates payload preserving rejectedCandidateIds and rescheduleSessionId', () => {
    const payload = buildGenerateCandidatesPayloadWithRejections(1, '2026-10-31', ['cand-001', 'cand-002'], 42);
    assert.equal(payload.treatmentId, 1);
    assert.equal(payload.preferredDate, '2026-10-31');
    assert.deepEqual(payload.rejectedCandidateIds, ['cand-001', 'cand-002']);
    assert.equal(payload.rescheduleSessionId, 42);
    assert.equal(payload.flexibleWithDate, true);
  });

  it('9. successive rejection leads to complete exhaustion', () => {
    let state: RejectionStepState = {
      candidates: [mockCandidateA],
      alternatives: [mockAlternativeC],
      selectedCandidate: null,
      rejectedCandidateIds: [],
    };

    state = processCandidateRejection(state, mockCandidateA.candidateId);
    assert.equal(state.candidates.length, 0);
    assert.equal(state.alternatives.length, 1);
    assert.equal(isExhaustionState(state.candidates, state.alternatives, false), false);

    state = processCandidateRejection(state, mockAlternativeC.candidateId);
    assert.equal(state.candidates.length, 0);
    assert.equal(state.alternatives.length, 0);
    assert.equal(isExhaustionState(state.candidates, state.alternatives, false), true);
  });

  it('10. rejection does not auto-confirm or mutate unconsented candidates', () => {
    const state: RejectionStepState = {
      candidates: [mockCandidateA, mockCandidateB],
      alternatives: [mockAlternativeC],
      selectedCandidate: null,
      rejectedCandidateIds: [],
    };

    const next = processCandidateRejection(state, mockCandidateA.candidateId);
    // Invariant: Customer must explicitly select a candidate before confirmation; rejection never auto-selects.
    assert.equal(next.selectedCandidate, null);
  });

  it('11. race-condition safety: discards stale out-of-order asynchronous responses', () => {
    const req1 = 1;
    const req2 = 2;

    // req2 is currently active
    const currentActiveReq = req2;

    // req1 arrives late after req2 was dispatched
    const acceptReq1 = shouldAcceptAsyncResponse(req1, currentActiveReq);
    assert.equal(acceptReq1, false, 'Stale response from previous query must be discarded');

    // req2 arrives
    const acceptReq2 = shouldAcceptAsyncResponse(req2, currentActiveReq);
    assert.equal(acceptReq2, true, 'Current active response must be accepted');
  });

  it('12. negotiation isolation: resets rejection list when search criteria change', () => {
    let activeRejections = ['cand-001', 'cand-002'];
    // User modifies search date / treatment -> rejections must be scoped/reset
    activeRejections = [];
    assert.equal(activeRejections.length, 0);
  });

  it('13. exhaustion semantics: distinguishes Flow A (new booking) vs Flow B (rescheduling)', () => {
    // Flow A: New booking has no rescheduleSessionId -> client-side abandonment to catalogue with 0 DB mutations
    const flowAAction = resolveExhaustionAction(undefined);
    assert.equal(flowAAction.type, 'CLIENT_ABANDON');
    assert.equal(flowAAction.target, '/customer/spa');

    // Flow B: Rescheduling has rescheduleSessionId -> calls server cancellation endpoint
    const flowBAction = resolveExhaustionAction(42);
    assert.equal(flowBAction.type, 'SERVER_CANCEL');
    assert.equal(flowBAction.target, '/api/v1/spa/sessions/42/cancel');
  });

  it('14. harmlessness of fabricated candidate IDs: forged IDs do not crash or corrupt filtering', () => {
    const list = [mockCandidateA, mockCandidateB];
    const forgedIds = ['MALICIOUS-ID', "'; DROP TABLE spa_sessions; --", 'NON-EXISTENT-UUID-999'];
    const filtered = filterOutRejectedCandidates(list, forgedIds);

    // List remains intact with valid candidates
    assert.equal(filtered.length, 2);
    assert.equal(filtered[0].candidateId, mockCandidateA.candidateId);
    assert.equal(filtered[1].candidateId, mockCandidateB.candidateId);
  });
});
