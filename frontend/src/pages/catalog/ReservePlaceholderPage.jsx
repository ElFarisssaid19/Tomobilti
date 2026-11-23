import { CalendarClock } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router'
import { Breadcrumbs, Button, EmptyState } from '../../components/ui'
import { useCar } from '../../hooks/useCatalog.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { formatDays, rentalDays, toDay } from '../../lib/dates.js'
import { formatDate } from '../../utils/format.js'

/**
 * /reserver/:slug?start_at&end_at (signed-in users). Placeholder until the booking
 * flow of Phase 4: it confirms the car and the dates that were chosen.
 */
export default function ReservePlaceholderPage() {
  const { slug } = useParams()
  const [searchParams] = useSearchParams()
  const { data } = useCar(slug)
  const car = data?.car
  const range = { from: toDay(searchParams.get('start_at')), to: toDay(searchParams.get('end_at')) }
  const days = rentalDays(range)
  const back = `/voitures/${slug}?${searchParams.toString()}`

  usePageMeta('Réservation', 'La réservation en ligne arrive bientôt sur Tomobilti.')

  return (
    <div className="container-page flex flex-1 flex-col gap-6 pt-24 pb-16 md:pt-32">
      <Breadcrumbs
        items={[
          { label: 'Voitures', to: '/voitures' },
          { label: car?.name ?? 'Voiture', to: back },
          { label: 'Réservation' },
        ]}
      />
      <h1 className="text-3xl font-bold text-fg md:text-4xl">Réserver {car?.name ?? ''}</h1>
      <EmptyState
        icon={CalendarClock}
        title="Bientôt disponible"
        text={
          days
            ? `La réservation en ligne arrive à la prochaine étape. Vos dates sont notées : ${formatDays(days)}, du ${formatDate(range.from)} au ${formatDate(range.to)}.`
            : 'La réservation en ligne arrive à la prochaine étape.'
        }
        action={
          <Button to={back} variant="secondary">
            Retour à la voiture
          </Button>
        }
      />
    </div>
  )
}
