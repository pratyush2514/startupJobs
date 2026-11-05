"use client";

// The company panel (with the roles dataset) only exists after the user
// picks a company, so it loads on demand instead of weighing down every
// page's initial bundle.

/** Open the company panel from any page (map, directory, home preview). */

// A new route always starts with a closed menu and no open company panel.

import dynamic from "next/dynamic";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ArrowRight } from "@/components/icons";
import { MobileNav } from "@/components/MobileNav";
import { Reveal } from "@/components/Reveal";
import { type Theme, ThemeContext } from "@/components/theme";
import { type Company, companies } from "@/data/companies";
import { useScrolled, useTheme } from "@/lib/hooks";

const CompanyPanel = dynamic(
  () => import("@/components/CompanyPanel").then((mod) => mod.CompanyPanel),
  { ssr: false },
);

const SelectCompanyContext = createContext<(company: Company) => void>(
  () => {},
);
export function useSelectCompany() {
  return useContext(SelectCompanyContext);
}

function pageFromPathname(pathname: string): string {
  if (pathname === "/") return "home";
  return pathname.split("/")[1] || "home";
}

export function Shell({
  children,
  companyCount,
  roleCount,
}: {
  children: ReactNode;
  companyCount: number;
  roleCount: number;
}) {
  const pathname = usePathname();
  const page = pageFromPathname(pathname);
  const isMap = page === "map";
  const { theme, toggle } = useTheme();
  const scrolled = useScrolled();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selected, setSelected] = useState<Company | null>(null);
  const mainRef = useRef<HTMLElement>(null);
  useEffect(() => {
    setMenuOpen(false);
    // A ?company= deep link (home preview pin, shared URL) hands the map
    // page its selection instead of starting with a closed panel.
    if (pathname === "/map") {
      const companyId = new URLSearchParams(window.location.search).get(
        "company",
      );
      setSelected(
        companyId
          ? (companies.find((item) => item.id === companyId) ?? null)
          : null,
      );
      return;
    }
    setSelected(null);
  }, [pathname]);

  const selectCompany = useCallback(
    (company: Company) => setSelected(company),
    [],
  );

  const closePanel = useCallback(() => {
    setSelected(null);
    // Drop the deep-link param so a refresh doesn't resurrect the panel
    // after the user deliberately closed it.
    if (pathname === "/map") {
      const params = new URLSearchParams(window.location.search);
      if (params.has("company")) {
        params.delete("company");
        const query = params.toString();
        window.history.replaceState(null, "", query ? `/map?${query}` : "/map");
      }
    }
  }, [pathname]);

  return (
    <ThemeContext.Provider value={{ theme: theme as Theme, toggle }}>
      <SelectCompanyContext.Provider value={selectCompany}>
        <div className={`app${isMap ? " is-map-app" : ""}`} data-page={page}>
          <a
            className="skip-link"
            href="#main"
            onClick={(event) => {
              event.preventDefault();
              mainRef.current?.focus();
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

          {/* The map page is a full-screen workspace — no navbar, no
              announcement, no footer. Its sidebar carries the brand and
              the theme switch instead. */}
          {!isMap && (
            <Header
              page={page}
              theme={theme}
              scrolled={scrolled}
              onToggleTheme={toggle}
              onOpenMenu={() => setMenuOpen(true)}
            />
          )}

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

          {!isMap && (
            <MobileNav
              open={menuOpen}
              page={page}
              theme={theme}
              onClose={() => setMenuOpen(false)}
              onToggleTheme={toggle}
            />
          )}

          {selected && <CompanyPanel company={selected} onClose={closePanel} />}

          <Reveal />
        </div>
      </SelectCompanyContext.Provider>
    </ThemeContext.Provider>
  );
}
