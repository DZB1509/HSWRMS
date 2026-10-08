import { apiRequest } from '../../../api/client/apiClient';
import type {
  BackendSpaTreatment,
  CandidateGenerationResult,
  GenerateCandidatesPayload,
  ConfirmReservationPayload,
  BackendSpaSession,
  TherapistSessionDetail,
  CompleteSessionPayload,
} from '../types/spaTypes';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export const spaApi = {
  /**
   * Screen 25: List active Spa Treatments.
   */
  async getTreatments(): Promise<BackendSpaTreatment[]> {
    const res = await apiRequest<ApiResponse<BackendSpaTreatment[]>>('/spa/treatments');
    return res.data;
  },

  /**
   * Get single Spa Treatment detail.
   */
  async getTreatment(id: number): Promise<BackendSpaTreatment> {
    const res = await apiRequest<ApiResponse<BackendSpaTreatment>>(`/spa/treatments/${id}`);
    return res.data;
  },

  /**
   * Screen 26 & 27: Generate indivisible scheduling candidate bundles.
   * Pure READ-ONLY: does not reserve resources or persist any session.
   */
  async generateCandidates(payload: GenerateCandidatesPayload): Promise<CandidateGenerationResult> {
    const res = await apiRequest<ApiResponse<CandidateGenerationResult>>('/spa/candidates', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Screen 28 & 30: Final atomic reservation confirmation.
   * Revalidates and locks Therapist and Room; rejects on conflict with HTTP 409.
   */
  async confirmReservation(payload: ConfirmReservationPayload): Promise<BackendSpaSession> {
    const res = await apiRequest<ApiResponse<BackendSpaSession>>('/spa/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  /**
   * Screen 29: List sessions for authenticated customer.
   */
  async getMySpaSessions(): Promise<BackendSpaSession[]> {
    const res = await apiRequest<ApiResponse<BackendSpaSession[]>>('/spa/sessions');
    return res.data;
  },

  /**
   * Screen 29: Customer attendance confirmation.
   * Transitions confirmation_status from PENDING to CONFIRMED.
   */
  async confirmAttendance(sessionId: number): Promise<BackendSpaSession> {
    const res = await apiRequest<ApiResponse<BackendSpaSession>>(
      `/spa/sessions/${sessionId}/confirm-attendance`,
      {
        method: 'POST',
      }
    );
    return res.data;
  },

  /**
   * Screen 29: Cancel a scheduled session.
   */
  async cancelSession(sessionId: number): Promise<BackendSpaSession> {
    const res = await apiRequest<ApiResponse<BackendSpaSession>>(
      `/spa/sessions/${sessionId}/cancel`,
      {
        method: 'POST',
      }
    );
    return res.data;
  },

  /**
   * Screen 31: Therapist Dashboard.
   */
  async getTherapistDashboard(): Promise<BackendSpaSession[]> {
    const res = await apiRequest<ApiResponse<BackendSpaSession[]>>('/therapist/dashboard');
    return res.data;
  },

  /**
   * Screen 32: Therapist Daily Schedule.
   */
  async getTherapistDailySchedule(date?: string): Promise<BackendSpaSession[]> {
    const query = date ? `?date=${encodeURIComponent(date)}` : '';
    const res = await apiRequest<ApiResponse<BackendSpaSession[]>>(`/therapist/schedule${query}`);
    return res.data;
  },

  /**
   * Screen 33: Therapist Session Detail with privacy-first wellness notes projection.
   */
  async getTherapistSessionDetail(sessionId: number): Promise<TherapistSessionDetail> {
    const res = await apiRequest<ApiResponse<TherapistSessionDetail>>(`/therapist/sessions/${sessionId}`);
    return res.data;
  },

  /**
   * Screen 33: Record session outcome (COMPLETED or NO_SHOW).
   * Rejects IN_PROGRESS per OI-08.
   */
  async recordOutcome(sessionId: number, payload: CompleteSessionPayload): Promise<BackendSpaSession> {
    const res = await apiRequest<ApiResponse<BackendSpaSession>>(
      `/therapist/sessions/${sessionId}/outcome`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      }
    );
    return res.data;
  },
};
