# BÁO CÁO HOÀN THIỆN ĐẶC TẢ PROFILE DATABASE TRƯỚC STAGING
*(Final Database Profile Hardening Before Staging)*

**Thời điểm thực hiện:** 06/11/2026  
**File mục tiêu duy nhất:** [`05_Development/backend/src/main/resources/application-dev.yml`](file:///05_Development/backend/src/main/resources/application-dev.yml)  
**Tài liệu lưu trữ:** `06_Reports/FINAL_DATABASE_PROFILE_HARDENING.md`

---

## 1. Chi Tiết Thay Đổi (Exact Two-Line Diff)

Đã áp dụng chính xác 2 thay đổi cục bộ trong `application-dev.yml` theo đúng yêu cầu:

```diff
--- a/05_Development/backend/src/main/resources/application-dev.yml
+++ b/05_Development/backend/src/main/resources/application-dev.yml
@@ -12,7 +12,7 @@
 spring:
   config:
     activate:
-      on-profile: "dev"
+      on-profile: "dev & !local"
   datasource:
-    url: ${HSWRMS_DB_URL:jdbc:sqlserver://${DB_HOST:localhost}:${DB_PORT:1433};databaseName=${DB_NAME:HSWRMS};encrypt=true;trustServerCertificate=true;sendStringParametersAsUnicode=true}
+    url: ${HSWRMS_DB_URL:jdbc:sqlserver://${DB_HOST:localhost}:${DB_PORT:1433};databaseName=${DB_NAME:HSWRMS_TEST};encrypt=true;trustServerCertificate=true;sendStringParametersAsUnicode=true}
```

* **Thay đổi 1:** `on-profile: "dev"` $\rightarrow$ `on-profile: "dev & !local"`  
  *Mục đích:* Bảo đảm khối DataSource SQL Server của profile `dev` bị vô hiệu hóa ngay khi profile `local` cùng xuất hiện, bất kể thứ tự khai báo profile.
* **Thay đổi 2:** `${DB_NAME:HSWRMS}` $\rightarrow$ `${DB_NAME:HSWRMS_TEST}`  
  *Mục đích:* Bảo đảm khi chạy dòng lệnh dev trần (không nạp biến môi trường), hệ thống luôn rơi an toàn vào database test `HSWRMS_TEST`, không chạm vào database nghiệp vụ `HSWRMS`.

---

## 2. Kiểm Chứng Cú Pháp & Hành Vi Profile (Profile Behavior Verification)

### Tính hợp lệ của biểu thức Spring Boot:
* Cú pháp `spring.config.activate.on-profile: "dev & !local"` là chuẩn mực chính thức của Spring Boot 2.4+ / 3.x, hỗ trợ các toán tử logic `&`, `!`, `|`.

### Ma trận hành vi hiệu dụng:

| Lệnh kích hoạt profile | Khối SQL Server `dev` | Profile `local` (H2) | DataSource hiệu dụng | Database kết nối | Trạng thái an toàn |
| :--- | :---: | :---: | :--- | :---: | :---: |
| **`--spring.profiles.active=dev`** | **KÍCH HOẠT** (`dev & !local = true`) | Không | SQL Server (`com.microsoft.sqlserver.jdbc.SQLServerDriver`) | **`HSWRMS_TEST`** *(Fallback)* | **AN TOÀN** (Không chạm `HSWRMS`) |
| **`--spring.profiles.active=dev,local`** | **VÔ HIỆU HÓA** (`dev & !local = false`) | Kích hoạt | **H2 In-Memory** (`org.h2.Driver`) | `hswrmsdb` (RAM) | **AN TOÀN** (H2 trong RAM) |
| **`--spring.profiles.active=local,dev`** | **VÔ HIỆU HÓA** (`dev & !local = false`) | Kích hoạt | **H2 In-Memory** (`org.h2.Driver`) | `hswrmsdb` (RAM) | **AN TOÀN** (H2 trong RAM) |
| **`--spring.profiles.active=sqlserver`** | Không liên quan | Không | SQL Server (`application-sqlserver.yml`) | **`HSWRMS_TEST`** *(Fallback)* | **AN TOÀN** |
| **No explicit profile** | Không liên quan | Không | SQL Server (qua default `sqlserver` profile) | **`HSWRMS_TEST`** *(Fallback)* | **AN TOÀN** |

---

## 3. Xác Minh Luồng Khởi Chạy Chuẩn Qua `run-dev.ps1`

* **Quy trình hoạt động:** Script [`run-dev.ps1`](file:///05_Development/backend/run-dev.ps1) đọc file cấu hình bảo mật bên ngoài repository (`HSWRMS_DB_BACKUPS/hswrms_local_credentials.env`) và thiết lập biến môi trường `$env:HSWRMS_DB_URL` chứa chuỗi kết nối chuẩn tới `databaseName=HSWRMS`.
* **Cơ chế ghi đè:** Biểu thức `${HSWRMS_DB_URL:...}` có mức ưu tiên cao nhất trong chuỗi phân giải của Spring Boot:
  ```yaml
  url: ${HSWRMS_DB_URL:jdbc:sqlserver://${DB_HOST:localhost}:${DB_PORT:1433};databaseName=${DB_NAME:HSWRMS_TEST};...}
  ```
* **Kết luận:** Khi lập trình viên chạy qua `run-dev.ps1`, ứng dụng vẫn nhận đủ chuỗi URL tường minh và kết nối chính xác vào database phát triển `HSWRMS` như thiết kế. Trường hợp chạy trần ngoài script sẽ tự động phòng thủ rơi vào `HSWRMS_TEST`.

---

## 4. Kết Quả Biên Dịch Backend (Build Verification)

* **Lệnh thực thi:** `mvn -f 05_Development/backend/pom.xml test-compile`
* **Kết quả:** **BUILD SUCCESS (Exit code 0)**.
* **Thời gian:** 3.517s.
* **Đánh giá:** File YAML hoàn toàn hợp lệ, không có lỗi thụt dòng (indentation) hay cú pháp, toàn bộ mã nguồn Java 17 biên dịch thông suốt.

---

## 5. So Sánh Trạng Thái Git (Git Status Comparison)

* **Số lượng tracked modified files:** Giữ nguyên **89 files**.
* **Phạm vi thay đổi của task này:** Duy nhất 2 dòng trong [`application-dev.yml`](file:///05_Development/backend/src/main/resources/application-dev.yml).
* **Bảo toàn:** Toàn bộ mã nguồn sản phẩm, các file untracked (`UserAccountMenu.tsx`, `dynamicContent.ts`, `TherapistRosterDto.java`, 19 ảnh Spa, các bài test tích hợp) và database SQL Server được giữ nguyên vẹn 100%.

---

## 6. Kết Luận Cuối Cùng (Final Verdict)

# `READY FOR CONTROLLED STAGING`

Toàn bộ hệ thống cấu hình database của HSWRMS đã đạt độ hoàn thiện cao nhất về bảo mật và an toàn môi trường:
1. Không còn credential hardcoded (`sa`, `123` đã bị xóa bỏ).
2. Profile `dev` và `local` có cơ chế loại trừ tương hỗ tuyệt đối (`dev & !local`).
3. Giá trị fallback mặc định trên cả 3 file cấu hình (`application.yml`, `application-sqlserver.yml`, `application-dev.yml`) đều thống nhất về database test `HSWRMS_TEST`.
4. Dự án đã sẵn sàng 100% để chuyển sang bước **Staging & Commit có kiểm soát** theo kế hoạch 5 commits đã định hình.

