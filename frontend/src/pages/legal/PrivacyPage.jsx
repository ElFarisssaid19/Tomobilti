import { Link } from 'react-router'
import LegalDocument, { LegalList } from '../../components/site/LegalDocument.jsx'

const years = (count) => `${count} an${count > 1 ? 's' : ''}`

/**
 * What personal data Tomobilti keeps, why, for how long, and the customer's rights
 * under Moroccan law 09-08 (CNDP). Durations and the controller's details come from
 * GET /api/legal.
 */
function articles({ company, privacy }) {
  const strong = (text) => <strong className="font-semibold text-fg">{text}</strong>
  const retention = privacy.retention_years

  return [
    {
      id: 'responsable',
      title: 'Responsable du traitement',
      content: (
        <p>
          {company.name}, {company.address}, {company.city}. Contact : {company.email},{' '}
          {company.phone}.
        </p>
      ),
    },
    {
      id: 'donnees',
      title: 'Données collectées',
      content: (
        <LegalList
          items={[
            <>{strong('Compte')} : nom, adresse e-mail, téléphone, mot de passe (chiffré).</>,
            <>
              {strong('Conducteur')} : date de naissance, adresse, numéro de CIN ou de passeport,
              numéro et date d’obtention du permis de conduire.
            </>,
            <>
              {strong('Locations')} : dates, agences, voiture, options, montants, mode de paiement,
              factures.
            </>,
            <>{strong('Contact')} : les messages envoyés depuis le formulaire.</>,
            <>
              {strong('Technique')} : cookies de session et de sécurité, adresse IP pour limiter les
              tentatives de connexion. Aucun cookie publicitaire ni de mesure d’audience.
            </>,
          ]}
        />
      ),
    },
    {
      id: 'finalites',
      title: 'Pourquoi',
      content: (
        <LegalList
          items={[
            'Gérer votre compte et vos réservations.',
            'Vérifier l’âge et l’ancienneté du permis avant une réservation.',
            'Établir le bon de réservation et la facture, et respecter les obligations comptables.',
            'Vous envoyer les e-mails liés à vos réservations (confirmation, rappel, facture).',
            'Protéger les comptes contre les accès frauduleux.',
          ]}
        />
      ),
    },
    {
      id: 'conservation',
      title: 'Durée de conservation',
      content: (
        <LegalList
          items={[
            <>
              Compte et données du conducteur : {strong(years(retention.account))} après votre
              dernière réservation ou connexion.
            </>,
            <>Factures et données qu’elles contiennent : {strong(years(retention.invoices))}.</>,
            <>Messages du formulaire de contact : {strong(years(retention.contact))}.</>,
            'Cookies de session : le temps de la session, ou de « Se souvenir de moi ».',
          ]}
        />
      ),
    },
    {
      id: 'destinataires',
      title: 'Destinataires',
      content: (
        <LegalList
          items={[
            'L’équipe de l’agence, pour traiter vos réservations.',
            'L’hébergeur du site et le service d’envoi d’e-mails, comme sous-traitants.',
            'Vos données ne sont ni vendues ni utilisées à des fins publicitaires.',
          ]}
        />
      ),
    },
    {
      id: 'droits',
      title: 'Vos droits',
      content: (
        <>
          <p>
            La loi n° 09-08 relative à la protection des personnes physiques à l’égard du traitement
            des données à caractère personnel vous donne un droit d’accès, de rectification et
            d’opposition, pour des motifs légitimes.
          </p>
          <LegalList
            items={[
              <>
                Corrigez votre profil à tout moment dans{' '}
                <Link
                  to="/espace/profil"
                  className="link-underline rounded-xs font-semibold text-accent-text"
                >
                  Mon profil
                </Link>
                .
              </>,
              <>Pour le reste, écrivez à {strong(company.email)} avec une pièce d’identité.</>,
              'Vous pouvez aussi saisir la Commission nationale de contrôle de la protection des données à caractère personnel (CNDP).',
            ]}
          />
        </>
      ),
    },
    {
      id: 'securite',
      title: 'Sécurité',
      content: (
        <p>
          Les mots de passe sont chiffrés, les échanges passent par une connexion sécurisée (HTTPS)
          et seul le personnel de l’agence accède à l’administration.
        </p>
      ),
    },
    {
      id: 'cndp',
      title: 'Déclaration à la CNDP',
      content: (
        <p>
          Ce traitement doit être déclaré à la CNDP avant la mise en ligne. Numéro de récépissé : à
          compléter par l’agence.
        </p>
      ),
    },
  ]
}

/** /confidentialite */
export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Confidentialité"
      description="Données personnelles chez Tomobilti : ce que nous collectons, pourquoi, combien de temps, et vos droits (loi 09-08)."
      articles={articles}
    />
  )
}
