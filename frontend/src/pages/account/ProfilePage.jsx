import { CircleCheck, TriangleAlert } from 'lucide-react'
import { Badge, PageHeader } from '../../components/ui'
import { useAuth } from '../../context/authContext.js'
import LicenseForm from './LicenseForm.jsx'
import PasswordForm from './PasswordForm.jsx'
import PersonalInfoForm from './PersonalInfoForm.jsx'
import ProfileSection from './ProfileSection.jsx'
import usePageMeta from '../../hooks/usePageMeta.js'

/** /espace/profil: personal information, driving licence and ID, password. */
export default function ProfilePage() {
  usePageMeta('Mon profil')
  const { user } = useAuth()

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        titleAs="h2"
        title="Profil"
        description="Ces informations figurent sur vos contrats de location."
      />

      <ProfileSection
        id="profil-informations"
        title="Informations personnelles"
        description="Votre nom et votre téléphone servent à vous accueillir au retrait du véhicule."
      >
        <PersonalInfoForm />
      </ProfileSection>

      <ProfileSection
        id="profil-permis"
        title="Permis de conduire et pièce d’identité"
        description={
          <p>
            Obligatoires pour réserver, avec votre téléphone et votre date de naissance : l’agence
            vérifie la CIN et le permis au retrait des clés. Il faut au moins 2 ans de permis.
          </p>
        }
        badge={
          user.has_complete_profile ? (
            <Badge tone="success" icon={CircleCheck} className="self-start">
              Prêt pour réserver
            </Badge>
          ) : (
            <Badge tone="warning" icon={TriangleAlert} className="self-start">
              À compléter avant de réserver
            </Badge>
          )
        }
      >
        <LicenseForm />
      </ProfileSection>

      <ProfileSection
        id="profil-mot-de-passe"
        title="Mot de passe"
        description="Changer de mot de passe déconnecte vos autres appareils."
      >
        <PasswordForm />
      </ProfileSection>
    </div>
  )
}
