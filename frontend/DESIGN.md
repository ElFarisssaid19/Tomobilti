# Tomobilti design system

The source of truth for every screen of the SPA. Every phase after 1B follows it:
reuse `src/components/ui`, `src/lib/motion.js` and `src/lib/labels.js`, and never
invent new colors, animations or enum labels.

- Tokens: `src/index.css` (Tailwind 4 `@theme`) and `src/styles/daypicker.css`
- Motion: `src/lib/motion.js`
- French enum labels: `src/lib/labels.js`
- Components: `src/components/ui` (import from `src/components/ui/index.js`)
- Living style guide: run `npm run dev`, open http://localhost:5173/design (development only)

## 1. Direction

A Moroccan car rental agency that should feel like a premium mobile app: near-black
surfaces, one lime accent, big rounded cards, pill chips and soft colored glows. It
also has to feel trustworthy and stay easy to read in booking forms and in the admin.

What makes it Tomobilti rather than a template:

- **The lit stage.** Cars always sit on a dark surface with a soft radial highlight
  and a faint floor line (`CarImage`, the home hero). This is the one bold element.
  Everything around it stays quiet.
- **The wordmark.** Lowercase "tomobilti", with the dot of the last "i" in lime (`Logo`).
- **Lime means action or selection, nothing else**: primary buttons, the active chip,
  selected dates, the active nav item, key prices.
- **Left-aligned, confident type.** Large bold headings ("Bonjour, Said"). No all-caps
  eyebrow labels and no decorative numbering. Numbers appear only where the content
  really is a sequence (the Stepper).
- French everywhere, with plain verbs. A button names its action ("Annuler la réservation",
  never "OK"), and the toast reuses the same words ("Réservation annulée").

## 2. Tokens

All tokens live in `src/index.css`. Tailwind's default palette, radius scale and
shadows are **disabled**, so only our names exist. The main `@theme` block is
`static`, so every token also exists as a CSS variable (`var(--color-lime)`).

### Colors

| Token                                         | Hex                               | Use                                                   |
| --------------------------------------------- | --------------------------------- | ----------------------------------------------------- |
| `canvas`                                      | `#0B0A10`                         | Page background                                       |
| `surface`                                     | `#16151C`                         | Cards, inputs                                         |
| `raised`                                      | `#1F1E27`                         | Chips, icon buttons, menus                            |
| `raised-hover`                                | `#292833`                         | Hover on raised elements                              |
| `line`                                        | `#2B2935`                         | Decorative borders                                    |
| `line-strong`                                 | `#3D3A4A`                         | Hover borders                                         |
| `line-control`                                | `#646172`                         | Borders of inputs, checkboxes, radios, switches (3:1) |
| `fg`                                          | `#FFFFFF`                         | Primary text                                          |
| `fg-muted`                                    | `#A09DAD`                         | Secondary text                                        |
| `fg-subtle`                                   | `#8C8999`                         | Placeholders, captions, table headers                 |
| `fg-disabled`                                 | `#6E6B7B`                         | Disabled text **only**                                |
| `lime` / `lime-hover`                         | `#CDE86B` / `#DAF08A`             | Accent fills                                          |
| `on-lime`                                     | `#0B0A10`                         | Text and icons on lime (and on danger fills)          |
| `accent-text`                                 | `#CDE86B`                         | Lime used as text (prices, links) on dark surfaces    |
| `lavender` / `plum`                           | `#C7A4F4` / `#3A1350`             | Promo card only (plum text on lavender)               |
| `success`                                     | `#34D399`                         | Success, "En cours". Emerald, never lime              |
| `warning`                                     | `#FBBF24`                         | "En attente", maintenance                             |
| `danger` / `danger-hover`                     | `#F87171` / `#FA8F8F`             | Errors, "Refusée", destructive actions                |
| `info`                                        | `#60A5FA`                         | Information, "Confirmée"                              |
| `glow-magenta` / `glow-violet` / `glow-peach` | `#D946A0` / `#7C3AED` / `#F5D9A0` | Decorative glows only                                 |

Use opacity modifiers for tints: `bg-success/12`, `border-danger/25`, `bg-canvas/75`.

**Contrast (WCAG AA, checked live on /design):**

| Pair                                                        | Ratio                                   |
| ----------------------------------------------------------- | --------------------------------------- |
| `fg` on canvas / surface / raised                           | 19.7 / 18.1 / 16.5                      |
| `fg-muted` on canvas / surface / raised                     | 7.4 / 6.8 / 6.2                         |
| `fg-subtle` on canvas / surface / raised                    | 5.8 / 5.3 / 4.8                         |
| `on-lime` on lime                                           | 14.4                                    |
| `plum` on lavender                                          | 7.2                                     |
| `success` / `warning` / `danger` / `info` on raised         | 8.6 / 9.9 / 6.0 / 6.5                   |
| Semantic text on its 12% tint (badges), worst case `danger` | ≥ 4.8                                   |
| `line-control` on canvas / surface (non-text, 3:1)          | 3.3 / 3.0                               |
| `fg-disabled` on surface                                    | 3.5 (disabled text is exempt from WCAG) |

### Typography

Plus Jakarta Sans Variable, self-hosted with `@fontsource-variable/plus-jakarta-sans`.
Headings are bold or semibold, body text regular or medium. Prices, dates, references
and table numbers always use `tabular-nums`.

| Class                 | Size / line height | Use                               |
| --------------------- | ------------------ | --------------------------------- |
| `text-display-lg`     | 72 / 72            | Hero on large screens             |
| `text-display`        | 56 / 57            | Hero, style guide title           |
| `text-display-sm`     | 44 / 46            | Hero on mobile                    |
| `text-4xl`            | 36 / 40            | Page titles (desktop)             |
| `text-3xl`            | 30 / 36            | Page titles (mobile), stat values |
| `text-2xl`            | 24 / 32            | Section titles                    |
| `text-xl` / `text-lg` | 20 / 28, 18 / 28   | Card titles, lead text            |
| `text-base`           | 16 / 24            | Body                              |
| `text-sm` / `text-xs` | 14 / 20, 12 / 16   | UI labels, captions               |

Display sizes have tightened letter spacing built in. Keep body lines under about 70
characters (`max-w-md` to `max-w-2xl`). Inputs use `text-base` on mobile, which
prevents iOS zoom.

### Layout and spacing

- 4px grid (Tailwind's default spacing: `p-4` = 16px).
- Page container: `container-page` (max 1280px, side padding 16 / 24 / 32px).
- Mobile first. The top navbar appears from `md` (768px); below that, the compact top
  bar and the bottom nav take over. Admin sidebar from `lg`.
- Pages under the fixed navbar start with `pt-24 md:pt-32`.

### Radius

`rounded-card-lg` 28px (large cards, sheets, the hero stage) · `rounded-card` 20px (cards)
· `rounded-input` 14px (inputs, selects, popovers, menus) · `rounded-sm` 10px (menu items)
· `rounded-xs` 6px · `rounded-full` (buttons, chips, icon buttons, badges, avatars).

### Elevation and glows

On dark surfaces, hierarchy comes from **borders and lighter surfaces**, not heavy shadows.

- `shadow-pop`: only floating layers (menus, popovers, dialogs, toasts).
- `shadow-glow-violet`: card hover. `shadow-glow-lime`: primary button hover, selected radio, active step.
- Glows (`<Glow variant="hero|auth|empty" />`, or `bg-(image:--glow-*)`): only in the hero,
  the auth page backgrounds and empty states, and **never behind body text**.
  `--glow-stage` is the highlight behind cars.
- `glass` utility: translucent, blurred bars (bottom nav, scrolled navbar, admin topbar).
  It falls back to solid with `prefers-reduced-transparency`.

### Z-index

`z-(--z-sticky)` 30 navbar/topbar · `z-(--z-nav)` 40 bottom nav · `z-(--z-overlay)` 50 dialogs and drawers
· `z-(--z-popover)` 60 menus, listboxes, popovers, tooltips · `z-(--z-toast)` 70.

### Icons

lucide-react only, at the default stroke width (2). Never change it per icon (the
checkbox tick, which uses 3, is the only exception). Sizes: `size-4` in text and chips,
`size-[1.125rem]` in md buttons and inputs, `size-5` in lg buttons and the bottom nav.
Decorative icons get `aria-hidden="true"`.

**One exception: brand logos.** lucide no longer ships them, so the WhatsApp, Instagram
and Facebook logos are small inline SVGs copied from [Simple Icons](https://simpleicons.org)
(CC0 1.0) in `src/components/layout/SocialIcons.jsx` (`WhatsAppIcon`, `InstagramIcon`,
`FacebookIcon`). They use `currentColor`, take the same `size-*` classes as lucide icons
and work as `icon` of `IconButton`. Use them only for links to these services; the link
carries the accessible name (e.g. "WhatsApp (nouvel onglet)"). Every other icon stays lucide.
Icon names sent by the API (`categories.icon`, `extras.icon`) go through `iconFor(name)`
(`src/lib/icons.js`), which bundles only the icons listed there.

## 3. Motion and interaction rules

| Token (`src/lib/motion.js`) | Value                                                    | CSS                                        |
| --------------------------- | -------------------------------------------------------- | ------------------------------------------ |
| `duration.fast`             | 150ms                                                    | `--duration-fast`, Tailwind `duration-150` |
| `duration.base`             | 250ms                                                    | `--duration-base`, `duration-250`          |
| `duration.slow`             | 400ms                                                    | `--duration-slow`, `duration-400`          |
| `ease.out`                  | cubic-bezier(0.22, 1, 0.36, 1)                           | `ease-out` (Tailwind's is overridden)      |
| `ease.inOut`                | cubic-bezier(0.65, 0, 0.35, 1)                           | `ease-in-out`                              |
| `spring`                    | `{ type: 'spring', visualDuration: 0.35, bounce: 0.15 }` | —                                          |

Variants: `fadeIn`, `fadeUp`, `scaleIn`, `staggerContainer` + `staggerItem`,
`pageTransition`, plus `revealOnView` (props for a grid that reveals once).

**Rules (apply them everywhere):**

1. **Motion for React** (`import { motion } from 'motion/react'`) handles enter/exit,
   page transitions, stagger and layout animations. **Plain Tailwind transitions**
   handle hover, focus and press.
2. Animate **only `transform` and `opacity`**. Colors, borders and glows change through
   CSS transitions. Never animate width, height, top or left (Accordion panels fade in;
   their height does not animate). No layout shift.
3. **Hover.** Buttons brighten slightly and lift 1px. Cards lift 4px, their border
   becomes `line-strong` with a soft violet glow, and their image zooms to 1.05 over
   500ms (`duration-(--duration-zoom)`, the only animation over 400ms). Icon buttons
   move to a lighter surface. Text links get the animated underline (`link-underline`).
   **Press:** `active:scale-[0.98]`.
4. **Focus.** A 2px lime `:focus-visible` outline is set globally in `index.css`. Never
   remove it. Inputs add a lime border and a soft lime ring. The only containers without
   their own outline are Headless UI listboxes and menus, where the active option shows
   the focus.
5. **Page transitions.** `PageTransition` (fade + 8px slide, `AnimatePresence mode="wait"`)
   is used in every layout. `ScrollToTop` resets the scroll on each route change.
6. **Lists and grids.** Reveal once with a stagger (`{...revealOnView}` on the parent,
   `variants={staggerItem}` on items). When a filter changes, use `layout` on items
   inside `<AnimatePresence mode="popLayout">` so cards slide into place.
7. **Shared indicators.** The active chip, the active tab, the "Mon espace" tabs and the
   bottom-nav lime circle slide with `layoutId` and `spring`.
8. **Loading.** Use skeletons that match the final layout (`CarCardSkeleton`,
   `CarListItemSkeleton`, `Table loading`), never a blank screen. Wrap them in
   `LoadingRegion`. A loading button shows a spinner and keeps its width (`loading` prop).
9. **Feedback.** sonner toasts: `toast.success(...)`, `toast.error(...)`, shown at the
   top because the bottom belongs to the mobile nav, and below the navbar (92px desktop,
   72px mobile) so they never cover its buttons.
10. **Navbar.** See "Floating navbar" in section 5: a glass pill on desktop that turns more
    opaque and compact after scrolling and tucks away while scrolling down. The mobile
    menu and sheets slide in over a dimmed, blurred backdrop.
11. **Duration.** UI animations take 400ms or less. Only the hero glow moves slowly
    (`animate-glow-drift`). Nothing else loops except loaders.
12. **Reduced motion.** `<MotionConfig reducedMotion="user">` at the root turns
    transforms off (fades remain). In CSS, use `motion-safe:` for hover transforms and
    `motion-reduce:transition-none` on sliding parts. The shimmer and the glow drift stop
    in reduced motion. Spinners keep turning because they are the loading signal.

## 4. Do / Don't

| Do                                                        | Don't                                                                    |
| --------------------------------------------------------- | ------------------------------------------------------------------------ |
| Put near-black text (`text-on-lime`) on lime              | Use lime as text on a light surface (lavender, white, a light theme)     |
| Use lime for one primary action per area                  | Have two lime buttons compete side by side                               |
| Use lavender for one promo card at most                   | Use lavender for buttons, links, badges of state or anything interactive |
| Keep glows in the hero, auth backgrounds and empty states | Put a glow behind paragraphs, forms or tables                            |
| Use `success` (emerald) for success                       | Use lime to mean "success"                                               |
| Add an icon to every status color (StatusBadge does)      | Rely on color alone                                                      |
| Use `fg-subtle` for placeholders and captions             | Use `fg-disabled` for anything that is not disabled                      |
| Import labels from `labels.js`                            | Hard-code "Confirmée", "Diesel"… in a component                          |
| Use `formatPrice` (→ "450 DH") and `formatDate`           | Format money or dates by hand                                            |
| Use tokens (`bg-surface`, `rounded-card`, `duration-250`) | Write hex values, arbitrary radii or new shadows in components           |
| Animate transform/opacity with `motion.js` variants       | Write ad-hoc durations, easings or `animate={{ height }}`                |
| Name buttons with the action ("Enregistrer les dates")    | Write "OK", "Valider" alone, or append "→" to labels                     |
| Write sentence-case labels                                | Use ALL-CAPS eyebrows above headings                                     |
| Put text over photos only on a gradient overlay (AA)      | Put text straight on a photo, or hotlink an image                        |
| Import photos through the PHP commands (credits kept)     | Add an image without its author, license and source                      |

## 5. Layouts

- **RootLayout**: MotionConfig, Toaster, ScrollToTop.
- **PublicLayout**: `SiteHeader` (floating pill on desktop; compact bar + menu drawer on
  mobile), animated outlet, `SiteFooter` (with the "Crédits photos" link), `BottomNav`
  (mobile). It adds `pb-28 md:pb-0` so the bottom nav never hides content. It also has a
  skip link to `#contenu`.
- **ClientLayout** ("Mon espace" at `/espace`, nested in PublicLayout behind
  `ProtectedRoute`): "Bonjour, {prénom}" title, the email verification banner, sliding link
  tabs. Child pages use `PageHeader titleAs="h2"`.
- **AdminLayout** (lazy-loaded behind `AdminRoute`): collapsible sidebar (`lg`+, remembered in localStorage, icons with
  tooltips when collapsed), glass topbar with the page title and the avatar menu,
  left drawer on mobile. No bottom nav.
- Navigation items live in `src/config/navigation.js`.

### Floating navbar (public site)

- **Desktop (`md`+)**: a glass pill detached from the edges, 16px from the top, centered,
  `max-w-nav` (1100px), `rounded-full`, translucent `bg-raised/60` with backdrop blur and a
  `white/8` border; it matches the mobile bottom nav. Logo left, links centered, actions right.
- **Active link**: lime pill (`text-on-lime`) that slides between links (`layoutId` +
  `spring`). Hover on other links: a lighter surface (`bg-white/8`) and `text-fg`.
- **On scroll** (past 12px): more opaque (`bg-raised/90`, `shadow-pop`) and slightly more
  compact (moves up 6px, scales to 0.98), via a 250ms transition.
- **Hide on scroll**: past 240px, scrolling down tucks it above the viewport (400ms);
  any upward scroll brings it back. It never hides at the top of the page, while it
  holds keyboard focus, while the menu is open, or with reduced motion (it then stays put).
- **Mobile**: the compact top bar (logo, Connexion, menu sheet) stays, transparent at the top
  and `glass` after scrolling; the floating bottom nav remains the main navigation.
- **Spacing**: the hero runs behind the navbar; every other page starts with
  `pt-24 md:pt-32` so the navbar never covers content. The admin keeps its sidebar.
- **Auth-aware actions**: visitors see Connexion / Inscription; signed-in users see the
  avatar menu (`UserMenu`: Mon espace, Administration for admins, Déconnexion) in the same
  right-hand position. While the session loads, a skeleton pill of the same size holds the
  place. The mobile top bar shows the compact avatar, and the bottom nav's "Profil" item
  leads to `/connexion` for visitors (`guestTo` in `config/navigation.js`).

### Auth pages and route guards (Phase 2)

- **AuthShell** (`components/auth`): on desktop, a tall photo of a Moroccan road on the left
  (one photo per page: login, register, password, verify, with its place as caption on a
  gradient) and the form on the right, left-aligned, `max-w-md`. The auth glow sits behind
  the photo column only, never behind the form. Mobile shows the form alone with the glow
  at the top edge.
- Field errors (422) go under the field through `errors`; errors without a field (disabled
  account 403, too many attempts 429, network) go in a `danger` **Alert** above the form.
  Client-side checks use the same `{ field: [message] }` shape, and the first invalid field
  gets the focus.
- New passwords show `PasswordStrength` (four segments, color only via CSS transitions:
  danger, warning, success; never lime).
- Guards: `GuestRoute`, `ProtectedRoute`, `AdminRoute` render `PageSkeleton` /
  `AdminPageSkeleton` while the session loads, so the wrong page never flashes. Clients who
  open `/admin` get `ForbiddenPage` (403).
- "Mon espace" (`/espace`) shows the warning Alert `EmailVerificationBanner` until the email
  address is verified.

### Photos

- **Car photos** (`CarImage`, used by `CarCard` and `CarListItem`): a real photo fills the
  media area (`object-cover`, 16:10) with a subtle bottom gradient (`from-canvas/55`).
  An SVG placeholder keeps the dark stage: radial highlight (`--glow-stage`), floor line,
  `object-contain`. A file is a placeholder when its URL ends in `.svg`.
- **Loading**: `loading="lazy"` (pass `eager` for above-the-fold cards), intrinsic
  `width`/`height` (800 × 500) and a fixed aspect box, so nothing shifts; a shimmering
  skeleton fills the box until the photo loads, then the photo fades in (opacity only).
  A broken URL falls back to the local silhouette of the car's category.
- **Sizes**: the API gives `thumbnail_url` (800px, cards) and `url` (1600px, detail page);
  `CarImage` builds the `srcset` and takes a `sizes` prop (cards by default).
- **Site photos** live in `src/assets/photos/` as WebP crops (e.g. `hero-1920`, `hero-1280`,
  `hero-mobile` 4:5). Use `<picture>` with a mobile crop and `fetchPriority="high"` for the
  hero only. Text over a photo always sits on a gradient overlay that keeps it at WCAG AA
  (from the side on desktop, from the bottom on mobile, plus a top fade under the navbar).
  Glows may sit over the hero photo, never behind body text.
- **Adding photos**: never hotlink. Add the source (Wikimedia Commons, Unsplash or Pexels;
  CC0, public domain, CC BY, CC BY-SA, Unsplash or Pexels License only; no recognizable people,
  watermarks or text) to the `sources.json` next to the files, then run
  `php artisan tomobilti:import-site-photos` (site) or `tomobilti:import-car-photos` (cars)
  from `backend/`. They crop, optimize, strip metadata and write the manifest, then
  regenerate `docs/image-credits.md` and `src/data/image-credits.json` (the `/credits` page).
- The public pages use the catalogue API. Demo cars (`src/data/demoCars.js`, 800px copies of
  the seeded photos in `src/assets/cars/photos/`) remain only for `/design`.
- **Detail page gallery** (`components/catalog/CarGallery.jsx`): the 1600px `url` with an
  800w/1600w `srcset`, fixed 1600 × 1000 in a 16:10 box, thumbnails at 800px, a lightbox
  (arrows, Escape, swipe) and, under the photo, the credit the license requires
  (`PhotoCredit`: author, license link, source link). Never show a car photo in a large
  format without its credit.

## 6. Components

Import from the barrel: `import { Button, CarCard } from '../components/ui'`.
Every component accepts `className` (merged with `cn`, so your classes win).

### Button, IconButton

```jsx
<Button>Réserver</Button>                                   // primary, md
<Button variant="secondary" leftIcon={Plus}>Ajouter</Button>
<Button variant="danger" loading={isDeleting}>Supprimer</Button>
<Button to="/voitures" variant="outline">Voir les voitures</Button>  // router Link
<Button href="tel:+212500000000" variant="link">Appeler</Button>
<IconButton icon={Heart} label="Ajouter aux favoris" />     // circular, raised
```

Variants: `primary | secondary | outline | ghost | danger | link`. Sizes: `sm | md | lg`.
`loading` disables the button, sets `aria-busy` and keeps the width. To style another
element like a button, use `buttonClasses({ variant, size })`.

### RangeSlider

```jsx
<RangeSlider
  label="Prix par jour"
  min={230}
  max={1800}
  step={10}
  value={range}
  onChange={setRange}
  onChangeEnd={applyRange}
  formatValue={formatPrice}
  minLabel="Prix minimum par jour"
  maxLabel="Prix maximum par jour"
/>
```

Dual-range slider built on two stacked native `<input type="range">` (styles in
`src/styles/range-slider.css`), so arrows, Page Up / Page Down, Home / End and screen
readers work natively. Each thumb has its own label and a spoken value (`aria-valuetext`
from `formatValue`), the current range is shown in an `<output>`, and the minimum never
passes the maximum. `onChange` follows the drag; `onChangeEnd` fires on release or on a key
press: run the search there, not on every pixel. Thumbs are lime with the standard focus ring.

### Chip, ChipGroup

```jsx
<ChipGroup label="Catégorie" value={category} onChange={setCategory} bleed>
  <Chip value="all">Toutes</Chip>
  <Chip value="suv" icon={Mountain} count={6}>SUV</Chip>
</ChipGroup>
<ChipGroup label="Carburant" multiple value={fuels} onChange={setFuels}>…</ChipGroup>
```

Chips are toggle buttons (`aria-pressed`). The row scrolls horizontally (`wrap` makes it
wrap instead; `bleed` runs it to the screen edges on mobile).

### Forms: Input, Textarea, Select, Checkbox, RadioGroup, Switch, FormField

```jsx
<Input label="Téléphone" name="phone" type="tel" hint="Format +212…" errors={apiError} />
<Textarea label="Remarques" name="customer_notes" />
<Select label="Carburant" name="fuel" options={toOptions(FUEL_TYPE)} value={fuel} onChange={setFuel} />
<Checkbox label="J’accepte les conditions" checked={ok} onChange={setOk} error={…} />
<RadioGroup label="Lieu de retrait" options={[{ value, label, description }]} value={v} onChange={setV} />
<Switch label="Voiture à la une" checked={featured} onChange={setFeatured} />

<FormField label="Adresse e-mail" name="email" errors={apiError} required>
  <Input name="email" type="email" />
</FormField>
```

```jsx
<PasswordInput label="Mot de passe" name="password" autoComplete="current-password" errors={apiError} />
<Input type="search" trailing={<IconButton icon={X} label="Effacer" variant="ghost" size="sm" />} />
```

`PasswordInput` is an `Input` with a show/hide `IconButton` (French label, `aria-pressed`)
in the `trailing` slot. `trailing` holds an interactive element at the right edge of the
field (`suffix` is for static text such as "DH").

`errors` accepts the axios error, the Laravel 422 payload `{ message, errors }` or the
`errors` object. The first message for `name` is shown and linked with
`aria-describedby`, and the control gets `aria-invalid`. `error` takes a string directly.
Helpers: `getFieldError(source, name)` and `getValidationErrors(source)` in `lib/validation.js`.
After a failed submit, move focus to the first invalid field.

### DateRangePicker, DateRangeCalendar

```jsx
<DateRangePicker value={range} onChange={setRange} unavailable={[{ from: '2026-12-24', to: '2026-12-27' }]} />
<DateRangeCalendar value={range} onChange={setRange} />   // inline, e.g. reservation step 1
```

French locale, Monday first, past dates disabled. `unavailable` ranges (inclusive, Date
or ISO strings) are struck through and can never be inside a range. The summary shows
"3 jours, du 12 déc. 2026 au 15 déc. 2026" (`rentalDays` in `lib/dates.js`, display
only: the backend computes the billed days). It shows 2 months from 768px, 1 below.

### Badge, StatusBadge

```jsx
<Badge tone="success" dot>Disponible</Badge>   // neutral | lime | lavender | success | warning | danger | info
<StatusBadge status={reservation.status} />    // pending → "En attente", with icon
```

### Card, PromoCard, CarCard, CarListItem

```jsx
<Card size="lg" padding="lg" interactive>…</Card>
<PromoCard icon={Tag} title="−15 % dès 7 jours" text="…" actionLabel="Voir les voitures" to="/voitures" />
<CarCard car={car} to={`/voitures/${car.slug}`} isFavorite={fav} onToggleFavorite={toggle} />
<CarCardSkeleton />
<CarListItem car={r.car} subtitle="12 – 15 déc. 2026" trailing={<StatusBadge status={r.status} />} to={…} />
```

`estimate={{ days, total }}` (from `estimateRental(price_per_day, range)` in
`lib/pricing.js`) replaces "à partir de" with "Total estimé, 7 jours" and the total, the
price per day below it. Pass it when the visitor has chosen dates.

`car` follows the API fields: `brand` (object or string), `model`, `year`, `category`,
`seats`, `transmission`, `fuel`, `air_conditioning`, `price_per_day` ("250.00"), and an
image as `image_url`, `primary_image { url | path, alt }` or `images[]`. Full URLs
(`http://localhost:8000/storage/...`) are kept as they are, and storage paths are prefixed
with `VITE_API_URL/storage/`. Missing or broken images fall back to a local silhouette
for the category. The whole card is clickable through its title link, and the favorite
button sits above it.

### Overlays: Modal, ConfirmDialog, Drawer / BottomSheet, DropdownMenu, Tooltip

```jsx
<Modal open={open} onClose={close} title="Modifier les dates" footer={<Button>Enregistrer les dates</Button>}>…</Modal>
<ConfirmDialog open={open} onClose={close} onConfirm={cancel} loading={busy} tone="danger"
  title="Annuler cette réservation ?" confirmLabel="Annuler la réservation" />
<Drawer open={open} onClose={close} side="bottom" title="Filtres" footer={…}>…</Drawer>
<DropdownMenu trigger={<IconButton icon={Ellipsis} label="Actions" />} items={[{ label: 'Modifier', icon: Pencil, onClick }]} />
<Tooltip content="Ajouter aux favoris"><IconButton icon={Heart} label="Ajouter aux favoris" /></Tooltip>
```

All of these are built on Headless UI (focus trap, Escape, ARIA) and animated with the
documented `static` + `AnimatePresence` pattern.

### Navigation: Tabs, Pagination, Breadcrumbs, PageHeader, SectionHeading, Stepper

```jsx
<Tabs tabs={[{ label: 'À venir', count: 2, content: <Upcoming /> }]} />
<Pagination page={meta.current_page} lastPage={meta.last_page} onPageChange={setPage} />
<Breadcrumbs items={[{ label: 'Accueil', to: '/' }, { label: 'Clio 5' }]} />
<PageHeader title="Bonjour, Said" description="…" actions={…} />
<SectionHeading title="Voitures à la une" to="/voitures" />   // "Voir tout"
<Stepper current={1} />                                       // Dates → Options → Informations → Confirmation
```

### Data: Avatar, StatCard, Table

```jsx
<Avatar name="Salma Bennani" />
<StatCard icon={CalendarCheck} label="Réservations ce mois" value={128} format="number" trend={{ value: 12, label: 'vs octobre' }} />
<Table caption="Réservations" columns={[{ key, header, render, align }]} rows={rows} rowKey="reference" loading={isLoading} empty={<EmptyState … />} />
```

### Alert

```jsx
<Alert tone="danger" title="Trop de tentatives">Veuillez essayer de nouveau dans 42 secondes.</Alert>
<Alert tone="warning" title="Confirmez votre adresse e-mail" action={<Button size="sm" variant="secondary">Renvoyer l’e-mail</Button>}>…</Alert>
```

Inline message in a page or a form: `info | success | warning | danger`, always with its
icon. `danger` is announced as `role="alert"`, the others as `role="status"`. Use a toast
for feedback after an action, an Alert for a state the user must read on the page.

### States: Skeleton, Spinner, EmptyState, ErrorState, Toaster

```jsx
<Skeleton className="h-6 w-40" />  <SkeletonText lines={3} />
<Spinner label="Chargement…" />
<EmptyState icon={CalendarX} title="Aucune réservation" text="…" action={<Button to="/voitures">Voir les voitures</Button>} />
<ErrorState title="Impossible de charger les voitures" error={error} onRetry={refetch} />
toast.success('Réservation envoyée')
```

## 7. Data (server state)

From Phase 3, every API read goes through **TanStack Query** (`@tanstack/react-query`).
`QueryClientProvider` wraps the app in `main.jsx`; the client is built in
`src/lib/queryClient.js`.

- **Layers.** `src/api/*.js` holds plain axios functions that return the payload
  (`fetchCars`, `fetchCar`…). `src/api/queryKeys.js` holds the keys. `src/hooks/useCatalog.js`
  holds one hook per resource (`useCars`, `useCar`, `useFeaturedCars`, `useCarAvailability`,
  `useCatalogOptions`, `useCategories`, `useLocations`, `useExtras`). Pages call hooks,
  never axios directly.
- **Query keys, per resource**, general to specific, so a whole resource can be
  invalidated at once:

  ```js
  queryKeys.cars.list(params) // ['cars', 'list', { category: 'suv', page: '2' }]
  queryKeys.cars.detail(slug) // ['cars', 'detail', 'dacia-logan-2024']
  queryKeys.cars.availability(slug) // ['cars', 'availability', 'dacia-logan-2024']
  queryKeys.locations() // ['locations']
  queryClient.invalidateQueries({ queryKey: queryKeys.cars.all }) // every car query
  ```

- **Stale times.** Default 60 s, no refetch on window focus, retries only for network and
  5xx errors (never 4xx). Reference data (categories, agencies, filter options, extras):
  10 minutes. Booked days (`useCarAvailability`): 0, refetched each time the page opens.
- **Lists keep the previous data while filters change** (`placeholderData: keepPreviousData`):
  the current cards stay on screen, dimmed (`opacity-60`, `aria-busy`), until the new page
  arrives. Skeletons only appear on the very first load (`isPending`).
- **States.** `isPending` → skeleton shaped like the content (`LoadingRegion`), `isError` →
  `ErrorState` with `onRetry={refetch}` (404 → an `EmptyState` with a way out), empty list →
  `EmptyState` with one action. Pass `{ signal }` from the query function to axios so
  abandoned requests are cancelled.
- **Mutations** (forms) keep `useForm` + the `api/*.js` function for now (422 errors under
  the fields, toast on success); use `useMutation` when a mutation must update cached data
  (Phase 4 bookings), then invalidate the matching keys.
- **URL state.** Filters, sort and page of a list live in the query string, not in React
  state (`useCatalogFilters`, `lib/catalogParams.js`): links are shareable and the back
  button restores the previous filters. Each change pushes a history entry and resets the
  page to 1. The query key is built from the parsed URL, so the cache and the URL agree.
- **Local preferences** that do not belong to the server yet (favorites) use a small
  `useSyncExternalStore` hook over `localStorage` wrapped in try/catch (`useFavorites`).
- **Page titles.** Every public page calls `usePageMeta(title, description)` (French title
  "… | Tomobilti" and meta description).

## 8. Changes from the original brief

The brief's palette is kept. These refinements came out of the contrast audit and the build:

1. **Placeholder text is `#8C8999` (`fg-subtle`) instead of `#6E6B7B`.** `#6E6B7B` only
   reaches 3.2–3.8:1, below AA 4.5:1 for text. It is kept as `fg-disabled`, for disabled
   text only (which WCAG exempts).
2. **New `line-control` `#646172`** for the borders of form controls, so they reach the
   3:1 non-text contrast. `#2B2935` stays for decorative borders, and `line-strong` `#3D3A4A`
   was added for hover borders.
3. **New `raised-hover` `#292833`** and **`lime-hover` `#DAF08A`** for hover surfaces.
4. **Semantic colors:** success `#34D399` (emerald), warning `#FBBF24`, danger `#F87171`,
   info `#60A5FA`, all ≥ 4.8:1 as text on every surface and on their tints.
5. **Text on danger fills is near-black** (white on `#F87171` is only 2.8:1).
6. **`formatPrice` outputs "450 DH"** (it used to output "450 MAD"), to match the brief and local usage.
7. The **card image zoom takes 500ms**, as the brief specifies. It is the only exception to
   the 400ms limit.

## 9. Adding a light theme later

Components only use semantic tokens, so a light theme means redefining the variables:

```css
:root[data-theme='light'] {
  --color-canvas: #f7f6fa;
  --color-surface: #ffffff;
  --color-fg: #0b0a10;
  --color-accent-text: #4d5a12; /* never lime as text on light */
  /* …every surface, line and text token… */
}
```

Then check every pair again on /design. Keep `on-lime` dark: lime fills do not change.
