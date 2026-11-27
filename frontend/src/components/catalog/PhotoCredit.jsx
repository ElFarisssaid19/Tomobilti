import { ExternalLink } from 'lucide-react'
import { cn } from '../../lib/cn.js'

/** "Photo : author, licence CC BY-SA 4.0, source" with links (CC BY / BY-SA ask for it). */
export default function PhotoCredit({ image, className }) {
  if (!image?.author && !image?.license) return null

  return (
    <p className={cn('text-xs text-fg-subtle', className)}>
      Photo : {image.author ?? 'auteur inconnu'}
      {image.license && (
        <>
          , licence <CreditLink href={image.license_url}>{image.license}</CreditLink>
        </>
      )}
      {image.source_url && (
        <>
          , <CreditLink href={image.source_url}>source</CreditLink>
        </>
      )}
      . Photo non contractuelle.
    </p>
  )
}

function CreditLink({ href, children }) {
  if (!href) return children
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="link-underline touch-target inline-flex items-center gap-0.5 rounded-xs text-fg-muted hover:text-fg"
    >
      {children}
      <ExternalLink className="size-3" aria-hidden="true" />
      <span className="sr-only">(nouvel onglet)</span>
    </a>
  )
}
