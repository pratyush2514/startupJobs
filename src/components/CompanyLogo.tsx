import { useState } from "react"
import { type Company, logoUrl } from "../data"
import { initials, readableOn } from "../lib/utils"

type Size = "sm" | "md" | "lg"

export function CompanyLogo({
  company,
  size = "md",
  className = "",
}: {
  company: Company
  size?: Size
  className?: string
}) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

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
      {!failed && (
        <img
          src={logoUrl(company.slug)}
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
  )
}
