import type { Metadata } from "next"
import { Suspense } from "react"
import { MapContent } from "./_content"
import { siteMeta } from "@/lib/site"

export const metadata: Metadata = {
  title: siteMeta.map.title,
  description: siteMeta.map.description,
}

export default function MapPage() {
  return (
    <Suspense>
      <MapContent />
    </Suspense>
  )
}
