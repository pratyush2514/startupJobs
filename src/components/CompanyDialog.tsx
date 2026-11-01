import { useEffect, useRef } from "react"
import { cities, type Company } from "../data"
import { CompanyLogo } from "./CompanyLogo"
import { ArrowUpRight, Close, ExternalLink, Info, Pin } from "./icons"
import { useBodyLock } from "../lib/hooks"
import { postedAgo, roleMeta, rolesForCompany } from "../lib/roles"

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Official website"
  }
}

export function CompanyDialog({
  company,
  onClose,
}: {
  company: Company
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const city = cities.find((item) => item.id === company.city) ?? cities[0]
  const companyRoles = rolesForCompany(company.id)
  useBodyLock(true)

  useEffect(() => {
    const node = dialog.current
    if (!node) return
    if (!node.open) node.showModal()
    return () => {
      if (node.open) node.close()
    }
  }, [])

  return (
    <dialog
      ref={dialog}
      className="company-dialog"
      aria-labelledby="company-dialog-title"
      onCancel={(event) => {
        event.preventDefault()
        closeRef.current()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) closeRef.current()
      }}
    >
      <div className="company-dialog-panel">
        <div className="company-dialog-head">
          <CompanyLogo company={company} size="lg" />
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close company details"
            autoFocus
          >
            <Close size={20} />
          </button>
        </div>

        <h2 id="company-dialog-title">{company.name}</h2>
        <p className="company-dialog-place">
          <Pin size={14} /> {company.area ? `${company.area}, ` : ""}
          {city.name}
        </p>
        <div className="company-dialog-tags">
          <span>{company.category}</span>
          {companyRoles.length > 0 && (
            <span className="tag-accent">
              {companyRoles.length} open role{companyRoles.length === 1 ? "" : "s"}
            </span>
          )}
        </div>

        {companyRoles.length > 0 ? (
          <div className="company-roles">
            <h3 className="company-dialog-subhead">
              Open roles <small>from {company.name}&rsquo;s own job board</small>
            </h3>
            <ul>
              {companyRoles.map((role) => {
                const meta = roleMeta(role)
                const ago = postedAgo(role.postedAt)
                return (
                  <li key={role.id}>
                    <a
                      href={role.applyUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="role-row"
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
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : (
          <div className="company-note">
            <Info size={15} />
            <p>
              Verified company profile. The pin marks the office locality, not
              the exact building. Open roles live on {company.name}&rsquo;s
              official careers page — we link you straight there and never
              take applications.
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
          <a href="#/companies" onClick={onClose}>
            Browse more companies <ArrowUpRight size={13} />
          </a>
        </p>
      </div>
    </dialog>
  )
}
