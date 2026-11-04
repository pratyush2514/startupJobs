// "use client"

// import { useMemo, useState } from "react"
// import Link from "next/link"
// import dynamic from "next/dynamic";
// import { cities, companies } from "@/data/companies"
// import { CompanyLogo } from "@/components/CompanyLogo"
// // import { MapCanvas } from "@/components/MapCanvas"
// import { CitySection } from "@/components/CitySection"
// import { HowItWorks } from "@/components/HowItWorks"
// import { Pricing } from "@/components/Pricing"
// import { LazySection } from "@/components/LazySection"
// import { useSelectCompany } from "@/components/Shell"
// import { useThemeContext } from "@/components/theme"
// import { ArrowRight, ArrowUpRight, Compass, Pin } from "@/components/icons"
// import { getLastCity, setLastCity } from "@/lib/city"
// import { plural } from "@/lib/utils"

// export function HomeContent() {
//   const { theme } = useThemeContext()
//   const onSelect = useSelectCompany()
//   const [cityId, setCityId] = useState(() => getLastCity() ?? "bengaluru")
//   const city = cities.find((item) => item.id === cityId) ?? cities[0]
//   const cityCompanies = useMemo(
//     () => companies.filter((company) => company.city === city.id),
//     [city.id],
//   )
//   const featured = cityCompanies.slice(0, 9)
//   const neighbourhoods = useMemo(
//     () =>
//       new Set(companies.map((company) => company.area).filter((a) => a != null))
//         .size,
//     [],
//   )

//   const chooseCity = (id: string) => {
//     setCityId(id)
//     setLastCity(id)
//   }

//   return (
//     <div className="home-page">
//       <section className="hero container">
//         <h1 data-reveal>
//           Explore India&rsquo;s startups,
//           <br />
//           <span>on one map.</span>
//         </h1>
//         <p className="hero-lede" data-reveal>
//           Find a team by neighbourhood, then go straight to its own careers
//           page.
//         </p>
//         <div className="hero-actions" data-reveal>
//           <Link href="/map" className="button button-primary">
//             Open the map <ArrowUpRight size={15} />
//           </Link>
//           <Link href="/companies" className="button button-dark">
//             Browse companies
//           </Link>
//         </div>
//       </section>

//       <section className="atlas container" aria-label="Map preview" data-reveal>
//         <div className="city-switcher" role="group" aria-label="Choose a city">
//           {cities.map((item) => (
//             <button
//               key={item.id}
//               type="button"
//               className={item.id === city.id ? "is-active" : ""}
//               aria-pressed={item.id === city.id}
//               onClick={() => chooseCity(item.id)}
//             >
//               {item.name}
//             </button>
//           ))}
//         </div>

//         <div className="preview-map">
//           <Link
//             href={`/map?city=${city.id}`}
//             className="map-open-pill"
//             aria-label={`Open the full map of ${city.name}`}
//           >
//             Open the full map <ArrowUpRight size={13} />
//           </Link>
//           <MapCanvas
//             city={city}
//             companies={cityCompanies}
//             dark={theme === "dark"}
//             onSelect={onSelect}
//             preview
//           />
//         </div>

//         <p className="atlas-foot">
//           <Pin size={12} /> Office locations are approximate
//           <span className="dot" aria-hidden="true">
//             ·
//           </span>
//           <span>Verified company directory</span>
//         </p>
//       </section>

//       <section className="stats container" aria-label="At a glance" data-reveal>
//         <div className="stat">
//           <strong>{companies.length}</strong>
//           <span>companies to discover</span>
//         </div>
//         <div className="stat">
//           <strong>{cities.length}</strong>
//           <span>startup cities</span>
//         </div>
//         <div className="stat">
//           <strong>{neighbourhoods}</strong>
//           <span>neighbourhoods mapped</span>
//         </div>
//       </section>

//       <LazySection label="Loading cities" minHeight={420}>
//         <CitySection />
//       </LazySection>

//       <LazySection label="Loading how it works" minHeight={380}>
//         <HowItWorks />
//       </LazySection>

//       <LazySection label="Loading companies" minHeight={420}>
//         <section className="section companies-feature container">
//           <div className="section-heading" data-reveal>
//             <div>
//               <p className="kicker">Great teams, real possibilities</p>
//               <h2>Your next team could be here.</h2>
//               <p className="section-sub">
//                 A first look at the teams building in {city.name}.
//               </p>
//             </div>
//             <Link href={`/companies?city=${city.id}`} className="text-link">
//               All {plural(cityCompanies.length, "company", "companies")}{" "}
//               <ArrowRight size={14} />
//             </Link>
//           </div>
//           <div className="company-grid" key={city.id}>
//             {featured.map((company) => (
//               <button
//                 key={company.id}
//                 type="button"
//                 className="company-row"
//                 onClick={() => onSelect(company)}
//                 data-reveal
//               >
//                 <CompanyLogo company={company} />
//                 <span className="company-row-copy">
//                   <strong>{company.name}</strong>
//                   <small>
//                     {company.category}, {city.name}
//                   </small>
//                 </span>
//                 <ArrowUpRight size={15} className="company-row-arrow" />
//               </button>
//             ))}
//           </div>
//           <p className="section-footnote">
//             A curated showcase. Visit each company&rsquo;s careers page for the
//             latest openings.
//           </p>
//         </section>
//       </LazySection>

//       <LazySection label="Loading pricing" minHeight={380}>
//         <Pricing />
//       </LazySection>

//       <section className="bottom-cta container" data-reveal>
//         <span className="cta-mark" aria-hidden="true">
//           <Compass size={22} />
//         </span>
//         <div className="bottom-cta-copy">
//           <p className="kicker">Your next chapter starts somewhere</p>
//           <h2>Let&rsquo;s find your somewhere.</h2>
//           <p>A new team, a new city, or something closer to home.</p>
//         </div>
//         <Link href="/map" className="button button-primary">
//           Take a look around <ArrowUpRight size={15} />
//         </Link>
//       </section>
//     </div>
//   )
// }


"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { cities, companies } from "@/data/companies";
import { CompanyLogo } from "@/components/CompanyLogo";

// 1. REMOVE the old static import:
// import { MapCanvas } from "@/components/MapCanvas"

// 2. ADD the dynamic import with SSR disabled:
const MapCanvas = dynamic(
  () => import("@/components/MapCanvas").then((mod) => mod.MapCanvas),
  {
    ssr: false,
    loading: () => <div className="preview-map-loading">Loading Map...</div>,
  },
);

import { CitySection } from "@/components/CitySection";
import { HowItWorks } from "@/components/HowItWorks";
import { Pricing } from "@/components/Pricing";
import { LazySection } from "@/components/LazySection";
import { useSelectCompany } from "@/components/Shell";
import { useThemeContext } from "@/components/theme";
import { ArrowRight, ArrowUpRight, Compass, Pin } from "@/components/icons";
import { getLastCity, setLastCity } from "@/lib/city";
import { plural } from "@/lib/utils";

export function HomeContent() {
  const { theme } = useThemeContext();
  const onSelect = useSelectCompany();
  const [cityId, setCityId] = useState(() => getLastCity() ?? "bengaluru");
  const city = cities.find((item) => item.id === cityId) ?? cities[0];
  const cityCompanies = useMemo(
    () => companies.filter((company) => company.city === city.id),
    [city.id],
  );
  const featured = cityCompanies.slice(0, 9);
  const neighbourhoods = useMemo(
    () =>
      new Set(companies.map((company) => company.area).filter((a) => a != null))
        .size,
    [],
  );

  const chooseCity = (id: string) => {
    setCityId(id);
    setLastCity(id);
  };

  return (
    <div className="home-page">
      {/* ... keeping the hero section identical ... */}
      <section className="hero container">
        <h1 data-reveal>
          Explore India&rsquo;s startups,
          <br />
          <span>on one map.</span>
        </h1>
        <p className="hero-lede" data-reveal>
          Find a team by neighbourhood, then go straight to its own careers
          page.
        </p>
        <div className="hero-actions" data-reveal>
          <Link href="/map" className="button button-primary">
            Open the map <ArrowUpRight size={15} />
          </Link>
          <Link href="/companies" className="button button-dark">
            Browse companies
          </Link>
        </div>
      </section>

      <section className="atlas container" aria-label="Map preview" data-reveal>
        <div className="city-switcher" role="group" aria-label="Choose a city">
          {cities.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === city.id ? "is-active" : ""}
              aria-pressed={item.id === city.id}
              onClick={() => chooseCity(item.id)}
            >
              {item.name}
            </button>
          ))}
        </div>

        <div className="preview-map">
          <Link
            href={`/map?city=${city.id}`}
            className="map-open-pill"
            aria-label={`Open the full map of ${city.name}`}
          >
            Open the full map <ArrowUpRight size={13} />
          </Link>
          {/* 3. The dynamically loaded MapCanvas element remains exactly the same here */}
          <MapCanvas
            city={city}
            companies={cityCompanies}
            dark={theme === "dark"}
            onSelect={onSelect}
            preview
          />
        </div>

        <p className="atlas-foot">
          <Pin size={12} /> Office locations are approximate
          <span className="dot" aria-hidden="true">
            ·
          </span>
          <span>Verified company directory</span>
        </p>
      </section>

      {/* ... rest of the code remains exactly unchanged ... */}
      <section className="stats container" aria-label="At a glance" data-reveal>
        <div className="stat">
          <strong>{companies.length}</strong>
          <span>companies to discover</span>
        </div>
        <div className="stat">
          <strong>{cities.length}</strong>
          <span>startup cities</span>
        </div>
        <div className="stat">
          <strong>{neighbourhoods}</strong>
          <span>neighbourhoods mapped</span>
        </div>
      </section>

      <LazySection label="Loading cities" minHeight={420}>
        <CitySection />
      </LazySection>

      <LazySection label="Loading how it works" minHeight={380}>
        <HowItWorks />
      </LazySection>

      <LazySection label="Loading companies" minHeight={420}>
        <section className="section companies-feature container">
          <div className="section-heading" data-reveal>
            <div>
              <p className="kicker">Great teams, real possibilities</p>
              <h2>Your next team could be here.</h2>
              <p className="section-sub">
                A first look at the teams building in {city.name}.
              </p>
            </div>
            <Link href={`/companies?city=${city.id}`} className="text-link">
              All {plural(cityCompanies.length, "company", "companies")}{" "}
              <ArrowRight size={14} />
            </Link>
          </div>
          <div className="company-grid" key={city.id}>
            {featured.map((company) => (
              <button
                key={company.id}
                type="button"
                className="company-row"
                onClick={() => onSelect(company)}
                data-reveal
              >
                <CompanyLogo company={company} />
                <span className="company-row-copy">
                  <strong>{company.name}</strong>
                  <small>
                    {company.category}, {city.name}
                  </small>
                </span>
                <ArrowUpRight size={15} className="company-row-arrow" />
              </button>
            ))}
          </div>
          <p className="section-footnote">
            A curated showcase. Visit each company&rsquo;s careers page for the
            latest openings.
          </p>
        </section>
      </LazySection>

      <LazySection label="Loading pricing" minHeight={380}>
        <Pricing />
      </LazySection>

      <section className="bottom-cta container" data-reveal>
        <span className="cta-mark" aria-hidden="true">
          <Compass size={22} />
        </span>
        <div className="bottom-cta-copy">
          <p className="kicker">Your next chapter starts somewhere</p>
          <h2>Let&rsquo;s find your somewhere.</h2>
          <p>A new team, a new city, or something closer to home.</p>
        </div>
        <Link href="/map" className="button button-primary">
          Take a look around <ArrowUpRight size={15} />
        </Link>
      </section>
    </div>
  );
}
