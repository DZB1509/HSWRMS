import React, { createContext, useContext, useState, useEffect } from 'react';
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

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'hsw_customer_profile_v1',
  WELLNESS: 'hsw_wellness_profile_v1',
  BOOKINGS: 'hsw_customer_bookings_v1',
  DELETION: 'hsw_deletion_request_v1',
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<CustomerProfile>(() => {
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
      return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
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
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore storage errors in sandbox
    }
  }, [profile]);

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
    setProfile((prev) => ({ ...prev, ...updated }));
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
