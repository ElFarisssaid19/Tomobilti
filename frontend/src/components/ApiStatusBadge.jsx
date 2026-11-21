import { CircleCheck, CircleX, LoaderCircle } from 'lucide-react'
import useApiHealth from '../hooks/useApiHealth.js'

const VARIANTS = {
  loading: {
    label: 'Vérification de l’API…',
    Icon: LoaderCircle,
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
    iconClassName: 'animate-spin',
  },
  online: {
    label: 'API connectée',
    Icon: CircleCheck,
    className: 'bg-green-50 text-green-700 ring-green-200',
  },
  offline: {
    label: 'API injoignable',
    Icon: CircleX,
    className: 'bg-red-50 text-red-700 ring-red-200',
  },
}

export default function ApiStatusBadge() {
  const { status } = useApiHealth()
  const { label, Icon, className, iconClassName = '' } = VARIANTS[status]

  return (
    <span
      role="status"
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ring-inset ${className}`}
    >
      <Icon className={`size-4 ${iconClassName}`} aria-hidden="true" />
      {label}
    </span>
  )
}
