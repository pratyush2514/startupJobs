import Link from "next/link";
import { Brand } from "./Brand";
import { ArrowUpRight, MapIcon, Menu, Moon, Sun } from "./icons";

const navigation = [
  { page: "map", href: "/map", label: "Map" },
  { page: "cities", href: "/cities", label: "Cities" },
  { page: "companies", href: "/companies", label: "Companies" },
  { page: "jobs", href: "/jobs", label: "Jobs" },
  { page: "about", href: "/about", label: "How it works" },
  { page: "pricing", href: "/pricing", label: "Pricing" },
];

export function Header({
  page,
  theme,
  scrolled,
  onToggleTheme,
  onOpenMenu,
}: {
  page: string;
  theme: "dark" | "light";
  scrolled: boolean;
  onToggleTheme: () => void;
  onOpenMenu: () => void;
}) {
  const activePage = page;
  return (
    <header className={`site-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="header-inner">
        <Brand />
        <nav className="primary-nav" aria-label="Primary">
          {navigation.map((item) => (
            <Link
              key={item.page}
              href={item.href}
              className={activePage === item.page ? "is-active" : ""}
              aria-current={activePage === item.page ? "page" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          {/* Theme is client-only state (pre-paint script + localStorage); the static prerender is always dark. Suppress the expected mismatch — the client value wins. */}
          <button
            type="button"
            className="icon-button theme-button"
            onClick={onToggleTheme}
            suppressHydrationWarning
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            <span className="theme-icon" key={theme}>
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </span>
          </button>
          <Link href="/map" className="button button-dark header-cta">
            <MapIcon size={16} />
            <span>Open the map</span>
            <ArrowUpRight size={15} />
          </Link>
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
  );
}
