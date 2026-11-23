import { useEffect, useState } from 'react'

/**
 * The value, once it has stopped changing for `delay` ms. Used for the booking
 * quote, so typing or clicking quickly sends one request instead of ten.
 * Values are compared by their JSON, so a new object with the same content
 * does not restart the timer.
 */
export default function useDebouncedValue(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)
  const key = JSON.stringify(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer)
    // `key` stands for `value`: restart only when the content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, delay])

  return debounced
}
