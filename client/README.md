# RestoFlow Client

React 18 + Vite + Tailwind CSS v4 frontend for **RestoFlow**, a restaurant-management SaaS
(point of sale, floor plan, menu, reservations, staff). It talks to the `restoflow-api`
Laravel backend.

## Requirements

- Node 18+ (developed with Node 24, npm 10)
- A running `restoflow-api` backend (default `http://localhost:8000`)

## Setup

```bash
npm install
cp .env.example .env   # optional — defaults to http://localhost:8000
npm run dev            # → http://localhost:5173
```

`VITE_API_URL` is the API base URL (e.g. `VITE_API_URL=http://localhost:8000`).
All requests go to `<VITE_API_URL>/api/...` with `Authorization: Bearer <token>`.

### Demo accounts

| Role  | Email            | Password   |
| ----- | ---------------- | ---------- |
| Admin | admin@resto.test | `password` |
| Staff | staff@resto.test | `password` |

The login page also has one-click "Fill admin" / "Fill staff" buttons.

## Build

```bash
npm run build   # outputs to dist/
npm run lint    # oxlint
```

## Features

- **Auth** — login page, `AuthContext` with token + user in `localStorage`,
  session restore via `GET /api/me`, protected routes, logout.
- **Dashboard** — stat cards (today's revenue in MAD, active orders, occupied tables,
  today's reservations) plus active-orders and today's-reservations lists.
- **Tables** — visual floor grid, color-coded by status (free / occupied / reserved);
  clicking a table opens a side panel with its active order, status controls,
  "open new order" (marks the table occupied), and table add/edit/delete.
- **Orders (POS)** — order list with Active / All / History tabs and a full POS panel:
  line items, add menu items with quantities, advance the status flow
  (pending → preparing → served → paid), cancel with confirmation, and "mark paid"
  with a payment confirmation showing the total in MAD.
- **Menu** — categories CRUD and menu-item CRUD (name, description, price, category,
  availability toggle), grouped/filterable item cards, quick availability switch.
- **Reservations** — list with date + status filters, create/edit form
  (guest name, phone, date, time, party size, table assignment), inline status
  updates, delete.
- **Staff (admin only)** — users list, create/edit with role select
  (`admin` / `staff`), optional password change on edit, delete. Hidden from the
  nav and blocked by route guard for non-admins.
- **Design** — warm dark restaurant theme (charcoal/espresso backgrounds,
  amber-gold accents, Fraunces display serif + Inter), responsive with a mobile
  drawer sidebar.

## Project structure

```
src/
  api/
    client.js      # axios instance + Bearer token interceptor
    resources.js   # auth/dashboard/tables/categories/menu-items/orders/reservations/users
  context/
    AuthContext.jsx
  components/
    Layout.jsx     # sidebar shell + mobile drawer
    OrderPanel.jsx # reusable POS panel (tables + orders)
    Badge.jsx      # status pills
    Modal.jsx      # dialog
    StatCard.jsx
    Form.jsx       # inputs, buttons, cards, alerts, toggle
  pages/
    Login.jsx Dashboard.jsx Tables.jsx Orders.jsx
    Menu.jsx Reservations.jsx Staff.jsx
  utils.js         # formatMAD, todayISO, apiError, order-flow helpers
  App.jsx          # routes + Protected/AdminOnly guards
  main.jsx
  index.css        # Tailwind v4 theme tokens
```

## API contract (expected from restoflow-api)

- `POST /api/login {email,password}` → `{token, user}` · `GET /api/me`
- `GET /api/dashboard` → `{today_revenue, active_orders_count, occupied_tables_count, today_reservations_count}`
- `GET|POST /api/tables`, `GET|PUT|DELETE /api/tables/{id}` — `{id, number, seats, status}`
- `GET|POST /api/categories` (+`/{id}`) — `{id, name}`
- `GET|POST /api/menu-items` (+`/{id}`) — `{id, name, description, price, category_id, available}`
- `GET|POST /api/orders` (`{table_id}`) · `GET /api/orders/{id}` · `POST /api/orders/{id}/items {menu_item_id, qty}`
  · `PATCH /api/orders/{id}/status {status}` · `POST /api/orders/{id}/pay` → `{total}`
- `GET|POST /api/reservations` (+`/{id}`) — `{id, customer_name, phone, date, time, party_size, table_id, status}`
- `GET|POST /api/users` (+`/{id}`) — `{id, name, email, role}` (admin only)

The client tolerates both bare and Laravel `{data: …}`-wrapped payloads.

Built by Aymane Moutoute.
