import {
  ArrowRight,
  CarFront,
  Heart,
  Mail,
  Menu,
  Mountain,
  Plus,
  Search,
  Trash2,
  Truck,
  Wallet,
} from 'lucide-react'
import { useState } from 'react'
import {
  Badge,
  Button,
  Checkbox,
  Chip,
  ChipGroup,
  DateRangeCalendar,
  DateRangePicker,
  FormField,
  IconButton,
  Input,
  PasswordInput,
  RadioGroup,
  Select,
  StatusBadge,
  Switch,
  Textarea,
} from '../../components/ui'
import { FUEL_TYPE, RESERVATION_STATUS, toOptions, TRANSMISSION } from '../../lib/labels.js'
import { UNAVAILABLE_RANGES, VALIDATION_ERROR } from './demoData.js'
import { Code, DemoGroup, DemoPanel, DemoSection, Specimen } from './parts.jsx'

const VARIANTS = ['primary', 'secondary', 'outline', 'ghost', 'danger', 'link']

// Simulated states for the static matrix (real hover/focus work on the "Par défaut" column).
const HOVER = {
  primary: 'bg-lime-hover shadow-glow-lime -translate-y-px',
  secondary: 'border-line-strong bg-raised-hover -translate-y-px',
  outline: 'border-fg-muted bg-white/5 -translate-y-px',
  ghost: 'bg-raised text-fg',
  danger: 'bg-danger-hover -translate-y-px',
  link: 'after:scale-x-100',
}
const FOCUS = 'outline-2 outline-offset-2 outline-lime'

function ButtonMatrix() {
  return (
    <DemoPanel className="overflow-x-auto p-0 sm:p-0">
      <table className="w-full min-w-[46rem] text-left">
        <thead>
          <tr className="border-b border-line text-xs text-fg-subtle">
            {[
              'Variante',
              'Par défaut',
              'Survol (simulé)',
              'Focus (simulé)',
              'Désactivé',
              'Chargement',
            ].map((h) => (
              <th key={h} scope="col" className="px-5 py-3 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {VARIANTS.map((variant) => (
            <tr key={variant}>
              <th scope="row" className="px-5 py-4">
                <Code>{variant}</Code>
              </th>
              <td className="px-5 py-4">
                <Button variant={variant}>Réserver</Button>
              </td>
              <td className="px-5 py-4">
                <Button variant={variant} className={HOVER[variant]} tabIndex={-1}>
                  Réserver
                </Button>
              </td>
              <td className="px-5 py-4">
                <Button variant={variant} className={FOCUS} tabIndex={-1}>
                  Réserver
                </Button>
              </td>
              <td className="px-5 py-4">
                <Button variant={variant} disabled>
                  Réserver
                </Button>
              </td>
              <td className="px-5 py-4">
                <Button variant={variant} loading>
                  Réserver
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </DemoPanel>
  )
}

function LoadingButtonDemo() {
  const [loading, setLoading] = useState(false)
  function submit() {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 1600)
  }
  return (
    <Button onClick={submit} loading={loading}>
      Confirmer la réservation
    </Button>
  )
}

function ChipsDemo() {
  const [category, setCategory] = useState('all')
  const [fuels, setFuels] = useState(['diesel'])
  return (
    <div className="flex flex-col gap-8">
      <Specimen
        label="ChipGroup, sélection simple : l’indicateur lime glisse (layoutId)"
        className="w-full"
      >
        <ChipGroup label="Catégorie" value={category} onChange={setCategory} className="w-full">
          <Chip value="all">Toutes</Chip>
          <Chip value="economique" icon={Wallet}>
            Économique
          </Chip>
          <Chip value="berline" icon={CarFront}>
            Berline
          </Chip>
          <Chip value="suv" icon={Mountain} count={6}>
            SUV
          </Chip>
          <Chip value="utilitaire" icon={Truck}>
            Utilitaire
          </Chip>
          <Chip value="luxe" disabled>
            Luxe
          </Chip>
        </ChipGroup>
      </Specimen>
      <Specimen
        label="ChipGroup multiple : une coche remplace l’icône, la couleur n’est pas le seul repère"
        className="w-full"
      >
        <ChipGroup label="Carburant" value={fuels} onChange={setFuels} multiple>
          {toOptions(FUEL_TYPE).map((option) => (
            <Chip key={option.value} value={option.value}>
              {option.label}
            </Chip>
          ))}
        </ChipGroup>
      </Specimen>
    </div>
  )
}

function FormsDemo() {
  const [fuel, setFuel] = useState()
  const [transmission, setTransmission] = useState('automatic')
  const [terms, setTerms] = useState(false)
  const [newsletter, setNewsletter] = useState(true)
  const [pickup, setPickup] = useState('airport')

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <DemoPanel className="flex flex-col gap-6">
        <Input label="Nom complet" name="name" placeholder="Salma Bennani" autoComplete="name" />
        <Input
          label="Téléphone"
          name="phone"
          type="tel"
          placeholder="+212 6 12 34 56 78"
          hint="Nous vous appelons seulement pour confirmer la réservation."
        />
        <Input
          label="Adresse e-mail"
          name="email"
          type="email"
          required
          errors={VALIDATION_ERROR}
        />
        <PasswordInput
          label="Mot de passe"
          name="password"
          autoComplete="new-password"
          hint="PasswordInput : bouton afficher/masquer (aria-pressed) dans le slot trailing d’Input."
        />
        <Input label="Code promo" name="promo" placeholder="Indisponible" disabled />
        <Input
          aria-label="Rechercher une voiture"
          leftIcon={Search}
          placeholder="Marque, modèle…"
        />
        <Input label="Caution" name="deposit" type="number" suffix="DH" defaultValue={5000} />
        <Textarea
          label="Remarques"
          name="customer_notes"
          placeholder="Heure d’arrivée du vol, siège bébé…"
          hint="Facultatif."
        />
      </DemoPanel>
      <DemoPanel className="flex flex-col gap-6">
        <Select
          label="Carburant"
          name="fuel"
          options={toOptions(FUEL_TYPE)}
          value={fuel}
          onChange={setFuel}
          placeholder="Tous les carburants"
        />
        <Select
          label="Boîte de vitesses"
          name="transmission"
          options={toOptions(TRANSMISSION)}
          value={transmission}
          onChange={setTransmission}
          error="Choisissez une boîte de vitesses disponible."
        />
        <Select label="Agence" name="agency" options={[]} disabled placeholder="Aucune agence" />
        <RadioGroup
          label="Lieu de retrait"
          name="pickup"
          value={pickup}
          onChange={setPickup}
          columns={2}
          options={[
            { value: 'airport', label: 'Aéroport Menara', description: 'Accueil au terminal 1' },
            { value: 'agency', label: 'Agence Guéliz', description: 'Tous les jours, 8 h – 22 h' },
            {
              value: 'hotel',
              label: 'Livraison à l’hôtel',
              description: 'Bientôt disponible',
              disabled: true,
            },
          ]}
        />
        <div className="flex flex-col gap-4">
          <Checkbox
            label="J’accepte les conditions de location"
            checked={terms}
            onChange={setTerms}
            error={terms ? undefined : 'Vous devez accepter les conditions pour réserver.'}
          />
          <Checkbox label="Conducteur supplémentaire" hint="+ 50 DH par jour" defaultChecked />
          <Checkbox label="Option indisponible" disabled />
        </div>
        <div className="flex flex-col gap-4 border-t border-line pt-6">
          <Switch
            label="Recevoir les offres par e-mail"
            checked={newsletter}
            onChange={setNewsletter}
          />
          <Switch
            label="Voiture à la une"
            hint="Affichée sur la page d’accueil"
            defaultChecked={false}
          />
          <Switch label="Désactivé" disabled />
        </div>
      </DemoPanel>
      <DemoPanel className="flex flex-col gap-4 lg:col-span-2">
        <p className="text-sm text-fg-muted">
          <Code>FormField</Code> lit directement une réponse 422 de Laravel :{' '}
          <Code>{'{ message, errors: { phone: [...] } }'}</Code>. Passez l’erreur axios, le payload
          ou l’objet <Code>errors</Code>.
        </p>
        <FormField
          label="Téléphone (FormField + payload 422)"
          name="phone"
          errors={VALIDATION_ERROR}
        >
          <Input name="phone" type="tel" defaultValue="0612" />
        </FormField>
      </DemoPanel>
    </div>
  )
}

function DatesDemo() {
  const [range, setRange] = useState()
  const [inlineRange, setInlineRange] = useState()
  return (
    <div className="flex flex-col gap-6">
      <DemoPanel className="flex flex-col gap-6">
        <DateRangePicker
          value={range}
          onChange={setRange}
          unavailable={UNAVAILABLE_RANGES}
          hint="Les dates barrées sont déjà réservées."
        />
        <DateRangePicker
          label="Avec erreur"
          error="La date de retour doit être après la date de départ."
        />
        <DateRangePicker label="Désactivé" disabled />
      </DemoPanel>
      <DemoPanel className="min-w-0 overflow-x-auto">
        <DateRangeCalendar
          value={inlineRange}
          onChange={setInlineRange}
          unavailable={UNAVAILABLE_RANGES}
        />
      </DemoPanel>
    </div>
  )
}

export default function ControlSections() {
  return (
    <>
      <DemoSection
        id="boutons"
        title="Boutons"
        description="Survol : léger éclaircissement et soulèvement de 1 px. Appui : échelle 0,98. Focus : anneau lime. Le chargement garde la largeur."
      >
        <ButtonMatrix />
        <DemoGroup title="Tailles, icônes et liens">
          <DemoPanel className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center gap-3">
              <Specimen label="sm">
                <Button size="sm">Réserver</Button>
              </Specimen>
              <Specimen label="md">
                <Button>Réserver</Button>
              </Specimen>
              <Specimen label="lg">
                <Button size="lg">Réserver</Button>
              </Specimen>
              <Specimen label="Icône à gauche">
                <Button leftIcon={Plus} variant="secondary">
                  Ajouter une voiture
                </Button>
              </Specimen>
              <Specimen label="Icône à droite">
                <Button rightIcon={ArrowRight} variant="outline">
                  Continuer
                </Button>
              </Specimen>
              <Specimen label="Danger">
                <Button leftIcon={Trash2} variant="danger">
                  Supprimer
                </Button>
              </Specimen>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Specimen label="IconButton sm / md / lg">
                <div className="flex items-center gap-2">
                  <IconButton icon={Search} label="Rechercher" size="sm" />
                  <IconButton icon={Heart} label="Ajouter aux favoris" />
                  <IconButton icon={Menu} label="Ouvrir le menu" size="lg" />
                </div>
              </Specimen>
              <Specimen label="IconButton primary / ghost / désactivé">
                <div className="flex items-center gap-2">
                  <IconButton icon={Plus} label="Ajouter" variant="primary" />
                  <IconButton icon={Mail} label="Écrire" variant="ghost" />
                  <IconButton icon={Heart} label="Favori" disabled />
                </div>
              </Specimen>
              <Specimen label="Rendu comme Link (to)">
                <Button to="/voitures" variant="secondary">
                  Voir les voitures
                </Button>
              </Specimen>
              <Specimen label="Clic : chargement 1,6 s">
                <LoadingButtonDemo />
              </Specimen>
            </div>
          </DemoPanel>
        </DemoGroup>
      </DemoSection>

      <DemoSection
        id="chips"
        title="Chips"
        description="Le filtre principal. Chip active en lime avec texte sombre, les autres sur la surface surélevée. Défilement horizontal sur mobile."
      >
        <DemoPanel>
          <ChipsDemo />
        </DemoPanel>
      </DemoSection>

      <DemoSection
        id="formulaires"
        title="Formulaires"
        description="Champs de 48 px, bordure de contrôle à 3:1, focus lime, erreurs en français sous le champ et reliées par aria-describedby."
      >
        <FormsDemo />
      </DemoSection>

      <DemoSection
        id="dates"
        title="Dates"
        description="react-day-picker en français (lundi en premier), dates passées désactivées, périodes déjà réservées barrées et impossibles à inclure, nombre de jours affiché."
      >
        <DatesDemo />
      </DemoSection>

      <DemoSection
        id="badges"
        title="Badges"
        description="Couleurs sémantiques teintées. Les statuts de réservation ont toujours une icône en plus de la couleur."
      >
        <DemoPanel className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2">
            <Badge>Neutre</Badge>
            <Badge tone="lime">À la une</Badge>
            <Badge tone="lavender">Offre</Badge>
            <Badge tone="success" dot>
              Disponible
            </Badge>
            <Badge tone="warning" dot>
              En maintenance
            </Badge>
            <Badge tone="danger" dot>
              Hors service
            </Badge>
            <Badge tone="info" dot>
              Aéroport
            </Badge>
            <Badge tone="info" size="md">
              Taille md
            </Badge>
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(RESERVATION_STATUS).map((status) => (
              <StatusBadge key={status} status={status} />
            ))}
          </div>
        </DemoPanel>
      </DemoSection>
    </>
  )
}
