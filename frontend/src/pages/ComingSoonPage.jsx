import { Construction } from 'lucide-react'
import { Button, EmptyState, PageHeader } from '../components/ui'
import usePageMeta from '../hooks/usePageMeta.js'

/**
 * Placeholder for routes whose page arrives in a later phase, so layouts and
 * navigation can be checked now. Replace each use with the real page.
 */
export default function ComingSoonPage({
  title,
  description,
  phase,
  inContainer = true,
  titleAs = 'h1',
}) {
  usePageMeta(title)
  const content = (
    <div className="flex flex-col gap-8">
      <PageHeader title={title} description={description} titleAs={titleAs} />
      <EmptyState
        icon={Construction}
        title="Cette page arrive bientôt"
        text={
          phase ? `Elle sera construite pendant la ${phase}.` : 'Elle est en cours de construction.'
        }
        action={
          <Button to="/" variant="secondary">
            Retour à l’accueil
          </Button>
        }
      />
    </div>
  )

  if (!inContainer) return content

  return <div className="container-page flex-1 pt-24 pb-16 md:pt-32">{content}</div>
}
