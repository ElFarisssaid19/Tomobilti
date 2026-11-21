import ApiStatusBadge from '../components/ApiStatusBadge.jsx'

export default function HomePage() {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <h1 className="text-4xl font-extrabold tracking-tight text-primary-900 sm:text-5xl">
        Tomobilti, location de voitures
      </h1>
      <p className="max-w-xl text-lg text-slate-600">
        Le site est en cours de construction. Revenez bientôt pour réserver votre voiture.
      </p>
      <ApiStatusBadge />
    </section>
  )
}
