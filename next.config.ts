import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Static export: the roles/company data lives in committed files and is
  // refreshed by the scheduled workflows, which rebuild the site. Every
  // route prerenders to HTML at build time — fast first paint, indexable
  // job listings, zero server cost.
  output: "export",
  images: { unoptimized: true },
}

export default nextConfig
