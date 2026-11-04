import type { Metadata } from "next"
import { HomeContent } from "./_home"
import { siteMeta } from "@/lib/site"

export const metadata: Metadata = {
  title: siteMeta.home.title,
  description: siteMeta.home.description,
}

export default function HomePage() {
  return <HomeContent />
}
