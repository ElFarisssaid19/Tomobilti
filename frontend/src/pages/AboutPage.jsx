import { BadgeCheck, HandCoins, Headset, MapPinned } from 'lucide-react'
import { motion } from 'motion/react'
import AgencyList from '../components/site/AgencyList.jsx'
import { Button, PageHeader, SectionHeading } from '../components/ui'
import atlas800 from '../assets/photos/route-atlas-800.webp'
import atlas1600 from '../assets/photos/route-atlas-1600.webp'
import usePageMeta from '../hooks/usePageMeta.js'
import { revealOnView, staggerItem } from '../lib/motion.js'

const VALUES = [
  {
    icon: HandCoins,
    title: 'Des prix sans surprise',
    text: 'Prix TTC en dirhams, caution affichée avant de réserver.',
  },
  {
    icon: MapPinned,
    title: 'Là où vous arrivez',
    text: 'Comptoirs dans trois aéroports, agences en ville.',
  },
  {
    icon: BadgeCheck,
    title: 'Des voitures prêtes à partir',
    text: 'Les voitures en maintenance ne sont pas proposées.',
  },
  {
    icon: Headset,
    title: 'Une vraie équipe au bout du fil',
    text: 'Téléphone, WhatsApp ou e-mail, avant et pendant la location.',
  },
]

/** /a-propos: who the agency is, what it cares about, and where to find it. */
export default function AboutPage() {
  usePageMeta(
    'À propos',
    'Tomobilti, agence de location de voitures à Marrakech, Casablanca et Agadir : nos engagements et nos agences.',
  )

  return (
    <div className="container-page flex flex-1 flex-col gap-16 pt-24 pb-20 md:gap-24 md:pt-32">
      <section className="grid items-center gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="flex flex-col gap-5">
          <PageHeader
            title="Une agence marocaine"
            description="Location de voitures à Marrakech, Casablanca et Agadir."
          />
          <div className="flex flex-wrap gap-3">
            <Button to="/voitures">Voir les voitures</Button>
            <Button to="/contact" variant="secondary">
              Nous contacter
            </Button>
          </div>
        </div>
        <img
          src={atlas800}
          srcSet={`${atlas800} 800w, ${atlas1600} 1600w`}
          sizes="(min-width: 1024px) 600px, 100vw"
          alt="Route en lacets des gorges du Dadès, dans le Haut Atlas"
          width={800}
          height={500}
          loading="lazy"
          decoding="async"
          className="aspect-[16/10] w-full rounded-card-lg border border-line object-cover"
        />
      </section>

      <section aria-labelledby="valeurs" className="flex flex-col gap-8">
        <h2 id="valeurs" className="text-2xl font-bold text-fg md:text-3xl">
          Nos engagements
        </h2>
        <motion.ul {...revealOnView} className="grid gap-x-10 gap-y-8 md:grid-cols-2">
          {VALUES.map((value) => (
            <motion.li key={value.title} variants={staggerItem} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-raised text-fg">
                <value.icon className="size-5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-fg">{value.title}</h3>
                <p className="max-w-md text-base text-fg-muted">{value.text}</p>
              </div>
            </motion.li>
          ))}
        </motion.ul>
      </section>

      <section aria-labelledby="agences" className="flex flex-col gap-6">
        <SectionHeading id="agences" title="Nos agences" />
        <AgencyList />
      </section>
    </div>
  )
}
