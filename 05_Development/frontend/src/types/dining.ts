export type MealPeriod = 'breakfast' | 'lunch' | 'dinner' | 'all_day';
export type FnbFulfillmentStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type AlaCarteChargeType = 'fnb_extra';
export type FolioPostingStatus = 'pending_checkout_folio' | 'settled' | 'NOT_APPLICABLE' | 'PENDING_RECONCILIATION' | 'POSTED_TO_FOLIO';
export type DietaryVerificationStatus = 'VERIFIED' | 'UNVERIFIED' | 'NO_PROFILE_ATTACHED';
export type LocationVerificationStatus = 'VERIFIED_VILLA' | 'UNVERIFIED_LOCATION';

export interface LocalizedString {
  vi: string;
  en: string;
  'zh-CN': string;
  ja: string;
  fr: string;
}

export interface DietaryMenuItem {
  id: string;
  name: LocalizedString;
  description: LocalizedString;
  image: string;
  category: 'starter' | 'main' | 'dessert' | 'beverage' | 'wellness_drink';
  mealPeriods: MealPeriod[];
  dietaryTags: ('vegetarian' | 'lacto_ovo_vegetarian' | 'vegan' | 'gluten_free' | 'gluten_conscious' | 'dairy_free' | 'keto' | 'pescatarian' | 'flexitarian')[];
  allergenTags: ('nuts' | 'shellfish' | 'soy' | 'eggs' | 'fish' | 'dairy')[];
  price?: number;
  backendId?: number;
  isExtra: boolean;
  calories?: number;
  available?: boolean;
  availableServings?: number;
}

export interface DailyMealSelection {
  id: string;
  bookingId: string;
  customerId: string;
  date: string; // YYYY-MM-DD format
  mealPeriod: MealPeriod;
  menuItemIds: string[]; // Support multiple choices per meal period if allowed
  quantity?: number; // Portions selected (e.g. 1 portion, 2 portions)
  items?: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    inventoryStatus?: string;
    inventoryMessage?: string | null;
  }[];
  notes: string;
  status: FnbFulfillmentStatus; // Fulfillment status of the included retreat meal
  inventoryStatus?: string;
  inventoryMessage?: string | null;
}

export interface AlaCarteOrderLine {
  id: string;
  menuItemId: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

export interface AlaCarteOrder {
  id: string;
  bookingId: string;
  customerId: string;
  createdAt: string; // ISO timestamp
  targetTime?: string; // e.g., "19:00"
  location?: string; // Villa number or dining area
  status: FnbFulfillmentStatus;
  lines: AlaCarteOrderLine[];
  totalAmount: number;
  chargeType: AlaCarteChargeType;
  folioPostingStatus: FolioPostingStatus;
}

// Minimal projection for F&B staff - strictly limits health data exposure
export interface FnbDietaryProjection {
  customerId: string;
  customerName: string;
  bookingReference: string;
  villaNumber?: string;
  allergies: string[];
  dietaryRestrictions: string[];
}

export interface MealPrepEntry {
  id: string; // Could be DailyMealSelection ID or AlaCarteOrder ID
  type: 'retreat_meal' | 'a_la_carte';
  date: string;
  targetTime?: string; // Specific time for extra orders, or generic meal period
  mealPeriod?: MealPeriod; // For retreat meals
  customerName: string;
  villaNumber?: string;
  items: {
    orderLineId?: number;
    menuItemId: string;
    quantity: number;
    notes?: string;
    preparationStatus?: string;
    inventoryStatus?: 'PENDING' | 'CONSUMED' | 'NOT_CONFIGURED' | 'INSUFFICIENT_STOCK' | 'FAILED' | string;
    inventoryMessage?: string | null;
  }[];
  customerNotes?: string;
  dietaryNotes: string[]; // Combined relevant dietary tags from the minimal projection
  dietaryVerificationStatus?: DietaryVerificationStatus;
  locationVerificationStatus?: LocationVerificationStatus;
  folioPostingStatus?: FolioPostingStatus;
  status: FnbFulfillmentStatus;
  inventoryStatus?: 'PENDING' | 'CONSUMED' | 'NOT_CONFIGURED' | 'INSUFFICIENT_STOCK' | 'FAILED' | string;
  inventoryMessage?: string | null;
}

export interface DiningContextType {
  // Menu
  menuItems: DietaryMenuItem[];
  getMenuItemsByPeriod: (period: MealPeriod) => DietaryMenuItem[];
  
  // Retreat Meals
  mealSelections: DailyMealSelection[];
  saveMealSelection: (selection: Omit<DailyMealSelection, 'id' | 'status'>) => void;
  getMealSelection: (bookingId: string, date: string, period: MealPeriod) => DailyMealSelection | undefined;
  
  // A-la-carte
  alaCarteOrders: AlaCarteOrder[];
  createAlaCarteOrder: (order: Omit<AlaCarteOrder, 'id' | 'createdAt' | 'status' | 'chargeType' | 'folioPostingStatus'>) => AlaCarteOrder;
  
  // Operational Methods
  getDietaryProjection: (customerId: string) => FnbDietaryProjection;
  updateMealSelectionStatus: (id: string, status: FnbFulfillmentStatus) => void;
  updateAlaCarteOrderStatus: (id: string, status: FnbFulfillmentStatus) => void;
  updateFulfillmentStatus: (id: string, type: 'retreat_meal' | 'a_la_carte', status: FnbFulfillmentStatus) => void;
  getDailyPrepList: (date: string) => MealPrepEntry[];
  getActiveKitchenQueue: (date?: string) => MealPrepEntry[];
  getOrderById?: (id: string) => MealPrepEntry | undefined;

  // Backend Integration & Polling
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  refreshKitchenQueue?: (date?: string) => Promise<void>;
  cancelOrder?: (id: string, reason?: string) => Promise<void>;

  // Live REST API Integration & Sync (Module 4)
  syncStatus?: 'idle' | 'syncing' | 'synced' | 'offline';
  fetchKitchenOrders?: (date: string) => Promise<MealPrepEntry[]>;
  refreshMenu?: (asOfDate?: string) => Promise<void>;
  ingredientInventory?: import('../features/m4-fnb/types/fnbDto').IngredientDemandResponse[];
  refreshInventory?: (asOfDate?: string) => Promise<void>;
  isInventoryStale?: boolean;
  lastInventorySyncTime?: string | null;
  inventorySyncStatus?: 'idle' | 'syncing' | 'synced' | 'error';
}

