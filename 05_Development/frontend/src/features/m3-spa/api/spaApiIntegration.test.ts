import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { spaApi } from './spaApi';

const originalFetch = global.fetch;

function mockApiResponse(data: any, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: {
      get: (header: string) => (header.toLowerCase() === 'content-type' ? 'application/json' : null),
    },
    json: async () => data,
    text: async () => JSON.stringify(data),
  };
}

describe('M3 Spa API Contract & Workflow Tests', () => {
  beforeEach(() => {
    global.fetch = originalFetch;
  });

  it('1. getTreatments fetches active spa treatments list', async () => {
    const mockTreatments = [
      { treatmentId: 1, treatmentName: 'Deep Tissue Massage', durationMinutes: 60, basePrice: 500000, category: 'massage', isIncluded: true, treatmentStatus: 'ACTIVE' }
    ];
    global.fetch = (async (url: string) => {
      assert.ok(url.includes('/api/v1/spa/treatments'));
      return mockApiResponse({ success: true, data: mockTreatments });
    }) as any;

    const data = await spaApi.getTreatments();
    assert.strictEqual(data.length, 1);
    assert.strictEqual(data[0].treatmentName, 'Deep Tissue Massage');
  });

  it('2. generateCandidates posts payload and returns candidate bundles', async () => {
    const mockCandidates = {
      candidates: [
        {
          candidateId: 'cand-1',
          treatmentId: 1,
          treatmentName: 'Deep Tissue',
          durationMinutes: 60,
          therapistId: 2,
          therapistName: 'Mai Linh',
          roomId: 3,
          roomName: 'Lotus Suite',
          scheduledStartAt: '2026-11-05T09:00:00',
          scheduledEndAt: '2026-11-05T10:00:00',
          startTime: '09:00',
          endTime: '10:00',
          date: '2026-11-05',
        }
      ],
      requestedDate: '2026-11-05',
      treatmentDurationMinutes: 60,
      noAvailability: false,
      alternativeCandidates: [],
      message: 'Found 1 slot'
    };

    global.fetch = (async (url: string, options: any) => {
      assert.ok(url.includes('/api/v1/spa/candidates'));
      assert.strictEqual(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.strictEqual(body.treatmentId, 1);
      assert.strictEqual(body.preferredDate, '2026-11-05');
      return mockApiResponse({ success: true, data: mockCandidates });
    }) as any;

    const res = await spaApi.generateCandidates({ treatmentId: 1, preferredDate: '2026-11-05' });
    assert.strictEqual(res.candidates.length, 1);
    assert.strictEqual(res.candidates[0].therapistName, 'Mai Linh');
  });

  it('3. confirmReservation sends atomic reservation and receives confirmed session', async () => {
    const mockSession = {
      spaSessionId: 101,
      retreatBookingId: 5,
      bookingReference: 'HSW-5',
      customerName: 'Nguyen Van A',
      treatmentId: 1,
      treatmentName: 'Deep Tissue',
      durationMinutes: 60,
      basePrice: 500000,
      isIncluded: true,
      therapistId: 2,
      therapistName: 'Mai Linh',
      roomId: 3,
      roomName: 'Lotus Suite',
      scheduledStartAt: '2026-11-05T09:00:00',
      scheduledEndAt: '2026-11-05T10:00:00',
      sessionStatus: 'SCHEDULED',
      confirmationStatus: 'PENDING',
      scheduleVersion: 1,
    };

    global.fetch = (async (url: string, options: any) => {
      assert.ok(url.includes('/api/v1/spa/sessions'));
      assert.strictEqual(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.strictEqual(body.therapistId, 2);
      assert.strictEqual(body.roomId, 3);
      return mockApiResponse({ success: true, data: mockSession }, 201);
    }) as any;

    const res = await spaApi.confirmReservation({
      treatmentId: 1,
      therapistId: 2,
      roomId: 3,
      scheduledStartAt: '2026-11-05T09:00:00',
      scheduledEndAt: '2026-11-05T10:00:00',
      bookingSource: 'CUSTOMER'
    });
    assert.strictEqual(res.spaSessionId, 101);
    assert.strictEqual(res.sessionStatus, 'SCHEDULED');
    assert.strictEqual(res.confirmationStatus, 'PENDING');
  });

  it('4. confirmAttendance transitions confirmationStatus to CONFIRMED', async () => {
    global.fetch = (async (url: string, options: any) => {
      assert.ok(url.includes('/api/v1/spa/sessions/101/confirm-attendance'));
      assert.strictEqual(options.method, 'POST');
      return mockApiResponse({
        success: true,
        data: { spaSessionId: 101, sessionStatus: 'SCHEDULED', confirmationStatus: 'CONFIRMED' }
      });
    }) as any;

    const res = await spaApi.confirmAttendance(101);
    assert.strictEqual(res.confirmationStatus, 'CONFIRMED');
  });

  it('5. declineAttendance records DECLINED and initiates recovery', async () => {
    global.fetch = (async (url: string, options: any) => {
      assert.ok(url.includes('/api/v1/spa/sessions/101/decline-attendance'));
      assert.strictEqual(options.method, 'POST');
      return mockApiResponse({
        success: true,
        data: { spaSessionId: 101, sessionStatus: 'RESCHEDULING', confirmationStatus: 'DECLINED' }
      });
    }) as any;

    const res = await spaApi.declineAttendance(101);
    assert.strictEqual(res.confirmationStatus, 'DECLINED');
    assert.strictEqual(res.sessionStatus, 'RESCHEDULING');
  });

  it('6. getSession retrieves single session by ID', async () => {
    global.fetch = (async (url: string) => {
      assert.ok(url.includes('/api/v1/spa/sessions/101'));
      return mockApiResponse({
        success: true,
        data: { spaSessionId: 101, treatmentName: 'Deep Tissue', sessionStatus: 'SCHEDULED' }
      });
    }) as any;

    const res = await spaApi.getSession(101);
    assert.strictEqual(res.spaSessionId, 101);
    assert.strictEqual(res.treatmentName, 'Deep Tissue');
  });

  it('7. cancelSession sets sessionStatus to CANCELLED', async () => {
    global.fetch = (async (url: string, options: any) => {
      assert.ok(url.includes('/api/v1/spa/sessions/101/cancel'));
      assert.strictEqual(options.method, 'POST');
      return mockApiResponse({
        success: true,
        data: { spaSessionId: 101, sessionStatus: 'CANCELLED' }
      });
    }) as any;

    const res = await spaApi.cancelSession(101);
    assert.strictEqual(res.sessionStatus, 'CANCELLED');
  });

  it('8. getTherapistDashboard calls therapist dashboard endpoint', async () => {
    global.fetch = (async (url: string) => {
      assert.ok(url.includes('/api/v1/therapist/dashboard'));
      return mockApiResponse({
        success: true,
        data: [{ spaSessionId: 101, sessionStatus: 'SCHEDULED' }]
      });
    }) as any;

    const res = await spaApi.getTherapistDashboard();
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0].spaSessionId, 101);
  });

  it('9. getTherapistSessionDetail returns data-minimized wellness projection', async () => {
    global.fetch = (async (url: string) => {
      assert.ok(url.includes('/api/v1/therapist/sessions/101'));
      return mockApiResponse({
        success: true,
        data: {
          spaSessionId: 101,
          customerDisplayName: 'Nguyen V.',
          treatmentRelevantWellnessNotes: 'Prefers light pressure due to lower back sensitivity.',
          sessionStatus: 'SCHEDULED'
        }
      });
    }) as any;

    const res = await spaApi.getTherapistSessionDetail(101);
    assert.strictEqual(res.spaSessionId, 101);
    assert.strictEqual(res.treatmentRelevantWellnessNotes, 'Prefers light pressure due to lower back sensitivity.');
  });

  it('10. recordOutcome marks session as COMPLETED or NO_SHOW', async () => {
    global.fetch = (async (url: string, options: any) => {
      assert.ok(url.includes('/api/v1/therapist/sessions/101/outcome'));
      assert.strictEqual(options.method, 'POST');
      const body = JSON.parse(options.body);
      assert.strictEqual(body.outcome, 'COMPLETED');
      assert.strictEqual(body.therapistNotes, 'Session completed smoothly');
      return mockApiResponse({
        success: true,
        data: { spaSessionId: 101, sessionStatus: 'COMPLETED' }
      });
    }) as any;

    const res = await spaApi.recordOutcome(101, { outcome: 'COMPLETED', therapistNotes: 'Session completed smoothly' });
    assert.strictEqual(res.sessionStatus, 'COMPLETED');
  });
});
