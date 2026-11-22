import { cn } from '../../lib/cn.js'
import Button from './Button.jsx'

/**
 * Lavender highlight card (dark plum text). Use at most one per screen: lavender
 * must never compete with lime.
 *
 * @example
 * <PromoCard title="−15 % dès 7 jours" text="…" actionLabel="Voir les offres" to="/voitures" icon={Tag} />
 */
export default function PromoCard({
  title,
  text,
  actionLabel,
  to,
  onAction,
  icon: Icon,
  className,
}) {
  return (
    <section
      className={cn(
        'relative isolate overflow-hidden rounded-card-lg bg-lavender p-6 text-plum sm:p-8',
        className,
      )}
    >
      {/* Illustration: concentric plum rings, decorative. */}
      <div
        aria-hidden="true"
        className="absolute -top-16 -right-16 -z-10 size-64 rounded-full border-[28px] border-plum/10"
      />
      <div
        aria-hidden="true"
        className="absolute -top-2 -right-2 -z-10 size-36 rounded-full border-[18px] border-plum/10"
      />
      <div className="flex max-w-md flex-col items-start gap-3">
        {Icon && (
          <span className="grid size-11 place-items-center rounded-full bg-plum text-lavender">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <h3 className="text-2xl font-bold">{title}</h3>
        {text && <p className="text-base font-medium text-plum/85">{text}</p>}
        {actionLabel && (
          <Button
            to={to}
            onClick={onAction}
            className="mt-2 bg-plum text-white hover:bg-plum/90 hover:shadow-none focus-visible:outline-plum"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </section>
  )
}
