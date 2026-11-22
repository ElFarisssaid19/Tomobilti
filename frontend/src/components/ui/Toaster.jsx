import { CircleCheck, CircleX, Info, TriangleAlert } from 'lucide-react'
import { Toaster as SonnerToaster } from 'sonner'
import Spinner from './Spinner.jsx'

/**
 * sonner toaster themed with our tokens. Toasts appear at the top (the bottom belongs
 * to the mobile nav), below the navbar so they never cover its buttons: 92px on
 * desktop (floating pill: 16px + 64px), 72px on mobile (64px top bar).
 * Mount once (RootLayout), then:
 *   import { toast } from 'sonner'
 *   toast.success('Réservation envoyée')
 *   toast.error('La réservation a échoué', { description: error.response?.data?.message })
 */
export default function Toaster() {
  return (
    <SonnerToaster
      theme="dark"
      position="top-center"
      offset={{ top: 92 }}
      mobileOffset={{ top: 72 }}
      gap={10}
      icons={{
        success: <CircleCheck className="size-5 text-success" aria-hidden="true" />,
        error: <CircleX className="size-5 text-danger" aria-hidden="true" />,
        warning: <TriangleAlert className="size-5 text-warning" aria-hidden="true" />,
        info: <Info className="size-5 text-info" aria-hidden="true" />,
        loading: <Spinner size="md" className="text-fg-muted" />,
      }}
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            'flex w-full items-start gap-3 rounded-card border border-line-strong bg-raised p-4 font-sans text-fg shadow-pop sm:w-[22rem]',
          content: 'flex flex-1 flex-col gap-0.5',
          title: 'text-sm font-semibold text-fg',
          description: 'text-sm text-fg-muted',
          icon: 'mt-px shrink-0',
          actionButton:
            'ml-auto h-8 shrink-0 rounded-full bg-lime px-3 text-xs font-semibold text-on-lime',
          cancelButton:
            'ml-auto h-8 shrink-0 rounded-full bg-raised-hover px-3 text-xs font-semibold text-fg',
          closeButton: 'text-fg-muted',
          success: 'border-success/30',
          error: 'border-danger/30',
        },
      }}
    />
  )
}
