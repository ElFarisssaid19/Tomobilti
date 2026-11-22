import aeroport800 from '../../assets/photos/aeroport-800.webp'
import aeroport1600 from '../../assets/photos/aeroport-1600.webp'
import marrakech800 from '../../assets/photos/marrakech-800.webp'
import marrakech1600 from '../../assets/photos/marrakech-1600.webp'
import atlas800 from '../../assets/photos/route-atlas-800.webp'
import atlas1600 from '../../assets/photos/route-atlas-1600.webp'
import desert800 from '../../assets/photos/route-desert-800.webp'
import desert1600 from '../../assets/photos/route-desert-1600.webp'

/*
 * One photo per auth page (credited on /credits). The caption says where it was
 * taken; the headline speaks to what the visitor is doing on that page.
 */
export const AUTH_PHOTOS = {
  login: {
    srcSet: `${atlas800} 800w, ${atlas1600} 1600w`,
    src: atlas800,
    headline: 'Vos trajets et vos réservations, au même endroit.',
    place: 'Vallée du Drâa, Haut Atlas',
  },
  register: {
    srcSet: `${marrakech800} 800w, ${marrakech1600} 1600w`,
    src: marrakech800,
    headline: 'Réservez en ligne, récupérez les clés à Menara.',
    place: 'Koutoubia, Marrakech',
  },
  password: {
    srcSet: `${desert800} 800w, ${desert1600} 1600w`,
    src: desert800,
    headline: 'Un nouveau mot de passe, et vous reprenez la route.',
    place: 'Désert d’Agafay, au pied de l’Atlas',
  },
  verify: {
    srcSet: `${aeroport800} 800w, ${aeroport1600} 1600w`,
    src: aeroport800,
    headline: 'Une adresse confirmée, et votre compte est prêt.',
    place: 'Piste d’aéroport au crépuscule',
  },
}
