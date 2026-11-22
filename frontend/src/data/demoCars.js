/*
 * Demo cars for the home page and the /design style guide, until the catalogue API
 * arrives (Phase 3). Fields follow the API car shape (docs/database.md); specs and prices
 * match the seeded cars. Photos are 800px copies of the seeded photos
 * (backend/database/seeders/assets/cars/{slug}/01-*-800.webp), credited on /credits.
 */
import classeC from '../assets/cars/photos/mercedes-benz-classe-c-2024.webp'
import clio from '../assets/cars/photos/renault-clio-5-2025.webp'
import duster from '../assets/cars/photos/dacia-duster-2024.webp'
import evoque from '../assets/cars/photos/range-rover-evoque-2024.webp'
import i10 from '../assets/cars/photos/hyundai-i10-2024.webp'
import kangoo from '../assets/cars/photos/renault-kangoo-van-2023.webp'
import octavia from '../assets/cars/photos/skoda-octavia-2024.webp'
import peugeot208 from '../assets/cars/photos/peugeot-208-2025.webp'
import tucson from '../assets/cars/photos/hyundai-tucson-2024.webp'

const CATEGORIES = {
  economique: { name: 'Économique', slug: 'economique' },
  compacte: { name: 'Compacte', slug: 'compacte' },
  berline: { name: 'Berline', slug: 'berline' },
  suv: { name: 'SUV', slug: 'suv' },
  luxe: { name: 'Luxe', slug: 'luxe' },
  utilitaire: { name: 'Utilitaire', slug: 'utilitaire' },
}

function car(id, brand, model, year, category, specs, photo) {
  return {
    id,
    slug: `${brand}-${model}-${year}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    brand: { name: brand },
    model,
    year,
    category: CATEGORIES[category],
    air_conditioning: true,
    ...specs,
    images: [
      {
        thumbnail_url: photo,
        alt: `${brand} ${model} ${year}, vue avant trois-quarts`,
        is_primary: true,
      },
    ],
  }
}

/** The six cars flagged `is_featured` in the seed. */
export const FEATURED_CARS = [
  car(
    9,
    'Renault',
    'Clio 5',
    2025,
    'compacte',
    { seats: 5, transmission: 'automatic', fuel: 'petrol', price_per_day: '330.00' },
    clio,
  ),
  car(
    11,
    'Peugeot',
    '208',
    2025,
    'compacte',
    { seats: 5, transmission: 'automatic', fuel: 'petrol', price_per_day: '350.00' },
    peugeot208,
  ),
  car(
    19,
    'Dacia',
    'Duster',
    2024,
    'suv',
    { seats: 5, transmission: 'manual', fuel: 'diesel', price_per_day: '450.00' },
    duster,
  ),
  car(
    21,
    'Hyundai',
    'Tucson',
    2024,
    'suv',
    { seats: 5, transmission: 'automatic', fuel: 'diesel', price_per_day: '700.00' },
    tucson,
  ),
  car(
    28,
    'Mercedes-Benz',
    'Classe C',
    2024,
    'luxe',
    { seats: 5, transmission: 'automatic', fuel: 'diesel', price_per_day: '1200.00' },
    classeC,
  ),
  car(
    30,
    'Range Rover',
    'Evoque',
    2024,
    'luxe',
    { seats: 5, transmission: 'automatic', fuel: 'petrol', price_per_day: '1800.00' },
    evoque,
  ),
]

/** A few more seeded cars, for categories the featured list does not cover. */
export const MORE_DEMO_CARS = [
  car(
    6,
    'Hyundai',
    'i10',
    2024,
    'economique',
    { seats: 4, transmission: 'manual', fuel: 'petrol', price_per_day: '230.00' },
    i10,
  ),
  car(
    16,
    'Skoda',
    'Octavia',
    2024,
    'berline',
    { seats: 5, transmission: 'automatic', fuel: 'diesel', price_per_day: '550.00' },
    octavia,
  ),
  car(
    31,
    'Renault',
    'Kangoo Van',
    2023,
    'utilitaire',
    {
      seats: 2,
      transmission: 'manual',
      fuel: 'diesel',
      price_per_day: '400.00',
      air_conditioning: false,
    },
    kangoo,
  ),
]
