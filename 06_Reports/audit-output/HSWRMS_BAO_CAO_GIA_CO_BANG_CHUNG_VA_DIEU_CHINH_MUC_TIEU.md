# BÁO CÁO HIỆU CHỈNH MỤC TIÊU & GIA CỐ BẰNG CHỨNG KIỂM TOÁN HSWRMS
## (HSWRMS TARGETED AUDIT CORRECTION & EVIDENCE CONSISTENCY REPORT)

> **Mã báo cáo:** `AUDIT-REP-TARGETED-20261029-01`  
> **Thư mục lưu trữ:** `06_Reports/audit-output/`  
> **Tài liệu nguồn gốc sử dụng:**  
> 1. `01_Planning/Task_Project_G1_IS2005.xlsx` (Trang *Đánh giá thành viên* & *Official Plan*)  
> 2. `06_Reports/PHASE_5.8.3.117-5.8.3.118_FULL_TEAM_MERGE_HISTORY.txt`  
> **Thời điểm lập:** 29/10/2026 (ISP392 - IS2005 - Nhóm 1)

---

## 1. MỤC TIÊU VÀ PHẠM VI HIỆU CHỈNH

Báo cáo này ghi nhận kết quả thực hiện đợt **Hiệu chỉnh mục tiêu (Targeted Audit Correction)** nhằm xử lý dứt điểm các điểm bất đồng dữ liệu và gia cố tính nhất quán bằng chứng giữa các sản phẩm bàn giao kiểm toán thuộc thư mục `06_Reports/audit-output/`.

Quá trình hiệu chỉnh tuân thủ tuyệt đối các ràng buộc an toàn:
- Không sửa đổi mã nguồn ứng dụng Backend, Frontend, tệp di chuyển dữ liệu (migrations) hay nội dung CSDL.
- Không kết nối tới máy chủ SQL Server hay chạy lại các bộ kiểm thử ứng dụng.
- Bảo toàn nguyên vẹn tất cả các tệp kế hoạch gốc, nhật ký merge và tệp chưa theo dõi (untracked files).
- Đã tạo bản sao lưu an toàn (`backup_targeted_correction_20261029`) trước khi cập nhật bất kỳ tạo phẩm kiểm toán nào.

---

## 2. KẾT QUẢ HIỆU CHỈNH THEO TỪNG HẠNG MỤC

### 2.1 Bảng tính đánh giá & Công thức tính điểm thành viên (Scoring Workbook)

1. **Vấn đề phát hiện trước hiệu chỉnh:**
   - Phiên bản trước tính điểm thành viên thông qua 4 nhóm tiêu chí trung gian có làm tròn, dẫn đến độ lệch nhỏ so với việc tính trực tiếp từ 11 tiêu chí Rubric.
   - Khi đọc bằng công cụ tự động `openpyxl(data_only=True)`, các ô công thức chưa mở qua phần mềm bảng tính trả về giá trị `None`.

2. **Giải pháp & Kết quả hiệu chỉnh:**
   - **Tính toán trực tiếp 100%:** Điểm tổng kết của cả 6 sinh viên được tính trực tiếp từ 11 tiêu chí đánh giá năng lực (TC-01 đến TC-11) và trọng số chuẩn hóa tổng 100.0% bằng công thức:  
     `=SUMPRODUCT(Scoring_Rubric!$C$2:$C$12, Scoring_Rubric!{col}2:Scoring_Rubric!{col}12)`
   - **Quy tắc làm tròn:** Làm tròn số học chuẩn 2 chữ số thập phân (`round(score, 2)`).
   - **Bảng điểm chuẩn hóa đồng bộ 100%:**
     - **Nguyễn Tất Đạt (M3 + Lead):** 9.8400 $\rightarrow$ **9.84** (*Xuất sắc*)
     - **Vũ Phương Thảo (M4 - F&B):** 9.2350 $\rightarrow$ **9.24** (*Xuất sắc*)
     - **Lê Đức Hoàng (M1 - Identity):** 9.1650 $\rightarrow$ **9.17** (*Xuất sắc*)
     - **Tăng Xuân Hòa (M5 - Billing):** 9.0900 $\rightarrow$ **9.09** (*Xuất sắc*)
     - **Phạm Thành Vinh (M6 - Admin):** 8.9400 $\rightarrow$ **8.94** (*Giỏi*)
     - **Nguyễn Gia Đạt (M2 - Booking):** 8.8550 $\rightarrow$ **8.86** (*Giỏi*)
     - **Điểm trung bình nhóm (6 SV):** 9.1875 $\rightarrow$ **9.19** (*Xuất sắc*)
   - **Đồng bộ hóa toàn bộ báo cáo:** Điểm số trên đã được cập nhật thống nhất trên toàn bộ workbook Excel `HSWRMS_DANH_GIA_DONG_GOP_THANH_VIEN_RECONCILED.xlsx`, báo cáo kỹ thuật `HSWRMS_BAO_CAO_TONG_KET_DU_AN_RECONCILED.md` và tin nhắn Zalo `TIN_NHAN_ZALO_TONG_KET_HSWRMS_REVISED.md`.
   - **Minh bạch hóa công thức:** Đã ghi chú rõ ràng tại sheet `Read_Me`: Khi mở bằng Microsoft Excel, LibreOffice Calc hoặc Google Sheets, công cụ bảng tính sẽ tự động tính toán và hiển thị kết quả; nếu đọc trực tiếp qua thư viện python trước khi mở tệp thì ô công thức chưa cache giá trị hiển thị.

---

### 2.2 Bằng chứng kiểm thử & Đối soát tổng 536 bài (Test Evidence)

1. **Vấn đề phát hiện trước hiệu chỉnh:**
   - Báo cáo lịch sử Phase 5.8.3.118 ghi nhận tổng số: `536 tests run; 526 passed, 0 failures, 0 errors, 10 skipped`.
   - Tuy nhiên, tổng số bài test pass của các hàng phân hệ chi tiết (M1: 77, M2: 34, M3: 24, M4: 42, M5: 48, M6: 49, Shared: 242) chỉ đạt **516 bài pass**, để lại khoảng chênh lệch 10 bài so với con số tổng thể 526 bài pass.

2. **Giải pháp & Kết quả hiệu chỉnh:**
   - **Bảo toàn số liệu lịch sử gốc:** Giữ nguyên số liệu tổng thể được ghi nhận trong nhật ký build Phase 118: 536 bài, 526 passed, 0 failures, 0 errors, 10 skipped.
   - **Không tự tạo số liệu (No Fabricated Tests):** Kiểm tra tệp nguồn `PHASE_5.8.3.117-5.8.3.118_FULL_TEAM_MERGE_HISTORY.txt` cho thấy Mục 8.2 chỉ liệt kê danh sách mẫu các test suite chính (196 bài test), không có bảng kê chi tiết toàn bộ 536 bài test. Do đó, không thể xác định chính xác 10 bài test pass còn thiếu thuộc về phân hệ nào nếu chỉ dựa vào văn bản nguồn được cung cấp.
   - **Ghi nhận trạng thái chưa giải quyết (UNRESOLVED):** Trong [05_Test_Evidence_Reconciliation.csv](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/audit-output/05_Test_Evidence_Reconciliation.csv) và [06_Test_Evidence_RECONCILED.csv](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/audit-output/06_Test_Evidence_RECONCILED.csv), hàng chênh lệch này được phân loại chính xác là:  
     `Audit_Verification_Status = UNRESOLVED_BREAKDOWN_VARIANCE`  
     để minh bạch hóa khoảng chênh lệch kỹ thuật thay vì tự ý cộng thêm 10 bài test vào hạ tầng hay module.
   - **Phân định rõ loại hình bằng chứng:** Tách bạch hoàn toàn giữa kết quả kiểm thử lịch sử được báo cáo trong log (`REPORTED_FROM_PHASE_118_LOGS`) và việc kiểm toán không thực thi lại bất kỳ bài test nào trong đợt đối soát này.

---

### 2.3 Đối soát WBS: 180 Tác vụ nghiệp vụ vs 181 Dòng Excel (WBS Reconciliation)

1. **Vấn đề phát hiện trước hiệu chỉnh:**
   - Tệp kế hoạch `Task_Project_G1_IS2005.xlsx` sheet `Official Plan` được cho là có 180 tác vụ WBS, trong khi bảng đối soát `01_Task_Assignment_Reconciliation.csv` có 181 dòng.

2. **Giải pháp & Kết quả hiệu chỉnh:**
   - **Định danh chính xác dòng thừa:** Quá trình quét từng ô trong Excel phát hiện:
     - Dòng 4 đến dòng 183 chứa chính xác **180 tác vụ WBS nghiệp vụ và cột mốc** (từ WBS 1 "Project Initiating" đến WBS 10.5 "Final Project Review").
     - Dòng 184 là dòng trống.
     - Dòng 185 chứa thông tin: `Cột A = NOTE`, `Cột B = "Thực tế 11/11 là buổi học cuối của môn trước khi lên hội đồng"`. Đây là dòng ghi chú hành chính của nhóm về thời hạn học tập, không phải tác vụ WBS chức năng.
   - **Giữ nguyên không xóa bỏ:** Giữ nguyên dòng 185 trong [01_Task_Assignment_Reconciliation.csv](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/audit-output/01_Task_Assignment_Reconciliation.csv) với phân loại rõ ràng:
     - `WBS_ID = NOTE (Footnote)`
     - `Reconciliation_Relationship = PLANNING_FOOTNOTE`
     - `Evidence_Based_Completion_Assessment = NOT_ASSESSABLE`
     - `Audit_Conclusion = "Planning footnote in Official Plan row 185; not a functional WBS task. Explains the 180 functional WBS tasks (rows 4-183) vs 181 populated Excel rows."`
   - **Tách biệt quan hệ đối soát và hoàn thành tác vụ:**
     - Cột `Reconciliation_Relationship` (`MATCHED`, `PARTIAL_MATCH`, `UNASSIGNED`, `PLANNING_FOOTNOTE`) thể hiện việc tìm thấy mối liên hệ với bằng chứng mã nguồn/Git.
     - Cột `Evidence_Based_Completion_Assessment` thể hiện đánh giá mức độ hoàn thành dựa trên kiểm thử thực tế (`COMPLETED_VERIFIED`, `PARTIALLY_VERIFIED`, `NOT_VERIFIED`, `NOT_ASSESSABLE`).
     - Giữ nguyên 100% giá trị gốc của cột `Planning_Status` (`Done`, `Doing`, `Late`, `To do`, `NO_STATUS`).

---

### 2.4 Cập nhật Sổ theo dõi điều chỉnh (Correction Log)

Toàn bộ các nội dung hiệu chỉnh trên đã được lưu vết chi tiết trong [Correction_Log.csv](file:///E:/FU_Learning/5.Spring2025_Semester5/ISP392_Ver2/HSWRMS-audit-all-modules/06_Reports/audit-output/Correction_Log.csv) gồm 14 bản ghi thay đổi từ `CHG-COR-001` đến `CHG-COR-010`.

---

## 3. DANH MỤC CÁC TỆP ĐÃ ĐƯỢC CẬP NHẬT (CORRECTED ARTIFACTS)

1. `06_Reports/audit-output/HSWRMS_DANH_GIA_DONG_GOP_THANH_VIEN_RECONCILED.xlsx`
2. `06_Reports/audit-output/01_Task_Assignment_Reconciliation.csv`
3. `06_Reports/audit-output/05_Test_Evidence_Reconciliation.csv`
4. `06_Reports/audit-output/06_Test_Evidence_RECONCILED.csv`
5. `06_Reports/audit-output/Correction_Log.csv`
6. `06_Reports/audit-output/HSWRMS_BAO_CAO_TONG_KET_DU_AN_RECONCILED.md`
7. `06_Reports/audit-output/TIN_NHAN_ZALO_TONG_KET_HSWRMS_REVISED.md`
8. `06_Reports/audit-output/HSWRMS_BAO_CAO_GIA_CO_BANG_CHUNG_VA_DIEU_CHINH_MUC_TIEU.md` (Báo cáo này)

---

## 4. DANH MỤC CÁC HẠNG MỤC CHƯA GIẢI QUYẾT (UNRESOLVED ITEMS)

1. **Phân rã kiểm thử chi tiết (10 bài test pass chênh lệch):**
   - Khoảng chênh lệch 10 bài test pass giữa chi tiết các phân hệ (516 bài pass) và tổng thể toàn bộ suite báo cáo tại Phase 118 (526 bài pass) được đánh nhãn chính thức là `UNRESOLVED_BREAKDOWN_VARIANCE`. Để giải quyết triệt để, cần trích xuất trực tiếp các tệp báo cáo XML của Maven Surefire (`target/surefire-reports/*.xml`).
2. **8 Khoảng trống kỹ thuật Staging (`GAP-01` đến `GAP-08`):**
   - Các luồng runtime mạng ngoài (VNPay IPN webhook, Google/Facebook OAuth2 thật, SMTP mail SendGrid thật) tiếp tục giữ nguyên trạng thái `OPEN` cho đến khi được kiểm thử trên môi trường staging có cấu hình bí mật.

---

## 5. KẾT QUẢ KIỂM TRA CHẤT LƯỢNG CUỐI CÙNG (FINAL QUALITY GATES)

| Cổng kiểm tra chất lượng | Tiêu chí yêu cầu | Kết quả thực tế | Đánh giá |
|:---|:---|:---|:---:|
| **Gate 1: Tính bất biến nguồn gốc** | 18 tệp nguồn kiểm toán và kế hoạch gốc không bị sửa đổi | Mã băm SHA-256 đối soát trùng khớp 100% | **ĐẠT (PASS)** |
| **Gate 2: An toàn mã nguồn & CSDL** | Không sửa code backend/frontend, không chạm CSDL | 0 dòng code bị sửa; 0 lệnh DDL/DML được chạy | **ĐẠT (PASS)** |
| **Gate 3: Sao lưu an toàn** | Tạo bản backup trước khi sửa tạo phẩm kiểm toán | Đã sao lưu 7 tệp vào `backup_targeted_correction_20261029` | **ĐẠT (PASS)** |
| **Gate 4: Đồng bộ điểm số 100%** | Điểm số 6 sinh viên trùng khớp trên tất cả báo cáo | Hoàng: 9.17, G.Đạt: 8.86, T.Đạt: 9.84, Thảo: 9.24, Hòa: 9.09, Vinh: 8.94 (TB: 9.19) | **ĐẠT (PASS)** |
| **Gate 5: Phân định 180 vs 181 WBS** | Giải trình chính xác dòng thừa và giữ nguyên footnote | Dòng 185 xác định là `NOTE` (Footnote); phân tách rõ đánh giá hoàn thành | **ĐẠT (PASS)** |
| **Gate 6: Minh bạch kiểm thử** | Không tự tạo số liệu; ghi rõ độ lệch 10 bài test | Ghi nhận `UNRESOLVED_BREAKDOWN_VARIANCE` | **ĐẠT (PASS)** |

