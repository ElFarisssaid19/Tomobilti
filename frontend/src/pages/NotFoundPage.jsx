import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router'

export default function NotFoundPage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-4 px-4 py-24 text-center">
      <p className="text-6xl font-extrabold text-accent-500">404</p>
      <h1 className="text-2xl font-bold text-primary-900">Page introuvable</h1>
      <p className="max-w-md text-slate-600">
        La page que vous recherchez n’existe pas ou a été déplacée.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Retour à l’accueil
      </Link>
    </section>
  )
}
