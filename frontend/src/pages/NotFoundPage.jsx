import { motion } from 'motion/react'
import { Button, Glow } from '../components/ui'
import usePageMeta from '../hooks/usePageMeta.js'

/** A tyre stands in for the "0": it rolls in once and settles. */
function Wheel() {
  return (
    <motion.svg
      viewBox="0 0 100 100"
      aria-hidden="true"
      className="mx-[0.04em] inline-block size-[0.78em] align-[-0.02em]"
      initial={{ x: 120, rotate: 300, opacity: 0 }}
      animate={{
        x: 0,
        rotate: 0,
        opacity: 1,
        transition: { type: 'spring', visualDuration: 0.4, bounce: 0.3, delay: 0.15 },
      }}
    >
      <circle cx="50" cy="50" r="48" className="fill-canvas stroke-line-strong" strokeWidth="2" />
      <circle
        cx="50"
        cy="50"
        r="31"
        className="fill-raised stroke-line-control"
        strokeWidth="1.5"
      />
      {[0, 72, 144, 216, 288].map((angle) => (
        <rect
          key={angle}
          x="47"
          y="22"
          width="6"
          height="22"
          rx="3"
          className="fill-fg-subtle"
          transform={`rotate(${angle} 50 50)`}
        />
      ))}
      <circle cx="50" cy="50" r="8" className="fill-lime" />
    </motion.svg>
  )
}

export default function NotFoundPage() {
  usePageMeta('Page introuvable')
  return (
    <section className="relative isolate flex flex-1 items-center overflow-hidden">
      <Glow variant="empty" className="-top-1/4 bottom-1/2" />
      <div className="container-page flex flex-col items-center gap-6 pt-28 pb-20 text-center md:pt-36">
        <p className="text-[7.5rem] leading-none font-extrabold tracking-[-0.06em] text-fg tabular-nums sm:text-[10rem]">
          <span className="sr-only">Erreur 404</span>
          <span aria-hidden="true" className="inline-flex items-center">
            4<Wheel />4
          </span>
        </p>
        <h1 className="text-3xl font-bold text-fg sm:text-4xl">Cette route ne mène nulle part</h1>
        <p className="max-w-md text-lg text-fg-muted">
          La page demandée n’existe pas ou a été déplacée.
        </p>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Button to="/" size="lg">
            Retour à l’accueil
          </Button>
          <Button to="/voitures" size="lg" variant="secondary">
            Voir les voitures
          </Button>
        </div>
      </div>
    </section>
  )
}
