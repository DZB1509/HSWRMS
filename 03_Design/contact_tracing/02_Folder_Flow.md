# 02 — Luồng chạy giữa các folder (Folder Flow)

## 1. Frontend: từ lúc mở trình duyệt tới khi render màn hình

```mermaid
flowchart TD
    A["index.html"] --> B["src/main.tsx"]
    B --> C["src/App.tsx"]
    C --> P1["app/providers/AuthProvider"]
    P1 --> P2["context/CustomerContext"]
    P2 --> P3["context/OperationsContext"]
    P3 --> P4["context/SpaContext"]
    P4 --> P5["context/DiningContext"]
    P5 --> P6["context/FolioContext"]
    P6 --> P7["context/GovernanceContext"]
    P7 --> R["app/router/index.tsx (AppRouter)"]
    R --> G["app/router/guards/RoleGuard"]
    G --> L["app/layouts/*Layout (Outlet)"]
    L --> PG["pages/role/XxxPage.tsx"]
    PG --> CMP["components/*"]
    PG -->|"useXxx()"| P2
    PG -->|"t('key')"| I["i18n/locales/lang/*.json"]
```

### Thứ tự Provider quan trọng
Provider bên trong được phép gọi hook của provider bên ngoài:

| Provider | Phụ thuộc vào |
|---|---|
| `AuthProvider` | — |
| `CustomerProvider` | — |
| `OperationsProvider` | — |
| `SpaProvider` | `useCustomer()` (lấy wellnessProfile cho therapist view) |
| `DiningProvider` | `useCustomer()` (lấy dị ứng / chế độ ăn) |
| `FolioProvider` | `useCustomer()`, `useSpa()`, `useDining()`, `useOperations()` |
| `GovernanceProvider` | `useAuth()` |

→ **FolioContext là điểm hội tụ**: đọc booking (M2), phiên spa (M3), order F&B (M4), villa (M2) để dựng folio & chặn checkout.

### Nguồn dữ liệu & lưu trữ

```mermaid
flowchart LR
    D["src/data/mock*.ts"] -->|"giá trị khởi tạo"| CTX["context/*"]
    CTX <-->|"đọc/ghi"| LS["localStorage (Customer, Folio)"]
    CTX <-->|"đọc/ghi"| SS["sessionStorage (role hiện tại, identity check-in, draft booking)"]
    CTX -->|"chỉ RAM"| MEM["Spa, Dining, Operations, Governance (mất khi F5)"]
```

| Key | Nơi ghi | Ý nghĩa |
|---|---|---|
| `hswrms_active_role` (session) | AuthProvider | Persona đang đóng vai |
| `hsw_customer_*_v1` (local) | CustomerContext | Hồ sơ, wellness, bookings, yêu cầu xóa |
| `hsw_settled_*`, `hsw_checkout_records_v1`, `hsw_stay_reviews_v1`, `hsw_payment_transactions_v1` (local) | FolioContext | Trạng thái thanh toán / checkout / review |
| `hsw_draft_booking` (session) | RetreatBookingPage → BookingSummaryPage | Nháp booking giữa 2 bước |
| transient identity (session) | OperationsContext | Thông tin giấy tờ khi check-in (không lưu local) |

> Reset demo: DevTools → Application → xóa Local/Session Storage rồi F5.

### Định tuyến & phân quyền

```mermaid
flowchart TD
    URL["URL"] --> M{"Khớp nhóm route"}
    M -->|"/ , /retreats"| PUB["PublicLayout — không guard"]
    M -->|"/login, /register, ..."| AUTH["AuthLayout — không guard"]
    M -->|"/customer/*"| G1["RoleGuard customer → CustomerLayout"]
    M -->|"/receptionist/*"| G2["RoleGuard receptionist → OperationalLayout"]
    M -->|"/therapist/*"| G3["RoleGuard therapist → OperationalLayout"]
    M -->|"/fb/*"| G4["RoleGuard fb_staff → OperationalLayout"]
    M -->|"/manager/*"| G5["RoleGuard manager → ManagerAdminLayout"]
    M -->|"/admin/*"| G6["RoleGuard admin|manager → ManagerAdminLayout"]
    G6 --> G6a["Route con: RoleGuard admin"]
    G6 --> G6b["business-params: requiredCapability configure_business_parameters"]
    M -->|"*"| HOME["Navigate /"]
```

`RoleGuard` ([RoleGuard.tsx](../../05_Development/frontend/src/app/router/guards/RoleGuard.tsx)):
1. Chưa đăng nhập → `/login?redirect=...`
2. Sai role **hoặc** thiếu capability → hiển thị thẻ "Access Restricted (RBAC)"
3. `hasCapability()` trong GovernanceContext: role có grant **hoặc** Manager có ủy quyền còn hiệu lực.

### Đăng nhập trong prototype
- `LoginPage` **không gọi backend**: sau 600 ms gọi `loginAs('customer')`.
- Nhân viên được demo bằng **RoleSwitcher** (nút nổi góc phải dưới) → `loginAs(role)` → điều hướng tới dashboard của role.
- `DevHealthIndicator` (góc trái dưới) là chỗ duy nhất gọi BE: `api/health/healthApi.ts` → `GET /api/v1/health`.

---

## 2. Backend: vòng đời một request

```mermaid
sequenceDiagram
    participant FE as Client
    participant CORS as CorsConfig
    participant JWT as JwtAuthenticationFilter
    participant SEC as SecurityConfig rules
    participant CTRL as Controller
    participant PERM as PermissionEvaluator (@perm)
    participant SVC as Service
    participant REPO as Repository/JPA
    participant AUD as AuditLogService
    FE->>CORS: HTTP + Authorization: Bearer <jwt>
    CORS->>JWT: allowed origin :5173
    JWT->>JWT: validate token, set SecurityContext (userId, roles)
    JWT->>SEC: /health, /auth/**, /packages/** = permitAll; còn lại authenticated
    SEC->>CTRL: dispatch
    CTRL->>PERM: @PreAuthorize("@perm.has('S52','C')")
    PERM->>SVC: user active + có quyền (role hoặc delegation)?
    alt bị từ chối
        PERM->>AUD: ghi "Access Denied"
        PERM-->>FE: 403 (RestAccessDeniedHandler)
    else được phép
        CTRL->>SVC: gọi nghiệp vụ
        SVC->>REPO: đọc/ghi
        SVC->>AUD: ghi audit
        CTRL-->>FE: 200 ApiResponse<T>
    end
```

- Lỗi nghiệp vụ → `BusinessRuleException` / `ConflictException` / `ResourceNotFoundException` → `GlobalExceptionHandler` → JSON `ApiError`.
- Chưa có token / token sai → `RestAuthenticationEntryPoint` → 401.

### Khởi động backend
1. `application.yml` → profile mặc định `local` → `application-local.yml` (H2, `create-drop`).
2. Hibernate tạo bảng từ entity M1 + M6.
3. `M6DataInitializer` (ApplicationRunner): seed roles → permissions (`PermissionCatalog`) → role-permission → business parameters → 5 tài khoản mặc định → (thử) master data.
4. Scheduler: `AccountUnlockJob`, `DelegationExpiryJob`, `AuditLogCleanupJob`.

---

## 3. Điểm nối FE ↔ BE (hiện trạng)

```mermaid
flowchart LR
    subgraph FE
      H["DevHealthIndicator"] --> HA["api/health/healthApi.ts"]
      AP["pages/admin/*"] --> GOV["GovernanceContext (mock)"]
      AA["features/m6-admin/api/adminApi.ts"]
    end
    HA --> C["api/client/apiClient.ts"]
    AA --> C
    C -->|"GET /health ✅"| BE["Backend"]
    C -.->|"/auth, /admin/* — sẵn sàng nhưng chưa dùng"| BE
```

Để nối thật một màn hình Admin: page → `adminApi.*` → `apiClient` (tự gắn JWT từ `hswrms_jwt_token`) → controller M6. Cần thêm bước login thật lưu token bằng `setAuthToken()`.
