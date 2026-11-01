import { useEffect, useRef } from "react"
import { careerPaths, cities, type Company } from "../data"
import { CompanyLogo } from "./CompanyLogo"
import {
  ArrowUpRight,
  Close,
  Code,
  Compass,
  ExternalLink,
  Info,
  Pen,
  Pin,
} from "./icons"
import { useBodyLock } from "../lib/hooks"

const pathIcons = [Code, Pen, Compass]

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

        <p className="kicker">A closer look</p>
        <h2 id="company-dialog-title">{company.name}</h2>
        <p className="company-dialog-place">
          <Pin size={14} /> {company.area}, {city.name}
        </p>
        <div className="company-dialog-tags">
          <span>{company.category}</span>
          {company.fresher && <span>Early-career friendly</span>}
          <span>Sample profile</span>
        </div>

        <div className="company-note">
          <Info size={15} />
          <p>
            This is a curated showcase, not a live vacancy. Office locations are
            approximate. Check the company’s own site for current roles and
            eligibility.
          </p>
        </div>

        <h3 className="company-dialog-subhead">Career paths to explore</h3>
        <div className="career-paths">
          {careerPaths.map((path, index) => {
            const Icon = pathIcons[index]
            return (
              <div className="career-path" key={path.name}>
                <span className="career-path-icon">
                  <Icon size={16} />
                </span>
                <span>
                  <strong>{path.name}</strong>
                  <small>{path.hint}</small>
                </span>
                <span className="career-path-team">{path.team}</span>
              </div>
            )
          })}
        </div>

        <a
          className="button button-primary company-dialog-cta"
          href={company.url}
          target="_blank"
          rel="noreferrer noopener"
        >
          <span>
            Visit careers page
            <small>{hostname(company.url)}</small>
          </span>
          <ExternalLink size={17} />
        </a>
        <p className="company-dialog-foot">
          Opens the company’s official website in a new tab.
          <a href="#/companies" onClick={onClose}>
            Browse more companies <ArrowUpRight size={13} />
          </a>
        </p>
      </div>
    </dialog>
  )
}
