import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import useDebouncedValue from '../../hooks/useDebouncedValue.js'
import { IconButton, Input } from '../ui'

/**
 * Search box of a back-office list: typing updates the URL 350 ms after the last key
 * (replacing the history entry, so Back does not replay every letter).
 */
export default function SearchField({ value, onChange, label, placeholder, className }) {
  const [text, setText] = useState(value)
  const debounced = useDebouncedValue(text, 350)

  // The URL changed from elsewhere (reset, back button): show it.
  const [lastValue, setLastValue] = useState(value)
  if (value !== lastValue) {
    setLastValue(value)
    setText(value)
  }

  useEffect(() => {
    if (debounced.trim() !== value) onChange(debounced.trim())
    // Only the debounced text triggers a change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  return (
    <Input
      type="search"
      leftIcon={Search}
      aria-label={label}
      placeholder={placeholder}
      value={text}
      onChange={(event) => setText(event.target.value)}
      className={className}
      trailing={
        text ? (
          <IconButton
            icon={X}
            label="Effacer la recherche"
            variant="ghost"
            size="sm"
            onClick={() => setText('')}
          />
        ) : null
      }
    />
  )
}
