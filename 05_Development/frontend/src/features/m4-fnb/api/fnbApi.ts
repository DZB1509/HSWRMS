import { apiClient } from '../../../api/client/apiClient';
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
    return unwrapResponse(res);
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
};
