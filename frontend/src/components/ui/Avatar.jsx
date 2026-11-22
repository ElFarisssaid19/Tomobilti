import { useState } from 'react'
import { cn } from '../../lib/cn.js'

const SIZES = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
}

/** "Salma Bennani" -> "SB". */
function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * User photo, or initials on the raised surface when there is none.
 * Decorative when next to the visible name (`decorative`), otherwise labelled.
 */
export default function Avatar({ name = '', src, size = 'md', decorative = false, className }) {
  const [failed, setFailed] = useState(false)
  const showImage = src && !failed

  return (
    <span
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : name}
      aria-hidden={decorative || undefined}
      className={cn(
        'inline-grid shrink-0 place-items-center overflow-hidden rounded-full border border-line-strong bg-raised font-bold text-fg select-none',
        SIZES[size],
        className,
      )}
    >
      {showImage ? (
        <img src={src} alt="" className="size-full object-cover" onError={() => setFailed(true)} />
      ) : (
        initials(name)
      )}
    </span>
  )
}
