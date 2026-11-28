# QA report: Phase 7A, full review

Review of the whole app on 26 November 2026, after Phases 0 to 6. No new features: bugs,
layout, accessibility and consistency only. Every fix was made in the shared component,
hook or service, then checked again in the browser.

## Summary

| Severity | Found | Fixed | Left |
| -------- | ----: | ----: | ---: |
| Critique | 1 | 1 | 0 |
| Majeur | 9 | 9 | 0 |
| Mineur | 20 | 16 | 4 |
| **Total** | **30** | **26** | **4** |

**axe-core** (WCAG 2.2 AA + best practices, every main page at 375 × 667 and 1366 × 650):

| | Serious / critical | Moderate |
| --- | --- | --- |
| Before | 4 rules on 2 pages: car detail (`definition-list`, `dlitem` × 16, `label-content-name-mismatch`), admin dashboard (`aria-hidden-focus` × 2) | `page-has-heading-one` on 4 "not found" states, `heading-order` on 1 |
| After | 0 | 0 (no violation of any impact on the audited pages) |

**Tests**: backend 422 → 444 (PHPUnit), Vitest 136 → 141, new Playwright end-to-end suite
with 7 tests (README, "End-to-end tests").

## How the review was done

- **Data**: `php artisan migrate:fresh --seed` once at the start (the demo data follows the
  current invoice rule; every session was logged out). After that, test data came only
  from the app: a customer registered through the form and verified with the Mailpit link,
  bookings, an agency created in Paramètres. They were deleted at the end (the agency
  through the API, the customer moved to the e2e domain through the profile API, then
  `php artisan tomobilti:e2e-cleanup`). The database is back to the seed counts.
- **Browser**: the Playwright MCP Chrome window (visible), on the running dev servers.
  Scripted checks run inside that window: horizontal overflow, elements past the right
  edge, `h1` and title per page, touch targets under 44 px on phones (counting the
  `touch-target` hit area), axe-core, console errors and warnings.
- **Viewports**: 375 × 667, 390 × 844, 768 × 1024, 1024 × 768, 1366 × 650, 1440 × 900,
  1920 × 1080. Overlays at 375 × 667 and 1366 × 650.
- **Routes**: every public page, the auth pages, Mon espace, the 4 booking steps and the
  confirmation, the reservation detail with its downloads, every admin page (Factures and
  Planning included), the 403 page and the 404 pages and states.
- **Overlays** (opened by script, then Escape): mobile menu, account menu, notification
  panel, agency Select, sort Select, date pickers (home, car, booking), catalogue filter
  sheet, lightbox, InfoTip, admin drawer, confirm, refuse, cancel, pick-up payment, car
  status, photo delete, agency form, client deactivation, invoice row menu, reservation
  filter sheet. All fit the viewport, lock the scroll, trap the focus, close on Escape and
  give the focus back to their trigger.
- **States**: loading (API delayed), error (every API call answering 500 in the browser),
  empty (new customer), long texts (68-character name, long address, long notes, long
  agency name and opening hours), many items (30 notifications, 99+ badge, pagination).
- **Keyboard**: tabbing through home, catalogue, car detail (phone), admin reservations,
  planning and car form: a visible focus ring on every stop.
- **Links**: 74 internal links collected from the public, client and admin pages, all
  resolve; the links in the emails open the right pages.
- **Emails and PDFs**: verification, Demande reçue, Nouvelle demande, Réservation
  confirmée (+ voucher), Votre facture (+ invoice), Annulation client, Réservation annulée,
  read in Mailpit; voucher and invoice PDFs rendered and read.
- **Backend**: `route:list` (middleware and policies of every route), Form Requests,
  JSON error format (404, 405, 401, 419, 422, 429, all French), rate limits, transactions,
  and a new `QueryCountTest` that measures every list endpoint with 1 and 6 rows.

> The MCP Chrome window rendered at about 1 frame per second while it was hidden behind
> the editor (Chrome throttles occluded windows), so animation timings measured there
> were wrong. Checks that depend on animations used long waits; a later window rendered
> at 60 fps. No app issue came from this.

## Issues

Status: **corrigé** (fixed and checked in the browser), **laissé** (left, reason given).

### Critique

| # | Page | Viewport | What was wrong | What changed | Status |
| --- | --- | --- | --- | --- | --- |
| C1 | Booking step 4, every admin action, every mutation | All | A double click sent two requests: TanStack Query reports `isPending` a tick late, so the button was not disabled yet. On "Confirmer la réservation" the first request booked the car and the second answered 409, so the customer saw "Cette voiture n’est plus libre" although the booking existed (and the e-mails left). Same on Confirmer (admin saw an error toast after a success), cancel, downloads, the car form | New `hooks/useSingleFlightMutation.js`: a `useMutation` that ignores a second call with the same input while the first is in flight (other inputs, such as another photo's alt text, still go out). Every mutation hook uses it (`useAdmin`, `useReservations`, `useNotifications`, `useDownload`). Vitest test fails on plain `useMutation`; the e2e client spec double-clicks and expects one booking | corrigé |

### Majeur

| # | Page | Viewport | What was wrong | What changed | Status |
| --- | --- | --- | --- | --- | --- |
| M1 | Car detail | All | "Caractéristiques": `dt` / `dd` wrapped in an extra `div` inside the `dl` (axe `definition-list`, `dlitem` × 16, serious) | One `div` per pair, the icon inside the `dt` | corrigé |
| M2 | Car detail | All | Gallery button named "Agrandir la photo 1 sur 2…" while it showed "1 / 2" (axe `label-content-name-mismatch`) | The badge shows "1 sur 2", which the name contains | corrigé |
| M3 | Admin dashboard | All | Recharts' keyboard layer made the chart SVGs focusable inside `aria-hidden` containers (axe `aria-hidden-focus`); the data is already in the hidden tables | `accessibilityLayer={false}` on both charts | corrigé |
| M4 | Admin dashboard | 375 (360 px content) | Page scrolled sideways by 8 px: grids without a column template got an `auto` track as wide as the alert rows' min-content | `grid-cols-1` on those grids (and the skeleton), `min-w-0` on the rows; rule added to DESIGN.md | corrigé |
| M5 | Whole app | < 768 | Touch targets of 24–40 px: small and icon buttons (navbar, bell, menu, row actions), chips (40), tabs and Mon espace tabs (36), InfoTip (24), switch (28), pagination (36), account menu (42), planning bars (39), standalone links (logo, "Voir tout", breadcrumbs, phones, footer, table titles, admin contact lines) | New `touch-target` utility (invisible centered `::before`, 44 × 44 px below 768 px, same look) on small buttons, `link` buttons, the switch, InfoTip, pagination, the account menu and standalone links; chips and tabs `h-11` below `md`; planning bars taller | corrigé |
| M6 | Catalogue, car detail, admin lists | All | Tabbing scrolled focused elements under the fixed navbar, the admin topbar or the bottom nav (WCAG 2.4.11) | `scroll-padding-top` / `scroll-padding-bottom` on `html` | corrigé |
| M7 | Catalogue | All | When `GET /api/catalog/filters` failed, the category row and the filter panel stayed on their skeleton for ever, with no message and no retry | Danger Alert "Impossible de charger les filtres" with "Réessayer" in place of the categories; the panel says "Filtres indisponibles pour le moment." | corrigé |
| M8 | Emails, PDFs | — | Amounts written "1 840,00 DH" in e-mails and PDFs, "1.840 DH" on the site (fr-MA, documented in DESIGN.md) | `FrenchFormatter::money` now produces exactly what `formatPrice` does ("1.840 DH", "1.234,50 DH") | corrigé |
| M9 | API: remove a car, change its status | — | Both checked the car's reservations, then wrote, without locking the car row, while `ReservationBooker` locks it: a booking made at the same moment could leave a removed car (or one in maintenance) with an upcoming reservation | Both run in a transaction that locks the car row first. Not covered by an automated test (a race needs two connections) | corrigé |

### Mineur

| # | Page | Viewport | What was wrong | What changed | Status |
| --- | --- | --- | --- | --- | --- |
| m1 | `/voitures/:slug` unknown | All | No `h1`, title "Voiture \| Tomobilti" | `EmptyState` / `ErrorState` take `titleAs`; `h1` and title "Voiture introuvable"; same in the booking page | corrigé |
| m2 | `/espace/reservations/:ref` unknown | All | `h3` right after the `h1` (heading order), title "Réservation TMB-…" | `h2`, title "Réservation introuvable" | corrigé |
| m3 | Admin reservation, client, car unknown | All | No `h1`, generic titles | `h1`, titles "… introuvable" | corrigé |
| m4 | Navbar, admin topbar | ≥ 1024 | The account button lost "Menu du compte" from its name at `lg` (named "Salma" only); the admin topbar had its own copy of the trigger, without truncation for long names | Always "Menu du compte de {nom}" (visible first name inside it); the admin topbar uses `UserMenu variant="admin"` | corrigé |
| m5 | Paramètres | All | Error title "Impossible de charger : catégories" | "Impossible de charger les catégories" (per tab) | corrigé |
| m6 | Paramètres | All | Toasts "Enregistré." / "Supprimé." after "Ajouter une agence" | API messages per resource: "Agence ajoutée.", "Catégorie enregistrée.", "Option supprimée."… | corrigé |
| m7 | Booking step 3 | All | Licence message used "01/06/2027" while the app writes dates as "1 juin 2027" | `FrenchFormatter::date` | corrigé |
| m8 | Mon profil | All | Badge "Prêt pour réserver" only checks that the fields are filled: a licence 1 year old was "prêt" and the booking then refused it | "Profil complet" | corrigé |
| m9 | Admin pages, voucher, agency e-mails, reminder | All | Phones raw ("+212661234567") while the site shows "+212 6 61 23 45 67" | `formatPhone` moved to `utils/format.js` and used in the admin; `FrenchFormatter::phone` in the voucher and e-mails | corrigé |
| m10 | Booking | < 640 | The Stepper's other steps were announced "2", "3", "4" without their names (labels `display: none`) | Labels `sr-only` on phones | corrigé |
| m11 | Verification and reset e-mails | — | Laravel fallback line with straight quotes and "l'URL" (laravel-lang) next to typographic French | Notification view published with « » and ’ ("Le bouton « … » ne fonctionne pas ? Copiez ce lien…") | corrigé |
| m12 | Booking recap vs voucher | — | "en espèces ou par carte" on the site, "en espèces, par carte ou par virement" in the PDF | Same sentence in `RentalTerms` | corrigé |
| m13 | Notification panel | 375 | Title truncated to "Notificati…" next to "Tout marquer comme lu" | The header wraps instead of truncating | corrigé |
| m14 | Every page load | All | `index.html` title "Tomobilti, location de voitures" flashed before "…au Maroc" | Same title in `index.html` | corrigé |
| m15 | API | — | `POST /api/auth/login` had no per-IP limit (only failures per email + IP); `PUT /api/profile/password` none | 20 / min per IP on login, 6 / min on password change (tests) | corrigé |
| m20 | Backend tests | — | `AdminInvoiceTest` search test failed now and then: the factory's random customer names include "Bennani", the name searched for | The third customer has a fixed name | corrigé |
| m16 | Notification panel | All | Only the latest 15 notifications can be reached (the API paginates, the panel has no "see more") | — | laissé: a "voir plus" is a new feature (Phase 7B) |
| m17 | Mon espace vs admin | All | Tab parameter `?tab=` for the customer, `?onglet=` in the admin | — | laissé: renaming breaks shared and bookmarked links; your call |
| m18 | Inscription, booking step 4 | All | "J’accepte les conditions générales…" with no page or link to read them | — | laissé: needs the agency's legal text (decision below) |
| m19 | Date pickers | All | react-day-picker's French locale names today "Aujourd'hui" (straight apostrophe) in the day button's label | — | laissé: library string, read by screen readers only |

Note: in-app notifications created before the fix keep their old amount format, because
their text is stored when they are created.

## Verified, no issue

- Middleware and authorization on every route (admin routes: `auth:sanctum` + `admin` +
  policies; customer routes: ownership through `ReservationPolicy`, 404 for others).
- Form Requests: every stored string has a `max`, enums and foreign keys are validated.
- No N+1 on any list endpoint (admin reservations, cars, clients, client detail,
  invoices, planning, dashboard, settings, my reservations, notifications, featured
  cars, filters, categories, locations): `tests/Feature/QueryCountTest.php`.
- JSON errors: same `{ message, errors? }` shape and French messages for 401, 403, 404,
  405, 419, 422 and 429.
- Transactions where several writes must succeed together (booking, status changes,
  invoice at pick-up, mark paid, photos), now including car removal and status change.
- Overlays, error states, empty states, skeletons matching the final layout, internal
  links, page titles, French copy and toasts reusing the button's words.

## For you to decide

1. **Conditions générales** (m18): add a CGL / privacy page and link it from the two
   checkboxes, or reword the checkbox. It needs the agency's text.
2. **`?tab=` vs `?onglet=`** (m17): keep both, or rename one (with a redirect of the old
   parameter).
3. **Amounts**: the site format ("1.840 DH", centimes only when there are some) now
   applies to the invoice PDF too, so its table shows "1.533,33 DH" next to "1.840 DH".
   If you prefer two decimals on invoices only, that is a small change (a two-decimal
   variant of `FrenchFormatter::money` used by the invoice view).

## Follow-up (Phase 7B, 27 November 2026)

The four items left open and the three decisions above were settled in Phase 7B:

| # | Decision |
| --- | --- |
| m16 | "Voir tout" at the bottom of the bell opens `/espace/notifications` (or `/admin/notifications`): pagination, Toutes / Non lues / Lues, "Tout marquer comme lu" |
| m17 | `?onglet=` everywhere; old `?tab=` links are redirected to `?onglet=` |
| m18 | `/conditions-generales` and `/confidentialite`, built from `config/tomobilti.php` and marked as a demo model, linked from the footer and both terms checkboxes |
| m19 | The date pickers' labels use the typographic apostrophe |
| Amounts | Two decimals on the invoice PDF and `/admin/factures` only ("1.840,00 DH") |

Also found in 7B: the production build dropped the unprefixed `backdrop-filter` of the
`glass` utility (bars unblurred in Chrome, production only; the reviews ran on the dev
server). Fixed, see [security.md](security.md).
