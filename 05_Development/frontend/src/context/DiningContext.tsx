import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import type { 
  DiningContextType, 
  DietaryMenuItem, 
  DailyMealSelection, 
  AlaCarteOrder, 
  MealPeriod,
  FnbFulfillmentStatus,
  MealPrepEntry,
  FnbDietaryProjection
} from '../types/dining';
import { 
  MOCK_MENU_ITEMS, 
  MOCK_MEAL_SELECTIONS, 
  MOCK_ALA_CARTE_ORDERS 
} from '../data/mockDining';
import { useCustomer } from './CustomerContext';
import { fnbApi } from '../features/m4-fnb/api/fnbApi';

const DiningContext = createContext<DiningContextType | undefined>(undefined);

export const DiningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<DietaryMenuItem[]>(MOCK_MENU_ITEMS);
  const [mealSelections, setMealSelections] = useState<DailyMealSelection[]>(MOCK_MEAL_SELECTIONS);
  const [alaCarteOrders, setAlaCarteOrders] = useState<AlaCarteOrder[]>(MOCK_ALA_CARTE_ORDERS);
  const [liveKitchenOrders, setLiveKitchenOrders] = useState<MealPrepEntry[]>([]);
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');

  const { profile, wellnessProfile } = useCustomer();

  // Try fetching live catalog on initial mount
  const refreshMenu = useCallback(async (asOfDate?: string) => {
    try {
      const backendMenu = await fnbApi.getMenu(asOfDate);
      if (backendMenu && backendMenu.length > 0) {
        // Enrich existing mock items with backend pricing, availability & allergen warning flags
        setMenuItems(prev => {
          return prev.map(mockItem => {
            const match = backendMenu.find(bm => bm.id === Number(mockItem.id) || bm.itemName.toLowerCase() === mockItem.name.en.toLowerCase());
            if (match) {
              return {
                ...mockItem,
                price: match.price !== undefined ? match.price : mockItem.price,
                available: match.available !== undefined ? match.available : true,
                availableServings: match.servingsAvailable,
                // keep rich localized structure intact
              };
            }
            return mockItem;
          });
        });
      }
    } catch {
      // Backend offline or in mock prototype mode: keep default curated menu
    }
  }, []);

  useEffect(() => {
    refreshMenu();
  }, [refreshMenu]);

  const getMenuItemsByPeriod = (period: MealPeriod) => {
    return menuItems.filter(m => m.mealPeriods.includes(period) || m.mealPeriods.includes('all_day'));
  };

  const saveMealSelection = (selection: Omit<DailyMealSelection, 'id' | 'status'>) => {
    const tempId = `MS-${Date.now()}`;
    const newSelection: DailyMealSelection = {
      ...selection,
      id: tempId,
      status: 'pending',
    };
    
    setRecentOrderIds(prev => [tempId, ...prev.filter(id => id !== tempId)]);
    setMealSelections(prev => {
      // Remove existing selection for same date/period if any
      const filtered = prev.filter(s => 
        !(s.bookingId === selection.bookingId && s.date === selection.date && s.mealPeriod === selection.mealPeriod)
      );
      // Ensure the latest order appears at the top of the list
      return [newSelection, ...filtered];
    });

    // Asynchronously synchronize with backend Spring Boot API
    const numericBookingId = parseInt(String(selection.bookingId).replace(/\D/g, '') || '1', 10);
    const parsedItems = (selection.items && selection.items.length > 0)
      ? selection.items.map(it => ({
          menuItemId: parseInt(String(it.menuItemId).replace(/\D/g, '') || '1', 10),
          quantity: it.quantity || selection.quantity || 1,
        }))
      : selection.menuItemIds.map(mId => ({
          menuItemId: parseInt(String(mId).replace(/\D/g, '') || '1', 10),
          quantity: selection.quantity || 1,
        }));

    fnbApi.placeDailyMealOrder({
      bookingId: numericBookingId,
      orderDate: selection.date,
      mealType: selection.mealPeriod.toUpperCase(),
      specialNotes: selection.notes || undefined,
      items: parsedItems,
    }).then((res) => {
      if (res && res.id) {
        setRecentOrderIds(prev => [String(res.id), ...prev]);
        setMealSelections(prev => prev.map(s => s.id === tempId ? {
          ...s,
          id: String(res.id),
          status: (res.status?.toLowerCase() as FnbFulfillmentStatus) || 'pending',
        } : s));
      }
    }).catch(() => {
      // Retain optimistic local state when in standalone demo mode
    });
  };

  const getMealSelection = (bookingId: string, date: string, period: MealPeriod) => {
    return mealSelections.find(s => s.bookingId === bookingId && s.date === date && s.mealPeriod === period);
  };

  const createAlaCarteOrder = (order: Omit<AlaCarteOrder, 'id' | 'createdAt' | 'status' | 'chargeType' | 'folioPostingStatus'>) => {
    const tempId = `ORD-${Date.now()}`;
    const newOrder: AlaCarteOrder = {
      ...order,
      id: tempId,
      createdAt: new Date().toISOString(),
      status: 'pending',
      chargeType: 'fnb_extra',
      folioPostingStatus: 'pending_checkout_folio',
    };
    setRecentOrderIds(prev => [tempId, ...prev.filter(id => id !== tempId)]);
    setAlaCarteOrders(prev => [newOrder, ...prev]);

    // Asynchronously synchronize with backend Spring Boot API
    const numericBookingId = parseInt(String(order.bookingId).replace(/\D/g, '') || '1', 10);
    const parsedItems = order.lines.map(line => ({
      menuItemId: parseInt(String(line.menuItemId).replace(/\D/g, '') || '1', 10),
      quantity: line.quantity,
    }));

    fnbApi.placeAlaCarteOrder({
      bookingId: numericBookingId,
      orderDate: new Date().toISOString().split('T')[0],
      mealType: 'DINNER',
      specialNotes: order.lines.map(l => l.notes).filter(Boolean)[0] || (order.location ? `[${order.location}]` : undefined),
      items: parsedItems,
    }).then((res) => {

      if (res && res.id) {
        setAlaCarteOrders(prev => prev.map(o => o.id === tempId ? {
          ...o,
          id: String(res.id),
          status: (res.status?.toLowerCase() as FnbFulfillmentStatus) || 'pending',
        } : o));
      }
    }).catch(() => {
      // Retain optimistic local state when in standalone demo mode
    });

    return newOrder;
  };

  const getDietaryProjection = (customerId: string): FnbDietaryProjection => {
    if (profile && profile.id === customerId && wellnessProfile) {
      return {
        customerId,
        customerName: profile.fullName || 'Eleanor Vance',
        bookingReference: 'HSW-88192',
        villaNumber: profile.assignedVilla || 'Villa #102 (Tranquil Garden)',
        allergies: wellnessProfile.dietaryProfile?.allergies || ['Crustaceans & Shellfish', 'Peanuts'],
        dietaryRestrictions: wellnessProfile.dietaryProfile?.dietaryRestrictions || ['Vegetarian', 'Gluten-Conscious'],
      };
    }
    
    return {
      customerId,
      customerName: 'Eleanor Vance',
      bookingReference: 'HSW-88192',
      villaNumber: 'Villa #102 (Tranquil Garden)',
      allergies: ['Crustaceans & Shellfish', 'Peanuts'],
      dietaryRestrictions: ['Vegetarian', 'Gluten-Conscious'],
    };
  };

  const updateMealSelectionStatus = (id: string, status: FnbFulfillmentStatus) => {
    setMealSelections(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const updateAlaCarteOrderStatus = (id: string, status: FnbFulfillmentStatus) => {
    setAlaCarteOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const updateFulfillmentStatus = (id: string, type: 'retreat_meal' | 'a_la_carte', status: FnbFulfillmentStatus) => {
    if (type === 'retreat_meal') {
      updateMealSelectionStatus(id, status);
    } else {
      updateAlaCarteOrderStatus(id, status);
    }

    // Also update live kitchen prep state
    setLiveKitchenOrders(prev => prev.map(item => item.id === id ? { ...item, status } : item));

    // Synchronize with backend and capture real inventory consumption outcome
    const numericId = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(numericId) && numericId > 0) {
      fnbApi.updateOrderStatus(numericId, status.toUpperCase())
        .then((updatedKo) => {
          if (updatedKo) {
            setLiveKitchenOrders(prev => prev.map(item => {
              if (item.id === id) {
                return {
                  ...item,
                  status: (updatedKo.status?.toLowerCase() as FnbFulfillmentStatus) || status,
                  inventoryStatus: updatedKo.inventoryStatus,
                  items: item.items.map((it, idx) => {
                    const matchedLine = updatedKo.lines?.[idx] || updatedKo.lines?.find(l => String(l.menuItemId) === it.menuItemId);
                    return {
                      ...it,
                      orderLineId: matchedLine?.orderLineId || matchedLine?.id,
                      preparationStatus: matchedLine?.preparationStatus,
                      inventoryStatus: matchedLine?.inventoryStatus,
                      inventoryMessage: matchedLine?.inventoryMessage,
                    };
                  }),
                };
              }
              return item;
            }));
          }
        })
        .catch(() => {
          // Backend offline / mock fallback
        });
    }
  };

  const fetchKitchenOrders = useCallback(async (date: string): Promise<MealPrepEntry[]> => {
    setSyncStatus('syncing');
    try {
      const orders = await fnbApi.getKitchenOrders(date);
      if (orders && Array.isArray(orders) && orders.length > 0) {
        const mapped: MealPrepEntry[] = orders.map((ko) => ({
          id: String(ko.id),
          type: ko.orderType === 'A_LA_CARTE' ? 'a_la_carte' : 'retreat_meal',
          date: ko.orderDate || date,
          targetTime: ko.mealType ? ko.mealType.toLowerCase() : undefined,
          mealPeriod: (ko.mealType ? ko.mealType.toLowerCase() : 'lunch') as MealPeriod,
          customerName: ko.customerFirstName ? `${ko.customerFirstName} (Villa ${ko.villaNumber})` : 'Resort Guest',
          villaNumber: ko.villaNumber,
          items: (ko.lines || []).map((line) => ({
            orderLineId: line.orderLineId || line.id,
            menuItemId: String(line.menuItemId),
            quantity: line.quantity,
            notes: undefined,
            preparationStatus: line.preparationStatus,
            inventoryStatus: line.inventoryStatus,
            inventoryMessage: line.inventoryMessage,
          })),
          customerNotes: ko.specialNotes || undefined,
          dietaryNotes: [...(ko.allergyTags || []), ...(ko.dietaryPreferences || [])],
          dietaryVerificationStatus: (ko.dietaryVerificationStatus as any) || 'UNVERIFIED',
          locationVerificationStatus: (ko.locationVerificationStatus as any) || 'VERIFIED_VILLA',
          folioPostingStatus: (ko.folioPostingStatus as any) || (ko.orderType === 'A_LA_CARTE' ? 'PENDING_RECONCILIATION' : 'NOT_APPLICABLE'),
          status: (ko.status?.toLowerCase() as FnbFulfillmentStatus) || 'pending',
          inventoryStatus: ko.inventoryStatus || 'PENDING',
        }));
        setLiveKitchenOrders(mapped);
        setSyncStatus('synced');
        return mapped;
      }
      setSyncStatus('synced');
      return [];
    } catch {
      setSyncStatus('offline');
      return [];
    }
  }, []);

  const getDailyPrepList = (date: string): MealPrepEntry[] => {
    const prepList: MealPrepEntry[] = [];
    const seenIds = new Set<string>();

    // 0. Top priority: Any recent order created in this session by customer appears at the very top
    recentOrderIds.forEach(recentId => {
      // Check liveKitchenOrders
      const ko = liveKitchenOrders.find(o => o.id === recentId);
      if (ko && !seenIds.has(ko.id)) {
        seenIds.add(ko.id);
        prepList.push(ko);
        return;
      }

      // Check mealSelections
      const sel = mealSelections.find(s => s.id === recentId);
      if (sel && !seenIds.has(sel.id)) {
        seenIds.add(sel.id);
        const projection = getDietaryProjection(sel.customerId);
        const itemsList = (sel.items && sel.items.length > 0)
          ? sel.items.map(it => ({
              menuItemId: it.menuItemId,
              quantity: it.quantity || sel.quantity || 1,
              notes: it.notes || sel.notes,
            }))
          : sel.menuItemIds.map(itemId => ({
              menuItemId: itemId,
              quantity: sel.quantity || 1,
              notes: sel.notes,
            }));

        prepList.push({
          id: sel.id,
          type: 'retreat_meal',
          date: sel.date,
          mealPeriod: sel.mealPeriod,
          targetTime: sel.mealPeriod,
          customerName: projection.customerName || 'Eleanor Vance',
          villaNumber: projection.villaNumber || 'Villa #102 (Tranquil Garden)',
          items: itemsList,
          customerNotes: sel.notes,
          dietaryNotes: [...(projection.allergies || []), ...(projection.dietaryRestrictions || [])],
          status: sel.status,
        });
        return;
      }

      // Check alaCarteOrders
      const ala = alaCarteOrders.find(o => o.id === recentId);
      if (ala && !seenIds.has(ala.id)) {
        seenIds.add(ala.id);
        const projection = getDietaryProjection(ala.customerId);
        prepList.push({
          id: ala.id,
          type: 'a_la_carte',
          date: ala.createdAt.split('T')[0],
          targetTime: ala.targetTime,
          customerName: projection.customerName || 'Eleanor Vance',
          villaNumber: ala.location || projection.villaNumber || 'Villa #102 (Tranquil Garden)',
          items: ala.lines.map(line => ({
            menuItemId: line.menuItemId,
            quantity: line.quantity,
            notes: line.notes,
          })),
          customerNotes: ala.lines.map(l => l.notes).filter(Boolean).join(' | '),
          dietaryNotes: [...(projection.allergies || []), ...(projection.dietaryRestrictions || [])],
          status: ala.status,
        });
      }
    });

    // 1. If backend orders exist for this date, include them next
    liveKitchenOrders.filter(ko => ko.date === date && !seenIds.has(ko.id)).forEach(ko => {
      seenIds.add(ko.id);
      prepList.push(ko);
    });
    
    // 2. Retreat Meals for this date
    mealSelections.filter(s => s.date === date && !seenIds.has(s.id)).forEach(s => {
      seenIds.add(s.id);
      const projection = getDietaryProjection(s.customerId);
      const itemsList = (s.items && s.items.length > 0)
        ? s.items.map(it => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity || s.quantity || 1,
            notes: it.notes || s.notes,
          }))
        : s.menuItemIds.map(itemId => ({
            menuItemId: itemId,
            quantity: s.quantity || 1,
            notes: s.notes,
          }));

      prepList.push({
        id: s.id,
        type: 'retreat_meal',
        date: s.date,
        mealPeriod: s.mealPeriod,
        targetTime: s.mealPeriod,
        customerName: projection.customerName || 'Eleanor Vance',
        villaNumber: projection.villaNumber || 'Villa #102 (Tranquil Garden)',
        items: itemsList,
        customerNotes: s.notes,
        dietaryNotes: [...(projection.allergies || []), ...(projection.dietaryRestrictions || [])],
        status: s.status,
      });
    });

    // 3. Ala Carte Orders for this date
    alaCarteOrders.filter(o => (o.createdAt.startsWith(date) || o.status !== 'delivered') && !seenIds.has(o.id)).forEach(o => {
      seenIds.add(o.id);
      const projection = getDietaryProjection(o.customerId);
      prepList.push({
        id: o.id,
        type: 'a_la_carte',
        date: o.createdAt.split('T')[0],
        targetTime: o.targetTime,
        customerName: projection.customerName || 'Eleanor Vance',
        villaNumber: o.location || projection.villaNumber || 'Villa #102 (Tranquil Garden)',
        items: o.lines.map(line => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          notes: line.notes,
        })),
        customerNotes: o.lines.map(l => l.notes).filter(Boolean).join(' | '),
        dietaryNotes: [...(projection.allergies || []), ...(projection.dietaryRestrictions || [])],
        status: o.status,
      });
    });

    return prepList;
  };

  const getOrderById = useCallback((orderId: string): MealPrepEntry | undefined => {
    if (!orderId) return undefined;
    const cleanId = orderId.trim();
    const numericPart = cleanId.replace(/\D/g, '');

    // 1. Search in live kitchen orders
    const liveMatch = liveKitchenOrders.find(ko => 
      ko.id === cleanId || 
      (numericPart && ko.id.replace(/\D/g, '') === numericPart)
    );
    if (liveMatch) return liveMatch;

    // 2. Search in meal selections (both user-submitted and mock) across all dates
    const selMatch = mealSelections.find(s => 
      s.id === cleanId || 
      (numericPart && s.id.replace(/\D/g, '') === numericPart) ||
      `MS-${s.id}` === cleanId ||
      s.id === `MS-${cleanId}`
    );
    if (selMatch) {
      const projection = getDietaryProjection(selMatch.customerId);
      const itemsList = (selMatch.items && selMatch.items.length > 0)
        ? selMatch.items.map(it => ({
            menuItemId: it.menuItemId,
            quantity: it.quantity || selMatch.quantity || 1,
            notes: it.notes || selMatch.notes,
          }))
        : selMatch.menuItemIds.map(itemId => ({
            menuItemId: itemId,
            quantity: selMatch.quantity || 1,
            notes: selMatch.notes,
          }));

      return {
        id: selMatch.id,
        type: 'retreat_meal',
        date: selMatch.date,
        mealPeriod: selMatch.mealPeriod,
        targetTime: selMatch.mealPeriod,
        customerName: projection.customerName || 'Eleanor Vance',
        villaNumber: projection.villaNumber || 'Villa #102 (Tranquil Garden)',
        items: itemsList,
        customerNotes: selMatch.notes,
        dietaryNotes: [...(projection.allergies || []), ...(projection.dietaryRestrictions || [])],
        status: selMatch.status || 'pending',
      };
    }

    // 3. Search in ala carte orders across all dates
    const alaMatch = alaCarteOrders.find(o => 
      o.id === cleanId || 
      (numericPart && o.id.replace(/\D/g, '') === numericPart) ||
      `ORD-${o.id}` === cleanId ||
      o.id === `ORD-${cleanId}`
    );
    if (alaMatch) {
      const projection = getDietaryProjection(alaMatch.customerId);
      return {
        id: alaMatch.id,
        type: 'a_la_carte',
        date: alaMatch.createdAt.split('T')[0],
        targetTime: alaMatch.targetTime || '19:00',
        customerName: projection.customerName || 'Eleanor Vance',
        villaNumber: alaMatch.location || projection.villaNumber || 'Villa #102 (Tranquil Garden)',
        items: alaMatch.lines.map(line => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          notes: line.notes,
        })),
        customerNotes: alaMatch.lines.map(l => l.notes).filter(Boolean).join(' | '),
        dietaryNotes: [...(projection.allergies || []), ...(projection.dietaryRestrictions || [])],
        status: alaMatch.status || 'pending',
      };
    }

    return undefined;
  }, [liveKitchenOrders, mealSelections, alaCarteOrders, getDietaryProjection]);

  const value = useMemo(() => ({
    menuItems,
    getMenuItemsByPeriod,
    mealSelections,
    saveMealSelection,
    getMealSelection,
    alaCarteOrders,
    createAlaCarteOrder,
    getDietaryProjection,
    updateMealSelectionStatus,
    updateAlaCarteOrderStatus,
    updateFulfillmentStatus,
    getDailyPrepList,
    getOrderById,
    syncStatus,
    fetchKitchenOrders,
    refreshMenu,
  }), [menuItems, mealSelections, alaCarteOrders, liveKitchenOrders, syncStatus, fetchKitchenOrders, refreshMenu, getOrderById]);

  return (
    <DiningContext.Provider value={value}>
      {children}
    </DiningContext.Provider>
  );
};

export const useDining = () => {
  const context = useContext(DiningContext);
  if (!context) {
    throw new Error('useDining must be used within a DiningProvider');
  }
  return context;
};

