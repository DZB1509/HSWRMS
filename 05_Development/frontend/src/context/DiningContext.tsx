import React, { createContext, useContext, useState, useMemo } from 'react';
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

const DiningContext = createContext<DiningContextType | undefined>(undefined);

export const DiningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems] = useState<DietaryMenuItem[]>(MOCK_MENU_ITEMS);
  const [mealSelections, setMealSelections] = useState<DailyMealSelection[]>(MOCK_MEAL_SELECTIONS);
  const [alaCarteOrders, setAlaCarteOrders] = useState<AlaCarteOrder[]>(MOCK_ALA_CARTE_ORDERS);
  
  // We use useCustomer to safely get access to customer profiles if needed
  // Note: this hook is used within the app tree so it should be safe, 
  // but we can also mock the dietary projection internally if it's missing.
  
  // However, since F&B is an operations route, useCustomer might only return the currently logged-in customer.
  // Wait, CustomerContext holds mock customer data. Is the Operations role able to query CustomerContext for other users?
  // Let's assume we can query it, or we'll provide a mock fallback.
  // Actually, for the prototype, CustomerContext has `profile` and `wellnessProfile` which represent the active user.
  // We'll mock a general function that grabs the profile if IDs match, else uses a generic fallback.
  const { profile, wellnessProfile } = useCustomer();

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
      // Remove existing selection for same date/period if any
      const filtered = prev.filter(s => 
        !(s.bookingId === selection.bookingId && s.date === selection.date && s.mealPeriod === selection.mealPeriod)
      );
      return [...filtered, newSelection];
    });
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
    return newOrder;
  };

  const getDietaryProjection = (customerId: string): FnbDietaryProjection => {
    // If the customerId matches the logged-in mock customer, we use their actual data.
    // Otherwise, we provide a safe fallback mock.
    if (profile && profile.id === customerId && wellnessProfile) {
      return {
        customerId,
        customerName: profile.fullName,
        bookingReference: 'HSW-88192', // We could look up their active booking
        villaNumber: profile.assignedVilla,
        allergies: wellnessProfile.dietaryProfile.allergies || [],
        dietaryRestrictions: wellnessProfile.dietaryProfile.dietaryRestrictions || [],
      };
    }
    
    // Fallback for other users in the prep list
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
  };

  const getDailyPrepList = (date: string): MealPrepEntry[] => {
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

    // Ala Carte Orders (assuming same date matches the ISO created date, plus active unfulfilled orders)
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
  }), [menuItems, mealSelections, alaCarteOrders]);


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
