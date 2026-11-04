"use client"

/**
 * Right-side panel (bottom sheet on mobile) for the selected map company.
 * The map stays visible and interactive behind it — unlike the old modal,
 * the user never loses their place. A role opens its rich detail in the
 * same panel with a back affordance.
 */

// A new company always opens on its overview, never on a stale role.

import { useEffect, useRef, useState } from "react"
import { cities, type Company } from "../data/companies"
import { CompanyLogo } from "./CompanyLogo"
import { ArrowUpRight, Close, ExternalLink, Info, Pin } from "./icons"
import { postedAgo, roleMeta, rolesForCompany, type Role } from "../lib/roles"
import { RoleDetail } from "./RoleDetail"
import Link from "next/link"

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Official website"
  }
}
export function CompanyPanel({
  company,
  onClose,
}: {
  company: Company
  onClose: () => void
}) {
  const [activeRole, setActiveRole] = useState<Role | null>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const closeButton = useRef<HTMLButtonElement>(null)
  const city =
    cities.find(
      (item) =>
        item.id ===
        company.city,
    ) ??
    cities[0]
  const companyRoles = rolesForCompany(company.id)
  useEffect(() => {
    setActiveRole(null)
  }, [company.id])

  useEffect(() => {
    closeButton.current?.focus({ preventScroll: true })
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  return (
    <aside
      className="company-panel"
      role="dialog"
      aria-modal="false"
      aria-labelledby="company-panel-title"
    >
      <div className="company-panel-scroll">
        <button
          ref={closeButton}
          type="button"
          className="icon-button company-panel-close"
          onClick={onClose}
          aria-label="Close company details"
        >
          <Close size={20} />
        </button>

        {activeRole ? (
          <RoleDetail role={activeRole} onBack={() => setActiveRole(null)} />
        ) : (
          <div className="company-panel-body">
            <div className="company-dialog-head">
              <CompanyLogo company={company} size="lg" />
            </div>

            <h2 id="company-panel-title">{company.name}</h2>
            <p className="company-dialog-place">
              <Pin size={14} /> {company.area ? `${company.area}, ` : ""}
              {city.name}
            </p>
            <div className="company-dialog-tags">
              <span>{company.category}</span>
              {companyRoles.length > 0 && (
                <span className="tag-accent">
                  {companyRoles.length} open role
                  {companyRoles.length === 1 ? "" : "s"}
                </span>
              )}
            </div>

            {companyRoles.length > 0 ? (
              <div className="company-roles">
                <h3 className="company-dialog-subhead">
                  Open roles{" "}
                  <small>from {company.name}&rsquo;s own job board</small>
                </h3>
                <ul>
                  {companyRoles.map((role) => {
                    const meta = roleMeta(role)
                    const ago = postedAgo(role.postedAt)
                    return (
                      <li key={role.id}>
                        <button
                          type="button"
                          className="role-row"
                          onClick={() => setActiveRole(role)}
                        >
                          <span className="role-row-main">
                            <strong>{role.title}</strong>
                            {(meta || ago) && (
                              <small>
                                {meta}
                                {meta && ago ? " · " : ""}
                                {ago}
                              </small>
                            )}
                          </span>
                          <ArrowUpRight size={15} className="role-row-arrow" />
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </div>
            ) : (
              <div className="company-note">
                <Info size={15} />
                <p>
                  Verified company profile. The pin marks the office locality,
                  not the exact building. Open roles live on {company.name}
                  &rsquo;s official careers page — we link you straight there
                  and never take applications.
                </p>
              </div>
            )}

            <a
              className="button button-primary company-dialog-cta"
              href={company.url}
              target="_blank"
              rel="noreferrer noopener"
            >
              <span>
                See open roles
                <small>{hostname(company.url)}</small>
              </span>
              <ExternalLink size={17} />
            </a>
            <p className="company-dialog-foot">
              Opens the company&rsquo;s official careers page in a new tab.
              <Link href="/companies" onClick={onClose}>
                Browse more companies <ArrowUpRight size={13} />
              </Link>
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}
