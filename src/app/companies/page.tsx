import type { Metadata } from "next"
import { Suspense } from "react"
import { CompaniesContent } from "./_content"
import { siteMeta } from "@/lib/site"

export const metadata: Metadata = {
  title: siteMeta.companies.title,
  description: siteMeta.companies.description,
}

export default function CompaniesPage() {
  return (
    <Suspense>
      <CompaniesContent />
    </Suspense>
  )
}
