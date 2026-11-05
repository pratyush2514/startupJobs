"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { Brand } from "@/components/Brand";
import { CompanyLogo } from "@/components/CompanyLogo";
import { DirectoryCard } from "@/components/DirectoryCard";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Close,
  GridIcon,
  ListIcon,
  MapIcon,
  Moon,
  Pin,
  Search,
  Sliders,
  Sun,
} from "@/components/icons";
import { MapCanvas } from "@/components/MapCanvas";
import { Select } from "@/components/Select";
import { useSelectCompany } from "@/components/Shell";
import { useThemeContext } from "@/components/theme";
import { type Company, cities, companies } from "@/data/companies";
import { cityFromParam, getLastCity, setLastCity } from "@/lib/city";
import { useSearchShortcut } from "@/lib/hooks";
import { plural } from "@/lib/utils";

type View = "map" | "list";

function countIn(list: Company[], area: string) {
  return list.filter((company) => company.area === area).length;
}

export function MapContent() {
  const searchParams = useSearchParams();
  const { theme, toggle } = useThemeContext();
  const onSelect = useSelectCompany();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cityId, setCityId] = useState(
    () =>
      cityFromParam(searchParams.get("city")) ?? getLastCity() ?? "bengaluru",
  );
  const city = cities.find((item) => item.id === cityId) ?? cities[0];
  const allCityCompanies = useMemo(
    () => companies.filter((company) => company.city === city.id),
    [city.id],
  );
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [area, setArea] = useState("All areas");
  const [category, setCategory] = useState("All industries");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<View>("map");
  const searchRef = useRef<HTMLInputElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const filtersButton = useRef<HTMLButtonElement>(null);
  useSearchShortcut(() => searchRef.current?.focus());

  // biome-ignore lint/correctness/useExhaustiveDependencies: cityId is the intentional reset trigger.
  useEffect(() => {
    setSearch("");
    setArea("All areas");
    setFiltersOpen(false);
  }, [cityId]);

  useEffect(() => {
    setLastCity(cityId);
    // Keep the rest of the query (a ?company= deep link) intact; drop it
    // only when the linked company doesn't belong to the new city.
    const params = new URLSearchParams(window.location.search);
    params.set("city", cityId);
    const linkedId = params.get("company");
    if (linkedId) {
      const linked = companies.find((item) => item.id === linkedId);
      if (!linked || linked.city !== cityId) params.delete("company");
    }
    const next = `/map?${params.toString()}`;
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(null, "", next);
    }
    document.title = `Explore ${city.name} — Startup Arena India`;
  }, [cityId, city.name]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        filtersRef.current?.contains(target) ||
        filtersButton.current?.contains(target)
      ) {
        return;
      }
      setFiltersOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [filtersOpen]);

  const industries = useMemo(
    () => [
      "All industries",
      ...Array.from(new Set(allCityCompanies.map((c) => c.category))).sort(),
    ],
    [allCityCompanies],
  );

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    return allCityCompanies.filter((company) => {
      const haystack =
        `${company.name} ${company.area ?? ""} ${company.category}`.toLowerCase();
      return (
        (!term || haystack.includes(term)) &&
        (area === "All areas" || company.area === area) &&
        (category === "All industries" || company.category === category)
      );
    });
  }, [allCityCompanies, deferredSearch, area, category]);

  const hasFilters = area !== "All areas" || category !== "All industries";
  const filterCount =
    Number(area !== "All areas") + Number(category !== "All industries");

  const clearFilters = () => {
    setArea("All areas");
    setCategory("All industries");
  };

  const clearEverything = () => {
    clearFilters();
    setSearch("");
  };

  const cityOptions = useMemo(
    () =>
      cities.map((item) => ({
        value: item.id,
        label: item.name,
        hint: `${companies.filter((company) => company.city === item.id).length}`,
      })),
    [],
  );

  const areaOptions = useMemo(
    () => [
      {
        value: "All areas",
        label: "All areas",
        hint: `${allCityCompanies.length}`,
      },
      ...city.areas.map((item) => ({
        value: item,
        label: item,
        hint: `${countIn(allCityCompanies, item)}`,
      })),
    ],
    [allCityCompanies, city.areas],
  );

  // Picking a company on the map keeps the URL in sync, so the open panel
  // survives a refresh and the link stays shareable.
  const selectOnMap = (company: Company) => {
    onSelect(company);
    const params = new URLSearchParams(window.location.search);
    params.set("company", company.id);
    window.history.replaceState(null, "", `/map?${params.toString()}`);
  };

  const chooseCity = (id: string) => setCityId(id);

  return (
    <div
      className={`explorer view-${view}${sidebarOpen ? "" : " sidebar-collapsed"}`}
      suppressHydrationWarning
    >
      {/* City is client-only state (URL query / localStorage); the static prerender uses the default. Suppress the expected mismatch — the client value wins. */}
      <aside
        className="explorer-sidebar"
        aria-label="Company filters and results"
      >
        <div className="explorer-brand">
          <Brand small />
          <button
            type="button"
            className="icon-button theme-button"
            onClick={toggle}
            aria-label={
              theme === "dark"
                ? "Switch to light theme"
                : "Switch to dark theme"
            }
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>

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
            <Select
              value={city.id}
              options={cityOptions}
              onChange={chooseCity}
              label="City"
              icon={<MapIcon size={15} />}
              className="city-field"
            />

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
                    setSearch("");
                    searchRef.current?.focus();
                  }}
                  aria-label="Clear search"
                >
                  <Close size={14} />
                </button>
              ) : (
                <>
                  {/* biome-ignore lint/a11y/noAriaHiddenOnFocusable: decorative shortcut glyph; the accessible name comes from the sr-only label. */}
                  <kbd aria-hidden="true">/</kbd>
                </>
              )}
            </label>

            <div className="filter-line">
              <Select
                value={area}
                options={areaOptions}
                onChange={setArea}
                label="Neighbourhood"
                className="area-field"
              />
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
              <div
                className="active-filters"
                role="group"
                aria-label="Active filters"
              >
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
              onClick={() => selectOnMap(company)}
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

      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setSidebarOpen((open) => !open)}
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
      >
        <ChevronRight size={16} className="sidebar-toggle-icon" />
      </button>

      <div className="explorer-map">
        {view === "map" ? (
          <>
            <MapCanvas
              city={city}
              companies={filtered}
              dark={theme === "dark"}
              onSelect={selectOnMap}
              sidebarOpen={sidebarOpen}
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
                    onSelect={selectOnMap}
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
  );
}
