import { Search, X } from 'lucide-react'
import { useState } from 'react'
import { useLocations } from '../../hooks/useCatalog.js'
import { cn } from '../../lib/cn.js'
import { toDay, toInputDate } from '../../lib/dates.js'
import { Button, DateRangePicker, IconButton, Input, Select } from '../ui'

const ALL_LOCATIONS = ''

/**
 * Search form: pick-up location (from /api/locations), rental dates and, on the
 * catalogue, a brand or model search. It keeps a draft and calls `onSubmit` with
 * `{ location, start_at, end_at, q }` (dates as YYYY-MM-DD, '' when empty) on
 * "Rechercher". Remount it with a `key` when the applied values change elsewhere
 * (back button) so the draft follows.
 */
export default function SearchWidget({
  initialValues = {},
  onSubmit,
  showQuery = false,
  submitLabel = 'Rechercher',
  className,
}) {
  const { data: locations = [], isPending } = useLocations()
  const [location, setLocation] = useState(initialValues.location ?? ALL_LOCATIONS)
  const [q, setQ] = useState(initialValues.q ?? '')
  const [range, setRange] = useState(() => {
    const from = toDay(initialValues.start_at)
    const to = toDay(initialValues.end_at)
    return from && to ? { from, to } : undefined
  })

  const options = [
    { value: ALL_LOCATIONS, label: 'Toutes les agences' },
    ...locations.map((item) => ({ value: item.slug, label: item.name })),
  ]

  function handleSubmit(event) {
    event.preventDefault()
    const complete = range?.from && range?.to
    onSubmit({
      location,
      q: q.trim(),
      start_at: complete ? toInputDate(range.from) : '',
      end_at: complete ? toInputDate(range.to) : '',
    })
  }

  return (
    <form
      role="search"
      aria-label="Rechercher une voiture"
      onSubmit={handleSubmit}
      className={cn(
        'grid gap-4 md:items-end',
        showQuery
          ? 'md:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.35fr)_auto]'
          : 'md:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)_auto]',
        className,
      )}
    >
      {showQuery && (
        <Input
          label="Marque ou modèle"
          name="q"
          type="search"
          placeholder="Dacia, Clio, Tucson…"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          autoComplete="off"
          trailing={
            q && (
              <IconButton
                icon={X}
                label="Effacer la recherche"
                variant="ghost"
                size="sm"
                onClick={() => setQ('')}
              />
            )
          }
        />
      )}
      <Select
        label="Lieu de prise en charge"
        name="location"
        options={options}
        value={location}
        onChange={setLocation}
        disabled={isPending && locations.length === 0}
      />
      <DateRangePicker label="Dates de location" value={range} onChange={setRange} />
      <Button
        type="submit"
        size="lg"
        leftIcon={Search}
        className={cn('w-full md:w-auto', showQuery && 'md:col-span-2 lg:col-span-1')}
      >
        {submitLabel}
      </Button>
    </form>
  )
}
