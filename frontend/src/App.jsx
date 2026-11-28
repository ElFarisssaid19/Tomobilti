import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router'
import AdminRoute from './components/auth/AdminRoute.jsx'
import GuestRoute from './components/auth/GuestRoute.jsx'
import ProtectedRoute from './components/auth/ProtectedRoute.jsx'
import {
  AdminPageSkeleton,
  ContentSkeleton,
  PageSkeleton,
} from './components/layout/PageSkeleton.jsx'
import ClientLayout from './layouts/ClientLayout.jsx'
import PublicLayout from './layouts/PublicLayout.jsx'
import RootLayout from './layouts/RootLayout.jsx'
import HomePage from './pages/HomePage.jsx'
import NotFoundPage from './pages/NotFoundPage.jsx'

/*
 * Code splitting: the home page ships in the main bundle; every other page is its own
 * chunk, downloaded on first visit behind a skeleton. The admin area is only ever
 * downloaded by administrators (after AdminRoute has let them in).
 */
const LoginPage = lazy(() => import('./pages/auth/LoginPage.jsx'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage.jsx'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage.jsx'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage.jsx'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage.jsx'))
const ProfilePage = lazy(() => import('./pages/account/ProfilePage.jsx'))
const CreditsPage = lazy(() => import('./pages/CreditsPage.jsx'))
const CatalogPage = lazy(() => import('./pages/catalog/CatalogPage.jsx'))
const CarDetailPage = lazy(() => import('./pages/catalog/CarDetailPage.jsx'))
const BookingPage = lazy(() => import('./pages/booking/BookingPage.jsx'))
const ReservationsPage = lazy(() => import('./pages/account/ReservationsPage.jsx'))
const ReservationDetailPage = lazy(() => import('./pages/account/ReservationDetailPage.jsx'))
const NotificationsPage = lazy(() => import('./pages/NotificationsPage.jsx'))
const AboutPage = lazy(() => import('./pages/AboutPage.jsx'))
const TermsPage = lazy(() => import('./pages/legal/TermsPage.jsx'))
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage.jsx'))
const ContactPage = lazy(() => import('./pages/ContactPage.jsx'))
const AdminLayout = lazy(() => import('./layouts/AdminLayout.jsx'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage.jsx'))
const AdminReservationsPage = lazy(() => import('./pages/admin/AdminReservationsPage.jsx'))
const AdminReservationDetailPage = lazy(
  () => import('./pages/admin/AdminReservationDetailPage.jsx'),
)
const AdminPlanningPage = lazy(() => import('./pages/admin/AdminPlanningPage.jsx'))
const AdminInvoicesPage = lazy(() => import('./pages/admin/AdminInvoicesPage.jsx'))
const AdminCarsPage = lazy(() => import('./pages/admin/AdminCarsPage.jsx'))
const AdminCarFormPage = lazy(() => import('./pages/admin/AdminCarFormPage.jsx'))
const AdminClientsPage = lazy(() => import('./pages/admin/AdminClientsPage.jsx'))
const AdminClientDetailPage = lazy(() => import('./pages/admin/AdminClientDetailPage.jsx'))
const AdminSettingsPage = lazy(() => import('./pages/admin/AdminSettingsPage.jsx'))

// Living style guide: development only. The condition is static, so Vite drops the
// import (and the whole style guide) from the production build.
const DesignPage = import.meta.env.DEV ? lazy(() => import('./pages/design/DesignPage.jsx')) : null

/** A lazy public page with its loading skeleton. */
function page(Page, label) {
  return (
    <Suspense fallback={<PageSkeleton label={label} />}>
      <Page />
    </Suspense>
  )
}

/** A lazy admin page, under the admin topbar, with its loading skeleton. */
function adminPage(Page, label) {
  return (
    <Suspense fallback={<ContentSkeleton label={label} />}>
      <Page />
    </Suspense>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="voitures" element={page(CatalogPage, 'Chargement des voitures…')} />
          <Route path="voitures/:slug" element={page(CarDetailPage, 'Chargement de la voiture…')} />
          <Route path="a-propos" element={page(AboutPage)} />
          <Route path="contact" element={page(ContactPage)} />
          <Route path="credits" element={page(CreditsPage)} />
          <Route path="conditions-generales" element={page(TermsPage)} />
          <Route path="confidentialite" element={page(PrivacyPage)} />

          {/* Visitors only: signed-in users are sent to their space. */}
          <Route element={<GuestRoute />}>
            <Route path="connexion" element={page(LoginPage)} />
            <Route path="inscription" element={page(RegisterPage)} />
            <Route path="mot-de-passe-oublie" element={page(ForgotPasswordPage)} />
            <Route path="reinitialiser-mot-de-passe" element={page(ResetPasswordPage)} />
          </Route>

          {/* Link from the verification email: works signed in or not. */}
          <Route path="verifier-email" element={page(VerifyEmailPage)} />

          {/* Mon espace: signed-in users only. */}
          <Route element={<ProtectedRoute />}>
            {/* Booking flow (dates from the car page are kept in the URL). */}
            <Route
              path="reserver/:slug"
              element={page(BookingPage, 'Chargement de la réservation…')}
            />
            <Route path="espace" element={<ClientLayout />}>
              <Route index element={<Navigate to="profil" replace />} />
              <Route
                path="reservations"
                element={
                  <Suspense fallback={<ContentSkeleton label="Chargement de vos réservations…" />}>
                    <ReservationsPage />
                  </Suspense>
                }
              />
              <Route
                path="reservations/:reference"
                element={
                  <Suspense fallback={<ContentSkeleton label="Chargement de la réservation…" />}>
                    <ReservationDetailPage />
                  </Suspense>
                }
              />
              <Route
                path="notifications"
                element={
                  <Suspense fallback={<ContentSkeleton label="Chargement des notifications…" />}>
                    <NotificationsPage />
                  </Suspense>
                }
              />
              <Route
                path="profil"
                element={
                  <Suspense fallback={<ContentSkeleton />}>
                    <ProfilePage />
                  </Suspense>
                }
              />
            </Route>
          </Route>
          <Route path="mon-espace/*" element={<Navigate to="/espace" replace />} />

          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* Administration: admins only (clients get the 403 page). */}
        <Route element={<AdminRoute />}>
          <Route
            path="admin"
            element={
              <Suspense fallback={<AdminPageSkeleton />}>
                <AdminLayout />
              </Suspense>
            }
          >
            <Route
              index
              element={adminPage(AdminDashboardPage, 'Chargement du tableau de bord…')}
            />
            <Route
              path="reservations"
              element={adminPage(AdminReservationsPage, 'Chargement des réservations…')}
            />
            <Route
              path="reservations/:reference"
              element={adminPage(AdminReservationDetailPage, 'Chargement de la réservation…')}
            />
            <Route
              path="planning"
              element={adminPage(AdminPlanningPage, 'Chargement du planning…')}
            />
            <Route
              path="factures"
              element={adminPage(AdminInvoicesPage, 'Chargement des factures…')}
            />
            <Route path="voitures" element={adminPage(AdminCarsPage, 'Chargement de la flotte…')} />
            <Route
              path="voitures/nouvelle"
              element={adminPage(AdminCarFormPage, 'Chargement du formulaire…')}
            />
            <Route
              path="voitures/:id"
              element={adminPage(AdminCarFormPage, 'Chargement de la voiture…')}
            />
            <Route
              path="clients"
              element={adminPage(AdminClientsPage, 'Chargement des clients…')}
            />
            <Route
              path="clients/:id"
              element={adminPage(AdminClientDetailPage, 'Chargement du client…')}
            />
            <Route
              path="parametres"
              element={adminPage(AdminSettingsPage, 'Chargement des paramètres…')}
            />
            <Route
              path="notifications"
              element={
                <Suspense fallback={<ContentSkeleton label="Chargement des notifications…" />}>
                  <NotificationsPage admin />
                </Suspense>
              }
            />
            <Route path="categories" element={<Navigate to="/admin/parametres" replace />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>

        {DesignPage && (
          <Route
            path="design"
            element={
              <Suspense fallback={<PageSkeleton label="Chargement du guide de style…" />}>
                <DesignPage />
              </Suspense>
            }
          />
        )}
      </Route>
    </Routes>
  )
}
