"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cities, companies, type Company } from "@/data/companies"
import { CompanyLogo } from "@/components/CompanyLogo"
import { MapCanvas } from "@/components/MapCanvas"
import { DirectoryCard } from "@/components/DirectoryCard"
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Close,
  GridIcon,
  ListIcon,
  MapIcon,
  Pin,
  Search,
  Sliders,
} from "@/components/icons"
import { useSearchShortcut } from "@/lib/hooks"
import { useSelectCompany } from "@/components/Shell"
import { useThemeContext } from "@/components/theme"
import { cityFromParam, getLastCity, setLastCity } from "@/lib/city"
import { plural } from "@/lib/utils"

type View = "map" | "list"

function countIn(list: Company[], area: string) {
  return list.filter((company) => company.area === area).length
}

export function MapContent() {
  const searchParams = useSearchParams()
  const { theme } = useThemeContext()
  const onSelect = useSelectCompany()
  const [cityId, setCityId] = useState(
    () =>
      cityFromParam(searchParams.get("city")) ?? getLastCity() ?? "bengaluru",
  )
  const city = cities.find((item) => item.id === cityId) ?? cities[0]
  const allCityCompanies = useMemo(
    () => companies.filter((company) => company.city === city.id),
    [city.id],
  )
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [area, setArea] = useState("All areas")
  const [category, setCategory] = useState("All industries")
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [view, setView] = useState<View>("map")
  const searchRef = useRef<HTMLInputElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)
  const filtersButton = useRef<HTMLButtonElement>(null)
  useSearchShortcut(() => searchRef.current?.focus())

  useEffect(() => {
    setSearch("")
    setArea("All areas")
    setFiltersOpen(false)
  }, [cityId])

  useEffect(() => {
    setLastCity(cityId)
    const next = `/map?city=${cityId}`
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(null, "", next)
    }
    document.title = `Explore ${city.name} — Startup Arena India`
  }, [cityId, city.name])

  useEffect(() => {
    if (!filtersOpen) return
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        filtersRef.current?.contains(target) ||
        filtersButton.current?.contains(target)
      ) {
        return
      }
      setFiltersOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false)
    }
    document.addEventListener("mousedown", onPointerDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onPointerDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [filtersOpen])

  const industries = useMemo(
    () => [
      "All industries",
      ...Array.from(new Set(allCityCompanies.map((c) => c.category))).sort(),
    ],
    [allCityCompanies],
  )

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    return allCityCompanies.filter((company) => {
      const haystack =
        `${company.name} ${company.area ?? ""} ${company.category}`.toLowerCase()
      return (
        (!term || haystack.includes(term)) &&
        (area === "All areas" || company.area === area) &&
        (category === "All industries" || company.category === category)
      )
    })
  }, [allCityCompanies, deferredSearch, area, category])

  const hasFilters = area !== "All areas" || category !== "All industries"
  const filterCount =
    Number(area !== "All areas") + Number(category !== "All industries")

  const clearFilters = () => {
    setArea("All areas")
    setCategory("All industries")
  }

  const clearEverything = () => {
    clearFilters()
    setSearch("")
  }

  const chooseCity = (id: string) => setCityId(id)

  return (
    <div className={`explorer view-${view}`}>
      <aside
        className="explorer-sidebar"
        aria-label="Company filters and results"
      >
        <div className="explorer-top">
          <div className="explorer-intro">
            <p className="kicker">
              <Pin size={12} /> India, city by city
            </p>
            <h1>
              Explore <span>{city.name}</span>
            </h1>
            <p>
              {plural(allCityCompanies.length, "company", "companies")} across{" "}
              {plural(city.areas.length, "neighbourhood")}.
            </p>
          </div>

          <div className="explorer-controls">
            <label className="select-field city-field">
              <span className="sr-only">City</span>
              <MapIcon size={15} />
              <select
                value={city.id}
                onChange={(event) => chooseCity(event.target.value)}
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
              <span className="sr-only">
                Search companies or neighbourhoods
              </span>
              <Search size={16} />
              <input
                ref={searchRef}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search companies or areas"
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

            <div className="filter-line">
              <label className="select-field">
                <span className="sr-only">Neighbourhood</span>
                <select
                  value={area}
                  onChange={(event) => setArea(event.target.value)}
                >
                  <option>All areas</option>
                  {city.areas.map((item) => (
                    <option key={item} value={item}>
                      {item} ({countIn(allCityCompanies, item)})
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} />
              </label>
              <button
                ref={filtersButton}
                type="button"
                className={`button button-secondary filter-button${
                  filtersOpen || hasFilters ? " is-active" : ""
                }`}
                onClick={() => setFiltersOpen((open) => !open)}
                aria-expanded={filtersOpen}
                aria-controls="map-filters"
              >
                <Sliders size={15} />
                Filters
                {filterCount > 0 && (
                  <span className="filter-count">{filterCount}</span>
                )}
              </button>
            </div>

            {filtersOpen && (
              <div className="filter-panel" id="map-filters" ref={filtersRef}>
                <div className="filter-panel-head">
                  <strong>Refine the list</strong>
                  {(hasFilters || search) && (
                    <button
                      type="button"
                      className="text-button"
                      onClick={clearEverything}
                    >
                      Clear all
                    </button>
                  )}
                </div>
                <div className="filter-group">
                  <span className="filter-label">Industry</span>
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
                </div>
                <button
                  type="button"
                  className="button button-primary filter-done"
                  onClick={() => setFiltersOpen(false)}
                >
                  <Check size={15} /> Show results
                </button>
              </div>
            )}

            {(hasFilters || search) && (
              <div className="active-filters" aria-label="Active filters">
                {search && (
                  <button type="button" onClick={() => setSearch("")}>
                    &ldquo;{search}&rdquo; <Close size={12} />
                  </button>
                )}
                {area !== "All areas" && (
                  <button type="button" onClick={() => setArea("All areas")}>
                    {area} <Close size={12} />
                  </button>
                )}
                {category !== "All industries" && (
                  <button
                    type="button"
                    onClick={() => setCategory("All industries")}
                  >
                    {category} <Close size={12} />
                  </button>
                )}
                <button
                  type="button"
                  className="active-filters-clear"
                  onClick={clearEverything}
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="results-label">
          <span aria-live="polite">
            {filtered.length === allCityCompanies.length
              ? `${plural(filtered.length, "company", "companies")} to explore`
              : `${filtered.length} of ${allCityCompanies.length} companies`}
          </span>
          <div className="view-toggle" role="group" aria-label="Change view">
            <button
              type="button"
              className={view === "map" ? "is-active" : ""}
              aria-pressed={view === "map"}
              aria-label="Map view"
              title="Map view"
              onClick={() => setView("map")}
            >
              <MapIcon size={15} />
            </button>
            <button
              type="button"
              className={view === "list" ? "is-active" : ""}
              aria-pressed={view === "list"}
              aria-label="List view"
              title="List view"
              onClick={() => setView("list")}
            >
              <ListIcon size={16} />
            </button>
          </div>
        </div>

        <div className="explorer-results">
          {filtered.map((company) => (
            <button
              type="button"
              key={company.id}
              className="result-row"
              onClick={() => onSelect(company)}
              aria-label={`View ${company.name}, ${company.area}, ${company.category}`}
            >
              <CompanyLogo company={company} />
              <span className="result-copy">
                <strong>{company.name}</strong>
                {company.area && (
                  <span className="result-place">
                    <Pin size={11} /> {company.area}
                  </span>
                )}
                <small>{company.category}</small>
              </span>
              <ArrowRight size={16} className="result-arrow" />
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={24} />
              <h2>No companies match that</h2>
              <p>Try a different search or clear your filters.</p>
              <button
                type="button"
                className="text-link"
                onClick={clearEverything}
              >
                Clear search and filters <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>

        <div className="explorer-disclaimer">
          Verified company directory. Office locations are approximate. Visit
          official careers pages for current openings.
        </div>
      </aside>

      <div className="explorer-map">
        {view === "map" ? (
          <>
            <MapCanvas
              city={city}
              companies={filtered}
              dark={theme === "dark"}
              onSelect={onSelect}
            />
            <div className="map-hint">
              <GridIcon size={13} /> Select a pin to meet the company
            </div>
          </>
        ) : (
          <div className="expanded-list">
            <div className="expanded-list-head">
              <div>
                <p className="kicker">The people building what&rsquo;s next</p>
                <h2>
                  {filtered.length
                    ? `${plural(filtered.length, "company", "companies")} in ${city.name}.`
                    : "Meet the companies."}
                </h2>
              </div>
              <Link href={`/companies?city=${city.id}`} className="text-link">
                Open directory <ArrowUpRight size={15} />
              </Link>
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
                <p>Clear a filter or try a different neighbourhood.</p>
                <button
                  type="button"
                  className="text-link"
                  onClick={clearEverything}
                >
                  Clear search and filters <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
