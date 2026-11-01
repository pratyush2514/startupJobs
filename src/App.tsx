import { lazy, Suspense, useEffect, useRef, useState } from "react"
import type { Company } from "./data"
import { Header } from "./components/Header"
import { Footer } from "./components/Footer"
import { MobileNav } from "./components/MobileNav"
import { CompanyDialog } from "./components/CompanyDialog"
import { ArrowRight, ArrowUpRight, MapIcon } from "./components/icons"
import {
  useRoute,
  useScrolled,
  useTheme,
} from "./lib/hooks"
import { pageDescriptions, pageTitles } from "./lib/preload"
import HomePage from "./pages/HomePage"

const MapPage = lazy(() => import("./pages/MapPage"))
const CitiesPage = lazy(() => import("./pages/CitiesPage"))
const CompaniesPage = lazy(() => import("./pages/CompaniesPage"))
const JobsPage = lazy(() => import("./pages/JobsPage"))
const PricingPage = lazy(() => import("./pages/PricingPage"))
const AboutPage = lazy(() => import("./pages/AboutPage"))
const FaqPage = lazy(() => import("./pages/FaqPage"))

const knownPages = new Set([
  "home",
  "map",
  "cities",
  "companies",
  "jobs",
  "pricing",
  "about",
  "faq",
])

export default function App() {
  const { page, params } = useRoute()
  const cityParam = params.get("city")
  const { theme, toggle } = useTheme()
  const scrolled = useScrolled()
  const [mobileNav, setMobileNav] = useState(false)
  const [selected, setSelected] = useState<Company | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  const lastPage = useRef(page)

  const isMap = page === "map"
  const isKnown = knownPages.has(page)

  useEffect(() => {
    setMobileNav(false)
    setSelected(null)
    if (lastPage.current !== page) {
      lastPage.current = page
      window.scrollTo(0, 0)
      window.requestAnimationFrame(() => mainRef.current?.focus())
    }
    if (page === "map" || page === "companies" || page === "jobs") return
    document.title = pageTitles[page] ?? pageTitles.home
    const description = pageDescriptions[page] ?? pageDescriptions.home
    const meta = document.querySelector<HTMLMetaElement>(
      'meta[name="description"]',
    )
    if (meta) meta.content = description
  }, [page])

  const openCompany = (company: Company) => setSelected(company)

  return (
    <div className={`app${isMap ? " is-map-app" : ""}`} data-page={page}>
      <a
        className="skip-link"
        href="#main"
        onClick={(event) => {
          event.preventDefault()
          mainRef.current?.focus()
        }}
      >
        Skip to content
      </a>

      {!isMap && (
        <div className="announcement">
          <div className="container announcement-inner">
            <p>
              Now mapping 54 startup companies across eight Indian cities.
            </p>
            <a href="#/cities">
              See the cities <ArrowRight size={13} />
            </a>
          </div>
        </div>
      )}

      <Header
        page={page}
        theme={theme}
        scrolled={scrolled}
        onToggleTheme={toggle}
        onOpenMenu={() => setMobileNav(true)}
        slim={isMap}
      />

      <main
        id="main"
        ref={mainRef}
        tabIndex={-1}
        className={`page-main${isMap ? " is-map-page" : ""}`}
        data-page={page}
      >
        <Suspense fallback={<PageSkeleton map={isMap} />}>
          <div
            className="page-frame"
            key={`${page}-${cityParam ?? ""}-${page === "home" ? "home" : ""}`}
          >
            {page === "home" && (
              <HomePage theme={theme} onSelect={openCompany} />
            )}

            {page === "map" && (
              <MapPage
                initialCity={cityParam}
                theme={theme}
                onSelect={openCompany}
              />
            )}

            {page === "cities" && <CitiesPage />}

            {(page === "companies") && (
              <CompaniesPage initialCity={cityParam} onSelect={openCompany} />
            )}

            {page === "jobs" && <JobsPage initialCity={cityParam} />}

            {page === "pricing" && <PricingPage />}
            {page === "about" && <AboutPage />}
            {page === "faq" && <FaqPage />}

            {!isKnown && (
              <section className="off-map container">
                <span className="off-map-mark">
                  <MapIcon size={30} />
                </span>
                <p className="kicker">A little off the map</p>
                <h1>This page isn’t on our atlas.</h1>
                <p>
                  Let’s get you back to somewhere familiar — the map is a good
                  place to start.
                </p>
                <div className="intro-actions">
                  <a href="#/" className="button button-primary">
                    Back to home <ArrowUpRight size={15} />
                  </a>
                  <a href="#/map" className="button button-secondary">
                    Open the map
                  </a>
                </div>
              </section>
            )}
          </div>
        </Suspense>
      </main>

      {!isMap && <Footer />}

      <MobileNav
        open={mobileNav}
        page={page}
        theme={theme}
        onClose={() => setMobileNav(false)}
        onToggleTheme={toggle}
      />

      {selected && (
        <CompanyDialog
          company={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  )
}

function PageSkeleton({ map = false }: { map?: boolean }) {
  return (
    <div
      className={`page-skeleton${map ? " is-map" : ""}`}
      aria-busy="true"
      aria-label="Loading page"
    >
      <div className="container">
        <span className="skeleton-line is-kicker" />
        <span className="skeleton-line is-title" />
        <span className="skeleton-line is-lede" />
        <span className="skeleton-line is-lede is-short" />
      </div>
    </div>
  )
}
