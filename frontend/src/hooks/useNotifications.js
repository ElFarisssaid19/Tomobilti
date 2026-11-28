import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import useSingleFlightMutation from './useSingleFlightMutation.js'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications.js'
import { queryKeys } from '../api/queryKeys.js'

/** The bell: the latest notifications and the unread count, refreshed every 60 seconds. */
export function useNotifications({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications.latest(),
    queryFn: ({ signal }) => fetchNotifications({ signal }),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

/**
 * The notifications page: one page of one filter (`status`: all, unread, read). The
 * previous page stays on screen, dimmed, while the next one loads.
 */
export function useNotificationList(params) {
  return useQuery({
    queryKey: queryKeys.notifications.list(params),
    queryFn: ({ signal }) => fetchNotifications({ params, signal }),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })
}

/**
 * Write the change into every cached list (the bell and the page) right away, then
 * refresh them from the server.
 */
function useNotificationMutation(mutationFn, update) {
  const queryClient = useQueryClient()
  const key = queryKeys.notifications.all
  return useSingleFlightMutation({
    mutationFn,
    onMutate: (variables) => {
      queryClient.setQueriesData({ queryKey: key }, (payload) =>
        payload?.data ? update(payload, variables) : payload,
      )
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useMarkNotificationRead() {
  return useNotificationMutation(
    (id) => markNotificationRead(id),
    (payload, id) => {
      const target = payload.data.find((notification) => notification.id === id)
      // Not in this list (another page): the refresh after the request updates its count.
      if (!target || target.read_at) return payload
      return {
        ...payload,
        data: payload.data.map((notification) =>
          notification.id === id
            ? { ...notification, read_at: new Date().toISOString() }
            : notification,
        ),
        meta: { ...payload.meta, unread_count: Math.max(0, payload.meta.unread_count - 1) },
      }
    },
  )
}

export function useMarkAllNotificationsRead() {
  return useNotificationMutation(
    () => markAllNotificationsRead(),
    (payload) => ({
      ...payload,
      data: payload.data.map((notification) => ({
        ...notification,
        read_at: notification.read_at ?? new Date().toISOString(),
      })),
      meta: { ...payload.meta, unread_count: 0 },
    }),
  )
}
