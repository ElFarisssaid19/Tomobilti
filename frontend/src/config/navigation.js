import {
  Bell,
  CalendarCheck,
  CalendarRange,
  CarFront,
  House,
  LayoutDashboard,
  ReceiptText,
  Settings,
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
  { label: 'Notifications', to: '/espace/notifications', icon: Bell },
  { label: 'Profil', to: '/espace/profil', icon: UserRound },
]

/**
 * Admin sidebar. `badge: 'pending'` shows the number of requests to answer
 * (refreshed every 60 seconds, see usePendingCount).
 */
export const ADMIN_LINKS = [
  { label: 'Tableau de bord', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Réservations', to: '/admin/reservations', icon: CalendarCheck, badge: 'pending' },
  { label: 'Factures', to: '/admin/factures', icon: ReceiptText },
  { label: 'Planning', to: '/admin/planning', icon: CalendarRange },
  { label: 'Voitures', to: '/admin/voitures', icon: CarFront },
  { label: 'Clients', to: '/admin/clients', icon: Users },
  { label: 'Paramètres', to: '/admin/parametres', icon: Settings },
]

/** Admin pages outside the sidebar, for the topbar title (reached from the bell). */
export const ADMIN_EXTRA_PAGES = [{ label: 'Notifications', to: '/admin/notifications' }]
