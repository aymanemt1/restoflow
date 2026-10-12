# RestoFlow — Restaurant Management SaaS

![Laravel](https://img.shields.io/badge/Laravel-FF2D20?style=flat-square&logo=laravel&logoColor=white) ![React](https://img.shields.io/badge/React-20232A?style=flat-square&logo=react&logoColor=61DAFB) ![Tests](https://img.shields.io/badge/tests-31_passed-brightgreen?style=flat-square)

A complete restaurant management system: Laravel 12 REST API + React 18 client.

## Structure

- `api/` — Laravel 12 + Sanctum backend (auth, menu, tables, orders/POS flow, reservations, staff, dashboard stats). 31 tests / 133 assertions passing.
- `client/` — React 18 + Vite + Tailwind frontend (dashboard, floor grid, POS, menu/reservations/staff management).

## Quick start

**API**
```bash
cd api
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

**Client**
```bash
cd client
npm install
# set VITE_API_URL in .env (default http://localhost:8000)
npm run dev
```

## Demo accounts

- admin@resto.test / password (admin)
- staff@resto.test / password (staff)
