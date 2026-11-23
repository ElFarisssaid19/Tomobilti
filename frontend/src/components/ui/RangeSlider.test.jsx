import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { formatPrice } from '../../utils/format.js'
import RangeSlider from './RangeSlider.jsx'

function Harness({ onChangeEnd, initial = [300, 800] }) {
  const [value, setValue] = useState(initial)
  return (
    <RangeSlider
      label="Prix par jour"
      min={200}
      max={2000}
      step={50}
      value={value}
      onChange={setValue}
      onChangeEnd={onChangeEnd}
      formatValue={formatPrice}
      minLabel="Prix minimum"
      maxLabel="Prix maximum"
    />
  )
}

describe('RangeSlider', () => {
  it('exposes two labelled sliders with spoken values', () => {
    render(<Harness />)

    const low = screen.getByRole('slider', { name: 'Prix minimum' })
    const high = screen.getByRole('slider', { name: 'Prix maximum' })
    expect(low).toHaveValue('300')
    expect(low).toHaveAttribute('aria-valuetext', formatPrice(300))
    expect(high).toHaveAttribute('aria-valuetext', formatPrice(800))
    expect(screen.getByRole('group', { name: 'Prix par jour' })).toBeInTheDocument()
  })

  it('never lets the minimum pass the maximum', () => {
    render(<Harness />)
    const low = screen.getByRole('slider', { name: 'Prix minimum' })
    const high = screen.getByRole('slider', { name: 'Prix maximum' })

    fireEvent.change(low, { target: { value: '1200' } })
    expect(low).toHaveValue('800')

    fireEvent.change(high, { target: { value: '250' } })
    expect(high).toHaveValue('800')
  })

  it('reports the final range once the interaction ends', () => {
    const onChangeEnd = vi.fn()
    render(<Harness onChangeEnd={onChangeEnd} />)

    fireEvent.change(screen.getByRole('slider', { name: 'Prix maximum' }), {
      target: { value: '1000' },
    })

    expect(onChangeEnd).toHaveBeenLastCalledWith([300, 1000])
    const shown = `${formatPrice(300)} – ${formatPrice(1000)}`.replace(/\s+/g, ' ')
    expect(screen.getByRole('status')).toHaveTextContent(shown)
  })
})
