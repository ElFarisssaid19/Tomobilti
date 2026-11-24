import { CarFront, ExternalLink, RefreshCcw, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { toast } from 'sonner'
import CarForm from '../../components/admin/CarForm.jsx'
import CarStatusBadge from '../../components/admin/CarStatusBadge.jsx'
import CarStatusDialog from '../../components/admin/CarStatusDialog.jsx'
import ImageManager from '../../components/admin/ImageManager.jsx'
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  LoadingRegion,
  PageHeader,
  Skeleton,
} from '../../components/ui'
import { useAdminCar, useRestoreCar, useSaveCar, useSettings } from '../../hooks/useAdmin.js'
import usePageMeta from '../../hooks/usePageMeta.js'
import { carToForm, EMPTY_CAR } from '../../lib/adminCars.js'
import { apiErrorMessage } from '../../lib/auth.js'

/** /admin/voitures/nouvelle and /admin/voitures/:id */
export default function AdminCarFormPage() {
  const { id } = useParams()
  const isNew = !id
  const navigate = useNavigate()
  const car = useAdminCar(id)
  const brands = useSettings('brands')
  const categories = useSettings('categories')
  const locations = useSettings('locations')
  const save = useSaveCar()
  const restore = useRestoreCar()
  const [statusOpen, setStatusOpen] = useState(false)
  usePageMeta(
    isNew ? 'Nouvelle voiture' : car.data ? `${car.data.name} ${car.data.year}` : 'Voiture',
  )

  const loading =
    (!isNew && car.isPending) || brands.isPending || categories.isPending || locations.isPending
  const failed = car.isError || brands.isError || categories.isError || locations.isError

  if (loading) {
    return (
      <LoadingRegion label="Chargement de la voiture…" className="flex flex-col gap-6">
        <Skeleton className="h-10 w-72 rounded-input" />
        <Skeleton className="h-72 rounded-card" />
        <Skeleton className="h-72 rounded-card" />
      </LoadingRegion>
    )
  }

  if (failed) {
    if (car.error?.response?.status === 404) {
      return (
        <EmptyState
          icon={CarFront}
          title="Voiture introuvable"
          text="Elle a peut-être été supprimée."
          action={<Button to="/admin/voitures">Voir la flotte</Button>}
        />
      )
    }
    return (
      <ErrorState
        title="Impossible de charger la voiture"
        error={car.error}
        onRetry={() => car.refetch()}
      />
    )
  }

  const current = car.data
  const options = { brands: brands.data, categories: categories.data, locations: locations.data }

  async function submit(payload) {
    const { car: saved, message } = await save.mutateAsync({ id, payload })
    if (isNew) {
      toast.success(message, { description: 'Ajoutez maintenant ses photos.' })
      navigate(`/admin/voitures/${saved.id}#photos`, { replace: true })
    } else {
      toast.success(message)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        breadcrumbs={[
          { label: 'Voitures', to: '/admin/voitures' },
          { label: isNew ? 'Nouvelle voiture' : `${current.name} ${current.year}` },
        ]}
        title={isNew ? 'Nouvelle voiture' : `${current.name} ${current.year}`}
        description={
          isNew ? 'Les photos s’ajoutent après le premier enregistrement.' : current.plate_number
        }
        actions={
          !isNew && !current.is_deleted && current.status === 'available' ? (
            <Button
              href={`/voitures/${current.slug}`}
              target="_blank"
              rel="noreferrer"
              variant="secondary"
              leftIcon={ExternalLink}
            >
              Voir sur le site
            </Button>
          ) : null
        }
      />

      {current?.is_deleted && (
        <Alert
          tone="warning"
          title="Voiture retirée de la flotte"
          action={
            <Button
              size="sm"
              variant="secondary"
              leftIcon={RotateCcw}
              loading={restore.isPending}
              onClick={() =>
                restore.mutate(current.id, {
                  onSuccess: ({ message }) => toast.success(message),
                  onError: (error) =>
                    toast.error('La restauration a échoué', {
                      description: apiErrorMessage(error),
                    }),
                })
              }
            >
              Remettre dans la flotte
            </Button>
          }
        >
          Elle n’apparaît plus sur le site. Son historique de réservations est conservé.
        </Alert>
      )}

      <CarForm
        key={current?.id ?? 'new'}
        initialValues={isNew ? EMPTY_CAR : carToForm(current)}
        isNew={isNew}
        options={options}
        onSubmit={submit}
        submitLabel={isNew ? 'Ajouter la voiture' : 'Enregistrer les modifications'}
        statusSlot={
          !isNew && (
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-semibold text-fg">Statut</span>
              <CarStatusBadge status={current.status} />
              <Button
                size="sm"
                variant="secondary"
                leftIcon={RefreshCcw}
                onClick={() => setStatusOpen(true)}
              >
                Changer le statut
              </Button>
              {current.upcoming_reservations_count > 0 && (
                <span className="text-sm text-fg-muted">
                  {current.upcoming_reservations_count} réservation
                  {current.upcoming_reservations_count > 1 ? 's' : ''} à venir
                </span>
              )}
            </div>
          )
        }
      />

      <Card padding="lg" as="section" id="photos" className="flex scroll-mt-24 flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-bold text-fg">Photos</h2>
          <p className="text-sm text-fg-muted">
            La photo principale illustre la voiture dans le catalogue.
          </p>
        </div>
        {isNew ? (
          <p className="text-sm text-fg-muted">Enregistrez la voiture pour ajouter ses photos.</p>
        ) : (
          <ImageManager carId={current.id} images={current.images} />
        )}
      </Card>

      {!isNew && statusOpen && (
        <CarStatusDialog
          key={current.status}
          car={current}
          open
          onClose={() => setStatusOpen(false)}
        />
      )}
    </div>
  )
}
