/**
 * Per-route metadata. Consumed by each route's page.tsx via Next.js's
 * metadata API (replaces the old document.title effect).
 */
export const siteMeta = {
  home: {
    title: "Startup Arena India — Explore India's startups on one map",
    description:
      "Explore startup companies across eight Indian cities. Find a team by neighbourhood, then go straight to its official careers page.",
  },
  map: {
    title: "Explore the map — Startup Arena India",
    description:
      "A map-first directory of startup companies across Bengaluru, Delhi NCR, Mumbai, Hyderabad, Pune, Chennai, Ahmedabad and Kolkata.",
  },
  cities: {
    title: "Startup cities across India — Startup Arena",
    description:
      "Browse eight Indian startup hubs and the neighbourhoods where teams are building.",
  },
  companies: {
    title: "Startup companies across India — Startup Arena",
    description:
      "Meet the companies shaping India's startup ecosystem. Filter by city, neighbourhood and industry.",
  },
  jobs: {
    title: "Jobs at India's startups — Startup Arena",
    description:
      "Open roles live on each company's official careers page — we link you straight there.",
  },
  pricing: {
    title: "Access and pricing — Startup Arena",
    description:
      "Startup Arena is free to explore. No account, no card, no paywall.",
  },
  about: {
    title: "How Startup Arena works",
    description:
      "A different way to find what's next: opportunity, mapped by neighbourhood and city.",
  },
  faq: {
    title: "Frequently asked questions — Startup Arena",
    description:
      "Straight answers about Startup Arena's map, verified directory and careers links.",
  },
} as const;

export type SitePage = keyof typeof siteMeta;
