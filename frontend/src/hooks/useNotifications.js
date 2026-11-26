import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications.js'
import { queryKeys } from '../api/queryKeys.js'

/** The bell: the latest notifications and the unread count, refreshed every 60 seconds. */
export function useNotifications({ enabled = true } = {}) {
  return useQuery({
    queryKey: queryKeys.notifications(),
    queryFn: ({ signal }) => fetchNotifications({ signal }),
    enabled,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

/** Write the change into the cached list right away, then refresh it from the server. */
function useNotificationMutation(mutationFn, update) {
  const queryClient = useQueryClient()
  const key = queryKeys.notifications()
  return useMutation({
    mutationFn,
    onMutate: (variables) => {
      queryClient.setQueryData(key, (payload) => (payload ? update(payload, variables) : payload))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}

export function useMarkNotificationRead() {
  return useNotificationMutation(
    (id) => markNotificationRead(id),
    (payload, id) => {
      const target = payload.data.find((notification) => notification.id === id)
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
