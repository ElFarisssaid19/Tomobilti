import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { Chip, ChipGroup } from './Chip.jsx'

function SingleSelect({ onChange }) {
  const [value, setValue] = useState('all')
  return (
    <ChipGroup
      label="Catégorie"
      value={value}
      onChange={(next) => {
        setValue(next)
        onChange(next)
      }}
    >
      <Chip value="all">Toutes</Chip>
      <Chip value="suv">SUV</Chip>
      <Chip value="luxe" disabled>
        Luxe
      </Chip>
    </ChipGroup>
  )
}

describe('ChipGroup', () => {
  it('selects one chip at a time in single mode', async () => {
    const onChange = vi.fn()
    render(<SingleSelect onChange={onChange} />)

    const all = screen.getByRole('button', { name: 'Toutes' })
    const suv = screen.getByRole('button', { name: 'SUV' })
    expect(all).toHaveAttribute('aria-pressed', 'true')
    expect(suv).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(suv)

    expect(onChange).toHaveBeenCalledWith('suv')
    expect(suv).toHaveAttribute('aria-pressed', 'true')
    expect(all).toHaveAttribute('aria-pressed', 'false')
  })

  it('ignores disabled chips', async () => {
    const onChange = vi.fn()
    render(<SingleSelect onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Luxe' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  it('toggles several chips in multiple mode (uncontrolled)', async () => {
    const onChange = vi.fn()
    render(
      <ChipGroup label="Carburant" multiple defaultValue={['diesel']} onChange={onChange}>
        <Chip value="diesel">Diesel</Chip>
        <Chip value="hybrid">Hybride</Chip>
      </ChipGroup>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Hybride' }))
    expect(onChange).toHaveBeenLastCalledWith(['diesel', 'hybrid'])

    await userEvent.click(screen.getByRole('button', { name: 'Diesel' }))
    expect(onChange).toHaveBeenLastCalledWith(['hybrid'])
    expect(screen.getByRole('button', { name: 'Diesel' })).toHaveAttribute('aria-pressed', 'false')
    expect(screen.getByRole('button', { name: 'Hybride' })).toHaveAttribute('aria-pressed', 'true')
  })
})
