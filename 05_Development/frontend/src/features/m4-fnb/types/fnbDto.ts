/**
 * Backend Data Transfer Objects (DTO) for Module 4: Dietary F&B Management.
 * Synchronized with com.heavenstay.hswrms.m4fnb.dto.* and ApiResponse envelope.
 */

export interface ApiResponse<T> {
  timestamp: string;
  success: boolean;
  message: string;
  data: T;
}

export type FnbOrderType = 'DAILY_MEAL' | 'A_LA_CARTE';
export type FnbOrderStatus = 'PENDING' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
export type MealOrderItemPreparationStatus = 'PENDING' | 'PREPARING' | 'READY';
export type StockCondition = 'FRESH' | 'GOOD' | 'NEAR_EXPIRY' | 'HOLD' | 'EXPIRED' | 'DISCARDED';

// --- Menu & Recipe ---
export interface MenuItemResponse {
  id: number;
  itemName: string;
  category: string | null;
  mealType: string | null;
  price: number;
  dietaryTags: string | null;
  allergenInformation: string | null;
  available: boolean;
  servingsAvailable: number;
  allergenWarning: boolean;
}

export interface MenuAvailabilityResponse {
  menuItemId: number;
  itemName: string;
  recipeConfigured: boolean;
  available: boolean;
  servingsAvailable: number;
  reason: string;
}

export interface RecipeLineResponse {
  ingredientId: number;
  ingredientName: string;
  unitOfMeasure: string;
  requiredQuantity: number;
}

export interface CreateMenuItemRequest {
  itemName: string;
  category?: string;
  mealType?: string;
  price?: number;
  dietaryTags?: string;
  allergenInformation?: string;
  availabilityStatus?: 'AVAILABLE' | 'UNAVAILABLE';
}

export interface RecipeLineRequest {
  ingredientId: number;
  requiredQuantity: number;
}

export interface ReplaceRecipeRequest {
  lines: RecipeLineRequest[];
}

// --- Meal Orders (Customer & Operations) ---
export interface CreateMealOrderLineRequest {
  menuItemId: number;
  quantity: number;
}

export interface CreateMealOrderRequest {
  bookingId: number;
  orderDate: string; // YYYY-MM-DD
  mealType: string;  // BREAKFAST, LUNCH, DINNER
  specialNotes?: string;
  items: CreateMealOrderLineRequest[];
}

export interface MealOrderLineResponse {
  id: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  preparationStatus: string;
}

export interface MealOrderResponse {
  id: number;
  retreatBookingId: number;
  orderDate: string;
  mealType: string | null;
  orderType: string;
  status: string;
  specialNotes: string | null;
  createdAt: string;
  subtotal: number;
  lines?: MealOrderLineResponse[];
  items?: MealOrderLineResponse[];
  inventoryStatus?: string;
  inventoryMessage?: string | null;
}

// --- Kitchen Display System (KDS) ---
export interface KitchenOrderLineResponse {
  id: number;
  orderLineId?: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  preparationStatus: string;
  inventoryStatus?: 'PENDING' | 'CONSUMED' | 'NOT_CONFIGURED' | 'INSUFFICIENT_STOCK' | 'FAILED' | string;
  inventoryMessage?: string | null;
}

export interface KitchenOrderResponse {
  id: number;
  bookingId?: number;
  retreatBookingId?: number;
  guestFirstName?: string;
  customerFirstName?: string;
  villaNumber: string;
  orderDate: string;
  mealType: string | null;
  orderType: string;
  status: string;
  specialNotes: string | null;
  delivered?: boolean;
  allergies?: string[];
  allergyTags?: string[];
  dietaryPreferences: string[];
  dietaryVerificationStatus?: 'VERIFIED' | 'UNVERIFIED' | 'NO_PROFILE_ATTACHED' | string;
  locationVerificationStatus?: 'VERIFIED_VILLA' | 'UNVERIFIED_LOCATION' | string;
  folioPostingStatus?: 'NOT_APPLICABLE' | 'PENDING_RECONCILIATION' | 'POSTED_TO_FOLIO' | string;
  inventoryStatus?: 'PENDING' | 'CONSUMED' | 'NOT_CONFIGURED' | 'INSUFFICIENT_STOCK' | 'FAILED' | string;
  inventoryMessage?: string | null;
  items?: KitchenOrderLineResponse[];
  lines?: KitchenOrderLineResponse[];
}

export interface UpdateOrderStatusRequest {
  status: string;
}

// --- Ingredients & Inventory Batches ---
export interface IngredientResponse {
  id: number;
  ingredientName: string;
  unitOfMeasure: string;
}

export interface CreateIngredientRequest {
  ingredientName: string;
}

export interface IngredientBatchResponse {
  id: number;
  ingredientId: number;
  ingredientName: string;
  unitOfMeasure: string;
  receivedDate: string;
  expirationDate: string;
  remainingQuantity: number;
  stockCondition: string;
  usable: boolean;
}

export interface CreateIngredientBatchRequest {
  ingredientId: number;
  receivedDate: string;
  expirationDate: string;
  quantity: number;
  condition: string;
}

export interface UpdateBatchConditionRequest {
  condition: string;
}

// --- F&B Dashboard ---
export interface IngredientDemandResponse {
  ingredientId: number;
  ingredientName: string;
  unitOfMeasure: string;
  requiredQuantity: number;
  usableQuantity: number;
  shortfall: number;
  status: 'SHORTAGE' | 'COVERED' | string;
  alert?: 'SHORTAGE' | 'COVERED' | string;
}

export interface FnbDashboardResponse {
  retreatMealOrders: number;
  alaCarteOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  menuAvailability: MenuAvailabilityResponse[];
  ingredientDemand: IngredientDemandResponse[];
}

// --- Retreat Package F&B Plans ---
export interface RetreatPackageFnbPlanResponse {
  packageCode: string;
  packageName: string;
  durationNights: number;
  wellnessGoal: string;
  dietaryRegimen: string;
  caloricTarget: string;
  breakfastCount: number;
  lunchCount: number;
  dinnerCount: number;
  mealQuotaSummary: string;
  beverageAndHydrationPlan: string;
  keyIngredients: string[];
  safetyGuidelines: string[];
  contraindications: string[];
  recommendedDishKeywords: string[];
}
