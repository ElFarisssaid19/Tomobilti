import { RotateCcw } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Badge, Button } from '../../components/ui'
import { cn } from '../../lib/cn.js'
import { contrastLevel, contrastRatio } from '../../lib/color.js'
import {
  duration,
  fadeIn,
  fadeUp,
  scaleIn,
  staggerContainer,
  staggerItem,
} from '../../lib/motion.js'
import { COLOR_GROUPS } from './demoData.js'
import { Code, DemoGroup, DemoPanel, DemoSection } from './parts.jsx'

const BACKGROUNDS = [
  { name: 'canvas', hex: '#0B0A10' },
  { name: 'surface', hex: '#16151C' },
  { name: 'raised', hex: '#1F1E27' },
]

/**
 * One contrast line. `rule`: "text" (4.5:1), "ui" (3:1, non-text parts),
 * "disabled" (exempt) or "decorative" (no requirement).
 */
function Ratio({ label, foreground, background, rule = 'text' }) {
  const ratio = contrastRatio(foreground, background)
  let tone = 'success'
  let verdict = contrastLevel(ratio)
  if (rule === 'decorative') {
    tone = 'neutral'
    verdict = 'Décoratif'
  } else if (rule === 'disabled') {
    tone = 'neutral'
    verdict = 'Exempté'
  } else if (rule === 'ui') {
    tone = ratio >= 3 ? 'success' : 'danger'
    verdict = ratio >= 3 ? 'Non-texte 3:1' : 'Échec'
  } else if (ratio < 4.5) {
    tone = 'danger'
    verdict = 'Échec'
  }
  return (
    <li className="flex items-center justify-between gap-2 text-xs">
      <span className="text-fg-muted">{label}</span>
      <span className="flex items-center gap-1.5">
        <span className="font-semibold text-fg tabular-nums">{ratio.toFixed(2)}:1</span>
        <Badge tone={tone} className="h-5 px-2">
          {verdict}
        </Badge>
      </span>
    </li>
  )
}

function Swatch({ color, kind }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-card border border-line bg-surface">
      <div className="flex h-20 items-end p-3" style={{ backgroundColor: color.hex }}>
        {kind === 'brand' && (
          <span className="text-sm font-bold" style={{ color: color.on }}>
            Aa
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-fg">{color.token}</span>
          <span className="font-mono text-xs text-fg-subtle">{color.hex}</span>
          <span className="mt-1 text-xs text-fg-muted">{color.use}</span>
        </div>
        <ul className="flex flex-col gap-1.5">
          {kind === 'surface' && (
            <>
              <Ratio label="fg dessus" foreground="#FFFFFF" background={color.hex} />
              <Ratio label="fg-muted dessus" foreground="#A09DAD" background={color.hex} />
            </>
          )}
          {kind === 'text' &&
            BACKGROUNDS.map((bg) => (
              <Ratio
                key={bg.name}
                label={`sur ${bg.name}`}
                foreground={color.hex}
                background={bg.hex}
                rule={color.token === 'fg-disabled' ? 'disabled' : 'text'}
              />
            ))}
          {kind === 'line' &&
            BACKGROUNDS.slice(0, 2).map((bg) => (
              <Ratio
                key={bg.name}
                label={`sur ${bg.name}`}
                foreground={color.hex}
                background={bg.hex}
                rule={color.token === 'line-control' ? 'ui' : 'decorative'}
              />
            ))}
          {kind === 'brand' && (
            <Ratio label="texte dessus" foreground={color.on} background={color.hex} />
          )}
        </ul>
      </div>
    </div>
  )
}

const TYPE_SCALE = [
  { token: 'text-display-lg', size: '72 / 72', sample: 'Bonjour, Said', weight: 'font-bold' },
  { token: 'text-display', size: '56 / 57', sample: 'Bonjour, Said', weight: 'font-bold' },
  { token: 'text-display-sm', size: '44 / 46', sample: 'Bonjour, Said', weight: 'font-bold' },
  { token: 'text-4xl', size: '36 / 40', sample: 'Mes réservations', weight: 'font-bold' },
  { token: 'text-3xl', size: '30 / 36', sample: 'Voitures disponibles', weight: 'font-bold' },
  { token: 'text-2xl', size: '24 / 32', sample: 'Voitures à la une', weight: 'font-bold' },
  { token: 'text-xl', size: '20 / 28', sample: 'Dacia Duster', weight: 'font-semibold' },
  {
    token: 'text-lg',
    size: '18 / 28',
    sample: 'Récupérez les clés à l’aéroport Menara.',
    weight: 'font-normal',
  },
  {
    token: 'text-base',
    size: '16 / 24',
    sample: 'La caution est restituée au retour du véhicule.',
    weight: 'font-normal',
  },
  {
    token: 'text-sm',
    size: '14 / 20',
    sample: 'Kilométrage illimité, assurance incluse.',
    weight: 'font-medium',
  },
  { token: 'text-xs', size: '12 / 16', sample: 'Prix TTC en dirhams', weight: 'font-medium' },
]

const RADII = [
  { token: 'rounded-xs', value: '6px', use: 'Petits repères' },
  { token: 'rounded-sm', value: '10px', use: 'Éléments de menu' },
  { token: 'rounded-input', value: '14px', use: 'Champs, popovers' },
  { token: 'rounded-card', value: '20px', use: 'Cartes' },
  { token: 'rounded-card-lg', value: '28px', use: 'Grandes cartes, feuilles' },
  { token: 'rounded-full', value: '9999px', use: 'Boutons, chips, badges' },
]

const ELEVATIONS = [
  { label: 'Bordure seule', className: 'border border-line bg-surface' },
  { label: 'Surélevé', className: 'border border-line bg-raised' },
  { label: 'shadow-pop (menus)', className: 'border border-line bg-raised shadow-pop' },
  {
    label: 'shadow-glow-violet (survol carte)',
    className: 'border border-line-strong bg-surface shadow-glow-violet',
  },
  {
    label: 'shadow-glow-lime (survol bouton)',
    className: 'border border-line bg-surface shadow-glow-lime',
  },
]

const GLOWS = [
  { label: '--glow-hero (lent, hero seulement)', className: 'bg-(image:--glow-hero)' },
  { label: '--glow-auth', className: 'bg-(image:--glow-auth)' },
  { label: '--glow-empty', className: 'bg-(image:--glow-empty)' },
  { label: '--glow-stage (derrière les voitures)', className: 'bg-(image:--glow-stage)' },
]

const VARIANT_DEMOS = { fadeIn, fadeUp, scaleIn }

function MotionDemo() {
  const [runs, setRuns] = useState(0)
  return (
    <DemoPanel className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          Variantes de src/lib/motion.js, rejouées à la demande.
        </p>
        <Button
          size="sm"
          variant="secondary"
          leftIcon={RotateCcw}
          onClick={() => setRuns((n) => n + 1)}
        >
          Rejouer
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(VARIANT_DEMOS).map(([name, variants]) => (
          <div key={name} className="flex flex-col gap-2">
            <div className="grid h-28 place-items-center rounded-card border border-line bg-canvas">
              <motion.div
                key={runs}
                variants={variants}
                initial="hidden"
                animate="visible"
                className="size-12 rounded-sm bg-lime"
              />
            </div>
            <Code>{name}</Code>
          </div>
        ))}
        <div className="flex flex-col gap-2">
          <motion.div
            key={runs}
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="grid h-28 grid-cols-3 gap-2 rounded-card border border-line bg-canvas p-3"
          >
            {Array.from({ length: 6 }, (_, i) => (
              <motion.div key={i} variants={staggerItem} className="rounded-xs bg-raised-hover" />
            ))}
          </motion.div>
          <Code>staggerContainer + staggerItem</Code>
        </div>
      </div>
      <ul className="grid gap-3 text-sm sm:grid-cols-3">
        {Object.entries(duration).map(([name, value]) => (
          <li
            key={name}
            className="flex items-center justify-between rounded-sm border border-line px-4 py-3"
          >
            <Code>duration.{name}</Code>
            <span className="font-semibold text-fg tabular-nums">{value * 1000} ms</span>
          </li>
        ))}
      </ul>
      <p className="text-sm text-fg-muted">
        Courbes : <Code>ease.out</Code> cubic-bezier(0.22, 1, 0.36, 1), <Code>ease.inOut</Code>{' '}
        cubic-bezier(0.65, 0, 0.35, 1), <Code>spring</Code> (visualDuration 0.35 s, bounce 0.15)
        pour les animations de layout. Avec « réduire les animations », les transformations sont
        coupées et seuls les fondus restent.
      </p>
    </DemoPanel>
  )
}

function PageTransitionDemo() {
  const [page, setPage] = useState(0)
  const pages = ['Accueil', 'Voitures', 'Réservations']
  return (
    <DemoPanel className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {pages.map((name, index) => (
          <Button
            key={name}
            size="sm"
            variant={index === page ? 'primary' : 'secondary'}
            onClick={() => setPage(index)}
          >
            {name}
          </Button>
        ))}
      </div>
      <div className="h-32 overflow-hidden rounded-card border border-line bg-canvas p-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: duration.fast } }}
          >
            <p className="text-2xl font-bold text-fg">{pages[page]}</p>
            <p className="mt-1 text-sm text-fg-muted">
              pageTransition : fondu + glissement de 8 px.
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </DemoPanel>
  )
}

export default function FoundationSections() {
  return (
    <>
      <DemoSection
        id="couleurs"
        title="Couleurs"
        description="Tokens sémantiques définis dans src/index.css (@theme). Les contrastes sont calculés en direct (WCAG 2.x)."
      >
        {COLOR_GROUPS.map((group) => (
          <DemoGroup key={group.title} title={group.title} note={group.note}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {group.colors.map((color) => (
                <Swatch key={color.token} color={color} kind={group.kind} />
              ))}
            </div>
          </DemoGroup>
        ))}
      </DemoSection>

      <DemoSection
        id="typographie"
        title="Typographie"
        description="Plus Jakarta Sans Variable (auto-hébergée via Fontsource). Titres en gras, chiffres tabulaires pour les prix et les dates."
      >
        <DemoPanel className="flex flex-col divide-y divide-line p-0 sm:p-0">
          {TYPE_SCALE.map((item) => (
            <div
              key={item.token}
              className="flex flex-col gap-2 px-5 py-5 sm:flex-row sm:items-baseline sm:gap-8 sm:px-6"
            >
              <div className="flex w-40 shrink-0 flex-col">
                <Code>{item.token}</Code>
                <span className="mt-1 text-xs text-fg-subtle tabular-nums">{item.size} px</span>
              </div>
              <p
                className={cn(item.token, item.weight, 'min-w-0 [overflow-wrap:anywhere] text-fg')}
              >
                {item.sample}
              </p>
            </div>
          ))}
        </DemoPanel>
        <DemoGroup
          title="Chiffres"
          note="Utilisez tabular-nums pour les prix, dates et tableaux : les colonnes restent alignées."
        >
          <DemoPanel className="flex flex-wrap gap-8">
            <p className="text-2xl font-bold text-accent-text tabular-nums">1 800 DH</p>
            <p className="text-2xl font-bold text-fg tabular-nums">12 – 15 déc. 2026</p>
            <p className="text-2xl font-bold text-fg tabular-nums">TMB-2026-000128</p>
          </DemoPanel>
        </DemoGroup>
      </DemoSection>

      <DemoSection
        id="formes"
        title="Rayons et élévation"
        description="Grille de 4 px. Sur fond sombre, la hiérarchie vient des bordures et des surfaces plus claires, pas des ombres."
      >
        <DemoGroup title="Rayons">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {RADII.map((radius) => (
              <div key={radius.token} className="flex flex-col gap-2">
                <div className={cn('h-20 border border-line-strong bg-raised', radius.token)} />
                <Code>{radius.token}</Code>
                <span className="text-xs text-fg-subtle">
                  {radius.value}, {radius.use}
                </span>
              </div>
            ))}
          </div>
        </DemoGroup>
        <DemoGroup title="Élévation">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {ELEVATIONS.map((item) => (
              <div key={item.label} className="flex flex-col gap-2">
                <div className={cn('h-24 rounded-card', item.className)} />
                <span className="text-xs text-fg-subtle">{item.label}</span>
              </div>
            ))}
          </div>
        </DemoGroup>
        <DemoGroup title="Lueurs" note="Jamais derrière du texte courant.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {GLOWS.map((glow) => (
              <div key={glow.label} className="flex flex-col gap-2">
                <div
                  className={cn(
                    'h-36 rounded-card-lg border border-line bg-canvas',
                    glow.className,
                  )}
                />
                <span className="text-xs text-fg-subtle">{glow.label}</span>
              </div>
            ))}
          </div>
        </DemoGroup>
      </DemoSection>

      <DemoSection
        id="mouvement"
        title="Mouvement"
        description="Motion pour les entrées, sorties, transitions de page et layouts. Transitions CSS pour le survol, le focus et l’appui. Uniquement transform et opacity, 400 ms maximum."
      >
        <MotionDemo />
        <DemoGroup
          title="Transition de page"
          note="Appliquée par PageTransition à chaque changement de route, avec retour en haut de page."
        >
          <PageTransitionDemo />
        </DemoGroup>
      </DemoSection>
    </>
  )
}
