# HSWRMS REST API Architecture & Envelope Contract

**Base URL:** `/api/v1`  
**Data Format:** `application/json; charset=UTF-8`

---

## 1. Response Envelopes

### Success Envelope (`ApiResponse<T>`)
Used for all standard successful JSON responses:
```json
{
  "timestamp": "2026-10-09T00:30:00Z",
  "success": true,
  "message": "SUCCESS",
  "data": { ... }
}
```

### Error Envelope (`ApiError`)
Emitted by `GlobalExceptionHandler` and security entry points:
```json
{
  "timestamp": "2026-10-09T00:30:00Z",
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Human readable explanation of the error",
  "path": "/api/v1/resource/subpath",
  "errors": [
    {
      "field": "attributeName",
      "rejectedValue": "suppliedInvalidValue",
      "message": "Validation rule explanation"
    }
  ]
}
```

---

## 2. Standard HTTP Status Codes

| Code | Status | Meaning in HSWRMS |
|---|---|---|
| **200** | OK | Successful GET, PUT, or PATCH operation. |
| **201** | Created | Successful entity creation via POST (e.g., new booking, new account). |
| **204** | No Content | Successful deletion or state change with no payload to return. |
| **400** | Bad Request | Validation error or violated business constraint (`BusinessRuleException`). |
| **401** | Unauthorized | Missing or expired JWT token (`RestAuthenticationEntryPoint`). |
| **403** | Forbidden | Valid token but role lacks authority for the operation (`RestAccessDeniedHandler`). |
| **404** | Not Found | Requested entity ID does not exist (`ResourceNotFoundException`). |
| **409** | Conflict | Scheduling interval collision or unique database constraint violation. |
| **500** | Internal Error | Unhandled server exception. |

---

## 3. Implemented Foundation Endpoints

### Connectivity Health Check
* **Method:** `GET`
* **Path:** `/api/v1/health`
* **Access:** Public (no JWT required)
* **Response (HTTP 200):**
  ```json
  {
    "status": "UP",
    "service": "HSWRMS Modular Monolith Backend",
    "timestamp": "2026-10-09T00:30:00.000Z"
  }
  ```

---

## 4. Reserved Module Route Namespaces

The following URL namespaces are reserved for future module phases:

| Module | URL Namespace Prefix | Primary Responsibilities |
|---|---|---|
| **M1** | `/api/v1/auth/**`<br>`/api/v1/customers/me/**` | Registration, OTP verification, Login, Token Refresh, Password Reset, Customer Profile, Health Profile, Consent, Deletion requests. |
| **M2** | `/api/v1/packages/**`<br>`/api/v1/bookings/**`<br>`/api/v1/receptionist/**` | Public retreat packages catalog, villa categories, customer bookings, deposit initiation, daily arrivals, check-in, residence records, physical villa assignment. |
| **M3** | `/api/v1/spa/**`<br>`/api/v1/therapist/**` | Spa treatment catalog, scheduling candidate engine, atomic reservation, confirmation responses, therapist daily schedules, session completion. |
| **M4** | `/api/v1/meals/**`<br>`/api/v1/kitchen/**` | Dietary menu queries, daily meal selections, extra a-la-carte orders, ingredient batch tracking, recipe usage, kitchen prep queue. |
| **M5** | `/api/v1/folios/**`<br>`/api/v1/invoices/**`<br>`/api/v1/payments/**`<br>`/api/v1/reports/**` | Stay folio consolidation, formal invoice issuance, VNPay callback handling, guarded checkout finalization, customer reviews, revenue/occupancy analytics. |
| **M6** | `/api/v1/admin/**` | Staff account CRUD, master data management, system configuration parameters, feature flags, permission matrix, admin delegation, audit log. |
