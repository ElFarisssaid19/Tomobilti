import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react'
import { cn } from '../../lib/cn.js'

const TONES = {
  info: { icon: Info, classes: 'border-info/25 bg-info/12', iconClass: 'text-info' },
  success: {
    icon: CircleCheck,
    classes: 'border-success/25 bg-success/12',
    iconClass: 'text-success',
  },
  warning: {
    icon: TriangleAlert,
    classes: 'border-warning/25 bg-warning/12',
    iconClass: 'text-warning',
  },
  danger: { icon: CircleAlert, classes: 'border-danger/25 bg-danger/12', iconClass: 'text-danger' },
}

/**
 * Inline message inside a page or a form: a form-level error (too many attempts,
 * disabled account), a notice (email not verified) or a confirmation. Always an icon
 * plus text, never color alone. Errors are announced (`role="alert"`), other tones
 * politely (`role="status"`).
 *
 * @param {'info'|'success'|'warning'|'danger'} tone
 * @example <Alert tone="danger" title="Connexion bloquée">Réessayez dans 42 secondes.</Alert>
 * @example <Alert tone="warning" title="Adresse e-mail non vérifiée" action={<Button size="sm">Renvoyer</Button>} />
 */
export default function Alert({ tone = 'info', title, action, className, children }) {
  const { icon: Icon, classes, iconClass } = TONES[tone]

  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex flex-col gap-3 rounded-input border p-4 sm:flex-row sm:items-center',
        classes,
        className,
      )}
    >
      <div className="flex flex-1 items-start gap-3">
        <Icon className={cn('mt-0.5 size-5 shrink-0', iconClass)} aria-hidden="true" />
        <div className="flex flex-col gap-0.5">
          {title && <p className="text-sm font-semibold text-fg">{title}</p>}
          {children && <div className="text-sm text-fg-muted">{children}</div>}
        </div>
      </div>
      {action && <div className="flex shrink-0 pl-8 sm:pl-0">{action}</div>}
    </div>
  )
}
