import {
  CalendarRange,
  KeyRound,
  MessageCircle,
  Plane,
  ReceiptText,
  SearchCheck,
} from 'lucide-react'
import { motion } from 'motion/react'
import { Link, useNavigate } from 'react-router'
import ApiStatusBadge from '../components/ApiStatusBadge.jsx'
import { WhatsAppIcon } from '../components/layout/SocialIcons.jsx'
import AgencyList from '../components/site/AgencyList.jsx'
import SearchWidget from '../components/site/SearchWidget.jsx'
import {
  Accordion,
  Button,
  CarCard,
  CarCardSkeleton,
  ErrorState,
  Glow,
  LoadingRegion,
  SectionHeading,
  Skeleton,
} from '../components/ui'
import aeroport800 from '../assets/photos/aeroport-800.webp'
import aeroport1600 from '../assets/photos/aeroport-1600.webp'
import heroDesktop from '../assets/photos/hero-1280.webp'
import heroDesktopLarge from '../assets/photos/hero-1920.webp'
import heroDesktopXl from '../assets/photos/hero-2400.webp'
import heroMobile from '../assets/photos/hero-mobile.webp'
import desert800 from '../assets/photos/route-desert-800.webp'
import desert1600 from '../assets/photos/route-desert-1600.webp'
import { AGENCY, whatsappUrl } from '../config/agency.js'
import { useCategories, useFeaturedCars } from '../hooks/useCatalog.js'
import useFavorites from '../hooks/useFavorites.js'
import usePageMeta from '../hooks/usePageMeta.js'
import { EMPTY_FILTERS, toQueryString } from '../lib/catalogParams.js'
import { iconFor } from '../lib/icons.js'
import { revealOnView, staggerContainer, staggerItem } from '../lib/motion.js'

const STEPS = [
  {
    icon: SearchCheck,
    title: 'Choisissez votre voiture',
    text: 'Filtrez par catégorie, boîte de vitesses ou budget, puis vérifiez les jours libres dans le calendrier de la voiture.',
  },
  {
    icon: CalendarRange,
    title: 'Réservez vos dates',
    text: 'Le prix par jour, le total estimé et le montant de la caution sont affichés avant de réserver.',
  },
  {
    icon: KeyRound,
    title: 'Récupérez les clés',
    text: 'À l’aéroport ou en agence, avec votre carte d’identité et votre permis de conduire.',
  },
]

const FAQ = [
  {
    title: 'Quels documents faut-il pour louer ?',
    content:
      'Votre carte d’identité nationale (CIN) et votre permis de conduire, obtenu depuis au moins 2 ans. Il faut avoir 18 ans ou plus.',
  },
  {
    title: 'À quoi sert la caution ?',
    content:
      'La caution est bloquée au moment de la prise en charge et rendue au retour de la voiture. Son montant est indiqué sur la fiche de chaque voiture, avant la réservation.',
  },
  {
    title: 'Les prix incluent-ils les taxes ?',
    content:
      'Oui. Tous les prix sont en dirhams (DH), TTC. Les options comme le GPS ou le siège bébé s’ajoutent au prix de la location.',
  },
  {
    title: 'Comment se compte la durée de location ?',
    content:
      'Par jour : chaque nuit entre le départ et le retour compte pour une journée, avec un minimum d’un jour.',
  },
  {
    title: 'Comment payer ?',
    content: 'À l’agence, en espèces, par carte bancaire ou par virement bancaire.',
  },
]

export default function HomePage() {
  usePageMeta(
    null,
    'Louez une voiture à Marrakech, Casablanca ou Agadir : prise en charge à l’aéroport ou en agence, prix TTC et caution affichés avant de réserver.',
  )

  return (
    <>
      <Hero />
      <Categories />
      <FeaturedCars />
      <HowItWorks />
      <WhyTomobilti />
      <section
        aria-labelledby="agences"
        className="container-page flex flex-col gap-6 pb-20 md:pb-28"
      >
        <SectionHeading
          id="agences"
          title="Nos agences"
          description="Nos comptoirs d’aéroport et nos agences en ville, avec leurs horaires."
        />
        <AgencyList />
      </section>
      <Faq />
      <FinalCta />
    </>
  )
}

/**
 * Full-bleed photo (a black city car parked by a road of southern Morocco at dusk)
 * under the floating navbar, with the search widget. On desktop the empty road on the
 * left holds the text and the car sits on the right. On mobile a closer 4:5 crop of the
 * car fills the top of the hero, above the headline. Gradient overlays keep the text at
 * WCAG AA: from the left on desktop, from the bottom on mobile, plus a top fade for the navbar.
 */
function Hero() {
  const navigate = useNavigate()

  function search(values) {
    navigate(`/voitures${toQueryString({ ...EMPTY_FILTERS, ...values })}`)
  }

  return (
    <section className="relative isolate flex min-h-[44rem] items-end overflow-hidden md:min-h-[46rem] md:items-center">
      <picture>
        <source
          media="(min-width: 768px)"
          srcSet={`${heroDesktop} 1280w, ${heroDesktopLarge} 1920w, ${heroDesktopXl} 2400w`}
          sizes="100vw"
        />
        <img
          src={heroMobile}
          alt=""
          width={800}
          height={1000}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-x-0 top-0 -z-30 h-[28rem] w-full object-cover object-[50%_40%] md:inset-0 md:h-full md:object-[85%_62%]"
        />
      </picture>
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 bg-linear-to-t from-canvas from-50% via-canvas/70 via-62% to-transparent to-80% md:bg-linear-to-r md:from-canvas md:from-20% md:via-canvas/85 md:via-62% md:to-canvas/10 lg:from-15% lg:via-canvas/75 lg:via-50%"
      />
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 -z-20 h-24 bg-linear-to-b from-canvas/70 to-transparent md:h-36 md:from-canvas/80"
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
        className="container-page flex flex-col items-start gap-6 pt-60 pb-12 md:pt-36 md:pb-20"
      >
        {import.meta.env.DEV && (
          <motion.div variants={staggerItem}>
            <ApiStatusBadge />
          </motion.div>
        )}
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
        <motion.div
          variants={staggerItem}
          className="w-full max-w-4xl rounded-card-lg border border-white/8 glass p-4 shadow-pop sm:p-5"
        >
          <SearchWidget onSubmit={search} />
        </motion.div>
      </motion.div>
    </section>
  )
}

/** Category tiles linking to the filtered catalogue, with their number of cars. */
function Categories() {
  const { data: categories, isPending, isError } = useCategories()

  if (isError) return null

  return (
    <section
      aria-labelledby="categories-title"
      className="container-page flex flex-col gap-6 pt-4 pb-16 md:pb-20"
    >
      <SectionHeading
        title="Une voiture pour chaque trajet"
        description="De la citadine pour la ville au 4×4 pour l’Atlas."
        to="/voitures"
        linkLabel="Toutes les voitures"
        id="categories-title"
      />
      {isPending ? (
        <LoadingRegion
          label="Chargement des catégories…"
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
        >
          {[1, 2, 3, 4, 5, 6, 7].map((item) => (
            <Skeleton key={item} className="h-32 rounded-card" />
          ))}
        </LoadingRegion>
      ) : (
        <motion.ul
          {...revealOnView}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7"
        >
          {categories.map((category) => {
            const Icon = iconFor(category.icon)
            return (
              <motion.li key={category.slug} variants={staggerItem}>
                <Link
                  to={`/voitures?category=${encodeURIComponent(category.slug)}`}
                  className="group flex h-full flex-col gap-6 rounded-card border border-line bg-surface p-4 transition-[border-color,background-color,transform] duration-250 ease-out hover:border-line-strong hover:bg-raised motion-safe:hover:-translate-y-1"
                >
                  <span className="grid size-10 place-items-center rounded-full bg-raised text-fg transition-colors duration-150 group-hover:bg-lime group-hover:text-on-lime">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="flex flex-col">
                    <span className="font-semibold text-fg">{category.name}</span>
                    <span className="text-sm text-fg-muted tabular-nums">
                      {category.cars_count} {category.cars_count > 1 ? 'voitures' : 'voiture'}
                    </span>
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </motion.ul>
      )}
    </section>
  )
}

function FeaturedCars() {
  const { data: cars, isPending, isError, error, refetch } = useFeaturedCars()
  const { isFavorite, toggleFavorite } = useFavorites()

  return (
    <section className="container-page flex flex-col gap-6 pb-20 md:pb-28">
      <SectionHeading
        title="Voitures à la une"
        description="Une sélection de l’agence, au départ de Marrakech, Casablanca et Agadir."
        to="/voitures"
      />
      {isError ? (
        <ErrorState title="Impossible de charger les voitures" error={error} onRetry={refetch} />
      ) : isPending ? (
        <LoadingRegion
          label="Chargement des voitures…"
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {[1, 2, 3].map((item) => (
            <CarCardSkeleton key={item} />
          ))}
        </LoadingRegion>
      ) : (
        <motion.ul {...revealOnView} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {cars.map((car) => (
            <motion.li key={car.slug} variants={staggerItem}>
              <CarCard
                car={car}
                to={`/voitures/${car.slug}`}
                isFavorite={isFavorite(car.slug)}
                onToggleFavorite={toggleFavorite}
              />
            </motion.li>
          ))}
        </motion.ul>
      )}
    </section>
  )
}

/** A real sequence, so the steps are numbered (DESIGN.md: numbers only for sequences). */
function HowItWorks() {
  return (
    <section
      aria-labelledby="comment-ca-marche"
      className="border-y border-line bg-surface/40 py-16 md:py-24"
    >
      <div className="container-page flex flex-col gap-10">
        <h2 id="comment-ca-marche" className="text-2xl font-bold text-fg md:text-3xl">
          Comment ça marche
        </h2>
        <motion.ol {...revealOnView} className="grid gap-8 md:grid-cols-3 md:gap-6">
          {STEPS.map((step, index) => (
            <motion.li key={step.title} variants={staggerItem} className="flex gap-4 md:flex-col">
              <div className="flex shrink-0 items-center gap-4 md:w-full">
                <span className="grid size-12 place-items-center rounded-full bg-lime text-lg font-bold text-on-lime tabular-nums">
                  {index + 1}
                </span>
                {index < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="hidden h-px flex-1 bg-linear-to-r from-line-strong to-transparent md:block"
                  />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="flex items-center gap-2 text-lg font-bold text-fg">
                  <step.icon className="size-5 text-fg-subtle" aria-hidden="true" />
                  {step.title}
                </h3>
                <p className="max-w-sm text-base text-fg-muted">{step.text}</p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}

function WhyTomobilti() {
  const reasons = [
    {
      icon: Plane,
      title: 'Prise en charge à l’aéroport',
      text: 'Nos comptoirs de Marrakech Menara, Casablanca Mohammed V et Agadir Al Massira vous remettent les clés dès votre arrivée.',
    },
    {
      icon: ReceiptText,
      title: 'Des prix clairs, caution comprise',
      text: 'Prix TTC en dirhams, total estimé pour vos dates et montant de la caution affichés avant la réservation.',
    },
    {
      icon: MessageCircle,
      title: 'Une équipe joignable',
      text: (
        <>
          Par téléphone au{' '}
          <a
            href={`tel:${AGENCY.phone}`}
            className="link-underline rounded-xs font-semibold text-fg tabular-nums"
          >
            {AGENCY.phoneDisplay}
          </a>{' '}
          ou sur{' '}
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noreferrer noopener"
            className="link-underline inline-flex items-center gap-1 rounded-xs font-semibold text-fg"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
            <span className="sr-only">(nouvel onglet)</span>
          </a>
          , aux horaires de chaque agence.
        </>
      ),
    },
  ]

  return (
    <section
      aria-labelledby="pourquoi"
      className="container-page grid items-center gap-10 py-20 md:py-28 lg:grid-cols-2 lg:gap-16"
    >
      <div className="relative overflow-hidden rounded-card-lg border border-line">
        <img
          src={aeroport800}
          srcSet={`${aeroport800} 800w, ${aeroport1600} 1600w`}
          sizes="(min-width: 1024px) 600px, 100vw"
          alt="Piste d’aéroport vue du ciel au crépuscule"
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          className="aspect-[16/10] size-full object-cover"
        />
      </div>
      <div className="flex flex-col gap-8">
        <h2 id="pourquoi" className="text-2xl font-bold text-fg md:text-3xl">
          Pourquoi Tomobilti
        </h2>
        <motion.ul {...revealOnView} className="flex flex-col divide-y divide-line">
          {reasons.map((reason) => (
            <motion.li
              key={reason.title}
              variants={staggerItem}
              className="flex gap-4 py-5 first:pt-0 last:pb-0"
            >
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-raised text-fg">
                <reason.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-fg">{reason.title}</h3>
                <p className="text-base text-fg-muted">{reason.text}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

function Faq() {
  return (
    <section
      aria-labelledby="faq"
      className="container-page grid gap-8 pb-20 md:pb-28 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-16"
    >
      <div className="flex flex-col gap-3">
        <h2 id="faq" className="text-2xl font-bold text-fg md:text-3xl">
          Questions fréquentes
        </h2>
        <p className="max-w-sm text-base text-fg-muted">
          Une autre question ?{' '}
          <Link to="/contact" className="link-underline rounded-xs font-semibold text-accent-text">
            Écrivez-nous
          </Link>
          .
        </p>
      </div>
      <Accordion items={FAQ} />
    </section>
  )
}

/** Closing call to action on a desert road photo, text on a gradient (WCAG AA). */
function FinalCta() {
  return (
    <section className="container-page pb-20 md:pb-28">
      <div className="relative isolate overflow-hidden rounded-card-lg border border-line">
        <img
          src={desert800}
          srcSet={`${desert800} 800w, ${desert1600} 1600w`}
          sizes="(min-width: 1280px) 1216px, 100vw"
          alt=""
          width={1600}
          height={1000}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 -z-20 size-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-linear-to-t from-canvas from-25% via-canvas/80 to-canvas/30 md:bg-linear-to-r md:from-canvas md:from-20% md:via-canvas/80 md:to-canvas/10"
        />
        <div className="flex flex-col items-start gap-5 px-6 py-14 sm:px-10 md:max-w-xl md:py-20">
          <h2 className="text-3xl font-bold text-balance text-fg md:text-4xl">
            Prêt à prendre la route ?
          </h2>
          <p className="text-lg text-fg/85">
            Choisissez vos dates, comparez les voitures libres et réservez en quelques minutes.
          </p>
          <Button size="lg" to="/voitures">
            Voir les voitures
          </Button>
        </div>
      </div>
    </section>
  )
}
