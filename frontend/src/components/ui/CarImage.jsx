import { useState } from 'react'
import { carPlaceholder, getCarImage } from '../../lib/cars.js'
import { cn } from '../../lib/cn.js'

/**
 * Car photo on a dark stage with a subtle radial highlight behind the car.
 * Falls back to a local silhouette when there is no image or it fails to load.
 * Put it inside a `group` element to get the 1.05 hover zoom.
 */
export default function CarImage({ car, zoom = true, eager = false, className, imgClassName }) {
  const image = getCarImage(car)
  const [failedSrc, setFailedSrc] = useState(null)
  const failed = failedSrc === image.src
  const src = failed ? carPlaceholder(car) : image.src
  const isPlaceholder = failed || image.isPlaceholder

  return (
    <div className={cn('relative isolate overflow-hidden bg-raised', className)}>
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-(image:--glow-stage)" />
      <div
        aria-hidden="true"
        className="absolute inset-x-[12%] bottom-[14%] -z-10 h-px bg-linear-to-r from-transparent via-white/15 to-transparent"
      />
      <img
        src={src}
        alt={isPlaceholder ? '' : image.alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailedSrc(image.src)}
        className={cn(
          'size-full object-contain',
          zoom &&
            'transition-transform duration-(--duration-zoom) ease-out motion-safe:group-hover:scale-105',
          isPlaceholder && 'opacity-80',
          imgClassName,
        )}
      />
    </div>
  )
}
