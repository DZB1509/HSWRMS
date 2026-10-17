# HƯỚNG DẪN PHÁT TRIỂN FRONTEND MODULE 4: DIETARY F&B MANAGEMENT

## (M4 FRONTEND ARCHITECTURE & DEVELOPMENT IMPLEMENTATION GUIDE)

> **Dự án:** HEAVENSTAY WELLNESS RESORT MANAGEMENT SYSTEM (HSWRMS)  
> **Phân hệ:** Module 4 — Dietary F&B Management (Screens 34–40)  
> **Vị trí mã nguồn Frontend:** `05_Development/frontend/`  
> **Thư mục tính năng:** `05_Development/frontend/src/features/m4-fnb/`  
> **Tiêu chuẩn thiết kế:** `03_Design/UI_UX/HSWRMS_DESIGN.md` (Amanoi Luxury Wellness Theme)  
> **Quy chuẩn mã nguồn:** `03_Design/Coding-Convention.md` & ISO/IEC 25010

---

## 1. PHÂN TÍCH CẤU TRÚC HIỆN TẠI CỦA FRONTEND (`05_Development/frontend`)

Dự án Frontend được xây dựng dựa trên ngăn xếp công nghệ hiện đại được chốt tại **ADR-02**:

- **Core:** React 19 (`19.2.8`), TypeScript (`~6.0.2`), Vite 8 (`8.3.0`).
- **Router:** `react-router-dom` 7 (`7.18.4`) với cấu hình phân tầng layout và role guard tại `src/app/router/index.tsx`.
- **Icons & Animation:** `lucide-react` (`1.48.0`), `gsap` (`3.15.0`), `lenis` (`1.3.26`).
- **Đa ngôn ngữ (i18n):** `i18next` (`26.4.2`) hỗ trợ 5 ngôn ngữ (`vi`, `en`, `zh-CN`, `ja`, `fr`).
- **Styling:** Vanilla CSS với CSS Custom Properties kế thừa token chuẩn resort sang trọng (`src/styles/globals.css`, `layouts.css`, `components.css`, `dining.css`).
- _(Lưu ý: Thư mục `dist/` và `node_modules/` là artifact build và thư viện ngoài, không chỉnh sửa trực tiếp)._

### Sơ đồ cấu trúc thư mục Frontend:

```
05_Development/frontend/src/
├── api/
│   ├── client/apiClient.ts        # Fetch client chuẩn, tự động gắn JWT Bearer token và xử lý AppApiError
│   └── errors/apiError.ts         # Khung lỗi chuẩn ApiError đồng bộ với GlobalExceptionHandler backend
├── app/
│   ├── layouts/                   # CustomerLayout, OperationalLayout, ManagerAdminLayout, PublicLayout
│   └── router/
│       ├── guards/RoleGuard.tsx   # Bảo vệ route theo quyền ('customer', 'fb_staff', 'receptionist', v.v.)
│       └── index.tsx              # Định nghĩa toàn bộ 56 route của hệ thống
├── components/
│   ├── common/                    # Toast, FoodImage, DevHealthIndicator, Modal, Button
│   └── dining/DietaryBadgeList.tsx# Component hiển thị badge dị ứng/ăn kiêng
├── context/
│   └── DiningContext.tsx          # Context giả lập (Mock) ban đầu cho F&B (cần nâng cấp kết nối API thật)
├── features/
│   └── m4-fnb/                    # [MODULE 4 CORE FOLDER]
│       ├── api/fnbApi.ts          # REST client gọi backend Spring Boot (/api/v1/fnb)
│       ├── types/fnbDto.ts        # DTO TypeScript đồng bộ 100% với Spring Boot backend
│       ├── components/            # Các UI component độc lập của F&B (DishCard, KdsOrderCard, BatchModal)
│       └── hooks/                 # Custom React hooks (useMenu, useMealOrders, useKdsQueue)
├── pages/
│   ├── customer/                  # Giao diện khách hàng (Screens 34 - 37)
│   └── fb/                        # Giao diện Bếp/F&B Staff (Screens 38 - 40)
└── styles/dining.css              # Style dành riêng cho F&B (KDS card, Dietary chips, Demand table)
```

---

## 2. MA TRẬN 7 MÀN HÌNH MODULE 4 (SCREENS 34–40) & ĐẦU MỐI API BACKEND

| Screen # | Tên Màn Hình & Route                                   | Đối Tượng (Role) | Chức Năng Nghiệp Vụ Chính                                                                                 | API Backend Tương Ứng                                                                                       |
| :------: | :----------------------------------------------------- | :--------------: | :-------------------------------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| **S34**  | **Dietary Menu**<br>`/customer/dining/menu`            | `ROLE_CUSTOMER`  | Xem thực đơn đã lọc bỏ món chứa allergen theo hồ sơ sức khỏe (`BR-FNB-01`).                               | `GET /api/v1/fnb/menu`<br>`GET /api/v1/fnb/menu/availability`                                               |
| **S35**  | **Daily Meal Selection**<br>`/customer/dining/select`  | `ROLE_CUSTOMER`  | Đặt bữa ăn trong gói tiêu chuẩn ($0) cho ngày lưu trú; chỉ cho phép 1 suất/buổi/ngày.                     | `POST /api/v1/fnb/orders/daily-meals`<br>`PUT /api/v1/fnb/orders/mine/{id}/daily-meal`                      |
| **S36**  | **Extra A-la-carte Order**<br>`/customer/dining/extra` | `ROLE_CUSTOMER`  | Đặt món tính phí phụ trội; hệ thống tự động ghi nhận charge vào Folio (Module 5).                         | `POST /api/v1/fnb/orders/ala-carte`                                                                         |
| **S37**  | **My Meal Plan / Orders**<br>`/customer/dining/orders` | `ROLE_CUSTOMER`  | Khách theo dõi các bữa ăn đã đặt, món gọi thêm và trạng thái chế biến thời gian thực.                     | `GET /api/v1/fnb/orders/mine?bookingId={id}`<br>`GET /api/v1/fnb/orders/mine/{id}`                          |
| **S38**  | **F&B Kitchen Dashboard**<br>`/fb/dashboard`           | `ROLE_F&B STAFF` | Bảng điều khiển vận hành Bếp: Thống kê đơn, cảnh báo thiếu hụt nguyên liệu (Shortage), khả dụng thực đơn. | `GET /api/v1/fnb/dashboard?date={date}`                                                                     |
| **S39**  | **Daily Meal Prep List (KDS)**<br>`/fb/meal-prep`      | `ROLE_F&B STAFF` | Danh sách hàng chờ chế biến trong ngày; hiển thị cảnh báo dị ứng, Villa No.; mask bệnh án (`BR-FNB-02`).  | `GET /api/v1/fnb/orders?date={date}`                                                                        |
| **S40**  | **Meal Order Detail**<br>`/fb/orders/:id`              | `ROLE_F&B STAFF` | Chi tiết đơn ăn: Đổi trạng thái từng món (`PENDING` → `PREPARING` → `READY`); tự động trừ kho FEFO.       | `PATCH /api/v1/fnb/orders/{id}/items/{lineId}/preparation-status`<br>`PATCH /api/v1/fnb/orders/{id}/status` |

---

## 3. CHI TIẾT TỪNG BƯỚC TRIỂN KHAI FRONTEND

### Bước 1: Cấu trúc DTO & API Client (Đã sẵn sàng)

Các file giao tiếp đã được khởi tạo chuẩn chỉnh:

- **`src/features/m4-fnb/types/fnbDto.ts`**: Chứa toàn bộ định nghĩa TypeScript của DTO backend (`MenuItemResponse`, `KitchenOrderResponse`, `FnbDashboardResponse`, v.v.).
- **`src/features/m4-fnb/api/fnbApi.ts`**: Cung cấp service gọi API có kiểu dữ liệu mạnh thông qua `apiClient`.

### Bước 2: Xây dựng Custom Hooks (`src/features/m4-fnb/hooks/`)

#### 1. Hook lấy thực đơn cá nhân hóa (`usePersonalizedMenu.ts`):

```typescript
import { useState, useEffect } from "react";
import { fnbApi } from "../api/fnbApi";
import type { MenuItemResponse } from "../types/fnbDto";

export const usePersonalizedMenu = (asOfDate?: string) => {
  const [menu, setMenu] = useState<MenuItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fnbApi
      .getMenu(asOfDate)
      .then((data) => {
        if (mounted) {
          setMenu(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (mounted) setError(err.message || "Failed to load menu");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [asOfDate]);

  return {
    menu,
    loading,
    error,
    refetch: () => fnbApi.getMenu(asOfDate).then(setMenu),
  };
};
```

#### 2. Hook cho Bếp / KDS (`useKitchenOrders.ts`):

Hỗ trợ tự động làm mới (Auto-polling mỗi 15-30 giây) để Bếp nhận đơn mới ngay lập tức:

```typescript
import { useState, useEffect, useCallback } from "react";
import { fnbApi } from "../api/fnbApi";
import type { KitchenOrderResponse } from "../types/fnbDto";

export const useKitchenOrders = (selectedDate: string) => {
  const [orders, setOrders] = useState<KitchenOrderResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await fnbApi.getKitchenOrders(selectedDate);
      setOrders(data);
    } catch (err) {
      console.error("KDS queue fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 20000); // 20s polling
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateItemStatus = async (
    orderId: number,
    lineId: number,
    status: "PENDING" | "PREPARING" | "READY",
  ) => {
    const updatedOrder = await fnbApi.updateLinePreparationStatus(
      orderId,
      lineId,
      status,
    );
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
  };

  const deliverOrder = async (orderId: number) => {
    const updated = await fnbApi.updateOrderStatus(orderId, "DELIVERED");
    setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
  };

  return {
    orders,
    loading,
    refetch: fetchOrders,
    updateItemStatus,
    deliverOrder,
  };
};
```

### Bước 3: Nâng cấp Màn hình Khách hàng (Screens 34–37)

1. **`DietaryMenuPage.tsx` (Screen 34):**
   - Thay thế việc đọc từ context tĩnh `menuItems` bằng hook `usePersonalizedMenu()`.
   - Hiển thị nhãn `servingsAvailable` (ví dụ: "Chỉ còn 3 suất").
   - Hiển thị badge cảnh báo dị ứng mềm mại nếu có chất cần lưu ý (`allergenWarning`).

2. **`DailyMealSelectionPage.tsx` (Screen 35):**
   - Lấy `activeBookingId` từ `useCustomer()`.
   - Khi bấm "Confirm Meal Selection", gọi `fnbApi.placeDailyMealOrder({...})`.
   - Bắt lỗi `DAILY_MEAL_ALREADY_SELECTED`: Hiển thị Toast thông báo khách đã chọn bữa này rồi, chuyển nút sang "Update Selection" (`fnbApi.updateDailyMealSelection`).

3. **`AlaCarteOrderPage.tsx` (Screen 36):**
   - Giỏ hàng phụ thu: Tính `Total Amount` theo giá niêm yết của từng món.
   - Khi xác nhận đặt: Hiển thị hộp thoại cảnh báo: _"Khoản phụ thu này sẽ được ghi nhận vào Folio phòng của quý khách và thanh toán khi làm thủ tục Checkout."_
   - Gọi `fnbApi.placeAlaCarteOrder({...})`.

4. **`MyMealPlanPage.tsx` (Screen 37):**
   - Gọi `fnbApi.getMyOrders(bookingId)`.
   - Phân loại tab: "Bữa ăn theo gói" (`DAILY_MEAL`) vs "Món gọi thêm" (`A_LA_CARTE`).
   - Hiển thị trạng thái chế biến theo thời gian thực: `PENDING` (Chờ xử lý) → `PREPARING` (Đang nấu) → `READY` (Sẵn sàng) → `DELIVERED` (Đã giao).

### Bước 4: Nâng cấp Màn hình Vận hành Bếp (Screens 38–40)

1. **`FnbDashboardPage.tsx` (Screen 38):**
   - Gọi `fnbApi.getDashboard(selectedDate)`.
   - Hiển thị 4 thẻ KPI: Tổng đơn gói (`retreatMealOrders`), Đơn A-la-carte (`alaCarteOrders`), Đang chờ (`pendingOrders`), Đang nấu (`preparingOrders`).
   - Bảng **Cảnh báo nhu cầu nguyên liệu (`ingredientDemand`)**:
     - Cột: Tên nguyên liệu, Nhu cầu cần nấu, Tồn kho khả dụng, Thiếu hụt (`shortfall`), Đơn vị tính (`unitOfMeasure`), Trạng thái badge (`SHORTAGE` màu đỏ cam, `COVERED` màu xanh olive).

2. **`MealPrepListPage.tsx` (Screen 39 - KDS):**
   - Sử dụng hook `useKitchenOrders(selectedDate)`.
   - Hiển thị Card đơn ăn:
     - Header: Số Villa (ví dụ: "Villa 102"), Tên khách ("Eleanor"), Giờ yêu cầu/Buổi ăn.
     - **Vùng cảnh báo dị ứng nổi bật (Allergy Alert Banner):** Viền đỏ/vàng cảnh báo dị ứng thực phẩm (`allergyTags`).
     - **Bảo mật PII (`BR-FNB-02`):** Tuyệt đối **không hiển thị** bất kỳ trường bệnh lý hoặc ghi chú điều trị y tế nào trên màn hình này.
   - Nút hành động nhanh cho từng món: `[Bắt đầu nấu (PREPARING)]` và `[Nấu xong (READY)]`.

3. **`MealOrderDetailPage.tsx` (Screen 40):**
   - Hiển thị chi tiết từng dòng nguyên vật liệu trong công thức (nếu cần xem).
   - Khi bấm `[READY]` cho món cuối cùng, hiển thị nút `[Giao cho khách (DELIVERED)]`.

---

## 4. QUY TẮC BẢO MẬT & TRẢI NGHIỆM NGƯỜI DÙNG (UI/UX COMPLIANCE)

1. **Role-Based Guards (RBAC):**
   - Các trang `/customer/dining/*` bắt buộc bọc trong `<RoleGuard allowedRoles={['customer']}>`.
   - Các trang `/fb/*` bắt buộc bọc trong `<RoleGuard allowedRoles={['fb_staff']}>`.
2. **Tuân thủ thiết kế Amanoi Luxury Wellness:**
   - Màu sắc chủ đạo: Nền tối/sang trọng `var(--bg-primary)`, màu be `var(--accent-sand)`, màu xanh olive thảo mộc `var(--accent-olive)`.
   - Tránh dùng màu sắc chói lọi; thẻ cảnh báo dị ứng dùng màu đỏ đất/cam gạch ấm áp (`#c85a48` hoặc `#d97706`).
3. **Đa ngôn ngữ 100%:**
   - Mọi chuỗi giao diện, tên buổi ăn (`Breakfast`, `Lunch`, `Dinner`), tình trạng đơn (`Pending`, `Preparing`, `Ready`, `Delivered`) phải dùng qua `useTranslation(['customer', 'operations'])`.

---

## 5. KẾ HOẠCH BÀN GIAO & CHECKLIST KIỂM THỬ CHO DEVELOPER

- [ ] `npm run build` hoặc `cmd /c npx tsc --noEmit` chạy sạch sẽ (0 TypeScript error).
- [ ] Đăng nhập tài khoản Customer: Xem menu được lọc đúng dị ứng khai báo trong hồ sơ sức khỏe.
- [ ] Đặt bữa ăn tiêu chuẩn: Kiểm tra giá $0 và không bị trùng bữa cùng ngày.
- [ ] Đặt món a-la-carte: Kiểm tra tính đúng đơn giá và bắn event sang Module 5.
- [ ] Đăng nhập tài khoản Bếp (`ROLE_F&B STAFF`): Xem KDS chỉ thấy Villa No., tên khách và dị ứng thực phẩm (không có bệnh án).
- [ ] Chuyển trạng thái món sang `READY`: Kho nguyên liệu tự động trừ theo nguyên tắc FEFO.
- [ ] Dashboard Bếp hiển thị đúng số lượng thiếu hụt nguyên liệu theo đơn vị tính (`g`, `ml`, `piece`).
