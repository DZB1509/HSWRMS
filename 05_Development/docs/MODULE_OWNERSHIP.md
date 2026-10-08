# HSWRMS Module Ownership & Boundary Specifications

**Project:** HeavenStay Wellness Resort Management System (HSWRMS)  
**Architecture:** Modular Monolith with Domain-Bounded Contexts

---

## 1. Domain Module Ownership Matrix

| Module | Backend Package | Frontend Feature Folder | Official Screens (1–56) | Primary Domain Responsibilities |
|---|---|---|---|---|
| **M1** | `com.heavenstay.hswrms.m1identity` | `features/m1-identity` | Screens 3–9 | User authentication & registration, JWT sessions, CustomerProfile, HealthProfile with explicit consent & retention policy, sensitive health minimization projections, health deletion requests. |
| **M2** | `com.heavenstay.hswrms.m2booking` | `features/m2-booking` | Screens 1, 13–19, 20–24 | Retreat package catalog, villa categories, booking lifecycle, deposit payment boundary, Receptionist check-in, ResidenceRecord (Law on Residence 2020), physical villa assignment, walk-in booking on S15. |
| **M3** | `com.heavenstay.hswrms.m3spa` | `features/m3-spa` | Screens 25–33 | Spa treatment catalog, qualification & room compatibility matching, system-driven scheduling candidate generation, atomic reservation, reminder timeline, separate session/confirmation lifecycles, therapist session outcomes (`COMPLETED` / `NO_SHOW`). |
| **M4** | `com.heavenstay.hswrms.m4fnb` | `features/m4-fnb` | Screens 34–40 | Dietary menu filtering, daily meal selections, extra a-la-carte ordering, `MenuItemIngredient` recipe modeling (`quantity_per_serving`), batch inventory usability calculations, F&B Kitchen Dashboard hierarchy, order fulfillment workflow. |
| **M5** | `com.heavenstay.hswrms.m5billing` | `features/m5-billing` | Screens 41–48 | Folio charge aggregation, formal invoice consolidation, VNPay payment transaction handling & idempotency, guarded checkout validation, customer post-checkout reviews, Manager analytics (Revenue, Occupancy, Therapist Utilization). |
| **M6** | `com.heavenstay.hswrms.m6admin` | `features/m6-admin` | Screens 10–12, 49–56 | Staff account management (S10-S11), resort master data & system parameters (S12, S50), Admin Dashboard (S49), feature flags (S51), dynamic permission matrix (S52), limited admin delegation with expiry (S53), immutable Sensitive Data Access Audit Log (S54), Manager Dashboard (S55), System Overview Dashboard (S56). |

---

## 2. Shared Infrastructure Areas

Shared areas require team-wide consensus. Avoid modifying these without informing all module leads:

| Shared Area | Location | Scope & Purpose |
|---|---|---|
| **Common API & Errors** | `backend/.../common/` | `ApiResponse`, `ApiError`, `GlobalExceptionHandler`, base domain exceptions. |
| **Security Foundation** | `backend/.../security/` | `SecurityConfig`, `JwtAuthenticationFilter`, `JwtTokenProvider`, `CustomUserDetails`. |
| **App Configuration** | `backend/.../config/` | `CorsConfig`, database configurations, profile settings. |
| **Integration Adapters** | `backend/.../integration/` | Dedicated adapters for VNPay, Email notification service, and Social SSO. |
| **Frontend API Client** | `frontend/src/api/` | Base HTTP client (`apiClient.ts`), error definitions, token storage. |
| **Frontend Layouts & Shell** | `frontend/src/app/` | `AppRouter`, layout components (`PublicLayout`, `CustomerLayout`, `OperationalLayout`, `ManagerAdminLayout`), role guards. |
| **Common UI Design System** | `frontend/src/components/common/` | Reusable design token primitives (buttons, modals, form fields, badges, toasts). |
| **Design Tokens & Styles** | `frontend/src/styles/` | Global CSS stylesheets, Amanoi-inspired design tokens, typography scale. |

---

## 3. Cross-Module Communication Rules

1. **No Direct Repository Access:** A module must **never** inject a repository from another module.
   * *Anti-pattern:* `m3spa.SpaSessionService` directly injecting `m5billing.FolioRepository`.
   * *Approved pattern:* `m3spa` communicates with `m5billing` via a well-defined public service interface (e.g., `m5billing.BillingService`) or domain event.
2. **Preservation of Open Items (OI-01 – OI-09):**
   * The exact write/ownership boundary between M3/M4 charges and M5 Folio remains unresolved under **OI-01**.
   * The ownership of deposit payment transactions vs. centralized checkout payment transactions remains unresolved under **OI-04**.
   * Do not hard-wire private dependencies across module borders until these open items are formally decided.
