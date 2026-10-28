import { apiClient } from '../../../api/client/apiClient';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  timestamp?: string;
}

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
  specialNotes?: string;
}

export interface MealOrderBackendDto {
  mealOrderId: number;
  bookingId: number;
  orderType: string;
  orderDate: string;
  deliveryTime?: string;
  deliveryLocation?: string;
  orderStatus: string;
  totalAmount: number;
  specialNotes?: string;
  items: MealOrderItemBackendDto[];
  createdAt: string;
  updatedAt?: string;
}

export interface MealPrepEntryBackendDto {
  id: string;
  rawMealOrderId: number;
  type: 'retreat_meal' | 'a_la_carte';
  date: string;
  targetTime?: string;
  mealPeriod?: string;
  customerName: string;
  villaNumber?: string;
  items: {
    menuItemId: string;
    itemName: string;
    quantity: number;
    notes?: string;
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
  bookingId: number;
  orderDate: string;
  mealPeriod: string;
  menuItemIds: number[];
  specialNotes?: string;
}

export interface CreateAlaCartePayload {
  bookingId: number;
  orderDate?: string;
  deliveryTime?: string;
  deliveryLocation?: string;
  items: {
    menuItemId: number;
    quantity: number;
    specialNotes?: string;
  }[];
}

export const fnbApi = {
  // Public / Customer Menu
  getMenuItems: async (category?: string, mealPeriod?: string): Promise<MenuItemBackendDto[]> => {
    const res = await apiClient.get<ApiResponse<MenuItemBackendDto[]>>('/fnb/customer/menu-items', {
      params: { category, mealPeriod },
    });
    return res.data;
  },

  // Daily Meal Order
  createDailyMealOrder: async (payload: CreateDailyMealPayload): Promise<MealOrderBackendDto> => {
    const res = await apiClient.post<ApiResponse<MealOrderBackendDto>>('/fnb/customer/daily-meals', payload);
    return res.data;
  },

  // A-la-carte Order
  createAlaCarteOrder: async (payload: CreateAlaCartePayload): Promise<MealOrderBackendDto> => {
    const res = await apiClient.post<ApiResponse<MealOrderBackendDto>>('/fnb/customer/a-la-carte', payload);
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
  cancelCustomerOrder: async (orderId: number, reason?: string): Promise<MealOrderBackendDto> => {
    const res = await apiClient.post<ApiResponse<MealOrderBackendDto>>(`/fnb/customer/orders/${orderId}/cancel`, {
      reason,
    });
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
  cancelKdsOrder: async (orderId: number, reason: string): Promise<MealOrderBackendDto> => {
    const res = await apiClient.post<ApiResponse<MealOrderBackendDto>>(`/fnb/kds/orders/${orderId}/cancel`, {
      reason,
    });
    return res.data;
  },
};
