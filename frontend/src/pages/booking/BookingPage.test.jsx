import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { addDays } from 'date-fns'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fetchCar,
  fetchCarAvailability,
  fetchCars,
  fetchExtras,
  fetchLocations,
} from '../../api/catalog.js'
import { fetchBookingRules, quoteReservation } from '../../api/reservations.js'
import { AuthContext } from '../../context/authContext.js'
import { BOOKING_DRAFT_KEY } from '../../hooks/useBookingDraft.js'
import { DEFAULT_BOOKING_RULES } from '../../lib/booking.js'
import { toInputDate } from '../../lib/dates.js'
import BookingPage from './BookingPage.jsx'

vi.mock('../../api/catalog.js', () => ({
  fetchCar: vi.fn(),
  fetchCarAvailability: vi.fn(),
  fetchCars: vi.fn(),
  fetchExtras: vi.fn(),
  fetchLocations: vi.fn(),
}))

vi.mock('../../api/reservations.js', () => ({
  fetchBookingRules: vi.fn(),
  quoteReservation: vi.fn(),
  createReservation: vi.fn(),
}))

const AGENCY = { slug: 'marrakech-gueliz', name: 'Marrakech Guéliz', city: 'Marrakech' }
const OTHER_AGENCY = { slug: 'agadir', name: 'Agadir Al Massira', city: 'Agadir' }

const CAR = {
  slug: 'clio',
  name: 'Renault Clio 5',
  brand: { name: 'Renault' },
  model: 'Clio 5',
  year: 2024,
  category: { name: 'Compacte', slug: 'compacte' },
  location: AGENCY,
  price_per_day: '300.00',
  deposit_amount: '5000.00',
  seats: 5,
  transmission: 'manual',
  fuel: 'diesel',
}

const GPS = {
  slug: 'gps',
  name: 'GPS',
  icon: 'navigation',
  price: '50.00',
  pricing: 'per_day',
  max_quantity: 1,
}

const FROM = toInputDate(addDays(new Date(), 10))
const TO = toInputDate(addDays(new Date(), 13))

function quote(overrides = {}) {
  return {
    available: true,
    unavailable_message: null,
    can_book: true,
    eligibility: { eligible: true, reasons: [], missing_fields: [] },
    pricing: {
      days: 3,
      price_per_day: '300.00',
      car_total: '900.00',
      extras: [],
      extras_total: '0.00',
      fees: [],
      fees_total: '0.00',
      total: '1234.00',
      deposit_amount: '5000.00',
    },
    ...overrides,
  }
}

const USER = {
  id: 7,
  name: 'Salma Bennani',
  email: 'salma@example.com',
  email_verified_at: '2026-01-01T00:00:00Z',
  phone: '+212661234567',
  cin: 'BE123456',
  driving_license_number: '12/345678',
  driving_license_issued_at: '2015-06-01',
}

function renderBooking(url) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = createMemoryRouter([{ path: '/reserver/:slug', element: <BookingPage /> }], {
    initialEntries: [url],
  })
  render(
    <AuthContext.Provider
      value={{ user: USER, status: 'authenticated', isVerified: true, setUser: vi.fn() }}
    >
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AuthContext.Provider>,
  )
  return router
}

function summary() {
  return within(screen.getByRole('complementary', { name: 'Résumé de la réservation' }))
}

describe('BookingPage', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
    fetchCar.mockResolvedValue({ car: CAR, similar: [] })
    fetchCarAvailability.mockResolvedValue({ unavailable: [] })
    fetchLocations.mockResolvedValue([AGENCY, OTHER_AGENCY])
    fetchExtras.mockResolvedValue([GPS])
    fetchBookingRules.mockResolvedValue(DEFAULT_BOOKING_RULES)
    fetchCars.mockResolvedValue({ data: [], meta: { current_page: 1, last_page: 1 } })
    quoteReservation.mockResolvedValue(quote())
  })

  it('keeps the customer on the first step until the dates are chosen', async () => {
    const user = userEvent.setup()
    renderBooking('/reserver/clio')

    expect(await screen.findByRole('heading', { name: 'Quand et où ?' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Étapes de la réservation' })).toHaveTextContent(
      'Dates et agences',
    )

    await user.click(summary().getByRole('button', { name: 'Continuer' }))

    expect(
      await screen.findByText('Choisissez vos dates de prise en charge et de restitution.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Quand et où ?' })).toBeInTheDocument()
    expect(quoteReservation).not.toHaveBeenCalled()
  })

  it('moves forward and back between the steps once a step is valid', async () => {
    const user = userEvent.setup()
    renderBooking(`/reserver/clio?start_at=${FROM}&end_at=${TO}`)

    await screen.findByRole('heading', { name: 'Quand et où ?' })
    await summary().findByText('Location, 3 jours')
    await user.click(summary().getByRole('button', { name: 'Continuer' }))

    expect(
      await screen.findByRole('heading', { name: 'Des options pour la route ?' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Étape 2 sur 4')).toBeInTheDocument()
    // The agencies shown by default are saved, so a refresh restores this step.
    expect(JSON.parse(window.sessionStorage.getItem(BOOKING_DRAFT_KEY))).toMatchObject({
      step: 1,
      pickupLocation: 'marrakech-gueliz',
      returnLocation: 'marrakech-gueliz',
    })

    await user.click(screen.getByRole('button', { name: 'Étape précédente' }))
    expect(await screen.findByRole('heading', { name: 'Quand et où ?' })).toBeInTheDocument()
  })

  it('shows the total computed by the server and never sends a price', async () => {
    renderBooking(`/reserver/clio?start_at=${FROM}&end_at=${TO}`)

    await screen.findByRole('heading', { name: 'Quand et où ?' })
    expect(await summary().findByText(/1\D?234\sDH/)).toBeInTheDocument()
    expect(quoteReservation).toHaveBeenCalledWith(
      {
        car: 'clio',
        start_at: `${FROM} 10:00`,
        end_at: `${TO} 10:00`,
        pickup_location: 'marrakech-gueliz',
        return_location: 'marrakech-gueliz',
        extras: [],
      },
      expect.anything(),
    )
  })

  it('restores the booking in progress from sessionStorage after a refresh', async () => {
    window.sessionStorage.setItem(
      BOOKING_DRAFT_KEY,
      JSON.stringify({
        slug: 'clio',
        from: FROM,
        to: TO,
        pickupTime: '09:30',
        returnTime: '18:00',
        pickupLocation: 'marrakech-gueliz',
        returnLocation: 'agadir',
        extras: { gps: 1 },
        notes: '',
        step: 1,
      }),
    )
    renderBooking('/reserver/clio')

    expect(
      await screen.findByRole('heading', { name: 'Des options pour la route ?' }),
    ).toBeInTheDocument()
    expect(await screen.findByRole('group', { name: 'Quantité : GPS' })).toHaveTextContent('1')
    expect(summary().getByText('Agadir Al Massira')).toBeInTheDocument()
    expect(summary().getByText(/09:30/)).toBeInTheDocument()
    expect(quoteReservation).toHaveBeenCalledWith(
      expect.objectContaining({
        start_at: `${FROM} 09:30`,
        return_location: 'agadir',
        extras: [{ slug: 'gps', quantity: 1 }],
      }),
      expect.anything(),
    )
  })

  it('explains when the car is taken and suggests free cars for the same dates', async () => {
    quoteReservation.mockResolvedValue(
      quote({ available: false, unavailable_message: 'Cette voiture vient d’être réservée.' }),
    )
    renderBooking(`/reserver/clio?start_at=${FROM}&end_at=${TO}`)

    expect(await screen.findByText('Cette voiture vient d’être réservée.')).toBeInTheDocument()
    expect(screen.getByText('Voiture indisponible sur ces horaires')).toBeInTheDocument()
    expect(fetchCars).toHaveBeenCalledWith(
      { category: 'compacte', start_at: FROM, end_at: TO },
      expect.anything(),
    )
  })
})
