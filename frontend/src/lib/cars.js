import berline from '../assets/cars/berline.svg'
import citadine from '../assets/cars/citadine.svg'
import suv from '../assets/cars/suv.svg'
import utilitaire from '../assets/cars/utilitaire.svg'

/** Local silhouettes (placeholders and illustrations). */
export const CAR_SILHOUETTES = { citadine, berline, suv, utilitaire }

const SILHOUETTE_BY_CATEGORY = {
  suv: suv,
  utilitaire: utilitaire,
  berline: berline,
  luxe: berline,
  familiale: berline,
}

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000').replace(/\/$/, '')

/** Name of a relation that may come as an object (`{ name }`) or a plain string. */
export function relationName(value) {
  if (!value) return ''
  return typeof value === 'string' ? value : (value.name ?? '')
}

/** Category slug, from `{ slug }` or a name. */
function categorySlug(category) {
  if (!category) return ''
  if (typeof category === 'object' && category.slug) return category.slug
  return relationName(category)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

/** Silhouette used when a car has no photo, picked from its category. */
export function carPlaceholder(car) {
  return SILHOUETTE_BY_CATEGORY[categorySlug(car?.category)] ?? citadine
}

/**
 * Turn an image path into a URL. Full URLs from the API
 * (http://localhost:8000/storage/cars/...) are kept as they are; paths on the public
 * disk ("cars/placeholders/x.svg") are prefixed with `${VITE_API_URL}/storage/`.
 */
export function resolveImageUrl(path) {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/.test(path) || path.startsWith('/')) return path
  return `${API_URL}/storage/${path.replace(/^storage\//, '')}`
}

/** True when a URL points to a vector placeholder rather than a photo. */
export function isVectorImage(url) {
  return /\.svg(\?|#|$)/i.test(url ?? '') || String(url ?? '').startsWith('data:image/svg')
}

/**
 * Main image of a car, whatever shape the API resource uses:
 * `image_url`, `primary_image: { url, thumbnail_url, path, alt }` or `images: [...]`.
 * Photos come in two widths (800px `thumbnail_url` for cards, 1600px `url` for the detail
 * page); `srcSet` lets the browser pick. SVG files are placeholders, not photos.
 * @returns {{ src: string, srcSet?: string, alt: string, isPhoto: boolean, isPlaceholder: boolean }}
 */
export function getCarImage(car) {
  const name = [relationName(car?.brand), car?.model].filter(Boolean).join(' ')
  const images = Array.isArray(car?.images) ? car.images : []
  const image = car?.primary_image ?? images.find((item) => item.is_primary) ?? images[0]
  const large = resolveImageUrl(car?.image_url ?? image?.url ?? image?.path)
  const thumbnail = resolveImageUrl(car?.thumbnail_url ?? image?.thumbnail_url)

  if (!large && !thumbnail) {
    return { src: carPlaceholder(car), alt: '', isPhoto: false, isPlaceholder: true }
  }

  const src = thumbnail || large
  const isPhoto = !isVectorImage(src)
  return {
    src,
    srcSet:
      isPhoto && thumbnail && large && thumbnail !== large
        ? `${thumbnail} 800w, ${large} 1600w`
        : undefined,
    alt: isPhoto ? image?.alt || name : '',
    isPhoto,
    isPlaceholder: !isPhoto,
  }
}
