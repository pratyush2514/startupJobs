"use client";

/**
 * The rich role body: fact grid, description, apply action.
 * Rendered inside the company side-panel (with back) and the Jobs-page
 * modal — the shell differs, the content is one place.
 */

import { type ReactNode, useEffect, useState } from "react";
import { cities } from "../data/companies";
import {
  companyForRole,
  loadRoleDescription,
  postedAgo,
  postedExact,
  type Role,
} from "../lib/roles";
import { CompanyLogo } from "./CompanyLogo";
import { ArrowLeft, ExternalLink, Info, Pin } from "./icons";

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Official website";
  }
}

function workModeLabel(mode: Role["workMode"]): string | null {
  if (mode === "remote") return "Remote";
  if (mode === "hybrid") return "Hybrid";
  if (mode === "onsite") return "On-site";
  return null;
}
export function RoleDetail({
  role,
  onBack,
}: {
  role: Role;
  onBack?: () => void;
}) {
  const company = companyForRole(role);
  const city = cities.find((item) => item.id === role.city);
  const ago = postedAgo(role.postedAt);
  const exact = postedExact(role.postedAt);
  const mode = workModeLabel(role.workMode);

  const [description, setDescription] = useState<string | null>(null);
  const [descReady, setDescReady] = useState(false);

  useEffect(() => {
    let live = true;
    setDescription(null);
    setDescReady(false);
    loadRoleDescription(role.id).then((text) => {
      if (!live) return;
      setDescription(text);
      setDescReady(true);
    });
    return () => {
      live = false;
    };
  }, [role.id]);

  const facts: { label: string; value: ReactNode }[] = [];
  if (role.team) facts.push({ label: "Team", value: role.team });
  if (role.level) facts.push({ label: "Level", value: role.level });
  if (role.location)
    facts.push({
      label: "Location",
      value: (
        <>
          <Pin size={12} /> {role.location}
        </>
      ),
    });
  if (mode) facts.push({ label: "Work mode", value: mode });
  if (exact || ago)
    facts.push({
      label: "Posted",
      value: exact ?? ago,
    });

  return (
    <div className="role-detail">
      {onBack && (
        <button type="button" className="role-detail-back" onClick={onBack}>
          <ArrowLeft size={15} /> All {company?.name ?? "roles"}
        </button>
      )}

      <div className="role-detail-head">
        {company && <CompanyLogo company={company} size="lg" />}
        <p className="company-dialog-place">
          {company?.name}
          {city ? ` · ${city.name}` : ""}
        </p>
      </div>

      <h2 className="role-detail-title">{role.title}</h2>
      {ago && ago !== exact && <p className="role-detail-ago">{ago}</p>}

      {facts.length > 0 && (
        <div className="role-facts">
          {facts.map((fact) => (
            <div key={fact.label}>
              <span>{fact.label}</span>
              <strong>{fact.value}</strong>
            </div>
          ))}
        </div>
      )}

      {!descReady ? (
        <div className="role-description-loading" aria-hidden="true">
          <span className="skeleton-line" />
          <span className="skeleton-line" />
          <span className="skeleton-line is-short" />
        </div>
      ) : description ? (
        <div className="role-description">
          <h3>About the role</h3>
          <p>{description}</p>
        </div>
      ) : null}

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

      <div className="company-note">
        <Info size={15} />
        <p>
          This role comes from {company?.name ?? "the company"}&rsquo;s own job
          board. You&rsquo;ll apply on their site — we never take applications.
        </p>
      </div>
    </div>
  );
}
