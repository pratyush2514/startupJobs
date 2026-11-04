import type { Metadata } from "next"
import { Suspense } from "react"
import { JobsContent } from "./_content"
import { siteMeta } from "@/lib/site"

export const metadata: Metadata = {
  title: siteMeta.jobs.title,
  description: siteMeta.jobs.description,
}

export default function JobsPage() {
  return (
    <Suspense>
      <JobsContent />
    </Suspense>
  )
}
