import {
  CalendarCheck,
  CarFront,
  House,
  LayoutDashboard,
  Tags,
  UserRound,
  Users,
} from 'lucide-react'

/** Desktop top navbar of the public site. */
export const PUBLIC_LINKS = [
  { label: 'Accueil', to: '/', end: true },
  { label: 'Voitures', to: '/voitures' },
  { label: 'À propos', to: '/a-propos' },
  { label: 'Contact', to: '/contact' },
]

/**
 * Floating bottom nav (mobile), public and client areas.
 * `guestTo` replaces `to` for visitors who are not signed in.
 */
export const BOTTOM_NAV = [
  { label: 'Accueil', to: '/', icon: House, end: true },
  { label: 'Voitures', to: '/voitures', icon: CarFront },
  { label: 'Réservations', to: '/espace/reservations', icon: CalendarCheck },
  { label: 'Profil', to: '/espace/profil', guestTo: '/connexion', icon: UserRound },
]

/** Tabs of "Mon espace". */
export const CLIENT_LINKS = [
  { label: 'Mes réservations', to: '/espace/reservations', icon: CalendarCheck },
  { label: 'Profil', to: '/espace/profil', icon: UserRound },
]

/** Admin sidebar. */
export const ADMIN_LINKS = [
  { label: 'Tableau de bord', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Voitures', to: '/admin/voitures', icon: CarFront },
  { label: 'Catégories', to: '/admin/categories', icon: Tags },
  { label: 'Réservations', to: '/admin/reservations', icon: CalendarCheck },
  { label: 'Clients', to: '/admin/clients', icon: Users },
]
