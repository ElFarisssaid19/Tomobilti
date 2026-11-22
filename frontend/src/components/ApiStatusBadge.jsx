import { CircleCheck, CircleX } from 'lucide-react'
import useApiHealth from '../hooks/useApiHealth.js'
import { Badge, Spinner } from './ui'

const VARIANTS = {
  loading: { label: 'Vérification de l’API…', tone: 'neutral' },
  online: { label: 'API connectée', tone: 'success', icon: CircleCheck },
  offline: { label: 'API injoignable', tone: 'danger', icon: CircleX },
}

/** Development helper on the home page: GET /api/health status. */
export default function ApiStatusBadge({ className }) {
  const { status } = useApiHealth()
  const { label, tone, icon } = VARIANTS[status]

  return (
    <Badge role="status" tone={tone} icon={icon} className={className}>
      {status === 'loading' && <Spinner size="sm" className="size-3.5" />}
      {label}
    </Badge>
  )
}
