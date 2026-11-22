import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DateRangeCalendar } from './DateRangePicker.jsx'

describe('DateRangeCalendar', () => {
  beforeEach(() => {
    // Only fake Date: today is Wednesday 18 November 2026.
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 10, 18, 10, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('disables past dates and keeps today and future dates selectable', () => {
    render(<DateRangeCalendar value={undefined} onChange={() => {}} />)

    expect(screen.getByRole('button', { name: /17 novembre 2026/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /\b2 novembre 2026/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /18 novembre 2026/ })).toBeEnabled()
    expect(screen.getByRole('button', { name: /25 novembre 2026/ })).toBeEnabled()
  })

  it('disables unavailable (already booked) ranges', () => {
    render(
      <DateRangeCalendar
        value={undefined}
        onChange={() => {}}
        unavailable={[{ from: '2026-11-24', to: '2026-11-26' }]}
      />,
    )

    expect(screen.getByRole('button', { name: /24 novembre 2026/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /26 novembre 2026/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /27 novembre 2026/ })).toBeEnabled()
  })

  it('shows the number of days of the selected range in French', () => {
    render(
      <DateRangeCalendar
        value={{ from: new Date(2026, 10, 20), to: new Date(2026, 10, 23) }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByText(/^3 jours, du 20 nov\. 2026 au 23 nov\. 2026$/)).toBeInTheDocument()
  })
})
