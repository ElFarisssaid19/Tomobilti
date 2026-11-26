import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { Bell } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useNavigate } from 'react-router'
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from '../../hooks/useNotifications.js'
import { buttonClasses } from '../ui/buttonStyles.js'
import { cn } from '../../lib/cn.js'
import { scaleIn } from '../../lib/motion.js'
import { notificationType, unreadLabel } from '../../lib/notifications.js'
import { formatNumber, formatRelativeTime } from '../../utils/format.js'
import { Button, Skeleton } from '../ui'

const TONES = {
  success: 'bg-success/12 text-success',
  danger: 'bg-danger/12 text-danger',
  warning: 'bg-warning/12 text-warning',
  info: 'bg-info/12 text-info',
  neutral: 'bg-raised-hover text-fg-muted',
}

/**
 * The bell of the signed-in user (public navbar, mobile top bar, admin topbar): the
 * unread count, refreshed every 60 seconds, and a panel with the latest
 * notifications. A click opens the related reservation and marks it read.
 *
 * The panel is anchored to the bell, kept 16px inside the viewport and capped at the
 * space left (Headless UI anchoring): its header stays visible, only the list scrolls.
 */
export default function NotificationBell({ size = 'sm', className }) {
  const { data, isPending, isError, refetch } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const navigate = useNavigate()
  const unread = data?.meta?.unread_count ?? 0
  const notifications = data?.data ?? []

  return (
    <Popover className={cn('relative', className)}>
      {({ open, close }) => (
        <>
          <PopoverButton
            aria-label={`Notifications, ${unreadLabel(unread)}`}
            className={cn(
              buttonClasses({ variant: 'secondary', size, iconOnly: true }),
              'relative',
              open && 'bg-raised-hover',
            )}
          >
            <Bell className={size === 'sm' ? 'size-4' : 'size-[1.125rem]'} aria-hidden="true" />
            {unread > 0 && (
              <span
                aria-hidden="true"
                data-testid="notification-count"
                className="absolute -top-1 -right-1 grid h-5 min-w-5 place-items-center rounded-full border border-warning/30 bg-warning px-1 text-xs font-bold text-on-lime tabular-nums"
              >
                {unread > 99 ? '99+' : formatNumber(unread)}
              </span>
            )}
          </PopoverButton>

          <AnimatePresence>
            {open && (
              <PopoverPanel
                static
                as={motion.div}
                variants={scaleIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                anchor={{ to: 'bottom end', gap: 8, padding: 16 }}
                role="dialog"
                aria-label="Notifications"
                className="z-(--z-popover) flex w-[min(24rem,calc(100vw-2rem))] origin-top-right flex-col rounded-card border border-line bg-raised shadow-pop focus-visible:outline-none data-[anchor^=top]:origin-bottom-right"
              >
                <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line py-2.5 pr-2 pl-4">
                  <h2 className="truncate text-base font-bold text-fg">Notifications</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={unread === 0}
                    className="shrink-0"
                    onClick={() => markAllRead.mutate()}
                  >
                    Tout marquer comme lu
                  </Button>
                </div>

                <div className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain p-1.5">
                  {isPending ? (
                    <div className="flex flex-col gap-1 p-1.5" aria-busy="true">
                      {[0, 1, 2].map((row) => (
                        <div key={row} className="flex gap-3 p-2">
                          <Skeleton className="size-9 shrink-0 rounded-full" />
                          <div className="flex flex-1 flex-col gap-2">
                            <Skeleton className="h-4 w-2/3" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : isError ? (
                    <div className="flex flex-col items-start gap-2 p-3">
                      <p className="text-sm text-fg-muted">
                        Impossible de charger les notifications.
                      </p>
                      <Button variant="secondary" size="sm" onClick={() => refetch()}>
                        Réessayer
                      </Button>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
                      <span className="grid size-10 place-items-center rounded-full bg-raised-hover text-fg-subtle">
                        <Bell className="size-5" aria-hidden="true" />
                      </span>
                      <p className="text-sm font-semibold text-fg">Aucune notification</p>
                    </div>
                  ) : (
                    <ul className="flex flex-col gap-0.5">
                      {notifications.map((notification) => (
                        <li key={notification.id}>
                          <NotificationItem
                            notification={notification}
                            onOpen={() => {
                              if (!notification.read_at) markRead.mutate(notification.id)
                              close()
                              if (notification.url) navigate(notification.url)
                            }}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </PopoverPanel>
            )}
          </AnimatePresence>
        </>
      )}
    </Popover>
  )
}

function NotificationItem({ notification, onOpen }) {
  const { icon: Icon, tone } = notificationType(notification.type)
  const unread = !notification.read_at

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-sm px-2.5 py-2.5 text-left transition-colors duration-150 hover:bg-raised-hover"
    >
      <span
        className={cn('mt-0.5 grid size-9 shrink-0 place-items-center rounded-full', TONES[tone])}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-baseline justify-between gap-2">
          <span
            className={cn('text-sm', unread ? 'font-bold text-fg' : 'font-semibold text-fg-muted')}
          >
            {notification.title}
          </span>
          <time
            dateTime={notification.created_at}
            className="shrink-0 text-xs text-fg-subtle tabular-nums"
          >
            {formatRelativeTime(notification.created_at)}
          </time>
        </span>
        <span className="text-sm text-fg-muted">{notification.body}</span>
        {notification.reference && (
          <span className="text-xs text-fg-subtle tabular-nums">{notification.reference}</span>
        )}
      </span>
      {unread && (
        <span className="mt-2 size-2 shrink-0 rounded-full bg-info">
          <span className="sr-only">Non lue</span>
        </span>
      )}
    </button>
  )
}
