import { useEffect } from 'react'
import { useLocation } from 'react-router'

const SITE = 'Tomobilti'
const DEFAULT_TITLE = `${SITE}, location de voitures au Maroc`
const DEFAULT_DESCRIPTION =
  'Location de voitures à Marrakech, Casablanca et Agadir, en agence ou à l’aéroport.'
const SITE_URL = (import.meta.env.VITE_SITE_URL || window.location.origin).replace(/\/$/, '')

/** Set (or create) `<meta {attribute}="{key}" content>` in the head. */
function setMeta(attribute, key, content) {
  let meta = document.head.querySelector(`meta[${attribute}="${key}"]`)
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute(attribute, key)
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', content)
}

/**
 * French title, meta description, canonical URL and link-preview tags (Open Graph,
 * Twitter) of a page. The canonical URL is the page's path without its query string,
 * so filtered or paginated lists point to the list itself. index.html holds the
 * site-wide defaults and the preview image for crawlers that do not run JavaScript.
 *
 * @example usePageMeta('Nos voitures', 'Toutes les voitures disponibles…')
 */
export default function usePageMeta(title, description = DEFAULT_DESCRIPTION) {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE}` : DEFAULT_TITLE
    const text = typeof description === 'string' && description ? description : DEFAULT_DESCRIPTION
    const url = `${SITE_URL}${pathname}`

    document.title = fullTitle
    setMeta('name', 'description', text)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', text)
    setMeta('property', 'og:url', url)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', text)

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)
  }, [title, description, pathname])
}
