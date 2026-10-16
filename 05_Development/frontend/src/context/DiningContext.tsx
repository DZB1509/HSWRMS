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
    
    setMealSelections(prev => {
      // Remove existing selection for same date/period if any
      const filtered = prev.filter(s => 
        !(s.bookingId === selection.bookingId && s.date === selection.date && s.mealPeriod === selection.mealPeriod)
      );
      return [...filtered, newSelection];
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
    setAlaCarteOrders(prev => [...prev, newOrder]);

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
      specialNotes: order.location ? `Delivery villa/seat: ${order.location}` : undefined,
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
        customerName: profile.fullName,
        bookingReference: 'HSW-88192',
        villaNumber: profile.assignedVilla,
        allergies: wellnessProfile.dietaryProfile.allergies || [],
        dietaryRestrictions: wellnessProfile.dietaryProfile.dietaryRestrictions || [],
      };
    }
    
    return {
      customerId,
      customerName: 'Eleanor Vance',
      bookingReference: 'HSW-88192',
      villaNumber: '102',
      allergies: [],
      dietaryRestrictions: ['Vegetarian'],
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

    // Try synchronizing with backend
    const numericId = parseInt(id.replace(/\D/g, ''), 10);
    if (!isNaN(numericId) && numericId > 0) {
      fnbApi.updateOrderStatus(numericId, status.toUpperCase()).catch(() => {
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
            menuItemId: String(line.menuItemId),
            quantity: line.quantity,
            notes: undefined,
          })),
          customerNotes: ko.specialNotes || undefined,
          dietaryNotes: [...(ko.allergyTags || []), ...(ko.dietaryPreferences || [])],
          status: (ko.status?.toLowerCase() as FnbFulfillmentStatus) || 'pending',
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

    // 1. If backend orders exist for this date, include them first
    liveKitchenOrders.filter(ko => ko.date === date).forEach(ko => {
      seenIds.add(ko.id);
      prepList.push(ko);
    });
    
    // 2. Retreat Meals
    mealSelections.filter(s => s.date === date && !seenIds.has(s.id)).forEach(s => {
      seenIds.add(s.id);
      const projection = getDietaryProjection(s.customerId);
      prepList.push({
        id: s.id,
        type: 'retreat_meal',
        date: s.date,
        mealPeriod: s.mealPeriod,
        customerName: projection.customerName,
        villaNumber: projection.villaNumber,
        items: s.menuItemIds.map(itemId => ({
          menuItemId: itemId,
          quantity: 1,
          notes: s.notes,
        })),
        customerNotes: s.notes,
        dietaryNotes: [...projection.allergies, ...projection.dietaryRestrictions],
        status: s.status,
      });
    });

    // 3. Ala Carte Orders
    alaCarteOrders.filter(o => (o.createdAt.startsWith(date) || o.status !== 'delivered') && !seenIds.has(o.id)).forEach(o => {
      seenIds.add(o.id);
      const projection = getDietaryProjection(o.customerId);
      prepList.push({
        id: o.id,
        type: 'a_la_carte',
        date: o.createdAt.split('T')[0],
        targetTime: o.targetTime,
        customerName: projection.customerName,
        villaNumber: o.location || projection.villaNumber,
        items: o.lines.map(line => ({
          menuItemId: line.menuItemId,
          quantity: line.quantity,
          notes: line.notes,
        })),
        customerNotes: o.lines.map(l => l.notes).filter(Boolean).join(' | '),
        dietaryNotes: [...projection.allergies, ...projection.dietaryRestrictions],
        status: o.status,
      });
    });

    return prepList;
  };

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
    syncStatus,
    fetchKitchenOrders,
    refreshMenu,
  }), [menuItems, mealSelections, alaCarteOrders, liveKitchenOrders, syncStatus, fetchKitchenOrders, refreshMenu]);

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

