import { Brand } from "./Brand"
import { ArrowUpRight, MapIcon, Menu, Moon, Sun } from "./icons"
import { preloadPage } from "../lib/preload"

const navigation = [
  { page: "map", href: "#/map", label: "Map" },
  { page: "cities", href: "#/cities", label: "Cities" },
  { page: "companies", href: "#/companies", label: "Companies" },
  { page: "jobs", href: "#/jobs", label: "Jobs" },
  { page: "about", href: "#/about", label: "How it works" },
  { page: "pricing", href: "#/pricing", label: "Pricing" },
]

export function Header({
  page,
  theme,
  scrolled,
  onToggleTheme,
  onOpenMenu,
  slim = false,
}: {
  page: string
  theme: "dark" | "light"
  scrolled: boolean
  onToggleTheme: () => void
  onOpenMenu: () => void
  slim?: boolean
}) {
  const activePage = page
  return (
    <header
      className={`site-header${scrolled ? " is-scrolled" : ""}${
        slim ? " is-slim" : ""
      }`}
    >
      <div className="header-inner">
        <Brand />
        <nav className="primary-nav" aria-label="Primary">
          {navigation.map((item) => (
            <a
              key={item.page}
              href={item.href}
              className={activePage === item.page ? "is-active" : ""}
              aria-current={activePage === item.page ? "page" : undefined}
              onPointerEnter={() => preloadPage(item.page)}
              onFocus={() => preloadPage(item.page)}
            >
              {item.label}
            </a>
          ))}
        </nav>
        <div className="header-actions">
          <button
            type="button"
            className="icon-button theme-button"
            onClick={onToggleTheme}
            aria-label={
              theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
            }
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            <span className="theme-icon" key={theme}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </span>
          </button>
          <a
            href="#/map"
            className="button button-dark header-cta"
            onPointerEnter={() => preloadPage("map")}
            onFocus={() => preloadPage("map")}
          >
            <MapIcon size={16} />
            <span>Open the map</span>
            <ArrowUpRight size={15} />
          </a>
          <button
            type="button"
            className="icon-button menu-button"
            onClick={onOpenMenu}
            aria-label="Open navigation"
            aria-haspopup="dialog"
          >
            <Menu size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
