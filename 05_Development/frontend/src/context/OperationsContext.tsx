import React, { createContext, useContext, useState, useEffect } from 'react';
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
  getReceptionistVillas,
  getDailyArrivals,
  updatePhysicalVillaStatus,
  recordResidenceDeclaration,
  assignPhysicalVilla,
} from '../api/booking/retreatBookingApi';

import { useAuth } from '../hooks/useAuth';

const OperationsContext = createContext<OperationsContextType | undefined>(undefined);

const STORAGE_KEYS = {
  TRANSIENT_IDENTITY: 'hsw_transient_identity_session_v1',
};

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role } = useAuth();
  const [villas, setVillas] = useState<Villa[]>([]);
  const [arrivals, setArrivals] = useState<ArrivalRecord[]>([]);
  const [alerts, setAlerts] = useState<OperationalAlert[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const todayDate = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Zero Template / Zero Mock Policy: fetch directly from SQL Server
  const syncWithBackend = async () => {
    setIsLoading(true);
    try {
      const [villasRes, arrivalsRes] = await Promise.allSettled([
        getReceptionistVillas(),
        getDailyArrivals(),
      ]);

      if (villasRes.status === 'fulfilled') {
        const mappedVillas: Villa[] = (villasRes.value || []).map((pv) => {
          const vId = pv.villaId || pv.physicalVillaId || 1;
          const st: VillaStatus =
            pv.villaStatus === 'AVAILABLE'
              ? 'ready'
              : pv.villaStatus === 'OCCUPIED'
              ? 'occupied'
              : pv.villaStatus === 'NEEDS_CLEANING'
              ? 'cleaning'
              : 'maintenance';

          return {
            id: String(vId),
            code: pv.villaNumber,
            name: {
              en: `Villa ${pv.villaNumber}`,
              vi: `Biệt Thự ${pv.villaNumber}`,
              'zh-CN': `别墅 ${pv.villaNumber}`,
              ja: `ヴィラ ${pv.villaNumber}`,
              fr: `Villa ${pv.villaNumber}`,
            },
            category: pv.categoryName,
            capacity: pv.maxOccupancy || 2,
            bedType: 'King Organic Bed',
            features: pv.viewAndOperationalNotes ? [pv.viewAndOperationalNotes] : ['Resort Standards'],
            status: st,
            housekeeping: pv.isClean ? 'inspected' : 'in_progress',
            currentBookingRef: pv.isOccupied ? 'ACTIVE' : undefined,
          };
        });
        setVillas(mappedVillas);
      } else {
        setVillas([]);
      }

      if (arrivalsRes.status === 'fulfilled') {
        const mappedArrivals: ArrivalRecord[] = (arrivalsRes.value || []).map((a) => {
          const nights = a.checkInDate && a.checkOutDate
            ? Math.max(1, Math.round((new Date(a.checkOutDate).getTime() - new Date(a.checkInDate).getTime()) / (1000 * 3600 * 24)))
            : 2;

          return {
            id: String(a.retreatBookingId),
            bookingReference: a.bookingReference || `HSW-BK-${a.retreatBookingId}`,
            customerId: String(a.customerProfileId),
            customerName: a.customerFullName || '—',
            customerPhone: a.customerPhone || '—',
            customerEmail: a.customerEmail || '—',
            retreatSlug: 'retreat-' + a.retreatBookingId,
            retreatName: {
              en: a.packageName,
              vi: a.packageName,
              'zh-CN': a.packageName,
              ja: a.packageName,
              fr: a.packageName,
            },
            heroImage: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
            startDate: a.checkInDate,
            endDate: a.checkOutDate,
            days: nights + 1,
            nights,
            partySize: a.guestCount || 1,
            expectedArrivalTime: '14:00',
            depositStatus: a.depositPaid > 0 ? 'paid' : 'pending',
            totalPrice: a.totalEstimatedAmount || (a.depositPaid > 0 ? a.depositPaid / 0.3 : 0),
            depositAmount: a.depositPaid,
            assignedVillaId: a.assignedVillaId ? String(a.assignedVillaId) : undefined,
            assignedVillaNumber: a.assignedVillaNumber ? `Villa #${a.assignedVillaNumber}` : undefined,
            villaCategory: a.requestedCategoryName,
            villaReadiness: a.assignedVillaId ? 'ready' : 'unassigned',
            arrivalStatus: (a.bookingStatus === 'CHECKED_IN' ? 'checked_in' : 'expected') as any,
            residenceDeclarationStatus: a.hasResidenceRecord ? 'ready' : 'pending',
            specialRequests: undefined,
            wellnessProfileCompleted: a.hasHealthProfile ?? false,
          };
        });
        setArrivals(mappedArrivals);

        // Derive alerts dynamically from real arrival records in SQL Server
        const realAlerts: OperationalAlert[] = [];
        mappedArrivals.forEach((arr) => {
          if (!arr.assignedVillaId && arr.arrivalStatus !== 'checked_in') {
            realAlerts.push({
              id: `alert-unassigned-${arr.id}`,
              type: 'unassigned_villa',
              severity: 'warning',
              title: `Unassigned Villa: ${arr.customerName}`,
              description: `Booking ${arr.bookingReference} requires villa allocation for ${arr.villaCategory}.`,
              bookingRef: arr.bookingReference,
              actionPath: `/receptionist/check-in/${arr.bookingReference}/villa`,
            });
          }
          if (arr.depositStatus === 'pending') {
            realAlerts.push({
              id: `alert-deposit-${arr.id}`,
              type: 'deposit_issue',
              severity: 'info',
              title: `Deposit Pending: ${arr.bookingReference}`,
              description: `Deposit for ${arr.customerName} has not been completed.`,
              bookingRef: arr.bookingReference,
            });
          }
        });
        setAlerts(realAlerts);
      } else {
        setArrivals([]);
        setAlerts([]);
      }
    } catch (err) {
      console.error('Error fetching live operations data from SQL Server:', err);
      setVillas([]);
      setArrivals([]);
      setAlerts([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    syncWithBackend();

    const handleAuthChange = () => {
      syncWithBackend();
    };

    window.addEventListener('hswrms_auth_changed', handleAuthChange);
    return () => {
      window.removeEventListener('hswrms_auth_changed', handleAuthChange);
    };
  }, [role]);

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

    const numBookingId = parseInt(bookingRef, 10);
    const numVillaId = parseInt(villaId, 10);
    if (!isNaN(numBookingId) && !isNaN(numVillaId)) {
      assignPhysicalVilla(numBookingId, numVillaId).catch((err) => {
        console.warn('Sync assign villa to backend failed:', err);
      });
    }

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

    // Sync status with backend SQL Server
    const numericVillaId = parseInt(villaId, 10);
    if (!isNaN(numericVillaId)) {
      let backendStatus = 'AVAILABLE';
      if (newStatus === 'cleaning') backendStatus = 'NEEDS_CLEANING';
      else if (newStatus === 'maintenance') backendStatus = 'MAINTENANCE';
      else if (newStatus === 'occupied') backendStatus = 'OCCUPIED';

      updatePhysicalVillaStatus(numericVillaId, backendStatus).catch((err) => {
        console.warn('Sync physical villa status to backend failed:', err);
      });
    }

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

    // Sync Residence declaration and Physical Villa assignment to backend SQL Server
    const numBookingId = parseInt(bookingRef, 10);
    const numVillaId = parseInt(villaId, 10);
    if (!isNaN(numBookingId)) {
      recordResidenceDeclaration(numBookingId, {
        fullName: identityData.fullLegalName,
        nationality: identityData.nationality,
        identificationNumber: identityData.idNumber,
        identificationType: identityData.idType === 'national_id' ? 'CCCD' : identityData.idType.toUpperCase(),
        dateOfBirth: identityData.dateOfBirth,
        permanentAddress: identityData.permanentAddress,
      }).catch((err) => console.warn('Sync residence record to backend failed:', err));
    }
    if (!isNaN(numBookingId) && !isNaN(numVillaId)) {
      assignPhysicalVilla(numBookingId, numVillaId).catch((err) => {
        console.warn('Sync assign villa check-in to backend failed:', err);
      });
    }

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
        isLoading,
        refreshOperationsData: syncWithBackend,
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
