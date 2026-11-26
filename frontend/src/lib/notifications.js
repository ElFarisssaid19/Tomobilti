import {
  AlarmClock,
  Ban,
  Bell,
  CalendarPlus,
  CalendarX2,
  CircleCheck,
  CircleX,
  ReceiptText,
} from 'lucide-react'

/*
 * In-app notifications: the icon and its tone for each event type sent by the API
 * (App\Notifications\*::type()). Unknown types fall back to the bell.
 */
export const NOTIFICATION_TYPES = {
  'reservation.confirmed': { icon: CircleCheck, tone: 'success' },
  'reservation.rejected': { icon: CircleX, tone: 'danger' },
  'reservation.cancelled': { icon: Ban, tone: 'danger' },
  'reservation.reminder': { icon: AlarmClock, tone: 'info' },
  'invoice.issued': { icon: ReceiptText, tone: 'neutral' },
  'agency.reservation_requested': { icon: CalendarPlus, tone: 'warning' },
  'agency.reservation_cancelled': { icon: CalendarX2, tone: 'danger' },
}

const FALLBACK = { icon: Bell, tone: 'neutral' }

export function notificationType(type) {
  return NOTIFICATION_TYPES[type] ?? FALLBACK
}

/** "3 non lues" for the bell's accessible name. */
export function unreadLabel(count) {
  if (!count) return 'aucune non lue'
  return `${count} non lue${count > 1 ? 's' : ''}`
}
