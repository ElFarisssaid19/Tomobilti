import { Glow } from '../ui'
import { AUTH_PHOTOS } from './authPhotos.js'
import usePageMeta from '../../hooks/usePageMeta.js'

/**
 * Frame of the auth pages. Desktop: a tall Moroccan road photo on the left (the one
 * bold element, with a caption on a gradient) and the form on the right, left-aligned.
 * Mobile: the form alone, with the auth glow at the top edge, away from the text.
 *
 * @param {'login'|'register'|'password'|'verify'} photo
 */
export default function AuthShell({ photo = 'login', title, description, footer, children }) {
  usePageMeta(title, description)
  const image = AUTH_PHOTOS[photo]

  return (
    <section className="relative isolate flex flex-1 overflow-hidden">
      <Glow variant="auth" className="inset-x-0 -top-32 bottom-auto h-72 lg:hidden" />

      <div className="container-page grid flex-1 gap-10 pt-24 pb-16 md:pt-32 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-16 xl:gap-24">
        <div className="relative isolate hidden lg:block">
          <Glow variant="auth" className="-inset-y-[8%] right-0 -left-[18%]" />
          <figure className="relative h-full min-h-[34rem] overflow-hidden rounded-card-lg border border-line bg-surface">
            <img
              src={image.src}
              srcSet={image.srcSet}
              sizes="(min-width: 1280px) 34rem, 42vw"
              alt=""
              width={800}
              height={1000}
              decoding="async"
              className="absolute inset-0 size-full object-cover"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-linear-to-t from-canvas from-5% via-canvas/55 via-40% to-canvas/0"
            />
            <figcaption className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-8 xl:p-10">
              <p className="max-w-[18ch] text-3xl font-bold text-balance text-fg">
                {image.headline}
              </p>
              <p className="text-sm text-fg/80">{image.place}</p>
            </figcaption>
          </figure>
        </div>

        <div className="flex flex-col lg:justify-center lg:py-6">
          <div className="flex w-full max-w-md flex-col gap-8">
            <header className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold text-fg sm:text-4xl">{title}</h1>
              {description && <p className="text-base text-fg-muted sm:text-lg">{description}</p>}
            </header>
            {children}
            {footer && (
              <div className="border-t border-line pt-6 text-sm text-fg-muted">{footer}</div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
