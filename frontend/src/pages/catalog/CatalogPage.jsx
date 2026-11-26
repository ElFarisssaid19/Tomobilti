import { CircleAlert, Heart, LayoutGrid, SearchX, SlidersHorizontal } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useMemo, useRef, useState } from 'react'
import FiltersPanel from '../../components/catalog/FiltersPanel.jsx'
import SearchWidget from '../../components/site/SearchWidget.jsx'
import {
  BottomSheet,
  Button,
  CarCard,
  CarCardSkeleton,
  Chip,
  EmptyState,
  ErrorState,
  LoadingRegion,
  PageHeader,
  Pagination,
  Select,
  Skeleton,
} from '../../components/ui'
import { useCars, useCatalogOptions } from '../../hooks/useCatalog.js'
import useCatalogFilters from '../../hooks/useCatalogFilters.js'
import useFavorites from '../../hooks/useFavorites.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { apiErrorMessage } from '../../lib/auth.js'
import { countPanelFilters, SORT_OPTIONS, toApiParams } from '../../lib/catalogParams.js'
import { cn } from '../../lib/cn.js'
import { toDay } from '../../lib/dates.js'
import { iconFor } from '../../lib/icons.js'
import { spring } from '../../lib/motion.js'
import { estimateRental } from '../../lib/pricing.js'
import { formatDate } from '../../utils/format.js'

const SHORT_DATE = { day: 'numeric', month: 'short' }

/** "Effacer les filtres" of the panel: the search bar and the categories stay. */
const PANEL_RESET = {
  brand: [],
  fuel: [],
  transmission: '',
  seats_min: null,
  price_min: null,
  price_max: null,
  air_conditioning: false,
}

function carsLabel(count) {
  return `${count} ${count > 1 ? 'voitures' : 'voiture'}`
}

/**
 * /voitures: the public catalogue. Every filter, the sort and the page live in the URL
 * (useCatalogFilters), so links can be shared and the back button restores the previous
 * search. Results come from GET /api/cars through TanStack Query; the previous cards
 * stay on screen, dimmed, while the next ones load.
 */
export default function CatalogPage() {
  usePageMeta(
    'Nos voitures',
    'Toutes les voitures à louer à Marrakech, Casablanca et Agadir : filtrez par catégorie, marque, boîte, carburant ou budget, et voyez le prix pour vos dates.',
  )
  const { filters, setFilters, resetFilters } = useCatalogFilters()
  const { favorites, isFavorite, toggleFavorite } = useFavorites()
  const { data: options } = useCatalogOptions()
  const [sheetOpen, setSheetOpen] = useState(false)
  const resultsRef = useRef(null)

  const favoritesEmpty = filters.favorites && favorites.length === 0
  const apiParams = useMemo(() => toApiParams(filters, favorites), [filters, favorites])
  const cars = useCars(apiParams, { enabled: !favoritesEmpty })

  const range =
    filters.start_at && filters.end_at
      ? { from: toDay(filters.start_at), to: toDay(filters.end_at) }
      : undefined
  const datesQuery = range ? `?start_at=${filters.start_at}&end_at=${filters.end_at}` : ''
  const total = favoritesEmpty ? 0 : cars.data?.meta?.total
  const panelCount = countPanelFilters(filters)

  function changePage(page) {
    setFilters({ page })
    resultsRef.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <div className="container-page flex flex-1 flex-col gap-6 pt-24 pb-16 md:pt-32">
      <PageHeader title="Nos voitures" />

      <div className="rounded-card-lg border border-line bg-surface p-4 sm:p-5">
        <SearchWidget
          key={`${filters.q}|${filters.location}|${filters.start_at}|${filters.end_at}`}
          showQuery
          initialValues={filters}
          onSubmit={(values) => setFilters(values)}
        />
      </div>

      <CategoryChips
        categories={options?.categories}
        selected={filters.category}
        onChange={(category) => setFilters({ category })}
        favoritesOn={filters.favorites}
        favoritesCount={favorites.length}
        onToggleFavorites={() => setFilters({ favorites: !filters.favorites })}
      />

      <div className="grid gap-8 lg:grid-cols-[17.5rem_minmax(0,1fr)]">
        <aside aria-label="Filtres" className="hidden lg:block">
          <div className="sticky top-28 flex flex-col gap-5 rounded-card-lg border border-line bg-surface p-5">
            <h2 className="text-lg font-bold text-fg">Filtres</h2>
            <FiltersPanel
              filters={filters}
              options={options}
              onChange={setFilters}
              onReset={() => setFilters(PANEL_RESET)}
            />
          </div>
        </aside>

        <section
          ref={resultsRef}
          aria-label="Résultats"
          className="flex scroll-mt-28 flex-col gap-5"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            {total === undefined ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              <h2
                id="resultats"
                aria-live="polite"
                className="text-lg font-bold text-fg tabular-nums sm:text-xl"
              >
                {total === 0 ? 'Aucune voiture' : carsLabel(total)}
                {range && (
                  <span className="font-medium text-fg-muted">
                    {' '}
                    {total > 1 ? 'libres' : 'libre'} du {formatDate(range.from, SHORT_DATE)} au{' '}
                    {formatDate(range.to, SHORT_DATE)}
                  </span>
                )}
              </h2>
            )}
            <div className="flex w-full items-end gap-3 sm:w-auto">
              <Button
                variant="secondary"
                leftIcon={SlidersHorizontal}
                onClick={() => setSheetOpen(true)}
                className="shrink-0 lg:hidden"
                aria-label={panelCount ? `Filtres, ${panelCount} actifs` : 'Filtres'}
              >
                Filtres
                {panelCount > 0 && (
                  <span className="grid size-5 place-items-center rounded-full bg-lime text-xs font-bold text-on-lime tabular-nums">
                    {panelCount}
                  </span>
                )}
              </Button>
              <Select
                label="Trier par"
                name="sort"
                options={SORT_OPTIONS}
                value={filters.sort}
                onChange={(sort) => setFilters({ sort })}
                className="min-w-0 flex-1 sm:w-56 sm:flex-none"
              />
            </div>
          </div>

          <Results
            cars={cars}
            favoritesEmpty={favoritesEmpty}
            range={range}
            datesQuery={datesQuery}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
            onReset={resetFilters}
            onShowAll={() => setFilters({ favorites: false })}
          />

          {!favoritesEmpty && cars.data?.meta && (
            <Pagination
              page={cars.data.meta.current_page}
              lastPage={cars.data.meta.last_page}
              onPageChange={changePage}
              className="mt-4"
            />
          )}
        </section>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtres"
        footer={
          <Button
            size="lg"
            className="w-full"
            loading={cars.isFetching}
            onClick={() => setSheetOpen(false)}
          >
            {total === undefined || total === 0 ? 'Voir les résultats' : `Voir ${carsLabel(total)}`}
          </Button>
        }
      >
        <FiltersPanel
          filters={filters}
          options={options}
          onChange={setFilters}
          onReset={() => setFilters(PANEL_RESET)}
        />
      </BottomSheet>
    </div>
  )
}

/** Category chips (several can be selected) and the "Mes favoris" chip. */
function CategoryChips({
  categories,
  selected,
  onChange,
  favoritesOn,
  favoritesCount,
  onToggleFavorites,
}) {
  if (!categories) {
    return (
      // Same rows as the real chips: one scrolling row on mobile, two wrapped rows on desktop.
      <LoadingRegion
        label="Chargement des catégories…"
        className="flex gap-2 overflow-hidden py-1 lg:flex-wrap"
      >
        {Array.from({ length: 11 }, (_, item) => (
          <Skeleton key={item} className="h-10 w-28 shrink-0 rounded-full" />
        ))}
      </LoadingRegion>
    )
  }

  function toggle(slug) {
    onChange(
      selected.includes(slug) ? selected.filter((item) => item !== slug) : [...selected, slug],
    )
  }

  return (
    <div
      role="group"
      aria-label="Catégories"
      className="-mx-4 scrollbar-none flex max-w-none gap-2 overflow-x-auto overscroll-x-contain px-4 py-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0"
    >
      <Chip icon={LayoutGrid} selected={selected.length === 0} onClick={() => onChange([])}>
        Toutes
      </Chip>
      {categories.map((category) => (
        <Chip
          key={category.slug}
          icon={iconFor(category.icon)}
          count={category.cars_count}
          selected={selected.includes(category.slug)}
          onClick={() => toggle(category.slug)}
        >
          {category.name}
        </Chip>
      ))}
      <span aria-hidden="true" className="mx-1 w-px shrink-0 self-stretch bg-line" />
      <Chip
        icon={Heart}
        count={favoritesCount}
        selected={favoritesOn}
        onClick={onToggleFavorites}
        className={cn(favoritesOn && '[&_svg]:fill-on-lime')}
      >
        Mes favoris
      </Chip>
    </div>
  )
}

function Results({
  cars,
  favoritesEmpty,
  range,
  datesQuery,
  isFavorite,
  onToggleFavorite,
  onReset,
  onShowAll,
}) {
  if (favoritesEmpty) {
    return (
      <EmptyState
        icon={Heart}
        title="Aucun favori pour l’instant"
        text="Touchez le cœur d’une voiture pour l’ajouter ici."
        action={
          <Button variant="secondary" onClick={onShowAll}>
            Voir toutes les voitures
          </Button>
        }
      />
    )
  }

  if (cars.isPending) {
    return (
      <LoadingRegion label="Chargement des voitures…" className="grid gap-5 sm:grid-cols-2">
        {[1, 2, 3, 4].map((item) => (
          <CarCardSkeleton key={item} />
        ))}
      </LoadingRegion>
    )
  }

  if (cars.isError) {
    if (cars.error?.response?.status === 422) {
      return (
        <EmptyState
          icon={CircleAlert}
          title="Cette recherche n’est pas valide"
          text={apiErrorMessage(cars.error)}
          action={<Button onClick={onReset}>Réinitialiser les filtres</Button>}
        />
      )
    }
    return (
      <ErrorState
        title="Impossible de charger les voitures"
        error={cars.error}
        onRetry={cars.refetch}
        retrying={cars.isFetching}
      />
    )
  }

  const list = cars.data.data

  if (list.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title="Aucune voiture trouvée"
        text="Essayez d’autres dates, une autre agence ou moins de filtres."
        action={<Button onClick={onReset}>Réinitialiser les filtres</Button>}
      />
    )
  }

  return (
    <motion.ul
      initial="hidden"
      animate="visible"
      aria-busy={cars.isPlaceholderData || undefined}
      className={cn(
        'grid gap-5 transition-opacity duration-250 sm:grid-cols-2',
        cars.isPlaceholderData && 'opacity-60',
      )}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        {list.map((car) => (
          <motion.li
            key={car.slug}
            layout
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={spring}
          >
            <CarCard
              car={car}
              to={`/voitures/${car.slug}${datesQuery}`}
              estimate={estimateRental(car.price_per_day, range)}
              isFavorite={isFavorite(car.slug)}
              onToggleFavorite={onToggleFavorite}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  )
}
