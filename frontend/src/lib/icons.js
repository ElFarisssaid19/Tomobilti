import {
  Armchair,
  Baby,
  Car,
  CarFront,
  Gem,
  Mountain,
  Navigation,
  Plus,
  ShieldCheck,
  Truck,
  UserPlus,
  Users,
  Wallet,
  Wifi,
} from 'lucide-react'

/*
 * The API sends lucide icon names (categories.icon, extras.icon, see docs/database.md).
 * Only the icons listed here are bundled; unknown names get the fallback.
 */
const ICONS = {
  armchair: Armchair,
  baby: Baby,
  car: Car,
  'car-front': CarFront,
  gem: Gem,
  mountain: Mountain,
  navigation: Navigation,
  'shield-check': ShieldCheck,
  truck: Truck,
  'user-plus': UserPlus,
  users: Users,
  wallet: Wallet,
  wifi: Wifi,
}

/** lucide component for an icon name from the API. */
export function iconFor(name, fallback = Plus) {
  return ICONS[name] ?? fallback
}
