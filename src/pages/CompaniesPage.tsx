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
  Sprout,
} from "../components/icons"
import { cityFromParam, getLastCity, setLastCity } from "../lib/city"
import { useReveal, useSearchShortcut } from "../lib/hooks"
import { plural } from "../lib/utils"

const industries = [
  "All industries",
  "Fintech",
  "Consumer tech",
  "SaaS",
  "Technology",
]

export default function CompaniesPage({
  initialCity,
  careers = false,
  onSelect,
}: {
  initialCity: string | null
  careers?: boolean
  onSelect: (company: Parameters<typeof DirectoryCard>[0]["company"]) => void
}) {
  const [cityId, setCityId] = useState(
    () => cityFromParam(initialCity) ?? getLastCity() ?? "bengaluru",
  )
  const city = cities.find((item) => item.id === cityId) ?? cities[0]
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [category, setCategory] = useState("All industries")
  const [fresher, setFresher] = useState(false)
  const searchRef = useRef<HTMLInputElement>(null)
  useReveal(`companies-${cityId}-${careers}`)
  useSearchShortcut(() => searchRef.current?.focus())

  useEffect(() => {
    setLastCity(cityId)
    const next = `#/${careers ? "jobs" : "companies"}?city=${cityId}`
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next)
    }
    document.title = `${
      careers ? "Career paths" : "Companies"
    } in ${city.name} — Startup Arena`
  }, [cityId, city.name, careers])

  const cityCompanies = useMemo(
    () => companies.filter((company) => company.city === city.id),
    [city.id],
  )

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    return cityCompanies.filter((company) => {
      const haystack = `${company.name} ${company.area} ${company.category}`.toLowerCase()
      return (
        (!term || haystack.includes(term)) &&
        (!fresher || company.fresher) &&
        (category === "All industries" || company.category === category)
      )
    })
  }, [cityCompanies, deferredSearch, fresher, category])

  const clearAll = () => {
    setSearch("")
    setCategory("All industries")
    setFresher(false)
  }

  return (
    <div className="inner-page directory-page">
      <PageIntro
        kicker={
          careers ? "Make your next move" : "The teams building tomorrow"
        }
        title={
          careers ? (
            <>
              Discover your next <span className="accent">direction.</span>
            </>
          ) : (
            <>
              Good companies. Great <span className="accent">possibilities.</span>
            </>
          )
        }
        lede={
          careers
            ? "Explore the kinds of work happening across India’s startup ecosystem, then check current openings on each company’s own site."
            : "Get to know the companies shaping India’s startup ecosystem — by city, by neighbourhood, by the work they do."
        }
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
            <button
              type="button"
              className={`filter-chip-early${fresher ? " is-active" : ""}`}
              aria-pressed={fresher}
              onClick={() => setFresher((value) => !value)}
            >
              <Sprout size={13} /> Early career
            </button>
          </div>
          <p className="directory-summary" aria-live="polite">
            {plural(filtered.length, "company", "companies")} in {city.name}
            {(category !== "All industries" || fresher || search) && (
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
                careers={careers}
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
            Curated sample directory. Office locations are approximate and
            career paths are illustrative, not live vacancies.
          </p>
          <a href={`#/map?city=${city.id}`} className="text-link">
            See {city.name} on the map <ArrowUpRight size={14} />
          </a>
        </div>
      </section>
    </div>
  )
}
