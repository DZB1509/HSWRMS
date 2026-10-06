# ADR-001 — Lựa chọn Mô hình Kiến trúc MVC (Model-View-Controller) cho Hệ thống HSWRMS

**Status:** `Accepted`  
**Date:** 2026-09-30  
**Deciders:** Solution Architect, Tech Lead, Senior BA, Compliance & Security Lead  
**Context tags:** #architecture #mvc #separation-of-concerns #hswrms #traceability #case2.0  
**US References:** `US-REC-001`, `US-REC-002`, `UC01`, `UC02`, `UC07`, `UC08` ⭐ *CASE 2.0*  
**BR References:** `BR-01`, `BR-03`, `BR-05`, `BR-08` ⭐ *CASE 2.0*  

---

## Context — Bối cảnh

Dự án **HeavenStay Wellness Resort Management System (HSWRMS)** đòi hỏi xây dựng một hệ thống quản lý nghỉ dưỡng cao cấp kết hợp trị liệu sức khỏe. Hệ thống cần xử lý đồng thời nhiều phân hệ phức tạp:
1. **Quản lý Đặt phòng & Gói nghỉ dưỡng (Retreat Packages & Villa Booking):** Xử lý đặt phòng, khóa tài nguyên theo thời gian thực (tránh trùng lịch Villa/Spa).
2. **Quản lý Hồ sơ Sức khỏe & Chế độ Ăn uống Nhạy cảm (Guest Health Profile):** Lưu trữ thông tin dị ứng, bệnh lý, chế độ ăn uống — đây là dữ liệu thông tin cá nhân nhạy cảm (PII) tuân thủ Nghị định 356/2025/NĐ-CP.
3. **Thanh toán & Đặt cọc trực tuyến:** Tích hợp cổng thanh toán VNPay và gộp hóa đơn (Folio Billing).
4. **Phân quyền người dùng & Kiểm vết:** Nhiều nhóm người dùng khác nhau (Khách hàng, Lễ tân, Chuyên gia Spa, Đầu bếp, Quản lý, Admin).

**Ràng buộc kỹ thuật & Đội ngũ:**
- Đội ngũ phát triển bao gồm thành viên thuộc môn học ISP392 có mức độ kinh nghiệm khác nhau, trong đó có người quản lý/BA không chuyên sâu về viết code trực tiếp.
- Cần một mô hình kiến trúc chuẩn hóa, dễ hiểu, có khả năng **"Truy vết Code" (Code Traceability)** trực tiếp từ Yêu cầu Nghiệp vụ (SRS/BR) -> Sơ đồ CSDL (ERD/Data Dictionary) -> Tầng Code hiện thực.
- Cần tránh tình trạng "Spaghetti Code" (viết chung mã truy vấn SQL, logic nghiệp vụ và giao diện hiển thị vào cùng một file).

---

## Options Considered — Các lựa chọn đã xem xét

| Option | Mô tả | Pros (Ưu điểm) | Cons (Nhược điểm) |
|--------|-------|----------------|-------------------|
| **Option A: Page-centric / Script Monolith** (JSP/PHP gộp SQL + HTML) | Viết toàn bộ mã xử lý SQL, điều hướng và giao diện HTML trong cùng file JSP/Servlet. | - Dễ viết ban đầu đối với bài tập đơn giản.<br>- Cấu trúc thư mục ít file. | - Trực tiếp vi phạm nguyên tắc Tách biệt Trách nhiệm (Separation of Concerns).<br>- Rất khó kiểm thử (Unit Test).<br>- Rò rỉ dữ liệu nhạy cảm PII ra ngoài giao diện.<br>- Không thể làm "Code Truy Vết". |
| **Option B: MVC Pattern (Model-View-Controller)** *(Được chọn)* | Phân tách hệ thống thành 3 tầng rõ ràng:<br>1. **Model:** Độc lập dữ liệu & logic nghiệp vụ (DAO/Entity).<br>2. **View:** Giao diện hiển thị (JSP/HTML/CSS).<br>3. **Controller:** Bộ điều phối tiếp nhận yêu cầu & điều hướng. | - Tách biệt rõ ràng trách nhiệm từng phần.<br>- Dễ dàng gắn các mã nhãn truy vết (`// [TRACEABILITY]: US-xxx / BR-xxx`).<br>- Giúp người không chuyên code cũng hiểu được luồng dữ liệu.<br>- Dễ bảo trì, mở rộng và kiểm thử độc lập. | - Đòi hỏi tuân thủ đúng quy chuẩn tổ chức thư mục và luồng gọi.<br>- Tăng số lượng file source mã nguồn. |
| **Option C: Pure Microservices Architecture** | Chia nhỏ hệ thống thành 6-8 Microservices riêng biệt trao đổi qua REST API / Event Bus. | - Khả năng mở rộng độc lập cho từng service.<br>- Công nghệ đa dạng. | - Độ phức tạp triển khai và vận hành cực kỳ cao.<br>- Quá tải với quy mô dự án ISP392.<br>- Phức tạp hóa việc kiểm soát giao dịch thanh toán và khóa tài nguyên đồng thời (Distributed Transactions). |

---

## Decision — Quyết định

**Chúng ta chọn Option B: Mô hình Kiến trúc MVC Pattern (Model-View-Controller).**

Toàn bộ hệ thống HSWRMS sẽ được xây dựng theo chuẩn kiến trúc MVC kết hợp với kỹ thuật **Code Truy Vết (Traceable Code)** để đảm bảo tính minh bạch, dễ kiểm soát từ mức Yêu cầu (Requirements) đến Triển khai (Implementation).

---

## Rationale — Lý do

1. **Phân tách trách nhiệm rõ ràng (Separation of Concerns):**
   - **Model:** Chịu trách nhiệm tương tác với cơ sở dữ liệu MySQL (dựa trên bảng `ACCOUNT`, `GUEST_HEALTH_PROFILE`, `RETREAT_PACKAGE`, `BOOKING` trong Data Dictionary).
   - **View:** Chỉ chịu trách nhiệm hiển thị giao diện UI, không trực tiếp viết câu lệnh `SELECT/INSERT/UPDATE` SQL.
   - **Controller:** Đóng vai trò "người điều phối", tiếp nhận HTTP Request từ View, gọi Model xử lý, và trả kết quả hiển thị lại cho View.

2. **Hỗ trợ tối đa cho người không chuyên về Code (Non-coder Traceability):**
   - Kiến trúc MVC cho phép áp dụng bộ quy chuẩn **Code Truy Vết**. Khi một người quản lý hoặc BA đọc file Controller hay Model, họ có thể nhìn thấy ngay ghi chú:
     `// [TRACEABILITY]: [US-REC-001] -> [Bảng GUEST_HEALTH_PROFILE] -> [Nghị định 356 PII Consent]`
   - Điều này giúp kiểm soát chính xác code đã làm đúng và đủ theo tài liệu BR/SRS hay chưa mà không cần đọc hiểu sâu cú pháp ngôn ngữ lập trình.

3. **Phù hợp với phạm vi môn học ISP392 và CASE 2.0:**
   - MVC là chuẩn mực kiến trúc được kiểm chứng, tối ưu cho việc làm việc nhóm, phân chia công việc giữa Web Frontend (View) và Backend Developer (Controller/Model).

---

## Consequences — Hệ quả

**Positive (Mặt tích cực):**
- Giảm 80% nguy cơ rò rỉ mã truy vấn CSDL và thông tin nhạy cảm PII trên giao diện người dùng.
- Giúp team QA và BA dễ dàng đối soát tính đầy đủ của tính năng thông qua Ma trận truy vết (RTM).
- Code được tổ chức ngăn nắp, dễ đọc, dễ tìm lỗi khi xảy ra sự cố vận hành.

**Negative (trade-offs accepted):**
- Số lượng file trong dự án tăng lên (mỗi chức năng cần tối thiểu 1 Model/DAO, 1 Controller, và 1 View JSP).
- Đòi hỏi các lập trình viên phải tuân thủ nghiêm ngặt Quy chuẩn Lập trình (`CODING_CONVENTIONS_MVC.md`), không được "lách luật" gọi SQL từ View.

**Risks:**
- Thành viên mới có thể vô tình đưa logic nghiệp vụ vào Controller thay vì Model/Service Layer.  
  *Biện pháp giảm thiểu:* Thực thi Quy chuẩn Code Truy vết và tự động hóa kiểm tra PR (Pull Request Code Review).

**Compliance Impact:** ⭐ *CASE 2.0*
- **Tuân thủ Nghị định 356/2025/NĐ-CP & Luật An toàn Thông tin:** Kiến trúc MVC cách ly hoàn toàn tầng dữ liệu PII (`GUEST_HEALTH_PROFILE`). Việc mã hóa AES-256 dữ liệu sức khỏe và ghi log truy cập (`AUDIT_LOG`) được thực hiện tập trung tại tầng Model/Service trước khi trả dữ liệu tối thiểu hóa (Data Minimization) về cho View.

**Decisions unlocked (ADR tiếp theo có thể viết):**
- **ADR-002:** Lựa chọn Service & DAO/Repository Pattern cho Tầng Model.
- **ADR-003:** Cơ chế Mã hóa Dữ liệu Sức khỏe Cá nhân Nhạy cảm (PII Encryption at Rest).

---

## §AI Prompt Constraint ⭐ CASE 2.0 — BẮT BUỘC

> **Đóng góp cốt lõi của CASE 2.0.** Đoạn text dưới đây sẽ được **inject trực tiếp** vào AI prompt khi implement tại Phase 5.
> Mỗi constraint phải **specific** và **actionable** — không generic.
> ADR thiếu section này = ADR chưa hoàn chỉnh theo CASE 2.0.

```text
Theo ADR-001:
1. PHẢI tuân thủ nghiêm ngặt mô hình 3 tầng MVC (Model - View - Controller). Không được phép viết mã SQL query hoặc logic nghiệp vụ trực tiếp bên trong file giao diện View (JSP/HTML).
2. KHÔNG ĐƯỢC bỏ qua nhãn chú thích Code Truy Vết (Traceability Annotations). Mọi class/method trong Controller và Model PHẢI chứa comment định danh: `// [TRACEABILITY]: [Requirement_ID] -> [Database_Table] -> [Business_Rule]`.
3. PHẢI sử dụng Servlet/Controller làm điểm tiếp nhận duy nhất cho các yêu cầu HTTP từ client; Controller chịu trách nhiệm validate dữ liệu đầu vào, kiểm tra quyền truy cập (RBAC), sau đó mới chuyển giao cho Model.
4. Identity và Authentication PHẢI được trích xuất từ HttpSession / SecurityContext tại tầng Controller, KHÔNG lấy trực tiếp từ tham số URL hoặc Client Form để tránh nguy cơ giả mạo định danh (Privilege Escalation).
5. Tầng Model (DAO/Service) chịu trách nhiệm toàn bộ về tính toàn vẹn dữ liệu, giao dịch CSDL (Transaction Management), mã hóa PII (`GUEST_HEALTH_PROFILE`) và ghi vết hệ thống (`AUDIT_LOG`).
```

---
*Template version 2.0 — PrivacyOps Architecture Team — Tích hợp CASE 2.0*  
*Section đánh dấu ⭐ là bổ sung mới từ CASE 2.0 methodology.*
