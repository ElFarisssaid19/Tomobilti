import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Badge from './Badge.jsx'
import Table from './Table.jsx'

const ROWS = [
  {
    id: 1,
    icon: 'plane',
    name: 'Marrakech Menara',
    address: 'Aéroport Marrakech Menara, comptoir 4',
    price: '450 DH',
    is_active: true,
  },
]

const onEdit = vi.fn()

const COLUMNS = [
  { key: 'icon', header: 'Icône', card: false, render: (row) => <span>icône {row.icon}</span> },
  { key: 'name', header: 'Nom', card: 'title' },
  { key: 'address', header: 'Adresse', card: 'wide', className: 'max-w-xs truncate' },
  { key: 'price', header: 'Prix', align: 'right' },
  {
    key: 'is_active',
    header: 'État',
    card: 'status',
    render: (row) => <Badge tone="success">{row.is_active ? 'Active' : 'Désactivée'}</Badge>,
  },
  {
    key: 'actions',
    header: <span className="sr-only">Actions</span>,
    render: (row) => (
      <button type="button" onClick={() => onEdit(row)}>
        Modifier {row.name}
      </button>
    ),
  },
]

let originalMatchMedia

function mockWide(isWide) {
  window.matchMedia = vi.fn((query) => ({
    matches: isWide,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
}

beforeEach(() => {
  originalMatchMedia = window.matchMedia
  onEdit.mockClear()
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
})

describe('Table', () => {
  it('is a real table from the lg breakpoint', () => {
    mockWide(true)
    render(<Table caption="Agences" columns={COLUMNS} rows={ROWS} />)

    const table = screen.getByRole('table', { name: 'Agences' })
    expect(within(table).getAllByRole('columnheader')).toHaveLength(COLUMNS.length)
    expect(within(table).getByText('icône plane')).toBeInTheDocument()
  })

  it('turns every row into a card below lg, with all its fields, status and actions', async () => {
    mockWide(false)
    const user = userEvent.setup()
    render(<Table caption="Agences" columns={COLUMNS} rows={ROWS} />)

    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    const card = within(screen.getByRole('list', { name: 'Agences' })).getByRole('listitem')

    expect(within(card).getByText('Marrakech Menara')).toBeInTheDocument()
    expect(within(card).getByText('Active')).toBeInTheDocument()
    // Every other column is a labelled field, never truncated.
    expect(within(card).getByText('Adresse')).toBeInTheDocument()
    expect(within(card).getByText('Aéroport Marrakech Menara, comptoir 4')).toBeInTheDocument()
    expect(within(card).getByText('Prix')).toBeInTheDocument()
    expect(within(card).getByText('450 DH')).toBeInTheDocument()
    // Columns hidden on cards and the status are not repeated as fields.
    expect(within(card).queryByText('icône plane')).not.toBeInTheDocument()
    expect(within(card).queryByText('État')).not.toBeInTheDocument()

    await user.click(within(card).getByRole('button', { name: 'Modifier Marrakech Menara' }))
    expect(onEdit).toHaveBeenCalledWith(ROWS[0])
  })

  it('opens the row from its card when onRowClick is set', async () => {
    mockWide(false)
    const onRowClick = vi.fn()
    const user = userEvent.setup()
    render(<Table caption="Agences" columns={COLUMNS} rows={ROWS} onRowClick={onRowClick} />)

    await user.click(screen.getByText('450 DH'))
    expect(onRowClick).toHaveBeenCalledWith(ROWS[0])
  })

  it('shows card skeletons while loading on small screens', () => {
    mockWide(false)
    render(<Table caption="Agences" columns={COLUMNS} rows={[]} loading />)

    expect(screen.getByRole('status', { name: 'Chargement : Agences' })).toBeInTheDocument()
  })
})
