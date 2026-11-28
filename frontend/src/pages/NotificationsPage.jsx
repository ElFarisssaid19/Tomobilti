import { Bell, BellOff, CheckCheck } from 'lucide-react'
import { motion } from 'motion/react'
import { useNavigate } from 'react-router'
import NotificationItem from '../components/notifications/NotificationItem.jsx'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingRegion,
  PageHeader,
  Pagination,
  Skeleton,
  Tabs,
} from '../components/ui'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationList,
} from '../hooks/useNotifications.js'
import usePageMeta from '../hooks/usePageMeta.js'
import useUrlFilters from '../hooks/useUrlFilters.js'
import { cn } from '../lib/cn.js'
import { staggerContainer, staggerItem } from '../lib/motion.js'
import { filtersToApiParams } from '../lib/urlFilters.js'

const TABS = [
  { key: 'all', label: 'Toutes' },
  { key: 'unread', label: 'Non lues' },
  { key: 'read', label: 'Lues' },
]

/** URL of the page: `?onglet=all|unread|read&page=` (the API's `status`). */
const NOTIFICATION_FILTERS = Object.freeze({
  onglet: { type: 'enum', values: TABS.map((tab) => tab.key), default: 'all', apiKey: 'status' },
  page: { type: 'page' },
})

const EMPTY = {
  all: { icon: Bell, title: 'Aucune notification' },
  unread: { icon: CheckCheck, title: 'Tout est lu' },
  read: { icon: BellOff, title: 'Aucune notification lue' },
}

/**
 * Every notification of the signed-in user, 15 per page: /espace/notifications (under
 * "Mon espace", `h2`) and /admin/notifications (`admin`, under the admin topbar). Tabs
 * Toutes / Non lues / Lues and the page live in the URL; "Voir tout" in the bell leads here.
 */
export default function NotificationsPage({ admin = false }) {
  usePageMeta('Notifications')
  const navigate = useNavigate()
  const { filters, setFilters } = useUrlFilters(NOTIFICATION_FILTERS)
  const query = useNotificationList(filtersToApiParams(filters, NOTIFICATION_FILTERS))
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const unread = query.data?.meta?.unread_count ?? 0
  const current = TABS.findIndex((tab) => tab.key === filters.onglet)

  function open(notification) {
    if (!notification.read_at) markRead.mutate(notification.id)
    if (notification.url) navigate(notification.url)
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        titleAs={admin ? 'h1' : 'h2'}
        title="Notifications"
        actions={
          <Button
            variant="secondary"
            leftIcon={CheckCheck}
            disabled={unread === 0}
            onClick={() => markAllRead.mutate()}
          >
            Tout marquer comme lu
          </Button>
        }
      />
      <Tabs
        label="Filtrer les notifications"
        selectedIndex={current}
        onChange={(index) => setFilters({ onglet: TABS[index].key })}
        tabs={TABS.map((tab) => ({
          label: tab.label,
          count: tab.key === 'unread' ? unread : undefined,
          content:
            tab.key === filters.onglet ? (
              <NotificationList
                tab={tab.key}
                query={query}
                onOpen={open}
                onPageChange={(page) => {
                  setFilters({ page })
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
              />
            ) : null,
        }))}
      />
    </div>
  )
}

function NotificationList({ tab, query, onOpen, onPageChange }) {
  const { data, isPending, isError, error, refetch, isPlaceholderData } = query

  if (isPending) {
    return (
      <LoadingRegion label="Chargement des notifications…">
        <Card padding="none" className="flex flex-col gap-1 p-1.5">
          {[0, 1, 2, 3].map((row) => (
            <div key={row} className="flex gap-3 px-2.5 py-2.5">
              <Skeleton className="size-9 shrink-0 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          ))}
        </Card>
      </LoadingRegion>
    )
  }

  if (isError) {
    return (
      <ErrorState title="Impossible de charger les notifications" error={error} onRetry={refetch} />
    )
  }

  if (data.data.length === 0 && !isPlaceholderData) {
    const empty = EMPTY[tab]
    return <EmptyState icon={empty.icon} title={empty.title} />
  }

  return (
    <div className="flex flex-col gap-6">
      <Card padding="none" className="p-1.5">
        <motion.ul
          key={`${tab}-${data.meta.current_page}`}
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          aria-busy={isPlaceholderData || undefined}
          className={cn(
            'flex flex-col gap-0.5 transition-opacity duration-150',
            isPlaceholderData && 'opacity-60',
          )}
        >
          {data.data.map((notification) => (
            <motion.li key={notification.id} variants={staggerItem}>
              <NotificationItem notification={notification} onOpen={() => onOpen(notification)} />
            </motion.li>
          ))}
        </motion.ul>
      </Card>
      <Pagination
        page={data.meta.current_page}
        lastPage={data.meta.last_page}
        onPageChange={onPageChange}
      />
    </div>
  )
}
