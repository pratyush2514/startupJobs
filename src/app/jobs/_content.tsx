"use client"

import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { cities } from "@/data/companies"
import { PageIntro } from "@/components/PageIntro"
import { CompanyLogo } from "@/components/CompanyLogo"
import { RoleDialog } from "@/components/RoleDialog"
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  ChevronDown,
  Close,
  MapIcon,
  Search,
} from "@/components/icons"
import { cityFromParam, getLastCity, setLastCity } from "@/lib/city"
import { useSearchShortcut } from "@/lib/hooks"
import {
  companyForRole,
  postedAgo,
  roleMeta,
  roles,
  rolesFetchedAt,
  type Role,
} from "@/lib/roles"
import { plural } from "@/lib/utils"

function fetchedLabel(): string {
  const d = new Date(rolesFetchedAt)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export function JobsContent() {
  const searchParams = useSearchParams()
  const [cityId, setCityId] = useState(() => {
    const fromParam = cityFromParam(searchParams.get("city"))
    if (fromParam) return fromParam
    const last = getLastCity()
    return last ?? "all"
  })
  const [search, setSearch] = useState("")
  const deferredSearch = useDeferredValue(search)
  const [team, setTeam] = useState("All teams")
  const [selected, setSelected] = useState<Role | null>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  useSearchShortcut(() => searchRef.current?.focus())

  useEffect(() => {
    if (cityId !== "all") setLastCity(cityId)
    const next = cityId === "all" ? "/jobs" : `/jobs?city=${cityId}`
    if (window.location.pathname + window.location.search !== next) {
      window.history.replaceState(null, "", next)
    }
    document.title = "Open roles at India\u2019s startups \u2014 Startup Arena"
  }, [cityId])

  const cityRoles = useMemo(
    () => (cityId === "all" ? roles : roles.filter((r) => r.city === cityId)),
    [cityId],
  )

  const teams = useMemo(
    () =>
      [
        "All teams",
        ...Array.from(
          new Set(cityRoles.map((r) => r.team).filter((t) => t != null)),
        ).sort(),
      ] as string[],
    [cityRoles],
  )

  const filtered = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase()
    return cityRoles.filter((role) => {
      const company = companyForRole(role)
      const haystack =
        `${role.title} ${role.team ?? ""} ${role.location ?? ""} ${company?.name ?? ""}`.toLowerCase()
      return (
        (!term || haystack.includes(term)) &&
        (team === "All teams" || role.team === team)
      )
    })
  }, [cityRoles, deferredSearch, team])

  const clearAll = () => {
    setSearch("")
    setTeam("All teams")
  }

  return (
    <div className="inner-page jobs-page">
      <PageIntro
        kicker="Open roles"
        title={
          <>
            {roles.length} open roles,{" "}
            <span className="accent">straight from the source.</span>
          </>
        }
        lede={`Every role below comes from that company's own job board — checked ${fetchedLabel()}. You apply on their site; we never take applications.`}
      />

      <section className="directory-body container">
        <div className="directory-toolbar" data-reveal>
          <label className="select-field city-field">
            <span className="sr-only">City</span>
            <MapIcon size={15} />
            <select
              value={cityId}
              onChange={(event) => setCityId(event.target.value)}
            >
              <option value="all">All cities</option>
              {cities.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} />
          </label>
          <label className="search-field">
            <span className="sr-only">Search roles</span>
            <Search size={16} />
            <input
              ref={searchRef}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a role, team or company"
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
        </div>

        {teams.length > 2 && (
          <div className="directory-filters" data-reveal>
            <div className="filter-chips">
              {teams.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={team === item ? "is-active" : ""}
                  aria-pressed={team === item}
                  onClick={() => setTeam(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        )}

        <p className="directory-summary" aria-live="polite" data-reveal>
          {plural(filtered.length, "role", "roles")}
          {cityId !== "all" &&
            ` in ${cities.find((c) => c.id === cityId)?.name ?? ""}`}
          {(team !== "All teams" || search) && (
            <button type="button" className="text-button" onClick={clearAll}>
              Clear
            </button>
          )}
        </p>

        {filtered.length > 0 ? (
          <ul className="job-list" data-reveal>
            {filtered.map((role) => {
              const company = companyForRole(role)
              const meta = roleMeta(role)
              const ago = postedAgo(role.postedAt)
              return (
                <li key={role.id}>
                  <button
                    type="button"
                    className="job-row"
                    onClick={() => setSelected(role)}
                  >
                    {company && <CompanyLogo company={company} size="sm" />}
                    <span className="job-row-main">
                      <strong>{role.title}</strong>
                      <small>
                        {company?.name}
                        {meta ? ` · ${meta}` : ""}
                      </small>
                      <small className="job-row-loc">
                        {role.location}
                        {ago ? ` · ${ago}` : ""}
                        {role.workMode === "remote" ? " · Remote" : ""}
                      </small>
                    </span>
                    <ArrowRight size={16} className="job-row-arrow" />
                  </button>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="empty-state is-wide">
            <Briefcase size={26} />
            <h2>No roles match that</h2>
            <p>
              Try another keyword, a different team, or clear the filters. Roles
              are refreshed from company job boards — more companies coming
              soon.
            </p>
            <button type="button" className="text-link" onClick={clearAll}>
              Clear search and filters <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div className="directory-footer-note">
          <p>
            Roles update when companies update their own boards. Spot something
            wrong? Open roles always live on the company&rsquo;s site — we link
            you straight there.
          </p>
          <Link href="/companies" className="text-link">
            Browse all companies <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      {selected && (
        <RoleDialog role={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}
