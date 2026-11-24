import { CarFront } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Small 16:10 car photo for tables and lists (the 800px file, lazy-loaded), with a
 * neutral car icon when there is no photo or it fails to load.
 */
export default function CarThumb({ src, className }) {
  const [failed, setFailed] = useState(false)

  return (
    <span
      className={cn(
        'relative grid aspect-[16/10] w-16 shrink-0 place-items-center overflow-hidden rounded-sm border border-line bg-raised',
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt=""
          width="160"
          height="100"
          loading="lazy"
          onError={() => setFailed(true)}
          className="size-full object-cover"
        />
      ) : (
        <CarFront className="size-5 text-fg-subtle" aria-hidden="true" />
      )}
    </span>
  )
}
