# 04 — Phát hiện khi truy vết (Findings & Gaps)

> Các điểm dưới đây phát hiện trong quá trình đọc code, **chưa sửa**. Mức độ: 🔴 cao · 🟠 trung bình · 🟡 thấp.

## A. Khoảng trống kiến trúc (FE ↔ BE)

| # | Mức | Phát hiện | Vị trí |
|---|---|---|---|
| A1 | 🟠 | FE **không gọi API nghiệp vụ** nào của BE; chỉ gọi `GET /health`. | `api/health/healthApi.ts`, `components/common/DevHealthIndicator.tsx` |
| A2 | 🟠 | `features/m6-admin/api/adminApi.ts` đã viết nhưng **không page nào import**; các page Admin dùng `GovernanceContext` (mock). | `pages/admin/*` |
| A3 | 🟠 | Đăng nhập FE là giả lập: nhập gì cũng vào được với vai **customer**; không lưu JWT. | `pages/auth/LoginPage.tsx` L43–48 |
| A4 | 🟡 | Mã role khác nhau giữa FE và BE: FE `fb_staff`, `admin`… (chữ thường) ↔ BE `FNB_STAFF`, `ADMIN`. Cần bảng ánh xạ khi nối API. | `types/auth.ts` ↔ `m1identity/entity/Role.java` |
| A5 | 🟡 | FE kiểm quyền theo **capability key** (`configure_business_parameters`), BE kiểm theo **screen:action** (`S50:U`). Hai mô hình cần ánh xạ. | `GovernanceContext.hasCapability` ↔ `PermissionEvaluator` |
| A6 | 🟡 | Backend M2–M5 chưa có code (chỉ `.gitkeep`). | `backend/.../m2booking … m5billing` |

## B. Backend

| # | Mức | Phát hiện | Vị trí |
|---|---|---|---|
| B1 | 🟡 | Profile `local` (H2): seed master data **luôn bị bỏ qua** vì bảng `VillaCategory`, `SpaTreatment`, `RetreatPackage` không phải JPA entity → Hibernate không tạo. Lỗi bị nuốt ở mức DEBUG (`bad SQL grammar`). API `/admin/master-data/*` sẽ không có dữ liệu trên H2. | `m6admin/service/M6DataInitializer.java` L104–130 |
| B2 | 🟡 | Mật khẩu tài khoản seed được hard-code trong code (chấp nhận cho dev, cần đổi khi deploy). | `M6DataInitializer.java` L97–101 |

## C. Frontend — logic nghiệp vụ trong Context

| # | Mức | Phát hiện | Vị trí |
|---|---|---|---|
| C1 | 🔴 | `processPayment` thành công sẽ đánh dấu **tất cả** `alaCarteOrders` và **tất cả** spa session `extra` (của mọi khách) là đã thanh toán, kèm các ID hard-code (`SES-EXTRA-881`, `SES-305`, `SES-308`) — không lọc theo `bookingRef`. Với demo 1 khách thì không lộ, nhưng sai nếu có nhiều booking. | `context/FolioContext.tsx` L384–409 |
| C2 | 🟠 | Lưu trữ không đồng nhất: Customer & Folio lưu `localStorage`, còn Spa / Dining / Operations / Governance chỉ ở RAM. Sau F5: trạng thái "đã thanh toán / đã checkout" còn, nhưng session spa / order mới tạo biến mất → folio & báo cáo có thể lệch. | các file `context/*` |
| C3 | 🟠 | Đặt cọc retreat không đi qua `FolioContext.processPayment` → giao dịch cọc không nằm trong `transactions`; booking được tạo sẵn `depositStatus:'paid'`. | `pages/customer/BookingSummaryPage.tsx` L171–219 |
| C4 | 🟡 | `submitDailyResidenceDeclarations` đếm `readyCount` **bên trong** hàm updater của `setArrivals` rồi trả về ngay → số lượng trả về có thể là 0 tùy thời điểm React chạy updater. | `context/OperationsContext.tsx` L453–469 |
| C5 | 🟡 | `DiningContext` `useMemo` thiếu `profile`, `wellnessProfile` trong deps → `getDietaryProjection` có thể dùng dữ liệu dị ứng cũ sau khi Customer cập nhật hồ sơ (đến khi menu/order thay đổi). | `context/DiningContext.tsx` L163–176 |
| C6 | 🟡 | Nhiều giá trị demo hard-code: khách `Eleanor Vance`, `usr-cust-01`, `HSW-88192`, fallback `V-102`. Cần thay khi có dữ liệu thật. | `FolioContext`, `SpaContext`, `DiningContext` |
| C7 | 🟡 | `getAvailableSlots` coi phòng `cleaning` là khả dụng, trong khi `bookSpaSession` chỉ chặn `maintenance`. Cần xác nhận với SRS phòng đang dọn có được nhận lịch hay không. | `context/SpaContext.tsx` L137, L281 |

## D. Đối chiếu quy tắc bắt buộc (AGENTS.md)

| Quy tắc | Trạng thái |
|---|---|
| Dùng "Customer" thay "Guest" | ✅ trong code đã đọc |
| Therapist chỉ thấy ghi chú sức khỏe liên quan liệu trình | ✅ `getTherapistRelevantWellnessInfo` |
| F&B chỉ thấy dị ứng / chế độ ăn | ✅ `getDietaryProjection` (có kèm tên + số villa để giao món) |
| Receptionist không thấy thông tin sức khỏe thừa | ✅ OperationsContext không đọc wellnessProfile |
| Manager không phải full Admin | ✅ RoleGuard route con + capability/ủy quyền |
| Spa chỉ confirm khi Therapist **và** Phòng cùng rảnh | ✅ `bookSpaSession` (atomic) |
| Checkout bị chặn khi còn nợ Spa/F&B | ✅ `completeResortCheckout` + blockers (lưu ý C1, C2) |
| Thanh toán thành công ≠ checkout | ✅ hai bước, hai màn hình |
| Review tùy chọn, sau checkout | ✅ `submitReview` |

## E. Gợi ý ưu tiên
1. Sửa **C1** (lọc settle theo booking) — ảnh hưởng trực tiếp tới quy tắc checkout.
2. Quyết định chiến lược lưu trữ demo (**C2**): hoặc persist tất cả context, hoặc không persist cái nào.
3. Khi bắt đầu nối BE: làm login thật (A3) → lưu JWT → chuyển `pages/admin/*` sang `adminApi` (A2) → thống nhất role/permission mapping (A4, A5).
4. Thêm `@Entity` hoặc script DDL cho H2 để master data seed được (B1).
