import { CarFront } from 'lucide-react'
import { Link, Outlet } from 'react-router'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-700">
            <CarFront className="size-7 text-accent-500" aria-hidden="true" />
            Tomobilti
          </Link>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500">
          © {new Date().getFullYear()} Tomobilti, location de voitures au Maroc.
        </div>
      </footer>
    </div>
  )
}
