import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  CustomerProfile,
  WellnessProfile,
  RetreatBooking,
  HealthDataDeletionRequest,
  CustomerContextType,
  DepositStatus,
  DeletionRequestStatus,
} from '../types/customer';
import {
  INITIAL_CUSTOMER_PROFILE,
  INITIAL_WELLNESS_PROFILE,
  INITIAL_BOOKINGS,
  INITIAL_DELETION_REQUEST,
} from '../data/mockCustomer';
import { useAuth } from '../hooks/useAuth';
import { getMyProfile } from '../api/customer/customerProfileApi';

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'hsw_customer_profile_v1',
  WELLNESS: 'hsw_wellness_profile_v1',
  BOOKINGS: 'hsw_customer_bookings_v1',
  DELETION: 'hsw_deletion_request_v1',
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
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

  const [bookings, setBookings] = useState<RetreatBooking[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BOOKINGS);
      if (saved) {
        const parsed: RetreatBooking[] = JSON.parse(saved);
        const todayStr = new Date().toISOString().split('T')[0];
        const active = parsed.find((b) => b.status === 'upcoming' || b.status === 'in_stay');
        if (active && active.endDate < todayStr) {
          return INITIAL_BOOKINGS;
        }
        return parsed;
      }
      return INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [deletionRequest, setDeletionRequest] = useState<HealthDataDeletionRequest | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELETION);
      return saved ? JSON.parse(saved) : INITIAL_DELETION_REQUEST;
    } catch {
      return INITIAL_DELETION_REQUEST;
    }
  });

  // Save to localStorage on changes
  // Real authenticated identity (AuthProvider session) always takes precedence
  // over the stored mock profile for id/fullName/email. Backend profile fields
  // loaded from GET /customers/me/profile take precedence for the supported
  // editable fields; all other demo fields remain mock until a real API exists.
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

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(storedProfile));
    } catch {
      // Ignore storage errors in sandbox
    }
  }, [storedProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.WELLNESS, JSON.stringify(wellnessProfile));
    } catch {
      // Ignore storage errors
    }
  }, [wellnessProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKINGS, JSON.stringify(bookings));
    } catch {
      // Ignore storage errors
    }
  }, [bookings]);

  useEffect(() => {
    try {
      if (deletionRequest) {
        localStorage.setItem(STORAGE_KEYS.DELETION, JSON.stringify(deletionRequest));
      } else {
        localStorage.removeItem(STORAGE_KEYS.DELETION);
      }
    } catch {
      // Ignore storage errors
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
    // Check if customer has an active or upcoming retreat requiring health data
    const hasActiveRetreat = bookings.some(
      (b) => b.status === 'upcoming' || b.status === 'in_stay'
    );

    const status: DeletionRequestStatus = hasActiveRetreat ? 'deferred_active_retreat' : 'pending';

    const newRequest: HealthDataDeletionRequest = {
      id: `REQ-DEL-${Date.now().toString().slice(-6)}`,
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
        ? 'Health data deletion request recorded. Execution is deferred until your active/upcoming retreat completes to maintain safety care protocols.'
        : 'Health data deletion request successfully submitted for review.',
    };
  };

  const cancelDeletionRequest = () => {
    setDeletionRequest(null);
  };

  const createBooking = (
    bookingData: Omit<RetreatBooking, 'id' | 'bookingReference' | 'createdAt'>
  ): RetreatBooking => {
    const randomRef = `HSW-${Math.floor(10000 + Math.random() * 90000)}`;
    const newBooking: RetreatBooking = {
      ...bookingData,
      id: `HSW-BK-${Date.now()}`,
      bookingReference: randomRef,
      createdAt: new Date().toISOString(),
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
    transactionId: string,
    status: DepositStatus
  ) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId || b.bookingReference === bookingId) {
          return {
            ...b,
            depositStatus: status,
            status: status === 'paid' ? 'upcoming' : b.status,
            paymentDetails: {
              transactionId,
              paymentMethod: 'VNPay Online Gateway',
              paidAt: new Date().toISOString(),
              cardLast4: '8821',
            },
          };
        }
        return b;
      })
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
