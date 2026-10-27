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
  eligiblePackages?: string;
}

export interface BookingCalculationRequest {
  retreatPackageId: number;
  villaCategoryId: number;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  guestCount?: number;
}

export interface BookingCalculationResponse {
  available: boolean;
  availableCount: number;
  durationNights: number;
  packageBaseAmount: number;
  villaModifierAmount: number;
  taxAmount: number;
  totalEstimatedAmount: number;
  requiredDepositAmount: number;
  depositPercentage: number;
  // Backward compatibility aliases
  isAvailable?: boolean;
  availableVillaCount?: number;
  packageTotalAmount?: number;
  villaPriceModifier?: number;
}

export interface CreateBookingRequest {
  retreatPackageId: number;
  requestedVillaCategoryId: number;
  checkInDate: string;
  checkOutDate: string;
  guestCount?: number;
  specialRequest?: string;
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  emergencyContact?: string;
}

export interface CustomerFullDetailsDto {
  customerProfileId: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
  emergencyContact?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  dateOfBirth?: string;
  residentialAddress?: string;
}

export interface CustomerHealthSummaryDto {
  healthProfileId?: number;
  customerProfileId: number;
  allergies?: string;
  dietaryRequirements?: string;
  treatmentSafetyNotes?: string;
  currentHealthCondition?: string;
  injurySurgeryHistory?: string;
  mobilityJointNotes?: string;
  currentMedications?: string;
  stressFatigueLevel?: string;
  foodIntoleranceNotes?: string;
  dislikedIngredients?: string;
  kitchenNotes?: string;
  anonymizationStatus?: string;
}

export interface PaymentTransactionDto {
  transactionId?: number;
  retreatBookingId: number;
  paymentType: string;
  paymentMethod: string;
  transactionReference: string;
  amountPaid: number;
  paymentStatus: string;
  transactionDate: string;
}

export interface ReceptionistBookingResponseDto {
  retreatBookingId: number;
  bookingReference: string;
  customerProfileId: number;
  userId?: number;
  customerFullName?: string;
  customerEmail?: string;
  customerPhone?: string;
  emergencyContact?: string;
  retreatPackageId: number;
  packageCode: string;
  packageName: string;
  durationNights: number;
  requestedVillaCategoryId: number;
  requestedCategoryName: string;
  assignedVillaId?: number;
  assignedVillaNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'COMPLETED' | 'CANCELLED' | string;
  depositAmount: number;
  totalEstimatedAmount: number;
  guestCount: number;
  specialRequest?: string;
  createdAt: string;
  hasResidenceRecord: boolean;
  hasHealthProfile: boolean;
  paymentStatus?: string;
  paymentMethod?: string;
  transactionReference?: string;
}

export interface ResidenceRecordDto {
  recordId?: number;
  retreatBookingId: number;
  identificationNumber: string;
  identificationType: string;
  nationality: string;
  permanentAddress?: string;
  collectedAt?: string;
}

export interface ReceptionistBookingDetailResponseDto extends ReceptionistBookingResponseDto {
  customerProfile?: CustomerFullDetailsDto;
  residenceRecord?: ResidenceRecordDto;
  healthProfile?: CustomerHealthSummaryDto;
  paymentTransactions?: PaymentTransactionDto[];
}

export interface UpdateBookingRequest {
  checkInDate?: string;
  checkOutDate?: string;
  requestedVillaCategoryId?: number;
  guestCount?: number;
  specialRequest?: string;
}

export interface BookingSummaryResponse {
  retreatBookingId: number;
  bookingReference?: string;
  customerProfileId: number;
  retreatPackageId: number;
  packageName: string;
  requestedVillaCategoryId: number;
  requestedCategoryName: string;
  assignedVillaId?: number;
  assignedVillaNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: 'PENDING' | 'CONFIRMED' | 'CHECKED_IN' | 'CANCELLED' | 'COMPLETED' | string;
  depositAmount: number;
  totalEstimatedAmount: number;
  guestCount?: number;
  specialRequest?: string;
  createdAt: string;
  hasResidenceRecord: boolean;
  paymentStatus?: string;
  depositStatus?: string;
  totalAmount?: number;
  transactionReference?: string;
}

export interface DailyArrivalResponse {
  retreatBookingId: number;
  bookingReference?: string;
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
  hasHealthProfile?: boolean;
  guestCount?: number;
  totalEstimatedAmount?: number;
  paymentStatus?: string;
  transactionReference?: string;
}

export interface PhysicalVillaDto {
  villaId: number;
  physicalVillaId?: number;
  villaCategoryId: number;
  categoryName: string;
  villaNumber: string;
  floor?: string;
  villaStatus: 'AVAILABLE' | 'OCCUPIED' | 'MAINTENANCE' | 'NEEDS_CLEANING' | 'INACTIVE' | string;
  zoneName?: string;
  bedroomInfo?: string;
  maxOccupancy?: number;
  areaSqm?: number;
  hasPrivatePool?: boolean;
  isClean?: boolean;
  isOccupied?: boolean;
  poolInfo?: string;
  viewAndOperationalNotes?: string;
}

export interface CheckInResidenceRequest {
  identificationNumber: string;
  identificationType: string; // 'CCCD' | 'PASSPORT' | 'OTHER'
  nationality?: string;
  permanentAddress?: string;
  fullName?: string;
  dateOfBirth?: string;
  residenceCountry?: string;
  transportation?: string;
  receptionistNotes?: string;
}

export interface ResidenceRecordResponse {
  recordId: number;
  retreatBookingId: number;
  identificationNumber: string;
  identificationType: string;
  nationality: string;
  permanentAddress: string;
  collectedAt: string;
}

export interface WalkInBookingRequest {
  customerProfileId?: number;
  guestFullName?: string;
  customerFullName?: string;
  guestEmail?: string;
  customerEmail?: string;
  guestPhone?: string;
  customerPhone?: string;
  retreatPackageId: number;
  villaCategoryId?: number;
  requestedVillaCategoryId?: number;
  physicalVillaId?: number;
  checkInDate: string;
  checkOutDate: string;
  guestCount?: number;
  identificationNumber?: string;
  identificationType?: string;
  nationality?: string;
  permanentAddress?: string;
  initialPaymentMethod?: string;
  depositPaymentMethod?: string;
  specialRequest?: string;
}


export interface CustomerContactDto {
  customerProfileId: number;
  userId: number;
  fullName: string;
  email: string;
  phone: string;
}

export interface AuthResponseDto {
  token: string;
  userId: number;
  customerProfileId?: number;
  email: string;
  fullName: string;
  roles: string[];
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
  const data = res.data;
  // Ensure backward compatibility aliases are filled
  data.isAvailable = data.available;
  data.availableVillaCount = data.availableCount;
  data.packageTotalAmount = data.packageBaseAmount;
  data.villaPriceModifier = data.villaModifierAmount;
  return data;
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
 * Customer: Modify existing booking (FR-M2-08 / UC18)
 */
export async function updateCustomerBooking(
  bookingId: number,
  request: UpdateBookingRequest,
  customerId?: number
): Promise<BookingSummaryResponse> {
  const res = await apiClient.put<ApiResponse<BookingSummaryResponse>>(
    `/customer/bookings/${bookingId}`,
    request,
    {
      params: customerId ? { customerId } : undefined,
    }
  );
  return res.data;
}

/**
 * Customer: Request VNPay checkout URL for deposit
 */
export async function getVNPayDepositUrl(
  bookingId: number,
  returnUrl?: string
): Promise<{ paymentUrl: string; transactionReference: string; txnRef?: string; testCallbackUrl?: string }> {
  const res = await apiClient.post<ApiResponse<{ paymentUrl: string; transactionReference: string; txnRef?: string; testCallbackUrl?: string }>>(
    `/customer/bookings/${bookingId}/vnpay-url`,
    null,
    {
      params: returnUrl ? { returnUrl } : undefined,
    }
  );
  const data = res.data;
  if (!data.transactionReference && data.txnRef) {
    data.transactionReference = data.txnRef;
  }
  return data;
}

/**
 * Payment: Verify VNPay Return callback
 */
export async function verifyVNPayReturn(
  paramsOrQuery: string | Record<string, string>
): Promise<ApiResponse<Record<string, string>>> {
  let params: Record<string, string> = {};
  if (typeof paramsOrQuery === 'string') {
    const q = paramsOrQuery.startsWith('?') ? paramsOrQuery.slice(1) : paramsOrQuery;
    const sp = new URLSearchParams(q);
    sp.forEach((val, key) => {
      params[key] = val;
    });
  } else {
    params = paramsOrQuery;
  }

  return await apiClient.get<ApiResponse<Record<string, string>>>('/payments/vnpay-return', {
    params,
  });
}


/**
 * Customer: Cancel booking
 */
export async function cancelCustomerBooking(
  bookingId: number,
  reason?: string,
  customerId?: number
): Promise<BookingSummaryResponse> {
  const res = await apiClient.post<ApiResponse<BookingSummaryResponse>>(
    `/customer/bookings/${bookingId}/cancel`,
    null,
    {
      params: {
        ...(customerId ? { customerId } : {}),
        ...(reason ? { reason } : {}),
      },
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
): Promise<ResidenceRecordResponse> {
  const res = await apiClient.post<ApiResponse<ResidenceRecordResponse>>(
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
  physicalVillaId: number,
  healthProfileConfirmed?: boolean
): Promise<BookingSummaryResponse> {
  const res = await apiClient.post<ApiResponse<BookingSummaryResponse>>(
    `/receptionist/check-in/${bookingId}/assign-villa`,
    { physicalVillaId, healthProfileConfirmed }
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
 * Receptionist: Search customer accounts for walk-in lookup
 */
export async function searchCustomers(query: string): Promise<CustomerContactDto[]> {
  const res = await apiClient.get<ApiResponse<CustomerContactDto[]>>(
    '/receptionist/customers/search',
    { params: { query } }
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

/**
 * Auth: Switch demo role and acquire real JWT from SQL Server backend
 */
export async function switchAuthRole(role: string): Promise<AuthResponseDto> {
  const res = await apiClient.post<ApiResponse<AuthResponseDto>>('/auth/switch-role', { role });
  return res.data;
}

/**
 * VNPay: Dev sandbox simulation triggering valid HMAC-SHA512 verification in backend
 */
export async function simulateSandboxVNPayPayment(
  txnRef: string,
  amount: number,
  responseCode: string = '00'
): Promise<any> {
  try {
    const res = await apiClient.post<ApiResponse<any>>(
      `/customer/bookings/vnpay/simulate-sandbox-payment?txnRef=${encodeURIComponent(txnRef)}&amount=${amount}&responseCode=${responseCode}`
    );
    return res.data;
  } catch {
    const fallbackRes = await apiClient.post<ApiResponse<any>>(
      `/payments/simulate-sandbox?txnRef=${encodeURIComponent(txnRef)}&amount=${amount}&responseCode=${responseCode}`
    );
    return fallbackRes.data;
  }
}

/**
 * Receptionist: All booking history from SQL Server
 */
export async function getReceptionistBookings(params?: {
  status?: string;
  checkInFrom?: string;
  checkInTo?: string;
  query?: string;
}): Promise<ReceptionistBookingResponseDto[]> {
  const res = await apiClient.get<ApiResponse<ReceptionistBookingResponseDto[]>>('/receptionist/bookings', {
    params,
  });
  return res.data;
}

/**
 * Receptionist: Booking details with customer profile, residence record, and health profile
 */
export async function getReceptionistBookingDetail(
  bookingId: number
): Promise<ReceptionistBookingDetailResponseDto> {
  const res = await apiClient.get<ApiResponse<ReceptionistBookingDetailResponseDto>>(
    `/receptionist/bookings/${bookingId}`
  );
  return res.data;
}

/**
 * Receptionist: Cancel booking
 */
export async function cancelReceptionistBooking(
  bookingId: number
): Promise<BookingSummaryResponse> {
  const res = await apiClient.post<ApiResponse<BookingSummaryResponse>>(
    `/receptionist/bookings/${bookingId}/cancel`
  );
  return res.data;
}

// Aliases for compatibility
export const getCustomerBooking = getBookingDetail;
export const getCustomerBookingDetail = getBookingDetail;
export const getDailyArrivals = getReceptionistArrivals;
export type CustomerBookingSummary = BookingSummaryResponse;


