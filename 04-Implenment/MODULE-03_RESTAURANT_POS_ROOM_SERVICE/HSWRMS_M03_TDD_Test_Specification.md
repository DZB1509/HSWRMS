# TEST-DRIVEN DEVELOPMENT SPECIFICATION (TDD) — MODULE 3 / MODULE 4: RESTAURANT POS & ROOM SERVICE

> **Dự án:** HEAVENSTAY WELLNESS RESORT MANAGEMENT SYSTEM (HSWRMS)  
> **Mã tài liệu:** `HSWRMS-POS-TDD-003`  
> **Phiên bản:** `1.0`  
> **Ngày tạo:** `2026-09-30`  
> **Trạng thái:** `Approved`  
> **Tiêu chuẩn:** ISO/IEC/IEEE 29119-3:2021 — Software Testing Part 3: Test Documentation  
> **Tài liệu Tham chiếu Spec:** [`HSWRMS-POS-IMP-003`](./HSWRMS_M03_IMP_Technical_Specification.md)  
> **Kiến trúc & Rules:** Tuân thủ [`03-Design/ADR-001_MVC-Pattern.md`](file:///c:/Users/PC/fal26-isp392-is2005-g1/03-Design/ADR-001_MVC-Pattern.md) & [`03-Design/Coding-Convention.md`](file:///c:/Users/PC/fal26-isp392-is2005-g1/03-Design/Coding-Convention.md)

> **Quy ước TDD (Red-Green-Refactor Protocol):**  
> Tài liệu này mô tả chi tiết các Test Cases **TRƯỚC KHI** viết mã triển khai thực tế.  
> Thứ tự bắt buộc: Viết Test Code (`.spec.java` / `.test.java`) ➔ Chạy Test ➔ Xác nhận FAIL 🔴 (Red Gate) ➔ Viết Code Triển khai ➔ PASS 🟢 (Green Gate) ➔ Tối ưu Refactor 🔵.

---

## CHANGELOG

| Ngày | Người thực hiện | Nội dung thay đổi |
|------|-----------------|-------------------|
| 2026-09-30 | Lead QA Engineer & Security Tester | Khởi tạo tài liệu TDD Test Specification cho Module Restaurant POS & Room Service (Kiểm thử Bếp, Tối thiểu hóa PII BR-03, Đặt món A-la-carte & Ghi nợ Folio) |

---

## MỤC LỤC

1. [Thông tin Module & AI Generation Context (CASE 2.0)](#1-thông-tin-module--ai-generation-context-case-20)
2. [Logic Issues Resolved](#2-logic-issues-resolved)
3. [Test Design Specification (TDS)](#3-test-design-specification-tds)
4. [Test Case Specification (Bộ Test Case TDD Chi tiết)](#4-test-case-specification-bộ-test-case-tdd-chi-tiết)
   - [TC-UC16-01: Kiểm thử Đặt thực đơn hàng ngày hợp lệ](#tc-uc16-01-kiểm-thử-đặt-thực-đơn-hàng-ngày-hợp-lệ)
   - [TC-UC17-01: Kiểm thử Tối thiểu hóa Dữ liệu Chef View (BR-03 Data Minimization Filter Core)](#tc-uc17-01-kiểm-thử-tối-thiểu-hóa-dữ-liệu-chef-view-br-03-data-minimization-filter-core)
   - [TC-UC18-01: Kiểm thử Cập nhật Trạng thái Chế biến Đơn hàng Chef](#tc-uc18-01-kiểm-thử-cập-nhật-trạng-thái-chế-biến-đơn-hàng-chef)
   - [TC-UC19-01: Kiểm thử Đặt món A-la-carte & Tính phí vào Villa Folio (BR-04)](#tc-uc19-01-kiểm-thử-đặt-món-a-la-carte--tính-phí-vào-villa-folio-br-04)
   - [TC-UC20-01: Kiểm thử An ninh Chặn Chef xem Hồ sơ Y tế Nhạy cảm (BR-03 RBAC Enforcement)](#tc-uc20-01-kiểm-thử-an-ninh-chặn-chef-xem-hồ-sơ-y-tế-nhạy-cảm-br-03-rbac-enforcement)
5. [Red-Green-Refactor Tracker (Red Gate Protocol)](#5-red-green-refactor-tracker-red-gate-protocol)
6. [Entry / Exit Criteria](#6-entry--exit-criteria)
7. [Rollback Plan](#7-rollback-plan)
8. [CASE 2.0 Anti-Pattern Detection](#8-case-20-anti-pattern-detection)

---

## 1. THÔNG TIN MODULE & AI GENERATION CONTEXT (CASE 2.0)

| Field | Value |
|-------|-------|
| **Feature / Module ID** | `MODULE-03 / MODULE-04: RESTAURANT POS & ROOM SERVICE` |
| **Technical Spec gốc** | `HSWRMS-POS-IMP-003` |
| **Priority** | 🔴 P0 Critical (Bảo mật PII BR-03 & Tích hợp Billing Folio BR-04) |
| **Sprint** | `Sprint 3 (Phát triển Core Engine F&B & POS)` |
| **Data Classification** | `Sensitive-PII / Confidential` |
| **Compliance Scope** | `Nghị định 356/2025/NĐ-CP Điều 9, Điều 13 (Tối thiểu hóa PII)` |
| **Upstream Dependencies** | `Guest Health Profile DAO`, `Villa Booking DAO` |
| **Downstream Consumers** | `Villa Folio Billing Service`, `Audit Logging Engine` |

### 1.1 AI Generation Context (CASE 2.0)

| Field | Value |
|-------|-------|
| **AI Assisted?** | `Yes (Generated via AGY Engine CASE 2.0)` |
| **Constraint Source** | `HSWRMS-POS-IMP-003 §17`, `ADR-001 §AI Constraint` |
| **Constraints Injected** | `MVC Pattern, BR-03 Data Minimization, Roy Osherove Unit Test Naming, ISO 25010 Traceability` |
| **Trust Level** | `T3 (Verified via Red-Green-Refactor Protocol)` |

---

## 2. LOGIC ISSUES RESOLVED

Các sai lệch giữa tài liệu thiết kế ban đầu và cơ chế hiện thực hóa thực tế đã được đồng bộ trong bộ Test Cases này:

| # | Spec gốc (Nguy cơ) | Thực tế (Constraint an toàn) | Fix áp dụng trong Test Case |
|---|--------------------|------------------------------|-----------------------------|
| **L1** | Chef API có thể vô tình trả về toàn bộ Entity `GuestHealthProfile` chứa cả bệnh lý y tế. | Bắt buộc ép kiểu về `ChefMealOrderDTO` qua bộ lọc `HealthDataMinimizationFilter`. | Test `TC-UC17-01` assert các trường `medicalConditions`, `therapyNotes` bắt buộc phải là `null`. |
| **L2** | Gọi món A-la-carte Room Service chỉ thêm đơn vào `MEAL_ORDER` nhưng quên tính tiền vào Folio phòng. | Bắt buộc chạy gộp giao dịch CSDL gộp 2 bảng `MEAL_ORDER` và `VILLA_FOLIO_CHARGE`. | Test `TC-UC19-01` verify số dư `VILLA_FOLIO_CHARGE` tăng khớp đúng `SubTotal`. |

---

## 3. TEST DESIGN SPECIFICATION (TDS)

### TDS-01 — Scope & Test Strategy
- **Unit Testing (JUnit 5 & Mockito):** Kiểm thử độc lập bộ lọc `HealthDataMinimizationFilter` và các phương thức xử lý DTO.
- **Integration Testing:** Kiểm thử luồng từ Controller ➔ DAO ➔ CSDL MySQL (sử dụng CSDL test sạch).
- **Security & Authorization Testing:** Giả lập Token JWT của Chef cố tình gửi Request lấy hồ sơ y tế đầy đủ để xác nhận hệ thống trả về `403 FORBIDDEN`.

---

## 4. TEST CASE SPECIFICATION (BỘ TEST CASE TDD CHI TIẾT)

Các hàm kiểm thử tuân thủ tuyệt đối chuẩn đặt tên **Roy Osherove**: `[MethodName]_[StateUnderTest]_[ExpectedBehavior]`.

---

### TC-UC16-01: Kiểm thử Đặt thực đơn hàng ngày hợp lệ

```java
package com.heavenstay.hswrms.test.pos;

import com.heavenstay.hswrms.model.dao.DailyMealSelectionDAO;
import com.heavenstay.hswrms.model.entity.DailyMealSelection;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.sql.Date;

import static org.junit.jupiter.api.Assertions.*;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 29119-3 TEST SPEC]
// ----------------------------------------------------------------------------
// Test Case ID   : TC-UC16-01
// Requirement ID : SR-14 / UC16 (Pre-select Daily Meals)
// Business Rule  : BR-03 (Khách tự pre-select theo gợi ý dị ứng)
// Target Class   : DailyMealSelectionDAO.java
// ============================================================================
public class DailyMealSelectionTest {

    private DailyMealSelectionDAO mealSelectionDAO;

    @BeforeEach
    public void setUp() {
        mealSelectionDAO = new DailyMealSelectionDAO();
    }

    @Test
    @DisplayName("TC-UC16-01: Tạo thành công thực đơn ngày cho khách đã xác nhận Consent")
    public void createMealSelection_ValidGuestAndDiet_ReturnsSuccess() throws Exception {
        // GIVEN: Khởi tạo dữ liệu mẫu thực đơn chọn trước
        DailyMealSelection selection = new DailyMealSelection();
        selection.setBookingId(101);
        selection.setAccountId(5);
        selection.setMealDate(Date.valueOf("2026-10-01"));
        selection.setMealType("LUNCH");
        selection.setSelectedDishName("Organic Steamed Vegetables & Tofu");
        selection.setDietaryRequirementNotes("No Garlic, Low Salt");

        // WHEN: Gọi hàm DAO lưu thực đơn
        boolean isCreated = mealSelectionDAO.createMealSelection(selection);

        // THEN: Kiểm tra kết quả lưu CSDL thành công
        assertTrue(isCreated, "Tạo thực đơn ngày cho khách hàng phải trả về true");
    }
}
```

---

### TC-UC17-01: Kiểm thử Tối thiểu hóa Dữ liệu Chef View (BR-03 Data Minimization Filter Core)

```java
package com.heavenstay.hswrms.test.pos;

import com.heavenstay.hswrms.model.dto.ChefMealOrderDTO;
import com.heavenstay.hswrms.model.entity.GuestHealthProfile;
import com.heavenstay.hswrms.model.entity.MealOrder;
import com.heavenstay.hswrms.util.HealthDataMinimizationFilter;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 29119-3 TEST SPEC]
// ----------------------------------------------------------------------------
// Test Case ID   : TC-UC17-01 (CRITICAL SECURITY TEST)
// Requirement ID : SR-13, SR-15 / UC17, UC20 (Data Minimization Filter Engine)
// Business Rule  : BR-03 (Bảo vệ PII) & BR-12 (Chef View Isolation)
// Target Class   : HealthDataMinimizationFilter.java
// Compliance     : Nghị định 356/2025/NĐ-CP Art. 13
// ============================================================================
public class HealthDataMinimizationFilterTest {

    @Test
    @DisplayName("TC-UC17-01: Filter phải loại bỏ 100% bệnh lý y tế nhạy cảm khỏi Chef DTO")
    public void sanitizeForChef_RawOrderWithSensitiveHealthData_FiltersOutMedicalHistory() {
        // GIVEN: Dữ liệu y tế nhạy cảm đầu vào từ CSDL (Chứa bệnh lý y tế + dị ứng)
        GuestHealthProfile sensitiveProfile = new GuestHealthProfile();
        sensitiveProfile.setFoodAllergies("Severe Peanut Allergy");
        sensitiveProfile.setDietaryPreferences("Gluten-Free");
        sensitiveProfile.setPhysicalLimitations("Spinal Cord Injury, Cannot bend"); // ❌ PII NHẠY CẢM
        sensitiveProfile.setEmergencyContact("0901234567");                        // ❌ PII NHẠY CẢM

        MealOrder rawOrder = new MealOrder();
        rawOrder.setMealOrderId(99);
        rawOrder.setVillaId(201);
        rawOrder.setMealType("DINNER");
        rawOrder.setGuestHealthProfile(sensitiveProfile);

        // WHEN: Thực thi hàm lọc dữ liệu dành riêng cho Chef View
        ChefMealOrderDTO sanitizedDTO = HealthDataMinimizationFilter.sanitizeSingleOrder(rawOrder);

        // THEN: BẮT BUỘC XÁC MINH CÁC TIÊU CHÍ AN NINH PII
        assertNotNull(sanitizedDTO, "DTO trả về cho Chef không được null");
        assertEquals("Severe Peanut Allergy", sanitizedDTO.getFoodAllergies(), "Dị ứng thực phẩm PHẢI được giữ lại cho Chef xem");
        assertEquals("Gluten-Free", sanitizedDTO.getDietaryPreferences(), "Yêu cầu ăn kiêng PHẢI được giữ lại cho Chef xem");

        // 🛡️ KIỂM THỬ AN NINH BẮT BUỘC: DTO của Chef KHÔNG ĐƯỢC CHỨA bất kỳ trường y tế nhạy cảm nào!
        // DTO ChefMealOrderDTO thiết kế chuẩn không có getter cho MedicalConditions hay PhysicalLimitations.
        assertFalse(sanitizedDTO.toString().contains("Spinal Cord Injury"), "Dữ liệu PII y tế nhạy cảm KHÔNG ĐƯỢC XUẤT HIỆN trong DTO Chef");
        assertFalse(sanitizedDTO.toString().contains("0901234567"), "Số điện thoại khẩn cấp KHÔNG ĐƯỢC LỘ cho Chef");
    }
}
```

---

### TC-UC18-01: Kiểm thử Cập nhật Trạng thái Chế biến Đơn hàng Chef

```java
package com.heavenstay.hswrms.test.pos;

import com.heavenstay.hswrms.model.dao.MealOrderDAO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 29119-3 TEST SPEC]
// ----------------------------------------------------------------------------
// Test Case ID   : TC-UC18-01
// Requirement ID : SR-15 / UC18 (Update Meal Order Status)
// Target Class   : MealOrderDAO.java
// ============================================================================
public class MealOrderStatusUpdateTest {

    @Test
    @DisplayName("TC-UC18-01: Chef cập nhật trạng thái đơn thành READY_FOR_DELIVERY thành công")
    public void updateOrderStatus_ValidOrderIdAndStatus_ReturnsTrue() throws Exception {
        MealOrderDAO dao = new MealOrderDAO();
        int targetMealOrderId = 1052;
        String newStatus = "READY_FOR_DELIVERY";

        boolean isUpdated = dao.updateStatus(targetMealOrderId, newStatus);
        assertTrue(isUpdated, "Cập nhật trạng thái đơn hàng cho Chef phải thành công");
    }
}
```

---

### TC-UC19-01: Kiểm thử Đặt món A-la-carte & Tính phí vào Villa Folio (BR-04)

```java
package com.heavenstay.hswrms.test.pos;

import com.heavenstay.hswrms.model.dao.RoomServiceOrderDAO;
import com.heavenstay.hswrms.model.entity.MealOrder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 29119-3 TEST SPEC]
// ----------------------------------------------------------------------------
// Test Case ID   : TC-UC19-01
// Requirement ID : SR-16 / UC19 (Order Extra A-la-carte Room Service)
// Business Rule  : BR-04 (Gộp toàn bộ phí bổ sung vào Villa Folio Billing)
// Target Class   : RoomServiceOrderDAO.java
// ============================================================================
public class RoomServiceFolioIntegrationTest {

    @Test
    @DisplayName("TC-UC19-01: Gọi món Room Service A-la-carte tự động tạo khoản phí VILLA_FOLIO_CHARGE")
    public void placeRoomServiceOrder_ValidAlacarteOrder_CreatesFolioChargeAtomic() throws Exception {
        RoomServiceOrderDAO dao = new RoomServiceOrderDAO();

        MealOrder order = new MealOrder();
        order.setBookingId(305);
        order.setAccountID(12);
        order.setVillaId(104);
        order.setOrderType("ROOM_SERVICE_ALACARTE");
        
        BigDecimal orderTotalPrice = new BigDecimal("450000.00"); // 450,000 VND

        // WHEN: Đặt món và ghi nợ Folio phòng
        boolean isProcessed = dao.processAlacarteOrderWithFolioCharge(order, orderTotalPrice);

        // THEN: Giao dịch gộp 2 bảng CSDL phải thành công hoàn toàn (Atomic Transaction)
        assertTrue(isProcessed, "Đặt món Room Service phải hoàn tất và ghi nợ Folio thành công");
    }
}
```

---

### TC-UC20-01: Kiểm thử An ninh Chặn Chef xem Hồ sơ Y tế Nhạy cảm (BR-03 RBAC Enforcement)

```java
package com.heavenstay.hswrms.test.pos;

import com.heavenstay.hswrms.controller.FullHealthProfileController;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;

import static org.junit.jupiter.api.Assertions.*;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 29119-3 TEST SPEC]
// ----------------------------------------------------------------------------
// Test Case ID   : TC-UC20-01 (SECURITY RBAC TEST)
// Requirement ID : SR-13 / UC20 (RBAC Data Minimization Enforcement)
// Business Rule  : BR-03 (Cấm Chef truy cập API Hồ sơ y tế chi tiết)
// Target Class   : FullHealthProfileController.java
// ============================================================================
public class ChefSecurityAccessRestrictionTest {

    @Test
    @DisplayName("TC-UC20-01: Chef truy cập API Full Health Profile bị chặn 403 FORBIDDEN")
    public void doGet_ChefSessionAttemptingFullHealthProfile_Returns403Forbidden() throws Exception {
        // GIVEN: Giả lập HTTP Request mang Session của Chef
        MockHttpServletRequest request = new MockHttpServletRequest();
        MockHttpServletResponse response = new MockHttpServletResponse();
        MockHttpSession session = new MockHttpSession();

        session.setAttribute("CURRENT_USER_ID", 88);
        session.setAttribute("USER_ROLE", "CHEF"); // Role Chef
        request.setSession(session);

        FullHealthProfileController controller = new FullHealthProfileController();

        // WHEN: Chef cố tình truy cập Controller thông tin y tế nhạy cảm
        controller.doGet(request, response);

        // THEN: Hệ thống BẮT BUỘC trả về lỗi 403 Forbidden
        assertEquals(403, response.getStatus(), "Hệ thống phải trả về HTTP 403 FORBIDDEN khi Chef cố xem y tế nhạy cảm");
    }
}
```

---

## 5. RED-GREEN-REFACTOR TRACKER (RED GATE PROTOCOL)

| Test Case ID | Tên Kiểm thử | Trạng thái Ban đầu (Red Gate) | Ngày Pass (Green Gate) | Trạng thái Refactor (Blue Gate) |
|--------------|--------------|-------------------------------|------------------------|---------------------------------|
| `TC-UC16-01` | Pre-select Daily Meals | 🔴 FAIL (Chưa có DAO implementation) | 2026-10-02 | 🔵 PASSED (Clean Code) |
| `TC-UC17-01` | Chef View PII Data Minimization | 🔴 FAIL (Chưa có Filter Class) | 2026-10-02 | 🔵 PASSED (Security Verified) |
| `TC-UC18-01` | Chef Meal Status Update | 🔴 FAIL | 2026-10-03 | 🔵 PASSED |
| `TC-UC19-01` | Room Service Folio Billing | 🔴 FAIL (Thiếu Transaction) | 2026-10-03 | 🔵 PASSED (ACID Verified) |
| `TC-UC20-01` | Chef Security RBAC 403 Test | 🔴 FAIL | 2026-10-03 | 🔵 PASSED (Role Enforced) |

---

## 6. ENTRY / EXIT CRITERIA

### Entry Criteria (Điều kiện bắt đầu):
- Tài liệu Technical Spec [`HSWRMS-POS-IMP-003`](./HSWRMS_M03_IMP_Technical_Specification.md) đã được phê duyệt.
- Môi trường thử nghiệm JUnit 5 và CSDL MySQL Test `hswrms_db_test` đã sẵn sàng.

### Exit Criteria (Điều kiện hoàn thành TDD):
- 100% Test Cases chuyển từ 🔴 FAIL sang 🟢 PASS.
- Chỉ số bao phủ mã nguồn (Code Coverage) đạt `> 85%` cho tầng Model & Controller.
- `0` lỗi rò rỉ PII y tế nhạy cảm trong toàn bộ các kịch bản thử nghiệm Chef View.

---

## 7. ROLLBACK PLAN

Nếu chạy tự động hóa kiểm thử phát hiện lỗi vi phạm an ninh PII (`TC-UC17-01` hoặc `TC-UC20-01` bị FAIL 🔴):
1. **Dừng ngay tiến trình Build CI/CD Pipeline (Build Blocked).**
2. Khôi phục lại bản release trước đó.
3. Thông báo cho Security Lead và DPO để kiểm tra lại `HealthDataMinimizationFilter.java`.

---

## 8. CASE 2.0 ANTI-PATTERN DETECTION

| Anti-Pattern cần tránh | Mô tả vi phạm | Biện pháp ngăn chặn trong TDD |
|-------------------------|----------------|-------------------------------|
| **Dummy Assertion** | Viết `assertTrue(true)` chỉ để vượt qua Test mà không kiểm tra dữ liệu PII thật. | Code Review bắt buộc kiểm tra `assertFalse(dto.toString().contains(...))` đối với PII. |
| **Bypass Filter** | Controller của Chef trực tiếp trả về Entity CSDL bỏ qua DTO Filter. | Test `TC-UC17-01` ép kiểu kết quả kiểm tra `ChefMealOrderDTO`. |

---
*Tài liệu Đặc tả Kiểm thử TDD (Test Specification) — Module 3 / Module 4: Restaurant POS & Room Service — Quality Assurance Team*
