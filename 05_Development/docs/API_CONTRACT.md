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

## 5. M1 Health / Consent / Deletion API Contract — DESIGN ONLY (not implemented)

**Status:** Design per team-lead decisions (2026-10-13), recorded in `M1_Phase2_Plan.md` R9. No endpoint in this section exists in code yet. Where this section conflicts with older drafts, older ERDs or existing code, this section is the current approved direction.

### 5.0 Common rules (all endpoints in this section)

- All paths sit under the reserved M1 namespace `/api/v1/customers/me/**` (§4). JWT required — missing/expired token → 401 (§2).
- The authenticated user id comes **only** from the JWT principal (`CustomUserDetails.getUserId()`). Request bodies, paths and query strings MUST NOT accept a target user/customer id; DTOs contain no user-identifier fields, so cross-user access is prevented by construction. Mandatory isolation tests: user A's token must never read or modify user B's data (→ 401/404 as specified below).
- Error format: standard `ApiError` envelope (§1). Business-rule failures → 400 with the stable `code` values listed below (`BusinessRuleException` convention, §2); validation failures → 400 `VALIDATION_ERROR`.
- M1 role scope: these endpoints target the authenticated Customer (`customer` role) → 403 otherwise (§2).

### 5.1 Consent policy constants and rules (design)

| Item | Value | Notes |
|---|---|---|
| ToS policy version | `v1.0` (provisional) | Backend constant/config, applied when registration persists `TO_SERVICE` |
| Health-data policy version | `v1.2` | Matches the current UI consent text; changes require a formal version bump |
| Allowed `consent_type` | `TO_SERVICE`, `HEALTH_DATA_PROCESSING` | No other categories without a documented requirement |

Rules:
- Successful registration **persists** a `ConsentRecord`: `consent_type=TO_SERVICE`, `granted=true`, `granted_at=now`, `policy_version=v1.0`.
- `HEALTH_DATA_PROCESSING` is **never** granted automatically at registration; only via explicit grant (§5.2).
- Health-profile writes (§5.3) are **rejected unless** an active `HEALTH_DATA_PROCESSING` consent exists (`granted=true AND revoked_at IS NULL`). Frontend checkbox state is never sufficient authorization.
- History model: grant → INSERT a new record; revoke → close the active record (`revoked_at=now`, `granted=false`); re-grant → INSERT a new record. History rows are never deleted or overwritten to represent a different grant.
- Single-active rule: at most one active record per `(user_id, consent_type)` — enforced by service precondition + partial unique index (schema task G).
- Mapping note: the existing Java `consent_status` (GRANTED/REVOKED/PENDING) is superseded by `granted` + `revoked_at`; `PENDING` is not part of the approved model (code change deferred to implementation).

### 5.2 Consent endpoints

**`GET /api/v1/customers/me/consents`**
- Access: authenticated Customer, own records only. Full history, newest first.
- 200 → `ApiResponse<ConsentRecordResponse[]>`; each item: `consentId`, `consentType`, `granted`, `grantedAt`, `revokedAt`, `policyVersion`, `active` (derived: `granted=true && revokedAt==null`).

**`POST /api/v1/customers/me/consents`** (grant)
- Body: `{ "consentType": "TO_SERVICE" | "HEALTH_DATA_PROCESSING" }`.
- Server sets `policyVersion` from the current constant for that type; the client cannot choose the version.
- Idempotency: active record already exists for `(user, type)` → **200** returning that record (no duplicate); new record created → **201**.
- Unknown/blank `consentType` → 400 code `CONSENT_TYPE_UNSUPPORTED`; missing body → 400 `VALIDATION_ERROR`.

**Revoke — `POST /api/v1/customers/me/consents/{consentType}/revoke`**
- Rationale for not using `PUT /api/v1/customers/me/consents`: the collection has no single resource identity, and PUT's replace semantics conflict with append-only consent history; an explicit state-transition action matches existing project conventions (action-style POSTs such as `/auth/verify-email`). **PUT on the consents collection is not part of this contract.**
- Behavior: closes the active record (`revoked_at=now`, `granted=false`) and returns the closed record → **200**.
- No active record for that type → **400** code `CONSENT_NOT_ACTIVE` (revocation is deliberately non-idempotent: replaying it is a client error).
- Unknown `consentType` → 400 `CONSENT_TYPE_UNSUPPORTED`. Cross-user access is impossible (userId from JWT).

### 5.3 Health profile endpoints

**`GET /api/v1/customers/me/health-profile`**
- Access: authenticated Customer (own). 200 → `ApiResponse<HealthProfileResponse>`; if no profile exists yet → 200 with an empty structure (`healthProfileId=null`, empty arrays, `stressLevel=null`) — **PROVISIONAL** (404 alternative remains open, §5.6).
- `anonymizationStatus` is system-managed and **excluded** from this DTO (GET and PUT).

**`PUT /api/v1/customers/me/health-profile`** (full replace)
- Access: authenticated Customer, **plus active `HEALTH_DATA_PROCESSING` consent** → otherwise 400 code `HEALTH_CONSENT_REQUIRED` (business rule per §2; the check is server-side and runs before any write).
- Semantics: scalar fields are overwritten; child collections (`foodAllergies`, `dietaryRequirements`, `therapyPreferences`) are replaced atomically in one transaction (delete + re-insert of the caller's own rows), matching the current UI's save-all behavior.
- The DTO carries no user/customer id; identity comes solely from the JWT principal.

Field mapping (UI control ↔ JSON field ↔ updated ERD):

| UI control (HealthProfilePage) | JSON field (type) | ERD target |
|---|---|---|
| Current Health Conditions / Tension Areas (comma input → list) | `medicalConditions: string[]` | `HealthProfile.current_health_condition` (text column — storage normalization OPEN) |
| Past Injuries or Surgeries (text) | `injuriesOrSurgeries: string` | `surgery_injury_history` |
| Mobility / Movement Considerations (text) | `mobilityConsiderations: string` | `mobility_joint_notes` |
| Current Regular Supplements / Medications (text) | `currentMedications: string` | `supplement_notes` |
| Current Stress & Fatigue Level (select) | `stressLevel: "mild"\|"moderate"\|"high"\|null` | `stress_fatigue_level` — enum; accepted values exactly `mild`, `moderate`, `high` |
| Therapy & Essential Oil Preferences (comma input → list) | `therapyPreferences: string[]` | `HealthProfileTherapyPreference.preference_name` rows (free text in M1; `therapy_code` reserved for a future M3 catalog and NOT accepted in M1) |
| Known Food Allergies (comma input → list) | `foodAllergies: string[]` | `FoodAllergy.allergy_name` rows (1..*) |
| Dietary Principles (comma input → list) | `dietaryRequirements: string[]` | `DietaryRequirement.requirement_name` rows (1..*) |
| Food Intolerances (comma input → list) | `foodIntolerances: string[]` | `food_intolerance_notes` (text — storage normalization OPEN) |
| Disliked Ingredients (comma input → list) | `dislikedIngredients: string[]` | `disliked_ingredients` (text — storage normalization OPEN) |
| Kitchen Preparation Special Notes (textarea) | `kitchenSpecialNotes: string` | `kitchen_special_notes` |
| (health consent checkbox) | not in this DTO — consent flows via §5.2 | `ConsentRecord` |

Validation (length/cap numbers are **PROVISIONAL** pending approval):
- `stressLevel` ∈ {`mild`,`moderate`,`high`} or null → else 400 `VALIDATION_ERROR`.
- Text fields are trimmed; proposed max lengths: 150 (condition/injury/mobility), 250 (supplements), 500 (kitchen notes).
- Arrays: empty array clears that collection; proposed per-item max 150 chars; proposed caps 50 items per collection.
- Allergies/intolerances/dietary/therapy entries are plain names (no markup).

Read policy: `GET` is allowed for the owner regardless of current consent state (per SRS GB-09 consent gates *storage/writes*). The effect of **revoking** consent on already-stored data is **UNRESOLVED** (retention policy, §5.6).

### 5.4 Deletion request endpoints (basic flow only)

**`POST /api/v1/customers/me/deletion-requests`** (create)
- Access: authenticated Customer, own. Body: `{ "requestType": "HEALTH_DATA" }` (`requestType` expresses scope only — it does **not** decide hard-delete vs anonymization; the execution outcome is unresolved, §5.6).
- Creation always inserts `status=PENDING`. Duplicate-open protection: if an open (`PENDING` or `DEFERRED`) request already exists for the customer → **409** code `DELETION_REQUEST_ALREADY_OPEN` (duplicate submission is a client error, not silent success). Unknown `requestType` → 400 `REQUEST_TYPE_UNSUPPORTED`.
- 201 → `DeletionRequestResponse` (`deletionRequestId`, `requestType`, `status`, `requestedByUserId`, `createdAt`, `updatedAt`).

**`GET /api/v1/customers/me/deletion-requests`** (status)
- Access: authenticated Customer, own. Returns open requests newest first (current UI needs only the active entry).
- 200 → `ApiResponse<DeletionRequestResponse[]>`; none → 200 with `[]`.

**`POST /api/v1/customers/me/deletion-requests/{id}/cancel`**
- Access: authenticated Customer, own; `{id}` not owned by the caller → **404** `NOT_FOUND` (no existence disclosure to other users).
- Allowed while `status ∈ {PENDING, DEFERRED}` → closes the record `status=CANCELLED` → **200**; idempotent: cancelling an already-cancelled request returns **200** (desired end state).
- Cancelling a **COMPLETED** request → **409** code `DELETION_REQUEST_NOT_CANCELLABLE`.
- The eventual DEFERRED transition (when an active/upcoming retreat exists) and the final COMPLETED execution are **out of this contract** — both depend on the M2 integration contract (§5.5) and the retention policy (§5.6).

### 5.5 Restricted projections and module boundaries (design)

**Therapist projection (M3 consumes; M1 provides)** — minimum data for safe treatment only:
- In scope: food allergies, dietary requirements/kitchen warnings relevant to on-site F&B, injury/surgery history, mobility/joint notes, medical conditions, stress level, therapy preferences. Delivered only to an authorized Therapist with a concrete treatment relationship.
- Excluded: account/contact identifiers, login/security data, billing/folio data, and any field not required for the treatment at hand. The full `HealthProfile` DTO (and the customer DTO used in §5.3) must **never** be exposed to Therapists; a separate projection DTO is required at implementation time.

**Kitchen projection (M4 consumes; M1 provides)** — narrower than the therapist projection:
- In scope: food allergies, food intolerances, dietary requirements, disliked ingredients, kitchen preparation notes.
- Explicitly excluded: injury/surgery history, medical conditions, mobility notes, stress level, therapy preferences, and all non-dietary sensitive fields.

**Module boundaries**
- M1 must **not** query M2 repositories/tables directly. The deletion workflow's "active retreat" check is defined as an interface (design name): `hasActiveOrUpcomingRetreat(customerProfileId): boolean`, owned by the contract, implemented by M2 later; a mock/stub may be used in future tests. Not implemented in this task.
- `TreatmentHealthNote` is **M3-owned** (therapist-session workflow): created by Therapists only, no customer write API in M1, and M1 exposes at most a treatment-safe projection to Therapists — never a customer-facing read/write surface. The ERD retains the entity as a storage reference for the projection contract; implementation belongs to M3.

### 5.6 Open contract questions (require human approval before implementation)

1. **GET empty profile shape:** 200-with-empty-structure (current proposal) vs 404 `NOT_FOUND` — one must be chosen; frontend must handle whichever is chosen.
2. **Effect of revoking `HEALTH_DATA_PROCESSING` on already-stored data:** retained, soft-deleted, or anonymized immediately — depends on the retention policy (not yet written).
3. **Deletion request final outcome:** hard delete vs anonymization execution, timing, and who executes it — pending the retention policy + M2 contract. `requestType=HEALTH_DATA` intentionally does not encode this.
4. **Storage normalization for list-shaped UI fields** persisted in text columns (`current_health_condition`, `food_intolerance_notes`, `disliked_ingredients`): exact serialization format (newline-delimited proposed) — schema task G decides; the API contract accepts `string[]` regardless.
5. **Numeric caps/lengths** in §5.3 validation are provisional until approved.

