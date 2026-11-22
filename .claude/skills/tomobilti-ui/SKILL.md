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
  Button, IconButton, Chip/ChipGroup, Input, Textarea, Select, Checkbox, RadioGroup,
  Switch, FormField, DateRangePicker/DateRangeCalendar, Badge, StatusBadge, Card,
  PromoCard, CarCard(+Skeleton), CarListItem(+Skeleton), Modal, ConfirmDialog,
  Drawer/BottomSheet, DropdownMenu, Tabs, Tooltip, Accordion, Skeleton, Spinner,
  EmptyState, ErrorState, Pagination, Breadcrumbs, PageHeader, SectionHeading,
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
- **Icons**: lucide-react only, at the default stroke width.

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
