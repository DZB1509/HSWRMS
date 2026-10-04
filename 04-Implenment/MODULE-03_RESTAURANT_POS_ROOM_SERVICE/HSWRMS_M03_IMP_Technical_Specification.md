# TECHNICAL SPECIFICATION (TDS) — MODULE 3 / MODULE 4: RESTAURANT POS & ROOM SERVICE

> **Dự án:** HEAVENSTAY WELLNESS RESORT MANAGEMENT SYSTEM (HSWRMS)  
> **Mã tài liệu:** `HSWRMS-POS-IMP-003`  
> **Phiên bản:** `1.0`  
> **Ngày tạo:** `2026-09-30`  
> **Trạng thái:** `Approved`  
> **Document Owner:** Lead Software Engineer & Senior Solution Architect  
> **Author:** Tech Lead & Security Engineer  
> **Reviewed by:** Principal Architect & DPO Lead  
> **DPO Sign-off:** `[x] Approved — 2026-09-30 — PrivacyOps DPO` *(Bắt buộc do xử lý PII dị ứng thực phẩm)*  
> **Phạm vi Tiêu chuẩn:** EDS v2.0 (Engineering Documentation Standard) & CASE 2.0 Methodology  
> **Kiến trúc & Coding Rules:** Tuân thủ 100% [`03-Design/ADR-001_MVC-Pattern.md`](file:///c:/Users/PC/fal26-isp392-is2005-g1/03-Design/ADR-001_MVC-Pattern.md) và [`03-Design/Coding-Convention.md`](file:///c:/Users/PC/fal26-isp392-is2005-g1/03-Design/Coding-Convention.md)

---

## CHANGELOG

| Ngày | Người thực hiện | Nội dung thay đổi |
|------|-----------------|-------------------|
| 2026-09-30 | Tech Lead & SA Agent | Khởi tạo tài liệu Đặc tả Kỹ thuật (Technical Specification Driven Development) cho Module Restaurant POS & Room Service (Chế biến Ẩm thực Trị liệu, Đặt bữa, Phục vụ Phòng & Bộ lọc Dữ liệu Y tế Chef) |

---

## MỤC LỤC

1. [Tổng quan Module](#1-tổng-quan-module)
2. [Ma trận Truy vết (Traceability Matrix)](#2-ma-trận-truy-vết-traceability-matrix)
3. [Architecture Decision Records (ADR)](#3-architecture-decision-records-adr)
4. [Non-Functional Requirements & SLA](#4-non-functional-requirements--sla)
5. [Static Modeling (Mô hình Tĩnh MVC)](#5-static-modeling-mô-hình-tĩnh-mvc)
6. [Dynamic Modeling (Mô hình Động)](#6-dynamic-modeling-mô-hình-động)
7. [Domain Event Catalog](#7-domain-event-catalog)
8. [Interface Specification (Đặc tả Giao diện View)](#8-interface-specification-đặc-tả-giao-diện-view)
9. [API Specification](#9-api-specification)
10. [Bảng mã lỗi (Error Codes)](#10-bảng-mã-lỗi-error-codes)
11. [Quy trình Triển khai (Step-by-Step Implementation Guide)](#11-quy-trình-triển-khai-step-by-step-implementation-guide)
12. [Rollback & Incident Runbook](#12-rollback--incident-runbook)
13. [Kịch bản Kiểm thử Chi tiết Integration](#13-kịch-bản-kiểm-thử-chi-tiết-integration)
14. [Phương pháp Xác minh](#14-phương-pháp-xác-minh)
15. [Mẫu thử thực tế (API Verification Samples)](#15-mẫu-thử-thực-tế-api-verification-samples)
16. [Bảng tổng hợp phân quyền (Authorization Matrix)](#16-bảng-tổng-hợp-phân-quyền-authorization-matrix)
17. [AI Prompt Constraints (CASE 2.0 Core)](#17-ai-prompt-constraints-case-20-core)

---

## 1. TỔNG QUAN MODULE

Module **Restaurant POS & Room Service (Personalized F&B & Culinary Wellness)** chịu trách nhiệm quản lý toàn bộ luồng nghiệp vụ ẩm thực trị liệu tại Resort, bao gồm:
- **Pre-select Daily Meals (UC16):** Cho phép Khách hàng chọn thực đơn bữa ăn hàng ngày được lọc tự động theo Hồ sơ Sức khỏe & Dị ứng.
- **Daily Meal Prep Dashboard (UC17):** Cung cấp giao diện hiển thị danh sách món cần chế biến cho Đầu bếp (Chef / F&B Staff).
- **Update Meal Status (UC18):** Cho phép bếp cập nhật trạng thái món ăn (`PREPARING` -> `READY_FOR_DELIVERY` -> `DELIVERED`).
- **Order Extra A-la-carte (UC19):** Cho phép Khách hàng gọi thêm món Room Service ngoài gói nghỉ dưỡng, tự động tích hợp tính phí vào Villa Folio (`VILLA_FOLIO_CHARGE`).
- **Minimize Health Data for Chef Engine (UC20):** Thực thi bộ lọc dữ liệu an toàn (**BR-03 Data Minimization**), đảm bảo Chef chỉ thấy thông tin dị ứng thực phẩm (`FoodAllergies`) và yêu cầu ăn kiêng (`DietaryPreferences`), hoàn toàn ẩn các thông tin y tế nhạy cảm (bệnh lý y khoa, lịch sử khám, ghi chú trị liệu Spa).

| Field | Value |
|-------|-------|
| **Module Name** | `Restaurant POS & Room Service (Personalized F&B Engine)` |
| **Bounded Context** | `Culinary & Room Service Subdomain` |
| **Data Classification** | `Sensitive-PII` *(Chứa thông tin dị ứng thực phẩm & ăn kiêng gắn liền với sức khỏe cá nhân)* |
| **Compliance Scope** | `Nghị định 356/2025/NĐ-CP (Bảo vệ dữ liệu cá nhân)` / `Luật 91/2025/QH15` |
| **Upstream Dependencies** | `Guest Health Profile Module (UC02)`, `Villa Booking Module (UC07, UC08)` |
| **Downstream Consumers** | `Folio Billing & Checkout Module (UC24, UC25)`, `Audit Logging System (UC31)` |

---

## 2. MA TRẬN TRUY VẾT (TRACEABILITY MATRIX)

| Requirement ID | Loại | Mô tả yêu cầu | Thành phần Code MVC | Compliance Target | ADR / Policy |
|----------------|------|---------------|---------------------|-------------------|--------------|
| **SR-14** | FR | Khách hàng chọn bữa ăn hàng ngày theo gợi ý dị ứng | `MealSelectionController.POST /guest/meal-selection`<br>`DailyMealSelectionDAO.create()` | NĐ 356 Art. 9 | ADR-001, Coding-Convention |
| **SR-15** | FR | Chef xem Dashboard chuẩn bị món chỉ chứa thông tin dị ứng | `ChefDashboardController.GET /chef/dashboard`<br>`ChefMealOrderDAO.listActiveOrders()` | NĐ 356 Art. 13 (Tối thiểu hóa PII) | ADR-001, BR-03, BR-12 |
| **SR-16** | FR | Khách gọi món A-la-carte tính phí vào Villa Folio | `RoomServiceController.POST /guest/room-service`<br>`VillaFolioChargeDAO.addCharge()` | BR-04 (Billing Folio Integration) | ADR-001, Coding-Convention |
| **SR-13** | NFR | Bắt buộc lọc bỏ PII y tế nhạy cảm trong API cho Chef | `HealthDataMinimizationFilter.java`<br>`ChefMealOrderDTO.java` | NĐ 356 Art. 4 | ADR-001 §AI Constraint 5, BR-03 |

---

## 3. ARCHITECTURE DECISION RECORDS (ADR)

### ADR-001 — Lựa chọn Kiến trúc MVC Pattern & Data Minimization Middleware

| Field | Value |
|-------|-------|
| **Status** | `Accepted` |
| **Deciders** | Solution Architect, Tech Lead, DPO Security Lead |
| **Date** | 2026-09-30 |

#### Bối cảnh (Context)
Cần tách biệt hoàn toàn giữa giao diện đặt món của Khách hàng, màn hình chế biến của Đầu bếp (Chef), logic tính tiền vào Folio phòng, và lớp bảo mật dữ liệu sức khỏe cá nhân (PII). Chef không được phép thấy bệnh án y tế hoặc thông tin nhạy cảm của khách.

#### Các phương án đã xem xét (Options Considered)
1. **Option A (Monolithic JSP script):** Viết trực tiếp SQL query trong JSP Chef View. -> *Bị bác bỏ do nguy cơ rò rỉ PII y tế và vi phạm MVC.*
2. **Option B (MVC Architecture + DTO Data Minimization Filter):** Áp dụng 3 tầng MVC. Tầng Controller gọi `HealthDataMinimizationFilter` để chuyển đổi Entity `GuestHealthProfile` thành `ChefMealOrderDTO` sanitized trước khi truyền cho View. -> **ĐƯỢC CHỌN.**

#### Hệ quả (Consequences)
- **Tích cực:** Cách ly 100% PII y tế nhạy cảm khỏi màn hình hiển thị của Chef; hỗ trợ Traceability Comments giúp QA/BA kiểm tra dễ dàng.
- **Compliance Impact:** Đạt chuẩn tối thiểu hóa dữ liệu (Data Minimization) theo Nghị định 356/2025/NĐ-CP.

---

## 4. NON-FUNCTIONAL REQUIREMENTS & SLA

| NFR-ID | Tiêu chí | Mục tiêu SLA / Chỉ số | Phương pháp Kiểm soát |
|--------|----------|-----------------------|------------------------|
| **NFR-POS-01** | Thời gian phản hồi Dashboard | Latency `< 200ms` cho 500 yêu cầu đồng thời | Indexing CSDL trên `(MealDate, Status, VillaID)` |
| **NFR-POS-02** | An toàn PII (Data Minimization) | `0%` rò rỉ dữ liệu y tế (`MedicalConditions`, `TherapyNotes`) sang Chef View | TDD Unit Test `TC-UC20-01` kiểm tra DTO Sanitization |
| **NFR-POS-03** | Tính toàn vẹn Folio Billing | Giao dịch tài chính khi order A-la-carte phải atomic | ACID Transaction (`@Transactional` / Connection Commit-Rollback) |

---

## 5. STATIC MODELING (MÔ HÌNH TĨNH MVC)

Theo chuẩn **Oracle Java JLS** & **Google Java Style Guide** (`Coding-Convention.md`):

```text
src/main/java/com/heavenstay/hswrms/
├── model/
│   ├── entity/
│   │   ├── DailyMealSelection.java       <-- Entity đại diện bảng DAILY_MEAL_SELECTION
│   │   ├── MealOrder.java                 <-- Entity đại diện bảng MEAL_ORDER
│   │   ├── MealOrderItem.java             <-- Entity đại diện bảng MEAL_ORDER_ITEM
│   │   └── VillaFolioCharge.java          <-- Entity đại diện bảng VILLA_FOLIO_CHARGE
│   ├── dto/
│   │   └── ChefMealOrderDTO.java          <-- DTO Đã lọc bỏ PII y tế cho Chef View (BR-03)
│   └── dao/
│       ├── DailyMealSelectionDAO.java     <-- DAO tương tác CSDL bữa ăn hàng ngày
│       ├── MealOrderDAO.java              <-- DAO tương tác CSDL đơn hàng Chef
│       └── VillaFolioChargeDAO.java       <-- DAO tính phí vào Folio
│
├── controller/
│   ├── GuestMealSelectionController.java  <-- Servlet xử lý chọn món của Guest
│   ├── ChefDashboardController.java       <-- Servlet xử lý Dashboard cho Chef
│   └── RoomServiceOrderController.java    <-- Servlet xử lý gọi món A-la-carte
│
└── util/
    └── HealthDataMinimizationFilter.java  <-- Utility lọc dữ liệu PII theo BR-03
```

### 5.1 CSDL Data Dictionary Alignment (MySQL Tables)

```sql
-- BẢNG 1: ĐƠN HÀNG ẨM THỰC CHEF (MEAL_ORDER)
CREATE TABLE MEAL_ORDER (
    MealOrderID         INT AUTO_INCREMENT PRIMARY KEY,
    BookingID           INT NOT NULL,
    AccountID           INT NOT NULL,
    VillaID             INT NOT NULL,
    OrderType           VARCHAR(20) NOT NULL, -- 'PRE_SELECTED_PACKAGE', 'ROOM_SERVICE_ALACARTE'
    OrderStatus         VARCHAR(30) NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'PREPARING', 'READY_FOR_DELIVERY', 'DELIVERED'
    MealDate            DATE NOT NULL,
    MealType            VARCHAR(20) NOT NULL, -- 'BREAKFAST', 'LUNCH', 'DINNER'
    SanitizedAllergies  VARCHAR(512),         -- Chỉ chứa thông tin Dị ứng thực phẩm đã lọc
    SpecialDietaryNotes VARCHAR(512),         -- Yêu cầu ăn kiêng
    CreatedAt           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT FK_MealOrder_Booking FOREIGN KEY (BookingID) REFERENCES BOOKING(BookingID)
);

-- BẢNG 2: CHI TIẾT MÓN ĂN (MEAL_ORDER_ITEM)
CREATE TABLE MEAL_ORDER_ITEM (
    OrderItemID         INT AUTO_INCREMENT PRIMARY KEY,
    MealOrderID         INT NOT NULL,
    MenuItemID          INT NOT NULL,
    Quantity            INT NOT NULL DEFAULT 1,
    UnitPrice           DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    SubTotal            DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    CONSTRAINT FK_OrderItem_MealOrder FOREIGN KEY (MealOrderID) REFERENCES MEAL_ORDER(MealOrderID)
);
```

---

## 6. DYNAMIC MODELING (MÔ HÌNH ĐỘNG)

### Sơ đồ Luồng Xử lý Lọc Dữ liệu Bảo vệ PII cho Chef (UC17 & UC20 Flow)

```mermaid
sequenceDiagram
    autonumber
    actor C as Chef / F&B Staff
    participant CTRL as ChefDashboardController
    participant DAO as MealOrderDAO
    participant FILTER as HealthDataMinimizationFilter
    participant DB as MySQL Database

    C->>CTRL: GET /chef/dashboard (HTTP Request + Session Auth)
    CTRL->>CTRL: Validate Session & Verify Role == 'CHEF'
    CTRL->>DAO: listActiveMealOrders(todayDate)
    DAO->>DB: SELECT * FROM MEAL_ORDER JOIN GUEST_HEALTH_PROFILE...
    DB-->>DAO: ResultSet (Chứa cả PII y tế & FoodAllergies)
    DAO-->>CTRL: Raw Order Entities list
    CTRL->>FILTER: sanitizeForChefView(rawOrdersList)
    Note over FILTER: [BR-03 & BR-12 Data Minimization]<br/>Giữ lại: FoodAllergies, DietaryReqs<br/>ẨN HOÀN TOÀN: MedicalConditions, TherapyNotes
    FILTER-->>CTRL: List<ChefMealOrderDTO> (Dữ liệu an toàn)
    CTRL->>C: Forward to /WEB-INF/views/chef/meal-prep-dashboard.jsp
```

---

## 7. DOMAIN EVENT CATALOG

| Event Name | Trigger Condition | Payload Data | Subscribed Listeners |
|------------|-------------------|--------------|----------------------|
| `MealOrderSubmittedEvent` | Khách xác nhận chọn bữa hoặc gọi Room Service | `mealOrderId`, `villaId`, `orderType`, `sanitizedAllergies` | Chef Dashboard Notification Engine |
| `MealStatusUpdatedEvent` | Chef bấm cập nhật trạng thái chế biến | `mealOrderId`, `newStatus`, `updatedByChefId` | Guest Mobile/Web Status Push Service |
| `RoomServiceChargedEvent` | Đơn Room Service hoàn thành giao nhận | `bookingId`, `folioChargeId`, `amount`, `description` | Folio Billing Module (`VILLA_FOLIO_CHARGE`) |

---

## 8. INTERFACE SPECIFICATION (ĐẶC TẢ GIAO DIỆN VIEW)

Tuân thủ quy chuẩn `kebab-case.jsp` trong [`03-Design/Coding-Convention.md`](file:///c:/Users/PC/fal26-isp392-is2005-g1/03-Design/Coding-Convention.md):

| Screen ID | Screen Name | URL Mapping | View Template File | Authorized Role |
|-----------|-------------|-------------|--------------------|-----------------|
| `S-C01` | Màn hình Chọn thực đơn ngày (Guest) | `/guest/meal-selection` | `meal-selection-form.jsp` | `GUEST` |
| `S-C02` | Dashboard Danh sách Bữa ăn Bếp (Chef) | `/chef/dashboard` | `meal-prep-dashboard.jsp` | `CHEF`, `ADMIN` |
| `S-C03` | Màn hình Chi tiết Đơn ăn Chef View | `/chef/meal-orders/{id}` | `meal-order-detail-chef.jsp` | `CHEF`, `ADMIN` |
| `S-C04` | Màn hình Gọi món A-la-carte Room Service | `/guest/room-service` | `room-service-menu.jsp` | `GUEST` |

---

## 9. API SPECIFICATION

### 9.1 API 1: Chef View Active Meal Orders (Data Minimization Enforced)

- **HTTP Method & Endpoint:** `GET /api/v1/chef/meal-orders`
- **Headers:** `Authorization: Bearer <Chef_JWT_Token>`
- **Query Params:** `date=YYYY-MM-DD` (Default: Today), `status=PREPARING`
- **Response Success (200 OK):**
```json
{
  "statusCode": 200,
  "status": "SUCCESS",
  "data": [
    {
      "mealOrderId": 1052,
      "villaNumber": "VILLA-201",
      "mealType": "LUNCH",
      "orderStatus": "PREPARING",
      "orderedItems": [
        { "dishName": "Steamed Sea Bass with Herbs", "quantity": 2 }
      ],
      "sanitizedSafetyWarnings": {
        "foodAllergies": ["Peanuts", "Shellfish"],
        "dietaryPreferences": "Gluten-Free, Low-Sodium"
      },
      "dataMinimizationNotice": "BR-03 Enforced: Non-food medical profiles are hidden."
    }
  ]
}
```

---

## 10. BẢNG MÃ LỖI (ERROR CODES)

| Error Code | HTTP Status | Mô tả chi tiết | Hướng xử lý |
|------------|-------------|----------------|-------------|
| `ERR_POS_001` | 400 Bad Request | Đã quá giờ đăng ký thực đơn ngày | Báo khách chọn thực đơn bổ sung hoặc Room Service |
| `ERR_POS_002` | 403 Forbidden | Chef cố tình truy xuất dữ liệu y tế nhạy cảm PII | Chặn API và ghi log cảnh báo an ninh (`AUDIT_LOG`) |
| `ERR_POS_003` | 404 Not Found | Đơn hàng bữa ăn không tồn tại | Kiểm tra lại `mealOrderId` |
| `ERR_POS_004` | 500 Internal Error | Thất bại khi tích hợp phí vào Villa Folio CSDL | Rollback giao dịch CSDL, thử lại sau |

---

## 11. QUY TRÌNH TRIỂN KHAI (STEP-BY-STEP IMPLEMENTATION GUIDE)

### Bước 1: Tạo DTO Lọc Dữ liệu cho Chef View (`ChefMealOrderDTO.java`)

```java
package com.heavenstay.hswrms.model.dto;

import java.util.List;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 STANDARD]
// ----------------------------------------------------------------------------
// Requirement ID  : SR-15 / UC20 (Data Minimization cho Chef View)
// Business Rule   : BR-03 (Tối thiểu hóa dữ liệu PII - NĐ 356/2025/NĐ-CP)
// Compliance      : BR-12 (Chef View Isolation)
// Naming Convention: Google Java Style (UpperCamelCase DTO)
// ============================================================================
public class ChefMealOrderDTO {
    private int mealOrderId;
    private String villaNumber;
    private String mealType;
    private String orderStatus;
    private List<String> dishNames;
    private String foodAllergies;      // CHỈ CHỨA DỊ ỨNG THỰC PHẨM
    private String dietaryPreferences; // CHỈ CHỨA CHẾ ĐỘ ĂN KIÊNG

    // ❌ HOÀN TOÀN KHÔNG KHAI BÁO CÁC TRƯỜNG Y TẾ:
    // MedicalConditions, TherapyNotes, PhysicalLimitations, NationalID, EmergencyContact

    public ChefMealOrderDTO() {}

    // Getters and Setters lowerCamelCase...
    public int getMealOrderId() { return mealOrderId; }
    public void setMealOrderId(int mealOrderId) { this.mealOrderId = mealOrderId; }

    public String getVillaNumber() { return villaNumber; }
    public void setVillaNumber(String villaNumber) { this.villaNumber = villaNumber; }

    public String getMealType() { return mealType; }
    public void setMealType(String mealType) { this.mealType = mealType; }

    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }

    public List<String> getDishNames() { return dishNames; }
    public void setDishNames(List<String> dishNames) { this.dishNames = dishNames; }

    public String getFoodAllergies() { return foodAllergies; }
    public void setFoodAllergies(String foodAllergies) { this.foodAllergies = foodAllergies; }

    public String getDietaryPreferences() { return dietaryPreferences; }
    public void setDietaryPreferences(String dietaryPreferences) { this.dietaryPreferences = dietaryPreferences; }
}
```

### Bước 2: Viết Controller Điều phối Chef Dashboard (`ChefDashboardController.java`)

```java
package com.heavenstay.hswrms.controller;

import com.heavenstay.hswrms.model.dao.MealOrderDAO;
import com.heavenstay.hswrms.model.dto.ChefMealOrderDTO;
import com.heavenstay.hswrms.util.HealthDataMinimizationFilter;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;
import java.util.List;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 STANDARD]
// ----------------------------------------------------------------------------
// Requirement ID  : SR-15 / UC17 / UC20 (Dashboard Chế biến của Chef)
// Business Rule   : BR-03 (Bảo vệ PII & Phân quyền RBAC Chef)
// Web Route URL   : /chef/dashboard
// MVC Layer       : CONTROLLER LAYER
// ============================================================================
@WebServlet("/chef/dashboard")
public class ChefDashboardController extends HttpServlet {

    private final MealOrderDAO mealOrderDAO = new MealOrderDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {

        // TRUY VẾT BƯỚC 1: KIỂM TRA PHÂN QUYỀN VÀ ROLE CHEF
        HttpSession session = request.getSession(false);
        if (session == null || !"CHEF".equals(session.getAttribute("USER_ROLE"))) {
            // Cấm người không phải Chef truy cập
            response.sendError(HttpServletResponse.SC_FORBIDDEN, "Access Denied: Chef Authority Required.");
            return;
        }

        try {
            // TRUY VẾT BƯỚC 2: LẤY DANH SÁCH ĐƠN TỪ CSDL
            var rawOrders = mealOrderDAO.listActiveOrders();

            // TRUY VẾT BƯỚC 3: ÉP FILTER TỐI THIỂU HÓA DỮ LIỆU PII (BR-03)
            List<ChefMealOrderDTO> sanitizedChefOrders = HealthDataMinimizationFilter.sanitizeForChef(rawOrders);

            // TRUY VẾT BƯỚC 4: CHUYỂN DỮ LIỆU AN TOÀN CHO VIEW JSP
            request.setAttribute("chefOrders", sanitizedChefOrders);
            request.getRequestDispatcher("/WEB-INF/views/chef/meal-prep-dashboard.jsp").forward(request, response);

        } catch (Exception exception) {
            exception.printStackTrace();
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Error loading meal prep dashboard.");
        }
    }
}
```

---

## 12. ROLLBACK & INCIDENT RUNBOOK

| Sự cố (Incident) | Dấu hiệu phát hiện | Kịch bản Xử lý khẩn cấp (Runbook) | Rollback Trigger |
|------------------|---------------------|-----------------------------------|------------------|
| Rò rỉ thông tin y tế nhạy cảm | Chef DTO trả về chứa `medical_conditions` | Ngắt ngay API `/chef/dashboard`, bật cờ `FEATURE_FLAG_ENFORCE_STRICT_MINIMIZATION` | Nếu phát hiện > 0 lỗi PII leak trong log audit |
| Thất bại tích hợp phí Folio | Order A-la-carte không lưu được vào `VILLA_FOLIO_CHARGE` | Khôi phục trạng thái đơn về `PENDING_BILLING`, cảnh báo Lễ tân kiểm tra | Lỗi DB Transaction timeout |

---

## 13. KỊCH BẢN KIỂM THỬ CHI TIẾT INTEGRATION

*(Xem thêm file [HSWRMS_M03_TDD_Test_Specification.md](./HSWRMS_M03_TDD_Test_Specification.md) cho bộ Test Case TDD hoàn chỉnh)*

---

## 14. PHƯƠNG PHÁP XÁC MINH

1. **Static Analysis Inspection:** Chạy SonarQube kiểm tra không có câu lệnh SQL trong `.jsp` files.
2. **Automated Integration Test:** Chạy `npm test` / `mvn test` xác minh DTO của Chef loại bỏ 100% thuộc tính nhạy cảm.
3. **Audit Log Inspection:** Đảm bảo mọi truy cập Chef View được ghi nhận vào `AUDIT_LOG` với nhãn `TARGET_DATA_TYPE = 'FOOD_ALLERGY_MINIMIZED'`.

---

## 15. MẪU THỬ THỰC TẾ (API VERIFICATION SAMPLES)

### Verification Sample 1: Verifying Chef View Sanitized Payload

```bash
# Thực thi HTTP Request với Token của Chef:
curl -X GET "http://localhost:8080/hswrms/api/v1/chef/meal-orders" \
     -H "Authorization: Bearer CHEF_JWT_TOKEN_SAMPLE"
```

**KẾT QUẢ XÁC MINH AN TOÀN (SANITIZED PAYLOAD):**
```json
{
  "mealOrderId": 901,
  "villaNumber": "VILLA-102",
  "foodAllergies": "Severe Peanut & Lactose Intolerance",
  "dietaryPreferences": "Vegan",
  "medicalConditions": null,   // ✅ PHẢI LÀ NULL HOẶC KHÔNG TỒN TẠI
  "therapyNotes": null         // ✅ PHẢI LÀ NULL HOẶC KHÔNG TỒN TẠI
}
```

---

## 16. BẢNG TỔNG HỢP PHÂN QUYỀN (AUTHORIZATION MATRIX)

| Screen / API Route | Guest | Chef / F&B Staff | Receptionist | Admin |
|--------------------|:-----:|:----------------:|:------------:|:-----:|
| `POST /guest/meal-selection` | ✅ | ❌ | ❌ | ✅ |
| `GET /chef/dashboard` | ❌ | ✅ | ❌ | ✅ |
| `PUT /chef/meal-orders/{id}/status` | ❌ | ✅ | ❌ | ✅ |
| `POST /guest/room-service` (A-la-carte) | ✅ | ❌ | ✅ | ✅ |
| `GET /api/v1/full-health-profile` | ✅ (Chỉ hồ sơ mình) | ❌ **FORBIDDEN (BR-03)** | ❌ | ✅ |

---

## 17. AI PROMPT CONSTRAINTS (CASE 2.0 CORE)

> **Đóng góp cốt lõi của CASE 2.0.** Đoạn text dưới đây sẽ được **inject trực tiếp** vào AI prompt khi tạo code thực tế cho Module Restaurant POS & Room Service.

```text
Theo HSWRMS-POS-IMP-003 (Module Restaurant POS & Room Service):
1. PHẢI tuân thủ kiến trúc MVC và Quy chuẩn Lập trình Quốc tế (Google Java Style / Oracle JLS) trong `03-Design/Coding-Convention.md`.
2. PHẢI thực thi bộ lọc Tối thiểu hóa Dữ liệu BR-03: Mọi dữ liệu trả về cho Chef View (Màn hình Chế biến Bếp / Dashboard Chef) CHỈ ĐƯỢC CHỨA thông tin Dị ứng Thực phẩm (`FoodAllergies`) và Yêu cầu Ăn kiêng (`DietaryPreferences`). KHÔNG ĐƯỢC chứa Bệnh lý Y tế (`MedicalConditions`), Ghi chú Trị liệu (`TherapyNotes`), hoặc Căn cước công dân (`NationalID`).
3. KHÔNG ĐƯỢC phép gọi trực tiếp câu lệnh SQL từ file View JSP/HTML. Mọi truy vấn CSDL phải thông qua DAO (`MealOrderDAO`, `DailyMealSelectionDAO`).
4. PHẢI thực hiện giao dịch CSDL an toàn (ACID Transaction) khi Khách hàng đặt món Room Service A-la-carte: Thêm đơn hàng vào `MEAL_ORDER` và đồng thời ghi nhận khoản phí vào `VILLA_FOLIO_CHARGE`.
5. Mọi class và method phải bắt buộc có khối chú thích `[TRACEABILITY HEADER]` ghi rõ mã Yêu cầu (`SR-13`, `SR-14`, `SR-15`), Quy tắc Nghiệp vụ (`BR-03`, `BR-12`), và Bảng CSDL tương ứng.
```

---
*Tài liệu Đặc tả Kỹ thuật (Technical Specification) — Module 3 / Module 4: Restaurant POS & Room Service — System Architecture Team*
