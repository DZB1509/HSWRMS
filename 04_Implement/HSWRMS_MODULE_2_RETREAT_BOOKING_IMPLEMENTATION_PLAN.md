# KẾ HOẠCH TRIỂN KHAI CHI TIẾT MODULE 2: RETREAT PACKAGE & ACCOMMODATION BOOKING
## HeavenStay Wellness Resort Management System (HSWRMS)

**Phiên bản tài liệu:** 1.0 — Chuẩn phát triển Full-Stack & Bảo vệ đồ án ISP392  
**Ngày lập:** Tháng 10/2026  
**Vị trí lưu trữ:** `04_Implement/HSWRMS_MODULE_2_RETREAT_BOOKING_IMPLEMENTATION_PLAN.md`  
**Nhóm thực hiện:** IS2005 - Group 1 (ISP392 - Software Development Project)  

---

## 1. TỔNG QUAN VỀ MODULE 2 (EXECUTIVE SUMMARY)

### 1.1 Vị trí & Vai trò của Module 2 trong HSWRMS
Module 2 (**Retreat Package & Accommodation Booking**) là xương sống thương mại và vận hành lưu trú cốt lõi của toàn bộ hệ thống HeavenStay Wellness Resort Management System. Module này quản lý toàn bộ vòng đời lưu trú của khách hàng (**Customer Journey**), khởi đầu từ khi khám phá danh mục gói nghỉ dưỡng, đặt phòng trực tuyến, thanh toán đặt cọc qua cổng VNPay, cho đến khi đến quầy Lễ tân làm thủ tục khai báo tạm trú (tuân thủ **Luật Cư trú 2020**), nhận phòng (Physical Villa), cập nhật trạng thái buồng phòng (Housekeeping), và quản lý lịch trình chi tiết suốt kỳ nghỉ dưỡng.

```
                  ┌────────────────────────────────────────────────────────┐
                  │          MODULE 2: RETREAT & ACCOMMODATION             │
                  └───────────────────────────┬────────────────────────────┘
                                              │ Cung cấp Context lưu trú (RetreatBooking)
                                              ▼
    ┌───────────────────────┬─────────────────────────────────┬───────────────────────┐
    ▼                       ▼                                 ▼                       ▼
[Module 1: Profile]   [Module 3: Spa]                  [Module 4: F&B]         [Module 5: Checkout]
CustomerProfile &     Đặt lịch trị liệu dựa trên       Lên thực đơn ăn uống    Tổng hợp FolioItem
HealthProfile liên    Retreat_Booking_ID hoạt động     dựa trên Booking &      (Tiền phòng, cọc,
kết với Booking       (T-24h, T-2h, phòng & KTV)       thông tin dị ứng        dịch vụ phát sinh)
```

### 1.2 Nguyên tắc Nghiệp vụ Bất biến (Core Domain Axioms)
Theo các tài liệu chuẩn gồm SRS (`HSWRMS_ISP392_G1_SRS.pdf`), Use Case Diagram (`UC-M2_Retreat_Booking.png`), Conceptual ERD (`HSWRMS_Master_Conceptual_ERD.png`), Master Screen Flow (`HSWRMS_Master_Screen_Flow.png`) và `AGENTS.md`:
1. **Thuật ngữ chuẩn hóa:** Luôn dùng thuật ngữ **Customer** trong ngữ cảnh đã định danh/đăng nhập, không dùng "Guest" (theo quy định bắt buộc tại `AGENTS.md`). Unauthenticated chỉ gọi là Public Visitor.
2. **Nguyên tắc Tách biệt Danh mục & Thực thể Vật lý (`Villa Category != Physical Villa`):**
   - Customer khi đặt trực tuyến trên web chỉ chọn **Hạng Villa (Villa Category)** (ví dụ: *Ocean Pool Villa*, *Tranquil Garden Villa*). Khách **không bao giờ** được chỉ định trực tiếp số phòng vật lý khi đặt online.
   - Việc phân bổ **Căn Villa Cụ thể (Physical Villa)** (ví dụ: *Villa 101*, *Villa 205*) thuộc thẩm quyền độc quyền của **Receptionist** tại quầy Lễ tân vào thời điểm Check-in (Màn hình 23), căn cứ trên tình trạng buồng phòng thực tế (Available/Cleaning).
3. **Phân định Đặt cọc (Deposit) vs Thanh toán Hoàn tất (Final Settlement):**
   - Đặt cọc trực tuyến yêu cầu tối thiểu **30%** (tham số cấu hình từ M6) giá trị gói qua cổng VNPay để chuyển trạng thái Booking từ `PENDING` sang `CONFIRMED`.
   - Thành công thanh toán đặt cọc **không đồng nghĩa** với hoàn tất kỳ nghỉ hay check-in.
4. **Tuân thủ Pháp lý Lưu trú (Luật Cư trú 2020 & Nghị định 144/2021/NĐ-CP):**
   - Thủ tục Check-in bắt buộc phải thu thập đầy đủ thông tin định danh: CCCD/Hộ chiếu, quốc tịch, nơi thường trú, thời gian đến, phương tiện. Dữ liệu này được lưu trữ an toàn trong bảng `ResidenceRecord` và mã hóa at-rest.
5. **Tái sử dụng Màn hình Đặt phòng cho Khách Vãng lai (Walk-in Booking):**
   - Khách vãng lai đến trực tiếp quầy Lễ tân đặt phòng sẽ được Lễ tân thao tác bằng cách **tái sử dụng Màn hình 15 (Retreat Booking Form)** ở chế độ Lễ tân (`Receptionist Mode`), sau đó chuyển tiếp qua Màn hình 22 & 23, không tạo thêm màn hình mới ngoài danh mục 56 màn hình chuẩn.

---

## 2. PHÂN TÍCH USE CASE & YÊU CẦU NGHIỆP VỤ (SRS TRACEABILITY)

Dựa trên sơ đồ Use Case `UC-M2_Retreat_Booking.png` và đặc tả SRS `[FR-M2-01]` đến `[FR-M2-08]`:

```
               ┌────────────────────────────────────────────────────────┐
               │              USE CASE DIAGRAM: MODULE 2                │
               │                                                        │
               │  [Browse Packages] ◄────────────────────── Customer   │
               │         ▲                                      ▲       │
               │         │                                      │       │
               │  [Book Retreat & Pay Deposit] ─────────────────┤       │
               │         │                                      │       │
               │         ├──<<include>>──► [Check Availability] │       │
               │         ├──<<include>>──► [Payment (VNPay)]    │       │
               │         └──<<extend>>───► [Apply Discount]     │       │
               │                                                │       │
               │  [View Booking & Itinerary] ───────────────────┼───────┤◄── Receptionist
               │  [Cancel Booking / Services] ──────────────────┼───────┤
               │                                                │       │
               │  [Create Walk-in Booking] ─────────────────────┼───────┘
               │  [Manage Villa Status] ────────────────────────┼───────┐
               │         └──<<include>>──► [Perform Check-in] ──┘       │
               │  [Modify Booking or Services] ─────────────────────────┘
               │         └──<<include>>──► [Check Availability]
               └────────────────────────────────────────────────────────┘
```

### 2.1 Bảng chi tiết Functional Requirements (FR)

| Mã FR | Tên chức năng | Actor chính | Màn hình tương ứng | Mô tả luồng xử lý chính & Ràng buộc |
|:---|:---|:---|:---|:---|
| **FR-M2-01** | Browse Retreat Packages | Public / Customer | Screen 13, Screen 14 | Xem danh sách các gói nghỉ dưỡng. Lọc theo Wellness Goal (Detox, Stress Relief, Healthy Aging, Rejuvenation). Xem chi tiết lịch trình, quyền lợi kèm theo (số buổi spa, bữa ăn dinh dưỡng), hạng villa áp dụng, bảng giá cơ sở. |
| **FR-M2-02** | Book Retreat & Pay Deposit | Customer | Screen 15, Screen 16, Screen 17 | Nhập ngày Check-in/Check-out, số lượng khách, chọn Villa Category. Hệ thống kiểm tra số lượng villa trống của hạng phòng (`Check Villa Availability`). Tính tổng tiền và cọc 30%. Chuyển hướng sang VNPay Sandbox. Xử lý IPN callback, xác thực chữ ký số HMAC-SHA512. Cập nhật `RetreatBooking` sang `CONFIRMED`, tạo bản ghi `Folio` & `PaymentTransaction`. |
| **FR-M2-03** | Perform Check-in & Assign Villa | Receptionist | Screen 21, Screen 22, Screen 23 | Lễ tân mở danh sách khách đến trong ngày (`Daily Arrivals`). Xác minh khách theo Booking Reference. Nhập thông tin khai báo tạm trú theo Luật Cư trú 2020 (`ResidenceRecord`). Chọn căn Villa cụ thể đang ở trạng thái `AVAILABLE`. Cập nhật Booking -> `CHECKED_IN`, Villa -> `OCCUPIED`. |
| **FR-M2-04** | Manage Villa Status | Receptionist | Screen 24 | Giám sát trạng thái 100% căn villa vật lý theo sơ đồ ma trận thời gian thực: `AVAILABLE`, `OCCUPIED`, `NEEDS_CLEANING`, `MAINTENANCE`. Cập nhật trạng thái sau khi buồng phòng dọn xong. |
| **FR-M2-05** | View Booking & Itinerary | Customer, Receptionist | Screen 18, Screen 19 | Customer xem danh sách kỳ nghỉ (`My Bookings`). Xem chi tiết lịch trình (`Itinerary`): hiển thị timeline kết hợp từ RetreatBooking, các buổi Spa đã xác nhận (M3), và các bữa ăn đã chọn (M4). |
| **FR-M2-06** | Create Walk-in Booking | Receptionist | Screen 15 (Reused), Screen 22, Screen 23 | Tiếp nhận khách vãng lai trực tiếp tại quầy. Lễ tân tra cứu phòng trống, nhập thông tin cá nhân của khách, thu tiền cọc (Tiền mặt/POS/VNPay QR), tạo booking và thực hiện check-in ngay. |
| **FR-M2-07** | Cancel Booking or Services | Customer, Receptionist | Screen 18, Screen 19, Screen 20 | Hủy booking hoặc dịch vụ lẻ. Hệ thống kiểm tra chính sách hủy (Cancellation Window) cấu hình từ Module 6: Hủy trước N ngày được hoàn X% tiền cọc, hủy muộn mất 100% cọc. Giải phóng tài nguyên villa đã giữ. |
| **FR-M2-08** | Modify Booking or Services | Customer, Receptionist | Screen 19, Screen 20 | Thay đổi ngày lưu trú hoặc nâng hạng villa. Hệ thống re-validate tình trạng phòng trống, tính lại chênh lệch chi phí, phát sinh phí phạt hoặc cọc bổ sung vào Customer Folio. |

---

## 3. THIẾT KẾ MÀN HÌNH & GIAO DIỆN (UI/UX - SCREENS 13 ĐẾN 24)

Theo đúng danh mục `Screen_List.md` và `HSWRMS_Master_Screen_Flow.png`:

```
[Screen 1: Landing] ──► [Screen 13: Package List] ──► [Screen 14: Package Detail]
                                                              │
                                                              ▼
[Screen 17: Deposit Result] ◄── [VNPay Gateway] ◄── [Screen 16: Summary & Deposit] ◄── [Screen 15: Booking Form]
         │                                                                                          ▲
         ▼                                                                                          │ Walk-in
[Screen 18: My Bookings] ──► [Screen 19: Itinerary Detail]                                          │
                                                                                                    │
[Screen 20: Receptionist Dashboard] ────────────────────────────────────────────────────────────────┤
         │
         ├──► [Screen 21: Daily Arrivals] ──► [Screen 22: Check-In Info] ──► [Screen 23: Villa Assignment]
         │                                                                                │
         └──► [Screen 24: Villa Status Management] ◄──────────────────────────────────────┘
```

### 3.1 Bảng đặc tả 12 màn hình của Module 2

| STT | Tên màn hình | Đường dẫn Route (React Router) | Layout & Actor | Thành phần UI chính & Dữ liệu hiển thị | Hành động chính & Chuyển màn hình |
|:---:|:---|:---|:---|:---|:---|
| **13** | **Retreat Package List** | `/retreats` (Public)<br>`/customer/retreats` | `PublicLayout` hoặc `CustomerLayout` | Thanh bộ lọc Wellness Goal, thẻ card hình ảnh gói nghỉ dưỡng (Cormorant Garamond font), thời lượng (Days/Nights), giá khởi điểm, tóm tắt liệu trình spa & thực đơn. | Click "Xem Chi Tiết" ➔ Chuyển Screen 14. |
| **14** | **Retreat Package Detail** | `/retreats/:id`<br>`/customer/retreats/:id` | `PublicLayout` hoặc `CustomerLayout` | Hero banner nghệ thuật, mô tả triết lý trị liệu, danh sách hạng Villa áp dụng, danh sách liệu trình spa kèm theo, chính sách bữa ăn hữu cơ, bảng giá chi tiết. | Click "Đặt Kỳ Nghỉ" ➔ Nếu chưa login chuyển Screen 5, nếu đã login chuyển Screen 15. |
| **15** | **Retreat Booking Form** | `/customer/booking/new`<br>`/receptionist/booking/walk-in` | `CustomerLayout` hoặc `OperationalLayout` | Bộ chọn ngày Check-in/Check-out (`DateRangePicker`), số lượng khách (Adults, Children), danh sách lựa chọn Villa Category với hình ảnh/tiện ích, ô nhập yêu cầu đặc biệt (`special_request`). | Click "Tiếp Tục Đến Tóm Tắt" ➔ Validate phòng trống, chuyển Screen 16. |
| **16** | **Booking Summary & Deposit** | `/customer/booking/summary` | `CustomerLayout` | Bảng tổng hợp chi phí: Tiền gói, phụ phí villa, thuế VAT (8/10%), số tiền cọc bắt buộc 30%, điều khoản hủy cọc, nút thanh toán VNPay Sandbox. | Click "Thanh Toán Đặt Cọc qua VNPay" ➔ Gọi API lấy VNPay URL, redirect sang cổng VNPay. |
| **17** | **Deposit Payment Result** | `/customer/booking/deposit-result` | `CustomerLayout` | Kết quả giao dịch phản hồi từ VNPay: Mã giao dịch (TxnRef), số tiền đã trả, mã đặt phòng (Booking Reference), trạng thái thanh toán (Thành công/Thất bại), nút in biên lai. | Click "Xem Kỳ Nghỉ Của Tôi" ➔ Screen 18.<br>Click "Lịch Trình Chi Tiết" ➔ Screen 19. |
| **18** | **My Bookings** | `/customer/bookings` | `CustomerLayout` | Danh sách lịch sử đặt phòng của Customer (tabs: Sắp tới, Đang ở, Đã hoàn thành, Đã hủy). Hiển thị mã booking, ngày ở, hạng villa, chip trạng thái (`CONFIRMED`, `CHECKED_IN`, v.v.). | Click vào booking card ➔ Chuyển Screen 19. |
| **19** | **Booking Detail & Itinerary** | `/customer/bookings/:id` | `CustomerLayout` | Thông tin chi tiết đặt phòng, căn villa đã phân bổ (nếu đã check-in), Timeline lịch trình từng ngày kết hợp: Giờ check-in, lịch Spa đã book (M3), thực đơn đã chọn (M4). Nút Hủy/Đổi ngày. | Nút "Đặt Thêm Liệu Trình Spa" ➔ Screen 25.<br>Nút "Chọn Thực Đơn" ➔ Screen 34. |
| **20** | **Receptionist Dashboard** | `/receptionist/dashboard` | `OperationalLayout` (Lễ tân) | Thẻ KPI tổng quan: Khách đến hôm nay (Expected Arrivals), Khách đi hôm nay (Departures), Khách đang lưu trú (In-house), Công suất phòng (Occupancy Rate). Lối tắt thao tác nhanh. | Click "Check-in Khách Đến" ➔ Screen 21.<br>Click "Tạo Walk-in Booking" ➔ Screen 15.<br>Click "Trạng Thái Villa" ➔ Screen 24. |
| **21** | **Daily Arrivals** | `/receptionist/arrivals` | `OperationalLayout` (Lễ tân) | Bảng danh sách khách dự kiến đến trong ngày: Giờ đến dự kiến (ETA), Họ tên Customer, Mã booking, Hạng villa đã đặt, Trạng thái cọc (Đã cọc 30%), Nút thao tác Check-in. Banner nhắc nhở khai báo lưu trú. | Click "Tiến Hành Check-In" ➔ Mở Screen 22 cho booking đã chọn. |
| **22** | **Check-In & Residence Info** | `/receptionist/check-in/:bookingId` | `OperationalLayout` (Lễ tân) | Form thông tin xác minh danh tính và đăng ký tạm trú: Số CCCD/Hộ chiếu, Ngày cấp, Nơi cấp, Quốc tịch, Nơi thường trú, Phương tiện di chuyển, Tải ảnh tài liệu (mô phỏng). | Click "Lưu & Tiếp Tục Phân Bổ Villa" ➔ Lưu `ResidenceRecord`, chuyển Screen 23. |
| **23** | **Villa Assignment** | `/receptionist/check-in/:bookingId/villa` | `OperationalLayout` (Lễ tân) | Danh sách căn villa vật lý (`PhysicalVilla`) thuộc đúng hạng phòng khách đã book. Hiển thị số phòng (101, 102), tầng, hướng nhìn, trạng thái sẵn sàng (`AVAILABLE` - màu xanh). | Click chọn căn villa ➔ Xác nhận phân bổ phòng ➔ Booking thành `CHECKED_IN`, phòng thành `OCCUPIED`. Trở về Screen 21 hoặc 24. |
| **24** | **Villa Status Management** | `/receptionist/villas` | `OperationalLayout` (Lễ tân) | Ma trận trực quan toàn bộ các căn Villa theo tầng/dãy. Các trạng thái trực quan: Sẵn sàng (Xanh lá), Đang có khách (Xanh dương), Cần dọn dẹp (Vàng đất), Đang bảo trì (Đỏ đất). Bộ lọc và cập nhật trạng thái nhanh. | Click vào thẻ Villa ➔ Modal chuyển đổi trạng thái (ví dụ từ `NEEDS_CLEANING` sang `AVAILABLE`). |

---

## 4. MÔ HÌNH DỮ LIỆU & LƯỢC ĐỒ CƠ SỞ DỮ LIỆU (DATABASE SCHEMA)

Thiết kế cơ sở dữ liệu trên **Microsoft SQL Server**, bám sát 100% Master Conceptual ERD (`HSWRMS_Master_Conceptual_ERD.png`) và script SQL chuẩn (`HSWRMS_SQLServer_Database.sql`).

### 4.1 Sơ đồ Quan hệ Thực thể Module 2 (ERD Fragment)

```
 [User] 1 ──── 1 [CustomerProfile]
                         │
                         │ 1 makes
                         ▼
┌────────────────────────────────────────────────────────┐
│                    RetreatBooking                      │
├────────────────────────────────────────────────────────┤
│ PK  retreat_booking_id        INT IDENTITY             │
│ FK  customer_profile_id       INT                      │
│ FK  retreat_package_id        INT                      │
│ FK  requested_villa_category_id INT                    │
│ FK  assigned_villa_id         INT (NULLable)           │
│     check_in_date             DATE                     │
│     check_out_date            DATE                     │
│     booking_status            VARCHAR(20)              │
│     deposit_amount            DECIMAL(18,2)            │
│     total_estimated_amount    DECIMAL(18,2)            │
│     special_request           NVARCHAR(1000)           │
│     created_at                DATETIME2(0)             │
└────────────┬─────────────┬─────────────┬───────────────┘
             │ 1           │ 1           │ 1
             │ has         │ opens       │ has
             ▼ 1           ▼ 1           ▼ 0..*
┌─────────────────────┐  ┌─────────────┐  ┌─────────────────────┐
│   ResidenceRecord   │  │    Folio    │  │ PaymentTransaction  │
├─────────────────────┤  ├─────────────┤  ├─────────────────────┤
│ PK residence_rec_id │  │ PK folio_id │  │ PK transaction_id  │
│ FK retreat_book_id  │  │ FK ret_book │  │ FK retreat_book_id  │
│    id_number        │  │  total_chrg │  │    payment_type     │
│    id_type          │  │  total_paid │  │    payment_method   │
│    nationality      │  │  bal_due    │  │    amount_paid      │
│    permanent_addr   │  │  status     │  │    payment_status   │
│    collected_at     │  └──────┬──────┘  └─────────────────────┘
└─────────────────────┘         │ 1 contains
                                ▼ 0..*
                         ┌─────────────┐
                         │  FolioItem  │ (charge_category = 'PACKAGE')
                         └─────────────┘
```

Về quan hệ Danh mục & Phòng:
```
┌──────────────────┐ 1        * ┌───────────────────────────┐ *        1 ┌──────────────────┐
│  RetreatPackage  │────────────│ RetreatPackageVillaCategory │───────────│  VillaCategory   │
└──────────────────┘ offers     └───────────────────────────┘           └─────────┬────────┘
                                                                                  │ 1 groups
                                                                                  ▼ *
                                                                        ┌──────────────────┐
                                                                        │  PhysicalVilla   │
                                                                        ├──────────────────┤
                                                                        │ PK villa_id      │
                                                                        │ FK category_id   │
                                                                        │    villa_number  │
                                                                        │    floor         │
                                                                        │    villa_status  │
                                                                        └──────────────────┘
```

### 4.2 Chi tiết DDL SQL Server cho Module 2

```sql
-- 1. Bảng RetreatPackage (Gói nghỉ dưỡng)
CREATE TABLE dbo.RetreatPackage (
    retreat_package_id  INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RetreatPackage PRIMARY KEY,
    package_name        NVARCHAR(150) NOT NULL CONSTRAINT UQ_RetreatPackage_Name UNIQUE,
    wellness_goal       NVARCHAR(250) NULL, -- Ví dụ: 'Detox & Cleanse', 'Stress Relief', 'Rejuvenation'
    duration_nights     INT NOT NULL CONSTRAINT CK_RetreatPackage_Duration CHECK (duration_nights > 0),
    base_price          DECIMAL(18,2) NOT NULL CONSTRAINT CK_RetreatPackage_Price CHECK (base_price >= 0),
    package_status      VARCHAR(20) NOT NULL CONSTRAINT DF_RetreatPackage_Status DEFAULT ('ACTIVE')
                        CONSTRAINT CK_RetreatPackage_Status CHECK (package_status IN ('ACTIVE','INACTIVE'))
);

-- 2. Bảng VillaCategory (Hạng Villa)
CREATE TABLE dbo.VillaCategory (
    villa_category_id   INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_VillaCategory PRIMARY KEY,
    category_name       NVARCHAR(120) NOT NULL CONSTRAINT UQ_VillaCategory_Name UNIQUE,
    max_occupancy       INT NOT NULL CONSTRAINT CK_VillaCategory_Occupancy CHECK (max_occupancy > 0),
    price_modifier      DECIMAL(18,2) NOT NULL CONSTRAINT DF_VillaCategory_PriceModifier DEFAULT (0),
    category_status     VARCHAR(20) NOT NULL CONSTRAINT DF_VillaCategory_Status DEFAULT ('ACTIVE')
                        CONSTRAINT CK_VillaCategory_Status CHECK (category_status IN ('ACTIVE','INACTIVE'))
);

-- 3. Bảng liên kết RetreatPackage - VillaCategory
CREATE TABLE dbo.RetreatPackageVillaCategory (
    retreat_package_id  INT NOT NULL,
    villa_category_id   INT NOT NULL,
    CONSTRAINT PK_RetreatPackageVillaCategory PRIMARY KEY (retreat_package_id, villa_category_id),
    CONSTRAINT FK_RPVC_RetreatPackage FOREIGN KEY (retreat_package_id) REFERENCES dbo.RetreatPackage(retreat_package_id),
    CONSTRAINT FK_RPVC_VillaCategory FOREIGN KEY (villa_category_id) REFERENCES dbo.VillaCategory(villa_category_id)
);

-- 4. Bảng PhysicalVilla (Căn Villa vật lý cụ thể)
CREATE TABLE dbo.PhysicalVilla (
    villa_id            INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_PhysicalVilla PRIMARY KEY,
    villa_category_id   INT NOT NULL,
    villa_number        NVARCHAR(30) NOT NULL CONSTRAINT UQ_PhysicalVilla_Number UNIQUE,
    floor               NVARCHAR(30) NULL,
    villa_status        VARCHAR(30) NOT NULL CONSTRAINT DF_PhysicalVilla_Status DEFAULT ('AVAILABLE')
                        CONSTRAINT CK_PhysicalVilla_Status CHECK (villa_status IN ('AVAILABLE','OCCUPIED','MAINTENANCE','NEEDS_CLEANING','INACTIVE')),
    CONSTRAINT FK_PhysicalVilla_Category FOREIGN KEY (villa_category_id) REFERENCES dbo.VillaCategory(villa_category_id)
);

-- 5. Bảng RetreatBooking (Đơn đặt kỳ nghỉ)
CREATE TABLE dbo.RetreatBooking (
    retreat_booking_id          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_RetreatBooking PRIMARY KEY,
    customer_profile_id         INT NOT NULL,
    retreat_package_id          INT NOT NULL,
    requested_villa_category_id INT NOT NULL,
    assigned_villa_id           INT NULL, -- Chỉ gán khi Lễ tân check-in
    check_in_date               DATE NOT NULL,
    check_out_date              DATE NOT NULL,
    booking_status              VARCHAR(20) NOT NULL CONSTRAINT DF_RetreatBooking_Status DEFAULT ('PENDING')
                                CONSTRAINT CK_RetreatBooking_Status CHECK (booking_status IN ('PENDING','CONFIRMED','CHECKED_IN','CANCELLED','COMPLETED')),
    deposit_amount              DECIMAL(18,2) NOT NULL CONSTRAINT DF_RetreatBooking_Deposit DEFAULT (0),
    total_estimated_amount      DECIMAL(18,2) NOT NULL CONSTRAINT DF_RetreatBooking_Estimated DEFAULT (0),
    special_request             NVARCHAR(1000) NULL,
    created_at                  DATETIME2(0) NOT NULL CONSTRAINT DF_RetreatBooking_CreatedAt DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT FK_RetreatBooking_Customer FOREIGN KEY (customer_profile_id) REFERENCES dbo.CustomerProfile(customer_profile_id),
    CONSTRAINT FK_RetreatBooking_Package FOREIGN KEY (retreat_package_id) REFERENCES dbo.RetreatPackage(retreat_package_id),
    CONSTRAINT FK_RetreatBooking_RequestedCategory FOREIGN KEY (requested_villa_category_id) REFERENCES dbo.VillaCategory(villa_category_id),
    CONSTRAINT FK_RetreatBooking_AssignedVilla FOREIGN KEY (assigned_villa_id) REFERENCES dbo.PhysicalVilla(villa_id),
    CONSTRAINT CK_RetreatBooking_Dates CHECK (check_out_date > check_in_date),
    CONSTRAINT CK_RetreatBooking_Amounts CHECK (deposit_amount >= 0 AND total_estimated_amount >= 0)
);

-- 6. Bảng ResidenceRecord (Khai báo tạm trú - Luật Cư trú 2020)
CREATE TABLE dbo.ResidenceRecord (
    residence_record_id   INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ResidenceRecord PRIMARY KEY,
    retreat_booking_id    INT NOT NULL CONSTRAINT UQ_ResidenceRecord_Booking UNIQUE,
    identification_number NVARCHAR(100) NOT NULL, -- CCCD / Passport
    identification_type   NVARCHAR(50) NOT NULL,  -- 'CCCD', 'PASSPORT', 'OTHER'
    nationality           NVARCHAR(100) NULL,
    permanent_address     NVARCHAR(500) NULL,
    collected_at          DATETIME2(0) NOT NULL CONSTRAINT DF_ResidenceRecord_CollectedAt DEFAULT (SYSUTCDATETIME()),
    
    CONSTRAINT FK_ResidenceRecord_Booking FOREIGN KEY (retreat_booking_id) REFERENCES dbo.RetreatBooking(retreat_booking_id)
);

-- Tạo Index tăng tốc truy vấn đặt phòng và kiểm tra phòng trống
CREATE INDEX IX_RetreatBooking_Dates_Status ON dbo.RetreatBooking (check_in_date, check_out_date, booking_status);
CREATE INDEX IX_RetreatBooking_Customer ON dbo.RetreatBooking (customer_profile_id);
CREATE INDEX IX_PhysicalVilla_Category_Status ON dbo.PhysicalVilla (villa_category_id, villa_status);
```

---

## 5. THIẾT KẾ KIẾN TRÚC HỆ THỐNG & BACKEND M2

### 5.1 Cấu trúc Package Backend (`Spring Boot 3.x`)
Triển khai theo mô hình **Modular Monolith** sạch sẽ, đúng theo định hướng kiến trúc:

```
com.heavenstay.hswrms
├── config
│   ├── SecurityConfig.java
│   └── VNPayConfig.java
├── common
│   ├── exception
│   │   ├── GlobalExceptionHandler.java
│   │   ├── ResourceNotFoundException.java
│   │   └── BusinessConflictException.java
│   └── response
│       └── ApiResponse.java
└── m2booking
    ├── controller
    │   ├── RetreatPackageController.java        // Public & Customer xem gói
    │   ├── RetreatBookingController.java        // Customer đặt phòng, hủy, xem lịch trình
    │   ├── ReceptionistCheckInController.java   // Lễ tân check-in, gán villa, khai báo tạm trú
    │   ├── VillaManagementController.java       // Lễ tân quản lý trạng thái villa
    │   └── VNPayDepositCallbackController.java  // Tiếp nhận callback thanh toán cọc VNPay
    ├── dto
    │   ├── request
    │   │   ├── BookingCalculationRequest.java
    │   │   ├── CreateBookingRequest.java
    │   │   ├── CheckInResidenceRequest.java
    │   │   ├── AssignVillaRequest.java
    │   │   ├── UpdateVillaStatusRequest.java
    │   │   └── WalkInBookingRequest.java
    │   └── response
    │       ├── RetreatPackageDetailResponse.java
    │       ├── BookingSummaryResponse.java
    │       ├── BookingDetailResponse.java
    │       ├── DailyArrivalItemResponse.java
    │       └── VillaMatrixItemResponse.java
    ├── entity
    │   ├── RetreatPackage.java
    │   ├── VillaCategory.java
    │   ├── PhysicalVilla.java
    │   ├── RetreatBooking.java
    │   └── ResidenceRecord.java
    ├── repository
    │   ├── RetreatPackageRepository.java
    │   ├── VillaCategoryRepository.java
    │   ├── PhysicalVillaRepository.java
    │   ├── RetreatBookingRepository.java
    │   └── ResidenceRecordRepository.java
    └── service
        ├── RetreatPackageService.java
        ├── RetreatBookingService.java
        ├── VillaAvailabilityService.java       // Thuật toán kiểm tra số lượng villa trống
        ├── ReceptionistOperationService.java    // Check-in & Residence record
        └── VNPayDepositService.java            // Sinh URL VNPay & xác minh HMAC SHA512
```

### 5.2 Thuật toán Kiểm tra Sẵn sàng của Hạng Villa (`Availability Engine`)
Customer không đặt căn villa cụ thể mà đặt theo `VillaCategory`. Do đó, số lượng phòng trống của một Hạng phòng trong khoảng thời gian `[check_in_date, check_out_date)` được tính như sau:

$$\text{AvailableCount}(cat, in, out) = \text{TotalActiveVillas}(cat) - \text{BookedCount}(cat, in, out)$$

Trong đó:
- $\text{TotalActiveVillas}(cat)$: Tổng số `PhysicalVilla` có `villa_category_id = cat` và `villa_status != 'INACTIVE'`.
- $\text{BookedCount}(cat, in, out)$: Số lượng đơn `RetreatBooking` có `requested_villa_category_id = cat`, trạng thái thuộc `('CONFIRMED', 'CHECKED_IN')` (hoặc `PENDING` còn trong thời gian giữ chỗ thanh toán 15 phút), thỏa mãn điều kiện giao nhau về mặt thời gian:
$$\text{booking.check\_in\_date} < out \quad \text{VÀ} \quad \text{booking.check\_out\_date} > in$$

**Truy vấn SQL Tối ưu:**
```sql
SELECT vc.villa_category_id, vc.category_name,
       (COUNT(DISTINCT pv.villa_id) - COUNT(DISTINCT rb.retreat_booking_id)) AS available_villas
FROM dbo.VillaCategory vc
LEFT JOIN dbo.PhysicalVilla pv 
       ON pv.villa_category_id = vc.villa_category_id 
      AND pv.villa_status <> 'INACTIVE'
LEFT JOIN dbo.RetreatBooking rb 
       ON rb.requested_villa_category_id = vc.villa_category_id
      AND rb.booking_status IN ('CONFIRMED', 'CHECKED_IN')
      AND rb.check_in_date < @CheckOutDate 
      AND rb.check_out_date > @CheckInDate
WHERE vc.villa_category_id = @RequestedCategoryId
GROUP BY vc.villa_category_id, vc.category_name;
```

---

## 6. ĐẶC TẢ TẬP API RESTFUL (REST API CONTRACTS)

### 6.1 Nhóm API dành cho Public & Customer

#### 1. Lấy danh sách gói nghỉ dưỡng
- **Endpoint:** `GET /api/v1/retreat-packages`
- **Quyền truy cập:** Public
- **Query Params:** `?goal=Detox&minDays=3&maxDays=7`
- **Response 200 OK:**
```json
[
  {
    "retreatPackageId": 1,
    "packageName": "7-Day Rejuvenation & Detox Sanctuary",
    "wellnessGoal": "Detox & Cleanse",
    "durationNights": 7,
    "basePrice": 35000000.00,
    "packageStatus": "ACTIVE",
    "includedTherapiesCount": 5,
    "includedDailyMeals": true,
    "imageUrl": "/assets/packages/detox_sanctuary.webp"
  }
]
```

#### 2. Lấy chi tiết gói nghỉ dưỡng
- **Endpoint:** `GET /api/v1/retreat-packages/{id}`
- **Quyền truy cập:** Public
- **Response 200 OK:**
```json
{
  "retreatPackageId": 1,
  "packageName": "7-Day Rejuvenation & Detox Sanctuary",
  "wellnessGoal": "Detox & Cleanse",
  "durationNights": 7,
  "basePrice": 35000000.00,
  "description": "Thanh lọc cơ thể và tâm trí giữa không gian biển nguyên sơ...",
  "availableVillaCategories": [
    {
      "villaCategoryId": 101,
      "categoryName": "Tranquil Garden Villa",
      "priceModifier": 0.00,
      "maxOccupancy": 2
    },
    {
      "villaCategoryId": 102,
      "categoryName": "Ocean Pool Sanctuary",
      "priceModifier": 12000000.00,
      "maxOccupancy": 2
    }
  ]
}
```

#### 3. Tính toán chi phí & Kiểm tra phòng trước khi đặt
- **Endpoint:** `POST /api/v1/bookings/calculate`
- **Quyền truy cập:** Customer (`ROLE_CUSTOMER`)
- **Request Body:**
```json
{
  "retreatPackageId": 1,
  "villaCategoryId": 102,
  "checkInDate": "2026-11-10",
  "checkOutDate": "2026-11-17",
  "guestCount": 2
}
```
- **Response 200 OK:**
```json
{
  "isAvailable": true,
  "availableCount": 3,
  "packageBaseAmount": 35000000.00,
  "villaModifierAmount": 12000000.00,
  "taxAmount": 4700000.00,
  "totalEstimatedAmount": 51700000.00,
  "requiredDepositAmount": 15510000.00,
  "depositPercentage": 30
}
```

#### 4. Tạo đơn đặt kỳ nghỉ (Draft Booking)
- **Endpoint:** `POST /api/v1/customer/bookings`
- **Quyền truy cập:** Customer (`ROLE_CUSTOMER`)
- **Request Body:**
```json
{
  "retreatPackageId": 1,
  "villaCategoryId": 102,
  "checkInDate": "2026-11-10",
  "checkOutDate": "2026-11-17",
  "specialRequest": "Tầng cao, ưu tiên view biển yên tĩnh"
}
```
- **Response 201 Created:**
```json
{
  "retreatBookingId": 501,
  "bookingStatus": "PENDING",
  "totalEstimatedAmount": 51700000.00,
  "depositAmount": 15510000.00,
  "paymentHoldExpiresAt": "2026-10-18T23:45:00Z"
}
```

#### 5. Khởi tạo URL thanh toán cọc qua VNPay
- **Endpoint:** `POST /api/v1/customer/bookings/{bookingId}/vnpay-url`
- **Quyền truy cập:** Customer (`ROLE_CUSTOMER`)
- **Response 200 OK:**
```json
{
  "paymentUrl": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?vnp_Amount=1551000000&vnp_Command=pay&vnp_CreateDate=20261018231500&vnp_CurrCode=VND&vnp_IpAddr=127.0.0.1&vnp_Locale=vn&vnp_OrderInfo=HSWRMS+Dat+coc+booking+501&vnp_OrderType=other&vnp_ReturnUrl=http%3A%2F%2Flocalhost%3A5173%2Fcustomer%2Fbooking%2Fdeposit-result&vnp_TmnCode=HEAVENSTAY&vnp_TxnRef=HSW_DEP_501_1729271700&vnp_Version=2.1.0&vnp_SecureHash=a9b8c7..."
}
```

#### 6. IPN Callback từ VNPay (Backend-to-Backend)
- **Endpoint:** `GET /api/v1/payments/vnpay-ipn`
- **Quyền truy cập:** Public (Xác thực bằng VNPay Secure Hash)
- **Xử lý nghiệp vụ:**
  - Kiểm tra Checksum SHA512.
  - Lấy `bookingId` từ `vnp_TxnRef`.
  - Kiểm tra trạng thái hiện tại của đơn (đảm bảo tính Idempotency, không cộng tiền 2 lần).
  - Cập nhật `RetreatBooking.booking_status = 'CONFIRMED'`.
  - Mở `Folio`, ghi nhận tiền cọc vào `PaymentTransaction` và tạo `FolioItem` ghi nhận tiền gói.

#### 7. Lấy danh sách kỳ nghỉ của tôi & Lịch trình
- **Endpoint:** `GET /api/v1/customer/bookings` (Danh sách)
- **Endpoint:** `GET /api/v1/customer/bookings/{id}` (Chi tiết + Itinerary)
- **Quyền truy cập:** Customer sở hữu đơn (`ROLE_CUSTOMER`)

---

### 6.2 Nhóm API Vận hành Lễ tân (Front Desk Operations)

#### 1. Lấy danh sách khách đến hôm nay (Daily Arrivals)
- **Endpoint:** `GET /api/v1/receptionist/arrivals`
- **Quyền truy cập:** Receptionist (`ROLE_RECEPTIONIST`)
- **Query Params:** `?date=2026-10-19`
- **Response 200 OK:**
```json
[
  {
    "retreatBookingId": 501,
    "customerFullName": "Eleanor Vance",
    "customerEmail": "eleanor.vance@example.com",
    "customerPhone": "+84912345678",
    "packageName": "7-Day Rejuvenation & Detox Sanctuary",
    "requestedCategoryName": "Ocean Pool Sanctuary",
    "checkInDate": "2026-10-19",
    "checkOutDate": "2026-10-26",
    "bookingStatus": "CONFIRMED",
    "depositPaid": 15510000.00,
    "assignedVillaNumber": null,
    "hasHealthProfile": true
  }
]
```

#### 2. Đăng ký thông tin cư trú (Luật Cư trú 2020)
- **Endpoint:** `POST /api/v1/receptionist/check-in/{bookingId}/residence-record`
- **Quyền truy cập:** Receptionist (`ROLE_RECEPTIONIST`)
- **Request Body:**
```json
{
  "identificationNumber": "079098012345",
  "identificationType": "CCCD",
  "nationality": "Việt Nam",
  "permanentAddress": "Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
}
```
- **Response 200 OK:**
```json
{
  "residenceRecordId": 12,
  "bookingId": 501,
  "collectedAt": "2026-10-19T08:30:00Z",
  "status": "RECORDED"
}
```

#### 3. Tra cứu danh sách Villa vật lý sẵn sàng để phân bổ
- **Endpoint:** `GET /api/v1/receptionist/check-in/{bookingId}/available-villas`
- **Quyền truy cập:** Receptionist (`ROLE_RECEPTIONIST`)
- **Response 200 OK:**
```json
[
  {
    "villaId": 12,
    "villaNumber": "Villa 102",
    "floor": "Tầng 1",
    "villaStatus": "AVAILABLE",
    "categoryName": "Ocean Pool Sanctuary"
  },
  {
    "villaId": 15,
    "villaNumber": "Villa 105",
    "floor": "Tầng 1",
    "villaStatus": "AVAILABLE",
    "categoryName": "Ocean Pool Sanctuary"
  }
]
```

#### 4. Xác nhận phân bổ Villa & Hoàn tất Check-in
- **Endpoint:** `POST /api/v1/receptionist/check-in/{bookingId}/assign-villa`
- **Quyền truy cập:** Receptionist (`ROLE_RECEPTIONIST`)
- **Request Body:**
```json
{
  "physicalVillaId": 12
}
```
- **Xử lý Transactional:**
  1. Kiểm tra `ResidenceRecord` đã được thu thập cho booking chưa (Bắt buộc).
  2. Khóa dòng villa (`SELECT ... FOR UPDATE` hoặc `@Lock(PESSIMISTIC_WRITE)`).
  3. Kiểm tra villa có đúng hạng phòng và `villa_status == 'AVAILABLE'`.
  4. Cập nhật `RetreatBooking.assigned_villa_id = 12`, `booking_status = 'CHECKED_IN'`.
  5. Cập nhật `PhysicalVilla.villa_status = 'OCCUPIED'`.

#### 5. Cập nhật trạng thái dọn dẹp / bảo trì Villa
- **Endpoint:** `PATCH /api/v1/receptionist/villas/{villaId}/status`
- **Quyền truy cập:** Receptionist (`ROLE_RECEPTIONIST`)
- **Request Body:**
```json
{
  "newStatus": "AVAILABLE",
  "note": "Housekeeping hoàn thành khử khuẩn"
}
```

---

## 7. QUY TRÌNH TÍCH HỢP CỔNG THANH TOÁN VNPAY CHO ĐẶT CỌC M2

```
Customer                Frontend (React)           HSWRMS Backend                 VNPay Gateway
   │                           │                         │                              │
   │── Click "Thanh Toán Cọc" ─►│                         │                              │
   │                           │── POST /bookings/{id}/vnpay-url ─►                      │
   │                           │                         │── Tạo vnp_TxnRef,            │
   │                           │                         │   băm HMAC-SHA512 checksum   │
   │                           │◄─ Trả về paymentUrl ────│                              │
   │◄─ Redirect sang VNPay ────│                         │                              │
   │                                                                                    │
   │────────────────────── Nhập thông tin thẻ/QR trên VNPay Sandbox ───────────────────►│
   │                                                                                    │
   │◄───────────────────── Redirect về ReturnUrl (/deposit-result) ─────────────────────│
   │                           │                                                        │
   │                           │── Query params: vnp_ResponseCode, vnp_SecureHash... ──►│
   │                           │                                                        │
   │                           │                 (Đồng thời nhận IPN ngầm)              │
   │                           │                         │◄── GET /payments/vnpay-ipn ──│
   │                           │                         │── Checksum OK? Cập nhật DB   │
   │                           │                         │── Cập nhật Booking -> CONFIRMED
   │                           │                         │── Mở Folio & ghi nhận cọc   │
   │                           │                         │── Trả 200 {"RspCode":"00"} ──►
   │                           │                                                        │
   │◄── Hiển thị Màn hình 17 ──│                                                        │
   │    (Deposit Result)       │                                                        │
```

### Mã hóa Checksum & Xác thực VNPay (Mã nguồn Java mẫu)
```java
public String generateVNPayUrl(RetreatBooking booking, HttpServletRequest request) {
    Map<String, String> vnp_Params = new HashMap<>();
    vnp_Params.put("vnp_Version", "2.1.0");
    vnp_Params.put("vnp_Command", "pay");
    vnp_Params.put("vnp_TmnCode", vnPayProperties.getTmnCode());
    vnp_Params.put("vnp_Amount", String.valueOf((long)(booking.getDepositAmount().doubleValue() * 100)));
    vnp_Params.put("vnp_CurrCode", "VND");
    vnp_Params.put("vnp_TxnRef", "HSW_DEP_" + booking.getRetreatBookingId() + "_" + System.currentTimeMillis());
    vnp_Params.put("vnp_OrderInfo", "HSWRMS Dat coc booking #" + booking.getRetreatBookingId());
    vnp_Params.put("vnp_OrderType", "other");
    vnp_Params.put("vnp_Locale", "vn");
    vnp_Params.put("vnp_ReturnUrl", vnPayProperties.getReturnUrl());
    vnp_Params.put("vnp_IpAddr", VNPayUtil.getIpAddress(request));
    vnp_Params.put("vnp_CreateDate", new SimpleDateFormat("yyyyMMddHHmmss").format(new Date()));

    // Sắp xếp params theo thứ tự alphabet
    List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
    Collections.sort(fieldNames);
    
    StringBuilder hashData = new StringBuilder();
    StringBuilder query = new StringBuilder();
    for (String fieldName : fieldNames) {
        String value = vnp_Params.get(fieldName);
        if (value != null && !value.isEmpty()) {
            hashData.append(fieldName).append('=').append(URLEncoder.encode(value, StandardCharsets.US_ASCII)).append('&');
            query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII)).append('=')
                 .append(URLEncoder.encode(value, StandardCharsets.US_ASCII)).append('&');
        }
    }
    hashData.setLength(hashData.length() - 1);
    query.setLength(query.length() - 1);

    String secureHash = VNPayUtil.hmacSHA512(vnPayProperties.getHashSecret(), hashData.toString());
    query.append("&vnp_SecureHash=").append(secureHash);

    return vnPayProperties.getPayUrl() + "?" + query.toString();
}
```

---

## 8. BẢO MẬT, KIỂM SOÁT PHÂN QUYỀN (RBAC) & TỐI THIỂU HÓA DỮ LIỆU

### 8.1 Ma trận Phân quyền Module 2 (RBAC Matrix)

| Endpoint / Nhóm chức năng | Public Visitor | Customer | Receptionist | Spa Therapist | F&B Staff | Manager | Admin |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `GET /retreat-packages/**` | Cho phép | Cho phép | Cho phép | Cho phép | Cho phép | Cho phép | Toàn quyền |
| `POST /customer/bookings/**` | Từ chối | **Toàn quyền** (Chỉ đơn của mình) | Từ chối | Từ chối | Từ chối | Xem | Xem |
| `GET /customer/bookings/{id}` | Từ chối | **Chỉ đơn của mình** | Xem | Từ chối | Từ chối | Xem | Xem |
| `GET /receptionist/arrivals` | Từ chối | Từ chối | **Toàn quyền** | Từ chối | Từ chối | Xem | Xem |
| `POST /receptionist/check-in/**` | Từ chối | Từ chối | **Toàn quyền** | Từ chối | Từ chối | Xem | Xem |
| `PATCH /receptionist/villas/**` | Từ chối | Từ chối | **Toàn quyền** | Từ chối | Từ chối | Xem | Xem |
| `POST /receptionist/walk-in` | Từ chối | Từ chối | **Toàn quyền** | Từ chối | Từ chối | Xem | Xem |

### 8.2 Nguyên tắc Tối thiểu hóa Dữ liệu Nhạy cảm (Sensitive Data Minimization)
- **Đối với Lễ tân (Receptionist):** Khi xử lý Check-in trên Màn hình 22, Lễ tân được quyền truy cập thông tin định danh công dân (`ResidenceRecord`) để làm việc với cơ quan công an theo Luật Cư trú 2020. Tuy nhiên, hệ thống **tuyệt đối không hiển thị** chẩn đoán bệnh lý chi tiết, triệu chứng y tế nhạy cảm của khách; Lễ tân chỉ nhìn thấy cờ chỉ báo (`hasHealthProfile = true/false`) để nhắc khách hoàn thiện hồ sơ.
- **Đối với Kỹ thuật viên Spa & Đầu bếp:** Không nhìn thấy số CCCD, hộ chiếu hay địa chỉ thường trú của khách hàng trong bảng `ResidenceRecord`.

---

## 9. KẾ HOẠCH TRIỂN KHAI TỪNG BƯỚC (STEP-BY-STEP IMPLEMENTATION ROADMAP)

Để triển khai dự án vào thực tế một cách chuẩn mực, quá trình được chia thành 5 giai đoạn rõ ràng:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Giai đoạn 1: Database Setup & DDL Schema Execution (SQL Server)        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Giai đoạn 2: Backend Entities, Repositories & DTOs                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Giai đoạn 3: Business Services & Concurrency Locking                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Giai đoạn 4: REST Controllers & VNPay Gateway Integration              │
└───────────────────────────────────┬────────────────────────────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│ Giai đoạn 5: Frontend Migration & React Component Connection           │
└────────────────────────────────────────────────────────────────────────┘
```

### Bước 1: Khởi tạo Cơ sở dữ liệu & Chèn Seed Data Mẫu
1. Chạy script DDL tạo 6 bảng chính của M2: `RetreatPackage`, `VillaCategory`, `RetreatPackageVillaCategory`, `PhysicalVilla`, `RetreatBooking`, `ResidenceRecord`.
2. Chèn dữ liệu mẫu thực tế:
   - 4 Hạng phòng: *Tranquil Garden Villa* (4 căn), *Ocean Pool Sanctuary* (3 căn), *Mountain Sunrise Suite* (3 căn), *Forest Wellness Residence* (2 căn).
   - 12 Căn phòng vật lý: Villa 101 -> 112 với các trạng thái khác nhau (`AVAILABLE`, `OCCUPIED`, `NEEDS_CLEANING`).
   - 3 Gói nghỉ dưỡng: *7-Day Detox*, *5-Day Mindfulness*, *3-Day Energy Rejuvenation*.

### Bước 2: Xây dựng Backend JPA Layer
1. Tạo các JPA Entity ánh xạ chính xác với cột và khóa ngoại trong SQL Server.
2. Viết các custom query trong `RetreatBookingRepository` và `PhysicalVillaRepository`:
   - `countBookedVillasByCategoryAndDateRange(...)`
   - `findAvailablePhysicalVillasByCategory(...)`
   - `findTodayArrivals(LocalDate date)`

### Bước 3: Phát triển Service Layer & Xử lý Transaction
1. Cài đặt `VillaAvailabilityService`: Triển khai thuật toán kiểm tra phòng trống.
2. Cài đặt `RetreatBookingService`:
   - `@Transactional`: Đặt cọc, tạo đơn, sinh mã booking tham chiếu duy nhất.
   - Cơ chế khóa lạc quan (`@Version`) hoặc khóa bi quan khi chọn căn villa vật lý.
3. Cài đặt `ReceptionistOperationService`:
   - Lưu thông tin `ResidenceRecord`.
   - Phân bổ phòng: Kiểm tra chặt chẽ điều kiện villa đang `AVAILABLE` và thuộc đúng hạng phòng.
   - Đổi trạng thái villa sang `OCCUPIED`.

### Bước 4: Tích hợp Cổng thanh toán VNPay Sandbox
1. Tạo module cấu hình `VNPayConfig`.
2. Viết hàm tiện ích tính mã băm `hmacSHA512` bảo mật.
3. Tạo 2 endpoint tiếp nhận phản hồi:
   - Endpoint người dùng: `GET /customer/booking/deposit-result` (Màn hình 17).
   - Endpoint máy chủ (IPN): `GET /api/v1/payments/vnpay-ipn` để chốt đơn kể cả khi khách tắt trình duyệt.

### Bước 5: Kết nối Frontend React Prototype
1. Tận dụng 100% giao diện đã hoàn thiện tại `04_Implement/Frontend_Prototype/src/pages/retreats/` và `receptionist/`.
2. Thay thế `mockData` bằng các hàm gọi API REST (`axios` hoặc `fetch`) tương ứng:
   - `RetreatListPage.tsx` & `RetreatDetailPage.tsx` gọi `GET /api/v1/retreat-packages`.
   - `RetreatBookingPage.tsx` gọi `POST /api/v1/bookings/calculate` và `POST /api/v1/customer/bookings`.
   - `DailyArrivalsPage.tsx` gọi `GET /api/v1/receptionist/arrivals`.
   - `CheckInPage.tsx` gọi `POST /api/v1/receptionist/check-in/{id}/residence-record`.
   - `VillaAssignmentPage.tsx` gọi `GET .../available-villas` và `POST .../assign-villa`.
   - `VillaStatusPage.tsx` gọi `GET /api/v1/receptionist/villas` và `PATCH .../status`.

---

## 10. BẢNG KỊCH BẢN KIỂM THỬ & TIÊU CHÍ NGHIỆM THU (TEST CASES & ACCEPTANCE CRITERIA)

| Mã Test | Tên kịch bản kiểm thử | Dữ liệu đầu vào | Kết quả kỳ vọng | Tiêu chí đạt (Acceptance Criteria) |
|:---:|:---|:---|:---|:---|
| **TC-M2-01** | Khách tìm kiếm và lọc gói nghỉ dưỡng | Chọn filter `Wellness Goal = "Detox"` | Chỉ hiển thị các gói có mục tiêu Detox. Hiển thị đúng giá sàn và thời lượng. | Dữ liệu phản hồi chuẩn xác, không có lỗi console. |
| **TC-M2-02** | Kiểm tra phòng trống thành công | Chọn ngày 20/11 -> 27/11, Hạng villa còn trống | API trả về `isAvailable = true`, tính đúng 30% tiền cọc. | Tổng tiền = Giá gói + Phụ thu villa + Thuế. Cọc = 30% tổng. |
| **TC-M2-03** | Ngăn chặn đặt phòng khi hết villa trong hạng | Chọn ngày mà tất cả villa của hạng đó đã kín chỗ | API trả về `isAvailable = false`, hiển thị thông báo hết phòng và gợi ý đổi ngày. | Hệ thống chặn không cho tạo đơn, không sinh URL thanh toán. |
| **TC-M2-04** | Thanh toán đặt cọc VNPay thành công | Giả lập thẻ test VNPay thành công (`vnp_ResponseCode = "00"`) | Booking chuyển trạng thái thành `CONFIRMED`. Tạo bản ghi FolioItem và PaymentTransaction. Màn hình 17 hiển thị thành công. | Checksum HMAC SHA512 khớp 100%, ghi log giao dịch đầy đủ. |
| **TC-M2-05** | Thanh toán đặt cọc VNPay thất bại / hủy | Hủy giao dịch trên VNPay (`vnp_ResponseCode = "24"`) | Booking giữ nguyên `PENDING`, hiển thị thông báo lỗi trên màn hình 17 kèm nút thanh toán lại. | Không tạo FolioItem thanh toán, giải phóng giữ chỗ sau timeout. |
| **TC-M2-06** | Lễ tân thực hiện Check-in đầy đủ thủ tục | Nhập CCCD, Quốc tịch, Địa chỉ ➔ Chọn Villa 102 (`AVAILABLE`) | Lưu bản ghi `ResidenceRecord`. Cập nhật Booking -> `CHECKED_IN`, Villa 102 -> `OCCUPIED`. | Kiểm tra trong DB có đủ dòng `ResidenceRecord` và trạng thái villa cập nhật ngay lập tức trên Màn hình 24. |
| **TC-M2-07** | Chặn Check-in khi chưa nhập thông tin cư trú | Lễ tân bỏ qua bước nhập thông tin cư trú, bấm phân bổ phòng | Hệ thống báo lỗi đỏ: "Bắt buộc thu thập thông tin cư trú theo Luật Cư trú 2020 trước khi cấp phòng". | Nút xác nhận phân bổ phòng bị vô hiệu hóa hoặc API trả về 400 Bad Request. |
| **TC-M2-08** | Tranh chấp phân bổ phòng đồng thời (Concurrency Test) | 2 Lễ tân cùng chọn 1 Căn Villa 102 cho 2 khách khác nhau | Lễ tân thứ nhất thành công; Lễ tân thứ hai nhận thông báo: "Villa 102 vừa được cấp cho khách khác, vui lòng chọn căn khác". | Đảm bảo khóa bi quan (`PESSIMISTIC_WRITE`), không xảy ra overbooking phòng vật lý. |
| **TC-M2-09** | Cập nhật trạng thái buồng phòng (Housekeeping Matrix) | Lễ tân đổi Villa 105 từ `NEEDS_CLEANING` sang `AVAILABLE` | Trạng thái phòng đổi sang màu xanh trên màn hình 24, phòng sẵn sàng để phân bổ cho lượt khách mới. | API trả về 200 OK, phát sự kiện WebSocket/Polling cập nhật giao diện. |

---

## 11. CÂU HỎI VẢ BẢO VỆ ĐỒ ÁN (DEFENSE VIVA Q&A GỢI Ý CHO MODULE 2)

### Câu hỏi 1: Tại sao hệ thống lại tách biệt `VillaCategory` và `PhysicalVilla`? Khách có được tự chọn số phòng khi đặt online không?
**Trả lời:**  
> "Hệ thống HSWRMS thiết kế theo chuẩn nghiệp vụ của các khu nghỉ dưỡng cao cấp (Luxury Wellness Resort). Khi khách đặt online, khách chỉ chọn và thanh toán cho **Hạng Villa (VillaCategory)** (ví dụ: Ocean Pool Sanctuary) căn cứ theo diện tích và tiện ích mong muốn.  
> Khách **không được chọn số phòng cụ thể** vì lý do vận hành buồng phòng linh hoạt: một căn phòng thực tế có thể phát sinh hỏng hóc cần bảo trì (`MAINTENANCE`), khách trước xin trả phòng trễ (Late Checkout), hoặc cần thời gian dọn dẹp khử khuẩn (`NEEDS_CLEANING`). Thẩm quyền gán **Căn Villa vật lý cụ thể (PhysicalVilla)** thuộc về Lễ tân vào thời điểm khách có mặt Check-in tại quầy, đảm bảo phòng bàn giao luôn sạch sẽ và sẵn sàng."

### Câu hỏi 2: Khâu Check-in của hệ thống đáp ứng quy định pháp luật Việt Nam như thế nào?
**Trả lời:**  
> "Hệ thống tuân thủ nghiêm ngặt **Luật Cư trú 2020** và **Nghị định 144/2021/NĐ-CP** về thông báo lưu trú đối với cơ sở kinh doanh lưu trú du lịch. Khi Lễ tân làm thủ tục tại Màn hình 22, hệ thống bắt buộc nhập Số CCCD/Hộ chiếu, quốc tịch, nơi thường trú của khách để lưu vào bảng `ResidenceRecord`.  
> Đồng thời, để tuân thủ nguyên tắc **Bảo vệ dữ liệu cá nhân**, thông tin này chỉ Lễ tân và Quản trị viên mới có quyền xem; Kỹ thuật viên Spa hay Bếp không được phép tiếp cận thông tin này."

### Câu hỏi 3: Nếu khách đang thanh toán VNPay mà tắt trình duyệt thì hệ thống xử lý ra sao?
**Trả lời:**  
> "HSWRMS sử dụng cơ chế xử lý kép:  
> 1. **Return URL:** Khi khách hoàn tất trên trình duyệt, VNPay redirect về Màn hình 17 để hiển thị thông báo ngay.  
> 2. **IPN (Instant Payment Notification):** VNPay gọi trực tiếp một webhook ngầm dạng Server-to-Server về backend của HSWRMS. Dù khách có tắt tab, rớt mạng sau khi trừ tiền ở ngân hàng, Backend vẫn nhận được gói tin IPN, kiểm tra chữ ký HMAC-SHA512 và cập nhật đơn hàng thành `CONFIRMED`, đảm bảo khách không bao giờ bị mất tiền oan."

---
*Tài liệu được biên soạn đồng bộ với Kiến trúc tổng thể HSWRMS, sẵn sàng để lập trình viên bắt tay vào triển khai mã nguồn.*
