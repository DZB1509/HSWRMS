import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
import {
  getCustomerBookings,
  getCustomerProfileApi,
  updateCustomerProfileApi,
} from '../api/booking/retreatBookingApi';

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

const STORAGE_KEYS = {
  PROFILE: 'hsw_customer_profile_v1',
  WELLNESS: 'hsw_wellness_profile_v1',
  DELETION: 'hsw_deletion_request_v1',
};

export const CustomerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Clear any legacy mocked bookings key from localStorage
  useEffect(() => {
    try {
      localStorage.removeItem('hsw_customer_bookings_v1');
    } catch {
      // Ignore
    }
  }, []);

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

  // Strict Database-Only Policy: Initialize bookings state strictly as empty array []
  const [bookings, setBookings] = useState<RetreatBooking[]>([]);
  const [isLoadingBookings, setIsLoadingBookings] = useState<boolean>(true);

  const [deletionRequest, setDeletionRequest] = useState<HealthDataDeletionRequest | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DELETION);
      return saved ? JSON.parse(saved) : INITIAL_DELETION_REQUEST;
    } catch {
      return INITIAL_DELETION_REQUEST;
    }
  });

  // Fetch real customer profile from SQL Server on mount
  useEffect(() => {
    getCustomerProfileApi()
      .then((data) => {
        if (data) {
          setProfile((prev) => ({
            ...prev,
            fullName: data.fullName || prev.fullName,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            dateOfBirth: data.dateOfBirth ? String(data.dateOfBirth) : prev.dateOfBirth,
            address: data.residentialAddress || prev.address,
            emergencyContact: {
              name: data.emergencyContactName || prev.emergencyContact.name,
              phone: data.emergencyContactPhone || prev.emergencyContact.phone,
              relationship: data.emergencyContactRelationship || prev.emergencyContact.relationship,
            },
          }));
        }
      })
      .catch((err) => {
        console.warn('Could not load profile from SQL Server:', err);
      });
  }, []);

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
          const villaTitle = s.requestedCategoryName || '—';
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
    } catch (err) {
      console.error('Error fetching bookings from SQL Server:', err);
      setBookings([]);
    } finally {
      setIsLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomerBookingsFromBackend();
  }, [fetchCustomerBookingsFromBackend]);

  // Save profile and wellness to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore
    }
  }, [profile]);

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

  const updateProfile = async (updated: Partial<CustomerProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    try {
      await updateCustomerProfileApi({
        fullName: updated.fullName,
        phone: updated.phone,
        address: updated.address,
        dateOfBirth: updated.dateOfBirth,
        emergencyName: updated.emergencyContact?.name,
        emergencyPhone: updated.emergencyContact?.phone,
        emergencyRelationship: updated.emergencyContact?.relationship,
        preferredLanguage: updated.preferredLanguage,
      });
    } catch (err) {
      console.warn('Could not save customer profile to SQL Server:', err);
    }
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
