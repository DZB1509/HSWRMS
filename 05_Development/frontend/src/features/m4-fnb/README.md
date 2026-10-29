# Module 4: Dietary F&B Management (Frontend Feature)

> **Location:** `05_Development/frontend/src/features/m4-fnb/`  
> **Master Guide:** Refer to [`05_Development/docs/M4_FRONTEND_DEVELOPMENT_GUIDE.md`](file:///e:/fal26-isp392-is2005-g1/05_Development/docs/M4_FRONTEND_DEVELOPMENT_GUIDE.md)

---

## 1. Directory Structure

* **`api/fnbApi.ts`**: Typed REST API client communicating with backend `/api/v1/fnb` endpoints.
* **`types/fnbDto.ts`**: Complete TypeScript contracts matching Spring Boot DTOs and API envelopes.
* **`components/`**: Reusable F&B UI components (DishCard, KdsOrderCard, IngredientDemandTable, BatchModal).
* **`hooks/`**: Custom hooks (`usePersonalizedMenu`, `useKitchenOrders`, `useFnbDashboard`).

---

## 2. Screen Coverage (Screens 34–40)

### Customer Screens
* **Screen 34 (`/customer/dining/menu`):** Dietary Menu (personalized & allergy-filtered via `fnbApi.getMenu()`).
* **Screen 35 (`/customer/dining/select`):** Daily Meal Selection (in-package meals via `fnbApi.placeDailyMealOrder()`).
* **Screen 36 (`/customer/dining/extra`):** Extra A-la-carte Ordering (priced meals via `fnbApi.placeAlaCarteOrder()`).
* **Screen 37 (`/customer/dining/orders`):** My Meal Plan & Live Order Status (`fnbApi.getMyOrders()`).

### Operational Screens (Chef / F&B Staff)
* **Screen 38 (`/fb/dashboard`):** F&B Operations Dashboard (`fnbApi.getDashboard()`).
* **Screen 39 (`/fb/meal-prep`):** Kitchen Display System (KDS) queue (`fnbApi.getKitchenOrders()`).
* **Screen 40 (`/fb/orders/:id`):** Meal Order Detail & FEFO Line Fulfillment (`fnbApi.updateLinePreparationStatus()`).

---

## 3. Important Implementation Rules

1. **RBAC Protection:** Customer routes require `ROLE_CUSTOMER`; Operational routes require `ROLE_F&B STAFF`.
2. **Health PII Masking (`BR-FNB-02`):** Kitchen displays only show food allergies, dietary preferences, guest first name, and villa number. Diagnosis notes and treatment notes are strictly masked.
3. **FEFO Real-time Deduction:** Marking a line `READY` atomically triggers FEFO inventory deduction in the backend.
4. **Allergy-Safe Menu (`BR-FNB-01`):** The customer menu never displays items that conflict with the customer's declared allergens.
