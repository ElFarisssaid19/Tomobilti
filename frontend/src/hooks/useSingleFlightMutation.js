import { useMutation } from '@tanstack/react-query'
import { useCallback, useRef } from 'react'

/** Same input, same key. Inputs that cannot be serialized share one key. */
function keyOf(variables) {
  try {
    return JSON.stringify(variables ?? null)
  } catch {
    return '*'
  }
}

/**
 * `useMutation` that never sends the same request twice at once: while a call is in
 * flight, `mutate` and `mutateAsync` ignore new calls with the same input (a double
 * click, Enter pressed twice). TanStack Query reports `isPending` on the next tick, so
 * a button disabled through `loading` alone still lets a quick second click through.
 * Calls with a different input (the alt text of another photo) still go out.
 *
 * An ignored `mutateAsync` call returns a promise that never settles, so the caller's
 * follow-up (toast, navigation) runs once, for the request that was sent.
 *
 * Every mutation hook of the app uses it (hooks/useAdmin.js, useReservations.js…).
 */
export default function useSingleFlightMutation(options) {
  const mutation = useMutation(options)
  const inFlight = useRef(new Set())
  const { mutateAsync: send } = mutation

  const mutateAsync = useCallback(
    (variables, callbacks) => {
      const key = keyOf(variables)
      if (inFlight.current.has(key)) return new Promise(() => {})
      inFlight.current.add(key)
      return send(variables, callbacks).finally(() => {
        inFlight.current.delete(key)
      })
    },
    [send],
  )

  const mutate = useCallback(
    (variables, callbacks) => {
      // Errors reach the `onError` callbacks; the rejected promise itself is not needed.
      mutateAsync(variables, callbacks).catch(() => {})
    },
    [mutateAsync],
  )

  return { ...mutation, mutate, mutateAsync }
}
