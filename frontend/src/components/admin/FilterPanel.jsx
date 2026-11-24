import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import useMediaQuery from '../../hooks/useMediaQuery.js'
import { BottomSheet, Button } from '../ui'

/**
 * Filters of a back-office list: a wrapping row from 768px, a "Filtres" button that
 * opens a bottom sheet below (with the number of active filters). Every control
 * writes to the URL directly, so there is nothing to apply.
 */
export default function FilterPanel({ activeCount = 0, onReset, children }) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [open, setOpen] = useState(false)

  if (isDesktop) {
    return (
      <div className="flex flex-wrap items-end gap-3">
        {children}
        {activeCount > 0 && (
          <Button variant="ghost" onClick={onReset} className="h-12">
            Effacer les filtres
          </Button>
        )}
      </div>
    )
  }

  return (
    <>
      <Button variant="secondary" leftIcon={SlidersHorizontal} onClick={() => setOpen(true)}>
        Filtres{activeCount > 0 ? ` (${activeCount})` : ''}
      </Button>
      <BottomSheet
        open={open}
        onClose={() => setOpen(false)}
        title="Filtres"
        footer={
          <div className="flex gap-2">
            {activeCount > 0 && (
              <Button variant="ghost" onClick={onReset}>
                Effacer
              </Button>
            )}
            <Button className="flex-1" onClick={() => setOpen(false)}>
              Voir les résultats
            </Button>
          </div>
        }
      >
        <div className="flex flex-col gap-4">{children}</div>
      </BottomSheet>
    </>
  )
}
