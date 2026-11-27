import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import useSingleFlightMutation from './useSingleFlightMutation.js'

function setup(mutationFn) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  const wrapper = ({ children }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return renderHook(() => useSingleFlightMutation({ mutationFn }), { wrapper })
}

/** A request that stays pending until `resolve` is called. */
function deferredRequest() {
  let resolve
  const mutationFn = vi.fn(
    () =>
      new Promise((done) => {
        resolve = done
      }),
  )
  return { mutationFn, resolve: (value) => resolve(value) }
}

describe('useSingleFlightMutation', () => {
  it('sends a double click once and runs the success callback once', async () => {
    const request = deferredRequest()
    const { result } = setup(request.mutationFn)
    const onSuccess = vi.fn()

    await act(async () => {
      // Both calls happen before React re-renders with isPending (a double click).
      result.current.mutate({ car: 'clio' }, { onSuccess })
      result.current.mutate({ car: 'clio' }, { onSuccess })
    })
    await waitFor(() => expect(request.mutationFn).toHaveBeenCalled())
    expect(request.mutationFn).toHaveBeenCalledTimes(1)

    await act(async () => request.resolve({ reference: 'TMB-1' }))
    await waitFor(() => expect(onSuccess).toHaveBeenCalledTimes(1))
  })

  it('lets a call with another input through', async () => {
    const request = deferredRequest()
    const { result } = setup(request.mutationFn)

    await act(async () => {
      result.current.mutate({ imageId: 1, alt: 'Avant' })
      result.current.mutate({ imageId: 2, alt: 'Arrière' })
    })

    await waitFor(() => expect(request.mutationFn).toHaveBeenCalledTimes(2))
  })

  it('sends the same input again once the first request has settled', async () => {
    const mutationFn = vi.fn().mockRejectedValueOnce(new Error('Réseau')).mockResolvedValue('ok')
    const { result } = setup(mutationFn)

    await act(async () => {
      await result.current.mutateAsync('confirm').catch(() => {})
    })
    await act(async () => {
      await result.current.mutateAsync('confirm')
    })

    expect(mutationFn).toHaveBeenCalledTimes(2)
  })
})
