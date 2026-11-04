import type { Metadata } from "next"
import Link from "next/link"
import { MapIcon, ArrowUpRight } from "@/components/icons"

export const metadata: Metadata = {
  title: "Page not on the atlas — Startup Arena",
}

export default function NotFound() {
  return (
    <section className="off-map container">
      <span className="off-map-mark">
        <MapIcon size={30} />
      </span>
      <p className="kicker">A little off the map</p>
      <h1>This page isn&rsquo;t on our atlas.</h1>
      <p>
        Let&rsquo;s get you back to somewhere familiar — the map is a good place
        to start.
      </p>
      <div className="intro-actions">
        <Link href="/" className="button button-primary">
          Back to home <ArrowUpRight size={15} />
        </Link>
        <Link href="/map" className="button button-secondary">
          Open the map
        </Link>
      </div>
    </section>
  )
}
