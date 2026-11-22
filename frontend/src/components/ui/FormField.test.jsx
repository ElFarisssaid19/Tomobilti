import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import FormField from './FormField.jsx'
import { Input } from './Input.jsx'

// Exactly what the Laravel API returns on HTTP 422.
const payload = {
  message: 'Le champ adresse e-mail est obligatoire.',
  errors: { email: ['Le champ adresse e-mail est obligatoire.'] },
}

describe('FormField', () => {
  it('shows the Laravel 422 error of its field and links it to the input', () => {
    render(
      <FormField label="Adresse e-mail" name="email" errors={payload}>
        <Input name="email" type="email" />
      </FormField>,
    )

    const input = screen.getByLabelText('Adresse e-mail')
    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAccessibleDescription('Le champ adresse e-mail est obligatoire.')
  })

  it('accepts an axios error as `errors`', () => {
    const axiosError = { response: { status: 422, data: payload } }
    render(<Input label="Adresse e-mail" name="email" errors={axiosError} />)
    expect(screen.getByText('Le champ adresse e-mail est obligatoire.')).toBeInTheDocument()
  })

  it('shows no error for a field without one', () => {
    render(<Input label="Téléphone" name="phone" errors={payload} hint="Format +212…" />)
    const input = screen.getByLabelText('Téléphone')
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).toHaveAccessibleDescription('Format +212…')
  })
})
