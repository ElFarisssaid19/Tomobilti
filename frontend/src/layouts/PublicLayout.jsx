import { useLocation } from 'react-router'
import BottomNav from '../components/layout/BottomNav.jsx'
import PageTransition from '../components/layout/PageTransition.jsx'
import SiteFooter from '../components/layout/SiteFooter.jsx'
import SiteHeader from '../components/layout/SiteHeader.jsx'

/**
 * Public site: top navbar (desktop) / compact bar + floating bottom nav (mobile),
 * animated page outlet, footer. The bottom padding keeps content above the bottom nav.
 */
export default function PublicLayout() {
  const { pathname } = useLocation()
  // "Mon espace" animates its own tabs: keep it mounted while switching between them.
  const transitionKey = pathname.startsWith('/espace') ? '/espace' : pathname

  return (
    <div className="flex min-h-dvh flex-col pb-28 md:pb-0">
      <a
        href="#contenu"
        className="sr-only z-(--z-toast) rounded-full bg-lime px-4 py-2 font-semibold text-on-lime focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Aller au contenu
      </a>
      <SiteHeader />
      {/* At least one screen tall: while a lazy page or its data loads, the footer stays
          below the fold instead of jumping down when the content arrives (no layout shift). */}
      <main id="contenu" className="flex min-h-dvh flex-1 flex-col">
        <PageTransition transitionKey={transitionKey} className="flex flex-1 flex-col" />
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  )
}
