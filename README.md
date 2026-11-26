# Tomobilti

**Tomobilti** is a car rental web application (_location de voitures_) for a Moroccan rental agency.
Customers browse the catalogue and book a car online; the agency manages its fleet, bookings and invoices from an admin dashboard.

- UI language: **French**
- Currency: **MAD (DH)**
- Timezone: **Africa/Casablanca**

## Architecture

```
┌─────────────────────────┐   HTTP (JSON) + cookies   ┌──────────────────────────┐
│  frontend/  React SPA   │ ────────────────────────▶ │  backend/  Laravel API   │
│  Vite · localhost:5173  │ ◀──────────────────────── │  localhost:8000          │
└─────────────────────────┘   Sanctum SPA auth, CORS  └────────────┬─────────────┘
                                                                   │
                                          ┌────────────────────────┴───────────┐
                                          │ Docker: MySQL 8.4 · Mailpit · PMA  │
                                          └────────────────────────────────────┘
```

One monorepo, two independent apps:

| Folder      | What                                                                 |
| ----------- | -------------------------------------------------------------------- |
| `backend/`  | Laravel REST API (JSON only). Auth with Laravel Sanctum (SPA cookies). |
| `frontend/` | React single-page app built with Vite.                               |
| root        | Docker services, shared VS Code config, scripts that drive both apps. |

The SPA and the API both run on **`localhost`** (never `127.0.0.1`) so Sanctum's session and XSRF cookies are shared between them.

## Stack

| Layer    | Tools                                                                                     |
| -------- | ----------------------------------------------------------------------------------------- |
| Backend  | PHP 8.3+, Laravel 13, Laravel Sanctum, laravel-lang (French translations), Pint, PHPUnit |
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 8, axios, TanStack Query 5, lucide-react, Motion, Headless UI, react-day-picker, sonner, ESLint, Prettier, Vitest + Testing Library |
| Services | MySQL 8.4, phpMyAdmin, Mailpit (Docker Compose)                                           |

## Prerequisites

- PHP **8.3+** with extensions: `pdo_mysql`, `mbstring`, `xml`, `curl`, `zip`, `bcmath`, `intl`, `gd`, `pcntl`, plus `pdo_sqlite` (tests run on in-memory SQLite)
- Composer 2
- Node.js **24 LTS** or newer, npm
- Docker with Docker Compose v2+
- Git

Ubuntu example for the PHP extensions:

```bash
sudo apt install php8.5-{mysql,mbstring,xml,curl,zip,bcmath,intl,gd,sqlite3}
```

## Setup from a fresh clone

```bash
# 1. Environment files (never commit the .env files)
cp .env.example .env                    # Docker services: set the MySQL passwords
cp backend/.env.example backend/.env    # Laravel: DB_PASSWORD must match MYSQL_PASSWORD in ./.env
cp frontend/.env.example frontend/.env

# 2. Dependencies (root, backend, frontend)
npm run setup

# 3. Start MySQL, phpMyAdmin and Mailpit (waits until they are healthy)
npm run services:up

# 4. Laravel: app key, public storage link, database with demo data
cd backend
php artisan key:generate
php artisan storage:link
php artisan migrate --seed
cd ..

# 5. Run everything (API + queue worker + scheduler + Vite)
npm run dev
```

Open http://localhost:5173: the home page should show a green **"API connectée"** badge.

## Database and demo data

The schema, the enums, the availability rule and the demo data are documented in **[docs/database.md](docs/database.md)**.

Rebuild the database with the demo data at any time (from `backend/`):

```bash
php artisan migrate:fresh --seed
```

The seed is reproducible (fixed Faker seed): 32 cars with real photos (committed in `backend/database/seeders/assets/cars`, credits in [docs/image-credits.md](docs/image-credits.md)), 5 pick-up locations, 27 users and 64 reservations in every status, with their status history and invoices. Reservation dates are relative to the day you seed.

### Demo accounts

> **Development only.** These accounts and their password exist only in the demo seed. Never use them in production.

| Email                 | Password   | Role   |
| --------------------- | ---------- | ------ |
| `admin@tomobilti.ma`  | `Tomobilti2026!` | Admin  |
| `client@tomobilti.ma` | `Tomobilti2026!` | Client |

## URLs and ports

All Docker ports are bound to `127.0.0.1` only.

| Service              | URL / port                              | Notes                                                       |
| -------------------- | --------------------------------------- | ----------------------------------------------------------- |
| Frontend (Vite)      | http://localhost:5173                   | `strictPort`: fails instead of switching port                |
| API (Laravel)        | http://localhost:8000                   | Health check: http://localhost:8000/api/health              |
| phpMyAdmin           | http://localhost:8082                   | Log in with `MYSQL_USER` / `MYSQL_PASSWORD` from `./.env`   |
| Mailpit (web UI)     | http://localhost:8025                   | Every email sent by Laravel lands here                      |
| Mailpit (SMTP)       | `localhost:1025`                        | Used by Laravel (`MAIL_PORT`)                               |
| MySQL                | `127.0.0.1:3308`                        | Database `tomobilti`. Laravel uses `DB_HOST=127.0.0.1` (TCP) |

> Ports 3308 and 8082 are used instead of 3307 and 8081, which were already taken on the machine where this project was set up.
> To change a port, edit `./.env` (Docker) and the matching value in `backend/.env` (`DB_PORT`, `MAIL_PORT`).

## Useful commands

Run from the repository root:

| Command                 | What it does                                                     |
| ----------------------- | ---------------------------------------------------------------- |
| `npm run dev`           | API (`php artisan serve`, with `backend/php/dev.ini` for photo uploads) + queue worker + scheduler (`php artisan schedule:work`) + Vite, colored output |
| `npm run services:up`   | Start the Docker services and wait until healthy                 |
| `npm run services:down` | Stop the Docker services (data is kept in Docker volumes)        |
| `npm run services:logs` | Follow the Docker services logs                                  |
| `npm run setup`         | Install dependencies (root, `backend/`, `frontend/`)             |
| `npm test`              | PHPUnit (backend) then Vitest (frontend)                         |
| `npm run lint`          | Pint `--test` (backend), ESLint + Prettier check (frontend)      |
| `npm run format`        | Pint (backend), Prettier (frontend)                              |

Each command also exists per app, for example `npm run test:backend` or `npm run lint:frontend`.

Inside `backend/`:

```bash
php artisan migrate:fresh --seed   # rebuild the database
php artisan route:list             # list routes
php artisan tinker                 # REPL
php artisan lang:update            # update the French translations (laravel-lang)
php artisan tomobilti:import-car-photos   # download and optimize the demo car photos (WebP 800 + 1600 px)
php artisan tomobilti:import-site-photos  # same for the SPA's site photos (frontend/src/assets/photos)
php artisan tomobilti:image-credits       # regenerate docs/image-credits.md and the /credits data
php artisan reservations:expire           # refuse pending requests whose pick-up time has passed
php artisan reservations:send-reminders   # pick-up reminders (24 h before); --reference=TMB-… for one reservation
php artisan schedule:work                 # run the scheduler locally (npm run dev starts it)
```

In production, run the scheduler every minute with cron: `* * * * * cd /path/to/backend && php artisan schedule:run`.

Inside `frontend/`:

```bash
npm run build     # production build in dist/
npm run preview   # serve the build on http://localhost:4173
```

## Who works where

`backend/` and `frontend/` are independent apps with their own dependencies, env file, linter and tests. They only share the HTTP contract (JSON over `/api/*`).

- **Backend developers** work in `backend/`. You only need PHP, Composer and Docker; test endpoints with `curl` or an HTTP client.
- **Frontend developers** work in `frontend/`. You need Node.js, plus a running API (`npm run services:up` and `npm run dev:api` from the root).

### API conventions

- Every response is JSON. Requests to `api/*` are forced to `Accept: application/json`, so even 404, 401, 403, 422 and 500 errors come back as JSON.
- Error shape:

  ```json
  { "message": "Le champ adresse e-mail est obligatoire.", "errors": { "email": ["…"] } }
  ```

  `errors` is only present for validation errors (422). With `APP_DEBUG=true`, 500 errors also include a `debug` key.

- Messages are in French (`APP_LOCALE=fr`); validation messages come from `laravel-lang`, API error messages from `backend/lang/fr/api.php`.
- Models are returned through **Eloquent API Resources** (`app/Http/Resources`), never as raw models.
- The SPA calls the API with the shared axios instance in `frontend/src/api/client.js` (`withCredentials` and `withXSRFToken` enabled). Call `getCsrfCookie()` before login or register.

## Authentication and roles

Sanctum **SPA cookie authentication** (no tokens): the browser keeps a Laravel session cookie and an `XSRF-TOKEN` cookie that axios sends back as a header. Controllers live in `backend/app/Http/Controllers/Auth` (no Fortify, no Breeze), validation in `app/Http/Requests`.

```
SPA                                         API
GET  /sanctum/csrf-cookie            ───▶   sets XSRF-TOKEN cookie
POST /api/auth/login | register      ───▶   session cookie (+ remember cookie if asked)
GET  /api/user                       ───▶   UserResource (401 for guests)
```

| Endpoint                                         | Auth        | Notes                                                                              |
| ------------------------------------------------ | ----------- | ---------------------------------------------------------------------------------- |
| `POST /api/auth/register`                        | —           | Role is always `client`. Logs in and sends the verification email. 6/min           |
| `POST /api/auth/login`                           | —           | `remember`. 5 failed attempts per minute per email + IP (429). Disabled account: 403 |
| `POST /api/auth/logout`                          | session     | Invalidates the session, new CSRF token                                            |
| `GET /api/user`                                  | session     | `UserResource` (never the password hash, the remember token or `is_active`)        |
| `POST /api/auth/forgot-password`                 | —           | Same answer whether the account exists or not. 6/min                               |
| `POST /api/auth/reset-password`                  | —           | Token from the email. 6/min                                                        |
| `POST /api/auth/email/verify/{id}/{hash}`        | signed URL  | Called by `/verifier-email`; works signed in or not. 403 `expired` / `invalid`     |
| `POST /api/auth/email/verification-notification` | session     | Resend the verification email. 6/min                                               |
| `PUT /api/profile`                               | session     | Any subset of the profile; 18+, licence after the 18th birthday, new email = re-verify |
| `PUT /api/profile/password`                      | session     | `current_password` required                                                        |
| `GET /api/admin/ping`                            | admin       | `admin` middleware: 401 for guests, 403 for clients                                |

- **Emails** (`app/Notifications/Auth`): French, Tomobilti theme (`resources/views/vendor/mail`), queued, delivered to Mailpit in development. The links open the React app: `FRONTEND_URL/verifier-email?id&hash&expires&signature` and `FRONTEND_URL/reinitialiser-mot-de-passe?token&email`. The queue worker (`npm run dev` starts it) must run for them to leave.
- **Roles**: the `role` column is not mass assignable. The `access-admin` gate (`AppServiceProvider`) backs the `admin` middleware alias; model policies go in `app/Policies`.
- **SPA** (`frontend/src`): `context/AuthContext.jsx` loads the user on start and exposes `useAuth()` (`user`, `status`, `isAdmin`, `isVerified`, `login`, `register`, `logout`, `refreshUser`). The axios client retries once after a 419 with a fresh CSRF cookie and clears the user on 401. Guards: `GuestRoute`, `ProtectedRoute` (→ `/connexion?redirect=…`), `AdminRoute` (clients see a 403 page).
- **Pages**: `/connexion`, `/inscription`, `/mot-de-passe-oublie`, `/reinitialiser-mot-de-passe`, `/verifier-email`, `/espace/profil`, `/espace/reservations`, `/admin`. After login, admins land on `/admin`, clients on `?redirect=` or `/espace/profil`.

## Public catalogue and website (Phase 3)

No authentication. JSON through API Resources, French messages, **60 requests per minute** per
visitor (`catalog` limiter in `AppServiceProvider`). Only cars with the status `available` are
public, and no endpoint exposes customers or reservation details.

| Endpoint                                   | Notes                                                                                                                                                                                                                                                                           |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/cars`                            | 12 per page (`meta`, `links`). Filters: `category`, `brand`, `fuel`, `slug` (one or more, comma separated), `transmission`, `seats_min`, `price_min`, `price_max`, `location`, `air_conditioning`, `q` (brand and model), `start_at` + `end_at` (YYYY-MM-DD, free for the whole days). `sort`: `price_asc` (default), `price_desc`, `newest` (model year), `popular` (completed reservations) |
| `GET /api/cars/featured`                   | Featured available cars, cheapest first                                                                                                                                                                                                                                         |
| `GET /api/cars/{slug}`                     | Detail: every photo (800 / 1600 px URLs, alt, author, license, license URL, source), specs, description, deposit, home agency with hours, and `similar` (4 cars of the same category, closest in price). 404 for cars in maintenance, out of service or soft deleted          |
| `GET /api/cars/{slug}/availability`        | `?from=&to=` (default today → 6 months, 6 months max): `unavailable` date ranges of blocking reservations, dates only                                                                                                                                                           |
| `GET /api/catalog/filters`                 | Categories, brands and locations with their available car counts, transmission and fuel options, seat counts, min / max price per day                                                                                                                                         |
| `GET /api/categories`                      | In display order, with `cars_count` (available cars)                                                                                                                                                                                                                            |
| `GET /api/locations`                       | Active pick-up points with address, phone and opening hours                                                                                                                                                                                                                     |
| `GET /api/extras`                          | Active options (chosen in the booking flow)                                                                                                                                                                                                                                        |
| `POST /api/contact`                        | `name`, `email`, `phone` (optional), `subject`, `message`. Queues a French email to `AGENCY_EMAIL` (default `contact@tomobilti.ma`, Mailpit in development) with the visitor as Reply-To. **3 per 10 minutes per IP** (`contact` limiter)                                         |

- Filtering lives in `app/Filters/CarFilter.php`: one small method per query parameter, each
  adding an `AND` condition, validated first by `app/Http/Requests/Catalog/CarIndexRequest.php`.
- Dates are whole days: a blocking reservation (`pending`, `confirmed`, `active`) touching the
  first or the last day excludes the car, which matches the days struck through in its calendar.
- Lists eager-load `brand`, `category`, `location` and the primary image (a test checks that
  the number of queries does not grow with the number of cars).

**SPA pages:** `/` (search by agency and dates, categories, featured cars, how it works,
agencies, FAQ), `/voitures` (catalogue; every filter, the sort and the page live in the URL),
`/voitures/:slug` (gallery and lightbox with photo credits, specs, availability calendar,
estimated total, options, similar cars), `/a-propos`, `/contact`, and `/reserver/:slug`
(signed-in users, the booking flow of Phase 4). Guests who press "Réserver" go to
`/connexion?redirect=…` and come back to the car with their dates. Favorites are kept in the
browser (`localStorage`) for now. Server state uses TanStack Query (conventions in
[frontend/DESIGN.md](frontend/DESIGN.md), "Data").

## Reservations (Phase 4)

Customers book a car online; **payment and the deposit are handled at the agency at
pick-up** (no online payment). The server is the only source of truth for prices and
availability: the SPA sends the customer's choices, never a price.

### Booking rules

All in `backend/config/tomobilti.php` (`booking`), also served to the SPA by `GET /api/booking-rules`.

| Rule | Value |
| --- | --- |
| Pick-up and return times | 08:00 to 20:00, every 30 minutes |
| Earliest / latest pick-up | 2 hours from now / 6 months ahead |
| Duration | 1 to 30 billed days; days = ceil(duration in hours / 24) |
| Driver | at least 21 years old and licence held for at least 2 years, on the pick-up date |
| Profile needed to book | verified email, active account, phone, birth date, CIN, licence number and date |
| Free cancellation | until 24 hours before pick-up (pending or confirmed reservations) |
| One-way fee | 300 DH when the return agency differs from the pick-up agency |
| Price | days × price per day + options (per day: × days × quantity; per rental: × quantity) + one-way fee. The deposit is never in the total |

The pricing (`App\Services\ReservationPricing`), the eligibility check (`App\Services\BookingEligibility`)
and the double-booking protection are described in [docs/database.md](docs/database.md#pricing-phase-4).

### Endpoints

| Endpoint | Auth | Notes |
| --- | --- | --- |
| `GET /api/booking-rules` | — | The rules above. 120/min (`booking` limiter) |
| `POST /api/reservations/quote` | — | `car`, `start_at`, `end_at` (`YYYY-MM-DD HH:MM`, agency time), `pickup_location`, `return_location`, `extras: [{ slug, quantity }]`. Returns the price breakdown, `available` (+ French message), and for a signed-in customer `eligibility` (`eligible`, French `reasons`, `missing_fields`) and `can_book`. 120/min |
| `POST /api/reservations` | session + verified email | Quote input + `customer_notes`, `terms`. Validates again, checks eligibility (422 with the reasons), then creates a **pending** reservation in a transaction that locks the car row: a car booked meanwhile answers **409** with a French message. Price, extras and deposit are snapshotted. 10/min |
| `GET /api/reservations` | session | My reservations: `tab` = `upcoming` (default), `current`, `past`, `cancelled`; 10 per page; `meta.counts` per tab |
| `GET /api/reservations/{reference}` | session | One of mine (404 otherwise): car with photos, agencies (address, hours, phone), extras, price breakdown, status timestamps, `cancellation` (`allowed`, French `reason`, `free_until`) |
| `POST /api/reservations/{reference}/cancel` | session | `reason` optional. Mine only (404), pending or confirmed, more than 24 h before pick-up; otherwise 403 with the French reason |

- `ReservationPolicy` covers every customer action (`viewAny`, `view`, `create`, `cancel`).
- `reservations:expire` (every five minutes) refuses pending requests whose pick-up time has
  passed, with the reason "Demande expirée", and emails the refusal (Phase 6).

### SPA pages

- `/reserver/:slug` (signed-in users): 4 steps (Dates et agences, Options, Informations,
  Récapitulatif) with a live summary of the server's quote, the profile completed inline,
  the choices kept in `sessionStorage` across a refresh or the login detour, similar free
  cars when the car is taken, and a confirmation screen with the reference.
- `/espace/reservations`: tabs À venir, En cours, Passées, Annulées.
- `/espace/reservations/:reference`: status timeline, agencies with phone and WhatsApp,
  price breakdown, documents to bring, free cancellation with a confirmation dialog.

Details in [frontend/DESIGN.md](frontend/DESIGN.md) ("Booking flow and reservations").

## Admin back office (Phase 5)

The agency's back office at `/admin` (admins only; clients get the 403 page). The SPA
loads it lazily, so visitors and clients never download it (Recharts included).

### What the agency can do

- **Tableau de bord**: period switch (30 jours, 90 jours, 12 mois, in the URL), KPIs
  (revenue, expected revenue, requests to answer, active rentals, fleet utilisation),
  reservations received per status, today's and tomorrow's pick-ups and returns, alerts
  (pending requests within 48 h, cars in maintenance or out of service), revenue per month
  and reservations per week charts, top 5 cars, share per category and per agency, latest
  reservations.
- **Réservations**: tabs À traiter / Aujourd'hui / En cours / Toutes with counts, filters
  in the URL (status, agency, car, dates, search on reference, name, email or phone),
  sort, table on desktop and cards on mobile, CSV export of the filtered list. The detail
  page shows the client, the car, the agencies, the price breakdown, the notes and the full
  status history, with the actions the status allows: Confirmer, Refuser (reason
  required), Marquer comme récupérée, Marquer comme rendue, Annuler (reason required).
- **Planning**: one row per car, the reservations as bars colored by status over two weeks
  (week navigation, today marker, tooltips, click to open). No calendar library.
- **Voitures**: search, filters, status badges; create and edit in sections; photos
  uploaded by drag and drop (progress per file), reordered, set as primary, described
  (alt text) or deleted; status change that lists the affected reservations first;
  removal (soft delete, refused while reservations still need the car) and restore.
- **Clients**: search and filters, reservation count and total spent, detail page with
  the history, activate / deactivate.
- **Paramètres**: categories, brands, agencies and options, with modal forms. Anything
  still in use cannot be deleted (409 with the reason); agencies and options are
  deactivated instead.

### Rules the server enforces

- Every route below is behind `auth:sanctum` + `admin` (401 for guests, 403 for clients,
  checked before route model binding) and each action also has a policy
  (`app/Policies`: `CarPolicy`, `UserPolicy`, `ReservationPolicy`, settings policies).
- **Every status change goes through `App\Services\ReservationWorkflow`**: it locks the
  reservation row, checks `ReservationStatus::canTransitionTo()`, saves the timestamp and
  reason, and writes a `reservation_status_histories` row with the author (customer,
  admin, or none for the scheduler). Confirming also locks the car row and checks again
  that the car is rentable and that no other blocking reservation overlaps (409
  otherwise). A move the status does not allow answers 403 with the French reason.
- **Deactivating a client** deletes their database sessions, replaces their remember-me
  token and revokes API tokens: their next request answers 401 and they cannot sign in
  again. An admin cannot deactivate themselves or another admin.
- **Photos** (`App\Services\CarPhotoUploader`) use the same GD pipeline as the demo
  photos: EXIF orientation applied, 16:10 crop, `-1600.webp` and `-800.webp`, metadata
  removed, credited "Tomobilti". JPG, PNG or WebP, 5 MB each. The first real photo
  replaces the SVG placeholder.
- **Dashboard figures** are defined in `App\Services\DashboardStats` (one aggregate query
  each): revenue = completed reservations returned in the period; expected revenue =
  confirmed + active; utilisation = hours of confirmed, active and completed rentals
  inside the period / (cars not removed and not out of service × days).

### Endpoints

All under `/api/admin`, JSON, French messages. Cars and settings are found by id,
reservations by reference.

| Endpoint                                                | Notes                                                                                                                                                                                                                                    |
| ------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /dashboard?period=30d\|90d\|12m`                   | KPIs, `today`, `charts`, `alerts`, `recent`                                                                                                                                                                                              |
| `GET /reservations`                                     | `tab` (`pending`, `today`, `active`, `all`), `status` (comma separated), `from`, `to`, `car`, `location`, `q`, `sort` (`start_at`, `end_at`, `created_at`, `total`, `reference`), `direction`, `page`, `per_page`; `meta.counts` per tab |
| `GET /reservations/export`                              | Same filters, every page, CSV: UTF-8 with BOM, `;` separators, decimal commas, French headers                                                                                                                                            |
| `GET /reservations/{reference}`                         | Client, car, agencies, extras, `pricing`, notes, `timeline`, `invoice`, `history`                                                                                                                                                        |
| `POST /reservations/{reference}/confirm`                | pending → confirmed (car locked, availability checked again)                                                                                                                                                                             |
| `POST /reservations/{reference}/reject`                 | `reason` required; pending → rejected                                                                                                                                                                                                    |
| `POST /reservations/{reference}/pick-up`                | `payment_method` (`cash`, `card`, `bank_transfer`) and `paid` (boolean) required; confirmed → active, `picked_up_at`, and issues the invoice (Phase 6)                                                                                     |
| `GET /reservations/{reference}/voucher`                 | Booking voucher PDF (confirmed, active, completed; 404 otherwise)                                                                                                                                                                        |
| `POST /reservations/{reference}/return`                 | active → completed, `returned_at`                                                                                                                                                                                                        |
| `POST /reservations/{reference}/cancel`                 | `reason` required; pending or confirmed → cancelled (no 24 h limit for the agency)                                                                                                                                                       |
| `PATCH /reservations/{reference}/notes`                 | `admin_notes` (never shown to the customer)                                                                                                                                                                                              |
| `GET /planning?from=&to=`                               | Per car, its reservations in the range (cancelled and refused left out); 31 days max, default this week + next                                                                                                                           |
| `GET /cars`                                             | `q`, `status`, `category`, `brand`, `location`, `deleted` (`with`, `only`), `sort`, `direction`, `page`, `per_page`                                                                                                                      |
| `POST /cars`, `GET\|PUT /cars/{id}`                     | Form request; plate normalized to `12345-A-6` and unique; slug from brand + model + year, unique                                                                                                                                         |
| `DELETE /cars/{id}`, `POST /cars/{id}/restore`          | Soft delete, 409 with the reservations while upcoming or current ones need the car                                                                                                                                                       |
| `GET /cars/{id}/status-conflicts`                       | Pending and confirmed reservations not over yet                                                                                                                                                                                          |
| `PATCH /cars/{id}/status`                               | `status`, `force`; without `force`, 409 with the affected reservations                                                                                                                                                                   |
| `POST /cars/{id}/images`                                | Multipart `images[]` (1 to 10)                                                                                                                                                                                                           |
| `PUT /cars/{id}/images/order`                           | `ids`: every photo, once                                                                                                                                                                                                                 |
| `PATCH\|DELETE /cars/{id}/images/{image}`               | `alt`, `is_primary` / delete with the files                                                                                                                                                                                              |
| `GET /clients`, `GET /clients/{id}`                     | `q`, `active`, `verified`, `sort`; detail with `stats` and `reservations`                                                                                                                                                                |
| `POST /clients/{id}/activate`, `/deactivate`            | Deactivation ends every session                                                                                                                                                                                                          |
| `GET\|POST /categories`, `PUT\|DELETE /categories/{id}` | Same for `/brands`, `/locations`, `/extras`; 409 when in use                                                                                                                                                                             |

### SPA routes

`/admin`, `/admin/reservations`, `/admin/reservations/:reference`, `/admin/planning`,
`/admin/factures` (Phase 6), `/admin/voitures`, `/admin/voitures/nouvelle`, `/admin/voitures/:id`, `/admin/clients`,
`/admin/clients/:id`, `/admin/parametres` (`?onglet=categories|brands|locations|extras`).
The sidebar badge on Réservations shows the requests to answer, refreshed every 60 seconds.
Details in [frontend/DESIGN.md](frontend/DESIGN.md) ("Admin back office").

### Photo uploads in development

PHP's defaults (2 MB per file, 8 MB per request) are below the 5 MB photo limit, so
`npm run dev:api` loads `backend/php/dev.ini` through `PHP_INI_SCAN_DIR` (the system
`php.ini` is not changed). In production, set the same limits (`upload_max_filesize`,
`post_max_size`) in PHP-FPM and the web server.

## Invoices, emails and notifications (Phase 6)

### Invoices and vouchers

- **Payment happens at the agency, at pick-up.** "Marquer comme récupérée" asks for the
  payment method (espèces, carte, virement) and whether it is paid now; the same
  transaction moves the reservation to `active` and issues the invoice (`Invoice::issueFor`),
  paid or unpaid. An unpaid invoice is marked as paid later from `/admin/factures` or the
  reservation page. Numbers: `FAC-{year}-{6 digits}`, retried on a unique-index conflict.
- Amounts are TTC as booked; `Invoice::splitTotal()` gives HT and TVA 20 % (bcmath).
- **PDFs** (`App\Services\ReservationDocuments`, barryvdh/laravel-dompdf, views in
  `backend/resources/views/pdf`): the **bon de réservation** (confirmed, active and completed
  reservations: reference, client, car and plate, dates, agencies with address and hours,
  options, price, deposit, documents to bring) and the **facture** (company details, client
  with address and CIN, lines, total HT, TVA, total TTC, the amount in words with PHP intl,
  payment method and status). A4, light, Plus Jakarta Sans embedded as a subset
  (`backend/resources/fonts`, SIL Open Font License).
- **Company details** come from `config/tomobilti.php` (`company`, `COMPANY_*` env
  variables). The defaults are **demo values** (ICE, RC and IF are all zeros).

### Emails

French, queued, in the branded light theme (`resources/views/mail/reservation.blade.php`:
a title, the key details, one button). Each one is dispatched **after the database
commit** of the change it describes (`afterCommit`), and each event is notified once: the
status change is made under a row lock by `ReservationWorkflow`, then
`App\Services\ReservationNotifier` sends its notifications.

| Event | Client | Agency (`AGENCY_EMAIL`) | In-app |
| --- | --- | --- | --- |
| Booking (pending) | Demande reçue | Nouvelle demande (Reply-To: the client) | Admins |
| Confirmed | Réservation confirmée + voucher PDF | | Client |
| Refused (agency or expired) | Réservation refusée, with the reason | | Client |
| Cancelled by the client | Confirmation | Annulation client | Admins |
| Cancelled by the agency | Réservation annulée, with the reason | | Client |
| Pick-up reminder (24 h before) | Rappel: agency address, hours, documents | | Client |
| Picked up (invoice issued) | Votre facture + PDF | | Client |
| Invoice sent again by the agency | Votre facture + PDF | | |
| Returned | Merci | | |

The queue worker must run for emails and in-app notifications to leave (`npm run dev`
starts it). In development they land in Mailpit (http://localhost:8025).

### Pick-up reminder

`reservations:send-reminders` runs **every 15 minutes** (`routes/console.php`). It reminds
confirmed reservations whose pick-up is less than 24 hours away, once: each reservation is
claimed by setting `reservations.reminder_sent_at` with a conditional update before the
reminder is queued. Cancelled, pending and started reservations are skipped.

### Endpoints

| Endpoint | Auth | Notes |
| --- | --- | --- |
| `GET /api/reservations/{reference}/voucher` | session | My reservation only; PDF once confirmed, 404 before |
| `GET /api/reservations/{reference}/invoice` | session | My reservation only; PDF once issued, 404 before |
| `GET /api/notifications` | session | 15 per page, newest first, `meta.unread_count` |
| `POST /api/notifications/{id}/read` | session | Mine only (404); returns `meta.unread_count` |
| `POST /api/notifications/read-all` | session | |
| `GET /api/admin/invoices` | admin | `status`, `payment_method`, `from`, `to` (issue date), `q` (number, reference, client), `sort` (`issued_at`, `number`, `total_ttc`), `direction`, `page`, `per_page`; `meta.totals` (`count`, `total`, `paid`, `unpaid`) for the whole filtered list |
| `GET /api/admin/invoices/{number}/pdf` | admin | PDF |
| `POST /api/admin/invoices/{number}/mark-paid` | admin | `payment_method`; 403 when already paid |
| `POST /api/admin/invoices/{number}/send` | admin | Emails the invoice to the client again |
| `GET /api/admin/reservations/{reference}/voucher` | admin | PDF |

Reservations now return `has_voucher` and `invoice` (number, status; plus method, total
and dates on the admin detail).

### SPA

- **Bell** (`components/notifications/NotificationBell.jsx`) in the floating navbar, the
  mobile top bar and the admin topbar: unread count refreshed every 60 seconds, a panel
  with the latest notifications (icon, short text, relative time), a click opens the
  reservation and marks it read, "Tout marquer comme lu".
- `/espace/reservations/:reference`: "Télécharger le bon de réservation" and "Télécharger
  la facture" when they exist; the list shows a small invoice icon.
- `/admin/factures` (sidebar "Factures"): totals (encaissé, à encaisser), filters in the
  URL, table (cards on phones), download, mark as paid, send again. The reservation page
  shows the invoice card and the voucher download.

## VS Code

Open the repository root. Install the recommended extensions when VS Code suggests them (`.vscode/extensions.json`).
Saving a file formats it: Prettier and ESLint for JS/JSX/CSS, Laravel Pint for PHP (official Laravel extension, `Laravel.basePath` is set to `backend`).

## Roadmap

- [x] **Phase 0: Setup** (monorepo, Docker services, Laravel API, React SPA, tooling)
- [x] **Phase 1: Database** (schema, migrations, models, seeders)
  - [x] **1A Base de données** (enums, migrations, models, relations, factories, seeders; see [docs/database.md](docs/database.md))
  - [x] **1B Design system (frontend)** (tokens, motion, UI kit, layouts, style guide at `/design` in development; see [frontend/DESIGN.md](frontend/DESIGN.md))
  - [x] **1C Photos & navbar** (real car and site photos imported with their credits, floating desktop navbar; see [docs/image-credits.md](docs/image-credits.md))
- [x] **Phase 2: Auth & roles** (Sanctum SPA login, registration, email verification, password reset, customer profile, admin role; see [Authentication and roles](#authentication-and-roles))
- [x] **Phase 3: Catalogue** (public catalogue API, search and filters, car detail with availability, home, about and contact pages; see [Public catalogue and website](#public-catalogue-and-website-phase-3))
- [x] **Phase 4: Reservation** (booking flow, pricing in MAD, my reservations, cancellation, new home hero photo; see [Reservations](#reservations-phase-4))
- [x] **Phase 5: Admin back office** (dashboard and statistics, reservations with status history, planning, fleet and photos, customers, catalogue settings; see [Admin back office](#admin-back-office-phase-5))
- [x] **Phase 6: Invoices & notifications** (invoices issued at pick-up, PDF invoices and booking vouchers, emails, in-app notifications, pick-up reminders; see [Invoices, emails and notifications](#invoices-emails-and-notifications-phase-6))
- [ ] **Phase 7: Polish** (UX, accessibility, performance, tests)
- [ ] **Phase 8: Deployment** (production hosting, CI/CD)
