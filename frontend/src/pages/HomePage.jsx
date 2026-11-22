import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import ApiStatusBadge from '../components/ApiStatusBadge.jsx'
import { Button, CarCard, Chip, ChipGroup, Glow, SectionHeading } from '../components/ui'
import heroDesktopLarge from '../assets/photos/hero-1920.webp'
import heroDesktop from '../assets/photos/hero-1280.webp'
import heroMobile from '../assets/photos/hero-mobile.webp'
import { FEATURED_CARS } from '../data/demoCars.js'
import { revealOnView, spring, staggerContainer, staggerItem } from '../lib/motion.js'

const FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'compacte', label: 'Compactes' },
  { value: 'suv', label: 'SUV' },
  { value: 'luxe', label: 'Luxe' },
]

export default function HomePage() {
  return (
    <>
      <Hero />
      <FeaturedCars />
    </>
  )
}

/**
 * Full-bleed photo (a grand taxi on the road near Aït Ben Haddou) under the floating
 * navbar. Gradient overlays keep the text at WCAG AA: from the left on desktop, from the
 * bottom on mobile, plus a top fade for the navbar and a bottom fade into the page.
 */
function Hero() {
  return (
    <section className="relative isolate flex min-h-[40rem] items-end overflow-hidden md:min-h-[44rem] md:items-center lg:min-h-[46rem]">
      <picture>
        <source
          media="(min-width: 768px)"
          srcSet={`${heroDesktop} 1280w, ${heroDesktopLarge} 1920w`}
          sizes="100vw"
        />
        <img
          src={heroMobile}
          alt=""
          width={800}
          height={1000}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-30 size-full object-cover object-[62%_45%] md:object-[60%_50%]"
        />
      </picture>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-linear-to-t from-canvas from-30% via-canvas/70 via-55% to-canvas/5 md:bg-linear-to-r md:from-canvas md:from-15% md:via-canvas/75 md:via-50% md:to-canvas/10"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-20 h-36 bg-linear-to-b from-canvas/80 to-transparent"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 -z-20 h-32 bg-linear-to-t from-canvas to-transparent"
      />
      <Glow variant="hero" drift className="-z-10 opacity-70" />

      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="visible"
        className="container-page flex flex-col items-start gap-6 pt-32 pb-14 md:pt-36 md:pb-24"
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
        <motion.p variants={staggerItem} className="max-w-md text-lg text-fg/85">
          Réservez en ligne et récupérez les clés à l’aéroport ou en agence, à Marrakech, Casablanca
          et Agadir.
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
    </section>
  )
}

/**
 * Demo of the catalogue pattern: chips filter the grid, cards slide into place with
 * layout animations. Uses demo data until the catalogue API (Phase 3).
 */
function FeaturedCars() {
  const [category, setCategory] = useState('all')
  const cars = FEATURED_CARS.filter((car) => category === 'all' || car.category.slug === category)

  return (
    <section className="container-page flex flex-col gap-6 pt-6 pb-20 md:pb-28">
      <SectionHeading
        title="Voitures à la une"
        description="Six modèles choisis par l’agence, au départ de Marrakech, Casablanca et Agadir."
        to="/voitures"
      />
      <ChipGroup label="Catégorie" value={category} onChange={setCategory} bleed>
        {FILTERS.map((filter) => (
          <Chip key={filter.value} value={filter.value}>
            {filter.label}
          </Chip>
        ))}
      </ChipGroup>
      <motion.ul {...revealOnView} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {cars.map((car) => (
            <motion.li
              key={car.id}
              layout
              variants={staggerItem}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={spring}
            >
              {/* Detail pages arrive with the catalogue (Phase 3). */}
              <CarCard car={car} to="/voitures" />
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </section>
  )
}
