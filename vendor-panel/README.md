# zKart.shop — Vendor Panel

React 19 + TypeScript + Vite + Tailwind CSS v4. Runs on port **5174** (customer app uses 5173) so both can run side by side.

## Setup

```bash
npm install
cp .env.example .env    # point VITE_API_BASE_URL at your backend
npm run dev              # http://localhost:5174
```

## Logging in

Only `admin` and `super_admin` role accounts can log in here (phone + password — the OTP flow is customer-only). Create one via the backend:

```bash
python manage.py shell -c "
from apps.accounts.models import User, Role
u = User.objects.create_user(phone='+919800000099', password='yourpassword', role=Role.SUPER_ADMIN, full_name='Super Admin', is_phone_verified=True)
"
```

## Role-aware navigation

The sidebar shows different sections depending on who's logged in:

- **Admin**: Dashboard, Vendors, Delivery Partners, Orders, Users, Coupons, Categories
- **Super Admin**: everything above, plus Cities, Platform Settings, Staff & RBAC, Audit Logs, Backups, API Monitoring

`ProtectedRoute` (`src/components/layout/ProtectedRoute.tsx`) enforces this on the frontend; the backend enforces the same boundary independently (an admin token hitting a super-admin-only endpoint gets a 403 regardless of what the UI shows).

## What's built

Login, Dashboard (platform stats), Vendors (approve/suspend/commission), Delivery Partners (approve/suspend), Orders (read-only, filterable), Users (activate/deactivate), Coupons (CRUD), Categories (CRUD with parent hierarchy), Cities (CRUD with delivery-pricing overrides), Platform Settings (live-editable defaults), Staff & RBAC (create admins, toggle permission flags per admin), Audit Logs (filterable), Backups (trigger + history, auto-refreshes), API Monitoring (auto-refreshes every 15s).

## Verified

`npm run build` — clean TypeScript (strict) and a successful Vite production bundle. Tested end-to-end against a live backend: super-admin login, dashboard stats loading, and the role-based sidebar all confirmed working.

## Not built yet

Warehouses management (backend API exists at `/super-admin/warehouses/`, no page wired up — same CRUD pattern as Cities), pagination controls on long tables (all list views currently show the first page only — `DRF`'s `next`/`previous` links aren't wired into the UI yet), and broadcast notifications (backend endpoint exists at `/admin/notifications/broadcast/`, no page for it).
