import { CircleCheck, Clock } from 'lucide-react'
import { INVOICE_STATUS, label } from '../../lib/labels.js'
import { Badge } from '../ui'

/* Invoice status -> tone + icon (the icon means color is never the only cue). */
const STYLE = {
  paid: { tone: 'success', icon: CircleCheck },
  unpaid: { tone: 'warning', icon: Clock },
}

/** @example <InvoiceStatusBadge status="unpaid" /> // "Non payée" */
export default function InvoiceStatusBadge({ status, className }) {
  const style = STYLE[status] ?? { tone: 'neutral' }
  return (
    <Badge tone={style.tone} icon={style.icon} className={className}>
      {label(INVOICE_STATUS, status)}
    </Badge>
  )
}
