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
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 8, axios, lucide-react, Motion, Headless UI, react-day-picker, sonner, ESLint, Prettier, Vitest + Testing Library |
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

# 5. Run everything (API + queue worker + Vite)
npm run dev
```

Open http://localhost:5173: the home page should show a green **"API connectée"** badge.

## Database and demo data

The schema, the enums, the availability rule and the demo data are documented in **[docs/database.md](docs/database.md)**.

Rebuild the database with the demo data at any time (from `backend/`):

```bash
php artisan migrate:fresh --seed
```

The seed is reproducible (fixed Faker seed): 32 cars with real photos (committed in `backend/database/seeders/assets/cars`, credits in [docs/image-credits.md](docs/image-credits.md)), 5 pick-up locations, 27 users and 64 reservations in every status, with their invoices. Reservation dates are relative to the day you seed.

### Demo accounts

> **Development only.** These accounts and their password exist only in the demo seed. Never use them in production.

| Email                 | Password   | Role   |
| --------------------- | ---------- | ------ |
| `admin@tomobilti.ma`  | `password` | Admin  |
| `client@tomobilti.ma` | `password` | Client |

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
| `npm run dev`           | API (`php artisan serve`) + queue worker + Vite, colored output  |
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
```

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
- [ ] **Phase 3: Catalogue** (cars, categories, images, search and filters)
- [ ] **Phase 4: Reservation** (availability, booking flow, pricing in MAD)
- [ ] **Phase 5: Admin dashboard** (fleet, bookings, customers, statistics)
- [ ] **Phase 6: Invoices & notifications** (PDF invoices, emails)
- [ ] **Phase 7: Polish** (UX, accessibility, performance, tests)
- [ ] **Phase 8: Deployment** (production hosting, CI/CD)
