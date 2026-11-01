export const preloadMapView = () => import("../MapView")

export function preloadPage(page: string) {
  switch (page) {
    case "map":
      return import("../pages/MapPage")
    case "cities":
      return import("../pages/CitiesPage")
    case "companies":
    case "jobs":
      return import("../pages/CompaniesPage")
    case "pricing":
      return import("../pages/PricingPage")
    case "about":
      return import("../pages/AboutPage")
    case "faq":
      return import("../pages/FaqPage")
    default:
      return Promise.resolve()
  }
}

export const pageTitles: Record<string, string> = {
  home: "Startup Arena India — Explore India’s startups on one map",
  map: "Explore the map — Startup Arena India",
  cities: "Startup cities across India — Startup Arena",
  companies: "Startup companies across India — Startup Arena",
  jobs: "Jobs at India’s startups — Startup Arena",
  pricing: "Access and pricing — Startup Arena",
  about: "How Startup Arena works",
  faq: "Frequently asked questions — Startup Arena",
}

export const pageDescriptions: Record<string, string> = {
  home: "Explore 54 startup companies across eight Indian cities. Find a team by neighbourhood, then go straight to its official careers page.",
  map: "A map-first directory of startup companies across Bengaluru, Delhi NCR, Mumbai, Hyderabad, Pune, Chennai, Ahmedabad and Kolkata.",
  cities: "Browse eight Indian startup hubs and the neighbourhoods where teams are building.",
  companies: "Meet the companies shaping India’s startup ecosystem. Filter by city, neighbourhood and industry.",
  jobs: "Open roles live on each company’s official careers page — we link you straight there.",
  pricing: "Startup Arena is free to explore. No account, no card, no paywall.",
  about: "A different way to find what’s next: opportunity, mapped by neighbourhood and city.",
  faq: "Straight answers about Startup Arena’s map, verified directory and careers links.",
}
