import { apiClient } from '../client/apiClient';

export interface ApiResponse<T> {
  timestamp: string;
  success: boolean;
  message: string;
  data: T;
}

export interface RetreatPackageDto {
  retreatPackageId: number;
  packageCode: string;
  packageName: string;
  wellnessGoal: string;
  durationNights: number;
  durationUnit: string;
  basePrice: number;
  basePriceUnit: string;
  includedTreatments: string;
  dietaryPlan: string;
  extraChargePolicy: string;
  targetGuest: string;
  packageStatus: string;
  eligibleVillaCategories?: VillaCategoryDto[];
}

export interface VillaCategoryDto {
  villaCategoryId: number;
  categoryName: string;
  maxOccupancy: number;
  priceModifier: number;
  categoryStatus: string;
  inventoryCount: number;
  bedroomCount: number;
  bedroomDescription: string;
  areaDescription: string;
  hasPrivatePool: boolean;
  poolDescription: string;
  featuresAndAmenities: string;
}

export interface BookingCalculationRequest {
  retreatPackageId: number;
  villaCategoryId: number;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  guestCount?: number;
}

export interface BookingCalculationResponse {
  retreatPackageId: number;
  packageName: string;
  villaCategoryId: number;
  categoryName: string;
  checkInDate: string;
  checkOutDate: string;
  durationNights: number;
  basePrice: number;
  villaPriceModifier: number;
  packageTotalAmount: number;
  taxAmount: number;
  totalEstimatedAmount: number;
  requiredDepositAmount: number;
  depositPercentage: number;
  isAvailable: boolean;
  availableVillaCount: number;
  guestCount: number;
}

export interface CreateBookingRequest {
  retreatPackageId: number;
  requestedVillaCategoryId: number;
  checkInDate: string;
  checkOutDate: string;
  specialRequest?: string;
}

export interface BookingSummaryResponse {
  retreatBookingId: number;
  customerProfileId: number;
  retreatPackageId: number;
  packageName: string;
  requestedVillaCategoryId: number;
  requestedCategoryName: string;
  assignedVillaId?: number;
  assignedVillaNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'COMPLETED';
  depositAmount: number;
  totalEstimatedAmount: number;
  specialRequest?: string;
  createdAt: string;
  hasResidenceRecord: boolean;
}

export interface DailyArrivalResponse {
  retreatBookingId: number;
  customerProfileId: number;
  customerFullName: string;
  customerEmail: string;
  customerPhone: string;
  packageName: string;
  requestedCategoryName: string;
  assignedVillaId?: number;
  assignedVillaNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  depositPaid: number;
  hasResidenceRecord: boolean;
}

export interface PhysicalVillaDto {
  villaId: number;
  villaCategoryId: number;
  categoryName: string;
  villaNumber: string;
  floor: string;
  villaStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'NEEDS_CLEANING' | 'INACTIVE';
  zoneName: string;
  bedroomInfo: string;
  maxOccupancy: number;
  areaSqm: number;
  hasPrivatePool: boolean;
  poolInfo: string;
  viewAndOperationalNotes: string;
}

export interface CheckInResidenceRequest {
  identificationNumber: string;
  identificationType: string; // 'CCCD' | 'PASSPORT' | 'OTHER'
  nationality?: string;
  permanentAddress?: string;
}

export interface WalkInBookingRequest {
  customerProfileId?: number;
  retreatPackageId: number;
  villaCategoryId: number;
  physicalVillaId: number;
  checkInDate: string;
  checkOutDate: string;
  identificationNumber: string;
  identificationType: string;
  nationality?: string;
  permanentAddress?: string;
  initialPaymentMethod: string;
  specialRequest?: string;
}

// ---------------- API CLIENT FUNCTIONS ----------------

/**
 * Public & Customer: Browse active retreat packages
 */
export async function getRetreatPackages(wellnessGoal?: string): Promise<RetreatPackageDto[]> {
  const res = await apiClient.get<ApiResponse<RetreatPackageDto[]>>('/retreat-packages', {
    params: wellnessGoal ? { wellnessGoal } : undefined,
  });
  return res.data;
}

/**
 * Public & Customer: Get single retreat package details
 */
export async function getRetreatPackageById(packageId: number): Promise<RetreatPackageDto> {
  const res = await apiClient.get<ApiResponse<RetreatPackageDto>>(`/retreat-packages/${packageId}`);
  return res.data;
}

/**
 * Public & Customer: Get all villa categories
 */
export async function getVillaCategories(): Promise<VillaCategoryDto[]> {
  const res = await apiClient.get<ApiResponse<VillaCategoryDto[]>>('/retreat-packages/villa-categories');
  return res.data;
}

/**
 * Customer: Calculate stay cost and verify category availability
 */
export async function calculateBooking(
  request: BookingCalculationRequest
): Promise<BookingCalculationResponse> {
  const res = await apiClient.post<ApiResponse<BookingCalculationResponse>>(
    '/retreat-packages/calculate',
    request
  );
  return res.data;
}

/**
 * Customer: Create draft booking
 */
export async function createCustomerBooking(
  request: CreateBookingRequest,
  customerId?: number
): Promise<BookingSummaryResponse> {
  const res = await apiClient.post<ApiResponse<BookingSummaryResponse>>(
    '/customer/bookings',
    request,
    {
      params: customerId ? { customerId } : undefined,
    }
  );
  return res.data;
}

/**
 * Customer: Get booking history
 */
export async function getCustomerBookings(customerId?: number): Promise<BookingSummaryResponse[]> {
  const res = await apiClient.get<ApiResponse<BookingSummaryResponse[]>>('/customer/bookings', {
    params: customerId ? { customerId } : undefined,
  });
  return res.data;
}

/**
 * Customer & Receptionist: Get booking detail
 */
export async function getBookingDetail(bookingId: number): Promise<BookingSummaryResponse> {
  const res = await apiClient.get<ApiResponse<BookingSummaryResponse>>(
    `/customer/bookings/${bookingId}`
  );
  return res.data;
}

/**
 * Customer: Request VNPay checkout URL for 30% deposit
 */
export async function getVNPayDepositUrl(
  bookingId: number,
  returnUrl?: string
): Promise<{ paymentUrl: string }> {
  const res = await apiClient.post<ApiResponse<{ paymentUrl: string }>>(
    `/customer/bookings/${bookingId}/vnpay-url`,
    null,
    {
      params: returnUrl ? { returnUrl } : undefined,
    }
  );
  return res.data;
}

/**
 * Customer: Cancel booking
 */
export async function cancelCustomerBooking(
  bookingId: number,
  customerId?: number
): Promise<BookingSummaryResponse> {
  const res = await apiClient.post<ApiResponse<BookingSummaryResponse>>(
    `/customer/bookings/${bookingId}/cancel`,
    null,
    {
      params: customerId ? { customerId } : undefined,
    }
  );
  return res.data;
}

/**
 * Receptionist: Fetch expected daily arrivals
 */
export async function getReceptionistArrivals(date?: string): Promise<DailyArrivalResponse[]> {
  const res = await apiClient.get<ApiResponse<DailyArrivalResponse[]>>('/receptionist/arrivals', {
    params: date ? { date } : undefined,
  });
  return res.data;
}

/**
 * Receptionist: Get available physical villas matching booking's category
 */
export async function getAvailableVillasForAssignment(
  bookingId: number
): Promise<PhysicalVillaDto[]> {
  const res = await apiClient.get<ApiResponse<PhysicalVillaDto[]>>(
    `/receptionist/check-in/${bookingId}/available-villas`
  );
  return res.data;
}

/**
 * Receptionist: Record guest residence declaration per Law on Residence 2020
 */
export async function recordResidenceDeclaration(
  bookingId: number,
  request: CheckInResidenceRequest
): Promise<unknown> {
  const res = await apiClient.post<ApiResponse<unknown>>(
    `/receptionist/check-in/${bookingId}/residence`,
    request
  );
  return res.data;
}

/**
 * Receptionist: Assign physical villa to complete check-in
 */
export async function assignPhysicalVilla(
  bookingId: number,
  physicalVillaId: number
): Promise<BookingSummaryResponse> {
  const res = await apiClient.post<ApiResponse<BookingSummaryResponse>>(
    `/receptionist/check-in/${bookingId}/assign-villa`,
    { physicalVillaId }
  );
  return res.data;
}

/**
 * Receptionist: Create walk-in booking and check-in immediately
 */
export async function createWalkInBooking(
  request: WalkInBookingRequest
): Promise<BookingSummaryResponse> {
  const res = await apiClient.post<ApiResponse<BookingSummaryResponse>>(
    '/receptionist/walk-in',
    request
  );
  return res.data;
}

/**
 * Receptionist: Real-time villa inventory matrix
 */
export async function getReceptionistVillas(params?: {
  status?: string;
  categoryId?: number;
}): Promise<PhysicalVillaDto[]> {
  const res = await apiClient.get<ApiResponse<PhysicalVillaDto[]>>('/receptionist/villas', {
    params,
  });
  return res.data;
}

/**
 * Receptionist: Update villa status (e.g., from NEEDS_CLEANING to AVAILABLE)
 */
export async function updatePhysicalVillaStatus(
  villaId: number,
  newStatus: string,
  notes?: string
): Promise<PhysicalVillaDto> {
  const res = await apiClient.patch<ApiResponse<PhysicalVillaDto>>(
    `/receptionist/villas/${villaId}/status`,
    {
      newStatus,
      notes,
    }
  );
  return res.data;
}
