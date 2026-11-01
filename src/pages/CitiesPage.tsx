import { cities, companies } from "../data"
import { PageIntro } from "../components/PageIntro"
import { CitySection } from "../components/CitySection"
import {
  ArrowUpRight,
  Globe,
  MapIcon,
  Pin,
} from "../components/icons"
import { useReveal } from "../lib/hooks"
import { plural } from "../lib/utils"

export default function CitiesPage() {
  useReveal("cities")
  const neighbourhoods = new Set(companies.map((company) => company.area)).size

  return (
    <div className="inner-page">
      <PageIntro
        kicker="One country, many possibilities"
        title={
          <>
            Find your kind of <span className="accent">city.</span>
          </>
        }
        lede="Your next chapter might be closer than you think. Or a little further afield. Start with a place, then let the map do the rest."
      >
        <div className="intro-actions" data-reveal>
          <a href="#/map" className="button button-primary">
            <MapIcon size={16} /> Open the map <ArrowUpRight size={15} />
          </a>
          <a href="#/companies" className="button button-secondary">
            Browse every company
          </a>
        </div>
        <dl className="intro-facts" data-reveal>
          <div>
            <dt>{cities.length}</dt>
            <dd>startup cities</dd>
          </div>
          <div>
            <dt>{companies.length}</dt>
            <dd>companies</dd>
          </div>
          <div>
            <dt>{neighbourhoods}</dt>
            <dd>neighbourhoods</dd>
          </div>
        </dl>
      </PageIntro>

      <CitySection full />

      <section className="city-note container">
        <span className="city-note-icon" aria-hidden="true">
          <Globe size={24} />
        </span>
        <div>
          <p className="kicker">Local roots, national view</p>
          <h2>Every city has its own energy.</h2>
          <p>
            Explore the companies shaping it, neighbourhood by neighbourhood.
            Each city map is a starting point, not a boundary.
          </p>
        </div>
        <a href="#/map" className="button button-secondary">
          <Pin size={15} /> Start exploring <ArrowUpRight size={15} />
        </a>
      </section>

      <p className="fine-print container">
        {plural(cities.length, "city", "cities")} · Verified company directory ·
        Office locations are approximate
      </p>
    </div>
  )
}
