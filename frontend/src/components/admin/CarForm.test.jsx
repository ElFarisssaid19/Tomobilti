import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { carPayload, EMPTY_CAR, normalizePlate, validateCar } from '../../lib/adminCars.js'
import CarForm from './CarForm.jsx'

const OPTIONS = {
  brands: [{ id: 1, name: 'Renault' }],
  categories: [{ id: 2, name: 'Compacte' }],
  locations: [{ id: 3, name: 'Marrakech Guéliz' }],
}

const VALID = {
  ...EMPTY_CAR,
  brand_id: '1',
  category_id: '2',
  location_id: '3',
  model: 'Clio 5',
  year: '2025',
  plate_number: '12345 a 6',
  color: 'Bleu',
  price_per_day: '330,50',
  deposit_amount: '6000',
}

describe('car form rules', () => {
  it('normalizes and checks the Moroccan plate', () => {
    expect(normalizePlate(' 12345 a 6 ')).toBe('12345-A-6')
    expect(validateCar(VALID)).toEqual({})
    expect(validateCar({ ...VALID, plate_number: 'AB-123-CD' }).plate_number).toEqual([
      'Saisissez une immatriculation marocaine valide, par exemple 12345-A-6.',
    ])
    expect(validateCar({ ...VALID, plate_number: '12345-A-90' }).plate_number).toBeDefined()
  })

  it('checks the numbers like the server', () => {
    const errors = validateCar({ ...VALID, year: '1990', seats: '12', price_per_day: '20' })
    expect(Object.keys(errors).sort()).toEqual(['price_per_day', 'seats', 'year'])
  })

  it('builds the API payload', () => {
    expect(carPayload(VALID)).toMatchObject({
      brand_id: 1,
      plate_number: '12345-A-6',
      price_per_day: '330.50',
      seats: 5,
      status: 'available',
      description: null,
    })
    expect(carPayload(VALID, { isNew: false })).not.toHaveProperty('status')
  })
})

describe('CarForm', () => {
  function renderForm(onSubmit, initialValues = EMPTY_CAR) {
    render(
      <MemoryRouter>
        <CarForm
          initialValues={initialValues}
          isNew
          options={OPTIONS}
          onSubmit={onSubmit}
          submitLabel="Ajouter la voiture"
        />
      </MemoryRouter>,
    )
  }

  it('shows the errors under the fields and does not send an invalid car', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    renderForm(onSubmit)

    await user.type(screen.getByRole('textbox', { name: /Immatriculation/ }), 'ABC')
    await user.click(screen.getByRole('button', { name: 'Ajouter la voiture' }))

    expect(await screen.findByText('Indiquez le modèle.')).toBeInTheDocument()
    expect(screen.getByText('Choisissez la marque.')).toBeInTheDocument()
    expect(
      screen.getByText('Saisissez une immatriculation marocaine valide, par exemple 12345-A-6.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /Modèle/ })).toHaveAttribute('aria-invalid', 'true')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('sends a valid car and shows server 422 errors under their field', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue({
      response: {
        status: 422,
        data: {
          message: 'Erreur',
          errors: {
            plate_number: ['Cette immatriculation est déjà utilisée par une autre voiture.'],
          },
        },
      },
    })
    renderForm(onSubmit, VALID)

    await user.click(screen.getByRole('button', { name: 'Ajouter la voiture' }))

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ plate_number: '12345-A-6', model: 'Clio 5' }),
      ),
    )
    expect(
      await screen.findByText('Cette immatriculation est déjà utilisée par une autre voiture.'),
    ).toBeInTheDocument()
  })
})
