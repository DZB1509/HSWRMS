# BÁO CÁO TỔNG KẾT KỸ THUẬT VÀ ĐỐI SOÁT BẰNG CHỨNG DỰ ÁN HSWRMS
## HỆ THỐNG QUẢN LÝ KHU NGHỈ DƯỠNG CHĂM SÓC SỨC KHỎE HEAVENSTAY (HSWRMS)
### PHIÊN BẢN ĐỐI SOÁT & GIA CỐ BẰNG CHỨNG (RECONCILED & EVIDENCE-HARDENED EDITION)
*(Đã cập nhật đợt hiệu chỉnh mục tiêu - Targeted Audit Correction: Tính điểm trực tiếp từ 11 tiêu chí, giải trình 180 vs 181 dòng WBS, và minh bạch độ lệch kiểm thử)*

> **Căn cứ pháp lý & kỹ thuật kiểm toán:**
> - Bảng phân công công việc chính thức: `01_Planning/Task_Project_G1_IS2005.xlsx` (Trang *Đánh giá thành viên* & *Official Plan*).
> - Nhánh tích hợp trung tâm: `feature/hswrms-m1-m6-integration` trên GitLab `isp-origin` (`fal26-isp392-is2005-g1.git`).
> - Báo cáo tích hợp nguồn: `06_Reports/PHASE_5.8.3.117-5.8.3.118_FULL_TEAM_MERGE_HISTORY.txt`.
> - Bộ bằng chứng đối soát: `00_SOURCE_MANIFEST.csv`, `01_Task_Assignment_Reconciliation.csv`, `02_Identity_Reconciliation.csv`, `03_Contribution_Reconciliation.csv`, `04_Module_Evidence_Reconciliation.csv`, `05_Test_Evidence_Reconciliation.csv`, `06_Gap_Register_Reconciled.csv`, `Correction_Log.csv`.
> - Thời điểm đối soát: Học kỳ Spring 2026 / Môn ISP392 (SE / IS2005 - Nhóm 1).

---

## A1. TỔNG QUAN ĐIỀU HÀNH & KẾT QUẢ ĐỐI SOÁT

### 1.1 HSWRMS là gì và phạm vi kiến trúc M1–M6
**HSWRMS (HeavenStay Wellness Resort Management System)** là nền tảng quản trị tổng thể khu nghỉ dưỡng chăm sóc sức khỏe và trị liệu chuẩn hóa. Dự án áp dụng kiến trúc phân tầng doanh nghiệp (Enterprise Tiered Architecture):
- **Backend:** Spring Boot 3.3.4, Java 17, Spring Security với chuỗi lọc kép (Dual Security Filter Chains), JPA/Hibernate.
- **Frontend:** React 18, TypeScript ~6.0.2, Vite v8.3.4, TailwindCSS, Hệ thống Design Tokens đồng bộ.
- **Cơ sở dữ liệu:** SQL Server (sơ đồ chuẩn hóa theo `04_Database/schema.sql` gồm 45 bảng thực thể).

Phạm vi phát triển gồm 6 phân hệ cốt lõi (M1–M6) cùng Hạ tầng kỹ thuật dùng chung:
- **Module 1 (M1):** Quản lý Định danh, Xác thực, Hồ sơ Sức khỏe & Quyền riêng tư GDPR (PIC: Lê Đức Hoàng - `HE204568`).
- **Module 2 (M2):** Đặt gói Nghỉ dưỡng Trị liệu, Vận hành Lễ tân & Đặt cọc VNPay (PIC: Nguyễn Gia Đạt - `HE181035`).
- **Module 3 (M3):** Đặt lịch Liệu trình Spa, Điều phối Kỹ thuật viên & Phòng trị liệu (PIC: Nguyễn Tất Đạt - `HE181883`).
- **Module 4 (M4):** Thực đơn Dinh dưỡng Chữa lành, Chọn món theo Ngày & Điều phối Bếp KDS (PIC: Vũ Phương Thảo - `HE204054`).
- **Module 5 (M5):** Tổng hợp Chi phí (Folio), Hóa đơn VAT điện tử, Thanh toán & Đánh giá (PIC: Tăng Xuân Hòa - `HE180798`).
- **Module 6 (M6):** Quản trị Hệ thống, Phân quyền RBAC, Ủy quyền Tạm thời & Master Data (PIC: Phạm Thành Vinh - `HE186593`).
- **Hạ tầng Dùng chung (Shared Infra):** Kiến trúc Security, Design Tokens, Layout, Dynamic DB Adapter & Lead Integrator (Technical Lead: Nguyễn Tất Đạt - `HE181883`).
- **Giám sát Môn học (Supervisor):** Thầy Nguyễn Cường Mạnh (`manhnc5@fe.edu.vn`) - Chủ sở hữu namespace GitLab, tách biệt khỏi mẫu số tính điểm của sinh viên.

---

### 1.2 Kết quả đối soát danh tính và giải quyết dị biệt lịch sử
Quá trình đối soát độc lập giữa tệp kế hoạch gốc `Task_Project_G1_IS2005.xlsx` và các báo cáo audit trước đó đã phát hiện và xử lý dứt điểm các dị biệt sau:

1. **Khôi phục 100% Mã số sinh viên (MSSV):**
   - Tài liệu audit cũ ghi nhận trạng thái `UNKNOWN` đối với 3 thành viên: Lê Đức Hoàng, Vũ Phương Thảo và Phan Thành Vinh.
   - Đối soát đối chiếu trang tính *Đánh giá thành viên* trong bảng kế hoạch chính thức đã xác định chính xác và khôi phục toàn bộ:
     - **Lê Đức Hoàng:** `HE204568`
     - **Vũ Phương Thảo:** `HE204054`
     - **Phạm/Phan Thành Vinh:** `HE186593`
     - **Nguyễn Gia Đạt:** `HE181035`
     - **Nguyễn Tất Đạt:** `HE181883`
     - **Tăng/Trần Xuân Hòa:** `HE180798`

2. **Chuẩn hóa dị biệt về Họ thành viên (Surname Discrepancies):**
   - **Thành viên MEM-05 (HE180798):** Bảng kế hoạch chính thức ghi `Tăng Xuân Hòa`; các báo cáo audit trước và email commit Git ghi `Trần Xuân Hòa` (email: `hoatxhe180798@fpt.edu.vn`). Chuẩn hóa: Chọn `Tăng Xuân Hòa` làm tên chuẩn (Canonical Name), đồng thời lưu vết `Trần Xuân Hòa` là Bí danh ghi nhận (Documented Alias).
   - **Thành viên MEM-06 (HE186593):** Bảng kế hoạch chính thức ghi `Phạm Thành Vinh`; các báo cáo audit trước và email commit Git ghi `Phan Thành Vinh` (email: `pthanhvinh26112004@gmail.com`). Chuẩn hóa: Chọn `Phạm Thành Vinh` làm tên chuẩn, đồng thời lưu vết `Phan Thành Vinh` là Bí danh ghi nhận.

3. **Phân định rõ ràng Giảng viên và Sinh viên:**
   - Giảng viên hướng dẫn môn học Nguyễn Cường Mạnh (`manhnc5@fe.edu.vn`) sở hữu commit khởi tạo (`1bc054b`).
   - Thầy Mạnh được phân loại là `LECTURER / NON-STUDENT` và **tuyệt đối không tham gia vào mẫu số tính điểm, tỷ lệ WBS hay xếp loại học tập** của 6 sinh viên.

4. **Làm rõ con số 6 Sinh viên vs 8 Nhánh tính năng Git:**
   - Dự án gồm 6 sinh viên phát triển nhưng tạo ra 8 nhánh tính năng trên remote `isp-origin`: `DucHoangM1`, `dat-nguyen-gia`, `NTDatZB`, `thao-product`, `XH`, `XH4` (Hòa có 2 nhánh), `vinhpt`, `vinhpt1` (Vinh có 2 nhánh). Cả 8 nhánh này đã được Lead Integrator hợp nhất vào `feature/hswrms-m1-m6-integration`.

5. **Phân tầng phạm vi: 27 Use Case nghiệp vụ vs 49 Cấu phần kỹ thuật:**
   - Con số **27** đề cập đến các Luồng nghiệp vụ cốt lõi người dùng (Core Business Use Cases / Functional Flows) được định nghĩa trong tài liệu đặc tả SRS (M1: 4, M2: 5, M3: 4, M4: 5, M5: 5, M6: 4).
   - Con số **49** đề cập đến các Cấu phần kỹ thuật chi tiết được kiểm kê trong `04_Module_Completeness.csv` (43 chức năng kỹ thuật phân hệ + 6 cấu phần hạ tầng chia sẻ dùng chung).

6. **Giải trình số lượng dòng WBS: 180 Tác vụ nghiệp vụ vs 181 Dòng Excel:**
   - Trong `Task_Project_G1_IS2005.xlsx` sheet `Official Plan`, các dòng từ dòng 4 đến dòng 183 chứa chính xác **180 tác vụ WBS nghiệp vụ và cột mốc** (từ WBS 1 "Project Initiating" đến WBS 10.5 "Final Project Review").
   - Dòng 185 chứa thông tin ghi chú thời hạn thi cử: `NOTE: "Thực tế 11/11 là buổi học cuối của môn trước khi lên hội đồng"`. Đây là dòng ghi chú hành chính (Administrative Footnote), không phải tác vụ WBS chức năng.
   - Bảng đối soát [01_Task_Assignment_Reconciliation.csv](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/audit-output/01_Task_Assignment_Reconciliation.csv) ghi nhận đầy đủ 181 dòng này, trong đó phân định rõ 180 tác vụ WBS chức năng và 1 dòng `PLANNING_FOOTNOTE` (`NOT_ASSESSABLE`), bảo đảm không làm mất thông tin của bản gốc.
   - Đồng thời, cột `Reconciliation_Relationship` (`MATCHED`, `PARTIAL_MATCH`, `UNASSIGNED`) được tách biệt hoàn toàn khỏi cột đánh giá hoàn thành `Evidence_Based_Completion_Assessment`.

---

### 1.3 Trạng thái tích hợp kỹ thuật sau Phase 5.8.3.118 & Báo cáo Kiểm thử
Dự án đã hoàn thành đợt tích hợp toàn diện qua 2 giai đoạn chính:
- **Phase 5.8.3.117 (Pre-integration & Selective Merge):** Hợp nhất các nhánh chuẩn kiến trúc (M1, M4, M6-villa, M2-adapter), bảo vệ toàn vẹn lược đồ CSDL chuẩn 45 bảng.
- **Phase 5.8.3.118 (Full Team Reconciliation & Test Stabilization):** Tích hợp nhánh phức tạp M5 (`XH`), độc lập giải quyết 44 xung đột merge (merge conflicts), xử lý hài hòa DTO/Exception và khắc phục 2 lỗi kiểm thử hồi quy.

**Chỉ số kiểm chứng kỹ thuật:**
- **Mã nguồn Backend:** Biên dịch Java 17 sạch sẽ, cấu hình Spring Boot 3.3.4 nhất quán.
- **Bộ kiểm thử Backend (Reported in Phase 118 logs):** 536 bài kiểm thử đã chạy; **526 bài đạt (PASSED)**, **0 bài thất bại (FAILED)**, **10 bài bỏ qua (SKIPPED)**.
  - *Lưu ý kiểm toán quan trọng 1:* 526 bài test này được thực thi trên môi trường **H2 in-memory (chế độ MODE=MSSQLServer)**. 10 bài test bị bỏ qua là các bài kiểm tra trực tiếp trên SQL Server thật (`Opt-in SQL Server Smoke Tests`), được chủ động ngắt bằng cơ chế `assumeTrue` nhằm bảo vệ cơ sở dữ liệu `HSWRMS_TEST`.
  - *Lưu ý kiểm toán quan trọng 2 (Minh bạch phân rã chi tiết):* Tổng số bài test pass của các hàng phân hệ chi tiết (M1: 77, M2: 34, M3: 24, M4: 42, M5: 48, M6: 49, Shared: 242) là **516 bài pass**. Chênh lệch **10 bài test pass** so với con số tổng thể 526 bài pass được ghi nhận rõ ràng là `UNRESOLVED_BREAKDOWN_VARIANCE` (độ lệch phân rã chưa giải quyết). Kiểm toán **không tự ý tạo thêm 10 bài test pass** vào bất kỳ phân hệ nào vì tài liệu lịch sử merge chỉ cung cấp danh sách mẫu các test suite chính (196 bài test tại Mục 8.2), chưa có bảng kê chi tiết toàn bộ 536 ca kiểm thử.
- **Mã nguồn Frontend:** Biên dịch sạch sẽ qua Vite v8.3.4 (`npm run build` hoàn thành trong 997ms, xuất 2,728 module JavaScript/CSS).
- **Tĩnh phân tích Frontend:** Oxlint kiểm tra 216 tệp tin mã nguồn, phát hiện 0 lỗi cú pháp/logic chặn (10 cảnh báo biến chưa dùng trong khối catch dự phòng).
- **Cơ sở dữ liệu:** Bảo toàn 100% không phát sinh đột biến trái phép (Zero Schema Drift) trên CSDL `HSWRMS` và `HSWRMS_TEST`.

---

## A2. TÌNH TRẠNG CHI TIẾT THEO TỪNG MODULE SAU MERGE

### 1. Module 1 — Quản trị Định danh, Xác thực & Hồ sơ Sức khỏe
- **Người phụ trách (PIC):** Lê Đức Hoàng (MSSV: `HE204568`).
- **Nhánh Git nguồn:** `isp-origin/DucHoangM1` (13 commits). Hợp nhất vào nhánh chính tại commit `602c6f8`.
- **Thành phần mã nguồn đã xác minh:**
  - Backend: `AuthController`, `CustomerProfileController`, `GdprController`, `OtpService`, `SsoAuthService`, `UserDetailsServiceImpl`.
  - Frontend: `LoginPage.tsx`, `RegisterPage.tsx`, `OtpVerificationModal.tsx`, `CustomerProfilePage.tsx`, `HealthProfilePage.tsx`, `GdprConsentModal.tsx`.
- **Kết quả kiểm thử:** 77 bài test backend được báo cáo đạt 100% trong log module (`AuthServiceTest`, `SsoAuthEndpointTests`, `CustomerProfileServiceTest`).
- **Phân loại độ tin cậy & Giới hạn môi trường:**
  - *Logic định danh, hashing mật khẩu BCrypt, OTP, phân quyền Spring Security:* **VERIFIED (HIGH)**.
  - *Tích hợp Google & Facebook SSO qua mạng thực tế:* **PARTIALLY_VERIFIED (MEDIUM)**. Mã nguồn xử lý OAuth2 ticket và linking tài khoản đã hoàn thiện và vượt qua mock test, nhưng luồng trao đổi token qua internet thực tế phụ thuộc cấu hình Client Secret trong môi trường staging (Đang theo dõi tại `GAP-02`).
  - *Gửi mail OTP thực tế qua SendGrid:* **PARTIALLY_VERIFIED (MEDIUM)** do đang dùng mock mail sender (Theo dõi tại `GAP-08`).

---

### 2. Module 2 — Đặt phòng Nghỉ dưỡng & Vận hành Lễ tân
- **Người phụ trách (PIC):** Nguyễn Gia Đạt (MSSV: `HE181035`).
- **Nhánh Git nguồn:** `isp-origin/dat-nguyen-gia` (8 commits, nổi bật commit `4bd4ecd` bổ sung 3,417 dòng code). Hợp nhất tại commit `0f257ad`.
- **Thành phần mã nguồn đã xác minh:**
  - Backend: `RetreatPackageController`, `ReceptionistOperationController`, `BookingController`, `BookingPricingService`, `VNPayClient`, `CustomerIdentityAdapter`.
  - Frontend: `RetreatBookingWizard.tsx`, `PackageDetailPage.tsx`, `ReceptionistCheckInModal.tsx`, `WalkInBookingModal.tsx`, `BookingSummaryCard.tsx`.
- **Kết quả kiểm thử:** 34 bài test backend được báo cáo đạt 100% (`ReceptionistOperationServiceTest`, `BookingPricingCalculationTest`).
- **Phân loại độ tin cậy & Giới hạn môi trường:**
  - *Nghiệp vụ tính giá cọc, sơ đồ phòng, thủ tục check-in/check-out của lễ tân:* **VERIFIED (HIGH)**.
  - *Cổng thanh toán VNPay Deposit Gateway:* **PARTIALLY_VERIFIED (MEDIUM)**. Thuật toán tạo chữ ký SHA512 và sinh URL thanh toán đạt chuẩn kỹ thuật, tuy nhiên luồng webhook IPN phản hồi thời gian thực qua mạng internet yêu cầu môi trường staging có IP public/ngrok (Theo dõi tại `GAP-01`).

---

### 3. Module 3 — Quản lý Trị liệu & Spa Chăm sóc Sức khỏe
- **Người phụ trách (PIC):** Nguyễn Tất Đạt (MSSV: `HE181883`).
- **Nhánh Git nguồn:** `isp-origin/NTDatZB` (102 commits bao gồm cả code phân hệ và hạ tầng).
- **Thành phần mã nguồn đã xác minh:**
  - Backend: `SpaTreatmentController`, `SpaBookingService`, `TherapistScheduleService`, `CustomerStayPort`, `SpaSlotAllocationService`.
  - Frontend: `SpaTreatmentCatalog.tsx`, `TherapistBookingPage.tsx`, `TherapySessionScheduler.tsx`, `SpaTreatmentHistory.tsx`.
- **Kết quả kiểm thử:** 24 bài test M3 backend được báo cáo đạt 100% (`SpaBookingServiceTest`, `TherapistScheduleValidatorTest`).
- **Phân loại độ tin cậy & Giới hạn môi trường:** **VERIFIED (HIGH)**. Logic kiểm tra trùng lịch trị liệu, điều phối kỹ thuật viên và tích hợp hợp đồng lưu trú `CustomerStayPort` hoạt động ổn định trên toàn bộ các ca kiểm thử.

---

### 4. Module 4 — Ẩm thực Chăm sóc Sức khỏe & Điều phối Bếp KDS
- **Người phụ trách (PIC):** Vũ Phương Thảo (MSSV: `HE204054`).
- **Nhánh Git nguồn:** `isp-origin/thao-product` (57 commits). Hợp nhất tại commit `6ff5b9a`.
- **Thành phần mã nguồn đã xác minh:**
  - Backend: `FnbMenuController`, `DailyMealOrderController`, `KdsKitchenController`, `RecipeInventoryService`, `DietaryProfileValidator`, `TextSanitizer`.
  - Frontend: `WellnessMenuPage.tsx`, `DailyMealSelectionWizard.tsx`, `KitchenDisplayDashboard.tsx`, `AllergenFilterBar.tsx`, `InventoryStockModal.tsx`.
- **Kết quả kiểm thử:** 42 bài test backend được báo cáo đạt 100% (`MealOrderServiceTest`, `InventoryDeductionServiceTest`).
- **Phân loại độ tin cậy & Giới hạn môi trường:** **VERIFIED (HIGH)**. Xử lý xuất sắc nghiệp vụ lọc món theo hồ sơ dị ứng y khoa, điều phối trạng thái chế biến tại bếp (KDS) và trừ kho nguyên liệu tự động. Đã xử lý triệt để lỗi hiển thị tiếng Việt UTF-8.

---

### 5. Module 5 — Tổng hợp Chi phí (Folio), Hóa đơn VAT, Thanh toán & Đánh giá
- **Người phụ trách (PIC):** Tăng Xuân Hòa (Bí danh: Trần Xuân Hòa - MSSV: `HE180798`).
- **Nhánh Git nguồn:** `isp-origin/XH` và `isp-origin/XH4` (8 commits, nổi bật commit `ebaddc7` với 7,608 dòng code). Hợp nhất và chuẩn hóa tại commit `9668586`.
- **Thành phần mã nguồn đã xác minh:**
  - Backend: `BillingFolioController`, `InvoiceExportController`, `CustomerReviewController`, `FolioAggregationService`, `PdfInvoiceGeneratorService`.
  - Frontend: `CustomerFolioPage.tsx`, `CheckoutPaymentModal.tsx`, `InvoicePdfViewer.tsx`, `PostStayReviewForm.tsx`, `RevenueAnalyticsDashboard.tsx`.
- **Kết quả kiểm thử:** 48 bài test backend được báo cáo đạt 100% (`M5BillingAndCheckoutTests`, `FolioCalculationServiceTest`).
- **Phân loại độ tin cậy & Giới hạn môi trường:**
  - *Nghiệp vụ tài chính, kết chuyển chi phí từ M2/M3/M4 vào Folio, tính thuế VAT, sinh tệp PDF:* **VERIFIED (HIGH)**. Đã loại bỏ hoàn toàn các entity trùng lặp thông qua đợt refactoring tại commit `9668586`.
  - *Thanh toán trực tiếp đa kênh qua cổng ngân hàng:* **PARTIALLY_VERIFIED (MEDIUM)** (Đồng bộ theo dõi tại `GAP-01`).

---

### 6. Module 6 — Quản trị Hệ thống, Phân quyền & Giám sát Vận hành
- **Người phụ trách (PIC):** Phạm Thành Vinh (Bí danh: Phan Thành Vinh - MSSV: `HE186593`).
- **Nhánh Git nguồn:** `isp-origin/vinhpt` và `isp-origin/vinhpt1` (22 commits). Hợp nhất tại commit `39b086f`.
- **Thành phần mã nguồn đã xác minh:**
  - Backend: `AdminUserController`, `TemporaryDelegationController`, `AuditLogController`, `SystemConfigurationController`, `MasterDataSeedRunner`.
  - Frontend: `VillaManagementPage.tsx` (2,765 dòng), `SpaManagementPage.tsx` (1,843 dòng), 11 modal cấu hình vận hành chuyên sâu, `AuditLogViewer.tsx`.
- **Kết quả kiểm thử:** 49 bài test backend được báo cáo đạt 100% (`M6AdminIntegrationTests`, `DelegationServiceTest`). Đã khắc phục lỗi dynamic manager ID trong fixture test tại commit `1f7ebc1`.
- **Phân loại độ tin cậy & Giới hạn môi trường:** **VERIFIED (HIGH)**. Khối lượng đóng góp giao diện quản trị rất lớn, tích hợp chặt chẽ cơ chế kiểm toán audit log và ủy quyền tạm thời.

---

### 7. Hạ tầng Dùng chung (Shared Infrastructure)
- **Người phụ trách (PIC):** Nguyễn Tất Đạt (MSSV: `HE181883`).
- **Thành phần mã nguồn đã xác minh:**
  - Security kép: Chuỗi lọc phân tách giữa Admin/Staff và Customer/Public.
  - Thiết kế dùng chung: `theme.tokens.ts`, `MainLayout.tsx`, `CustomerContext.tsx`.
  - Cấu hình kiểm thử: `application-test.yml` (H2 MSSQLServer mode), cơ chế Opt-in SQL Server guard.
  - Quản lý tích hợp: Giải quyết 44 merge conflicts, đẩy mã nguồn lên nhánh chung, ban hành tài liệu kỹ thuật Phase 117-118.
- **Kết quả kiểm thử:** 252 bài kiểm thử hạ tầng (242 passed, 10 skipped live DB by design).

---

## A3. TỔNG HỢP CÁC SỬA ĐỔI TÍCH HỢP & HARMONIZATION (PHASES 117–118)

Quá trình hợp nhất toàn bộ mã nguồn của nhóm đã giải quyết 4 nhóm vấn đề kỹ thuật lớn:

1. **Giải quyết xung đột Merge (44 Merge Conflicts):**
   - Xung đột chủ yếu diễn ra giữa nhánh `XH` (M5) và `main` do M5 tự định nghĩa lại các thực thể khách hàng và đơn đặt phòng dạng độc lập. Lead Integrator đã chuyển đổi các thực thể tạm này sang việc sử dụng trực tiếp cổng giao tiếp chuẩn `CustomerStayPort` và chia sẻ `CustomerEntity` chung, loại bỏ mã nguồn thừa.

2. **Khắc phục lỗi ghi đè cấu hình H2 (Database Mode Harmonization):**
   - Nhánh `vinhpt1` từng chứa cấu hình ghi đè driver test làm mất cờ `MODE=MSSQLServer`. Vấn đề đã được khắc phục tại commit `1f7ebc1`, đảm bảo toàn bộ 536 bài test backend chạy thống nhất trên môi trường tương thích SQL Server.

3. **Cố định mã nhận diện Manager trong Fixture Test (Test Isolation):**
   - Test suite M6 ban đầu sử dụng ID cố định dẫn đến xung đột khi dữ liệu mẫu thay đổi. Commit `1f7ebc1` đã refactor sang việc truy vấn dynamic manager ID từ context xác thực, giúp bộ test pass 100% độc lập.

4. **Chuẩn hóa chuỗi ký tự UTF-8 Tiếng Việt:**
   - Xử lý các tệp cấu hình và mã nguồn món ăn dinh dưỡng tại M4 bị lỗi font dấu tiếng Việt trên môi trường Windows thông qua việc chuẩn hóa charset `UTF-8` toàn bộ dự án.

---

## A4. MA TRẬN ĐỐI SOÁT CHỨC NĂNG (27 USE CASES VS 49 CẤU PHẦN KỸ THUẬT)

Dưới đây là ma trận ánh xạ giữa **27 Luồng nghiệp vụ cốt lõi (Core Business Use Cases)** và **49 Cấu phần kỹ thuật chi tiết**:

| Phân hệ | Số UC | Luồng nghiệp vụ cốt lõi (SRS) | Cấu phần kỹ thuật chi tiết trong Code | Kiểm thử tự động | Trạng thái kỹ thuật |
|:---|:---:|:---|:---|:---:|:---:|
| **M1** | 4 | 1. Đăng ký/Xác thực Email OTP<br>2. Đăng nhập Google/Facebook SSO<br>3. Quản lý Hồ sơ Khách & Sức khỏe<br>4. Yêu cầu Quyền riêng tư GDPR | `AuthController`, `CustomerProfileController`, `GdprController`, `OtpService`, `SsoAuthService` (8 components) | 77 Reported Pass | Vượt qua kiểm thử; Chờ Staging Secrets cho Live SSO |
| **M2** | 5 | 1. Duyệt & Lọc Gói Nghỉ dưỡng<br>2. Đặt Gói & Tính cọc tự động<br>3. Tích hợp Đặt cọc VNPay<br>4. Check-in/Check-out Lễ tân<br>5. Đặt phòng Khách vãng lai | `RetreatPackageController`, `BookingController`, `ReceptionistOperationController`, `VNPayClient` (7 components) | 34 Reported Pass | Vượt qua kiểm thử; Chờ Gateway IPN cho Live VNPay |
| **M3** | 4 | 1. Tra cứu Danh mục Trị liệu Spa<br>2. Đặt lịch & Chọn khung giờ<br>3. Điều phối Kỹ thuật viên & Phòng<br>4. Theo dõi Tiến trình Liệu trình | `SpaTreatmentController`, `SpaBookingService`, `TherapistScheduleService`, `SpaSlotAllocationService` (7 components) | 24 Reported Pass | Vượt qua kiểm thử 100% |
| **M4** | 5 | 1. Thực đơn Dinh dưỡng Chữa lành<br>2. Lọc Món theo Dị ứng Sức khỏe<br>3. Chọn Món Dinh dưỡng theo Ngày<br>4. Bảng Điều phối Bếp (KDS)<br>5. Quản lý Tồn kho & Trừ nguyên liệu | `FnbMenuController`, `DailyMealOrderController`, `KdsKitchenController`, `RecipeInventoryService` (7 components) | 42 Reported Pass | Vượt qua kiểm thử 100% |
| **M5** | 5 | 1. Tổng hợp Chi phí Folio Đa nguồn<br>2. Thanh toán Trả phòng Đa kênh<br>3. Xuất Hóa đơn Điện tử VAT (PDF)<br>4. Gửi Đánh giá sau Kỳ nghỉ<br>5. Báo cáo Doanh thu & Quản trị | `BillingFolioController`, `InvoiceExportController`, `CustomerReviewController`, `PdfInvoiceGenerator` (7 components) | 48 Reported Pass | Vượt qua kiểm thử 100% |
| **M6** | 4 | 1. Quản lý Villa, Phòng & Giá<br>2. Quản lý Dịch vụ Spa & KTV<br>3. Phân quyền RBAC & Ủy quyền Tạm<br>4. Giám sát Vận hành & Audit Log | `AdminUserController`, `TemporaryDelegationController`, `AuditLogController`, `SystemConfigController` (7 components) | 49 Reported Pass | Vượt qua kiểm thử 100% |
| **INFRA**| N/A | Hạ tầng Bảo mật kép, Design Tokens, Routing, Layout, Exception, Dynamic Adapters | `SecurityConfig`, `GlobalExceptionHandler`, `CustomerContext`, `theme.tokens.ts`, `Vite Setup` (6 components) | 242 Pass (10 skip) | Vượt qua kiểm thử 100% |
| **TỔNG** | **27**| **27 Use Cases cốt lõi** | **49 Cấu phần kỹ thuật chi tiết** | **526 Reported Pass (10 skip)** | **Tích hợp mã nguồn hoàn tất** |

---

## A5. SỔ THEO DÕI KHOẢNG TRỐNG & RỦI RO KỸ THUẬT (GAP REGISTER)

Kiểm toán xác nhận hiện còn **8 khoảng trống kỹ thuật (GAP-01 đến GAP-08)** đang mở. Đây là các điều kiện tiên quyết để hệ thống có thể chuyển từ trạng thái *Tích hợp ổn định cục bộ* sang *Sẵn sàng triển khai thực tế (Production Readiness)*:

1. **GAP-01 (M2/M5 - P1): Xác minh Cổng thanh toán VNPay trên mạng thật:**
   - *Hiện trạng:* Thuật toán băm SHA-512 và sinh URL đã pass unit test, nhưng webhook IPN chưa được kích hoạt với gateway thật.
   - *Hành động:* Cấu hình `vnp_HashSecret` staging, thiết lập ngrok/public IP để tiếp nhận IPN callback.
   - *Người phụ trách:* Nguyễn Gia Đạt & Tăng Xuân Hòa.

2. **GAP-02 (M1 - P1): Xác minh Luồng OAuth2 Google & Facebook SSO:**
   - *Hiện trạng:* Code và mock test hoàn tất; thiếu Client ID/Secret thật trên staging.
   - *Hành động:* Đăng ký OAuth app trên Google Cloud Console & Meta Developers, cấu hình redirect URI.
   - *Người phụ trách:* Lê Đức Hoàng.

3. **GAP-03 (Database - P1): Nạp Dữ liệu Master Data đầy đủ vào CSDL thật:**
   - *Hiện trạng:* `HSWRMS_TEST` chưa nạp đủ danh mục 15 villa và 20 món ăn trị liệu.
   - *Hành động:* Thực thi script seed dữ liệu chuẩn hóa trong môi trường staging có phân quyền.
   - *Người phụ trách:* Phạm Thành Vinh.

4. **GAP-04 (Database - P1): Sắp xếp Thứ tự Flyway Migration cho 4 Script trì hoãn:**
   - *Hiện trạng:* Có 4 tệp migration chưa đánh số phiên bản tuần tự (`V003` đến `V005`).
   - *Hành động:* Chuẩn hóa đặt tên tệp Flyway, kiểm thử migration tự động trên CSDL trống.
   - *Người phụ trách:* Nguyễn Tất Đạt & Phạm Thành Vinh.

5. **GAP-05 (Security - P0): Loại bỏ Endpoint Bypass Xác thực Môi trường Local:**
   - *Hiện trạng:* Trong `SecurityConfig.java` còn mở endpoint cho phép mock token để dev nhanh.
   - *Hành động:* Bọc endpoint dưới điều kiện `@Profile("dev")` hoặc xóa bỏ trước khi build staging.
   - *Người phụ trách:* Nguyễn Tất Đạt (Lead).

6. **GAP-06 (Cross-Module - P1): Kiểm thử Xuyên suốt Toàn bộ Vòng đời Khách hàng (E2E Traversal):**
   - *Hiện trạng:* Từng phân hệ pass unit test độc lập; chưa chạy kịch bản E2E từ Đặt phòng (M2) -> Dùng Spa (M3) -> Ăn uống (M4) -> Check-out Folio (M5).
   - *Hành động:* Xây dựng kịch bản kiểm thử E2E liên phân hệ trên staging.
   - *Người phụ trách:* Toàn đội ngũ kỹ thuật.

7. **GAP-07 (M2/M4 - P2): Kiểm tra Xung đột Concurrency dưới Tải đồng thời:**
   - *Hiện trạng:* Test H2 chạy đơn luồng; chưa kiểm tra hiện tượng tranh chấp phòng villa hoặc suất ăn khi 50 khách cùng đặt đồng thời.
   - *Hành động:* Chạy kịch bản kiểm thử tải nhẹ với JMeter/k6 trên staging.
   - *Người phụ trách:* Nguyễn Gia Đạt & Vũ Phương Thảo.

8. **GAP-08 (M1 - P2): Cấu hình Dịch vụ Gửi Mail OTP Production:**
   - *Hiện trạng:* Mail server đang trỏ về cấu hình mock trong profile test.
   - *Hành động:* Cấu hình thông số SMTP / SendGrid API Key chính thức trong biến môi trường.
   - *Người phụ trách:* Lê Đức Hoàng.

---

## A6. TỔNG KẾT ĐÁNH GIÁ ĐÓNG GÓP THÀNH VIÊN (TÍNH TRỰC TIẾP TỪ 11 TIÊU CHÍ)

Điểm số đóng góp của 6 sinh viên được **tính toán trực tiếp từ 11 tiêu chí đánh giá năng lực** (TC-01 đến TC-11) và các trọng số chuẩn hóa tổng 100.0% (`=SUMPRODUCT($C$2:$C$12, {col}2:{col}12)`), loại bỏ hoàn toàn các sai lệch do làm tròn trung gian qua 4 nhóm tiêu chí:

| STT | Họ và tên chuẩn | MSSV | Module đảm nhiệm | Số Commit | Số Test | Điểm TK (Trực tiếp 11 TC) | Xếp loại | Đóng góp & Trách nhiệm nổi bật |
|:---:|:---|:---:|:---|:---:|:---:|:---:|:---:|:---|
| 1 | **Nguyễn Tất Đạt** | `HE181883` | M3 - Spa & Lead Infra | 102 | 24 (+252) | **9.84** | **Xuất sắc** | Trụ cột kỹ thuật dự án: thiết lập kiến trúc Security kép, layout tokens; phát triển M3 Spa; độc lập giải quyết 44 merge conflicts; fix 2 lỗi test phức tạp. |
| 2 | **Vũ Phương Thảo** | `HE204054` | M4 - F&B & Bếp KDS | 57 | 42 | **9.24** | **Xuất sắc** | Tinh thần làm việc mẫu mực với 57 commits phân bổ đều đặn; hoàn thiện xuất sắc F&B trị liệu, bộ lọc dị ứng, quy trình điều phối bếp KDS, trừ kho và sửa lỗi font UTF-8. |
| 3 | **Lê Đức Hoàng** | `HE204568` | M1 - Identity & Access | 13 | 77 | **9.17** | **Xuất sắc** | Hoàn thành phân hệ M1 bảo mật cao; tích hợp SSO, OTP, Screen #9 GDPR xóa dữ liệu; bộ test 77 bài pass 100%; tài liệu bàn giao M1_HANDOFF rất chi tiết. |
| 4 | **Tăng Xuân Hòa**<br>*(Alias: Trần Xuân Hòa)* | `HE180798` | M5 - Billing & Folio | 8 | 48 | **9.09** | **Xuất sắc** | Đóng góp khối lượng nghiệp vụ tài chính khổng lồ trong commit ebaddc7 (7,608 dòng, 68 files); xây dựng Folio đa nguồn, hóa đơn PDF; 48 test M5 pass 100%. |
| 5 | **Phạm Thành Vinh**<br>*(Alias: Phan Thành Vinh)* | `HE186593` | M6 - Admin & Quản trị | 22 | 49 | **8.94** | **Giỏi** | Giao diện quản trị thực tế đồ sộ với 2 trang quản lý villa (2,765 dòng) và spa (1,843 dòng), 11 modal cấu hình chuyên sâu; phân quyền RBAC, ủy quyền và audit log. |
| 6 | **Nguyễn Gia Đạt** | `HE181035` | M2 - Booking & Lễ tân | 8 | 34 | **8.86** | **Giỏi** | Khối lượng code lớn trong commit 4bd4ecd (3,417 dòng, 33 files); xây dựng toàn bộ quy trình lễ tân, tính cọc, tích hợp cổng VNPay và adapter danh tính khách. |
| **TB**| **Trung bình 6 Sinh viên**| **N/A** | **Toàn dự án HSWRMS** | **35** | **88** | **9.19** | **Xuất sắc** | **Mức độ hoàn thành xuất sắc mục tiêu tích hợp liên phân hệ.** |
| *Ref*| **Nguyễn Cường Mạnh** | `GIẢNG VIÊN` | Giám sát & Quản trị Repo | 1 | N/A | **N/A** | **Giảng viên** | Giảng viên hướng dẫn môn học, chủ sở hữu không gian GitLab. Tách biệt hoàn toàn khỏi mẫu số tính điểm và xếp loại học tập của 6 sinh viên. |

---

## A7. KẾT LUẬN VÀ LỘ TRÌNH KHUYẾN NGHỊ TIẾP THEO

1. **Khẳng định về tính toàn vẹn của đợt kiểm toán:**
   - Quá trình kiểm toán được tiến hành hoàn toàn theo chế độ **Chỉ đọc (Read-only)** đối với mã nguồn ứng dụng và Git history.
   - Không có bất kỳ lệnh DDL, DML hay can thiệp trực tiếp nào được thực hiện trên cơ sở dữ liệu `HSWRMS` và `HSWRMS_TEST`.
   - Toàn bộ bằng chứng lịch sử được giữ nguyên bản; các sản phẩm chuẩn hóa được xuất ra thư mục riêng biệt với nhãn `_RECONCILED` kèm bản sao lưu an toàn (`backup_targeted_correction_20261029`).

2. **Khuyến nghị điều hành cho nhóm:**
   - Dự án đã vượt qua giai đoạn khó khăn nhất là hợp nhất mã nguồn và đồng bộ cấu trúc phân tầng.
   - Nhóm cần phối hợp xử lý dứt điểm 8 khoảng trống kỹ thuật (đặc biệt là GAP-05 về bảo mật và GAP-01, GAP-02 về khóa bí mật staging) trước khi tiến hành nghiệm thu bảo vệ đồ án cuối kỳ.
