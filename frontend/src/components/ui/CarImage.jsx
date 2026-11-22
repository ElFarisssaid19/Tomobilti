import { useState } from 'react'
import { carPlaceholder, getCarImage } from '../../lib/cars.js'
import { cn } from '../../lib/cn.js'

/** Card-size photos are 800 x 500 (16:10): the intrinsic size avoids layout shift. */
const PHOTO_WIDTH = 800
const PHOTO_HEIGHT = 500

/**
 * Car image with two treatments (see DESIGN.md, "Photos"):
 * - a real photo fills the media area (object-cover) with a subtle bottom gradient;
 * - an SVG placeholder sits on the dark stage with the radial highlight and a floor line.
 *
 * Photos are lazy-loaded, show a skeleton until they load, then fade in (opacity only).
 * A missing or broken image falls back to the local silhouette of the car's category.
 * Put it inside a `group` element to get the 1.05 hover zoom.
 *
 * @param {string} sizes `sizes` attribute for the 800w / 1600w srcset (cards by default)
 * @param {string} placeholderClassName padding around an SVG placeholder (photos fill the box)
 */
export default function CarImage({
  car,
  zoom = true,
  eager = false,
  sizes = '(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw',
  className,
  imgClassName,
  placeholderClassName = 'p-5',
}) {
  const image = getCarImage(car)
  const [failedSrc, setFailedSrc] = useState(null)
  const [loadedSrc, setLoadedSrc] = useState(null)
  const failed = failedSrc === image.src
  const isPhoto = image.isPhoto && !failed
  const src = failed ? carPlaceholder(car) : image.src
  const loaded = !isPhoto || loadedSrc === src

  return (
    <div className={cn('relative isolate overflow-hidden bg-raised', className)}>
      {isPhoto ? (
        !loaded && <div aria-hidden="true" className="skeleton absolute inset-0 rounded-none" />
      ) : (
        <>
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-(image:--glow-stage)" />
          <div
            aria-hidden="true"
            className="absolute inset-x-[12%] bottom-[14%] -z-10 h-px bg-linear-to-r from-transparent via-white/15 to-transparent"
          />
        </>
      )}
      <img
        src={src}
        srcSet={isPhoto ? image.srcSet : undefined}
        sizes={isPhoto && image.srcSet ? sizes : undefined}
        alt={isPhoto ? image.alt : ''}
        width={PHOTO_WIDTH}
        height={PHOTO_HEIGHT}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoadedSrc(src)}
        onError={() => setFailedSrc(image.src)}
        className={cn(
          'size-full',
          isPhoto ? 'object-cover' : cn('object-contain opacity-80', placeholderClassName),
          isPhoto && 'transition-opacity duration-250',
          isPhoto && !loaded && 'opacity-0',
          zoom &&
            'transition-[opacity,transform] duration-(--duration-zoom) ease-out motion-safe:group-hover:scale-105',
          imgClassName,
        )}
      />
      {isPhoto && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-linear-to-t from-canvas/55 to-transparent"
        />
      )}
    </div>
  )
}
