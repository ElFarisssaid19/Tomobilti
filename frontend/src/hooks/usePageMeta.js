import { useEffect } from 'react'

const SITE = 'Tomobilti'
const DEFAULT_DESCRIPTION =
  'Location de voitures à Marrakech, Casablanca et Agadir, en agence ou à l’aéroport.'

/**
 * French page title and meta description of a public page.
 * @example usePageMeta('Nos voitures', 'Toutes les voitures disponibles…')
 */
export default function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE}, location de voitures au Maroc`
    let meta = document.head.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute(
      'content',
      typeof description === 'string' && description ? description : DEFAULT_DESCRIPTION,
    )
  }, [title, description])
}
