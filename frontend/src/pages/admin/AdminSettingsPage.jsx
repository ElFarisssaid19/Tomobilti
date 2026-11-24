import ApiIcon from '../../components/admin/ApiIcon.jsx'
import SettingsPanel from '../../components/admin/SettingsPanel.jsx'
import { Badge, PageHeader, Tabs } from '../../components/ui'
import usePageMeta from '../../hooks/usePageMeta.js'
import useUrlFilters from '../../hooks/useUrlFilters.js'
import { EXTRA_PRICING, label, LOCATION_TYPE, toOptions } from '../../lib/labels.js'
import { formatNumber, formatPrice } from '../../utils/format.js'

function IconCell({ name }) {
  return (
    <span className="grid size-8 place-items-center rounded-full border border-line bg-raised text-fg">
      <ApiIcon name={name} className="size-4" />
    </span>
  )
}

function ActiveBadge({ active }) {
  return active ? (
    <Badge tone="success" dot>
      Active
    </Badge>
  ) : (
    <Badge tone="neutral" dot>
      Désactivée
    </Badge>
  )
}

const PANELS = [
  {
    key: 'categories',
    label: 'Catégories',
    config: {
      resource: 'categories',
      title: 'Catégories',
      singular: 'la catégorie',
      addLabel: 'Ajouter une catégorie',
      emptyText: 'Aucune catégorie',
      description: 'Les familles de voitures du catalogue, dans l’ordre d’affichage.',
      deleteHint: 'Une catégorie utilisée par une voiture ne peut pas être supprimée.',
      columns: [
        { key: 'icon', header: 'Icône', render: (item) => <IconCell name={item.icon} /> },
        {
          key: 'name',
          header: 'Nom',
          render: (item) => <span className="font-semibold">{item.name}</span>,
        },
        {
          key: 'description',
          header: 'Description',
          className: 'max-w-xs truncate',
          render: (item) => <span className="text-fg-muted">{item.description}</span>,
        },
        {
          key: 'sort_order',
          header: 'Ordre',
          align: 'right',
          render: (item) => <span className="tabular-nums">{item.sort_order}</span>,
        },
        {
          key: 'cars_count',
          header: 'Voitures',
          align: 'right',
          render: (item) => <span className="tabular-nums">{formatNumber(item.cars_count)}</span>,
        },
      ],
      fields: [
        { name: 'name', label: 'Nom', required: true },
        { name: 'icon', label: 'Icône', type: 'icon' },
        { name: 'sort_order', label: 'Ordre d’affichage', type: 'number', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
      empty: { name: '', icon: '', sort_order: '0', description: '' },
      toForm: (item) => ({
        name: item.name,
        icon: item.icon ?? '',
        sort_order: String(item.sort_order),
        description: item.description ?? '',
      }),
      toPayload: (values) => ({
        ...values,
        icon: values.icon || null,
        sort_order: Number(values.sort_order),
        description: values.description || null,
      }),
    },
  },
  {
    key: 'brands',
    label: 'Marques',
    config: {
      resource: 'brands',
      title: 'Marques',
      singular: 'la marque',
      addLabel: 'Ajouter une marque',
      emptyText: 'Aucune marque',
      description: 'Les constructeurs proposés dans la fiche d’une voiture.',
      deleteHint: 'Une marque utilisée par une voiture ne peut pas être supprimée.',
      columns: [
        {
          key: 'name',
          header: 'Nom',
          render: (item) => <span className="font-semibold">{item.name}</span>,
        },
        {
          key: 'cars_count',
          header: 'Voitures',
          align: 'right',
          render: (item) => <span className="tabular-nums">{formatNumber(item.cars_count)}</span>,
        },
      ],
      fields: [{ name: 'name', label: 'Nom', required: true, wide: true }],
      empty: { name: '' },
      toForm: (item) => ({ name: item.name }),
      toPayload: (values) => values,
    },
  },
  {
    key: 'locations',
    label: 'Agences',
    config: {
      resource: 'locations',
      title: 'Agences',
      singular: 'l’agence',
      addLabel: 'Ajouter une agence',
      emptyText: 'Aucune agence',
      description:
        'Les points de départ et de retour. Une agence désactivée disparaît de la réservation en ligne.',
      deleteHint:
        'Une agence utilisée par des voitures ou des réservations ne peut pas être supprimée : désactivez-la plutôt.',
      columns: [
        {
          key: 'name',
          header: 'Nom',
          render: (item) => (
            <span className="flex flex-col">
              <span className="font-semibold">{item.name}</span>
              <span className="text-xs text-fg-subtle">{item.address}</span>
            </span>
          ),
        },
        { key: 'type', header: 'Type', render: (item) => label(LOCATION_TYPE, item.type) },
        { key: 'city', header: 'Ville' },
        {
          key: 'phone',
          header: 'Téléphone',
          render: (item) => <span className="tabular-nums">{item.phone ?? '—'}</span>,
        },
        {
          key: 'opening_hours',
          header: 'Horaires',
          render: (item) => <span className="text-fg-muted">{item.opening_hours}</span>,
        },
        {
          key: 'cars_count',
          header: 'Voitures',
          align: 'right',
          render: (item) => <span className="tabular-nums">{formatNumber(item.cars_count)}</span>,
        },
        {
          key: 'is_active',
          header: 'État',
          render: (item) => <ActiveBadge active={item.is_active} />,
        },
      ],
      fields: [
        { name: 'name', label: 'Nom', required: true },
        {
          name: 'type',
          label: 'Type',
          type: 'select',
          options: toOptions(LOCATION_TYPE),
          required: true,
        },
        { name: 'city', label: 'Ville', required: true },
        {
          name: 'phone',
          label: 'Téléphone',
          hint: 'Par exemple 05 24 00 01 02.',
          inputMode: 'tel',
        },
        { name: 'address', label: 'Adresse', required: true, wide: true },
        {
          name: 'opening_hours',
          label: 'Horaires',
          hint: 'Par exemple « Lun – Sam, 08:30 – 19:30 ».',
          wide: true,
        },
        {
          name: 'is_active',
          label: 'Agence active',
          type: 'switch',
          hint: 'Proposée dans la réservation en ligne.',
        },
      ],
      empty: {
        name: '',
        type: 'agency',
        city: '',
        phone: '',
        address: '',
        opening_hours: '',
        is_active: true,
      },
      toForm: (item) => ({
        name: item.name,
        type: item.type,
        city: item.city,
        phone: item.phone ?? '',
        address: item.address,
        opening_hours: item.opening_hours ?? '',
        is_active: item.is_active,
      }),
      toPayload: (values) => ({
        ...values,
        phone: values.phone || null,
        opening_hours: values.opening_hours || null,
      }),
    },
  },
  {
    key: 'extras',
    label: 'Options',
    config: {
      resource: 'extras',
      title: 'Options',
      singular: 'l’option',
      addLabel: 'Ajouter une option',
      emptyText: 'Aucune option',
      description:
        'Les options proposées pendant la réservation. Un nouveau prix ne change pas les réservations existantes.',
      deleteHint: 'Une option déjà réservée ne peut pas être supprimée : désactivez-la plutôt.',
      columns: [
        { key: 'icon', header: 'Icône', render: (item) => <IconCell name={item.icon} /> },
        {
          key: 'name',
          header: 'Nom',
          render: (item) => <span className="font-semibold">{item.name}</span>,
        },
        {
          key: 'price',
          header: 'Prix',
          align: 'right',
          render: (item) => <span className="tabular-nums">{formatPrice(item.price)}</span>,
        },
        {
          key: 'pricing',
          header: 'Tarification',
          render: (item) => label(EXTRA_PRICING, item.pricing),
        },
        {
          key: 'max_quantity',
          header: 'Quantité max.',
          align: 'right',
          render: (item) => <span className="tabular-nums">{item.max_quantity}</span>,
        },
        {
          key: 'reservations_count',
          header: 'Réservations',
          align: 'right',
          render: (item) => (
            <span className="tabular-nums">{formatNumber(item.reservations_count)}</span>
          ),
        },
        {
          key: 'is_active',
          header: 'État',
          render: (item) => <ActiveBadge active={item.is_active} />,
        },
      ],
      fields: [
        { name: 'name', label: 'Nom', required: true },
        { name: 'icon', label: 'Icône', type: 'icon' },
        { name: 'price', label: 'Prix', required: true, inputMode: 'decimal', suffix: 'DH' },
        {
          name: 'pricing',
          label: 'Tarification',
          type: 'select',
          options: toOptions(EXTRA_PRICING),
          required: true,
        },
        { name: 'max_quantity', label: 'Quantité maximum', type: 'number', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
        {
          name: 'is_active',
          label: 'Option active',
          type: 'switch',
          hint: 'Proposée dans la réservation en ligne.',
        },
      ],
      empty: {
        name: '',
        icon: '',
        price: '',
        pricing: 'per_day',
        max_quantity: '1',
        description: '',
        is_active: true,
      },
      toForm: (item) => ({
        name: item.name,
        icon: item.icon ?? '',
        price: item.price,
        pricing: item.pricing,
        max_quantity: String(item.max_quantity),
        description: item.description ?? '',
        is_active: item.is_active,
      }),
      toPayload: (values) => ({
        ...values,
        icon: values.icon || null,
        price: String(values.price).replace(',', '.'),
        max_quantity: Number(values.max_quantity),
        description: values.description || null,
      }),
    },
  },
]

const FILTERS = {
  onglet: { type: 'enum', values: PANELS.map((panel) => panel.key), default: 'categories' },
}

/** /admin/parametres: categories, brands, agencies and options. */
export default function AdminSettingsPage() {
  usePageMeta('Paramètres')
  const { filters, setFilters } = useUrlFilters(FILTERS)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Paramètres"
        description="Le catalogue : catégories, marques, agences et options."
      />
      <Tabs
        label="Paramètres du catalogue"
        selectedIndex={PANELS.findIndex((panel) => panel.key === filters.onglet)}
        onChange={(index) => setFilters({ onglet: PANELS[index].key })}
        tabs={PANELS.map((panel) => ({
          label: panel.label,
          content: <SettingsPanel config={panel.config} />,
        }))}
      />
    </div>
  )
}
