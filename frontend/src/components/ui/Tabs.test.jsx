import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Tabs from './Tabs.jsx'

const TABS = ['Catégories', 'Marques', 'Agences', 'Options'].map((label) => ({
  label,
  content: <p>Panneau {label}</p>,
}))

/*
 * jsdom has no layout: give every tab a 100px box at 100px steps, the list a 250px
 * viewport and the row a natural width (400px by default, so it overflows).
 */
const TAB_WIDTH = 100
const VISIBLE_WIDTH = 250
let naturalWidth = 400
const isTab = (element) => element.getAttribute?.('role') === 'tab'
const isList = (element) => element.getAttribute?.('role') === 'tablist'

function tabIndexOf(element) {
  return [...element.parentElement.children].filter(isTab).indexOf(element)
}

const descriptors = {
  offsetLeft: {
    configurable: true,
    get() {
      return isTab(this) ? tabIndexOf(this) * TAB_WIDTH : 0
    },
  },
  offsetWidth: {
    configurable: true,
    get() {
      return isTab(this) ? TAB_WIDTH : 0
    },
  },
  clientWidth: {
    configurable: true,
    get() {
      return VISIBLE_WIDTH
    },
  },
  scrollWidth: {
    configurable: true,
    get() {
      return isList(this) ? naturalWidth : 0
    },
  },
}

let originals
let originalMatchMedia
let scrollTo

function mockPhone(isPhone) {
  window.matchMedia = vi.fn((query) => ({
    matches: query.includes('max-width') ? isPhone : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
}

beforeEach(() => {
  naturalWidth = 400
  originals = Object.fromEntries(
    Object.keys(descriptors).map((key) => [
      key,
      Object.getOwnPropertyDescriptor(HTMLElement.prototype, key),
    ]),
  )
  Object.defineProperties(HTMLElement.prototype, descriptors)
  scrollTo = vi.fn()
  HTMLElement.prototype.scrollTo = scrollTo
  originalMatchMedia = window.matchMedia
  mockPhone(false)
})

afterEach(() => {
  for (const [key, descriptor] of Object.entries(originals)) {
    if (descriptor) Object.defineProperty(HTMLElement.prototype, key, descriptor)
    else delete HTMLElement.prototype[key]
  }
  delete HTMLElement.prototype.scrollTo
  window.matchMedia = originalMatchMedia
})

describe('Tabs', () => {
  it('scrolls the selected tab fully into view on load, clear of the edge fade', () => {
    render(<Tabs label="Paramètres" tabs={TABS} defaultIndex={3} />)

    // Tab 4 spans 300–400px; with the 40px fade it must end at 440 inside a 250px view.
    expect(scrollTo).toHaveBeenCalledWith({ left: 190, behavior: 'auto' })
    expect(screen.getByRole('tab', { name: 'Options' })).toHaveAttribute('aria-selected', 'true')
  })

  it('scrolls again when the selection changes, and leaves a visible tab alone', async () => {
    const user = userEvent.setup()
    render(<Tabs label="Paramètres" tabs={TABS} />)
    expect(scrollTo).not.toHaveBeenCalled()

    await user.click(screen.getByRole('tab', { name: 'Agences' }))

    // Tab 3 spans 200–300px: end at 340 in a 250px view.
    expect(scrollTo).toHaveBeenLastCalledWith(expect.objectContaining({ left: 90 }))
    expect(screen.getByText('Panneau Agences')).toBeInTheDocument()
  })

  it('replaces the row with a Select on a phone when the tabs do not fit', async () => {
    mockPhone(true)
    const onChange = vi.fn()
    const user = userEvent.setup()
    render(<Tabs label="Paramètres du catalogue" tabs={TABS} onChange={onChange} />)
    await act(async () => {})

    expect(screen.queryByRole('tablist')).not.toBeInTheDocument()
    const select = screen.getByRole('button', { name: /Paramètres du catalogue/ })
    expect(select).toHaveTextContent('Catégories')

    await user.click(select)
    await user.click(within(screen.getByRole('listbox')).getByRole('option', { name: 'Options' }))

    expect(onChange).toHaveBeenCalledWith(3)
    expect(screen.getByText('Panneau Options')).toBeInTheDocument()
  })

  it('keeps the row on a phone when every tab fits', async () => {
    mockPhone(true)
    naturalWidth = 200
    render(<Tabs label="Paramètres" tabs={TABS} />)
    await act(async () => {})

    expect(screen.getByRole('tablist', { name: 'Paramètres' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Paramètres/ })).not.toBeInTheDocument()
  })
})
