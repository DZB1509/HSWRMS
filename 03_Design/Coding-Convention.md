# CHUẨN LẬP TRÌNH QUỐC TẾ & CODE TRUY VẾT (INTERNATIONAL CODING CONVENTIONS & CODE TRACEABILITY)

> **Dự án:** HEAVENSTAY WELLNESS RESORT MANAGEMENT SYSTEM (HSWRMS)  
> **Mã tài liệu:** `DOC-HSWRMS-DES-CODING-CONVENTION-v2.0`  
> **Phân nhóm tài liệu:** `03-Design` — Thiết kế Mã nguồn & Quy chuẩn Kỹ thuật  
> **Cơ sở Tiêu chuẩn Quốc tế (International Standards Baseline):**  
> - 📘 **Oracle Java Code Conventions** (Java Language Specification - JLS)  
> - 📗 **Google Java Style Guide** (Google Engineering Standard)  
> - 📕 **Clean Code Standard** (Robert C. Martin / Agile Software Development)  
> - 📙 **RESTful API Design Standard** (RFC 3986 / OpenAPI 3.0 Standard)  
> - 📓 **ANSI/ISO SQL Naming Standard** (ISO/IEC 9075)  
> - 📑 **ISO/IEC 25010** (Software Product Quality — Maintainability & Traceability)  
> **Đối tượng sử dụng:** Lập trình viên, Kiểm thử viên (QA/QC), Business Analyst (BA), Project Manager (PM), và Stakeholder không chuyên về code.

---

## MỤC LỤC

1. [Cơ sở Tiêu chuẩn Quốc tế về Quy tắc Đặt tên](#1-cơ-sở-tiêu-chuẩn-quốc-tế-về-quy-tắc-đặt-tên)
2. [Quy tắc Đặt tên Quốc tế Chi tiết (Naming Conventions Breakdown)](#2-quy-tắc-đặt-tên-quốc-tế-chi-tiết-naming-conventions-breakdown)
   - [2.1 Tên Gói Java (Java Package Naming)](#21-tên-gói-java-java-package-naming)
   - [2.2 Tên Lớp, Giao diện & Enum (Class, Interface & Enum Naming)](#22-tên-lớp-giao-diện--enum-class-interface--enum-naming)
   - [2.3 Tên Phương thức & Hàm (Method Naming)](#23-tên-phương-thức--hàm-method-naming)
   - [2.4 Tên Biến & Tham số (Variable & Parameter Naming)](#24-tên-biến--tham-số-variable--parameter-naming)
   - [2.5 Tên Hằng số (Constant Naming)](#25-tên-hằng-số-constant-naming)
   - [2.6 Tên Bảng & Cột CSDL (Database Naming)](#26-tên-bảng--cột-csdl-database-naming)
   - [2.7 Tên Màn hình View & Asset (JSP/HTML/CSS/JS Naming)](#27-tên-màn-hình-view--asset-jsphtmlcssjs-naming)
   - [2.8 Tên Đường dẫn REST API (URL Route Naming)](#28-tên-đường-dẫn-rest-api-url-route-naming)
   - [2.9 Tên Hàm Kiểm thử Đơn vị (Unit Test Naming)](#29-tên-hàm-kiểm-thử-đơn-vị-unit-test-naming)
3. [Tích hợp Chuẩn Code Truy Vết Quốc tế (ISO/IEC 25010 Traceability)](#3-tích-hợp-chuẩn-code-truy-vết-quốc-tế-isoiec-25010-traceability)
4. [Bộ Mã Nguồn Mẫu Chuẩn Quốc tế & Truy Vết Thực Tế](#4-bộ-mã-nguồn-mẫu-chuẩn-quốc-tế--truy-vết-thực-tế)
   - [4.1 Tầng Model: DAO / Repository (`GuestHealthProfileDAO.java`)](#41-tầng-model-dao--repository-guesthealthprofiledaojava)
   - [4.2 Tầng Controller (`HealthProfileController.java`)](#42-tầng-controller-healthprofilecontrollerjava)
   - [4.3 Tầng View (`health-profile-view.jsp`)](#43-tầng-view-health-profile-viewjsp)
5. [Ma trận Đối soát Quy chuẩn Đặt tên (Naming Matrix Cheatsheet)](#5-ma-trận-đối-soát-quy-chuẩn-đặt-tên-naming-matrix-cheatsheet)

---

## 1. CƠ SỞ TIÊU CHUẨN QUỐC TẾ VỀ QUY TẮC ĐẶT TÊN

Việc tuân thủ **Quy chuẩn Lập trình Quốc tế (International Coding Conventions)** giúp mã nguồn dự án HSWRMS đạt các chỉ số chất lượng phần mềm cao nhất theo tiêu chuẩn **ISO/IEC 25010**:
- **Tính Dễ bảo trì (Maintainability):** Code nhất quán, cấu trúc dự đoán được, bất kỳ lập trình viên quốc tế nào cũng có thể đọc hiểu ngay lập tức.
- **Tính Dễ kiểm thử (Testability):** Đặt tên hàm và lớp rõ nghĩa giúp tự động hóa Unit Test dễ dàng.
- **Tính Khả truy vết (Traceability):** Kết nối chặt chẽ từng dòng mã với Yêu cầu Nghiệp vụ (SRS/BR) và Sơ đồ CSDL (ERD).

---

## 2. QUY TẮC ĐẶT TÊN QUỐC TẾ CHI TIẾT (NAMING CONVENTIONS BREAKDOWN)

### 2.1 Tên Gói Java (Java Package Naming)
- **Tiêu chuẩn:** `Oracle Java Code Conventions` & `Google Java Style Guide Section 5.2.1`.
- **Quy tắc:** Viết chữ **hoàn toàn thường (all lowercase)**, không dùng dấu gạch dưới `_`, không dùng chữ viết hoa. Bắt đầu bằng tên miền đảo ngược của tổ chức.
- **Cấu trúc:** `com.heavenstay.hswrms.[module].[layer]`

| Package Chuẩn Quốc tế | Mục đích / Tầng MVC |
|-----------------------|---------------------|
| `com.heavenstay.hswrms.model.entity` | Chứa các đối tượng Entity đại diện cho bảng CSDL MySQL |
| `com.heavenstay.hswrms.model.dao` | Chứa lớp Data Access Object (tương tác trực tiếp SQL) |
| `com.heavenstay.hswrms.service` | Chứa logic nghiệp vụ xử lý trung gian, mã hóa dữ liệu |
| `com.heavenstay.hswrms.controller` | Chứa các Servlet/Controller điều phối yêu cầu HTTP |
| `com.heavenstay.hswrms.util` | Chứa các công cụ hỗ trợ dùng chung (Mã hóa, Security, Database) |
| `com.heavenstay.hswrms.dto` | Chứa đối tượng chuyển giao dữ liệu (Data Transfer Object) |

---

### 2.2 Tên Lớp, Giao diện & Enum (Class, Interface & Enum Naming)
- **Tiêu chuẩn:** `UpperCamelCase` (PascalCase) theo `Google Java Style Guide Section 5.2.2`.
- **Quy tắc:** Chữ cái đầu của mỗi từ đều viết hoa. Sử dụng Danh từ hoặc Cụm danh từ. Không sử dụng dấu gạch dưới `_`.

| Thành phần | Quy tắc Đặt tên | Ví dụ Đúng | Ví dụ Sai (Vi phạm) |
|------------|-----------------|------------|---------------------|
| **Entity Class** | `[DanhTừKhớpVỚiBảngCSDL]` | `GuestHealthProfile.java`, `RetreatPackage.java` | `guest_health_profile.java`, `guesthealthprofile.java` |
| **DAO Class** | `[Entity]DAO` hoặc `[Entity]Repository` | `GuestHealthProfileDAO.java`, `AccountDAO.java` | `GuestHealthProfileDaoImpl.java` (thừa Impl nếu không có Interface) |
| **Service Class** | `[Feature]Service` | `HealthProfileService.java`, `BookingService.java` | `healthService.java` |
| **Controller Class**| `[Feature]Controller` | `HealthProfileController.java`, `BookingController.java` | `HealthProfileServlet.java` (nên dùng Controller theo chuẩn MVC) |
| **Enum Class** | `[DanhTừKháiNiệm]` | `AccountStatus.java`, `BookingState.java` | `account_status_enum.java` |
| **Custom Exception**| `[MôTảLỗi]Exception` | `ResourceNotFoundException.java`, `InvalidConsentException.java` | `CustomError.java` |

---

### 2.3 Tên Phương thức & Hàm (Method Naming)
- **Tiêu chuẩn:** `lowerCamelCase` theo `Google Java Style Guide Section 5.2.3` & `Clean Code Chapter 2`.
- **Quy tắc:** Chữ cái đầu tiên viết thường, các chữ cái đầu của từ tiếp theo viết hoa. Bắt đầu bằng một **Động từ (Verb)** mô tả rõ hành động.

| Loại Hành động | Tiền tố (Prefix) | Ví dụ Phương thức Chuẩn | Giải thích Nghiệp vụ |
|----------------|------------------|-------------------------|-----------------------|
| **Truy vấn lấy dữ liệu** | `get...` / `find...` | `getProfileByAccountId(int accountId)` | Lấy 1 đối tượng theo khóa |
| **Truy vấn danh sách** | `list...` / `search...` | `listActivePackagesByGoal(String goal)` | Trả về Danh sách (List) |
| **Kiểm tra trạng thái (Boolean)** | `is...` / `has...` / `can...` | `isConsentGiven()`, `hasUnpaidFolioCharges()` | Trả về `true` / `false` |
| **Tạo mới dữ liệu** | `create...` / `save...` | `createGuestHealthProfile(GuestHealthProfile profile)` | Thêm mới vào CSDL |
| **Cập nhật dữ liệu** | `update...` | `updateConsentStatus(int accountId, boolean status)` | Sửa dữ liệu đã có |
| **Xóa / Hủy dữ liệu** | `delete...` / `cancel...` | `deleteHealthDataByRequest(int accountId)` | Xóa hoặc vô hiệu hóa |

---

### 2.4 Tên Biến & Tham số (Variable & Parameter Naming)
- **Tiêu chuẩn:** `lowerCamelCase` theo `Oracle Java Conventions Section 9`.
- **Quy tắc:** Đặt tên rõ nghĩa, thể hiện đúng bản chất dữ liệu. **Tuyệt đối KHÔNG** dùng tên biến 1 ký tự (như `x`, `y`, `p`, `a`) ngoại trừ biến đếm vòng lặp (`i`, `j`, `k`).

```java
// ❌ VI PHẠM CHUẨN QUỐC TẾ (Code tối nghĩa, khó bảo trì):
GuestHealthProfile p = dao.get(a);
String s = p.getF();
boolean c = p.isC();

// ✅ CHUẨN QUỐC TẾ GOOGLE & CLEAN CODE (Rõ ràng, tường minh):
GuestHealthProfile guestProfile = healthProfileDAO.getProfileByAccountId(currentAccountId);
String encryptedFoodAllergies = guestProfile.getFoodAllergies();
boolean isConsentConfirmed = guestProfile.isConsentGiven();
```

---

### 2.5 Tên Hằng số (Constant Naming)
- **Tiêu chuẩn:** `UPPER_SNAKE_CASE` (Constant Naming Convention).
- **Quy tắc:** Tất cả ký tự viết hoa, các từ phân cách bằng dấu gạch dưới `_`. Bắt buộc phải có từ khóa `static final`.

```java
public class SecurityConstants {
    // ✅ CHUẨN QUỐC TẾ:
    public static final String AES_ENCRYPTION_ALGORITHM = "AES/GCM/NoPadding";
    public static final int MAX_FAILED_LOGIN_ATTEMPTS = 5;
    public static final int OTP_EXPIRATION_MINUTES = 10;
    public static final String COMPLIANCE_REGULATION = "Decree-356/2025/ND-CP";
}
```

---

### 2.6 Tên Bảng & Cột CSDL (Database Naming)
- **Tiêu chuẩn:** `ANSI SQL / ISO 9075` Standard.
- **Quy tắc:** 
  - **Tên Bảng:** Viết hoa toàn bộ `UPPER_SNAKE_CASE`, ở dạng Danh từ số ít hoặc số nhiều có ý nghĩa. Khớp 100% với file `HSWRMS_ERD_DataDictionary.md`.
  - **Tên Cột (Column):** Viết theo `UpperCamelCase` (hoặc `UPPER_SNAKE_CASE` theo ERD quy định). Khóa chính kết thúc bằng `ID`.

```sql
-- ✅ BẢNG CSDL MYSQL THEO CHUẨN ERD HSWRMS:
CREATE TABLE GUEST_HEALTH_PROFILE (
    HealthProfileID       INT AUTO_INCREMENT PRIMARY KEY,
    AccountID             INT NOT NULL,
    DietaryPreferences   VARCHAR(255),
    FoodAllergies        VARCHAR(512), -- Lưu trữ mã hóa AES-256 (PII)
    PhysicalLimitations  VARCHAR(512),
    TherapyPreferences   VARCHAR(255),
    EmergencyContact     VARCHAR(100),
    ConsentGiven         BOOLEAN DEFAULT FALSE,
    ConsentTimestamp     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ConsentVersion       VARCHAR(20),
    CONSTRAINT FK_HealthProfile_Account FOREIGN KEY (AccountID) REFERENCES ACCOUNT(AccountID)
);
```

---

### 2.7 Tên Màn hình View & Asset (JSP/HTML/CSS/JS Naming)
- **Tiêu chuẩn:** `kebab-case` (chữ thường nối bằng dấu gạch ngang) theo Web URL Best Practices.

| Loại File Asset | Quy tắc Đặt tên | Ví dụ File Chuẩn |
|-----------------|-----------------|------------------|
| **File View JSP** | `[feature]-[action].jsp` | `health-profile-view.jsp`, `health-profile-edit.jsp` |
| **File CSS Style** | `[module-name].css` | `health-profile.css`, `booking-wizard.css` |
| **File JavaScript**| `[module-name].js` | `health-profile-validation.js`, `vnpay-checkout.js` |

---

### 2.8 Tên Đường dẫn REST API (URL Route Naming)
- **Tiêu chuẩn:** `RFC 3986` / `RESTful API Guidelines`.
- **Quy tắc:** Sử dụng Danh từ số nhiều (Plural Nouns), dạng `kebab-case`, không dùng Động từ trong URL route.

```text
❌ VI PHẠM: /getGuestHealthProfile?id=5
❌ VI PHẠM: /api/update_health_profile/5

✅ CHUẨN QUỐC TẾ RESTful:
GET    /api/v1/guests/{accountId}/health-profile   (Lấy thông tin hồ sơ sức khỏe)
PUT    /api/v1/guests/{accountId}/health-profile   (Cập nhật thông tin hồ sơ sức khỏe)
POST   /api/v1/guests/{accountId}/health-profile/consent (Cập nhật đồng ý Consent)
```

---

### 2.9 Tên Hàm Kiểm thử Đơn vị (Unit Test Naming)
- **Tiêu chuẩn:** `Roy Osherove Naming Standard` (`[MethodName]_[StateUnderTest]_[ExpectedBehavior]`).

```java
@Test
public void getProfileByAccountId_ValidAccountId_ReturnsDecryptedProfile() {
    // Test case kiểm thử hàm lấy hồ sơ sức khỏe thành công
}

@Test
public void getProfileByAccountId_NonExistingAccountId_ReturnsNull() {
    // Test case kiểm thử tài khoản không tồn tại
}
```

---

## 3. TÍCH HỢP CHUẨN CODE TRUY VẾT QUỐC TẾ (ISO/IEC 25010 TRACEABILITY)

Để đáp ứng cả hai mục tiêu: **Tuân thủ Chuẩn Quốc tế** AND **Giúp người không chuyên code (BA/QA/Manager) truy vết dễ dàng**, mọi file mã nguồn Java/JSP bắt buộc chứa khối chú thích **Traceability Header Block** theo chuẩn ISO 25010 ở ngay đầu file và đầu mỗi phương thức nghiệp vụ:

```java
// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 MAINTAINABILITY & TRACEABILITY STANDARD]
// ----------------------------------------------------------------------------
// Requirements Ref : US-REC-002 / SR-03 / UC02 (Quản lý Hồ sơ Sức khỏe Khách hàng)
// Business Rule Ref: BR-03 (Bắt buộc Khách hàng Xác nhận Explicit Consent cho PII)
// Database Entity  : GUEST_HEALTH_PROFILE (Tài liệu HSWRMS Data Dictionary v1.0)
// Compliance Standard: Nghị định 356/2025/NĐ-CP (Personal Data Protection)
// Architecture Layer: MODEL LAYER -> Data Access Object (DAO)
// International Standard: Oracle Java Code Conventions & Google Java Style Guide
// ============================================================================
```

---

## 4. BỘ MÃ NGUỒN MẪU CHUẨN QUỐC TẾ & TRUY VẾT THỰC TẾ

### 4.1 Tầng Model: DAO / Repository (`GuestHealthProfileDAO.java`)

**File Path:** `src/main/java/com/heavenstay/hswrms/model/dao/GuestHealthProfileDAO.java`

```java
package com.heavenstay.hswrms.model.dao;

import com.heavenstay.hswrms.model.entity.GuestHealthProfile;
import com.heavenstay.hswrms.util.AESEncryptionUtil;
import com.heavenstay.hswrms.util.DBConnection;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 STANDARD]
// ----------------------------------------------------------------------------
// Requirement ID  : SR-03 / UC02 (Quản lý Hồ sơ Sức khỏe Khách hàng)
// Business Rule   : BR-03 (Bắt buộc Xác nhận Consent đối với dữ liệu PII)
// Database Entity : GUEST_HEALTH_PROFILE (Data Dictionary v1.0)
// Compliance Scope: Nghị định 356/2025/NĐ-CP (Mã hóa PII nhạy cảm AES-256)
// MVC Layer       : MODEL LAYER (Data Access Object - DAO)
// Naming Style    : Google Java Style Guide & Oracle Conventions (PascalCase Class)
// ============================================================================
public class GuestHealthProfileDAO {

    /**
     * TRUY VẾT CODE (ISO 25010): Hàm truy vấn hồ sơ sức khỏe theo ID tài khoản
     * 
     * @param accountId Mã định danh tài khoản khách hàng (AccountID)
     * @return Đối tượng GuestHealthProfile chứa dữ liệu đã giải mã PII
     * @throws Exception Lỗi kết nối CSDL hoặc giải mã thất bại
     */
    public GuestHealthProfile getProfileByAccountId(int accountId) throws Exception {
        
        // [TRACEABILITY LINE 1 - SQL Query Alignment]:
        // Câu lệnh SQL tuân thủ ANSI SQL Standard, đọc trực tiếp bảng GUEST_HEALTH_PROFILE
        String sqlQuery = "SELECT HealthProfileID, AccountID, DietaryPreferences, FoodAllergies, " +
                          "PhysicalLimitations, TherapyPreferences, EmergencyContact, " +
                          "ConsentGiven, ConsentTimestamp, ConsentVersion " +
                          "FROM GUEST_HEALTH_PROFILE WHERE AccountID = ?";

        GuestHealthProfile guestProfile = null;

        // [TRACEABILITY LINE 2 - Resource Management]:
        // Mở kết nối CSDL sử dụng try-with-resources (AutoCloseable theo chuẩn Oracle Java SE)
        try (Connection connection = DBConnection.getConnection();
             PreparedStatement preparedStatement = connection.prepareStatement(sqlQuery)) {

            // [TRACEABILITY LINE 3 - Security Parameterization]:
            // Gán giá trị biến lowerCamelCase 'accountId' chống lỗi SQL Injection
            preparedStatement.setInt(1, accountId);

            try (ResultSet resultSet = preparedStatement.executeQuery()) {
                if (resultSet.next()) {
                    guestProfile = new GuestHealthProfile();

                    // [TRACEABILITY LINE 4 - Entity Mapping]:
                    // Ánh xạ dữ liệu từ CSDL vào đối tượng Model Entity
                    guestProfile.setHealthProfileId(resultSet.getInt("HealthProfileID"));
                    guestProfile.setAccountId(resultSet.getInt("AccountID"));

                    // [TRACEABILITY LINE 5 - BR-03 & NĐ 356 PII Decryption]:
                    // GIẢI MÃ PII: Dữ liệu FoodAllergies mã hóa AES-256 dưới CSDL được giải mã an toàn tại tầng Model
                    String encryptedFoodAllergies = resultSet.getString("FoodAllergies");
                    String decryptedFoodAllergies = AESEncryptionUtil.decrypt(encryptedFoodAllergies);
                    guestProfile.setFoodAllergies(decryptedFoodAllergies);

                    guestProfile.setDietaryPreferences(resultSet.getString("DietaryPreferences"));
                    guestProfile.setPhysicalLimitations(resultSet.getString("PhysicalLimitations"));
                    guestProfile.setTherapyPreferences(resultSet.getString("TherapyPreferences"));
                    guestProfile.setEmergencyContact(resultSet.getString("EmergencyContact"));
                    
                    // [TRACEABILITY LINE 6 - Consent Audit Trail]:
                    // Đọc trạng thái đồng ý Explicit Consent từ CSDL
                    guestProfile.setConsentGiven(resultSet.getBoolean("ConsentGiven"));
                    guestProfile.setConsentTimestamp(resultSet.getTimestamp("ConsentTimestamp"));
                    guestProfile.setConsentVersion(resultSet.getString("ConsentVersion"));
                }
            }
        }
        
        // [TRACEABILITY LINE 7]: Trả đối tượng Model hoàn chỉnh về cho tầng Controller
        return guestProfile;
    }
}
```

---

### 4.2 Tầng Controller (`HealthProfileController.java`)

**File Path:** `src/main/java/com/heavenstay/hswrms/controller/HealthProfileController.java`

```java
package com.heavenstay.hswrms.controller;

import com.heavenstay.hswrms.model.dao.GuestHealthProfileDAO;
import com.heavenstay.hswrms.model.entity.GuestHealthProfile;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.io.IOException;

// ============================================================================
// [TRACEABILITY HEADER - ISO/IEC 25010 STANDARD]
// ----------------------------------------------------------------------------
// Requirement ID  : US-REC-002 / SR-03 / UC02
// Business Rule   : BR-03 (Phân quyền truy cập thông tin sức khỏe cá nhân)
// Web Route URL   : /guest/health-profile (RESTful kebab-case Route)
// MVC Layer       : CONTROLLER LAYER (Servlet điều phối yêu cầu HTTP)
// Naming Style    : Google Java Style Guide (PascalCase Controller Name)
// ============================================================================
@WebServlet("/guest/health-profile")
public class HealthProfileController extends HttpServlet {

    // Naming Convention: Biến instance tuân thủ lowerCamelCase
    private final GuestHealthProfileDAO healthProfileDAO = new GuestHealthProfileDAO();

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {

        // --------------------------------------------------------------------
        // BƯỚC 1 TRUY VẾT: KIỂM TRA PHÂN QUYỀN VÀ XÁC THỰC SỰ TỒN TẠI CỦA SESSION
        // --------------------------------------------------------------------
        HttpSession session = request.getSession(false);
        if (session == null || session.getAttribute("CURRENT_USER_ID") == null) {
            // [TRACEABILITY]: Chuyển hướng người dùng chưa đăng nhập về trang Login
            response.sendRedirect(request.getContextPath() + "/login.jsp");
            return;
        }

        // Tên biến lowerCamelCase chuẩn Clean Code
        int currentAccountId = (Integer) session.getAttribute("CURRENT_USER_ID");

        try {
            // --------------------------------------------------------------------
            // BƯỚC 2 TRUY VẾT: GỌI TẦNG MODEL ĐỂ TRUY VẤN DỮ LIỆU CSDL
            // --------------------------------------------------------------------
            GuestHealthProfile guestProfile = healthProfileDAO.getProfileByAccountId(currentAccountId);

            // --------------------------------------------------------------------
            // BƯỚC 3 TRUY VẾT: ĐÓNG GÓI DỮ LIỆU ĐỂ TRUYỀN SANG TẦNG VIEW
            // --------------------------------------------------------------------
            request.setAttribute("guestProfile", guestProfile);

            // --------------------------------------------------------------------
            // BƯỚC 4 TRUY VẾT: ĐIỀU HƯỚNG HIỂN THỊ FILE VIEW JSP CHUẨN KEBAB-CASE
            // --------------------------------------------------------------------
            request.getRequestDispatcher("/WEB-INF/views/guest/health-profile-view.jsp")
                   .forward(request, response);

        } catch (Exception exception) {
            // Ghi vết lỗi chuẩn và điều hướng trang báo lỗi chung
            exception.printStackTrace();
            request.setAttribute("errorMessage", "Không thể truy xuất hồ sơ sức khỏe. Vui lòng liên hệ hỗ trợ.");
            request.getRequestDispatcher("/WEB-INF/views/common/error.jsp").forward(request, response);
        }
    }
}
```

---

### 4.3 Tầng View (`health-profile-view.jsp`)

**File Path:** `src/main/webapp/WEB-INF/views/guest/health-profile-view.jsp`

```html
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>

<!-- ==========================================================================
[TRACEABILITY HEADER - ISO/IEC 25010 VIEW LAYER]
-------------------------------------------------------------------------------
Requirement ID  : US-REC-002 / SR-03 / UC02 (Màn hình Hồ sơ Sức khỏe)
Business Rule   : BR-03 (Chỉ hiển thị khi đã xác nhận Explicit Consent)
MVC Layer       : VIEW LAYER (JSP Template — Tuyệt đối KHÔNG chứa câu lệnh SQL!)
Naming Style    : kebab-case file name (health-profile-view.jsp)
=========================================================================== -->

<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <title>Hồ Sơ Trị Liệu Sức Khỏe — HeavenStay Resort</title>
    <link rel="stylesheet" href="${pageContext.request.contextPath}/assets/css/health-profile.css">
</head>
<body>

    <div class="container">
        <h1>Hồ Sơ Trị Liệu & Sức Khỏe Cá Nhân</h1>
        <p class="subtitle">Được bảo mật theo tiêu chuẩn Nghị định 356/2025/NĐ-CP</p>

        <!-- BƯỚC 1 TRUY VẾT VIEW: KIỂM TRA ĐỐI TƯỢNG GUESTPROFILE TRẢ VỀ TỪ CONTROLLER -->
        <c:choose>
            <c:when test="${not empty guestProfile}">
                
                <!-- BƯỚC 2 TRUY VẾT VIEW: HIỂN THỊ TRẠNG THÁI CONSENT BẢO VỆ PII (BR-03) -->
                <div class="consent-badge ${guestProfile.consentGiven ? 'status-active' : 'status-warning'}">
                    <strong>Trạng thái đồng ý dữ liệu:</strong> 
                    <c:out value="${guestProfile.consentGiven ? 'Đã xác nhận (Consent Valid)' : 'Chưa xác nhận'}"/>
                    <span class="timestamp">(Cập nhật lúc: ${guestProfile.consentTimestamp})</span>
                </div>

                <!-- BƯỚC 3 TRUY VẾT VIEW: HIỂN THỊ BẢNG THÔNG TIN SỨC KHỎE KHÁCH HÀNG -->
                <table class="profile-table">
                    <tr>
                        <th>Dị ứng thực phẩm (Food Allergies):</th>
                        <!-- TRACEABILITY: Hiển thị dữ liệu đã giải mã PII an toàn từ Model -->
                        <td class="text-alert"><c:out value="${guestProfile.foodAllergies}"/></td>
                    </tr>
                    <tr>
                        <th>Chế độ ăn ưu tiên (Dietary Preferences):</th>
                        <td><c:out value="${guestProfile.dietaryPreferences}"/></td>
                    </tr>
                    <tr>
                        <th>Hạn chế vận động (Physical Limitations):</th>
                        <td><c:out value="${guestProfile.physicalLimitations}"/></td>
                    </tr>
                    <tr>
                        <th>Ưu tiên trị liệu Spa (Therapy Preferences):</th>
                        <td><c:out value="${guestProfile.therapyPreferences}"/></td>
                    </tr>
                    <tr>
                        <th>Liên hệ khẩn cấp (Emergency Contact):</th>
                        <td><c:out value="${guestProfile.emergencyContact}"/></td>
                    </tr>
                </table>

            </c:when>
            <c:otherwise>
                <div class="alert alert-info">
                    <p>Chưa có thông tin hồ sơ sức khỏe. Vui lòng khởi tạo để Resort phục vụ chu đáo nhất.</p>
                </div>
            </c:otherwise>
        </c:choose>

    </div>

</body>
</html>
```

---

## 5. MA TRẬN ĐỐI SOÁT QUY CHUẨN ĐẶT TÊN (NAMING MATRIX CHEATSHEET)

Bảng dưới đây tóm tắt toàn bộ quy tắc đặt tên của dự án HSWRMS đối chiếu trực tiếp với các tiêu chuẩn quốc tế chính thức:

| Thành phần Phần mềm | Chuẩn Quốc tế (Standard) | Quy tắc Đặt tên (Rule) | Ví dụ Đúng (Valid) | Ví dụ Sai (Invalid) |
|---------------------|--------------------------|------------------------|--------------------|---------------------|
| **Java Package** | Oracle Java JLS / Google | `lowercase` (hoàn toàn chữ thường) | `com.heavenstay.hswrms.service` | `com.heavenstay.hswrms.Service`, `hswrms_service` |
| **Java Class / Enum** | Google Java Style Sec 5.2.2 | `UpperCamelCase` (PascalCase) | `GuestHealthProfileDAO` | `guestHealthProfileDAO`, `guest_health_profile_dao` |
| **Java Method** | Google Java Style Sec 5.2.3 | `lowerCamelCase` (Động từ đầu) | `getProfileByAccountId()` | `GetProfile()`, `get_profile_by_id()` |
| **Java Variable** | Oracle Java Conventions | `lowerCamelCase` (Danh từ) | `guestProfile`, `currentAccountId` | `GuestProfile`, `acc_id`, `p` |
| **Constant (Hằng số)**| Java Language Spec | `UPPER_SNAKE_CASE` + `static final` | `MAX_FAILED_LOGIN_ATTEMPTS` | `maxFailedLoginAttempts`, `MAXFAILEDLOGIN` |
| **Database Table** | ANSI SQL / ISO 9075 | `UPPER_SNAKE_CASE` (Danh từ) | `GUEST_HEALTH_PROFILE` | `guestHealthProfile`, `guest-health-profile` |
| **Database Column** | ANSI SQL / ISO 9075 | `UpperCamelCase` / `UPPER_SNAKE` | `HealthProfileID`, `FoodAllergies` | `healthprofileid`, `food-allergies` |
| **File View JSP** | Web URL Standard | `kebab-case.jsp` | `health-profile-view.jsp` | `healthProfileView.jsp`, `health_profile_view.jsp` |
| **REST API Route** | RFC 3986 / OpenAPI 3.0 | `kebab-case` (Số nhiều) | `/api/v1/guests/health-profiles` | `/api/v1/getGuestHealthProfile` |
| **Unit Test Method**| Roy Osherove Standard | `[Method]_[State]_[Expected]` | `getProfile_ValidId_ReturnsProfile` | `test1()`, `checkGetProfile()` |

---
*Tài liệu Quy chuẩn Lập trình Quốc tế & Code Truy vết (v2.0) — Ban Quản trị Kiến trúc Hệ thống HSWRMS*
