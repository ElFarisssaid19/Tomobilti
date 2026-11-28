import { Link } from 'react-router'
import LegalDocument, { LegalList } from '../../components/site/LegalDocument.jsx'
import { PAYMENT_METHOD } from '../../lib/labels.js'
import { formatDays } from '../../lib/dates.js'
import { formatPrice } from '../../utils/format.js'

const plural = (count, word) => `${count} ${word}${count > 1 ? 's' : ''}`

/**
 * The rental conditions, built from GET /api/legal: every figure (age, licence, hours,
 * cancellation, fees, deposit range) is the value the server applies.
 */
function articles({ company, booking, rental }) {
  const strong = (text) => <strong className="font-semibold text-fg">{text}</strong>
  const methods = Object.values(PAYMENT_METHOD)
    .map((method) => method.toLowerCase())
    .join(', ')
    .replace(/, ([^,]*)$/, ' ou $1')

  return [
    {
      id: 'objet',
      title: 'Objet',
      content: (
        <p>
          Ces conditions s’appliquent à toute location de voiture réservée sur le site ou en agence
          auprès de {company.name}, {company.address}, {company.city}. Réserver, c’est les accepter.
        </p>
      ),
    },
    {
      id: 'conducteur',
      title: 'Âge et permis',
      content: (
        <LegalList
          items={[
            <>Avoir au moins {strong(`${booking.min_age} ans`)} le jour de la prise en charge.</>,
            <>
              Détenir un permis de conduire valide depuis au moins{' '}
              {strong(plural(booking.min_license_years, 'an'))} à cette date.
            </>,
            'Ces conditions sont vérifiées avant la réservation, puis au comptoir.',
          ]}
        />
      ),
    },
    {
      id: 'reservation',
      title: 'Réservation',
      content: (
        <LegalList
          items={[
            <>
              Prise en charge et restitution de {booking.opening_time} à {booking.closing_time}, au
              moins {plural(booking.min_lead_hours, 'heure')} après la réservation et jusqu’à{' '}
              {booking.max_advance_months} mois à l’avance.
            </>,
            <>
              Durée de {formatDays(booking.min_days)} à {formatDays(booking.max_days)}. Chaque
              tranche de 24 heures commencée compte pour un jour.
            </>,
            'La demande est confirmée par l’agence ; vous recevez alors un e-mail et un bon de réservation.',
          ]}
        />
      ),
    },
    {
      id: 'documents',
      title: 'Documents à présenter',
      content: (
        <LegalList
          items={rental.documents.map((document) => (
            <>
              {strong(document.label)}, {document.detail}.
            </>
          ))}
        />
      ),
    },
    {
      id: 'paiement',
      title: 'Prix et paiement',
      content: (
        <LegalList
          items={[
            'Les prix sont en dirhams (DH), toutes taxes comprises, et ceux de la confirmation font foi.',
            <>Paiement à l’agence, à la prise en charge : {methods}. Aucun paiement en ligne.</>,
            'Une facture est remise à la prise en charge.',
          ]}
        />
      ),
    },
    {
      id: 'caution',
      title: 'Caution',
      content: (
        <LegalList
          items={[
            rental.deposit_min && rental.deposit_max ? (
              <>
                Son montant figure sur la fiche de chaque voiture : de{' '}
                {strong(formatPrice(rental.deposit_min))} à{' '}
                {strong(formatPrice(rental.deposit_max))} selon le modèle.
              </>
            ) : (
              'Son montant figure sur la fiche de chaque voiture.'
            ),
            'Elle est bloquée sur la carte bancaire du conducteur à la prise en charge et libérée au retour, après l’état des lieux.',
            'Elle ne fait jamais partie du prix de la location.',
          ]}
        />
      ),
    },
    {
      id: 'carburant',
      title: 'Carburant',
      content: (
        <p>
          La voiture est remise avec le plein et doit être rendue avec le même niveau. Le carburant
          manquant est facturé au prix à la pompe, plus {strong(formatPrice(rental.refuel_fee))} de
          frais de service.
        </p>
      ),
    },
    {
      id: 'kilometrage',
      title: 'Kilométrage',
      content: (
        <p>
          {rental.km_per_day === null ? (
            <>Le kilométrage est {strong('illimité')}.</>
          ) : (
            <>
              {strong(`${rental.km_per_day} km par jour`)} sont inclus ; les kilomètres en plus sont
              facturés au retour.
            </>
          )}
        </p>
      ),
    },
    {
      id: 'assurance',
      title: 'Assurance',
      content: (
        <LegalList
          items={[
            'L’assurance responsabilité civile obligatoire est incluse : elle couvre les dommages causés aux autres.',
            rental.excess_equals_deposit
              ? 'Pour les dommages à la voiture, une franchise reste à votre charge, au plus le montant de la caution.'
              : 'Pour les dommages à la voiture, une franchise reste à votre charge.',
            'L’assurance ne couvre pas la conduite sous l’emprise d’alcool ou de stupéfiants, par un conducteur non déclaré, ni hors des routes carrossables.',
          ]}
        />
      ),
    },
    {
      id: 'annulation',
      title: 'Annulation',
      content: (
        <LegalList
          items={[
            <>
              Gratuite jusqu’à {strong(plural(booking.free_cancellation_hours, 'heure'))} avant la
              prise en charge, depuis{' '}
              <Link
                to="/espace/reservations"
                className="link-underline rounded-xs font-semibold text-accent-text"
              >
                Mes réservations
              </Link>
              .
            </>,
            'Après ce délai, contactez l’agence.',
            'L’agence peut refuser ou annuler une réservation ; vous êtes prévenu par e-mail, avec le motif.',
          ]}
        />
      ),
    },
    {
      id: 'retard',
      title: 'Retard de restitution',
      content: (
        <p>
          Prévenez l’agence de tout retard. Au-delà de{' '}
          {strong(plural(rental.late_return_grace_minutes, 'minute'))} après l’heure prévue, une
          journée de location supplémentaire est facturée.
        </p>
      ),
    },
    {
      id: 'dommages',
      title: 'État des lieux et dommages',
      content: (
        <LegalList
          items={[
            'Un état des lieux est fait ensemble au départ et au retour.',
            'Les dommages constatés au retour sont à votre charge, dans la limite de la franchise, sauf faute grave.',
            'Les amendes et contraventions de la période de location sont à la charge du conducteur.',
          ]}
        />
      ),
    },
    {
      id: 'abandon',
      title: 'Retour dans une autre agence',
      content: (
        <p>
          Rendre la voiture dans une autre agence que celle de départ ajoute{' '}
          {strong(formatPrice(booking.one_way_fee))} de frais d’abandon, inclus dans le prix
          affiché.
        </p>
      ),
    },
    {
      id: 'contact',
      title: 'Contact et litiges',
      content: (
        <p>
          Pour toute question : {company.email} ou {company.phone}. Ces conditions sont soumises au
          droit marocain.
        </p>
      ),
    },
  ]
}

/** /conditions-generales */
export default function TermsPage() {
  return (
    <LegalDocument
      title="Conditions générales"
      description="Conditions générales de location Tomobilti : âge, permis, caution, paiement, carburant, assurance et annulation."
      articles={articles}
    />
  )
}
