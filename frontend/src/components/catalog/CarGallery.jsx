import { Expand } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { isVectorImage } from '../../lib/cars.js'
import { cn } from '../../lib/cn.js'
import { transition } from '../../lib/motion.js'
import { CarImage } from '../ui'
import Lightbox from './Lightbox.jsx'
import PhotoCredit from './PhotoCredit.jsx'

/**
 * Detail page gallery: the main photo (1600px, 800px on small screens), thumbnails,
 * a lightbox, and under the photo the credit its license requires (author, license,
 * source). Cars without photos keep the lit stage with their silhouette.
 */
export default function CarGallery({ car }) {
  const images = (car.images ?? []).filter((image) => !isVectorImage(image.url))
  const [index, setIndex] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  if (images.length === 0) {
    return (
      <CarImage
        car={car}
        eager
        zoom={false}
        className="aspect-[16/10] rounded-card-lg border border-line"
        placeholderClassName="p-10"
      />
    )
  }

  const current = images[Math.min(index, images.length - 1)]

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setLightboxOpen(true)}
        aria-label={`Agrandir la photo ${index + 1} sur ${images.length} : ${current.alt ?? car.name}`}
        className="group relative isolate block aspect-[16/10] w-full overflow-hidden rounded-card-lg border border-line bg-raised"
      >
        <AnimatePresence initial={false}>
          <motion.img
            key={current.id}
            src={current.url}
            srcSet={`${current.thumbnail_url} 800w, ${current.url} 1600w`}
            sizes="(min-width: 1024px) 60vw, 100vw"
            alt={current.alt ?? car.name}
            width={1600}
            height={1000}
            loading={index === 0 ? 'eager' : 'lazy'}
            fetchPriority={index === 0 ? 'high' : undefined}
            decoding="async"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: transition.base }}
            exit={{ opacity: 0, transition: transition.fast }}
            className="absolute inset-0 size-full object-cover"
          />
        </AnimatePresence>
        <span className="pointer-events-none absolute right-3 bottom-3 inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-canvas/70 px-3 text-sm font-semibold text-fg backdrop-blur-md transition-colors duration-150 group-hover:bg-raised">
          <Expand className="size-4" aria-hidden="true" />
          {images.length > 1 ? `${index + 1} / ${images.length}` : 'Agrandir'}
        </span>
      </button>

      <PhotoCredit image={current} />

      {images.length > 1 && (
        <ul className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Photos de la voiture">
          {images.map((image, imageIndex) => (
            <li key={image.id}>
              <button
                type="button"
                onClick={() => setIndex(imageIndex)}
                aria-label={`Afficher la photo ${imageIndex + 1} : ${image.alt ?? car.name}`}
                aria-current={imageIndex === index ? 'true' : undefined}
                className={cn(
                  'block aspect-[16/10] w-full overflow-hidden rounded-card border-2 bg-raised transition-[border-color,opacity] duration-150',
                  imageIndex === index
                    ? 'border-lime'
                    : 'border-transparent opacity-70 hover:opacity-100',
                )}
              >
                <img
                  src={image.thumbnail_url}
                  alt=""
                  width={800}
                  height={500}
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Lightbox
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        images={images}
        index={index}
        onIndexChange={setIndex}
        title={car.name}
      />
    </div>
  )
}
