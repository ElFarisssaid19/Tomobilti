import { RotateCw, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import Button from './Button.jsx'

/**
 * A failed load: say what failed and how to fix it, with a retry.
 * `error` can be an axios error: its API `message` (French, from Laravel) is shown.
 *
 * @example <ErrorState title="Impossible de charger les voitures" error={error} onRetry={refetch} />
 */
export default function ErrorState({
  title = 'Le chargement a échoué',
  titleAs: Title = 'h3',
  text = 'Vérifiez votre connexion puis réessayez.',
  error,
  onRetry,
  retrying = false,
  className,
}) {
  const apiMessage = error?.response?.data?.message

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center rounded-card-lg border border-danger/25 bg-surface px-6 py-12 text-center',
        className,
      )}
    >
      <span className="mb-5 grid size-14 place-items-center rounded-full bg-danger/12 text-danger">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </span>
      <Title className="text-xl font-bold text-fg">{title}</Title>
      <p className="mt-2 max-w-sm text-base text-fg-muted">{apiMessage || text}</p>
      {onRetry && (
        <Button
          variant="secondary"
          leftIcon={RotateCw}
          onClick={onRetry}
          loading={retrying}
          className="mt-6"
        >
          Réessayer
        </Button>
      )}
    </div>
  )
}
