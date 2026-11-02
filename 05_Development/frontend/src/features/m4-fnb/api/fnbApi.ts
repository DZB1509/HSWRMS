import { apiClient } from '../../../api/client/apiClient';
import {
  buildDailyMealOrderPayload,
  buildAlaCarteOrderPayload,
  buildCancelOrderPayload,
} from '../utils/fnbPayloadUtils';



export interface MenuItemBackendDto {
  menuItemId: number;
  itemName: string;
  category: string;
  mealType: string;
  price: number;
  dietaryTags?: string;
  allergenInformation?: string;
  availabilityStatus: string;
}

export interface MealOrderItemBackendDto {
  mealOrderItemId: number;
  menuItemId: number;
  itemName: string;
  quantity: number;
  unitPrice: number;
  lineTotal?: number;
  notes?: string;
  specialNotes?: string;
}

export interface MealOrderBackendDto {
  mealOrderId: number;
  retreatBookingId: number;
  bookingId?: number; // Backward-compatibility alias
  orderType: string;
  orderDate: string;
  mealType?: string;
  deliveryTime?: string;
  deliveryLocation?: string;
  orderStatus: string;
  totalAmount: number;
  notes?: string;
  specialNotes?: string;
  cancellationReason?: string;
  cancelledBy?: number;
  cancelledAt?: string;
  items: MealOrderItemBackendDto[];
  createdAt: string;
  updatedAt?: string;
}

export interface MealPrepEntryBackendDto {
  id: string | number;
  rawMealOrderId?: number;
  type: 'retreat_meal' | 'a_la_carte';
  date: string;
  targetTime?: string;
  mealPeriod?: string;
  customerName: string;
  villaNumber?: string;
  items: {
    menuItemId: string | number;
    itemName?: string;
    quantity: number;
    notes?: string;
    unitPrice?: number;
    lineTotal?: number;
  }[];
  customerNotes?: string;
  dietaryNotes: string[];
  status: string;
}

export interface KdsDashboardKpiBackendDto {
  retreatMealsToday: number;
  extraOrdersToday: number;
  dietaryAlertsCount: number;
  pendingCount: number;
  preparingCount: number;
  readyCount: number;
  deliveredCount: number;
}

export interface CreateDailyMealPayload {
  retreatBookingId?: number;
  orderDate: string;
  mealPeriod: string;
  menuItemIds: number[];
  notes?: string;
  // Aliases for backward-compatibility
  bookingId?: number;
  specialNotes?: string;
}

export interface CreateAlaCartePayload {
  retreatBookingId?: number;
  orderDate?: string;
  targetTime?: string;
  location?: string;
  items: {
    menuItemId: number;
    quantity: number;
    notes?: string;
    specialNotes?: string;
  }[];
  // Aliases for backward-compatibility
  bookingId?: number;
  deliveryTime?: string;
  deliveryLocation?: string;
}

import type {
  ApiResponse,
  MenuItemResponse,
  MenuAvailabilityResponse,
  RecipeLineResponse,
  CreateMenuItemRequest,
  ReplaceRecipeRequest,
  CreateMealOrderRequest,
  MealOrderResponse,
  KitchenOrderResponse,
  IngredientResponse,
  CreateIngredientRequest,
  IngredientBatchResponse,
  CreateIngredientBatchRequest,
  FnbDashboardResponse,
  RetreatPackageFnbPlanResponse,
} from '../types/fnbDto';

/**
 * Defensive unwrap helper ensuring data is extracted whether returned inside ApiResponse envelope or raw.
 */
function unwrapResponse<T>(res: ApiResponse<T> | T): T {
  if (res && typeof res === 'object' && 'data' in (res as Record<string, unknown>)) {
    return (res as ApiResponse<T>).data;
  }
  return res as T;
}

/**
 * Module 4 (Dietary F&B Management) Typed REST API Client.
 * Communicates with Spring Boot endpoints under `/api/v1/fnb`.
 */

export const fnbApi = {
  // ==========================================================================
  // THAO M4 F&B Inventory, Recipes, Orders, Dashboard & Package Plans
  // ==========================================================================
// ==========================================================================
  // 1. Menu & Recipe Endpoints
  // ==========================================================================

  /**
   * Fetches menu items. Automatically personalizes and filters allergens when
   * invoked with customer credentials, or returns full catalog for F&B Staff.
   */
  getMenu: async (asOfDate?: string): Promise<MenuItemResponse[]> => {
    const res = await apiClient.get<ApiResponse<MenuItemResponse[]>>('/fnb/menu', {
      params: asOfDate ? { asOfDate } : undefined,
    });
    return unwrapResponse(res);
  },

  /**
   * Retrieves real-time menu availability and calculated serving capacity from stock.
   */
  getMenuAvailability: async (asOfDate?: string): Promise<MenuAvailabilityResponse[]> => {
    const res = await apiClient.get<ApiResponse<MenuAvailabilityResponse[]>>('/fnb/menu/availability', {
      params: asOfDate ? { asOfDate } : undefined,
    });
    return unwrapResponse(res);
  },

  createMenuItem: async (request: CreateMenuItemRequest): Promise<MenuItemResponse> => {
    const res = await apiClient.post<ApiResponse<MenuItemResponse>>('/fnb/menu', request);
    return unwrapResponse(res);
  },

  updateMenuItem: async (menuItemId: number, request: CreateMenuItemRequest): Promise<MenuItemResponse> => {
    const res = await apiClient.put<ApiResponse<MenuItemResponse>>(`/fnb/menu/${menuItemId}`, request);
    return unwrapResponse(res);
  },

  getRecipe: async (menuItemId: number): Promise<RecipeLineResponse[]> => {
    const res = await apiClient.get<ApiResponse<RecipeLineResponse[]>>(`/fnb/menu/${menuItemId}/recipe`);
    return unwrapResponse(res);
  },

  replaceRecipe: async (menuItemId: number, request: ReplaceRecipeRequest): Promise<RecipeLineResponse[]> => {
    const res = await apiClient.put<ApiResponse<RecipeLineResponse[]>>(`/fnb/menu/${menuItemId}/recipe`, request);
    return unwrapResponse(res);
  },

  // ==========================================================================
  // 2. Customer Meal Orders
  // ==========================================================================

  /**
   * Submits standard in-package daily meal selection (Total: $0).
   * Guarded by single-selection constraint per meal period.
   */
  placeDailyMealOrder: async (request: CreateMealOrderRequest): Promise<MealOrderResponse> => {
    const res = await apiClient.post<ApiResponse<MealOrderResponse>>('/fnb/orders/daily-meals', request);
    return unwrapResponse(res);
  },

  /**
   * Submits extra a-la-carte order with captured item prices.
   * Auto-posts charge to Module 5 Folio via backend application event.
   */
  placeAlaCarteOrder: async (request: CreateMealOrderRequest): Promise<MealOrderResponse> => {
    const res = await apiClient.post<ApiResponse<MealOrderResponse>>('/fnb/orders/ala-carte', request);
    return unwrapResponse(res);
  },

  /**
   * Retrieves meal orders for the current customer for a specific booking.
   */
  getMyOrders: async (bookingId: number): Promise<MealOrderResponse[]> => {
    const res = await apiClient.get<ApiResponse<MealOrderResponse[]>>('/fnb/orders/mine', {
      params: { bookingId },
    });
    return unwrapResponse(res);
  },

  getMyOrder: async (orderId: number): Promise<MealOrderResponse> => {
    const res = await apiClient.get<ApiResponse<MealOrderResponse>>(`/fnb/orders/mine/${orderId}`);
    return unwrapResponse(res);
  },

  /**
   * Updates an existing PENDING daily meal selection.
   */
  updateDailyMealSelection: async (orderId: number, request: CreateMealOrderRequest): Promise<MealOrderResponse> => {
    const res = await apiClient.put<ApiResponse<MealOrderResponse>>(`/fnb/orders/mine/${orderId}/daily-meal`, request);
    return unwrapResponse(res);
  },

  // ==========================================================================
  // 3. Kitchen Operations (KDS & Chef)
  // ==========================================================================

  /**
   * Retrieves daily kitchen preparation queue with masked medical data.
   */
  getKitchenOrders: async (date?: string): Promise<KitchenOrderResponse[]> => {
    const res = await apiClient.get<ApiResponse<KitchenOrderResponse[]>>('/fnb/orders', {
      params: date ? { date } : undefined,
    });
    return unwrapResponse(res);
  },

  getKitchenOrderById: async (orderId: number | string): Promise<KitchenOrderResponse> => {
    const numericId = parseInt(String(orderId).replace(/\D/g, ''), 10);
    const res = await apiClient.get<ApiResponse<KitchenOrderResponse>>(`/fnb/orders/${numericId}`);
    return unwrapResponse(res);
  },

  /**
   * Updates overall order status (e.g., READY -> DELIVERED).
   */
  updateOrderStatus: async (orderId: number, status: string): Promise<KitchenOrderResponse> => {
    const res = await apiClient.patch<ApiResponse<KitchenOrderResponse>>(`/fnb/orders/${orderId}/status`, {
      status,
    });
    return unwrapResponse(res);
  },

  /**
   * Updates individual line preparation status (PENDING -> PREPARING -> READY).
   * Transitioning to READY triggers backend FEFO stock deduction atomically.
   */
  updateLinePreparationStatus: async (
    orderId: number,
    orderLineId: number,
    status: 'PENDING' | 'PREPARING' | 'READY'
  ): Promise<KitchenOrderResponse> => {
    const res = await apiClient.patch<ApiResponse<KitchenOrderResponse>>(
      `/fnb/orders/${orderId}/items/${orderLineId}/preparation-status`,
      { status }
    );
    return unwrapResponse(res);
  },

  // ==========================================================================
  // 4. Inventory & Batches
  // ==========================================================================

  getIngredients: async (): Promise<IngredientResponse[]> => {
    const res = await apiClient.get<ApiResponse<IngredientResponse[]>>('/fnb/ingredients');
    return unwrapResponse(res);
  },

  createIngredient: async (request: CreateIngredientRequest): Promise<IngredientResponse> => {
    const res = await apiClient.post<ApiResponse<IngredientResponse>>('/fnb/ingredients', request);
    return unwrapResponse(res);
  },

  getBatches: async (ingredientId?: number, asOfDate?: string): Promise<IngredientBatchResponse[]> => {
    const res = await apiClient.get<ApiResponse<IngredientBatchResponse[]>>('/fnb/inventory/batches', {
      params: { ingredientId, asOfDate },
    });
    return unwrapResponse(res);
  },

  receiveBatch: async (request: CreateIngredientBatchRequest): Promise<IngredientBatchResponse> => {
    const res = await apiClient.post<ApiResponse<IngredientBatchResponse>>('/fnb/inventory/batches', request);
    return unwrapResponse(res);
  },

  updateBatchCondition: async (batchId: number, condition: string): Promise<IngredientBatchResponse> => {
    const res = await apiClient.patch<ApiResponse<IngredientBatchResponse>>(
      `/fnb/inventory/batches/${batchId}/condition`,
      { condition }
    );
    return unwrapResponse(res);
  },

  // ==========================================================================
  // 5. Operations Dashboard
  // ==========================================================================

  /**
   * Fetches high-level culinary metrics, order counts, and aggregated ingredient demand/shortfall.
   */
  getDashboard: async (date?: string): Promise<FnbDashboardResponse> => {
    const res = await apiClient.get<ApiResponse<FnbDashboardResponse>>('/fnb/dashboard', {
      params: date ? { date } : undefined,
    });
    const unwrapped = unwrapResponse(res);
    if (unwrapped && unwrapped.ingredientDemand) {
      unwrapped.ingredientDemand = unwrapped.ingredientDemand.map((d: any) => ({
        ...d,
        status: d.status || d.alert || (d.shortfall > 0 ? 'SHORTAGE' : 'COVERED'),
      }));
    }
    return unwrapped;
  },

  // ==========================================================================
  // 6. Retreat Package F&B Plans & Culinary Safety
  // ==========================================================================

  getPackagePlans: async (): Promise<RetreatPackageFnbPlanResponse[]> => {
    const res = await apiClient.get<ApiResponse<RetreatPackageFnbPlanResponse[]>>('/fnb/packages');
    return unwrapResponse(res);
  },

  getPackagePlanByCode: async (packageCode: string): Promise<RetreatPackageFnbPlanResponse> => {
    const res = await apiClient.get<ApiResponse<RetreatPackageFnbPlanResponse>>(`/fnb/packages/${packageCode}`);
    return unwrapResponse(res);
  },

  getActiveBookingPackagePlan: async (bookingId?: number): Promise<RetreatPackageFnbPlanResponse> => {
    const res = await apiClient.get<ApiResponse<RetreatPackageFnbPlanResponse>>('/fnb/packages/active-booking', {
      params: bookingId ? { bookingId } : undefined,
    });
    return unwrapResponse(res);
  },

  checkPackageSafety: async (packageCode: string, itemName: string, allergenInfo?: string): Promise<string[]> => {
    const res = await apiClient.get<ApiResponse<string[]>>(`/fnb/packages/${packageCode}/safety-check`, {
      params: { itemName, allergenInfo },
    });
    return unwrapResponse(res);
  },

  // ==========================================================================
  // KDS & Customer Helper Endpoints
  // ==========================================================================
// Public / Customer Menu
  getMenuItems: async (category?: string, mealPeriod?: string): Promise<MenuItemBackendDto[]> => {
    const res = await apiClient.get<ApiResponse<MenuItemBackendDto[]>>('/fnb/customer/menu-items', {
      params: { category, mealPeriod },
    });
    return res.data;
  },

  // Daily Meal Order
  createDailyMealOrder: async (payload: CreateDailyMealPayload): Promise<MealOrderBackendDto> => {
    const body = buildDailyMealOrderPayload(payload);
    const res = await apiClient.post<ApiResponse<MealOrderBackendDto>>('/fnb/customer/daily-meals', body);
    return res.data;
  },

  // A-la-carte Order
  createAlaCarteOrder: async (payload: CreateAlaCartePayload): Promise<MealOrderBackendDto> => {
    const body = buildAlaCarteOrderPayload(payload);
    const res = await apiClient.post<ApiResponse<MealOrderBackendDto>>('/fnb/customer/a-la-carte', body);
    return res.data;
  },

  // Customer Orders Query
  getCustomerOrders: async (bookingId: number): Promise<MealOrderBackendDto[]> => {
    const res = await apiClient.get<ApiResponse<MealOrderBackendDto[]>>('/fnb/customer/orders', {
      params: { bookingId },
    });
    return res.data;
  },

  // Customer Cancel Order
  cancelCustomerOrder: async (orderId: number, cancellationReason?: string): Promise<MealOrderBackendDto> => {
    const body = buildCancelOrderPayload(cancellationReason, 'Customer cancelled');
    const res = await apiClient.post<ApiResponse<MealOrderBackendDto>>(`/fnb/customer/orders/${orderId}/cancel`, body);
    return res.data;
  },

  // Staff KDS Dashboard KPIs
  getKdsDashboardKpis: async (date?: string): Promise<KdsDashboardKpiBackendDto> => {
    const res = await apiClient.get<ApiResponse<KdsDashboardKpiBackendDto>>('/fnb/kds/dashboard-kpis', {
      params: { date },
    });
    return res.data;
  },

  // Staff KDS Queue
  getKdsQueue: async (params?: {
    date?: string;
    type?: string;
    status?: string;
    dietaryOnly?: boolean;
    search?: string;
  }): Promise<MealPrepEntryBackendDto[]> => {
    const res = await apiClient.get<ApiResponse<MealPrepEntryBackendDto[]>>('/fnb/kds/queue', {
      params: {
        date: params?.date,
        type: params?.type,
        status: params?.status,
        dietaryOnly: params?.dietaryOnly,
        search: params?.search,
      },
    });
    return res.data;
  },

  // Staff KDS Order Detail
  getKdsOrderDetail: async (orderId: number): Promise<MealPrepEntryBackendDto> => {
    const res = await apiClient.get<ApiResponse<MealPrepEntryBackendDto>>(`/fnb/kds/orders/${orderId}`);
    return res.data;
  },

  // Staff Update Order Status
  updateKdsOrderStatus: async (
    orderId: number,
    status: string,
    cancellationReason?: string
  ): Promise<MealOrderBackendDto> => {
    const res = await apiClient.patch<ApiResponse<MealOrderBackendDto>>(`/fnb/kds/orders/${orderId}/status`, {
      status,
      cancellationReason,
    });
    return res.data;
  },

  // Staff Cancel Order
  cancelKdsOrder: async (orderId: number, cancellationReason: string): Promise<MealOrderBackendDto> => {
    const body = buildCancelOrderPayload(cancellationReason, 'Cancelled by staff');
    const res = await apiClient.post<ApiResponse<MealOrderBackendDto>>(`/fnb/kds/orders/${orderId}/cancel`, body);
    return res.data;
  },
};
