# HSWRMS — M1 Handoff Context

> Mục đích: đưa file này vào chat mới để AI tiếp tục công việc mà không cần người dùng kể lại toàn bộ bối cảnh.
> Trạng thái tại thời điểm bàn giao: **WP1 đang làm dở trên nhánh M1 riêng; chưa commit/push; chưa chạy Maven test; chưa chạy SQL migration**.

## 1. Cách làm việc với người dùng

- Trao đổi bằng tiếng Việt, giọng tự nhiên/thân thiện.
- Hướng dẫn theo từng bước nhỏ; sau mỗi bước quan trọng, đợi người dùng gửi kết quả rồi mới đi tiếp.
- Đừng yêu cầu người dùng dán lại toàn bộ repository hoặc toàn bộ ngữ cảnh này. Dùng lệnh đọc file/trạng thái Git để xác minh khi cần.
- Agent lập trình của người dùng hiện báo hết quota và yêu cầu chờ 7 ngày. Không cần phụ thuộc vào Agent để tiếp tục kiểm tra thủ công.
- Không nói đã commit/push/test/chạy SQL nếu người dùng chưa chạy và gửi kết quả xác minh.

## 2. Repository và nhánh

- Repository local: `C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-work`
- Nhánh làm việc dự kiến: `feature/hoang-m1-integration`
- Nhánh được tạo từ `origin/main`, baseline commit `4b44f3d` (`refactor: restructure HSWRMS development baseline for full-stack implementation`).
- Lần kiểm tra gần nhất: `git fetch origin` đã chạy; `git log --oneline HEAD..origin/main` không trả ra commit nào.
- **Không merge `origin/NTDatZB` vào `main` hoặc nhánh M1.** Đây là nhánh M3 riêng; nhóm trưởng đã dặn M1 và M3 tiếp tục tách riêng.
- Nên xác minh lại bằng `git branch --show-current`, `git status --short` trước khi thay đổi hoặc push.

## 3. Stack và ranh giới kiến trúc đã được nhóm thống nhất

- Frontend: React + TypeScript + Vite.
- Backend: Java + Spring Boot, Spring MVC REST, Spring Data JPA/Hibernate, Spring Security/JWT, Maven.
- Database: Microsoft SQL Server.
- Code chính thức ở `05_Development/`. `04_Implement/Frontend_Prototype/` chỉ là prototype/tham khảo, không phải nguồn code backend chính thức.
- M1 package: `com.heavenstay.hswrms.m1identity`; frontend feature dự kiến `features/m1-identity`; M1 quản lý Auth/Register/JWT, `CustomerProfile`, `HealthProfile`/consent/retention và yêu cầu xóa dữ liệu sức khỏe.
- API prefix thống nhất: `/api/v1/...`; chuẩn response dùng `ResponseEntity<ApiResponse<T>>`.
- Những vùng dùng chung cần hạn chế sửa và phải review kỹ: `backend/.../common/`, `security/`, `config/`; frontend `src/api/`, app/router/layouts, shared components/styles. Thay đổi tối thiểu nếu bắt buộc và nêu rõ ảnh hưởng khi review.

## 4. Quyết định của nhóm trưởng — không tự suy diễn lại

1. Dùng schema chung hiện có; PK/FK giữ `INT`/Java `Integer`, không tự tạo `BIGINT` riêng cho M1.
2. Tách `User`, `CustomerProfile`, `HealthProfile`. DOB, địa chỉ và ngôn ngữ ưu tiên ở `CustomerProfile`. `User.full_name` được giữ tạm để tương thích, không nên coi là nguồn profile lâu dài.
3. Không tạo bảng Allergy/Dietary riêng nếu requirement vẫn giữ các thông tin này trong `HealthProfile`.
4. `schema.sql` là baseline clean install; migrations là script nâng cấp database hiện có; seed đặt riêng trong `database/seed/`. Không tự thêm Flyway chỉ riêng cho M1; cách đánh version migration sẽ thống nhất lúc tích hợp.
5. Chỉ whitelist chính xác endpoint public; tránh `permitAll` wildcard với `/api/v1/auth/**`. Vai trò/tình trạng tài khoản bị khóa hoặc deactivate phải được backend áp dụng từ request kế tiếp, không đợi JWT tự hết hạn. Không xây hệ thống revoke phức tạp vượt scope.
6. OTP/SSO: adapter dev/test tách riêng. Không trả OTP trong header/response API thường và không log OTP ngoài dev. Google/Facebook UI có thể giữ integration boundary; nếu chưa có provider thật thì phải đánh dấu PARTIAL, không phát JWT giả qua callback.
7. Yêu cầu xóa HealthProfile: nếu chưa xác định được trạng thái booking từ M2 thì fail closed, để request `PENDING`/`DEFERRED`; không mặc định “không có booking” rồi xóa dữ liệu.
8. Còn unresolved: `notification_preference` là một chuỗi trong schema nhưng Screen 7 mô tả ba cờ `notifyEmail`, `notifySms`, `notifyWellness`; ERD có các cờ thông báo theo event. Không tự chọn một cách biểu diễn trước khi giải quyết ở WP4.

## 5. Thay đổi và file hiện có

Lần `git status --short` gần nhất cho thấy:

**Tracked modified**
- `02_Requirement/SRS/HSWRMS_ISP392_G1_SRS.docx`
- `02_Requirement/SRS/HSWRMS_ISP392_G1_SRS.pdf`
- `05_Development/database/schema.sql`

**Untracked**
- `03_Design/Diagrams/02_Business_Flows/M1_BusinessFlow.drawio`
- `03_Design/Diagrams/03_Data_Model/M1_ERD.drawio`
- `03_Design/Diagrams/04_Use_Case_Diagrams/M1_UseCase.drawio`
- `03_Design/Diagrams/05_Screen_Flow/M1_ScreenFlow.drawio`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/entity/`
- `05_Development/backend/src/main/java/com/heavenstay/hswrms/m1identity/repository/`
- `05_Development/database/migrations/_draft_m1_identity_health_profile.sql`
- `05_Development/database/seed/_draft_m1_roles_seed.sql`
- `M1_Phase1_Audit.md`
- `M1_Phase2_Plan.md`

Bốn diagram và hai file Audit/Plan được **copy** từ thư mục tài liệu cũ sang repo branch; originals bên thư mục cũ được giữ lại. Những file này chưa được commit tại thời điểm ghi handoff.

### SRS hiện tại

- DOCX mới được copy từ `C:\Users\Admin\Downloads\HSWRMS_ISP392_G1_SRS.docx` vào repo. SHA256 đã đối chiếu trùng nhau: `934D63031EBDDD0C67D2022FDED8D15F28816C4A2A209DB88137E48567999169`.
- PDF trong repo được người dùng xuất thủ công từ DOCX mới qua Word.
- Bản repo DOCX/PDF cũ được backup ngoài repo ở `C:\Users\Admin\Desktop\ISP392\Project\HSWRMS_ISP392_G1_SRS_repo-original.docx` và `C:\Users\Admin\Desktop\ISP392\Project\HSWRMS_ISP392_G1_SRS_repo-original.pdf`.

## 6. WP1 hiện có

Các entity đã được tạo trong `.../m1identity/entity/`:

- `User.java`
- `Role.java`
- `UserRole.java`
- `UserRoleId.java`
- `AuthIdentity.java`
- `CustomerProfile.java`
- `HealthProfile.java`
- `ConsentRecord.java`
- `HealthDataDeletionRequest.java`
- `EmailOtp.java`

Repositories đã tạo: `UserRepository`, `RoleRepository`, `UserRoleRepository`, `AuthIdentityRepository`, `CustomerProfileRepository`, `HealthProfileRepository`, `ConsentRecordRepository`, `HealthDataDeletionRequestRepository`, `EmailOtpRepository`.

Các thay đổi schema/draft migration gồm các field CustomerProfile có cấu trúc, bảng `HealthProfile`, `ConsentRecord`, `HealthDataDeletionRequest`, `EmailOtp` và index; seed draft thêm 6 role theo cách idempotent. Report review trước cho biết PK/FK đang dùng `INT`/`Integer`, `UserRoleId` có `Serializable`/`equals`/`hashCode`, không dùng `CascadeType.REMOVE`/`ALL`, timestamp dùng `Instant`. Những điểm này vẫn cần được xác minh bằng code/test thực tế.

## 7. CẢNH BÁO QUAN TRỌNG — migration OTP chưa an toàn

Lệnh gần nhất của người dùng đọc `_draft_m1_identity_health_profile.sql` cho thấy:

```sql
ELSE IF COL_LENGTH('dbo.EmailOtp', 'otp_code') IS NOT NULL
     AND COL_LENGTH('dbo.EmailOtp', 'otp_hash') IS NULL
BEGIN
    EXEC sp_rename 'dbo.EmailOtp.otp_code', 'otp_hash', 'COLUMN';
    ALTER TABLE dbo.EmailOtp ALTER COLUMN otp_hash VARCHAR(255) NOT NULL;
    PRINT 'Renamed column dbo.EmailOtp.otp_code to otp_hash and resized to VARCHAR(255)';
END
```

**Không được chạy migration này trên database hiện có khi còn đoạn trên. Không được coi rename `otp_code` thành `otp_hash` là mã hóa dữ liệu.** Rename chỉ đổi tên cột; OTP dạng plaintext cũ sẽ vẫn là plaintext nhưng bị hiểu nhầm là hash.

Hướng sửa đã thống nhất trước khi quota Agent hết: nếu bảng hiện hữu có cột legacy `otp_code` mà chưa có `otp_hash`, migration nên **dừng với lỗi rõ ràng trước khi thực hiện các thay đổi tiếp theo**, yêu cầu xử lý/invalidate OTP legacy một cách an toàn; không rename và không tuyên bố đã hash dữ liệu cũ. `schema.sql` cho clean install và entity phải cùng dùng `otp_hash VARCHAR(255)`/`otpHash`. Kiểm tra lại entity `EmailOtp.java` để chắc mapping khớp.

File hiện là draft, chưa được đánh global version, và chưa có SQL nào được xác nhận đã chạy. Không tích hợp/merge cho đến khi review xong.

## 8. Môi trường Java

Người dùng đã cài Eclipse Temurin JDK 17. Lệnh trong PowerShell thành công:

- `java -version` → OpenJDK `17.0.20.1`
- `javac -version` → `17.0.20.1`
- `JAVA_HOME` → `C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot`

Lưu ý: `JAVA_HOME` và `PATH` mới được cấu hình trong **cửa sổ PowerShell hiện tại**, chưa phải biến môi trường vĩnh viễn. Nếu mở terminal mới thì cần cấu hình lại hoặc kiểm tra `java -version`.

Tại thời điểm handoff, **chưa chạy** `mvnw test`, `mvnw package`, test DB hoặc migration. Trước khi Maven, chuyển thư mục về repository root rồi vào `05_Development/backend`.

## 9. Đề xuất trình tự tiếp tục ở chat mới

1. Đọc file handoff này; đừng yêu cầu người dùng kể lại bối cảnh.
2. Chạy `git branch --show-current` và `git status --short` trong repository root để xác nhận trạng thái hiện tại.
3. Nếu người dùng chỉ muốn lưu công việc lên GitLab, commit/push WIP lên `feature/hoang-m1-integration` riêng; không merge vào `main` và không chạy migration SQL. Trước khi commit phải xem `git diff --check` và `git diff --cached --check`.
4. Khi quay lại code: sửa đoạn legacy OTP migration trước; review `EmailOtp.java`, `schema.sql`, draft migration và seed để các mapping nhất quán.
5. Sau khi sửa, chạy kiểm tra Maven từ `05_Development/backend`:
   - Đứng ngay trong `05_Development/backend` rồi chạy `.\mvnw.cmd test` (bỏ khoảng trắng đầu lệnh); sau khi test qua, chạy `.\mvnw.cmd package`.
   - Nếu có lỗi, đọc lỗi cụ thể rồi mới sửa; không tuyên bố build thành công trước khi có output.
6. Kiểm tra các phần backend shared security/auth trước khi triển khai endpoint thật; `SecurityConfig`/JWT filter hiện là hạ tầng chung cần review cẩn thận.
7. Chưa tự quyết định notification preference; giữ làm open item và hỏi nhóm trưởng ở mốc tích hợp.

## 10. Lệnh kiểm tra trạng thái nhanh

Chạy trong PowerShell:

```powershell
cd C:\Users\Admin\Desktop\ISP392\Project\fall26_isp392_is2005_g1-work
git branch --show-current
git status --short
git diff --check
```

Nếu cần chuẩn bị commit, xem lại diff trước, đặc biệt migration OTP, rồi mới stage. Có thể push WIP lên nhánh M1 riêng để sao lưu, nhưng **không merge và không chạy SQL draft** cho đến khi cảnh báo ở mục 7 được xử lý.
