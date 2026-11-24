import { CircleCheck, CircleOff, Wrench } from 'lucide-react'
import { CAR_STATUS, label } from '../../lib/labels.js'
import { Badge } from '../ui'

/* Car status -> tone + icon (the icon means color is never the only cue). */
const STYLE = {
  available: { tone: 'success', icon: CircleCheck },
  maintenance: { tone: 'warning', icon: Wrench },
  out_of_service: { tone: 'danger', icon: CircleOff },
}

/** @example <CarStatusBadge status="maintenance" /> // "En maintenance" */
export default function CarStatusBadge({ status, className }) {
  const style = STYLE[status] ?? { tone: 'neutral' }
  return (
    <Badge tone={style.tone} icon={style.icon} className={className}>
      {label(CAR_STATUS, status)}
    </Badge>
  )
}
