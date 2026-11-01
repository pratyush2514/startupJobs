import { useEffect, useRef } from "react"
import { cities } from "../data"
import type { Role } from "../roles"
import { CompanyLogo } from "./CompanyLogo"
import { Close, ExternalLink, Info, Pin } from "./icons"
import { useBodyLock } from "../lib/hooks"
import { companyForRole, postedAgo, roleMeta } from "../lib/roles"

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return "Official website"
  }
}

export function RoleDialog({
  role,
  onClose,
}: {
  role: Role
  onClose: () => void
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  const company = companyForRole(role)
  const city = cities.find((item) => item.id === role.city)
  const meta = roleMeta(role)
  const ago = postedAgo(role.postedAt)
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
      aria-labelledby="role-dialog-title"
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
          {company && <CompanyLogo company={company} size="lg" />}
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close role details"
            autoFocus
          >
            <Close size={20} />
          </button>
        </div>

        <h2 id="role-dialog-title">{role.title}</h2>
        <p className="company-dialog-place">
          {company?.name}
          {city ? ` · ${city.name}` : ""}
        </p>
        <div className="role-facts">
          {meta && (
            <div>
              <span>Team</span>
              <strong>{meta}</strong>
            </div>
          )}
          {role.location && (
            <div>
              <span>Location</span>
              <strong>
                <Pin size={12} /> {role.location}
              </strong>
            </div>
          )}
          {role.workMode === "remote" && (
            <div>
              <span>Work mode</span>
              <strong>Remote</strong>
            </div>
          )}
          {ago && (
            <div>
              <span>Posted</span>
              <strong>{ago}</strong>
            </div>
          )}
        </div>

        <div className="company-note">
          <Info size={15} />
          <p>
            This role comes from {company?.name ?? "the company"}&rsquo;s own
            job board. You&rsquo;ll apply on their site — we never take
            applications.
          </p>
        </div>

        <a
          className="button button-primary company-dialog-cta"
          href={role.applyUrl}
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>
            Apply on {company?.name ?? "their site"}
            <small>{hostname(role.applyUrl)}</small>
          </span>
          <ExternalLink size={17} />
        </a>
        <p className="company-dialog-foot">
          Opens the original posting in a new tab.
        </p>
      </div>
    </dialog>
  )
}
