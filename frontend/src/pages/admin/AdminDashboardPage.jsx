import { Activity, Construction } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { pingAdmin } from '../../api/auth.js'
import { Badge, Card, EmptyState, ErrorState, PageHeader, Skeleton } from '../../components/ui'
import { useAuth } from '../../context/authContext.js'
import { firstName } from '../../lib/auth.js'
import { formatDate } from '../../utils/format.js'

/** /admin: greeting and a check that the protected admin API answers (GET /api/admin/ping). */
export default function AdminDashboardPage() {
  const { user } = useAuth()
  const [ping, setPing] = useState({ status: 'loading' })

  const runPing = useCallback(async (signal) => {
    setPing({ status: 'loading' })
    try {
      const data = await pingAdmin({ signal })
      setPing({ status: 'ok', data })
    } catch (error) {
      if (!signal?.aborted) setPing({ status: 'error', error })
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    // Fetching on mount: the state update happens after the request resolves.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    runPing(controller.signal)
    return () => controller.abort()
  }, [runPing])

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title={`Bonjour, ${firstName(user)}`}
        description="Le tableau de bord de l’agence arrive à la phase 5. L’accès administrateur est déjà en place."
      />

      <Card padding="lg" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 text-lg font-bold text-fg">
            <Activity className="size-5 text-fg-muted" aria-hidden="true" />
            API d’administration
          </h2>
          {ping.status === 'ok' && (
            <Badge tone="success" dot>
              Accessible
            </Badge>
          )}
        </div>

        {ping.status === 'loading' && (
          <div role="status" aria-busy="true" className="flex flex-col gap-2">
            <span className="sr-only">Vérification de l’API…</span>
            <Skeleton className="h-5 w-72 max-w-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        )}
        {ping.status === 'ok' && (
          <div className="flex flex-col gap-1">
            <p className="text-base text-fg">{ping.data.message}</p>
            <p className="text-sm text-fg-subtle tabular-nums">
              Réponse du serveur le{' '}
              {formatDate(ping.data.time, { dateStyle: 'long', timeStyle: 'medium' })}
            </p>
          </div>
        )}
        {ping.status === 'error' && (
          <ErrorState
            title="L’API d’administration ne répond pas"
            error={ping.error}
            onRetry={() => runPing()}
            className="border-none p-0 py-6"
          />
        )}
      </Card>

      <EmptyState
        icon={Construction}
        title="Statistiques, flotte et réservations"
        text="Ces écrans seront construits pendant la phase 5."
      />
    </div>
  )
}
