/*
 * Placeholder data for the /design style guide only. Shapes follow the API fields
 * documented in docs/database.md. Never import this outside src/pages/design.
 */
import { addDays, startOfToday } from 'date-fns'
import { FEATURED_CARS, MORE_DEMO_CARS } from '../../data/demoCars.js'
import { CAR_SILHOUETTES } from '../../lib/cars.js'

const CATEGORIES = {
  compacte: { name: 'Compacte', slug: 'compacte' },
  utilitaire: { name: 'Utilitaire', slug: 'utilitaire' },
}

const byModel = (model) => [...FEATURED_CARS, ...MORE_DEMO_CARS].find((car) => car.model === model)

/** One car per category, with real photos (index order is used by DEMO_RESERVATIONS). */
export const DEMO_CARS = [
  byModel('i10'),
  byModel('Clio 5'),
  byModel('Octavia'),
  byModel('Duster'),
  byModel('Evoque'),
  byModel('Kangoo Van'),
]

/** A car served with the API's SVG placeholder: shows the placeholder treatment. */
export const PLACEHOLDER_CAR = {
  id: 32,
  brand: { name: 'Fiat' },
  model: 'Ducato',
  year: 2023,
  category: CATEGORIES.utilitaire,
  seats: 3,
  transmission: 'manual',
  fuel: 'diesel',
  air_conditioning: true,
  price_per_day: '650.00',
  image_url: CAR_SILHOUETTES.utilitaire,
}

/** A car whose image URL is broken: shows the silhouette fallback. */
export const BROKEN_IMAGE_CAR = {
  id: 7,
  brand: { name: 'Peugeot' },
  model: '208',
  year: 2024,
  category: CATEGORIES.compacte,
  seats: 5,
  transmission: 'automatic',
  fuel: 'electric',
  air_conditioning: true,
  price_per_day: '350.00',
  images: [{ path: '/image-introuvable.jpg', alt: 'Peugeot 208', is_primary: true }],
}

const today = startOfToday()

/** Already booked ranges for the date picker demo (inclusive). */
export const UNAVAILABLE_RANGES = [
  { from: addDays(today, 4), to: addDays(today, 6) },
  { from: addDays(today, 15), to: addDays(today, 18) },
]

export const DEMO_RESERVATIONS = [
  {
    reference: 'TMB-2026-000128',
    customer: 'Salma Bennani',
    car: DEMO_CARS[3],
    start_at: addDays(today, 3),
    end_at: addDays(today, 7),
    total: '1600.00',
    status: 'confirmed',
  },
  {
    reference: 'TMB-2026-000127',
    customer: 'Youssef El Amrani',
    car: DEMO_CARS[1],
    start_at: addDays(today, -1),
    end_at: addDays(today, 2),
    total: '900.00',
    status: 'active',
  },
  {
    reference: 'TMB-2026-000126',
    customer: 'Imane Tazi',
    car: DEMO_CARS[2],
    start_at: addDays(today, 9),
    end_at: addDays(today, 12),
    total: '1350.00',
    status: 'pending',
  },
  {
    reference: 'TMB-2026-000119',
    customer: 'Karim Ouazzani',
    car: DEMO_CARS[0],
    start_at: addDays(today, -12),
    end_at: addDays(today, -8),
    total: '920.00',
    status: 'completed',
  },
  {
    reference: 'TMB-2026-000114',
    customer: 'Nadia Berrada',
    car: DEMO_CARS[4],
    start_at: addDays(today, -4),
    end_at: addDays(today, -2),
    total: '3600.00',
    status: 'cancelled',
  },
  {
    reference: 'TMB-2026-000109',
    customer: 'Omar Chraibi',
    car: DEMO_CARS[5],
    start_at: addDays(today, 5),
    end_at: addDays(today, 6),
    total: '380.00',
    status: 'rejected',
  },
]

/** Laravel 422 payload, exactly as the API sends it. */
export const VALIDATION_ERROR = {
  message: 'Le champ adresse e-mail est obligatoire. (et 1 erreur en plus)',
  errors: {
    email: ['Le champ adresse e-mail est obligatoire.'],
    phone: ['Le format du champ téléphone est invalide.'],
  },
}

/*
 * Color tokens shown in the style guide, with their hex value. Contrast is computed
 * live against the listed backgrounds.
 */
export const COLOR_GROUPS = [
  {
    title: 'Surfaces',
    note: 'Plus c’est clair, plus c’est haut. Contraste du texte principal et secondaire posé dessus.',
    kind: 'surface',
    colors: [
      { token: 'canvas', hex: '#0B0A10', use: 'Fond de page' },
      { token: 'surface', hex: '#16151C', use: 'Cartes, champs' },
      { token: 'raised', hex: '#1F1E27', use: 'Chips, boutons ronds, menus' },
      { token: 'raised-hover', hex: '#292833', use: 'Survol des éléments surélevés' },
    ],
  },
  {
    title: 'Texte',
    note: 'Contraste sur canvas, surface et raised. fg-disabled est réservé aux éléments désactivés (exemptés par les WCAG).',
    kind: 'text',
    colors: [
      { token: 'fg', hex: '#FFFFFF', use: 'Texte principal' },
      { token: 'fg-muted', hex: '#A09DAD', use: 'Texte secondaire' },
      { token: 'fg-subtle', hex: '#8C8999', use: 'Placeholders, légendes' },
      { token: 'fg-disabled', hex: '#6E6B7B', use: 'Désactivé uniquement' },
    ],
  },
  {
    title: 'Lignes',
    note: 'line-control atteint 3:1 (bordures des champs, cases, interrupteurs).',
    kind: 'line',
    colors: [
      { token: 'line', hex: '#2B2935', use: 'Bordures décoratives' },
      { token: 'line-strong', hex: '#3D3A4A', use: 'Bordures au survol' },
      { token: 'line-control', hex: '#646172', use: 'Bordures des contrôles' },
    ],
  },
  {
    title: 'Marque',
    note: 'Texte posé sur la couleur : on-lime sur lime, plum sur lavender.',
    kind: 'brand',
    colors: [
      { token: 'lime', hex: '#CDE86B', on: '#0B0A10', use: 'Accent principal' },
      { token: 'lime-hover', hex: '#DAF08A', on: '#0B0A10', use: 'Survol du lime' },
      { token: 'lavender', hex: '#C7A4F4', on: '#3A1350', use: 'Carte promo (rare)' },
      { token: 'plum', hex: '#3A1350', on: '#FFFFFF', use: 'Texte et boutons sur lavender' },
    ],
  },
  {
    title: 'Sémantique',
    note: 'Contraste comme texte sur surface. Le succès est émeraude, jamais lime.',
    kind: 'text',
    colors: [
      { token: 'success', hex: '#34D399', use: 'Succès, en cours' },
      { token: 'warning', hex: '#FBBF24', use: 'En attente' },
      { token: 'danger', hex: '#F87171', use: 'Erreurs, refus' },
      { token: 'info', hex: '#60A5FA', use: 'Information, confirmée' },
    ],
  },
  {
    title: 'Lueurs',
    note: 'Décoratives, en dégradés flous à faible opacité : hero, pages d’authentification, états vides.',
    kind: 'glow',
    colors: [
      { token: 'glow-magenta', hex: '#D946A0', use: 'Lueur' },
      { token: 'glow-violet', hex: '#7C3AED', use: 'Lueur' },
      { token: 'glow-peach', hex: '#F5D9A0', use: 'Lueur' },
    ],
  },
]
