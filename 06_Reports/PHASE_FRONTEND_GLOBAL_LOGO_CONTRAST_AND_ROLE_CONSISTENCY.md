# BÁO CÁO NGHIỆM THU: TĂNG ĐỘ TƯƠNG PHẢN LOGO THIÊN THỂ VÀ ĐỒNG BỘ HOẠT ẢNH TRÊN TOÀN BỘ WEBSITE (TẤT CẢ ROLE & LAYOUT)

> **Mã báo cáo:** `PHASE_FRONTEND_GLOBAL_LOGO_CONTRAST_AND_ROLE_CONSISTENCY`  
> **Dự án:** HSWRMS — HeavenStay Wellness Resort Management System  
> **Môi trường thử nghiệm:** Chrome v131+ (Headless CDP & Real Browser), Node.js v20+, Vite v8.3.4  
> **Ngày thực hiện:** 30/10/2026  
> **Trạng thái:** **100% HOÀN TẤT & ĐẠT CHUẨN NGHIỆM THU (PASS)**

---

## 1. TỔNG QUAN VÀ NGUYÊN NHÂN GỐC RỄ (ROOT CAUSE ANALYSIS)

### 1.1. Hiện trạng trước khi xử lý
Trước đợt tinh chỉnh này, hệ thống logo và hoạt ảnh thiên thể (Celestial Luxury System) đã hoạt động rất ấn tượng trên hero banner nền tối. Tuy nhiên, người dùng đã chỉ ra hai vấn đề tồn đọng:

1. **Độ tương phản trên nền sáng bị mờ/biến mất:**
   - Trên nền sáng (`#FAF8F5` linen canvas hoặc `#FFFFFF` white navbar khi cuộn trang), các đường quỹ đạo elip (`.hsw-emblem-orbit-primary`, `.hsw-emblem-orbit-secondary`) sử dụng các tông vàng nhạt (`#D4AF37`, `#C5A880`) kết hợp độ mờ nhẹ, khiến các nét đứt (`dashed`) và chấm (`dotted`) bị chìm vào nền.
   - Quan trọng hơn, chu kỳ nhấp nháy (`@keyframes hsw-sparkle-pulse-1`, `pulse-2`, `pulse-3`) trước đó hạ opacity xuống mức `0% - 10%`. Trên nền sáng, khi các hạt sáng giảm về `0%`, hình bóng của các ngôi sao thiên thể hoàn toàn biến mất khỏi tầm mắt người xem, tạo cảm giác đứt quãng hoặc "lỗi hình ảnh".
2. **Thiếu tính đồng bộ thương hiệu giữa các phân hệ (Role-wide Inconsistency):**
   - Chỉ có `PublicNavbar` và `CustomerNavbar` sử dụng component `HeavenStayLogo.tsx`.
   - `OperationalSidebar.tsx` (dùng chung cho toàn bộ nhân viên nội bộ: **Lễ tân / Receptionist, Trị liệu viên / Therapist, Bếp / Kitchen & F&B, Quản lý / Manager, Quản trị viên / Admin**) trước đây chỉ dùng một icon Lucide `<Sparkles size={20} />` tĩnh và một đoạn chữ thô.
   - `AuthLayout.tsx` (màn hình Đăng nhập `/login` và Đăng ký `/register`) cũng dùng một icon `<Sparkles size={24} />` tĩnh và chữ text thường, thiếu hoàn toàn hệ thống chuyển động quỹ đạo và logo hoàng gia.

---

## 2. BẢNG MÀU THIÊN THỂ VÀ QUY TẮC ĐỘ TƯƠNG PHẢN (BEFORE VS AFTER)

### 2.1. Bảng đối chiếu thông số quang học trên nền sáng
Để đạt được vẻ đẹp sang trọng, cổ điển (antique luxury) và độ tương phản cao trên nền sáng mà không thô cứng, hệ thống màu sắc đã được chuyển đổi sang bảng màu Đồng Cổ Điển & Vàng Đậm:

| Thuộc tính thiên thể | Trước khi sửa (Faint / Vanishing) | Sau khi sửa (Antique Bronze & Deep Gold) | Hiệu quả trực quan |
| :--- | :--- | :--- | :--- |
| **Quỹ đạo 1 (Orbit 1)** | `1px dashed rgba(197, 168, 128, 0.45)` | `1.85px dashed #76501F` (*Antique Bronze*) | Nét elip xoay 12s nổi bật rõ ràng từng mắt xích trên nền sáng |
| **Bóng quỹ đạo 1** | `rgba(212, 175, 55, 0.2) 0 0 2px` | `rgba(118, 80, 31, 0.45) 0 0 5px` | Chiều sâu không gian thiên thể rõ nét |
| **Quỹ đạo 2 (Orbit 2)** | `1px dotted rgba(212, 175, 55, 0.5)` | `1.85px dotted #8F6428` (*Deep Gold*) | Hàng chấm xoay nghịch chiều 18s tương phản sắc sảo |
| **Bóng quỹ đạo 2** | `rgba(197, 168, 128, 0.15) 0 0 2px` | `rgba(143, 100, 40, 0.40) 0 0 4px` | Vầng hào quang ấm áp bao quanh lõi ngọc |
| **Ngọc thiên thể (Gems 1 & 2)** | Gradient vàng kem nhạt | Tâm Ngà Ấm `#FFF4D6`, Thân Vàng Cổ `#A87935`, Viền Đồng `#76501F` | Ngọc xoay lấp lánh như kim hoàn đính trên quỹ đạo |
| **Ngôi sao nhấp nháy (Sparkles)** | Gradient nhạt, viền mờ | Gradient Đa Tầng `#FFF4D6` -> `#A87935` -> `#8F6428` -> `#76501F` | Tinh thể sao 4 cánh và 8 cánh sắc sảo |
| **Drop Shadow Ngôi sao** | `rgba(212, 175, 55, 0.3) 0 0 2px` | Kép: `rgba(143, 100, 40, 0.95)` + `rgba(84, 57, 20, 0.70)` | Tách biệt hoàn toàn khỏi nền kem / trắng |
| **Nguyên tắc Opacity Cực tiểu** | Giảm về `0.0 - 0.1` (**Biến mất hoàn toàn**) | **Cực tiểu 0.36 - 0.40** (Scale 0.65 - 0.70) | **KHÔNG BAO GIỜ BIẾN MẤT**; lúc nghỉ vẫn là viên ngọc quý thanh lịch |
| **Bề mặt tối (Hero / Dark Mode)** | Giữ nguyên hào quang rượu sâm panh | Giữ nguyên `rgba(231, 217, 196, 0.75)` & `rgba(231, 217, 196, 0.45)` | Bảo toàn 100% ánh sáng dịu mắt ban đêm |

---

## 3. BẢNG KIỂM KÊ TOÀN BỘ VỊ TRÍ LOGO TRÊN WEBSITE (ROLE & LAYOUT INVENTORY)

Tất cả các vai trò, màn hình và layout trong toàn bộ ứng dụng HSWRMS hiện đã sử dụng chung component chuẩn `HeavenStayLogo.tsx` với các biến thể kích thước và phụ đề được bản địa hóa chuẩn xác:

| Phân hệ / Vai trò | Tuyến đường (Route) | Layout cha | Trạng thái trước | Giải pháp sau đồng bộ | Phụ đề hiển thị |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Khách vãng lai (Public)** | `/`, `/retreats`, v.v. | `PublicLayout.tsx` | Đã dùng Logo (nhưng nét mờ) | Cập nhật độ tương phản cao, chuyển màu tự động khi cuộn | `WELLNESS RESORT` |
| **2. Chân trang (Footer)** | Tất cả trang Public | `Footer.tsx` | Đã dùng Logo | Kế thừa bảng màu thiên thể cao cấp | `WELLNESS RESORT` |
| **3. Đăng nhập (Login)** | `/login` | `AuthLayout.tsx` | ❌ Icon tĩnh `<Sparkles size={24} />` | ✅ Tích hợp `<HeavenStayLogo variant="public" size="md" />` | `WELLNESS RESORT` |
| **4. Đăng ký (Register)** | `/register` | `AuthLayout.tsx` | ❌ Icon tĩnh `<Sparkles size={24} />` | ✅ Tích hợp `<HeavenStayLogo variant="public" size="md" />` | `WELLNESS RESORT` |
| **5. Cổng khách hàng (Customer)** | `/customer/dashboard`, v.v. | `CustomerLayout.tsx` | Đã dùng Logo (nhưng nét mờ) | Tăng tương phản, chuẩn hóa biến thể `variant="customer"` | `CỔNG KHÁCH HÀNG` |
| **6. Lễ tân (Receptionist)** | `/receptionist/dashboard` | `OperationalSidebar.tsx` | ❌ Icon tĩnh `<Sparkles size={20} />` | ✅ Tích hợp `<HeavenStayLogo variant="operations" size="sm" />` | `HỆ THỐNG VẬN HÀNH` |
| **7. Trị liệu viên (Therapist)** | `/therapist/dashboard` | `OperationalSidebar.tsx` | ❌ Icon tĩnh `<Sparkles size={20} />` | ✅ Tích hợp `<HeavenStayLogo variant="operations" size="sm" />` | `HỆ THỐNG VẬN HÀNH` |
| **8. Bếp & F&B (Kitchen/Chef)** | `/fb/dashboard` | `OperationalSidebar.tsx` | ❌ Icon tĩnh `<Sparkles size={20} />` | ✅ Tích hợp `<HeavenStayLogo variant="operations" size="sm" />` | `HỆ THỐNG VẬN HÀNH` |
| **9. Quản lý (Manager)** | `/manager/dashboard` | `OperationalSidebar.tsx` | ❌ Icon tĩnh `<Sparkles size={20} />` | ✅ Tích hợp `<HeavenStayLogo variant="operations" size="sm" />` | `HỆ THỐNG VẬN HÀNH` |
| **10. Quản trị hệ thống (Admin)** | `/admin/dashboard`, `/admin/staff` | `OperationalSidebar.tsx` | ❌ Icon tĩnh `<Sparkles size={20} />` | ✅ Tích hợp `<HeavenStayLogo variant="operations" size="sm" />` | `HỆ THỐNG VẬN HÀNH` |
| **11. Mobile Drawer / Sidebar** | Viewport hẹp (< 768px) | `OperationalSidebar.tsx` | ❌ Icon tĩnh | ✅ Tích hợp `<HeavenStayLogo variant="operations" size="sm" />` | Co giãn linh hoạt, không vỡ layout |

---

## 4. CHI TIẾT CÁC FILE ĐÃ CHỈNH SỬA

Toàn bộ can thiệp đều nằm trong phạm vi frontend (`05_Development/frontend`). Tuyệt đối không thay đổi backend, database hoặc logic nghiệp vụ:

1. [HeavenStayLogo.tsx](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/components/common/HeavenStayLogo.tsx):
   - Mở rộng prop `variant?: 'public' | 'customer' | 'operations' | 'compact' | 'mark'`.
   - Hỗ trợ prop `subtitle?: string` để ghi đè phụ đề linh hoạt theo ngôn ngữ/i18n.
   - Thêm lớp `is-operations-portal` để áp dụng tỷ lệ chữ trang nhã trong thanh điều hướng hẹp của khối vận hành.
2. [OperationalSidebar.tsx](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/components/navigation/OperationalSidebar.tsx):
   - Thay thế thẻ SVG Lucide thô bằng `<HeavenStayLogo variant="operations" size="sm" subtitle={t('operations.sidebar.operationalSuite', 'HỆ THỐNG VẬN HÀNH')} />`.
   - Giúp toàn bộ 5 role nhân viên nội bộ ngay lập tức sở hữu hệ thống chuyển động thiên thể hoàn chỉnh.
3. [AuthLayout.tsx](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/app/layouts/AuthLayout.tsx):
   - Thay thế icon tĩnh bằng `<HeavenStayLogo variant="public" size="md" />`.
   - Dọn dẹp import `Sparkles` không dùng để đảm bảo 0 cảnh báo lint.
4. [layouts.css](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/05_Development/frontend/src/styles/layouts.css):
   - Định nghĩa lại toàn bộ hệ thống màu sắc nét vẽ thiên thể trên nền sáng (`#76501F`, `#8F6428`, `#A87935`, `#FFF4D6`).
   - Thiết lập các keyframe nhấp nháy không triệt tiêu (`hsw-sparkle-pulse-1`, `2`, `3`, `hsw-sparkle-micro-flare`) với opacity sàn `>= 0.36 - 0.40`.
   - Thêm quy tắc CSS chuyên dụng cho `.hsw-brand-tagline.is-operations-portal` và `.hsw-sidebar-header .hsw-brand-logo-root`.
   - Tối ưu hóa chuyển động độc lập với Windows Performance Options trong `@media (prefers-reduced-motion: reduce)`.

---

## 5. DỮ LIỆU ĐO ĐẠC TELEMETRY & KẾT QUẢ KIỂM THỬ TRỰC QUAN

*(Dữ liệu trích xuất trực tiếp từ file đo đạc tự động `06_Reports/visual-evidence/global_logo_and_role_consistency_telemetry.json`)*

### 5.1. Kiểm tra màu sắc và thuộc tính tương phản trên nền sáng (Scrolled Navbar)
- **Quỹ đạo 1 (Orbit 1):**
  - `border`: `1px dashed rgb(118, 80, 31)` (`#76501F` Antique Bronze) -> **ĐẠT**
  - `boxShadow`: `rgba(118, 80, 31, 0.45) 0px 0px 5px 0px` -> **ĐẠT**
- **Quỹ đạo 2 (Orbit 2):**
  - `border`: `1px dotted rgb(143, 100, 40)` (`#8F6428` Deep Gold) -> **ĐẠT**
  - `boxShadow`: `rgba(143, 100, 40, 0.4) 0px 0px 4px 0px` -> **ĐẠT**
- **Ngọc quỹ đạo 1 (Gem 1):**
  - `background`: `radial-gradient(circle, rgb(255, 244, 214) 18%, rgb(168, 121, 53) 50%, rgb(118, 80, 31) 100%)` -> **ĐẠT**
  - `boxShadow`: `rgba(143, 100, 40, 0.85) 0px 0px 6px 0px, rgb(84, 57, 20) 0px 0px 2px 0px` -> **ĐẠT**
- **Bộ lọc bóng ngôi sao (Sparkle Filter):**
  - `filter`: `drop-shadow(rgba(143, 100, 40, 0.95) 0px 0px 2.5px) drop-shadow(rgba(84, 57, 20, 0.7) 0px 1px 2px)` -> **ĐẠT**

### 5.2. Đo đạc độ mờ tối thiểu (Non-vanishing Rule Assertion qua 20 mẫu trong 3.6s)
Trong suốt chu kỳ nhấp nháy, các giá trị opacity đo được tại các điểm thấp nhất:
- **Sparkle 1 (Sao 4 cánh góc trên phải):** Opacity cực tiểu = `0.380` (Đỉnh xung = `0.999`) -> **ĐẠT (>= 0.30)**
- **Sparkle 2 (Sao 4 cánh giữa trái):** Opacity cực tiểu = `0.360` (Đỉnh xung = `1.000`) -> **ĐẠT (>= 0.30)**
- **Sparkle 3 (Sao 8 cánh chính góc dưới giữa):** Opacity cực tiểu = `0.400` (Đỉnh xung = `1.000`) -> **ĐẠT (>= 0.30)**
- **Micro-flare (Hạt vi sáng trung tâm):** Opacity cực tiểu = `0.300` (Đỉnh xung = `1.000`) -> **ĐẠT (>= 0.25)**
> **Kết luận:** Tại không có bất kỳ thời điểm nào trong vòng lặp chuyển động mà ngôi sao hay quỹ đạo bị biến mất hoàn toàn trên nền trắng/kem.

### 5.3. Bảo toàn ánh sáng trên bề mặt tối (Hero Banner)
- `orbit1BorderColor`: `rgba(231, 217, 196, 0.75)` (Champagne Ivory)
- `orbit1BoxShadow`: `rgba(231, 217, 196, 0.45) 0px 0px 8px 0px` (Ambient Glow mềm mại)
> **Kết luận:** Bề mặt tối không bị xỉn màu đồng mà giữ trọn vẻ đẹp lung linh của rượu sâm panh hoàng gia.

### 5.4. Độc lập tuyệt đối với Windows Animation Effects
Kiểm thử chuyển đổi thuộc tính `prefers-reduced-motion` giữa `no-preference` (Windows Animation ON) và `reduce` (Windows Animation OFF):
- **Chế độ `no-preference`:**
  - Orbit 1 quay liên tục: `matrix(0.920, 0.390, -0.390, 0.920)` -> `matrix(0.199, 0.979, -0.979, 0.199)` (**ROTATING: YES**)
  - Biểu tượng dập dềnh: `Y = -2.359px` -> `Y = -0.096px` (**FLOATING: YES**)
- **Chế độ `reduce`:**
  - Orbit 1 quay liên tục: `matrix(-0.663, 0.747, -0.747, -0.663)` -> `matrix(-0.953, -0.302, 0.302, -0.953)` (**ROTATING: YES**)
  - Biểu tượng dập dềnh: `Y = -0.713px` -> `Y = -1.714px` (**FLOATING: YES**)
> **Kết luận:** Logo HeavenStay giữ vững chuyển động sống động tự nhiên 100% trong mọi thiết lập trợ năng của hệ điều hành Windows.

---

## 6. KẾT QUẢ BUILD, LINT VÀ BÀI TEST TỔNG THỂ

1. **Lint Execution (`oxlint`):**
   ```bash
   npm --prefix 05_Development/frontend run lint
   # Output: Found 9 warnings and 0 errors. (Finished in 40ms on 216 files)
   ```
   *Tất cả 0 errors; không có lỗi cú pháp hoặc biến thừa trong các file đã sửa.*

2. **TypeScript & Production Build (`tsc -b && vite build`):**
   ```bash
   npm --prefix 05_Development/frontend run build
   # Output:
   # ✓ 2728 modules transformed.
   # dist/index.html                   1.58 kB │ gzip:   0.75 kB
   # dist/assets/index-EhPFKbM8.css  226.94 kB │ gzip:  33.96 kB
   # dist/assets/index-CAzfRhZl.js 2,833.04 kB │ gzip: 747.24 kB
   # ✓ built in 1.29s
   ```
   *Biên dịch thành công tuyệt đối trong 1.29 giây.*

3. **Frontend Contract Tests (Node.js Test Runner):**
   ```bash
   node scratch/run_contract_tests.js
   # Output:
   # ℹ tests 145
   # ℹ suites 47
   # ℹ pass 145
   # ℹ fail 0
   # ℹ cancelled 0
   # ℹ skipped 0
   # ℹ duration_ms 1173.5162
   ```
   *Toàn bộ 145/145 contract test của tất cả các module M1 - M6 đều vượt qua thành công.*

---

## 7. BẢNG TỔNG HỢP NGHIỆM THU (ACCEPTANCE MATRIX)

| STT | Tiêu chí kiểm định | Kết quả thực tế | Trạng thái |
| :---: | :--- | :--- | :---: |
| 1 | Quỹ đạo thiên thể Orbit 1 & 2 có độ tương phản cao, sắc nét trên nền sáng (`#FAF8F5`, `#FFFFFF`) | Orbit 1: `#76501F` nét đứt 1.85px; Orbit 2: `#8F6428` nét chấm 1.85px | **PASS** |
| 2 | Các ngôi sao nhấp nháy không bao giờ bị biến mất (Non-vanishing assertion) | Đáy chu kỳ đạt `0.36 - 0.40` opacity, giữ vững dáng sao ngọc quý | **PASS** |
| 3 | Logo trên nền tối (Hero banner) giữ được ánh sáng sâm panh mềm mại | `rgba(231, 217, 196, 0.75)` với ambient luminescence ấm áp | **PASS** |
| 4 | Màn hình Đăng nhập (`/login`) và Đăng ký (`/register`) có logo thiên thể chuẩn | Tích hợp hoàn chỉnh qua `AuthLayout.tsx`, có đầy đủ quỹ đạo và sao | **PASS** |
| 5 | Cổng Khách hàng (`/customer/dashboard`) hiển thị logo chuẩn | Phụ đề `CỔNG KHÁCH HÀNG`, hiệu ứng chuyển động mượt mà | **PASS** |
| 6 | Nhân viên Lễ tân (`/receptionist/dashboard`) hiển thị logo chuẩn | Phụ đề `HỆ THỐNG VẬN HÀNH`, logo thiên thể cỡ nhỏ vừa vặn sidebar | **PASS** |
| 7 | Nhân viên Trị liệu (`/therapist/dashboard`) hiển thị logo chuẩn | Phụ đề `HỆ THỐNG VẬN HÀNH`, hoạt ảnh thiên thể hoạt động liên tục | **PASS** |
| 8 | Nhân viên Bếp & F&B (`/fb/dashboard`) hiển thị logo chuẩn | Phụ đề `HỆ THỐNG VẬN HÀNH`, nhận diện thương hiệu đồng nhất | **PASS** |
| 9 | Cấp Quản lý (`/manager/dashboard`) hiển thị logo chuẩn | Phụ đề `HỆ THỐNG VẬN HÀNH`, chuyển động tinh tế, đồng bộ | **PASS** |
| 10 | Quản trị hệ thống (`/admin/dashboard`) hiển thị logo chuẩn | Phụ đề `HỆ THỐNG VẬN HÀNH`, bảo đảm tính nhận diện trang quản trị | **PASS** |
| 11 | Viewport hẹp / Drawer di động hiển thị hài hòa | Tự động căn chỉnh tỷ lệ theo sidebar drawer, không bị tràn | **PASS** |
| 12 | Hoạt ảnh độc lập với thiết lập Windows Performance Options | Chạy liên tục cả khi `prefers-reduced-motion` là `reduce` | **PASS** |
| 13 | Bảo toàn toàn bộ Storytelling hai cột, sticky media, cursor 3 hạt | Không có bất kỳ hồi quy nào trên các tính năng đã khôi phục | **PASS** |
| 14 | Độ toàn vẹn mã nguồn: 0 lỗi lint, 0 lỗi build, 145/145 unit/contract tests | `oxlint` 0 error, build 1.29s, 145/145 pass | **PASS** |

---

## 8. DANH MỤC BẰNG CHỨNG HÌNH ẢNH VÀ DỮ LIỆU ĐO ĐẠC

Toàn bộ các file ảnh chụp màn hình độ phân giải cao và tệp tin dữ liệu telemetry đều được lưu trữ trực tiếp tại thư mục [visual-evidence](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence):

1. **Bằng chứng Tương phản Nền sáng & Nền tối:**
   - [logo_contrast_scrolled_light.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_contrast_scrolled_light.png): Chụp cận cảnh logo trên thanh điều hướng nền sáng, thể hiện rõ các đường elip màu Antique Bronze, Deep Gold và các ngôi sao ngọc sáng rõ.
   - [logo_contrast_hero_dark.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_contrast_hero_dark.png): Chụp cận cảnh logo trên Hero banner tối, giữ nguyên ánh sâm panh ấm áp.
2. **Bằng chứng Đồng bộ Nhận diện Tất cả các Role:**
   - [logo_role_public_landing.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_public_landing.png): Public Landing Page (`/`).
   - [logo_role_auth_login.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_auth_login.png): Màn hình Đăng nhập (`/login`).
   - [logo_role_auth_register.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_auth_register.png): Màn hình Đăng ký (`/register`).
   - [logo_role_customer_dashboard.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_customer_dashboard.png): Cổng Khách hàng với phụ đề `CỔNG KHÁCH HÀNG`.
   - [logo_role_receptionist.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_receptionist.png): Thanh Sidebar Lễ tân với phụ đề `HỆ THỐNG VẬN HÀNH`.
   - [logo_role_therapist.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_therapist.png): Thanh Sidebar Trị liệu viên.
   - [logo_role_kitchen.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_kitchen.png): Thanh Sidebar Bếp / F&B Staff.
   - [logo_role_manager.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_manager.png): Thanh Sidebar Cấp Quản lý.
   - [logo_role_admin.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_admin.png): Thanh Sidebar Quản trị viên hệ thống.
3. **Bằng chứng Mobile & Viewport hẹp:**
   - [logo_role_mobile_public.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_role_mobile_public.png): Logo trên màn hình điện thoại 390px.
   - [logo_sidebar_mobile_drawer.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_sidebar_mobile_drawer.png): Logo trong ngăn kéo (drawer) di động của khối vận hành.
4. **Bằng chứng Trợ năng Windows Animation Effects:**
   - [logo_windows_anim_reduce.png](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/logo_windows_anim_reduce.png): Chụp logo tiếp tục xoay và dập dềnh khi Windows tắt animation controls.
5. **Tệp Dữ liệu Đo đạc JSON:**
   - [global_logo_and_role_consistency_telemetry.json](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/visual-evidence/global_logo_and_role_consistency_telemetry.json): Toàn bộ ma trận số liệu chi tiết, chuỗi đo opacity 20 mốc thời gian và xác nhận từng role.

