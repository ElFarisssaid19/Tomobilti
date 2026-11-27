---
name: tomobilti-ui
description: Tomobilti frontend design system rules. Use whenever you create or change anything in frontend/ (pages, components, layouts, styles, animations, French labels) so the work reuses the UI kit, motion tokens and enum labels instead of inventing new styles.
---

# Tomobilti UI

**Source of truth: `frontend/DESIGN.md`.** Read it before you build or restyle any
screen, and follow it over your own defaults. The living style guide is at
http://localhost:5173/design (dev server only), and it shows every token and component state.

## Always reuse, never invent

- **Components**: `frontend/src/components/ui` (import from `components/ui/index.js`).
  Button, IconButton, Chip/ChipGroup, Input (+ `trailing` slot), PasswordInput, Textarea,
  Select, Checkbox, RadioGroup, RangeSlider,
  Switch, FormField, DateRangePicker/DateRangeCalendar, Badge, StatusBadge, Card,
  PromoCard, CarCard(+Skeleton), CarListItem(+Skeleton), Modal, ConfirmDialog,
  Drawer/BottomSheet, DropdownMenu, Tabs, Tooltip/InfoTip, Accordion, Skeleton, Spinner,
  EmptyState, ErrorState, Alert, Pagination, Breadcrumbs, PageHeader, SectionHeading,
  Stepper, Avatar, StatCard, Table, Toaster, Glow. Extend one of these (props, variants)
  before writing a new one. A new reusable component goes in `components/ui`, gets
  added to `index.js` and `/design`, and is documented in DESIGN.md.
- **Motion**: `frontend/src/lib/motion.js` (`duration`, `ease`, `spring`, `fadeIn`,
  `fadeUp`, `scaleIn`, `staggerContainer`, `staggerItem`, `pageTransition`, `revealOnView`).
  No ad-hoc durations or easings.
- **Labels**: `frontend/src/lib/labels.js` for every backend enum (reservation status,
  transmission, fuel, car status, location type, extra pricing, invoice status, payment
  method, role). Never hard-code "Confirmée" or "Diesel" in a component.
- **Formatting**: `formatPrice` ("450 DH"), `formatDate`, `formatNumber` (`src/utils/format.js`),
  `rentalDays` (`src/lib/dates.js`). **Laravel 422 errors**: pass the axios error to the
  `errors` prop of a form control or FormField (`src/lib/validation.js`).
- **Tokens only**: semantic Tailwind classes from `src/index.css`, such as `bg-canvas`,
  `bg-surface`, `bg-raised`, `border-line`, `text-fg`, `text-fg-muted`, `text-fg-subtle`,
  `bg-lime`, `text-on-lime`, `text-accent-text`, `rounded-card`, `rounded-card-lg`,
  `rounded-input`, `shadow-pop`, `shadow-glow-violet`, `z-(--z-overlay)`, `container-page`.
  Tailwind's default palette is disabled on purpose: no hex values, no `bg-gray-*`,
  no arbitrary radii or shadows in components. Merge classes with `cn()` (`src/lib/cn.js`).
- **Icons**: lucide-react only, at the default stroke width. Only exception: the WhatsApp,
  Instagram and Facebook logos (Simple Icons, CC0) in `components/layout/SocialIcons.jsx`.
  API icon names go through `iconFor()` (`src/lib/icons.js`).

## Data (server state)

- Every API read uses **TanStack Query** (see DESIGN.md, "Data"): axios functions in
  `src/api/*.js`, keys in `src/api/queryKeys.js` (per resource, general to specific:
  `['cars', 'list', params]`, `['cars', 'detail', slug]`), hooks in `src/hooks/useCatalog.js`.
  Pages call hooks, never axios directly.
- Defaults: 60 s stale time, no refetch on focus, no retry on 4xx. Reference data 10 min,
  booked days 0. Lists use `placeholderData: keepPreviousData` and dim the old cards while
  loading; skeletons only on the first load.
- Mutations use `useSingleFlightMutation` (hooks/useSingleFlightMutation.js), never
  `useMutation` directly: it drops a double click's second request.
- List filters, sort and page live in the URL (`useCatalogFilters`, `lib/catalogParams.js`),
  never in React state. Each public page sets its French title and description with
  `usePageMeta`.

## Color rules

- Dark theme: canvas `#0B0A10` < surface `#16151C` < raised `#1F1E27`. Hierarchy comes from
  borders and lighter surfaces, not heavy shadows.
- **Lime** (`#CDE86B`) is the only accent: primary buttons, the active chip, selected
  dates, the active nav item, key prices. Text and icons on lime are always `text-on-lime`
  (near-black). **Never use lime as text on a light surface.**
- **Lavender** (`#C7A4F4`, plum text) is rare: at most one PromoCard or illustration per
  screen, never interactive state.
- **Glows** (magenta, violet, peach) only in the hero, the auth backgrounds and empty
  states (`<Glow />`), **never behind body text**.
- Semantic colors: success is emerald (never lime), plus warning, danger and info. Pair a
  status color with an icon, and never rely on color alone.
- Placeholders and captions use `fg-subtle`; `fg-disabled` is for disabled elements only.
  Every text pair must reach WCAG AA (check it on /design).

## Motion, hover and focus rules

- Motion (`motion/react`) for enter/exit, page transitions, stagger and layout.
  Tailwind transitions for hover, focus and press.
- Animate only **transform and opacity**. Colors, borders and glows change through CSS
  transitions. Never animate height or width. No layout shift.
- UI animations take **400ms or less** (the card image zoom, 500ms, is the only exception).
  Nothing loops except loaders and the slow hero glow.
- Hover: buttons brighten and lift 1px. Cards lift 4px, get a lighter border, a soft violet
  glow and a 1.05 image zoom. Icon buttons move to a lighter surface. Text links use
  `link-underline`. Press: `active:scale-[0.98]`. Put hover transforms behind `motion-safe:`.
- Focus: the global lime `:focus-visible` outline must **never** be removed.
- Shared indicators (chips, tabs, bottom nav) slide with `layoutId` + `spring`. Grids reveal
  once with `revealOnView`, and filtered grids use `layout` + `AnimatePresence mode="popLayout"`.
- Loading: skeletons shaped like the final content, never a blank screen. Loading buttons
  keep their width (`loading` prop). Feedback goes through sonner toasts.
- Reduced motion: `MotionConfig reducedMotion="user"` is at the root. In CSS use
  `motion-safe:` / `motion-reduce:`.

## Navbar and photos

- Public navbar (`SiteHeader`): on desktop a floating glass pill (16px from the top,
  `max-w-nav`, rounded-full, blur, subtle border); lime pill sliding under the active link,
  `bg-white/8` hover; more opaque and compact after scrolling; hides while scrolling down past
  240px, never at the top, with focus inside, with the menu open or in reduced motion.
  Mobile keeps the compact top bar plus the bottom nav. Pages under it start at
  `pt-24 md:pt-32`; only the hero runs behind it. Do not build another navbar.
- Car images always go through `CarImage` (via `CarCard` / `CarListItem`): photos fill the box
  with a bottom gradient, SVG placeholders keep the radial stage; lazy-loaded, fixed size,
  skeleton until loaded, silhouette fallback on error. Use `thumbnail_url` (800) for cards and
  `url` (1600) for the detail page.
- Text over a photo sits on a gradient overlay that keeps WCAG AA. Glows never behind body text.
- New images: never hotlink, never NC/ND licenses, no recognizable people or text. Add them to
  the relevant `sources.json` and run `php artisan tomobilti:import-site-photos` or
  `tomobilti:import-car-photos` (from `backend/`): it optimizes them and keeps the credits
  (`docs/image-credits.md`, `/credits`) up to date.

## Overlays fit the viewport

- Every overlay (Modal, ConfirmDialog, Drawer, BottomSheet, DropdownMenu, Select, the
  DateRangePicker popover, Tooltip, the lightbox) must fit the viewport at 375 × 667 and on
  a 1366 × 650 laptop. Header and footer stay visible, only the body scrolls.
- Dialog actions always go in the Modal `footer`; a form dialog passes `onSubmit` to `Modal`
  and puts its `type="submit"` button in `footer`. Never a second scroll area inside the body.
- Tabs never cut a tab off (edge fades, active tab scrolled into view, a Select on phones).
  Tables turn into cards below `lg` by themselves (column `card` roles): never branch on the
  screen size in a page.

## Touch and focus

- Below 768px every control gives the finger 44 × 44 px: small controls and standalone
  text links get `touch-target` (on a positioned element), chips and tabs are `h-11`.
- `scroll-padding` on `html` keeps focused elements clear of the fixed bars; grids
  without a template get `grid-cols-1`.

## Texte et ton

- Titles about 1–4 words; buttons a verb, 1–3 words. No subtitle that repeats the title,
  the tabs or what is visible.
- Admin pages: no explanation paragraphs at all. Home sections: a headline and at most one
  short sentence. Empty states: a title, at most one short line, the action.
- Rules and consequences go in an `info` tooltip next to the field, switch or card title
  (`InfoTip`), a short `hint` ("Ex. …"), or the confirmation dialog of the action.
- Keep what the customer must know as short bullets (`RentalTerms`, `DocumentsToBring`).
  Error messages stay clear and complete.
- Full rules: DESIGN.md, "Texte et ton".

## Do / Don't

- Do: one primary (lime) action per area. Sentence-case French labels. A button names its
  action and the toast reuses the same words. Left-aligned, large bold headings. Mobile first;
  the bottom nav must not hide content (`pb-28 md:pb-0` in layouts with it).
- Don't: lime text on light surfaces, lavender as a second accent, glows behind paragraphs,
  ALL-CAPS eyebrow labels, "→" appended to button text, hard-coded enum labels, new colors,
  shadows or easings, ad-hoc focus styles that hide the ring.

## Before you finish frontend work

From `frontend/`: `npm run lint`, `npm run format:check`, `npm test` and `npm run build`
must pass. Check the screen at 375, 768 and 1280px: no horizontal scroll, visible focus,
reduced motion respected.
