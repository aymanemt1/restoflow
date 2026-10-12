# 🍽️ RestoFlow API

A complete **restaurant management REST API** built with Laravel 12 — menu, tables, orders with a kitchen status flow, reservations with double-booking protection, staff management, and a dashboard.

## ✨ Features

- 🔐 **Sanctum auth** — register, login, logout, profile, with `admin` / `staff` roles
- 📋 **Menu** — categories + items CRUD (writes require staff+)
- 🪑 **Tables** — CRUD with `free | occupied | reserved` statuses
- 🧾 **Orders** — full lifecycle `pending → preparing → served → paid` (+ `cancelled`), item price snapshots, totals computed at payment, table occupancy handled automatically
- 📅 **Reservations** — CRUD with 2-hour block double-booking protection per table
- 👥 **Staff** — admin-only user management with role selection
- 📊 **Dashboard** — today's revenue, active orders, occupied tables, today's reservations
- ✅ **Tested** — 31 feature tests (133 assertions)

## 🛠️ Stack

Laravel 12 · PHP 8.3 · Sanctum · SQLite/MySQL · PHPUnit

## 🚀 Quick start

```bash
composer install
cp .env.example .env
php artisan key:generate

touch database/database.sqlite
# in .env: DB_CONNECTION=sqlite

php artisan migrate --seed
php artisan serve   # http://localhost:8000
```

Seeded demo accounts:

| Role  | Email             | Password   |
|-------|-------------------|------------|
| Admin | admin@resto.test  | `password` |
| Staff | staff@resto.test  | `password` |

The seeders also create 8 dining tables, 4 categories + 17 menu items (Moroccan & international, prices in MAD), 3 sample orders and 3 sample reservations.

## 📡 API reference

Base URL: `http://localhost:8000/api`

### Public

| Method | Endpoint      | Description          |
|--------|---------------|----------------------|
| POST   | `/register`   | Register (new accounts are always `staff`) + token |
| POST   | `/login`      | Auth + token         |

### Authenticated (staff & admin)

| Method | Endpoint                       | Description                              |
|--------|--------------------------------|------------------------------------------|
| GET    | `/me`                          | Profile                                  |
| POST   | `/logout`                      | Revoke current token                     |
| GET    | `/categories`, `/categories/{id}` | Menu categories (filterable, paginated) |
| GET    | `/menu-items`, `/menu-items/{id}` | Menu items (`?category_id=&available=&search=`) |
| GET/POST | `/tables`                    | List / create dining tables              |
| GET/PATCH/DELETE | `/tables/{id}`       | Table detail / update / delete           |
| GET/POST | `/orders`                    | List (`?status=&dining_table_id=`) / create order |
| GET    | `/orders/{id}`                 | Order detail (table, staff, items)       |
| POST   | `/orders/{id}/items`           | Add items to an open order               |
| PATCH  | `/orders/{id}/status`          | Move along the status flow               |
| GET/POST | `/reservations`              | List (`?date=&status=&dining_table_id=`) / create |
| GET/PATCH/DELETE | `/reservations/{id}` | Reservation detail / update / delete    |
| GET    | `/dashboard`                   | Today's revenue, active orders, occupied tables, today's reservations |

### Staff+ only (menu writes)

`POST/PATCH/DELETE /categories`, `POST/PATCH/DELETE /menu-items`

### Admin only

| Method | Endpoint                  | Description                      |
|--------|---------------------------|----------------------------------|
| GET/POST | `/admin/staff`          | List / create users (with `role`) |
| GET/PATCH/DELETE | `/admin/staff/{id}` | User detail / update / delete  |

### Order status flow

```
pending → preparing → served → paid
   ↓          ↓          ↓
 cancelled (any open state)
```

- Creating an order on a `free` table marks it `occupied`.
- Paying (`served → paid`) computes the total from the per-line price snapshots and stores it; the table is freed when no other open order sits on it.
- Cancelling also frees the table (same rule).
- Items can only be added while the order is open (not `paid` / `cancelled`), and unavailable menu items are rejected.

### Reservations

Each reservation holds its table for a **2-hour block** from the reservation time. Creating or updating a reservation that overlaps an existing non-cancelled reservation for the same table (same date) is rejected with `422`.

## 🧪 Tests

```bash
php artisan test
```

31 tests / 133 assertions, sqlite in-memory: auth & roles, menu CRUD + staff boundary, table CRUD + delete guard, full order lifecycle (create → add items → status flow → paid total), price-snapshot behavior, invalid transitions, reservation double-booking (overlap / edge / different table / cancelled ignored), dashboard numbers.
