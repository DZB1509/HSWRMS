import React, { createContext, useContext, useEffect, useCallback, useReducer, useRef } from 'react';
import type {
  CustomerProfile,
  WellnessProfile,
  RetreatBooking,
  HealthDataDeletionRequest,
  CustomerContextType,
  DepositStatus,
  DeletionRequestStatus,
  BookingStatus,
} from '../types/customer';
import { useAuth } from '../hooks/useAuth';
import { getMyProfile } from '../api/customer/customerProfileApi';
import { getCustomerBookings, createCustomerBooking } from '../api/booking/retreatBookingApi';
import { listMyDeletionRequests, createMyDeletionRequest, cancelMyDeletionRequest } from '../api/health/deletionRequestApi';
import {
  createAuthenticatedCustomerProfile,
  createEmptyWellnessProfile,
  readCustomerPrivateValue,
  writeCustomerPrivateValue,
} from '../utils/customerPrivateStorage';
import {
  createIdentityScopedState,
  identityScopedReducer,
  selectIdentityScopedState,
} from '../utils/identityScopedState';
import {
  resolvePackageLocalized,
  resolveVillaCategoryLocalized,
} from '../i18n/dynamicContent';

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

type DeletionRequestApiData = {
  deletionRequestId: number;
  requestType: string;
  status: string;
  requestedByUserId: number;
  createdAt: string;
};

const mapDeletionRequest = (data: DeletionRequestApiData): HealthDataDeletionRequest => {
  const statusByApiValue: Record<string, DeletionRequestStatus> = {
    PENDING: 'pending',
    DEFERRED: 'deferred_active_retreat',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  };
  const status = statusByApiValue[data.status.trim().toUpperCase()];
  if (!status) throw new Error(`Unsupported deletion request status: ${data.status}`);
  return {
    id: String(data.deletionRequestId),
    customerId: String(data.requestedByUserId),
    requestedAt: data.createdAt,
    status,
    targetDataTypes: [],
    acknowledgedPolicy: true,
  };
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const customerIdentity = currentUser?.role === 'customer' ? currentUser.id : null;
  const activeCustomerIdentity = useRef(customerIdentity);
  activeCustomerIdentity.current = customerIdentity;
  const privateStateRequestSequence = useRef(0);

  const [profileCacheState, dispatchProfileCacheState] = useReducer(
    identityScopedReducer<CustomerProfile | null>,
    createIdentityScopedState<CustomerProfile | null>(null, null),
  );
  const profileCache = selectIdentityScopedState(profileCacheState, customerIdentity, null).data;
  const [wellnessState, dispatchWellnessState] = useReducer(
    identityScopedReducer<WellnessProfile | null>,
    createIdentityScopedState<WellnessProfile | null>(null, null),
  );
  const currentWellnessState = selectIdentityScopedState(wellnessState, customerIdentity, null);
  const wellnessProfile = currentWellnessState.data;

  useEffect(() => {
    const requestId = ++privateStateRequestSequence.current;
    dispatchProfileCacheState({
      type: 'begin', identity: customerIdentity, requestId, emptyData: null, isLoading: false,
    });
    dispatchWellnessState({
      type: 'begin', identity: customerIdentity, requestId, emptyData: null, isLoading: false,
    });

    if (customerIdentity === null) return;

    const savedProfile = readCustomerPrivateValue<CustomerProfile>(localStorage, 'profile', customerIdentity);
    const identityMatchedProfile = savedProfile?.id === customerIdentity ? savedProfile : null;
    dispatchProfileCacheState({
      type: 'resolve', identity: customerIdentity, requestId, data: identityMatchedProfile, error: null,
    });
    dispatchWellnessState({
      type: 'resolve',
      identity: customerIdentity,
      requestId,
      data: readCustomerPrivateValue<WellnessProfile>(localStorage, 'wellness', customerIdentity),
      error: null,
    });
  }, [customerIdentity]);

  const [bookingState, dispatchBookingState] = useReducer(
    identityScopedReducer<RetreatBooking[]>,
    createIdentityScopedState<RetreatBooking[]>(null, []),
  );
  const bookingRequestSequence = useRef(0);
  const currentBookingState = selectIdentityScopedState(bookingState, customerIdentity, []);
  const bookings = currentBookingState.data;
  const isLoadingBookings = currentBookingState.isLoading;
  const bookingsError = currentBookingState.error;

  const [deletionState, dispatchDeletionState] = useReducer(
    identityScopedReducer<HealthDataDeletionRequest | null>,
    createIdentityScopedState<HealthDataDeletionRequest | null>(null, null),
  );
  const deletionRequestSequence = useRef(0);
  const currentDeletionState = selectIdentityScopedState(deletionState, customerIdentity, null);
  const deletionRequest = currentDeletionState.data;
  const isDeletionLoading = currentDeletionState.isLoading;
  const deletionError = currentDeletionState.error;

  const serverProfileRequestSequence = useRef(0);
  const [serverProfileState, dispatchServerProfileState] = useReducer(
    identityScopedReducer<CustomerProfile | null>,
    createIdentityScopedState<CustomerProfile | null>(null, null),
  );
  const currentServerProfileState = selectIdentityScopedState(serverProfileState, customerIdentity, null);
  const serverProfile = currentServerProfileState.data;
  const isProfileLoading = currentServerProfileState.isLoading;

  const refreshServerProfile = useCallback(async () => {
    const identity = customerIdentity;
    const requestId = ++serverProfileRequestSequence.current;
    dispatchServerProfileState({
      type: 'begin', identity, requestId, emptyData: null, isLoading: identity !== null,
    });
    if (identity === null) {
      return null;
    }

    try {
      const response = await getMyProfile();
      const data = response.data;
      const mapped: CustomerProfile = {
        ...createAuthenticatedCustomerProfile(identity, data.fullName, data.email),
        id: identity,
        fullName: data.fullName,
        email: data.email,
        phone: data.phoneNumber ?? '',
        dateOfBirth: data.dateOfBirth ?? '',
        address: data.residentialAddress ?? '',
        preferredLanguage: data.preferredLanguage ?? 'en',
        emergencyContact: {
          name: data.emergencyContactName ?? '',
          phone: data.emergencyContactPhone ?? '',
          relationship: data.emergencyContactRelationship ?? '',
        },
      };
      if (activeCustomerIdentity.current !== identity || serverProfileRequestSequence.current !== requestId) return null;
      dispatchServerProfileState({ type: 'resolve', identity, requestId, data: mapped, error: null });
      return mapped;
    } catch {
      if (activeCustomerIdentity.current === identity && serverProfileRequestSequence.current === requestId) {
        dispatchServerProfileState({ type: 'resolve', identity, requestId, data: null, error: null });
      }
      return null;
    }
  }, [customerIdentity]);

  useEffect(() => {
    void refreshServerProfile();
  }, [refreshServerProfile]);

  const profile: CustomerProfile | null = serverProfile ?? profileCache ?? (
    customerIdentity !== null && currentUser?.role === 'customer'
      ? createAuthenticatedCustomerProfile(customerIdentity, currentUser.name, currentUser.email)
      : null
  );

  // Fetch bookings directly from SQL Server Backend API
  const fetchCustomerBookingsFromBackend = useCallback(async () => {
    const requestId = ++bookingRequestSequence.current;
    const identity = customerIdentity;
    dispatchBookingState({
      type: 'begin',
      identity,
      requestId,
      emptyData: [],
      isLoading: identity !== null,
    });
    if (identity === null) return;

    try {
      const summaries = await getCustomerBookings();
      const mapped: RetreatBooking[] = summaries?.length
        ? summaries.map((s) => {
          let status: BookingStatus = 'upcoming';
          const bStatus = (s.bookingStatus || '').toUpperCase();
          if (bStatus === 'CHECKED_IN') status = 'in_stay';
          else if (bStatus === 'COMPLETED') status = 'completed';
          else if (bStatus === 'CANCELLED') status = 'cancelled';
          else status = 'upcoming';

          const depositStatus: DepositStatus =
            bStatus === 'CONFIRMED' || bStatus === 'CHECKED_IN' || bStatus === 'COMPLETED'
              ? 'paid'
              : 'pending';

          const packageTitle = s.packageName || 'Retreat Journey';
          const villaTitle = s.requestedCategoryName || 'Standard Villa';
          const bookingRef = s.bookingReference || `HSW-BK-${s.retreatBookingId}`;

          const start = new Date(s.checkInDate).getTime();
          const end = new Date(s.checkOutDate).getTime();
          const nights = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
          const days = nights + 1;

          const localizedRetreatName = resolvePackageLocalized(
            (s as any).packageCode || s.retreatPackageId || s.packageName,
            packageTitle
          );
          const localizedVillaType = resolveVillaCategoryLocalized(
            s.requestedVillaCategoryId || s.requestedCategoryName,
            villaTitle
          );

          return {
            id: String(s.retreatBookingId),
            bookingReference: bookingRef,
            retreatSlug: (s.packageName || 'retreat').toLowerCase().replace(/\s+/g, '-'),
            retreatName: localizedRetreatName,
            heroImage: '/images/hero-resort-cliff.jpg',
            startDate: s.checkInDate,
            endDate: s.checkOutDate,
            days,
            nights,
            villaType: localizedVillaType,
            villaNumber: s.assignedVillaNumber || undefined,
            status,
            totalPrice: s.totalEstimatedAmount,
            depositAmount: s.depositAmount,
            remainingBalance: Math.max(0, s.totalEstimatedAmount - s.depositAmount),
            depositStatus,
            specialRequests: s.specialRequest || undefined,
            itinerary: [],
            createdAt: s.checkInDate,
          };
        })
        : [];
      dispatchBookingState({
        type: 'resolve',
        identity,
        requestId,
        data: mapped,
        error: null,
      });
    } catch (err) {
      dispatchBookingState({
        type: 'resolve',
        identity,
        requestId,
        data: [],
        error: err instanceof Error ? err.message : 'Unable to load Customer bookings.',
      });
    }
  }, [customerIdentity]);

  useEffect(() => {
    void fetchCustomerBookingsFromBackend();
  }, [fetchCustomerBookingsFromBackend]);

  const updateProfile = (updated: Partial<CustomerProfile>) => {
    const identity = customerIdentity;
    if (!identity || activeCustomerIdentity.current !== identity) return;

    const base = profile ?? createAuthenticatedCustomerProfile(identity, currentUser?.name ?? '', currentUser?.email ?? '');
    const next = { ...base, ...updated, id: identity };
    const requestId = ++privateStateRequestSequence.current;
    dispatchProfileCacheState({ type: 'begin', identity, requestId, emptyData: null, isLoading: false });
    dispatchProfileCacheState({ type: 'resolve', identity, requestId, data: next, error: null });
    writeCustomerPrivateValue(localStorage, 'profile', identity, next);
  };

  const updateWellnessProfile = (updated: Partial<WellnessProfile>) => {
    const identity = customerIdentity;
    if (!identity || activeCustomerIdentity.current !== identity) return;

    const next = {
      ...(wellnessProfile ?? createEmptyWellnessProfile()),
      ...updated,
      lastUpdated: new Date().toISOString(),
    };
    const requestId = ++privateStateRequestSequence.current;
    dispatchWellnessState({ type: 'begin', identity, requestId, emptyData: null, isLoading: false });
    dispatchWellnessState({ type: 'resolve', identity, requestId, data: next, error: null });
    writeCustomerPrivateValue(localStorage, 'wellness', identity, next);
  };

  const activeBooking = bookings.find((b) => b.status === 'upcoming' || b.status === 'in_stay') || null;

  const refreshDeletionRequests = useCallback(async () => {
    const identity = customerIdentity;
    const requestId = ++deletionRequestSequence.current;
    dispatchDeletionState({
      type: 'begin',
      identity,
      requestId,
      emptyData: null,
      isLoading: identity !== null,
    });
    if (identity === null) return;
    try {
      const response = await listMyDeletionRequests();
      if (activeCustomerIdentity.current !== identity) return;
      const first = response.data && response.data.length > 0 ? response.data[0] : null;
      dispatchDeletionState({
        type: 'resolve',
        identity,
        requestId,
        data: first ? mapDeletionRequest(first) : null,
        error: null,
      });
    } catch (error) {
      if (activeCustomerIdentity.current !== identity) return;
      dispatchDeletionState({
        type: 'resolve',
        identity,
        requestId,
        data: null,
        error: error instanceof Error ? error.message : 'Could not load deletion requests.',
      });
    }
  }, [customerIdentity]);

  useEffect(() => {
    void refreshDeletionRequests();
  }, [refreshDeletionRequests]);

  const submitDeletionRequest = useCallback(async (
    _reason: string,
    acknowledged: boolean
  ): Promise<{ success: boolean; status: DeletionRequestStatus; message: string }> => {
    if (!acknowledged) {
      throw new Error('Acknowledgement is required before submitting a deletion request.');
    }
    const identity = customerIdentity;
    if (!identity) throw new Error('A signed-in Customer is required to submit a deletion request.');
    const requestId = ++deletionRequestSequence.current;
    dispatchDeletionState({ type: 'begin', identity, requestId, emptyData: null, isLoading: true });
    try {
      const response = await createMyDeletionRequest({ requestType: 'HEALTH_DATA' });
      const mapped = mapDeletionRequest(response.data);
      if (activeCustomerIdentity.current === identity) {
        dispatchDeletionState({ type: 'resolve', identity, requestId, data: mapped, error: null });
      }
      return {
        success: true,
        status: mapped.status,
        message: response.message || 'Health data deletion request successfully submitted for review.',
      };
    } catch (error) {
      if (activeCustomerIdentity.current === identity) {
        dispatchDeletionState({
          type: 'resolve',
          identity,
          requestId,
          data: null,
          error: error instanceof Error ? error.message : 'Could not submit deletion request.',
        });
      }
      throw error;
    }
  }, [customerIdentity]);

  const cancelDeletionRequest = useCallback(async (id: string): Promise<void> => {
    const identity = customerIdentity;
    if (!identity) throw new Error('A signed-in Customer is required to cancel a deletion request.');
    await cancelMyDeletionRequest(Number(id));
    if (activeCustomerIdentity.current === identity) await refreshDeletionRequests();
  }, [customerIdentity, refreshDeletionRequests]);

  const createBooking = (
    bookingData: Omit<RetreatBooking, 'id' | 'bookingReference' | 'createdAt'>
  ): RetreatBooking => {
    const newBooking: RetreatBooking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      bookingReference: `HSW-BK-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    if (customerIdentity !== null) {
      dispatchBookingState({
        type: 'update',
        identity: customerIdentity,
        update: (prev) => [newBooking, ...prev],
      });
    }

    // Persist retreat booking transaction to backend SQL database
    createCustomerBooking({
      retreatPackageId: 1,
      requestedVillaCategoryId: 1,
      checkInDate: bookingData.startDate,
      checkOutDate: bookingData.endDate,
      guestCount: 1,
      specialRequest: bookingData.specialRequests,
    })
      .then((persisted) => {
        if (customerIdentity !== null && persisted?.bookingReference) {
          dispatchBookingState({
            type: 'update',
            identity: customerIdentity,
            update: (prev) => prev.map((b) =>
              b.id === newBooking.id
                ? {
                    ...b,
                    id: String(persisted.retreatBookingId),
                    bookingReference: persisted.bookingReference || b.bookingReference,
                  }
                : b
            ),
          });
        }
      })
      .catch((err) => {
        console.warn('Backend booking persistence skipped or unavailable:', err);
      });
    return newBooking;
  };

  const getBookingById = (idOrReference: string): RetreatBooking | undefined => {
    return bookings.find(
      (b) => b.id === idOrReference || b.bookingReference === idOrReference
    );
  };

  const updateBookingDeposit = (
    bookingId: string,
    _transactionId: string,
    status: DepositStatus
  ) => {
    if (customerIdentity !== null) {
      dispatchBookingState({
        type: 'update',
        identity: customerIdentity,
        update: (prev) => prev.map((b) => (b.id === bookingId ? { ...b, depositStatus: status } : b)),
      });
    }
  };

  return (
    <CustomerContext.Provider
      value={{
        profile,
        updateProfile,
        refreshServerProfile,
        isProfileLoading,
        wellnessProfile,
        updateWellnessProfile,
        deletionRequest,
        isDeletionLoading,
        deletionError,
        refreshDeletionRequests,
        submitDeletionRequest,
        cancelDeletionRequest,
        bookings,
        activeBooking,
        createBooking,
        getBookingById,
        updateBookingDeposit,
        isLoadingBookings,
        bookingsError,
        refreshBookings: fetchCustomerBookingsFromBackend,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomer = (): CustomerContextType => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomer must be used within a CustomerProvider');
  }
  return context;
};
