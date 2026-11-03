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
import { useCustomer } from './CustomerContext';
import { fnbApi } from '../features/m4-fnb/api/fnbApi';
import type { IngredientDemandResponse } from '../features/m4-fnb/types/fnbDto';

const DiningContext = createContext<DiningContextType | undefined>(undefined);

export const DiningProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<DietaryMenuItem[]>([]);
  const [mealSelections, setMealSelections] = useState<DailyMealSelection[]>([]);
  const [alaCarteOrders, setAlaCarteOrders] = useState<AlaCarteOrder[]>([]);
  const [liveKitchenOrders, setLiveKitchenOrders] = useState<MealPrepEntry[]>([]);
  const [recentOrderIds, setRecentOrderIds] = useState<string[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'offline'>('idle');
  const [ingredientInventory, setIngredientInventory] = useState<IngredientDemandResponse[]>([]);
  const [isInventoryStale, setIsInventoryStale] = useState<boolean>(false);
  const [lastInventorySyncTime, setLastInventorySyncTime] = useState<string | null>(null);
  const [inventorySyncStatus, setInventorySyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');

  const { profile, wellnessProfile, activeBooking } = useCustomer();

  // Fetch live menu catalog with available servings from backend
  const refreshMenu = useCallback(async (asOfDate?: string) => {
    try {
      const backendMenu = await fnbApi.getMenu(asOfDate);
      setMenuItems(backendMenu.map(item => {
        const value = item.itemName;
        const category = (['starter','main','dessert','beverage','wellness_drink'].includes(String(item.category).toLowerCase()) ? String(item.category).toLowerCase() : 'main') as DietaryMenuItem['category'];
        const rawTags = Array.isArray(item.dietaryTags) ? item.dietaryTags.join(' ') : String(item.dietaryTags || '');
        const tags = rawTags.toLowerCase();
        const allergens = (item.allergenInformation || '').toLowerCase();
        return { id: String(item.id), backendId: item.id, name: {vi:value,en:value,'zh-CN':value,ja:value,fr:value}, description:{vi:'',en:'','zh-CN':'',ja:'',fr:''}, image:'', category, mealPeriods:[(item.mealType || 'all_day').toLowerCase() as MealPeriod], dietaryTags: (['vegetarian','vegan','gluten_free','dairy_free','pescatarian'] as const).filter(tag => tags.includes(tag)) as DietaryMenuItem['dietaryTags'], allergenTags: (['nuts','shellfish','soy','eggs','fish','dairy'] as const).filter(tag => allergens.includes(tag)) as DietaryMenuItem['allergenTags'], price:item.price, isExtra:item.price > 0, available:item.available, availableServings:(item as any).availableServings ?? item.servingsAvailable ?? 0 };
      }));
      setError(null); setIsInventoryStale(false);
    } catch (err) {
      setMenuItems([]); setError(err instanceof Error ? err.message : 'Unable to load menu from server.');
      setIsInventoryStale(true);
    }
  }, []);

const getLocalDateString = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

  // Fetch live physical ingredient stock from backend (usable quantity and unit of measure)
  const refreshInventory = useCallback(async (asOfDate?: string) => {
    setInventorySyncStatus('syncing');
    try {
      const today = asOfDate || getLocalDateString();
      const dashboard = await fnbApi.getDashboard(today);
      if (dashboard && dashboard.ingredientDemand && dashboard.ingredientDemand.length > 0) {
        setIngredientInventory(dashboard.ingredientDemand);
        setIsInventoryStale(false);
        setLastInventorySyncTime(new Date().toLocaleTimeString());
        setInventorySyncStatus('synced');
      } else {
        setIngredientInventory([]);
        setInventorySyncStatus('synced');
      }
    } catch {
      setIngredientInventory([]); setInventorySyncStatus('error');
    }
  }, []);

  useEffect(() => {
    refreshMenu();
    // Do NOT call refreshInventory() globally on mount, as customers do not have ROLE_F&B STAFF.
    // Kitchen operational pages (MealPrepListPage, FnbDashboardPage) invoke refreshInventory() directly.
  }, [refreshMenu]);

  useEffect(() => {
    const rawId = String(activeBooking?.id || '').trim();
    const bookingId = /^\d+$/.test(rawId) ? Number(rawId) : null;
    if (!bookingId) { setMealSelections([]); setAlaCarteOrders([]); return; }
    let active = true;
    fnbApi.getMyOrders(bookingId).then(orders => {
      if (!active) return;
      const daily = orders.filter(order => order.orderType === 'DAILY_MEAL').map(order => {
        const lines = order.lines || order.items || [];
        const ids = lines.map(line => String(line.menuItemId));
        return { id:String(order.id), bookingId:rawId, customerId:profile?.id || '', date:order.orderDate, mealPeriod:(order.mealType || 'all_day').toLowerCase() as MealPeriod, menuItemIds:ids, quantity:lines.reduce((sum,line) => sum + line.quantity, 0), items:lines.map(line => ({ menuItemId:String(line.menuItemId), quantity:line.quantity, notes:order.specialNotes || '' })), notes:order.specialNotes || '', status:order.status.toLowerCase() as FnbFulfillmentStatus, inventoryStatus:order.inventoryStatus, inventoryMessage:order.inventoryMessage };
      });
      const extras = orders.filter(order => order.orderType === 'A_LA_CARTE').map(order => {
        const lines = order.lines || order.items || [];
        return { id:String(order.id), bookingId:rawId, customerId:profile?.id || '', createdAt:order.createdAt, targetTime:undefined, location:undefined, status:order.status.toLowerCase() as FnbFulfillmentStatus, lines:lines.map(line => ({ id:String(line.id), menuItemId:String(line.menuItemId), quantity:line.quantity, unitPrice:line.unitPrice, notes:order.specialNotes || '' })), totalAmount:order.subtotal, chargeType:'fnb_extra' as const, folioPostingStatus:'PENDING_RECONCILIATION' as const };
      });
      setMealSelections(daily); setAlaCarteOrders(extras); setError(null);
    }).catch(error => { if (active) { setMealSelections([]); setAlaCarteOrders([]); setError(error instanceof Error ? error.message : 'Unable to load customer orders.'); } });
    return () => { active = false; };
  }, [activeBooking?.id, profile?.id]);

  const getMenuItemsByPeriod = (period: MealPeriod) => {
    return menuItems.filter(m => m.mealPeriods.includes(period) || m.mealPeriods.includes('all_day'));
  };

  const saveMealSelection = async (selection: Omit<DailyMealSelection, 'id' | 'status'>) => {
    const bookingValue = String(selection.bookingId).trim();
    const bookingId = /^\d+$/.test(bookingValue) ? Number(bookingValue) : Number.NaN;
    if (!Number.isSafeInteger(bookingId) || bookingId <= 0) throw new Error('A valid server booking ID is required.');
    const selected = selection.items?.length ? selection.items : selection.menuItemIds.map(menuItemId => ({ menuItemId, quantity: selection.quantity || 1 }));
    const items = selected.map(item => {
      const menu = menuItems.find(candidate => candidate.id === item.menuItemId || candidate.backendId === Number(item.menuItemId));
      if (!menu?.backendId) throw new Error('A selected menu item is not available from the server. Refresh the menu and try again.');
      return { menuItemId: menu.backendId, quantity: item.quantity || 1 };
    });
    const saved = await fnbApi.placeDailyMealOrder({ bookingId, orderDate: selection.date, mealType: selection.mealPeriod.toUpperCase(), specialNotes: selection.notes || undefined, items });
    const savedLines = saved.lines || saved.items || [];
    const persisted: DailyMealSelection = { ...selection, id: String(saved.id), menuItemIds: savedLines.map(line => String(line.menuItemId)), items: savedLines.map(line => ({ menuItemId: String(line.menuItemId), quantity: line.quantity, notes: selection.notes })), notes: saved.specialNotes || selection.notes, status: saved.status.toLowerCase() as FnbFulfillmentStatus, inventoryStatus: saved.inventoryStatus };
    setMealSelections(prev => [persisted, ...prev.filter(s => !(s.bookingId === selection.bookingId && s.date === selection.date && s.mealPeriod === selection.mealPeriod))]);
    setRecentOrderIds(prev => [persisted.id, ...prev]);
    await fetchKitchenOrders(selection.date);
  };

  const getMealSelection = (bookingId: string, date: string, period: MealPeriod) => {
    return mealSelections.find(s => s.bookingId === bookingId && s.date === date && s.mealPeriod === period);
  };

  const createAlaCarteOrder = async (order: Omit<AlaCarteOrder, 'id' | 'createdAt' | 'status' | 'chargeType' | 'folioPostingStatus'>): Promise<AlaCarteOrder> => {
    const bookingValue = String(order.bookingId).trim();
    const bookingId = /^\d+$/.test(bookingValue) ? Number(bookingValue) : Number.NaN;
    if (!Number.isSafeInteger(bookingId) || bookingId <= 0) throw new Error('A valid server booking ID is required.');
    const items = order.lines.map(line => {
      const menu = menuItems.find(candidate => candidate.id === line.menuItemId || candidate.backendId === Number(line.menuItemId));
      if (!menu?.backendId) throw new Error('An ordered menu item is not available from the server. Refresh the menu and try again.');
      return { menuItemId: menu.backendId, quantity: line.quantity };
    });
    const saved = await fnbApi.placeAlaCarteOrder({ bookingId, orderDate: getLocalDateString(), mealType: 'DINNER', specialNotes: order.lines.map(line => line.notes).filter(Boolean)[0] || undefined, items });
    const savedLines = saved.lines || saved.items || [];
    const persisted: AlaCarteOrder = { ...order, id: String(saved.id), createdAt: saved.createdAt, lines: savedLines.map(line => ({ id: String(line.id), menuItemId: String(line.menuItemId), quantity: line.quantity, unitPrice: line.unitPrice, notes: saved.specialNotes || '' })), totalAmount: saved.subtotal, status: saved.status.toLowerCase() as FnbFulfillmentStatus, chargeType: 'fnb_extra', folioPostingStatus: 'pending_checkout_folio' };
    setAlaCarteOrders(prev => [persisted, ...prev]); setRecentOrderIds(prev => [persisted.id, ...prev]);
    await fetchKitchenOrders(getLocalDateString());
    return persisted;
  };

  const getDietaryProjection = (customerId: string): FnbDietaryProjection => {
    if (profile && profile.id === customerId && wellnessProfile) {
      return {
        customerId,
        customerName: profile.fullName || '',
        bookingReference: '',
        villaNumber: profile.assignedVilla || undefined,
        allergies: wellnessProfile.dietaryProfile?.allergies || [],
        dietaryRestrictions: wellnessProfile.dietaryProfile?.dietaryRestrictions || [],
      };
    }
    
    return {
      customerId,
      customerName: '',
      bookingReference: '',
      villaNumber: undefined,
      allergies: [],
      dietaryRestrictions: [],
    };
  };

  const updateFulfillmentStatus = async (id: string, _type: 'retreat_meal' | 'a_la_carte', status: FnbFulfillmentStatus) => {
    const numericId = Number(id.replace(/\D/g, ''));
    if (!Number.isSafeInteger(numericId) || numericId <= 0) throw new Error('A persisted server order ID is required.');
    const current = liveKitchenOrders.find(order => order.id === id)?.status;
    const allowed = (current === 'pending' && ['preparing', 'cancelled'].includes(status)) || (current === 'preparing' && ['ready', 'cancelled'].includes(status)) || (current === 'ready' && ['delivered', 'cancelled'].includes(status));
    if (!allowed && current !== status) throw new Error(`Order status transition ${current || 'unknown'} → ${status} is not allowed.`);
    try {
      await fnbApi.updateOrderStatus(numericId, status === 'delivered' ? 'DELIVERED' : status.toUpperCase());
      await fetchKitchenOrders(getLocalDateString());
      await refreshMenu();
      await refreshInventory();
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'The server did not confirm the order status change.');
      throw error;
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
          customerName: (ko.guestFirstName || ko.customerFirstName) ? `${ko.guestFirstName || ko.customerFirstName}` : 'Customer',
          villaNumber: ko.villaNumber,
          items: ((ko.items || ko.lines || []) as any[]).map((line) => ({
            orderLineId: line.orderLineId || line.id,
            menuItemId: String(line.menuItemId),
            quantity: line.quantity,
            notes: undefined,
            preparationStatus: line.preparationStatus,
            inventoryStatus: line.inventoryStatus,
            inventoryMessage: line.inventoryMessage,
          })),
          customerNotes: ko.specialNotes || undefined,
          dietaryNotes: [...(ko.allergies || ko.allergyTags || []), ...(ko.dietaryPreferences || [])],
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
      setLiveKitchenOrders([]);
      setSyncStatus('synced');
      return [];
    } catch (err) {
      setLiveKitchenOrders([]);
      setError(err instanceof Error ? err.message : 'Unable to load kitchen orders from server.');
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
      const ko = liveKitchenOrders.find(o => o.id === recentId && (!date || o.date === date));
      if (ko && !seenIds.has(ko.id)) {
        seenIds.add(ko.id);
        prepList.push(ko);
        return;
      }

      // Check mealSelections
      const sel = mealSelections.find(s => s.id === recentId && (!date || s.date === date));
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
          customerName: projection.customerName || 'Customer',
          villaNumber: projection.villaNumber || '',
          items: itemsList,
          customerNotes: sel.notes,
          dietaryNotes: [...(projection.allergies || []), ...(projection.dietaryRestrictions || [])],
          status: sel.status,
          inventoryStatus: sel.inventoryStatus || 'PENDING',
          inventoryMessage: sel.inventoryMessage,
        });
        return;
      }

      // Check alaCarteOrders
      const ala = alaCarteOrders.find(o => o.id === recentId && (!date || o.createdAt.startsWith(date)));
      if (ala && !seenIds.has(ala.id)) {
        seenIds.add(ala.id);
        const projection = getDietaryProjection(ala.customerId);
        prepList.push({
          id: ala.id,
          type: 'a_la_carte',
          date: ala.createdAt.split('T')[0],
          targetTime: ala.targetTime,
          customerName: projection.customerName || 'Customer',
          villaNumber: ala.location || projection.villaNumber || '',
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
        customerName: projection.customerName || 'Customer',
        villaNumber: projection.villaNumber || '',
        items: itemsList,
        customerNotes: s.notes,
        dietaryNotes: [...(projection.allergies || []), ...(projection.dietaryRestrictions || [])],
        status: s.status,
        inventoryStatus: s.inventoryStatus || 'PENDING',
        inventoryMessage: s.inventoryMessage,
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
        customerName: projection.customerName || 'Customer',
        villaNumber: o.location || projection.villaNumber || '',
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
        customerName: projection.customerName || 'Customer',
        villaNumber: projection.villaNumber || '',
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
        customerName: projection.customerName || 'Customer',
        villaNumber: alaMatch.location || projection.villaNumber || '',
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

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const getActiveKitchenQueue = useCallback((date?: string): MealPrepEntry[] => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    return getDailyPrepList(targetDate).filter(
      item => item.status === 'pending' || item.status === 'preparing' || item.status === 'ready'
    );
  }, [getDailyPrepList]);

  const refreshKitchenQueue = useCallback(async (date?: string) => {
    const targetDate = date || new Date().toISOString().split('T')[0];
    setIsRefreshing(true);
    try {
      await fetchKitchenOrders(targetDate);
    } catch (err: any) {
      setError(err?.message || 'Failed to refresh kitchen queue');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchKitchenOrders]);

  const cancelOrder = useCallback(async (id: string, reason?: string) => {
    setIsLoading(true);
    try {
      const numId = parseInt(id.replace(/\D/g, ''), 10);
      if (!Number.isSafeInteger(numId) || numId <= 0) throw new Error('A persisted server order ID is required.');
      await fnbApi.cancelKdsOrder(numId, reason || 'Cancelled by staff');
      await fetchKitchenOrders(getLocalDateString());
    } catch (err: any) {
      setError(err?.message || 'Failed to cancel order');
    } finally {
      setIsLoading(false);
    }
  }, [fetchKitchenOrders]);

  const value = useMemo(() => ({
    getActiveKitchenQueue,
    refreshKitchenQueue,
    cancelOrder,
    isLoading,
    isRefreshing,
    error,
    menuItems,
    getMenuItemsByPeriod,
    mealSelections,
    saveMealSelection,
    getMealSelection,
    alaCarteOrders,
    createAlaCarteOrder,
    getDietaryProjection,
    updateFulfillmentStatus,
    getDailyPrepList,
    getOrderById,
    syncStatus,
    fetchKitchenOrders,
    refreshMenu,
    ingredientInventory,
    refreshInventory,
    isInventoryStale,
    lastInventorySyncTime,
    inventorySyncStatus,
  }), [
    menuItems,
    mealSelections,
    alaCarteOrders,
    liveKitchenOrders,
    syncStatus,
    fetchKitchenOrders,
    refreshMenu,
    refreshInventory,
    ingredientInventory,
    isInventoryStale,
    lastInventorySyncTime,
    inventorySyncStatus,
    getOrderById,
    getActiveKitchenQueue,
    refreshKitchenQueue,
    cancelOrder,
    isLoading,
    isRefreshing,
    error,
  ]);

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

