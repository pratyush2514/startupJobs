import Link from "next/link";
import { cities, companies } from "../data/companies";
import { plural } from "../lib/utils";
import { CitySkyline } from "./CitySkyline";
import { ArrowRight, ArrowUpRight, Pin } from "./icons";

const codes: Record<string, string> = {
  bengaluru: "BLR",
  delhi: "DEL",
  mumbai: "BOM",
  hyderabad: "HYD",
  pune: "PNQ",
  chennai: "MAA",
  ahmedabad: "AMD",
  kolkata: "CCU",
};

export function CitySection({ full = false }: { full?: boolean }) {
  const visible = full ? cities : cities.slice(0, 4);
  return (
    <section
      className={`section cities-section container${full ? " is-full" : ""}`}
    >
      {!full && (
        <div className="section-heading" data-reveal>
          <div>
            <p className="kicker">A country of pin codes</p>
            <h2>Where do you want to go?</h2>
            <p className="section-sub">
              Same ambition. A different backdrop. Start with a city.
            </p>
          </div>
          <Link href="/cities" className="text-link">
            Explore all cities <ArrowRight size={15} />
          </Link>
        </div>
      )}
      <div className={`city-grid${full ? " is-full" : ""}`}>
        {visible.map((city, index) => {
          const count = companies.filter(
            (company) => company.city === city.id,
          ).length;
          return (
            <Link
              href={`/map?city=${city.id}`}
              className="city-card"
              key={city.id}
              data-reveal
            >
              <div className="city-card-top">
                <span className="city-code">{codes[city.id]}</span>
                {index === 0 && (
                  <span className="city-tag">Startup capital</span>
                )}
                <ArrowUpRight size={17} className="city-card-arrow" />
              </div>
              <div className="city-art">
                <CitySkyline variant={index} />
              </div>
              <h3>{city.name}</h3>
              <p>{city.tagline}</p>
              {full && (
                <div className="city-areas">
                  {city.areas.map((area) => (
                    <span key={area}>{area}</span>
                  ))}
                </div>
              )}
              <div className="city-card-foot">
                <span>
                  <Pin size={12} />
                  {plural(count, "company", "companies")}
                </span>
                <ArrowRight size={14} />
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
