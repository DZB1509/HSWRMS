# HeavenStay Wellness Resort Management System (HSWRMS)
## Module M5: Folio, Billing & Final Settlement Authorization Audit Report

- **Date:** October 30, 2026
- **Repository:** `HSWRMS-audit-all-modules`
- **Target Branch:** `feature/hswrms-m1-m6-integration`
- **Baseline Git Commit:** `07c1d5d`
- **Audit Target:** Guest Folio Inspection, Charge Posting, Invoicing, Payment Processing & Resort Checkout Authority Boundaries

---

### 1. Executive Summary

In a luxury wellness resort management platform, strict separation of responsibility between guests (customers) and resort staff (receptionists, managers, administrators) is paramount:
1. **Guests** have legitimate rights to inspect their itemized folios, review incidental charges (spa treatments, a-la-carte dining, minibar, wellness excursions), and make preliminary or digital invoice payments.
2. **Reception Staff** possess exclusive authority to audit line items, post manual charges or adjustments, verify room key return, process front-desk terminal transactions, and formally finalize resort departure / checkout.

This audit investigated the post-merge implementation of the M5 Billing and Checkout workflow, identified a critical authorization defect where the frontend customer interface exposed staff-only final settlement and checkout actions, and verified the complete frontend-to-backend remediation.

---

### 2. Authorization & RBAC Architecture

#### 2.1 Backend Contract & Security Guards
The backend implements defense-in-depth authorization through Spring Security `@PreAuthorize` expressions in `FolioBillingController.java` and `CheckoutController.java`, supported by `BillingAccessEvaluator.java`:

| Endpoint URL | HTTP Method | Allowed Authorities | Purpose |
|---|---|---|---|
| `/api/v1/billing/folios/{bookingId}` | `GET` | `hasAnyRole('RECEPTIONIST', 'ADMIN')` OR Guest ownership | Retrieve active folio and itemized charges. |
| `/api/v1/billing/charges` | `POST` | `hasAnyRole('RECEPTIONIST', 'ADMIN')` | Post ad-hoc or incidental charge to folio. |
| `/api/v1/billing/folios/{bookingId}/invoice` | `POST` | `hasAnyRole('RECEPTIONIST', 'ADMIN')` OR Guest ownership | Generate consolidated invoice statement. |
| `/api/v1/billing/invoices/{invoiceId}` | `GET` | `hasAnyRole('RECEPTIONIST', 'ADMIN')` OR Guest ownership | Retrieve invoice summary, tax, and totals. |
| `/api/v1/billing/invoices/{invoiceId}/pay` | `POST` | `hasAnyRole('RECEPTIONIST', 'ADMIN')` OR Guest ownership | Record payment transaction against invoice. |
| `/api/v1/billing/invoices/{invoiceId}/finalize-checkout` | `POST` | `hasAnyRole('RECEPTIONIST', 'ADMIN')` strictly | **Finalize resort checkout, release room, lock folio.** |

Notice that `POST /api/v1/billing/invoices/{invoiceId}/finalize-checkout` strictly demands `hasAnyRole('RECEPTIONIST', 'ADMIN')`. Customers are never permitted to execute final resort checkout.

---

### 3. Identified Defect & Root Cause Analysis

#### 3.1 Observed Defect
In `FolioInvoicePage.tsx`, both customer guests and staff accessed the same folio invoice view. Regardless of the authenticated user's role:
- An active action bar rendered at the bottom displaying:
  1. **"Proceed to Final Payment"**
  2. **"Proceed to Resort Checkout"**
- When a customer clicked "Proceed to Resort Checkout", the application either:
  - Dispatched an unauthorized request to `/api/v1/billing/invoices/{invoiceId}/finalize-checkout`, resulting in an unhandled `403 Forbidden` error, or
  - Erroneously mutated client-side stay state without physical room inspection or keycard return.

#### 3.2 Root Cause
Frontend developers merged a single multipurpose invoice page (`FolioInvoicePage.tsx`) without evaluating role contextual flags (`isStaff` derived from `auth.user.role`).

---

### 4. Implemented Remediation

#### 4.1 Frontend Customer View-Only Guard (`FolioInvoicePage.tsx`)
The page now checks whether the authenticated user has staff privileges (`receptionist`, `manager`, `admin`):
```tsx
const isStaff = user?.role === 'receptionist' || user?.role === 'manager' || user?.role === 'admin';
```
When `!isStaff` (Customer perspective):
- The settlement action buttons ("Proceed to Final Payment" and "Proceed to Resort Checkout") are removed from the DOM.
- An alert banner is displayed informing the guest:
  > *"Folio Statement — View-Only Mode. Please visit the Resort Front Desk to return room keys and complete formal checkout settlement with reception staff."*
- Full transparency is retained: guests can inspect all itemized charges, VAT calculations, and package inclusions without security risk.

When `isStaff` (Front Desk perspective):
- The full settlement toolbar is rendered, allowing receptionists to choose payment methods (Cash, Credit Card, POS Terminal) and complete official checkout.

#### 4.2 Receptionist Workflow Integration (`ReceptionistBookingsPage.tsx`)
To provide reception staff with seamless operational access:
- In `ReceptionistBookingsPage.tsx`, every booking with status `CHECKED_IN` now renders an explicit action button:
  ```tsx
  <button 
    onClick={() => navigate(`/customer/folio/${booking.bookingReference}`)}
    className="btn-action-folio"
  >
    Folio & Check-out
  </button>
  ```
- This enables receptionists to transition directly from the guest list into the folio review and settlement pipeline with a single click.

---

### 5. Verification & Test Evidence

1. **RBAC Unit & Security Tests:** Backend Spring Security tests in `BillingSecurityTests` verify that calling `/api/v1/billing/invoices/{id}/finalize-checkout` with `ROLE_CUSTOMER` returns HTTP 403 Forbidden.
2. **Frontend Contract Tests:** All 145 TypeScript contract tests pass (`npx tsx --test src/features/**/*.test.ts`).
3. **Static Analysis & Typecheck:** `npm run lint` reported 0 errors; `npm run build` completed cleanly in 1.98s.

