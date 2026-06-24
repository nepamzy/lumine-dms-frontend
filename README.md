# Lumine DMS — Frontend

React + Vite + Tailwind, built against the navy/gold UI/UX design system and consuming the backend API directly.

## Setup

```bash
cd frontend
npm install
cp .env.example .env   # point VITE_API_URL at your running backend
npm run dev
```

The backend must be running (see `../backend/README.md`) and `CLIENT_URL` in the backend's `.env` must match this app's URL (default `http://localhost:5173`) for cookies/CORS to work.

## What's built

- **Auth flow** — login, register (customer or distributor, toggled in one form), silent session restore on page load via the refresh-token cookie + the new `GET /auth/me` endpoint, automatic access-token refresh on 401 (see `src/api/client.js`)
- **Home** — the 3D draggable product ring hero, carried over from the approved design preview
- **Catalog** — live product grid from the API, tilt-on-hover cards, add-to-cart
- **Cart → Checkout → Paystack handoff** — checkout creates the order against the real API (which reserves stock via FEFO), then initializes payment and redirects to Paystack's hosted checkout
- **Customer dashboard** — order history with the flat status stepper (per the design system: tracking favors clarity over the 3D treatment used elsewhere)
- **Role-based routing** — `ProtectedRoute` redirects unauthenticated visitors to login and blocks role mismatches (e.g. a customer can't open `/admin`)

## Known placeholders

`DistributorDashboard.jsx` and `AdminDashboard.jsx` are intentionally thin shells right now — they exist so routing and auth work end-to-end, but the real screens (today's delivery route, mark-delivered actions, product/batch management, distributor approvals, report dashboards) aren't built yet. Every API endpoint they'll need already exists and is documented in the backend README — this is the next build phase.

## Folder structure

```
frontend/
├── src/
│   ├── api/              # one file per backend domain: auth, products, orders
│   ├── context/          # AuthContext (session), CartContext (pre-checkout cart)
│   ├── components/       # Navbar, ProductCard, OrderStatusStepper, ProtectedRoute
│   ├── pages/             # one file per route
│   ├── App.jsx            # routing
│   ├── main.jsx            # entry point
│   └── index.css           # Tailwind + design tokens
├── tailwind.config.js      # navy/gold/cream colors, Sora/Inter fonts
```
