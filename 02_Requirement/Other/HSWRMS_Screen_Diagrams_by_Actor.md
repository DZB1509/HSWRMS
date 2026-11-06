# HSWRMS — Screen Diagrams by Actor (PlantUML)
## Sơ đồ Màn Hình theo từng Actor — HeavenStay Wellness Resort Management System

> **Phương pháp:** PlantUML Screen/UI Flow Diagram (Wireflow)  
> **Chuẩn:** Actor-centric — mỗi actor có một sơ đồ độc lập  
> **Phiên bản:** 1.0 — Tháng 9/2026  
> **Tài liệu tham chiếu:** HSWRMS_Workflow_Modeling.md · HSWRMS_Use_Case_Specification.md · HSWRMS_ISP392_Project_Specification.md

---

## Tổng quan Actors

| # | Actor | Loại | Use Cases chính |
|:---:|:---|:---:|:---|
| 1 | 🧑 **Guest** | External Human | UC01, UC02, UC05, UC06, UC07, UC10, UC11, UC16, UC19, UC23 |
| 2 | 👤 **Receptionist** | Internal Human | UC08, UC09, UC15, UC21, UC22 |
| 3 | 💆 **Spa Therapist / Yoga Instructor** | Internal Human | UC13, UC14 |
| 4 | 👨‍🍳 **Chef / F&B Staff** | Internal Human | UC17, UC18 |
| 5 | 📊 **Manager** | Internal Human | UC24, UC25, UC31 |
| 6 | 🔑 **Admin** | Internal Human | UC03, UC04, UC26, UC27, UC28, UC29, UC30, UC31 |
| 7 | 💳 **VNPay Gateway** | External System | UC07, UC22 |
| 8 | 📅 **Google Calendar** | External System | UC11 |
| 9 | 📧 **Email / Identity Provider** | External System | UC01, UC11 |

---

---

## 1. Actor: 🧑 GUEST

> **Mô tả:** Khách hàng bên ngoài — đăng ký, quản lý hồ sơ sức khỏe, đặt gói nghỉ dưỡng, lên lịch spa, chọn bữa ăn, xem itinerary, thanh toán và gửi đánh giá.

### Các màn hình của Guest (UC01, UC02, UC05, UC06, UC07, UC10, UC11, UC16, UC19, UC23)

```plantuml
@startuml SCREEN_GUEST
skinparam shadowing true
skinparam backgroundColor #FFF0F5
skinparam RectangleBorderColor #C2185B
skinparam RectangleFontColor #880E4F
skinparam RectangleBackgroundColor #FFB6C1
skinparam ArrowColor #C2185B
skinparam ArrowFontColor #880E4F
skinparam NoteBackgroundColor #FFF0F5
skinparam NoteBorderColor #F48FB1
skinparam NoteFontColor #880E4F
skinparam TitleFontColor #880E4F
skinparam TitleFontStyle bold

title **HSWRMS — Screen Flow: 🧑 GUEST Actor**\nUC01 Register/Login | UC02 Health Profile | UC05 Data Deletion\nUC06 Browse Packages | UC07 Book & Deposit | UC10 View Itinerary\nUC11 Schedule Spa | UC16 Meal Selection | UC19 Extra A-la-carte | UC23 Review

' ====== SCREENS ======
rectangle "**[S-G01]**\n〔 Landing / Home Page 〕\n────────────────\n• Giới thiệu HeavenStay Resort\n• [Đăng ký] [Đăng nhập]\n• [Khám phá gói nghỉ dưỡng]" as S_G01 #FFB6C1

rectangle "**[S-G02]**\n〔 Register Screen 〕\n────────────────\n• Họ tên đầy đủ\n• Email address\n• Số điện thoại\n• Mật khẩu / Xác nhận MK\n• [Đăng ký] hoặc\n  [Login Google] [Login Facebook]\n\n**Liên kết:** UC01" as S_G02 #FFB6C1

rectangle "**[S-G03]**\n〔 OTP Verification Screen 〕\n────────────────\n• Nhập mã OTP 6 chữ số\n• Đồng hồ đếm ngược hết hạn\n• [Xác nhận OTP]\n• [Gửi lại OTP]\n\n**Liên kết:** UC01 (Email flow)" as S_G03 #FFB6C1

rectangle "**[S-G04]**\n〔 Login Screen 〕\n────────────────\n• Email / Password\n• [Đăng nhập]\n• [Login with Google]\n• [Login with Facebook]\n• [Quên mật khẩu]\n\n**Liên kết:** UC01" as S_G04 #FFB6C1

rectangle "**[S-G05]**\n〔 Wellness & Health Profile 〕\n────────────────\n• Dietary Preferences\n• Food Allergies\n• Physical / Medical Limitations\n• Therapy Preferences\n• Emergency Contact\n─────────────────\n⚠️ [Consent Checkbox] (unchecked)\n\"Tôi đồng ý chia sẻ dữ liệu sức khỏe\"\n• [Lưu Health Profile]\n• [Yêu cầu xóa dữ liệu] → UC05\n\n**Liên kết:** UC02, UC05\n**BR-03:** AES-256, Decree 356" as S_G05 #FFB6C1

rectangle "**[S-G06]**\n〔 Browse Retreat Packages 〕\n────────────────\n• Danh sách Retreat Packages\n• Bộ lọc: Wellness Goal\n  (Detox / Stress Relief / Weight Loss...)\n• Card: Ảnh · Tên · Mô tả · Giá\n• [Xem chi tiết gói]\n\n**Liên kết:** UC06" as S_G06 #FFB6C1

rectangle "**[S-G07]**\n〔 Package Detail & Booking 〕\n────────────────\n• Chi tiết gói nghỉ dưỡng\n• Chọn Ngày Check-In / Check-Out\n• Chọn Villa Category\n• Tóm tắt: Tổng giá + Đặt cọc (%)\n• [Pay Deposit via VNPay]\n\n**Liên kết:** UC07\n**BR-04:** Tạo Booking PENDING" as S_G07 #FFB6C1

rectangle "**[S-G08]**\n〔 VNPay Payment Portal 〕\n────────────────\n• (External — VNPay Gateway)\n• QR Code / Thẻ ngân hàng\n• Kết quả: Thành công / Thất bại\n\n**Liên kết:** UC07 (External)" as S_G08 #E8B4C8

rectangle "**[S-G09]**\n〔 Booking Confirmation 〕\n────────────────\n• Booking ID đã xác nhận\n• Trạng thái: CONFIRMED_DEPOSIT\n• Ngày Check-In / Check-Out\n• Villa Category đã chọn\n• [Xem Itinerary đầy đủ]\n\n**Liên kết:** UC07 → UC10" as S_G09 #FFB6C1

rectangle "**[S-G10]**\n〔 My Booking & Itinerary 〕\n────────────────\n• Timeline kỳ nghỉ:\n  · Buổi Spa đã lên lịch\n  · Bữa ăn hàng ngày\n  · Ngày Check-Out dự kiến\n• Trạng thái Booking\n• [Lên lịch thêm Spa]\n• [Chọn bữa ăn]\n\n**Liên kết:** UC10" as S_G10 #FFB6C1

rectangle "**[S-G11]**\n〔 Schedule Spa / Therapy Session 〕\n────────────────\n• Chọn loại trị liệu\n• Chọn ngày / khung giờ\n• Kết quả ghép lịch (BR-01)\n• [Xác nhận đặt lịch]\n• Thông báo: Google Calendar\n  + Email reminder\n\n**Liên kết:** UC11 (→ UC12 BR-01)\n**BR-01:** Atomic lock T+Room" as S_G11 #FFB6C1

rectangle "**[S-G12]**\n〔 Daily Meal Selection 〕\n────────────────\n• Chọn ngày\n• Menu đã lọc (theo dị ứng)\n• Bữa Sáng / Trưa / Tối\n• Gợi ý: Safe for you ✅\n• [Xác nhận chọn bữa ăn]\n\n**Liên kết:** UC16\n**BR-03:** Allergy filter" as S_G12 #FFB6C1

rectangle "**[S-G13]**\n〔 Extra A-la-carte Order 〕\n────────────────\n• Menu món thêm\n• Chọn món + số lượng\n• Giá món + Tổng cộng\n• [Đặt món & thêm vào Folio]\n\n**Liên kết:** UC19\n**BR-04:** Post charge → Folio" as S_G13 #FFB6C1

rectangle "**[S-G14]**\n〔 Checkout Review & Invoice 〕\n────────────────\n• Hóa đơn tổng hợp:\n  · Package Remaining\n  · Extra Spa charges\n  · Extra F&B charges\n  · Trừ Deposit đã trả\n• [Xác nhận & Thanh toán]\n\n**Liên kết:** UC22" as S_G14 #FFB6C1

rectangle "**[S-G15]**\n〔 Submit Review & Rating 〕\n────────────────\n• Rating Overall (1–5 ★)\n• Rating Spa / F&B / Accommodation\n• Nhận xét văn bản\n• [Gửi đánh giá]\n\n**Liên kết:** UC23\n(Chỉ sau khi CHECKED_OUT)" as S_G15 #FFB6C1

' ====== FLOW ARROWS ======
S_G01 -right-> S_G02 : Click [Đăng ký]
S_G01 -down-> S_G04 : Click [Đăng nhập]
S_G02 -right-> S_G03 : Email flow\nSinh OTP
S_G02 --> S_G05 : SSO Google/Facebook\nAuto login
S_G03 -right-> S_G05 : OTP hợp lệ\n→ Kích hoạt TK
S_G04 -right-> S_G05 : Login thành công
S_G05 -down-> S_G06 : Vào Dashboard\nClick [Khám phá]
S_G06 -right-> S_G07 : Click [Book Package]
S_G07 -right-> S_G08 : Click [Pay Deposit]
S_G08 -right-> S_G09 : VNPay callback\nCode 00 = OK
S_G09 -down-> S_G10 : Click [Xem Itinerary]
S_G10 -down-> S_G11 : Click [Lên lịch Spa]
S_G10 -right-> S_G12 : Click [Chọn bữa ăn]
S_G12 -right-> S_G13 : Click [Đặt thêm món]
S_G10 -down-> S_G14 : Yêu cầu Checkout
S_G14 -right-> S_G15 : Sau khi CHECKED_OUT

note bottom of S_G05
  **Decree 356/2025:**
  Consent checkbox
  KHÔNG pre-checked!
  Dữ liệu mã hóa AES-256
end note

note bottom of S_G08
  **External System**
  VNPay Gateway
  QR / Thẻ ngân hàng
end note

note right of S_G11
  **BR-01 Engine:**
  Atomic lock Therapist
  + Treatment Room
  Serializable transaction
end note

@enduml
```

---

---

## 2. Actor: 👤 RECEPTIONIST

> **Mô tả:** Nhân viên lễ tân — xác minh khách đến, thu thập thông tin cư trú, gán villa, quản lý trạng thái villa, đặt spa thêm, tạo hóa đơn và thực hiện checkout.

### Các màn hình của Receptionist (UC08, UC09, UC15, UC21, UC22)

```plantuml
@startuml SCREEN_RECEPTIONIST
skinparam shadowing true
skinparam backgroundColor #FFF0F5
skinparam RectangleBorderColor #C2185B
skinparam RectangleFontColor #880E4F
skinparam RectangleBackgroundColor #FCE4EC
skinparam ArrowColor #C2185B
skinparam ArrowFontColor #880E4F
skinparam NoteBackgroundColor #FFF0F5
skinparam NoteBorderColor #F48FB1
skinparam NoteFontColor #880E4F
skinparam TitleFontColor #880E4F
skinparam TitleFontStyle bold

title **HSWRMS — Screen Flow: 👤 RECEPTIONIST Actor**\nUC08 Check-In & Assign Villa | UC09 Manage Villa Status\nUC15 Manual Extra Spa | UC21 Generate Invoice | UC22 Final Checkout

rectangle "**[S-R01]**\n〔 Receptionist Dashboard 〕\n────────────────\n• Today's Expected Arrivals count\n• Check-Out list hôm nay\n• Villa Status overview\n• Quick Links:\n  [Check-In] [Villa Status]\n  [Extra Spa] [Checkout]\n\n**Vai trò:** Hub điều hướng chính" as S_R01 #FCE4EC

rectangle "**[S-R02]**\n〔 Expected Arrivals List 〕\n────────────────\n• Tìm kiếm theo Tên Khách / Booking ID\n• Danh sách arrivals hôm nay\n• Trạng thái: CONFIRMED_DEPOSIT\n• [Chọn] → mở Check-In Form\n\n**Liên kết:** UC08 Step 1" as S_R02 #FCE4EC

rectangle "**[S-R03]**\n〔 Check-In & Identification Form 〕\n────────────────\n• Thông tin booking: Tên · Gói · Ngày\n─────────────────\nResident Compliance Data:\n• Số CCCD / Hộ chiếu\n• Quốc tịch\n• Họ tên đầy đủ\n• Ngày sinh\n• Địa chỉ thường trú\n─────────────────\n• [Lưu thông tin cư trú]\n\n**Liên kết:** UC08\n**BR-05:** AES-256 · Luật Cư trú 2020" as S_R03 #FCE4EC

rectangle "**[S-R04]**\n〔 Villa Assignment Screen 〕\n────────────────\n• Danh sách Villa khả dụng:\n  Trạng thái: CLEAN_AVAILABLE\n• Hiển thị: Số Villa · Loại · Tầng\n• [Chọn Villa] (VD: Villa 102)\n• [Execute Check-In]\n\n**Liên kết:** UC08 Step 2" as S_R04 #FCE4EC

rectangle "**[S-R05]**\n〔 Check-In Confirmation 〕\n────────────────\n• Booking → CHECKED_IN ✅\n• Villa 102 → OCCUPIED ✅\n• Keycard link kích hoạt ✅\n• Itinerary Timeline hiển thị\n• [Xem chi tiết Itinerary]\n\n**Liên kết:** UC08 → UC10\n**BR-05:** Ghi Audit Log" as S_R05 #FCE4EC

rectangle "**[S-R06]**\n〔 Villa Status Management 〕\n────────────────\n• Grid tổng hợp tất cả Villa:\n  · CLEAN_AVAILABLE (xanh)\n  · OCCUPIED (đỏ)\n  · MAINTENANCE (vàng)\n  · DIRTY_CLEANING_REQUIRED (xám)\n• [Thay đổi trạng thái villa]\n• [Ghi ghi chú maintenance]\n\n**Liên kết:** UC09\n**BR-02:** Checkout guard check" as S_R06 #FCE4EC

rectangle "**[S-R07]**\n〔 Manual Extra Spa Booking 〕\n────────────────\n• Tìm kiếm Villa / Guest đang ở\n• Chọn loại dịch vụ Spa thêm\n• Chọn ngày / khung giờ\n• Kết quả BR-01 matching\n• Phí tự động đẩy vào Folio\n• [Xác nhận đặt Extra Spa]\n\n**Liên kết:** UC15\n**BR-01:** Scheduler engine\n**BR-04:** Post charge → Folio" as S_R07 #FCE4EC

rectangle "**[S-R08]**\n〔 Guest Folio Review 〕\n────────────────\n• Guest Name · Villa · Booking ID\n• Chi tiết Folio:\n  · Package Remaining Balance\n  · Extra Spa charges list\n  · Extra F&B charges list\n  · Deposit Paid (−)\n• Tổng cộng phải thanh toán\n• [Generate Invoice]\n\n**Liên kết:** UC21" as S_R08 #FCE4EC

rectangle "**[S-R09]**\n〔 Consolidated Invoice Screen 〕\n────────────────\n• Itemized Folio Statement:\n  · Retreat Package: x.xxx VND\n  · Spa Services: x.xxx VND\n  · F&B Orders: x.xxx VND\n  · Deposit Paid: (x.xxx VND)\n  ─────────────────\n  · TOTAL DUE: x.xxx VND\n─────────────────\n⛔ BR-02 Guard Check:\nUnpaid charges? → Block\n• [Process Final Payment]\n\n**Liên kết:** UC21 → UC22\n**BR-02:** Checkout Guard" as S_R09 #FCE4EC

rectangle "**[S-R10]**\n〔 Final Payment — VNPay 〕\n────────────────\n• (External — VNPay POS/QR)\n• Số tiền thanh toán cuối\n• QR Code / POS Terminal\n• Kết quả: Thành công\n\n**Liên kết:** UC22 (External)" as S_R10 #E8B4C8

rectangle "**[S-R11]**\n〔 Checkout Completion 〕\n────────────────\n• Booking → CHECKED_OUT ✅\n• Folio → PAID ✅\n• Villa → DIRTY_CLEANING_REQUIRED ✅\n• Ghi Audit Log\n• [In hóa đơn / Gửi email]\n\n**Liên kết:** UC22" as S_R11 #FCE4EC

' ====== FLOW ======
S_R01 -right-> S_R02 : Click [Check-In]
S_R02 -right-> S_R03 : Chọn Booking\n→ Mở form
S_R03 -right-> S_R04 : Lưu Residence Data\n→ Chọn Villa
S_R04 -right-> S_R05 : Execute Check-In
S_R01 -down-> S_R06 : Click [Villa Status]
S_R01 -down-> S_R07 : Click [Extra Spa]
S_R01 -down-> S_R08 : Click [Checkout]
S_R08 -right-> S_R09 : Click [Generate Invoice]
S_R09 -right-> S_R10 : Click [Process Payment]\nBR-02 Guard OK
S_R10 -right-> S_R11 : VNPay callback OK

note bottom of S_R03
  **Luật Cư trú 2020:**
  Bắt buộc lưu CCCD/Hộ chiếu
  để xuất báo cáo khai báo
  tạm trú hàng ngày
  Mã hóa AES-256 (BR-05)
end note

note bottom of S_R09
  **BR-02 Checkout Guard:**
  Nếu còn unpaid charges
  → Block nút [Process Payment]
  → Yêu cầu settle trước
end note

@enduml
```

---

---

## 3. Actor: 💆 SPA THERAPIST / YOGA INSTRUCTOR

> **Mô tả:** Nhân viên trị liệu — xem lịch được giao, xem health notes được phép, thực hiện buổi trị liệu, đánh dấu kết quả.

### Các màn hình của Therapist (UC13, UC14)

```plantuml
@startuml SCREEN_THERAPIST
skinparam shadowing true
skinparam backgroundColor #FFF0F5
skinparam RectangleBorderColor #C2185B
skinparam RectangleFontColor #880E4F
skinparam RectangleBackgroundColor #FFB6C1
skinparam ArrowColor #C2185B
skinparam ArrowFontColor #880E4F
skinparam NoteBackgroundColor #FFF0F5
skinparam NoteBorderColor #F48FB1
skinparam NoteFontColor #880E4F
skinparam TitleFontColor #880E4F
skinparam TitleFontStyle bold

title **HSWRMS — Screen Flow: 💆 SPA THERAPIST / YOGA INSTRUCTOR**\nUC13 View Schedule & Health Notes | UC14 Mark Session Complete / No-Show

rectangle "**[S-T01]**\n〔 Therapist Dashboard 〕\n────────────────\n• Xin chào, [Tên Therapist]\n• Tóm tắt hôm nay:\n  · Số buổi được giao\n  · Buổi tiếp theo: [giờ] [Guest]\n• [Xem lịch hôm nay]\n• [Xem lịch tuần]\n\n**Vai trò:** Hub điều hướng" as S_T01 #F8BBD9

rectangle "**[S-T02]**\n〔 Daily Schedule View 〕\n────────────────\nLịch ngày của Therapist:\n• Timeline từng giờ\n• Mỗi slot:\n  · Giờ bắt đầu – Kết thúc\n  · Loại trị liệu\n  · Villa / Guest (tên ẩn danh)\n  · Phòng trị liệu (Room)\n  · Trạng thái: SCHEDULED / DONE\n• [Click session → xem chi tiết]\n\n**Liên kết:** UC13\n**BR-03:** Chỉ xem data được giao" as S_T02 #F8BBD9

rectangle "**[S-T03]**\n〔 Session Detail & Guest Health Notes 〕\n────────────────\n• Thông tin buổi trị liệu:\n  · Loại: Deep Tissue / Swedish...\n  · Phòng: Treatment Room 03\n  · Giờ: 10:00 – 11:30\n─────────────────\nHealth Notes (RBAC filtered):\n• ✅ Therapy Preferences:\n  'Gentle pressure, no deep tissue'\n• ✅ Physical Limitations:\n  'Left shoulder injury'\n• ⚠️ Allergies: 'Lavender oil'\n─────────────────\n❌ ẨN: Medical Conditions\n❌ ẨN: Dietary/Food Allergies\n❌ ẨN: Emergency Contact\n\n**Liên kết:** UC13\n**BR-03:** Data Minimization RBAC" as S_T03 #F8BBD9

rectangle "**[S-T04]**\n〔 Mark Session Outcome 〕\n────────────────\n• Buổi trị liệu: [Chi tiết]\n• Kết quả:\n  ○ COMPLETED ✅\n  ○ NO_SHOW ❌\n• Ghi chú (tùy chọn)\n• [Xác nhận cập nhật]\n\n**Liên kết:** UC14" as S_T04 #F8BBD9

rectangle "**[S-T05]**\n〔 Session Updated Confirmation 〕\n────────────────\n• SPA_SESSION status cập nhật ✅\n• Booking Itinerary cập nhật ✅\n• [Quay về lịch hôm nay]\n\n**Liên kết:** UC14" as S_T05 #F8BBD9

' ====== FLOW ======
S_T01 -right-> S_T02 : Click [Xem lịch hôm nay]
S_T02 -right-> S_T03 : Click vào session\n→ Xem chi tiết
S_T03 -right-> S_T04 : Sau khi thực hiện\nClick [Cập nhật kết quả]
S_T04 -right-> S_T05 : [Xác nhận]
S_T05 -down-> S_T02 : Quay về lịch

note bottom of S_T03
  **BR-03 RBAC Enforcement:**
  Therapist CHỈ thấy:
  - Therapy Preferences
  - Physical Limitations liên quan
  - Allergy với liệu pháp
  KHÔNG thấy:
  - Medical Conditions khác
  - Dietary/Food history
  Kiểm tra tại Backend API
  (không phải chỉ UI ẩn)
end note

@enduml
```

---

---

## 4. Actor: 👨‍🍳 CHEF / F&B STAFF

> **Mô tả:** Nhân viên bếp/nhà hàng — xem dashboard bữa ăn hàng ngày (với dữ liệu sức khỏe được tối giản hóa), chuẩn bị bữa ăn và cập nhật trạng thái.

### Các màn hình của Chef/F&B Staff (UC17, UC18)

```plantuml
@startuml SCREEN_CHEF
skinparam shadowing true
skinparam backgroundColor #FFF0F5
skinparam RectangleBorderColor #C2185B
skinparam RectangleFontColor #880E4F
skinparam RectangleBackgroundColor #FFCDD2
skinparam ArrowColor #C2185B
skinparam ArrowFontColor #880E4F
skinparam NoteBackgroundColor #FFF0F5
skinparam NoteBorderColor #F48FB1
skinparam NoteFontColor #880E4F
skinparam TitleFontColor #880E4F
skinparam TitleFontStyle bold

title **HSWRMS — Screen Flow: 👨‍🍳 CHEF / F&B STAFF**\nUC17 View Daily Meal Prep Dashboard | UC18 Update Meal Order Status\nUC20 Data Minimization Filter (System enforced)

rectangle "**[S-C01]**\n〔 F&B Staff Dashboard 〕\n────────────────\n• Tổng số bữa ăn hôm nay\n• Số lượng: Sáng / Trưa / Tối\n• Cảnh báo dị ứng đặc biệt (số lượng)\n• [Xem Daily Meal Prep]\n\n**Vai trò:** Hub điều hướng" as S_C01 #FFCDD2

rectangle "**[S-C02]**\n〔 Daily Meal Prep Dashboard 〕\n────────────────\nDanh sách theo Bữa / Thứ tự chuẩn bị:\n┌─────────────────────────────┐\n│ Villa 201 │ Sáng            │\n│ Grilled Salmon               │\n│ ⚠️ PEANUT ALLERGY - SEVERE   │\n│ ✅ Gluten-Free Required       │\n│ Status: PREPARING            │\n│ [Cập nhật → READY]          │\n├─────────────────────────────┤\n│ Villa 305 │ Trưa            │\n│ Vegan Bowl                   │\n│ ✅ Vegan · No Dairy          │\n│ Status: PREPARING            │\n│ [Cập nhật → READY]          │\n└─────────────────────────────┘\n\n**Liên kết:** UC17, UC20\n**BR-03:** Data Minimization active" as S_C02 #FFCDD2

rectangle "**[S-C03]**\n〔 Meal Order Detail (Chef View) 〕\n────────────────\nChỉ hiển thị thông tin F&B liên quan:\n• Villa Number\n• Tên món\n• Ingredients cần dùng\n• ⚠️ Food Allergies (nếu có)\n• Dietary Requirements\n─────────────────\n❌ ẨN: Medical Conditions\n❌ ẨN: Physical Limitations\n❌ ẨN: Therapy Notes\n❌ ẨN: Emergency Contact\n\n**Liên kết:** UC17 → UC20\n**BR-03:** Backend API Filter" as S_C03 #FFCDD2

rectangle "**[S-C04]**\n〔 Update Meal Status 〕\n────────────────\n• Thông tin đơn: Villa · Món · Bữa\n• Trạng thái hiện tại: PREPARING\n• [Chuyển → READY_FOR_DELIVERY]\n• Timestamp cập nhật tự động\n\n**Liên kết:** UC18" as S_C04 #FFCDD2

rectangle "**[S-C05]**\n〔 Status Updated Confirmation 〕\n────────────────\n• MEAL_ORDER_LINE.Status\n  → READY_FOR_DELIVERY ✅\n• Timestamp ghi nhận\n• [Quay về Dashboard]\n\n**Liên kết:** UC18" as S_C05 #FFCDD2

' ====== FLOW ======
S_C01 -right-> S_C02 : Click [Xem Daily Meal Prep]
S_C02 -right-> S_C03 : Click vào order\n→ Xem chi tiết
S_C02 -down-> S_C04 : Click [Cập nhật → READY]\ntrực tiếp từ list
S_C03 -right-> S_C04 : Click [Mark as Ready]
S_C04 -right-> S_C05 : [Xác nhận]
S_C05 -down-> S_C02 : Quay về Dashboard

note bottom of S_C03
  **BR-03 (UC20) Data Minimization:**
  Chef/F&B chỉ nhận được:
  - FoodAllergies
  - DietaryPreferences
  Bị ẩn hoàn toàn:
  - MedicalConditions
  - PhysicalLimitations
  - TherapyNotes
  Filter thực thi ở Backend API
  (không phải chỉ UI-layer)
end note

@enduml
```

---

---

## 5. Actor: 📊 MANAGER

> **Mô tả:** Người quản lý — xem dashboard doanh thu, xuất báo cáo, xem system overview. Không có quyền Admin đầy đủ (BR-06: Least Privilege).

### Các màn hình của Manager (UC24, UC25, UC31)

```plantuml
@startuml SCREEN_MANAGER
skinparam shadowing true
skinparam backgroundColor #FFF0F5
skinparam RectangleBorderColor #C2185B
skinparam RectangleFontColor #880E4F
skinparam RectangleBackgroundColor #F8BBD9
skinparam ArrowColor #C2185B
skinparam ArrowFontColor #880E4F
skinparam NoteBackgroundColor #FFF0F5
skinparam NoteBorderColor #F48FB1
skinparam NoteFontColor #880E4F
skinparam TitleFontColor #880E4F
skinparam TitleFontStyle bold

title **HSWRMS — Screen Flow: 📊 MANAGER**\nUC24 Revenue Dashboard | UC25 Export Reports\nUC31 System Overview | BR-06 Least Privilege

rectangle "**[S-M01]**\n〔 Manager Dashboard 〕\n────────────────\n• KPI Cards:\n  · Revenue hôm nay\n  · Occupancy Rate (%)\n  · Số khách đang ở\n  · Số buổi Spa hôm nay\n• Quick Links:\n  [Revenue] [Reports] [System]\n\n**BR-06:** Không hiện Admin menu" as S_M01 #F8BBD9

rectangle "**[S-M02]**\n〔 Revenue Dashboard 〕\n────────────────\nPhân tích Doanh thu:\n• Bộ lọc: Ngày / Tuần / Tháng / Năm\n─────────────────\nBiểu đồ Breakdown:\n• Package Revenue: x,xxx,xxx VND\n• Spa Revenue: x,xxx,xxx VND\n• F&B Revenue: x,xxx,xxx VND\n─────────────────\n• Tổng doanh thu kỳ chọn\n• Trend line chart\n• [Export Excel] [Export PDF]\n\n**Liên kết:** UC24\n**BR-06:** View-only, no config" as S_M02 #F8BBD9

rectangle "**[S-M03]**\n〔 Occupancy & Utilization Reports 〕\n────────────────\n• Villa Occupancy Rate:\n  Biểu đồ theo ngày/tuần\n  Tỷ lệ % phòng lấp đầy\n─────────────────\n• Therapist Utilization Metrics:\n  · Số giờ làm việc / Tổng capacity\n  · Utilization % từng therapist\n  · Buổi hoàn thành / No-show rate\n─────────────────\n• [Export Excel] [Export PDF]\n\n**Liên kết:** UC25\n**BR-06:** Analytics read-only" as S_M03 #F8BBD9

rectangle "**[S-M04]**\n〔 System Overview Dashboard 〕\n────────────────\nTổng quan hệ thống (Scope giới hạn):\n• Active Bookings count\n• Check-ins hôm nay\n• Check-outs hôm nay\n• System Alerts (nếu có)\n• Module Status overview\n─────────────────\n❌ KHÔNG CÓ:\n• System Config\n• Permission Matrix\n• Feature Flags\n• Audit Log đầy đủ\n\n**Liên kết:** UC31\n**BR-06:** Delegated scope only" as S_M04 #F8BBD9

rectangle "**[S-M05]**\n〔 Export Report Screen 〕\n────────────────\n• Chọn loại báo cáo:\n  ○ Revenue Report\n  ○ Occupancy Report\n  ○ Therapist Utilization Report\n• Chọn kỳ báo cáo (date range)\n• Chọn format: Excel / PDF\n• [Tạo & Tải xuống báo cáo]\n\n**Liên kết:** UC25" as S_M05 #F8BBD9

' ====== FLOW ======
S_M01 -right-> S_M02 : Click [Revenue]
S_M01 -down-> S_M03 : Click [Reports]
S_M01 -down-> S_M04 : Click [System Overview]
S_M02 -right-> S_M05 : Click [Export]
S_M03 -right-> S_M05 : Click [Export]

note bottom of S_M04
  **BR-06 Manager Least Privilege:**
  Manager nhận quyền từ Admin
  (UC29 Delegate Rights)
  KHÔNG tự có quyền Admin config
  Scope hiển thị do Admin cấu hình
  trong Permission Matrix (UC28)
end note

@enduml
```

---

---

## 6. Actor: 🔑 ADMIN (System Administrator)

> **Mô tả:** Quản trị viên hệ thống — quản lý tài khoản nhân viên, master data, tham số nghiệp vụ, feature flags, ma trận phân quyền, ủy quyền Manager, xem audit log.

### Các màn hình của Admin (UC03, UC04, UC26, UC27, UC28, UC29, UC30, UC31)

```plantuml
@startuml SCREEN_ADMIN
skinparam shadowing true
skinparam backgroundColor #FFF0F5
skinparam RectangleBorderColor #880E4F
skinparam RectangleFontColor #880E4F
skinparam RectangleBackgroundColor #FCE4EC
skinparam ArrowColor #880E4F
skinparam ArrowFontColor #880E4F
skinparam NoteBackgroundColor #FFF0F5
skinparam NoteBorderColor #F48FB1
skinparam NoteFontColor #880E4F
skinparam TitleFontColor #880E4F
skinparam TitleFontStyle bold

title **HSWRMS — Screen Flow: 🔑 ADMIN (System Administrator)**\nUC03 Staff Accounts | UC04 Master Data | UC26 Business Params\nUC27 Feature Flags | UC28 Permission Matrix | UC29 Delegate Rights\nUC30 Audit Log | UC31 System Dashboard

rectangle "**[S-A01]**\n〔 Admin Control Center 〕\n────────────────\nAdmin Menu (Full Access):\n• [Staff Accounts] (UC03)\n• [Master Data] (UC04)\n• [Business Parameters] (UC26)\n• [Feature Flags] (UC27)\n• [Permission Matrix] (UC28)\n• [Delegate Manager Rights] (UC29)\n• [Sensitive-Data Audit Log] (UC30)\n• [System Overview] (UC31)\n\n**Vai trò:** Hub điều hướng Admin" as S_A01 #FCE4EC

rectangle "**[S-A02]**\n〔 Staff Account Management 〕\n────────────────\n• Danh sách nhân viên + vai trò\n• Tìm kiếm theo tên / role\n• [Tạo tài khoản mới]\n• [Chỉnh sửa tài khoản]\n• [Vô hiệu hóa tài khoản]\n─────────────────\nForm Tạo/Sửa:\n• Họ tên · Email · Role\n• Role: RECEPTIONIST / THERAPIST\n         / FB_STAFF / MANAGER\n• [Lưu] → Ghi Audit Log\n\n**Liên kết:** UC03\n**BR-06:** Phân quyền rõ ràng" as S_A02 #FCE4EC

rectangle "**[S-A03]**\n〔 Master Data Management 〕\n────────────────\nTab điều hướng:\n• [Villa Categories]\n• [Spa Services]\n• [Retreat Packages]\n• [Menu Items (F&B)]\n─────────────────\nMỗi tab:\n• Danh sách + [Thêm] [Sửa] [Xóa]\n• Form thêm/sửa: tên, mô tả,\n  giá, trạng thái active\n• Phản ánh ngay lên Frontend\n\n**Liên kết:** UC04\n**GWI Standards:** Wellness taxonomy" as S_A03 #FCE4EC

rectangle "**[S-A04]**\n〔 Business Parameter Configuration 〕\n────────────────\n• Deposit Percentage:\n  [30] % (ô nhập số)\n• Cancellation Window:\n  [7] ngày trước check-in\n• Refund Percentage:\n  [80] % nếu hủy đúng hạn\n• Minimum Stay Nights: [2]\n─────────────────\n• [Lưu Tham số]\n• Hiệu lực ngay lập tức\n\n**Liên kết:** UC26" as S_A04 #FCE4EC

rectangle "**[S-A05]**\n〔 Feature Flag Management 〕\n────────────────\nDanh sách tính năng theo module:\n• M1 - Google SSO: [ON] [OFF]\n• M1 - Facebook SSO: [ON] [OFF]\n• M3 - Google Calendar Sync: [ON] [OFF]\n• M3 - Email Reminder: [ON] [OFF]\n• M4 - A-la-carte Ordering: [ON] [OFF]\n• M5 - Online Review: [ON] [OFF]\n─────────────────\n• Toggle = áp dụng ngay (runtime)\n• Không cần redeploy\n\n**Liên kết:** UC27" as S_A05 #FCE4EC

rectangle "**[S-A06]**\n〔 Role & Permission Matrix 〕\n────────────────\nGrid: Screen/Action × Roles\n       Guest │ Recep │ Ther │ Chef │ Mgr │ Admin\n────────────────\nHealth Data:   ✅    │  ❌  │ ⚠️  │  ❌  │  ❌  │  ✅\nVilla Assign:  ❌    │  ✅  │  ❌  │  ❌  │  ❌  │  ✅\nSpa Schedule:  ✅    │  ✅  │  ❌  │  ❌  │  ❌  │  ✅\nF&B Dashboard: ❌    │  ❌  │  ❌  │  ✅  │  ❌  │  ✅\nRevenue Dash:  ❌    │  ❌  │  ❌  │  ❌  │  ✅  │  ✅\nAudit Log:     ❌    │  ❌  │  ❌  │  ❌  │  ❌  │  ✅\n─────────────────\n• [Lưu Permission Matrix]\n• Enforce tại Backend Middleware\n\n**Liên kết:** UC28\n**BR-03:** RBAC enforcement" as S_A06 #FCE4EC

rectangle "**[S-A07]**\n〔 Delegate Manager Rights 〕\n────────────────\n• Chọn Manager account\n• Danh sách quyền con cho phép:\n  ☐ Override Villa Status\n  ☐ View Audit Summary\n  ☐ Export All Reports\n  ☐ View Revenue Full Period\n─────────────────\n• [Lưu Ủy quyền]\n• Manager nhận quyền được cấp\n  KHÔNG inherit Admin quyền\n\n**Liên kết:** UC29\n**BR-06:** Least Privilege" as S_A07 #FCE4EC

rectangle "**[S-A08]**\n〔 Sensitive-Data Audit Log 〕\n────────────────\nBộ lọc:\n• Khoảng ngày: [từ] → [đến]\n• Staff ID\n• Loại dữ liệu: Health / Residence\n─────────────────\nDanh sách bản ghi (Immutable):\n┌──────────────────────────────────┐\n│ Timestamp │ UserID │ Action      │\n│ Target    │ IP     │ Status      │\n├──────────────────────────────────┤\n│ 08:32:15  │ T-001  │ VIEW        │\n│ HealthData│ 192.x  │ AUTHORIZED  │\n└──────────────────────────────────┘\n• Append-only (không sửa/xóa)\n• [Export Audit Report]\n\n**Liên kết:** UC30\n**BR-03, BR-05, BR-07**" as S_A08 #FCE4EC

rectangle "**[S-A09]**\n〔 System Overview Dashboard (Admin) 〕\n────────────────\nFull System View:\n• All Bookings: Active/Total\n• Villa Status Overview (All)\n• Staff Activity Summary\n• Module Health Status\n• Pending Admin Actions\n• System Alerts & Errors\n• Audit Events (recent)\n\n**Liên kết:** UC31 (Full Admin scope)" as S_A09 #FCE4EC

' ====== FLOW ======
S_A01 -right-> S_A02 : [Staff Accounts]
S_A01 -right-> S_A03 : [Master Data]
S_A01 -down-> S_A04 : [Business Params]
S_A01 -down-> S_A05 : [Feature Flags]
S_A01 -down-> S_A06 : [Permission Matrix]
S_A01 -down-> S_A07 : [Delegate Rights]
S_A01 -down-> S_A08 : [Audit Log]
S_A01 -right-> S_A09 : [System Overview]

note bottom of S_A06
  **BR-03 RBAC:**
  Enforce tại Backend API Middleware
  KHÔNG phụ thuộc UI ẩn/hiện
  Thay đổi phản ánh ngay
  không cần restart service
end note

note bottom of S_A08
  **Audit Trail Immutability:**
  Append-only store
  Không cho UPDATE/DELETE
  Bao gồm: Health, Residence,
  Permission changes, Login events
end note

@enduml
```

---

---

## 7. Actor: 💳 VNPAY GATEWAY (External System)

> **Mô tả:** Hệ thống thanh toán bên ngoài — xử lý cả hai điểm thanh toán: đặt cọc (UC07) và thanh toán cuối (UC22).

### Luồng tương tác VNPay

```plantuml
@startuml SCREEN_VNPAY
skinparam shadowing true
skinparam backgroundColor #FFF0F5
skinparam RectangleBorderColor #C2185B
skinparam RectangleFontColor #880E4F
skinparam RectangleBackgroundColor #E8B4C8
skinparam ArrowColor #C2185B
skinparam ArrowFontColor #880E4F
skinparam NoteBackgroundColor #FFF0F5
skinparam NoteBorderColor #F48FB1
skinparam TitleFontColor #880E4F
skinparam TitleFontStyle bold

title **HSWRMS — Screen Flow: 💳 VNPAY GATEWAY (External System)**\nUC07 Retreat Deposit Payment | UC22 Final Checkout Payment

rectangle "**[S-VP01]**\n〔 HSWRMS: Booking Summary 〕\n────────────────\n• Package + Dates + Villa\n• Total Price: x,xxx,xxx VND\n• Deposit (30%): xxx,xxx VND\n• [Pay Deposit via VNPay]\n\n(HSWRMS Internal Screen)" as S_VP01 #FFB6C1

rectangle "**[S-VP02]**\n〔 HSWRMS: Generate VNPay URL 〕\n────────────────\n(System internal)\n• Tạo Booking PENDING\n• Sinh transaction checksum\n• Build secure VNPay URL\n• Redirect → VNPay Portal\n\n**UC07 / UC22**" as S_VP02 #FCE4EC

rectangle "**[S-VP03]**\n〔 VNPay Payment Portal 〕\n────────────────\n(External — VNPay hosted)\n• Hiển thị: Số tiền cần thanh toán\n• Phương thức:\n  · QR Code VNPay\n  · ATM / Internet Banking\n  · Thẻ quốc tế Visa/MC\n• [Xác nhận thanh toán]\n• [Hủy bỏ]\n\n**External VNPay UI**" as S_VP03 #E8B4C8

rectangle "**[S-VP04]**\n〔 VNPay: IPN Callback to HSWRMS 〕\n────────────────\n(Server-to-Server)\n• HTTP POST → HSWRMS IPN URL\n• Payload: TransactionID\n  Amount, ResponseCode\n  Checksum\n• Code 00 = Thành công\n• Code ≠ 00 = Thất bại\n\n**External System Event**" as S_VP04 #E8B4C8

rectangle "**[S-VP05a]**\n〔 HSWRMS: Payment Success 〕\n────────────────\n✅ Verify IPN checksum OK\n• UC07: Booking → CONFIRMED_DEPOSIT\n  Tạo Guest Folio\n  Gửi email xác nhận\n• UC22: Booking → CHECKED_OUT\n  Folio → PAID\n  Villa → DIRTY_CLEANING_REQUIRED\n\n**HSWRMS Internal Update**" as S_VP05a #FCE4EC

rectangle "**[S-VP05b]**\n〔 HSWRMS: Payment Failed 〕\n────────────────\n❌ VNPay Code ≠ 00\n• UC07: Booking → CANCELLED_PAYMENT_FAILED\n  Giải phóng room hold\n• UC22: Yêu cầu thử lại thanh toán\n\n**Error Handling**" as S_VP05b #FCE4EC

' ====== FLOW ======
S_VP01 -right-> S_VP02 : Click [Pay via VNPay]
S_VP02 -right-> S_VP03 : HSWRMS redirect
S_VP03 -down-> S_VP04 : Guest hoàn thành\nVNPay gửi IPN
S_VP04 -right-> S_VP05a : Code = 00\nThành công
S_VP04 -down-> S_VP05b : Code ≠ 00\nThất bại

note bottom of S_VP04
  **Security:**
  IPN checksum phải được
  verify tại HSWRMS server
  trước khi cập nhật DB
  Không tin vào return URL
  (có thể bị giả mạo)
end note

@enduml
```

---

---

## 8. Actor: 📅 GOOGLE CALENDAR (External System)

> **Mô tả:** Đồng bộ lịch spa đã xác nhận lên Google Calendar của Guest (UC11 async event).

### Luồng tương tác Google Calendar

```plantuml
@startuml SCREEN_GOOGLE_CAL
skinparam shadowing true
skinparam backgroundColor #FFF0F5
skinparam RectangleBorderColor #C2185B
skinparam RectangleFontColor #880E4F
skinparam RectangleBackgroundColor #FFCDD2
skinparam ArrowColor #C2185B
skinparam ArrowFontColor #880E4F
skinparam NoteBackgroundColor #FFF0F5
skinparam NoteBorderColor #F48FB1
skinparam TitleFontColor #880E4F
skinparam TitleFontStyle bold

title **HSWRMS — Screen Flow: 📅 GOOGLE CALENDAR (External System)**\nUC11 Schedule Included Spa Session → Calendar Sync (Async)

rectangle "**[S-GC01]**\n〔 HSWRMS: Spa Booking Confirmed 〕\n────────────────\n• SPA_SESSION tạo thành công\n• BR-01: T_i + R_j locked OK\n• Trigger async Calendar event\n\n(HSWRMS Internal)" as S_GC01 #FCE4EC

rectangle "**[S-GC02]**\n〔 HSWRMS: Push Calendar Event 〕\n────────────────\n(Async Event Dispatch)\n• Google Calendar API call\n• Payload:\n  · Title: 'Deep Tissue Massage'\n  · Date/Time: 2026-09-25 10:00\n  · Duration: 90 min\n  · Location: 'Treatment Room 03'\n  · Description: Package session\n\n**UC11 async — Background job**" as S_GC02 #FCE4EC

rectangle "**[S-GC03]**\n〔 Google Calendar: Event Added 〕\n────────────────\n(External — Google)\n• Sự kiện xuất hiện trên\n  Google Calendar của Guest\n• Guest nhận notification\n  từ Google Calendar app\n• Reminder tự động (Google)\n\n**External Google Calendar UI**" as S_GC03 #FFCDD2

' ====== FLOW ======
S_GC01 -right-> S_GC02 : Trigger async event
S_GC02 -right-> S_GC03 : Google Calendar\nAPI push

note bottom of S_GC02
  **Async Design:**
  Không blocking main flow
  Chạy trong background job/queue
  Retry nếu Google API timeout
end note

@enduml
```

---

---

## 9. Actor: 📧 EMAIL / IDENTITY PROVIDER (External System)

> **Mô tả:** Cung cấp 2 dịch vụ: (1) Email OTP cho xác thực tài khoản (UC01), (2) Email reminder 1h trước buổi spa (UC11), và (3) SSO OAuth2 qua Google/Facebook (UC01).

### Luồng tương tác Email & Identity Provider

```plantuml
@startuml SCREEN_EMAIL_IDP
skinparam shadowing true
skinparam backgroundColor #FFF0F5
skinparam RectangleBorderColor #C2185B
skinparam RectangleFontColor #880E4F
skinparam RectangleBackgroundColor #FFCDD2
skinparam ArrowColor #C2185B
skinparam ArrowFontColor #880E4F
skinparam NoteBackgroundColor #FFF0F5
skinparam NoteBorderColor #F48FB1
skinparam TitleFontColor #880E4F
skinparam TitleFontStyle bold

title **HSWRMS — Screen Flow: 📧 EMAIL & IDENTITY PROVIDER (External Systems)**\nUC01 Registration OTP | UC01 SSO OAuth2 | UC11 Session Reminder

' --- Email OTP Flow ---
rectangle "**[S-E01]**\n〔 HSWRMS: Register Form Submitted 〕\n────────────────\n• Guest nhập Tên/Email/Phone/PW\n• HSWRMS validate format\n• Sinh OTP 6 chữ số (time-based)\n• Trigger → Email Service\n\n(HSWRMS Internal)" as S_E01 #FCE4EC

rectangle "**[S-E02]**\n〔 Email Service: Send OTP Email 〕\n────────────────\n(External — SendGrid/SMTP)\nGửi email:\n• Subject: 'HSWRMS - Xác nhận tài khoản'\n• Body: 'Mã OTP của bạn: 123456\n         Hiệu lực trong 5 phút'\n• To: [guest@email.com]\n\n**External Email Provider**" as S_E02 #FFCDD2

rectangle "**[S-E03]**\n〔 Guest: Enter OTP Screen 〕\n────────────────\n• OTP Input: [_ _ _ _ _ _]\n• Đồng hồ đếm ngược: 4:59\n• [Xác nhận OTP]\n• [Gửi lại OTP]\n\n(HSWRMS Internal Screen)" as S_E03 #FFB6C1

' --- SSO Flow ---
rectangle "**[S-E04]**\n〔 HSWRMS: SSO Login Screen 〕\n────────────────\n• [Login with Google]\n• [Login with Facebook]\n→ Redirect đến OAuth2 Provider\n\n(HSWRMS Internal)" as S_E04 #FCE4EC

rectangle "**[S-E05]**\n〔 Google / Facebook Login Page 〕\n────────────────\n(External — Google/Facebook hosted)\n• Guest nhập tài khoản G/FB\n• Authorize HSWRMS app\n• Provider trả OAuth2 ID Token\n\n**External SSO Provider**" as S_E05 #FFCDD2

rectangle "**[S-E06]**\n〔 HSWRMS: Verify Token & Login 〕\n────────────────\n• Verify token signature\n• Lấy claims: Email, Full Name\n• Tạo hoặc match tài khoản\n• Cấp JWT Access/Refresh Token\n• Redirect → Dashboard\n\n(HSWRMS Internal)" as S_E06 #FCE4EC

' --- Spa Reminder Flow ---
rectangle "**[S-E07]**\n〔 HSWRMS: Schedule Email Reminder 〕\n────────────────\n• Sau khi SPA_SESSION confirmed\n• Lên lịch job: T = Session_Start - 1h\n• Đưa vào Email Notification Queue\n\n(HSWRMS Internal — Async)" as S_E07 #FCE4EC

rectangle "**[S-E08]**\n〔 Email Service: Send Reminder 〕\n────────────────\n(External — SendGrid/SMTP)\nGửi email 1h trước buổi:\n• Subject: 'Nhắc nhở: Buổi Spa sắp bắt đầu'\n• Body: 'Deep Tissue Massage\n         lúc 10:00 tại Room 03.\n         Còn 60 phút nữa.'\n• To: [guest@email.com]\n\n**External Email Provider**" as S_E08 #FFCDD2

' ====== FLOW ======
S_E01 -right-> S_E02 : Trigger email OTP
S_E02 -right-> S_E03 : Guest nhận email\nMở OTP screen

S_E04 -right-> S_E05 : OAuth2 redirect
S_E05 -right-> S_E06 : Token returned
S_E06 -down-> S_E03 : (bypass OTP)\nAuto authenticated

S_E07 -right-> S_E08 : Job fires T-1h

note bottom of S_E02
  **UC01 OTP:**
  Time-based 6-digit OTP
  Hiệu lực: 5 phút
  Max 3 lần nhập sai
  → Yêu cầu gửi lại
end note

note bottom of S_E05
  **OAuth2 Security:**
  HSWRMS verify token signature
  Không lưu password G/FB
  Chỉ lưu email + display name
end note

@enduml
```

---

---

## 📋 Tổng hợp — Ma trận Screen theo Actor

| Actor | Số Màn hình | Màn hình chính |
|:---|:---:|:---|
| 🧑 **Guest** | 15 | S-G01 ~ S-G15 |
| 👤 **Receptionist** | 11 | S-R01 ~ S-R11 |
| 💆 **Therapist** | 5 | S-T01 ~ S-T05 |
| 👨‍🍳 **Chef / F&B** | 5 | S-C01 ~ S-C05 |
| 📊 **Manager** | 5 | S-M01 ~ S-M05 |
| 🔑 **Admin** | 9 | S-A01 ~ S-A09 |
| 💳 **VNPay** | 5 | S-VP01 ~ S-VP05 |
| 📅 **Google Calendar** | 3 | S-GC01 ~ S-GC03 |
| 📧 **Email / IDP** | 8 | S-E01 ~ S-E08 |
| **Tổng cộng** | **66** | |

---

## 🔗 Traceability — Use Case ↔ Screen ↔ Actor

| Use Case | Actor | Màn hình chính | Business Rule |
|:---:|:---:|:---|:---:|
| UC01 | Guest | S-G02, S-G03, S-G04 | BR-03 |
| UC02 | Guest | S-G05 | BR-03, Decree 356 |
| UC03 | Admin | S-A02 | BR-06 |
| UC04 | Admin | S-A03 | GWI |
| UC05 | Guest | S-G05 | BR-07, Decree 356 |
| UC06 | Guest | S-G06 | — |
| UC07 | Guest + VNPay | S-G07, S-G08, S-G09 | BR-04 |
| UC08 | Receptionist | S-R02, S-R03, S-R04, S-R05 | BR-05 |
| UC09 | Receptionist | S-R06 | BR-02 |
| UC10 | Guest | S-G10 | — |
| UC11 | Guest | S-G11 | BR-01 |
| UC12 | System Engine | (Internal — BR-01) | **BR-01 Core** |
| UC13 | Therapist | S-T02, S-T03 | BR-03 |
| UC14 | Therapist | S-T04, S-T05 | BR-01 |
| UC15 | Receptionist | S-R07 | BR-01, BR-04 |
| UC16 | Guest | S-G12 | BR-03 |
| UC17 | Chef | S-C02, S-C03 | BR-03 |
| UC18 | Chef | S-C04, S-C05 | — |
| UC19 | Guest | S-G13 | BR-04 |
| UC20 | System Engine | (Internal — BR-03) | **BR-03 Core** |
| UC21 | Receptionist | S-R08, S-R09 | BR-02, BR-04 |
| UC22 | Receptionist + VNPay | S-R09, S-R10, S-R11 | **BR-02 Guard** |
| UC23 | Guest | S-G15 | — |
| UC24 | Manager | S-M02 | BR-06 |
| UC25 | Manager | S-M03, S-M05 | BR-06 |
| UC26 | Admin | S-A04 | — |
| UC27 | Admin | S-A05 | — |
| UC28 | Admin | S-A06 | BR-03, BR-06 |
| UC29 | Admin → Manager | S-A07 | **BR-06** |
| UC30 | Admin | S-A08 | BR-03, BR-05, BR-07 |
| UC31 | Admin + Manager | S-A09, S-M04 | BR-06 |

---

> **[ END OF HSWRMS SCREEN DIAGRAMS BY ACTOR — v1.0 ]**  
> Tài liệu này mô tả luồng màn hình từ góc nhìn của từng actor trong hệ thống HSWRMS.  
> Sử dụng PlantUML để render các sơ đồ — compatible với PlantUML Server, VS Code Extension, IntelliJ Plugin.
