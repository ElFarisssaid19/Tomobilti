import { ExternalLink } from 'lucide-react'
import { PageHeader } from '../components/ui'
import { cn } from '../lib/cn.js'
import credits from '../data/image-credits.json'
import usePageMeta from '../hooks/usePageMeta.js'

/*
 * Photo credits, generated from the photo manifests by
 * `php artisan tomobilti:image-credits` (src/data/image-credits.json). Do not edit the
 * JSON by hand: CC BY and CC BY-SA require the author, the license and the source.
 */

const VIEW_LABELS = {
  'avant-trois-quarts': 'Vue avant trois-quarts',
  'arriere-trois-quarts': 'Vue arrière trois-quarts',
  avant: 'Vue de face',
  arriere: 'Vue arrière',
  profil: 'Vue de profil',
  interieur: 'Intérieur',
  'tableau-de-bord': 'Tableau de bord',
}

function groupByModel(photos) {
  const groups = new Map()
  for (const photo of photos) {
    const key = photo.car
    if (!groups.has(key)) groups.set(key, { model: photo.model, note: photo.note, photos: [] })
    groups.get(key).photos.push(photo)
  }
  return [...groups.values()]
}

function TextLink({ href, children }) {
  if (!href) return <span>{children}</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="link-underline inline-flex items-center gap-1 rounded-xs text-fg hover:text-fg"
    >
      {children}
      <ExternalLink className="size-3.5 text-fg-subtle" aria-hidden="true" />
      <span className="sr-only">(nouvel onglet)</span>
    </a>
  )
}

function CreditLine({ photo, label, stacked = false }) {
  return (
    <li
      className={cn(
        'flex flex-col gap-1 py-3 text-sm',
        !stacked && 'sm:flex-row sm:items-baseline sm:justify-between sm:gap-6',
      )}
    >
      <span className="font-medium text-fg">{label}</span>
      <span className={cn('flex flex-col gap-1', !stacked && 'sm:items-end sm:text-right')}>
        <span
          className={cn(
            'flex flex-wrap gap-x-4 gap-y-1 text-fg-muted',
            !stacked && 'sm:justify-end',
          )}
        >
          <span>
            Photo : <TextLink href={photo.author_url}>{photo.author}</TextLink>
          </span>
          <span>
            Licence : <TextLink href={photo.license_url}>{photo.license}</TextLink>
          </span>
          <TextLink href={photo.source_url}>{photo.source}</TextLink>
        </span>
        <span className="text-fg-subtle">
          Modifications : {photo.changes}.
          {photo.derivative_license &&
            ` Version modifiée partagée sous la même licence (${photo.derivative_license}).`}
        </span>
      </span>
    </li>
  )
}

export default function CreditsPage() {
  usePageMeta('Crédits photos', 'Auteurs, licences et sources des photos du site Tomobilti.')
  const cars = groupByModel(credits.cars)

  return (
    <div className="container-page flex flex-1 flex-col gap-12 pt-24 pb-16 md:pt-32">
      <PageHeader
        title="Crédits photos"
        description="Les photos du site et des voitures viennent de Wikimedia Commons, Unsplash et Pexels, sous licences libres. Toutes ont été recadrées, redimensionnées et converties en WebP, et certaines ont une plaque floutée : les modifications sont indiquées pour chaque photo. Les versions modifiées des photos sous licence CC BY-SA sont partagées sous la même licence."
      />

      <section aria-labelledby="credits-site" className="flex flex-col gap-4">
        <h2 id="credits-site" className="text-2xl font-bold text-fg">
          Photos du site
        </h2>
        <ul className="divide-y divide-line rounded-card border border-line bg-surface px-5">
          {credits.site.map((photo) => (
            <CreditLine key={photo.file} photo={photo} label={photo.description} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="credits-cars" className="flex flex-col gap-4">
        <h2 id="credits-cars" className="text-2xl font-bold text-fg">
          Photos des voitures
        </h2>
        <p className="max-w-2xl text-base text-fg-muted">
          Photos non contractuelles : elles montrent le modèle, pas forcément le véhicule loué.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {cars.map((group) => (
            <section
              key={group.model}
              aria-label={group.model}
              className="rounded-card border border-line bg-surface px-5 pt-4 pb-1"
            >
              <h3 className="text-lg font-semibold text-fg">{group.model}</h3>
              {group.note && <p className="mt-1 text-sm text-fg-subtle">{group.note}</p>}
              <ul className="divide-y divide-line">
                {group.photos.map((photo) => (
                  <CreditLine
                    key={photo.file}
                    photo={photo}
                    label={VIEW_LABELS[photo.view] ?? 'Photo'}
                    stacked
                  />
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
