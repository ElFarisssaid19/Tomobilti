import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import ApiStatusBadge from '../components/ApiStatusBadge.jsx'
import { Button, Chip, ChipGroup, Glow } from '../components/ui'
import { CAR_SILHOUETTES } from '../lib/cars.js'
import { fadeUp, staggerContainer, staggerItem, transition } from '../lib/motion.js'

// Hero demo: one silhouette per category. Real categories come from the API in Phase 3.
const VEHICLES = [
  {
    value: 'economique',
    label: 'Économique',
    image: CAR_SILHOUETTES.citadine,
    line: 'Facile à garer, même près de la médina.',
  },
  {
    value: 'berline',
    label: 'Berline',
    image: CAR_SILHOUETTES.berline,
    line: 'Du confort pour Casablanca – Marrakech.',
  },
  {
    value: 'suv',
    label: 'SUV',
    image: CAR_SILHOUETTES.suv,
    line: 'De la place pour les routes de l’Atlas.',
  },
  {
    value: 'utilitaire',
    label: 'Utilitaire',
    image: CAR_SILHOUETTES.utilitaire,
    line: 'Pour un déménagement ou une livraison.',
  },
]

export default function HomePage() {
  const [category, setCategory] = useState(VEHICLES[0].value)
  const vehicle = VEHICLES.find((item) => item.value === category)

  return (
    <section className="relative isolate overflow-hidden">
      <Glow variant="hero" drift />

      <div className="container-page grid items-center gap-10 pt-24 pb-16 md:pt-36 md:pb-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex flex-col items-start gap-6"
        >
          <motion.div variants={staggerItem}>
            <ApiStatusBadge />
          </motion.div>
          <motion.h1
            variants={staggerItem}
            className="max-w-[12ch] text-display-sm font-bold text-balance text-fg sm:text-display xl:text-display-lg"
          >
            Prenez le volant dès l’atterrissage.
          </motion.h1>
          <motion.p variants={staggerItem} className="max-w-md text-lg text-fg-muted">
            Réservez en ligne et récupérez les clés à l’aéroport ou en agence, à Marrakech,
            Casablanca et Agadir.
          </motion.p>
          <motion.div variants={staggerItem} className="flex flex-wrap gap-3">
            <Button size="lg" to="/voitures">
              Voir les voitures
            </Button>
            <Button size="lg" variant="secondary" to="/inscription">
              Créer un compte
            </Button>
          </motion.div>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex min-w-0 flex-col gap-4"
        >
          <Stage vehicle={vehicle} />
          <ChipGroup label="Type de voiture" value={category} onChange={setCategory} bleed>
            {VEHICLES.map((item) => (
              <Chip key={item.value} value={item.value}>
                {item.label}
              </Chip>
            ))}
          </ChipGroup>
        </motion.div>
      </div>
    </section>
  )
}

/** The lit stage: the selected car slides onto a floor lit by a soft lime line. */
function Stage({ vehicle }) {
  return (
    <div className="relative isolate aspect-[16/11] overflow-hidden rounded-card-lg border border-line bg-surface/70 sm:aspect-[16/10]">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-(image:--glow-stage)" />
      <div
        aria-hidden="true"
        className="absolute bottom-[12%] left-1/2 -z-10 h-12 w-2/3 -translate-x-1/2 rounded-full bg-lime/10 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-[6%] bottom-[18%] -z-10 h-px bg-linear-to-r from-transparent via-lime/45 to-transparent"
      />

      <div
        aria-live="polite"
        className="absolute top-5 left-5 flex flex-col gap-1 sm:top-7 sm:left-7"
      >
        <p className="text-2xl font-bold text-fg">{vehicle.label}</p>
        <p className="max-w-[26ch] text-sm text-fg-muted">{vehicle.line}</p>
      </div>

      <AnimatePresence mode="popLayout" initial={false}>
        <motion.img
          key={vehicle.value}
          src={vehicle.image}
          alt=""
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0, transition: transition.slow }}
          exit={{ opacity: 0, x: -48, transition: transition.base }}
          className="absolute bottom-[14%] left-[6%] w-[88%]"
        />
      </AnimatePresence>
    </div>
  )
}
