# HƯỚNG DẪN HOÀN THIỆN FLOW NGHIỆP VỤ MODULE 4 (DIETARY F&B MANAGEMENT)

> **Dự án:** HEAVENSTAY WELLNESS RESORT MANAGEMENT SYSTEM (HSWRMS)  
> **Phân hệ:** Module 4 — Dietary F&B Management (M4)  
> **Vị trí lưu trữ:** `04_Implement/HUONG_DAN_HOAN_THIEN_FLOW_MODULE_4.md`  
> **Nguồn chuẩn đối chiếu:**  
> - SRS Ver2 (Mục 2.4 — BF-04 & UC16–UC20)  
> - Luồng nghiệp vụ: `02_Requirement/HSWRMS_BF04_MainFlow_Module4.md` & `03_Design/Diagram/2_Business flow/04-Personalized Dining & F&B Service Fulfillment.png`  
> - Mô hình dữ liệu: `03_Design/Diagram/3_Data model\Master-Conceptual-ERD.png` & `05_Development/database/schema.sql`  
> - Đặc tả UI/UX: `03_Design/UI_UX/HSWRMS_Web_UI_Demo_Master_Summary.pdf` (Screens S34–S40)  
> - Không gian mã nguồn: `05_Development/` (theo `05_Development/README.md`)

---

## 1. TỔNG QUAN VÀ MỤC TIÊU CỐT LÕI

Tài liệu này cung cấp kế hoạch và bản hướng dẫn kỹ thuật chi tiết nhằm hoàn thiện toàn diện luồng nghiệp vụ **BF-04 (Personalized Dining & F&B Service Fulfillment)** xuyên suốt từ Cơ sở dữ liệu (Database), Tầng dịch vụ nghiệp vụ (Backend Spring Boot), Tương tác API (RESTful) đến Giao diện người dùng (Frontend React 19).

### 1.1. Mục tiêu Nghiệp vụ
1. **Lọc thực đơn an toàn dị ứng (`BR-FNB-01`)**: Tự động loại bỏ các món ăn xung đột với dị ứng đã khai báo của khách hàng.
2. **Che giấu dữ liệu bệnh án nhạy cảm (`BR-FNB-02` / Nghị định 13/2023 & 356/2025/NĐ-CP)**: Nhân viên bếp chỉ nhìn thấy dị ứng thực phẩm và số Villa, tuyệt đối không thấy bệnh án tổng quát hay hạn chế thể chất.
3. **Quản lý vòng đời đơn ăn (`BR-FNB-03`)**: Vận hành chính xác trạng thái từ `PENDING` $\rightarrow$ `PREPARING` $\rightarrow$ `READY` $\rightarrow$ `DELIVERED`.
4. **Hạch toán phụ thu Folio tự động (`BR-FNB-04` / OI-01)**: Món gọi thêm ngoài gói (A-la-carte) tự động bắn Domain Event sang Module 5 Folio mà không can thiệp trực tiếp vào DB của M5.
5. **Trừ kho nguyên liệu theo FEFO (First-Expired, First-Out)**: Nhân tỷ lệ định mức $Q = \text{required\_quantity} \times \text{servings}$ và khấu trừ ưu tiên trên các lô sắp hết hạn còn dùng được.

---

## 2. KIẾN TRÚC DỮ LIỆU & ÁNH XẠ DATABASE (`schema.sql`)

Mô hình dữ liệu M4 bao gồm 6 bảng thực thể đồng bộ 100% giữa `schema.sql`, `Master-Conceptual-ERD.png` và JPA Entity:

```
[RETREAT_BOOKING] (M2)
        │ 1:N
        ▼
   [MEAL_ORDER] ── 1:N ──► [MEAL_ORDER_ITEM] ── N:1 ──► [MENU_ITEM]
        │                       │                             │ 1:N
   (Domain Event M5)       (unit_price,                       ▼
   AlaCarteOrderPlaced  preparation_status)         [MENU_ITEM_INGREDIENT]
                                                              │ N:1
                                                              ▼
                                                        [INGREDIENT]
                                                              │ 1:N
                                                              ▼
                                                     [INGREDIENT_BATCH]
```

### 2.1. Cấu trúc Bảng & Entity Tương Ứng

| Tên Bảng SQL | Entity Java (`com.heavenstay.hswrms.m4fnb.entity`) | Thuộc tính & Ràng buộc cốt lõi |
| :--- | :--- | :--- |
| `dbo.MenuItem` | `MenuItem.java` | `menu_item_id` (PK), `item_name`, `price`, `dietary_tags`, `allergen_information`, `availability_status` (`AVAILABLE` / `UNAVAILABLE`). |
| `dbo.Ingredient` | `Ingredient.java` | `ingredient_id` (PK), `ingredient_name` (Unique). |
| `dbo.MenuItemIngredient` | `MenuItemIngredient.java` | Khóa chính phức hợp `(menu_item_id, ingredient_id)`, định mức `required_quantity` (DECIMAL 18,3). |
| `dbo.IngredientBatch` | `IngredientBatch.java` | `ingredient_batch_id` (PK), `ingredient_id` (FK), `received_date`, `expiration_date`, `remaining_quantity`, `stock_condition` (`FRESH`, `GOOD`, `NEAR_EXPIRY`, `HOLD`, `EXPIRED`, `DISCARDED`). |
| `dbo.MealOrder` | `MealOrder.java` | `meal_order_id` (PK), `retreat_booking_id`, `order_date`, `meal_type` (Sáng/Trưa/Tối), `order_type` (`DAILY_MEAL`, `A_LA_CARTE`), `order_status` (`PENDING`, `PREPARING`, `READY`, `DELIVERED`, `CANCELLED`), `special_notes`. |
| `dbo.MealOrderItem` | `MealOrderItem.java` | `meal_order_item_id` (PK), `meal_order_id` (FK), `menu_item_id` (FK), `quantity`, `unit_price`, `preparation_status` (`PENDING`, `PREPARING`, `READY`). |

---

## 3. HƯỚNG DẪN THỰC THI CHI TIẾT THEO 4 PHA CỦA LUỒNG BF-04

```
+----------------------------------------------------------------------------------------------------------+
|                    BF-04: PERSONALIZED DINING & F&B SERVICE FULFILLMENT                                 |
+----------------------------------------------------------------------------------------------------------+
|  [PHASE A: Quản lý Kho]     [PHASE B: Đặt Bữa Gói]       [PHASE C: Đặt A-la-carte]     [PHASE D: Chế biến]       |
|  - Batch Expiry/Condition   - Lọc Dị ứng (BR-FNB-01)     - Đơn giá > $0                - KDS Queue (S38-S40)     |
|  - Tự tính khả dụng món     - $0 / bữa trong gói         - Bắn Event sang M5 (OI-01)   - Mask bệnh án (BR-FNB-02)|
|  - Trừ kho FEFO             - 1 suất / buổi / ngày       - Khóa thanh toán tại M5      - Trừ kho theo công thức  |
+----------------------------------------------------------------------------------------------------------+
```

### 3.1. Phase A: F&B Staff Quản Lý Lô Nguyên Liệu & Tính Khả Dụng Thực Đơn (UC16)

#### Mục tiêu
Duy trì tồn kho chính xác và tự động cập nhật khả năng phục vụ của từng món ăn trên menu theo thời gian thực.

#### Luồng xử lý kỹ thuật
1. **Tiếp nhận & Cập nhật Lô hàng**:
   - Gọi `POST /api/v1/fnb/inventory/batches` qua `IngredientController.java`.
   - `InventoryService.receiveBatch()` xác thực ngày hết hạn không được trước ngày nhận (`expirationDate >= receivedDate`).
   - Chuẩn hóa trạng thái lô: Chỉ các lô có `stockCondition` thuộc `['FRESH', 'GOOD', 'NEAR_EXPIRY']` và `expirationDate >= asOfDate` mới được tính vào tồn kho khả dụng (`getUsableQuantity()`).
2. **Tính toán số suất ăn phục vụ (`servingsAvailable`)**:
   - `MenuService.availability(menuItem, recipeLines, asOfDate)` lặp qua từng nguyên liệu bắt buộc trong công thức:
     $$\text{servings} = \min_{i \in \text{Ingredients}} \left( \left\lfloor \frac{\text{UsableQuantity}(i)}{\text{RequiredQuantity}(i)} \right\rfloor \right)$$
   - Nếu $\text{servings} > 0 \rightarrow$ Món có trạng thái `available = true`. Nếu hết nguyên liệu $\rightarrow$ `available = false`.
3. **Màn hình Frontend liên kết**:
   - **S38 — F&B Kitchen Dashboard (`/fb/dashboard`)**: Thiết kế bố cục 2 cột (Cột trái 65–70% hiển thị bảng nhu cầu nguyên liệu `Ingredient Demand`; Cột phải 30–35% hiển thị cảnh báo thiếu hụt `Inventory Alerts & Shortages`).

---

### 3.2. Phase B: Khách Hàng Xem Thực Đơn Cá Nhân Hóa & Đặt Bữa Trong Gói (UC16 / UC17)

#### Mục tiêu
Khách lưu trú (`ROLE_CUSTOMER`) xem thực đơn đã được lọc an toàn dị ứng và đặt các bữa ăn tiêu chuẩn trong gói nghỉ dưỡng ($0 phụ thu).

#### Luồng xử lý kỹ thuật
1. **Bảo vệ dữ liệu nhạy cảm (PII Minimization)**:
   - Module 4 chỉ giao tiếp qua `DietaryProfilePort.java` để lấy projection rút gọn:
     ```java
     record FoodProfileProjection(List<String> allergies, List<String> dietaryPreferences)
     ```
   - Các trường bệnh lý (`MedicalConditions`) và hạn chế vận động (`PhysicalLimitations`) bị loại trừ hoàn toàn khỏi context của M4.
2. **Lọc thực đơn an toàn (`BR-FNB-01`)**:
   - `MenuController.getPersonalizedMenu()`: Lấy danh sách món khả dụng và đối chiếu `menuItem.allergenInformation` với `profile.allergies`.
   - Nếu có giao thoa $\rightarrow$ Loại bỏ món ăn khỏi danh sách trả về cho khách.
3. **Đặt bữa ăn tiêu chuẩn (`POST /api/v1/fnb/orders/daily-meals`)**:
   - Xác thực điều kiện: Khách đang check-in hợp lệ qua `BookingContextPort.requireEligibleCustomerBooking()`.
   - Ràng buộc trùng lặp: Mỗi buổi (Breakfast / Lunch / Dinner) trên cùng 1 booking và 1 ngày chỉ được chọn duy nhất 1 lần (`DAILY_MEAL_ALREADY_SELECTED`).
   - Đơn giá gán cứng `unitPrice = BigDecimal.ZERO` (bao gồm trong giá gói).
4. **Màn hình Frontend liên kết**:
   - **S34 — Dietary Menu (`/customer/dining/menu`)**: Hiển thị menu cá nhân hóa với typography Cormorant Garamond, badge phân loại dị ứng.
   - **S35 — Daily Meal Selection (`/customer/dining/select`)**: Giao diện chọn món cho từng buổi ăn trong ngày, ghi chú đặc biệt cho đầu bếp.

---

### 3.3. Phase C: Khách Hàng Đặt Món Phụ Thu A-la-carte & Hạch Toán Folio (UC18)

#### Mục tiêu
Khách hàng gọi thêm các món ăn/đồ uống ngoài tiêu chuẩn gói; hệ thống tự động ghi nhận khoản phụ thu vào Folio phòng.

#### Luồng xử lý kỹ thuật
1. **Kiểm tra đơn giá A-la-carte**:
   - `MealOrderController.placeAlaCarteOrder()`: Kiểm tra bắt buộc `menuItem.price > 0`. Nếu giá bằng 0 $\rightarrow$ Ném ngoại lệ `ALA_CARTE_PRICE_REQUIRED`.
2. **Tạo đơn hàng A-la-carte**:
   - Tạo `MealOrder` với `order_type = FnbOrderType.A_LA_CARTE`.
   - Tạo các dòng `MealOrderItem` lưu vết đơn giá thực tế tại thời điểm đặt hàng.
3. **Ranh giới hạch toán liên module (Open Item OI-01)**:
   - Thay vì inject trực tiếp `FolioRepository` của Module 5 (vi phạm ranh giới Clean Monolith), M4 kích hoạt Domain Event:
     ```java
     eventPublisher.publishEvent(new AlaCarteOrderPlacedEvent(
         order.getId(), order.getRetreatBookingId(), response.subtotal(), createdAt
     ));
     ```
   - Module 5 (Billing) lắng nghe sự kiện này và tự động thêm `FOLIO_CHARGE_ITEM` loại `EXTRA_FB`. Khoản phí này sẽ bị khóa cho đến khi hoàn tất thủ tục Checkout (`BR-09`).
4. **Màn hình Frontend liên kết**:
   - **S36 — Extra A-la-carte Order (`/customer/dining/extra`)**: Chọn món tính phí, xác nhận phụ thu tự động vào Folio.
   - **S37 — My Meal Plan / Orders (`/customer/dining/orders`)**: Khách hàng kiểm tra lịch sử bữa ăn và trạng thái chế biến thời gian thực.

---

### 3.4. Phase D: Bộ Phận Bếp Tiếp Nhận, Chế Biến & Trừ Kho FEFO (UC19 / UC20)

#### Mục tiêu
Nhân viên Bếp (`ROLE_F&B STAFF`) xem danh sách đơn ăn cần chế biến, theo dõi cảnh báo dị ứng, thực hiện đổi trạng thái đơn và hệ thống tự động trừ kho nguyên liệu.

#### Luồng xử lý kỹ thuật
1. **Hiển thị hàng chờ chế biến (KDS Queue)**:
   - `GET /api/v1/fnb/orders?orderDate={date}`: Chỉ trả về danh sách đơn của ngày chỉ định, sắp xếp `createdAt DESC`.
   - DTO `KitchenOrderResponse` chỉ hiển thị: `guestFirstName`, `villaNumber`, `allergies`, `dietaryPreferences`, `specialNotes`.
2. **Quy trình chuyển trạng thái & Trừ kho tự động**:
   - Khi Chef chuyển trạng thái đơn từ `PENDING` $\rightarrow$ `PREPARING` (`PATCH /api/v1/fnb/orders/{id}/status`):
     - Hệ thống kích hoạt khóa bi quan (Pessimistic Lock) trên đơn hàng.
     - Với mỗi món ăn, tính toán tổng nhu cầu:
       $$Q = \text{required\_quantity} \times \text{servings}$$
     - `InventoryService.consumeForOrderItem()` tải các lô khả dụng theo thứ tự ngày hết hạn tăng dần (FEFO):
       ```sql
       SELECT b FROM IngredientBatch b 
       WHERE b.ingredientId = :id AND b.expirationDate >= :asOfDate AND b.stockCondition IN :usable
       ORDER BY b.expirationDate ASC
       ```
     - Trừ dần số lượng trên từng lô. Lô nào hết trước trừ trước. Cập nhật `remainingQuantity`.
     - Nếu tổng khả dụng không đủ $\rightarrow$ Ném ngoại lệ `INSUFFICIENT_USABLE_STOCK` để bảo vệ tính toàn vẹn kho.
   - Sau khi hoàn tất chế biến: Chef chuyển sang `READY` $\rightarrow$ Khi phục vụ khách: Chef chuyển sang `DELIVERED`.
3. **Màn hình Frontend liên kết**:
   - **S39 — Daily Meal Prep List (`/fb/meal-prep`)**: KDS hàng chờ chế biến trong ngày resort chuẩn (`2026-09-24`), lọc theo bữa ăn, hiển thị cảnh báo dị ứng nổi bật.
   - **S40 — Meal Order Detail (`/fb/orders/:id`)**: Chi tiết đơn ăn, nút đổi trạng thái từng dòng món, drawer xem tác động nguyên liệu tồn kho (**Ingredient Impact Drawer** theo Section 10.4 của Master Summary).

---

## 4. MA TRẬN 7 MÀN HÌNH MODULE 4 (SCREENS 34–40) & ĐẦU MỐI API

| Screen # | Tên Màn Hình & Route | Quyền (Role) | Chức Năng Nghiệp Vụ Chính | API Backend Liên Kết |
| :---: | :--- | :---: | :--- | :--- |
| **S34** | **Dietary Menu**<br>`/customer/dining/menu` | `ROLE_CUSTOMER` | Xem thực đơn đã lọc bỏ món dị ứng theo hồ sơ sức khỏe (`BR-FNB-01`). | `GET /api/v1/fnb/menu`<br>`GET /api/v1/fnb/menu/availability` |
| **S35** | **Daily Meal Selection**<br>`/customer/dining/select` | `ROLE_CUSTOMER` | Đặt bữa ăn trong gói ($0); giới hạn 1 suất/buổi/ngày; chọn món kèm ghi chú. | `POST /api/v1/fnb/orders/daily-meals`<br>`PUT /api/v1/fnb/orders/mine/{id}/daily-meal` |
| **S36** | **Extra A-la-carte Order**<br>`/customer/dining/extra` | `ROLE_CUSTOMER` | Đặt món tính phí ngoài gói; xác nhận phụ thu tự động vào Folio phòng. | `POST /api/v1/fnb/orders/ala-carte` |
| **S37** | **My Meal Plan / Orders**<br>`/customer/dining/orders` | `ROLE_CUSTOMER` | Khách theo dõi bữa ăn đã đặt, trạng thái chế biến thời gian thực. | `GET /api/v1/fnb/orders/mine`<br>`GET /api/v1/fnb/orders/mine/{id}` |
| **S38** | **F&B Dashboard**<br>`/fb/dashboard` | `ROLE_F&B STAFF` | Bảng điều khiển Bếp: Bố cục 2 cột (Demand 65-70% / Shortage 30-35%); quy đổi mẻ 100 suất. | `GET /api/v1/fnb/dashboard?date={date}` |
| **S39** | **Daily Meal Prep List**<br>`/fb/meal-prep` | `ROLE_F&B STAFF` | KDS hàng chờ chế biến trong ngày; cảnh báo dị ứng, Villa No.; che giấu bệnh án. | `GET /api/v1/fnb/orders?orderDate={date}` |
| **S40** | **Meal Order Detail**<br>`/fb/orders/:id` | `ROLE_F&B STAFF` | Chi tiết đơn: Đổi trạng thái từng món; tự động trừ kho FEFO; Drawer tác động nguyên liệu. | `GET /api/v1/fnb/orders/{id}`<br>`PATCH /api/v1/fnb/orders/{id}/items/{lineId}/preparation-status`<br>`PATCH /api/v1/fnb/orders/{id}/status` |

---

## 5. QUY TRÌNH KIỂM CHỨNG CHẤT LƯỢNG (QUALITY VERIFICATION GATES)

Trước khi nghiệm thu hoặc triển khai lên môi trường thử nghiệm, kỹ sư cần thực hiện đầy đủ 3 bước kiểm chứng bắt buộc theo chuẩn quy định tại [`05_Development/README.md`](file:///E:/fal26-isp392-is2005-g1/05_Development/README.md):

### Bước 1: Kiểm thử Backend Test Suite
Chạy toàn bộ 31 bài kiểm thử tự động của Backend:
```powershell
cd E:\fal26-isp392-is2005-g1\05_Development\backend
.\mvnw.cmd test
```
*Điều kiện đạt:* **`BUILD SUCCESS`** với 31/31 tests pass (0 failures, 0 errors), bao gồm:
- `FnbRoleAccessTest`: Phân quyền RBAC nghiêm ngặt (F&B Staff độc quyền bếp, Admin chỉ đọc tồn kho).
- `InventoryServiceTest`: Công thức định mức $Q$, tổng hợp lô khả dụng, trừ kho FEFO.
- `MealOrderServiceTest`: Chuyển trạng thái đơn ăn và tự động kích hoạt trừ kho.
- `RetreatPackageFnbServiceTest`: 8 gói thực dưỡng và kiểm tra an toàn thực phẩm.

### Bước 2: Kiểm thử Biên dịch & Đóng gói Backend
```powershell
cd E:\fal26-isp392-is2005-g1\05_Development\backend
.\mvnw.cmd package -DskipTests
```
*Điều kiện đạt:* Sinh file `target/hswrms-0.0.1-SNAPSHOT.jar` thành công.

### Bước 3: Kiểm thử Type Safety & Đóng gói Frontend
```powershell
cd E:\fal26-isp392-is2005-g1\05_Development\frontend
npx.cmd tsc --noEmit
npm.cmd run build
```
*Điều kiện đạt:* **`✓ built in ~1.2s`**, 0 lỗi TypeScript, 0 lỗi biên dịch Vite.

---

## 6. HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG TRỰC TIẾP (QUICK START)

1. **Khởi chạy Cơ sở dữ liệu**:
   - Sử dụng Microsoft SQL Server (Port mặc định: 1433).
   - Chạy tập lệnh khởi tạo schema: `05_Development/database/schema.sql`.
   - Chạy migration bổ sung cho M4 (nếu chạy DB mới): `05_Development/database/migrations/V1__m4_meal_order_fields.sql`.

2. **Khởi chạy Backend Spring Boot**:
   ```powershell
   cd E:\fal26-isp392-is2005-g1\05_Development\backend
   .\mvnw.cmd spring-boot:run
   ```
   - Base URL: `http://localhost:8080/api/v1`
   - Health check: `http://localhost:8080/api/v1/health`

3. **Khởi chạy Frontend React SPA**:
   ```powershell
   cd E:\fal26-isp392-is2005-g1\05_Development\frontend
   npm.cmd run dev
   ```
   - Ứng dụng chạy tại: `http://localhost:5173`
   - Đèn báo kết nối Backend (Live connectivity indicator) được gắn tại góc dưới bên trái màn hình để nhận biết trạng thái kết nối máy chủ.
