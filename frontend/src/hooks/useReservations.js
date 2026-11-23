import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../api/queryKeys.js'
import {
  cancelReservation,
  createReservation,
  fetchBookingRules,
  fetchReservation,
  fetchReservations,
  quoteReservation,
} from '../api/reservations.js'

/** The booking rules only change with a deployment: keep them 10 minutes. */
export function useBookingRules() {
  return useQuery({
    queryKey: queryKeys.bookingRules(),
    queryFn: ({ signal }) => fetchBookingRules({ signal }),
    staleTime: 10 * 60_000,
  })
}

/**
 * The server's price and availability for the current choices. Pass a debounced
 * payload (or null while it is incomplete). The previous quote stays on screen,
 * dimmed, while the next one loads.
 */
export function useReservationQuote(payload) {
  return useQuery({
    queryKey: queryKeys.reservations.quote(payload),
    queryFn: ({ signal }) => quoteReservation(payload, { signal }),
    enabled: Boolean(payload),
    placeholderData: keepPreviousData,
    staleTime: 0,
  })
}

/** "Mes réservations": one tab and page (`{ tab, page }`). */
export function useReservations(params) {
  return useQuery({
    queryKey: queryKeys.reservations.list(params),
    queryFn: ({ signal }) => fetchReservations(params, { signal }),
    placeholderData: keepPreviousData,
  })
}

export function useReservation(reference) {
  return useQuery({
    queryKey: queryKeys.reservations.detail(reference),
    queryFn: ({ signal }) => fetchReservation(reference, { signal }),
    enabled: Boolean(reference),
  })
}

/** Book a car. A new reservation changes the lists and the car's booked days. */
export function useCreateReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createReservation,
    onSuccess: ({ reservation }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.reservations.all })
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.availability(reservation.car.slug) })
    },
  })
}

/** Cancel a reservation, then refresh it, the lists and the car's booked days. */
export function useCancelReservation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ reference, reason }) => cancelReservation(reference, reason),
    onSuccess: ({ reservation }) => {
      queryClient.setQueryData(queryKeys.reservations.detail(reservation.reference), reservation)
      queryClient.invalidateQueries({ queryKey: ['reservations', 'list'] })
      queryClient.invalidateQueries({ queryKey: queryKeys.cars.availability(reservation.car.slug) })
    },
  })
}
