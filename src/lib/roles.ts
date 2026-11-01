import { roles, type Role } from "../roles"
import { companies, type Company } from "../data"

const byCompany = new Map<string, Role[]>()
for (const role of roles) {
  const list = byCompany.get(role.companyId)
  if (list) list.push(role)
  else byCompany.set(role.companyId, [role])
}

const companyById = new Map<string, Company>(
  companies.map((c) => [c.id, c]),
)

/** The company a role belongs to. */
export function companyForRole(role: Role): Company | undefined {
  return companyById.get(role.companyId)
}

/** Real open roles for a company, newest first. Empty when the company
 *  isn't on a public ATS board — the dialog then links the careers page. */
export function rolesForCompany(companyId: string): Role[] {
  return byCompany.get(companyId) ?? []
}

export function roleCountForCompany(companyId: string): number {
  return byCompany.get(companyId)?.length ?? 0
}

export function totalRoles(): number {
  return roles.length
}

export function companiesWithRoles(): number {
  return byCompany.size
}

/** "3 days ago" style relative label; null when the date is unusable. */
export function postedAgo(iso: string | null): string | null {
  if (!iso) return null
  const then = new Date(iso).getTime()
  if (Number.isNaN(then)) return null
  const days = Math.max(0, Math.floor((Date.now() - then) / 86_400_000))
  if (days === 0) return "today"
  if (days === 1) return "yesterday"
  if (days < 7) return `${days} days ago`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`
  }
  const months = Math.floor(days / 30)
  return months === 1 ? "1 month ago" : `${months} months ago`
}

/** Short meta line for a role row: team · level, skipping blanks. */
export function roleMeta(role: Role): string | null {
  const parts = [role.team, role.level].filter(Boolean) as string[]
  return parts.length ? parts.join(" · ") : null
}
