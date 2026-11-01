import { type Company } from "../data"
import { CompanyLogo } from "./CompanyLogo"
import { ArrowRight, ArrowUpRight, Briefcase, Pin } from "./icons"

export function DirectoryCard({
  company,
  onSelect,
  careers = false,
}: {
  company: Company
  onSelect: (company: Company) => void
  careers?: boolean
}) {
  return (
    <article className="directory-card">
      <button
        type="button"
        className="directory-card-action"
        onClick={() => onSelect(company)}
        aria-label={`View ${company.name}, ${company.area}${
          careers ? `, ${company.category}` : ""
        }`}
      >
        <span className="directory-card-top">
          <CompanyLogo company={company} size="lg" />
          <span className="directory-card-open" aria-hidden="true">
            <ArrowUpRight size={17} />
          </span>
        </span>
        <span className="directory-card-title">{company.name}</span>
        <span className="directory-card-meta">
          <Pin size={12} /> {company.area}
        </span>
        <span className="directory-tags">
          <span>{company.category}</span>
          {company.fresher && <span>Early career</span>}
        </span>
        {careers && (
          <span className="career-note">
            <Briefcase size={13} /> Three example career paths
          </span>
        )}
        <span className="directory-card-foot">
          Explore the company <ArrowRight size={14} />
        </span>
      </button>
    </article>
  )
}
