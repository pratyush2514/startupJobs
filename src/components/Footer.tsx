import { Brand } from "./Brand"
import { ArrowUpRight } from "./icons"

const columns = [
  {
    title: "Explore",
    links: [
      { href: "#/map", label: "The map" },
      { href: "#/cities", label: "Cities" },
      { href: "#/companies", label: "Companies" },
      { href: "#/jobs", label: "Career paths" },
    ],
  },
  {
    title: "Understand",
    links: [
      { href: "#/about", label: "How it works" },
      { href: "#/pricing", label: "Access & pricing" },
      { href: "#/faq", label: "Questions" },
    ],
  },
]

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-main">
        <div className="footer-brand">
          <Brand small />
          <p>Find your place in what’s next.</p>
          <span className="footer-made">
            Made for the next generation of India.
          </span>
        </div>
        {columns.map((column) => (
          <nav
            className="footer-column"
            key={column.title}
            aria-label={column.title}
          >
            <h2>{column.title}</h2>
            {column.links.map((link) => (
              <a href={link.href} key={link.href}>
                {link.label}
              </a>
            ))}
          </nav>
        ))}
        <div className="footer-note">
          <h2>The fine print</h2>
          <p>
            An independent concept inspired by BLR Startup Arena. The directory
            is curated sample data, locations are approximate, and career paths
            are illustrative — not live vacancies.
          </p>
          <a href="#/faq" className="text-link">
            Read the details <ArrowUpRight size={14} />
          </a>
        </div>
      </div>
      <div className="container footer-base">
        <span>
          © {new Date().getFullYear()} Startup Arena · Independent concept
        </span>
        <span>Curated sample data · Office locations approximate</span>
        <button
          type="button"
          className="footer-top-link"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
                .matches
                ? "auto"
                : "smooth",
            })
          }
        >
          Back to top
        </button>
      </div>
    </footer>
  )
}
