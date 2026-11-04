"use client"

// The company panel (with the roles dataset) only exists after the user
// picks a company, so it loads on demand instead of weighing down every
// page's initial bundle.

/** Open the company panel from any page (map, directory, home preview). */

// A new route always starts with a closed menu and no open company panel.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react"
import Link from "next/link"
import dynamic from "next/dynamic"
import { usePathname } from "next/navigation"
import type { Company } from "@/data/companies"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
import { MobileNav } from "@/components/MobileNav"
import { Reveal } from "@/components/Reveal"
import { ThemeContext, type Theme } from "@/components/theme"
import { useScrolled, useTheme } from "@/lib/hooks"
import { ArrowRight } from "@/components/icons"
const CompanyPanel = dynamic(
  () => import("@/components/CompanyPanel").then((mod) => mod.CompanyPanel),
  { ssr: false },
)

const SelectCompanyContext = createContext<(company: Company) => void>(() => {})
export function useSelectCompany() {
  return useContext(SelectCompanyContext)
}

function pageFromPathname(pathname: string): string {
  if (
    pathname ===
    "/"
  )
    return "home"
  return (
    pathname.split("/")[1] ||
    "home"
  )
}

export function Shell({
  children,
  companyCount,
  roleCount,
}: {
  children: ReactNode
  companyCount: number
  roleCount: number
}) {
  const pathname = usePathname()
  const page = pageFromPathname(pathname)
  const isMap =
    page ===
    "map"
  const { theme, toggle } = useTheme()
  const scrolled = useScrolled()
  const [menuOpen, setMenuOpen] = useState(false)
  const [selected, setSelected] = useState<Company | null>(null)
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    setMenuOpen(false)
    setSelected(null)
  }, [pathname])

  const selectCompany = useCallback(
    (company: Company) => setSelected(company),
    [],
  )

  return (
    <ThemeContext.Provider value={{ theme: theme as Theme, toggle }}>
      <SelectCompanyContext.Provider value={selectCompany}>
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
                  Now mapping {companyCount} startup companies across eight
                  Indian cities — {roleCount.toLocaleString("en-IN")} open
                  roles.
                </p>
                <Link href="/cities">
                  See the cities <ArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}

          <Header
            page={page}
            theme={theme}
            scrolled={scrolled}
            onToggleTheme={toggle}
            onOpenMenu={() => setMenuOpen(true)}
            slim={isMap}
          />

          <main
            id="main"
            ref={mainRef}
            tabIndex={-1}
            className={`page-main${isMap ? " is-map-page" : ""}`}
            data-page={page}
          >
            {children}
          </main>

          {!isMap && <Footer />}

          <MobileNav
            open={menuOpen}
            page={page}
            theme={theme}
            onClose={() => setMenuOpen(false)}
            onToggleTheme={toggle}
          />

          {selected && (
            <CompanyPanel
              company={selected}
              onClose={() => setSelected(null)}
            />
          )}

          <Reveal />
        </div>
      </SelectCompanyContext.Provider>
    </ThemeContext.Provider>
  )
}
