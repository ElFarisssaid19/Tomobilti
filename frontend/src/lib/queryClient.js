import { QueryClient } from '@tanstack/react-query'

/** Client errors (404, 422…) will not change on a retry: only retry network and 5xx errors. */
function shouldRetry(failureCount, error) {
  const status = error?.response?.status
  if (status && status < 500) return false
  return failureCount < 2
}

/**
 * Server state cache (TanStack Query). Conventions: DESIGN.md, "Data".
 * - staleTime 60 s: catalogue data changes rarely, so pages switch instantly.
 * - no refetch on window focus: a filter screen must not reshuffle under the user.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        retry: shouldRetry,
        refetchOnWindowFocus: false,
      },
    },
  })
}
