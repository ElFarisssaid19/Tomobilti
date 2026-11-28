import { Link } from 'react-router'
import { Alert, ErrorState, LoadingRegion, PageHeader, Skeleton, SkeletonText } from '../ui'
import { useLegal } from '../../hooks/useCatalog.js'
import usePageMeta from '../../hooks/usePageMeta.js'

/**
 * Layout of the legal pages (/conditions-generales, /confidentialite): the title, the
 * "demo model" warning, then numbered articles (a real sequence, as in any contract)
 * with a sticky table of contents from `lg`. Every value comes from GET /api/legal
 * (config/tomobilti.php), so the text states the rules the server applies.
 *
 * @param {(legal: object) => Array<{ id: string, title: string, content: React.ReactNode }>} articles
 */
export default function LegalDocument({ title, description, articles }) {
  usePageMeta(title, description)
  const { data: legal, isPending, isError, error, refetch } = useLegal()

  return (
    <div className="container-page flex flex-1 flex-col gap-8 pt-24 pb-16 md:pt-32">
      <PageHeader title={title} />
      <Alert tone="warning" title="Modèle de démonstration" className="max-w-3xl">
        Ce texte doit être relu et validé par l’agence avant la mise en ligne.
      </Alert>

      {isPending ? (
        <LoadingRegion label="Chargement du document…" className="flex max-w-2xl flex-col gap-8">
          {[0, 1, 2].map((row) => (
            <div key={row} className="flex flex-col gap-3">
              <Skeleton className="h-7 w-56" />
              <SkeletonText lines={3} />
            </div>
          ))}
        </LoadingRegion>
      ) : isError ? (
        <ErrorState title="Impossible de charger le document" error={error} onRetry={refetch} />
      ) : (
        <Articles articles={articles(legal)} />
      )}
    </div>
  )
}

function Articles({ articles }) {
  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
      <nav aria-label="Sommaire" className="hidden lg:block">
        <ol className="sticky top-28 flex flex-col gap-1 border-l border-line">
          {articles.map((article, index) => (
            <li key={article.id}>
              <a
                href={`#${article.id}`}
                className="-ml-px flex gap-2 border-l border-transparent py-1.5 pl-4 text-sm text-fg-muted transition-colors duration-150 hover:border-line-strong hover:text-fg"
              >
                <span className="text-fg-subtle tabular-nums">{index + 1}.</span>
                {article.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="flex max-w-2xl flex-col gap-10">
        {articles.map((article, index) => (
          <section key={article.id} id={article.id} aria-labelledby={`${article.id}-titre`}>
            <h2
              id={`${article.id}-titre`}
              className="flex gap-3 text-xl font-bold text-fg sm:text-2xl"
            >
              <span className="text-fg-subtle tabular-nums">{index + 1}.</span>
              {article.title}
            </h2>
            <div className="mt-3 flex flex-col gap-3 text-base text-fg-muted">
              {article.content}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

/** Bullet list of a legal article. */
export function LegalList({ items }) {
  return (
    <ul className="flex list-disc flex-col gap-1.5 pl-5 marker:text-fg-subtle">
      {items.filter(Boolean).map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  )
}

/**
 * Link to a legal page from a form (sign-up, booking): opens in a new tab so the form
 * and its draft stay as they are.
 */
export function LegalLink({ to, children }) {
  return (
    <Link
      to={to}
      target="_blank"
      rel="noopener"
      className="link-underline rounded-xs font-semibold text-accent-text"
    >
      {children}
      <span className="sr-only"> (nouvel onglet)</span>
    </Link>
  )
}
