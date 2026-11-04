import type { Company } from "../data/companies";
import { roleCountForCompany } from "../lib/roles";
import { CompanyLogo } from "./CompanyLogo";
import { ArrowRight, ArrowUpRight, Pin } from "./icons";

export function DirectoryCard({
  company,
  onSelect,
}: {
  company: Company;
  onSelect: (company: Company) => void;
}) {
  const openRoles = roleCountForCompany(company.id);
  return (
    <article className="directory-card">
      <button
        type="button"
        className="directory-card-action"
        onClick={() => onSelect(company)}
        aria-label={`View ${company.name}${
          company.area ? `, ${company.area}` : ""
        }`}
      >
        <span className="directory-card-top">
          <CompanyLogo company={company} size="lg" />
          <span className="directory-card-open" aria-hidden="true">
            <ArrowUpRight size={17} />
          </span>
        </span>
        <span className="directory-card-title">{company.name}</span>
        {company.area && (
          <span className="directory-card-meta">
            <Pin size={12} /> {company.area}
          </span>
        )}
        <span className="directory-tags">
          <span>{company.category}</span>
          {openRoles > 0 && (
            <span className="tag-roles">
              {openRoles} open role{openRoles === 1 ? "" : "s"}
            </span>
          )}
        </span>
        <span className="directory-card-foot">
          Explore the company <ArrowRight size={14} />
        </span>
      </button>
    </article>
  );
}
