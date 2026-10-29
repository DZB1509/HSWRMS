import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
import {
  INITIAL_CUSTOMER_PROFILE,
  INITIAL_WELLNESS_PROFILE,
  INITIAL_DELETION_REQUEST,
} from '../data/mockCustomer';
import { useAuth } from '../hooks/useAuth';
import { getMyProfile } from '../api/customer/customerProfileApi';
import { getCustomerBookings } from '../api/booking/retreatBookingApi';

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'hsw_customer_profile_v1',
  WELLNESS: 'hsw_wellness_profile_v1',
  DELETION: 'hsw_deletion_request_v1',
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  // Clear legacy mock bookings key
  useEffect(() => {
    try {
      localStorage.removeItem('hsw_customer_bookings_v1');
    } catch {
      // Ignore
    }
  }, []);

  const [storedProfile, setStoredProfile] = useState<CustomerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return saved ? JSON.parse(saved) : INITIAL_CUSTOMER_PROFILE;
    } catch {
      return INITIAL_CUSTOMER_PROFILE;
    }
  });

  const [wellnessProfile, setWellnessProfile] = useState<WellnessProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WELLNESS);
      return saved ? JSON.parse(saved) : INITIAL_WELLNESS_PROFILE;
    } catch {
      return INITIAL_WELLNESS_PROFILE;
    }
  });

  const [bookings, setBookings] = useState<RetreatBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(false);

  const [deletionRequest, setDeletionRequest] = useState<HealthDataDeletionRequest | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELETION);
      return saved ? JSON.parse(saved) : INITIAL_DELETION_REQUEST;
    } catch {
      return INITIAL_DELETION_REQUEST;
    }
  });

  // Save to localStorage on changes
  const [serverProfile, setServerProfile] = useState<CustomerProfile | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState(false);

  const refreshServerProfile = useCallback(async () => {
    if (!currentUser || currentUser.role !== 'customer') {
      setServerProfile(null);
      return null;
    }
    setIsProfileLoading(true);
    try {
      const response = await getMyProfile();
      const data = response.data;
      const mapped: CustomerProfile = {
        ...INITIAL_CUSTOMER_PROFILE,
        id: `usr-${data.userId}`,
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
      setServerProfile(mapped);
      return mapped;
    } catch {
      setServerProfile(null);
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void refreshServerProfile();
  }, [refreshServerProfile]);

  const profile: CustomerProfile = useMemo(() => {
    if (serverProfile) return serverProfile;
    if (currentUser && currentUser.role === 'customer') {
      return {
        ...storedProfile,
        id: currentUser.id,
        fullName: currentUser.name,
        email: currentUser.email,
      };
    }
    return storedProfile;
  }, [serverProfile, storedProfile, currentUser]);

  // Fetch bookings directly from SQL Server Backend API
  const fetchCustomerBookingsFromBackend = useCallback(async () => {
    setIsLoadingBookings(true);
    try {
      const summaries = await getCustomerBookings();
      if (summaries && summaries.length > 0) {
        const mapped: RetreatBooking[] = summaries.map((s) => {
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

          return {
            id: String(s.retreatBookingId),
            bookingReference: bookingRef,
            retreatSlug: (s.packageName || 'retreat').toLowerCase().replace(/\s+/g, '-'),
            retreatName: {
              vi: packageTitle,
              en: packageTitle,
              'zh-CN': packageTitle,
              ja: packageTitle,
              fr: packageTitle,
            },
            heroImage: '/images/hero-resort-cliff.jpg',
            startDate: s.checkInDate,
            endDate: s.checkOutDate,
            days,
            nights,
            villaType: {
              vi: villaTitle,
              en: villaTitle,
              'zh-CN': villaTitle,
              ja: villaTitle,
              fr: villaTitle,
            },
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
        });
        setBookings(mapped);
      } else {
        setBookings([]);
      }
    } catch {
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    void fetchCustomerBookingsFromBackend();
  }, [fetchCustomerBookingsFromBackend]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(storedProfile));
    } catch {
      // Ignore
    }
  }, [storedProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WELLNESS, JSON.stringify(wellnessProfile));
    } catch {
      // Ignore
    }
  }, [wellnessProfile]);

  useEffect(() => {
    try {
      if (deletionRequest) {
        localStorage.setItem(STORAGE_KEYS.DELETION, JSON.stringify(deletionRequest));
      } else {
        localStorage.removeItem(STORAGE_KEYS.DELETION);
      }
    } catch {
      // Ignore
    }
  }, [deletionRequest]);

  const updateProfile = (updated: Partial<CustomerProfile>) => {
    setStoredProfile((prev) => ({ ...prev, ...updated }));
  };

  const updateWellnessProfile = (updated: Partial<WellnessProfile>) => {
    setWellnessProfile((prev) => ({
      ...prev,
      ...updated,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const activeBooking = bookings.find((b) => b.status === 'upcoming' || b.status === 'in_stay') || null;

  const submitDeletionRequest = (
    reason: string,
    acknowledged: boolean
  ): { success: boolean; status: DeletionRequestStatus; message: string } => {
    const hasActiveRetreat = bookings.some(
      (b) => b.status === 'upcoming' || b.status === 'in_stay'
    );

    const status: DeletionRequestStatus = hasActiveRetreat ? 'deferred_active_retreat' : 'pending';

    const newRequest: HealthDataDeletionRequest = {
      id: 'HDR-' + Date.now(),
      customerId: profile.id,
      requestedAt: new Date().toISOString(),
      status,
      targetDataTypes: [
        'Treatment Health Notes',
        'Therapist Session Observations',
        'Allergy & Dietary Sensitivities',
        'Wellness Consent Form',
      ],
      activeRetreatNotice: hasActiveRetreat
        ? 'Active/Upcoming retreat in progress. Health data deletion will be queued and safely finalized once stay check-out is complete.'
        : undefined,
      reason,
      acknowledgedPolicy: acknowledged,
    };

    setDeletionRequest(newRequest);

    return {
      success: true,
      status,
      message: hasActiveRetreat
        ? 'Deletion request deferred: active retreat in progress. Data retained until retreat completion per Article 17(3) GDPR / Vietnam PDPD.'
        : 'Health data deletion request submitted successfully. Processing within 30 days.',
    };
  };

  const cancelDeletionRequest = (): boolean => {
    if (!deletionRequest) return false;
    setDeletionRequest(null);
    return true;
  };

  const createBooking = (
    bookingData: Omit<RetreatBooking, 'id' | 'bookingReference' | 'createdAt'>
  ): RetreatBooking => {
    const newBooking: RetreatBooking = {
      ...bookingData,
      id: `bk-${Date.now()}`,
      bookingReference: `HSW-BK-${Date.now().toString().slice(-5)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setBookings((prev) => [newBooking, ...prev]);
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
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, depositStatus: status } : b))
    );
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
        submitDeletionRequest,
        cancelDeletionRequest,
        bookings,
        activeBooking,
        createBooking,
        getBookingById,
        updateBookingDeposit,
        isLoadingBookings,
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
