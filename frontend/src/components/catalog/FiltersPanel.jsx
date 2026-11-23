import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { countPanelFilters } from '../../lib/catalogParams.js'
import { FUEL_TYPE, label, TRANSMISSION } from '../../lib/labels.js'
import { formatPrice } from '../../utils/format.js'
import { Button, Chip, ChipGroup, LoadingRegion, RangeSlider, Skeleton, Switch } from '../ui'

const ANY = 'any'

/** "4 et plus", "5 et plus", "7 et plus": only those some car reaches are shown. */
const SEAT_THRESHOLDS = [4, 5, 7]

/**
 * Filters of the catalogue (brand, gearbox, fuel, seats, price, air conditioning).
 * Every change is applied at once through `onChange(patch)`, which updates the URL;
 * the price is applied when the thumb is released.
 *
 * @param {object} filters current filters (lib/catalogParams.js)
 * @param {object} options GET /api/catalog/filters payload
 */
export default function FiltersPanel({ filters, options, onChange, onReset }) {
  if (!options) {
    return (
      <LoadingRegion label="Chargement des filtres…" className="flex flex-col gap-6">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="flex flex-col gap-3">
            <Skeleton className="h-4 w-24" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20 rounded-full" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </LoadingRegion>
    )
  }

  const activeCount = countPanelFilters(filters)

  return (
    <div className="flex flex-col gap-7">
      <FilterGroup title="Marque">
        <ChipGroup
          label="Marque"
          multiple
          wrap
          value={filters.brand}
          onChange={(brand) => onChange({ brand })}
        >
          {options.brands.map((brand) => (
            <Chip key={brand.slug} value={brand.slug} count={brand.cars_count}>
              {brand.name}
            </Chip>
          ))}
        </ChipGroup>
      </FilterGroup>

      <FilterGroup title="Boîte de vitesses">
        <ChipGroup
          label="Boîte de vitesses"
          wrap
          value={filters.transmission || ANY}
          onChange={(value) => onChange({ transmission: value === ANY ? '' : value })}
        >
          <Chip value={ANY}>Toutes</Chip>
          {options.transmissions.map((option) => (
            <Chip key={option.value} value={option.value}>
              {label(TRANSMISSION, option.value)}
            </Chip>
          ))}
        </ChipGroup>
      </FilterGroup>

      <FilterGroup title="Carburant">
        <ChipGroup
          label="Carburant"
          multiple
          wrap
          value={filters.fuel}
          onChange={(fuel) => onChange({ fuel })}
        >
          {options.fuels.map((option) => (
            <Chip key={option.value} value={option.value}>
              {label(FUEL_TYPE, option.value)}
            </Chip>
          ))}
        </ChipGroup>
      </FilterGroup>

      <FilterGroup title="Nombre de places">
        <ChipGroup
          label="Nombre de places"
          wrap
          value={filters.seats_min ? String(filters.seats_min) : ANY}
          onChange={(value) => onChange({ seats_min: value === ANY ? null : Number(value) })}
        >
          <Chip value={ANY}>Toutes</Chip>
          {SEAT_THRESHOLDS.filter((seats) => options.seats.some((value) => value >= seats)).map(
            (seats) => (
              <Chip key={seats} value={String(seats)}>
                {seats} et plus
              </Chip>
            ),
          )}
        </ChipGroup>
      </FilterGroup>

      {options.price.max > options.price.min && (
        <PriceFilter
          // Remount when the URL changes elsewhere (back button) so the thumbs follow.
          key={`${filters.price_min}-${filters.price_max}`}
          bounds={options.price}
          minValue={filters.price_min}
          maxValue={filters.price_max}
          onCommit={(price_min, price_max) => onChange({ price_min, price_max })}
        />
      )}

      <Switch
        label="Climatisation"
        hint="Seulement les voitures climatisées"
        checked={filters.air_conditioning}
        onChange={(air_conditioning) => onChange({ air_conditioning })}
      />

      {activeCount > 0 && (
        <Button variant="ghost" leftIcon={RotateCcw} onClick={onReset} className="self-start">
          Effacer les filtres
        </Button>
      )}
    </div>
  )
}

function FilterGroup({ title, children }) {
  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold text-fg">{title}</h3>
      {children}
    </section>
  )
}

const PRICE_STEP = 10

/** Price range with a draft while dragging; a bound at the edge means "no limit". */
function PriceFilter({ bounds, minValue, maxValue, onCommit }) {
  const min = Math.floor(bounds.min / PRICE_STEP) * PRICE_STEP
  const max = Math.ceil(bounds.max / PRICE_STEP) * PRICE_STEP
  const clamp = (value, fallback) =>
    value === null || value === undefined ? fallback : Math.min(Math.max(value, min), max)
  const [draft, setDraft] = useState([clamp(minValue, min), clamp(maxValue, max)])

  function commit([low, high]) {
    onCommit(low > min ? low : null, high < max ? high : null)
  }

  return (
    <RangeSlider
      label="Prix par jour"
      min={min}
      max={max}
      step={PRICE_STEP}
      value={draft}
      onChange={setDraft}
      onChangeEnd={commit}
      formatValue={formatPrice}
      minLabel="Prix minimum par jour"
      maxLabel="Prix maximum par jour"
    />
  )
}
