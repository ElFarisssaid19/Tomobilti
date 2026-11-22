import { ShieldX } from 'lucide-react'
import Logo from '../components/layout/Logo.jsx'
import { Button, Glow } from '../components/ui'

/** 403 for a signed-in client who opens an admin page (AdminRoute). */
export default function ForbiddenPage() {
  return (
    <div className="relative isolate flex min-h-dvh flex-col overflow-hidden">
      <Glow variant="empty" className="-top-1/3 bottom-1/2" />
      <header className="container-page flex h-16 items-center md:h-20">
        <Logo />
      </header>
      <main
        id="contenu"
        className="container-page flex flex-1 flex-col items-start justify-center gap-6 pb-20"
      >
        <span className="grid size-14 place-items-center rounded-full border border-line-strong bg-raised text-fg">
          <ShieldX className="size-6" aria-hidden="true" />
        </span>
        <p className="text-sm font-semibold text-fg-subtle tabular-nums">Erreur 403</p>
        <h1 className="max-w-xl text-3xl font-bold text-fg sm:text-4xl">
          Cette page est réservée à l’équipe de l’agence
        </h1>
        <p className="max-w-md text-lg text-fg-muted">
          Votre compte client n’a pas accès à l’administration. Vos réservations et votre profil
          sont dans votre espace.
        </p>
        <div className="mt-2 flex flex-wrap gap-3">
          <Button to="/espace/profil" size="lg">
            Aller à mon espace
          </Button>
          <Button to="/" size="lg" variant="secondary">
            Retour à l’accueil
          </Button>
        </div>
      </main>
    </div>
  )
}
