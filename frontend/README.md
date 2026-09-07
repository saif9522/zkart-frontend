# zKart.shop — Customer Web App

React 19 + TypeScript + Vite + Tailwind CSS v4, talking to the Django backend in `../backend-django`.

## Setup

```bash
npm install
cp .env.example .env    # point VITE_API_BASE_URL at your backend
npm run dev              # http://localhost:5173
```

Requires the backend running (see `../backend-django/README.md`) — for live order tracking specifically, the backend must be served via **Daphne** (`daphne -p 8000 mall_of_garhwa.asgi:application`), not `manage.py runserver`, since WebSocket support needs an ASGI server.

## Design system

Grounded in Garhwa rather than a generic e-commerce template:
- **Color**: forest green (`--color-forest-*`) + mango-yellow (`--color-mango-*`) as the primary pair, chili red for deals/urgency, warm rice-white background — deliberately not the cream+terracotta combination common in AI-generated designs.
- **Type**: Fraunces (display headlines), Manrope (body/UI), IBM Plex Mono (prices, order numbers, the ETA countdown).
- **Signature element**: the `EtaPill` component (`src/components/ui/EtaPill.tsx`) — a pulsing-dot delivery-time badge that recurs on the home hero, header, cart, and order tracking page, since fast delivery is the product's core promise.

All tokens live in `src/index.css` under `@theme` (Tailwind v4's CSS-first config — there's no `tailwind.config.js`).

## Architecture

- **`src/api/`** — one file per backend app (`auth`, `catalog`, `cart`, `orders`, `addresses`), each a thin wrapper over the shared axios instance in `client.ts`. That instance auto-attaches the JWT access token and transparently refreshes it on a 401 (see `client.ts`'s response interceptor) — a request that hits an expired token retries once with a fresh token instead of failing.
- **`src/store/auth.ts`** — Zustand store, persisted to `localStorage`, holding the user and both JWT tokens.
- **`src/hooks/useCart.ts`** — React Query wrapper over the cart endpoints; every mutation writes straight into the query cache so the header badge, product-card steppers, and cart page all update in lockstep.
- **`src/hooks/useOrderTracking.ts`** — opens the `wss://.../ws/orders/<id>/track/?token=...` WebSocket from Phase 8 and exposes live `status`/`location` state; `OrderDetailPage` merges this over the REST snapshot so the progress stepper updates in real time without polling (a 30s `refetchInterval` on the REST query is kept as a fallback if the socket drops).

## What's built

Home (categories + featured + full catalog), OTP login, search/category browse, product detail, cart, checkout (address + coupon + COD/Razorpay choice), order list, order detail with live tracking, account/logout.

## Verified

- `npm run build` — clean TypeScript (strict, `noUnusedLocals`/`noUnusedParameters` on) and a successful Vite production bundle.
- Dev server reachable and the Django backend's CORS accepts requests from it (tested with both processes running side by side).
- Every API call in `src/api/` matches an endpoint that was individually tested against a live backend earlier in this project — see `../backend-django/README.md` for that testing record.

**Not verified**: actual visual rendering. This sandbox has no browser — the design was built and reviewed at the code level (Tailwind classes, component structure) against the design plan above, but not screenshotted or clicked through. Run `npm run dev` and open it locally to see the real result before shipping.

## Not built yet

Wishlist UI (API exists, `src/api/cart.ts` has `wishlistApi`, no page wired up), Razorpay checkout widget integration (the checkout page calls `/orders/checkout/` and gets back a `razorpay` payload but doesn't yet open the Razorpay Checkout JS widget with it), product reviews, profile editing. Vendor panel, admin panel, and delivery partner panel are separate frontends not started — this app is customer-facing only.
