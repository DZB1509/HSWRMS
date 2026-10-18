import { useState, useEffect, useCallback } from 'react';
import { spaApi } from '../api/spaApi';
import type {
  BackendSpaTreatment,
  CandidateGenerationResult,
  GenerateCandidatesPayload,
  BackendSpaSession,
  TherapistSessionDetail,
} from '../types/spaTypes';

export function useSpaTreatments() {
  const [treatments, setTreatments] = useState<BackendSpaTreatment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTreatments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await spaApi.getTreatments();
      setTreatments(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch treatments';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTreatments();
  }, [fetchTreatments]);

  return { treatments, loading, error, refetch: fetchTreatments };
}

export function useCandidateEngine() {
  const [result, setResult] = useState<CandidateGenerationResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const generateCandidates = useCallback(async (payload: GenerateCandidatesPayload) => {
    try {
      setLoading(true);
      setError(null);
      const data = await spaApi.generateCandidates(payload);
      setResult(data);
      return data;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to generate scheduling candidates';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCandidates = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, generateCandidates, clearCandidates };
}

export function useCustomerSpaSessions() {
  const [sessions, setSessions] = useState<BackendSpaSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await spaApi.getMySpaSessions();
      setSessions(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load spa sessions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const confirmAttendance = useCallback(async (sessionId: number) => {
    const updated = await spaApi.confirmAttendance(sessionId);
    setSessions((prev) => prev.map((s) => (s.spaSessionId === sessionId ? updated : s)));
    return updated;
  }, []);

  const cancelSession = useCallback(async (sessionId: number) => {
    const updated = await spaApi.cancelSession(sessionId);
    setSessions((prev) => prev.map((s) => (s.spaSessionId === sessionId ? updated : s)));
    return updated;
  }, []);

  return { sessions, loading, error, refetch: fetchSessions, confirmAttendance, cancelSession };
}

export function useTherapistSchedule(initialDate?: string) {
  const [date, setDate] = useState<string>(initialDate || new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState<BackendSpaSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = useCallback(async (selectedDate: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await spaApi.getTherapistDailySchedule(selectedDate);
      setSessions(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load therapist schedule';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchedule(date);
  }, [date, fetchSchedule]);

  return { date, setDate, sessions, loading, error, refetch: () => fetchSchedule(date) };
}

export function useTherapistSessionDetail(sessionId: number | null) {
  const [detail, setDetail] = useState<TherapistSessionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(Boolean(sessionId));
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!sessionId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await spaApi.getTherapistSessionDetail(sessionId);
      setDetail(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load session detail';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const recordOutcome = useCallback(
    async (outcome: 'COMPLETED' | 'NO_SHOW', notes?: string) => {
      if (!sessionId) throw new Error('No session ID');
      const updated = await spaApi.recordOutcome(sessionId, { outcome, therapistNotes: notes });
      if (detail) {
        setDetail({
          ...detail,
          sessionStatus: updated.sessionStatus,
        });
      }
      return updated;
    },
    [sessionId, detail]
  );

  return { detail, loading, error, refetch: fetchDetail, recordOutcome };
}
