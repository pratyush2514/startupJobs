import { roles, rolesFetchedAt, type Role } from "../data/roles"
import { companies, type Company } from "../data/companies"

/** Raw role list — the single read path for role data.
///
/// Every component reads roles through this module, never `../roles`
/// directly, so a future move (e.g. Supabase) only rewrites this file. */
export { roles, rolesFetchedAt, type Role }

const byCompany = new Map<string, Role[]>()
for (const role of roles) {
  const list = byCompany.get(role.companyId)
  if (list) list.push(role)
  else byCompany.set(role.companyId, [role])
}

const companyById = new Map<string, Company>(companies.map((c) => [c.id, c]))

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

/** "Nov 3, 2026, 10:51 AM" style exact label; null when unusable. */
export function postedExact(iso: string | null): string | null {
  if (!iso) return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

let descriptionsPromise: Promise<Record<string, string>> | null = null

/** Lazily loads the descriptions chunk (kept out of the main bundle for
 *  bad networks); resolves null when the role has no fetched description. */
export function loadRoleDescription(id: string): Promise<string | null> {
  if (!descriptionsPromise) {
    descriptionsPromise = import("../data/roleDescriptions")
      .then((mod) => mod.roleDescriptions as Record<string, string>)
      .catch(() => ({}))
  }
  return descriptionsPromise.then((map) => map[id] ?? null)
}

/** Short meta line for a role row: team · level, skipping blanks. */
export function roleMeta(role: Role): string | null {
  const parts = [role.team, role.level].filter(Boolean) as string[]
  return parts.length ? parts.join(" · ") : null
}
