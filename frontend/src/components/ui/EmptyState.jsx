import { cn } from '../../lib/cn.js'
import Glow from './Glow.jsx'

/**
 * Empty screen as an invitation to act: icon, title, short text, one action.
 * @example
 * <EmptyState icon={CalendarX} title="Aucune réservation" text="Vos réservations apparaîtront ici."
 *   action={<Button to="/voitures">Voir les voitures</Button>} />
 */
export default function EmptyState({
  icon: Icon,
  title,
  titleAs: Title = 'h3',
  text,
  action,
  glow = true,
  className,
}) {
  return (
    <div
      className={cn(
        'relative isolate flex flex-col items-center overflow-hidden rounded-card-lg border border-line bg-surface px-6 py-14 text-center sm:py-16',
        className,
      )}
    >
      {glow && <Glow variant="empty" className="-inset-x-[10%] -top-1/3 bottom-1/3" />}
      {Icon && (
        <span className="mb-5 grid size-14 place-items-center rounded-full border border-line-strong bg-raised text-fg shadow-inner-light">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <Title className="text-xl font-bold text-fg">{title}</Title>
      {text && <p className="mt-2 max-w-sm text-base text-fg-muted">{text}</p>}
      {action && <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>}
    </div>
  )
}
