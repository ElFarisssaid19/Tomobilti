import { motion } from 'motion/react'
import { useMemo } from 'react'
import { useCars } from '../../hooks/useCatalog.js'
import useFavorites from '../../hooks/useFavorites.js'
import { revealOnView, staggerItem } from '../../lib/motion.js'
import { Button, CarCard, CarCardSkeleton, LoadingRegion } from '../ui'

/**
 * Up to 3 cars of the same category that are free for these days (GET /api/cars with
 * the dates), shown when the chosen car is taken. Each card keeps the dates.
 */
export default function SimilarAvailableCars({ car, from, to }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const params = useMemo(
    () => ({ category: car.category?.slug, start_at: from, end_at: to }),
    [car.category?.slug, from, to],
  )
  const { data, isPending, isError } = useCars(params, { enabled: Boolean(from && to) })
  const cars = (data?.data ?? []).filter((item) => item.slug !== car.slug).slice(0, 3)
  const dates = `start_at=${from}&end_at=${to}`

  if (isError) return null

  return (
    <section aria-labelledby="similar-free" className="flex flex-col gap-4">
      <h3 id="similar-free" className="text-lg font-bold text-fg">
        Libres à ces dates
      </h3>
      {isPending ? (
        <LoadingRegion
          label="Recherche de voitures libres…"
          className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {[1, 2, 3].map((item) => (
            <CarCardSkeleton key={item} />
          ))}
        </LoadingRegion>
      ) : cars.length > 0 ? (
        <motion.ul {...revealOnView} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {cars.map((item) => (
            <motion.li key={item.slug} variants={staggerItem}>
              <CarCard
                car={item}
                to={`/reserver/${item.slug}?${dates}`}
                isFavorite={isFavorite(item.slug)}
                onToggleFavorite={toggleFavorite}
              />
            </motion.li>
          ))}
        </motion.ul>
      ) : (
        <p className="text-sm text-fg-muted">
          Aucune voiture de la même catégorie n’est libre à ces dates.
        </p>
      )}
      <Button to={`/voitures?${dates}`} variant="outline" className="self-start">
        Voir toutes les voitures libres
      </Button>
    </section>
  )
}
