import { useEffect, useId, useRef } from 'react'
import { cn } from '../../lib/cn.js'

/**
 * Dual-range slider (a minimum and a maximum on one track), e.g. a price range.
 * Built on two native `<input type="range">`, so arrows, Page Up / Page Down, Home /
 * End and screen readers work out of the box; each thumb has its own label and a
 * spoken value (`formatValue`). The minimum can never pass the maximum.
 *
 * `onChange` follows the drag (update the visible values); `onChangeEnd` fires once
 * the thumb is released or a key is pressed (run the search then).
 *
 * @param {[number, number]} value
 * @example
 * <RangeSlider label="Prix par jour" min={200} max={2000} step={50} value={range}
 *   onChange={setRange} onChangeEnd={applyRange} formatValue={formatPrice} />
 */
export default function RangeSlider({
  label,
  min,
  max,
  step = 1,
  value,
  onChange,
  onChangeEnd,
  formatValue = String,
  minLabel = 'Minimum',
  maxLabel = 'Maximum',
  disabled = false,
  className,
}) {
  const id = useId()
  const lowRef = useRef(null)
  const highRef = useRef(null)
  const [low, high] = value
  const span = max - min || 1
  const lowPercent = ((low - min) / span) * 100
  const highPercent = ((high - min) / span) * 100

  // The native "change" event marks the end of an interaction (release, key press).
  useEffect(() => {
    const inputs = [lowRef.current, highRef.current]
    const handleCommit = () => {
      const next = [Number(lowRef.current.value), Number(highRef.current.value)]
      onChangeEnd?.([Math.min(next[0], next[1]), Math.max(next[0], next[1])])
    }
    inputs.forEach((input) => input.addEventListener('change', handleCommit))
    return () => inputs.forEach((input) => input.removeEventListener('change', handleCommit))
  }, [onChangeEnd])

  function handleLow(event) {
    onChange?.([Math.min(Number(event.target.value), high), high])
  }

  function handleHigh(event) {
    onChange?.([low, Math.max(Number(event.target.value), low)])
  }

  return (
    <div
      role="group"
      aria-labelledby={label ? `${id}-label` : undefined}
      className={cn('flex flex-col gap-3', className)}
    >
      {label && (
        <div className="flex items-baseline justify-between gap-3">
          <span id={`${id}-label`} className="text-sm font-semibold text-fg">
            {label}
          </span>
          <output
            htmlFor={`${id}-low ${id}-high`}
            aria-live="polite"
            className="text-sm font-semibold text-fg tabular-nums"
          >
            {formatValue(low)} – {formatValue(high)}
          </output>
        </div>
      )}
      <div className="relative h-6">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-raised"
        />
        <div
          aria-hidden="true"
          className={cn(
            'absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full',
            disabled ? 'bg-fg-disabled' : 'bg-lime',
          )}
          style={{ left: `${lowPercent}%`, right: `${100 - highPercent}%` }}
        />
        <input
          ref={lowRef}
          id={`${id}-low`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={low}
          onChange={handleLow}
          disabled={disabled}
          aria-label={minLabel}
          aria-valuetext={formatValue(low)}
          // When both thumbs meet on the right, the minimum must stay reachable.
          className={cn('tmb-range-input', lowPercent > 50 && 'z-(--z-raised)')}
        />
        <input
          ref={highRef}
          id={`${id}-high`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={high}
          onChange={handleHigh}
          disabled={disabled}
          aria-label={maxLabel}
          aria-valuetext={formatValue(high)}
          className="tmb-range-input"
        />
      </div>
      <div aria-hidden="true" className="flex justify-between text-xs text-fg-subtle tabular-nums">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  )
}
