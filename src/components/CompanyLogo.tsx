"use client";

import { useState } from "react";
import { type Company, companyLogo } from "../data/companies";
import { initials, readableOn } from "../lib/utils";

type Size = "sm" | "md" | "lg";

export function CompanyLogo({
  company,
  size = "md",
  className = "",
}: {
  company: Company;
  size?: Size;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = companyLogo(company);

  return (
    <span
      className={`company-logo company-logo-${size} ${className}`.trim()}
      style={
        {
          "--brand": company.color,
          "--brand-ink": readableOn(company.color),
        } as React.CSSProperties
      }
      aria-hidden="true"
    >
      <span className="company-logo-fallback">{initials(company.name)}</span>
      {src && !failed && (
        <img
          src={src}
          alt=""
          width={48}
          height={48}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={loaded ? "is-loaded" : ""}
        />
      )}
    </span>
  );
}
