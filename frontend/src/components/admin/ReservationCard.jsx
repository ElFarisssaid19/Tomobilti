import { Link } from 'react-router'
import { formatShortDateTime } from '../../lib/adminFormat.js'
import { formatPrice } from '../../utils/format.js'
import { StatusBadge } from '../ui'
import CarThumb from './CarThumb.jsx'

/** A reservation as a card (back-office lists below 768px). The whole card is the link. */
export default function ReservationCard({ reservation }) {
  return (
    <Link
      to={`/admin/reservations/${reservation.reference}`}
      className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4 transition-colors duration-150 hover:border-line-strong hover:bg-raised/40"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col">
          <span className="text-sm font-semibold text-fg tabular-nums">
            {reservation.reference}
          </span>
          <span className="truncate text-sm text-fg-muted">{reservation.client?.name}</span>
        </div>
        <StatusBadge status={reservation.status} />
      </div>
      <div className="flex items-center gap-3">
        <CarThumb src={reservation.car?.thumbnail_url} />
        <div className="flex min-w-0 flex-col text-sm">
          <span className="truncate font-medium text-fg">{reservation.car?.name}</span>
          <span className="text-fg-muted tabular-nums">
            {formatShortDateTime(reservation.start_at)} – {formatShortDateTime(reservation.end_at)}
          </span>
        </div>
        <span className="ml-auto text-sm font-semibold text-fg tabular-nums">
          {formatPrice(reservation.total)}
        </span>
      </div>
    </Link>
  )
}
