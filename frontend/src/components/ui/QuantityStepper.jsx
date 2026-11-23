import { Minus, Plus } from 'lucide-react'
import { cn } from '../../lib/cn.js'
import IconButton from './IconButton.jsx'

/**
 * − value + control for a small quantity (booking options). The buttons name the
 * action and the item ("Ajouter : Siège bébé"); the value is announced politely.
 * The minus button is disabled at `min`, the plus button at `max`.
 *
 * @example <QuantityStepper label="Siège bébé" value={1} max={2} onChange={setQuantity} />
 */
export default function QuantityStepper({
  label,
  value = 0,
  min = 0,
  max = 1,
  onChange,
  disabled = false,
  className,
}) {
  return (
    <div
      role="group"
      aria-label={`Quantité : ${label}`}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-line bg-raised p-1',
        className,
      )}
    >
      <IconButton
        icon={Minus}
        label={`Retirer : ${label}`}
        size="sm"
        variant="ghost"
        disabled={disabled || value <= min}
        onClick={() => onChange?.(Math.max(min, value - 1))}
      />
      <output
        aria-live="polite"
        className={cn(
          'w-7 text-center text-base font-bold tabular-nums',
          value > 0 ? 'text-fg' : 'text-fg-subtle',
        )}
      >
        {value}
      </output>
      <IconButton
        icon={Plus}
        label={`Ajouter : ${label}`}
        size="sm"
        variant="ghost"
        disabled={disabled || value >= max}
        onClick={() => onChange?.(Math.min(max, value + 1))}
      />
    </div>
  )
}
