import { CAR_STATUS } from './labels.js'

/*
 * Back-office fleet: list filters (in the URL) and the car form. The checks mirror
 * Admin\CarRequest to save a round trip; the server validates everything again.
 */

export const CAR_FILTERS = Object.freeze({
  q: { type: 'string' },
  status: { type: 'enum', values: Object.keys(CAR_STATUS) },
  category: { type: 'id' },
  brand: { type: 'id' },
  location: { type: 'id' },
  deleted: { type: 'enum', values: ['with', 'only'] },
  sort: { type: 'enum', values: ['name', 'price_per_day', 'year', 'mileage', 'created_at'] },
  direction: { type: 'enum', values: ['asc', 'desc'] },
  page: { type: 'page' },
})

/** Moroccan plate: up to 5 digits, a letter, the prefecture code (1 to 89). */
export const PLATE_PATTERN = /^\d{1,5}-[A-Z]-([1-9]|[1-8]\d)$/

/** "12345 a 6" or "12345|A|6" -> "12345-A-6" (what the server stores). */
export function normalizePlate(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s*[\s\-|/]\s*/g, '-')
}

/** Empty form for a new car. Numbers stay strings while they are typed. */
export const EMPTY_CAR = Object.freeze({
  brand_id: '',
  category_id: '',
  location_id: '',
  model: '',
  year: String(new Date().getFullYear()),
  plate_number: '',
  color: '',
  transmission: 'manual',
  fuel: 'diesel',
  seats: '5',
  doors: '5',
  luggage: '2',
  air_conditioning: true,
  mileage: '0',
  price_per_day: '',
  deposit_amount: '',
  status: 'available',
  description: '',
  is_featured: false,
})

/** API car -> form values. */
export function carToForm(car) {
  return Object.fromEntries(
    Object.keys(EMPTY_CAR).map((key) => {
      const value = car[key]
      if (typeof EMPTY_CAR[key] === 'boolean') return [key, Boolean(value)]
      return [key, value === null || value === undefined ? '' : String(value)]
    }),
  )
}

const REQUIRED = {
  brand_id: 'Choisissez la marque.',
  category_id: 'Choisissez la catégorie.',
  location_id: 'Choisissez l’agence.',
  model: 'Indiquez le modèle.',
  plate_number: 'Indiquez l’immatriculation.',
  color: 'Indiquez la couleur.',
  price_per_day: 'Indiquez le prix par jour.',
  deposit_amount: 'Indiquez la caution.',
}

function integerBetween(value, min, max) {
  const number = Number(value)
  return value !== '' && Number.isInteger(number) && number >= min && number <= max
}

function amountBetween(value, min, max) {
  return (
    /^\d+([.,]\d{1,2})?$/.test(String(value).trim()) &&
    Number(String(value).replace(',', '.')) >= min &&
    Number(String(value).replace(',', '.')) <= max
  )
}

/**
 * Client-side checks of the car form.
 * @returns {Record<string, string[]>} `{ field: [message] }`, empty when valid
 */
export function validateCar(values, { isNew = true } = {}) {
  const errors = {}
  const add = (field, message) => {
    errors[field] ??= [message]
  }

  for (const [field, message] of Object.entries(REQUIRED)) {
    if (String(values[field] ?? '').trim() === '') add(field, message)
  }

  const plate = normalizePlate(values.plate_number)
  if (plate && !PLATE_PATTERN.test(plate)) {
    add('plate_number', 'Saisissez une immatriculation marocaine valide, par exemple 12345-A-6.')
  }

  const nextYear = new Date().getFullYear() + 1
  if (!integerBetween(values.year, 2000, nextYear))
    add('year', `L’année doit être comprise entre 2000 et ${nextYear}.`)
  if (!integerBetween(values.seats, 1, 9)) add('seats', 'Entre 1 et 9 places.')
  if (!integerBetween(values.doors, 2, 5)) add('doors', 'Entre 2 et 5 portes.')
  if (!integerBetween(values.luggage, 0, 20)) add('luggage', 'Entre 0 et 20 bagages.')
  if (!integerBetween(values.mileage, 0, 2_000_000))
    add('mileage', 'Indiquez le kilométrage en km, sans espace.')
  if (values.price_per_day !== '' && !amountBetween(values.price_per_day, 50, 100_000)) {
    add('price_per_day', 'Le prix par jour doit être d’au moins 50 DH.')
  }
  if (values.deposit_amount !== '' && !amountBetween(values.deposit_amount, 0, 1_000_000)) {
    add('deposit_amount', 'Indiquez un montant en DH, par exemple 5000.')
  }
  if (isNew && !values.status) add('status', 'Choisissez le statut.')

  return errors
}

/** Form values -> API payload (numbers as numbers, normalized plate, decimal points). */
export function carPayload(values, { isNew = true } = {}) {
  const amount = (value) => String(value).trim().replace(',', '.')
  const payload = {
    brand_id: Number(values.brand_id),
    category_id: Number(values.category_id),
    location_id: Number(values.location_id),
    model: values.model.trim(),
    year: Number(values.year),
    plate_number: normalizePlate(values.plate_number),
    color: values.color.trim(),
    transmission: values.transmission,
    fuel: values.fuel,
    seats: Number(values.seats),
    doors: Number(values.doors),
    luggage: Number(values.luggage),
    air_conditioning: values.air_conditioning,
    mileage: Number(values.mileage),
    price_per_day: amount(values.price_per_day),
    deposit_amount: amount(values.deposit_amount),
    description: values.description.trim() || null,
    is_featured: values.is_featured,
  }
  if (isNew) payload.status = values.status
  return payload
}

/** Photos accepted by the image manager (same limits as the server). */
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

/** @returns {string|null} French reason a file is refused, or null */
export function imageFileError(file) {
  if (!IMAGE_TYPES.includes(file.type))
    return `${file.name} : seules les photos JPG, PNG et WebP sont acceptées.`
  if (file.size > MAX_IMAGE_BYTES) return `${file.name} : la photo dépasse 5 Mo.`
  return null
}
