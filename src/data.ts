export type City = {
  id: string
  name: string
  state: string
  tagline: string
  lat: number
  lng: number
  areas: string[]
}
export const cities: City[] = [
  {
    id: "bengaluru",
    name: "Bengaluru",
    state: "Karnataka",
    tagline: "India’s startup capital",
    lat: 12.9716,
    lng: 77.5946,
    areas: ["Koramangala", "Indiranagar", "HSR Layout", "Whitefield"],
  },
  {
    id: "delhi",
    name: "Delhi NCR",
    state: "Delhi · Gurugram · Noida",
    tagline: "Big ideas. Bigger possibilities.",
    lat: 28.4595,
    lng: 77.0266,
    areas: ["Cyber City", "Sector 44", "Udyog Vihar", "Golf Course Road"],
  },
  {
    id: "mumbai",
    name: "Mumbai",
    state: "Maharashtra",
    tagline: "Where ambition finds its home",
    lat: 19.076,
    lng: 72.8777,
    areas: ["Andheri", "Bandra Kurla Complex", "Powai", "Lower Parel"],
  },
  {
    id: "hyderabad",
    name: "Hyderabad",
    state: "Telangana",
    tagline: "The next big thing is here",
    lat: 17.4474,
    lng: 78.3762,
    areas: ["HITEC City", "Gachibowli", "Madhapur", "Kondapur"],
  },
  {
    id: "pune",
    name: "Pune",
    state: "Maharashtra",
    tagline: "A fresh perspective on tech",
    lat: 18.552,
    lng: 73.825,
    areas: ["Baner", "Hinjawadi", "Kharadi", "Viman Nagar"],
  },
  {
    id: "chennai",
    name: "Chennai",
    state: "Tamil Nadu",
    tagline: "Built with a different kind of drive",
    lat: 12.9916,
    lng: 80.225,
    areas: ["Guindy", "Perungudi", "Taramani", "Sholinganallur"],
  },
  {
    id: "ahmedabad",
    name: "Ahmedabad",
    state: "Gujarat",
    tagline: "Entrepreneurship in its DNA",
    lat: 23.041,
    lng: 72.515,
    areas: ["SG Highway", "Prahlad Nagar", "Navrangpura", "Thaltej"],
  },
  {
    id: "kolkata",
    name: "Kolkata",
    state: "West Bengal",
    tagline: "New ideas in a timeless city",
    lat: 22.574,
    lng: 88.433,
    areas: ["Salt Lake", "New Town", "Sector V", "Park Street"],
  },
]
type Seed = [string, string, string, string]
const seeds: Record<string, Seed[]> = {
  bengaluru: [
    ["Razorpay", "razorpay", "#2878ef", "https://razorpay.com/jobs/"],
    ["Swiggy", "swiggy", "#fc8019", "https://careers.swiggy.com/"],
    ["PhonePe", "phonepe", "#6739b7", "https://www.phonepe.com/careers/"],
    ["Zerodha", "zerodha", "#387ed1", "https://careers.zerodha.com/"],
    ["Meesho", "meesho", "#df2c91", "https://www.meesho.io/jobs"],
    ["Groww", "groww", "#00ae87", "https://groww.in/careers"],
    ["CRED", "cred", "#252525", "https://careers.cred.club/"],
    ["Zepto", "zepto", "#8624d8", "https://www.zepto.com/careers"],
    ["InMobi", "inmobi", "#e83044", "https://www.inmobi.com/company/careers"],
    [
      "Freshworks",
      "freshworks",
      "#16ad93",
      "https://www.freshworks.com/company/careers/",
    ],
    ["Flipkart", "flipkart", "#e6ac00", "https://www.flipkartcareers.com/"],
    [
      "Postman",
      "postman",
      "#ff6c37",
      "https://www.postman.com/company/careers/",
    ],
  ],
  delhi: [
    ["Zomato", "zomato", "#e23744", "https://www.zomato.com/careers"],
    ["OYO", "oyo", "#ed3237", "https://www.oyorooms.com/careers/"],
    [
      "Policybazaar",
      "policybazaar",
      "#1769cd",
      "https://www.policybazaar.com/careers/",
    ],
    [
      "Urban Company",
      "urban-company",
      "#333333",
      "https://careers.urbancompany.com/",
    ],
    ["Delhivery", "delhivery", "#e4212e", "https://www.delhivery.com/careers"],
    ["ixigo", "ixigo", "#f47c20", "https://www.ixigo.com/careers"],
  ],
  mumbai: [
    ["Dream11", "dream11", "#c72127", "https://www.dreamsports.group/careers/"],
    ["Upstox", "upstox", "#6338be", "https://upstox.com/careers/"],
    ["Nykaa", "nykaa", "#fc2779", "https://www.nykaa.com/careers"],
    [
      "BookMyShow",
      "bookmyshow",
      "#e62d43",
      "https://in.bookmyshow.com/careers/",
    ],
    [
      "BrowserStack",
      "browserstack",
      "#f49b24",
      "https://www.browserstack.com/careers",
    ],
    ["Zepto", "zepto", "#8624d8", "https://www.zepto.com/careers"],
  ],
  hyderabad: [
    ["Darwinbox", "darwinbox", "#355bdc", "https://darwinbox.com/careers"],
    [
      "HighRadius",
      "highradius",
      "#ed7522",
      "https://www.highradius.com/careers/",
    ],
    [
      "Skyroot Aerospace",
      "skyroot-aerospace",
      "#234b80",
      "https://skyroot.in/career.html",
    ],
    ["Keka", "keka", "#5e72e4", "https://www.keka.com/careers"],
    ["Zenoti", "zenoti", "#00a9a0", "https://www.zenoti.com/careers"],
    ["Zaggle", "zaggle", "#e53c42", "https://www.zaggle.in/careers"],
  ],
  pune: [
    ["Druva", "druva", "#297ac6", "https://www.druva.com/about/careers"],
    [
      "Mindtickle",
      "mindtickle",
      "#e2496c",
      "https://www.mindtickle.com/careers/",
    ],
    ["FirstCry", "firstcry", "#ef8425", "https://www.firstcry.com/career"],
    [
      "ElasticRun",
      "elasticrun",
      "#2075bf",
      "https://www.elasticrun.in/careers.html",
    ],
    [
      "Icertis",
      "icertis",
      "#6d499d",
      "https://www.icertis.com/company/careers/",
    ],
    ["PubMatic", "pubmatic", "#198dc1", "https://pubmatic.com/careers/"],
  ],
  chennai: [
    ["Zoho", "zoho", "#dd3836", "https://www.zoho.com/careers/"],
    [
      "Freshworks",
      "freshworks",
      "#16ad93",
      "https://www.freshworks.com/company/careers/",
    ],
    ["Chargebee", "chargebee", "#f36c3d", "https://www.chargebee.com/careers/"],
    [
      "Rocketlane",
      "rocketlane",
      "#664bc7",
      "https://www.rocketlane.com/careers",
    ],
    ["Kissflow", "kissflow", "#df4f87", "https://kissflow.com/careers/"],
    ["GUVI", "guvi", "#16a363", "https://www.guvi.in/career/"],
  ],
  ahmedabad: [
    [
      "Adani Digital",
      "adani-digital",
      "#3368a3",
      "https://www.adani.com/careers",
    ],
    ["Simform", "simform", "#e3435a", "https://www.simform.com/careers/"],
    ["Tatvic", "tatvic", "#f68a21", "https://www.tatvic.com/careers/"],
    ["Crest Data", "crest-data", "#3798bb", "https://www.crestdata.ai/careers"],
    [
      "Bacancy",
      "bacancy",
      "#e75d24",
      "https://www.bacancytechnology.com/career",
    ],
    ["Solvative", "solvative", "#db4a43", "https://solvative.com/careers/"],
  ],
  kolkata: [
    ["mPokket", "mpokket", "#147bbe", "https://www.mpokket.in/careers"],
    ["Wow! Momo", "wow-momo", "#dc2731", "https://www.wowmomo.com/"],
    ["Teabox", "teabox", "#254a3d", "https://www.teabox.com/"],
    ["Kredent", "kredent", "#29518a", "https://www.kredent.com/"],
    ["Vehere", "vehere", "#6952a0", "https://vehere.com/careers/"],
    ["iMerit", "imerit", "#cf3737", "https://imerit.net/careers/"],
  ],
}
export type Company = {
  id: string
  name: string
  slug: string
  color: string
  url: string
  city: string
  area: string
  lat: number
  lng: number
  category: string
  fresher: boolean
}
const offsets = [
  [-0.025, 0.037],
  [-0.035, 0.012],
  [-0.055, 0.043],
  [0.014, 0.045],
  [-0.045, 0.075],
  [0.029, 0.013],
  [-0.009, -0.017],
  [0.008, 0.085],
  [0.049, 0.033],
  [-0.017, 0.108],
  [0.038, -0.035],
  [-0.066, 0.017],
]
export const companies: Company[] = cities.flatMap((city) =>
  seeds[city.id].map(([name, slug, color, url], i) => ({
    id: `${city.id}-${slug}`,
    name,
    slug,
    color,
    url,
    city: city.id,
    area: city.areas[i % city.areas.length],
    lat: city.lat + offsets[i][0],
    lng: city.lng + offsets[i][1],
    category: ["Fintech", "Consumer tech", "SaaS", "Technology"][i % 4],
    fresher: i % 3 === 0,
  })),
)
export const careerPaths = [
  {
    name: "Software Engineer",
    team: "Engineering",
    hint: "Build the product people use every day.",
  },
  {
    name: "Product Designer",
    team: "Design",
    hint: "Shape how the next idea meets the world.",
  },
  {
    name: "Product Manager",
    team: "Product",
    hint: "Turn a clear problem into a team’s next move.",
  },
] as const

export const faqs = [
  [
    "What is Startup Arena?",
    "A map-first way to discover startup companies across India. Explore eight city hubs, find companies by neighbourhood, and go directly to their own careers pages.",
  ],
  [
    "Are these live job listings?",
    "This is a frontend preview built on a curated sample dataset. Company locations are approximate and career paths are illustrative, not live vacancies. Always check the company’s official careers page for current roles.",
  ],
  [
    "Do I need an account to explore?",
    "No. The map, company directory, filters and official careers links are free to explore without an account.",
  ],
  [
    "Which cities can I explore?",
    "Bengaluru, Delhi NCR, Mumbai, Hyderabad, Pune, Chennai, Ahmedabad and Kolkata. Choose a city to see its own map and company directory.",
  ],
  [
    "How do I apply for a role?",
    "Select a company pin or directory card, then choose “Visit careers page”. You’ll apply directly through the company’s official website; we don’t collect applications.",
  ],
] as const

export const logoUrl = (slug: string) =>
  `https://ofsdvxzoowdbmcwiwmqw.supabase.co/storage/v1/object/public/company-logos/${slug}.png`
