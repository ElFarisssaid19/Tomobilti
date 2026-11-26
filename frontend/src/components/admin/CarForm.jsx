import useForm from '../../hooks/useForm.js'
import { carPayload, validateCar } from '../../lib/adminCars.js'
import { CAR_STATUS, FUEL_TYPE, toOptions, TRANSMISSION } from '../../lib/labels.js'
import { Button, Card, Input, Select, Switch, Textarea } from '../ui'

function Section({ title, children }) {
  return (
    <Card padding="lg" as="section" className="flex flex-col gap-5">
      <h2 className="text-lg font-bold text-fg">{title}</h2>
      {children}
    </Card>
  )
}

/**
 * Create or edit a car, in sections (identity, specs, pricing, agency and status,
 * description). Client checks run first (lib/adminCars.js); server 422 errors land
 * under their fields. On create the status is chosen here; later it changes through
 * `statusSlot` (the status dialog lists the reservations a change affects).
 */
export default function CarForm({
  initialValues,
  isNew,
  options,
  onSubmit,
  submitLabel,
  cancelTo = '/admin/voitures',
  statusSlot,
}) {
  const form = useForm(initialValues)
  const { values, errors } = form
  const set = (name) => (value) => form.setValues((current) => ({ ...current, [name]: value }))
  const toSelect = (items) => items.map((item) => ({ value: String(item.id), label: item.name }))

  function submit(event) {
    form.handleSubmit(event, {
      validate: (current) => validateCar(current, { isNew }),
      send: (current) => onSubmit(carPayload(current, { isNew })),
      errorTitle: 'La voiture n’a pas été enregistrée',
    })
  }

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <Section title="Identité">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Select
            label="Marque"
            name="brand_id"
            required
            options={toSelect(options.brands)}
            value={values.brand_id}
            onChange={set('brand_id')}
            errors={errors}
          />
          <Input label="Modèle" required placeholder="Clio 5" {...form.field('model')} />
          <Input
            label="Année"
            required
            type="number"
            inputMode="numeric"
            min="2000"
            {...form.field('year')}
          />
          <Input
            label="Immatriculation"
            required
            placeholder="12345-A-6"
            autoCapitalize="characters"
            {...form.field('plate_number')}
          />
          <Input label="Couleur" required placeholder="Gris platine" {...form.field('color')} />
          <Select
            label="Catégorie"
            name="category_id"
            required
            options={toSelect(options.categories)}
            value={values.category_id}
            onChange={set('category_id')}
            errors={errors}
          />
        </div>
      </Section>

      <Section title="Caractéristiques">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Select
            label="Boîte de vitesses"
            name="transmission"
            options={toOptions(TRANSMISSION)}
            value={values.transmission}
            onChange={set('transmission')}
            errors={errors}
          />
          <Select
            label="Carburant"
            name="fuel"
            options={toOptions(FUEL_TYPE)}
            value={values.fuel}
            onChange={set('fuel')}
            errors={errors}
          />
          <Input
            label="Kilométrage"
            type="number"
            inputMode="numeric"
            min="0"
            suffix="km"
            {...form.field('mileage')}
          />
          <Input
            label="Places"
            type="number"
            inputMode="numeric"
            min="1"
            max="9"
            {...form.field('seats')}
          />
          <Input
            label="Portes"
            type="number"
            inputMode="numeric"
            min="2"
            max="5"
            {...form.field('doors')}
          />
          <Input
            label="Bagages"
            type="number"
            inputMode="numeric"
            min="0"
            hint="Nombre de valises."
            {...form.field('luggage')}
          />
        </div>
        <Switch
          label="Climatisation"
          checked={values.air_conditioning}
          onChange={set('air_conditioning')}
          className="max-w-sm"
        />
      </Section>

      <Section title="Tarifs">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Input
            label="Prix par jour"
            required
            inputMode="decimal"
            suffix="DH"
            placeholder="300"
            info="Un nouveau prix s’applique aux prochaines réservations. Les réservations existantes gardent le leur."
            {...form.field('price_per_day')}
          />
          <Input
            label="Caution"
            required
            inputMode="decimal"
            suffix="DH"
            placeholder="6000"
            info="Bloquée au départ, jamais incluse dans le total."
            {...form.field('deposit_amount')}
          />
        </div>
        <Switch
          label="Voiture à la une"
          hint="Affichée sur la page d’accueil."
          checked={values.is_featured}
          onChange={set('is_featured')}
          className="max-w-sm"
        />
      </Section>

      <Section title="Agence et statut">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <Select
            label="Agence de rattachement"
            name="location_id"
            required
            options={toSelect(options.locations)}
            value={values.location_id}
            onChange={set('location_id')}
            errors={errors}
          />
          {isNew && (
            <Select
              label="Statut"
              name="status"
              required
              options={toOptions(CAR_STATUS)}
              value={values.status}
              onChange={set('status')}
              errors={errors}
              info="Seules les voitures disponibles sont visibles sur le site."
            />
          )}
        </div>
        {statusSlot}
      </Section>

      <Section title="Description">
        <Textarea
          label="Description"
          hint="Affichée sur la page de la voiture."
          rows={4}
          maxLength={5000}
          {...form.field('description')}
        />
      </Section>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button to={cancelTo} variant="ghost">
          Retour à la flotte
        </Button>
        <Button type="submit" loading={form.submitting}>
          {submitLabel}
        </Button>
      </div>
    </form>
  )
}
