import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import PlanningTimeline from '../../components/admin/PlanningTimeline.jsx'
import {
  Button,
  EmptyState,
  ErrorState,
  IconButton,
  LoadingRegion,
  PageHeader,
  Skeleton,
} from '../../components/ui'
import { usePlanning } from '../../hooks/useAdmin.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilters from '../../hooks/useUrlFilters.js'
import { formatShortDate } from '../../lib/adminFormat.js'
import { cn } from '../../lib/cn.js'
import { RESERVATION_STATUS } from '../../lib/labels.js'
import { addDays, BAR_STYLE, mondayOf, PLANNING_DAYS } from '../../lib/planning.js'

const FILTERS = { from: { type: 'date' } }

/** /admin/planning: two weeks of the fleet, week by week. */
export default function AdminPlanningPage() {
  usePageMeta('Planning')
  const { filters, setFilters } = useUrlFilters(FILTERS)
  const thisWeek = mondayOf()
  const from = filters.from || thisWeek
  const to = addDays(from, PLANNING_DAYS - 1)
  const params = useMemo(() => ({ from, to }), [from, to])
  const { data, isPending, isError, error, refetch, isPlaceholderData } = usePlanning(params)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Planning"
        description={`${formatShortDate(`${from}T12:00:00`)} – ${formatShortDate(`${to}T12:00:00`)}`}
        actions={
          <div className="flex items-center gap-2">
            <IconButton
              icon={ChevronLeft}
              label="Semaine précédente"
              onClick={() => setFilters({ from: addDays(from, -7) })}
            />
            <Button
              variant="secondary"
              disabled={from === thisWeek}
              onClick={() => setFilters({ from: '' })}
            >
              Cette semaine
            </Button>
            <IconButton
              icon={ChevronRight}
              label="Semaine suivante"
              onClick={() => setFilters({ from: addDays(from, 7) })}
            />
          </div>
        }
      />

      <ul className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Légende">
        {Object.entries(BAR_STYLE).map(([status, style]) => {
          const Icon = style.icon
          return (
            <li key={status} className="flex items-center gap-2 text-sm text-fg-muted">
              <span
                className={cn('grid h-5 w-8 place-items-center rounded-xs border', style.className)}
              >
                <Icon className="size-3" aria-hidden="true" />
              </span>
              {RESERVATION_STATUS[status]}
            </li>
          )
        })}
        <li className="flex items-center gap-2 text-sm text-fg-muted">
          <span className="h-5 w-0.5 bg-lime" aria-hidden="true" />
          Maintenant
        </li>
      </ul>

      {isPending && (
        <LoadingRegion label="Chargement du planning…" className="flex flex-col gap-2">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton key={item} className="h-16 w-full rounded-input" />
          ))}
        </LoadingRegion>
      )}
      {isError && (
        <ErrorState title="Impossible de charger le planning" error={error} onRetry={refetch} />
      )}
      {data &&
        (data.cars.length === 0 ? (
          <EmptyState
            icon={CalendarRange}
            title="Aucune voiture"
            action={<Button to="/admin/voitures/nouvelle">Ajouter une voiture</Button>}
          />
        ) : (
          <div
            className={cn('transition-opacity duration-150', isPlaceholderData && 'opacity-60')}
            aria-busy={isPlaceholderData}
          >
            <PlanningTimeline from={from} cars={data.cars} />
          </div>
        ))}
    </div>
  )
}
