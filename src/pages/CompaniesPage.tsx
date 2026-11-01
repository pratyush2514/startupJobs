import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { cities, companies } from "../data"
import { PageIntro } from "../components/PageIntro"
import { DirectoryCard } from "../components/DirectoryCard"
import {
  ArrowRight,
  ArrowUpRight,
  ChevronDown,
  Close,
  MapIcon,
  Search,
} from "../components/icons"
import { cityFromParam, getLastCity, setLastCity } from "../lib/city"
import { useReveal, useSearchShortcut } from "../lib/hooks"
import { plural } from "../lib/utils"

export default function CompaniesPage({
  initialCity,
  onSelect,
}: {
  initialCity: string | null
  onSelect: (company: Parameters<typeof DirectoryCard>[0]["company"]) => void
}) {
  const [cityId, setCityId] = useState(
    () => cityFromParam(initialCity) ?? getLastCity() ?? "bengaluru",
  )
  const city = cities.find((item) => item.id === cityId) ?? cities[0]
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [category, setCategory] = useState("All industries")
  const searchRef = useRef<HTMLInputElement>(null)
  useReveal(`companies-${cityId}`)
  useSearchShortcut(() => searchRef.current?.focus())

  useEffect(() => {
    setLastCity(cityId)
    const next = `#/companies?city=${cityId}`
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next)
    }
    document.title = `Companies in ${city.name} — Startup Arena`
  }, [cityId, city.name])

  const cityCompanies = useMemo(
    () => companies.filter((company) => company.city === city.id),
    [city.id],
  )

  const industries = useMemo(
    () => [
      "All industries",
      ...Array.from(new Set(cityCompanies.map((c) => c.category))).sort(),
    ],
    [cityCompanies],
  )

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    return cityCompanies.filter((company) => {
      const haystack =
        `${company.name} ${company.area ?? ""} ${company.category}`.toLowerCase()
      return (
        (!term || haystack.includes(term)) &&
        (category === "All industries" || company.category === category)
      )
    })
  }, [cityCompanies, deferredSearch, category])

  const clearAll = () => {
    setSearch("")
    setCategory("All industries")
  }

  return (
    <div className="inner-page directory-page">
      <PageIntro
        kicker="The teams building tomorrow"
        title={
          <>
            Good companies. Great <span className="accent">possibilities.</span>
          </>
        }
        lede="Get to know the verified companies shaping India’s startup ecosystem — by city, by neighbourhood, by the work they do. Open roles live on each company’s own careers page."
      />

      <section className="directory-body container">
        <div className="directory-toolbar" data-reveal>
          <label className="select-field city-field">
            <span className="sr-only">City</span>
            <MapIcon size={15} />
            <select
              value={city.id}
              onChange={(event) => setCityId(event.target.value)}
            >
              {cities.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>
          <label className="search-field">
            <span className="sr-only">Search companies</span>
            <Search size={16} />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a company or neighbourhood"
              type="search"
              autoComplete="off"
              spellCheck={false}
            />
            {search ? (
              <button
                type="button"
                className="search-clear"
                onClick={() => {
                  setSearch("")
                  searchRef.current?.focus()
                }}
                aria-label="Clear search"
              >
                <Close size={14} />
              </button>
            ) : (
              <kbd aria-hidden="true">/</kbd>
            )}
          </label>
          <a href={`#/map?city=${city.id}`} className="button button-secondary">
            <MapIcon size={15} /> View on map
          </a>
        </div>

        <div className="directory-filters" data-reveal>
          <div className="filter-chips">
            {industries.map((item) => (
              <button
                type="button"
                key={item}
                className={category === item ? "is-active" : ""}
                aria-pressed={category === item}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <p className="directory-summary" aria-live="polite">
            {plural(filtered.length, "company", "companies")} in {city.name}
            {(category !== "All industries" || search) && (
              <button type="button" className="text-button" onClick={clearAll}>
                Clear
              </button>
            )}
          </p>
        </div>

        {filtered.length > 0 ? (
          <div className="directory-grid">
            {filtered.map((company) => (
              <DirectoryCard
                key={company.id}
                company={company}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state is-wide">
            <Search size={26} />
            <h2>No companies match that</h2>
            <p>
              Try another spelling, a different neighbourhood, or clear the
              filters.
            </p>
            <button type="button" className="text-link" onClick={clearAll}>
              Clear search and filters <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div className="directory-footer-note">
          <p>
            Verified company directory. Office locations are approximate
            localities — open roles live on each company&rsquo;s official
            careers page.
          </p>
          <a href={`#/map?city=${city.id}`} className="text-link">
            See {city.name} on the map <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
    </div>
  )
}
