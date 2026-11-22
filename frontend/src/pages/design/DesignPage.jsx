import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import Logo from '../../components/layout/Logo.jsx'
import { Badge } from '../../components/ui'
import ContentSections from './ContentSections.jsx'
import ControlSections from './ControlSections.jsx'
import FoundationSections from './FoundationSections.jsx'

const SECTIONS = [
  { id: 'couleurs', label: 'Couleurs' },
  { id: 'typographie', label: 'Typographie' },
  { id: 'formes', label: 'Rayons et élévation' },
  { id: 'mouvement', label: 'Mouvement' },
  { id: 'boutons', label: 'Boutons' },
  { id: 'chips', label: 'Chips' },
  { id: 'formulaires', label: 'Formulaires' },
  { id: 'dates', label: 'Dates' },
  { id: 'badges', label: 'Badges' },
  { id: 'cartes', label: 'Cartes' },
  { id: 'overlays', label: 'Superpositions' },
  { id: 'navigation', label: 'Navigation' },
  { id: 'donnees', label: 'Données' },
  { id: 'etats', label: 'États' },
  { id: 'toasts', label: 'Toasts' },
  { id: 'faq', label: 'Accordéon' },
]

/**
 * Living style guide (development only, route /design): every token and every UI
 * component in its states. Source of truth for the rules: frontend/DESIGN.md.
 */
export default function DesignPage() {
  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-(--z-sticky) border-b border-line/80 glass">
        <div className="container-page flex h-16 items-center gap-4">
          <Logo />
          <span className="hidden text-sm font-semibold text-fg-muted sm:inline">
            Guide de style
          </span>
          <Badge tone="warning" className="hidden sm:inline-flex">
            Développement uniquement
          </Badge>
          <Link
            to="/"
            className="link-underline ml-auto inline-flex items-center gap-1 rounded-xs text-sm font-semibold text-fg-muted hover:text-fg"
          >
            Voir le site
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        <nav aria-label="Sections du guide" className="border-t border-line/60 lg:hidden">
          <ul className="container-page scrollbar-none flex gap-1 overflow-x-auto py-2">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="inline-flex h-8 items-center rounded-full px-3 text-sm font-medium whitespace-nowrap text-fg-muted hover:bg-raised hover:text-fg"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <div className="container-page grid gap-12 py-10 lg:grid-cols-[12rem_minmax(0,1fr)] lg:py-14">
        <nav aria-label="Sections du guide" className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-0.5">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex h-9 items-center rounded-sm px-3 text-sm font-medium text-fg-muted transition-colors hover:bg-raised hover:text-fg"
                >
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="flex min-w-0 flex-col gap-16">
          <header className="flex max-w-2xl flex-col gap-3">
            <h1 className="text-display-sm font-bold text-fg sm:text-display">Guide de style</h1>
            <p className="text-lg text-fg-muted">
              Tokens, mouvement et composants de Tomobilti. Les règles complètes sont dans
              frontend/DESIGN.md ; chaque phase réutilise ces composants au lieu d’en inventer.
            </p>
          </header>
          <FoundationSections />
          <ControlSections />
          <ContentSections />
        </main>
      </div>
    </div>
  )
}
