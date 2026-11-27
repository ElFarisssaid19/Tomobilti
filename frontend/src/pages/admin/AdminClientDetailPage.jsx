import { CalendarX, IdCard, Mail, MapPin, Phone, UserRound } from 'lucide-react'
import { useParams } from 'react-router'
import ClientActivationButton from '../../components/admin/ClientActivationButton.jsx'
import ReservationCard from '../../components/admin/ReservationCard.jsx'
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingRegion,
  PageHeader,
  Skeleton,
  StatusBadge,
} from '../../components/ui'
import { useAdminClient } from '../../hooks/useAdmin.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { formatShortDate } from '../../lib/adminFormat.js'
import { RESERVATION_STATUS } from '../../lib/labels.js'
import { formatNumber, formatPhone, formatPrice } from '../../utils/format.js'

/** /admin/clients/:id: profile, totals, every reservation, activation. */
export default function AdminClientDetailPage() {
  const { id } = useParams()
  const { data: client, isPending, isError, error, refetch } = useAdminClient(id)
  usePageMeta(
    client ? client.name : error?.response?.status === 404 ? 'Client introuvable' : 'Client',
  )

  if (isPending) {
    return (
      <LoadingRegion label="Chargement du client…" className="flex flex-col gap-6">
        <Skeleton className="h-10 w-72 rounded-input" />
        <div className="grid gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
          <Skeleton className="h-80 rounded-card" />
          <Skeleton className="h-80 rounded-card" />
        </div>
      </LoadingRegion>
    )
  }

  if (isError) {
    if (error?.response?.status === 404) {
      return (
        <EmptyState
          icon={UserRound}
          title="Client introuvable"
          titleAs="h1"
          text="Ce compte n’existe pas ou n’est pas un compte client."
          action={<Button to="/admin/clients">Voir les clients</Button>}
        />
      )
    }
    return (
      <ErrorState
        title="Impossible de charger le client"
        titleAs="h1"
        error={error}
        onRetry={refetch}
      />
    )
  }

  const details = [
    { icon: Mail, value: client.email, href: `mailto:${client.email}` },
    client.phone && { icon: Phone, value: formatPhone(client.phone), href: `tel:${client.phone}` },
    (client.address || client.city) && {
      icon: MapPin,
      value: [client.address, client.city].filter(Boolean).join(', '),
    },
    client.cin && { icon: IdCard, value: `CIN ${client.cin}` },
    client.driving_license_number && {
      icon: IdCard,
      value: `Permis ${client.driving_license_number}${client.driving_license_issued_at ? `, obtenu le ${formatShortDate(client.driving_license_issued_at)}` : ''}`,
    },
  ].filter(Boolean)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[{ label: 'Clients', to: '/admin/clients' }, { label: client.name }]}
        title={client.name}
        description={`Client depuis le ${formatShortDate(client.created_at)}`}
        actions={<ClientActivationButton client={client} />}
      />

      {!client.is_active && (
        <Alert tone="danger" title="Compte désactivé">
          Ce client ne peut plus se connecter ni réserver.
        </Alert>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[22rem_minmax(0,1fr)]">
        <Card padding="md" className="flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <Avatar name={client.name} />
            <div className="flex flex-col gap-1">
              <span className="flex flex-wrap gap-1.5">
                {client.is_active ? (
                  <Badge tone="success" dot>
                    Actif
                  </Badge>
                ) : (
                  <Badge tone="danger" dot>
                    Désactivé
                  </Badge>
                )}
                {client.is_verified ? (
                  <Badge tone="info">E-mail vérifié</Badge>
                ) : (
                  <Badge tone="warning">E-mail non vérifié</Badge>
                )}
              </span>
              {client.age !== null && (
                <span className="text-sm text-fg-muted">{client.age} ans</span>
              )}
            </div>
          </div>
          <ul className="flex flex-col gap-2.5 text-sm text-fg-muted">
            {details.map((item) => {
              const Icon = item.icon
              const content = (
                <>
                  <Icon className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden="true" />
                  <span className="break-words">{item.value}</span>
                </>
              )
              return (
                <li key={item.value}>
                  {item.href ? (
                    <a
                      href={item.href}
                      className="touch-target relative flex items-start gap-2 hover:text-fg"
                    >
                      {content}
                    </a>
                  ) : (
                    <span className="flex items-start gap-2">{content}</span>
                  )}
                </li>
              )
            })}
          </ul>
          {!client.has_complete_profile && (
            <Alert tone="warning">Profil incomplet : le client ne peut pas encore réserver.</Alert>
          )}
          {client.has_complete_profile && !client.has_valid_license && (
            <Alert tone="warning">Permis de moins de 2 ans.</Alert>
          )}
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Total
              label="Total dépensé"
              value={formatPrice(client.total_spent)}
              hint="Locations terminées"
            />
            <Total
              label="Réservations"
              value={formatNumber(client.reservations_count)}
              hint="Tous statuts"
            />
            <Total
              label="À venir ou en cours"
              value={formatNumber(client.stats.upcoming)}
              hint="En attente, confirmées, en cours"
            />
          </div>

          <Card padding="md" className="flex flex-col gap-3">
            <h2 className="text-lg font-bold text-fg">Par statut</h2>
            <ul className="flex flex-wrap gap-x-5 gap-y-2">
              {Object.keys(RESERVATION_STATUS).map((status) => (
                <li key={status} className="flex items-center gap-2">
                  <StatusBadge status={status} />
                  <span className="text-sm font-semibold text-fg tabular-nums">
                    {client.stats.by_status[status]}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <section className="flex flex-col gap-3" aria-labelledby="client-history">
            <h2 id="client-history" className="text-lg font-bold text-fg">
              Historique des réservations
            </h2>
            {client.reservations.length === 0 ? (
              <EmptyState icon={CalendarX} title="Aucune réservation" glow={false} />
            ) : (
              <ul className="grid gap-3 xl:grid-cols-2">
                {client.reservations.map((reservation) => (
                  <li key={reservation.reference} className="min-w-0">
                    <ReservationCard reservation={reservation} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

function Total({ label, value, hint }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-line bg-surface p-5">
      <p className="text-sm font-medium text-fg-muted">{label}</p>
      <p className="text-2xl font-bold text-fg">{value}</p>
      <p className="text-xs text-fg-subtle">{hint}</p>
    </div>
  )
}
