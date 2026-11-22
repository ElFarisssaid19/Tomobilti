import {
  CalendarCheck,
  CalendarX,
  CarFront,
  Ellipsis,
  Filter,
  Heart,
  Pencil,
  SlidersHorizontal,
  Tag,
  Trash2,
  Users,
  Wallet,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  Accordion,
  Avatar,
  Breadcrumbs,
  Button,
  Card,
  CarCard,
  CarCardSkeleton,
  CarListItem,
  CarListItemSkeleton,
  Checkbox,
  Chip,
  ChipGroup,
  ConfirmDialog,
  Drawer,
  DropdownMenu,
  EmptyState,
  ErrorState,
  IconButton,
  Input,
  LoadingRegion,
  Modal,
  PageHeader,
  Pagination,
  PromoCard,
  SectionHeading,
  Skeleton,
  SkeletonText,
  Spinner,
  StatCard,
  StatusBadge,
  Stepper,
  Switch,
  Table,
  Tabs,
  Tooltip,
} from '../../components/ui'
import { relationName } from '../../lib/cars.js'
import { revealOnView, spring, staggerItem } from '../../lib/motion.js'
import { formatDate, formatPrice } from '../../utils/format.js'
import { BROKEN_IMAGE_CAR, DEMO_CARS, DEMO_RESERVATIONS } from './demoData.js'
import { DemoGroup, DemoPanel, DemoSection, Specimen } from './parts.jsx'

const SHORT = { day: 'numeric', month: 'short' }
const period = (r) =>
  `${formatDate(r.start_at, SHORT)} – ${formatDate(r.end_at, { ...SHORT, year: 'numeric' })}`

function CarGridDemo() {
  const [category, setCategory] = useState('all')
  const [favorites, setFavorites] = useState([4])
  const [loading, setLoading] = useState(false)
  const cars = DEMO_CARS.filter((car) => category === 'all' || car.category.slug === category)

  function toggleFavorite(car) {
    setFavorites((ids) =>
      ids.includes(car.id) ? ids.filter((id) => id !== car.id) : [...ids, car.id],
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <ChipGroup label="Catégorie" value={category} onChange={setCategory} className="min-w-0">
          <Chip value="all">Toutes</Chip>
          <Chip value="economique">Économique</Chip>
          <Chip value="compacte">Compacte</Chip>
          <Chip value="berline">Berline</Chip>
          <Chip value="suv">SUV</Chip>
          <Chip value="utilitaire">Utilitaire</Chip>
        </ChipGroup>
        <Switch
          label="Chargement"
          checked={loading}
          onChange={setLoading}
          className="shrink-0 justify-start gap-3"
        />
      </div>
      {loading ? (
        <LoadingRegion
          label="Chargement des voitures…"
          className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          {Array.from({ length: 3 }, (_, i) => (
            <CarCardSkeleton key={i} />
          ))}
        </LoadingRegion>
      ) : (
        <motion.ul {...revealOnView} className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {cars.map((car, index) => (
              <motion.li
                key={car.id}
                layout
                variants={staggerItem}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={spring}
              >
                <CarCard
                  car={car}
                  to={`/voitures/${car.slug}`}
                  isFavorite={favorites.includes(car.id)}
                  onToggleFavorite={toggleFavorite}
                  eager={index < 3}
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      )}
    </div>
  )
}

function OverlaysDemo() {
  const [modal, setModal] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [drawer, setDrawer] = useState(false)
  const [sheet, setSheet] = useState(false)

  function cancelReservation() {
    setCancelling(true)
    window.setTimeout(() => {
      setCancelling(false)
      setConfirm(false)
      toast.success('Réservation annulée', { description: 'TMB-2026-000128' })
    }, 1200)
  }

  return (
    <DemoPanel className="flex flex-wrap items-center gap-3">
      <Button variant="secondary" onClick={() => setModal(true)}>
        Ouvrir la modale
      </Button>
      <Button variant="danger" leftIcon={Trash2} onClick={() => setConfirm(true)}>
        Annuler une réservation
      </Button>
      <Button variant="secondary" leftIcon={SlidersHorizontal} onClick={() => setDrawer(true)}>
        Tiroir latéral
      </Button>
      <Button variant="secondary" leftIcon={Filter} onClick={() => setSheet(true)}>
        Filtres (bottom sheet)
      </Button>
      <DropdownMenu
        trigger={<IconButton icon={Ellipsis} label="Actions de la réservation" />}
        items={[
          { label: 'Modifier', icon: Pencil, onClick: () => toast('Modifier') },
          { label: 'Voir la voiture', icon: CarFront, to: '/voitures' },
          { label: 'Indisponible', icon: Tag, disabled: true },
          { divider: true },
          { label: 'Supprimer', icon: Trash2, danger: true, onClick: () => setConfirm(true) },
        ]}
      />
      <Tooltip content="Ajouter aux favoris">
        <IconButton icon={Heart} label="Ajouter aux favoris" />
      </Tooltip>
      <Tooltip content="Infobulle en bas" side="bottom">
        <Button variant="ghost">Survolez-moi</Button>
      </Tooltip>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Modifier les dates"
        description="Les nouvelles dates sont vérifiées avant d’être enregistrées."
        footer={
          <>
            <Button variant="ghost" onClick={() => setModal(false)}>
              Retour
            </Button>
            <Button onClick={() => setModal(false)}>Enregistrer les dates</Button>
          </>
        }
      >
        <Input
          label="Remarque pour l’agence"
          name="note"
          placeholder="Vol AT 805, arrivée 14 h 30"
        />
      </Modal>

      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={cancelReservation}
        loading={cancelling}
        tone="danger"
        title="Annuler cette réservation ?"
        description="La Dacia Duster du 12 au 15 décembre sera remise en location. Cette action est définitive."
        confirmLabel="Annuler la réservation"
      />

      <Drawer open={drawer} onClose={() => setDrawer(false)} title="Tiroir latéral">
        <p className="text-fg-muted">Pour le menu mobile et les panneaux de détail.</p>
      </Drawer>

      <Drawer
        open={sheet}
        onClose={() => setSheet(false)}
        side="bottom"
        title="Filtres"
        footer={
          <Button size="lg" className="w-full" onClick={() => setSheet(false)}>
            Voir 24 voitures
          </Button>
        }
      >
        <div className="flex flex-col gap-5 pb-2">
          <ChipGroup label="Boîte de vitesses" defaultValue="all" wrap>
            <Chip value="all">Toutes</Chip>
            <Chip value="manual">Manuelle</Chip>
            <Chip value="automatic">Automatique</Chip>
          </ChipGroup>
          <Checkbox label="Climatisation" defaultChecked />
          <Checkbox label="7 places et plus" />
        </div>
      </Drawer>
    </DemoPanel>
  )
}

function NavigationDemo() {
  const [page, setPage] = useState(3)
  const [step, setStep] = useState(1)
  return (
    <div className="flex flex-col gap-8">
      <DemoGroup title="Tabs" note="L’indicateur lime glisse vers l’onglet choisi.">
        <Tabs
          label="Réservations"
          tabs={[
            {
              label: 'À venir',
              count: 2,
              content: <p className="text-fg-muted">Vos deux prochaines locations.</p>,
            },
            {
              label: 'En cours',
              count: 1,
              content: <p className="text-fg-muted">La Clio 5 est à rendre vendredi.</p>,
            },
            {
              label: 'Passées',
              content: <p className="text-fg-muted">Historique de vos locations.</p>,
            },
            { label: 'Archivées', disabled: true, content: null },
          ]}
        />
      </DemoGroup>
      <DemoGroup title="Stepper" note="Le parcours de réservation.">
        <DemoPanel className="flex flex-col gap-6">
          <Stepper current={step} />
          <div className="flex justify-between gap-3">
            <Button
              variant="ghost"
              size="sm"
              disabled={step === 0}
              onClick={() => setStep((s) => s - 1)}
            >
              Étape précédente
            </Button>
            <Button size="sm" disabled={step === 3} onClick={() => setStep((s) => s + 1)}>
              Étape suivante
            </Button>
          </div>
        </DemoPanel>
      </DemoGroup>
      <div className="grid gap-6 lg:grid-cols-2">
        <DemoGroup title="Pagination">
          <DemoPanel>
            <Pagination page={page} lastPage={12} onPageChange={setPage} />
          </DemoPanel>
        </DemoGroup>
        <DemoGroup title="Breadcrumbs">
          <DemoPanel>
            <Breadcrumbs
              items={[
                { label: 'Accueil', to: '/' },
                { label: 'Voitures', to: '/voitures' },
                { label: 'Dacia Duster' },
              ]}
            />
          </DemoPanel>
        </DemoGroup>
      </div>
      <DemoGroup title="PageHeader et SectionHeading">
        <DemoPanel className="flex flex-col gap-10">
          <PageHeader
            breadcrumbs={[{ label: 'Accueil', to: '/' }, { label: 'Mon espace' }]}
            title="Bonjour, Said"
            description="Votre prochaine location commence dans 3 jours."
            actions={<Button to="/voitures">Nouvelle réservation</Button>}
          />
          <SectionHeading
            title="Voitures à la une"
            description="Choisies par l’agence cette semaine."
            to="/voitures"
          />
        </DemoPanel>
      </DemoGroup>
    </div>
  )
}

const TABLE_COLUMNS = [
  { key: 'reference', header: 'Référence', className: 'font-semibold tabular-nums' },
  {
    key: 'customer',
    header: 'Client',
    render: (row) => (
      <span className="flex items-center gap-3">
        <Avatar name={row.customer} size="sm" decorative />
        {row.customer}
      </span>
    ),
  },
  {
    key: 'car',
    header: 'Voiture',
    render: (row) => `${relationName(row.car.brand)} ${row.car.model}`,
  },
  {
    key: 'period',
    header: 'Période',
    render: (row) => <span className="tabular-nums">{period(row)}</span>,
  },
  {
    key: 'total',
    header: 'Total',
    align: 'right',
    render: (row) => <span className="font-semibold tabular-nums">{formatPrice(row.total)}</span>,
  },
  { key: 'status', header: 'Statut', render: (row) => <StatusBadge status={row.status} /> },
]

function DataDemo() {
  const [tableState, setTableState] = useState('rows')
  return (
    <div className="flex flex-col gap-8">
      <DemoGroup
        title="StatCard"
        note="Le chiffre compte jusqu’à sa valeur la première fois qu’il apparaît."
      >
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={CalendarCheck}
            label="Réservations ce mois"
            value={128}
            trend={{ value: 12, label: 'vs octobre' }}
          />
          <StatCard
            icon={Wallet}
            label="Chiffre d’affaires"
            value={184500}
            format="price"
            trend={{ value: 8.5, label: 'vs octobre' }}
          />
          <StatCard
            icon={CarFront}
            label="Taux d’occupation"
            value={76}
            format="percent"
            trend={{ value: -3, label: 'vs octobre' }}
          />
          <StatCard icon={Users} label="Nouveaux clients" value={42} />
        </div>
      </DemoGroup>
      <DemoGroup title="Avatar">
        <DemoPanel className="flex items-center gap-3">
          <Avatar name="Salma Bennani" size="sm" />
          <Avatar name="Youssef El Amrani" />
          <Avatar name="Imane Tazi" size="lg" />
        </DemoPanel>
      </DemoGroup>
      <DemoGroup
        title="Table"
        note="Défilement horizontal sur petit écran, survol des lignes, squelette pendant le chargement."
      >
        <ChipGroup label="État du tableau" value={tableState} onChange={setTableState}>
          <Chip value="rows">Données</Chip>
          <Chip value="loading">Chargement</Chip>
          <Chip value="empty">Vide</Chip>
        </ChipGroup>
        <Table
          caption="Dernières réservations"
          columns={TABLE_COLUMNS}
          rows={tableState === 'rows' ? DEMO_RESERVATIONS : []}
          rowKey="reference"
          loading={tableState === 'loading'}
          empty={
            <EmptyState
              icon={CalendarX}
              title="Aucune réservation"
              text="Les réservations de vos clients apparaîtront ici."
              glow={false}
            />
          }
        />
      </DemoGroup>
    </div>
  )
}

function StatesDemo() {
  const [retrying, setRetrying] = useState(false)
  function retry() {
    setRetrying(true)
    window.setTimeout(() => setRetrying(false), 1200)
  }
  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <DemoPanel className="flex flex-col gap-6">
          <Specimen
            label="Skeleton et SkeletonText (shimmer coupé en mouvement réduit)"
            className="w-full"
          >
            <div className="flex w-full items-center gap-4">
              <Skeleton className="size-12 rounded-full" />
              <SkeletonText lines={2} className="flex-1" />
            </div>
          </Specimen>
          <Specimen label="Spinner sm / md / lg">
            <div className="flex items-center gap-4 text-fg-muted">
              <Spinner size="sm" />
              <Spinner />
              <Spinner size="lg" label="Chargement…" />
            </div>
          </Specimen>
        </DemoPanel>
        <DemoPanel className="flex flex-col gap-1">
          <p className="mb-2 text-sm text-fg-muted">CarListItemSkeleton</p>
          <CarListItemSkeleton />
          <CarListItemSkeleton />
        </DemoPanel>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <EmptyState
          icon={CalendarX}
          title="Aucune réservation pour l’instant"
          text="Choisissez une voiture et vos dates : votre réservation apparaîtra ici."
          action={<Button to="/voitures">Voir les voitures</Button>}
        />
        <ErrorState
          title="Impossible de charger les voitures"
          text="Le serveur ne répond pas. Vérifiez votre connexion puis réessayez."
          onRetry={retry}
          retrying={retrying}
        />
      </div>
    </div>
  )
}

export default function ContentSections() {
  return (
    <>
      <DemoSection
        id="cartes"
        title="Cartes"
        description="Survol : la carte monte de 4 px, sa bordure s’éclaircit avec une lueur violette, et la photo zoome à 1,05 (500 ms). Le filtre réorganise la grille par animation de layout."
      >
        <div className="grid gap-5 md:grid-cols-3">
          <Card>
            <h3 className="text-lg font-semibold text-fg">Card</h3>
            <p className="mt-2 text-sm text-fg-muted">Surface de base, rayon 20 px.</p>
          </Card>
          <Card interactive tabIndex={0}>
            <h3 className="text-lg font-semibold text-fg">Card interactive</h3>
            <p className="mt-2 text-sm text-fg-muted">Survolez-la : soulèvement et lueur.</p>
          </Card>
          <Card size="lg" tone="raised">
            <h3 className="text-lg font-semibold text-fg">Grande carte surélevée</h3>
            <p className="mt-2 text-sm text-fg-muted">Rayon 28 px, surface raised.</p>
          </Card>
        </div>
        <PromoCard
          icon={Tag}
          title="−15 % dès 7 jours de location"
          text="La remise s’applique automatiquement au moment de la réservation."
          actionLabel="Voir les voitures"
          to="/voitures"
        />
        <DemoGroup
          title="CarCard"
          note="Grille révélée en cascade à la première apparition ; favoris et état de chargement interactifs."
        >
          <CarGridDemo />
        </DemoGroup>
        <DemoGroup
          title="Image en erreur"
          note="Une URL cassée bascule sur la silhouette locale de la catégorie."
        >
          <div className="max-w-sm">
            <CarCard car={BROKEN_IMAGE_CAR} onReserve={() => toast('Réserver la Peugeot 208')} />
          </div>
        </DemoGroup>
        <DemoGroup
          title="CarListItem"
          note="Ligne compacte pour les listes et « Mes réservations »."
        >
          <DemoPanel className="flex flex-col gap-1 p-2 sm:p-3">
            {DEMO_RESERVATIONS.slice(0, 3).map((reservation) => (
              <CarListItem
                key={reservation.reference}
                car={reservation.car}
                subtitle={period(reservation)}
                trailing={<StatusBadge status={reservation.status} />}
                to="/mon-espace/reservations"
              />
            ))}
            <CarListItem
              car={DEMO_CARS[5]}
              onAction={() => toast('Action')}
              actionIcon={Pencil}
              actionLabel="Modifier"
            />
          </DemoPanel>
        </DemoGroup>
      </DemoSection>

      <DemoSection
        id="overlays"
        title="Superpositions"
        description="Modale, confirmation, tiroir, bottom sheet, menu et infobulle. Fond assombri, entrée animée, Échap pour fermer, focus piégé."
      >
        <OverlaysDemo />
      </DemoSection>

      <DemoSection
        id="navigation"
        title="Navigation"
        description="Onglets, étapes, pagination, fil d’Ariane et en-têtes."
      >
        <NavigationDemo />
      </DemoSection>

      <DemoSection
        id="donnees"
        title="Données"
        description="Pour l’administration : indicateurs, avatars, tableaux."
      >
        <DataDemo />
      </DemoSection>

      <DemoSection
        id="etats"
        title="États"
        description="Jamais d’écran vide : squelettes à la forme du contenu, états vides qui proposent une action, erreurs qui expliquent quoi faire."
      >
        <StatesDemo />
      </DemoSection>

      <DemoSection
        id="toasts"
        title="Toasts"
        description="sonner, en haut de l’écran (le bas est réservé à la barre de navigation mobile). Le message reprend le nom de l’action."
      >
        <DemoPanel className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() =>
              toast.success('Réservation envoyée', {
                description: 'L’agence vous confirme sous 24 h.',
              })
            }
          >
            Succès
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.error('La réservation a échoué', {
                description: 'Cette voiture n’est plus disponible à ces dates.',
              })
            }
          >
            Erreur
          </Button>
          <Button
            variant="secondary"
            onClick={() => toast.info('Pensez à apporter votre permis et votre CIN.')}
          >
            Info
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              toast.promise(new Promise((resolve) => window.setTimeout(resolve, 1500)), {
                loading: 'Envoi de la réservation…',
                success: 'Réservation envoyée',
                error: 'La réservation a échoué',
              })
            }
          >
            Chargement puis succès
          </Button>
        </DemoPanel>
      </DemoSection>

      <DemoSection
        id="faq"
        title="Accordéon"
        description="Pour la FAQ. Le contenu apparaît en fondu, sans animer la hauteur."
      >
        <Accordion
          className="max-w-3xl"
          items={[
            {
              title: 'Quels documents faut-il pour louer ?',
              content:
                'Votre CIN ou passeport et un permis de conduire valide depuis au moins deux ans.',
              defaultOpen: true,
            },
            {
              title: 'La caution est-elle obligatoire ?',
              content: 'Oui. Elle est bloquée au retrait de la voiture et restituée au retour.',
            },
            {
              title: 'Puis-je rendre la voiture dans une autre ville ?',
              content: 'Oui, choisissez une agence de retour différente lors de la réservation.',
            },
          ]}
        />
      </DemoSection>
    </>
  )
}
