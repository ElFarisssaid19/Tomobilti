import { Check } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Button } from '../../components/ui'
import { formatMoment } from '../../lib/booking.js'
import { fadeUp, spring, staggerContainer, staggerItem } from '../../lib/motion.js'
import { formatPrice } from '../../utils/format.js'

const NEXT_STEPS = [
  {
    title: 'L’agence confirme votre demande',
    text: 'Suivez le statut dans Mes réservations.',
  },
  {
    title: 'Préparez vos documents',
    text: 'CIN ou passeport, permis et carte bancaire.',
  },
  {
    title: 'Récupérez les clés',
    text: 'Paiement à l’agence, à la prise en charge.',
  },
]

/**
 * Shown once the reservation is saved: a check that draws in (scale and fade; only
 * the fade with reduced motion, through MotionConfig), the reference and what
 * happens next.
 */
export default function BookingConfirmation({ reservation }) {
  const headingRef = useRef(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="mx-auto flex w-full max-w-2xl flex-col items-start gap-8 rounded-card-lg border border-line bg-surface p-6 sm:p-10"
    >
      <motion.span
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1, transition: spring }}
        className="grid size-16 place-items-center rounded-full bg-success/12 text-success ring-1 ring-success/30"
      >
        <Check className="size-8" aria-hidden="true" />
      </motion.span>

      <motion.div variants={fadeUp} className="flex flex-col gap-3">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-3xl font-bold text-balance text-fg focus:outline-none sm:text-4xl"
        >
          Demande de réservation envoyée
        </h1>
        <p className="text-base text-fg-muted">
          {reservation.car.name}, du {formatMoment(reservation.start_at)} au{' '}
          {formatMoment(reservation.end_at)}. Total{' '}
          <span className="font-semibold text-fg tabular-nums">
            {formatPrice(reservation.total)}
          </span>
          , à payer à l’agence.
        </p>
      </motion.div>

      <motion.dl variants={staggerItem} className="flex flex-col gap-1">
        <dt className="text-sm text-fg-muted">Référence</dt>
        <dd className="text-2xl font-bold tracking-wide text-accent-text tabular-nums">
          {reservation.reference}
        </dd>
      </motion.dl>

      <motion.section
        variants={staggerItem}
        aria-labelledby="suite"
        className="flex flex-col gap-4"
      >
        <h2 id="suite" className="text-lg font-bold text-fg">
          La suite
        </h2>
        <ol className="flex flex-col gap-4">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line bg-raised text-sm font-bold text-fg tabular-nums">
                {index + 1}
              </span>
              <span className="flex flex-col gap-0.5 pt-1">
                <span className="text-sm font-semibold text-fg">{step.title}</span>
                <span className="text-sm text-fg-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </motion.section>

      <motion.div variants={staggerItem} className="flex w-full flex-wrap gap-3">
        <Button to={`/espace/reservations/${reservation.reference}`} size="lg">
          Voir ma réservation
        </Button>
        <Button to="/voitures" variant="ghost" size="lg">
          Retour aux voitures
        </Button>
      </motion.div>
    </motion.div>
  )
}
