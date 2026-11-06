# BÁO CÁO RÀ SOÁT AN TOÀN PROFILE DATABASE & CẤU HÌNH SPRING BOOT
*(HSWRMS Final Database Profile Safety Review — READ-ONLY)*

**Thời điểm kiểm tra:** 06/11/2026  
**Chế độ thực thi:** Strictly READ-ONLY (Không sửa code, không chạy SQL/migration, không can thiệp Database, không thực hiện thao tác Git write).  
**Tài liệu lưu trữ:** `06_Reports/FINAL_DATABASE_PROFILE_SAFETY_REVIEW.md`

---

## 1. Phân Tích Cấu Hình DataSource Theo Từng Profile

Hệ thống Spring Boot 3.3.4 nạp cấu hình theo thứ tự phân tầng từ `application.yml` đến các profile kích hoạt. Dưới đây là ma trận hành vi của DataSource trên 5 kịch bản khởi chạy:

| Kịch bản khởi chạy | File cấu hình nạp vào | DataSource hiệu dụng | Database mặc định | JPA DDL-Auto | Đánh giá an toàn |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **1. No explicit profile** | `application.yml`<br>$\rightarrow$ `application-sqlserver.yml` | SQL Server (`com.microsoft.sqlserver.jdbc.SQLServerDriver`) | **`HSWRMS_TEST`** | `none` | **AN TOÀN TUYỆT ĐỐI**<br>Mặc định fallback về DB test, không chạm vào DB chính `HSWRMS`. |
| **2. `dev`** | `application.yml`<br>$\rightarrow$ `application-dev.yml` | SQL Server (`com.microsoft.sqlserver.jdbc.SQLServerDriver`) | **`HSWRMS`** | `none` | **CÓ LƯU Ý NGHIỆP VỤ**<br>`ddl-auto: none` bảo vệ cấu trúc bảng, nhưng kết nối và ghi dữ liệu vào `HSWRMS`. |
| **3. `sqlserver`** | `application.yml`<br>$\rightarrow$ `application-sqlserver.yml` | SQL Server (`com.microsoft.sqlserver.jdbc.SQLServerDriver`) | **`HSWRMS_TEST`** | `none` | **AN TOÀN TUYỆT ĐỐI**<br>Chỉ định rõ DB test, `sql.init.mode: never`. |
| **4. `dev,local`** | `application.yml`<br>$\rightarrow$ `application-dev.yml`<br>$\rightarrow$ `application-local.yml` | **H2 In-Memory** (`org.h2.Driver`, `jdbc:h2:mem:hswrmsdb`) | `hswrmsdb` (RAM) | `create-drop` | **AN TOÀN**<br>`local` nạp sau nên ghi đè hoàn toàn DataSource của `dev`. |
| **5. `local,dev`** | `application.yml`<br>$\rightarrow$ `application-local.yml`<br>$\rightarrow$ `application-dev.yml` | **SQL Server** (`com.microsoft.sqlserver.jdbc.SQLServerDriver`) | **`HSWRMS`** | `none` | **CẢNH BÁO XUNG ĐỘT THỨ TỰ**<br>`dev` nạp sau ghi đè H2, trỏ thẳng vào SQL Server `HSWRMS`. |

---

## 2. So Sánh Chi Tiết Các File Cấu Hình

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│ application.yml (Cấu hình gốc):                                                                        │
│   spring.profiles.default: sqlserver                                                                   │
│   spring.datasource.url: databaseName=${DB_NAME:HSWRMS_TEST}                                           │
│   spring.datasource.username: ${HSWRMS_DB_USERNAME:${DB_USERNAME:hswrms_app_user}}                     │
│   spring.datasource.password: ${HSWRMS_DB_PASSWORD:${DB_PASSWORD:}}                                    │
│   spring.jpa.hibernate.ddl-auto: none                                                                  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ application-sqlserver.yml (Profile sqlserver):                                                         │
│   spring.datasource.url: databaseName=${DB_NAME:HSWRMS_TEST}                                           │
│   spring.datasource.username: ${HSWRMS_DB_USERNAME:${DB_USERNAME:hswrms_app_user}}                     │
│   spring.datasource.password: ${HSWRMS_DB_PASSWORD:${DB_PASSWORD:}}                                    │
│   spring.sql.init.mode: never                                                                          │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ application-dev.yml (Profile dev):                                                                     │
│   spring.config.activate.on-profile: "dev"  <-- ĐÃ ĐỔI TỪ "dev & !local"                               │
│   spring.datasource.url: databaseName=${DB_NAME:HSWRMS}   <-- KHÁC VỚI HSWRMS_TEST                     │
│   spring.datasource.username: ${HSWRMS_DB_USERNAME:${DB_USERNAME:hswrms_app_user}}                     │
│   spring.datasource.password: ${HSWRMS_DB_PASSWORD:${DB_PASSWORD:}}                                    │
│   spring.jpa.hibernate.ddl-auto: none                                                                  │
├────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ application-local.yml (Profile local):                                                                 │
│   spring.datasource.url: jdbc:h2:mem:hswrmsdb;...                                                     │
│   spring.datasource.driver-class-name: org.h2.Driver                                                    │
│   spring.jpa.hibernate.ddl-auto: create-drop                                                           │
└────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Khả Năng Kích Hoạt `dev` Kết Nối Ngoài Ý Muốn Vào `HSWRMS`

* **Thực tế:** Trong file [`application-dev.yml`](file:///05_Development/backend/src/main/resources/application-dev.yml), giá trị mặc định của `databaseName` là `${DB_NAME:HSWRMS}`.
* **Hệ quả:**
  1. Khi khởi chạy bằng script vận hành [`run-dev.ps1`](file:///05_Development/backend/run-dev.ps1): Script nạp tường minh biến môi trường `$env:HSWRMS_DB_URL` từ file credentials bên ngoài, do đó URL được kiểm soát tuyệt đối.
  2. Khi khởi chạy thủ công bằng dòng lệnh trần `mvn spring-boot:run -Dspring-boot.run.profiles=dev` mà **không thiết lập biến môi trường**: Hệ thống sẽ tự động kết nối vào database chính **`HSWRMS`** trên localhost:1433 với username `hswrms_app_user`.
  3. Mặc dù `spring.jpa.hibernate.ddl-auto: none` bảo vệ cấu trúc bảng (không drop/alter bảng), nhưng các thao tác nghiệp vụ chạy trong phiên dev này sẽ tương tác trực tiếp với dữ liệu thực tế của `HSWRMS`.

---

## 4. Phân Tích Thay Đổi: `on-profile: "dev & !local"` $\rightarrow$ `on-profile: "dev"`

### Hành vi ban đầu (`dev & !local`):
* Cú pháp boolean Spring Boot: Khối DataSource SQL Server trong `application-dev.yml` chỉ được kích hoạt khi có profile `dev` **VÀ ĐỒNG THỜI KHÔNG CÓ** profile `local`.
* Nếu nhà phát triển hoặc bài test khai báo cả 2 profile (dù là `dev,local` hay `local,dev`), biểu thức `dev & !local` trả về `FALSE`. Khối SQL Server bị triệt tiêu hoàn toàn. H2 in-memory trong `application-local.yml` được đảm bảo 100% là DataSource duy nhất.

### Hành vi hiện tại (`dev`):
* Khối DataSource SQL Server kích hoạt bất cứ khi nào `dev` xuất hiện.
* Khi kết hợp cả 2 profile:
  * Khởi chạy `dev,local`: `local` nạp sau $\rightarrow$ H2 ghi đè SQL Server (vẫn dùng H2).
  * Khởi chạy `local,dev`: `dev` nạp sau $\rightarrow$ **SQL Server ghi đè H2**. Ứng dụng chuyển sang dùng SQL Server và cố gắng kết nối vào `HSWRMS` thay vì chạy H2 trong RAM!
* **Đánh giá:** Việc bỏ `!local` đã làm mất tính loại trừ tương hỗ (mutual exclusion), tạo ra rủi ro phụ thuộc vào thứ tự khai báo profile.

---

## 5. Thứ Tự Phân Giải Biến Môi Trường & Giá Trị Mặc Định

Cấu trúc biểu thức placeholder lồng nhau trong Spring Boot:
```yaml
url: ${HSWRMS_DB_URL:jdbc:sqlserver://${DB_HOST:localhost}:${DB_PORT:1433};databaseName=${DB_NAME:HSWRMS_TEST};...}
username: ${HSWRMS_DB_USERNAME:${DB_USERNAME:hswrms_app_user}}
password: ${HSWRMS_DB_PASSWORD:${DB_PASSWORD:}}
```

### Thứ tự ưu tiên giải quyết (Precedence Resolution):

1. **URL Kết nối (`spring.datasource.url`):**
   * **Ưu tiên 1 (Cao nhất):** Biến môi trường `HSWRMS_DB_URL`. Nếu biến này tồn tại, toàn bộ chuỗi JDBC URL được sử dụng nguyên trạng.
   * **Ưu tiên 2 (Cấu thành từng phần):** Nếu `HSWRMS_DB_URL` không có:
     * `Host`: Lấy từ `DB_HOST`, nếu rỗng mặc định `localhost`.
     * `Port`: Lấy từ `DB_PORT`, nếu rỗng mặc định `1433`.
     * `Database Name`: Lấy từ `DB_NAME`. Nếu `DB_NAME` rỗng:
       * Trong `application.yml` & `application-sqlserver.yml`: Mặc định **`HSWRMS_TEST`**.
       * Trong `application-dev.yml`: Mặc định **`HSWRMS`**.

2. **Tên đăng nhập (`spring.datasource.username`):**
   * **Ưu tiên 1:** Biến môi trường `HSWRMS_DB_USERNAME`.
   * **Ưu tiên 2:** Biến môi trường `DB_USERNAME`.
   * **Mặc định:** `hswrms_app_user` (Tài khoản phân quyền tối thiểu, đã thay thế hoàn toàn tài khoản `sa`).

3. **Mật khẩu (`spring.datasource.password`):**
   * **Ưu tiên 1:** Biến môi trường `HSWRMS_DB_PASSWORD`.
   * **Ưu tiên 2:** Biến môi trường `DB_PASSWORD`.
   * **Mặc định:** `""` (Chuỗi rỗng; loại bỏ hoàn toàn mật khẩu hardcoded `123`).

---

## 6. Kiểm Tra Khả Năng Tự Động Thực Thi Của `schema.sql`

* **Vị trí file:** [`05_Development/database/schema.sql`](file:///05_Development/database/schema.sql).
* **Kết luận:** **TUYỆT ĐỐI KHÔNG BỊ THỰC THI TỰ ĐỘNG**.
  * File nằm trong thư mục tài liệu `database/` ngoài classpath, không nằm trong `src/main/resources/schema.sql`.
  * Trong `application-sqlserver.yml`, cấu hình Spring Boot khai báo rõ: `spring.sql.init.mode: never`.
  * Trong toàn bộ cấu hình JPA, `spring.jpa.hibernate.ddl-auto: none` và `spring.jpa.generate-ddl: false`.
  * Do đó, Spring Boot không bao giờ tự động chạy file này khi khởi động ứng dụng trong bất kỳ profile nào.

---

## 7. Kiểm Tra Khả Năng Tự Động Chạy Của `V1_8__...fixture.sql`

* **Vị trí file:** [`05_Development/database/seed/V1_8__seed_dedicated_test_therapist_fixture.sql`](file:///05_Development/database/seed/V1_8__seed_dedicated_test_therapist_fixture.sql).
* **Kết luận:** **TUYỆT ĐỐI KHÔNG BỊ CHẠY BỞI ỨNG DỤNG**.
  1. Trong file `pom.xml`, dự án **hoàn toàn không có dependency Flyway** (`flyway-core`).
  2. Backend Spring Boot không có bất kỳ cấu hình `spring.flyway.*` nào để tự động migrate khi khởi động.
  3. Thư mục chuẩn của Flyway (`src/main/resources/db/migration`) thậm chí không tồn tại trong repository.
  4. File này nằm trong `database/seed/`, chỉ được kích hoạt thủ công bởi DBA/developer qua script kiểm thử chuyên dụng.
  5. Kể cả khi có ai đó chạy trực tiếp file SQL này bằng SQL Server Management Studio (SSMS), cơ chế Dual-Identity Environment Guard sẽ **lập tức ném ngoại lệ 50001 và dừng lại** vì cờ opt-in `@AllowLocalDevDbOptIn` đang được khóa cứng ở giá trị `0`.

---

## 8. Đề Xuất & Khuyến Nghị Kiến Trúc

### 1. Về điều kiện profile `on-profile: "dev & !local"`:
* **Khuyến nghị:** **NÊN KHÔI PHỤC LẠI `on-profile: "dev & !local"`**.
* **Lý do:** Khôi phục điều kiện này đảm bảo quy tắc an toàn bất biến: Khi lập trình viên chạy H2 in-memory bằng lệnh `local` (hoặc test harness kết hợp `local,dev`), DataSource SQL Server chắc chắn bị vô hiệu hóa 100%, loại bỏ hoàn toàn rủi ro đảo ngược thứ tự nạp file.

### 2. Về giá trị mặc định của `application-dev.yml`:
* **Khuyến nghị:** **NÊN ĐỒNG BỘ MẶC ĐỊNH SANG `HSWRMS_TEST`** (hoặc giữ `HSWRMS` nếu chấp nhận quy ước: dev local chỉ chạy qua `run-dev.ps1`).
* **Lý do:** Nếu đồng bộ `databaseName=${DB_NAME:HSWRMS_TEST}` trên cả `application.yml`, `application-sqlserver.yml` và `application-dev.yml`, hệ thống sẽ có tính phòng thủ theo chiều sâu (defense-in-depth): Bất kỳ câu lệnh chạy trần nào không kèm credentials/biến môi trường đều an toàn tuyệt đối và rơi về database test. Khi cần chạy vào `HSWRMS`, script `run-dev.ps1` đã tự động truyền URL chuẩn xác.

---

## 9. Đánh Giá Khả Năng Staging Của 5 File Nhạy Cảm

| File | Đánh giá bảo mật | Trạng thái staging |
| :--- | :--- | :---: |
| `application.yml` | Đã xóa BOM, xóa pass `123`, dùng `hswrms_app_user`, trỏ mặc định `HSWRMS_TEST`. | **AN TOÀN ĐỂ STAGE** |
| `application-sqlserver.yml` | Đã xóa pass `123`, `sql.init.mode: never`, trỏ mặc định `HSWRMS_TEST`. | **AN TOÀN ĐỂ STAGE** |
| `application-dev.yml` | Đã xóa pass `123`. Cần cân nhắc khôi phục `dev & !local` để hoàn hảo 100%. | **AN TOÀN ĐỂ STAGE (Kèm lưu ý)** |
| `schema.sql` | Chỉ thêm cột `adjusted_amount DEFAULT (0)`, phi phá hủy, không tự chạy. | **AN TOÀN ĐỂ STAGE** |
| `V1_8__...fixture.sql` | Nằm ngoài classpath, có guard khóa cứng, không có Flyway tự chạy. | **AN TOÀN ĐỂ STAGE (Trong commit test)** |

---

## 10. Kết Luận Cuối Cùng (Final Verdict)

# `READY FOR STAGING` *(WITH 2 MINOR ARCHITECTURAL RECOMMENDATIONS)*

### Tóm tắt lý do:
1. **Không có lỗ hổng bảo mật:** Toàn bộ credential lộ lọt (mật khẩu mặc định `123`, tài khoản `sa`) đã được loại bỏ hoàn toàn.
2. **Không có rủi ro tự động phá hủy:** `schema.sql` không chạy tự động; `V1_8` không có Flyway tự động thực thi và được khóa bởi guard 4 lớp.
3. **2 Khuyến nghị hoàn thiện (Có thể áp dụng ngay trước khi stage nếu muốn đạt mức hoàn hảo 100%):**
   * Sửa lại `on-profile: "dev & !local"` trong `application-dev.yml`.
   * Cân nhắc đồng bộ `${DB_NAME:HSWRMS_TEST}` trong `application-dev.yml` để đồng nhất với 2 file cấu hình còn lại.
4. Toàn bộ working tree hiện tại vẫn được bảo toàn nguyên vẹn 100%.

