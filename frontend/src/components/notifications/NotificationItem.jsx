import { cn } from '../../lib/cn.js'
import { notificationType } from '../../lib/notifications.js'
import { formatRelativeTime } from '../../utils/format.js'

const TONES = {
  success: 'bg-success/12 text-success',
  danger: 'bg-danger/12 text-danger',
  warning: 'bg-warning/12 text-warning',
  info: 'bg-info/12 text-info',
  neutral: 'bg-raised-hover text-fg-muted',
}

/**
 * One notification (the bell's panel and the notifications page): an icon in a tinted
 * circle, the title (bold while unread, with an info dot and "Non lue" for screen
 * readers), the body, the reference and the relative time. The whole row is a button.
 */
export default function NotificationItem({ notification, onOpen }) {
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
