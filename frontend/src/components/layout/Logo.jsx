import { Link } from 'react-router'
import { cn } from '../../lib/cn.js'

/**
 * Text logo: lowercase "tomobilti" with the dot of the last "i" in lime.
 * The last letter is a dotless ı (U+0131) with a lime tittle drawn on top.
 */
export default function Logo({ to = '/', size = 'md', className }) {
  return (
    <Link
      to={to}
      className={cn(
        'touch-target relative inline-flex items-baseline rounded-sm font-extrabold tracking-[-0.045em] text-fg lowercase',
        size === 'lg' ? 'text-3xl' : 'text-[1.375rem]',
        className,
      )}
    >
      <span className="sr-only">Tomobilti, accueil</span>
      <span aria-hidden="true" className="inline-flex items-baseline">
        tomobilt
        <span className="relative">
          ı
          <span className="absolute top-[0.08em] left-1/2 size-[0.24em] -translate-x-1/2 rounded-full bg-lime" />
        </span>
      </span>
    </Link>
  )
}
