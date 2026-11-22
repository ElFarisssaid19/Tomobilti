import { CircleCheck, CircleSlash, CircleX, Clock, Flag, KeyRound } from 'lucide-react'
import { label, RESERVATION_STATUS } from '../../lib/labels.js'
import Badge from './Badge.jsx'

/*
 * Reservation status -> tone + icon. The icon means color is never the only cue.
 */
const STATUS_STYLE = {
  pending: { tone: 'warning', icon: Clock },
  confirmed: { tone: 'info', icon: CircleCheck },
  active: { tone: 'success', icon: KeyRound },
  completed: { tone: 'neutral', icon: Flag },
  cancelled: { tone: 'neutral', icon: CircleSlash },
  rejected: { tone: 'danger', icon: CircleX },
}

/**
 * Badge for a reservation status, with the French label from labels.js.
 * @example <StatusBadge status="confirmed" /> // "Confirmée"
 */
export default function StatusBadge({ status, size = 'sm', className }) {
  const style = STATUS_STYLE[status] ?? { tone: 'neutral' }
  return (
    <Badge tone={style.tone} icon={style.icon} size={size} className={className}>
      {label(RESERVATION_STATUS, status)}
    </Badge>
  )
}
