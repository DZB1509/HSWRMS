# PLAN v2 – CODE MODULE 6: System Administration & Permission Management (HSWRMS)

**Dự án:** HeavenStay Wellness Resort Management System (HSWRMS)
**Module:** M6 – System Administration & Permission Management
**Phiên bản plan:** v2 – **đã loại bỏ hoàn toàn tính năng Feature Flag (bật/tắt cờ tính năng)**
**Nguồn chuẩn:** `02_Requirement/Project_Specification/HSWRMS_ISP392_G1_SRS_11.10.docx` (đã đọc toàn bộ phần M6)
**Nơi code:** `05_Development/` (backend `m6admin`, frontend `features/m6-admin`, `database/`)

> Plan này thay thế `PLAN_M6_System_Administration.md` (v1 vẫn giữ để đối chiếu, nhưng **không còn hiệu lực**).
> File này chỉ là kế hoạch, source code nằm trong `05_Development/`.

---

## 0. Thay đổi so với plan v1

| Hạng mục | v1 | v2 (theo SRS 11.10) |
|---|---|---|
| Feature Flag (UC27, màn S51, endpoint `/admin/feature-flags`, `GET /features`, bảng `FeatureFlagService`) | Có | **Bỏ hoàn toàn** |
| Số màn hình M6 | S10–S12, S49–S56 (8 màn M6 + 3 màn staff/master data) | **S10–S12, S49–S55** (7 màn M6 + 3 màn staff/master data) |
| Đánh số màn | Permission Matrix = S52, Delegation = S53, Audit = S54, Manager Dashboard = S55, System Overview = S56 | Business Parameters = S50, **Permission Matrix = S51, Delegation = S52, Audit Log = S53, Manager Dashboard = S54, System Overview = S55** |
| Số Functional Requirement M6 | UC26–UC31 (theo Spec Ver2) | **FR-M6-01 … FR-M6-07**, use case **UC75 – UC84** (theo SRS) |
| Staff role | Có thể nhiều role | **Mỗi nhân viên một role** (SRS: "assigns one role") |
| Login | Mô tả chung | Thuộc UC80 (Admin/Manager đăng nhập) + FR-M1-03; sau login điều hướng theo role (Admin → S49, Manager → Manager Dashboard) |
| Background job | Job hết hạn delegation | Thêm **JOB-01** (mở khoá tài khoản) và **JOB-02** (dọn audit log), đúng theo SRS |
| Mã thông báo | Tự đặt | Dùng **M6-MSG-01 … M6-MSG-08** từ SRS |

> **Phần Feature Flag trong code hiện tại cũng phải dọn:** xem mục 9 (checklist loại bỏ).

---

## 1. Phạm vi M6 theo SRS 11.10

### 1.1 Use case (SRS mục 4.2)

| UC | Tên | Mô tả ngắn |
|---|---|---|
| UC75 | Manage Staff Accounts | Admin tạo / sửa / vô hiệu hoá tài khoản nhân viên, gán role |
| UC76 | Manage Master Data | Admin quản lý Villa Category, Spa Service/Treatment, Retreat Package |
| UC77 | Configure Business Parameters | Admin (hoặc Manager được uỷ quyền) cấu hình tham số nghiệp vụ |
| UC78 | View Sensitive-Data Audit Log | Admin xem nhật ký truy cập dữ liệu nhạy cảm |
| UC79 | Delegate Limited Admin Rights | Admin cấp quyền giới hạn, có thời hạn cho Manager |
| UC80 | Sign In & Authenticate | Admin/Manager đăng nhập và xác thực |
| UC81 | Configure Permission Matrix | Admin cấu hình quyền theo role / screen / action |
| UC82 | Write Security & Action Audit Log | Hệ thống tự ghi audit cho thao tác quản trị & sự kiện bảo mật |
| UC83 | Execute Delegated Admin Tasks | Manager thực hiện tác vụ trong phạm vi được uỷ quyền |
| UC84 | View System Overview Dashboard | Admin / Manager xem tổng quan theo quyền |

### 1.2 Functional Requirement và màn hình

| FR | Chức năng | Màn hình | Actor |
|---|---|---|---|
| FR-M6-01 | Staff Accounts & Role Assignment | S10 Staff Account List, S11 Staff Account Detail | Admin |
| FR-M6-02 | Master Data | S12 Master Data Management | Admin |
| FR-M6-03 | Business Parameters | S50 Business Parameters | Admin (Manager nếu được uỷ quyền) |
| FR-M6-04 | Permission Matrix | S51 Permission Matrix | Admin |
| FR-M6-05 | Delegate Limited Admin Rights | S52 Limited Admin Rights Delegation | Admin cấp; Manager nhận |
| FR-M6-06 | Sensitive-Data Audit Log | S53 Sensitive Data Audit Log | Admin (Manager chỉ khi có delegation, chỉ đọc) |
| FR-M6-07 | System Overview Dashboard | S49 Admin Dashboard, S54 Manager Dashboard, S55 System Overview Dashboard | Admin, Manager |

### 1.3 Điểm SRS chưa nhất quán (cần nhóm chốt, ảnh hưởng code)

| # | Mâu thuẫn trong SRS 11.10 | Đề xuất xử lý trong plan |
|---|---|---|
| I-1 | Screen List (mục 5.2) đánh số S49–S55, nhưng nội dung FR-M6-04/05/06 vẫn ghi lẫn số cũ (Permission Matrix ghi "S52"/"S51", Delegation ghi "S52", Audit ghi "S53/S54", FR-M6-07 và bước export ghi "S56"). | Dùng **Screen List (mục 5.2) làm chuẩn**: S49–S55 như bảng trên. Ghi chú trong code theo số này. |
| I-2 | FR-M1-03 điều hướng Manager → "S55: Manager Dashboard", nhưng Screen List và FR-M6-07 ghi Manager Dashboard = S54, S55 = System Overview. | Dùng Screen List: Manager Dashboard = **S54**. Sửa lại route. |
| I-3 | FR-M6-07 vẫn liệt kê widget Admin-only **"active feature flags"** dù tính năng đã bỏ. Entity SYSTEM_CONFIGURATION còn ghi "feature configuration" ở `configuration_type`. | **Không làm widget này** và không dùng type `FEATURE_FLAG`. Đề nghị chỉnh nốt SRS. |
| I-4 | Hai mô tả khác nhau về cách mở khoá: JOB-01 mở khoá khi `locked > 10 phút`, nhưng chưa nêu số lần sai để khoá. | Số lần sai tối đa là **tham số cấu hình** (Business Parameter), mặc định cần nhóm duyệt. Khoá 10 phút cố định theo JOB-01 (hoặc đọc từ parameter, mặc định 10). |
| I-5 | FR-M6-04 bước 1 ghi "opens S51" nhưng Target Screen ghi S52. | Dùng S51 (khớp Screen List). |
| I-6 | Staff Account SRS: "assigns one role", trong khi schema cho phép nhiều role (`UserRole` PK `(user_id, role_id)`). | Ràng buộc ở tầng service: **mỗi staff đúng một role**. Giữ schema, không đổi. |

---

## 2. Hiện trạng code (đã khảo sát)

| Hạng mục | Hiện trạng | Hệ quả |
|---|---|---|
| Đăng ký / đăng nhập | **Chưa có.** Backend không có `AuthController`. Frontend `AuthProvider` dùng `MOCK_PERSONAS` + `loginAs(role)` lưu `sessionStorage`. | Phải làm Auth tối thiểu (Pha 0) để M6 có JWT/role thật. |
| Security backend | Đã có `SecurityConfig` (stateless JWT, `@EnableMethodSecurity`, BCrypt), `JwtTokenProvider`, `JwtAuthenticationFilter`, `CustomUserDetails`, handler 401/403. `/api/v1/auth/**` đang `permitAll`. | Tái dùng. |
| Database | `schema.sql` đã có: `User`, `AuthIdentity`, `Role`, `UserRole`, `Permission`, `RolePermission`, `SystemConfiguration`, `RightDelegation`, `RightDelegationPermission`, `AuditLog`. | Đủ nền; cần bổ sung nhẹ (mục 4). |
| Backend M6 | Chưa có package `m6admin`. | Tạo mới. |
| Frontend M6 | Đã có UI mock: `pages/admin/*` (có cả `FeatureFlagsPage.tsx` – **phải xoá**), `ManagerDashboardPage`, `SystemOverviewPage`. `features/m6-admin/*` rỗng. | Nối API thật, bỏ trang Feature Flags. |
| Số màn trong code | Code đang theo cách đánh số cũ S49–S56 (có Feature Flag = S51). | Đánh số lại theo mục 1.2. |

---

## 3. Pha 0 – Auth tối thiểu (tiên quyết)

Dự án chưa có login thật nên không kiểm thử được phân quyền. Làm lát cắt tối thiểu, đặt trong `m1identity` để M1 mở rộng.

> **Cần chốt với chủ M1:** UC80 (Sign In & Authenticate) nằm trong M6 theo SRS, còn đăng ký / OTP / SSO / quên mật khẩu thuộc M1. Đề xuất: **M6 làm login + `/auth/me` + khoá tạm tài khoản**, M1 làm phần còn lại.

| # | Việc | Chi tiết |
|---|---|---|
| 0.1 | Entity + Repository | `User`, `Role`, `UserRole` map đúng `schema.sql`. |
| 0.2 | Load user | Theo email; kiểm tra `account_status`: `ACTIVE` mới được vào. |
| 0.3 | `POST /api/v1/auth/login` | BCrypt. Sai thông tin / tài khoản Inactive → **MSG09**. Trả JWT (claim `userId`, `fullName`, `roles`). Sau N lần sai (parameter) → `LOCKED` + ghi audit. |
| 0.4 | `GET /api/v1/auth/me` | User + role + danh sách permission hiệu lực (bao gồm quyền uỷ quyền đang hiệu lực). |
| 0.5 | Seed | Role: `ADMIN`, `MANAGER`, `RECEPTIONIST`, `THERAPIST`, `FNB_STAFF`, `CUSTOMER`. Một Admin + một Manager + vài staff mẫu. Mật khẩu BCrypt, đặt trong `database/seed/`, **không** dùng mật khẩu thật. |
| 0.6 | Frontend login thật | `LoginPage` gọi API; `apiClient` gắn `Authorization: Bearer`; `AuthProvider` đọc `/auth/me`. Giữ `RoleSwitcher` mock chỉ khi `VITE_ENABLE_MOCK_AUTH=true`. |
| 0.7 | Điều hướng theo role | Admin → S49, Manager → S54 (theo Screen List, xem I-2). |

**Ngoài phạm vi:** đăng ký Customer, OTP, Google/Facebook SSO, reset mật khẩu (M1).

**Tiêu chí xong:** login Admin seed lấy được JWT; `/auth/me` đúng; `/api/v1/admin/**` không token → 401, token Customer → 403.

---

## 4. Thiết kế dữ liệu M6

Mọi thay đổi schema đặt trong `database/migrations/` và báo các module khác.

| Bảng | Hiện có | Bổ sung đề xuất |
|---|---|---|
| `User` | `account_status` (PENDING/ACTIVE/INACTIVE/LOCKED), `password_hash`... | Thêm `failed_login_count INT DEFAULT 0`, `locked_at DATETIME2 NULL` (JOB-01 cần), `last_login_at`. |
| `UserRole` / `Role` | Có | Giữ. Một staff một role (kiểm tra ở service). |
| `Permission` | `module_or_screen`, `action_type` | Thêm `is_delegable BIT NOT NULL DEFAULT 0` và `is_admin_only BIT` (hoặc dùng chung cờ). Action chuẩn SRS: **V, C, U, D, X, E, G** (View, Create, Update, Deactivate, Execute, Export, Configure). |
| `RolePermission` | Có | Thêm `scope` (Own / Assigned / Min / Agg) nếu muốn mô hình hoá qualifier SRS 4.4.2. |
| `SystemConfiguration` | `configuration_type`, `key`, `value`, `status` | Dùng **chỉ** `configuration_type = 'BUSINESS_PARAMETER'`. Thêm `value_type`, `min_value`, `max_value`, `unit`, `description` để validate. **Không dùng type FEATURE_FLAG.** |
| `RightDelegation` | `valid_from`, `valid_until`, `delegation_status` | Thêm `revoked_at`, `revoked_by_admin_user_id`. |
| `RightDelegationPermission` | Có | Giữ. |
| `AuditLog` | `actor_user_id`, `action`, `target_data_type`, `access_status`, `created_at` | Thêm `actor_role`, `target_ref_id`, `delegation_id NULL` (SRS: mỗi hành động của Manager ghi kèm tham chiếu delegation), `old_value`/`new_value` **chỉ cho Business Parameter và Permission** (không bao giờ cho dữ liệu sức khoẻ/PII). **Trigger chặn UPDATE/DELETE** (ngoại trừ JOB-02 qua thủ tục riêng). |

**Seed Permission Matrix:** sinh từ Screen List (S1–S55) × action (V/C/U/D/X/E/G), gán mặc định theo SRS 4.4.3–4.4.4:
- Admin: S10–S12, S49–S53 cố định, ô bị **khoá** (Alt 2 của FR-M6-04).
- Manager: chủ yếu View (S46–S48, S54, S55). **Không** được gán sẵn S50–S53, staff, matrix.
- Receptionist / Therapist / F&B: theo nguyên tắc tối thiểu dữ liệu (GB-M6-04).

---

## 5. Thiết kế backend (`com.heavenstay.hswrms.m6admin`)

### 5.1 Cấu trúc package

```
m6admin/
├── controller/   AdminStaffController, AdminMasterDataController, AdminParameterController,
│                 AdminPermissionController, AdminDelegationController,
│                 AdminAuditLogController, DashboardController
├── service/      StaffAccountService, MasterDataService, BusinessParameterService,
│                 PermissionMatrixService, DelegationService, AuditLogService,
│                 SystemOverviewService
├── job/          AccountUnlockJob (JOB-01), AuditLogCleanupJob (JOB-02),
│                 DelegationExpiryJob
├── repository/   JPA repositories của M6
├── entity/       SystemConfiguration, RightDelegation, AuditLog, Permission, RolePermission...
├── dto/          request/response (record) + Bean Validation
├── mapper/
└── security/     PermissionEvaluator, DelegationResolver
```

> Không có `FeatureFlagController/Service` trong cấu trúc này.

### 5.2 Endpoint (`/api/v1/admin/**`)

| Nhóm | Endpoint | FR / Screen | Ghi chú |
|---|---|---|---|
| Staff | `GET /admin/staff?q=&role=&status=&page=` | FR-M6-01 / S10 | Tìm theo tên, email, role, status. Không có kết quả → MSG01. |
| | `POST /admin/staff` | S11 | Validate: bắt buộc, trùng email → **M6-MSG-01**, role hợp lệ, độ dài → MSG08. |
| | `GET /admin/staff/{id}` | S11 | |
| | `PUT /admin/staff/{id}` | S11 | Sửa họ tên, email, phone, role. |
| | `PATCH /admin/staff/{id}/status` | S11 | Active / Inactive. Admin tự vô hiệu hoá mình hoặc tự gỡ role Admin → **M6-MSG-02**. Inactive thì chặn login (MSG09), giữ dữ liệu lịch sử. |
| Master data | `GET/POST/PUT/PATCH /admin/master-data/{group}` | FR-M6-02 / S12 | `group` ∈ `villa-categories`, `spa-services`, `retreat-packages`. Giá âm → **M6-MSG-03**. Đã được tham chiếu thì chỉ deactivate, không xoá. Lưu thành công → MSG03/MSG04. |
| Parameters | `GET /admin/parameters` | FR-M6-03 / S50 | key, giá trị, đơn vị, cập nhật lúc, status. Cho phép Manager nếu có delegation. |
| | `PUT /admin/parameters/{key}` | S50 | Validate kiểu + khoảng (VD refund 0–100) → **M6-MSG-04**. Bước xác nhận "giá trị cũ → mới". Audit old/new. Chỉ áp dụng cho giao dịch **sau này**. |
| Permission | `GET /admin/permissions/matrix` | FR-M6-04 / S51 | Hàng = permission (module/screen + action), cột = role. |
| | `POST /admin/permissions/matrix/preview` | S51 | Trả diff để xác nhận trước khi lưu. |
| | `PUT /admin/permissions/matrix` | S51 | Chặn vi phạm tối thiểu hoá dữ liệu → **M6-MSG-05**; chặn gán quyền Admin-only cho Manager; ô Admin bị khoá. |
| Delegation | `GET /admin/delegations` | FR-M6-05 / S52 | Hiện tại và lịch sử. |
| | `POST /admin/delegations` | S52 | Validate: người nhận là Manager ACTIVE, quyền thuộc danh sách delegable → nếu không **M6-MSG-06**, `valid_until > valid_from` → **M6-MSG-07**. Status = Active hoặc Pending (nếu `valid_from` ở tương lai). Thông báo cho Manager. |
| | `POST /admin/delegations/{id}/revoke` | S52 | Status = Revoked, mất quyền ngay, ghi audit. |
| Audit | `GET /admin/audit-logs?from=&to=&actor=&role=&action=&dataType=&status=&page=` | FR-M6-06 / S53 | Mới nhất trước. Từ ngày > đến ngày → **M6-MSG-08**. Chỉ đọc. Bản thân việc xem audit cũng được ghi audit. |
| | `GET /admin/audit-logs/{id}` | S53 | Chỉ mã tham chiếu và dữ liệu đã che. |
| | `GET /admin/audit-logs/export?...&format=csv\|pdf` | S53 | Đánh dấu `[PROPOSED]` trong SRS. Làm sau cùng, cũng ghi audit. |
| Dashboard | `GET /admin/dashboard` | S49 | Điều hướng + thẻ tóm tắt. |
| | `GET /manager/dashboard` | S54 | Chỉ menu/chức năng được phép + delegation đang hiệu lực. |
| | `GET /system-overview?from=&to=` | FR-M6-07 / S55 | Widget theo quyền (mục 5.6). |
| | `GET /system-overview/police-residency-report/export` | S55 | Yêu cầu quyền riêng + ghi audit (AC-09). |

Tất cả trả `ApiResponse<T>`; lỗi dùng `BusinessRuleException`, `ConflictException`, `ResourceNotFoundException`.

### 5.3 Phân quyền (đúng AC-01…AC-10 của SRS)
1. **Deny by default (AC-01):** chỉ có quyền khi có trong `RolePermission` hoặc delegation hợp lệ.
2. **Backend enforcement (AC-02):** `@PreAuthorize("@perm.has('S50','G')")` trên mọi endpoint; UI chỉ ẩn thêm.
3. Quyền hiệu lực = `RolePermission` ∪ quyền của `RightDelegation` đang **Active** và `valid_from ≤ now ≤ valid_until`.
4. Quyền **tra DB/cache mỗi request**, hiệu lực ngay sau khi sửa matrix hay thu hồi delegation (SRS: áp dụng ở request/session kế tiếp).
5. Truy cập màn hình không có quyền → trả 403 và **ghi audit "Denied"** (Alt 4 FR-M6-04, Alt 2 FR-M6-07).
6. Admin quyền cấu hình **không** vượt qua quyền riêng tư dữ liệu sức khoẻ/cư trú/tài chính (AC-06).

### 5.4 Audit logging (UC82, AC-09)
- `AuditLogService.record(actor, role, action, targetType, refId, status, delegationId?)`.
- Ghi tối thiểu cho: tạo/sửa/vô hiệu hoá staff, đổi master data, đổi parameter (kèm cũ → mới), đổi matrix, tạo/thu hồi delegation, login thất bại/khoá, truy cập bị từ chối, xem/export audit, export Police Residency Report, mọi hành động của Manager trong phạm vi delegation.
- Module khác (M1 health, M2 residence, M3 therapist...) gọi qua interface công khai để ghi sự kiện truy cập dữ liệu nhạy cảm. Log **không bao giờ** chứa nội dung sức khoẻ/PII thô.
- Immutable: trigger chặn UPDATE/DELETE; không có API sửa/xoá.

### 5.5 Background jobs (SRS mục 2)
| Job | Lịch | Việc làm |
|---|---|---|
| **JOB-01** Unlock Expired Locked Accounts | Mỗi 15 phút | Tìm `Locked` với `locked_at` quá 10 phút → reset `failed_login_count = 0`, status → Active, log số tài khoản đã mở. Lỗi DB: retry 3 lần × 30 giây, nếu vẫn lỗi thì log critical. |
| **JOB-02** Clean Up Old Audit Log | Hằng ngày 02:00 | Xoá bản ghi cũ hơn thời hạn lưu (mặc định **90 ngày**, đọc từ parameter; thiếu thì dùng 90 và log cảnh báo). Xoá theo lô ≤ **5.000** bản ghi, còn dư thì chạy lô kế sau 5 phút; timeout thì rollback lô hiện tại. Đây là **đường xoá duy nhất** được phép. |
| DelegationExpiryJob (nội bộ) | Mỗi phút hoặc kiểm tra khi truy cập | Chuyển Pending→Active, Active→Expired khi hết hạn (Alt 2 FR-M6-05). |

### 5.6 System Overview (FR-M6-07) – widget theo quyền
Widget dùng chung (theo phạm vi quyền của người xem):
- Occupancy và villa status (Vacant / Occupied / Needs Cleaning).
- Hôm nay: arrivals / departures, in-house Customers.
- Spa utilization và pending service orders.
- Revenue summary và rating KPI (liên kết S46–S48).

Widget **chỉ Admin**: active delegations, recent audit events, failed-access count.
**Không có** widget "active feature flags" (đã bỏ).

Tùy chọn export: Police Residency Declaration Report (chỉ role có quyền; audit). Manager chỉ đọc (BR Manager read-only monitoring). Số liệu từ M2–M5 lấy qua service công khai hoặc dùng stub đến khi các module đó sẵn sàng.

---

## 6. Quy tắc nghiệp vụ & thông báo cần enforce

| Mã SRS | Quy tắc | Thực thi |
|---|---|---|
| GB-M6-01 | Staff một role; Admin không tự vô hiệu hoá/gỡ role Admin | `StaffAccountService` |
| GB-M6-02 | Giá master data ≥ 0; đã tham chiếu thì chỉ Inactive, không xoá | `MasterDataService` + FK |
| GB-M6-03 | Parameter đúng kiểu/khoảng; chỉ áp dụng cho giao dịch tương lai | `BusinessParameterService` |
| GB-M6-04 | Matrix không cấp quá quyền dữ liệu nhạy cảm (Receptionist: không health/dietary không giới hạn; Therapist: chỉ treatment-safety của session được gán; F&B: chỉ allergy/dietary) | `PermissionMatrixService` |
| GB-M6-05 | Delegation chỉ cho Manager Active; `valid_until > valid_from`; **không bao giờ** delegate: quản lý staff, sửa matrix, tạo/thu hồi delegation, truy cập PII/health không giới hạn, sửa audit | `DelegationService` |
| GB-M6-06 | Audit bất biến; chỉ JOB-02 được xoá; chi tiết chỉ mã tham chiếu + dữ liệu che | Trigger + `AuditLogService` |
| GB-M6-07 | System Overview chỉ hiện widget/export trong phạm vi quyền | `SystemOverviewService` |

**Thông báo:** MSG01 (không có kết quả), MSG02 (thiếu trường), MSG03 (cập nhật), MSG04 (thêm mới), MSG08 (quá độ dài), MSG09 (đăng nhập thất bại / account Inactive), **M6-MSG-01…M6-MSG-08**.
(Ghi chú: SRS dùng nhãn `M6-MSG-xx` ở các flow; một số flow ghi nhầm M6-MSG-06 cho lỗi ma trận thay vì M6-MSG-05. Dùng M6-MSG-05 cho vi phạm tối thiểu hoá dữ liệu, M6-MSG-06 cho quyền không thể uỷ quyền, đúng bảng System Messages.)

---

## 7. Thiết kế frontend (`features/m6-admin`)

### 7.1 Cấu trúc

```
features/m6-admin/
├── api/        adminStaffApi.ts, masterDataApi.ts, parametersApi.ts, permissionsApi.ts,
│               delegationsApi.ts, auditLogApi.ts, dashboardApi.ts
├── hooks/      useStaffList, useParameters, usePermissionMatrix, useDelegations,
│               useAuditLog, useSystemOverview
├── components/ StaffTable, StaffForm, ParameterForm, PermissionMatrixGrid, DiffSummaryDialog,
│               DelegationForm, AuditLogTable, AuditFilters, WidgetCard, ConfirmDialog
└── types/      staff.ts, parameter.ts, permission.ts, delegation.ts, audit.ts
```

### 7.2 Ánh xạ màn hình

| Screen | File hiện có | Việc cần làm |
|---|---|---|
| S10 | `pages/admin/StaffAccountListPage.tsx` | Danh sách phân trang, tìm/lọc, nút tạo. Hiển thị MSG01 khi trống. |
| S11 | `pages/admin/StaffAccountDetailPage.tsx` | Form (họ tên, email, phone, **một role**), validate inline (MSG02/08, M6-MSG-01), dialog xác nhận khi Inactive, chặn tự khoá (M6-MSG-02). |
| S12 | `pages/admin/MasterDataPage.tsx` | 3 nhóm: Villa Categories, Spa Services, Retreat Packages. CRUD + deactivate. Giá âm → M6-MSG-03. |
| S49 | `pages/admin/AdminDashboardPage.tsx` | Menu: Staff Accounts, Master Data, Business Parameters, Permission Matrix, Rights Delegation, Audit Log, System Overview. **Bỏ mục Feature Flags.** |
| S50 | `pages/admin/BusinessParametersPage.tsx` | Danh sách parameter, sửa giá trị, dialog "cũ → mới" trước khi lưu, M6-MSG-04. |
| S51 | `pages/admin/PermissionMatrixPage.tsx` | Lưới hàng = permission, cột = role. Preview diff, xác nhận, nút reset (Alt 5). Ô Admin S49–S53 khoá. Ô Admin-only không cho gán vào Manager. |
| S52 | `pages/admin/AdminDelegationPage.tsx` | Danh sách hiện tại/lịch sử; "New Delegation": chọn Manager, tick quyền delegable, valid_from/valid_until; Revoke. |
| S53 | `pages/admin/SensitiveAuditLogPage.tsx` | Bảng chỉ đọc, bộ lọc (khoảng ngày, actor, role, action, data type, status), chi tiết che dữ liệu, export (proposed). M6-MSG-08. |
| S54 | `pages/manager/ManagerDashboardPage.tsx` | Chỉ hiện menu được phép + mục được uỷ quyền. |
| S55 | `pages/common/SystemOverviewPage.tsx` | Widget theo quyền, chọn khoảng ngày, export Police Residency Report nếu có quyền. |

### 7.3 Phần dùng chung
- `useHasPermission(screen, action)` lấy từ `/auth/me`; `RoleGuard` kiểm tra theo permission; truy cập trái quyền hiện trang access-denied (và backend ghi audit).
- Xử lý loading / empty (`EmptyState`) / lỗi (`Toast` + hiển thị lỗi theo trường từ `ApiError.errors[]`).
- i18n 5 ngôn ngữ (`en`, `vi`, `ja`, `fr`, `zh-CN`): thêm `admin.json`; tối thiểu `en` + `vi` đầy đủ.
- Dùng design token và component sẵn có (`StatusChip`, `FormField`, `Card`, `Modal`, `Toast`).

---

## 8. Lộ trình triển khai

| Pha | Nội dung | Phụ thuộc | Kiểm chứng |
|---|---|---|---|
| **P0** | Auth tối thiểu (login, `/auth/me`, seed, frontend login thật) | – | Login Admin thật; 401/403 đúng. |
| **P1** | Nền tảng M6: package, `AuditLogService` + trigger bất biến, `PermissionEvaluator`, seed matrix, migration cột mới | P0 | Unit test evaluator; audit append-only. |
| **P2** | FR-M6-01 Staff (S10, S11) | P1 | Trùng email; chặn tự khoá; Inactive chặn login. |
| **P3** | FR-M6-03 Business Parameters (S50) | P1 | Validate khoảng; audit cũ → mới; không tính lại giao dịch cũ. |
| **P4** | FR-M6-04 Permission Matrix (S51) | P1, P2 | Quy tắc tối thiểu hoá dữ liệu; quyền đổi ngay; ô khoá. |
| **P5** | FR-M6-05 Delegation (S52) + DelegationExpiryJob | P4 | Hết hạn / thu hồi mất quyền; chặn non-delegable. |
| **P6** | FR-M6-06 Audit Log viewer (S53) + JOB-02 | P1 | Lọc/phân trang; chỉ đọc; che dữ liệu. |
| **P7** | JOB-01 Unlock accounts | P0 | Mở khoá sau 10 phút; retry 3 lần. |
| **P8** | FR-M6-07 Dashboards (S49, S54, S55) | P2–P6 | Widget đúng theo quyền; Manager chỉ thấy phần được phép. |
| **P9** | FR-M6-02 Master Data (S12) qua service công khai các module | Module sở hữu | CRUD + deactivate; có thể stub tạm. |
| **P10** | Hoàn thiện: i18n, export audit (proposed), kiểm thử E2E, cập nhật tài liệu API | Tất cả | Mục 10. |

Frontend có thể dùng mock song song, rồi chuyển sang API thật theo từng pha.

---

## 9. Checklist loại bỏ Feature Flag khỏi code & tài liệu hiện có

| # | Việc | Vị trí |
|---|---|---|
| 1 | Xoá trang `FeatureFlagsPage.tsx` và route tương ứng | `frontend/src/pages/admin/`, `app/router/index.tsx` |
| 2 | Bỏ mục "Feature Flags" khỏi menu/sidebar và Admin Dashboard | `OperationalSidebar.tsx`, `AdminDashboardPage.tsx` |
| 3 | Bỏ khỏi nhãn màn hình / metadata | `types/screen.ts`, `types/governance.ts`, `hooks/useGovernance.ts` |
| 4 | Xoá key i18n liên quan (5 ngôn ngữ: `navigation.json`, `operations.json`...) | `i18n/locales/*` |
| 5 | Đánh số lại màn M6 (S51→Permission Matrix, S52→Delegation, S53→Audit, S54→Manager Dashboard, S55→System Overview) | Frontend `types/screen.ts`, router, `Screen_List.md` |
| 6 | Cập nhật `MODULE_OWNERSHIP.md` (hiện ghi "feature flags (S51)", "Screens 10–12, 49–56") | `05_Development/docs/` |
| 7 | Cập nhật `API_CONTRACT.md` (namespace M6 ghi "feature flags") | `05_Development/docs/` |
| 8 | Cập nhật `DEVELOPMENT_STATUS.md` (Phase 7 ghi "feature flags") | `05_Development/docs/` |
| 9 | Seed/`SystemConfiguration`: không tạo bản ghi type feature flag | `database/seed/` |
| 10 | Đồng bộ `Screen_List.md` và Project Specification Ver2 (đang còn UC27, S51 Feature Flag, S56) với SRS 11.10 | `02_Requirement/` |

Mỗi việc sửa chung (router, i18n, docs) nên báo nhóm trước khi sửa.

---

## 10. Kiểm thử & tiêu chí hoàn thành

### Backend (JUnit 5, Spring Boot Test, MockMvc)
- Auth: login đúng / sai, Inactive, Locked, token hết hạn, khoá sau N lần sai.
- Phân quyền: Customer / Receptionist / Therapist / F&B / Manager gọi `/admin/**` → 403; Admin → 200; Manager có delegation → chỉ endpoint được uỷ quyền.
- Staff: trùng email → 409; không tự khoá; mỗi staff một role.
- Parameters: ngoài khoảng → 400 (M6-MSG-04); chỉ áp dụng giao dịch mới.
- Matrix: vi phạm tối thiểu hoá dữ liệu bị từ chối; ô Admin khoá; không gán Admin-only cho Manager.
- Delegation: `valid_until <= valid_from` bị từ chối; quyền non-delegable bị từ chối; hết hạn / thu hồi mất quyền ngay.
- Audit: mỗi thay đổi tạo bản ghi; không UPDATE/DELETE được; chỉ JOB-02 xoá, theo lô 5.000.
- JOB-01: mở khoá sau 10 phút; không có tài khoản cần mở thì không làm gì.
- **Không còn endpoint/UI Feature Flag** (test route 404).

### Frontend
`npx tsc --noEmit` và `npm run build` không lỗi; kiểm thử thủ công theo kịch bản demo.

```
cd 05_Development/backend  && .\mvnw.cmd test
cd 05_Development/frontend && npx tsc --noEmit && npm run build
```

### Kịch bản demo
1. Admin đăng nhập → S49 (menu không có Feature Flags).
2. Tạo nhân viên (Therapist) → đăng nhập được → Admin vô hiệu hoá → bị chặn (MSG09).
3. Admin thử tự vô hiệu hoá chính mình → M6-MSG-02.
4. Sửa `cancellation window` / `refund %` → hiện "cũ → mới" → audit; nhập refund 150 → M6-MSG-04.
5. Sửa Permission Matrix → thử cấp health data đầy đủ cho Receptionist → M6-MSG-05.
6. Uỷ quyền Manager xem Audit Log trong 1 giờ → Manager xem được → Admin Revoke → Manager mất quyền ngay.
7. Thử uỷ quyền "sửa Permission Matrix" → M6-MSG-06; chọn ngày kết thúc ≤ ngày bắt đầu → M6-MSG-07.
8. Xem Audit Log, lọc ngày sai → M6-MSG-08; nội dung chỉ mã tham chiếu, dữ liệu che.
9. S54/S55 hiển thị đúng theo quyền Admin và Manager.
10. Toàn bộ màn S10–S12, S49–S55 chạy dữ liệu thật, hết mock.

---

## 11. Rủi ro & vấn đề mở

| # | Rủi ro / Câu hỏi | Đề xuất |
|---|---|---|
| R1 | Trùng việc với M1 (login) | Chốt phạm vi Pha 0 với chủ M1. |
| R2 | SRS 11.10 còn nhắc "active feature flags" (FR-M6-07) và "feature configuration" (SYSTEM_CONFIGURATION), và lẫn số màn S51/S52/S53/S54/S56 | Nhờ người sửa SRS chỉnh nốt; code theo Screen List (xem mục 1.3). |
| R3 | Danh sách Business Parameter, giá trị mặc định, số lần đăng nhập sai chưa có trong SRS | Nhóm duyệt; đề xuất key ở mục 5. Không tự đặt quy tắc mâu thuẫn SRS. |
| R4 | Master data (S12) nằm trong bảng của M2/M3/M4 | Gọi qua service công khai, không inject repository chéo (theo `MODULE_OWNERSHIP.md`). Dùng stub tạm. |
| R5 | Sửa `schema.sql` ảnh hưởng module khác | Dùng `database/migrations/` và báo nhóm. |
| R6 | Cache quyền gây trễ | TTL ngắn + invalidate khi đổi matrix/delegation. |
| R7 | Audit log tăng nhanh | Index `created_at`, `actor_user_id`; bắt buộc phân trang; JOB-02. |
| R8 | OI-01…OI-09 chưa quyết | Không hard-wire phụ thuộc private sang module khác. |
| R9 | Danh sách "quyền non-delegable" và "Admin-only" cần chốt | Chốt trước P4/P5 (SRS 4.4.5 là cơ sở). |

---

## 12. Quy ước làm việc
- Nhánh git: `vinhpt1`. Commit nhỏ theo pha (`feat(m6): ...`).
- **Không commit** `node_modules/`, `target/`, mật khẩu thật, file `application.yml` chứa secret. (Hiện staging area đang chứa hàng nghìn file `node_modules`/`target`; cần `git reset` và dọn trước khi commit.)
- Dùng thống nhất tên **HSWRMS**, thuật ngữ **Customer** (không dùng Guest) trong UI/code M6.
- Sửa vùng chung (`security/`, `common/`, `config/`) sau khi báo nhóm.
- Endpoint mới cập nhật vào `05_Development/docs/API_CONTRACT.md`; cập nhật `DEVELOPMENT_STATUS.md` sau mỗi pha.

---

## 13. Checklist tiến độ

- [ ] Dọn Feature Flag khỏi code/tài liệu (mục 9)
- [ ] P0 – Auth tối thiểu
- [ ] P1 – Nền tảng M6 (audit, evaluator, seed matrix, migration)
- [ ] P2 – Staff accounts (S10, S11)
- [ ] P3 – Business Parameters (S50)
- [ ] P4 – Permission Matrix (S51)
- [ ] P5 – Limited Admin Delegation (S52)
- [ ] P6 – Sensitive Audit Log (S53) + JOB-02
- [ ] P7 – JOB-01 Unlock accounts
- [ ] P8 – Dashboards (S49, S54, S55)
- [ ] P9 – Master Data (S12)
- [ ] P10 – i18n, export, kiểm thử, tài liệu, demo
