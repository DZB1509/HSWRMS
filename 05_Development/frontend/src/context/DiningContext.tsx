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
import { fnbApi, type MenuItemBackendDto, type MealPrepEntryBackendDto } from '../features/m4-fnb/api/fnbApi';

const DiningContext = createContext<DiningContextType | undefined>(undefined);

// Helper to map backend MenuItem entity to frontend DietaryMenuItem
function mapBackendMenuItem(item: MenuItemBackendDto): DietaryMenuItem {
  const mealPeriods: MealPeriod[] = [];
  if (item.mealType) {
    const types = item.mealType.toLowerCase().split(',');
    for (const t of types) {
      const trimmed = t.trim();
      if (trimmed === 'breakfast' || trimmed === 'lunch' || trimmed === 'dinner' || trimmed === 'all_day') {
        mealPeriods.push(trimmed as MealPeriod);
      }
    }
  }
  if (mealPeriods.length === 0) {
    mealPeriods.push('all_day');
  }

  const dietaryTags: DietaryMenuItem['dietaryTags'] = [];
  if (item.dietaryTags) {
    const tags = item.dietaryTags.toLowerCase().split(',');
    for (const tag of tags) {
      const trimmed = tag.trim() as any;
      if (trimmed) dietaryTags.push(trimmed);
    }
  }

  const allergenTags: DietaryMenuItem['allergenTags'] = [];
  if (item.allergenInformation) {
    const allergens = item.allergenInformation.toLowerCase().split(',');
    for (const a of allergens) {
      const trimmed = a.trim() as any;
      if (trimmed) allergenTags.push(trimmed);
    }
  }

  return {
    id: String(item.menuItemId),
    name: {
      en: item.itemName,
      vi: item.itemName,
      'zh-CN': item.itemName,
      ja: item.itemName,
      fr: item.itemName,
    },
    description: {
      en: `${item.itemName} (${item.category})`,
      vi: `${item.itemName} (${item.category})`,
      'zh-CN': `${item.itemName} (${item.category})`,
      ja: `${item.itemName} (${item.category})`,
      fr: `${item.itemName} (${item.category})`,
    },
    image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&q=80&w=600',
    category: (item.category?.toLowerCase() as any) || 'main',
    mealPeriods,
    dietaryTags,
    allergenTags,
    price: item.price ? Number(item.price) : undefined,
    isExtra: item.price !== undefined && Number(item.price) > 0,
    calories: 350,
  };
}

// Helper to map backend MealPrepEntry to frontend MealPrepEntry
function mapBackendPrepEntry(dto: MealPrepEntryBackendDto): MealPrepEntry {
  return {
    id: dto.id,
    type: dto.type,
    date: dto.date,
    targetTime: dto.targetTime,
    mealPeriod: dto.mealPeriod ? (dto.mealPeriod.toLowerCase() as MealPeriod) : undefined,
    customerName: dto.customerName || 'Resort Guest',
    villaNumber: dto.villaNumber || '—',
    items: (dto.items || []).map((i) => ({
      menuItemId: String(i.menuItemId),
      quantity: i.quantity || 1,
      notes: i.notes,
    })),
    customerNotes: dto.customerNotes,
    dietaryNotes: dto.dietaryNotes || [],
    status: (dto.status?.toLowerCase() as FnbFulfillmentStatus) || 'pending',
  };
}

function extractNumericId(id: string): number | null {
  const digits = id.replace(/\D/g, '');
  if (digits) {
    const parsed = parseInt(digits, 10);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

export const DiningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<DietaryMenuItem[]>(MOCK_MENU_ITEMS);
  const [mealSelections, setMealSelections] = useState<DailyMealSelection[]>(MOCK_MEAL_SELECTIONS);
  const [alaCarteOrders, setAlaCarteOrders] = useState<AlaCarteOrder[]>(MOCK_ALA_CARTE_ORDERS);
  const [kdsRemoteQueue, setKdsRemoteQueue] = useState<MealPrepEntry[]>([]);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { profile, wellnessProfile } = useCustomer();

  // Load backend menu items on mount
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    fnbApi
      .getMenuItems()
      .then((items) => {
        if (isMounted && items && items.length > 0) {
          const mapped = items.map(mapBackendMenuItem);
          setMenuItems(mapped);
        }
      })
      .catch((err) => {
        // Fall back gracefully to mock items if backend offline
        console.warn('Backend menu unavailable, falling back to mock items:', err.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const getMenuItemsByPeriod = (period: MealPeriod) => {
    return menuItems.filter(m => m.mealPeriods.includes(period) || m.mealPeriods.includes('all_day'));
  };

  const saveMealSelection = (selection: Omit<DailyMealSelection, 'id' | 'status'>) => {
    const newSelection: DailyMealSelection = {
      ...selection,
      id: `MS-${Date.now()}`,
      status: 'pending',
    };
    
    setMealSelections(prev => {
      const filtered = prev.filter(s => 
        !(s.bookingId === selection.bookingId && s.date === selection.date && s.mealPeriod === selection.mealPeriod)
      );
      return [...filtered, newSelection];
    });

    // Try posting to real backend
    const numBookingId = extractNumericId(selection.bookingId);
    if (numBookingId) {
      fnbApi.createDailyMealOrder({
        bookingId: numBookingId,
        orderDate: selection.date,
        mealPeriod: selection.mealPeriod.toUpperCase(),
        menuItemIds: selection.menuItemIds.map(id => extractNumericId(id) || 1),
        specialNotes: selection.notes,
      }).catch(err => {
        console.warn('Backend daily meal submission failed, kept in local state:', err.message);
      });
    }
  };

  const getMealSelection = (bookingId: string, date: string, period: MealPeriod) => {
    return mealSelections.find(s => s.bookingId === bookingId && s.date === date && s.mealPeriod === period);
  };

  const createAlaCarteOrder = (order: Omit<AlaCarteOrder, 'id' | 'createdAt' | 'status' | 'chargeType' | 'folioPostingStatus'>) => {
    const newOrder: AlaCarteOrder = {
      ...order,
      id: `ORD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      chargeType: 'fnb_extra',
      folioPostingStatus: 'pending_checkout_folio',
    };
    setAlaCarteOrders(prev => [...prev, newOrder]);

    // Send order to backend without client-trusted total
    const numBookingId = extractNumericId(order.bookingId);
    if (numBookingId) {
      fnbApi.createAlaCarteOrder({
        bookingId: numBookingId,
        deliveryLocation: order.location,
        deliveryTime: order.targetTime,
        items: order.lines.map(line => ({
          menuItemId: extractNumericId(line.menuItemId) || 1,
          quantity: line.quantity,
          specialNotes: line.notes,
        })),
      }).then(res => {
        if (res && res.mealOrderId) {
          setAlaCarteOrders(prev => prev.map(o => o.id === newOrder.id ? {
            ...o,
            id: `MEAL-${res.mealOrderId}`,
            totalAmount: res.totalAmount || o.totalAmount,
          } : o));
        }
      }).catch(err => {
        console.warn('Backend a-la-carte order failed, kept in local state:', err.message);
      });
    }

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

    setKdsRemoteQueue(prev => prev.map(item => item.id === id ? { ...item, status } : item));

    const numericId = extractNumericId(id);
    if (numericId) {
      fnbApi.updateKdsOrderStatus(numericId, status.toUpperCase()).catch(err => {
        console.warn('Backend status update failed, kept in local state:', err.message);
      });
    }
  };

  const cancelOrder = async (id: string, reason?: string): Promise<void> => {
    const numericId = extractNumericId(id);
    if (!numericId) return;

    try {
      await fnbApi.cancelKdsOrder(numericId, reason || 'Cancelled by staff');
      setKdsRemoteQueue(prev => prev.map(item => item.id === id ? { ...item, status: 'cancelled' } : item));
      setAlaCarteOrders(prev => prev.map(o => o.id === id ? { ...o, status: 'cancelled' } : o));
      setMealSelections(prev => prev.map(s => s.id === id ? { ...s, status: 'cancelled' } : s));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      throw err;
    }
  };

  const refreshKitchenQueue = useCallback(async (date?: string): Promise<void> => {
    setIsRefreshing(true);
    setError(null);
    try {
      const res = await fnbApi.getKdsQueue({ date });
      if (res && Array.isArray(res)) {
        const mapped = res.map(mapBackendPrepEntry);
        setKdsRemoteQueue(mapped);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('Unable to fetch live kitchen queue, falling back to local list:', msg);
      // Non-fatal error; local queue remains visible without breaking UI
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  const getDailyPrepList = (date: string): MealPrepEntry[] => {
    // If we have live remote queue data matching this date, use it
    if (kdsRemoteQueue.length > 0) {
      const remoteMatching = kdsRemoteQueue.filter(q => q.date === date);
      if (remoteMatching.length > 0) {
        return remoteMatching;
      }
    }

    const prepList: MealPrepEntry[] = [];
    
    // Retreat Meals
    mealSelections.filter(s => s.date === date).forEach(s => {
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

    // Ala Carte Orders
    alaCarteOrders.filter(o => o.createdAt.startsWith(date) || (o.status !== 'delivered' && o.status !== 'cancelled')).forEach(o => {
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

  /**
   * Returns only active kitchen preparation orders (PENDING, PREPARING, READY).
   * Explicitly excludes terminal lifecycle statuses: DELIVERED and CANCELLED.
   */
  const getActiveKitchenQueue = (date?: string): MealPrepEntry[] => {
    const targetDate = date || '2026-09-24';
    return getDailyPrepList(targetDate).filter(
      item => item.status === 'pending' || item.status === 'preparing' || item.status === 'ready'
    );
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
    getActiveKitchenQueue,
    isLoading,
    isRefreshing,
    error,
    refreshKitchenQueue,
    cancelOrder,
  }), [menuItems, mealSelections, alaCarteOrders, kdsRemoteQueue, isLoading, isRefreshing, error, refreshKitchenQueue]);

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
