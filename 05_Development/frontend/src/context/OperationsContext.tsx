import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Villa,
  VillaStatus,
  HousekeepingStatus,
  ArrivalRecord,
  CustomerIdentityVerification,
  OperationalAlert,
  OperationsContextType,
  ResidenceDeclarationStatus,
} from '../types/operations';
import {
  INITIAL_VILLAS,
  INITIAL_ARRIVALS,
  INITIAL_OPERATIONAL_ALERTS,
} from '../data/mockOperations';
import { useCustomer } from './CustomerContext';

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  VILLAS: 'hsw_operations_villas_v1',
  ARRIVALS: 'hsw_operations_arrivals_v1',
  TRANSIENT_IDENTITY: 'hsw_transient_identity_session_v1',
};

// SENSITIVE DATA MINIMIZATION & PRIVACY AUDIT:
// Strip sensitive identity values (ID number, DOB, permanent address)
// before saving operational records to persistent localStorage.
const sanitizeArrivalForLocalStorage = (arrival: ArrivalRecord): ArrivalRecord => {
  const { identityVerification, ...rest } = arrival;
  return {
    ...rest,
    identityVerification: identityVerification
      ? {
        fullLegalName: identityVerification.fullLegalName,
        nationality: identityVerification.nationality,
        residenceCountry: identityVerification.residenceCountry,
        idType: identityVerification.idType,
        idNumber: '', // Redacted from plain localStorage
        dateOfBirth: '', // Redacted from plain localStorage
        permanentAddress: '', // Redacted from plain localStorage
        arrivalTransport: identityVerification.arrivalTransport,
        receptionistNotes: identityVerification.receptionistNotes,
        verifiedAt: identityVerification.verifiedAt,
        verifiedBy: identityVerification.verifiedBy,
      }
      : undefined,
  };
};

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { bookings } = useCustomer();

  const [villas, setVillas] = useState<Villa[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.VILLAS);
      return saved ? JSON.parse(saved) : INITIAL_VILLAS;
    } catch {
      return INITIAL_VILLAS;
    }
  });

  const [arrivals, setArrivals] = useState<ArrivalRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ARRIVALS);
      const parsed: ArrivalRecord[] = saved ? JSON.parse(saved) : INITIAL_ARRIVALS;

      // Merge with transient session storage for sensitive identity data
      let transientMap: Record<string, CustomerIdentityVerification> = {};
      try {
        const sessionData = sessionStorage.getItem(STORAGE_KEYS.TRANSIENT_IDENTITY);
        if (sessionData) transientMap = JSON.parse(sessionData);
      } catch {
        // Session storage error ignored
      }

      const mergedWithSession = parsed.map((a) => {
        if (transientMap[a.bookingReference]) {
          return {
            ...a,
            identityVerification: transientMap[a.bookingReference],
          };
        }
        return a;
      });

      // Merge with any newly created bookings from CustomerContext
      const seeded = [...mergedWithSession];
      bookings.forEach((b) => {
        if (!seeded.some((a) => a.bookingReference === b.bookingReference)) {
          seeded.unshift({
            id: `ARR-${b.bookingReference.replace('HSW-', '')}`,
            bookingReference: b.bookingReference,
            customerId: 'usr-cust-01',
            customerName: 'Eleanor Vance',
            customerPhone: '+84 901 234 567',
            customerEmail: 'eleanor.vance@example.com',
            retreatSlug: b.retreatSlug,
            retreatName: b.retreatName,
            heroImage: b.heroImage,
            startDate: b.startDate,
            endDate: b.endDate,
            days: b.days,
            nights: b.nights,
            partySize: 1,
            expectedArrivalTime: '14:00',
            depositStatus: b.depositStatus === 'paid' ? 'paid' : 'pending',
            totalPrice: b.totalPrice,
            depositAmount: b.depositAmount,
            assignedVillaId: 'V-102',
            assignedVillaNumber: b.villaNumber || 'Villa #102',
            villaCategory: 'Lotus Pond Pool Sanctuary',
            villaReadiness: 'ready',
            arrivalStatus: b.status === 'in_stay' ? 'checked_in' : 'arrived',
            residenceDeclarationStatus: 'pending',
            specialRequests: b.specialRequests,
            arrivalNotes: b.arrivalNotes,
            wellnessProfileCompleted: true,
          });
        }
      });
      return seeded;
    } catch {
      return INITIAL_ARRIVALS;
    }
  });

  const [alerts, setAlerts] = useState<OperationalAlert[]>(INITIAL_OPERATIONAL_ALERTS);
  const todayDate = 'Thursday, 24 Sep 2026';

  // Synchronize villa inventory directly with backend REST API (SQL Server / DB)
  const refreshDbVillas = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:8080/api/v1/villas');
      if (res.ok) {
        const json = await res.json();
        const apiData = Array.isArray(json) ? json : json.data;
        if (Array.isArray(apiData) && apiData.length > 0) {
          const mapped: Villa[] = apiData.map((v: any) => {
            const num: string = v.villaNumber || `V${v.villaId}`;
            const code: string = num.replace(/^V/, '');
            let st: VillaStatus = 'ready';
            if (v.villaStatus === 'OCCUPIED') st = 'occupied';
            else if (v.villaStatus === 'NEEDS_CLEANING' || v.villaStatus === 'CLEANING') st = 'cleaning';
            else if (v.villaStatus === 'MAINTENANCE') st = 'maintenance';
            else if (v.villaStatus === 'RESERVED') st = 'reserved';

            let hk: HousekeepingStatus = 'clean';
            if (st === 'cleaning') hk = 'in_progress';
            else if (st === 'maintenance') hk = 'dirty';

            return {
              id: num,
              code: code,
              name: {
                vi: `${num} - ${v.villaCategory?.categoryName || 'Biệt Thự'}`,
                en: `${num} - ${v.villaCategory?.categoryName || 'Villa'}`,
                'zh-CN': `${num} - ${v.villaCategory?.categoryName || 'Villa'}`,
                ja: `${num} - ${v.villaCategory?.categoryName || 'Villa'}`,
                fr: `${num} - ${v.villaCategory?.categoryName || 'Villa'}`,
              },
              category: v.villaCategory?.categoryName || 'Garden Villa',
              capacity: v.maxOccupancy || 2,
              bedType: v.bedType || v.bedroomInfo || '1 King Bed',
              status: st,
              housekeeping: hk,
              currentBookingRef: st === 'occupied' ? `BK-2026-${code}8` : undefined,
              currentCustomerName: st === 'occupied' ? `Customer ${num}` : undefined,
              features: v.amenities ? v.amenities.split(',').map((s: string) => s.trim()) : [],
            };
          });
          setVillas(mapped);
        }
      }
    } catch {
      // Backend unavailable, fallback to existing local storage
    }
  }, []);

  useEffect(() => {
    refreshDbVillas();
  }, [refreshDbVillas]);

  // Persistence to localStorage: Villas operational state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.VILLAS, JSON.stringify(villas));
    } catch {
      // Storage error ignored
    }
  }, [villas]);

  // Persistence to localStorage: Operational state only.
  // Sensitive identity fields (ID number, DOB, permanent address) are NEVER written to localStorage.
  useEffect(() => {
    try {
      const sanitized = arrivals.map(sanitizeArrivalForLocalStorage);
      localStorage.setItem(STORAGE_KEYS.ARRIVALS, JSON.stringify(sanitized));
    } catch {
      // Storage error ignored
    }
  }, [arrivals]);

  const getVillaById = (id: string): Villa | undefined => {
    return villas.find((v) => v.id === id || v.code === id);
  };

  const getArrivalByBookingRef = (bookingRef: string): ArrivalRecord | undefined => {
    return arrivals.find((a) => a.bookingReference === bookingRef || a.id === bookingRef);
  };

  const assignVillaToBooking = (bookingRef: string, villaId: string): { success: boolean; message: string } => {
    const arrival = getArrivalByBookingRef(bookingRef);
    if (!arrival) {
      return { success: false, message: `Arrival record for ${bookingRef} not found.` };
    }

    const villa = getVillaById(villaId);
    if (!villa) {
      return { success: false, message: `Villa ${villaId} not found.` };
    }

    if (villa.status === 'maintenance') {
      return { success: false, message: `${villa.name.en} is currently undergoing maintenance and cannot be assigned.` };
    }

    if (villa.status === 'occupied' && villa.currentBookingRef !== bookingRef) {
      return { success: false, message: `${villa.name.en} is occupied by another customer.` };
    }

    if (villa.capacity < arrival.partySize) {
      return {
        success: false,
        message: `${villa.name.en} capacity (${villa.capacity}) is insufficient for party size (${arrival.partySize}).`,
      };
    }

    // Update Arrival
    const readiness: 'ready' | 'cleaning' | 'maintenance' =
      villa.status === 'cleaning' ? 'cleaning' : 'ready';

    setArrivals((prev) =>
      prev.map((a) => {
        if (a.bookingReference === bookingRef) {
          return {
            ...a,
            assignedVillaId: villa.id,
            assignedVillaNumber: `Villa #${villa.code}`,
            villaCategory: villa.category,
            villaReadiness: readiness,
          };
        }
        return a;
      })
    );

    // Update Villa Status to 'reserved' if it was 'ready'
    setVillas((prev) =>
      prev.map((v) => {
        if (v.id === villa.id) {
          return {
            ...v,
            status: v.status === 'cleaning' ? 'cleaning' : 'reserved',
            currentBookingRef: bookingRef,
            currentCustomerName: arrival.customerName,
          };
        }
        // If this booking previously had another villa assigned, release that villa
        if (v.id !== villa.id && v.currentBookingRef === bookingRef && v.status === 'reserved') {
          return {
            ...v,
            status: 'ready',
            currentBookingRef: undefined,
            currentCustomerName: undefined,
          };
        }
        return v;
      })
    );

    // Remove any unassigned_villa alert for this booking
    setAlerts((prev) => prev.filter((alt) => alt.bookingRef !== bookingRef));

    return {
      success: true,
      message: `${villa.name.en} successfully assigned to booking ${bookingRef}.`,
    };
  };

  const updateVillaStatus = (
    villaId: string,
    newStatus: VillaStatus,
    newHousekeeping?: HousekeepingStatus
  ): { success: boolean; message: string } => {
    const villa = getVillaById(villaId);
    if (!villa) {
      return { success: false, message: `Villa ${villaId} not found.` };
    }

    // Prevent direct transition from occupied to ready without cleaning
    if (villa.status === 'occupied' && newStatus === 'ready') {
      return {
        success: false,
        message: 'Occupied villa cannot transition directly to Ready. Please initiate Cleaning first.',
      };
    }

    const housekeepingState: HousekeepingStatus =
      newHousekeeping ||
      (newStatus === 'ready'
        ? 'inspected'
        : newStatus === 'cleaning'
          ? 'in_progress'
          : newStatus === 'maintenance'
            ? 'dirty'
            : villa.housekeeping);

    setVillas((prev) =>
      prev.map((v) => {
        if (v.id === villaId) {
          return {
            ...v,
            status: newStatus,
            housekeeping: housekeepingState,
            lastCleanedAt: newStatus === 'ready' ? new Date().toISOString() : v.lastCleanedAt,
          };
        }
        return v;
      })
    );

    // Synchronize any arrival assigned to this villa
    setArrivals((prev) =>
      prev.map((a) => {
        if (a.assignedVillaId === villaId) {
          return {
            ...a,
            villaReadiness:
              newStatus === 'ready'
                ? 'ready'
                : newStatus === 'cleaning'
                  ? 'cleaning'
                  : newStatus === 'maintenance'
                    ? 'maintenance'
                    : a.villaReadiness,
          };
        }
        return a;
      })
    );

    return {
      success: true,
      message: `Villa #${villa.code} status updated to ${newStatus}.`,
    };
  };

  const startCheckIn = (bookingRef: string) => {
    setArrivals((prev) =>
      prev.map((a) => {
        if (a.bookingReference === bookingRef && a.arrivalStatus === 'expected') {
          return { ...a, arrivalStatus: 'arrived', actualArrivalTime: '14:15' };
        }
        return a;
      })
    );
  };

  const saveCheckInDraft = (
    bookingRef: string,
    identityData: Partial<CustomerIdentityVerification>
  ) => {
    setArrivals((prev) =>
      prev.map((a) => {
        if (a.bookingReference === bookingRef) {
          const merged: CustomerIdentityVerification = {
            fullLegalName: identityData.fullLegalName || a.customerName,
            nationality: identityData.nationality || 'Vietnam',
            dateOfBirth: identityData.dateOfBirth || '',
            idType: identityData.idType || 'passport',
            idNumber: identityData.idNumber || '',
            issueDate: identityData.issueDate || '',
            expiryDate: identityData.expiryDate || '',
            permanentAddress: identityData.permanentAddress || '',
            residenceCountry: identityData.residenceCountry || 'Vietnam',
            arrivalTransport: identityData.arrivalTransport || 'Resort Shuttle',
            receptionistNotes: identityData.receptionistNotes || '',
            verifiedAt: new Date().toISOString(),
            verifiedBy: 'Receptionist Front Desk',
          };
          const isComplete = Boolean(merged.fullLegalName && merged.idNumber && merged.permanentAddress);

          // Save transient full identity to sessionStorage (session-scoped, not plain localStorage)
          try {
            const sessionData = sessionStorage.getItem(STORAGE_KEYS.TRANSIENT_IDENTITY);
            const map = sessionData ? JSON.parse(sessionData) : {};
            map[bookingRef] = merged;
            sessionStorage.setItem(STORAGE_KEYS.TRANSIENT_IDENTITY, JSON.stringify(map));
          } catch {
            // Session storage error ignored
          }

          return {
            ...a,
            identityVerification: merged,
            residenceDeclarationStatus: isComplete ? 'ready' : 'pending',
          };
        }
        return a;
      })
    );
  };

  const completeCheckIn = (
    bookingRef: string,
    identityData: CustomerIdentityVerification,
    villaId: string
  ): { success: boolean; message: string } => {
    const arrival = getArrivalByBookingRef(bookingRef);
    if (!arrival) {
      return { success: false, message: `Arrival record ${bookingRef} not found.` };
    }

    if (arrival.depositStatus !== 'paid') {
      return {
        success: false,
        message: 'Deposit payment must be satisfied prior to check-in completion.',
      };
    }

    const villa = getVillaById(villaId);
    if (!villa) {
      return { success: false, message: 'Please assign a valid villa before completing check-in.' };
    }

    if (villa.status === 'maintenance') {
      return { success: false, message: 'Assigned villa is under maintenance. Please reassign to an available villa.' };
    }

    if (villa.status === 'cleaning') {
      return { success: false, message: 'Assigned villa is still in cleaning status. Please confirm housekeeping readiness before final check-in.' };
    }

    // 1. Update Arrival
    const checkedInTime = new Date().toISOString();
    const verifiedRecord: CustomerIdentityVerification = {
      ...identityData,
      verifiedAt: checkedInTime,
      verifiedBy: 'Receptionist Front Desk',
    };

    // Save transient full identity to sessionStorage (session-scoped, not plain localStorage)
    try {
      const sessionData = sessionStorage.getItem(STORAGE_KEYS.TRANSIENT_IDENTITY);
      const map = sessionData ? JSON.parse(sessionData) : {};
      map[bookingRef] = verifiedRecord;
      sessionStorage.setItem(STORAGE_KEYS.TRANSIENT_IDENTITY, JSON.stringify(map));
    } catch {
      // Session storage error ignored
    }

    setArrivals((prev) =>
      prev.map((a) => {
        if (a.bookingReference === bookingRef) {
          return {
            ...a,
            arrivalStatus: 'checked_in',
            villaReadiness: 'ready',
            assignedVillaId: villa.id,
            assignedVillaNumber: `Villa #${villa.code}`,
            residenceDeclarationStatus: 'ready',
            identityVerification: verifiedRecord,
            checkedInAt: checkedInTime,
          };
        }
        return a;
      })
    );

    // 2. Update Villa
    setVillas((prev) =>
      prev.map((v) => {
        if (v.id === villa.id) {
          return {
            ...v,
            status: 'occupied',
            housekeeping: 'clean',
            currentBookingRef: bookingRef,
            currentCustomerName: arrival.customerName,
          };
        }
        return v;
      })
    );

    // 3. Clear relevant operational alerts
    setAlerts((prev) => prev.filter((alt) => alt.bookingRef !== bookingRef && alt.villaId !== villa.id));

    return {
      success: true,
      message: `Check-in completed successfully for ${arrival.customerName}. Villa #${villa.code} key issued.`,
    };
  };

  const submitDailyResidenceDeclarations = (): { count: number; message: string } => {
    let readyCount = 0;
    setArrivals((prev) =>
      prev.map((a) => {
        if (a.residenceDeclarationStatus === 'ready') {
          readyCount++;
          return { ...a, residenceDeclarationStatus: 'submitted' };
        }
        return a;
      })
    );

    return {
      count: readyCount,
      message: `Successfully compiled and submitted daily residence declarations for ${readyCount} checked-in customers to the local authority residency registry.`,
    };
  };

  const markResidenceDeclaration = (bookingRef: string, status: ResidenceDeclarationStatus) => {
    setArrivals((prev) =>
      prev.map((a) => {
        if (a.bookingReference === bookingRef) {
          return { ...a, residenceDeclarationStatus: status };
        }
        return a;
      })
    );
  };

  return (
    <OperationsContext.Provider
      value={{
        villas,
        arrivals,
        todayDate,
        alerts,
        getVillaById,
        getArrivalByBookingRef,
        assignVillaToBooking,
        updateVillaStatus,
        startCheckIn,
        saveCheckInDraft,
        completeCheckIn,
        submitDailyResidenceDeclarations,
        markResidenceDeclaration,
        refreshDbVillas,
      }}
    >
      {children}
    </OperationsContext.Provider>
  );
};

export const useOperations = (): OperationsContextType => {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within an OperationsProvider');
  }
  return context;
};
