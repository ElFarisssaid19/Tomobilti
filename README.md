![Tomobilti: car rental in Morocco](frontend/public/og-image.jpg)

# Tomobilti

**Book a rental car online in Morocco, pay at the agency.** A French-language car rental web app for a Moroccan agency: customers browse the fleet and book in four steps; the agency confirms, hands the cars over, issues invoices and follows its business from a back office.

![Laravel 13](docs/badges/laravel.svg) ![React 19](docs/badges/react.svg) ![Tailwind CSS 4](docs/badges/tailwind.svg) ![MySQL 8.4](docs/badges/mysql.svg) ![Tests: 457 PHPUnit, 148 Vitest, 7 end-to-end](docs/badges/tests.svg)

UI in **French**, prices in **dirhams (DH)**, timezone **Africa/Casablanca**.

![Demo: home, car page, booking, the agency confirms, the invoice](docs/demo.gif)

21-second demo: a customer books a Peugeot 208, the agency confirms the request, hands the car over and finds the paid invoice. [Watch it as a video (MP4)](docs/demo.mp4).

## Screenshots

### Customer side (desktop)

<img src="docs/screenshots/desktop-home.webp" alt="Home page: hero photo with the search by agency and dates" width="49%"> <img src="docs/screenshots/desktop-catalogue.webp" alt="Catalogue with category chips and the filter panel" width="49%">

**Home**: search by agency and dates. **Catalogue**: categories, filters and sort, all kept in the URL.

<img src="docs/screenshots/desktop-car-detail.webp" alt="Car page with the photo gallery, the price and the booking card" width="49%"> <img src="docs/screenshots/desktop-booking-recap.webp" alt="Last booking step: recap with the server's price breakdown" width="49%">

**Car page**: gallery with photo credits, availability calendar, estimated total. **Booking, step 4**: the recap priced by the server, deposit apart.

<img src="docs/screenshots/desktop-my-reservations.webp" alt="Mes réservations: upcoming reservations with their status" width="49%">

**Mes réservations**: tabs per state, status badges, invoice icon when one exists.

### Mobile

<img src="docs/screenshots/mobile-home.webp" alt="Home on a phone" width="15.5%"> <img src="docs/screenshots/mobile-catalogue.webp" alt="Catalogue on a phone" width="15.5%"> <img src="docs/screenshots/mobile-car-detail.webp" alt="Car page on a phone" width="15.5%"> <img src="docs/screenshots/mobile-booking-dates.webp" alt="Booking step 1 on a phone, with the floating total" width="15.5%"> <img src="docs/screenshots/mobile-my-reservations.webp" alt="Mes réservations on a phone" width="15.5%"> <img src="docs/screenshots/mobile-admin-dashboard.webp" alt="Admin dashboard on a phone" width="15.5%">

Home, catalogue, car page, booking (dates step), Mes réservations and the admin dashboard at 390 × 844.

### Back office

<img src="docs/screenshots/desktop-admin-dashboard.webp" alt="Admin dashboard: revenue, requests to answer, today's pick-ups and returns" width="49%"> <img src="docs/screenshots/desktop-admin-planning.webp" alt="Planning: one row per car, reservations as colored bars over two weeks" width="49%">

**Dashboard**: revenue, requests to answer, today's and tomorrow's handovers, charts. **Planning**: every car over two weeks, colored by status.

<img src="docs/screenshots/desktop-admin-reservations.webp" alt="Reservations list with tabs, filters and the CSV export" width="49%"> <img src="docs/screenshots/desktop-admin-invoices.webp" alt="Invoices with the collected and outstanding totals" width="49%">

**Reservations**: tabs, filters in the URL, CSV export. **Factures**: collected and outstanding totals, download, mark as paid, send again.

### Documents and e-mails

<img src="docs/screenshots/invoice-pdf.webp" alt="Invoice PDF: company details, lines, VAT split and the amount in words" width="32%"> <img src="docs/screenshots/voucher-pdf.webp" alt="Booking voucher PDF: reference, car, agencies with hours, documents to bring" width="32%"> <img src="docs/screenshots/email-invoice.webp" alt="The invoice e-mail in Mailpit" width="33%">

**Invoice** (A4 PDF, every amount to the centime), **booking voucher**, and the **invoice e-mail** as received (Mailpit).

## Features

**Customers**

- Catalogue with search by agency and dates, filters (category, brand, fuel, gearbox, seats, price, air conditioning) and sort, shareable through the URL; favorites.
- Car page: gallery and lightbox with photo credits, specifications, availability calendar, estimated total, similar cars.
- Booking in 4 steps with a live price from the server: dates and agencies, options, driver profile (age and licence checked), recap. Double-booking is impossible (row lock, 409).
- Mon espace: reservations per state, detail with timeline, agency contact and WhatsApp, free cancellation up to 24 hours before, voucher and invoice PDFs, notifications, profile.
- Account: sign-up with e-mail verification, password reset, sessions with "remember me".
- E-mails at each step (request received, confirmed with voucher, refused, cancelled, reminder the day before, invoice, thank you).
- Rental conditions and privacy pages generated from the real rules.

**Agency (back office)**

- Dashboard: revenue, expected revenue, requests to answer, active rentals, fleet utilisation, handovers of the day, charts, top cars.
- Reservations: tabs and filters, CSV export, status workflow (confirm, refuse, picked up with the payment, returned, cancel) with full history.
- Planning of the fleet over two weeks.
- Fleet: create and edit cars, drag-and-drop photos (cropped and optimized), status changes that list the affected bookings.
- Customers: history, total spent, activate or deactivate.
- Invoices issued at pick-up (numbered, VAT split, amount in words), marked paid, sent again.
- Settings: categories, brands, agencies, options; in-app notifications with a full list.

## Stack

| Layer | Tools |
| --- | --- |
| Backend | PHP 8.3+, Laravel 13, Laravel Sanctum (SPA cookies), barryvdh/laravel-dompdf, laravel-lang, Pint, PHPUnit |
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 8, TanStack Query 5, axios, Motion, Headless UI, react-day-picker, Recharts (admin only), sonner, lucide-react |
| Tests | PHPUnit (SQLite in memory), Vitest + Testing Library, Playwright Test + axe-core |
| Services | MySQL 8.4, Mailpit, phpMyAdmin (Docker Compose); queue worker and scheduler |

## Architecture

A React single-page app talks to a JSON-only Laravel API with Sanctum session cookies (CSRF protected). The API uses MySQL, queues every e-mail for a worker, and runs a scheduler (expired requests, pick-up reminders). The server is the only source of truth for prices, availability and statuses.

```
React SPA (Vite)  ──JSON + cookies──▶  Laravel API  ──▶  MySQL
localhost:5173                         localhost:8000     ├─ queue worker ──▶ Mailpit (SMTP)
                                                          └─ scheduler (reminders, expiry)
```

Diagrams (authentication, booking, status machine, invoices and e-mails) with explanations, in French: **[docs/architecture.md](docs/architecture.md)**.

| Document | Content |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Architecture, sequences and state machine (Mermaid, French) |
| [docs/api.md](docs/api.md) | Every endpoint by area: method, access, parameters, responses (French) |
| [docs/database.md](docs/database.md) | Schema, enums, availability rule, pricing, demo data |
| [docs/security.md](docs/security.md) | Headers, CSP, rate limits, production checklist |
| [docs/demo.md](docs/demo.md) | 5-minute demo scenario for the jury (French) |
| [docs/qa-report.md](docs/qa-report.md) | Phase 7A QA review |
| [frontend/DESIGN.md](frontend/DESIGN.md) | Design system: tokens, motion, components, copy rules |

## Setup

Prerequisites: PHP **8.3+** (`pdo_mysql`, `pdo_sqlite`, `mbstring`, `xml`, `curl`, `zip`, `bcmath`, `intl`, `gd`, `pcntl`), Composer 2, Node.js **24+**, Docker with Compose v2, Git.

```bash
# 1. Environment files (never commit the .env files)
cp .env.example .env                    # Docker services: set the MySQL passwords
cp backend/.env.example backend/.env    # DB_PASSWORD must match MYSQL_PASSWORD in ./.env
cp frontend/.env.example frontend/.env

# 2. Dependencies (root, backend, frontend)
npm run setup

# 3. MySQL, phpMyAdmin and Mailpit (waits until healthy)
npm run services:up

# 4. Laravel: key, storage link, database with the demo data
cd backend
php artisan key:generate
php artisan storage:link
php artisan migrate --seed
cd ..

# 5. Everything: API + queue worker + scheduler + Vite
npm run dev
```

Open http://localhost:5173. The SPA and the API both run on `localhost` (never `127.0.0.1`) so the session cookies are shared.

| Service | URL |
| --- | --- |
| Website (Vite) | http://localhost:5173 |
| API | http://localhost:8000 (health: `/api/health`) |
| Mailpit (every e-mail) | http://localhost:8025 |
| phpMyAdmin | http://localhost:8082 |
| MySQL | `127.0.0.1:3308`, database `tomobilti` |

Rebuild the demo data at any time with `php artisan migrate:fresh --seed` (from `backend/`; it signs everyone out). The seed is reproducible: 32 cars with real photos, 5 agencies, 27 users, 64 reservations in every status with their history and invoices, dated relative to the day you seed.

### Demo accounts

> **Development only.** These accounts exist only in the demo seed.

| E-mail | Password | Role |
| --- | --- | --- |
| `admin@tomobilti.ma` | `Tomobilti2026!` | Agency (admin) |
| `client@tomobilti.ma` | `Tomobilti2026!` | Customer |

## Commands

From the repository root:

| Command | What it does |
| --- | --- |
| `npm run dev` | API, queue worker, scheduler and Vite, with colored output |
| `npm run services:up` / `services:down` | Start / stop the Docker services (data kept in volumes) |
| `npm test` | PHPUnit then Vitest |
| `npm run lint` | Pint `--test`, ESLint, Prettier check |
| `npm run format` | Pint and Prettier |

Inside `backend/`: `php artisan route:list`, `reservations:expire`, `reservations:send-reminders`, `tomobilti:import-car-photos`, `tomobilti:import-site-photos`, `tomobilti:image-credits`, `tomobilti:e2e-cleanup`. Inside `frontend/`: `npm run build` (production build in `dist/`), `npm run preview` (the build on http://localhost:4173, with the production security headers).

## Tests

| Suite | Command | What it covers |
| --- | --- | --- |
| Backend | `npm run test:backend` | 457 PHPUnit tests: endpoints, rules, policies, workflow, PDFs, e-mails, query counts, cache, headers |
| Frontend | `npm run test:frontend` | 148 Vitest tests: components, hooks, formatting, booking rules |
| End-to-end | `cd frontend && npm run test:e2e` | 7 Playwright tests on the running app with the installed Chrome: booking, admin flow, layouts at 375 and 1366 px, axe-core |

The end-to-end suite needs `npm run dev` and Mailpit. It creates its own customers through the API on the `@e2e.tomobilti.test` domain and removes them, with their reservations and invoices, before and after each run (`php artisan tomobilti:e2e-cleanup`). `npx playwright test --headed` shows the browser.

## Production

Set `APP_DEBUG=false`, secure same-site session cookies, `SESSION_DOMAIN`, `SANCTUM_STATEFUL_DOMAINS`, `FRONTEND_URL`, a real SMTP relay and the agency's legal details (`COMPANY_*`): see the production section of [backend/.env.example](backend/.env.example). The web server serving the SPA sends the Content-Security-Policy and routes `/sitemap.xml` to the API; run a queue worker and `php artisan schedule:run` every minute. Details in [docs/security.md](docs/security.md).

## Roadmap

- [x] **Phase 0**: setup (monorepo, Docker services, Laravel API, React SPA, tooling)
- [x] **Phase 1**: database, design system, real photos and floating navbar
- [x] **Phase 2**: authentication and roles (Sanctum SPA, verification, password reset, profile)
- [x] **Phase 3**: public catalogue, search and filters, car page, home, about and contact
- [x] **Phase 4**: booking flow, pricing in DH, Mon espace, cancellation
- [x] **Phase 5**: back office (dashboard, reservation workflow, planning, fleet, customers, settings)
- [x] **Phase 6**: invoices and vouchers (PDF), e-mails, reminders, in-app notifications
- [x] **Phase 7**: polish
  - [x] **7A**: full QA review, accessibility, end-to-end suite ([report](docs/qa-report.md))
  - [x] **7B**: legal pages, notifications page, cleanup, dependencies, performance, security, SEO, documentation
- [ ] **Phase 8**: deployment (hosting, CI/CD)

## Credits and license

Car and site photos are used under their licenses (CC BY, CC BY-SA, Unsplash, Pexels), credited on the site's `/credits` page and in [docs/image-credits.md](docs/image-credits.md). Plus Jakarta Sans is under the SIL Open Font License; brand icons come from Simple Icons (CC0).

The application code is proprietary (`"license": "proprietary"` in `backend/composer.json`): all rights reserved, shared for review and education. The legal pages and the company details are demo content that the agency must validate.
