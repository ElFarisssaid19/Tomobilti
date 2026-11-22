import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import { Spinner } from './components/ui'
import AdminLayout from './layouts/AdminLayout.jsx'
import ClientLayout from './layouts/ClientLayout.jsx'
import PublicLayout from './layouts/PublicLayout.jsx'
import RootLayout from './layouts/RootLayout.jsx'
import ComingSoonPage from './pages/ComingSoonPage.jsx'
import HomePage from './pages/HomePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

// Living style guide: development only. The condition is static, so Vite drops the
// import (and the whole style guide) from the production build.
const DesignPage = import.meta.env.DEV ? lazy(() => import('./pages/design/DesignPage.jsx')) : null

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route
            path="voitures"
            element={<ComingSoonPage title="Voitures" phase="phase 3 (catalogue)" />}
          />
          <Route path="a-propos" element={<ComingSoonPage title="À propos" phase="phase 7" />} />
          <Route path="contact" element={<ComingSoonPage title="Contact" phase="phase 7" />} />
          <Route
            path="connexion"
            element={<ComingSoonPage title="Connexion" phase="phase 2 (authentification)" />}
          />
          <Route
            path="inscription"
            element={<ComingSoonPage title="Inscription" phase="phase 2 (authentification)" />}
          />

          <Route path="mon-espace" element={<ClientLayout />}>
            <Route index element={<Navigate to="reservations" replace />} />
            <Route
              path="reservations"
              element={
                <ComingSoonPage
                  title="Mes réservations"
                  phase="phase 4 (réservation)"
                  inContainer={false}
                  titleAs="h2"
                />
              }
            />
            <Route
              path="profil"
              element={
                <ComingSoonPage
                  title="Profil"
                  phase="phase 2 (authentification)"
                  inContainer={false}
                  titleAs="h2"
                />
              }
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        <Route path="admin" element={<AdminLayout />}>
          <Route
            index
            element={<ComingSoonPage title="Tableau de bord" phase="phase 5" inContainer={false} />}
          />
          <Route
            path="voitures"
            element={<ComingSoonPage title="Voitures" phase="phase 5" inContainer={false} />}
          />
          <Route
            path="categories"
            element={<ComingSoonPage title="Catégories" phase="phase 5" inContainer={false} />}
          />
          <Route
            path="reservations"
            element={<ComingSoonPage title="Réservations" phase="phase 5" inContainer={false} />}
          />
          <Route
            path="clients"
            element={<ComingSoonPage title="Clients" phase="phase 5" inContainer={false} />}
          />
        </Route>

        {DesignPage && (
          <Route
            path="design"
            element={
              <Suspense
                fallback={
                  <div className="grid min-h-dvh place-items-center text-fg-muted">
                    <Spinner size="lg" label="Chargement du guide de style…" />
                  </div>
                }
              >
                <DesignPage />
              </Suspense>
            }
          />
        )}
      </Route>
    </Routes>
  )
}
