import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query'
import useSingleFlightMutation from './useSingleFlightMutation.js'
import {
  changeCarStatus,
  deleteCar,
  deleteCarImage,
  deleteSetting,
  fetchAdminCar,
  fetchAdminCars,
  fetchAdminClient,
  fetchAdminClients,
  fetchAdminInvoices,
  fetchAdminReservation,
  fetchAdminReservations,
  fetchCarStatusConflicts,
  fetchDashboard,
  fetchPlanning,
  fetchSettings,
  markInvoicePaid,
  reorderCarImages,
  restoreCar,
  runReservationAction,
  saveCar,
  saveReservationNotes,
  saveSetting,
  sendInvoice,
  setClientActive,
  updateCarImage,
} from '../api/admin.js'
import { queryKeys } from '../api/queryKeys.js'

/*
 * Back-office server state (DESIGN.md, "Data"). Lists keep the previous page while
 * the next one loads; mutations refresh what they change: the item itself, its lists,
 * the dashboard, and the public catalogue when a car changes.
 */

const keys = queryKeys.admin

export function useDashboard(period) {
  return useQuery({
    queryKey: keys.dashboard(period),
    queryFn: ({ signal }) => fetchDashboard(period, { signal }),
    placeholderData: keepPreviousData,
  })
}

/* Reservations ---------------------------------------------------------------- */

export function useAdminReservations(params) {
  return useQuery({
    queryKey: keys.reservations.list(params),
    queryFn: ({ signal }) => fetchAdminReservations(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useAdminReservation(reference) {
  return useQuery({
    queryKey: keys.reservations.detail(reference),
    queryFn: ({ signal }) => fetchAdminReservation(reference, { signal }),
    enabled: Boolean(reference),
  })
}

/** Requests to answer, for the sidebar badge: refreshed every 60 seconds. */
export function usePendingCount() {
  return useQuery({
    queryKey: keys.reservations.pendingCount(),
    queryFn: ({ signal }) =>
      fetchAdminReservations({ tab: 'pending', per_page: 5 }, { signal }).then(
        (payload) => payload.meta.counts.pending,
      ),
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

function useRefreshReservation() {
  const queryClient = useQueryClient()
  return (reservation) => {
    queryClient.setQueryData(keys.reservations.detail(reservation.reference), reservation)
    queryClient.invalidateQueries({ queryKey: keys.reservations.all })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'planning'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all })
  }
}

/**
 * confirm | reject | pickUp | return | cancel, with its body when needed (`{ reason }`,
 * `{ payment_method, paid }`). Picking up issues an invoice: the invoices refresh too.
 */
export function useReservationAction() {
  const refresh = useRefreshReservation()
  const queryClient = useQueryClient()
  return useSingleFlightMutation({
    mutationFn: ({ reference, action, body }) => runReservationAction(reference, action, body),
    onSuccess: ({ reservation }) => {
      refresh(reservation)
      queryClient.invalidateQueries({ queryKey: keys.invoices.all })
    },
  })
}

export function useSaveReservationNotes() {
  const queryClient = useQueryClient()
  return useSingleFlightMutation({
    mutationFn: ({ reference, notes }) => saveReservationNotes(reference, notes),
    onSuccess: ({ reservation }) =>
      queryClient.setQueryData(keys.reservations.detail(reservation.reference), reservation),
  })
}

/* Invoices -------------------------------------------------------------------- */

export function useAdminInvoices(params) {
  return useQuery({
    queryKey: keys.invoices.list(params),
    queryFn: ({ signal }) => fetchAdminInvoices(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

/**
 * `markPaid` (with `paymentMethod`) or `send` (email it to the client again). A paid
 * invoice changes the lists, the reservation pages and the dashboard revenue.
 */
export function useInvoiceAction() {
  const queryClient = useQueryClient()
  return useSingleFlightMutation({
    mutationFn: ({ type, number, paymentMethod }) =>
      type === 'markPaid' ? markInvoicePaid(number, paymentMethod) : sendInvoice(number),
    onSuccess: (_, { type }) => {
      if (type !== 'markPaid') return
      queryClient.invalidateQueries({ queryKey: keys.invoices.all })
      queryClient.invalidateQueries({ queryKey: keys.reservations.all })
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    },
  })
}

export function usePlanning(params) {
  return useQuery({
    queryKey: keys.planning(params),
    queryFn: ({ signal }) => fetchPlanning(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

/* Cars ------------------------------------------------------------------------ */

export function useAdminCars(params) {
  return useQuery({
    queryKey: keys.cars.list(params),
    queryFn: ({ signal }) => fetchAdminCars(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useAdminCar(id) {
  return useQuery({
    queryKey: keys.cars.detail(id),
    queryFn: ({ signal }) => fetchAdminCar(id, { signal }),
    enabled: Boolean(id),
  })
}

/** A changed car changes the fleet lists, the dashboard and the public catalogue. */
function useRefreshCar() {
  const queryClient = useQueryClient()
  return (car) => {
    if (car) queryClient.setQueryData(keys.cars.detail(car.id), car)
    queryClient.invalidateQueries({ queryKey: keys.cars.all })
    queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'planning'] })
    queryClient.invalidateQueries({ queryKey: queryKeys.cars.all })
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog.filters() })
  }
}

export function useSaveCar() {
  const refresh = useRefreshCar()
  return useSingleFlightMutation({
    mutationFn: ({ id, payload }) => saveCar(id, payload),
    onSuccess: ({ car }) => refresh(car),
  })
}

export function useDeleteCar() {
  const refresh = useRefreshCar()
  return useSingleFlightMutation({ mutationFn: deleteCar, onSuccess: () => refresh() })
}

export function useRestoreCar() {
  const refresh = useRefreshCar()
  return useSingleFlightMutation({ mutationFn: restoreCar, onSuccess: ({ car }) => refresh(car) })
}

export function useCarStatusConflicts(id, enabled) {
  return useQuery({
    queryKey: keys.cars.conflicts(id),
    queryFn: ({ signal }) => fetchCarStatusConflicts(id, { signal }),
    enabled: Boolean(id) && enabled,
    staleTime: 0,
  })
}

export function useChangeCarStatus() {
  const refresh = useRefreshCar()
  return useSingleFlightMutation({
    mutationFn: ({ id, status, force }) => changeCarStatus(id, status, force),
    onSuccess: ({ car }) => refresh(car),
  })
}

/**
 * Photo actions answer with every photo of the car: write them into the cached car,
 * then refresh the lists (thumbnails) and the catalogue.
 */
export function useCarImageAction(carId) {
  const queryClient = useQueryClient()
  const refresh = useRefreshCar()
  return useSingleFlightMutation({
    mutationFn: ({ type, imageId, patch, ids }) => {
      if (type === 'update') return updateCarImage(carId, imageId, patch)
      if (type === 'reorder') return reorderCarImages(carId, ids)
      return deleteCarImage(carId, imageId)
    },
    onSuccess: ({ images }) => {
      queryClient.setQueryData(keys.cars.detail(carId), (car) => (car ? { ...car, images } : car))
      refresh()
    },
  })
}

/* Clients --------------------------------------------------------------------- */

export function useAdminClients(params) {
  return useQuery({
    queryKey: keys.clients.list(params),
    queryFn: ({ signal }) => fetchAdminClients(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useAdminClient(id) {
  return useQuery({
    queryKey: keys.clients.detail(id),
    queryFn: ({ signal }) => fetchAdminClient(id, { signal }),
    enabled: Boolean(id),
  })
}

export function useSetClientActive() {
  const queryClient = useQueryClient()
  return useSingleFlightMutation({
    mutationFn: ({ id, active }) => setClientActive(id, active),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: keys.clients.all }),
  })
}

/* Settings -------------------------------------------------------------------- */

/** categories | brands | locations | extras (also used by the car form's selects). */
export function useSettings(resource) {
  return useQuery({
    queryKey: keys.settings(resource),
    queryFn: ({ signal }) => fetchSettings(resource, { signal }),
    staleTime: 5 * 60_000,
  })
}

/** Settings feed the public catalogue too (filters, agencies, options). */
function useRefreshSettings(resource) {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: keys.settings(resource) })
    queryClient.invalidateQueries({ queryKey: queryKeys.catalog.filters() })
    queryClient.invalidateQueries({ queryKey: queryKeys.categories() })
    queryClient.invalidateQueries({ queryKey: queryKeys.locations() })
    queryClient.invalidateQueries({ queryKey: queryKeys.extras() })
  }
}

export function useSaveSetting(resource) {
  const refresh = useRefreshSettings(resource)
  return useSingleFlightMutation({
    mutationFn: ({ id, payload }) => saveSetting(resource, id, payload),
    onSuccess: refresh,
  })
}

export function useDeleteSetting(resource) {
  const refresh = useRefreshSettings(resource)
  return useSingleFlightMutation({
    mutationFn: (id) => deleteSetting(resource, id),
    onSuccess: refresh,
  })
}
