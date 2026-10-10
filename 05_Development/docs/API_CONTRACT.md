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

---

## 5. Implemented M3 Endpoints

### Spa Treatments Catalog (Public)
* `GET /api/v1/spa/treatments?bookingId={id}`: List all active treatments with package inclusion indication. (Public)
* `GET /api/v1/spa/treatments/{id}`: Treatment details with duration, price, and category. (Public)

### Scheduling Engine & Candidates (Authenticated: CUSTOMER, RECEPTIONIST, MANAGER, ADMIN)
* `POST /api/v1/spa/candidates`: Generate read-only, indivisible scheduling candidates (`Time + Qualified Therapist + Compatible Room`).
  * Request payload: `GenerateCandidatesRequest` (`treatmentId`, `preferredDate`, `timeRangeConstraint`, `rescheduleSessionId`, `alternativeSearchDays` [optional configurable search horizon]).
  * Returns: `CandidateGenerationResultDto` with complete candidates or alternative date suggestions.

### Reservation & Lifecycle (Authenticated: CUSTOMER, RECEPTIONIST, MANAGER, ADMIN)
* `POST /api/v1/spa/sessions`: Atomic session reservation / Customer reschedule confirmation.
  * Request payload: `ConfirmReservationRequest` (`treatmentId`, `therapistId`, `roomId`, `scheduledStartAt`, `scheduledEndAt`, `retreatBookingId`, `notes`, `bookingSource`, `rescheduleSessionId`).
  * Concurrency: Pessimistic locking. Returns HTTP 409 (`ConflictException`) if resource claimed by concurrent transaction.
  * State initialization: `session_status = SCHEDULED`, `confirmation_status = PENDING`.
* `GET /api/v1/spa/sessions`: List authenticated Customer's sessions with dual lifecycle badges.
* `POST /api/v1/spa/sessions/{id}/confirm-attendance`: Customer confirms attendance (`PENDING` -> `CONFIRMED`). Enforces session ownership.
* `POST /api/v1/spa/sessions/{id}/cancel`: Cancel session. Enforces session ownership.
  * *Policy Notice:* Exact cancellation deadlines, penalty fees, and refund policies are NOT yet defined in business requirements. This endpoint implements only safe technical lifecycle transition (`CANCELLED`) and is marked **PARTIAL** pending formal policy definition.

### Therapist Operations (Authenticated: THERAPIST, MANAGER, ADMIN)
* `GET /api/v1/therapist/dashboard`: Therapist overview with today's metrics and upcoming sessions. Enforces therapist identity.
* `GET /api/v1/therapist/schedule?date={YYYY-MM-DD}`: Daily schedule for authenticated therapist. Enforces therapist identity.
* `GET /api/v1/therapist/sessions/{id}`: Privacy-minimized session details (health notes and precautions only; no unrestricted health profile). Enforces session assignment to therapist.
* `POST /api/v1/therapist/sessions/{id}/outcome`: Mark session outcome as `COMPLETED` or `NO_SHOW`. Prohibits `IN_PROGRESS` per OI-08. Enforces session assignment to therapist.
