import { LoadingRegion, Skeleton } from '../ui'

/**
 * Shown while the signed-in user is loading (route guards) or while a lazy page
 * downloads. Shaped like a page under the navbar: title, text, one large card.
 */
export function PageSkeleton({ label = 'Chargement…' }) {
  return (
    <LoadingRegion
      label={label}
      className="container-page flex flex-1 flex-col gap-6 pt-24 pb-16 md:pt-32"
    >
      <Skeleton className="h-10 w-56 rounded-input sm:h-11 sm:w-72" />
      <Skeleton className="h-5 w-full max-w-md" />
      <Skeleton className="mt-4 h-72 w-full rounded-card-lg" />
    </LoadingRegion>
  )
}

/** Same idea for the admin area: sidebar, topbar and content. */
export function AdminPageSkeleton({ label = 'Chargement de l’administration…' }) {
  return (
    <LoadingRegion label={label} className="flex min-h-dvh">
      <div className="hidden w-64 shrink-0 flex-col gap-3 border-r border-line bg-surface/60 p-4 lg:flex">
        <Skeleton className="mb-6 h-8 w-32" />
        {[1, 2, 3, 4, 5].map((item) => (
          <Skeleton key={item} className="h-11 w-full rounded-input" />
        ))}
      </div>
      <div className="flex flex-1 flex-col">
        <div className="flex h-16 items-center justify-between border-b border-line px-4 sm:px-6 lg:px-8">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="size-9 rounded-full" />
        </div>
        <div className="flex flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <Skeleton className="h-10 w-64 rounded-input" />
          <Skeleton className="h-48 w-full rounded-card-lg" />
        </div>
      </div>
    </LoadingRegion>
  )
}

/** Fallback inside a layout (e.g. a lazy admin page under the topbar). */
export function ContentSkeleton({ label = 'Chargement…' }) {
  return (
    <LoadingRegion label={label} className="flex flex-col gap-6">
      <Skeleton className="h-10 w-64 rounded-input" />
      <Skeleton className="h-48 w-full rounded-card-lg" />
    </LoadingRegion>
  )
}
